from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Literal
from pydantic import BaseModel
import os
import re
import uuid
import httpx
from slugify import slugify
from datetime import datetime
from .. import models, database, schemas_cms
from .auth import get_current_admin
from ..services import settings_service, content_studio_images

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
        excerpt=post.excerpt,
        featured_image=post.featured_image,
        author_name=post.author_name,
        faqs=post.faqs,
        seo_keywords_facebook=post.seo_keywords_facebook,
        seo_keywords_instagram=post.seo_keywords_instagram,
        seo_keywords_youtube=post.seo_keywords_youtube,
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
    if post_update.excerpt is not None:
        db_post.excerpt = post_update.excerpt
    if post_update.featured_image is not None:
        db_post.featured_image = post_update.featured_image
    if post_update.author_name is not None:
        db_post.author_name = post_update.author_name
    if post_update.faqs is not None:
        db_post.faqs = post_update.faqs
    if post_update.seo_keywords_facebook is not None:
        db_post.seo_keywords_facebook = post_update.seo_keywords_facebook
    if post_update.seo_keywords_instagram is not None:
        db_post.seo_keywords_instagram = post_update.seo_keywords_instagram
    if post_update.seo_keywords_youtube is not None:
        db_post.seo_keywords_youtube = post_update.seo_keywords_youtube
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

# --- Horoscopes (editorial content: daily/weekly/monthly/yearly per sign) ---

class HoroscopeListResponse(BaseModel):
    total: int
    horoscopes: List[schemas_cms.Horoscope]

@router.post("/horoscopes", response_model=schemas_cms.Horoscope)
def create_horoscope(horoscope: schemas_cms.HoroscopeCreate, db: Session = Depends(database.get_db)):
    existing = db.query(models.Horoscope).filter(
        models.Horoscope.sign == horoscope.sign,
        models.Horoscope.period == horoscope.period,
        models.Horoscope.date == horoscope.date,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="A horoscope entry for this sign, period, and date already exists")

    db_horoscope = models.Horoscope(**horoscope.model_dump())
    db.add(db_horoscope)
    db.commit()
    db.refresh(db_horoscope)
    return db_horoscope

@router.get("/horoscopes", response_model=HoroscopeListResponse)
def list_horoscopes(
    skip: int = 0,
    limit: int = 20,
    sign: Optional[schemas_cms.ZodiacSign] = None,
    period: Optional[schemas_cms.HoroscopePeriod] = None,
    db: Session = Depends(database.get_db),
):
    query = db.query(models.Horoscope)
    if sign:
        query = query.filter(models.Horoscope.sign == sign)
    if period:
        query = query.filter(models.Horoscope.period == period)
    total = query.count()
    horoscopes = query.order_by(models.Horoscope.date.desc()).offset(skip).limit(limit).all()
    return {"total": total, "horoscopes": horoscopes}

@router.get("/horoscopes/{horoscope_id}", response_model=schemas_cms.Horoscope)
def get_horoscope(horoscope_id: int, db: Session = Depends(database.get_db)):
    db_horoscope = db.query(models.Horoscope).filter(models.Horoscope.id == horoscope_id).first()
    if not db_horoscope:
        raise HTTPException(status_code=404, detail="Horoscope not found")
    return db_horoscope

@router.put("/horoscopes/{horoscope_id}", response_model=schemas_cms.Horoscope)
def update_horoscope(horoscope_id: int, horoscope_update: schemas_cms.HoroscopeUpdate, db: Session = Depends(database.get_db)):
    db_horoscope = db.query(models.Horoscope).filter(models.Horoscope.id == horoscope_id).first()
    if not db_horoscope:
        raise HTTPException(status_code=404, detail="Horoscope not found")
    if horoscope_update.content is not None:
        db_horoscope.content = horoscope_update.content
    db.commit()
    db.refresh(db_horoscope)
    return db_horoscope

@router.delete("/horoscopes/{horoscope_id}")
def delete_horoscope(horoscope_id: int, db: Session = Depends(database.get_db)):
    db_horoscope = db.query(models.Horoscope).filter(models.Horoscope.id == horoscope_id).first()
    if not db_horoscope:
        raise HTTPException(status_code=404, detail="Horoscope not found")
    db.delete(db_horoscope)
    db.commit()
    return {"message": "Horoscope deleted"}

# --- Social Media Share / Generation endpoints ---

class GenerateSocialRequest(BaseModel):
    title: str
    content: str
    platform: Literal["facebook", "instagram", "twitter", "linkedin"]

class ShareSocialRequest(BaseModel):
    platform: Literal["facebook", "instagram"]
    text: str

@router.post("/posts/generate-social")
def generate_social_post(payload: GenerateSocialRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="Social generation is unavailable. GROQ_API_KEY is not set."
        )

    # Simple HTML tag stripping
    cleaned_content = re.sub('<[^<]+?>', '', payload.content)[:3000]

    # Same standing hashtag set as Content Studio's caption generator
    # (content_studio_llm.CAPTION_SYSTEM_PROMPT) -- real, currently-used tags
    # on Facebook/Instagram, not TikTok-only tags like #FYP or #AstrologyTok
    # which carry no discovery benefit on the platforms this posts to.
    STANDING_HASHTAGS = "#AstrologyReels #Astrology #Horoscope #Zodiac #ZodiacSigns #HindiAstrology #AadikartaAstrology #ReelsIndia #Kundli #Spirituality"

    # twitter/linkedin are copy-paste-only (no publish API configured), so the
    # LLM is asked to return the post body and hashtags separately -- ending
    # the reply with a "TAGS:" line -- so the UI can offer both as two
    # independently copyable blocks instead of one blob of text.
    wants_tags = payload.platform in ("twitter", "linkedin")

    if payload.platform == "facebook":
        system_prompt = (
            "You are an expert social media manager. Create a highly engaging Facebook post based on this blog content. "
            "Include appropriate emojis, structured text, and end with a single line of 8-12 relevant hashtags, mixing "
            f"hashtags specific to this post's topic with these standing hashtags: {STANDING_HASHTAGS}. Do not include "
            "markdown headers, titles, HTML tags, or code block markers. Make it feel authentic, professional, and exciting."
        )
    elif payload.platform == "instagram":
        system_prompt = (
            "You are an expert social media manager. Create an eye-catching Instagram caption based on this blog content. "
            "Start with an attention-grabbing hook, use bullet points or emojis for high readability, and end with a single "
            "line of 10-15 relevant hashtags, mixing hashtags specific to this post's topic with these standing hashtags: "
            f"{STANDING_HASHTAGS}. Do not include markdown headers, HTML tags, or code block markers."
        )
    elif payload.platform == "twitter":
        system_prompt = (
            "You are an expert social media manager. Create a concise, engaging post for X (Twitter) based on this blog "
            "content, under 260 characters, with an attention-grabbing hook. Do not include hashtags in the post body, "
            "markdown headers, titles, HTML tags, or code block markers. After the post body, on a new line, write "
            "'TAGS:' followed by 5-8 relevant hashtags (single line, space-separated), mixing hashtags specific to this "
            f"post's topic with these standing hashtags: {STANDING_HASHTAGS}."
        )
    else:  # linkedin
        system_prompt = (
            "You are an expert social media manager. Create a professional, thought-leadership style LinkedIn post based "
            "on this blog content -- a short hook line, 2-4 short paragraphs or bullet points, and a closing line inviting "
            "engagement. Do not include hashtags in the post body, markdown headers, titles, HTML tags, or code block "
            "markers. After the post body, on a new line, write 'TAGS:' followed by 5-8 relevant hashtags (single line, "
            f"space-separated), mixing hashtags specific to this post's topic with these standing hashtags: {STANDING_HASHTAGS}."
        )

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", "openai/gpt-oss-120b"),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Blog Title: {payload.title}\n\nBlog Content:\n{cleaned_content}"}
        ],
        "max_tokens": 500,
        "temperature": 0.7,
        "reasoning_effort": "low",
    }

    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}")

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"LLM upstream error {response.status_code}")

    try:
        reply = (response.json()["choices"][0]["message"]["content"] or "").strip()
        if reply.startswith("```"):
            reply = re.sub(r"^```[a-zA-Z]*\n", "", reply)
            reply = re.sub(r"\n```$", "", reply)

        if not wants_tags:
            return {"text": reply}

        match = re.search(r"\n?TAGS:\s*(.+)\s*$", reply, re.IGNORECASE | re.DOTALL)
        if match:
            text = reply[:match.start()].strip()
            tags = match.group(1).strip()
        else:
            text, tags = reply, ""
        return {"text": text, "tags": tags}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to parse LLM response.")


class GenerateFeaturedImageRequest(BaseModel):
    title: str
    content: str


@router.post("/posts/generate-featured-image")
def generate_featured_image(payload: GenerateFeaturedImageRequest):
    """Writes an image prompt from the post's title/body (Groq), then renders it
    the same way Content Studio does (content_studio_images -- Replicate FLUX.2
    if configured, else Pollinations), and returns the saved image's URL."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Image generation is unavailable. GROQ_API_KEY is not set.")

    cleaned_content = re.sub('<[^<]+?>', '', payload.content)[:3000]

    system_prompt = (
        "You write concise English prompts (under 40 words) for an AI image generator, creating a blog "
        "featured/cover image for Aadikarta, India's trusted marketplace for verified Vedic astrologers. "
        "Based on the blog post's title and content below, write a single descriptive image prompt capturing "
        "its core theme using traditional Vedic astrology iconography (zodiac symbols, Navagraha gods, Indian "
        "spiritual/temple art, diyas, mandalas) in a professional, editorial blog-cover style. Do not request "
        "any text/words rendered in the image. Respond with ONLY the prompt text -- no commentary, no quotes."
    )

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", "openai/gpt-oss-120b"),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Blog Title: {payload.title}\n\nBlog Content:\n{cleaned_content}"},
        ],
        "max_tokens": 150,
        "temperature": 0.8,
        "reasoning_effort": "low",
    }

    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}")

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"LLM upstream error {response.status_code}")

    try:
        image_prompt = (response.json()["choices"][0]["message"]["content"] or "").strip().strip('"')
    except (KeyError, IndexError, ValueError):
        raise HTTPException(status_code=500, detail="Failed to parse LLM response.")

    if not image_prompt:
        raise HTTPException(status_code=502, detail="LLM returned an empty image prompt.")

    image_bytes = content_studio_images.generate_image(image_prompt, width=1200, height=630)

    upload_dir = os.path.join("uploads", "cms_posts")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    with open(os.path.join(upload_dir, filename), "wb") as f:
        f.write(image_bytes)

    return {"url": f"/static/cms_posts/{filename}"}


# --- Media Gallery ---
# A reusable pool of AI-generated images: generate once from a text prompt,
# then pick from the gallery on any post instead of regenerating per-post.

GALLERY_UPLOAD_DIR = os.path.join("uploads", "gallery")


class GenerateGalleryImageRequest(BaseModel):
    content: str


@router.post("/gallery/generate", response_model=schemas_cms.GalleryImage)
def generate_gallery_image(payload: GenerateGalleryImageRequest, db: Session = Depends(database.get_db)):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Image generation is unavailable. GROQ_API_KEY is not set.")

    cleaned_content = re.sub('<[^<]+?>', '', payload.content).strip()[:3000]
    if not cleaned_content:
        raise HTTPException(status_code=400, detail="Content is required.")

    system_prompt = (
        "You write concise English prompts (under 40 words) for an AI image generator, creating an image "
        "for Aadikarta, India's trusted marketplace for verified Vedic astrologers. Based on the content "
        "below, write a single descriptive image prompt capturing its core theme using traditional Vedic "
        "astrology iconography (zodiac symbols, Navagraha gods, Indian spiritual/temple art, diyas, mandalas) "
        "in a professional, editorial style. Do not request any text/words rendered in the image. Respond "
        "with ONLY the prompt text -- no commentary, no quotes."
    )

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", "openai/gpt-oss-120b"),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": cleaned_content},
        ],
        "max_tokens": 150,
        "temperature": 0.8,
        "reasoning_effort": "low",
    }

    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"LLM request failed: {e}")

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail=f"LLM upstream error {response.status_code}")

    try:
        image_prompt = (response.json()["choices"][0]["message"]["content"] or "").strip().strip('"')
    except (KeyError, IndexError, ValueError):
        raise HTTPException(status_code=500, detail="Failed to parse LLM response.")

    if not image_prompt:
        raise HTTPException(status_code=502, detail="LLM returned an empty image prompt.")

    image_bytes = content_studio_images.generate_image(image_prompt, width=1024, height=1024)

    os.makedirs(GALLERY_UPLOAD_DIR, exist_ok=True)
    filename = f"{uuid.uuid4().hex}.jpg"
    with open(os.path.join(GALLERY_UPLOAD_DIR, filename), "wb") as f:
        f.write(image_bytes)

    image = models.MediaGalleryImage(url=f"/static/gallery/{filename}", prompt=image_prompt)
    db.add(image)
    db.commit()
    db.refresh(image)
    return image


@router.get("/gallery", response_model=schemas_cms.GalleryImageListResponse)
def list_gallery_images(skip: int = 0, limit: int = 40, db: Session = Depends(database.get_db)):
    query = db.query(models.MediaGalleryImage)
    total = query.count()
    images = query.order_by(models.MediaGalleryImage.created_at.desc()).offset(skip).limit(limit).all()
    return {"total": total, "images": images}


@router.delete("/gallery/{image_id}")
def delete_gallery_image(image_id: int, db: Session = Depends(database.get_db)):
    image = db.query(models.MediaGalleryImage).filter(models.MediaGalleryImage.id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")

    # Only ever delete a file we ourselves stored under uploads/gallery -- basename()
    # strips any path segments so a crafted/legacy url can't be (mis)used to escape
    # that directory (e.g. a url containing "../../something").
    filename = os.path.basename(image.url)
    file_path = os.path.join(GALLERY_UPLOAD_DIR, filename)
    if os.path.isfile(file_path):
        os.remove(file_path)

    db.delete(image)
    db.commit()
    return {"message": "Image deleted"}


@router.post("/posts/{post_id}/share-social")
def share_social_post(post_id: int, payload: ShareSocialRequest, db: Session = Depends(database.get_db)):
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=404, detail="Post not found")

    if payload.platform == "facebook":
        page_id = settings_service.get_setting("facebook_page_id")
        access_token = settings_service.get_setting("facebook_access_token")
        if not page_id or not access_token:
            raise HTTPException(
                status_code=400,
                detail="Facebook integration is not configured in Settings. Please set Facebook Page ID and Access Token."
            )
        
        if db_post.featured_image:
            url = f"https://graph.facebook.com/v19.0/{page_id}/photos"
            data = {
                "url": db_post.featured_image,
                "caption": payload.text,
                "access_token": access_token
            }
        else:
            url = f"https://graph.facebook.com/v19.0/{page_id}/feed"
            data = {
                "message": payload.text,
                "access_token": access_token
            }

        try:
            res = httpx.post(url, data=data, timeout=30.0)
            if res.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Facebook Graph API Error: {res.text}")
            return {"status": "success", "facebook_response": res.json()}
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Failed to reach Facebook API: {e}")

    elif payload.platform == "instagram":
        ig_acct_id = settings_service.get_setting("instagram_business_account_id")
        access_token = settings_service.get_setting("instagram_access_token")
        if not ig_acct_id or not access_token:
            raise HTTPException(
                status_code=400,
                detail="Instagram integration is not configured in Settings. Please set Instagram Business Account ID and Access Token."
            )
        
        if not db_post.featured_image:
            raise HTTPException(
                status_code=400,
                detail="Instagram requires a featured image URL to publish a post. Please set a Featured Image URL on this post first."
            )

        try:
            # Step 1: Create media container
            container_url = f"https://graph.facebook.com/v19.0/{ig_acct_id}/media"
            container_data = {
                "image_url": db_post.featured_image,
                "caption": payload.text,
                "access_token": access_token
            }
            res_c = httpx.post(container_url, data=container_data, timeout=30.0)
            if res_c.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Instagram Container Creation Error: {res_c.text}")
            
            creation_id = res_c.json().get("id")
            if not creation_id:
                raise HTTPException(status_code=500, detail="Instagram did not return a creation_id.")

            # Step 1.5: Wait for media processing to complete (FINISHED)
            import time
            status_url = f"https://graph.facebook.com/v19.0/{creation_id}"
            status_params = {
                "fields": "status_code",
                "access_token": access_token
            }
            
            for _ in range(6):  # Poll up to 12 seconds
                try:
                    res_s = httpx.get(status_url, params=status_params, timeout=10.0)
                    if res_s.status_code == 200:
                        status_code = res_s.json().get("status_code")
                        if status_code == "FINISHED":
                            break
                        elif status_code in ["ERROR", "EXPIRED"]:
                            raise HTTPException(status_code=400, detail=f"Instagram media processing failed: {res_s.text}")
                except httpx.HTTPError:
                    pass
                time.sleep(2.0)

            # Step 2: Publish media container
            publish_url = f"https://graph.facebook.com/v19.0/{ig_acct_id}/media_publish"
            publish_data = {
                "creation_id": creation_id,
                "access_token": access_token
            }
            res_p = httpx.post(publish_url, data=publish_data, timeout=30.0)
            if res_p.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Instagram Publish Error: {res_p.text}")
            
            return {"status": "success", "instagram_response": res_p.json()}
        except httpx.HTTPError as e:
            raise HTTPException(status_code=502, detail=f"Failed to reach Instagram API: {e}")

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
