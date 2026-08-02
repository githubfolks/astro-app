from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from .. import models, database, schemas_cms, schemas
from ..limiter import limiter
from ..services import settings_service
from fastapi import Request

router = APIRouter(
    prefix="/public",
    tags=["Public Content"]
)

# --- Support Contact ---

@router.get("/support-contact")
def get_support_contact():
    """Support email/phone as configured in Admin > Settings > Support Contact."""
    return {
        "support_email": settings_service.get_setting("support_email"),
        "support_phone": settings_service.get_setting("support_phone"),
    }

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

# --- Trust Signals ---

def _first_name_last_initial(full_name: Optional[str]) -> str:
    parts = (full_name or "").split()
    if not parts:
        return "A Seeker"
    if len(parts) == 1:
        return parts[0]
    return f"{parts[0]} {parts[-1][0]}."

@router.get("/trust-stats", response_model=schemas.TrustStats)
def get_trust_stats(db: Session = Depends(database.get_db)):
    """Real, aggregate platform numbers for homepage trust signals."""
    verified_astrologers = db.query(models.AstrologerProfile).filter(
        models.AstrologerProfile.is_approved == True
    ).count()
    total_consultations = db.query(func.coalesce(func.sum(models.AstrologerProfile.total_consultations), 0)).scalar()
    total_reviews = db.query(models.Review).count()
    average_rating = db.query(func.coalesce(func.avg(models.Review.rating), 0)).scalar()
    return schemas.TrustStats(
        verified_astrologers=verified_astrologers,
        total_consultations=int(total_consultations or 0),
        total_reviews=total_reviews,
        average_rating=round(float(average_rating or 0), 1),
    )

@router.get("/reviews", response_model=List[schemas.PublicReview])
def get_public_reviews(limit: int = 8, astrologer_id: Optional[int] = None, db: Session = Depends(database.get_db)):
    """Recent, genuinely submitted reviews with written feedback, for homepage and profile testimonials."""
    limit = max(1, min(limit, 20))
    query = db.query(models.Review).filter(
        models.Review.rating >= 4,
        models.Review.comment.isnot(None),
        models.Review.comment != "",
        models.Review.display_status == models.ReviewDisplayStatus.APPROVED,
    )
    if astrologer_id is not None:
        query = query.filter(models.Review.astrologer_id == astrologer_id)
    reviews = query.order_by(models.Review.created_at.desc()).limit(limit).all()
    result = []
    for r in reviews:
        seeker_name = _first_name_last_initial(
            r.seeker.seeker_profile.full_name if r.seeker and r.seeker.seeker_profile else None
        )
        astro_profile = r.astrologer.astrologer_profile if r.astrologer else None
        astro_name = (astro_profile.display_name or astro_profile.full_name) if astro_profile else "our astrologer"
        result.append(schemas.PublicReview(
            rating=r.rating,
            comment=r.comment,
            created_at=r.created_at,
            seeker_display_name=seeker_name,
            astrologer_display_name=astro_name,
        ))
    return result

# --- Contact ---

@router.post("/contact", response_model=dict)
@limiter.limit("2/minute")
def submit_contact_inquiry(
    request: Request,
    inquiry: schemas.ContactInquiryCreate,
    db: Session = Depends(database.get_db)
):
    db_inquiry = models.ContactInquiry(**inquiry.model_dump())
    db.add(db_inquiry)
    db.commit()
    db.refresh(db_inquiry)
    return {"message": "Inquiry submitted successfully", "id": db_inquiry.id}


@router.post("/whatsapp/waplex/inbound")
async def waplex_inbound(request: Request):
    from ..services.whatsapp_service import get_webhook_secret
    expected_secret = get_webhook_secret()
    if expected_secret and request.query_params.get("secret") != expected_secret:
        raise HTTPException(status_code=404)

    from waplex import parse_connection_update
    try:
        payload = await request.json()
        state = parse_connection_update(payload)
        if state:
            print(f"[WAPlex Webhook] connection update: {state}")
            return {"status": "ok", "event": "connection.update", "state": state}
    except Exception as e:
        print(f"[WAPlex Webhook] error: {e}")
    return {"status": "ignored"}




