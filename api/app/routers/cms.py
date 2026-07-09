from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Literal
from pydantic import BaseModel
import os
import httpx
from slugify import slugify
from datetime import datetime
from .. import models, database, schemas_cms
from .auth import get_current_admin
from ..services import settings_service

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

# --- Social Media Share / Generation endpoints ---

class GenerateSocialRequest(BaseModel):
    title: str
    content: str
    platform: Literal["facebook", "instagram"]

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
    import re
    cleaned_content = re.sub('<[^<]+?>', '', payload.content)[:3000]

    if payload.platform == "facebook":
        system_prompt = (
            "You are an expert social media manager. Create a highly engaging Facebook post based on this blog content. "
            "Include appropriate emojis, structured text, and popular relevant hashtags. Do not include markdown headers, "
            "titles, HTML tags, or code block markers. Make it feel authentic, professional, and exciting."
        )
    else:
        system_prompt = (
            "You are an expert social media manager. Create an eye-catching Instagram caption based on this blog content. "
            "Start with an attention-grabbing hook, use bullet points or emojis for high readability, and list 10-15 relevant "
            "hashtags. Do not include markdown headers, HTML tags, or code block markers."
        )

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", "llama-3.3-70b-versatile"),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Blog Title: {payload.title}\n\nBlog Content:\n{cleaned_content}"}
        ],
        "max_tokens": 500,
        "temperature": 0.7,
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
        return {"text": reply}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to parse LLM response.")

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
