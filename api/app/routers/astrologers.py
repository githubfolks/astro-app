from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from .auth import get_current_user

router = APIRouter(
    prefix="/astrologers",
    tags=["Astrologers"]
)

@router.get("/", response_model=List[schemas.AstrologerProfile])
def list_astrologers(skip: int = 0, limit: int = 20, db: Session = Depends(database.get_db)):
    # Assuming we want to search for astrologer profiles directly
    profiles = db.query(models.AstrologerProfile).offset(skip).limit(limit).all()
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
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Astrologer not found")
    return profile
