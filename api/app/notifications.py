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

def send_push_notification(token: str, title: str, body: str, data: dict = None):
    """
    Send a push notification to a single device.
    """
    if not firebase_admin._apps:
        logger.info(f"[MOCK PUSH] To: {token} | Title: {title} | Body: {body}")
        return

    try:
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )
        response = messaging.send(message)
        logger.info(f"Successfully sent message: {response}")
    except Exception as e:
        logger.error(f"Error sending push notification: {e}")
