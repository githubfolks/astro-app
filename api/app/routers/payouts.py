from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, database, audit
from ..routers.auth import get_current_user
from ..services.email_service import send_email, build_payout_processed_email
from typing import List, Optional
from datetime import datetime, timedelta
import decimal

router = APIRouter(
    prefix="/admin/payouts",
    tags=["Admin - Payouts"]
)

# Dependency to check for Admin Role
def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access admin resources"
        )
    return current_user

# TDS rate under Section 194J (professional services) for India
TDS_RATE = 0.10  # 10%
TDS_THRESHOLD_INR = 30_000  # TDS applies only when cumulative earnings exceed this

# Payment gateway cost passed through to the astrologer, applied to every payout (no threshold)
PG_CHARGE_RATE = 0.03  # 3%


def _compute_tds(gross_earnings: float, already_paid: float) -> float:
    """
    TDS is deducted only on the portion of cumulative gross earnings that
    exceed the TDS_THRESHOLD_INR. `already_paid` represents prior payouts
    (assumed to have already borne their TDS share).
    """
    taxable_total = max(0.0, gross_earnings - TDS_THRESHOLD_INR)
    tds_on_total = taxable_total * TDS_RATE
    # Tax already notionally deducted on prior payouts (proportional)
    prior_taxable = max(0.0, already_paid - TDS_THRESHOLD_INR)
    tds_already_borne = prior_taxable * TDS_RATE
    return max(0.0, tds_on_total - tds_already_borne)


def _compute_pg_charge(gross_earnings: float, already_borne_pg: float) -> float:
    """
    Flat 3% payment-gateway charge on cumulative gross earnings, minus whatever
    PG charge was already withheld on prior payouts.
    """
    pg_on_total = gross_earnings * PG_CHARGE_RATE
    return max(0.0, pg_on_total - already_borne_pg)


@router.get("/pending")
def get_pending_earnings(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_admin)):
    """
    Calculate pending earnings for all astrologers including TDS deduction.
    Formula: (Total Revenue * Commission %) - TDS (10% above ₹30k) - Already Paid.
    """
    results = []
    astrologers = db.query(models.AstrologerProfile).all()

    for astro in astrologers:
        consultations = db.query(models.Consultation).filter(
            models.Consultation.astrologer_id == astro.user_id,
            models.Consultation.status.in_([
                models.ConsultationStatus.COMPLETED,
                models.ConsultationStatus.AUTO_ENDED,
            ])
        ).all()

        total_revenue = float(sum([c.total_cost for c in consultations if c.total_cost]))
        commission_rate = float(astro.commission_percentage or 70.0) / 100.0
        gross_share = total_revenue * commission_rate

        processed_payouts = db.query(models.Payout).filter(
            models.Payout.astrologer_id == astro.user_id,
            models.Payout.status == models.PayoutStatus.PROCESSED
        ).all()
        already_paid = sum([float(p.amount) for p in processed_payouts])
        pg_already_borne = sum([float(p.pg_charge_deducted or 0) for p in processed_payouts])

        tds_amount = _compute_tds(gross_share, already_paid)
        pg_charge_amount = _compute_pg_charge(gross_share, pg_already_borne)
        net_payable = gross_share - tds_amount - pg_charge_amount - already_paid

        if net_payable > 0:
            results.append({
                "astrologer_id": astro.user_id,
                "astrologer_name": astro.full_name,
                "phone_number": astro.user.phone_number if astro.user else None,
                "total_revenue": total_revenue,
                "commission_percentage": float(astro.commission_percentage or 70.0),
                "gross_earnings": round(gross_share, 2),
                "tds_deduction": round(tds_amount, 2),
                "pg_charge": round(pg_charge_amount, 2),
                "paid_so_far": round(already_paid, 2),
                "pending_amount": round(net_payable, 2)
            })

    return results

@router.post("/generate")
def generate_payout(
    astrologer_id: int,
    amount: float,
    tds_deducted: float = 0.0,
    pg_charge_deducted: float = 0.0,
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """
    Create a Payout record. `amount` is the net amount after TDS and PG charge.
    `tds_deducted` and `pg_charge_deducted` are withheld amounts for record-keeping.
    """
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    payout = models.Payout(
        astrologer_id=astrologer_id,
        amount=decimal.Decimal(amount),
        tds_deducted=decimal.Decimal(tds_deducted),
        pg_charge_deducted=decimal.Decimal(pg_charge_deducted),
        status=models.PayoutStatus.PENDING,
        period_start=period_start or datetime.utcnow(),
        period_end=period_end or datetime.utcnow()
    )
    db.add(payout)
    audit.log(db, "PAYOUT_GENERATED", actor_id=current_user.id,
              resource_type="payout", resource_id=None,
              details={"astrologer_id": astrologer_id, "net_amount": amount, "tds_deducted": tds_deducted, "pg_charge_deducted": pg_charge_deducted})
    db.commit()
    db.refresh(payout)
    return payout

@router.post("/{payout_id}/mark-paid")
def mark_payout_paid(
    payout_id: int,
    transaction_reference: str,
    background_tasks: BackgroundTasks,
    payout_date: Optional[str] = None,
    comments: Optional[str] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """
    Mark a payout as processed (money sent).
    """
    payout = db.query(models.Payout).filter(models.Payout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")

    # Capture values before commit (avoids post-commit lazy-load issues)
    astrologer_email = payout.astrologer.email if payout.astrologer else None
    payout_amount = float(payout.amount)
    tds_amount = float(payout.tds_deducted or 0)
    pg_charge_amount = float(payout.pg_charge_deducted or 0)

    payout.status = models.PayoutStatus.PROCESSED
    payout.transaction_reference = transaction_reference
    payout.admin_comments = comments

    if payout_date:
        try:
            if "T" in payout_date:
                # Remove Z or offset if present
                clean_date = payout_date.replace("Z", "").split("+")[0]
                payout.processed_at = datetime.fromisoformat(clean_date)
            else:
                payout.processed_at = datetime.strptime(payout_date, "%Y-%m-%d")
        except Exception:
            payout.processed_at = datetime.utcnow()
    else:
        payout.processed_at = datetime.utcnow()

    audit.log(db, "PAYOUT_MARKED_PAID", actor_id=current_user.id,
              resource_type="payout", resource_id=payout_id,
              details={"astrologer_id": payout.astrologer_id, "amount": payout_amount, "ref": transaction_reference})
    db.commit()

    if astrologer_email:
        payment_date_str = payout.processed_at.strftime("%Y-%m-%d")
        subject, html_body = build_payout_processed_email(
            float(payout_amount), transaction_reference, float(tds_amount), payment_date_str, comments,
            pg_charge=float(pg_charge_amount)
        )
        send_email(background_tasks, [astrologer_email], subject, html_body)

    return payout


@router.get("/history")
def get_all_payouts_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """
    Get all processed and generated payouts for admin reporting.
    """
    payouts = db.query(models.Payout).order_by(models.Payout.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "astrologer_id": p.astrologer_id,
            "astrologer_name": p.astrologer.astrologer_profile.full_name if p.astrologer and p.astrologer.astrologer_profile else "Unknown",
            "phone_number": p.astrologer.phone_number if p.astrologer else None,
            "amount": float(p.amount),
            "tds_deducted": float(p.tds_deducted or 0),
            "pg_charge_deducted": float(p.pg_charge_deducted or 0),
            "status": p.status,
            "period_start": p.period_start,
            "period_end": p.period_end,
            "transaction_reference": p.transaction_reference,
            "admin_comments": p.admin_comments,
            "created_at": p.created_at,
            "processed_at": p.processed_at
        }
        for p in payouts
    ]
