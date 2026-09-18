"""
Vimshottari Dasha subdivision math for levels FreeAstroAPI doesn't compute.

FreeAstroAPI's active_periods response hard-caps at Pratyantardasha (level 3).
This mirrors the same classical proportional-subdivision rule used there —
period_i = parent_duration * planet_years_i / 120, cycling the fixed 9-planet
order — one level deeper each time, to derive Sukshma (level 4) and Prana
(level 5). Keep in sync with web/src/utils/subDasha.ts, which does the same
thing client-side for the web app.
"""
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

VIMSHOTTARI_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"]
VIMSHOTTARI_YEARS = {
    "Ketu": 7, "Venus": 20, "Sun": 6, "Moon": 10, "Mars": 7,
    "Rahu": 18, "Jupiter": 16, "Saturn": 19, "Mercury": 17,
}
TOTAL_YEARS = 120
DAYS_PER_YEAR = 365.2425


def _add_years(start: date, years: float) -> date:
    return start + timedelta(days=years * DAYS_PER_YEAR)


def _subdivide(start: date, duration_years: float, lord: str, parent_path: List[str]) -> List[Dict[str, Any]]:
    """Splits [start, start+duration_years) into 9 sub-periods cycling the
    fixed Vimshottari order starting from `lord`, each sized proportional to
    that planet's dasha-years out of 120."""
    if lord not in VIMSHOTTARI_ORDER:
        return []
    start_idx = VIMSHOTTARI_ORDER.index(lord)
    cursor = start
    periods = []
    for i in range(9):
        planet = VIMSHOTTARI_ORDER[(start_idx + i) % 9]
        years = duration_years * (VIMSHOTTARI_YEARS[planet] / TOTAL_YEARS)
        end = _add_years(cursor, years)
        periods.append({
            "lord": planet,
            "start": cursor,
            "end": end,
            "duration_years": years,
            "path": [*parent_path, planet],
        })
        cursor = end
    return periods


def _to_dasha_period(level: str, period: Dict[str, Any], now: date) -> Dict[str, Any]:
    elapsed_years = max(0.0, (now - period["start"]).days / DAYS_PER_YEAR)
    remaining_years = max(0.0, period["duration_years"] - elapsed_years)
    progress_fraction = min(elapsed_years / period["duration_years"], 1.0) if period["duration_years"] > 0 else 0.0
    return {
        "level": level,
        "lord": period["lord"],
        "start": period["start"].isoformat(),
        "end": period["end"].isoformat(),
        "duration_years": period["duration_years"],
        "elapsed_years": elapsed_years,
        "remaining_years": remaining_years,
        "progress_fraction": progress_fraction,
        "path": period["path"],
    }


def compute_active_sukshma_and_prana(pratyantardasha: Dict[str, Any]) -> Optional[Tuple[Dict[str, Any], Dict[str, Any]]]:
    """Derives the currently-active Sukshma (level 4) and Prana (level 5) dasha
    from the API-provided active Pratyantardasha. "Now" is anchored to the
    Pratyantardasha's own elapsed_years (not the wall clock) so it stays
    consistent with whatever reference date the rest of the chart was
    generated against. Returns None if the Pratyantardasha entry is missing
    the fields needed to subdivide it."""
    lord = pratyantardasha.get("lord")
    duration_years = pratyantardasha.get("duration_years")
    start_str = pratyantardasha.get("start")
    if not lord or duration_years is None or not start_str:
        return None
    try:
        start = date.fromisoformat(str(start_str)[:10])
    except ValueError:
        return None

    path = pratyantardasha.get("path") or [lord]
    now = _add_years(start, pratyantardasha.get("elapsed_years") or 0)

    sukshma_periods = _subdivide(start, duration_years, lord, path)
    if not sukshma_periods:
        return None
    active_sukshma = next((p for p in sukshma_periods if now < p["end"]), sukshma_periods[-1])

    prana_periods = _subdivide(active_sukshma["start"], active_sukshma["duration_years"], active_sukshma["lord"], active_sukshma["path"])
    if not prana_periods:
        return None
    active_prana = next((p for p in prana_periods if now < p["end"]), prana_periods[-1])

    return _to_dasha_period("Sukshma", active_sukshma, now), _to_dasha_period("Prana", active_prana, now)


def with_sukshma_and_prana(active_periods: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Appends Sukshma/Prana rows (level 4/5) to an active_periods list that
    only goes up to Pratyantardasha (level 3, FreeAstroAPI's cap). No-op if
    no Pratyantardasha entry is present or it can't be subdivided."""
    pratyantardasha = next((p for p in active_periods if p.get("level") == "Pratyantardasha"), None)
    if not pratyantardasha:
        return active_periods
    result = compute_active_sukshma_and_prana(pratyantardasha)
    if not result:
        return active_periods
    sukshma, prana = result
    return [*active_periods, sukshma, prana]
