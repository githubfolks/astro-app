"""
Endpoints meant to be invoked by an external scheduler (system cron / Vercel
Cron), not by end users or the admin UI. Protected by a shared secret header
rather than user auth, following the MiroTalk webhook pattern in edu.py.
"""
import hmac
import os

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from .. import database
from ..services.onboarding_reminder_service import send_onboarding_reminders
from ..services.report_nudge_service import send_abandoned_checkout_nudges

router = APIRouter(prefix="/cron", tags=["Cron"])


def _check_cron_secret(request: Request) -> None:
    secret = os.getenv("CRON_SECRET")
    if secret:
        provided = request.headers.get("X-Cron-Secret", "")
        if not hmac.compare_digest(provided, secret):
            raise HTTPException(status_code=401, detail="Invalid cron secret")


@router.post("/onboarding/send-reminders")
def trigger_onboarding_reminders(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
):
    """Nudge astrologers stalled 5+ days mid-onboarding. Call once daily."""
    _check_cron_secret(request)
    sent = send_onboarding_reminders(db, background_tasks)
    return {"reminders_sent": sent}


@router.post("/reports/send-checkout-nudges")
def trigger_report_checkout_nudges(
    request: Request,
    db: Session = Depends(database.get_db),
):
    """Nudge report leads who captured birth details but never paid. Call every ~15 min."""
    _check_cron_secret(request)
    sent = send_abandoned_checkout_nudges(db)
    return {"nudges_sent": sent}
