"""
Place autocomplete for Birth Place fields — suggests "City, State, India" as the
user types, backed by Nominatim (OpenStreetMap), the same free geocoder already
used to resolve place-of-birth to lat/lon in vedic_rishi_service.geocode_place.
No auth required; results are cached in-process since city/state names for a
given query are effectively static.
"""
import time
import httpx
from fastapi import APIRouter, Request
from ..limiter import limiter
from ..vedic_rishi_service import NOMINATIM_URL

router = APIRouter(prefix="/places", tags=["Places"])

_CACHE_TTL_SECONDS = 6 * 60 * 60
_cache: dict[str, tuple[float, list[dict]]] = {}

# Nominatim is inconsistent for Delhi: state comes back as "NCT of Delhi" or
# "National Capital Territory of Delhi", and city as "Delhi" or "New Delhi"
# depending on the matched sub-area. Normalize all of that to one canonical
# "New Delhi, Delhi, India" everywhere.
_STATE_ALIASES = {
    "nct of delhi": "Delhi",
    "national capital territory of delhi": "Delhi",
}


def _format_suggestion(result: dict) -> dict | None:
    address = result.get("address", {})
    city = (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("municipality")
        or address.get("county")
    )
    state = address.get("state")
    if not city or not state:
        return None

    state = _STATE_ALIASES.get(state.strip().lower(), state)
    if state == "Delhi":
        city = "New Delhi"

    label = f"{city}, {state}, India"
    return {
        "label": label,
        "city": city,
        "state": state,
        "lat": float(result["lat"]),
        "lon": float(result["lon"]),
    }


@router.get("/autocomplete")
@limiter.limit("30/minute")
async def autocomplete_place(request: Request, q: str):
    query = q.strip()
    if len(query) < 2:
        return []

    cache_key = query.lower()
    cached = _cache.get(cache_key)
    if cached and (time.monotonic() - cached[0]) < _CACHE_TTL_SECONDS:
        return cached[1]

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(
            NOMINATIM_URL,
            params={
                "q": query,
                "format": "json",
                "limit": 8,
                "countrycodes": "in",
                "addressdetails": 1,
            },
            headers={"User-Agent": "AadikartaAstroApp/1.0"},
        )
        response.raise_for_status()
        results = response.json()

    suggestions = []
    seen_labels = set()
    for result in results:
        suggestion = _format_suggestion(result)
        if suggestion and suggestion["label"] not in seen_labels:
            seen_labels.add(suggestion["label"])
            suggestions.append(suggestion)

    _cache[cache_key] = (time.monotonic(), suggestions)
    return suggestions
