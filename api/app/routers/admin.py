from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import shutil
import uuid
import os
from datetime import datetime, timedelta, date, time
from .. import models, schemas, database, audit
from ..schemas import _validate_strong_password
from .. import models_edu, schemas_edu
from decimal import Decimal
from .auth import get_current_admin, get_password_hash
from ..services.wallet_limits import get_wallet_cap
from ..services.email_service import (
    send_email,
    build_interview_scheduled_email,
    build_profile_activation_email,
    build_onboarding_welcome_email,
    build_onboarding_started_email,
    build_growth_meeting_email,
    build_astrologer_approved_email,
    build_astrologer_rejected_email,
    build_profile_incomplete_email,
    build_admin_password_reset_email,
    build_meeting_ics,
    ONBOARDING_CALENDAR_ATTENDEE,
)
import base64
import io
import csv
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)]
)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # 1. Size Validation (e.g., 5MB limit)
    MAX_FILE_SIZE = 5 * 1024 * 1024
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large (Max 5MB)")
    await file.seek(0)

    # 2. Type Validation
    ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"File type {file.content_type} not allowed")

    # Extension is client-supplied and independent of Content-Type — pin it to a
    # fixed allow-list too, so a mismatched pair (e.g. Content-Type: image/png with
    # filename "x.html") can't get an executable/renderable extension onto a file
    # served back statically from /static.
    ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".pdf"}
    file_ext = os.path.splitext(file.filename or "")[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File extension {file_ext} not allowed")

    try:
        # Ensure directory exists
        UPLOAD_DIR = "uploads/admin_uploads"
        os.makedirs(UPLOAD_DIR, exist_ok=True)

        # Generate unique filename
        filename = f"{uuid.uuid4().hex}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # Save file locally
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Return static URL relative to mount (/static handles the "uploads" directory)
        return {"url": f"/static/admin_uploads/{filename}"}
    except Exception as e:
        print(f"File upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.get("/dashboard_stats")
def get_dashboard_stats(db: Session = Depends(database.get_db)):
    # 1. Summary Counts
    total_users = db.query(models.User).count()
    total_seekers = db.query(models.User).filter(models.User.role == models.UserRole.SEEKER).count()
    total_astrologers = db.query(models.AstrologerProfile).filter(
        models.AstrologerProfile.is_approved == True
    ).join(models.User).filter(models.User.is_active == True).count()
    astrologers_under_onboarding = db.query(models.AstrologerProfile).filter(
        models.AstrologerProfile.onboarding_stage.notin_(
            [models.OnboardingStage.COMPLETED, models.OnboardingStage.REJECTED]
        )
    ).count()

    # 2. Financials
    total_consultations = db.query(models.Consultation).count()
    # Filter only completed/paid consultations for revenue
    completed_statuses = [models.ConsultationStatus.COMPLETED, models.ConsultationStatus.AUTO_ENDED]
    total_revenue = db.query(func.sum(models.Consultation.total_cost)).filter(
        models.Consultation.status.in_(completed_statuses)
    ).scalar() or 0.0

    # 3. Graphs: Last 30 Days Activity
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    # Daily Revenue & Consultations
    # Truncate to day
    daily_stats = db.query(
        func.date_trunc('day', models.Consultation.created_at).label('date'),
        func.count(models.Consultation.id).label('count'),
        func.sum(models.Consultation.total_cost).label('revenue')
    ).filter(
        models.Consultation.created_at >= start_date,
        models.Consultation.status.in_(completed_statuses)
    ).group_by(
        func.date_trunc('day', models.Consultation.created_at)
    ).order_by(
        func.date_trunc('day', models.Consultation.created_at)
    ).all()
    
    # Format graph data (ensure all days are present? For MVP just return what we have)
    graph_data = [
        {
            "date": stat.date.strftime("%Y-%m-%d"), 
            "consultations": stat.count, 
            "revenue": float(stat.revenue or 0)
        } 
        for stat in daily_stats
    ]
    
    # Fill missing days with 0 (optional for better charts)
    # Skipping for now to keep it simple, Recharts handles gaps okay-ish or we can do in frontend.

    # 4. Recent Activity (Last 5 Consultations)
    recent_consultations = db.query(models.Consultation).order_by(
        models.Consultation.created_at.desc()
    ).limit(5).all()
    
    recent_activity = []
    for c in recent_consultations:
        seeker = db.query(models.User).filter(models.User.id == c.seeker_id).first()
        astrologer_profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == c.astrologer_id).first()
        
        recent_activity.append({
            "id": c.id,
            "type": "consultation",
            "message": f"Consultation with {astrologer_profile.full_name if astrologer_profile else 'Astrologer'}",
            "amount": c.total_cost,
            "status": c.status,
            "created_at": c.created_at,
            "seeker_email": seeker.email if seeker else "Unknown"
        })

    return {
        "summary": {
            "total_users": total_users,
            "total_seekers": total_seekers,
            "total_active_astrologers": total_astrologers,
            "astrologers_under_onboarding": astrologers_under_onboarding,
            "total_revenue": total_revenue,
            "total_consultations": total_consultations
        },
        "graph_data": graph_data,
        "recent_activity": recent_activity
    }

@router.get("/users", response_model=schemas.UserPaginationResponse)
def list_users(
    skip: int = 0, 
    limit: int = 100, 
    role: Optional[models.UserRole] = None, 
    search: Optional[str] = None,
    is_verified: Optional[str] = None, # 'true', 'false', or None
    db: Session = Depends(database.get_db)
):
    query = db.query(
        models.User,
        models.UserWallet.balance.label("wallet_balance")
    ).outerjoin(
        models.UserWallet, models.User.id == models.UserWallet.user_id
    )
    
    # Default to SEEKER if no role specified
    if role:
        query = query.filter(models.User.role == role)
    else:
        query = query.filter(models.User.role == models.UserRole.SEEKER)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter((models.User.email.ilike(search_term)) | (models.User.phone_number.ilike(search_term)))
        
    if is_verified is not None:
        if is_verified.lower() == 'true':
            query = query.filter(models.User.is_verified == True)
        elif is_verified.lower() == 'false':
            query = query.filter(models.User.is_verified == False)

    total = query.count()
    results = query.order_by(models.User.id.desc()).offset(skip).limit(limit).all()
    
    users_with_balance = []
    for user, balance in results:
        user_data = schemas.AdminUserListItem.from_orm(user)
        user_data.wallet_balance = balance or 0.0
        users_with_balance.append(user_data)

    return {"total": total, "users": users_with_balance}

# Let's define a proper schema for listing users locally here or in schemas.py
# For speed I'll just return raw dicts by dropping response_model if strict schema not needed immediately, 
# but better to add a schema.

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Nullify nullable FK references to preserve historical records
    db.query(models.Consultation).filter(models.Consultation.astrologer_id == user_id).update({"astrologer_id": None})
    db.query(models.Consultation).filter(models.Consultation.seeker_id == user_id).update({"seeker_id": None})
    db.query(models.Review).filter(models.Review.astrologer_id == user_id).update({"astrologer_id": None})
    db.query(models.Review).filter(models.Review.seeker_id == user_id).update({"seeker_id": None})
    db.query(models.ChatMessage).filter(models.ChatMessage.sender_id == user_id).update({"sender_id": None})
    db.query(models.Post).filter(models.Post.author_id == user_id).update({"author_id": None})
    db.query(models.Payout).filter(models.Payout.astrologer_id == user_id).update({"astrologer_id": None})
    db.query(models.AuditLog).filter(models.AuditLog.actor_id == user_id).update({"actor_id": None})
    db.query(models.KundliReport).filter(models.KundliReport.seeker_id == user_id).update({"seeker_id": None})

    # Delete records with non-nullable FK references
    db.query(models.KundliReport).filter(models.KundliReport.generated_by == user_id).delete()
    db.query(models.Dispute).filter(models.Dispute.raised_by_id == user_id).delete()
    db.query(models.VerificationToken).filter(models.VerificationToken.user_id == user_id).delete()
    db.query(models.DeviceToken).filter(models.DeviceToken.user_id == user_id).delete()

    db.delete(user)
    db.commit()
    return {"message": "User deleted"}

@router.put("/users/{user_id}/verify")
def verify_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_verified = True
    db.commit()
    return {"message": "User verified"}

from pydantic import BaseModel

class UserEditRequest(BaseModel):
    phone_number: Optional[str] = None
    full_name: Optional[str] = None
    # Seeker fields
    date_of_birth: Optional[date] = None
    time_of_birth: Optional[time] = None
    place_of_birth: Optional[str] = None
    gender: Optional[models.GenderType] = None
    # Astrologer fields
    experience_years: Optional[int] = None
    languages: Optional[str] = None
    specialties: Optional[str] = None

class UserStatusUpdate(BaseModel):
    is_active: bool

class BadgesUpdate(BaseModel):
    is_premium: bool
    is_vip: bool
    is_trending: bool

class KycVerifyUpdate(BaseModel):
    kyc_verified: bool

class ApproveAstrologerRequest(BaseModel):
    consultation_fee_per_min: Optional[float] = None

class RejectAstrologerRequest(BaseModel):
    reason: str = "Your application did not meet our current requirements."

class CommissionUpdateRequest(BaseModel):
    commission_percentage: float

class AdvanceOnboardingRequest(BaseModel):
    target_stage: models.OnboardingStage
    # Step 1 (interview) fields
    date: Optional[str] = None
    time: Optional[str] = None
    interviewer: Optional[str] = None
    meeting_link: Optional[str] = None
    # Step 5 (growth/training) fields
    day: Optional[str] = None
    timezone: Optional[str] = None
    # Step 2 (activation) field
    consultation_fee_per_min: Optional[float] = None

@router.put("/users/{user_id}/status")
def update_user_status(user_id: int, status_update: UserStatusUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = status_update.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully", "is_active": user.is_active}

@router.put("/astrologers/{user_id}/badges")
def update_astrologer_badges(user_id: int, update: BadgesUpdate, db: Session = Depends(database.get_db)):
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Astrologer profile not found")

    profile.is_premium = update.is_premium
    profile.is_vip = update.is_vip
    profile.is_trending = update.is_trending
    db.commit()
    return {"message": "Badges updated successfully", "is_premium": profile.is_premium, "is_vip": profile.is_vip, "is_trending": profile.is_trending}

@router.put("/astrologers/{user_id}/kyc")
def update_astrologer_kyc_verification(user_id: int, update: KycVerifyUpdate, db: Session = Depends(database.get_db)):
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Astrologer profile not found")

    profile.kyc_verified = update.kyc_verified
    profile.kyc_verified_at = datetime.utcnow() if update.kyc_verified else None
    db.commit()
    return {"message": f"Astrologer KYC {'verified' if update.kyc_verified else 'unverified'}"}

class RequestMissingInfoRequest(BaseModel):
    missing_items: str

@router.post("/astrologers/{user_id}/request-missing-info")
def request_astrologer_missing_info(user_id: int, request: RequestMissingInfoRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id, models.User.role == models.UserRole.ASTROLOGER).first()
    if not user:
        raise HTTPException(status_code=404, detail="Astrologer not found")
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    subject, body = build_profile_incomplete_email(profile.full_name, request.missing_items)
    send_email(background_tasks, [user.email], subject, body)

    return {"message": "Request for missing info sent successfully"}

# Specific endpoint to create an Admin (only by another admin)
@router.post("/create_admin", response_model=schemas.Token)
def create_admin(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter((models.User.email == user.email) | (models.User.phone_number == user.phone_number)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        phone_number=user.phone_number,
        hashed_password=hashed_password,
        role=models.UserRole.ADMIN,
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"access_token": "created_by_admin", "token_type": "bearer", "user_id": new_user.id, "role": new_user.role}

@router.post("/astrologers", response_model=schemas.Token)
def create_astrologer(astrologer: schemas.AdminCreateAstrologer, db: Session = Depends(database.get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter((models.User.email == astrologer.email) | (models.User.phone_number == astrologer.phone_number)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # password is Optional on the shared schema (the edit form sends "") but
    # is required when actually creating a new astrologer account.
    if not astrologer.password:
        raise HTTPException(status_code=422, detail="Password is required")
    try:
        _validate_strong_password(astrologer.password)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Create User
    hashed_password = get_password_hash(astrologer.password)
    new_user = models.User(
        email=astrologer.email,
        phone_number=astrologer.phone_number,
        hashed_password=hashed_password,
        role=models.UserRole.ASTROLOGER,
        is_verified=astrologer.is_verified
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create Profile (admin-created astrologers are pre-approved)
    new_profile = models.AstrologerProfile(
        user_id=new_user.id,
        full_name=astrologer.full_name,
        display_name=astrologer.display_name,
        short_bio=astrologer.short_bio,
        about_me=astrologer.about_me,
        experience_years=astrologer.experience_years,
        languages=astrologer.languages,
        specialties=astrologer.specialties,
        consultation_fee_per_min=astrologer.consultation_fee_per_min,
        availability_hours=astrologer.availability_hours,
        profile_picture_url=astrologer.profile_picture_url,
        is_online=False,
        is_approved=True,
        commission_percentage=astrologer.commission_percentage
    )
    db.add(new_profile)

    # Create wallet so balance lookups don't fail
    wallet = models.UserWallet(user_id=new_user.id)
    db.add(wallet)

    db.commit()

    return {"access_token": "created_by_admin", "token_type": "bearer", "user_id": new_user.id, "role": new_user.role}

@router.get("/astrologers_full")
def list_astrologers_full(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    # Join User and Profile to get full details
    results = db.query(models.User, models.AstrologerProfile).join(models.AstrologerProfile, models.User.id == models.AstrologerProfile.user_id).filter(models.User.role == models.UserRole.ASTROLOGER).offset(skip).limit(limit).all()
    
    astrologers = []
    for user, profile in results:
        data = {
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "profile": {
                "full_name": profile.full_name,
                "display_name": profile.display_name,
                "short_bio": profile.short_bio,
                "about_me": profile.about_me,
                "profile_picture_url": profile.profile_picture_url,
                "experience_years": profile.experience_years,
                "languages": profile.languages,
                "specialties": profile.specialties,
                "consultation_fee_per_min": profile.consultation_fee_per_min,
                "availability_hours": profile.availability_hours,
                "rating_avg": profile.rating_avg,
                "commission_percentage": float(profile.commission_percentage),
                "is_approved": profile.is_approved,
                "is_premium": profile.is_premium,
                "onboarding_stage": profile.onboarding_stage.value,
                "contract_signed_at": profile.contract_signed_at,
                "contract_signature_name": profile.contract_signature_name,
                "pan_number": profile.pan_number,
                "pan_doc_url": profile.pan_doc_url,
                "aadhaar_number": profile.aadhaar_number,
                "aadhaar_doc_url": profile.aadhaar_doc_url,
                "aadhaar_doc_back_url": profile.aadhaar_doc_back_url,
                "bank_account_holder_name": profile.bank_account_holder_name,
                "bank_account_number": profile.bank_account_number,
                "bank_ifsc": profile.bank_ifsc,
                "bank_name": profile.bank_name,
                "bank_address": profile.bank_address,
                "kyc_verified": profile.kyc_verified,
                "kyc_verified_at": profile.kyc_verified_at,
                "certificate_urls": profile.certificate_urls or [],
            }
        }
        astrologers.append(data)
        
    total = db.query(models.User).filter(models.User.role == models.UserRole.ASTROLOGER).count()
    return {"total": total, "astrologers": astrologers}

@router.put("/astrologers/{user_id}")
def update_astrologer_full(user_id: int, data: schemas.AdminCreateAstrologer, db: Session = Depends(database.get_db)):
    # We use AdminCreateAstrologer schema for simplicity to accept all fields, but password might not be updated here normally.
    # For now, let's assume we update profile and user info, handling password only if provided/changed logic (simplified here)
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Update User
    user.email = data.email
    user.phone_number = data.phone_number
    user.is_verified = data.is_verified
    # user.hashed_password... (Avoiding password reset here for simplicity unless explicit)
    
    # Update Profile
    profile.full_name = data.full_name
    profile.display_name = data.display_name
    profile.short_bio = data.short_bio
    profile.about_me = data.about_me
    profile.experience_years = data.experience_years
    profile.languages = data.languages
    profile.specialties = data.specialties
    profile.consultation_fee_per_min = data.consultation_fee_per_min
    profile.commission_percentage = data.commission_percentage
    profile.availability_hours = data.availability_hours
    profile.profile_picture_url = data.profile_picture_url

    db.commit()
    return {"message": "Astrologer updated successfully"}

@router.get("/astrologers/{user_id}/consultations")
def get_astrologer_consultations(user_id: int, db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Consultation, models.SeekerProfile.full_name)
        .outerjoin(models.SeekerProfile, models.Consultation.seeker_id == models.SeekerProfile.user_id)
        .filter(models.Consultation.astrologer_id == user_id)
        .order_by(models.Consultation.created_at.desc())
        .all()
    )
    result = []
    for c, seeker_name in rows:
        result.append({
            "id": c.id,
            "consultation_type": c.consultation_type,
            "seeker_id": c.seeker_id,
            "seeker_name": seeker_name or f"User #{c.seeker_id}",
            "status": c.status,
            "duration_seconds": c.duration_seconds or 0,
            "total_cost": float(c.total_cost or 0),
            "created_at": c.created_at,
        })
    return result

@router.get("/astrologers/{user_id}/earnings")
def get_astrologer_earnings(user_id: int, db: Session = Depends(database.get_db)):
    # Fetch all completed/paid consultations
    # Assuming 'COMPLETED' or 'AUTO_ENDED' means billed.
    completed_statuses = [models.ConsultationStatus.COMPLETED, models.ConsultationStatus.AUTO_ENDED]
    consultations = db.query(models.Consultation).filter(
        models.Consultation.astrologer_id == user_id,
        models.Consultation.status.in_(completed_statuses)
    ).all()
    
    total_earned = 0.0
    monthly_map = {}
    
    for c in consultations:
        amount = float(c.total_cost or 0)
        total_earned += amount
        
        # Group by Month (YYYY-MM)
        if c.created_at:
            month_key = c.created_at.strftime("%Y-%m")
            monthly_map[month_key] = monthly_map.get(month_key, 0.0) + amount
            
    # Convert map to list sorted by date
    monthly_list = [{"month": k, "amount": v} for k, v in monthly_map.items()]
    monthly_list.sort(key=lambda x: x["month"])
    return {"total_earned": round(total_earned, 2), "monthly_earnings": monthly_list}

@router.get("/astrologers/{user_id}/stats")
def get_astrologer_stats(user_id: int, db: Session = Depends(database.get_db)):
    from ..services.astrologer_stats_service import compute_performance_stats
    return compute_performance_stats(db, user_id)

@router.get("/users/{user_id}/details")
def get_user_details(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Get profile based on role
    # Get profile based on role
    profile_data = {}
    if user.role == models.UserRole.SEEKER:
        # Check explicit seeker profile
        p = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == user_id).first()
        if p:
            profile_data = {
                "full_name": p.full_name,
                "date_of_birth": p.date_of_birth,
                "time_of_birth": p.time_of_birth,
                "place_of_birth": p.place_of_birth,
                "gender": p.gender,
                "profile_picture_url": p.profile_picture_url
            }
    elif user.role == models.UserRole.ASTROLOGER:
        p = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
        if p:
            profile_data = {
                "full_name": p.full_name,
                "profile_picture_url": p.profile_picture_url,
                "specialties": p.specialties,
                "languages": p.languages,
                "experience_years": p.experience_years,
                "onboarding_stage": p.onboarding_stage.value,
                "is_approved": p.is_approved,
                "contract_signed_at": p.contract_signed_at,
                "contract_signature_name": p.contract_signature_name,
                "pan_number": p.pan_number,
                "pan_doc_url": p.pan_doc_url,
                "aadhaar_number": p.aadhaar_number,
                "aadhaar_doc_url": p.aadhaar_doc_url,
                "aadhaar_doc_back_url": p.aadhaar_doc_back_url,
                "bank_account_holder_name": p.bank_account_holder_name,
                "bank_account_number": p.bank_account_number,
                "bank_ifsc": p.bank_ifsc,
                "bank_name": p.bank_name,
                "bank_address": p.bank_address,
                "kyc_verified": p.kyc_verified,
                "kyc_verified_at": p.kyc_verified_at,
                "certificate_urls": p.certificate_urls or [],
            }
    
    # Get Wallet Balance
    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == user_id).first()
    balance = wallet.balance if wallet else 0.0
    
    # Get Total Consultancy Stats (completed sessions only)
    completed_statuses = [models.ConsultationStatus.COMPLETED, models.ConsultationStatus.AUTO_ENDED]
    total_consultations = db.query(models.Consultation).filter(
        models.Consultation.seeker_id == user_id,
        models.Consultation.status.in_(completed_statuses)
    ).count()
    total_spent = db.query(func.sum(models.Consultation.total_cost)).filter(
        models.Consultation.seeker_id == user_id,
        models.Consultation.status.in_(completed_statuses)
    ).scalar() or 0.0
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "role": user.role,
            "is_verified": user.is_verified,
            "is_active": user.is_active,
            "created_at": user.created_at
        },
        "profile": profile_data,
        "wallet_balance": balance,
        "stats": {
            "total_consultations": total_consultations,
            "total_spent": total_spent
        }
    }

@router.put("/users/{user_id}/edit")
def edit_user_details(
    user_id: int,
    request: UserEditRequest,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if request.phone_number:
        # Check if phone number is already taken by another user
        existing_phone = db.query(models.User).filter(
            models.User.phone_number == request.phone_number,
            models.User.id != user_id
        ).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number is already in use by another account")
        user.phone_number = request.phone_number

    if user.role == models.UserRole.SEEKER:
        p = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == user_id).first()
        if not p:
            p = models.SeekerProfile(user_id=user_id)
            db.add(p)
        if request.full_name is not None:
            p.full_name = request.full_name
        if request.date_of_birth is not None:
            p.date_of_birth = request.date_of_birth
        if request.time_of_birth is not None:
            p.time_of_birth = request.time_of_birth
        if request.place_of_birth is not None:
            p.place_of_birth = request.place_of_birth
        if request.gender is not None:
            p.gender = request.gender

    elif user.role == models.UserRole.ASTROLOGER:
        p = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
        if not p:
            p = models.AstrologerProfile(user_id=user_id, full_name=request.full_name or "Astrologer")
            db.add(p)
        if request.full_name is not None:
            p.full_name = request.full_name
        if request.experience_years is not None:
            p.experience_years = request.experience_years
        if request.languages is not None:
            p.languages = request.languages
        if request.specialties is not None:
            p.specialties = request.specialties

    audit.log(
        db,
        action="USER_DETAILS_UPDATED",
        actor_id=current_admin.id,
        resource_type="user",
        resource_id=user_id,
        details={
            "phone_number": request.phone_number,
            "full_name": request.full_name,
            "role": user.role.value
        }
    )
    db.commit()
    return {"message": "User details updated successfully"}

def _query_user_consultations(
    db: Session,
    user_id: int,
    search: Optional[str] = None,
    consultation_type: Optional[models.ConsultationType] = None,
    status: Optional[models.ConsultationStatus] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    query = (
        db.query(models.Consultation, models.AstrologerProfile.full_name)
        .outerjoin(models.AstrologerProfile, models.Consultation.astrologer_id == models.AstrologerProfile.user_id)
        .filter(models.Consultation.seeker_id == user_id)
    )
    if consultation_type:
        query = query.filter(models.Consultation.consultation_type == consultation_type)
    if status:
        query = query.filter(models.Consultation.status == status)
    if date_from:
        query = query.filter(models.Consultation.created_at >= datetime.combine(date_from, time.min))
    if date_to:
        query = query.filter(models.Consultation.created_at <= datetime.combine(date_to, time.max))
    if search:
        search_term = f"%{search}%"
        query = query.filter(models.AstrologerProfile.full_name.ilike(search_term))
    return query

@router.get("/users/{user_id}/consultations")
def get_user_consultations(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    consultation_type: Optional[models.ConsultationType] = None,
    status: Optional[models.ConsultationStatus] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(database.get_db),
):
    query = _query_user_consultations(db, user_id, search, consultation_type, status, date_from, date_to)
    total = query.count()
    rows = query.order_by(models.Consultation.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for c, astrologer_name in rows:
        result.append({
            "id": c.id,
            "consultation_type": c.consultation_type,
            "astrologer_id": c.astrologer_id,
            "astrologer_name": astrologer_name or f"Astrologer #{c.astrologer_id}",
            "status": c.status,
            "duration_seconds": c.duration_seconds or 0,
            "total_cost": float(c.total_cost or 0),
            "created_at": c.created_at,
        })
    return {"total": total, "consultations": result}

def _user_display_name(db: Session, user_id: int) -> str:
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        return f"User #{user_id}"
    profile = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == user_id).first()
    return (profile.full_name if profile and profile.full_name else None) or user.email or f"User #{user_id}"

def _build_pdf_report(title: str, subtitle: str, headers: List[str], rows: List[list], col_widths: List[float]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=15 * mm, bottomMargin=15 * mm)
    styles = getSampleStyleSheet()
    elements = [
        Paragraph(title, styles["Title"]),
        Paragraph(subtitle, styles["Normal"]),
        Spacer(1, 8 * mm),
    ]

    table_data = [headers] + rows
    table = Table(table_data, colWidths=col_widths, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4f46e5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f3f4f6")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#d1d5db")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    elements.append(table)
    doc.build(elements)
    buffer.seek(0)
    return buffer

@router.get("/users/{user_id}/consultations/export")
def export_user_consultations(
    user_id: int,
    search: Optional[str] = None,
    consultation_type: Optional[models.ConsultationType] = None,
    status: Optional[models.ConsultationStatus] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(database.get_db),
):
    query = _query_user_consultations(db, user_id, search, consultation_type, status, date_from, date_to)
    rows = query.order_by(models.Consultation.created_at.desc()).all()

    name = _user_display_name(db, user_id)
    period = f"{date_from or 'Start'} to {date_to or 'Today'}"
    table_rows = []
    for c, astrologer_name in rows:
        duration = f"{(c.duration_seconds or 0) // 60}m {(c.duration_seconds or 0) % 60}s"
        table_rows.append([
            c.created_at.strftime("%Y-%m-%d %H:%M") if c.created_at else "-",
            c.consultation_type.value if hasattr(c.consultation_type, "value") else c.consultation_type,
            astrologer_name or f"Astrologer #{c.astrologer_id}",
            duration,
            f"Rs. {float(c.total_cost or 0):.2f}",
            c.status.value if hasattr(c.status, "value") else c.status,
        ])

    buffer = _build_pdf_report(
        title="Consultation History Report",
        subtitle=f"User: {name} (#{user_id}) &nbsp;|&nbsp; Period: {period}",
        headers=["Date", "Type", "Astrologer", "Duration", "Cost", "Status"],
        rows=table_rows,
        col_widths=[35 * mm, 25 * mm, 55 * mm, 30 * mm, 30 * mm, 30 * mm],
    )
    filename = f"consultation-history-user-{user_id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

def _collapse_chat_deduction_sessions(rows):
    """rows: list of tuples `(WalletTransaction, *extra)` ordered ascending by
    created_at. The chat billing loop writes one WalletTransaction per billed
    minute (chat.py), which is the right granularity for the ledger but reads
    as noise in the admin UI — a seeker doesn't care that minute 28, 29 and 30
    were separate debits, they want to see what one chat session cost in
    total. This collapses consecutive CHAT_DEDUCTION rows sharing the same
    consultation (reference_id) into a single row carrying the session's total
    deduction; every other transaction type passes through unchanged. Returns
    dicts with keys id/user_id/amount/transaction_type/reference_id/
    description/created_at/extra (the passed-through tuple tail), sorted
    newest-first.
    """
    sessions = {}
    result = []
    for row in rows:
        txn, extra = row[0], row[1:]
        if txn.transaction_type == models.TransactionType.CHAT_DEDUCTION and txn.reference_id:
            entry = sessions.get(txn.reference_id)
            if entry is None:
                entry = {
                    "id": txn.id,
                    "user_id": txn.user_id,
                    "amount": Decimal("0"),
                    "transaction_type": txn.transaction_type,
                    "reference_id": txn.reference_id,
                    "description": None,
                    "created_at": txn.created_at,
                    "extra": extra,
                    "_minutes": 0,
                }
                sessions[txn.reference_id] = entry
                result.append(entry)
            entry["amount"] += txn.amount
            entry["_minutes"] += 1
            entry["created_at"] = txn.created_at
        else:
            result.append({
                "id": txn.id,
                "user_id": txn.user_id,
                "amount": txn.amount,
                "transaction_type": txn.transaction_type,
                "reference_id": txn.reference_id,
                "description": txn.description,
                "created_at": txn.created_at,
                "extra": extra,
                "_minutes": None,
            })

    for entry in result:
        if entry["_minutes"] is not None:
            entry["description"] = f"Chat session deduction ({entry['_minutes']} min)"
        del entry["_minutes"]

    result.sort(key=lambda e: e["created_at"], reverse=True)
    return result

def _query_user_wallet_history(
    db: Session,
    user_id: int,
    search: Optional[str] = None,
    transaction_type: Optional[models.TransactionType] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
):
    query = db.query(models.WalletTransaction).filter(models.WalletTransaction.user_id == user_id)
    if transaction_type:
        query = query.filter(models.WalletTransaction.transaction_type == transaction_type)
    if date_from:
        query = query.filter(models.WalletTransaction.created_at >= datetime.combine(date_from, time.min))
    if date_to:
        query = query.filter(models.WalletTransaction.created_at <= datetime.combine(date_to, time.max))
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.WalletTransaction.description.ilike(search_term)) |
            (models.WalletTransaction.reference_id.ilike(search_term))
        )
    return query

@router.get("/users/{user_id}/wallet-history")
def get_user_wallet_history(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    search: Optional[str] = None,
    transaction_type: Optional[models.TransactionType] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(database.get_db),
):
    query = _query_user_wallet_history(db, user_id, search, transaction_type, date_from, date_to)
    rows = query.order_by(models.WalletTransaction.created_at.asc()).all()
    grouped = _collapse_chat_deduction_sessions([(t,) for t in rows])
    total = len(grouped)
    page = grouped[skip:skip + limit]
    transactions = [schemas.WalletTransaction.model_validate(g) for g in page]
    return {"total": total, "transactions": transactions}

@router.get("/users/{user_id}/wallet-history/export")
def export_user_wallet_history(
    user_id: int,
    search: Optional[str] = None,
    transaction_type: Optional[models.TransactionType] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(database.get_db),
):
    query = _query_user_wallet_history(db, user_id, search, transaction_type, date_from, date_to)
    rows = query.order_by(models.WalletTransaction.created_at.asc()).all()
    grouped = _collapse_chat_deduction_sessions([(t,) for t in rows])

    name = _user_display_name(db, user_id)
    period = f"{date_from or 'Start'} to {date_to or 'Today'}"
    table_rows = []
    for g in grouped:
        amount = float(g["amount"])
        table_rows.append([
            g["created_at"].strftime("%Y-%m-%d %H:%M") if g["created_at"] else "-",
            g["transaction_type"].value if hasattr(g["transaction_type"], "value") else g["transaction_type"],
            g["reference_id"] or "-",
            g["description"] or "-",
            f"{'+' if amount > 0 else ''}Rs. {amount:.2f}",
        ])

    buffer = _build_pdf_report(
        title="Wallet Transaction History Report",
        subtitle=f"User: {name} (#{user_id}) &nbsp;|&nbsp; Period: {period}",
        headers=["Date", "Type", "Reference", "Description", "Amount"],
        rows=table_rows,
        col_widths=[35 * mm, 30 * mm, 30 * mm, 90 * mm, 30 * mm],
    )
    filename = f"wallet-history-user-{user_id}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

def _query_all_transactions(
    db: Session,
    role: models.UserRole,
    transaction_type: Optional[models.TransactionType] = None,
    search: Optional[str] = None,
):
    profile_model = models.SeekerProfile if role == models.UserRole.SEEKER else models.AstrologerProfile
    query = (
        db.query(models.WalletTransaction, models.User.email, models.User.phone_number, profile_model.full_name)
        .join(models.User, models.WalletTransaction.user_id == models.User.id)
        .outerjoin(profile_model, models.WalletTransaction.user_id == profile_model.user_id)
        .filter(models.User.role == role)
    )

    if transaction_type:
        query = query.filter(models.WalletTransaction.transaction_type == transaction_type)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.User.email.ilike(search_term)) |
            (models.User.phone_number.ilike(search_term)) |
            (profile_model.full_name.ilike(search_term))
        )
    return query

MAX_TRANSACTION_ROWS_TO_GROUP = 50_000

@router.get("/transactions")
def list_all_transactions(
    skip: int = 0,
    limit: int = 100,
    role: models.UserRole = models.UserRole.SEEKER,
    transaction_type: Optional[models.TransactionType] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """All wallet transactions for a given role (defaults to seekers), for admin auditing."""
    query = _query_all_transactions(db, role, transaction_type, search)

    rows = query.order_by(models.WalletTransaction.created_at.asc()).limit(MAX_TRANSACTION_ROWS_TO_GROUP).all()
    grouped = _collapse_chat_deduction_sessions(rows)
    total = len(grouped)
    page = grouped[skip:skip + limit]

    transactions = []
    for g in page:
        email, phone_number, full_name = g["extra"]
        transactions.append({
            "id": g["id"],
            "user_id": g["user_id"],
            "user_name": full_name or f"User #{g['user_id']}",
            "email": email,
            "phone_number": phone_number,
            "amount": float(g["amount"]),
            "transaction_type": g["transaction_type"],
            "reference_id": g["reference_id"],
            "description": g["description"],
            "created_at": g["created_at"],
        })

    return {"total": total, "transactions": transactions}

@router.get("/transactions/export")
def export_all_transactions(
    role: models.UserRole = models.UserRole.SEEKER,
    transaction_type: Optional[models.TransactionType] = None,
    search: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    """CSV export of the (filtered, unpaginated) transaction list — for handing
    data to accounting/audit rather than reading it off the admin UI."""
    query = _query_all_transactions(db, role, transaction_type, search)
    rows = query.order_by(models.WalletTransaction.created_at.asc()).limit(MAX_TRANSACTION_ROWS_TO_GROUP).all()
    grouped = _collapse_chat_deduction_sessions(rows)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["ID", "User ID", "User Name", "Email", "Phone", "Amount", "Type", "Reference", "Description", "Created At"])
    for g in grouped:
        email, phone_number, full_name = g["extra"]
        writer.writerow([
            g["id"],
            g["user_id"],
            full_name or f"User #{g['user_id']}",
            email or "",
            phone_number or "",
            float(g["amount"]),
            g["transaction_type"].value if hasattr(g["transaction_type"], "value") else g["transaction_type"],
            g["reference_id"] or "",
            g["description"] or "",
            g["created_at"].strftime("%Y-%m-%d %H:%M:%S") if g["created_at"] else "",
        ])
    buffer.seek(0)
    filename = f"transactions-{role.value.lower()}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

@router.get("/wallets/reconciliation")
def get_wallet_reconciliation(
    only_mismatches: bool = True,
    tolerance: float = 0.01,
    db: Session = Depends(database.get_db),
):
    """Compares each wallet's stored balance against the sum of its own
    transaction ledger, to catch drift from a bug or a manual DB edit that
    the two would otherwise hide from each other. Not a substitute for
    reconciling against Razorpay's settlement reports (out of scope here),
    just an internal self-consistency check."""
    ledger_totals = dict(
        db.query(models.WalletTransaction.user_id, func.sum(models.WalletTransaction.amount))
        .group_by(models.WalletTransaction.user_id)
        .all()
    )

    rows = (
        db.query(models.UserWallet, models.User.email, models.User.phone_number, models.User.role)
        .join(models.User, models.UserWallet.user_id == models.User.id)
        .all()
    )

    results = []
    for wallet, email, phone_number, role in rows:
        stored = float(wallet.balance or 0)
        computed = float(ledger_totals.get(wallet.user_id, Decimal("0")))
        diff = round(stored - computed, 2)
        if only_mismatches and abs(diff) <= tolerance:
            continue
        results.append({
            "user_id": wallet.user_id,
            "email": email,
            "phone_number": phone_number,
            "role": role,
            "stored_balance": stored,
            "computed_balance": computed,
            "diff": diff,
        })

    results.sort(key=lambda r: abs(r["diff"]), reverse=True)
    return {"total_wallets_checked": len(rows), "mismatches": len(results), "results": results}

class WalletAdjustmentRequest(BaseModel):
    amount: float
    description: str = "Admin adjustment"
    # Optional client-generated key (e.g. a UUID minted once per button click)
    # so a double-click or retried request reuses the original transaction
    # instead of adjusting the wallet twice.
    idempotency_key: Optional[str] = None

@router.post("/users/{user_id}/wallet/credit")
def admin_wallet_credit(
    user_id: int,
    body: WalletAdjustmentRequest,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    """Manually credit or debit a user's wallet. Positive amount = credit, negative = debit."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if body.idempotency_key:
        existing = db.query(models.WalletTransaction).filter(
            models.WalletTransaction.idempotency_key == body.idempotency_key
        ).first()
        if existing:
            wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == user_id).first()
            return {"new_balance": float(wallet.balance) if wallet else 0.0, "message": "Wallet adjustment already applied"}

    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == user_id).first()
    if not wallet:
        wallet = models.UserWallet(user_id=user_id, balance=Decimal("0.00"))
        db.add(wallet)

    new_balance = float(wallet.balance) + body.amount
    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Adjustment would result in negative balance")

    cap = get_wallet_cap(user)
    if cap is not None and body.amount > 0 and Decimal(str(new_balance)) > cap:
        raise HTTPException(
            status_code=400,
            detail=f"This credit would exceed the maximum wallet balance of ₹{cap} allowed for this user."
        )

    wallet.balance = Decimal(str(new_balance))
    tx = models.WalletTransaction(
        user_id=user_id,
        amount=Decimal(str(body.amount)),
        transaction_type=models.TransactionType.DEPOSIT if body.amount > 0 else models.TransactionType.WITHDRAWAL,
        description=body.description,
        idempotency_key=body.idempotency_key,
    )
    db.add(tx)

    audit.log(
        db,
        action="WALLET_ADJUSTED",
        actor_id=current_admin.id,
        resource_type="user",
        resource_id=user_id,
        details={
            "adjustment_amount": body.amount,
            "new_balance": new_balance,
            "description": body.description
        }
    )
    try:
        db.commit()
    except IntegrityError:
        # Lost the race to a concurrent request with the same idempotency key.
        db.rollback()
        wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == user_id).first()
        return {"new_balance": float(wallet.balance) if wallet else 0.0, "message": "Wallet adjustment already applied"}
    return {"new_balance": new_balance, "message": "Wallet adjusted successfully"}

@router.get("/astrologers/pending")
def list_pending_astrologers(db: Session = Depends(database.get_db)):
    # Join User and Profile to get pending astrologers
    results = db.query(models.User, models.AstrologerProfile).join(
        models.AstrologerProfile, models.User.id == models.AstrologerProfile.user_id
    ).filter(
        models.User.role == models.UserRole.ASTROLOGER,
        models.AstrologerProfile.is_approved == False
    ).all()
    
    pending = []
    for user, profile in results:
        data = {
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "profile": {
                "full_name": profile.full_name,
                "short_bio": profile.short_bio,
                "experience_years": profile.experience_years,
                "languages": profile.languages,
                "astrology_types": profile.astrology_types,
                "profile_picture_url": profile.profile_picture_url,
                "id_proof_url": profile.id_proof_url,
                "city": profile.city,
                "legal_agreement_accepted": profile.legal_agreement_accepted
            }
        }
        pending.append(data)
    return pending

@router.post("/astrologers/{user_id}/approve")
def approve_astrologer(user_id: int, request: ApproveAstrologerRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.is_approved = True
    user.is_active = True
    if request.consultation_fee_per_min is not None:
        profile.consultation_fee_per_min = Decimal(str(request.consultation_fee_per_min))
    astrologer_email = user.email
    db.commit()

    if astrologer_email:
        subject, html_body = build_astrologer_approved_email()
        send_email(background_tasks, [astrologer_email], subject, html_body)

    return {"message": "Astrologer approved successfully"}


@router.post("/astrologers/{user_id}/reject")
def reject_astrologer(user_id: int, request: RejectAstrologerRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    profile.is_approved = False
    profile.onboarding_stage = models.OnboardingStage.REJECTED
    user.is_active = False
    astrologer_email = user.email
    db.commit()

    if astrologer_email:
        subject, html_body = build_astrologer_rejected_email(request.reason)
        send_email(background_tasks, [astrologer_email], subject, html_body)

    return {"message": "Astrologer application rejected"}


# --- Onboarding pipeline (Kanban) --------------------------------------------

# Email builder per stage entered. Stages with no email map to None.
_ONBOARDING_EMAIL_BUILDERS = {
    models.OnboardingStage.INTERVIEW_SCHEDULED: lambda p, r: build_interview_scheduled_email(
        p.full_name, r.date, r.time, r.interviewer, r.meeting_link
    ),
    models.OnboardingStage.PROFILE_ACTIVATED: lambda p, r: build_profile_activation_email(p.full_name),
    models.OnboardingStage.ONBOARDING_INTIMATED: lambda p, r: build_onboarding_welcome_email(p.full_name),
    models.OnboardingStage.ONBOARDING_STARTED: lambda p, r: build_onboarding_started_email(p.full_name),
    models.OnboardingStage.TRAINING_SCHEDULED: lambda p, r: build_growth_meeting_email(
        p.full_name, r.day, r.date, r.time, r.timezone, r.meeting_link
    ),
}

# Stages that get a .ics calendar invite (in addition to the templated email)
# alongside the meeting summary text used as the invite's title.
_ONBOARDING_CALENDAR_SUMMARIES = {
    models.OnboardingStage.INTERVIEW_SCHEDULED: lambda p: f"Aadikarta Interview - {p.full_name}",
    models.OnboardingStage.TRAINING_SCHEDULED: lambda p: f"Aadikarta Growth & Training Meeting - {p.full_name}",
}


@router.get("/astrologers/onboarding")
def list_onboarding_astrologers(db: Session = Depends(database.get_db)):
    """All astrologers with their onboarding stage, for the Kanban board."""
    results = db.query(models.User, models.AstrologerProfile).join(
        models.AstrologerProfile, models.User.id == models.AstrologerProfile.user_id
    ).filter(
        models.User.role == models.UserRole.ASTROLOGER
    ).all()

    cards = []
    for user, profile in results:
        cards.append({
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "onboarding_stage": profile.onboarding_stage.value if profile.onboarding_stage else models.OnboardingStage.APPLIED.value,
            "onboarding_meta": profile.onboarding_meta or {},
            "is_approved": profile.is_approved,
            "profile": {
                "full_name": profile.full_name,
                "short_bio": profile.short_bio,
                "experience_years": profile.experience_years,
                "languages": profile.languages,
                "astrology_types": profile.astrology_types,
                "profile_picture_url": profile.profile_picture_url,
                "id_proof_url": profile.id_proof_url,
                "city": profile.city,
                "legal_agreement_accepted": profile.legal_agreement_accepted,
            },
        })
    return cards


@router.post("/astrologers/{user_id}/onboarding/advance")
def advance_onboarding(
    user_id: int,
    request: AdvanceOnboardingRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(database.get_db),
):
    """Move an astrologer to a target onboarding stage and send the matching step email."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    target = request.target_stage
    profile.onboarding_stage = target
    # Restart the stall clock and reminder count for the new stage.
    profile.onboarding_stage_updated_at = datetime.utcnow()
    profile.onboarding_reminder_count = 0
    profile.onboarding_reminder_last_sent_at = None

    # Persist the entered email fields for card re-display.
    meta = dict(profile.onboarding_meta or {})
    provided = {
        k: v for k, v in {
            "date": request.date,
            "time": request.time,
            "interviewer": request.interviewer,
            "meeting_link": request.meeting_link,
            "day": request.day,
            "timezone": request.timezone,
        }.items() if v
    }
    if provided:
        meta[target.value] = provided
        profile.onboarding_meta = meta

    # Stage side effects.
    if target == models.OnboardingStage.PROFILE_ACTIVATED:
        profile.is_approved = True
        user.is_active = True
        if request.consultation_fee_per_min is not None:
            profile.consultation_fee_per_min = Decimal(str(request.consultation_fee_per_min))
    elif target == models.OnboardingStage.REJECTED:
        profile.is_approved = False
        user.is_active = False

    astrologer_email = user.email
    db.commit()

    builder = _ONBOARDING_EMAIL_BUILDERS.get(target)
    if builder and astrologer_email:
        subject, html_body = builder(profile, request)
        recipients = [astrologer_email]
        attachments = None

        summary_builder = _ONBOARDING_CALENDAR_SUMMARIES.get(target)
        if summary_builder:
            ics_bytes = build_meeting_ics(
                uid=f"onboarding-{target.value}-{user_id}@aadikarta.org",
                summary=summary_builder(profile),
                date=request.date,
                time=request.time,
                location=request.meeting_link or "",
                attendee_emails=[astrologer_email, ONBOARDING_CALENDAR_ATTENDEE],
            )
            if ics_bytes:
                # Send the invite to the internal mailbox too so it lands in
                # its own calendar, not just the ATTENDEE field of the ics.
                recipients.append(ONBOARDING_CALENDAR_ATTENDEE)
                attachments = [{
                    "filename": "invite.ics",
                    "content": base64.b64encode(ics_bytes).decode("ascii"),
                    "content_type": "text/calendar; method=REQUEST",
                }]

        send_email(background_tasks, recipients, subject, html_body, attachments=attachments)

    return {"message": f"Astrologer moved to {target.value}", "onboarding_stage": target.value}


@router.get("/edu/stats", response_model=schemas_edu.AdminEduStatsResponse)
def get_edu_stats(
    days: Optional[int] = 30,
    batch_id: Optional[int] = None,
    course_id: Optional[int] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(
        models_edu.BatchEnrollment,
        models.User.email,
        models_edu.Course.title,
        models_edu.Batch.name,
        models_edu.Course.price
    ).join(
        models.User, models_edu.BatchEnrollment.user_id == models.User.id
    ).join(
        models_edu.Batch, models_edu.BatchEnrollment.batch_id == models_edu.Batch.id
    ).join(
        models_edu.Course, models_edu.Batch.course_id == models_edu.Course.id
    )

    if days and days > 0:
        start_date = datetime.utcnow() - timedelta(days=days)
        query = query.filter(models_edu.BatchEnrollment.enrolled_at >= start_date)

    if batch_id:
        query = query.filter(models_edu.BatchEnrollment.batch_id == batch_id)
    
    if course_id:
        query = query.filter(models_edu.Batch.course_id == course_id)

    results = query.order_by(models_edu.BatchEnrollment.enrolled_at.desc()).all()

    enrollments = []
    total_earnings = 0.0
    for enrollment, email, course_title, batch_name, price in results:
        enrollments.append(schemas_edu.AdminEnrollmentDetail(
            id=enrollment.id,
            user_id=enrollment.user_id,
            user_email=email,
            course_title=course_title,
            batch_name=batch_name,
            price=price,
            enrolled_at=enrollment.enrolled_at
        ))
        total_earnings += float(price or 0)

    return schemas_edu.AdminEduStatsResponse(
        total_enrollments=len(enrollments),
        total_earnings=total_earnings,
        enrollments=enrollments
    )

@router.put("/users/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    request: schemas.AdminPasswordResetRequest,
    background_tasks: BackgroundTasks,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db)
):
    """
    Allows an admin to directly reset any user's password and sends a notification email.
    """
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(request.new_password)
    
    audit.log(
        db,
        action="USER_PASSWORD_RESET",
        actor_id=current_admin.id,
        resource_type="user",
        resource_id=user_id,
        details={"email": user.email}
    )
    db.commit()

    # Send notification email — never include the password in the email body
    if user.email:
        subject, html_body = build_admin_password_reset_email()
        send_email(background_tasks, [user.email], subject, html_body)

    return {"message": "Password reset successfully and notification email sent."}


@router.get("/audit-logs")
def get_audit_logs(
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    actor_id: Optional[int] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(database.get_db)
):
    q = db.query(models.AuditLog)
    if action:
        q = q.filter(models.AuditLog.action.ilike(f"%{action}%"))
    if resource_type:
        q = q.filter(models.AuditLog.resource_type == resource_type)
    if actor_id:
        q = q.filter(models.AuditLog.actor_id == actor_id)
    total = q.count()
    logs = q.order_by(models.AuditLog.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "logs": [
        {
            "id": l.id,
            "actor_id": l.actor_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "created_at": l.created_at.isoformat() if l.created_at else None
        }
        for l in logs
    ]}


# --- App Settings (WhatsApp gateway, moderation, tunables) ---

@router.get("/settings")
def get_app_settings():
    from ..services import settings_service
    return settings_service.get_all(mask_secrets=True)


@router.put("/settings")
def update_app_settings(values: dict, db: Session = Depends(database.get_db)):
    from ..services import settings_service
    settings_service.set_many(db, {k: ("" if v is None else str(v)) for k, v in values.items()})
    return settings_service.get_all(mask_secrets=True)


# --- Moderation flags ---

@router.get("/moderation-flags")
def list_moderation_flags(status: Optional[str] = None, limit: int = 100, offset: int = 0, db: Session = Depends(database.get_db)):
    q = db.query(models.ModerationFlag)
    if status:
        q = q.filter(models.ModerationFlag.status == status)
    total = q.count()
    flags = q.order_by(models.ModerationFlag.created_at.desc()).offset(offset).limit(limit).all()
    return {"total": total, "flags": [
        {
            "id": f.id,
            "consultation_id": f.consultation_id,
            "message_id": f.message_id,
            "flagged_user_id": f.flagged_user_id,
            "reason": f.reason,
            "snippet": f.snippet,
            "status": f.status.value if hasattr(f.status, "value") else f.status,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        }
        for f in flags
    ]}


@router.post("/moderation-flags/{flag_id}/resolve")
def resolve_moderation_flag(flag_id: int, status: str = "REVIEWED", db: Session = Depends(database.get_db)):
    flag = db.query(models.ModerationFlag).filter(models.ModerationFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Flag not found")
    try:
        flag.status = models.ModerationFlagStatus(status)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid status")
    db.commit()
    return {"status": "ok", "flag_id": flag_id, "new_status": flag.status.value}


@router.patch("/astrologers/{user_id}/commission")
def update_astrologer_commission(user_id: int, request: CommissionUpdateRequest, db: Session = Depends(database.get_db)):
    if not (0 < request.commission_percentage <= 100):
        raise HTTPException(status_code=400, detail="Commission must be between 0 and 100")
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Astrologer profile not found")
    profile.commission_percentage = Decimal(str(request.commission_percentage))
    db.commit()
    return {"message": "Commission updated", "commission_percentage": float(profile.commission_percentage)}


class ConnectRequest(BaseModel):
    phone_number: str


@router.get("/whatsapp/status")
async def get_whatsapp_status(db: Session = Depends(database.get_db)):
    from ..services.whatsapp_service import _get_config
    from ..services import settings_service
    from waplex import WAPlexClient, WAPlexError
    
    config = _get_config()
    if not config.base_url or not config.admin_key:
        return {"is_configured": False, "status": "NOT_CONFIGURED"}
    
    api_key = settings_service.get_setting("waplex_api_key")
    if not api_key:
        return {"is_configured": True, "status": "DISCONNECTED", "provisioned": False}
        
    try:
        async with WAPlexClient(config) as client:
            status = await client.get_status(api_key)
            return {
                "is_configured": True,
                "status": status.get("status"),
                "qrcode": status.get("qrcode"),
                "pairing_code": status.get("pairing_code") or status.get("code"),
                "provisioned": True
            }
    except WAPlexError as e:
        if e.status_code == 404:
            # Session not found on evolution gateway - clear local settings so we can re-provision
            settings_service.set_setting(db, "waplex_tenant_id", "")
            settings_service.set_setting(db, "waplex_api_key", "")
            return {"is_configured": True, "status": "DISCONNECTED", "provisioned": False}
        raise HTTPException(status_code=502, detail=f"WAPlex error: {e}")


@router.post("/whatsapp/connect")
async def connect_whatsapp(body: ConnectRequest, db: Session = Depends(database.get_db)):
    from ..services.whatsapp_service import _get_config
    from ..services import settings_service
    from waplex import WAPlexClient, ensure_provisioned, WAPlexError
    
    config = _get_config()
    if not config.base_url or not config.admin_key:
        raise HTTPException(status_code=400, detail="WAPlex is not configured")
        
    number = body.phone_number.replace("+", "").replace(" ", "").strip()
    if not number.isdigit():
        raise HTTPException(status_code=400, detail="Phone number must contain only digits")
        
    # Provision platform if not done
    api_key = settings_service.get_setting("waplex_api_key")
    tenant_id = settings_service.get_setting("waplex_tenant_id")
    
    if not api_key:
        try:
            async with WAPlexClient(config) as client:
                result = await ensure_provisioned(
                    client,
                    name="astro_platform",
                    webhook_url=config.inbound_url(),
                    existing_key=None,
                    existing_id=None
                )
                api_key = result.api_key
                tenant_id = result.tenant_id
                settings_service.set_setting(db, "waplex_tenant_id", tenant_id)
                settings_service.set_setting(db, "waplex_api_key", api_key)
        except WAPlexError as e:
            raise HTTPException(status_code=502, detail=f"WAPlex provisioning failed: {e}")
            
    try:
        async with WAPlexClient(config) as client:
            try:
                current = await client.get_status(api_key)
                if str(current.get("status", "")).upper() == "CONNECTING":
                    await client.stop_session(api_key)
            except WAPlexError:
                pass
            result = await client.start_session(api_key, number=number)
            settings_service.set_setting(db, "waplex_phone_number", number)
            return {
                "status": result.get("status") or "CONNECTING",
                "pairing_code": result.get("pairing_code") or result.get("code")
            }
    except WAPlexError as e:
        raise HTTPException(status_code=502, detail=f"WAPlex connection failed: {e}")


@router.post("/whatsapp/disconnect")
async def disconnect_whatsapp(db: Session = Depends(database.get_db)):
    from ..services.whatsapp_service import _get_config
    from ..services import settings_service
    from waplex import WAPlexClient, WAPlexError
    
    config = _get_config()
    api_key = settings_service.get_setting("waplex_api_key")
    if not api_key:
        raise HTTPException(status_code=400, detail="WhatsApp is not connected")
        
    try:
        async with WAPlexClient(config) as client:
            await client.stop_session(api_key)
        settings_service.set_setting(db, "waplex_phone_number", "")
        return {"status": "DISCONNECTED"}
    except WAPlexError as e:
        raise HTTPException(status_code=502, detail=f"WAPlex disconnection failed: {e}")

@router.get("/seo/analytics")
def get_seo_analytics(current_admin: models.User = Depends(get_current_admin)):
    from ..services.gsc_service import fetch_seo_analytics
    data = fetch_seo_analytics()
    if not data.get("configured"):
        raise HTTPException(status_code=503, detail=data.get("error", "GSC not configured"))
    return data
