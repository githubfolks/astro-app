from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums (matching models.py)
class ContentType(str, Enum):
    SHORT_VIDEO = "SHORT_VIDEO"
    VOICE_OVER_IMAGE = "VOICE_OVER_IMAGE"


class VoiceGender(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class ContentJobStatus(str, Enum):
    SCENES_GENERATED = "SCENES_GENERATED"
    RENDERING = "RENDERING"
    DONE = "DONE"
    FAILED = "FAILED"


# Scene Schemas
class Scene(BaseModel):
    index: int
    narration_hi: str = Field(..., min_length=1, max_length=1000)
    image_prompt_en: str = Field(..., min_length=1, max_length=500)
    full_image_prompt: Optional[str] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    duration_sec: Optional[float] = None
    error: Optional[str] = None


# Job Schemas
class GenerateScenesRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    short_description: Optional[str] = Field(None, max_length=2000)
    content_type: ContentType
    voice_gender: VoiceGender = VoiceGender.FEMALE
    scene_count: Optional[int] = Field(None, ge=1, le=8)


class UpdateJobRequest(BaseModel):
    short_description: Optional[str] = Field(None, max_length=2000)


class UpdateScenesRequest(BaseModel):
    scenes: List[Scene]


class GenerateSceneImageRequest(BaseModel):
    image_prompt_en: str = Field(..., min_length=1, max_length=500)


class TopicSuggestion(BaseModel):
    topic: str


class CaptionSuggestion(BaseModel):
    caption: str


class SocialCopySuggestion(BaseModel):
    text: str
    tags: str


class YoutubeTagsSuggestion(BaseModel):
    tags: str


class YoutubeCopySuggestion(BaseModel):
    title: str
    description: str


class GenerateYoutubeCopyRequest(BaseModel):
    current_title: Optional[str] = Field(None, max_length=100)
    current_description: Optional[str] = Field(None, max_length=5000)


class PostSocialRequest(BaseModel):
    caption: str = Field(..., min_length=1, max_length=2200)
    seo_keywords: Optional[str] = None
    title: Optional[str] = Field(None, max_length=100)


class UpdateYoutubeVideoRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=5000)
    seo_keywords: Optional[str] = None


class Job(BaseModel):
    id: int
    topic: str
    short_description: Optional[str] = None
    content_type: ContentType
    voice_gender: VoiceGender
    status: ContentJobStatus
    scenes: List[Scene]
    output_video_url: Optional[str] = None
    error_message: Optional[str] = None
    posted_facebook_at: Optional[datetime] = None
    posted_instagram_at: Optional[datetime] = None
    posted_youtube_at: Optional[datetime] = None
    youtube_video_id: Optional[str] = None
    youtube_title: Optional[str] = None
    youtube_description: Optional[str] = None
    seo_keywords_facebook: Optional[str] = None
    seo_keywords_instagram: Optional[str] = None
    seo_keywords_youtube: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    total: int
    jobs: List[Job]


class TopicOption(BaseModel):
    id: int
    topic: str
    short_description: Optional[str] = None

    class Config:
        from_attributes = True


class TopicOptionsResponse(BaseModel):
    topics: List[TopicOption]
