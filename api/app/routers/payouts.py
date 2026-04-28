from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, database, audit
from ..routers.auth import get_current_user
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
            models.Consultation.status == models.ConsultationStatus.COMPLETED
        ).all()

        total_revenue = float(sum([c.total_cost for c in consultations if c.total_cost]))
        commission_rate = float(astro.commission_percentage or 70.0) / 100.0
        gross_share = total_revenue * commission_rate

        processed_payouts = db.query(models.Payout).filter(
            models.Payout.astrologer_id == astro.user_id,
            models.Payout.status == models.PayoutStatus.PROCESSED
        ).all()
        already_paid = sum([float(p.amount) for p in processed_payouts])

        tds_amount = _compute_tds(gross_share, already_paid)
        net_payable = gross_share - tds_amount - already_paid

        if net_payable > 0:
            results.append({
                "astrologer_id": astro.user_id,
                "astrologer_name": astro.full_name,
                "total_revenue": total_revenue,
                "commission_percentage": float(astro.commission_percentage or 70.0),
                "gross_earnings": round(gross_share, 2),
                "tds_deduction": round(tds_amount, 2),
                "paid_so_far": round(already_paid, 2),
                "pending_amount": round(net_payable, 2)
            })

    return results

@router.post("/generate")
def generate_payout(
    astrologer_id: int,
    amount: float,
    tds_deducted: float = 0.0,
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_admin)
):
    """
    Create a Payout record. `amount` is the net amount after TDS.
    `tds_deducted` is the TDS withheld for record-keeping.
    """
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    payout = models.Payout(
        astrologer_id=astrologer_id,
        amount=decimal.Decimal(amount),
        status=models.PayoutStatus.PENDING,
        period_start=period_start or datetime.utcnow(),
        period_end=period_end or datetime.utcnow()
    )
    db.add(payout)
    audit.log(db, "PAYOUT_GENERATED", actor_id=current_user.id,
              resource_type="payout", resource_id=None,
              details={"astrologer_id": astrologer_id, "net_amount": amount, "tds_deducted": tds_deducted})
    db.commit()
    db.refresh(payout)
    return payout

@router.post("/{payout_id}/mark-paid")
def mark_payout_paid(
    payout_id: int, 
    transaction_reference: str, 
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_admin)
):
    """
    Mark a payout as processed (money sent).
    """
    payout = db.query(models.Payout).filter(models.Payout.id == payout_id).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout not found")
        
    payout.status = models.PayoutStatus.PROCESSED
    payout.transaction_reference = transaction_reference
    payout.processed_at = datetime.utcnow()

    audit.log(db, "PAYOUT_MARKED_PAID", actor_id=current_user.id,
              resource_type="payout", resource_id=payout_id,
              details={"astrologer_id": payout.astrologer_id, "amount": float(payout.amount), "ref": transaction_reference})
    db.commit()
    return payout
