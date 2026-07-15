from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
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
from ..services.email_service import (
    send_email,
    build_interview_scheduled_email,
    build_profile_activation_email,
    build_onboarding_welcome_email,
    build_onboarding_started_email,
    build_growth_meeting_email,
    build_astrologer_approved_email,
    build_astrologer_rejected_email,
    build_admin_password_reset_email,
)

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

class PremiumUpdate(BaseModel):
    is_premium: bool

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

@router.put("/astrologers/{user_id}/premium")
def update_astrologer_premium(user_id: int, update: PremiumUpdate, db: Session = Depends(database.get_db)):
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Astrologer profile not found")

    profile.is_premium = update.is_premium
    db.commit()
    return {"message": f"Astrologer {'marked premium' if profile.is_premium else 'unmarked premium'}", "is_premium": profile.is_premium}

@router.put("/astrologers/{user_id}/kyc")
def update_astrologer_kyc_verification(user_id: int, update: KycVerifyUpdate, db: Session = Depends(database.get_db)):
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Astrologer profile not found")

    profile.kyc_verified = update.kyc_verified
    profile.kyc_verified_at = datetime.utcnow() if update.kyc_verified else None
    db.commit()
    return {"message": f"KYC {'verified' if profile.kyc_verified else 'marked unverified'}", "kyc_verified": profile.kyc_verified, "kyc_verified_at": profile.kyc_verified_at}

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

@router.get("/users/{user_id}/consultations")
def get_user_consultations(user_id: int, db: Session = Depends(database.get_db)):
    rows = (
        db.query(models.Consultation, models.AstrologerProfile.full_name)
        .outerjoin(models.AstrologerProfile, models.Consultation.astrologer_id == models.AstrologerProfile.user_id)
        .filter(models.Consultation.seeker_id == user_id)
        .order_by(models.Consultation.created_at.desc())
        .all()
    )
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
    return result

@router.get("/users/{user_id}/wallet-history", response_model=List[schemas.WalletTransaction])
def get_user_wallet_history(user_id: int, db: Session = Depends(database.get_db)):
    # Fetch all wallet transactions for the user
    transactions = db.query(models.WalletTransaction).filter(
        models.WalletTransaction.user_id == user_id
    ).order_by(models.WalletTransaction.created_at.desc()).all()
    return transactions

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
    query = (
        db.query(models.WalletTransaction, models.User.email, models.User.phone_number, models.SeekerProfile.full_name)
        .join(models.User, models.WalletTransaction.user_id == models.User.id)
        .outerjoin(models.SeekerProfile, models.WalletTransaction.user_id == models.SeekerProfile.user_id)
        .filter(models.User.role == role)
    )

    if transaction_type:
        query = query.filter(models.WalletTransaction.transaction_type == transaction_type)

    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (models.User.email.ilike(search_term)) |
            (models.User.phone_number.ilike(search_term)) |
            (models.SeekerProfile.full_name.ilike(search_term))
        )

    total = query.count()
    rows = query.order_by(models.WalletTransaction.created_at.desc()).offset(skip).limit(limit).all()

    transactions = []
    for txn, email, phone_number, full_name in rows:
        transactions.append({
            "id": txn.id,
            "user_id": txn.user_id,
            "user_name": full_name or f"User #{txn.user_id}",
            "email": email,
            "phone_number": phone_number,
            "amount": float(txn.amount),
            "transaction_type": txn.transaction_type,
            "reference_id": txn.reference_id,
            "description": txn.description,
            "created_at": txn.created_at,
        })

    return {"total": total, "transactions": transactions}

class WalletAdjustmentRequest(BaseModel):
    amount: float
    description: str = "Admin adjustment"

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

    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == user_id).first()
    if not wallet:
        wallet = models.UserWallet(user_id=user_id, balance=Decimal("0.00"))
        db.add(wallet)

    new_balance = float(wallet.balance) + body.amount
    if new_balance < 0:
        raise HTTPException(status_code=400, detail="Adjustment would result in negative balance")

    wallet.balance = Decimal(str(new_balance))
    tx = models.WalletTransaction(
        user_id=user_id,
        amount=Decimal(str(body.amount)),
        transaction_type=models.TransactionType.DEPOSIT if body.amount > 0 else models.TransactionType.WITHDRAWAL,
        description=body.description,
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
    db.commit()
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
        send_email(background_tasks, [astrologer_email], subject, html_body)

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
