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
    "presence_ttl_seconds": "60",
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
}

# Keys whose values are secret and should be masked when read by the admin UI.
SECRET_KEYS = {"waplex_api_key", "facebook_access_token", "instagram_access_token", "bhashini_api_key", "google_tts_api_key"}

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
