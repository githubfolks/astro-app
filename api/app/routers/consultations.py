from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List
import asyncio
from .. import models, schemas, database
from .auth import get_current_user

router = APIRouter(
    prefix="/consultations",
    tags=["Consultations"]
)

# --- Consultations ---

@router.post("/", response_model=schemas.Consultation)
def request_consultation(request: schemas.ConsultationCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=400, detail="Only seekers can request consultations")

    # Block concurrent active sessions
    blocking_statuses = [
        models.ConsultationStatus.REQUESTED,
        models.ConsultationStatus.ACCEPTED,
        models.ConsultationStatus.ACTIVE,
        models.ConsultationStatus.PAUSED,
    ]
    existing = db.query(models.Consultation).filter(
        models.Consultation.seeker_id == current_user.id,
        models.Consultation.status.in_(blocking_statuses)
    ).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"You already have an active consultation (id={existing.id}). End it before starting a new one."
        )

    # Get astrologer fee
    astro_profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == request.astrologer_id).first()
    if not astro_profile:
        raise HTTPException(status_code=404, detail="Astrologer not found")

    new_consultation = models.Consultation(
        seeker_id=current_user.id,
        astrologer_id=request.astrologer_id,
        consultation_type=request.consultation_type,
        rate_per_min=astro_profile.consultation_fee_per_min,
        status=models.ConsultationStatus.REQUESTED
    )
    db.add(new_consultation)
    db.commit()
    db.refresh(new_consultation)
    return new_consultation

@router.get("/history", response_model=List[schemas.Consultation])
def get_consultation_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    if current_user.role == models.UserRole.SEEKER:
        return db.query(models.Consultation).filter(models.Consultation.seeker_id == current_user.id).all()
    elif current_user.role == models.UserRole.ASTROLOGER:
        return db.query(models.Consultation).filter(
            models.Consultation.astrologer_id == current_user.id,
            models.Consultation.consultation_type == models.ConsultationType.CHAT
        ).order_by(models.Consultation.created_at.asc()).all()
    return []

@router.get("/{consultation_id}", response_model=schemas.Consultation)
def get_consultation(consultation_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
        
    # Verify access
    if consultation.seeker_id != current_user.id and consultation.astrologer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this consultation")
        
    return consultation

@router.post("/{consultation_id}/resume")
async def resume_consultation(
    consultation_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")

    if current_user.id != consultation.seeker_id and current_user.id != consultation.astrologer_id:
        raise HTTPException(status_code=403, detail="Not authorized to resume this consultation")

    if consultation.status != models.ConsultationStatus.PAUSED:
        raise HTTPException(status_code=400, detail="Consultation is not paused")

    # Balance must cover at least one minute
    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == consultation.seeker_id).first()
    if not wallet or float(wallet.balance) < float(consultation.rate_per_min):
        raise HTTPException(status_code=400, detail="Insufficient balance to resume consultation")

    consultation.status = models.ConsultationStatus.ACTIVE
    db.commit()

    from .chat import billing_loop, manager
    asyncio.create_task(billing_loop(consultation_id, float(consultation.rate_per_min), database.SessionLocal))

    await manager.broadcast(consultation_id, {
        "type": "CONSULTATION_RESUMED",
        "balance": float(wallet.balance)
    })

    return {"status": "resumed", "consultation_id": consultation_id}


# --- Reviews ---

@router.post("/review", response_model=schemas.Review)
def submit_review(review: schemas.ReviewCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # Verify consultation belongs to user and is completed
    consultation = db.query(models.Consultation).filter(models.Consultation.id == review.consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if consultation.seeker_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to review this consultation")
    
    new_review = models.Review(
        consultation_id=review.consultation_id,
        astrologer_id=consultation.astrologer_id,
        seeker_id=current_user.id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    db.commit()
    return new_review

# --- Chat ---

# WebSocket logic moved to routers/chat.py

@router.get("/{consultation_id}/messages", response_model=List[schemas.ChatMessage])
def get_chat_history(consultation_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
    # Verify access
    consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    if current_user.role != models.UserRole.ADMIN:
        if consultation.seeker_id != current_user.id and consultation.astrologer_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to view this chat history")

    msgs = db.query(models.ChatMessage).filter(models.ChatMessage.consultation_id == consultation_id).order_by(models.ChatMessage.timestamp).all()
    return msgs
