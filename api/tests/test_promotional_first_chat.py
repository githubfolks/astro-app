"""Tests for the first-chat promotional rate: a seeker's very first-ever
consultation is billed at a flat rate for the first 5 minutes instead of the
astrologer's normal per-minute fee (see consultations.py request_consultation
and chat.py's _effective_rate_per_min/billing_loop)."""
from app import models
from app.routers.chat import _effective_rate_per_min, PROMO_WINDOW_SECONDS
from tests.conftest import auth_headers


def test_first_consultation_is_marked_promotional(client, make_user):
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER, fee=20.0)

    resp = client.post(
        "/consultations/", headers=auth_headers(seeker),
        json={"astrologer_id": astro.id, "consultation_type": "CHAT"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["is_promotional_first_chat"] is True
    assert float(body["promotional_rate_total"]) == 49.0  # DEFAULTS["promo_first_chat_amount"]


def test_second_consultation_is_not_promotional(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER, fee=20.0)

    first = client.post(
        "/consultations/", headers=auth_headers(seeker),
        json={"astrologer_id": astro.id, "consultation_type": "CHAT"}
    ).json()
    # First consultation must be terminal before a second can be requested.
    c = db_session.query(models.Consultation).filter(models.Consultation.id == first["id"]).first()
    c.status = models.ConsultationStatus.COMPLETED
    db_session.commit()

    second = client.post(
        "/consultations/", headers=auth_headers(seeker),
        json={"astrologer_id": astro.id, "consultation_type": "CHAT"}
    )
    assert second.status_code == 200
    body = second.json()
    assert body["is_promotional_first_chat"] is False
    assert body["promotional_rate_total"] is None


def test_request_succeeds_with_balance_only_covering_promotional_rate(client, make_user):
    # Astrologer's normal per-minute fee is high, but the seeker only needs
    # enough for the flat promo rate (49 / 5 = 9.8 per min) to start their first chat.
    seeker = make_user(models.UserRole.SEEKER, balance=10.0)
    astro = make_user(models.UserRole.ASTROLOGER, fee=50.0)

    resp = client.post(
        "/consultations/", headers=auth_headers(seeker),
        json={"astrologer_id": astro.id, "consultation_type": "CHAT"}
    )
    assert resp.status_code == 200


def test_request_blocked_when_balance_below_normal_rate_on_second_chat(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=10.0)
    astro = make_user(models.UserRole.ASTROLOGER, fee=50.0)

    first = client.post(
        "/consultations/", headers=auth_headers(seeker),
        json={"astrologer_id": astro.id, "consultation_type": "CHAT"}
    ).json()
    c = db_session.query(models.Consultation).filter(models.Consultation.id == first["id"]).first()
    c.status = models.ConsultationStatus.COMPLETED
    db_session.commit()

    # Same low balance is no longer enough once the promotional discount is gone.
    second = client.post(
        "/consultations/", headers=auth_headers(seeker),
        json={"astrologer_id": astro.id, "consultation_type": "CHAT"}
    )
    assert second.status_code == 400


def test_effective_rate_within_promo_window_uses_flat_promotional_rate():
    consultation = models.Consultation(promotional_rate_total=49.0, duration_seconds=120)
    rate = _effective_rate_per_min(consultation, base_rate=20.0)
    assert rate == 49.0 / (PROMO_WINDOW_SECONDS / 60)


def test_effective_rate_after_promo_window_reverts_to_base_rate():
    consultation = models.Consultation(promotional_rate_total=49.0, duration_seconds=PROMO_WINDOW_SECONDS + 1)
    rate = _effective_rate_per_min(consultation, base_rate=20.0)
    assert rate == 20.0


def test_effective_rate_for_non_promotional_consultation_is_base_rate():
    consultation = models.Consultation(promotional_rate_total=None, duration_seconds=60)
    rate = _effective_rate_per_min(consultation, base_rate=20.0)
    assert rate == 20.0
