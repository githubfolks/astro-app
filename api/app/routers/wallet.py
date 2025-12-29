from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database
from .auth import get_current_user
from datetime import datetime

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

@router.post("/add-money", response_model=schemas.UserWallet)
def add_money(transaction: schemas.WalletTransactionBase, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if transaction.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == current_user.id).first()
    if not wallet:
         wallet = models.UserWallet(user_id=current_user.id, balance=0.0)
         db.add(wallet)
    
    # Update Balance
    wallet.balance += transaction.amount
    
    # Record Transaction
    txn = models.WalletTransaction(
        user_id=current_user.id,
        amount=transaction.amount,
        transaction_type=models.TransactionType.DEPOSIT,
        description=transaction.description or "Add Money",
        reference_id=transaction.reference_id
    )
    db.add(txn)
    
    db.commit()
    db.refresh(wallet)
    return wallet

@router.get("/transactions", response_model=list[schemas.WalletTransaction])
def get_transactions(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    txns = db.query(models.WalletTransaction).filter(models.WalletTransaction.user_id == current_user.id).order_by(models.WalletTransaction.created_at.desc()).all()
    return txns
