"""Hindi text-to-speech via Bhashini (Govt of India ULCA pipeline API, free).

Two-step ULCA flow:
  1. POST /model/getModelsPipeline with the TTS task + pipeline id -> resolves
     the actual inference endpoint, service id, and a short-lived auth header.
  2. POST that inference endpoint with the text -> base64-encoded WAV audio.

Credentials (bhashini_user_id, bhashini_api_key, bhashini_pipeline_id) are
DB-backed via settings_service (admin-editable), matching how the other
third-party social credentials (waplex, Facebook, Instagram) are configured
in this app, rather than a bare env var.
"""
import base64

import httpx
from fastapi import HTTPException

from .settings_service import get_setting

PIPELINE_CONFIG_URL = "https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline"

_NOT_CONFIGURED = HTTPException(
    status_code=503,
    detail="Hindi voice generation is unavailable. Bhashini credentials are not configured.",
)
_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Hindi voice generation failed. Please try again.",
)


def _credentials() -> tuple[str, str, str]:
    user_id = get_setting("bhashini_user_id")
    api_key = get_setting("bhashini_api_key")
    pipeline_id = get_setting("bhashini_pipeline_id")
    if not user_id or not api_key or not pipeline_id:
        raise _NOT_CONFIGURED
    return user_id, api_key, pipeline_id


def text_to_speech(text_hi: str) -> bytes:
    """Returns WAV audio bytes for the given Hindi text."""
    user_id, api_key, pipeline_id = _credentials()

    try:
        pipeline_resp = httpx.post(
            PIPELINE_CONFIG_URL,
            json={
                "pipelineTasks": [
                    {"taskType": "tts", "config": {"language": {"sourceLanguage": "hi"}}}
                ],
                "pipelineRequestConfig": {"pipelineId": pipeline_id},
            },
            headers={
                "userID": user_id,
                "ulcaApiKey": api_key,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        print(f"Content Studio TTS: pipeline config request failed: {e}")
        raise _UPSTREAM_ERROR

    if pipeline_resp.status_code != 200:
        print(f"Content Studio TTS: pipeline config error {pipeline_resp.status_code}: {pipeline_resp.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        pipeline_data = pipeline_resp.json()
        service_id = pipeline_data["pipelineResponseConfig"][0]["config"][0]["serviceId"]
        endpoint = pipeline_data["pipelineInferenceAPIEndPoint"]
        callback_url = endpoint["callbackUrl"]
        auth_header_name = endpoint["inferenceApiKey"]["name"]
        auth_header_value = endpoint["inferenceApiKey"]["value"]
    except (KeyError, IndexError, ValueError) as e:
        print(f"Content Studio TTS: unexpected pipeline config shape: {e}")
        raise _UPSTREAM_ERROR

    try:
        tts_resp = httpx.post(
            callback_url,
            json={
                "pipelineTasks": [
                    {
                        "taskType": "tts",
                        "config": {
                            "language": {"sourceLanguage": "hi"},
                            "serviceId": service_id,
                            "gender": "female",
                        },
                    }
                ],
                "inputData": {"input": [{"source": text_hi}]},
            },
            headers={
                auth_header_name: auth_header_value,
                "Content-Type": "application/json",
            },
            timeout=60.0,
        )
    except httpx.HTTPError as e:
        print(f"Content Studio TTS: inference request failed: {e}")
        raise _UPSTREAM_ERROR

    if tts_resp.status_code != 200:
        print(f"Content Studio TTS: inference error {tts_resp.status_code}: {tts_resp.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        audio_b64 = tts_resp.json()["pipelineResponse"][0]["audio"][0]["audioContent"]
        return base64.b64decode(audio_b64)
    except (KeyError, IndexError, ValueError) as e:
        print(f"Content Studio TTS: unexpected inference response shape: {e}")
        raise _UPSTREAM_ERROR
