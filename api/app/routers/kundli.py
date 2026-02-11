"""
Kundli router — Generate and retrieve Vedic birth charts.
Astrologer-only endpoints that use Vedic Rishi AstroAPI.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..vedic_rishi_service import generate_kundli, geocode_place
from .auth import get_current_user
import asyncio

router = APIRouter(
    prefix="/kundli",
    tags=["Kundli"]
)


def _require_astrologer(current_user: models.User):
    """Helper to ensure the current user is an astrologer."""
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=403, detail="Only astrologers can access Kundli features")


@router.post("/generate", response_model=schemas.KundliReportResponse)
async def generate_kundli_report(
    request: schemas.KundliGenerateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Generate a Kundli report for a seeker.
    Accepts birth details directly or a seeker_id to auto-fetch from profile.
    Geocodes place of birth and calls AstroAPI.
    Caches the result in kundli_reports table.
    """
    _require_astrologer(current_user)

    dob = request.date_of_birth
    tob = request.time_of_birth
    place = request.place_of_birth
    name = request.full_name or ""

    # If seeker_id provided, try to fetch details from profile
    if request.seeker_id:
        seeker_profile = db.query(models.SeekerProfile).filter(
            models.SeekerProfile.user_id == request.seeker_id
        ).first()
        if seeker_profile:
            if not dob and seeker_profile.date_of_birth:
                dob = seeker_profile.date_of_birth
            if not tob and seeker_profile.time_of_birth:
                tob = seeker_profile.time_of_birth
            if not place and seeker_profile.place_of_birth:
                place = seeker_profile.place_of_birth
            if not name and seeker_profile.full_name:
                name = seeker_profile.full_name

    # Validate required fields
    if not dob or not tob or not place:
        raise HTTPException(
            status_code=400,
            detail="date_of_birth, time_of_birth, and place_of_birth are required"
        )

    # Check for existing cached report with same birth details
    existing = db.query(models.KundliReport).filter(
        models.KundliReport.date_of_birth == dob,
        models.KundliReport.time_of_birth == tob,
        models.KundliReport.place_of_birth == place,
    ).first()

    if existing:
        return existing

    # Geocode place of birth
    try:
        lat, lon = await geocode_place(place)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Geocoding service unavailable. Please try again.")

    # Call AstroAPI
    try:
        chart_data = await generate_kundli(
            year=dob.year,
            month=dob.month,
            day=dob.day,
            hour=tob.hour,
            minute=tob.minute,
            second=tob.second,
            lat=lat,
            lon=lon,
            timezone="Asia/Kolkata",
            name=name,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AstroAPI error: {str(e)}")

    # Save to database
    report = models.KundliReport(
        seeker_id=request.seeker_id,
        generated_by=current_user.id,
        full_name=name,
        date_of_birth=dob,
        time_of_birth=tob,
        place_of_birth=place,
        latitude=lat,
        longitude=lon,
        timezone="Asia/Kolkata",
        chart_data=chart_data,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("/{report_id}", response_model=schemas.KundliReportResponse)
def get_kundli_report(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get a specific Kundli report by ID."""
    _require_astrologer(current_user)

    report = db.query(models.KundliReport).filter(
        models.KundliReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Kundli report not found")

    return report


@router.get("/seeker/{seeker_id}", response_model=List[schemas.KundliReportResponse])
def get_seeker_kundli_reports(
    seeker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get all Kundli reports for a specific seeker."""
    _require_astrologer(current_user)

    reports = db.query(models.KundliReport).filter(
        models.KundliReport.seeker_id == seeker_id
    ).order_by(models.KundliReport.created_at.desc()).all()

    return reports


@router.get("/history/all", response_model=List[schemas.KundliReportResponse])
def get_astrologer_kundli_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get all Kundli reports generated by the current astrologer."""
    _require_astrologer(current_user)

    reports = db.query(models.KundliReport).filter(
        models.KundliReport.generated_by == current_user.id
    ).order_by(models.KundliReport.created_at.desc()).all()

    return reports
