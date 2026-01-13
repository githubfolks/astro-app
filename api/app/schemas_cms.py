from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from enum import Enum

# Enums (matching models.py)
class PostStatus(str, Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class ZodiacSign(str, Enum):
    ARIES = "ARIES"
    TAURUS = "TAURUS"
    GEMINI = "GEMINI"
    CANCER = "CANCER"
    LEO = "LEO"
    VIRGO = "VIRGO"
    LIBRA = "LIBRA"
    SCORPIO = "SCORPIO"
    SAGITTARIUS = "SAGITTARIUS"
    CAPRICORN = "CAPRICORN"
    AQUARIUS = "AQUARIUS"
    PISCES = "PISCES"

class HoroscopePeriod(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"

# Post Schemas
class PostBase(BaseModel):
    title: str
    content: str
    featured_image: Optional[str] = None
    status: PostStatus = PostStatus.DRAFT

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    featured_image: Optional[str] = None
    status: Optional[PostStatus] = None

class Post(PostBase):
    id: int
    slug: str
    author_id: int
    published_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class PostListResponse(BaseModel):
    total: int
    posts: List[Post]

# Page Schemas
class PageBase(BaseModel):
    title: str
    content: str
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None

class PageCreate(PageBase):
    pass

class PageUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None

class Page(PageBase):
    id: int
    slug: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class PageListResponse(BaseModel):
    total: int
    pages: List[Page]

# Horoscope Schemas
class HoroscopeBase(BaseModel):
    sign: ZodiacSign
    period: HoroscopePeriod
    date: date
    content: Dict[str, Any] # Flexible JSON content

class HoroscopeCreate(HoroscopeBase):
    pass

class HoroscopeUpdate(BaseModel):
    content: Optional[Dict[str, Any]] = None

class Horoscope(HoroscopeBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
