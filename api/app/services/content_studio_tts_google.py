"""Hindi text-to-speech via Google Cloud Text-to-Speech (free tier, API-key auth).

Fallback used when Bhashini (content_studio_tts.py) is unconfigured or fails.
Single REST call, no SDK: https://texttospeech.googleapis.com/v1/text:synthesize
with audioEncoding=LINEAR16, which Google returns as a WAV file (header included),
matching Bhashini's WAV-bytes return contract exactly.
"""
import base64

import httpx
from fastapi import HTTPException

from .settings_service import get_setting

SYNTHESIZE_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"

_NOT_CONFIGURED = HTTPException(
    status_code=503,
    detail="Hindi voice generation is unavailable. Google TTS API key is not configured.",
)
_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Hindi voice generation failed. Please try again.",
)


def text_to_speech(text_hi: str, gender: str = "FEMALE") -> bytes:
    """Returns WAV audio bytes for the given Hindi text via Google Cloud TTS."""
    api_key = get_setting("google_tts_api_key")
    if not api_key:
        raise _NOT_CONFIGURED

    try:
        resp = httpx.post(
            SYNTHESIZE_URL,
            params={"key": api_key},
            json={
                "input": {"text": text_hi},
                "voice": {"languageCode": "hi-IN", "ssmlGender": gender.upper()},
                "audioConfig": {"audioEncoding": "LINEAR16"},
            },
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        print(f"Content Studio TTS (Google): request failed: {e}")
        raise _UPSTREAM_ERROR

    if resp.status_code != 200:
        print(f"Content Studio TTS (Google): error {resp.status_code}: {resp.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        return base64.b64decode(resp.json()["audioContent"])
    except (KeyError, ValueError) as e:
        print(f"Content Studio TTS (Google): unexpected response shape: {e}")
        raise _UPSTREAM_ERROR
