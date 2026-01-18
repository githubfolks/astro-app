from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from .. import models, database, schemas_cms, schemas

router = APIRouter(
    prefix="/public",
    tags=["Public Content"]
)

# --- Posts ---

@router.get("/posts", response_model=schemas_cms.PostListResponse)
def get_public_posts(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None, 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Post).filter(models.Post.status == schemas_cms.PostStatus.PUBLISHED)
    
    if search:
        query = query.filter(models.Post.title.ilike(f"%{search}%"))
        
    total = query.count()
    posts = query.order_by(models.Post.published_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "posts": posts}

@router.get("/posts/{slug}", response_model=schemas_cms.Post)
def get_public_post(slug: str, db: Session = Depends(database.get_db)):
    post = db.query(models.Post).filter(
        models.Post.slug == slug,
        models.Post.status == schemas_cms.PostStatus.PUBLISHED
    ).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

# --- Pages ---

@router.get("/pages/{slug}", response_model=schemas_cms.Page)
def get_public_page(slug: str, db: Session = Depends(database.get_db)):
    page = db.query(models.Page).filter(models.Page.slug == slug).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

# --- Horoscopes ---

@router.get("/horoscopes", response_model=List[schemas_cms.Horoscope])
def get_public_horoscopes(
    sign: Optional[schemas_cms.ZodiacSign] = None,
    period: Optional[schemas_cms.HoroscopePeriod] = None,
    date: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Horoscope)
    if sign:
        query = query.filter(models.Horoscope.sign == sign)
    if period:
        query = query.filter(models.Horoscope.period == period)
    if date:
        query = query.filter(models.Horoscope.date == date)
    
    # Defaults: unique entry if all params present, else list
    return query.order_by(models.Horoscope.date.desc()).limit(50).all()

# --- Contact ---

@router.post("/contact", response_model=dict)
def submit_contact_inquiry(
    inquiry: schemas.ContactInquiryCreate,
    db: Session = Depends(database.get_db)
):
    db_inquiry = models.ContactInquiry(**inquiry.model_dump())
    db.add(db_inquiry)
    db.commit()
    db.refresh(db_inquiry)
    return {"message": "Inquiry submitted successfully", "id": db_inquiry.id}
