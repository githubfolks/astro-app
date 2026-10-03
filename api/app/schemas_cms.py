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
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    author_name: Optional[str] = None
    faqs: Optional[List[Dict[str, str]]] = None
    tags: Optional[List[str]] = None
    secondary_keywords: Optional[List[str]] = None
    longtail_keywords: Optional[List[str]] = None
    seo_keywords_facebook: Optional[str] = None
    seo_keywords_instagram: Optional[str] = None
    seo_keywords_youtube: Optional[str] = None
    status: PostStatus = PostStatus.DRAFT

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    author_name: Optional[str] = None
    faqs: Optional[List[Dict[str, str]]] = None
    tags: Optional[List[str]] = None
    secondary_keywords: Optional[List[str]] = None
    longtail_keywords: Optional[List[str]] = None
    seo_keywords_facebook: Optional[str] = None
    seo_keywords_instagram: Optional[str] = None
    seo_keywords_youtube: Optional[str] = None
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

class AdminPost(Post):
    """Admin/CMS view of a post: adds SEO Agent provenance. Never used by
    public endpoints (agent_meta holds model/usage details and reviewed_by is
    an internal user id)."""
    generated_by: str = "manual"
    agent_meta: Optional[Dict[str, Any]] = None
    reviewed_by: Optional[int] = None
    reviewed_at: Optional[datetime] = None

class PostListResponse(BaseModel):
    total: int
    posts: List[AdminPost]

class PostSummary(BaseModel):
    """Listing-card view of a post -- deliberately omits the full `content`
    (up to ~16 KB of HTML per post) so the public /blog index doesn't ship
    every article body just to render 3-line previews."""
    id: int
    title: str
    slug: str
    excerpt: Optional[str] = None
    featured_image: Optional[str] = None
    author_name: Optional[str] = None
    tags: Optional[List[str]] = None
    published_at: Optional[datetime]
    # Exposed so the build-time sitemap can emit a truthful per-post <lastmod>.
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PublicPostListResponse(BaseModel):
    total: int
    posts: List[PostSummary]

# Media Gallery Schemas
class GalleryImage(BaseModel):
    id: int
    url: str
    prompt: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GalleryImageListResponse(BaseModel):
    total: int
    images: List[GalleryImage]

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
    seo_title: Optional[str] = None
    seo_description: Optional[str] = None
    slug: Optional[str] = None

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

# Contact Inquiry Schemas
class InquiryStatus(str, Enum):
    NEW = "NEW"
    READ = "READ"
    RESPONDED = "RESPONDED"
    ARCHIVED = "ARCHIVED"

class ContactInquiryBase(BaseModel):
    name: str
    email: str
    message: str

class ContactInquiry(ContactInquiryBase):
    id: int
    status: InquiryStatus
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True

class ContactInquiryListResponse(BaseModel):
    total: int
    inquiries: List[ContactInquiry]
