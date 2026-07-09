import pytest
from app import models
from tests.conftest import auth_headers
import os

@pytest.fixture
def admin_user(make_user):
    return make_user(role=models.UserRole.ADMIN)

def test_generate_social_post(client, admin_user, monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "fake-groq-key")

    mock_response_json = {
        "choices": [{
            "message": {
                "content": "Check out this amazing post about planetary transits! #Astrology #Vedic"
            }
        }]
    }

    class MockResponse:
        status_code = 200
        def json(self):
            return mock_response_json

    def mock_post(url, **kwargs):
        assert "api.groq.com" in url
        headers = kwargs.get("headers", {})
        assert headers.get("Authorization") == "Bearer fake-groq-key"
        return MockResponse()

    import httpx
    monkeypatch.setattr(httpx, "post", mock_post)

    response = client.post(
        "/cms/posts/generate-social",
        json={
            "title": "Vedic Astrological Transits Guide",
            "content": "<p>Vedic transits affect your daily life and career.</p>",
            "platform": "facebook"
        },
        headers=auth_headers(admin_user)
    )

    assert response.status_code == 200
    assert "text" in response.json()
    assert "#Astrology" in response.json()["text"]

def test_share_social_post_facebook(client, admin_user, db_session, monkeypatch):
    # Set settings
    from app.services import settings_service
    monkeypatch.setitem(settings_service._CACHE, "facebook_page_id", "my-fb-page")
    monkeypatch.setitem(settings_service._CACHE, "facebook_access_token", "my-fb-token")

    # Create post directly in db
    post = models.Post(
        title="Test Post",
        slug="test-post",
        content="Testing social sharing.",
        status=models.PostStatus.PUBLISHED,
        author_id=admin_user.id
    )
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)

    class MockResponse:
        status_code = 200
        def json(self):
            return {"id": "facebook_post_id"}

    def mock_post(url, **kwargs):
        assert "graph.facebook.com" in url
        assert "my-fb-page/feed" in url
        data = kwargs.get("data", {})
        assert data.get("message") == "Check out my new blog!"
        assert data.get("access_token") == "my-fb-token"
        return MockResponse()

    import httpx
    monkeypatch.setattr(httpx, "post", mock_post)

    response = client.post(
        f"/cms/posts/{post.id}/share-social",
        json={
            "platform": "facebook",
            "text": "Check out my new blog!"
        },
        headers=auth_headers(admin_user)
    )

    assert response.status_code == 200
    assert response.json()["status"] == "success"
    assert response.json()["facebook_response"]["id"] == "facebook_post_id"
