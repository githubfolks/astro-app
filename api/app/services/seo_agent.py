"""SEO Agent: admin-curated keyword queue -> Claude-drafted blog posts.

Every draft is saved as a DRAFT post; nothing here publishes. An admin
reviews, edits and publishes through the CMS, where the quality gate is
re-run (see routers/cms.py). Topics come from three sources: admin entry,
Claude suggestions (no search-volume data, never estimated), and Search
Console queries the site already appears for.
"""
import logging
import os
from datetime import datetime, time, timezone
from decimal import Decimal
from typing import Optional

import anthropic
from fastapi import HTTPException
from pydantic import BaseModel, ValidationError
from slugify import slugify
from sqlalchemy.orm import Session

from .. import audit, models
from . import gsc_service, seo_quality
from .settings_service import get_setting

logger = logging.getLogger(__name__)

AGENT_NAME = "seo_agent"
DEFAULT_MODEL = "claude-sonnet-5-5"
DEFAULT_EFFORT = "medium"
# Server-side refusal fallback: if the drafting model declines, the API
# retries on another model within the same call instead of failing.
FALLBACK_BETA = "server-side-fallback-2026-07-01"
# Structured outputs (output_config.format); the SDK's own parse helper sends this header too.
STRUCTURED_OUTPUTS_BETA = "structured-outputs-2025-12-15"
KEYWORD_MAX_LEN = 200

_client: Optional[anthropic.Anthropic] = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if not os.getenv("ANTHROPIC_API_KEY"):
        raise HTTPException(status_code=503, detail="SEO Agent is unavailable: ANTHROPIC_API_KEY is not set.")
    if _client is None:
        _client = anthropic.Anthropic()
    return _client


def _model() -> str:
    return os.getenv("SEO_AGENT_MODEL", DEFAULT_MODEL)


def _effort() -> str:
    return os.getenv("SEO_AGENT_EFFORT", DEFAULT_EFFORT)


def _int_setting(key: str) -> int:
    raw = get_setting(key)
    try:
        value = int(str(raw).strip())
    except (TypeError, ValueError):
        raise HTTPException(status_code=500, detail=f'Setting "{key}" must be a whole number (current value: {raw!r}).')
    if value < 0:
        raise HTTPException(status_code=500, detail=f'Setting "{key}" must not be negative.')
    return value


def normalize_keyword(raw: str) -> str:
    return " ".join((raw or "").lower().split())[:KEYWORD_MAX_LEN]


# --- Keyword queue ------------------------------------------------------------

def add_keywords(
    db: Session,
    keywords: list[str],
    source: models.SeoKeywordSource,
    created_by: Optional[int],
    notes: dict[str, str] | None = None,
) -> dict:
    """Insert new keywords, skipping blanks and ones already queued. `notes`
    maps a normalized keyword to its note (used for AI rationales)."""
    created, skipped = [], []
    seen: set[str] = set()
    for raw in keywords:
        kw = normalize_keyword(raw)
        if not kw or kw in seen:
            continue
        seen.add(kw)
        if db.query(models.SeoKeyword).filter(models.SeoKeyword.keyword == kw).first():
            skipped.append(kw)
            continue
        row = models.SeoKeyword(
            keyword=kw, source=source, status=models.SeoKeywordStatus.NEW,
            notes=(notes or {}).get(kw), created_by=created_by,
        )
        db.add(row)
        created.append(row)
    db.commit()
    for row in created:
        db.refresh(row)
    return {"created": created, "skipped": skipped}


def aggregate_gsc_rows(rows: list[dict]) -> dict[str, dict]:
    """Collapse (query, page) rows to one entry per normalized query:
    summed impressions/clicks, impression-weighted average position, and the
    page with the most impressions."""
    out: dict[str, dict] = {}
    for r in rows:
        keys = r.get("keys") or []
        if len(keys) < 2:
            continue
        query, page = normalize_keyword(keys[0]), keys[1]
        if not query:
            continue
        imp = int(r.get("impressions", 0))
        agg = out.setdefault(query, {"impressions": 0, "clicks": 0, "pos_x_imp": 0.0, "pages": {}})
        agg["impressions"] += imp
        agg["clicks"] += int(r.get("clicks", 0))
        agg["pos_x_imp"] += float(r.get("position", 0)) * imp
        agg["pages"][page] = agg["pages"].get(page, 0) + imp
    result = {}
    for query, agg in out.items():
        imp = agg["impressions"]
        result[query] = {
            "impressions": imp,
            "clicks": agg["clicks"],
            "position": round(agg["pos_x_imp"] / imp, 2) if imp else None,
            "page": max(agg["pages"], key=agg["pages"].get) if agg["pages"] else None,
        }
    return result


def import_from_gsc(db: Session, created_by: int, min_impressions: int = 1) -> dict:
    """Queue Search Console queries (last 28 days) with at least `min_impressions`.
    Existing keywords get their GSC metrics refreshed; their status is untouched."""
    try:
        rows = gsc_service.fetch_query_page_rows(days=28)
    except gsc_service.GSCUnavailableError as e:
        raise HTTPException(status_code=503, detail=str(e))

    captured_at = datetime.now(timezone.utc)
    created = updated = below_threshold = 0
    for query, m in aggregate_gsc_rows(rows).items():
        if m["impressions"] < min_impressions:
            below_threshold += 1
            continue
        row = db.query(models.SeoKeyword).filter(models.SeoKeyword.keyword == query).first()
        if row is None:
            row = models.SeoKeyword(
                keyword=query, source=models.SeoKeywordSource.GSC,
                status=models.SeoKeywordStatus.NEW, created_by=created_by,
            )
            db.add(row)
            created += 1
        else:
            updated += 1
        row.gsc_impressions = m["impressions"]
        row.gsc_clicks = m["clicks"]
        row.gsc_position = Decimal(str(m["position"])) if m["position"] is not None else None
        row.gsc_page = m["page"]
        row.gsc_captured_at = captured_at
    db.commit()
    return {"rows_read": len(rows), "created": created, "updated": updated, "below_threshold": below_threshold}


# --- Claude calls -------------------------------------------------------------

class TopicSuggestion(BaseModel):
    keyword: str
    rationale: str


class TopicSuggestions(BaseModel):
    topics: list[TopicSuggestion]


class FaqItem(BaseModel):
    question: str
    answer: str


class PostDraft(BaseModel):
    title: str
    slug: str
    excerpt: str
    content_html: str
    faqs: list[FaqItem]
    tags: list[str]
    secondary_keywords: list[str]
    longtail_keywords: list[str]


_SUGGEST_SYSTEM = """You plan blog topics for Aadikarta (aadikarta.org), an Indian Vedic astrology platform with free tools (Kundli, Kundli matching, Manglik check, numerology, Panchang, horoscopes), free AI reports, and paid chat with verified astrologers.

Propose long-tail search topics an Indian reader would type into Google, which a single evergreen explainer article could answer well and which lead naturally to one of the free tools. Prefer specific questions ("manglik dosha in 7th house effects on marriage") over broad head terms ("astrology"). Avoid topics that depend on a specific date or year (transits, festival dates, yearly predictions): those need computed data this pipeline does not have. Avoid health cures, guaranteed outcomes, black magic, vashikaran, and fear-based remedy selling.

You have no search-volume data. Do not mention or estimate search volumes, difficulty or rankings. The rationale is one sentence on reader intent and which free tool the article would lead to."""

_DRAFT_SYSTEM = """You write blog articles for Aadikarta (aadikarta.org), an Indian Vedic astrology platform. Readers are Indians, often first-time astrology users, reading in English; Hindi/Sanskrit terms (rashi, bhava, graha, dasha, dosha, nakshatra) are welcome with a short explanation the first time.

Write one evergreen explainer article that fully answers the target search query. Ground it in classical Vedic astrology (Parashari Jyotish), not Western sun-sign astrology. Present astrology as traditional guidance and interpretation, never as certainty.

Hard rules (a draft that breaks any of these is rejected automatically):
- Do not state any specific year, date, clock time, or planetary degree. The article must stay true regardless of when it is read.
- Never promise or guarantee outcomes, never claim to cure or treat any illness, never use fear to sell remedies. Do not use any phrase in the banned list you are given.
- Links: use only <a href="..."> with the exact relative paths you are given (allowed internal pages, or /blog/<slug> for the existing posts listed). No external links. Link to at least one relevant free tool, in context, where it genuinely helps the reader.
- HTML only, using <h2>, <h3>, <p>, <ul>/<ol>/<li>, <strong>, <em>, <a>. No <h1> (the page renders the title as h1), no inline styles, no scripts, no images.

Shape:
- title: under 60 characters, contains the target query or a close natural variant.
- slug: lowercase words joined by hyphens, based on the target query.
- excerpt: one or two sentences, at most 155 characters; used as the meta description.
- content_html: about 1000 to 1400 words. Open by answering the query directly in the first paragraph, then explain with h2/h3 sections. End with a short section suggesting the relevant free tool, and that a verified astrologer can look at the reader's full chart.
- faqs: 4 to 6 questions people also ask about this topic, each answered in 2 to 4 sentences. Do not repeat the article verbatim.
- tags: 2 to 4 broad topics. secondary_keywords: 3 to 6 related phrases. longtail_keywords: 3 to 6 longer question-style phrases."""


def _published_posts(db: Session) -> list[models.Post]:
    return (
        db.query(models.Post)
        .filter(models.Post.status == models.PostStatus.PUBLISHED)
        .order_by(models.Post.published_at.desc())
        .all()
    )


def _api_error_message(e: anthropic.APIStatusError) -> str:
    """The API's own error message (e.g. "credit balance is too low"), safe to
    show to admins; falls back to the status code."""
    body = e.body if isinstance(e.body, dict) else {}
    err = body.get("error") if isinstance(body.get("error"), dict) else {}
    return err.get("message") or f"HTTP {e.status_code}"


def _parse(system: str, user: str, output_format: type[BaseModel], max_tokens: int):
    """One structured-output call: the response is constrained to
    `output_format`'s JSON schema and validated against it."""
    client = _get_client()
    try:
        response = client.beta.messages.create(
            model=_model(),
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
            output_config={
                "effort": _effort(),
                "format": {"type": "json_schema", "schema": anthropic.transform_schema(output_format)},
            },
            betas=[STRUCTURED_OUTPUTS_BETA, FALLBACK_BETA],
            fallbacks="default",
        )
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Claude API rate limit reached. Try again in a minute.")
    except anthropic.AuthenticationError:
        logger.error("SEO Agent: Anthropic authentication failed")
        raise HTTPException(status_code=503, detail="SEO Agent is unavailable: the Anthropic API key was rejected.")
    except anthropic.APIStatusError as e:
        message = _api_error_message(e)
        logger.error("SEO Agent: Claude API error %s: %s (request %s)", e.status_code, message, e.request_id)
        if e.status_code >= 500:
            raise HTTPException(status_code=502, detail=f"Claude API is having problems ({e.status_code}). Try again later.")
        raise HTTPException(status_code=502, detail=f"Claude API rejected the request: {message}")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=502, detail="Could not reach the Claude API. Try again later.")

    if response.stop_reason == "refusal":
        raise HTTPException(status_code=422, detail="Claude declined to write this topic. Choose a different keyword.")
    if response.stop_reason == "max_tokens":
        raise HTTPException(status_code=502, detail="Claude's response was cut off before it finished. Try again.")
    text = next((b.text for b in response.content if b.type == "text"), None)
    try:
        parsed = output_format.model_validate_json(text or "")
    except ValidationError:
        logger.error("SEO Agent: response did not match %s (request %s)", output_format.__name__, response._request_id)
        raise HTTPException(status_code=502, detail="Claude returned a response in an unexpected format. Try again.")
    usage = {
        "model": response.model,
        "input_tokens": response.usage.input_tokens,
        "output_tokens": response.usage.output_tokens,
        "request_id": response._request_id,
    }
    return parsed, usage


def suggest_topics(db: Session, created_by: int) -> dict:
    count = _int_setting("seo_agent_suggestion_count")
    if count == 0:
        raise HTTPException(status_code=400, detail="Topic suggestions are turned off (seo_agent_suggestion_count is 0).")
    existing_titles = [p.title for p in _published_posts(db)]
    queued = [k.keyword for k in db.query(models.SeoKeyword).all()]
    tools = sorted(seo_quality.parse_internal_links(get_setting("seo_agent_internal_links")))
    user = "\n".join([
        f"Propose {count} new topics.",
        "Free tools and pages on the site: " + ", ".join(tools),
        "Already published (do not repeat): " + ("; ".join(existing_titles) or "none"),
        "Already in the topic queue (do not repeat): " + ("; ".join(queued) or "none"),
    ])
    parsed, usage = _parse(_SUGGEST_SYSTEM, user, TopicSuggestions, max_tokens=4000)
    notes = {normalize_keyword(t.keyword): f"AI suggestion (no search-volume data): {t.rationale.strip()}" for t in parsed.topics}
    result = add_keywords(db, [t.keyword for t in parsed.topics], models.SeoKeywordSource.AI_SUGGESTION, created_by, notes)
    logger.info("SEO Agent: suggested %d topics (%d new) usage=%s", len(parsed.topics), len(result["created"]), usage)
    return {**result, "usage": usage}


def build_rules(db: Session, exclude_post_id: Optional[int] = None) -> seo_quality.QualityRules:
    published = _published_posts(db)
    others = db.query(models.Post.id, models.Post.title)
    if exclude_post_id is not None:
        others = others.filter(models.Post.id != exclude_post_id)
    return seo_quality.QualityRules(
        min_words=_int_setting("seo_agent_min_words"),
        min_faqs=_int_setting("seo_agent_min_faqs"),
        banned_phrases=seo_quality.parse_banned_phrases(get_setting("seo_agent_banned_phrases")),
        allowed_paths=seo_quality.parse_internal_links(get_setting("seo_agent_internal_links")),
        published_blog_slugs={p.slug for p in published if p.id != exclude_post_id},
        existing_titles=[t for _, t in others.all()],
    )


def check_post(db: Session, post: models.Post) -> seo_quality.QualityReport:
    return seo_quality.check_draft(
        title=post.title, excerpt=post.excerpt, content_html=post.content,
        faqs=post.faqs, rules=build_rules(db, exclude_post_id=post.id),
    )


def _drafts_created_today(db: Session) -> int:
    start = datetime.combine(datetime.now(timezone.utc).date(), time.min, tzinfo=timezone.utc)
    return db.query(models.Post).filter(
        models.Post.generated_by == AGENT_NAME, models.Post.created_at >= start
    ).count()


def agent_status(db: Session) -> dict:
    return {
        "anthropic_configured": bool(os.getenv("ANTHROPIC_API_KEY")),
        "model": _model(),
        "daily_draft_limit": _int_setting("seo_agent_daily_draft_limit"),
        "drafted_today": _drafts_created_today(db),
    }


def _unique_slug(db: Session, wanted: str) -> str:
    base = slugify(wanted)[:80].strip("-") or "post"
    slug, n = base, 2
    while db.query(models.Post.id).filter(models.Post.slug == slug).first():
        slug, n = f"{base}-{n}", n + 1
    return slug


def draft_post(db: Session, keyword_id: int, admin: models.User) -> dict:
    kw = db.query(models.SeoKeyword).filter(models.SeoKeyword.id == keyword_id).with_for_update().first()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    if kw.status not in (models.SeoKeywordStatus.NEW, models.SeoKeywordStatus.FAILED):
        raise HTTPException(status_code=409, detail=f"Keyword is {kw.status.value}; only NEW or FAILED keywords can be drafted.")
    limit = _int_setting("seo_agent_daily_draft_limit")
    if _drafts_created_today(db) >= limit:
        raise HTTPException(status_code=429, detail=f"Daily AI draft limit reached ({limit}). Change it in Settings > SEO Agent.")

    rules = build_rules(db)
    published = _published_posts(db)
    links = (get_setting("seo_agent_internal_links") or "").strip()
    user = "\n".join([
        f"Target search query: {kw.keyword}",
        f"Admin notes: {kw.notes}" if kw.notes else "",
        "Allowed internal pages (path | what it is):\n" + links,
        "Existing posts you may link to as /blog/<slug> (slug | title):\n"
        + ("\n".join(f"{p.slug} | {p.title}" for p in published) or "none"),
        "Existing post titles (do not duplicate): " + ("; ".join(rules.existing_titles) or "none"),
        "Banned phrases: " + ", ".join(rules.banned_phrases),
    ])

    try:
        draft, usage = _parse(_DRAFT_SYSTEM, user, PostDraft, max_tokens=16000)
    except HTTPException as e:
        kw.status = models.SeoKeywordStatus.FAILED
        kw.last_error = str(e.detail)
        db.commit()
        raise

    faqs = [f.model_dump() for f in draft.faqs]
    report = seo_quality.check_draft(
        title=draft.title, excerpt=draft.excerpt, content_html=draft.content_html, faqs=faqs, rules=rules,
    )
    post = models.Post(
        title=draft.title.strip(),
        slug=_unique_slug(db, draft.slug or draft.title),
        content=draft.content_html,
        excerpt=draft.excerpt.strip(),
        faqs=faqs,
        tags=draft.tags,
        secondary_keywords=draft.secondary_keywords,
        longtail_keywords=draft.longtail_keywords,
        status=models.PostStatus.DRAFT,
        author_id=admin.id,
        generated_by=AGENT_NAME,
        agent_meta={
            "keyword_id": kw.id,
            "keyword": kw.keyword,
            "keyword_source": kw.source.value,
            **usage,
            "drafted_at": datetime.now(timezone.utc).isoformat(),
            "quality": report.as_dict(),
        },
    )
    db.add(post)
    db.flush()
    kw.status = models.SeoKeywordStatus.DRAFTED
    kw.post_id = post.id
    kw.last_error = None
    audit.log(db, action="SEO_AGENT_DRAFT_CREATED", actor_id=admin.id, resource_type="post", resource_id=str(post.id),
              details={"keyword_id": kw.id, "keyword": kw.keyword, "quality_passed": report.passed, **usage})
    db.commit()
    db.refresh(post)
    logger.info("SEO Agent: drafted post %s for keyword %r usage=%s passed=%s", post.id, kw.keyword, usage, report.passed)
    return {"post_id": post.id, "slug": post.slug, "quality": report.as_dict(), "usage": usage}


def on_post_published(db: Session, post: models.Post, admin: models.User) -> None:
    """Called by the CMS when an agent draft is published (gate already passed)."""
    post.reviewed_by = admin.id
    post.reviewed_at = datetime.now(timezone.utc)
    kw = db.query(models.SeoKeyword).filter(models.SeoKeyword.post_id == post.id).first()
    if kw:
        kw.status = models.SeoKeywordStatus.PUBLISHED
    audit.log(db, action="SEO_AGENT_POST_PUBLISHED", actor_id=admin.id, resource_type="post",
              resource_id=str(post.id), details={"keyword": kw.keyword if kw else None})
