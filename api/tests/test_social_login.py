"""Tests for the shared Google/Facebook find-or-create logic (_social_login).

Calls the helper directly so provider token verification (a live call to
Google/Facebook) is out of scope; the endpoints only verify the token and
then delegate here.
"""
import pytest
from fastapi import HTTPException

from app import models
from app.routers.auth import _social_login


def test_first_social_login_creates_seeker_and_reports_new_user(db_session):
    result = _social_login(db_session, "google", "g-123", "new@example.com", "New Person")

    assert result["is_new_user"] is True
    user = db_session.query(models.User).filter(models.User.email == "new@example.com").one()
    assert user.role == models.UserRole.SEEKER
    assert user.is_verified is True
    assert db_session.query(models.UserWallet).filter(models.UserWallet.user_id == user.id).count() == 1
    assert user.seeker_profile.full_name == "New Person"


def test_repeat_social_login_is_not_new_user(db_session):
    first = _social_login(db_session, "google", "g-456", "repeat@example.com", "Repeat")
    second = _social_login(db_session, "google", "g-456", "repeat@example.com", "Repeat")

    assert first["is_new_user"] is True
    assert second["is_new_user"] is False
    assert second["user_id"] == first["user_id"]
    assert db_session.query(models.User).filter(models.User.email == "repeat@example.com").count() == 1


def test_linking_existing_email_account_is_not_new_user(db_session, make_user):
    existing = make_user(models.UserRole.SEEKER)

    result = _social_login(db_session, "facebook", "fb-789", existing.email, "Existing")

    assert result["is_new_user"] is False
    assert result["user_id"] == existing.id
    db_session.refresh(existing)
    assert existing.oauth_provider == "facebook"
    assert existing.oauth_id == "fb-789"


def test_social_login_without_email_rejected(db_session):
    with pytest.raises(HTTPException) as exc:
        _social_login(db_session, "facebook", "fb-000", None, "No Email")
    assert exc.value.status_code == 400
    assert db_session.query(models.User).filter(models.User.oauth_id == "fb-000").count() == 0
