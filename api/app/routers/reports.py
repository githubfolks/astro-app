"""
Reports Router — Ad-Hoc Report Ordering, Lead Capture, Direct Payment & Analytics.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field, model_validator
from typing import Optional, Dict, Any
from datetime import date, time
import hmac
import hashlib
import json
import os
import uuid

from .. import models
from ..database import get_db
from .auth import get_current_admin
from .payment import get_razorpay_client, get_razorpay_mode, get_razorpay_keys
from ..models_reports import ReportLead, AdHocReportOrder, ReportAnalytics, ReportType, PaymentStatus, ReportStatus
from ..report_generator_service import generate_full_kundli_report, generate_gun_milan_report, generate_career_finance_report
from ..report_pdf_service import generate_report_pdf
from ..services.settings_service import get_setting
from ..services.whatsapp_service import send_report_pdf


# Deliberately NOT under "uploads/" — that whole directory is served
# unauthenticated via the app.mount("/static", ...) in main.py, which would
# let anyone who knows/guesses an order_reference fetch the PDF directly and
# skip the payment-status check in get_report_pdf below.
REPORTS_PDF_DIR = "generated_report_pdfs"

router = APIRouter(
    prefix="/reports",
    tags=["Ad-Hoc Reports"]
)

# Pricing Map (in INR) — ad-hoc reports are INR-only for now.
REPORT_PRICING = {
    ReportType.FULL_KUNDLI: 199.00,
    ReportType.GUN_MILAN: 149.00,
    ReportType.CAREER_FINANCE: 199.00,
}


# --- Request & Response Schemas ---

class LeadCaptureRequest(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    phone_number: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = None
    date_of_birth: date
    time_of_birth: time
    place_of_birth: str = Field(..., min_length=1, max_length=150)
    gender: Optional[str] = "MALE"
    campaign_source: Optional[str] = "aadikarta.org"
    report_type: ReportType

    # Required only for GUN_MILAN — the second person in the match.
    partner_full_name: Optional[str] = Field(None, max_length=100)
    partner_date_of_birth: Optional[date] = None
    partner_time_of_birth: Optional[time] = None
    partner_place_of_birth: Optional[str] = Field(None, max_length=150)

    @model_validator(mode="after")
    def _require_partner_details_for_gun_milan(self):
        if self.report_type == ReportType.GUN_MILAN:
            missing = [
                name for name, val in [
                    ("partner_full_name", self.partner_full_name),
                    ("partner_date_of_birth", self.partner_date_of_birth),
                    ("partner_time_of_birth", self.partner_time_of_birth),
                    ("partner_place_of_birth", self.partner_place_of_birth),
                ] if not val
            ]
            if missing:
                raise ValueError(f"Gun Milan reports require partner birth details: {', '.join(missing)}")
        return self


class InternalTestGenerateRequest(LeadCaptureRequest):
    language: str = "en"


class DirectOrderRequest(BaseModel):
    lead_id: int
    report_type: ReportType
    language: str = "en"


class VerifyPaymentRequest(BaseModel):
    order_reference: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# --- Internal helpers ---

async def _complete_report_order(db: Session, order: AdHocReportOrder) -> Dict[str, Any]:
    """Generate the AI report payload, persist it, and dispatch WhatsApp delivery.
    Shared by the client-side verify callback and the server-to-server webhook
    so a completed order is only ever processed once from either path."""
    if order.report_status == ReportStatus.COMPLETED:
        return {
            "status": "COMPLETED",
            "order_reference": order.order_reference,
            "pdf_url": order.pdf_url,
            "whatsapp_sent": order.whatsapp_sent,
        }

    order.report_status = ReportStatus.GENERATING
    db.commit()

    lead = order.lead
    report_payload: Dict[str, Any] = {}
    if order.report_type == ReportType.FULL_KUNDLI:
        report_payload = await generate_full_kundli_report(
            full_name=lead.full_name,
            dob=lead.date_of_birth,
            tob=lead.time_of_birth,
            pob=lead.place_of_birth,
            gender=lead.gender or "MALE",
            language=order.language
        )
    elif order.report_type == ReportType.GUN_MILAN:
        person1 = {
            "full_name": lead.full_name,
            "year": lead.date_of_birth.year, "month": lead.date_of_birth.month, "day": lead.date_of_birth.day,
            "hour": lead.time_of_birth.hour, "minute": lead.time_of_birth.minute,
            "place": lead.place_of_birth
        }
        person2 = {
            "full_name": lead.partner_full_name,
            "year": lead.partner_date_of_birth.year, "month": lead.partner_date_of_birth.month, "day": lead.partner_date_of_birth.day,
            "hour": lead.partner_time_of_birth.hour, "minute": lead.partner_time_of_birth.minute,
            "place": lead.partner_place_of_birth
        }
        report_payload = await generate_gun_milan_report(person1, person2, language=order.language)
    elif order.report_type == ReportType.CAREER_FINANCE:
        report_payload = await generate_career_finance_report(
            full_name=lead.full_name,
            dob=lead.date_of_birth,
            tob=lead.time_of_birth,
            pob=lead.place_of_birth,
            language=order.language
        )

    report_title = report_payload.get("report_title", "Aadikarta Vedic Report")

    os.makedirs(REPORTS_PDF_DIR, exist_ok=True)
    pdf_bytes = generate_report_pdf(order.report_type.value, report_payload, order.order_reference)
    with open(os.path.join(REPORTS_PDF_DIR, f"{order.order_reference}.pdf"), "wb") as f:
        f.write(pdf_bytes)

    order.report_data = report_payload
    order.pdf_url = f"/reports/{order.order_reference}/pdf"
    order.report_status = ReportStatus.COMPLETED
    db.commit()

    public_base = (get_setting("content_studio_public_base_url") or "https://api.aadikarta.org").rstrip("/")
    whatsapp_sent = send_report_pdf(
        to_phone=lead.phone_number,
        full_name=lead.full_name,
        report_title=report_title,
        pdf_url=f"{public_base}{order.pdf_url}",
    )
    order.whatsapp_sent = whatsapp_sent
    db.commit()

    analytics = ReportAnalytics(
        report_type=order.report_type,
        action="PAYMENT_SUCCESS",
        order_id=order.id
    )
    db.add(analytics)
    db.commit()

    return {
        "status": "COMPLETED",
        "order_reference": order.order_reference,
        "pdf_url": order.pdf_url,
        "whatsapp_sent": whatsapp_sent
    }


# --- Endpoints ---

@router.post("/lead-capture")
def capture_report_lead(
    req: LeadCaptureRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Step 1: Capture basic seeker details & mobile number BEFORE payment.
    Saves lead to report_leads table for marketing remarketing from aadikarta.org.
    """
    segment = "general"
    if req.report_type == ReportType.GUN_MILAN:
        segment = "marriage_intent"
    elif req.report_type == ReportType.CAREER_FINANCE:
        segment = "career_intent"
    elif req.report_type == ReportType.FULL_KUNDLI:
        segment = "kundli_intent"

    lead = ReportLead(
        full_name=req.full_name,
        phone_number=req.phone_number,
        email=req.email,
        date_of_birth=req.date_of_birth,
        time_of_birth=req.time_of_birth,
        place_of_birth=req.place_of_birth,
        gender=req.gender,
        campaign_source=req.campaign_source,
        marketing_segment=segment,
        report_type=req.report_type,
        partner_full_name=req.partner_full_name,
        partner_date_of_birth=req.partner_date_of_birth,
        partner_time_of_birth=req.partner_time_of_birth,
        partner_place_of_birth=req.partner_place_of_birth,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    # Log Telemetry
    analytics = ReportAnalytics(
        report_type=req.report_type,
        action="LEAD_CAPTURED",
        referrer=request.headers.get("referer", "direct"),
        device_type=request.headers.get("user-agent", "unknown")[:100],
    )
    db.add(analytics)
    db.commit()

    return {
        "lead_id": lead.id,
        "message": "Lead captured successfully",
        "next_step": "create-direct-order",
    }


@router.post("/create-direct-order")
def create_direct_order(
    req: DirectOrderRequest,
    db: Session = Depends(get_db)
):
    """
    Step 2: Create a real Razorpay order for direct payment (no wallet balance required).
    """
    lead = db.query(ReportLead).filter(ReportLead.id == req.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    amount = REPORT_PRICING.get(req.report_type, 199.00)
    order_ref = f"AADI_REP_{uuid.uuid4().hex[:8].upper()}"

    mode = get_razorpay_mode()
    key_id, _ = get_razorpay_keys(mode)
    client = get_razorpay_client(mode)
    if not client:
        raise HTTPException(
            status_code=503,
            detail=f"Razorpay {mode} keys are not configured. Set them in Admin > Settings > Razorpay Payment Gateway.",
        )

    amount_paise = int(amount * 100)
    try:
        razorpay_order = client.order.create(data={
            "amount": amount_paise,
            "currency": "INR",
            "receipt": order_ref,
            "notes": {"order_reference": order_ref, "report_type": req.report_type.value},
        })
    except Exception as e:
        print(f"Error creating Razorpay order for report: {e}")
        raise HTTPException(status_code=500, detail="Could not create payment order")

    order = AdHocReportOrder(
        order_reference=order_ref,
        lead_id=lead.id,
        report_type=req.report_type,
        language=req.language,
        amount=amount,
        currency="INR",
        payment_status=PaymentStatus.PENDING,
        report_status=ReportStatus.PENDING,
        gateway_order_id=razorpay_order["id"],
        razorpay_mode=mode,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {
        "order_id": order.id,
        "order_reference": order.order_reference,
        "gateway_order_id": razorpay_order["id"],
        "amount": razorpay_order["amount"],
        "currency": razorpay_order["currency"],
        "key_id": key_id,
        "customer_name": lead.full_name,
        "customer_phone": lead.phone_number,
    }


@router.post("/verify-payment")
async def verify_report_payment(
    req: VerifyPaymentRequest,
    db: Session = Depends(get_db)
):
    """
    Step 3: Client-side callback after Razorpay Checkout succeeds. Verifies the
    payment signature server-side (never trusts the browser's word alone) before
    marking the order paid and generating the report — mirrors /payment/verify.
    """
    order = db.query(AdHocReportOrder).filter(AdHocReportOrder.order_reference == req.order_reference).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order reference not found")

    if order.payment_status == PaymentStatus.PAID:
        result = await _complete_report_order(db, order)
        return result

    if req.razorpay_order_id != order.gateway_order_id:
        raise HTTPException(status_code=400, detail="Order mismatch")

    _, key_secret = get_razorpay_keys(order.razorpay_mode)
    if not key_secret:
        raise HTTPException(status_code=500, detail="Razorpay is not configured for this order's mode")

    msg = f"{req.razorpay_order_id}|{req.razorpay_payment_id}"
    generated_signature = hmac.new(key_secret.encode("utf-8"), msg.encode("utf-8"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(generated_signature, req.razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    order.payment_status = PaymentStatus.PAID
    order.gateway_payment_id = req.razorpay_payment_id
    db.commit()

    result = await _complete_report_order(db, order)
    return result


@router.post("/payment-webhook")
async def process_payment_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Server-to-server Razorpay webhook — reliable backup to the client-side
    /verify-payment flow. Requires a valid X-Razorpay-Signature; a client-supplied
    status is never trusted (same pattern as /payment/razorpay-webhook).
    """
    raw_body = await request.body()
    webhook_secrets = [
        s for s in (get_setting("razorpay_webhook_secret_live"), get_setting("razorpay_webhook_secret_test"))
        if s
    ]
    if not webhook_secrets:
        raise RuntimeError("Razorpay webhook secret is not configured.")

    received_sig = request.headers.get("X-Razorpay-Signature", "")
    signature_valid = any(
        hmac.compare_digest(
            hmac.new(s.encode("utf-8"), raw_body, hashlib.sha256).hexdigest(),
            received_sig,
        )
        for s in webhook_secrets
    )
    if not signature_valid:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    if payload.get("event") != "payment.captured":
        return {"status": "ignored", "event": payload.get("event")}

    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    gateway_order_id = payment_entity.get("order_id")
    payment_id = payment_entity.get("id")
    if not gateway_order_id:
        return {"status": "skipped", "reason": "missing order_id"}

    order = db.query(AdHocReportOrder).filter(AdHocReportOrder.gateway_order_id == gateway_order_id).first()
    if not order:
        return {"status": "skipped", "reason": "no matching report order"}

    if order.payment_status != PaymentStatus.PAID:
        order.payment_status = PaymentStatus.PAID
        order.gateway_payment_id = payment_id
        db.commit()

    await _complete_report_order(db, order)
    return {"status": "ok"}


@router.get("/analytics/dashboard")
def get_report_analytics_dashboard(
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """Admin Telemetry Dashboard endpoint for reports analytics."""
    total_leads = db.query(ReportLead).count()
    total_orders = db.query(AdHocReportOrder).filter(AdHocReportOrder.payment_status == PaymentStatus.PAID).count()
    total_revenue = db.query(func.sum(AdHocReportOrder.amount)).filter(AdHocReportOrder.payment_status == PaymentStatus.PAID).scalar() or 0.0

    leads_by_segment = (
        db.query(ReportLead.marketing_segment, func.count(ReportLead.id))
        .group_by(ReportLead.marketing_segment)
        .all()
    )

    revenue_by_type = (
        db.query(AdHocReportOrder.report_type, func.sum(AdHocReportOrder.amount))
        .filter(AdHocReportOrder.payment_status == PaymentStatus.PAID)
        .group_by(AdHocReportOrder.report_type)
        .all()
    )

    return {
        "total_leads_captured": total_leads,
        "total_paid_reports": total_orders,
        "total_revenue_inr": float(total_revenue),
        "conversion_rate": round((total_orders / total_leads * 100), 2) if total_leads > 0 else 0.0,
        "leads_by_segment": {seg: count for seg, count in leads_by_segment},
        "revenue_by_type": {rtype: float(rev) for rtype, rev in revenue_by_type},
    }


@router.post("/internal-test-generate")
async def generate_internal_test_report(
    req: InternalTestGenerateRequest,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """
    Admin-only QA bypass: generates a real AI report end-to-end (synthesis, PDF,
    WhatsApp dispatch to the phone number supplied in the request) WITHOUT going
    through Razorpay, so the team can review report quality for free. Marked
    PaymentStatus.INTERNAL_TEST so it's excluded from revenue/conversion metrics
    in the analytics dashboard and leads list. The phone number entered is where
    the WhatsApp report link is sent — use your own test number, not a real
    customer's, since this dispatches an actual WhatsApp message.
    """
    lead = ReportLead(
        full_name=req.full_name,
        phone_number=req.phone_number,
        email=req.email,
        date_of_birth=req.date_of_birth,
        time_of_birth=req.time_of_birth,
        place_of_birth=req.place_of_birth,
        gender=req.gender,
        campaign_source="internal_admin_test",
        marketing_segment="internal_test",
        report_type=req.report_type,
        partner_full_name=req.partner_full_name,
        partner_date_of_birth=req.partner_date_of_birth,
        partner_time_of_birth=req.partner_time_of_birth,
        partner_place_of_birth=req.partner_place_of_birth,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)

    order = AdHocReportOrder(
        order_reference=f"AADI_TEST_{uuid.uuid4().hex[:8].upper()}",
        lead_id=lead.id,
        report_type=req.report_type,
        language=req.language,
        amount=0,
        currency="INR",
        payment_status=PaymentStatus.INTERNAL_TEST,
        report_status=ReportStatus.PENDING,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    result = await _complete_report_order(db, order)
    return {**result, "lead_id": lead.id}


def _lead_summary(lead: ReportLead, orders: list) -> Dict[str, Any]:
    paid_orders = [o for o in orders if o.payment_status == PaymentStatus.PAID]
    return {
        "lead_id": lead.id,
        "full_name": lead.full_name,
        "phone_number": lead.phone_number,
        "email": lead.email,
        "gender": lead.gender,
        "date_of_birth": lead.date_of_birth,
        "time_of_birth": lead.time_of_birth,
        "place_of_birth": lead.place_of_birth,
        "report_type": lead.report_type,
        "marketing_segment": lead.marketing_segment,
        "campaign_source": lead.campaign_source,
        "created_at": lead.created_at,
        "order_count": len(orders),
        "converted": len(paid_orders) > 0,
    }


# NOTE: must be declared before the catch-all "/{order_reference}" routes
# below, or FastAPI will match "leads"/"leads/export" as an order_reference.
@router.get("/leads")
def list_report_leads(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    report_type: Optional[ReportType] = None,
    converted_only: bool = False,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """Paginated, filterable list of captured report leads for the admin drill-down view."""
    query = db.query(ReportLead)
    if report_type:
        query = query.filter(ReportLead.report_type == report_type)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(
            (ReportLead.full_name.ilike(like)) |
            (ReportLead.phone_number.ilike(like)) |
            (ReportLead.email.ilike(like))
        )

    leads = query.order_by(ReportLead.created_at.desc()).all()

    lead_ids = [l.id for l in leads]
    orders_by_lead: Dict[int, list] = {lid: [] for lid in lead_ids}
    if lead_ids:
        for order in db.query(AdHocReportOrder).filter(AdHocReportOrder.lead_id.in_(lead_ids)).all():
            orders_by_lead[order.lead_id].append(order)

    summaries = [_lead_summary(l, orders_by_lead[l.id]) for l in leads]
    if converted_only:
        summaries = [s for s in summaries if s["converted"]]

    total = len(summaries)
    page = summaries[skip:skip + limit]

    return {"total": total, "leads": page}


@router.get("/leads/export")
def export_report_leads(
    search: Optional[str] = None,
    report_type: Optional[ReportType] = None,
    converted_only: bool = False,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """CSV export of captured leads (Full Name, Mobile, Email + context) for
    marketing follow-up / remarketing use, per admin request."""
    import csv
    import io

    query = db.query(ReportLead)
    if report_type:
        query = query.filter(ReportLead.report_type == report_type)
    if search:
        like = f"%{search.strip()}%"
        query = query.filter(
            (ReportLead.full_name.ilike(like)) |
            (ReportLead.phone_number.ilike(like)) |
            (ReportLead.email.ilike(like))
        )

    leads = query.order_by(ReportLead.created_at.desc()).all()

    lead_ids = [l.id for l in leads]
    orders_by_lead: Dict[int, list] = {lid: [] for lid in lead_ids}
    if lead_ids:
        for order in db.query(AdHocReportOrder).filter(AdHocReportOrder.lead_id.in_(lead_ids)).all():
            orders_by_lead[order.lead_id].append(order)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow([
        "Full Name", "Mobile", "Email", "Report Type", "Marketing Segment",
        "Campaign Source", "Converted (Paid)", "Order Count", "Captured At",
    ])
    for lead in leads:
        orders = orders_by_lead[lead.id]
        summary = _lead_summary(lead, orders)
        if converted_only and not summary["converted"]:
            continue
        writer.writerow([
            lead.full_name,
            lead.phone_number,
            lead.email or "",
            lead.report_type.value if lead.report_type else "",
            lead.marketing_segment or "",
            lead.campaign_source or "",
            "Yes" if summary["converted"] else "No",
            summary["order_count"],
            lead.created_at.strftime("%Y-%m-%d %H:%M:%S") if lead.created_at else "",
        ])
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=report-leads.csv"},
    )


@router.get("/leads/{lead_id}")
def get_report_lead_detail(
    lead_id: int,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin),
):
    """Drill-down view of a single lead: full birth/partner details plus every order they placed."""
    lead = db.query(ReportLead).filter(ReportLead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    orders = db.query(AdHocReportOrder).filter(AdHocReportOrder.lead_id == lead.id).order_by(AdHocReportOrder.created_at.desc()).all()

    return {
        **_lead_summary(lead, orders),
        "partner_full_name": lead.partner_full_name,
        "partner_date_of_birth": lead.partner_date_of_birth,
        "partner_time_of_birth": lead.partner_time_of_birth,
        "partner_place_of_birth": lead.partner_place_of_birth,
        "orders": [
            {
                "order_reference": o.order_reference,
                "report_type": o.report_type,
                "language": o.language,
                "amount": float(o.amount),
                "payment_status": o.payment_status,
                "report_status": o.report_status,
                "pdf_url": o.pdf_url,
                "whatsapp_sent": o.whatsapp_sent,
                "created_at": o.created_at,
            }
            for o in orders
        ],
    }


@router.get("/{order_reference}/pdf")
def get_report_pdf(
    order_reference: str,
    db: Session = Depends(get_db)
):
    """Stream the generated report PDF. Same access model as get_report_details:
    gated on the unguessable order_reference plus a PAID (or admin INTERNAL_TEST) payment status."""
    order = db.query(AdHocReportOrder).filter(AdHocReportOrder.order_reference == order_reference).first()
    if not order:
        raise HTTPException(status_code=404, detail="Report order not found")
    if order.payment_status not in (PaymentStatus.PAID, PaymentStatus.INTERNAL_TEST):
        raise HTTPException(status_code=402, detail="Payment pending for this report")

    pdf_path = os.path.join(REPORTS_PDF_DIR, f"{order_reference}.pdf")
    if not os.path.exists(pdf_path):
        if order.report_status != ReportStatus.COMPLETED or not order.report_data:
            raise HTTPException(status_code=404, detail="Report PDF not yet generated")
        # Regenerate — e.g. the file was lost from disk but the report data survives in the DB.
        os.makedirs(REPORTS_PDF_DIR, exist_ok=True)
        pdf_bytes = generate_report_pdf(order.report_type.value, order.report_data, order.order_reference)
        with open(pdf_path, "wb") as f:
            f.write(pdf_bytes)
    else:
        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

    raw_title = (order.report_data.get("report_title") if order.report_data else None) or "Aadikarta-Report"
    # Content-Disposition filenames must be latin-1 safe (e.g. Hindi-language
    # report titles aren't) — strip to a plain ASCII-safe fallback.
    safe_title = "".join(c if c.isascii() and c not in '"\\' else "-" for c in raw_title).strip("- ") or "Aadikarta-Report"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{safe_title}.pdf"'},
    )


@router.get("/{order_reference}")
def get_report_details(
    order_reference: str,
    db: Session = Depends(get_db)
):
    """Fetch report JSON payload for interactive Web Viewer.
    Keyed by the unguessable order_reference (not the sequential DB id) so a
    report link can't be enumerated to read another customer's PII."""
    order = db.query(AdHocReportOrder).filter(AdHocReportOrder.order_reference == order_reference).first()
    if not order:
        raise HTTPException(status_code=404, detail="Report order not found")

    if order.payment_status not in (PaymentStatus.PAID, PaymentStatus.INTERNAL_TEST):
        raise HTTPException(status_code=402, detail="Payment pending for this report")

    return {
        "order_id": order.id,
        "order_reference": order.order_reference,
        "report_type": order.report_type,
        "language": order.language,
        "report_data": order.report_data,
        "pdf_url": order.pdf_url,
        "created_at": order.created_at,
    }
