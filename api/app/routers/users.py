from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database
from .auth import get_current_user
from pydantic import BaseModel

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.get("/profile", response_model=schemas.SeekerProfile)
def get_my_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=400, detail="Not a seeker account")
    profile = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == current_user.id).first()
    if not profile:
         raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/profile", response_model=schemas.SeekerProfile)
def update_my_profile(profile_update: schemas.SeekerProfileCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=400, detail="Not a seeker account")
    
    db_profile = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == current_user.id).first()
    if not db_profile:
        db_profile = models.SeekerProfile(user_id=current_user.id)
        db.add(db_profile)
    
    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(db_profile, key, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile

    db.delete(current_user) # This will cascade delete profile
    db.commit()
    return {"message": "Account deleted successfully"}

@router.get("/{user_id}/profile", response_model=schemas.SeekerProfile)
def get_user_profile(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # In a real app, strict privacy controls would be here.
    # For now, we allow fetching profile if authenticated, useful for Astrologer viewing Seeker.
    profile = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

class DeviceTokenSchema(BaseModel):
    token: str
    platform: str = "web"

@router.post("/device-token")
def register_device_token(
    data: DeviceTokenSchema,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Register a Firebase Cloud Messaging (FCM) token for push notifications.
    """
    # Check if token exists
    existing = db.query(models.DeviceToken).filter(models.DeviceToken.fcm_token == data.token).first()
    if existing:
        # Update user association if changed
        if existing.user_id != current_user.id:
            existing.user_id = current_user.id
            db.commit()
        return {"status": "updated"}
    
    # Create new
    new_token = models.DeviceToken(
        user_id=current_user.id,
        fcm_token=data.token,
        platform=data.platform
    )
    db.add(new_token)
    db.commit()
    return {"status": "registered"}
