"""Scene image generation. Uses Replicate's FLUX.2 [max] (best quality, paid)
when REPLICATE_API_TOKEN is set, otherwise falls back to Pollinations.ai
(free, no API key required)."""
import os
import time
from urllib.parse import quote

import httpx
from fastapi import HTTPException

IMAGE_BASE_URL = "https://image.pollinations.ai/prompt"

REPLICATE_PREDICTIONS_URL = "https://api.replicate.com/v1/models/black-forest-labs/flux-2-max/predictions"

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
    api_token = os.getenv("REPLICATE_API_TOKEN")
    if api_token:
        return _generate_image_replicate(full_prompt, api_token, width, height)
    return _generate_image_pollinations(full_prompt, width, height)


def _generate_image_replicate(full_prompt: str, api_token: str, width: int, height: int) -> bytes:
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
        # Blocks the request on Replicate's side for up to 60s so we usually
        # get the finished prediction in one round trip instead of polling.
        "Prefer": "wait=60",
    }
    body = {
        "input": {
            "prompt": full_prompt,
            # aspect_ratio="custom" + explicit width/height, not the "1 MP"
            # shorthand -- that shorthand did not reliably return the
            # documented 1024x1024 for a 1:1 request in testing.
            "aspect_ratio": "custom",
            "width": width,
            "height": height,
            "output_format": "jpg",
            "output_quality": 90,
        }
    }

    # Replicate throttles accounts with under $5 credit to a burst of just 1
    # request -- with several scenes generating concurrently (see the admin
    # UI's image-generation lanes), that burst limit gets hit immediately.
    # Retry using the retry_after seconds Replicate itself returns, rather
    # than failing the whole scene on the first 429.
    last_error = None
    response = None
    attempts = 4
    for attempt in range(attempts):
        try:
            response = httpx.post(REPLICATE_PREDICTIONS_URL, headers=headers, json=body, timeout=90.0)
        except httpx.HTTPError as e:
            print(f"Content Studio images: Replicate request failed: {e}")
            raise _UPSTREAM_ERROR

        if response.status_code in (200, 201):
            break

        last_error = f"status {response.status_code} {response.text}"
        if response.status_code == 429 and attempt < attempts - 1:
            try:
                retry_after = float(response.json().get("retry_after", 5.0))
            except (ValueError, TypeError):
                retry_after = 5.0
            time.sleep(retry_after + 1.0)
        else:
            break

    if response is None or response.status_code not in (200, 201):
        print(f"Content Studio images: Replicate request failed after retries: {last_error}")
        raise _UPSTREAM_ERROR

    prediction = response.json()
    get_url = prediction["urls"]["get"]

    # The 60s "Prefer: wait" above covers most runs, but FLUX.2 [max] can take
    # longer -- poll the rest of the way rather than give up.
    for _ in range(30):
        status = prediction.get("status")
        if status == "succeeded":
            break
        if status in ("failed", "canceled"):
            print(f"Content Studio images: Replicate prediction {status}: {prediction.get('error')}")
            raise _UPSTREAM_ERROR
        time.sleep(2.0)
        try:
            poll = httpx.get(get_url, headers=headers, timeout=30.0)
            prediction = poll.json()
        except httpx.HTTPError as e:
            print(f"Content Studio images: Replicate poll failed: {e}")
            raise _UPSTREAM_ERROR
    else:
        print("Content Studio images: Replicate prediction timed out")
        raise _UPSTREAM_ERROR

    output = prediction.get("output")
    image_url = output[0] if isinstance(output, list) else output
    if not image_url:
        print(f"Content Studio images: Replicate returned no output: {prediction}")
        raise _UPSTREAM_ERROR

    try:
        image_response = httpx.get(image_url, timeout=60.0)
    except httpx.HTTPError as e:
        print(f"Content Studio images: Replicate image download failed: {e}")
        raise _UPSTREAM_ERROR
    if image_response.status_code != 200 or not image_response.content:
        print(f"Content Studio images: Replicate image download failed: status {image_response.status_code}")
        raise _UPSTREAM_ERROR
    return image_response.content


def _generate_image_pollinations(full_prompt: str, width: int, height: int) -> bytes:
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
