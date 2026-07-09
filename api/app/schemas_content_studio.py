from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# Enums (matching models.py)
class ContentType(str, Enum):
    SHORT_VIDEO = "SHORT_VIDEO"
    VOICE_OVER_IMAGE = "VOICE_OVER_IMAGE"


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
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    duration_sec: Optional[float] = None
    error: Optional[str] = None


# Job Schemas
class GenerateScenesRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=500)
    content_type: ContentType
    scene_count: Optional[int] = Field(None, ge=1, le=8)


class UpdateScenesRequest(BaseModel):
    scenes: List[Scene]


class Job(BaseModel):
    id: int
    topic: str
    content_type: ContentType
    status: ContentJobStatus
    scenes: List[Scene]
    output_video_url: Optional[str] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    total: int
    jobs: List[Job]
