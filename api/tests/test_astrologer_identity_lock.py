"""An astrologer's legal name, nickname and profile photo are admin-only: the
astrologer's own PUT /astrologers/profile must reject them, while the admin
edit endpoint can still change them."""
import pytest

from app import models
from tests.conftest import auth_headers


def _profile(db_session, user):
    db_session.expire_all()
    return db_session.query(models.AstrologerProfile).filter_by(user_id=user.id).one()


def _lock_identity(db_session, astro):
    profile = _profile(db_session, astro)
    profile.full_name = "Original Name"
    profile.display_name = "Original Nick"
    profile.profile_picture_url = "/static/original.jpg"
    db_session.commit()


@pytest.mark.parametrize("field,value", [
    ("full_name", "Changed Name"),
    ("display_name", "Changed Nick"),
    ("profile_picture_url", "/static/astrologer_documents/changed.jpg"),
])
def test_astrologer_cannot_change_identity_fields(client, make_user, db_session, field, value):
    astro = make_user(models.UserRole.ASTROLOGER)
    _lock_identity(db_session, astro)

    resp = client.put("/astrologers/profile", json={field: value, "short_bio": "new bio"}, headers=auth_headers(astro))

    assert resp.status_code == 422
    assert "can only be changed by an admin" in resp.text
    profile = _profile(db_session, astro)
    assert profile.full_name == "Original Name"
    assert profile.display_name == "Original Nick"
    assert profile.profile_picture_url == "/static/original.jpg"
    # The whole request is rejected — no partial write of the other fields.
    assert profile.short_bio != "new bio"


def test_astrologer_can_still_edit_other_fields(client, make_user, db_session):
    astro = make_user(models.UserRole.ASTROLOGER)
    _lock_identity(db_session, astro)

    resp = client.put("/astrologers/profile", json={"short_bio": "new bio", "whatsapp_number": "9123456789"}, headers=auth_headers(astro))

    assert resp.status_code == 200
    profile = _profile(db_session, astro)
    assert profile.short_bio == "new bio"
    assert profile.whatsapp_number == "9123456789"
    assert profile.full_name == "Original Name"
    assert profile.display_name == "Original Nick"
    assert profile.profile_picture_url == "/static/original.jpg"
