"""SEO Agent's Claude call (_parse): the HTTP request the SDK sends and how each
kind of response is handled. Uses an httpx MockTransport, so no network."""
import json

import anthropic
import httpx
import pytest
from fastapi import HTTPException

from app.services import seo_agent


@pytest.fixture
def fake_api(monkeypatch):
    """Point the agent's client at a mock transport; tests set state['response']."""
    state = {"requests": [], "response": None}

    def handler(request: httpx.Request) -> httpx.Response:
        state["requests"].append(request)
        status, body = state["response"]
        return httpx.Response(status, json=body, headers={"request-id": "req_test123"})

    client = anthropic.Anthropic(
        api_key="test-key", max_retries=0,
        http_client=anthropic.DefaultHttpxClient(transport=httpx.MockTransport(handler)),
    )
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-key")
    monkeypatch.setattr(seo_agent, "_client", client)
    return state


def _message(text, stop_reason="end_turn"):
    return {
        "id": "msg_1", "type": "message", "role": "assistant", "model": "claude-sonnet-5-5",
        "content": [{"type": "text", "text": text}], "stop_reason": stop_reason, "stop_sequence": None,
        "usage": {"input_tokens": 100, "output_tokens": 50},
    }


SUGGESTIONS = {"topics": [{"keyword": "nadi dosha", "rationale": "Leads to Kundli matching."}]}


def test_request_shape(fake_api):
    fake_api["response"] = (200, _message(json.dumps(SUGGESTIONS)))
    parsed, usage = seo_agent._parse("sys", "user msg", seo_agent.TopicSuggestions, max_tokens=4000)

    assert parsed.topics[0].keyword == "nadi dosha"
    assert usage == {"model": "claude-sonnet-5-5", "input_tokens": 100, "output_tokens": 50, "request_id": "req_test123"}

    req = fake_api["requests"][0]
    assert req.url.path == "/v1/messages"
    betas = req.headers["anthropic-beta"].split(",")
    assert seo_agent.STRUCTURED_OUTPUTS_BETA in betas and seo_agent.FALLBACK_BETA in betas
    body = json.loads(req.content)
    assert body["model"] == seo_agent.DEFAULT_MODEL
    assert body["fallbacks"] == "default"
    assert body["system"] == "sys"
    assert body["output_config"]["effort"] == seo_agent.DEFAULT_EFFORT
    fmt = body["output_config"]["format"]
    assert fmt["type"] == "json_schema" and "topics" in fmt["schema"]["properties"]
    assert "output_format" not in body  # deprecated parameter not used


def test_model_and_effort_come_from_env(fake_api, monkeypatch):
    monkeypatch.setenv("SEO_AGENT_MODEL", "claude-opus-5-5")
    monkeypatch.setenv("SEO_AGENT_EFFORT", "high")
    fake_api["response"] = (200, _message(json.dumps(SUGGESTIONS)))
    seo_agent._parse("sys", "u", seo_agent.TopicSuggestions, max_tokens=100)
    body = json.loads(fake_api["requests"][0].content)
    assert body["model"] == "claude-opus-5-5" and body["output_config"]["effort"] == "high"


def test_refusal_is_422(fake_api):
    fake_api["response"] = (200, _message("", stop_reason="refusal"))
    with pytest.raises(HTTPException) as exc:
        seo_agent._parse("sys", "u", seo_agent.TopicSuggestions, max_tokens=100)
    assert exc.value.status_code == 422


def test_truncated_response_is_502(fake_api):
    fake_api["response"] = (200, _message('{"topics": [', stop_reason="max_tokens"))
    with pytest.raises(HTTPException) as exc:
        seo_agent._parse("sys", "u", seo_agent.TopicSuggestions, max_tokens=100)
    assert exc.value.status_code == 502 and "cut off" in exc.value.detail


def test_schema_mismatch_is_502(fake_api):
    fake_api["response"] = (200, _message('{"unexpected": true}'))
    with pytest.raises(HTTPException) as exc:
        seo_agent._parse("sys", "u", seo_agent.TopicSuggestions, max_tokens=100)
    assert exc.value.status_code == 502 and "unexpected format" in exc.value.detail


def test_billing_error_message_is_shown(fake_api):
    fake_api["response"] = (400, {"type": "error", "error": {
        "type": "invalid_request_error",
        "message": "Your credit balance is too low to access the Anthropic API.",
    }})
    with pytest.raises(HTTPException) as exc:
        seo_agent._parse("sys", "u", seo_agent.TopicSuggestions, max_tokens=100)
    assert exc.value.status_code == 502
    assert "credit balance is too low" in exc.value.detail


def test_auth_error_is_503(fake_api):
    fake_api["response"] = (401, {"type": "error", "error": {"type": "authentication_error", "message": "invalid x-api-key"}})
    with pytest.raises(HTTPException) as exc:
        seo_agent._parse("sys", "u", seo_agent.TopicSuggestions, max_tokens=100)
    assert exc.value.status_code == 503


def test_server_error_says_try_later(fake_api):
    fake_api["response"] = (529, {"type": "error", "error": {"type": "overloaded_error", "message": "Overloaded"}})
    with pytest.raises(HTTPException) as exc:
        seo_agent._parse("sys", "u", seo_agent.TopicSuggestions, max_tokens=100)
    assert exc.value.status_code == 502 and "Try again later" in exc.value.detail
