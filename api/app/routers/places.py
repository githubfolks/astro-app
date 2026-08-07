"""
Place autocomplete for Birth Place fields — suggests "City, State, India" as the
user types, backed by Photon (https://photon.komoot.io), a geocoder built on
OpenStreetMap data. Nominatim's /search (used here previously) only matches
complete words, so partial input like "Mumb" returned nothing until the user
finished typing "Mumbai" — Photon is purpose-built for autocomplete and matches
on partial/prefix input instead.
No auth required; results are cached in-process since city/state names for a
given query are effectively static.
"""
import time
import httpx
from fastapi import APIRouter, Request
from ..limiter import limiter

router = APIRouter(prefix="/places", tags=["Places"])

PHOTON_URL = "https://photon.komoot.io/api/"

# Roughly covers the Indian subcontinent — narrows Photon's results toward India
# without a hard country filter (Photon has none). Results just across the
# border (Pakistan, Nepal, Bangladesh, Sri Lanka) can still slip into the bbox;
# the countrycode check in _format_suggestion is what actually filters to India.
_INDIA_BBOX = "68,6,97.5,37.5"

_CACHE_TTL_SECONDS = 6 * 60 * 60
_cache: dict[str, tuple[float, list[dict]]] = {}


def _format_suggestion(feature: dict) -> dict | None:
    props = feature.get("properties", {})
    # Photon's own `type` classifier (distinct from the raw OSM `osm_value` tag)
    # reliably separates real settlements from noise — districts come back as
    # "county", stations/POIs as "house", industrial/residential landuse as
    # "locality" (a different sense of the word than a named settlement). It
    # also correctly includes places like Jaipur, whose only OSM entry is an
    # administrative boundary relation ("Jaipur Municipal Corporation") rather
    # than a place=city node — filtering on raw osm_value dropped it entirely.
    if props.get("countrycode") != "IN" or props.get("type") != "city":
        return None

    city = props.get("name")
    # OSM/census naming quirks on a few cities — strip suffixes so the
    # suggestion reads as a normal place name (e.g. "Jaipur Municipal
    # Corporation" -> "Jaipur", "Shimla (urban)" -> "Shimla").
    if city:
        for suffix in (" Municipal Corporation", " (urban)", " (rural)"):
            if city.endswith(suffix):
                city = city[: -len(suffix)]
                break

    # Union territories (Delhi, Chandigarh, Puducherry...) have no separate
    # "state" field in OSM — the settlement name doubles as the state name.
    state = props.get("state") or city
    if not city or not state:
        return None

    if city in ("Delhi", "New Delhi"):
        city, state = "New Delhi", "Delhi"

    coords = feature.get("geometry", {}).get("coordinates")
    if not coords or len(coords) != 2:
        return None
    lon, lat = coords

    return {
        "label": f"{city}, {state}, India",
        "city": city,
        "state": state,
        "lat": lat,
        "lon": lon,
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
            PHOTON_URL,
            params={
                "q": query,
                "limit": 30,
                "lang": "en",
                "layer": ["city", "locality"],
                "bbox": _INDIA_BBOX,
            },
            headers={"User-Agent": "AadikartaAstroApp/1.0"},
        )
        response.raise_for_status()
        data = response.json()

    suggestions = []
    seen_labels = set()
    for feature in data.get("features", []):
        suggestion = _format_suggestion(feature)
        if suggestion and suggestion["label"] not in seen_labels:
            seen_labels.add(suggestion["label"])
            suggestions.append(suggestion)
        if len(suggestions) >= 8:
            break

    _cache[cache_key] = (time.monotonic(), suggestions)
    return suggestions
