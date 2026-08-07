"""
Kundli router — Generate and retrieve Vedic birth charts.
Astrologer-only endpoints that use FreeAstroAPI for chart calculation.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date as date_cls
from .. import models, schemas, database
from ..vedic_rishi_service import geocode_place
from ..free_astro_service import generate_full_kundli, generate_dasha_insights
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


async def _geocode_and_generate(dob, tob, place: str):
    """Shared geocode + FreeAstroAPI chart generation used by both create and edit."""
    try:
        lat, lon = await geocode_place(place)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Geocoding service unavailable. Please try again.")

    try:
        chart_data = await generate_full_kundli(
            year=dob.year,
            month=dob.month,
            day=dob.day,
            hour=tob.hour,
            minute=tob.minute,
            latitude=lat,
            longitude=lon,
            timezone="Asia/Kolkata",
            dasha_levels=3,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    return lat, lon, chart_data


def _has_complete_dasha(data: dict) -> bool:
    levels = {p.get("level") for p in data.get("vimshottari_dasha", {}).get("active_periods", [])}
    return {"Mahadasha", "Antardasha", "Pratyantardasha"}.issubset(levels)


def _find_reusable_kundli_chart(db: Session, dob, tob, place: str):
    """Look for an existing KundliReport row with these exact birth details whose
    chart_data is current (see _has_complete_dasha docstring context above) —
    used by both create and edit so neither needlessly re-hits FreeAstroAPI when
    the birth details match a report already generated for someone else."""
    existing = db.query(models.KundliReport).filter(
        models.KundliReport.date_of_birth == dob,
        models.KundliReport.time_of_birth == tob,
        models.KundliReport.place_of_birth == place,
    ).first()

    if (
        existing
        and isinstance(existing.chart_data, dict)
        and "chart" in existing.chart_data
        and _has_complete_dasha(existing.chart_data)
        and existing.latitude is not None
        and existing.longitude is not None
    ):
        return existing

    return None


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

    # Check for existing cached report with same birth details.
    # Reports generated before the switch to FreeAstroAPI carry the old
    # astroapi.dev response shape (no top-level "chart" key) and are
    # incompatible with the current frontend — treat those as stale and
    # regenerate rather than serving unusable cached data. Same for reports
    # cached before the dasha_levels fix / older FreeAstroAPI contract, whose
    # active_periods may be missing a level (e.g. no Antardasha) — regenerate
    # those too rather than serving an incomplete dasha chain forever.
    existing = db.query(models.KundliReport).filter(
        models.KundliReport.date_of_birth == dob,
        models.KundliReport.time_of_birth == tob,
        models.KundliReport.place_of_birth == place,
    ).first()

    reusable = _find_reusable_kundli_chart(db, dob, tob, place)
    if reusable:
        # Reuse the already-computed chart (skip re-hitting FreeAstroAPI for
        # identical birth details) but still record a fresh row for this
        # request — mutating `existing` in place would silently rename it
        # and reassign ownership away from whoever originally generated it,
        # which is how a report can vanish from its original owner's history.
        report = models.KundliReport(
            seeker_id=request.seeker_id,
            generated_by=current_user.id,
            full_name=name,
            date_of_birth=dob,
            time_of_birth=tob,
            place_of_birth=place,
            latitude=reusable.latitude,
            longitude=reusable.longitude,
            timezone=reusable.timezone,
            chart_data=reusable.chart_data,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report

    # Geocode place of birth and call FreeAstroAPI for the full Kundli
    # (chart, vargas, dasha, yogas, panchang, shadbala, ashtakavarga)
    lat, lon, chart_data = await _geocode_and_generate(dob, tob, place)

    # Save to database — refresh the stale row in place if one exists, otherwise insert new
    if existing:
        existing.full_name = name
        existing.latitude = lat
        existing.longitude = lon
        existing.chart_data = chart_data
        db.commit()
        db.refresh(existing)
        return existing

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


@router.get("/{report_id}/dasha-insights", response_model=schemas.KundliReportResponse)
async def get_dasha_insights(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """
    Get (and lazily compute) narrative Dasha Insights for a Kundli report.
    Cached on the report row per calendar day — repeat requests on the same
    day return the cached data without re-hitting FreeAstroAPI.
    """
    _require_astrologer(current_user)

    report = db.query(models.KundliReport).filter(
        models.KundliReport.id == report_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Kundli report not found")

    today = date_cls.today()
    if report.dasha_insights_data and report.dasha_insights_date == today:
        return report

    if report.latitude is None or report.longitude is None:
        raise HTTPException(status_code=400, detail="Report is missing geocoded birth coordinates")

    try:
        insights = await generate_dasha_insights(
            year=report.date_of_birth.year,
            month=report.date_of_birth.month,
            day=report.date_of_birth.day,
            hour=report.time_of_birth.hour,
            minute=report.time_of_birth.minute,
            latitude=float(report.latitude),
            longitude=float(report.longitude),
            timezone=report.timezone or "Asia/Kolkata",
            reference_date=today.isoformat(),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    report.dasha_insights_data = insights
    report.dasha_insights_date = today
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
        models.KundliReport.id == report_id,
        models.KundliReport.generated_by == current_user.id,
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
    """Get all Kundli reports the current astrologer generated for a specific seeker."""
    _require_astrologer(current_user)

    reports = db.query(models.KundliReport).filter(
        models.KundliReport.seeker_id == seeker_id,
        models.KundliReport.generated_by == current_user.id,
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


@router.put("/{report_id}", response_model=schemas.KundliReportResponse)
async def update_kundli_report(
    report_id: int,
    request: schemas.KundliUpdateRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Edit a Kundli report's birth details and regenerate its chart."""
    _require_astrologer(current_user)

    report = db.query(models.KundliReport).filter(
        models.KundliReport.id == report_id,
        models.KundliReport.generated_by == current_user.id,
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Kundli report not found")

    reusable = _find_reusable_kundli_chart(
        db, request.date_of_birth, request.time_of_birth, request.place_of_birth
    )
    if reusable:
        # New birth details match another already-cached report — reuse its
        # chart instead of re-hitting FreeAstroAPI for identical inputs.
        lat, lon, chart_data = reusable.latitude, reusable.longitude, reusable.chart_data
    else:
        lat, lon, chart_data = await _geocode_and_generate(
            request.date_of_birth, request.time_of_birth, request.place_of_birth
        )

    report.full_name = request.full_name
    report.date_of_birth = request.date_of_birth
    report.time_of_birth = request.time_of_birth
    report.place_of_birth = request.place_of_birth
    report.latitude = lat
    report.longitude = lon
    report.chart_data = chart_data
    # Birth details changed, so any cached narrative insights are stale.
    report.dasha_insights_data = None
    report.dasha_insights_date = None

    db.commit()
    db.refresh(report)

    return report


@router.delete("/{report_id}", status_code=204)
def delete_kundli_report(
    report_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Delete a Kundli report."""
    _require_astrologer(current_user)

    report = db.query(models.KundliReport).filter(
        models.KundliReport.id == report_id,
        models.KundliReport.generated_by == current_user.id,
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Kundli report not found")

    db.delete(report)
    db.commit()
