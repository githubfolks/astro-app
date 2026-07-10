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
from . import content_studio_claude
from .settings_service import get_setting

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"

DEFAULT_SCENE_COUNT = {
    models.ContentType.VOICE_OVER_IMAGE: 2,
    models.ContentType.SHORT_VIDEO: 5,
}

SYSTEM_PROMPT = """You are a scriptwriter for Aadikarta, India's trusted marketplace for verified Vedic astrologers, producing short vertical videos (Facebook/Instagram Reels and YouTube Shorts) about Vedic astrology (Jyotish).

Given a topic, break it into exactly {scene_count} scenes that together form one coherent, engaging short video. Ground everything in authentic Vedic astrology terms (rashi, nakshatra, bhava, dasha, grahas like Shani, Guru, Shukra, Mangal, Rahu-Ketu) — never Western tropical sun-sign astrology.

For each scene produce "narration_hi": 1-3 short spoken sentences in natural, conversational Hindi (Devanagari script) that a voiceover artist would read aloud. Keep each scene's narration around 10-20 seconds of speech.

Respond with ONLY a raw JSON array of exactly {scene_count} objects, each with key "narration_hi", in narration order. No markdown, no code fences, no commentary."""

_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Scene generation failed. Please try again.",
)

TOPIC_SYSTEM_PROMPT = """You are a content strategist for Aadikarta, India's trusted marketplace for verified Vedic astrologers, brainstorming topics for short vertical videos (Facebook/Instagram Reels and YouTube Shorts) about Vedic astrology (Jyotish).

Suggest ONE specific, engaging topic idea grounded in authentic Vedic astrology terms (rashi, nakshatra, bhava, dasha, grahas like Shani, Guru, Shukra, Mangal, Rahu-Ketu) — never Western tropical sun-sign astrology. The topic should be something a general audience would be curious to tap and watch (a transit's effect, a common life question, a myth to bust, a remedy explained), phrased as a short plain-English sentence.

Respond with ONLY the topic sentence. No quotes, no markdown, no commentary, no numbering."""


def suggest_topic() -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Content Studio is unavailable. GROQ_API_KEY is not set.")

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", DEFAULT_MODEL),
        "messages": [{"role": "system", "content": TOPIC_SYSTEM_PROMPT}],
        "max_tokens": 100,
        "temperature": 1.0,
    }

    try:
        response = httpx.post(
            GROQ_CHAT_URL,
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        print(f"Content Studio: Groq topic suggestion request failed: {e}")
        raise _UPSTREAM_ERROR

    if response.status_code != 200:
        print(f"Content Studio: Groq topic suggestion error {response.status_code}: {response.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        topic = (response.json()["choices"][0]["message"]["content"] or "").strip().strip('"')
    except (KeyError, IndexError, ValueError) as e:
        print(f"Content Studio: unexpected Groq topic suggestion response shape: {e}")
        raise _UPSTREAM_ERROR

    if not topic:
        raise _UPSTREAM_ERROR

    return topic


CAPTION_SYSTEM_PROMPT = """You are a social media manager for Aadikarta, India's trusted marketplace for verified Vedic astrologers, writing Instagram/Facebook captions for short vertical astrology Reels/Shorts.

Given the video's topic, write a caption with this exact structure:
1. One short, catchy hook line in natural Hinglish (a mix of Hindi in Devanagari script and English) that relates directly to the topic and creates curiosity, immediately followed by this exact call-to-action text verbatim (do not alter it): "{cta}"
2. A blank line.
3. A single line of 10-15 relevant hashtags, space-separated, each starting with #: mix specific hashtags drawn from the topic (e.g. a zodiac sign, planet, or theme mentioned in it) with these standing hashtags: #AstrologyReels #Zodiac #ZodiacSigns #HindiAstrology #AadikartaAstrology #AstrologyTok #ReelsIndia #FYP #Explore #Kundli

Respond with ONLY the caption text (hook+CTA line, blank line, hashtag line). No markdown, no code fences, no commentary."""


def generate_social_caption(topic: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Content Studio is unavailable. GROQ_API_KEY is not set.")

    cta = get_setting("content_studio_caption_cta")

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", DEFAULT_MODEL),
        "messages": [
            {"role": "system", "content": CAPTION_SYSTEM_PROMPT.format(cta=cta)},
            {"role": "user", "content": f"Topic: {topic}"},
        ],
        "max_tokens": 300,
        "temperature": 0.8,
    }

    try:
        response = httpx.post(
            GROQ_CHAT_URL,
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        print(f"Content Studio: Groq caption request failed: {e}")
        raise _UPSTREAM_ERROR

    if response.status_code != 200:
        print(f"Content Studio: Groq caption error {response.status_code}: {response.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        caption = (response.json()["choices"][0]["message"]["content"] or "").strip()
    except (KeyError, IndexError, ValueError) as e:
        print(f"Content Studio: unexpected Groq caption response shape: {e}")
        raise _UPSTREAM_ERROR

    if not caption:
        raise _UPSTREAM_ERROR

    return caption


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
        if not narration:
            raise _UPSTREAM_ERROR
        # Groq writes the Hindi narration above; Claude writes the matching
        # image prompt sent to Pollinations (content_studio_claude.py).
        image_prompt = content_studio_claude.generate_image_prompt(narration)
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
