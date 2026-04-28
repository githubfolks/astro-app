from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from decimal import Decimal
from .. import models, database
from .auth import get_current_user, get_current_admin

router = APIRouter(prefix="/packages", tags=["Packages"])


class PackageOut(BaseModel):
    id: int
    name: str
    duration_minutes: int
    price: Decimal
    is_active: bool

    class Config:
        from_attributes = True


class PackageCreate(BaseModel):
    name: str
    duration_minutes: int
    price: Decimal


class PackageCheckout(BaseModel):
    package_id: int
    astrologer_id: int


@router.get("/", response_model=List[PackageOut])
def list_packages(db: Session = Depends(database.get_db)):
    return db.query(models.ChatPackage).filter(models.ChatPackage.is_active == True).all()


@router.post("/", response_model=PackageOut)
def create_package(
    data: PackageCreate,
    _admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    pkg = models.ChatPackage(
        name=data.name,
        duration_minutes=data.duration_minutes,
        price=data.price
    )
    db.add(pkg)
    db.commit()
    db.refresh(pkg)
    return pkg


@router.delete("/{package_id}")
def deactivate_package(
    package_id: int,
    _admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    pkg = db.query(models.ChatPackage).filter(models.ChatPackage.id == package_id).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    pkg.is_active = False
    db.commit()
    return {"status": "deactivated"}


@router.post("/checkout")
def checkout_with_package(
    data: PackageCheckout,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Buy a package and create a consultation using package time instead of wallet balance."""
    if current_user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=403, detail="Only seekers can buy packages")

    blocking_statuses = [
        models.ConsultationStatus.REQUESTED,
        models.ConsultationStatus.ACCEPTED,
        models.ConsultationStatus.ACTIVE,
        models.ConsultationStatus.PAUSED,
    ]
    existing = db.query(models.Consultation).filter(
        models.Consultation.seeker_id == current_user.id,
        models.Consultation.status.in_(blocking_statuses)
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"You already have an active consultation (id={existing.id}). End it before starting a new one."
        )

    pkg = db.query(models.ChatPackage).filter(
        models.ChatPackage.id == data.package_id,
        models.ChatPackage.is_active == True
    ).first()
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found or inactive")

    astro = db.query(models.AstrologerProfile).filter(
        models.AstrologerProfile.user_id == data.astrologer_id,
        models.AstrologerProfile.is_approved == True
    ).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    # Deduct package price from wallet
    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == current_user.id).first()
    if not wallet or float(wallet.balance) < float(pkg.price):
        raise HTTPException(status_code=400, detail="Insufficient wallet balance to purchase this package")

    wallet.balance -= pkg.price

    txn = models.WalletTransaction(
        user_id=current_user.id,
        amount=-float(pkg.price),
        transaction_type=models.TransactionType.PACKAGE_PURCHASE,
        reference_id=str(pkg.id),
        description=f"Package purchase: {pkg.name} ({pkg.duration_minutes} min)"
    )
    db.add(txn)

    # Create consultation with package time
    consultation = models.Consultation(
        seeker_id=current_user.id,
        astrologer_id=data.astrologer_id,
        consultation_type=models.ConsultationType.CHAT,
        rate_per_min=astro.consultation_fee_per_min,
        status=models.ConsultationStatus.REQUESTED,
        package_id=pkg.id,
        package_seconds_remaining=pkg.duration_minutes * 60
    )
    db.add(consultation)
    db.commit()
    db.refresh(consultation)

    return {
        "consultation_id": consultation.id,
        "package": pkg.name,
        "duration_minutes": pkg.duration_minutes,
        "package_seconds_remaining": consultation.package_seconds_remaining
    }
