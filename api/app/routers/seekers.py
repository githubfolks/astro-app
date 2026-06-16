from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database
from .auth import get_current_user

router = APIRouter(
    prefix="/seekers",
    tags=["Seekers"]
)

@router.get("/profile", response_model=schemas.SeekerProfile)
def get_seeker_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=400, detail="Not a seeker account")
    
    profile = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == current_user.id).first()
    if not profile:
        # Create empty profile if doesn't exist
        profile = models.SeekerProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=schemas.SeekerProfile)
def update_seeker_profile(profile_update: schemas.SeekerProfileCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=400, detail="Not a seeker account")
    
    profile = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == current_user.id).first()
    if not profile:
        profile = models.SeekerProfile(user_id=current_user.id)
        db.add(profile)
    
    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile
