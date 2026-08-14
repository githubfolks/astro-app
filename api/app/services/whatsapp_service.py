"""WhatsApp notifications via the WAPlex gateway."""
import logging
import os
from .settings_service import get_setting
from waplex import WaplexConfig, WaplexSender

logger = logging.getLogger(__name__)

HARDCODED_TEMPLATES = {
    "waplex_template_new_request": "You have a new consultation request from {seeker} on {app}. Open your dashboard to respond: {link}",
    "waplex_template_your_turn": "It's your turn to consult {astrologer} on {app}. Open the app to start: {link}",
    "waplex_template_notify_astrologer": "seeker({seeker_name}) wants your consultation",
    "waplex_template_astrologer_online": "Astrologer({astrologer_name}) is online now. You can start chat.",
}


def get_webhook_secret() -> str:
    return os.getenv("WAPLEX_WEBHOOK_SECRET") or ""


def _get_config() -> WaplexConfig:
    base_url = os.getenv("WAPLEX_BASE_URL") or ""
    admin_key = os.getenv("WAPLEX_ADMIN_KEY") or ""
    app_base_url = os.getenv("API_BASE_URL") or "https://aadikarta.org"

    # The waplex library has no built-in webhook authenticity check, and
    # this is the URL *we* tell wa-platform to call back on during
    # provisioning — so we embed our own shared secret in it and verify it
    # on inbound (see routers/public.py:waplex_inbound).
    inbound_path = "/public/whatsapp/waplex/inbound"
    secret = get_webhook_secret()
    if secret:
        inbound_path = f"{inbound_path}?secret={secret}"

    return WaplexConfig(
        base_url=base_url.rstrip("/"),
        admin_key=admin_key,
        app_base_url=app_base_url,
        inbound_path=inbound_path
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


def send_report_pdf(to_phone: str, full_name: str, report_title: str, pdf_url: str) -> bool:
    """Deliver a completed ad-hoc report's PDF as a WhatsApp document via WAPlex.
    pdf_url must be a publicly reachable HTTPS URL — WAPlex fetches it directly."""
    api_key = get_setting("waplex_api_key")
    if not api_key:
        logger.info(f"[MOCK WAPlex] (Not connected) Report PDF to {to_phone} ({full_name}): {pdf_url}")
        return False

    config = _get_config()
    if not config.base_url or not to_phone:
        logger.warning("WAPlex report PDF send skipped — missing base_url or recipient phone")
        return False

    try:
        sender = WaplexSender(config)
        result = sender.send_media(
            api_key, to_phone, media_url=pdf_url, media_type="document",
            caption=f"Namaste {full_name}, your {report_title} from Aadikarta.org is ready. Download it here.",
            filename=f"{report_title}.pdf",
        )
        return result is not None
    except Exception as e:
        logger.error(f"[WAPlex] report PDF send failed to {to_phone}: {e}")
        return False


def send_checkout_nudge(to_phone: str, full_name: str, report_type: str) -> bool:
    """Abandoned checkout recovery nudge — sent to a lead who captured details but never paid."""
    api_key = get_setting("waplex_api_key")
    if not api_key:
        logger.info(f"[MOCK WAPlex] (Not connected) Checkout nudge to {to_phone} ({full_name}) for {report_type}")
        return False

    config = _get_config()
    if not config.base_url or not to_phone:
        return False

    try:
        sender = WaplexSender(config)
        result = sender.send_text(
            api_key, to_phone,
            f"Namaste {full_name}, your {report_type.replace('_', ' ').title()} report on Aadikarta.org is "
            "just a payment away. Complete your purchase to get your personalized Vedic reading instantly.",
        )
        return result is not None
    except Exception as e:
        logger.error(f"[WAPlex] checkout nudge failed to {to_phone}: {e}")
        return False
