"""
Free public astrology tools router — Manglik/Yoga dosha check, Navamsa (D9) chart,
Numerology profile, daily horoscope, basic birth chart, and Kuta (Guna Milan)
matching. No auth required; anyone can use these directly from the homepage.
Every result is cached indefinitely (deterministic given the inputs) so repeat
lookups for the same person — or, for the daily horoscope, the same calendar
day — don't re-hit FreeAstroAPI's daily quota.

The chart/matching endpoints here are deliberately separate from the
astrologer-only /kundli and /matching routers: those are internal tools tied to
an astrologer's account and their seekers (role-gated, saved history per
astrologer). These are the public-facing equivalents — no auth, no persistence
tied to any user, just a shared cache keyed by birth details.
"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .. import database, models, schemas
from ..free_astro_service import (
    generate_full_kundli,
    generate_kuta_match,
    generate_numerology_profile,
    generate_vargas,
    generate_yogas,
    get_bulk_daily_horoscope,
    get_numerology_methods,
)
from ..vedic_rishi_service import geocode_place

router = APIRouter(prefix="/free-tools", tags=["Free Tools"])

IST_OFFSET_HOURS = 5.5  # matches generate_panchang's fixed Asia/Kolkata default

# Numerology requires a `system` id that FreeAstroAPI defines (e.g. "pythagorean");
# cache the first available system in-process rather than calling GET
# /numerology/methods on every request (it's static metadata, not worth spending
# quota on repeatedly).
_numerology_method_cache: dict = {"system": None}


async def _default_numerology_method() -> str:
    if _numerology_method_cache["system"]:
        return _numerology_method_cache["system"]

    try:
        data = await get_numerology_methods()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    systems = data.get("systems") if isinstance(data, dict) else None
    first = systems[0] if systems else None
    system_id = first.get("system") if isinstance(first, dict) else None

    if not system_id:
        raise HTTPException(status_code=502, detail="Could not determine a numerology method from FreeAstroAPI")

    _numerology_method_cache["system"] = system_id
    return system_id


@router.post("/manglik-check", response_model=schemas.ManglikCheckResponse)
async def manglik_check(
    request: schemas.FreeToolBirthRequest,
    db: Session = Depends(database.get_db),
):
    """Detect Manglik/Mangal Dosha and other yogas for a birth chart."""
    existing = db.query(models.ManglikCheck).filter(
        models.ManglikCheck.date_of_birth == request.date_of_birth,
        models.ManglikCheck.time_of_birth == request.time_of_birth,
        models.ManglikCheck.place_of_birth == request.place_of_birth,
    ).first()
    if existing:
        return existing

    try:
        yogas_data = await generate_yogas(
            birth_date=request.date_of_birth.isoformat(),
            birth_time=request.time_of_birth.strftime("%H:%M:%S"),
            birth_place=request.place_of_birth,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    record = models.ManglikCheck(
        full_name=request.full_name,
        date_of_birth=request.date_of_birth,
        time_of_birth=request.time_of_birth,
        place_of_birth=request.place_of_birth,
        yogas_data=yogas_data,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(models.ManglikCheck).filter(
            models.ManglikCheck.date_of_birth == request.date_of_birth,
            models.ManglikCheck.time_of_birth == request.time_of_birth,
            models.ManglikCheck.place_of_birth == request.place_of_birth,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(record)
    return record


@router.post("/navamsa", response_model=schemas.NavamsaChartResponse)
async def navamsa_chart(
    request: schemas.FreeToolBirthRequest,
    db: Session = Depends(database.get_db),
):
    """Generate the Navamsa (D9) divisional chart for a birth chart."""
    existing = db.query(models.NavamsaChart).filter(
        models.NavamsaChart.date_of_birth == request.date_of_birth,
        models.NavamsaChart.time_of_birth == request.time_of_birth,
        models.NavamsaChart.place_of_birth == request.place_of_birth,
    ).first()
    if existing:
        return existing

    try:
        vargas_data = await generate_vargas(
            birth_date=request.date_of_birth.isoformat(),
            birth_time=request.time_of_birth.strftime("%H:%M:%S"),
            birth_place=request.place_of_birth,
            vargas=["D9"],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    record = models.NavamsaChart(
        full_name=request.full_name,
        date_of_birth=request.date_of_birth,
        time_of_birth=request.time_of_birth,
        place_of_birth=request.place_of_birth,
        vargas_data=vargas_data,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(models.NavamsaChart).filter(
            models.NavamsaChart.date_of_birth == request.date_of_birth,
            models.NavamsaChart.time_of_birth == request.time_of_birth,
            models.NavamsaChart.place_of_birth == request.place_of_birth,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(record)
    return record


@router.post("/numerology", response_model=schemas.NumerologyProfileResponse)
async def numerology_profile(
    request: schemas.NumerologyRequest,
    db: Session = Depends(database.get_db),
):
    """Generate a numerology profile from a name and date of birth."""
    method = await _default_numerology_method()

    existing = db.query(models.NumerologyProfile).filter(
        models.NumerologyProfile.subject_name == request.full_name,
        models.NumerologyProfile.date_of_birth == request.date_of_birth,
    ).first()
    if existing:
        return existing

    try:
        profile_data = await generate_numerology_profile(
            subject_name=request.full_name,
            birth_date=request.date_of_birth.isoformat(),
            system=method,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    record = models.NumerologyProfile(
        subject_name=request.full_name,
        date_of_birth=request.date_of_birth,
        method=method,
        profile_data=profile_data,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(models.NumerologyProfile).filter(
            models.NumerologyProfile.subject_name == request.full_name,
            models.NumerologyProfile.date_of_birth == request.date_of_birth,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(record)
    return record


@router.get("/daily-horoscope", response_model=schemas.DailyHoroscopeBulkResponse)
async def daily_horoscope_bulk(db: Session = Depends(database.get_db)):
    """Daily horoscope for all 12 signs. First request of the day (Asia/Kolkata)
    calls FreeAstroAPI's bulk endpoint once and caches it; every later request
    that same day is served straight from the DB."""
    today_ist = (datetime.now(timezone.utc) + timedelta(hours=IST_OFFSET_HOURS)).date()

    existing = db.query(models.DailyHoroscopeBulk).filter(
        models.DailyHoroscopeBulk.date == today_ist,
    ).first()
    if existing:
        return existing

    try:
        horoscope_data = await get_bulk_daily_horoscope()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    record = models.DailyHoroscopeBulk(date=today_ist, horoscope_data=horoscope_data)
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(models.DailyHoroscopeBulk).filter(
            models.DailyHoroscopeBulk.date == today_ist,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(record)
    return record


@router.post("/kundli-chart", response_model=schemas.KundliChartResponse)
async def kundli_chart(
    request: schemas.FreeToolBirthRequest,
    db: Session = Depends(database.get_db),
):
    """Full Kundli — chart, vargas, vimshottari dasha, yogas, birth panchang,
    shadbala, and ashtakavarga — for a birth chart."""
    existing = db.query(models.FreeKundliChart).filter(
        models.FreeKundliChart.date_of_birth == request.date_of_birth,
        models.FreeKundliChart.time_of_birth == request.time_of_birth,
        models.FreeKundliChart.place_of_birth == request.place_of_birth,
    ).first()
    if existing:
        return existing

    try:
        lat, lon = await geocode_place(request.place_of_birth)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Geocoding service unavailable. Please try again.")

    try:
        chart_data = await generate_full_kundli(
            year=request.date_of_birth.year,
            month=request.date_of_birth.month,
            day=request.date_of_birth.day,
            hour=request.time_of_birth.hour,
            minute=request.time_of_birth.minute,
            latitude=lat,
            longitude=lon,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    record = models.FreeKundliChart(
        full_name=request.full_name,
        date_of_birth=request.date_of_birth,
        time_of_birth=request.time_of_birth,
        place_of_birth=request.place_of_birth,
        chart_data=chart_data,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(models.FreeKundliChart).filter(
            models.FreeKundliChart.date_of_birth == request.date_of_birth,
            models.FreeKundliChart.time_of_birth == request.time_of_birth,
            models.FreeKundliChart.place_of_birth == request.place_of_birth,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(record)
    return record


@router.post("/kundli-match", response_model=schemas.FreeMatchReportResponse)
async def kundli_match(
    request: schemas.FreeMatchRequest,
    db: Session = Depends(database.get_db),
):
    """Kuta (Guna Milan) compatibility report between two birth charts."""
    boy, girl = request.boy, request.girl

    existing = db.query(models.FreeMatchReport).filter(
        models.FreeMatchReport.boy_date_of_birth == boy.date_of_birth,
        models.FreeMatchReport.boy_time_of_birth == boy.time_of_birth,
        models.FreeMatchReport.boy_place_of_birth == boy.place_of_birth,
        models.FreeMatchReport.girl_date_of_birth == girl.date_of_birth,
        models.FreeMatchReport.girl_time_of_birth == girl.time_of_birth,
        models.FreeMatchReport.girl_place_of_birth == girl.place_of_birth,
    ).first()
    if existing:
        return existing

    try:
        boy_lat, boy_lon = await geocode_place(boy.place_of_birth)
        girl_lat, girl_lon = await geocode_place(girl.place_of_birth)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise HTTPException(status_code=500, detail="Geocoding service unavailable. Please try again.")

    try:
        match_data = await generate_kuta_match(
            person1={
                "year": boy.date_of_birth.year, "month": boy.date_of_birth.month, "day": boy.date_of_birth.day,
                "hour": boy.time_of_birth.hour, "minute": boy.time_of_birth.minute,
                "lat": boy_lat, "lng": boy_lon, "tz_str": "Asia/Kolkata",
                "label": boy.full_name or "Boy",
            },
            person2={
                "year": girl.date_of_birth.year, "month": girl.date_of_birth.month, "day": girl.date_of_birth.day,
                "hour": girl.time_of_birth.hour, "minute": girl.time_of_birth.minute,
                "lat": girl_lat, "lng": girl_lon, "tz_str": "Asia/Kolkata",
                "label": girl.full_name or "Girl",
            },
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    record = models.FreeMatchReport(
        boy_full_name=boy.full_name,
        boy_date_of_birth=boy.date_of_birth,
        boy_time_of_birth=boy.time_of_birth,
        boy_place_of_birth=boy.place_of_birth,
        girl_full_name=girl.full_name,
        girl_date_of_birth=girl.date_of_birth,
        girl_time_of_birth=girl.time_of_birth,
        girl_place_of_birth=girl.place_of_birth,
        match_data=match_data,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        existing = db.query(models.FreeMatchReport).filter(
            models.FreeMatchReport.boy_date_of_birth == boy.date_of_birth,
            models.FreeMatchReport.boy_time_of_birth == boy.time_of_birth,
            models.FreeMatchReport.boy_place_of_birth == boy.place_of_birth,
            models.FreeMatchReport.girl_date_of_birth == girl.date_of_birth,
            models.FreeMatchReport.girl_time_of_birth == girl.time_of_birth,
            models.FreeMatchReport.girl_place_of_birth == girl.place_of_birth,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(record)
    return record
