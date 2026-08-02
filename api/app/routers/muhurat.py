"""
Live Muhurat router — current Hora, Choghadiya, 15-muhurta ("Do Ghati") day
division, and current sidereal Lagna for a location, right now.

Sunrise/sunset come from the same cached FreeAstroAPI Panchang lookup used by
/panchang/daily. Hora/Choghadiya/Muhurta/Lagna themselves are computed locally
(see muhurat_calc.py) rather than sourced from a third-party endpoint — see
that module's docstring for why and how accuracy was verified.
"""
from datetime import date as date_cls, datetime, time, timedelta, timezone
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import Optional
from .. import schemas, database
from ..routers.panchang import resolve_location, get_or_fetch_panchang, DEFAULT_CITY
from .. import muhurat_calc

router = APIRouter(
    prefix="/muhurat",
    tags=["Muhurat"]
)

IST_OFFSET_HOURS = 5.5  # matches generate_panchang's fixed Asia/Kolkata default


def _parse_hms(value: str, on_date: date_cls) -> datetime:
    """FreeAstroAPI returns "HH:MM:SS" local time-of-day strings for sunrise/sunset."""
    h, m, s = (int(x) for x in value.split(":"))
    return datetime.combine(on_date, time(h, m, s))


@router.get("/live", response_model=schemas.LiveMuhuratResponse)
async def get_live_muhurat(
    date: Optional[date_cls] = Query(None, description="Defaults to today (Asia/Kolkata)"),
    lat: Optional[float] = Query(None, description="Latitude — when provided with lon, skips geocoding"),
    lon: Optional[float] = Query(None, description="Longitude — when provided with lat, skips geocoding"),
    place: Optional[str] = Query(None, description="Display label for the location; also used to geocode when lat/lon aren't provided"),
    db: Session = Depends(database.get_db),
):
    """Current Hora, Choghadiya, 15-muhurta window, and Lagna for a location.
    Public, no auth required (same access model as /panchang/daily)."""
    target_date = date or date_cls.today()
    place_label = place or DEFAULT_CITY

    resolved_lat, resolved_lon = await resolve_location(lat, lon, place_label)

    prev_cached = await get_or_fetch_panchang(db, target_date - timedelta(days=1), resolved_lat, resolved_lon, place_label)
    today_cached = await get_or_fetch_panchang(db, target_date, resolved_lat, resolved_lon, place_label)
    next_cached = await get_or_fetch_panchang(db, target_date + timedelta(days=1), resolved_lat, resolved_lon, place_label)

    try:
        prev_sunrise = _parse_hms(prev_cached.panchang_data["sunrise"], target_date - timedelta(days=1))
        prev_sunset = _parse_hms(prev_cached.panchang_data["sunset"], target_date - timedelta(days=1))
        today_sunrise = _parse_hms(today_cached.panchang_data["sunrise"], target_date)
        today_sunset = _parse_hms(today_cached.panchang_data["sunset"], target_date)
        next_sunrise = _parse_hms(next_cached.panchang_data["sunrise"], target_date + timedelta(days=1))
    except (KeyError, ValueError) as e:
        raise HTTPException(status_code=502, detail=f"FreeAstroAPI Panchang response missing sunrise/sunset: {e}")

    # Reference "now" in the same naive-local convention as the sunrise/sunset
    # timestamps above (both are Asia/Kolkata wall-clock time, unlabelled).
    now = datetime.now(timezone.utc) + timedelta(hours=IST_OFFSET_HOURS)
    now = now.replace(tzinfo=None)

    if now < today_sunrise:
        eff_sunrise, eff_sunset, eff_next_sunrise = prev_sunrise, prev_sunset, today_sunrise
    else:
        eff_sunrise, eff_sunset, eff_next_sunrise = today_sunrise, today_sunset, next_sunrise

    horas = muhurat_calc.hora_periods(eff_sunrise, eff_sunset, eff_next_sunrise)
    choghadiyas = muhurat_calc.choghadiya_periods(eff_sunrise, eff_sunset, eff_next_sunrise)
    muhurtas = muhurat_calc.muhurta_15_periods(eff_sunrise, eff_sunset)

    for p in horas:
        p["is_current"] = p["start"] <= now < p["end"]
    for p in choghadiyas:
        p["is_current"] = p["start"] <= now < p["end"]
    for p in muhurtas:
        p["is_current"] = p["start"] <= now < p["end"]

    lagna = muhurat_calc.current_lagna_window(now, IST_OFFSET_HOURS, resolved_lat, resolved_lon)

    return schemas.LiveMuhuratResponse(
        date=target_date,
        place_label=place_label,
        latitude=resolved_lat,
        longitude=resolved_lon,
        now=now,
        sunrise=eff_sunrise,
        sunset=eff_sunset,
        horas=horas,
        choghadiyas=choghadiyas,
        muhurtas=muhurtas,
        current_lagna=lagna,
    )
