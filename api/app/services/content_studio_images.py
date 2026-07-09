"""Scene image generation via Pollinations.ai (free, no API key required)."""
from urllib.parse import quote

import httpx
from fastapi import HTTPException

IMAGE_BASE_URL = "https://image.pollinations.ai/prompt"

_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Scene image generation failed. Please try again.",
)


def generate_image(prompt: str, width: int = 1080, height: int = 1920) -> bytes:
    url = f"{IMAGE_BASE_URL}/{quote(prompt)}"
    params = {"width": width, "height": height, "nologo": "true"}

    last_error = None
    for attempt in range(2):
        try:
            response = httpx.get(url, params=params, timeout=60.0)
            if response.status_code == 200 and response.content:
                return response.content
            last_error = f"status {response.status_code}"
        except httpx.HTTPError as e:
            last_error = str(e)

    print(f"Content Studio images: Pollinations request failed after retry: {last_error}")
    raise _UPSTREAM_ERROR
