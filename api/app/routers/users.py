from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .. import models, schemas, database
from ..services import account_deletion
from .auth import get_current_user
from pydantic import BaseModel, Field
from ..notifications import (
    WEB_PUSH_PLATFORM,
    VAPID_PUBLIC_KEY,
    web_push_configured,
    parse_web_push_subscription,
    normalize_web_push_subscription,
)

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


class AccountDeleteRequest(BaseModel):
    # Must be exactly "DELETE" — guards against an accidental or replayed call.
    confirm: str


@router.delete("/me")
def delete_my_account(
    body: AccountDeleteRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Permanently delete (anonymize) the caller's seeker account."""
    if body.confirm != "DELETE":
        raise HTTPException(status_code=400, detail='Type "DELETE" to confirm account deletion.')
    try:
        account_deletion.delete_seeker_account(db, current_user)
    except account_deletion.AccountDeletionBlocked as e:
        raise HTTPException(status_code=409, detail={"code": e.code, "message": e.message})
    return {"message": "Your account has been deleted."}

@router.get("/{user_id}/profile", response_model=schemas.SeekerProfile)
def get_user_profile(user_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.id != user_id and current_user.role != models.UserRole.ADMIN:
        has_consultation = current_user.role == models.UserRole.ASTROLOGER and db.query(models.Consultation).filter(
            models.Consultation.astrologer_id == current_user.id,
            models.Consultation.seeker_id == user_id,
        ).first() is not None
        if not has_consultation:
            raise HTTPException(status_code=403, detail="Not authorized to view this profile")

    profile = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    # Identity protection: an astrologer viewing a seeker sees only a masked name
    # (birth details stay — they are needed for the reading).
    if current_user.role == models.UserRole.ASTROLOGER and current_user.id != user_id:
        from ..services.identity import mask_name
        profile.full_name = mask_name(profile.full_name)
    return profile

@router.put("/{user_id}/profile", response_model=schemas.SeekerProfile)
def update_user_profile(user_id: int, profile_update: schemas.SeekerProfileCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.id != user_id:
        has_consultation = current_user.role == models.UserRole.ASTROLOGER and db.query(models.Consultation).filter(
            models.Consultation.astrologer_id == current_user.id,
            models.Consultation.seeker_id == user_id,
        ).first() is not None
        if not has_consultation:
            raise HTTPException(status_code=403, detail="Not authorized to edit this profile")
    
    db_profile = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == user_id).first()
    if not db_profile:
        db_profile = models.SeekerProfile(user_id=user_id)
        db.add(db_profile)
    
    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(db_profile, key, value)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile

class DeviceTokenSchema(BaseModel):
    token: str = Field(..., min_length=1, max_length=4096)
    platform: str = "web"


class WebPushConfig(BaseModel):
    public_key: str


@router.get("/web-push/config", response_model=WebPushConfig)
def get_web_push_config(current_user: models.User = Depends(get_current_user)):
    """VAPID public key the browser needs to create a push subscription."""
    if not web_push_configured():
        raise HTTPException(status_code=503, detail="Web push notifications are not configured")
    return WebPushConfig(public_key=VAPID_PUBLIC_KEY)


@router.post("/device-token")
def register_device_token(
    data: DeviceTokenSchema,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Register a push token: a native FCM token, or (platform="webpush") a
    browser Push API subscription serialized as JSON.
    """
    if data.platform == WEB_PUSH_PLATFORM:
        subscription = parse_web_push_subscription(data.token)
        if subscription is None:
            raise HTTPException(status_code=422, detail="Invalid web push subscription")
        data.token = normalize_web_push_subscription(subscription)
    elif parse_web_push_subscription(data.token) is not None:
        raise HTTPException(status_code=422, detail="Web push subscriptions must use platform 'webpush'")

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

@router.delete("/device-token")
def clear_device_token(
    data: DeviceTokenSchema,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Unregister an FCM token on logout so a device that later logs into a
    different account doesn't keep receiving this user's push notifications.
    """
    if data.platform == WEB_PUSH_PLATFORM:
        subscription = parse_web_push_subscription(data.token)
        if subscription is not None:
            data.token = normalize_web_push_subscription(subscription)
    db.query(models.DeviceToken).filter(
        models.DeviceToken.fcm_token == data.token,
        models.DeviceToken.user_id == current_user.id
    ).delete()
    db.commit()
    return {"status": "cleared"}
