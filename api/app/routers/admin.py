from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .. import models, schemas, database
from .auth import get_current_admin, get_password_hash

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(get_current_admin)]
)

@router.get("/stats")
def get_stats(db: Session = Depends(database.get_db)):
    total_users = db.query(models.User).count()
    total_seekers = db.query(models.User).filter(models.User.role == models.UserRole.SEEKER).count()
    total_astrologers = db.query(models.User).filter(models.User.role == models.UserRole.ASTROLOGER).count()
    total_consultations = db.query(models.Consultation).count()
    
    return {
        "total_users": total_users,
        "total_seekers": total_seekers,
        "total_astrologers": total_astrologers,
        "total_consultations": total_consultations
    }

@router.get("/users", response_model=List[schemas.AdminUserListItem])
def list_users(skip: int = 0, limit: int = 100, role: Optional[models.UserRole] = None, db: Session = Depends(database.get_db)):
    query = db.query(models.User)
    if role:
        query = query.filter(models.User.role == role)
    users = query.offset(skip).limit(limit).all()
    return users 

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
    return {"message": "User verified"}

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
