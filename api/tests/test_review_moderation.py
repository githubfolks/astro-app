"""Tests for review display moderation: a submitted review's written comment is
auto-scanned (same rule-based scan as chat messages) and only auto-approved for
public display (homepage/profile testimonials) when it's clean. Flagged
comments stay PENDING until an admin approves/rejects them via /admin/reviews."""
from datetime import datetime, timedelta

from app import models
from tests.conftest import auth_headers


def _complete_consultation(db_session, seeker, astro):
    start = datetime.utcnow() - timedelta(minutes=10)
    c = models.Consultation(
        seeker_id=seeker.id,
        astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT,
        start_time=start,
        end_time=start + timedelta(seconds=700),
        duration_seconds=700,
        rate_per_min=10.0,
        total_cost=100.0,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


def test_clean_review_is_auto_approved_and_publicly_visible(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _complete_consultation(db_session, seeker, astro)

    resp = client.post(
        "/consultations/review", headers=auth_headers(seeker),
        json={"consultation_id": consultation.id, "rating": 5, "comment": "Wonderful, accurate reading!"}
    )
    assert resp.status_code == 200
    review_id = resp.json()["id"]

    db_session.expire_all()
    review = db_session.query(models.Review).filter(models.Review.id == review_id).first()
    assert review.display_status == models.ReviewDisplayStatus.APPROVED
    assert review.moderation_reason is None

    public = client.get("/public/reviews").json()
    assert any(r["comment"] == "Wonderful, accurate reading!" for r in public)


def test_review_with_contact_info_is_pending_and_hidden_from_public(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _complete_consultation(db_session, seeker, astro)

    resp = client.post(
        "/consultations/review", headers=auth_headers(seeker),
        json={"consultation_id": consultation.id, "rating": 5, "comment": "Great reading, reach me at 9876543210"}
    )
    assert resp.status_code == 200
    review_id = resp.json()["id"]

    db_session.expire_all()
    review = db_session.query(models.Review).filter(models.Review.id == review_id).first()
    assert review.display_status == models.ReviewDisplayStatus.PENDING
    assert review.moderation_reason == "phone_number"

    public = client.get("/public/reviews").json()
    assert not any("9876543210" in r["comment"] for r in public)


def test_admin_can_approve_a_pending_review(client, make_user, db_session):
    admin = make_user(models.UserRole.ADMIN)
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _complete_consultation(db_session, seeker, astro)

    submit = client.post(
        "/consultations/review", headers=auth_headers(seeker),
        json={"consultation_id": consultation.id, "rating": 5, "comment": "call me on 9876543210 to discuss more"}
    )
    review_id = submit.json()["id"]

    listed = client.get("/admin/reviews", headers=auth_headers(admin), params={"status": "PENDING"})
    assert listed.status_code == 200
    assert any(r["id"] == review_id for r in listed.json()["reviews"])

    approved = client.post(f"/admin/reviews/{review_id}/approve", headers=auth_headers(admin))
    assert approved.status_code == 200
    assert approved.json()["new_status"] == "APPROVED"

    public = client.get("/public/reviews").json()
    assert any(r["comment"] == "call me on 9876543210 to discuss more" for r in public)


def test_admin_can_reject_a_pending_review(client, make_user, db_session):
    admin = make_user(models.UserRole.ADMIN)
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _complete_consultation(db_session, seeker, astro)

    submit = client.post(
        "/consultations/review", headers=auth_headers(seeker),
        json={"consultation_id": consultation.id, "rating": 5, "comment": "email me at seeker@example.com"}
    )
    review_id = submit.json()["id"]

    rejected = client.post(f"/admin/reviews/{review_id}/reject", headers=auth_headers(admin))
    assert rejected.status_code == 200
    assert rejected.json()["new_status"] == "REJECTED"

    public = client.get("/public/reviews").json()
    assert not any(r["comment"] == "email me at seeker@example.com" for r in public)


def test_non_admin_cannot_access_review_moderation_endpoints(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    assert client.get("/admin/reviews", headers=auth_headers(seeker)).status_code == 403
    assert client.post("/admin/reviews/1/approve", headers=auth_headers(seeker)).status_code == 403
