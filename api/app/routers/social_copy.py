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


# Display names for the platforms this endpoint knows how to target. Falls
# back to title-casing unrecognized values (e.g. "twitter" -> "Twitter")
# rather than str.capitalize(), which lowercases every letter after the
# first and mangles names like "YouTube" into "Youtube".
PLATFORM_DISPLAY_NAMES = {
    "youtube": "YouTube Shorts",
    "instagram": "Instagram Reels",
    "facebook": "Facebook Video",
    "linkedin": "LinkedIn Post",
}


@router.post("/auto-post", response_model=schemas_social_copy.AutoPostSocialResponse)
@limiter.limit("10/minute")
def auto_post_social(request: Request, payload: schemas_social_copy.AutoPostSocialRequest):
    import uuid
    content_id = f"social-copy-{uuid.uuid4().hex[:8]}"
    viral_hook = f"🔥 Stop ignoring your {payload.topic}! Here is what Vedic Astrology reveals..."
    script_30s = (
        f"[HOOK 0-5s]: {viral_hook}\n"
        f"[BODY 5-20s]: In Vedic Astrology, your planetary Dasha placement directly impacts {payload.topic}. "
        f"Whether it is career, relationship compatibility, or financial growth, understanding your chart is key.\n"
        f"[CTA 20-30s]: Check your chart free on Aadikarta at {payload.cta_link}!"
    )
    if payload.target_platform == "all":
        platforms = list(PLATFORM_DISPLAY_NAMES.values())
    else:
        key = payload.target_platform.lower()
        platforms = [PLATFORM_DISPLAY_NAMES.get(key, payload.target_platform[:1].upper() + payload.target_platform[1:])]

    # Pure text generation, matching this module's docstring -- there is no
    # scheduler or publish-queue behind this, so the response must not claim
    # one (previously returned status="SCHEDULED" with a fake job_id).
    return schemas_social_copy.AutoPostSocialResponse(
        status="GENERATED",
        content_id=content_id,
        script_30s=script_30s,
        viral_hook=viral_hook,
        target_platforms=platforms,
    )

