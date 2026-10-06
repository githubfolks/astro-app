import firebase_admin
from firebase_admin import credentials, messaging
import json
import os
import logging
from urllib.parse import urlparse

from pywebpush import webpush, WebPushException

logger = logging.getLogger(__name__)

# Standard Web Push (VAPID) for browsers / Home Screen web apps. iOS Safari
# (16.4+, Home Screen only) supports this but not FCM web tokens, so browser
# astrologers subscribe via the Push API and their subscription JSON is stored
# in device_tokens.fcm_token with platform="webpush".
WEB_PUSH_PLATFORM = "webpush"
VAPID_PUBLIC_KEY = os.getenv("VAPID_PUBLIC_KEY", "")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY", "")
VAPID_SUBJECT = os.getenv("VAPID_SUBJECT", "")


def web_push_configured() -> bool:
    return bool(VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY and VAPID_SUBJECT)


def parse_web_push_subscription(token: str) -> dict | None:
    """Return the subscription dict if `token` is a valid Push API subscription
    (JSON with an https endpoint and p256dh/auth keys), else None. FCM tokens
    are opaque strings and never parse as this shape."""
    if not token or not token.startswith("{"):
        return None
    try:
        sub = json.loads(token)
    except (json.JSONDecodeError, TypeError):
        return None
    if not isinstance(sub, dict):
        return None
    endpoint = sub.get("endpoint")
    keys = sub.get("keys")
    if not isinstance(endpoint, str) or urlparse(endpoint).scheme != "https" or not urlparse(endpoint).netloc:
        return None
    if not isinstance(keys, dict) or not isinstance(keys.get("p256dh"), str) or not isinstance(keys.get("auth"), str):
        return None
    return {"endpoint": endpoint, "keys": {"p256dh": keys["p256dh"], "auth": keys["auth"]}}


def normalize_web_push_subscription(sub: dict) -> str:
    """Canonical JSON so the same subscription always maps to the same
    device_tokens row (fcm_token is unique)."""
    return json.dumps(sub, sort_keys=True, separators=(",", ":"))


def _delete_device_token(token: str):
    from . import database, models
    with database.SessionLocal() as db:
        db.query(models.DeviceToken).filter(models.DeviceToken.fcm_token == token).delete()
        db.commit()


def _send_web_push(token: str, subscription: dict, title: str, body: str, data: dict | None):
    if not web_push_configured():
        logger.error("Web push not sent: VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY/VAPID_SUBJECT not configured")
        return
    from .services.settings_service import get_setting
    try:
        ttl = int(get_setting("web_push_ttl_seconds") or 600)
    except (TypeError, ValueError):
        ttl = 600
    payload = json.dumps({"title": title, "body": body, "data": data or {}})
    try:
        webpush(
            subscription_info=subscription,
            data=payload,
            vapid_private_key=VAPID_PRIVATE_KEY,
            vapid_claims={"sub": VAPID_SUBJECT},
            ttl=ttl,
            headers={"Urgency": "high"},
            timeout=10,
        )
        logger.info(f"Web push sent to {urlparse(subscription['endpoint']).netloc}")
    except WebPushException as e:
        # 404/410: the browser dropped this subscription (permission revoked,
        # app removed from Home Screen, ...) — it will never work again.
        if e.status_code in (404, 410):
            logger.info(f"Removing expired web push subscription ({e.status_code})")
            _delete_device_token(token)
        else:
            logger.error(f"Error sending web push (status {e.status_code}): {e.message}")
    except Exception as e:
        logger.error(f"Error sending web push: {e}")

# Initialize Firebase Admin
# Expects GOOGLE_APPLICATION_CREDENTIALS env var or explicit path
# For local dev without creds, we can mock it or check compatibility.

try:
    # Check if app already initialized
    if not firebase_admin._apps:
        # Default strategy: Use GOOGLE_APPLICATION_CREDENTIALS
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred)
except Exception as e:
    logger.warning(f"Firebase Admin SDK not initialized: {e}")

def send_push_notification(token: str, title: str, body: str, data: dict = None, android_channel_id: str = None):
    """
    Send a push notification to a single device.

    android_channel_id must match a channel already created on-device
    (see MainActivity's notification channel setup); Android silently falls
    back to the default channel otherwise, which is not high-priority/loud.
    """
    subscription = parse_web_push_subscription(token)
    if subscription is not None:
        _send_web_push(token, subscription, title, body, data)
        return

    if not firebase_admin._apps:
        logger.info(f"[MOCK PUSH] To: {token} | Title: {title} | Body: {body}")
        return

    try:
        # Always request the default sound so every push rings, not just the
        # ones that pass a specific (loud) android_channel_id — channel_id may
        # be None, in which case Android/FCM falls back to the app's default
        # notification channel, still with sound requested.
        android_config = messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                channel_id=android_channel_id,
                sound="default",
            ),
        )
        apns_config = messaging.APNSConfig(
            payload=messaging.APNSPayload(aps=messaging.Aps(sound="default"))
        )

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
            android=android_config,
            apns=apns_config,
        )
        response = messaging.send(message)
        logger.info(f"Successfully sent message: {response}")
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
