"""Tests for the consultation request flow: role checks, rate snapshotting,
concurrent-session blocking, and ownership isolation on reads."""
from app import models
from tests.conftest import auth_headers


def _request_body(astrologer_id, ctype="CHAT"):
    return {"astrologer_id": astrologer_id, "consultation_type": ctype}


def test_request_requires_auth(client, make_user):
    astro = make_user(models.UserRole.ASTROLOGER, fee=12.0)
    assert client.post("/consultations/", json=_request_body(astro.id)).status_code == 401


def test_seeker_can_request_consultation(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER, fee=12.0)

    resp = client.post("/consultations/", headers=auth_headers(seeker), json=_request_body(astro.id))
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "REQUESTED"
    assert body["astrologer_id"] == astro.id
    # Rate is snapshotted from the astrologer's current fee.
    assert float(body["rate_per_min"]) == 12.0


def test_astrologer_cannot_request_consultation(client, make_user):
    astro = make_user(models.UserRole.ASTROLOGER)
    other_astro = make_user(models.UserRole.ASTROLOGER)
    resp = client.post(
        "/consultations/", headers=auth_headers(astro), json=_request_body(other_astro.id)
    )
    assert resp.status_code == 400


def test_request_unknown_astrologer_returns_404(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post(
        "/consultations/", headers=auth_headers(seeker), json=_request_body(999999)
    )
    assert resp.status_code == 404


def test_concurrent_active_consultation_blocked(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)

    first = client.post("/consultations/", headers=auth_headers(seeker), json=_request_body(astro.id))
    assert first.status_code == 200
    # Second request while one is still REQUESTED must be rejected.
    second = client.post("/consultations/", headers=auth_headers(seeker), json=_request_body(astro.id))
    assert second.status_code == 409


def test_history_is_isolated_per_seeker(client, make_user):
    seeker_a = make_user(models.UserRole.SEEKER)
    seeker_b = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)

    client.post("/consultations/", headers=auth_headers(seeker_a), json=_request_body(astro.id))

    a_history = client.get("/consultations/history", headers=auth_headers(seeker_a))
    assert a_history.status_code == 200
    assert len(a_history.json()) == 1

    b_history = client.get("/consultations/history", headers=auth_headers(seeker_b))
    assert b_history.json() == []


def test_cannot_read_another_users_consultation(client, make_user):
    seeker_a = make_user(models.UserRole.SEEKER)
    seeker_b = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)

    created = client.post(
        "/consultations/", headers=auth_headers(seeker_a), json=_request_body(astro.id)
    ).json()

    # seeker_b must not be able to read seeker_a's consultation.
    resp = client.get(f"/consultations/{created['id']}", headers=auth_headers(seeker_b))
    assert resp.status_code in (403, 404)
