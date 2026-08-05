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
