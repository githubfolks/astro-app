"""Posts a rendered Content Studio video to Facebook (Page video) and
Instagram (Reels), mirroring the Graph API patterns already used for blog
post sharing in routers/cms.py (share_social_post), but for video instead of
photo/text.

Facebook/Instagram fetch the video by URL themselves, so the job's
output_video_url (a relative /static/... path) must be turned into a public,
internet-reachable URL first — via the admin-configured
content_studio_public_base_url setting (they cannot reach localhost).
"""
import time

import httpx
from fastapi import HTTPException

from .settings_service import get_setting

GRAPH_API_VERSION = "v19.0"


def _public_video_url(output_video_url: str) -> str:
    base_url = get_setting("content_studio_public_base_url")
    if not base_url:
        raise HTTPException(
            status_code=400,
            detail="Content Studio public base URL is not configured in Settings. "
                   "Facebook/Instagram need a public URL to fetch the video from.",
        )
    return f"{base_url.rstrip('/')}{output_video_url}"


def post_to_facebook(output_video_url: str, caption: str):
    page_id = get_setting("facebook_page_id")
    access_token = get_setting("facebook_access_token")
    if not page_id or not access_token:
        raise HTTPException(
            status_code=400,
            detail="Facebook integration is not configured in Settings. Please set Facebook Page ID and Access Token.",
        )

    video_url = _public_video_url(output_video_url)

    try:
        res = httpx.post(
            f"https://graph-video.facebook.com/{GRAPH_API_VERSION}/{page_id}/videos",
            data={"file_url": video_url, "description": caption, "access_token": access_token},
            timeout=60.0,
        )
        if res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Facebook Graph API Error: {res.text}")
        return res.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach Facebook API: {e}")


def post_to_instagram(output_video_url: str, caption: str):
    ig_acct_id = get_setting("instagram_business_account_id")
    access_token = get_setting("instagram_access_token")
    if not ig_acct_id or not access_token:
        raise HTTPException(
            status_code=400,
            detail="Instagram integration is not configured in Settings. Please set Instagram Business Account ID and Access Token.",
        )

    video_url = _public_video_url(output_video_url)

    try:
        # Step 1: create a Reels media container
        container_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_acct_id}/media"
        res_c = httpx.post(
            container_url,
            data={"media_type": "REELS", "video_url": video_url, "caption": caption, "access_token": access_token},
            timeout=60.0,
        )
        if res_c.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Instagram Container Creation Error: {res_c.text}")

        creation_id = res_c.json().get("id")
        if not creation_id:
            raise HTTPException(status_code=500, detail="Instagram did not return a creation_id.")

        # Step 2: poll until the video finishes processing (videos take longer than images)
        status_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{creation_id}"
        status_params = {"fields": "status_code", "access_token": access_token}

        for _ in range(30):  # poll up to ~2.5 minutes
            try:
                res_s = httpx.get(status_url, params=status_params, timeout=10.0)
                if res_s.status_code == 200:
                    status_code = res_s.json().get("status_code")
                    if status_code == "FINISHED":
                        break
                    elif status_code in ("ERROR", "EXPIRED"):
                        raise HTTPException(status_code=400, detail=f"Instagram media processing failed: {res_s.text}")
            except httpx.HTTPError:
                pass
            time.sleep(5.0)
        else:
            raise HTTPException(status_code=504, detail="Instagram media processing timed out.")

        # Step 3: publish the container
        publish_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_acct_id}/media_publish"
        res_p = httpx.post(
            publish_url,
            data={"creation_id": creation_id, "access_token": access_token},
            timeout=30.0,
        )
        if res_p.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Instagram Publish Error: {res_p.text}")
        return res_p.json()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach Instagram API: {e}")
