"""
Panchang router — public daily almanac widget.
Uses FreeAstroAPI for calculation, cached per (date, rounded location) so repeat
requests for the same day/city don't re-hit the API.
"""
from datetime import date as date_cls
from fastapi import APIRouter, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import Depends
from typing import Optional
from .. import models, schemas, database
from ..vedic_rishi_service import geocode_place
from ..free_astro_service import generate_panchang

router = APIRouter(
    prefix="/panchang",
    tags=["Panchang"]
)

DEFAULT_CITY = "New Delhi"


@router.get("/daily", response_model=schemas.PanchangResponse)
async def get_daily_panchang(
    date: Optional[date_cls] = Query(None, description="Defaults to today (Asia/Kolkata)"),
    lat: Optional[float] = Query(None, description="Latitude — when provided with lon, skips geocoding"),
    lon: Optional[float] = Query(None, description="Longitude — when provided with lat, skips geocoding"),
    place: Optional[str] = Query(None, description="Display label for the location; also used to geocode when lat/lon aren't provided"),
    db: Session = Depends(database.get_db),
):
    """Get today's (or a given date's) Panchang for a location. Public, no auth required.
    Callers that already know the visitor's coordinates (e.g. browser geolocation)
    should pass lat/lon directly to skip an extra geocoding round-trip."""
    target_date = date or date_cls.today()
    place_label = place or DEFAULT_CITY

    if lat is not None and lon is not None:
        resolved_lat, resolved_lon = lat, lon
    else:
        try:
            resolved_lat, resolved_lon = await geocode_place(place_label)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        except Exception:
            raise HTTPException(status_code=500, detail="Geocoding service unavailable. Please try again.")

    rounded_lat = round(resolved_lat, 2)
    rounded_lon = round(resolved_lon, 2)

    existing = db.query(models.PanchangCache).filter(
        models.PanchangCache.date == target_date,
        models.PanchangCache.latitude == rounded_lat,
        models.PanchangCache.longitude == rounded_lon,
    ).first()

    if existing:
        return existing

    try:
        panchang_data = await generate_panchang(
            year=target_date.year,
            month=target_date.month,
            day=target_date.day,
            latitude=resolved_lat,
            longitude=resolved_lon,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI error: {str(e)}")

    cached = models.PanchangCache(
        date=target_date,
        latitude=rounded_lat,
        longitude=rounded_lon,
        place_label=place_label,
        panchang_data=panchang_data,
    )
    db.add(cached)
    try:
        db.commit()
    except IntegrityError:
        # Concurrent request already cached this (date, location) combo — use it.
        db.rollback()
        existing = db.query(models.PanchangCache).filter(
            models.PanchangCache.date == target_date,
            models.PanchangCache.latitude == rounded_lat,
            models.PanchangCache.longitude == rounded_lon,
        ).first()
        if existing:
            return existing
        raise
    db.refresh(cached)

    return cached
