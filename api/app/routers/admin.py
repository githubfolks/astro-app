from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from typing import List, Optional
import shutil
import uuid
import os
from datetime import datetime, timedelta
from .. import models, schemas, database
from .. import models, schemas, database
from .auth import get_current_admin, get_password_hash
import cloudinary
import cloudinary.uploader

cloudinary.config(
  cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME'),
  api_key = os.getenv('CLOUDINARY_API_KEY'),
  api_secret = os.getenv('CLOUDINARY_API_SECRET'),
  secure = True
)

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)]
)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Upload to Cloudinary
        # file.file is a SpooledTemporaryFile which acts like a file object
        result = cloudinary.uploader.upload(file.file, folder="admin_uploads")
        return {"url": result.get("secure_url")}
    except Exception as e:
        print(f"Cloudinary upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

@router.get("/dashboard_stats")
def get_dashboard_stats(db: Session = Depends(database.get_db)):
    # 1. Summary Counts
    total_users = db.query(models.User).count()
    total_seekers = db.query(models.User).filter(models.User.role == models.UserRole.SEEKER).count()
    total_astrologers = db.query(models.User).filter(models.User.role == models.UserRole.ASTROLOGER).count()
    
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
            "total_active_astrologers": total_astrologers, # TODO: Filter by is_active if needed
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
    query = db.query(models.User)
    
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
    users = query.order_by(models.User.id.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "users": users} 

# Let's define a proper schema for listing users locally here or in schemas.py
# For speed I'll just return raw dicts by dropping response_model if strict schema not needed immediately, 
# but better to add a schema.

@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
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
from pydantic import BaseModel

class UserStatusUpdate(BaseModel):
    is_active: bool

@router.put("/users/{user_id}/status")
def update_user_status(user_id: int, status_update: UserStatusUpdate, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_active = status_update.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'} successfully", "is_active": user.is_active}

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
    
    # Create Profile
    new_profile = models.AstrologerProfile(
        user_id=new_user.id,
        full_name=astrologer.full_name,
        short_bio=astrologer.short_bio,
        about_me=astrologer.about_me,
        experience_years=astrologer.experience_years,
        languages=astrologer.languages,
        specialties=astrologer.specialties,
        consultation_fee_per_min=astrologer.consultation_fee_per_min,
        availability_hours=astrologer.availability_hours,
        profile_picture_url=astrologer.profile_picture_url,
        is_online=False
    )
    db.add(new_profile)
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
                "short_bio": profile.short_bio,
                "about_me": profile.about_me,
                "profile_picture_url": profile.profile_picture_url,
                "experience_years": profile.experience_years,
                "languages": profile.languages,
                "specialties": profile.specialties,
                "consultation_fee_per_min": profile.consultation_fee_per_min,
                "availability_hours": profile.availability_hours,
                "rating_avg": profile.rating_avg
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
    profile.short_bio = data.short_bio
    profile.about_me = data.about_me
    profile.experience_years = data.experience_years
    profile.languages = data.languages
    profile.specialties = data.specialties
    profile.consultation_fee_per_min = data.consultation_fee_per_min
    profile.availability_hours = data.availability_hours
    profile.profile_picture_url = data.profile_picture_url
    
    db.commit()
    return {"message": "Astrologer updated successfully"}

@router.get("/astrologers/{user_id}/consultations")
def get_astrologer_consultations(user_id: int, db: Session = Depends(database.get_db)):
    # Fetch consultations for this astrologer
    # Eager load seeker info if possible, but for now we just return the raw consultation objects
    # schemas.Consultation model dumps seeker_profile if available
    consultations = db.query(models.Consultation).filter(models.Consultation.astrologer_id == user_id).order_by(models.Consultation.created_at.desc()).all()
    return consultations

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
                "experience_years": p.experience_years
            }
    
    # Get Wallet Balance
    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == user_id).first()
    balance = wallet.balance if wallet else 0.0
    
    # Get Total Consultancy Stats
    total_consultations = db.query(models.Consultation).filter(models.Consultation.seeker_id == user_id).count()
    total_spent = db.query(func.sum(models.Consultation.total_cost)).filter(models.Consultation.seeker_id == user_id).scalar() or 0.0
    
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "phone_number": user.phone_number,
            "role": user.role,
            "is_verified": user.is_verified,
            "created_at": user.created_at
        },
        "profile": profile_data,
        "wallet_balance": balance,
        "stats": {
            "total_consultations": total_consultations,
            "total_spent": total_spent
        }
    }

@router.get("/users/{user_id}/consultations")
def get_user_consultations(user_id: int, db: Session = Depends(database.get_db)):
    # Fetch consultations where user is seeker
    # Eager load astrologer profile to show name
    consultations = db.query(models.Consultation).filter(models.Consultation.seeker_id == user_id).order_by(models.Consultation.created_at.desc()).all()
    # Since we return schema models, we might need to maximize what we return. 
    # For now returning connection as is.
    return consultations

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
def approve_astrologer(user_id: int, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    profile.is_approved = True
    user.is_active = True # Allow login
    db.commit()
    return {"message": "Astrologer approved successfully"}
