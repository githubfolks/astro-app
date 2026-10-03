from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from .. import models, schemas, database
from .auth import get_current_user

router = APIRouter(
    prefix="/wallet",
    tags=["Wallet"]
)

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
