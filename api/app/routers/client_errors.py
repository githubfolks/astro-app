"""
Crash/error reporting endpoint for the frontend (web + Capacitor mobile app).
Captures uncaught JS errors, unhandled promise rejections, and React render
crashes that would otherwise only be visible in a devtools console or
`adb logcat` at the moment they happen, then never again. Feeds the same
`error_logs` table as backend 500s (see main.py's `log_requests` middleware),
tagged with source="client" so the two are distinguishable in the admin UI.

No auth required — a crash can happen before login (e.g. on the login screen
itself), but we attach the user if a valid token is present.
"""
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from typing import Literal, Optional
from .. import database, models
from .auth import get_current_user_optional
from ..limiter import limiter

router = APIRouter(prefix="/client-errors", tags=["Client Errors"])


class ClientErrorReport(BaseModel):
    source: Literal["js_error", "unhandled_rejection", "react_error_boundary"]
    message: str = Field(..., max_length=2000)
    stack: Optional[str] = Field(None, max_length=8000)
    path: str = Field(..., max_length=500)  # frontend route, e.g. "/dashboard"


@router.post("")
@limiter.limit("20/minute")
def report_client_error(
    request: Request,
    data: ClientErrorReport,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(get_current_user_optional),
):
    db.add(models.ErrorLog(
        method="CLIENT",
        path=data.path,
        user_id=current_user.id if current_user else None,
        error_type=data.source,
        message=data.message,
        traceback=data.stack,
        source="client",
    ))
    db.commit()
    return {"status": "logged"}
