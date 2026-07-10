"""Scene image generation via Pollinations.ai (free, no API key required)."""
import time
from urllib.parse import quote

import httpx
from fastapi import HTTPException

IMAGE_BASE_URL = "https://image.pollinations.ai/prompt"

# Requesting a directly-vertical resolution (e.g. 1080x1920) produced visibly
# stretched/warped content -- Flux (Pollinations' backend) generates best at
# roughly square resolutions. Generate square and let content_studio_video.py
# center-crop to 9:16 instead of asking the model for a non-native aspect ratio.
IMAGE_SIZE = 1024

# Appended to every scene's Groq-written prompt so the art direction stays
# consistent (traditional Indian/Vedic iconography) regardless of prompt wording.
STYLE_SUFFIX = (
    ", traditional Indian Vedic astrology art style, Navagraha iconography, "
    "Indian miniature painting (Pattachitra/Tanjore), ornate temple art, rich gold "
    "and jewel tones, detailed classical Indian illustration"
)

_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Scene image generation failed. Please try again.",
)


def build_prompt(prompt: str) -> str:
    """The exact text sent to Pollinations for a given scene prompt -- exposed
    so the admin UI can show precisely what will be/was sent, not just the
    editable Groq-written portion."""
    return prompt + STYLE_SUFFIX


def generate_image(prompt: str, width: int = IMAGE_SIZE, height: int = IMAGE_SIZE) -> bytes:
    full_prompt = build_prompt(prompt)
    url = f"{IMAGE_BASE_URL}/{quote(full_prompt)}"
    # enhance=false: Pollinations' `enhance` option runs its own LLM rewrite of
    # the prompt before generating, which we have no visibility into -- keeping
    # it off means the model sees exactly the text we constructed, nothing more.
    params = {"width": width, "height": height, "nologo": "true", "enhance": "false"}

    last_error = None
    attempts = 4
    for attempt in range(attempts):
        try:
            response = httpx.get(url, params=params, timeout=60.0)
            if response.status_code == 200 and response.content:
                return response.content
            last_error = f"status {response.status_code}"
            # 429 means we're being rate-limited -- retrying instantly just hits the
            # same limit again, so back off (longer than a rate-limit window usually
            # resets in) before trying again.
            if response.status_code == 429 and attempt < attempts - 1:
                time.sleep(5.0 * (attempt + 1))
        except httpx.HTTPError as e:
            last_error = str(e)

    print(f"Content Studio images: Pollinations request failed after {attempts} attempts: {last_error}")
    raise _UPSTREAM_ERROR
