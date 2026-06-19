"""WhatsApp notifications via the self-hosted gateway at wa.aavyalabtech.com.

Configuration (base URL, API key, sender/session) is managed by the super admin
through app_settings. When unconfigured, calls are logged as [MOCK WA] instead of
sent — mirroring the FCM mock in notifications.py — so local/dev works without keys.

The exact request shape is isolated to _post() and can be adjusted once the
gateway's API contract is supplied, without touching callers."""
import logging
import httpx
from .settings_service import get_setting

logger = logging.getLogger(__name__)


def _render(template: str, params: dict) -> str:
    try:
        return template.format(**params)
    except Exception:
        # Missing placeholder — fall back to the raw template rather than crashing.
        return template


def send_whatsapp(to_phone: str, template_key: str, params: dict | None = None):
    """Send a WhatsApp message. Best-effort: never raises to the caller.

    template_key is a settings key (e.g. 'wa_template_new_request') whose value is
    a python-format string filled with `params`.
    """
    params = params or {}
    base_url = (get_setting("wa_base_url") or "").rstrip("/")
    api_key = get_setting("wa_api_key") or ""
    sender = get_setting("wa_sender") or ""
    template = get_setting(template_key) or template_key
    body = _render(template, params)

    if not to_phone:
        logger.info(f"[WA] skipped — no recipient phone (template={template_key})")
        return

    if not base_url or not api_key:
        logger.info(f"[MOCK WA] To: {to_phone} | {body}")
        return

    try:
        _post(base_url, api_key, sender, to_phone, body)
        logger.info(f"[WA] sent to {to_phone} (template={template_key})")
    except Exception as e:
        logger.error(f"[WA] send failed to {to_phone}: {e}")


def _post(base_url: str, api_key: str, sender: str, to_phone: str, message: str):
    """Adjust to the wa.aavyalabtech.com contract once provided.

    Assumed shape (common for whatsapp-web.js / wppconnect style gateways):
        POST {base_url}/send-message
        headers: { Authorization: Bearer <api_key> }
        json: { "from": <sender/session>, "to": <phone>, "message": <text> }
    """
    url = f"{base_url}/send-message"
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    payload = {"from": sender, "to": to_phone, "message": message}
    with httpx.Client(timeout=10.0) as client:
        resp = client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
