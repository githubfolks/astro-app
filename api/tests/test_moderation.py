"""Tests for rule-based chat moderation: detection (services/moderation.py),
persistence/masking (chat.persist_and_moderate), and the admin review endpoints."""
from datetime import datetime, timedelta

from app import models
from app.services import moderation
from app.routers.chat import persist_and_moderate
from tests.conftest import auth_headers


# --- Detection (pure function, no DB) ---------------------------------------

def test_scan_clean_message_has_no_violations():
    violations, masked = moderation.scan("What does my kundli say about marriage?")
    assert violations == []
    assert masked == "What does my kundli say about marriage?"


def test_scan_detects_phone_number_and_masks_it():
    violations, masked = moderation.scan("call me on 9876543210 instead")
    assert "phone_number" in violations
    assert "9876543210" not in masked
    assert "****" in masked


def test_scan_detects_spelled_out_phone_number():
    violations, _ = moderation.scan("my number is nine eight seven six five four three two one zero")
    assert "phone_number" in violations


def test_scan_detects_email():
    violations, masked = moderation.scan("email me at seeker@example.com for details")
    assert "email" in violations
    assert "seeker@example.com" not in masked


def test_scan_detects_external_link():
    violations, masked = moderation.scan("check this out https://example-astro-chat.com/join")
    assert "external_link" in violations
    assert "https://example-astro-chat.com/join" not in masked


def test_scan_detects_contact_app_intent():
    violations, _ = moderation.scan("let's continue this on whatsapp")
    assert "contact_intent" in violations


def test_scan_ignores_short_numbers_like_dates():
    # Fewer than 7 digits shouldn't be treated as a phone number (dates, ages, etc.)
    violations, masked = moderation.scan("I was born in 1995")
    assert "phone_number" not in violations
    assert masked == "I was born in 1995"


# --- Persistence + masking ---------------------------------------------------

def _make_consultation(db_session, seeker, astro):
    c = models.Consultation(
        seeker_id=seeker.id,
        astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT,
        rate_per_min=10.0,
        status=models.ConsultationStatus.ACTIVE,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


def test_persist_and_moderate_flags_and_masks_contact_info(db_session, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _make_consultation(db_session, seeker, astro)

    new_msg, broadcast_content = persist_and_moderate(
        db_session, consultation, seeker.id, "here is 9876543210 for later"
    )

    assert new_msg.is_flagged is True
    assert new_msg.flag_reason == "phone_number"
    # Unmasked original is retained in the DB for admin review...
    assert new_msg.message == "here is 9876543210 for later"
    # ...but never delivered to the other participant.
    assert "9876543210" not in broadcast_content

    flag = db_session.query(models.ModerationFlag).filter(
        models.ModerationFlag.message_id == new_msg.id
    ).first()
    assert flag is not None
    assert flag.flagged_user_id == seeker.id
    assert flag.reason == "phone_number"
    assert flag.snippet == "here is 9876543210 for later"
    assert flag.status == models.ModerationFlagStatus.OPEN


def test_persist_and_moderate_clean_message_creates_no_flag(db_session, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _make_consultation(db_session, seeker, astro)

    new_msg, broadcast_content = persist_and_moderate(
        db_session, consultation, seeker.id, "What career path suits me?"
    )

    assert new_msg.is_flagged is False
    assert new_msg.flag_reason is None
    assert broadcast_content == "What career path suits me?"
    assert db_session.query(models.ModerationFlag).filter(
        models.ModerationFlag.message_id == new_msg.id
    ).first() is None


# --- Admin review endpoints ---------------------------------------------------

def test_non_admin_cannot_list_moderation_flags(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.get("/admin/moderation-flags", headers=auth_headers(seeker))
    assert resp.status_code == 403


def test_admin_can_list_and_resolve_moderation_flags(client, db_session, make_user):
    admin = make_user(models.UserRole.ADMIN)
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = _make_consultation(db_session, seeker, astro)
    new_msg, _ = persist_and_moderate(db_session, consultation, seeker.id, "email me at x@example.com")

    listed = client.get("/admin/moderation-flags", headers=auth_headers(admin))
    assert listed.status_code == 200
    body = listed.json()
    assert body["total"] == 1
    flag_id = body["flags"][0]["id"]
    assert body["flags"][0]["reason"] == "email"

    resolved = client.post(
        f"/admin/moderation-flags/{flag_id}/resolve", headers=auth_headers(admin), params={"status": "REVIEWED"}
    )
    assert resolved.status_code == 200
    assert resolved.json()["new_status"] == "REVIEWED"

    db_session.expire_all()
    flag = db_session.query(models.ModerationFlag).filter(models.ModerationFlag.id == flag_id).first()
    assert flag.status == models.ModerationFlagStatus.REVIEWED
