from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from slugify import slugify
from datetime import datetime
from .. import models, database, schemas_cms
from .auth import get_current_admin

router = APIRouter(
    prefix="/cms",
    tags=["CMS"],
    dependencies=[Depends(get_current_admin)]
)

# --- Posts (Blog) ---

@router.post("/posts", response_model=schemas_cms.Post)
def create_post(post: schemas_cms.PostCreate, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_admin)):
    # Generate slug from provided slug or title
    slug = slugify(post.slug) if post.slug else slugify(post.title)
    
    # Check for duplicate slug
    if db.query(models.Post).filter(models.Post.slug == slug).first():
        # Append unique suffix if duplicate (simple strategy)
        count = db.query(models.Post).filter(models.Post.slug.like(f"{slug}%")).count()
        slug = f"{slug}-{count + 1}"

    db_post = models.Post(
        title=post.title,
        slug=slug,
        content=post.content,
        featured_image=post.featured_image,
        status=post.status,
        author_id=current_user.id,
        published_at=datetime.utcnow() if post.status == schemas_cms.PostStatus.PUBLISHED else None
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

@router.get("/posts", response_model=schemas_cms.PostListResponse)
def list_posts(
    skip: int = 0, 
    limit: int = 20, 
    status: Optional[schemas_cms.PostStatus] = None, 
    search: Optional[str] = None, 
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Post)
    
    if status:
        query = query.filter(models.Post.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(models.Post.title.ilike(search_term))
        
    total = query.count()
    posts = query.order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "posts": posts}

@router.get("/posts/{post_id}", response_model=schemas_cms.Post)
def get_post(post_id: int, db: Session = Depends(database.get_db)):
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post

@router.put("/posts/{post_id}", response_model=schemas_cms.Post)
def update_post(post_id: int, post_update: schemas_cms.PostUpdate, db: Session = Depends(database.get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    
    if post_update.title:
        db_post.title = post_update.title
        
    if post_update.slug:
        new_slug = slugify(post_update.slug)
        if new_slug != db_post.slug:
            if db.query(models.Post).filter(models.Post.slug == new_slug).first():
                raise HTTPException(status_code=400, detail="Post with this slug already exists")
            db_post.slug = new_slug
        
    if post_update.content:
        db_post.content = post_update.content
    if post_update.featured_image is not None:
        db_post.featured_image = post_update.featured_image
    if post_update.status:
        db_post.status = post_update.status
        if post_update.status == schemas_cms.PostStatus.PUBLISHED and not db_post.published_at:
            db_post.published_at = datetime.utcnow()
            
    db.commit()
    db.refresh(db_post)
    return db_post

@router.delete("/posts/{post_id}")
def delete_post(post_id: int, db: Session = Depends(database.get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(db_post)
    db.commit()
    return {"message": "Post deleted"}

# --- Contact Inquiries ---

@router.get("/contact-inquiries", response_model=schemas_cms.ContactInquiryListResponse)
def list_contact_inquiries(
    skip: int = 0, 
    limit: int = 20, 
    status: Optional[schemas_cms.InquiryStatus] = None,
    db: Session = Depends(database.get_db)
):
    query = db.query(models.ContactInquiry)
    
    if status:
        query = query.filter(models.ContactInquiry.status == status)
        
    total = query.count()
    inquiries = query.order_by(models.ContactInquiry.created_at.desc()).offset(skip).limit(limit).all()
    
    return {"total": total, "inquiries": inquiries}
