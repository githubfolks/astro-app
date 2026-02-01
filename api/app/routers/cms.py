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
    # Generate slug from title
    slug = slugify(post.title)
    
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
        # Optionally update slug, but usually better to keep it stable or make it explicit
        # db_post.slug = slugify(post_update.title) 
        
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

# --- Pages (Static Content) ---

@router.post("/pages", response_model=schemas_cms.Page)
def create_page(page: schemas_cms.PageCreate, db: Session = Depends(database.get_db)):
    slug = slugify(page.title)
    if db.query(models.Page).filter(models.Page.slug == slug).first():
        raise HTTPException(status_code=400, detail="Page with this title already exists")

    db_page = models.Page(
        title=page.title,
        slug=slug,
        content=page.content,
        seo_title=page.seo_title,
        seo_description=page.seo_description
    )
    db.add(db_page)
    db.commit()
    db.refresh(db_page)
    return db_page

@router.get("/pages", response_model=schemas_cms.PageListResponse)
def list_pages(skip: int = 0, limit: int = 20, db: Session = Depends(database.get_db)):
    total = db.query(models.Page).count()
    pages = db.query(models.Page).order_by(models.Page.title).offset(skip).limit(limit).all()
    return {"total": total, "pages": pages}

@router.get("/pages/{page_id}", response_model=schemas_cms.Page)
def get_page(page_id: int, db: Session = Depends(database.get_db)):
    page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if not page:
        raise HTTPException(status_code=404, detail="Page not found")
    return page

@router.put("/pages/{page_id}", response_model=schemas_cms.Page)
def update_page(page_id: int, page_update: schemas_cms.PageUpdate, db: Session = Depends(database.get_db)):
    db_page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")

    if page_update.title:
        db_page.title = page_update.title
    if page_update.content:
        db_page.content = page_update.content
    if page_update.seo_title is not None:
        db_page.seo_title = page_update.seo_title
    if page_update.seo_description is not None:
        db_page.seo_description = page_update.seo_description
    if page_update.slug is not None:
        new_slug = slugify(page_update.slug) if page_update.slug else slugify(page_update.title)
        # Check uniqueness if changed
        if new_slug != db_page.slug:
             if db.query(models.Page).filter(models.Page.slug == new_slug).first():
                raise HTTPException(status_code=400, detail="Page with this slug already exists")
             db_page.slug = new_slug
        
    db.commit()
    db.refresh(db_page)
    return db_page

@router.delete("/pages/{page_id}")
def delete_page(page_id: int, db: Session = Depends(database.get_db)):
    db_page = db.query(models.Page).filter(models.Page.id == page_id).first()
    if not db_page:
        raise HTTPException(status_code=404, detail="Page not found")
    db.delete(db_page)
    db.commit()
    return {"message": "Page deleted"}

# --- Horoscopes ---

@router.post("/horoscopes", response_model=schemas_cms.Horoscope)
def create_horoscope(horoscope: schemas_cms.HoroscopeCreate, db: Session = Depends(database.get_db)):
    # Check if exists (composite unique constraint logical check)
    existing = db.query(models.Horoscope).filter(
        models.Horoscope.sign == horoscope.sign,
        models.Horoscope.period == horoscope.period,
        models.Horoscope.date == horoscope.date
    ).first()
    
    if existing:
         raise HTTPException(status_code=400, detail="Horoscope for this sign, period and date already exists")

    db_horoscope = models.Horoscope(**horoscope.dict())
    db.add(db_horoscope)
    db.commit()
    db.refresh(db_horoscope)
    return db_horoscope

@router.get("/horoscopes", response_model=List[schemas_cms.Horoscope])
def list_horoscopes(
    sign: Optional[schemas_cms.ZodiacSign] = None,
    period: Optional[schemas_cms.HoroscopePeriod] = None,
    date: Optional[str] = None, # YYYY-MM-DD
    db: Session = Depends(database.get_db)
):
    query = db.query(models.Horoscope)
    if sign:
        query = query.filter(models.Horoscope.sign == sign)
    if period:
        query = query.filter(models.Horoscope.period == period)
    if date:
        query = query.filter(models.Horoscope.date == date)
        
    return query.order_by(models.Horoscope.date.desc()).limit(50).all()

@router.get("/horoscopes/{horoscope_id}", response_model=schemas_cms.Horoscope)
def get_horoscope(horoscope_id: int, db: Session = Depends(database.get_db)):
    horoscope = db.query(models.Horoscope).filter(models.Horoscope.id == horoscope_id).first()
    if not horoscope:
        raise HTTPException(status_code=404, detail="Horoscope not found")
    return horoscope

@router.put("/horoscopes/{horoscope_id}", response_model=schemas_cms.Horoscope)
def update_horoscope(horoscope_id: int, update: schemas_cms.HoroscopeUpdate, db: Session = Depends(database.get_db)):
    db_horoscope = db.query(models.Horoscope).filter(models.Horoscope.id == horoscope_id).first()
    if not db_horoscope:
        raise HTTPException(status_code=404, detail="Horoscope not found")
        
    if update.content:
        # Deep merge or replace? Replace is safer for JSON content to avoid ambiguity
        db_horoscope.content = update.content
        
    db.commit()
    db.refresh(db_horoscope)
    return db_horoscope

@router.delete("/horoscopes/{horoscope_id}")
def delete_horoscope(horoscope_id: int, db: Session = Depends(database.get_db)):
    db_h = db.query(models.Horoscope).filter(models.Horoscope.id == horoscope_id).first()
    if not db_h:
        raise HTTPException(status_code=404, detail="Horoscope not found")
    db.delete(db_h)
    db.commit()
    return {"message": "Horoscope deleted"}

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
