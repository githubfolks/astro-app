"""SEO Agent API: keyword queue, drafting (Claude mocked), daily cap, publish
gate, GSC import (Search Console mocked) and admin-only access."""
import pytest
from fastapi import HTTPException

from app import models
from app.services import gsc_service, seo_agent, settings_service
from tests.conftest import auth_headers

BODY = " ".join(["Saturn in the seventh house shapes partnership and commitment in the chart."] * 80)
GOOD_HTML = f'<h2>Meaning</h2><p>{BODY}</p><p>Check your <a href="/tools/kundli-chart">free Kundli</a>.</p>'


def _draft(**overrides) -> seo_agent.PostDraft:
    data = dict(
        title="Saturn in the Seventh House",
        slug="saturn-in-seventh-house",
        excerpt="What Saturn in the 7th house means for marriage and partnerships.",
        content_html=GOOD_HTML,
        faqs=[{"question": f"Question {i}?", "answer": f"Answer {i}."} for i in range(4)],
        tags=["Vedic Astrology"],
        secondary_keywords=["saturn 7th house"],
        longtail_keywords=["effects of saturn in 7th house on marriage"],
    )
    data.update(overrides)
    return seo_agent.PostDraft(**data)


USAGE = {"model": "claude-sonnet-5-5", "input_tokens": 1200, "output_tokens": 2400, "request_id": "req_test"}


@pytest.fixture
def admin(make_user):
    return make_user(models.UserRole.ADMIN)


@pytest.fixture
def mock_claude(monkeypatch):
    """Replace the Claude call; tests set .result to the parsed output (or an exception)."""
    state = {"result": _draft(), "calls": 0}

    def fake_parse(system, user, output_format, max_tokens):
        state["calls"] += 1
        if isinstance(state["result"], Exception):
            raise state["result"]
        return state["result"], USAGE

    monkeypatch.setattr(seo_agent, "_parse", fake_parse)
    return state


def _add(client, admin, *keywords):
    resp = client.post("/admin/seo-agent/keywords", headers=auth_headers(admin), json={"keywords": list(keywords)})
    assert resp.status_code == 200, resp.text
    return resp.json()


def _keyword(db_session, text):
    return db_session.query(models.SeoKeyword).filter(models.SeoKeyword.keyword == text).one()


# --- access -------------------------------------------------------------------

def test_endpoints_require_admin(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    assert client.get("/admin/seo-agent/keywords", headers=auth_headers(seeker)).status_code == 403
    assert client.post("/admin/seo-agent/keywords/1/draft", headers=auth_headers(seeker)).status_code == 403
    assert client.get("/admin/seo-agent/keywords").status_code == 401


# --- keyword queue --------------------------------------------------------------

def test_add_keywords_normalizes_and_dedupes(client, admin):
    first = _add(client, admin, "  Manglik Dosha  Remedies ", "manglik dosha remedies", "", "Kundli Milan")
    assert [k["keyword"] for k in first["created"]] == ["manglik dosha remedies", "kundli milan"]
    assert all(k["source"] == "ADMIN" and k["status"] == "NEW" for k in first["created"])

    second = _add(client, admin, "KUNDLI MILAN", "nadi dosha")
    assert second["skipped"] == ["kundli milan"]
    assert [k["keyword"] for k in second["created"]] == ["nadi dosha"]


def test_add_keywords_rejects_empty_list(client, admin):
    resp = client.post("/admin/seo-agent/keywords", headers=auth_headers(admin), json={"keywords": []})
    assert resp.status_code == 422


def test_ignore_and_restore(client, admin):
    kw = _add(client, admin, "lal kitab remedies")["created"][0]
    resp = client.post(f"/admin/seo-agent/keywords/{kw['id']}/ignore", headers=auth_headers(admin))
    assert resp.json()["status"] == "IGNORED"
    assert client.post(f"/admin/seo-agent/keywords/{kw['id']}/ignore", headers=auth_headers(admin)).status_code == 409
    resp = client.post(f"/admin/seo-agent/keywords/{kw['id']}/restore", headers=auth_headers(admin))
    assert resp.json()["status"] == "NEW"


# --- drafting -----------------------------------------------------------------

def test_draft_creates_unpublished_post(client, admin, mock_claude, db_session):
    kw = _add(client, admin, "saturn in 7th house")["created"][0]
    resp = client.post(f"/admin/seo-agent/keywords/{kw['id']}/draft", headers=auth_headers(admin))
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["quality"]["passed"] is True, body["quality"]

    post = db_session.query(models.Post).filter(models.Post.id == body["post_id"]).one()
    assert post.status == models.PostStatus.DRAFT
    assert post.generated_by == "seo_agent"
    assert post.published_at is None
    assert post.agent_meta["keyword"] == "saturn in 7th house"
    assert post.agent_meta["output_tokens"] == 2400
    assert post.tags == ["Vedic Astrology"]

    row = _keyword(db_session, "saturn in 7th house")
    assert row.status == models.SeoKeywordStatus.DRAFTED and row.post_id == post.id

    # A draft is never visible on the public site.
    assert client.get(f"/public/posts/{post.slug}").status_code == 404


def test_draft_keeps_failing_quality_report_for_review(client, admin, mock_claude):
    mock_claude["result"] = _draft(excerpt="This remedy will cure everything.")
    kw = _add(client, admin, "shani remedies")["created"][0]
    body = client.post(f"/admin/seo-agent/keywords/{kw['id']}/draft", headers=auth_headers(admin)).json()
    assert body["quality"]["passed"] is False
    assert "banned_phrase" in {i["code"] for i in body["quality"]["issues"]}


def test_draft_slug_is_unique(client, admin, mock_claude):
    a = _add(client, admin, "kw one")["created"][0]
    b = _add(client, admin, "kw two")["created"][0]
    mock_claude["result"] = _draft(title="Saturn and Marriage Timing")
    first = client.post(f"/admin/seo-agent/keywords/{a['id']}/draft", headers=auth_headers(admin)).json()
    mock_claude["result"] = _draft(title="Seventh House Lord Explained")
    second = client.post(f"/admin/seo-agent/keywords/{b['id']}/draft", headers=auth_headers(admin)).json()
    assert first["slug"] == "saturn-in-seventh-house"
    assert second["slug"] == "saturn-in-seventh-house-2"


def test_claude_failure_marks_keyword_failed_and_creates_no_post(client, admin, mock_claude, db_session):
    mock_claude["result"] = HTTPException(status_code=502, detail="Claude API error (529). Try again later.")
    kw = _add(client, admin, "rahu in 10th house")["created"][0]
    resp = client.post(f"/admin/seo-agent/keywords/{kw['id']}/draft", headers=auth_headers(admin))
    assert resp.status_code == 502
    row = _keyword(db_session, "rahu in 10th house")
    assert row.status == models.SeoKeywordStatus.FAILED
    assert "529" in row.last_error
    assert db_session.query(models.Post).count() == 0

    # A FAILED keyword can be retried.
    mock_claude["result"] = _draft()
    assert client.post(f"/admin/seo-agent/keywords/{kw['id']}/draft", headers=auth_headers(admin)).status_code == 200


def test_cannot_redraft_drafted_keyword(client, admin, mock_claude):
    kw = _add(client, admin, "ketu in 12th house")["created"][0]
    client.post(f"/admin/seo-agent/keywords/{kw['id']}/draft", headers=auth_headers(admin))
    resp = client.post(f"/admin/seo-agent/keywords/{kw['id']}/draft", headers=auth_headers(admin))
    assert resp.status_code == 409
    assert mock_claude["calls"] == 1


def test_daily_draft_limit_blocks_before_calling_claude(client, admin, mock_claude, monkeypatch):
    monkeypatch.setitem(settings_service._CACHE, "seo_agent_daily_draft_limit", "1")
    a = _add(client, admin, "kw a")["created"][0]
    b = _add(client, admin, "kw b")["created"][0]
    assert client.post(f"/admin/seo-agent/keywords/{a['id']}/draft", headers=auth_headers(admin)).status_code == 200
    resp = client.post(f"/admin/seo-agent/keywords/{b['id']}/draft", headers=auth_headers(admin))
    assert resp.status_code == 429
    assert mock_claude["calls"] == 1


def test_missing_api_key_returns_503(client, admin, monkeypatch, db_session):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    kw = _add(client, admin, "budh in 5th house")["created"][0]
    resp = client.post(f"/admin/seo-agent/keywords/{kw['id']}/draft", headers=auth_headers(admin))
    assert resp.status_code == 503
    assert _keyword(db_session, "budh in 5th house").status == models.SeoKeywordStatus.FAILED


def test_suggest_topics_adds_ai_keywords_without_volume_claims(client, admin, monkeypatch):
    _add(client, admin, "nadi dosha")
    suggestions = seo_agent.TopicSuggestions(topics=[
        seo_agent.TopicSuggestion(keyword="Nadi Dosha", rationale="Already queued."),
        seo_agent.TopicSuggestion(keyword="bhakoot dosha meaning", rationale="Leads to Kundli matching."),
    ])
    monkeypatch.setattr(seo_agent, "_parse", lambda *a, **k: (suggestions, USAGE))
    body = client.post("/admin/seo-agent/keywords/suggest", headers=auth_headers(admin)).json()
    assert body["skipped"] == ["nadi dosha"]
    created = body["created"][0]
    assert created["keyword"] == "bhakoot dosha meaning"
    assert created["source"] == "AI_SUGGESTION"
    assert created["gsc_impressions"] is None
    assert "no search-volume data" in created["notes"]


# --- publishing through the CMS -------------------------------------------------

def _drafted_post_id(client, admin, keyword):
    kw = _add(client, admin, keyword)["created"][0]
    return client.post(f"/admin/seo-agent/keywords/{kw['id']}/draft", headers=auth_headers(admin)).json()["post_id"]


def test_publishing_agent_draft_that_fails_gate_is_refused(client, admin, mock_claude, db_session):
    mock_claude["result"] = _draft(excerpt="We guarantee results.")
    post_id = _drafted_post_id(client, admin, "guna milan score")
    resp = client.put(f"/cms/posts/{post_id}", headers=auth_headers(admin), json={"status": "PUBLISHED"})
    assert resp.status_code == 400
    assert any(i["code"] == "banned_phrase" for i in resp.json()["detail"]["issues"])
    post = db_session.query(models.Post).filter(models.Post.id == post_id).one()
    db_session.refresh(post)
    assert post.status == models.PostStatus.DRAFT and post.published_at is None


def test_admin_fixes_draft_then_publishes(client, admin, mock_claude, db_session):
    mock_claude["result"] = _draft(excerpt="We guarantee results.")
    post_id = _drafted_post_id(client, admin, "guna milan score")
    resp = client.put(f"/cms/posts/{post_id}", headers=auth_headers(admin), json={
        "excerpt": "How the Guna Milan score is calculated and what it means.", "status": "PUBLISHED",
    })
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert data["status"] == "PUBLISHED"
    assert data["generated_by"] == "seo_agent"
    assert data["reviewed_by"] == admin.id and data["reviewed_at"]
    assert _keyword(db_session, "guna milan score").status == models.SeoKeywordStatus.PUBLISHED

    # Public endpoint serves it, without internal agent fields.
    public = client.get(f"/public/posts/{data['slug']}")
    assert public.status_code == 200
    assert "agent_meta" not in public.json() and "reviewed_by" not in public.json()


def test_manual_posts_publish_without_gate(client, admin):
    created = client.post("/cms/posts", headers=auth_headers(admin), json={
        "title": "Short manual note", "content": "<p>We guarantee nothing here, just a note.</p>",
    }).json()
    assert created["generated_by"] == "manual"
    resp = client.put(f"/cms/posts/{created['id']}", headers=auth_headers(admin), json={"status": "PUBLISHED"})
    assert resp.status_code == 200
    assert resp.json()["reviewed_by"] is None


def test_quality_endpoint_rechecks_current_content(client, admin, mock_claude):
    post_id = _drafted_post_id(client, admin, "venus in 2nd house")
    client.put(f"/cms/posts/{post_id}", headers=auth_headers(admin), json={"content": "<p>Too short now.</p>"})
    report = client.get(f"/admin/seo-agent/posts/{post_id}/quality", headers=auth_headers(admin)).json()
    assert report["passed"] is False
    assert "too_short" in {i["code"] for i in report["issues"]}


# --- Search Console import -------------------------------------------------------

def test_aggregate_gsc_rows_weights_position_by_impressions():
    rows = [
        {"keys": ["Kuta Milan Calculator", "https://aadikarta.org/tools/kundli-matching"], "impressions": 3, "clicks": 1, "position": 10.0},
        {"keys": ["kuta milan calculator", "https://aadikarta.org/blog/x"], "impressions": 1, "clicks": 0, "position": 30.0},
    ]
    agg = seo_agent.aggregate_gsc_rows(rows)
    assert agg == {"kuta milan calculator": {
        "impressions": 4, "clicks": 1, "position": 15.0, "page": "https://aadikarta.org/tools/kundli-matching",
    }}


def test_import_gsc_creates_and_refreshes_without_changing_status(client, admin, monkeypatch, db_session):
    _add(client, admin, "free ai astrology")
    kw = _keyword(db_session, "free ai astrology")
    kw.status = models.SeoKeywordStatus.IGNORED
    db_session.commit()

    rows = [
        {"keys": ["free ai astrology", "https://aadikarta.org/ai-astrologer"], "impressions": 8, "clicks": 0, "position": 79.6},
        {"keys": ["singh rashi today", "https://aadikarta.org/services/horoscope/leo"], "impressions": 7, "clicks": 0, "position": 67.0},
        {"keys": ["rare query", "https://aadikarta.org/"], "impressions": 1, "clicks": 0, "position": 90.0},
    ]
    monkeypatch.setattr(gsc_service, "fetch_query_page_rows", lambda days=28: rows)
    resp = client.post("/admin/seo-agent/keywords/import-gsc", headers=auth_headers(admin), json={"min_impressions": 2})
    assert resp.json() == {"rows_read": 3, "created": 1, "updated": 1, "below_threshold": 1}

    db_session.expire_all()
    refreshed = _keyword(db_session, "free ai astrology")
    assert refreshed.status == models.SeoKeywordStatus.IGNORED
    assert refreshed.gsc_impressions == 8 and refreshed.source == models.SeoKeywordSource.ADMIN
    new = _keyword(db_session, "singh rashi today")
    assert new.source == models.SeoKeywordSource.GSC and float(new.gsc_position) == 67.0


def test_import_gsc_unavailable_returns_503(client, admin, monkeypatch):
    def unavailable(days=28):
        raise gsc_service.GSCUnavailableError("Google Search Console credentials not found or invalid.")
    monkeypatch.setattr(gsc_service, "fetch_query_page_rows", unavailable)
    resp = client.post("/admin/seo-agent/keywords/import-gsc", headers=auth_headers(admin), json={})
    assert resp.status_code == 503
