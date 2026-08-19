"""Uploads a rendered Content Studio video to YouTube via the Data API v3's
resumable upload protocol, authenticated with a pre-authorized refresh token
(YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REFRESH_TOKEN env vars --
see api/scripts/get_youtube_refresh_token.py for how to obtain the refresh
token).

Unlike Facebook/Instagram (content_studio_social.py), which fetch the video
from a public URL, YouTube's upload API takes the file bytes directly -- so
this reads output_video_url's underlying local file instead of needing a
public base URL configured.
"""
import os

import httpx
from fastapi import HTTPException

TOKEN_URL = "https://oauth2.googleapis.com/token"
UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos?part=snippet"

# "People & Blogs" -- a reasonable default category for astrology commentary;
# change if YouTube Studio analytics suggest a better-performing category.
DEFAULT_CATEGORY_ID = "22"


def _local_path(output_video_url: str) -> str:
    # output_video_url is e.g. "/static/content_studio/5/output.mp4"; /static
    # is mounted directly onto the local "uploads" directory (see main.py).
    return os.path.join("uploads", output_video_url.removeprefix("/static/"))


def _get_access_token() -> str:
    client_id = os.getenv("YOUTUBE_CLIENT_ID")
    client_secret = os.getenv("YOUTUBE_CLIENT_SECRET")
    refresh_token = os.getenv("YOUTUBE_REFRESH_TOKEN")
    if not client_id or not client_secret or not refresh_token:
        raise HTTPException(
            status_code=503,
            detail="YouTube integration is not configured. YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, "
                   "and YOUTUBE_REFRESH_TOKEN must all be set.",
        )

    try:
        res = httpx.post(
            TOKEN_URL,
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "refresh_token": refresh_token,
                "grant_type": "refresh_token",
            },
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach Google's token endpoint: {e}")

    if res.status_code != 200:
        raise HTTPException(status_code=502, detail=f"YouTube token refresh failed: {res.text}")

    access_token = res.json().get("access_token")
    if not access_token:
        raise HTTPException(status_code=502, detail="YouTube token refresh did not return an access token.")
    return access_token


def post_to_youtube(output_video_url: str, title: str, description: str, tags: list[str] | None = None) -> dict:
    video_path = _local_path(output_video_url)
    if not os.path.isfile(video_path):
        raise HTTPException(status_code=404, detail=f"Rendered video file not found at {video_path}.")

    access_token = _get_access_token()
    file_size = os.path.getsize(video_path)
    # YouTube titles are capped at 100 chars -- job topics can run longer.
    title = title[:97] + "..." if len(title) > 100 else title

    try:
        # Step 1: open a resumable upload session with the video's metadata.
        init_res = httpx.post(
            UPLOAD_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json; charset=UTF-8",
                "X-Upload-Content-Type": "video/mp4",
                "X-Upload-Content-Length": str(file_size),
            },
            json={
                "snippet": {
                    "title": title,
                    "description": description,
                    "categoryId": DEFAULT_CATEGORY_ID,
                    **({"tags": tags} if tags else {}),
                },
                "status": {"privacyStatus": "public", "selfDeclaredMadeForKids": False},
            },
            timeout=30.0,
        )
        if init_res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"YouTube upload session creation failed: {init_res.text}")

        upload_session_url = init_res.headers.get("Location")
        if not upload_session_url:
            raise HTTPException(status_code=502, detail="YouTube did not return an upload session URL.")

        # Step 2: PUT the actual video bytes to that session URL.
        with open(video_path, "rb") as f:
            video_bytes = f.read()
        upload_res = httpx.put(
            upload_session_url,
            headers={"Content-Type": "video/mp4"},
            content=video_bytes,
            timeout=300.0,
        )
        if upload_res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=f"YouTube video upload failed: {upload_res.text}")

        return upload_res.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach YouTube API: {e}")


def get_youtube_video(video_id: str) -> dict:
    """Fetches the video's live snippet straight from YouTube via videos.list,
    so an edit can start from what's actually published rather than our
    last-known copy -- which drifts if the video is ever edited directly in
    YouTube Studio instead of through this admin.

    Google's videos.list reference doesn't publish a scope table; this reuses
    the same access token as update_youtube_video (youtube.force-ssl), which
    is a superset read/write scope and covers reading a video we own.
    """
    access_token = _get_access_token()

    try:
        res = httpx.get(
            VIDEOS_URL,
            params={"id": video_id},
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach YouTube API: {e}")

    if res.status_code != 200:
        raise HTTPException(status_code=400, detail=f"YouTube video fetch failed: {res.text}")

    items = res.json().get("items") or []
    if not items:
        raise HTTPException(status_code=404, detail="Video not found on YouTube -- it may have been deleted.")

    snippet = items[0].get("snippet") or {}
    return {
        "title": snippet.get("title", ""),
        "description": snippet.get("description", ""),
        "tags": snippet.get("tags") or [],
    }


def update_youtube_video(video_id: str, title: str, description: str, tags: list[str] | None = None) -> dict:
    """Edits an already-published video's metadata via videos.update.

    Requires the refresh token to carry the youtube.force-ssl scope --
    youtube.upload (used for the initial post_to_youtube upload) does not
    authorize editing existing videos. videos.update replaces the whole
    snippet in one call, so categoryId must be re-sent even though it isn't
    changing (see get_youtube_refresh_token.py for scope setup).
    """
    access_token = _get_access_token()
    title = title[:97] + "..." if len(title) > 100 else title

    try:
        res = httpx.put(
            VIDEOS_URL,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json; charset=UTF-8",
            },
            json={
                "id": video_id,
                "snippet": {
                    "title": title,
                    "description": description,
                    "categoryId": DEFAULT_CATEGORY_ID,
                    **({"tags": tags} if tags else {}),
                },
            },
            timeout=30.0,
        )
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"YouTube video update failed: {res.text}")
        return res.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach YouTube API: {e}")
