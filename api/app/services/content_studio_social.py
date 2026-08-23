"""Posts a rendered Content Studio video to Facebook (Page video) and
Instagram (Reels), mirroring the Graph API patterns already used for blog
post sharing in routers/cms.py (share_social_post), but for video instead of
photo/text.

Facebook/Instagram fetch the video by URL themselves, so the job's
output_video_url (a relative /static/... path) must be turned into a public,
internet-reachable URL first — via the admin-configured
content_studio_public_base_url setting (they cannot reach localhost).
"""
import logging
import re
import time
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException

from .settings_service import get_setting

logger = logging.getLogger(__name__)

GRAPH_API_VERSION = "v23.0"

# Instagram rejects (or silently drops) captions with more than 30 hashtags.
INSTAGRAM_MAX_HASHTAGS = 30

_NON_PUBLIC_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}


def _public_video_url(output_video_url: str) -> str:
    base_url = get_setting("content_studio_public_base_url")
    if not base_url:
        raise HTTPException(
            status_code=400,
            detail="Content Studio public base URL is not configured in Settings. "
                   "Facebook/Instagram need a public URL to fetch the video from.",
        )
    hostname = (urlparse(base_url).hostname or "").lower()
    if hostname in _NON_PUBLIC_HOSTS or hostname.endswith(".local"):
        raise HTTPException(
            status_code=400,
            detail=f"Content Studio public base URL ('{base_url}') is not internet-reachable "
                   "(looks like a local/private host). Facebook/Instagram cannot fetch the video from it -- "
                   "set it to a real public URL in Settings.",
        )
    return f"{base_url.rstrip('/')}{output_video_url}"


def _cap_hashtags(caption: str, max_hashtags: int = INSTAGRAM_MAX_HASHTAGS) -> str:
    """Trims a caption down to at most max_hashtags '#tag' tokens, dropping
    the excess from the end, so Instagram doesn't reject/strip the post for
    exceeding its 30-hashtag limit."""
    count = 0
    out_end = len(caption)
    for m in re.finditer(r"#\w+", caption):
        count += 1
        if count > max_hashtags:
            out_end = m.start()
            break
    return caption[:out_end].rstrip()


def post_to_facebook(output_video_url: str, caption: str):
    """Publishes a Content Studio video as a Facebook Page Reel via the
    Graph API's video_reels 3-phase upload flow (start -> hosted-URL upload
    -> finish/PUBLISHED). The legacy /{page-id}/videos endpoint creates a
    plain Page video post, not a Reel, so it must not be used here."""
    page_id = get_setting("facebook_page_id")
    access_token = get_setting("facebook_access_token")
    if not page_id or not access_token:
        raise HTTPException(
            status_code=400,
            detail="Facebook integration is not configured in Settings. Please set Facebook Page ID and Access Token.",
        )

    video_url = _public_video_url(output_video_url)
    reels_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{page_id}/video_reels"

    try:
        # Phase 1: start the upload session.
        res_start = httpx.post(
            reels_url,
            data={"upload_phase": "start", "access_token": access_token},
            timeout=30.0,
        )
        if res_start.status_code != 200:
            logger.error("Facebook Reels upload_phase=start failed: %s", res_start.text)
            raise HTTPException(status_code=400, detail=f"Facebook Graph API Error (start): {res_start.text}")

        start_data = res_start.json()
        video_id = start_data.get("video_id")
        upload_url = start_data.get("upload_url")
        if not video_id or not upload_url:
            logger.error("Facebook Reels start response missing video_id/upload_url: %s", start_data)
            raise HTTPException(status_code=500, detail="Facebook did not return a video_id/upload_url.")

        # Phase 2: hand Facebook the hosted video URL to fetch and ingest.
        res_upload = httpx.post(
            upload_url,
            headers={
                "Authorization": f"OAuth {access_token}",
                "file_url": video_url,
            },
            timeout=120.0,
        )
        if res_upload.status_code != 200 or not res_upload.json().get("success"):
            logger.error("Facebook Reels video upload failed: %s", res_upload.text)
            raise HTTPException(status_code=400, detail=f"Facebook Graph API Error (upload): {res_upload.text}")

        # Facebook processes the ingested video asynchronously -- calling
        # upload_phase=finish before video_status reaches "ready" completes
        # without error but silently leaves the reel in a "draft" publish
        # state that never goes live, so wait for processing to finish first.
        status_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{video_id}"
        status_params = {"fields": "status", "access_token": access_token}
        for _ in range(60):  # poll up to ~5 minutes
            try:
                res_s = httpx.get(status_url, params=status_params, timeout=10.0)
                if res_s.status_code == 200:
                    video_status = res_s.json().get("status", {}).get("video_status")
                    if video_status == "ready":
                        break
                    elif video_status in ("error", "expired"):
                        logger.error("Facebook Reels video processing failed: %s", res_s.text)
                        raise HTTPException(status_code=400, detail=f"Facebook Reels video processing failed: {res_s.text}")
            except httpx.HTTPError:
                pass
            time.sleep(5.0)
        else:
            logger.error("Facebook Reels video processing timed out for video_id=%s", video_id)
            raise HTTPException(status_code=504, detail="Facebook Reels video processing timed out.")

        # Phase 3: finish the session and publish the Reel.
        res_finish = httpx.post(
            reels_url,
            data={
                "upload_phase": "finish",
                "video_id": video_id,
                "video_state": "PUBLISHED",
                "description": caption,
                "access_token": access_token,
            },
            timeout=30.0,
        )
        if res_finish.status_code != 200 or not res_finish.json().get("success"):
            logger.error("Facebook Reels upload_phase=finish failed: %s", res_finish.text)
            raise HTTPException(status_code=400, detail=f"Facebook Graph API Error (finish): {res_finish.text}")

        return {"video_id": video_id, **res_finish.json()}
    except httpx.HTTPError as e:
        logger.error("Failed to reach Facebook API for Reels publish: %s", e)
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
    caption = _cap_hashtags(caption)

    try:
        # Step 1: create a Reels media container
        container_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_acct_id}/media"
        res_c = httpx.post(
            container_url,
            data={"media_type": "REELS", "video_url": video_url, "caption": caption, "access_token": access_token},
            timeout=60.0,
        )
        if res_c.status_code != 200:
            logger.error("Instagram container creation failed: %s", res_c.text)
            raise HTTPException(status_code=400, detail=f"Instagram Container Creation Error: {res_c.text}")

        creation_id = res_c.json().get("id")
        if not creation_id:
            logger.error("Instagram container creation missing id: %s", res_c.json())
            raise HTTPException(status_code=500, detail="Instagram did not return a creation_id.")

        # Step 2: poll until the video finishes processing (videos take longer than images)
        status_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{creation_id}"
        # status_code alone (IN_PROGRESS/FINISHED/ERROR/EXPIRED) gives no reason
        # on failure -- status carries the actual human-readable explanation.
        status_params = {"fields": "status_code,status", "access_token": access_token}

        for _ in range(30):  # poll up to ~2.5 minutes
            try:
                res_s = httpx.get(status_url, params=status_params, timeout=10.0)
                if res_s.status_code == 200:
                    status_code = res_s.json().get("status_code")
                    if status_code == "FINISHED":
                        break
                    elif status_code in ("ERROR", "EXPIRED"):
                        logger.error("Instagram media processing failed: %s", res_s.text)
                        raise HTTPException(status_code=400, detail=f"Instagram media processing failed: {res_s.text}")
            except httpx.HTTPError:
                pass
            time.sleep(5.0)
        else:
            logger.error("Instagram media processing timed out for creation_id=%s", creation_id)
            raise HTTPException(status_code=504, detail="Instagram media processing timed out.")

        # Step 3: publish the container
        publish_url = f"https://graph.facebook.com/{GRAPH_API_VERSION}/{ig_acct_id}/media_publish"
        res_p = httpx.post(
            publish_url,
            data={"creation_id": creation_id, "access_token": access_token},
            timeout=30.0,
        )
        if res_p.status_code != 200:
            logger.error("Instagram publish failed: %s", res_p.text)
            raise HTTPException(status_code=400, detail=f"Instagram Publish Error: {res_p.text}")
        return res_p.json()
    except httpx.HTTPError as e:
        logger.error("Failed to reach Instagram API for Reels publish: %s", e)
        raise HTTPException(status_code=502, detail=f"Failed to reach Instagram API: {e}")
