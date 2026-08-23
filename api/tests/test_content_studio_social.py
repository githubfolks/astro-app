import httpx
import pytest
from fastapi import HTTPException

from app.services import content_studio_social, settings_service


@pytest.fixture(autouse=True)
def fb_settings(monkeypatch):
    monkeypatch.setitem(settings_service._CACHE, "facebook_page_id", "my-fb-page")
    monkeypatch.setitem(settings_service._CACHE, "facebook_access_token", "my-fb-token")
    monkeypatch.setitem(settings_service._CACHE, "content_studio_public_base_url", "https://cdn.example.com")


class MockResponse:
    def __init__(self, status_code=200, json_data=None, text=""):
        self.status_code = status_code
        self._json_data = json_data or {}
        self.text = text or str(json_data)

    def json(self):
        return self._json_data


def test_post_to_facebook_uses_video_reels_flow(monkeypatch):
    calls = []

    def mock_post(url, **kwargs):
        calls.append((url, kwargs))
        if url.endswith("/video_reels") and kwargs["data"].get("upload_phase") == "start":
            return MockResponse(json_data={"video_id": "vid123", "upload_url": "https://rupload.facebook.com/upload/vid123"})
        if url == "https://rupload.facebook.com/upload/vid123":
            assert kwargs["headers"]["file_url"] == "https://cdn.example.com/static/out.mp4"
            assert kwargs["headers"]["Authorization"] == "OAuth my-fb-token"
            return MockResponse(json_data={"success": True})
        if url.endswith("/video_reels") and kwargs["data"].get("upload_phase") == "finish":
            assert kwargs["data"]["video_id"] == "vid123"
            assert kwargs["data"]["video_state"] == "PUBLISHED"
            return MockResponse(json_data={"success": True})
        raise AssertionError(f"Unexpected call to {url}")

    def mock_get(url, **kwargs):
        assert url == "https://graph.facebook.com/v23.0/vid123"
        return MockResponse(json_data={"status": {"video_status": "ready"}})

    monkeypatch.setattr(httpx, "post", mock_post)
    monkeypatch.setattr(httpx, "get", mock_get)

    result = content_studio_social.post_to_facebook("/static/out.mp4", "Check out this reel!")

    assert result["video_id"] == "vid123"
    assert len(calls) == 3
    # Every call must hit the real Reels endpoints, never the legacy /videos post endpoint.
    assert all("/videos" not in url or "/video_reels" in url for url, _ in calls)


def test_post_to_facebook_waits_for_video_to_be_ready_before_finishing(monkeypatch):
    """Calling upload_phase=finish before Facebook's video_status reaches
    "ready" completes without error but silently leaves the reel stuck in a
    "draft" publish state that never goes live -- this is exactly the bug
    that left a real reel invisible to the public despite "success": true
    on every call, so the finish call must not fire until status is ready."""
    poll_count = {"n": 0}

    def mock_post(url, **kwargs):
        if url.endswith("/video_reels") and kwargs["data"].get("upload_phase") == "start":
            return MockResponse(json_data={"video_id": "vid123", "upload_url": "https://rupload.facebook.com/upload/vid123"})
        if url == "https://rupload.facebook.com/upload/vid123":
            return MockResponse(json_data={"success": True})
        if url.endswith("/video_reels") and kwargs["data"].get("upload_phase") == "finish":
            assert poll_count["n"] >= 2, "finish must not be called before status_video_status reaches 'ready'"
            return MockResponse(json_data={"success": True})
        raise AssertionError(f"Unexpected call to {url}")

    def mock_get(url, **kwargs):
        poll_count["n"] += 1
        status = "processing" if poll_count["n"] < 2 else "ready"
        return MockResponse(json_data={"status": {"video_status": status}})

    monkeypatch.setattr(httpx, "post", mock_post)
    monkeypatch.setattr(httpx, "get", mock_get)
    monkeypatch.setattr(content_studio_social.time, "sleep", lambda _: None)

    result = content_studio_social.post_to_facebook("/static/out.mp4", "caption")

    assert result["video_id"] == "vid123"
    assert poll_count["n"] == 2


def test_post_to_facebook_timeout_surfaces_last_status_response(monkeypatch):
    """A polling loop that always logs the same generic "timed out" message
    hides whatever Facebook is actually returning (an error, a permission
    problem, an unexpected field) behind 5 minutes of silent retries -- the
    error detail must include the real last response so this is diagnosable
    without re-triggering and waiting again."""
    def mock_post(url, **kwargs):
        if url.endswith("/video_reels") and kwargs["data"].get("upload_phase") == "start":
            return MockResponse(json_data={"video_id": "vid123", "upload_url": "https://rupload.facebook.com/upload/vid123"})
        if url == "https://rupload.facebook.com/upload/vid123":
            return MockResponse(json_data={"success": True})
        raise AssertionError(f"Unexpected call to {url}")

    def mock_get(url, **kwargs):
        return MockResponse(status_code=403, text='{"error": {"message": "Missing permission"}}')

    monkeypatch.setattr(httpx, "post", mock_post)
    monkeypatch.setattr(httpx, "get", mock_get)
    monkeypatch.setattr(content_studio_social.time, "sleep", lambda _: None)

    with pytest.raises(HTTPException) as exc_info:
        content_studio_social.post_to_facebook("/static/out.mp4", "caption")

    assert exc_info.value.status_code == 504
    assert "Missing permission" in exc_info.value.detail


def test_post_to_facebook_surfaces_start_phase_error(monkeypatch):
    def mock_post(url, **kwargs):
        return MockResponse(status_code=400, text='{"error": {"message": "Invalid OAuth access token"}}')

    monkeypatch.setattr(httpx, "post", mock_post)

    with pytest.raises(HTTPException) as exc_info:
        content_studio_social.post_to_facebook("/static/out.mp4", "caption")

    assert exc_info.value.status_code == 400
    assert "Invalid OAuth access token" in exc_info.value.detail
