"""Runtime configuration backed by the app_settings table.

Super admin edits these via /admin/settings; the rest of the app reads them
through get_setting(). A short in-process cache avoids a DB hit on every call
(e.g. the per-message moderation path)."""
import os
import time
import logging
from typing import Optional
from sqlalchemy.orm import Session
from .. import models
from ..database import SessionLocal

logger = logging.getLogger(__name__)

# Default values seeded/returned when a key has not been configured yet.
DEFAULTS: dict[str, str] = {
    # Shown in every outgoing email footer and available to other support-facing UI.
    "support_email": os.getenv("SUPPORT_EMAIL") or os.getenv("MAIL_FROM", "support@aadikarta.org"),
    "support_phone": os.getenv("SUPPORT_PHONE", ""),
    "waplex_tenant_id": "",
    "waplex_api_key": "",
    "waplex_phone_number": "",
    "moderation_admin_user_id": "",     # in-app super-admin recipient for MODERATION_ALERT
    "moderation_admin_whatsapp": "",    # WhatsApp number for moderation alerts
    "moderation_admin_template": "[ALERT] Moderation flag ({reason}) in consultation {consultation_id} by user {user_id}: {snippet}",
    "request_stale_minutes": "5",
    "presence_ttl_seconds": "180",
    # How long a dropped chat socket gets to silently reconnect before the
    # consultation is actually flipped to PAUSED (billing keeps running until then).
    "disconnect_grace_seconds": "25",
    # If a connected socket sends nothing (not even a heartbeat PING) for this
    # long, treat it as backgrounded/idle and pause the consultation — the OS
    # can keep a mobile app's WebSocket technically open for a long time after
    # it's backgrounded, so billing must not rely on the socket actually closing.
    "chat_inactivity_timeout_minutes": "5",
    "promo_first_chat_amount": "49",  # flat ₹ charged for a seeker's first 5 minutes of their very first chat
    "facebook_page_id": "",
    "facebook_access_token": "",
    "instagram_business_account_id": "",
    "instagram_access_token": "",
    "bhashini_user_id": "",
    "bhashini_api_key": "",
    "bhashini_pipeline_id": "",
    "google_tts_api_key": "",
    "content_studio_public_base_url": "",  # e.g. https://api.aadikarta.org — where /static video files are publicly reachable, needed for Facebook/Instagram to fetch them when posting
    "content_studio_caption_cta": "Chat with a certified astrologer on Aadikarta - just ₹10/min ✨\n\nLink in bio | Book your reading now",
    # Which Razorpay key pair below is actually used for new orders: "test" or
    # "live". Admin-toggleable via /admin/settings > Payments so switching
    # between the test and live Razorpay dashboards doesn't need a redeploy.
    # No env var fallback on purpose — one control surface, not two.
    "razorpay_mode": "live",
    "razorpay_key_id_test": os.getenv("RAZORPAY_KEY_TEST_ID", ""),
    "razorpay_key_secret_test": os.getenv("RAZORPAY_KEY_TEST_SECRET", ""),
    # Falls back to the old single-pair env var names for anyone who hasn't
    # migrated their .env to the *_LIVE_* naming yet.
    "razorpay_key_id_live": (
        os.getenv("RAZORPAY_KEY_LIVE_ID") or os.getenv("RAZORPAY_KEY_ID") or os.getenv("RZP_KEY_ID", "")
    ),
    "razorpay_key_secret_live": (
        os.getenv("RAZORPAY_KEY_LIVE_SECRET") or os.getenv("RAZORPAY_KEY_SECRET") or os.getenv("RZP_KEY_SECRET", "")
    ),
    "razorpay_webhook_secret_live": os.getenv("RAZORPAY_WEBHOOK_SECRET", ""),
    "razorpay_webhook_secret_test": os.getenv("RAZORPAY_WEBHOOK_SECRET_TEST", ""),
    # GST charged on top of every wallet recharge (see services/gst.py). A
    # blank/invalid value blocks new recharges rather than silently charging 0%.
    "gst_rate_percent": os.getenv("GST_RATE_PERCENT", "18"),
    # Business identity shown on the legal pages (Terms, Privacy, Refund, Disclaimer).
    "company_legal_name": os.getenv("COMPANY_LEGAL_NAME", "AADIKARTA VEDIC ASTRO PRIVATE LIMITED"),
    "company_registered_address": os.getenv(
        "COMPANY_REGISTERED_ADDRESS",
        "27, Anandpuri BSA Engineer, Mathura, HCL Mathura UP India, 281004",
    ),
    "company_gstin": os.getenv("COMPANY_GSTIN", ""),
    "grievance_officer_name": os.getenv("GRIEVANCE_OFFICER_NAME", ""),
    "grievance_officer_designation": os.getenv("GRIEVANCE_OFFICER_DESIGNATION", ""),
    # Chat messages (and their image attachments) are purged this many years
    # after the consultation ends — see services/retention_service.py.
    "chat_retention_years": os.getenv("CHAT_RETENTION_YEARS", "3"),
    # SEO Agent (services/seo_agent). Drafts are always DRAFT posts; an admin
    # reviews and publishes them. These are the cost and quality guard rails.
    "seo_agent_daily_draft_limit": "5",      # max agent drafts created per day (UTC)
    "seo_agent_min_words": "800",            # quality gate: minimum article length
    "seo_agent_min_faqs": "3",               # quality gate: minimum FAQ entries
    "seo_agent_suggestion_count": "10",      # topics per "Suggest topics" click
    # Quality gate: case-insensitive phrases a draft may not contain. Starter
    # list — needs legal review (Growth Plan risk R4). One phrase per line.
    "seo_agent_banned_phrases": "\n".join([
        "guarantee", "guaranteed", "100%", "cure", "cures", "permanent solution",
        "definitely will", "will definitely", "assured result", "black magic",
        "vashikaran", "money back", "miracle", "instant result",
    ]),
    # Internal links a draft may use, one per line: "<path> | <what it is>".
    # Every path must be a live public route. /blog/<slug> links to existing
    # published posts are always allowed in addition to these.
    "seo_agent_internal_links": "\n".join([
        "/tools/kundli-chart | Free Kundli (birth chart) generator",
        "/tools/kundli-matching | Free Kundli matching (Gun Milan) calculator",
        "/tools/manglik-dosha-checker | Free Manglik Dosha checker",
        "/tools/numerology-calculator | Free numerology calculator",
        "/tools/navamsa-chart | Free Navamsa (D9) chart",
        "/panchang | Today's Panchang",
        "/services/horoscope | Daily horoscope for all 12 signs",
        "/services/ai-instant-reports | Free AI Vedic reports",
        "/ai-astrologer | AI Astrologer chat",
        "/astrologers | Talk to verified astrologers",
    ]),
}

# Keys whose values are secret and should be masked when read by the admin UI.
SECRET_KEYS = {
    "waplex_api_key", "facebook_access_token", "instagram_access_token", "bhashini_api_key", "google_tts_api_key",
    "razorpay_key_secret_test", "razorpay_key_secret_live",
    "razorpay_webhook_secret_live", "razorpay_webhook_secret_test",
}

_CACHE: dict[str, str] = {}
_CACHE_TS: float = 0.0
_CACHE_TTL_SECONDS = 30.0


def _load_all(db: Session) -> dict[str, str]:
    rows = db.query(models.AppSetting).all()
    return {r.key: r.value for r in rows}


def _refresh_cache():
    global _CACHE, _CACHE_TS
    try:
        with SessionLocal() as db:
            _CACHE = _load_all(db)
        _CACHE_TS = time.time()
    except Exception as e:
        logger.error(f"settings_service: failed to refresh cache: {e}")


def get_setting(key: str, default: Optional[str] = None) -> Optional[str]:
    """Return a configured value, falling back to DEFAULTS then the passed default."""
    global _CACHE_TS
    if time.time() - _CACHE_TS > _CACHE_TTL_SECONDS:
        _refresh_cache()
    val = _CACHE.get(key)
    if val is None or val == "":
        return DEFAULTS.get(key, default)
    return val


def get_all(mask_secrets: bool = True) -> dict[str, str]:
    """Return the full settings map (defaults merged with stored values) for the admin UI."""
    _refresh_cache()
    merged = {**DEFAULTS, **{k: v for k, v in _CACHE.items() if v is not None}}
    if mask_secrets:
        for k in SECRET_KEYS:
            if merged.get(k):
                merged[k] = "********"
    return merged


def set_setting(db: Session, key: str, value: str):
    row = db.query(models.AppSetting).filter(models.AppSetting.key == key).first()
    if row:
        row.value = value
    else:
        db.add(models.AppSetting(key=key, value=value))
    db.commit()
    _refresh_cache()


def set_many(db: Session, values: dict[str, str]):
    for key, value in values.items():
        # Skip masked secret placeholders so we don't overwrite real secrets with "********"
        if key in SECRET_KEYS and value == "********":
            continue
        row = db.query(models.AppSetting).filter(models.AppSetting.key == key).first()
        if row:
            row.value = value
        else:
            db.add(models.AppSetting(key=key, value=value))
    db.commit()
    _refresh_cache()
