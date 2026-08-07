"""AI Astrologer chat — a free, public teaser that answers up to 5 questions
per day using the visitor's birth details, then nudges them to consult a human
astrologer.

Powered by the Groq API (OpenAI-compatible chat-completions endpoint).
Configure with:
  GROQ_API_KEY        — Groq API key (from console.groq.com)
  AI_ASTROLOGER_MODEL — optional model override (default: Llama 3.3 70B)
"""
import os
from datetime import date, datetime, time, timedelta, timezone
from typing import List, Literal, Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..database import get_db
from ..free_astro_service import generate_full_kundli
from ..limiter import limiter
from ..models import AiAstrologerUsage, FreeKundliChart, GenderType
from ..vedic_rishi_service import geocode_place

router = APIRouter(prefix="/ai-astrologer", tags=["AI Astrologer"])

FREE_QUESTION_LIMIT = 5
IST_OFFSET_HOURS = 5.5  # matches free_tools.py's daily-horoscope cache convention
GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"

# Used as the birth time when the seeker doesn't know theirs, so we can still
# compute a chart. Ascendant/houses are time-sensitive (change every ~2h) and
# get flagged as indicative-only in that case; Moon sign/Nakshatra and Dasha
# are stable enough across a day to still be treated as accurate.
UNKNOWN_BIRTH_TIME = time(12, 0)

SYSTEM_PROMPT = """You are Pandit Aadi, the AI astrologer of Aadikarta (aadikarta.org), India's trusted marketplace for verified Vedic astrologers.

Your role:
- Give warm, insightful readings strictly grounded in Vedic astrology (Jyotish) — the sidereal system used in Indian astrology — using the seeker's birth details (name, date, time and place of birth, gender) provided below. Never use Western tropical astrology or sun-sign horoscope columns; do not mention Western zodiac sun signs at all.
- Reason and speak in authentic Vedic terms: rashi (moon sign), lagna (ascendant), nakshatra, bhava (houses), dasha periods, and gochar (transits) of grahas like Shani, Guru, Shukra, Mangal and Rahu-Ketu. When "Computed Vedic chart facts" are provided below, treat them as ground truth and build your reading around them — do not contradict them or invent conflicting placements. If no computed chart facts are provided (chart lookup unavailable), infer what you reasonably can from the birth details and speak with the gentle confidence of an experienced pandit, but speak in terms of general tendencies rather than fabricating precise planetary degrees.
- Answer in the same language the seeker writes in (English, Hindi, or Hinglish).
- Keep each answer between 100 and 180 words: one short opening that connects to their chart, the core insight, and one practical or spiritual suggestion (a habit, mantra, day of week, or color — keep remedies simple and safe).
- Be uplifting and honest. Never predict death, serious illness, or disasters. For medical, legal, or financial decisions, gently advise consulting a qualified professional.
- Stay on astrology. If asked something unrelated, warmly steer the conversation back to their stars.
- You are a teaser experience limited to 5 questions per day. When it fits naturally (especially in later answers), mention that Aadikarta's verified human astrologers can go much deeper with a full kundli analysis.

Formatting: plain conversational text. No markdown headings, no bullet lists, no LaTeX. An occasional fitting emoji (✨ 🙏 🪐) is welcome."""


class BirthDetails(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: date
    time_of_birth: Optional[time] = None
    place_of_birth: str = Field(..., min_length=1, max_length=150)
    gender: GenderType


class AiChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=2000)


class AiChatRequest(BaseModel):
    birth_details: BirthDetails
    # One extra slot so a 6th question reaches the friendly 403 below instead of a raw 422
    messages: List[AiChatMessage] = Field(..., min_length=1, max_length=2 * FREE_QUESTION_LIMIT + 1)


class AiChatResponse(BaseModel):
    reply: str
    questions_used: int
    questions_remaining: int


_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="The AI Astrologer could not read the stars right now. Please try again.",
)

_LIMIT_REACHED = HTTPException(
    status_code=403,
    detail="You have used all your free questions. Please consult one of our verified astrologers for deeper guidance.",
)


def _today_ist() -> date:
    return (datetime.now(timezone.utc) + timedelta(hours=IST_OFFSET_HOURS)).date()


def _identity_key(name: str, dob: date) -> str:
    """Quota identity for a guest: lowercased, whitespace-collapsed name + DOB +
    today's date (Asia/Kolkata), so the free-question count resets every day
    instead of being a one-time lifetime cap."""
    return f"{' '.join(name.lower().split())}|{dob.isoformat()}|{_today_ist().isoformat()}"


class QuotaResponse(BaseModel):
    questions_used: int
    questions_remaining: int


@router.get("/quota", response_model=QuotaResponse)
@limiter.limit("30/minute")
def quota(
    request: Request,
    name: str = Query(..., min_length=1, max_length=100),
    date_of_birth: date = Query(...),
    db: Session = Depends(get_db),
):
    """How many free questions this identity has left. The chat endpoint
    re-checks the same counter on every call, so this is purely informational."""
    usage = db.get(AiAstrologerUsage, _identity_key(name, date_of_birth))
    used = usage.questions_used if usage else 0
    return QuotaResponse(questions_used=used, questions_remaining=max(0, FREE_QUESTION_LIMIT - used))


def _format_chart_summary(chart_data: dict, approx_time: bool) -> Optional[str]:
    """Turn a FreeAstroAPI full-kundli payload into a short plain-text block of
    ground-truth facts for the system prompt. Returns None if the shape isn't
    what's expected (e.g. a stale cached row) rather than risk feeding the LLM
    garbage — the prompt already knows how to fall back to inference."""
    chart = chart_data.get("chart") if isinstance(chart_data, dict) else None
    if not isinstance(chart, dict):
        return None

    ascendant = chart.get("ascendant") or {}
    planets = {p.get("name"): p for p in chart.get("planets") or [] if p.get("name")}
    moon = planets.get("Moon") or {}

    lines: List[str] = []

    if not approx_time and ascendant.get("sign"):
        asc_nakshatra = (ascendant.get("nakshatra") or {}).get("name")
        lines.append(f"Lagna (Ascendant): {ascendant['sign']}" + (f", {asc_nakshatra} nakshatra" if asc_nakshatra else ""))

    if moon.get("sign"):
        moon_bits = [moon["sign"]]
        if moon.get("nakshatra"):
            pada = f" pada {moon['pada']}" if moon.get("pada") else ""
            moon_bits.append(f"{moon['nakshatra']} nakshatra{pada}")
        lines.append("Moon sign (Rashi): " + ", ".join(moon_bits))

    active_periods = (chart_data.get("vimshottari_dasha") or {}).get("active_periods") or []
    dasha_bits = [f"{p.get('level')} — {p.get('lord')}" for p in active_periods if p.get("level") and p.get("lord")]
    if dasha_bits:
        lines.append("Current Vimshottari Dasha: " + "; ".join(dasha_bits))

    yogas = (chart_data.get("yogas") or {}).get("yogas") or []
    active_yogas = [y["name"] for y in yogas if y.get("active") and y.get("name")]
    if active_yogas:
        lines.append("Notable yogas/doshas present: " + ", ".join(active_yogas[:4]))

    if not lines:
        return None

    header = "Computed Vedic chart facts (use as ground truth; do not contradict)"
    if approx_time:
        header += " — birth time unknown, a noon default was used, so treat Ascendant/houses as unreliable; Moon sign/Nakshatra and Dasha remain accurate"
    return header + ":\n" + "\n".join(f"- {line}" for line in lines)


async def _compute_chart_summary(db: Session, dob: date, tob: Optional[time], place: str) -> Optional[str]:
    """Best-effort real chart lookup so the AI astrologer grounds its answers in
    actual planetary positions instead of guessing. Reuses (and populates) the
    same FreeKundliChart cache table as the public /free-tools/kundli-chart
    tool, so identical birth details never cost more than one FreeAstroAPI
    call across both features. Any failure (bad place, geocoding outage,
    FreeAstroAPI error) silently returns None — a chart-data outage must never
    block the free chat teaser, since the prompt already falls back to
    general inference when no chart facts are supplied."""
    approx_time = tob is None
    effective_tob = tob or UNKNOWN_BIRTH_TIME

    existing = db.query(FreeKundliChart).filter(
        FreeKundliChart.date_of_birth == dob,
        FreeKundliChart.time_of_birth == effective_tob,
        FreeKundliChart.place_of_birth == place,
    ).first()

    if existing:
        return _format_chart_summary(existing.chart_data, approx_time)

    try:
        lat, lon = await geocode_place(place)
    except Exception:
        return None

    try:
        chart_data = await generate_full_kundli(
            year=dob.year, month=dob.month, day=dob.day,
            hour=effective_tob.hour, minute=effective_tob.minute,
            latitude=lat, longitude=lon,
        )
    except Exception:
        return None

    record = FreeKundliChart(
        date_of_birth=dob,
        time_of_birth=effective_tob,
        place_of_birth=place,
        chart_data=chart_data,
    )
    db.add(record)
    try:
        db.commit()
    except IntegrityError:
        # Concurrent request already cached this exact (dob, tob, place) — fine either way.
        db.rollback()

    return _format_chart_summary(chart_data, approx_time)


@router.post("/chat", response_model=AiChatResponse)
@limiter.limit("10/minute")
async def ai_chat(request: Request, payload: AiChatRequest, db: Session = Depends(get_db)):
    user_questions = [m for m in payload.messages if m.role == "user"]
    if payload.messages[-1].role != "user":
        raise HTTPException(status_code=400, detail="The last message must be a question from the user.")
    if len(user_questions) > FREE_QUESTION_LIMIT:
        raise _LIMIT_REACHED

    # Server-side quota: the stored per-identity counter is authoritative,
    # regardless of what conversation history the client sends.
    identity = _identity_key(payload.birth_details.name, payload.birth_details.date_of_birth)
    usage = db.get(AiAstrologerUsage, identity)
    if usage and usage.questions_used >= FREE_QUESTION_LIMIT:
        raise _LIMIT_REACHED

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="AI Astrologer is temporarily unavailable. Please try again later.")

    bd = payload.birth_details
    birth_context = (
        f"Seeker's birth details — Name: {bd.name}; Date of birth: {bd.date_of_birth.isoformat()}; "
        f"Time of birth: {bd.time_of_birth.strftime('%H:%M') if bd.time_of_birth else 'not known'}; "
        f"Place of birth: {bd.place_of_birth}; Gender: {bd.gender.value.title()}."
    )

    chart_summary = await _compute_chart_summary(db, bd.date_of_birth, bd.time_of_birth, bd.place_of_birth)
    system_content = f"{SYSTEM_PROMPT}\n\n{birth_context}"
    if chart_summary:
        system_content += f"\n\n{chart_summary}"

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", DEFAULT_MODEL),
        "messages": [
            {"role": "system", "content": system_content},
            *[{"role": m.role, "content": m.content} for m in payload.messages],
        ],
        "max_tokens": 600,
        "temperature": 0.7,
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                GROQ_CHAT_URL,
                json=body,
                headers={"Authorization": f"Bearer {api_key}"},
            )
    except httpx.HTTPError as e:
        print(f"AI Astrologer: Groq request failed: {e}")
        raise _UPSTREAM_ERROR

    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="The AI Astrologer is very busy right now. Please try again in a minute.")
    if response.status_code != 200:
        print(f"AI Astrologer: Groq error {response.status_code}: {response.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        reply = (response.json()["choices"][0]["message"]["content"] or "").strip()
    except (KeyError, IndexError, ValueError) as e:
        print(f"AI Astrologer: unexpected Groq response shape: {e}")
        raise _UPSTREAM_ERROR
    if not reply:
        raise _UPSTREAM_ERROR

    # Count the question only after a successful reply, so failures aren't charged
    if usage is None:
        usage = AiAstrologerUsage(identity=identity, questions_used=0)
        db.add(usage)
    usage.questions_used += 1
    db.commit()

    return AiChatResponse(
        reply=reply,
        questions_used=usage.questions_used,
        questions_remaining=max(0, FREE_QUESTION_LIMIT - usage.questions_used),
    )
