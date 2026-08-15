from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Request
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..services import email_service
from ..limiter import limiter
from .auth import get_current_user, get_current_user_optional, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM
from jose import JWTError, jwt
import re, unicodedata, uuid, os, io
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from PIL import Image
import pillow_heif

# Lets Pillow open HEIC/HEIF (the default photo format on iPhones) so we can
# convert it to JPEG on upload — browsers can't render HEIC in <img> tags.
pillow_heif.register_heif_opener()

router = APIRouter(
    prefix="/astrologers",
    tags=["Astrologers"]
)


def _format_availability_hours(start, end) -> str:
    """Renders a start/end time pair as the display string shown on seeker-facing
    cards/profiles, e.g. "9:00 AM - 6:00 PM"."""
    fmt = lambda t: t.strftime('%I:%M %p').lstrip('0')
    return f"{fmt(start)} - {fmt(end)}"


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

_IST = ZoneInfo("Asia/Kolkata")


def is_within_availability_window(profile: models.AstrologerProfile) -> bool:
    """Whether right now falls inside the astrologer's daily availability window.
    An astrologer who hasn't set a window is treated as always available for Knock."""
    start, end = profile.availability_start_time, profile.availability_end_time
    if not start or not end:
        return True
    now = datetime.now(_IST).time()
    if start <= end:
        return start <= now <= end
    return now >= start or now <= end  # window spans midnight, e.g. 22:00-06:00


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
        profile.knockable = is_within_availability_window(profile)
    elif is_busy:
        profile.availability_status = "BUSY"
        profile.knockable = False
    else:
        profile.availability_status = "ONLINE"
        profile.knockable = False
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


def _decorate_review_count(db: Session, profile: models.AstrologerProfile):
    """Attach the real Review row count backing rating_avg (same basis: all
    reviews for this astrologer, not just publicly-displayed ones) so callers
    never have to fabricate a reviewCount for structured data or UI."""
    profile.total_reviews = db.query(models.Review).filter(
        models.Review.astrologer_id == profile.user_id
    ).count()
    return profile


def _decorate_review_count_bulk(db: Session, profiles: List[models.AstrologerProfile]):
    ids = [p.user_id for p in profiles]
    if not ids:
        return profiles
    counts = dict(
        db.query(models.Review.astrologer_id, func.count(models.Review.id))
        .filter(models.Review.astrologer_id.in_(ids))
        .group_by(models.Review.astrologer_id)
        .all()
    )
    for p in profiles:
        p.total_reviews = counts.get(p.user_id, 0)
    return profiles


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


@router.post("/onboarding/photo")
@limiter.limit("10/minute")
async def upload_onboarding_photo(request: Request, file: UploadFile = File(...)):
    """
    Public, unauthenticated upload for the applicant's profile photo during
    astrologer onboarding (applicant has no account/token yet at this point).
    Rate-limited and restricted to images only — separate from the admin-only
    /admin/upload endpoint used elsewhere for documents.
    """
    MAX_FILE_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (Max 5MB)")
    await file.seek(0)

    # Content-Type is only a sanity check here (browsers/OSes emit inconsistent
    # values for the same file — e.g. "image/jpg" instead of "image/jpeg"); the
    # extension allow-list below is the strict gate on what actually gets stored
    # and served back.
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")

    # HEIC/HEIF (the default iPhone camera format) is accepted but converted to
    # JPEG below, since most browsers can't render HEIC in an <img> tag.
    HEIF_EXTENSIONS = {".heic", ".heif"}
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"} | HEIF_EXTENSIONS
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension {file_ext} not allowed. Please upload a JPG, PNG, or WEBP image.")

    # Largest size this photo is ever displayed at (astrologer profile page,
    # w-52 h-52 @ 2x for retina) — downscaling phone-camera originals (often
    # 3000px+) to this before saving avoids shipping multi-MB avatars to a
    # ~200px <img>.
    MAX_DIMENSION = 800

    try:
        UPLOAD_DIR = "uploads/astrologer_onboarding"
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        if file_ext in HEIF_EXTENSIONS:
            try:
                image = Image.open(io.BytesIO(content)).convert("RGB")
            except Exception:
                raise HTTPException(status_code=400, detail="Could not read this HEIC/HEIF photo. Please try a JPG or PNG instead.")
            image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
            filename = f"{uuid.uuid4().hex}.jpg"
            file_path = os.path.join(UPLOAD_DIR, filename)
            image.save(file_path, format="JPEG", quality=85, optimize=True)
        else:
            try:
                image = Image.open(io.BytesIO(content))
                image_format = image.format  # JPEG / PNG / WEBP
                if image.mode not in ("RGB", "RGBA"):
                    image = image.convert("RGBA" if "A" in image.mode else "RGB")
                image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.LANCZOS)
            except Exception:
                raise HTTPException(status_code=400, detail="Could not read this image. Please try a JPG, PNG, or WEBP instead.")

            filename = f"{uuid.uuid4().hex}{file_ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            save_kwargs = {"optimize": True}
            if image_format == "JPEG":
                if image.mode == "RGBA":
                    image = image.convert("RGB")
                save_kwargs["quality"] = 85
            elif image_format == "WEBP":
                save_kwargs["quality"] = 85
            image.save(file_path, format=image_format, **save_kwargs)

        return {"url": f"/static/astrologer_onboarding/{filename}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")


@router.post("/onboarding")
def astrologer_onboarding(
    request: schemas.AstrologerOnboardingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db)
):
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
        availability_hours=_format_availability_hours(request.availability_start_time, request.availability_end_time),
        availability_start_time=request.availability_start_time,
        availability_end_time=request.availability_end_time,
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

    subject, html = email_service.build_profile_submitted_email(request.full_name)
    email_service.send_email(background_tasks, [request.email], subject, html)

    return {"message": "Onboarding request submitted successfully. Please wait for admin approval."}

def _restricted_visibility_filter(db: Session, current_user):
    """Restricted astrologers are hidden from everyone except the seekers
    explicitly allow-listed for them (see AstrologerAllowedSeeker)."""
    if current_user is not None and current_user.role == models.UserRole.SEEKER:
        allowed_ids = [
            row[0] for row in db.query(models.AstrologerAllowedSeeker.astrologer_id)
            .filter(models.AstrologerAllowedSeeker.seeker_id == current_user.id)
            .all()
        ]
        if allowed_ids:
            return (models.AstrologerProfile.is_restricted == False) | (
                models.AstrologerProfile.user_id.in_(allowed_ids)
            )
    return models.AstrologerProfile.is_restricted == False


@router.get("/", response_model=List[schemas.AstrologerProfile])
def list_astrologers(
    skip: int = 0,
    limit: int = 20,
    sort_by: str = None,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user_optional),
):
    query = db.query(models.AstrologerProfile).join(models.User).filter(
        models.AstrologerProfile.is_approved == True,
        models.AstrologerProfile.onboarding_stage == models.OnboardingStage.COMPLETED,
        models.User.is_active == True,
        models.User.is_verified == True,
        _restricted_visibility_filter(db, current_user),
    )

    # Premium astrologers always surface first, regardless of the secondary sort.
    if sort_by == 'rating':
        query = query.order_by(models.AstrologerProfile.is_premium.desc(), models.AstrologerProfile.rating_avg.desc())
    elif sort_by == 'top':
        # Rating-led ranking (e.g. the "Talk to a Verified Astrologer" panel):
        # rating first, then the trending/VIP/premium badges only as tiebreakers.
        query = query.order_by(
            models.AstrologerProfile.rating_avg.desc(),
            models.AstrologerProfile.is_trending.desc(),
            models.AstrologerProfile.is_vip.desc(),
            models.AstrologerProfile.is_premium.desc(),
        )
    else:
        query = query.order_by(models.AstrologerProfile.is_premium.desc())

    profiles = query.offset(skip).limit(limit).all()
    _decorate_availability_bulk(db, profiles)
    _decorate_review_count_bulk(db, profiles)
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
    update_fields = profile_update.dict(exclude_unset=True)

    # Editing any KYC field invalidates a prior admin verification — force re-review.
    KYC_FIELDS = {
        "pan_number", "pan_doc_url", "aadhaar_number", "aadhaar_doc_url", "aadhaar_doc_back_url",
        "bank_account_holder_name", "bank_account_number", "bank_ifsc",
    }
    if db_profile.kyc_verified and KYC_FIELDS & update_fields.keys():
        db_profile.kyc_verified = False
        db_profile.kyc_verified_at = None

    for key, value in update_fields.items():
        setattr(db_profile, key, value)

    # Seeker-facing display text is always derived from the Knock window,
    # never entered directly (see AstrologerProfileUPDATE).
    if "availability_start_time" in update_fields or "availability_end_time" in update_fields:
        if db_profile.availability_start_time and db_profile.availability_end_time:
            db_profile.availability_hours = _format_availability_hours(
                db_profile.availability_start_time, db_profile.availability_end_time
            )
        else:
            db_profile.availability_hours = None

    db.commit()
    db.refresh(db_profile)

    # If the astrologer just came online, alert seekers who asked to be notified.
    if not was_online and db_profile.is_online:
        db.add(models.AstrologerOnlineSession(astrologer_id=current_user.id))
        db.commit()
        _notify_waiting_seekers(db, current_user.id)
        from .realtime import broadcast_event, is_present
        if is_present(current_user.id):
            broadcast_event({"type": "ASTRO_ONLINE", "astrologer_id": current_user.id})
    elif was_online and not db_profile.is_online:
        open_session = db.query(models.AstrologerOnlineSession).filter(
            models.AstrologerOnlineSession.astrologer_id == current_user.id,
            models.AstrologerOnlineSession.ended_at.is_(None)
        ).order_by(models.AstrologerOnlineSession.started_at.desc()).first()
        if open_session:
            open_session.ended_at = datetime.utcnow()
            db.commit()
        from .realtime import broadcast_event
        broadcast_event({"type": "ASTRO_OFFLINE", "astrologer_id": current_user.id})

    return db_profile


@router.put("/phone-number")
def update_own_phone_number(
    body: schemas.PhoneNumberUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=400, detail="Not an astrologer account")

    existing = db.query(models.User).filter(
        models.User.phone_number == body.phone_number,
        models.User.id != current_user.id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already in use")

    current_user.phone_number = body.phone_number
    db.commit()

    return {"phone_number": current_user.phone_number}


@router.post("/force-offline", status_code=204)
def force_offline(request: Request, db: Session = Depends(database.get_db)):
    """Flips an astrologer offline even when their access token has expired.

    The frontend's global 401 handler hits this when a normal `PUT /profile`
    call would itself 401 (token already expired/invalid) and can't reach the
    usual logout flow — without it, `is_online` stays stuck true forever after
    a silent session expiry. Signature is still verified; only the expiry
    claim is ignored, so a tampered or forged token is rejected same as usual.
    """
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return
    token = auth_header[len("Bearer "):]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        user_id = payload.get("sub")
    except JWTError:
        return
    if user_id is None:
        return

    db_profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == int(user_id)).first()
    if not db_profile or not db_profile.is_online:
        return

    db_profile.is_online = False
    open_session = db.query(models.AstrologerOnlineSession).filter(
        models.AstrologerOnlineSession.astrologer_id == db_profile.user_id,
        models.AstrologerOnlineSession.ended_at.is_(None)
    ).order_by(models.AstrologerOnlineSession.started_at.desc()).first()
    if open_session:
        open_session.ended_at = datetime.utcnow()
    db.commit()

    from .realtime import broadcast_event
    broadcast_event({"type": "ASTRO_OFFLINE", "astrologer_id": db_profile.user_id})


# --- Post-login onboarding checklist: KYC docs, gallery, certificates -------
# Shared authenticated upload used for KYC ID proofs, gallery photos, and
# certificates — images and PDFs, unlike the public/image-only onboarding
# photo endpoint above.
@router.post("/documents/upload")
def upload_astrologer_document(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
):
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=400, detail="Not an astrologer account")

    MAX_FILE_SIZE = 5 * 1024 * 1024
    content = file.file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (Max 5MB)")

    ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "application/pdf"}
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")

    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension {file_ext} not allowed")

    UPLOAD_DIR = "uploads/astrologer_documents"
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    return {"url": f"/static/astrologer_documents/{filename}"}


# Static contract text — see docs/email-contents for the tone/policy source of
# truth (the same points listed in the Dashboard "Important Policies" panel).
_CONTRACT_VERSION = "v1"
_CONTRACT_TEXT = """ASTROLOGER PARTNER AGREEMENT

This Agreement is between Aadikarta ("the Platform") and the astrologer partner
identified by the account signing below ("the Astrologer").

1. ENGAGEMENT
   The Astrologer is engaged as an independent consultant to provide astrology,
   tarot, numerology, or related consultations to seekers through the Platform.
   This Agreement does not create an employer-employee relationship.

2. EARNINGS & COMMISSION
   The Astrologer sets their own per-minute consultation rate, subject to
   Platform review. The Platform retains a commission on each completed,
   billable consultation; the remainder is credited to the Astrologer's payout
   balance. No earning accrues for consultations shorter than 1 minute.

3. CONDUCT
   - The Astrologer must never share or request personal contact details
     (phone number, email, social media) with or from a seeker.
   - The Astrologer must be available for a minimum of 6 hours per day while
     marked online, and must accept incoming calls/chats promptly — a missed
     session may result in a deduction as described in Platform policy.
   - The Astrologer must greet seekers warmly and remain respectful at all
     times, even with difficult seekers; disputes should be reported to
     Platform support rather than handled directly.
   - Practices such as black magic, vashikaran, or yantra-based poojas are
     strictly forbidden on the Platform.

4. CONFIDENTIALITY
   The Astrologer agrees to keep all seeker information shared during a
   consultation confidential and will not use it outside the Platform.

5. VERIFICATION
   The Astrologer agrees to provide accurate KYC information (identity and
   bank details) for verification and payout purposes, and to keep this
   information current.

6. TERM & TERMINATION
   This Agreement remains in effect while the Astrologer is active on the
   Platform. Either party may terminate this engagement at any time; the
   Platform may suspend or remove an Astrologer immediately for a violation
   of the conduct terms above.

By typing your full legal name below and clicking "Sign Contract", you
acknowledge that you have read, understood, and agree to be bound by this
Agreement."""


@router.get("/contract")
def get_astrologer_contract(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=400, detail="Not an astrologer account")
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == current_user.id).first()
    return {
        "version": _CONTRACT_VERSION,
        "text": _CONTRACT_TEXT,
        "signed_at": profile.contract_signed_at,
        "signature_name": profile.contract_signature_name,
    }


@router.post("/contract/sign")
def sign_astrologer_contract(
    request: schemas.ContractSignRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=400, detail="Not an astrologer account")
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == current_user.id).first()
    profile.contract_signed_at = datetime.utcnow()
    profile.contract_signature_name = request.signature_name
    db.commit()
    db.refresh(profile)
    return {
        "version": _CONTRACT_VERSION,
        "signed_at": profile.contract_signed_at,
        "signature_name": profile.contract_signature_name,
    }


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

    from .realtime import is_present
    if astro.is_online and is_present(astrologer_id):
        raise HTTPException(status_code=400, detail="Astrologer is already online")
    if not is_within_availability_window(astro):
        raise HTTPException(status_code=400, detail="Astrologer is outside their availability window")

    seeker_name = (current_user.seeker_profile.full_name if current_user.seeker_profile else None) or "Seeker"

    # In-app live update -> astrologer's Dashboard rings a bell instantly if
    # they're already in the app (foreground). Best-effort: an astrologer with
    # no open socket just relies on the push notification below.
    try:
        from .realtime import notify_user
        notify_user(astrologer_id, {
            "type": "KNOCK",
            "astrologer_id": astrologer_id,
            "seeker_id": current_user.id,
            "seeker_name": seeker_name,
        })
    except Exception as e:
        print(f"realtime knock notify failed: {e}")

    # Ring the astrologer's phone via a loud push notification (always triggered on click)
    try:
        from ..notifications import send_push_notification
        for tok in db.query(models.DeviceToken).filter(models.DeviceToken.user_id == astrologer_id).all():
            send_push_notification(
                token=tok.fcm_token,
                title=f"🔔 {seeker_name} wants a consultation",
                body="A seeker wants to talk to you! Tap to open Aadikarta and go online",
                data={"type": "KNOCK", "astrologer_id": str(astrologer_id), "seeker_id": str(current_user.id)},
                android_channel_id="knock_alerts",
            )
    except Exception as e:
        print(f"Failed to send knock push notification to astrologer: {e}")

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
def get_astrologer_by_identifier(
    identifier: str,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user_optional),
):
    """Fetch an astrologer profile by numeric user_id (legacy) or slug."""
    base_query = db.query(models.AstrologerProfile).join(models.User).filter(
        models.AstrologerProfile.is_approved == True,
        models.AstrologerProfile.onboarding_stage == models.OnboardingStage.COMPLETED,
        models.User.is_active == True,
        models.User.is_verified == True,
        _restricted_visibility_filter(db, current_user),
    )
    if identifier.isdigit():
        profile = base_query.filter(models.AstrologerProfile.user_id == int(identifier)).first()
    else:
        profile = base_query.filter(models.AstrologerProfile.slug == identifier).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Astrologer not found or not approved")
    _decorate_availability(db, profile)
    _decorate_review_count(db, profile)
    return profile


@router.get("/stats/performance")
def get_my_performance_stats(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Performance stats for the logged-in astrologer's own dashboard (same metrics
    the admin sees on the astrologer detail page)."""
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=403, detail="Only astrologers can view their performance stats")

    from ..services.astrologer_stats_service import compute_performance_stats
    return compute_performance_stats(db, current_user.id)


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

