"""WhatsApp notifications via the WAPlex gateway."""
import logging
import os
from .settings_service import get_setting
from waplex import WaplexConfig, WaplexSender

logger = logging.getLogger(__name__)

HARDCODED_TEMPLATES = {
    "waplex_template_new_request": "You have a new consultation request from {seeker} on {app}. Open your dashboard to respond: {link}",
    "waplex_template_your_turn": "It's your turn to consult {astrologer} on {app}. Open the app to start: {link}",
}


def _get_config() -> WaplexConfig:
    base_url = os.getenv("WAPLEX_BASE_URL") or ""
    admin_key = os.getenv("WAPLEX_ADMIN_KEY") or ""
    app_base_url = os.getenv("API_BASE_URL") or "https://aadikarta.org"
    
    return WaplexConfig(
        base_url=base_url.rstrip("/"),
        admin_key=admin_key,
        app_base_url=app_base_url,
        inbound_path="/public/whatsapp/waplex/inbound"
    )


def _render(template: str, params: dict) -> str:
    try:
        return template.format(**params)
    except Exception:
        # Missing placeholder — fall back to the raw template rather than crashing.
        return template


def send_whatsapp(to_phone: str, template_key: str, params: dict | None = None):
    """Send a WhatsApp message via WAPlex. Best-effort: never raises to the caller."""
    params = params or {}
    api_key = get_setting("waplex_api_key")
    if not api_key:
        logger.info(f"[MOCK WAPlex] (Not connected) To: {to_phone} | template: {template_key} | params: {params}")
        return
        
    config = _get_config()
    if not config.base_url:
        logger.warning("WAPlex send failed: waplex_base_url is not configured")
        return

    # Use hardcoded templates for direct keys, otherwise check settings DB
    template = HARDCODED_TEMPLATES.get(template_key) or get_setting(template_key) or template_key
    body = _render(template, params)

    if not to_phone:
        logger.info(f"[WAPlex] skipped — no recipient phone (template={template_key})")
        return

    try:
        sender = WaplexSender(config)
        sender.send_text(api_key, to_phone, body)
        logger.info(f"[WAPlex] sent to {to_phone} (template={template_key})")
    except Exception as e:
        logger.error(f"[WAPlex] send failed to {to_phone}: {e}")
