from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from datetime import datetime
from .. import models, database, audit
from .auth import get_current_user, get_current_admin

router = APIRouter(prefix="/disputes", tags=["Disputes"])


class DisputeCreate(BaseModel):
    consultation_id: int
    reason: str


class DisputeOut(BaseModel):
    id: int
    consultation_id: int
    raised_by_id: int
    reason: str
    status: str
    admin_notes: Optional[str]
    resolution_amount: Optional[Decimal]
    created_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class DisputeResolve(BaseModel):
    status: str  # RESOLVED or REJECTED or INVESTIGATING
    admin_notes: Optional[str] = None
    refund_amount: Optional[Decimal] = None  # Only for RESOLVED


@router.post("/", response_model=DisputeOut)
def raise_dispute(
    data: DisputeCreate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    consultation = db.query(models.Consultation).filter(
        models.Consultation.id == data.consultation_id
    ).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if current_user.role not in (models.UserRole.SEEKER, models.UserRole.ASTROLOGER):
        raise HTTPException(status_code=403, detail="Only seekers or astrologers can raise disputes")

    # Verify the user is a participant in this consultation
    is_participant = (
        consultation.seeker_id == current_user.id or
        consultation.astrologer_id == current_user.id
    )
    if not is_participant:
        raise HTTPException(status_code=403, detail="You are not a participant in this consultation")

    # Prevent duplicate open disputes for same consultation by same user
    existing = db.query(models.Dispute).filter(
        models.Dispute.consultation_id == data.consultation_id,
        models.Dispute.raised_by_id == current_user.id,
        models.Dispute.status == models.DisputeStatus.OPEN
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An open dispute already exists for this consultation")

    dispute = models.Dispute(
        consultation_id=data.consultation_id,
        raised_by_id=current_user.id,
        reason=data.reason
    )
    db.add(dispute)
    audit.log(db, "DISPUTE_RAISED", actor_id=current_user.id,
              resource_type="consultation", resource_id=data.consultation_id,
              details={"reason": data.reason[:200]})
    db.commit()
    db.refresh(dispute)
    return dispute


@router.get("/my", response_model=List[DisputeOut])
def my_disputes(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    return db.query(models.Dispute).filter(
        models.Dispute.raised_by_id == current_user.id
    ).order_by(models.Dispute.created_at.desc()).all()


@router.get("/", response_model=List[DisputeOut])
def list_all_disputes(
    status: Optional[str] = None,
    _admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    q = db.query(models.Dispute)
    if status:
        q = q.filter(models.Dispute.status == status)
    return q.order_by(models.Dispute.created_at.desc()).all()


@router.put("/{dispute_id}", response_model=DisputeOut)
def resolve_dispute(
    dispute_id: int,
    data: DisputeResolve,
    _admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    valid_statuses = {s.value for s in models.DisputeStatus}
    if data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Choose from: {valid_statuses}")

    dispute = db.query(models.Dispute).filter(models.Dispute.id == dispute_id).first()
    if not dispute:
        raise HTTPException(status_code=404, detail="Dispute not found")

    if dispute.status in (models.DisputeStatus.RESOLVED, models.DisputeStatus.REJECTED):
        raise HTTPException(status_code=400, detail="Dispute is already closed")

    dispute.status = data.status
    dispute.admin_notes = data.admin_notes

    if data.status == models.DisputeStatus.RESOLVED and data.refund_amount and data.refund_amount > 0:
        consultation = db.query(models.Consultation).filter(
            models.Consultation.id == dispute.consultation_id
        ).first()
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")

        seeker_wallet = db.query(models.UserWallet).filter(
            models.UserWallet.user_id == consultation.seeker_id
        ).first()
        if not seeker_wallet:
            raise HTTPException(status_code=404, detail="Seeker wallet not found")

        seeker_wallet.balance += data.refund_amount
        dispute.resolution_amount = data.refund_amount

        txn = models.WalletTransaction(
            user_id=consultation.seeker_id,
            amount=float(data.refund_amount),
            transaction_type=models.TransactionType.CHAT_REFUND,
            reference_id=str(dispute.consultation_id),
            description=f"Dispute #{dispute_id} refund"
        )
        db.add(txn)

    if data.status in (models.DisputeStatus.RESOLVED, models.DisputeStatus.REJECTED):
        dispute.resolved_at = datetime.utcnow()

    audit.log(db, "DISPUTE_UPDATED", actor_id=_admin.id,
              resource_type="dispute", resource_id=dispute_id,
              details={"new_status": data.status, "refund_amount": float(data.refund_amount or 0)})
    db.commit()
    db.refresh(dispute)
    return dispute
