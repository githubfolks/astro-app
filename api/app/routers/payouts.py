from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models, database
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

@router.get("/pending")
def get_pending_earnings(db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_admin)):
    """
    Calculate pending earnings for all astrologers.
    Formula: (Total Chat Revenue * Commission %) - Already Paid.
    """
    # This logic is simplified. In production, we should mark specific transactions as "paid".
    # For now, we aggregate.
    
    results = []
    astrologers = db.query(models.AstrologerProfile).all()
    
    for astro in astrologers:
        # Total Earnings (Revenue Share)
        # 1. Get all completed consultations
        consultations = db.query(models.Consultation).filter(
            models.Consultation.astrologer_id == astro.user_id,
            models.Consultation.status == models.ConsultationStatus.COMPLETED
        ).all()
        
        total_revenue = sum([c.total_cost for c in consultations if c.total_cost])
        commission_rate = (astro.commission_percentage or 70.0) / 100.0
        astrologer_share_total = float(total_revenue) * float(commission_rate)
        
        # 2. Get already processed payouts
        payouts = db.query(models.Payout).filter(
            models.Payout.astrologer_id == astro.user_id,
            models.Payout.status == models.PayoutStatus.PROCESSED
        ).all()
        
        already_paid = sum([float(p.amount) for p in payouts])
        
        pending_amount = astrologer_share_total - already_paid
        
        if pending_amount > 0:
            results.append({
                "astrologer_id": astro.user_id,
                "astrologer_name": astro.full_name,
                "total_revenue": float(total_revenue),
                "commission_percentage": float(astro.commission_percentage or 70.0),
                "total_earnings": astrologer_share_total,
                "paid_so_far": already_paid,
                "pending_amount": pending_amount
            })
            
    return results

@router.post("/generate")
def generate_payout(
    astrologer_id: int, 
    amount: float,
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(get_current_admin)
):
    """
    Create a Payout record.
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
    
    # Also record as a Wallet Transaction (Withdrawal) for record keeping?
    # Or just keep it in Payouts table? 
    # Let's keep Payouts table as the source of truth for Astrologer earnings.
    
    db.commit()
    return payout
