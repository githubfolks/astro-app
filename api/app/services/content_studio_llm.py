"""Splits a topic into narrated video scenes for Content Studio.

Powered by the Groq API (same provider already used by ai_astrologer.py and
cms.py's generate_social_post), configured via the existing GROQ_API_KEY env var.
"""
import json
import os
import random
import re

import httpx
from fastapi import HTTPException

from .. import models
from . import content_studio_claude
from .settings_service import get_setting

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "openai/gpt-oss-120b"

DEFAULT_SCENE_COUNT = {
    models.ContentType.VOICE_OVER_IMAGE: 2,
    models.ContentType.SHORT_VIDEO: 5,
}

SYSTEM_PROMPT = """You are a scriptwriter for Aadikarta, India's trusted marketplace for verified Vedic astrologers, producing short vertical videos (Facebook/Instagram Reels and YouTube Shorts) about Vedic astrology (Jyotish).

Given a topic, break it into exactly {scene_count} scenes that together form one coherent, engaging short video. Ground everything in authentic Vedic astrology terms (rashi, nakshatra, bhava, dasha, grahas like Shani, Guru, Shukra, Mangal, Rahu-Ketu) — never Western tropical sun-sign astrology.

Only SCENE 1 may be a general/introductory angle (setting up the topic as a whole). EVERY scene after the first MUST cover its own distinct, specific life-theme angle — e.g. career, relationships/marriage, money/wealth, health, remedies/puja — never a second general/introductory scene, and never two non-intro scenes sharing the same angle. If there are only 2 scenes total, scene 1 is the general intro and scene 2 must be one specific angle (pick whichever the topic most naturally leads to).

For each scene produce:
- "narration_hi": 1-3 short spoken sentences in natural, conversational Hindi (Devanagari script) that a voiceover artist would read aloud. Keep each scene's narration around 10-20 seconds of speech.
- "scene_theme_en": a short 3-6 word English phrase naming THIS scene's specific angle (e.g. "career and job growth", "marriage and relationships", "financial gain", "health and wellbeing", "remedies and puja"), or "general introduction to the topic" for scene 1 only. This is used to keep each scene's illustration visually distinct even when scenes share the same graha/rashi — never repeat the same phrase across two different scenes.

Respond with ONLY a raw JSON array of exactly {scene_count} objects, each with keys "narration_hi" and "scene_theme_en", in narration order. No markdown, no code fences, no commentary."""

_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Scene generation failed. Please try again.",
)

TOPIC_SYSTEM_PROMPT = """You are a content strategist for Aadikarta, India's trusted marketplace for verified Vedic astrologers, brainstorming topics for short vertical videos (Facebook/Instagram Reels and YouTube Shorts) about Vedic astrology (Jyotish).

You will be given a specific graha or rashi and a content angle to build the topic around -- use exactly that subject and angle, don't substitute a different one (e.g. don't default to Shani/Saturn if a different graha or rashi was given). Ground the topic in authentic Vedic astrology terms (rashi, nakshatra, bhava, dasha) — never Western tropical sun-sign astrology. Phrase it as a short, specific, plain-English sentence a general audience would be curious to tap and watch.

Respond with ONLY the topic sentence. No quotes, no markdown, no commentary, no numbering."""

# Groq's suggestions collapsed onto "Shani transit affecting career" almost
# every time even at temperature=1.0 -- each call is stateless with no memory
# of prior suggestions, so the model just kept re-sampling the single most
# statistically typical astrology topic. Picking the subject and angle here in
# code and forcing the model to use exactly that pick guarantees variety
# instead of hoping the model's own sampling provides it.
TOPIC_SUBJECTS = [
    "Surya (Sun)", "Chandra (Moon)", "Mangal (Mars)", "Budha (Mercury)", "Guru (Jupiter)",
    "Shukra (Venus)", "Shani (Saturn)", "Rahu", "Ketu",
    "Mesha rashi", "Vrishabha rashi", "Mithuna rashi", "Karka rashi", "Simha rashi", "Kanya rashi",
    "Tula rashi", "Vrishchika rashi", "Dhanu rashi", "Makara rashi", "Kumbha rashi", "Meena rashi",
]
TOPIC_ANGLES = [
    "a current transit's effect", "a common life question", "a myth to bust", "a remedy explained",
    "a dasha period's influence", "a nakshatra's characteristics", "a compatibility question",
    "a festival or muhurat's astrological significance", "a bhava (house) placement's significance",
]


def suggest_topic() -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Content Studio is unavailable. GROQ_API_KEY is not set.")

    subject = random.choice(TOPIC_SUBJECTS)
    angle = random.choice(TOPIC_ANGLES)

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", DEFAULT_MODEL),
        "messages": [
            {"role": "system", "content": TOPIC_SYSTEM_PROMPT},
            {"role": "user", "content": f"Subject: {subject}\nAngle: {angle}"},
        ],
        "max_tokens": 100,
        "temperature": 1.0,
        "reasoning_effort": "low",
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
3. A single line of 10-15 relevant hashtags, space-separated, each starting with #: mix specific hashtags drawn from the topic (e.g. a zodiac sign, planet, or theme mentioned in it) with these standing hashtags: #AstrologyReels #Astrology #Horoscope #Zodiac #ZodiacSigns #HindiAstrology #AadikartaAstrology #ReelsIndia #Kundli #Spirituality

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
        "reasoning_effort": "low",
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


STANDING_HASHTAGS = "#AstrologyReels #Astrology #Horoscope #Zodiac #ZodiacSigns #HindiAstrology #AadikartaAstrology #ReelsIndia #Kundli #Spirituality"

# X/LinkedIn have no publish API configured for Content Studio, so this is
# copy-paste-only: the model is asked to end its reply with a "TAGS:" line so
# the caller can split post body and hashtags into two independently
# copyable fields, same as cms.py's generate_social_post for blog posts.
SOCIAL_COPY_SYSTEM_PROMPTS = {
    "twitter": (
        "You are a social media manager for Aadikarta, India's trusted marketplace for verified Vedic astrologers. "
        "Write a concise, engaging post for X (Twitter) promoting a short vertical astrology video (Reel/Short), under "
        "260 characters, with an attention-grabbing hook in natural Hinglish (a mix of Hindi in Devanagari script and "
        "English). Do not include hashtags in the post body, markdown headers, titles, HTML tags, or code block markers. "
        "After the post body, on a new line, write 'TAGS:' followed by 5-8 relevant hashtags (single line, "
        f"space-separated), mixing hashtags specific to the topic with these standing hashtags: {STANDING_HASHTAGS}."
    ),
    "linkedin": (
        "You are a social media manager for Aadikarta, India's trusted marketplace for verified Vedic astrologers. "
        "Write a professional, thought-leadership style LinkedIn post promoting a short vertical astrology video "
        "(Reel/Short) -- a short hook line, 2-4 short paragraphs or bullet points grounded in authentic Vedic astrology "
        "terms, and a closing line inviting engagement. Do not include hashtags in the post body, markdown headers, "
        "titles, HTML tags, or code block markers. After the post body, on a new line, write 'TAGS:' followed by 5-8 "
        f"relevant hashtags (single line, space-separated), mixing hashtags specific to the topic with these standing "
        f"hashtags: {STANDING_HASHTAGS}."
    ),
}


def generate_social_copy(topic: str, platform: str) -> dict:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Content Studio is unavailable. GROQ_API_KEY is not set.")

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", DEFAULT_MODEL),
        "messages": [
            {"role": "system", "content": SOCIAL_COPY_SYSTEM_PROMPTS[platform]},
            {"role": "user", "content": f"Topic: {topic}"},
        ],
        "max_tokens": 400,
        "temperature": 0.8,
        "reasoning_effort": "low",
    }

    try:
        response = httpx.post(
            GROQ_CHAT_URL,
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        print(f"Content Studio: Groq social copy request failed: {e}")
        raise _UPSTREAM_ERROR

    if response.status_code != 200:
        print(f"Content Studio: Groq social copy error {response.status_code}: {response.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        reply = (response.json()["choices"][0]["message"]["content"] or "").strip()
    except (KeyError, IndexError, ValueError) as e:
        print(f"Content Studio: unexpected Groq social copy response shape: {e}")
        raise _UPSTREAM_ERROR

    if not reply:
        raise _UPSTREAM_ERROR

    if reply.startswith("```"):
        reply = re.sub(r"^```[a-zA-Z]*\n", "", reply)
        reply = re.sub(r"\n```$", "", reply)

    match = re.search(r"\n?TAGS:\s*(.+)\s*$", reply, re.IGNORECASE | re.DOTALL)
    if match:
        text = reply[:match.start()].strip()
        tags = match.group(1).strip()
    else:
        text, tags = reply, ""

    return {"text": text, "tags": tags}


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
        "reasoning_effort": "low",
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
        scene_theme = (scene.get("scene_theme_en") or "").strip()
        # Groq writes the Hindi narration above; Claude writes the matching
        # image prompt sent to the image provider (content_studio_claude.py).
        # Passing the topic + this scene's theme (not just the narration) is
        # what keeps scenes visually distinct -- without it, every scene in
        # e.g. a Shani-transit video names Shani, so Claude drew the same
        # generic Shani portrait for every single scene regardless of whether
        # that scene was actually about career, relationships, or remedies.
        image_prompt = content_studio_claude.generate_image_prompt(narration, topic=topic, scene_theme=scene_theme)
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
