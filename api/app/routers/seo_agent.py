"""Admin API for the SEO Agent keyword queue and AI drafting.

All endpoints are admin-only. Drafting creates DRAFT posts; publishing stays
in the CMS (routers/cms.py), where agent drafts must pass the quality gate.
"""
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from .. import database, models
from ..limiter import limiter
from ..services import seo_agent
from .auth import get_current_admin

router = APIRouter(
    prefix="/admin/seo-agent",
    tags=["SEO Agent"],
    dependencies=[Depends(get_current_admin)],
)


class KeywordOut(BaseModel):
    id: int
    keyword: str
    source: models.SeoKeywordSource
    status: models.SeoKeywordStatus
    notes: Optional[str] = None
    gsc_impressions: Optional[int] = None
    gsc_clicks: Optional[int] = None
    gsc_position: Optional[Decimal] = None
    gsc_page: Optional[str] = None
    gsc_captured_at: Optional[datetime] = None
    post_id: Optional[int] = None
    post_title: Optional[str] = None
    post_status: Optional[str] = None
    last_error: Optional[str] = None
    created_at: Optional[datetime] = None


class KeywordListResponse(BaseModel):
    total: int
    keywords: List[KeywordOut]


class AddKeywordsRequest(BaseModel):
    keywords: List[str] = Field(..., min_length=1, max_length=50)
    notes: Optional[str] = Field(None, max_length=1000)


class AddKeywordsResponse(BaseModel):
    created: List[KeywordOut]
    skipped: List[str]


class ImportGscRequest(BaseModel):
    min_impressions: int = Field(1, ge=1)


def _out(k: models.SeoKeyword) -> KeywordOut:
    return KeywordOut(
        id=k.id, keyword=k.keyword, source=k.source, status=k.status, notes=k.notes,
        gsc_impressions=k.gsc_impressions, gsc_clicks=k.gsc_clicks, gsc_position=k.gsc_position,
        gsc_page=k.gsc_page, gsc_captured_at=k.gsc_captured_at, post_id=k.post_id,
        post_title=k.post.title if k.post else None,
        post_status=k.post.status.value if k.post else None,
        last_error=k.last_error, created_at=k.created_at,
    )


def _get_keyword(db: Session, keyword_id: int) -> models.SeoKeyword:
    kw = db.query(models.SeoKeyword).filter(models.SeoKeyword.id == keyword_id).first()
    if not kw:
        raise HTTPException(status_code=404, detail="Keyword not found")
    return kw


@router.get("/status")
def agent_status(db: Session = Depends(database.get_db)):
    """What the admin page needs to show before anyone clicks: limits and config."""
    return seo_agent.agent_status(db)


@router.get("/keywords", response_model=KeywordListResponse)
def list_keywords(
    status: Optional[models.SeoKeywordStatus] = None,
    source: Optional[models.SeoKeywordSource] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db),
):
    q = db.query(models.SeoKeyword)
    if status:
        q = q.filter(models.SeoKeyword.status == status)
    if source:
        q = q.filter(models.SeoKeyword.source == source)
    total = q.count()
    rows = (
        q.order_by(models.SeoKeyword.gsc_impressions.desc().nullslast(), models.SeoKeyword.created_at.desc())
        .offset(max(skip, 0)).limit(min(max(limit, 1), 200)).all()
    )
    return {"total": total, "keywords": [_out(k) for k in rows]}


@router.post("/keywords", response_model=AddKeywordsResponse)
def add_keywords(
    body: AddKeywordsRequest,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
):
    notes = body.notes.strip() if body.notes and body.notes.strip() else None
    normalized = [seo_agent.normalize_keyword(k) for k in body.keywords]
    result = seo_agent.add_keywords(
        db, body.keywords, models.SeoKeywordSource.ADMIN, current_admin.id,
        notes={k: notes for k in normalized if k} if notes else None,
    )
    return {"created": [_out(k) for k in result["created"]], "skipped": result["skipped"]}


@router.post("/keywords/import-gsc")
def import_gsc(
    body: ImportGscRequest,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
):
    return seo_agent.import_from_gsc(db, current_admin.id, min_impressions=body.min_impressions)


@router.post("/keywords/suggest", response_model=AddKeywordsResponse)
@limiter.limit("5/minute")
def suggest_keywords(
    request: Request,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
):
    result = seo_agent.suggest_topics(db, current_admin.id)
    return {"created": [_out(k) for k in result["created"]], "skipped": result["skipped"]}


@router.post("/keywords/{keyword_id}/draft")
@limiter.limit("5/minute")
def draft_keyword(
    request: Request,
    keyword_id: int,
    current_admin: models.User = Depends(get_current_admin),
    db: Session = Depends(database.get_db),
):
    return seo_agent.draft_post(db, keyword_id, current_admin)


@router.post("/keywords/{keyword_id}/ignore", response_model=KeywordOut)
def ignore_keyword(keyword_id: int, db: Session = Depends(database.get_db)):
    kw = _get_keyword(db, keyword_id)
    if kw.status not in (models.SeoKeywordStatus.NEW, models.SeoKeywordStatus.FAILED):
        raise HTTPException(status_code=409, detail=f"Keyword is {kw.status.value}; only NEW or FAILED keywords can be ignored.")
    kw.status = models.SeoKeywordStatus.IGNORED
    db.commit()
    db.refresh(kw)
    return _out(kw)


@router.post("/keywords/{keyword_id}/restore", response_model=KeywordOut)
def restore_keyword(keyword_id: int, db: Session = Depends(database.get_db)):
    kw = _get_keyword(db, keyword_id)
    if kw.status != models.SeoKeywordStatus.IGNORED:
        raise HTTPException(status_code=409, detail="Only IGNORED keywords can be restored.")
    kw.status = models.SeoKeywordStatus.NEW
    db.commit()
    db.refresh(kw)
    return _out(kw)


@router.get("/posts/{post_id}/quality")
def post_quality(post_id: int, db: Session = Depends(database.get_db)):
    """Re-run the quality gate on a post's current content (e.g. after edits)."""
    post = db.query(models.Post).filter(models.Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return seo_agent.check_post(db, post).as_dict()
