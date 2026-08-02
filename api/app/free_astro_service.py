"""
FreeAstroAPI Service (https://www.freeastroapi.com)
Handles Kundli (Vedic birth chart) generation.
"""
import httpx
import os
from typing import Optional

FREE_ASTRO_API_BASE_URL = os.getenv("FREE_ASTRO_API_BASE_URL", "https://api.freeastroapi.com")
FREE_ASTRO_API_KEY = os.getenv("FREE_ASTRO_API_KEY")


async def _post(path: str, payload: dict) -> dict:
    if not FREE_ASTRO_API_KEY:
        raise ValueError(
            "FREE_ASTRO_API_KEY is not configured. "
            "Please set it in your .env file. "
            "Get a key from https://www.freeastroapi.com"
        )

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.post(
            f"{FREE_ASTRO_API_BASE_URL}{path}",
            json=payload,
            headers={
                "x-api-key": FREE_ASTRO_API_KEY,
                "Content-Type": "application/json",
            },
        )

        if response.status_code == 401:
            raise ValueError("Invalid FreeAstroAPI key. Please check your FREE_ASTRO_API_KEY.")
        elif response.status_code == 429:
            raise ValueError("FreeAstroAPI daily quota exceeded. Please try again tomorrow or upgrade your plan.")

        response.raise_for_status()
        return response.json()


async def _get(path: str, params: Optional[dict] = None) -> dict:
    if not FREE_ASTRO_API_KEY:
        raise ValueError(
            "FREE_ASTRO_API_KEY is not configured. "
            "Please set it in your .env file. "
            "Get a key from https://www.freeastroapi.com"
        )

    async with httpx.AsyncClient(timeout=45.0) as client:
        response = await client.get(
            f"{FREE_ASTRO_API_BASE_URL}{path}",
            params=params or {},
            headers={"x-api-key": FREE_ASTRO_API_KEY},
        )

        if response.status_code == 401:
            raise ValueError("Invalid FreeAstroAPI key. Please check your FREE_ASTRO_API_KEY.")
        elif response.status_code == 429:
            raise ValueError("FreeAstroAPI daily quota exceeded. Please try again tomorrow or upgrade your plan.")

        response.raise_for_status()
        return response.json()


async def generate_chart(
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int,
    latitude: float,
    longitude: float,
    timezone: str = "Asia/Kolkata",
    ayanamsha: str = "lahiri",
    house_system: str = "whole_sign",
) -> dict:
    """
    Generate a Vedic birth chart (Kundli) using FreeAstroAPI.
    Returns ascendant, planetary positions, houses, Nakshatra and Pada data.
    """
    payload = {
        "year": year,
        "month": month,
        "day": day,
        "hour": hour,
        "minute": minute,
        "lat": latitude,
        "lng": longitude,
        "tz_str": timezone,
        "ayanamsha": ayanamsha,
        "house_system": house_system,
    }
    return await _post("/api/v2/vedic/chart", payload)


async def generate_full_kundli(
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int,
    latitude: float,
    longitude: float,
    timezone: str = "Asia/Kolkata",
    ayanamsha: str = "lahiri",
    house_system: str = "whole_sign",
    vargas: Optional[list] = None,
    dasha_levels: int = 2,
) -> dict:
    """
    Generate a complete Kundli using FreeAstroAPI's all-in-one endpoint.
    Returns chart, vargas (divisional charts), vimshottari_dasha, yogas,
    panchang (birth day), shadbala, and ashtakavarga in a single response.
    """
    payload = {
        "year": year,
        "month": month,
        "day": day,
        "hour": hour,
        "minute": minute,
        "lat": latitude,
        "lng": longitude,
        "tz_str": timezone,
        "ayanamsha": ayanamsha,
        "house_system": house_system,
        "vargas": vargas if vargas is not None else [1, 9, 10, 60],
        "include_avastha": True,
        "include_yogas": True,
        "include_panchang": True,
        "include_shadbala": True,
        "include_ashtakavarga": True,
        "dasha_levels": dasha_levels,
    }
    return await _post("/api/v2/vedic/calculate", payload)


async def generate_panchang(
    year: int,
    month: int,
    day: int,
    latitude: float,
    longitude: float,
    timezone: str = "Asia/Kolkata",
    ayanamsha: str = "lahiri",
    hour: int = 6,
    minute: int = 0,
) -> dict:
    """
    Generate a standalone daily Panchang (almanac) for a date and location using
    FreeAstroAPI. Unlike generate_full_kundli this isn't tied to a birth chart —
    hour/minute default to a fixed sunrise-adjacent reference time (6:00 AM local)
    since Panchang describes the day as a whole rather than a specific moment.
    """
    payload = {
        "year": year,
        "month": month,
        "day": day,
        "hour": hour,
        "minute": minute,
        "lat": latitude,
        "lng": longitude,
        "tz_str": timezone,
        "ayanamsha": ayanamsha,
    }
    return await _post("/api/v2/vedic/panchang", payload)


async def generate_dasha_insights(
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int,
    latitude: float,
    longitude: float,
    timezone: str = "Asia/Kolkata",
    ayanamsha: str = "lahiri",
    house_system: str = "whole_sign",
    levels: int = 2,
    reference_date: Optional[str] = None,
) -> dict:
    """
    Generate narrative Dasha Insights (ranked, explained facts about the native's
    Vimshottari periods) using FreeAstroAPI. Note this endpoint is versioned v1,
    unlike the rest of the vedic suite. `reference_date` (YYYY-MM-DD) defaults to
    today server-side when omitted, so results are date-relative.
    """
    payload = {
        "year": year,
        "month": month,
        "day": day,
        "hour": hour,
        "minute": minute,
        "lat": latitude,
        "lng": longitude,
        "tz_str": timezone,
        "ayanamsha": ayanamsha,
        "house_system": house_system,
        "levels": levels,
    }
    if reference_date:
        payload["reference_date"] = reference_date
    return await _post("/api/v1/vedic/dasha/insights", payload)


async def generate_kuta_match(person1: dict, person2: dict) -> dict:
    """
    Generate a Kuta (Guna Milan) compatibility report between two full birth charts
    using FreeAstroAPI's Vedic Compatibility endpoint.
    Each of person1/person2 is a dict with year, month, day, hour, minute, lat, lng,
    tz_str, and optionally ayanamsha/house_system/label.
    """
    payload = {
        "person1": person1,
        "person2": person2,
    }
    return await _post("/api/v2/vedic/compatibility", payload)


async def generate_yogas(
    birth_date: str,
    birth_time: str,
    birth_place: str,
    timezone: str = "AUTO",
) -> dict:
    """
    Detect Vedic yogas (Manglik/Mangal Dosha, Kala Sarpa, Raj Yogas, etc.) for a birth
    chart using FreeAstroAPI's dedicated yogas endpoint. Unlike the other functions in
    this module this is a v1 endpoint that geocodes `birth_place` itself, so no separate
    geocode_place() call is needed. `birth_date` is "YYYY-MM-DD", `birth_time` is "HH:MM:SS".
    """
    payload = {
        "birth_date": birth_date,
        "birth_time": birth_time,
        "birth_place": birth_place,
        "timezone": timezone,
    }
    return await _post("/api/v1/vedic/yogas", payload)


async def generate_vargas(
    birth_date: str,
    birth_time: str,
    birth_place: str,
    vargas: Optional[list] = None,
    timezone: str = "AUTO",
) -> dict:
    """
    Generate divisional (varga) charts, e.g. Navamsa (D9), for a birth chart using
    FreeAstroAPI's dedicated vargas endpoint. Same v1 request shape as generate_yogas —
    `birth_place` is geocoded by the API itself. `vargas` is an optional list restricting
    which divisional charts are returned; omit to get the API's default set.
    """
    payload = {
        "birth_date": birth_date,
        "birth_time": birth_time,
        "birth_place": birth_place,
        "timezone": timezone,
    }
    if vargas:
        payload["vargas"] = vargas
    return await _post("/api/v1/vedic/vargas", payload)


async def get_numerology_methods() -> dict:
    """List numerology calculation methods supported by FreeAstroAPI."""
    return await _get("/api/v1/numerology/methods")


async def generate_numerology_profile(
    subject_name: str,
    birth_date: str,
    method: str,
    alphabet: Optional[str] = None,
    policy: Optional[str] = None,
) -> dict:
    """
    Generate a numerology profile (life path, name numbers, etc.) for a name and date of
    birth using FreeAstroAPI. `method` must be a valid method id from
    get_numerology_methods(). `birth_date` is "YYYY-MM-DD".
    """
    payload = {
        "subject_name": subject_name,
        "birth_date": birth_date,
        "method": method,
    }
    if alphabet:
        payload["alphabet"] = alphabet
    if policy:
        payload["policy"] = policy
    return await _post("/api/v1/numerology/profile", payload)
