from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from .auth import get_current_user, get_password_hash, create_access_token
import re, unicodedata
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/astrologers",
    tags=["Astrologers"]
)


def _slugify(text: str) -> str:
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-') or 'astrologer'


def generate_astrologer_slug(full_name: str, user_id: int, db: Session) -> str:
    base = _slugify(full_name)
    if not db.query(models.AstrologerProfile).filter(models.AstrologerProfile.slug == base).first():
        return base
    return f"{base}-{user_id}"


_BUSY_STATUSES = [
    models.ConsultationStatus.ACCEPTED,
    models.ConsultationStatus.ACTIVE,
    models.ConsultationStatus.PAUSED,
]


def _apply_availability(profile: models.AstrologerProfile, queue_length: int, is_busy: bool):
    """Attach computed availability_status + queue_length to a profile instance
    so they serialize through schemas.AstrologerProfile."""
    from .realtime import is_present

    # Identity protection: seekers see the public stage name, never the legal name.
    if profile.display_name:
        profile.full_name = profile.display_name

    profile.queue_length = queue_length

    if not profile.is_online or not is_present(profile.user_id):
        profile.availability_status = "OFFLINE"
    elif is_busy:
        profile.availability_status = "BUSY"
    else:
        profile.availability_status = "ONLINE"
    return profile


def _decorate_availability(db: Session, profile: models.AstrologerProfile):
    queue_length = db.query(models.Consultation).filter(
        models.Consultation.astrologer_id == profile.user_id,
        models.Consultation.status == models.ConsultationStatus.REQUESTED,
    ).count()
    is_busy = db.query(models.Consultation).filter(
        models.Consultation.astrologer_id == profile.user_id,
        models.Consultation.status.in_(_BUSY_STATUSES),
    ).first() is not None
    return _apply_availability(profile, queue_length, is_busy)


def _decorate_availability_bulk(db: Session, profiles: List[models.AstrologerProfile]):
    """Batch variant of _decorate_availability: two grouped queries for the whole
    page instead of two queries per profile."""
    ids = [p.user_id for p in profiles]
    if not ids:
        return profiles

    queue_counts = dict(
        db.query(models.Consultation.astrologer_id, func.count(models.Consultation.id))
        .filter(
            models.Consultation.astrologer_id.in_(ids),
            models.Consultation.status == models.ConsultationStatus.REQUESTED,
        )
        .group_by(models.Consultation.astrologer_id)
        .all()
    )
    busy_ids = {
        row[0]
        for row in db.query(models.Consultation.astrologer_id)
        .filter(
            models.Consultation.astrologer_id.in_(ids),
            models.Consultation.status.in_(_BUSY_STATUSES),
        )
        .distinct()
        .all()
    }

    for p in profiles:
        _apply_availability(p, queue_counts.get(p.user_id, 0), p.user_id in busy_ids)
    return profiles


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
        is_verified=True, # Email is the verification/identity channel; admin approval gates activation
        is_active=False # Inactive until admin approved
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. Create Profile
    slug = generate_astrologer_slug(request.full_name, new_user.id, db)
    new_profile = models.AstrologerProfile(
        user_id=new_user.id,
        slug=slug,
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

    # Premium astrologers always surface first, regardless of the secondary sort.
    if sort_by == 'rating':
        query = query.order_by(models.AstrologerProfile.is_premium.desc(), models.AstrologerProfile.rating_avg.desc())
    else:
        query = query.order_by(models.AstrologerProfile.is_premium.desc())

    profiles = query.offset(skip).limit(limit).all()
    _decorate_availability_bulk(db, profiles)
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

    was_online = bool(db_profile.is_online)

    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(db_profile, key, value)

    db.commit()
    db.refresh(db_profile)

    # If the astrologer just came online, alert seekers who asked to be notified.
    if not was_online and db_profile.is_online:
        _notify_waiting_seekers(db, current_user.id)
        from .realtime import broadcast_event, is_present
        if is_present(current_user.id):
            broadcast_event({"type": "ASTRO_ONLINE", "astrologer_id": current_user.id})
    elif was_online and not db_profile.is_online:
        from .realtime import broadcast_event
        broadcast_event({"type": "ASTRO_OFFLINE", "astrologer_id": current_user.id})

    return db_profile


def _notify_waiting_seekers(db: Session, astrologer_id: int):
    from ..notifications import send_push_notification
    from .realtime import notify_user

    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == astrologer_id).first()
    astro_name = (profile.display_name or profile.full_name) if profile else "An astrologer"

    subs = db.query(models.AvailabilityNotification).filter(
        models.AvailabilityNotification.astrologer_id == astrologer_id,
        models.AvailabilityNotification.notified == False,  # noqa: E712
    ).all()
    for sub in subs:
        notify_user(sub.seeker_id, {"type": "ASTRO_ONLINE", "astrologer_id": astrologer_id})
        try:
            for tok in db.query(models.DeviceToken).filter(models.DeviceToken.user_id == sub.seeker_id).all():
                send_push_notification(
                    token=tok.fcm_token,
                    title=f"{astro_name} is online",
                    body=f"{astro_name} is now available to chat.",
                    data={"astrologer_id": str(astrologer_id), "type": "ASTRO_ONLINE"},
                )
        except Exception as e:
            print(f"notify waiting seeker push failed: {e}")

        # Send WhatsApp alert to seeker
        try:
            from ..services.whatsapp_service import send_whatsapp
            if sub.seeker and sub.seeker.phone_number:
                send_whatsapp(
                    to_phone=sub.seeker.phone_number,
                    template_key="waplex_template_astrologer_online",
                    params={"astrologer_name": astro_name}
                )
        except Exception as e:
            print(f"notify waiting seeker WhatsApp failed: {e}")

        sub.notified = True
    db.commit()


@router.post("/{astrologer_id}/notify-when-online")
def notify_when_online(astrologer_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    """Seeker subscribes to be alerted when an offline astrologer comes online."""
    if current_user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=400, detail="Only seekers can subscribe to availability alerts")

    astro = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == astrologer_id).first()
    if not astro:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    # Send WhatsApp notification to the astrologer (always triggered on click)
    try:
        from ..services.whatsapp_service import send_whatsapp
        seeker_name = (current_user.seeker_profile.full_name if current_user.seeker_profile else None) or "Seeker"
        if astro.user and astro.user.phone_number:
            send_whatsapp(
                to_phone=astro.user.phone_number,
                template_key="waplex_template_notify_astrologer",
                params={"seeker_name": seeker_name}
            )
    except Exception as e:
        print(f"Failed to send notify WhatsApp message to astrologer: {e}")

    existing = db.query(models.AvailabilityNotification).filter(
        models.AvailabilityNotification.seeker_id == current_user.id,
        models.AvailabilityNotification.astrologer_id == astrologer_id,
        models.AvailabilityNotification.notified == False,  # noqa: E712
    ).first()
    if existing:
        return {"status": "already_subscribed"}

    db.add(models.AvailabilityNotification(seeker_id=current_user.id, astrologer_id=astrologer_id))
    db.commit()
    return {"status": "subscribed"}

@router.get("/{identifier}", response_model=schemas.AstrologerProfile)
def get_astrologer_by_identifier(identifier: str, db: Session = Depends(database.get_db)):
    """Fetch an astrologer profile by numeric user_id (legacy) or slug."""
    base_query = db.query(models.AstrologerProfile).join(models.User).filter(
        models.AstrologerProfile.is_approved == True,
        models.User.is_active == True,
        models.User.is_verified == True
    )
    if identifier.isdigit():
        profile = base_query.filter(models.AstrologerProfile.user_id == int(identifier)).first()
    else:
        profile = base_query.filter(models.AstrologerProfile.slug == identifier).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Astrologer not found or not approved")
    _decorate_availability(db, profile)
    return profile


@router.get("/payouts/history")
def get_payout_history(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get payout history for the logged-in astrologer.
    """
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=403, detail="Only astrologers can view their payout history")

    payouts = db.query(models.Payout).filter(
        models.Payout.astrologer_id == current_user.id
    ).order_by(models.Payout.created_at.desc()).all()

    return [
        {
            "id": p.id,
            "amount": float(p.amount),
            "tds_deducted": float(p.tds_deducted or 0),
            "status": p.status,
            "period_start": p.period_start,
            "period_end": p.period_end,
            "transaction_reference": p.transaction_reference,
            "admin_comments": p.admin_comments,
            "created_at": p.created_at,
            "processed_at": p.processed_at
        }
        for p in payouts
    ]

