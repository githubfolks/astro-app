"""Tests for consultation review submission and the rating_avg recalculation
it drives on the astrologer's profile."""
from datetime import datetime, timedelta

from app import models
from tests.conftest import auth_headers


def _complete_consultation(db_session, seeker, astrologer, *, total_cost=100.0, duration_seconds=700):
    start = datetime.utcnow() - timedelta(minutes=10)
    c = models.Consultation(
        seeker_id=seeker.id,
        astrologer_id=astrologer.id,
        consultation_type=models.ConsultationType.CHAT,
        start_time=start,
        end_time=start + timedelta(seconds=duration_seconds),
        duration_seconds=duration_seconds,
        rate_per_min=10.0,
        total_cost=total_cost,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


def _review_body(consultation_id, rating, comment=None):
    return {"consultation_id": consultation_id, "rating": rating, "comment": comment}


def _rating_avg(db_session, astro):
    db_session.expire_all()
    profile = db_session.query(models.AstrologerProfile).filter(
        models.AstrologerProfile.user_id == astro.id
    ).first()
    return float(profile.rating_avg)


def test_review_requires_completed_consultation(client, make_user):
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER)

    # Still REQUESTED, not COMPLETED.
    created = client.post(
        "/consultations/", headers=auth_headers(seeker), json={"astrologer_id": astro.id, "consultation_type": "CHAT"}
    ).json()

    resp = client.post("/consultations/review", headers=auth_headers(seeker), json=_review_body(created["id"], 5))
    assert resp.status_code == 400


def test_seeker_can_review_completed_consultation(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _complete_consultation(db_session, seeker, astro)

    resp = client.post("/consultations/review", headers=auth_headers(seeker), json=_review_body(consultation.id, 4))
    assert resp.status_code == 200
    assert resp.json()["rating"] == 4

    assert _rating_avg(db_session, astro) == 4.0


def test_rating_avg_is_average_across_reviews(client, make_user, db_session):
    astro = make_user(models.UserRole.ASTROLOGER)
    seeker_a = make_user(models.UserRole.SEEKER, balance=100.0)
    seeker_b = make_user(models.UserRole.SEEKER, balance=100.0)

    c1 = _complete_consultation(db_session, seeker_a, astro)
    c2 = _complete_consultation(db_session, seeker_b, astro)

    client.post("/consultations/review", headers=auth_headers(seeker_a), json=_review_body(c1.id, 5))
    resp = client.post("/consultations/review", headers=auth_headers(seeker_b), json=_review_body(c2.id, 3))
    assert resp.status_code == 200

    assert _rating_avg(db_session, astro) == 4.0


def test_rating_out_of_range_rejected(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _complete_consultation(db_session, seeker, astro)

    too_low = client.post("/consultations/review", headers=auth_headers(seeker), json=_review_body(consultation.id, 0))
    assert too_low.status_code == 422

    too_high = client.post("/consultations/review", headers=auth_headers(seeker), json=_review_body(consultation.id, 6))
    assert too_high.status_code == 422

    # Rejected submissions must not have moved rating_avg off its default.
    assert _rating_avg(db_session, astro) == 0.0


def test_duplicate_review_rejected(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _complete_consultation(db_session, seeker, astro)

    first = client.post("/consultations/review", headers=auth_headers(seeker), json=_review_body(consultation.id, 5))
    assert first.status_code == 200

    second = client.post("/consultations/review", headers=auth_headers(seeker), json=_review_body(consultation.id, 1))
    assert second.status_code == 409

    # Second (rejected) submission must not have pulled the average down.
    assert _rating_avg(db_session, astro) == 5.0


def test_cannot_review_another_seekers_consultation(client, make_user, db_session):
    seeker_a = make_user(models.UserRole.SEEKER, balance=100.0)
    seeker_b = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _complete_consultation(db_session, seeker_a, astro)

    resp = client.post("/consultations/review", headers=auth_headers(seeker_b), json=_review_body(consultation.id, 5))
    assert resp.status_code == 403
