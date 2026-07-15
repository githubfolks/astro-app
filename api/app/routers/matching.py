"""
Matching router — Kuta (Guna Milan) compatibility reports between two birth charts.
Astrologer-only endpoints that use FreeAstroAPI for compatibility calculation.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from .. import models, schemas, database
from ..vedic_rishi_service import geocode_place
from ..free_astro_service import generate_kuta_match
from .auth import get_current_user

router = APIRouter(
    prefix="/matching",
    tags=["Matching"]
)


def _require_astrologer(current_user: models.User):
    if current_user.role != models.UserRole.ASTROLOGER:
        raise HTTPException(status_code=403, detail="Only astrologers can access Matching features")


async def _resolve_person(person: schemas.MatchPersonInput, db: Session):
    """Fill in missing fields from a seeker profile, same pattern as kundli.py."""
    dob = person.date_of_birth
    tob = person.time_of_birth
    place = person.place_of_birth
    name = person.full_name or ""

    if person.seeker_id:
        seeker_profile = db.query(models.SeekerProfile).filter(
            models.SeekerProfile.user_id == person.seeker_id
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

    if not dob or not tob or not place:
        raise HTTPException(
            status_code=400,
            detail="date_of_birth, time_of_birth, and place_of_birth are required for both people"
        )

    return dob, tob, place, name


@router.post("/generate", response_model=schemas.MatchReportResponse)
async def generate_match_report(
    request: schemas.MatchGenerateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Generate a Kuta (Guna Milan) compatibility report for a boy/girl pair.
    Caches the result in kundli_match_reports, keyed by both birth-detail tuples.
    """
    _require_astrologer(current_user)

    boy_dob, boy_tob, boy_place, boy_name = await _resolve_person(request.boy, db)
    girl_dob, girl_tob, girl_place, girl_name = await _resolve_person(request.girl, db)

    existing = db.query(models.KundliMatchReport).filter(
        models.KundliMatchReport.boy_date_of_birth == boy_dob,
        models.KundliMatchReport.boy_time_of_birth == boy_tob,
        models.KundliMatchReport.boy_place_of_birth == boy_place,
        models.KundliMatchReport.girl_date_of_birth == girl_dob,
        models.KundliMatchReport.girl_time_of_birth == girl_tob,
        models.KundliMatchReport.girl_place_of_birth == girl_place,
    ).first()

    if existing:
        return existing

    try:
        boy_lat, boy_lon = await geocode_place(boy_place)
        girl_lat, girl_lon = await geocode_place(girl_place)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Geocoding service unavailable. Please try again.")

    try:
        match_data = await generate_kuta_match(
            person1={
                "year": boy_dob.year, "month": boy_dob.month, "day": boy_dob.day,
                "hour": boy_tob.hour, "minute": boy_tob.minute,
                "lat": boy_lat, "lng": boy_lon, "tz_str": "Asia/Kolkata",
                "label": boy_name or "Boy",
            },
            person2={
                "year": girl_dob.year, "month": girl_dob.month, "day": girl_dob.day,
                "hour": girl_tob.hour, "minute": girl_tob.minute,
                "lat": girl_lat, "lng": girl_lon, "tz_str": "Asia/Kolkata",
                "label": girl_name or "Girl",
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    report = models.KundliMatchReport(
        generated_by=current_user.id,
        boy_seeker_id=request.boy.seeker_id,
        girl_seeker_id=request.girl.seeker_id,
        boy_full_name=boy_name,
        boy_date_of_birth=boy_dob,
        boy_time_of_birth=boy_tob,
        boy_place_of_birth=boy_place,
        boy_latitude=boy_lat,
        boy_longitude=boy_lon,
        girl_full_name=girl_name,
        girl_date_of_birth=girl_dob,
        girl_time_of_birth=girl_tob,
        girl_place_of_birth=girl_place,
        girl_latitude=girl_lat,
        girl_longitude=girl_lon,
        match_data=match_data,
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return report


@router.get("/{report_id}", response_model=schemas.MatchReportResponse)
def get_match_report(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get a specific Match report by ID."""
    _require_astrologer(current_user)

    report = db.query(models.KundliMatchReport).filter(
        models.KundliMatchReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Match report not found")

    return report


@router.get("/seeker/{seeker_id}", response_model=List[schemas.MatchReportResponse])
def get_seeker_match_reports(
    seeker_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get all Match reports involving a specific seeker (as boy or girl)."""
    _require_astrologer(current_user)

    reports = db.query(models.KundliMatchReport).filter(
        (models.KundliMatchReport.boy_seeker_id == seeker_id) |
        (models.KundliMatchReport.girl_seeker_id == seeker_id)
    ).order_by(models.KundliMatchReport.created_at.desc()).all()

    return reports


@router.get("/history/all", response_model=List[schemas.MatchReportResponse])
def get_astrologer_match_history(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Get all Match reports generated by the current astrologer."""
    _require_astrologer(current_user)

    reports = db.query(models.KundliMatchReport).filter(
        models.KundliMatchReport.generated_by == current_user.id
    ).order_by(models.KundliMatchReport.created_at.desc()).all()

    return reports
