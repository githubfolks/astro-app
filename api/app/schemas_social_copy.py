from pydantic import BaseModel, Field


class KeywordSuggestionRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)
    description: str = Field("", max_length=2000)


class KeywordSuggestion(BaseModel):
    keywords: str


class SocialCopyRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)
    description: str = Field(..., min_length=1, max_length=2000)
    keywords: str = Field(..., min_length=1, max_length=300)
    cta_link: str = Field(..., min_length=1, max_length=200)
    price: str = Field("", max_length=100)
    language: str = Field("Hindi/English mix", max_length=100)


class YouTubeCopy(BaseModel):
    title: str
    description: str
    hashtags: str
    video_tags: str
    pinned_comment: str


class InstagramCopy(BaseModel):
    caption: str
    hashtags: str
    alt_text: str
    cover_text: str
    pinned_comment: str


class FacebookCopy(BaseModel):
    text: str
    hashtags: str


class TwitterCopy(BaseModel):
    text: str
    hashtags: str


class LinkedInCopy(BaseModel):
    text: str
    hashtags: str
