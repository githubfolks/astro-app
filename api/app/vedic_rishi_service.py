"""
Geocoding for place of birth.
"""
import httpx
from typing import Tuple

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




