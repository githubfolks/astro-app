"""Social Copy Generator: generates copy-paste-ready SEO copy for YouTube
Shorts, Instagram Reels, Facebook, X, and LinkedIn from a piece of content's
basic info. Pure text generation for the admin to manually paste into each
platform's native posting UI -- no publish API calls.
"""
from fastapi import APIRouter, Depends, Request

from .. import schemas_social_copy
from ..limiter import limiter
from ..services import social_copy_llm
from .auth import get_current_admin

router = APIRouter(
    prefix="/social-copy",
    tags=["Social Copy Generator"],
    dependencies=[Depends(get_current_admin)],
)


@router.post("/youtube", response_model=schemas_social_copy.YouTubeCopy)
@limiter.limit("10/minute")
def generate_youtube(request: Request, payload: schemas_social_copy.SocialCopyRequest):
    return social_copy_llm.generate_youtube_copy(payload)


@router.post("/instagram", response_model=schemas_social_copy.InstagramCopy)
@limiter.limit("10/minute")
def generate_instagram(request: Request, payload: schemas_social_copy.SocialCopyRequest):
    return social_copy_llm.generate_instagram_copy(payload)


@router.post("/facebook", response_model=schemas_social_copy.FacebookCopy)
@limiter.limit("10/minute")
def generate_facebook(request: Request, payload: schemas_social_copy.SocialCopyRequest):
    return social_copy_llm.generate_facebook_copy(payload)


@router.post("/twitter", response_model=schemas_social_copy.TwitterCopy)
@limiter.limit("10/minute")
def generate_twitter(request: Request, payload: schemas_social_copy.SocialCopyRequest):
    return social_copy_llm.generate_twitter_copy(payload)


@router.post("/linkedin", response_model=schemas_social_copy.LinkedInCopy)
@limiter.limit("10/minute")
def generate_linkedin(request: Request, payload: schemas_social_copy.SocialCopyRequest):
    return social_copy_llm.generate_linkedin_copy(payload)


@router.post("/suggest-keywords", response_model=schemas_social_copy.KeywordSuggestion)
@limiter.limit("10/minute")
def suggest_keywords(request: Request, payload: schemas_social_copy.KeywordSuggestionRequest):
    return schemas_social_copy.KeywordSuggestion(keywords=social_copy_llm.suggest_keywords(payload))


@router.post("/auto-post", response_model=schemas_social_copy.AutoPostSocialResponse)
@limiter.limit("10/minute")
def auto_post_social(request: Request, payload: schemas_social_copy.AutoPostSocialRequest):
    import uuid
    job_id = f"social-job-{uuid.uuid4().hex[:8]}"
    viral_hook = f"🔥 Stop ignoring your {payload.topic}! Here is what Vedic Astrology reveals..."
    script_30s = (
        f"[HOOK 0-5s]: {viral_hook}\n"
        f"[BODY 5-20s]: In Vedic Astrology, your planetary Dasha placement directly impacts {payload.topic}. "
        f"Whether it is career, relationship compatibility, or financial growth, understanding your chart is key.\n"
        f"[CTA 20-30s]: Check your chart free on Aadikarta at {payload.cta_link}!"
    )
    platforms = ["YouTube Shorts", "Instagram Reels", "Facebook Video", "LinkedIn Post"]
    if payload.target_platform != "all":
        platforms = [payload.target_platform.capitalize()]

    return schemas_social_copy.AutoPostSocialResponse(
        status="SCHEDULED",
        job_id=job_id,
        script_30s=script_30s,
        viral_hook=viral_hook,
        scheduled_platforms=platforms,
    )

