"""Tests for the public trust-signal endpoints (/public/trust-stats, /public/reviews)
that power the homepage trust bar and testimonials."""
from datetime import datetime, timedelta

from app import models
from tests.conftest import auth_headers


def _approve(db_session, astro):
    profile = db_session.query(models.AstrologerProfile).filter(
        models.AstrologerProfile.user_id == astro.id
    ).first()
    profile.is_approved = True
    db_session.commit()


def _completed_consultation_with_review(db_session, seeker, astro, rating, comment):
    start = datetime.utcnow() - timedelta(minutes=10)
    c = models.Consultation(
        seeker_id=seeker.id,
        astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT,
        start_time=start,
        end_time=start + timedelta(seconds=600),
        duration_seconds=600,
        rate_per_min=10.0,
        total_cost=100.0,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)

    review = models.Review(
        consultation_id=c.id,
        astrologer_id=astro.id,
        seeker_id=seeker.id,
        rating=rating,
        comment=comment,
        display_status=models.ReviewDisplayStatus.APPROVED,
    )
    db_session.add(review)
    db_session.commit()
    return c, review


def test_trust_stats_only_counts_approved_astrologers(client, make_user, db_session):
    approved = make_user(models.UserRole.ASTROLOGER)
    make_user(models.UserRole.ASTROLOGER)  # left unapproved
    _approve(db_session, approved)

    resp = client.get("/public/trust-stats")
    assert resp.status_code == 200
    body = resp.json()
    assert body["verified_astrologers"] == 1


def test_trust_stats_reflect_real_reviews(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    _approve(db_session, astro)
    _completed_consultation_with_review(db_session, seeker, astro, 5, "Great reading!")

    resp = client.get("/public/trust-stats")
    body = resp.json()
    assert body["total_reviews"] == 1
    assert body["average_rating"] == 5.0


def test_public_reviews_excludes_low_rating_and_empty_comments(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, full_name="Jane Doe")
    astro = make_user(models.UserRole.ASTROLOGER)
    _approve(db_session, astro)

    _completed_consultation_with_review(db_session, seeker, astro, 5, "Loved it, very accurate.")
    _completed_consultation_with_review(db_session, seeker, astro, 2, "Not great")  # low rating, excluded
    _completed_consultation_with_review(db_session, seeker, astro, 5, None)  # no comment, excluded

    resp = client.get("/public/reviews")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["comment"] == "Loved it, very accurate."
    assert body[0]["seeker_display_name"] == "Jane D."


def test_public_reviews_filters_by_astrologer(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro_a = make_user(models.UserRole.ASTROLOGER)
    astro_b = make_user(models.UserRole.ASTROLOGER)
    _approve(db_session, astro_a)
    _approve(db_session, astro_b)

    _completed_consultation_with_review(db_session, seeker, astro_a, 5, "Great with astro A")
    _completed_consultation_with_review(db_session, seeker, astro_b, 5, "Great with astro B")

    resp = client.get(f"/public/reviews?astrologer_id={astro_a.id}")
    body = resp.json()
    assert len(body) == 1
    assert body[0]["comment"] == "Great with astro A"
