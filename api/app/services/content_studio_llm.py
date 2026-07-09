"""Splits a topic into narrated video scenes for Content Studio.

Powered by the Groq API (same provider already used by ai_astrologer.py and
cms.py's generate_social_post), configured via the existing GROQ_API_KEY env var.
"""
import json
import os
import re

import httpx
from fastapi import HTTPException

from .. import models

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"

DEFAULT_SCENE_COUNT = {
    models.ContentType.VOICE_OVER_IMAGE: 2,
    models.ContentType.SHORT_VIDEO: 5,
}

SYSTEM_PROMPT = """You are a scriptwriter for Aadikarta, India's trusted marketplace for verified Vedic astrologers, producing short vertical videos (Facebook/Instagram Reels and YouTube Shorts) about Vedic astrology (Jyotish).

Given a topic, break it into exactly {scene_count} scenes that together form one coherent, engaging short video. Ground everything in authentic Vedic astrology terms (rashi, nakshatra, bhava, dasha, grahas like Shani, Guru, Shukra, Mangal, Rahu-Ketu) — never Western tropical sun-sign astrology.

For each scene produce:
- "narration_hi": 1-3 short spoken sentences in natural, conversational Hindi (Devanagari script) that a voiceover artist would read aloud. Keep each scene's narration around 10-20 seconds of speech.
- "image_prompt_en": a short English prompt (under 40 words) for an AI image generator, describing a vertical-composition, celestial/mystical Vedic-astrology visual matching this scene's narration (mandalas, zodiac/graha symbolism, night sky, warm gold and deep blue palette). Do not include any text-in-image requests.

Respond with ONLY a raw JSON array of exactly {scene_count} objects, each with keys "narration_hi" and "image_prompt_en", in narration order. No markdown, no code fences, no commentary."""

_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Scene generation failed. Please try again.",
)


def generate_scenes(topic: str, content_type: "models.ContentType", scene_count: int | None) -> list[dict]:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Content Studio is unavailable. GROQ_API_KEY is not set.")

    count = scene_count or DEFAULT_SCENE_COUNT[content_type]

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", DEFAULT_MODEL),
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT.format(scene_count=count)},
            {"role": "user", "content": f"Topic: {topic}"},
        ],
        "max_tokens": 2000,
        "temperature": 0.7,
    }

    try:
        response = httpx.post(
            GROQ_CHAT_URL,
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=60.0,
        )
    except httpx.HTTPError as e:
        print(f"Content Studio: Groq request failed: {e}")
        raise _UPSTREAM_ERROR

    if response.status_code != 200:
        print(f"Content Studio: Groq error {response.status_code}: {response.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        raw = (response.json()["choices"][0]["message"]["content"] or "").strip()
    except (KeyError, IndexError, ValueError) as e:
        print(f"Content Studio: unexpected Groq response shape: {e}")
        raise _UPSTREAM_ERROR

    # Strip markdown code fences if the model added them despite instructions.
    if raw.startswith("```"):
        raw = re.sub(r"^```[a-zA-Z]*\n", "", raw)
        raw = re.sub(r"\n```$", "", raw)

    try:
        scenes = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"Content Studio: failed to parse scenes JSON: {e}\nRaw: {raw[:500]}")
        raise _UPSTREAM_ERROR

    if not isinstance(scenes, list) or not scenes:
        raise _UPSTREAM_ERROR

    result = []
    for i, scene in enumerate(scenes):
        narration = (scene.get("narration_hi") or "").strip()
        image_prompt = (scene.get("image_prompt_en") or "").strip()
        if not narration or not image_prompt:
            raise _UPSTREAM_ERROR
        result.append({
            "index": i,
            "narration_hi": narration,
            "image_prompt_en": image_prompt,
            "image_url": None,
            "audio_url": None,
            "duration_sec": None,
            "error": None,
        })

    return result
