"""
Stall reminders for astrologers stuck mid-onboarding.

Sends up to 3 nudge emails to astrologers who haven't reached a terminal
onboarding stage (COMPLETED/REJECTED) within 5 days of their last stage
change, spaced at least a day apart. Intended to be invoked periodically by
an external scheduler (cron / Vercel Cron) via the protected endpoint in
`app/routers/cron.py`, not on every request.
"""
import logging
from datetime import datetime, timedelta

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session

from .. import models
from .email_service import build_onboarding_reminder_email, send_email

logger = logging.getLogger(__name__)

STALL_THRESHOLD_DAYS = 5
MAX_REMINDERS = 3
MIN_HOURS_BETWEEN_REMINDERS = 24

_TERMINAL_STAGES = (models.OnboardingStage.COMPLETED, models.OnboardingStage.REJECTED)


def send_onboarding_reminders(db: Session, background_tasks: BackgroundTasks) -> int:
    """Email eligible stalled astrologers and update their reminder tracking.

    Returns the number of reminders queued.
    """
    now = datetime.utcnow()
    stall_cutoff = now - timedelta(days=STALL_THRESHOLD_DAYS)
    resend_cutoff = now - timedelta(hours=MIN_HOURS_BETWEEN_REMINDERS)

    candidates = db.query(models.User, models.AstrologerProfile).join(
        models.AstrologerProfile, models.User.id == models.AstrologerProfile.user_id
    ).filter(
        models.AstrologerProfile.onboarding_stage.notin_(_TERMINAL_STAGES),
        models.AstrologerProfile.onboarding_stage_updated_at.isnot(None),
        models.AstrologerProfile.onboarding_stage_updated_at <= stall_cutoff,
        models.AstrologerProfile.onboarding_reminder_count < MAX_REMINDERS,
    ).all()

    sent = 0
    for user, profile in candidates:
        if not user.email:
            continue
        last_sent = profile.onboarding_reminder_last_sent_at
        if last_sent is not None and last_sent > resend_cutoff:
            continue

        subject, html_body = build_onboarding_reminder_email(
            profile.full_name, profile.onboarding_stage.value
        )
        send_email(background_tasks, [user.email], subject, html_body)

        profile.onboarding_reminder_count += 1
        profile.onboarding_reminder_last_sent_at = now
        sent += 1

    if sent:
        db.commit()
    return sent
