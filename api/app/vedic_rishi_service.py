"""
Vedic Rishi AstroAPI Service
Handles Kundli generation and geocoding for place of birth.
"""
import httpx
import os
from typing import Optional, Tuple

ASTROAPI_BASE_URL = os.getenv("ASTROAPI_BASE_URL", "https://astroapi.dev/api")
ASTROAPI_TOKEN = os.getenv("ASTROAPI_TOKEN", "bced04486591a67742c3041ea1a6819e5a9b6d8d")

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"


async def geocode_place(place_name: str) -> Tuple[float, float]:
    """
    Convert a place name to latitude/longitude using Nominatim (OpenStreetMap).
    Returns (latitude, longitude).
    Raises ValueError if place not found.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            NOMINATIM_URL,
            params={
                "q": place_name,
                "format": "json",
                "limit": 1,
                "countrycodes": "in",  # Prioritize India
            },
            headers={
                "User-Agent": "AadikartaAstroApp/1.0"
            }
        )
        response.raise_for_status()
        results = response.json()

        if not results:
            # Retry without country restriction
            response = await client.get(
                NOMINATIM_URL,
                params={
                    "q": place_name,
                    "format": "json",
                    "limit": 1,
                },
                headers={
                    "User-Agent": "AadikartaAstroApp/1.0"
                }
            )
            response.raise_for_status()
            results = response.json()

        if not results:
            raise ValueError(f"Could not find coordinates for place: {place_name}")

        lat = float(results[0]["lat"])
        lon = float(results[0]["lon"])
        return lat, lon


async def generate_kundli(
    year: int,
    month: int,
    day: int,
    hour: int,
    minute: int,
    second: int,
    lat: float,
    lon: float,
    timezone: str = "Asia/Kolkata",
    name: str = ""
) -> dict:
    """
    Generate Kundli using Vedic Rishi AstroAPI.
    Returns full chart data including basicDetails, planets, houses, and charts.
    """
    if not ASTROAPI_TOKEN:
        raise ValueError(
            "ASTROAPI_TOKEN is not configured. "
            "Please set it in your .env file. "
            "Get a token from https://astroapi.dev/signup"
        )

    payload = {
        "year": year,
        "month": month,
        "day": day,
        "hour": hour,
        "minute": minute,
        "second": second,
        "timezone": timezone,
        "dst": False,
        "name": name,
        "lat": lat,
        "lon": lon,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{ASTROAPI_BASE_URL}/vedic/v0/kundali/",
            json=payload,
            headers={
                "Authorization": f"Token {ASTROAPI_TOKEN}",
                "Content-Type": "application/json",
            }
        )

        if response.status_code == 401:
            raise ValueError("Invalid AstroAPI token. Please check your ASTROAPI_TOKEN.")
        elif response.status_code == 402:
            raise ValueError("AstroAPI quota exceeded. Please upgrade your plan.")

        response.raise_for_status()
        return response.json()
