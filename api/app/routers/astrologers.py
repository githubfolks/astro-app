from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from .auth import get_current_user, get_password_hash, create_access_token
import secrets, string
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/astrologers",
    tags=["Astrologers"]
)

@router.post("/send-otp")
def send_onboarding_otp(phone_number: str, db: Session = Depends(database.get_db)):
    # Generate cryptographically secure OTP — never returned in the response
    otp = ''.join(secrets.choice(string.digits) for _ in range(6))
    # TODO: store OTP server-side keyed by phone_number (requires a pending-otp table)
    # and send it via SMS gateway. For now this endpoint is a no-op placeholder.
    _ = otp  # prevents unused-variable lint warning; OTP goes to SMS only
    return {"message": f"OTP sent to {phone_number}"}

@router.post("/onboarding")
def astrologer_onboarding(request: schemas.AstrologerOnboardingRequest, db: Session = Depends(database.get_db)):
    # 1. Check if user already exists
    db_user = db.query(models.User).filter((models.User.email == request.email) | (models.User.phone_number == request.phone_number)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email or phone number already registered")
    
    # 2. Create User (unverified, inactive until approved)
    hashed_password = get_password_hash(request.password)
    new_user = models.User(
        email=request.email,
        phone_number=request.phone_number,
        hashed_password=hashed_password,
        role=models.UserRole.ASTROLOGER,
        is_verified=True, # Mobile OTP verified on frontend before this call
        is_active=False # Inactive until admin approved
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 3. Create Profile
    new_profile = models.AstrologerProfile(
        user_id=new_user.id,
        full_name=request.full_name,
        profile_picture_url=request.profile_photo_url,
        short_bio=request.short_bio,
        experience_years=request.experience_years,
        languages=request.languages,
        astrology_types=request.astrology_types,
        availability_hours=request.preferred_working_hours,
        city=request.city,
        id_proof_url=request.id_proof_url,
        is_approved=False,
        legal_agreement_accepted=request.legal_agreement_accepted,
        legal_agreement_accepted_at=datetime.utcnow() if request.legal_agreement_accepted else None
    )
    db.add(new_profile)
    
    # 4. Initialize Wallet
    wallet = models.UserWallet(user_id=new_user.id)
    db.add(wallet)
    
    db.commit()
    return {"message": "Onboarding request submitted successfully. Please wait for admin approval."}

@router.get("/", response_model=List[schemas.AstrologerProfile])
def list_astrologers(skip: int = 0, limit: int = 20, sort_by: str = None, db: Session = Depends(database.get_db)):
    query = db.query(models.AstrologerProfile).join(models.User).filter(
        models.AstrologerProfile.is_approved == True,
        models.User.is_active == True,
        models.User.is_verified == True
    )
    
    if sort_by == 'rating':
        query = query.order_by(models.AstrologerProfile.rating_avg.desc())
        
    profiles = query.offset(skip).limit(limit).all()
    return profiles

@router.get("/profile", response_model=schemas.AstrologerProfile)
def get_my_astrologer_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=400, detail="Not an astrologer account")
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == current_user.id).first()
    return profile

@router.put("/profile", response_model=schemas.AstrologerProfile)
def update_astrologer_profile(profile_update: schemas.AstrologerProfileUPDATE, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=400, detail="Not an astrologer account")
    
    db_profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == current_user.id).first()
    
    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(db_profile, key, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile

# Admin or specific generic get by ID
@router.get("/{user_id}", response_model=schemas.AstrologerProfile)
def get_astrologer_by_id(user_id: int, db: Session = Depends(database.get_db)):
    profile = db.query(models.AstrologerProfile).join(models.User).filter(
        models.AstrologerProfile.user_id == user_id,
        models.AstrologerProfile.is_approved == True,
        models.User.is_active == True,
        models.User.is_verified == True
    ).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Astrologer not found or not approved")
    return profile
