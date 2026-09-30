"""Chat retention: purge chat messages (and image attachments) once a
consultation ended more than `chat_retention_years` ago, as promised in the
Privacy Policy. Consultation rows themselves are kept — they are billing
records. Consultations with an unresolved dispute are skipped until resolved.
"""
import logging
import os
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from .. import audit, models
from .settings_service import get_setting

logger = logging.getLogger(__name__)

CHAT_ATTACHMENT_URL_PREFIX = "/static/chat_attachments/"
CHAT_ATTACHMENT_DIR = "uploads/chat_attachments"
BATCH_SIZE = 500


class RetentionConfigError(Exception):
    """chat_retention_years is missing or invalid — never purge on a bad config."""


def get_chat_retention_years() -> int:
    raw = (get_setting("chat_retention_years") or "").strip()
    try:
        years = int(raw)
    except ValueError:
        raise RetentionConfigError(f"Invalid chat_retention_years setting: {raw!r}")
    if years < 1:
        raise RetentionConfigError(f"chat_retention_years must be at least 1, got {years}")
    return years


def _remove_attachment(media_url: str | None) -> None:
    if not media_url or not media_url.startswith(CHAT_ATTACHMENT_URL_PREFIX):
        return
    # basename() so a crafted URL can never point outside the attachment dir.
    filename = os.path.basename(media_url[len(CHAT_ATTACHMENT_URL_PREFIX):])
    if not filename:
        return
    try:
        os.remove(os.path.join(CHAT_ATTACHMENT_DIR, filename))
    except FileNotFoundError:
        pass
    except OSError as e:
        logger.error(f"retention: failed to remove chat attachment {filename}: {e}")


def purge_expired_chat_messages(db: Session, now: datetime | None = None) -> dict:
    years = get_chat_retention_years()
    now = now or datetime.now(timezone.utc)
    cutoff = now - timedelta(days=365 * years)

    disputed = db.query(models.Dispute.consultation_id).filter(
        models.Dispute.status.in_([models.DisputeStatus.OPEN, models.DisputeStatus.INVESTIGATING])
    )
    expired_ids = [
        row.id for row in db.query(models.Consultation.id).filter(
            models.Consultation.end_time.isnot(None),
            models.Consultation.end_time < cutoff,
            models.Consultation.id.notin_(disputed),
        ).all()
    ]

    messages_deleted = 0
    for i in range(0, len(expired_ids), BATCH_SIZE):
        batch = expired_ids[i:i + BATCH_SIZE]
        messages = db.query(models.ChatMessage.id, models.ChatMessage.media_url).filter(
            models.ChatMessage.consultation_id.in_(batch)
        ).all()
        if not messages:
            continue
        # Moderation flags keep a copy of the offending text — erase it with
        # the message, but keep the flag itself (it records a policy violation).
        db.query(models.ModerationFlag).filter(models.ModerationFlag.consultation_id.in_(batch)).update(
            {models.ModerationFlag.message_id: None, models.ModerationFlag.snippet: None},
            synchronize_session=False,
        )
        messages_deleted += db.query(models.ChatMessage).filter(
            models.ChatMessage.consultation_id.in_(batch)
        ).delete(synchronize_session=False)
        db.commit()
        for m in messages:
            _remove_attachment(m.media_url)

    result = {
        "retention_years": years,
        "cutoff": cutoff.isoformat(),
        "consultations_scanned": len(expired_ids),
        "messages_deleted": messages_deleted,
    }
    audit.log(db, "CHAT_RETENTION_PURGE", resource_type="chat_messages", details=result)
    db.commit()
    return result
