from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from .. import models, database
from .auth import get_current_admin

router = APIRouter(prefix="/wallet-packages", tags=["Wallet Packages"])


class WalletPackageOut(BaseModel):
    id: int
    amount: Decimal
    bonus_amount: Decimal
    is_active: bool

    class Config:
        from_attributes = True


class WalletPackageCreate(BaseModel):
    amount: Decimal
    bonus_amount: Decimal


class WalletPackageUpdate(BaseModel):
    amount: Decimal | None = None
    bonus_amount: Decimal | None = None
    is_active: bool | None = None


@router.get("/", response_model=List[WalletPackageOut])
def list_wallet_packages(db: Session = Depends(database.get_db)):
    return (
        db.query(models.WalletPackage)
        .filter(models.WalletPackage.is_active == True)
        .order_by(models.WalletPackage.amount.asc())
        .all()
    )


@router.get("/admin", response_model=List[WalletPackageOut])
def list_all_wallet_packages(
    _admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
):
    return db.query(models.WalletPackage).order_by(models.WalletPackage.amount.asc()).all()


@router.post("/", response_model=WalletPackageOut)
def create_wallet_package(
    data: WalletPackageCreate,
    _admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    if data.bonus_amount < 0:
        raise HTTPException(status_code=400, detail="Bonus amount cannot be negative")

    pkg = models.WalletPackage(amount=data.amount, bonus_amount=data.bonus_amount)
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    return pkg


@router.patch("/{package_id}", response_model=WalletPackageOut)
def update_wallet_package(
    package_id: int,
    data: WalletPackageUpdate,
    _admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
):
    pkg = db.query(models.WalletPackage).filter(models.WalletPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    if data.amount is not None:
        if data.amount <= 0:
            raise HTTPException(status_code=400, detail="Amount must be positive")
        pkg.amount = data.amount
    if data.bonus_amount is not None:
        if data.bonus_amount < 0:
            raise HTTPException(status_code=400, detail="Bonus amount cannot be negative")
        pkg.bonus_amount = data.bonus_amount
    if data.is_active is not None:
        pkg.is_active = data.is_active

    db.commit()
    db.refresh(pkg)
    return pkg


@router.delete("/{package_id}")
def deactivate_wallet_package(
    package_id: int,
    _admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
):
    pkg = db.query(models.WalletPackage).filter(models.WalletPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    pkg.is_active = False
    db.commit()
    return {"status": "deactivated"}
