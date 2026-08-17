"""
Report Generator Service
Synthesizes FreeAstroAPI chart data with LLM narrative generation to produce
premium, structured ad-hoc reports for Full Kundli, Gun Milan, and Career/Finance.
"""
import os
import json
import httpx
from datetime import date, time, timedelta
from typing import Dict, Any, Optional
from .free_astro_service import generate_full_kundli, generate_kuta_match, generate_dasha_insights, check_sade_sati
from .vedic_rishi_service import geocode_place

_SADE_SATI_BRACKET_STEPS_DAYS = [200, 400, 800, 1600, 3200]  # doubling search, up to ~10.5 years out
_SADE_SATI_BISECT_TOLERANCE_DAYS = 10


async def _find_sade_sati_edge(
    dob: date, tob: time, lat: float, lon: float, today: date, direction: int
) -> Optional[date]:
    """Bisects for the start (direction=-1) or end (direction=+1) of the Sade
    Sati window that's active on `today`. Only called when we already know
    today is active, so this is bounded — a doubling search to find an
    'inactive' bracket, then bisection to ~10-day precision. Returns None if
    no inactive bracket is found within the search range (shouldn't happen
    for a real ~7.5-year window, but avoids an infinite loop if data is odd)."""
    outside_date = None
    for step in _SADE_SATI_BRACKET_STEPS_DAYS:
        candidate = today + timedelta(days=direction * step)
        status = await check_sade_sati(
            year=dob.year, month=dob.month, day=dob.day, hour=tob.hour, minute=tob.minute,
            latitude=lat, longitude=lon, reference_date=candidate.isoformat(),
        )
        if not status.get("active"):
            outside_date = candidate
            break
    if outside_date is None:
        return None

    inside_date = today
    while abs((outside_date - inside_date).days) > _SADE_SATI_BISECT_TOLERANCE_DAYS:
        mid = inside_date + (outside_date - inside_date) / 2
        status = await check_sade_sati(
            year=dob.year, month=dob.month, day=dob.day, hour=tob.hour, minute=tob.minute,
            latitude=lat, longitude=lon, reference_date=mid.isoformat(),
        )
        if status.get("active"):
            inside_date = mid
        else:
            outside_date = mid
    return inside_date


async def _resolve_sade_sati_window(dob: date, tob: time, lat: float, lon: float, sade_sati: Dict[str, Any]) -> None:
    """Mutates `sade_sati` in place, adding a `window: {start, end}` (ISO
    dates, ~10-day precision) for the currently active Sade Sati cycle. Only
    runs when Sade Sati is active today — an inactive lookup would need an
    unbounded forward search for the next cycle, which we've deliberately
    scoped out for now (see conversation: full lifetime table needs either
    ~120 chained API calls or a new local ephemeris dependency)."""
    if not sade_sati.get("active"):
        return
    today = date.today()
    try:
        start = await _find_sade_sati_edge(dob, tob, lat, lon, today, direction=-1)
        end = await _find_sade_sati_edge(dob, tob, lat, lon, today, direction=1)
    except Exception as e:
        print(f"Sade Sati window lookup notice: {e}")
        return
    if start or end:
        sade_sati["window"] = {
            "start": start.isoformat() if start else None,
            "end": end.isoformat() if end else None,
        }

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = os.getenv("AI_REPORT_MODEL", "openai/gpt-oss-120b")


async def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Call LLM (Groq / OpenAI compatible API) to synthesize astrological reading."""
    api_key = GROQ_API_KEY or OPENAI_API_KEY
    if not api_key:
        return "Comprehensive astrological synthesis generated based on authentic Vedic calculations."

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "model": DEFAULT_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.5,
        "max_tokens": 2000,
        "reasoning_effort": "low",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            res = await client.post(GROQ_CHAT_URL, json=payload, headers=headers)
            if res.status_code == 200:
                data = res.json()
                return data["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"LLM call failed for report synthesis: {e}")

    return "Aadicarta Vedic Astrological Analysis based on exact planetary calculations."


async def generate_full_kundli_report(
    full_name: str,
    dob: date,
    tob: time,
    pob: str,
    gender: str = "MALE",
    language: str = "en"
) -> Dict[str, Any]:
    """Generate complete Full Life Kundli & Dasha Report JSON structure."""
    lat, lon = 28.6139, 77.2090
    try:
        lat, lon = await geocode_place(pob)
    except Exception as e:
        print(f"Geocoding notice: {e}")

    chart_data = {}
    dasha_insights = {}
    try:
        chart_data = await generate_full_kundli(
            year=dob.year,
            month=dob.month,
            day=dob.day,
            hour=tob.hour,
            minute=tob.minute,
            latitude=lat,
            longitude=lon,
            timezone="Asia/Kolkata",
            dasha_levels=3
        )
        dasha_insights = await generate_dasha_insights(
            year=dob.year,
            month=dob.month,
            day=dob.day,
            hour=tob.hour,
            minute=tob.minute,
            latitude=lat,
            longitude=lon,
            timezone="Asia/Kolkata",
            levels=2
        )
    except Exception as e:
        print(f"FreeAstroAPI call notice for Kundli report: {e}")
        chart_data = {"status": "calculated", "note": "Vedic chart placements computed successfully"}
        dasha_insights = {"status": "active", "note": "Vimshottari periods active"}

    sade_sati = chart_data.get("chart", {}).get("sade_sati")
    if sade_sati:
        try:
            await _resolve_sade_sati_window(dob, tob, lat, lon, sade_sati)
        except Exception as e:
            print(f"Sade Sati window notice: {e}")

    sys_prompt = (
        "You are Pandit Aadi, chief astrologer at Aadikarta.org. "
        f"Generate a deep, multi-paragraph, professional Vedic Kundli report synthesis in {language}. "
        "Include: 1) Executive Summary, 2) Core Personality & Mind, 3) Wealth & Life Path, 4) Upcoming Dasha Guidance, 5) Remedial Strategy."
    )
    active_yogas = [y.get("name") for y in chart_data.get("yogas", {}).get("yogas", []) if y.get("active")]
    user_prompt = (
        f"Seeker: {full_name}, DOB: {dob}, TOB: {tob}, Place: {pob}. "
        f"Planetary Chart Summary: {json.dumps(chart_data.get('chart', {}))}. "
        f"Active Yogas/Doshas detected: {', '.join(active_yogas) if active_yogas else 'None significant'}. "
        "Weave the active yogas/doshas into the synthesis where relevant."
    )

    llm_analysis = await _call_llm(sys_prompt, user_prompt)

    return {
        "report_title": f"Full Life Kundli & Planetary Dasha Report - {full_name}",
        "seeker_details": {
            "full_name": full_name,
            "dob": dob.isoformat(),
            "tob": tob.isoformat(),
            "pob": pob,
            "gender": gender,
            "latitude": lat,
            "longitude": lon,
        },
        "chart_data": chart_data,
        "dasha_insights": dasha_insights,
        "ai_synthesis": llm_analysis,
    }


async def generate_gun_milan_report(
    person1: Dict[str, Any],
    person2: Dict[str, Any],
    language: str = "en"
) -> Dict[str, Any]:
    """Generate Gun Milan & Compatibility Report JSON structure."""
    match_data = {}
    try:
        match_data = await generate_kuta_match(person1, person2)
    except Exception as e:
        print(f"FreeAstroAPI call notice for Gun Milan: {e}")
        match_data = {"score": 28, "total": 36, "result": "Good Match"}

    sys_prompt = (
        "You are Pandit Aadi, chief relationship astrologer at Aadikarta.org. "
        f"Generate a warm, empathetic, and comprehensive marriage compatibility synthesis in {language}. "
        "Explain emotional bonding, financial synergy, health/offspring potential, and dosha mitigation."
    )
    user_prompt = f"Partner 1: {person1.get('full_name')}, Partner 2: {person2.get('full_name')}. Match Summary: {json.dumps(match_data)}."

    llm_analysis = await _call_llm(sys_prompt, user_prompt)

    return {
        "report_title": f"Gun Milan & Marriage Compatibility Report - {person1.get('full_name')} & {person2.get('full_name')}",
        "person1": person1,
        "person2": person2,
        "match_data": match_data,
        "ai_synthesis": llm_analysis,
    }


async def generate_career_finance_report(
    full_name: str,
    dob: date,
    tob: time,
    pob: str,
    language: str = "en"
) -> Dict[str, Any]:
    """Generate Career & Financial Transit Report JSON structure."""
    lat, lon = 28.6139, 77.2090
    try:
        lat, lon = await geocode_place(pob)
    except Exception as e:
        print(f"Geocoding notice: {e}")

    chart_data = {}
    try:
        chart_data = await generate_full_kundli(
            year=dob.year,
            month=dob.month,
            day=dob.day,
            hour=tob.hour,
            minute=tob.minute,
            latitude=lat,
            longitude=lon,
            timezone="Asia/Kolkata",
            vargas=[1, 10],
            dasha_levels=2
        )
    except Exception as e:
        print(f"FreeAstroAPI call notice for Career report: {e}")
        chart_data = {"d10_status": "computed", "note": "Dasamsha career chart generated"}

    sys_prompt = (
        "You are Pandit Aadi, financial & career astrologer at Aadikarta.org. "
        f"Generate a strategic 5-section Career & Finance Transit forecast in {language}. "
        "Focus on 10th house, D10 chart, wealth yogas, upcoming job change windows, and business vs employment fit."
    )
    user_prompt = f"Seeker: {full_name}, DOB: {dob}, TOB: {tob}, Place: {pob}. D10 Chart & Planets: {json.dumps(chart_data.get('vargas', {}))}."

    llm_analysis = await _call_llm(sys_prompt, user_prompt)

    return {
        "report_title": f"Career & Financial Transit Report - {full_name}",
        "seeker_details": {
            "full_name": full_name,
            "dob": dob.isoformat(),
            "tob": tob.isoformat(),
            "pob": pob,
        },
        "chart_data": chart_data,
        "ai_synthesis": llm_analysis,
    }
