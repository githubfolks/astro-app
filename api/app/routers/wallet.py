from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from .. import models, schemas, database, audit
from .auth import get_current_user
from ..services.wallet_limits import get_wallet_cap

router = APIRouter(
    prefix="/wallet",
    tags=["Wallet"]
)

class AddMoneyRequest(BaseModel):
    user_id: int
    amount: float
    transaction_type: str = "DEPOSIT"
    description: Optional[str] = "Admin credit"
    idempotency_key: Optional[str] = None

@router.get("/balance", response_model=schemas.UserWallet)
def get_balance(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == current_user.id).first()
    if not wallet:
        # Should have been created at signup, but safe check
        wallet = models.UserWallet(user_id=current_user.id, balance=0.0)
        db.add(wallet)
        db.commit()
    return wallet

@router.get("/transactions", response_model=list[schemas.WalletTransaction])
def get_transactions(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    txns = db.query(models.WalletTransaction).filter(models.WalletTransaction.user_id == current_user.id).order_by(models.WalletTransaction.created_at.desc()).all()
    return txns

@router.post("/add-money")
def add_money(
    body: AddMoneyRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    try:
        transaction_type = models.TransactionType(body.transaction_type)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid transaction_type")

    target_user = db.query(models.User).filter(models.User.id == body.user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.idempotency_key:
        existing = db.query(models.WalletTransaction).filter(
            models.WalletTransaction.idempotency_key == body.idempotency_key
        ).first()
        if existing:
            wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == body.user_id).first()
            return {"balance": float(wallet.balance) if wallet else 0.0, "message": "Money already added"}

    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == body.user_id).first()
    if not wallet:
        wallet = models.UserWallet(user_id=body.user_id, balance=Decimal("0.00"))
        db.add(wallet)

    new_balance = Decimal(str(wallet.balance)) + Decimal(str(body.amount))

    cap = get_wallet_cap(target_user)
    if cap is not None and new_balance > cap:
        raise HTTPException(
            status_code=400,
            detail=f"This credit would exceed the maximum wallet balance of ₹{cap} allowed for this user."
        )

    wallet.balance = new_balance

    txn = models.WalletTransaction(
        user_id=body.user_id,
        amount=Decimal(str(body.amount)),
        transaction_type=transaction_type,
        description=body.description or "Admin credit",
        idempotency_key=body.idempotency_key,
    )
    db.add(txn)

    audit.log(
        db,
        action="WALLET_ADJUSTED",
        actor_id=current_user.id,
        resource_type="user",
        resource_id=body.user_id,
        details={
            "adjustment_amount": body.amount,
            "new_balance": float(new_balance),
            "description": body.description,
        }
    )

    try:
        db.commit()
    except IntegrityError:
        # Lost the race to a concurrent request with the same idempotency key.
        db.rollback()
        wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == body.user_id).first()
        return {"balance": float(wallet.balance) if wallet else 0.0, "message": "Money already added"}

    db.refresh(wallet)
    return {"balance": float(wallet.balance), "message": "Money added successfully"}
