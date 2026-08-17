"""Shared Hindi <-> English text translation via Groq, used by both the
in-chat translate endpoint and public-facing translate endpoints (e.g. the
daily horoscope page)."""

import logging
import os

import httpx
from fastapi import HTTPException

logger = logging.getLogger(__name__)

_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
_MODEL = "openai/gpt-oss-120b"
_LANG_NAMES = {"hi": "Hindi", "en": "English"}


def translate_text(text: str, target_lang: str) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Translation is temporarily unavailable. Please try again later.")

    target_name = _LANG_NAMES[target_lang]
    body = {
        "model": _MODEL,
        "messages": [
            {
                "role": "system",
                "content": (
                    f"Translate the user's message into {target_name}. "
                    "Output ONLY the translated text — no quotes, no explanation, no transliteration notes. "
                    "Preserve tone and meaning. If the message is already in the target language, return it unchanged."
                ),
            },
            {"role": "user", "content": text},
        ],
        "max_tokens": 500,
        "temperature": 0.2,
        "reasoning_effort": "low",
    }

    try:
        response = httpx.post(
            _GROQ_URL,
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        logger.error(f"Translate: Groq request failed: {e}")
        raise HTTPException(status_code=502, detail="Translation failed. Please try again.")

    if response.status_code == 429:
        raise HTTPException(status_code=429, detail="Translation is busy right now. Please try again in a minute.")
    if response.status_code != 200:
        logger.error(f"Translate: Groq error {response.status_code}: {response.text[:500]}")
        raise HTTPException(status_code=502, detail="Translation failed. Please try again.")

    try:
        translated = (response.json()["choices"][0]["message"]["content"] or "").strip()
    except (KeyError, IndexError, ValueError) as e:
        logger.error(f"Translate: unexpected Groq response shape: {e}")
        raise HTTPException(status_code=502, detail="Translation failed. Please try again.")

    if not translated:
        raise HTTPException(status_code=502, detail="Translation failed. Please try again.")

    return translated
