import firebase_admin
from firebase_admin import credentials, messaging
import os
import logging

logger = logging.getLogger(__name__)

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
    if not firebase_admin._apps:
        logger.info(f"[MOCK PUSH] To: {token} | Title: {title} | Body: {body}")
        return

    try:
        android_config = None
        if android_channel_id:
            android_config = messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id=android_channel_id,
                    sound="default",
                ),
            )

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
            android=android_config,
        )
        response = messaging.send(message)
        logger.info(f"Successfully sent message: {response}")
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
