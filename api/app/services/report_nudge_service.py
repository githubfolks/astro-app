"""
Abandoned-checkout recovery nudges for ad-hoc report leads.

A lead is "abandoned" if they captured their birth details (report_leads)
but never completed a paid order (adhoc_report_orders) within the recovery
window. Sends a single WhatsApp nudge per lead — no repeats. Intended to be
invoked periodically by an external scheduler via the protected endpoint in
app/routers/cron.py.
"""
import logging
from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import exists

from ..models_reports import ReportLead, AdHocReportOrder, PaymentStatus
from .whatsapp_service import send_checkout_nudge

logger = logging.getLogger(__name__)

# Fire the nudge once the lead has had a fair chance to complete checkout on
# their own, but not so late the offer feels stale.
NUDGE_DELAY_MINUTES = 15
NUDGE_WINDOW_HOURS = 24


def send_abandoned_checkout_nudges(db: Session) -> int:
    """Nudge eligible leads and mark them as attempted. Returns the count nudged."""
    now = datetime.utcnow()
    nudge_after = now - timedelta(minutes=NUDGE_DELAY_MINUTES)
    too_old = now - timedelta(hours=NUDGE_WINDOW_HOURS)

    has_paid_order = exists().where(
        AdHocReportOrder.lead_id == ReportLead.id,
        AdHocReportOrder.payment_status == PaymentStatus.PAID,
    )

    candidates = db.query(ReportLead).filter(
        ReportLead.created_at <= nudge_after,
        ReportLead.created_at >= too_old,
        ReportLead.checkout_nudge_sent_at.is_(None),
        ~has_paid_order,
    ).all()

    sent = 0
    for lead in candidates:
        # Mark attempted regardless of outcome — best-effort, never retried/spammed.
        lead.checkout_nudge_sent_at = now
        report_type = lead.report_type.value if lead.report_type else "Vedic Report"
        try:
            if send_checkout_nudge(lead.phone_number, lead.full_name, report_type):
                sent += 1
        except Exception as e:
            logger.error(f"Abandoned checkout nudge failed for lead {lead.id}: {e}")

    if candidates:
        db.commit()
    return sent
