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
