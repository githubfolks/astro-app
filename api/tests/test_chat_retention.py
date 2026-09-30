"""Chat retention purge: messages of consultations that ended more than
chat_retention_years ago are deleted (with image attachments); recent,
still-running and disputed consultations are untouched; the cron endpoint
refuses to run without a configured secret."""
import os
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pytest

from app import models
from app.services import retention_service


def _consultation(db, make_user, ended_days_ago):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    end = datetime.now(timezone.utc) - timedelta(days=ended_days_ago) if ended_days_ago is not None else None
    c = models.Consultation(seeker_id=seeker.id, astrologer_id=astro.id, consultation_type=models.ConsultationType.CHAT,
                            rate_per_min=Decimal("10"), status=models.ConsultationStatus.COMPLETED, end_time=end,
                            total_cost=Decimal("30"))
    db.add(c)
    db.commit()
    db.add(models.ChatMessage(consultation_id=c.id, sender_id=seeker.id, message="hi"))
    db.commit()
    return c


def _messages(db, c):
    return db.query(models.ChatMessage).filter_by(consultation_id=c.id).count()


def test_purges_only_consultations_past_retention(db_session, make_user):
    old = _consultation(db_session, make_user, 3 * 365 + 1)
    recent = _consultation(db_session, make_user, 3 * 365 - 1)
    running = _consultation(db_session, make_user, None)

    result = retention_service.purge_expired_chat_messages(db_session)

    assert result["messages_deleted"] == 1
    assert _messages(db_session, old) == 0
    assert _messages(db_session, recent) == 1
    assert _messages(db_session, running) == 1
    assert db_session.get(models.Consultation, old.id) is not None  # billing record kept
    assert db_session.query(models.AuditLog).filter_by(action="CHAT_RETENTION_PURGE").count() == 1


def test_skips_consultation_with_open_dispute(db_session, make_user):
    c = _consultation(db_session, make_user, 4 * 365)
    db_session.add(models.Dispute(consultation_id=c.id, raised_by_id=c.seeker_id, reason="x"))
    db_session.commit()
    retention_service.purge_expired_chat_messages(db_session)
    assert _messages(db_session, c) == 1


def test_clears_moderation_snippet_and_removes_attachment(db_session, make_user, tmp_path, monkeypatch):
    monkeypatch.setattr(retention_service, "CHAT_ATTACHMENT_DIR", str(tmp_path))
    (tmp_path / "img.jpg").write_bytes(b"x")
    c = _consultation(db_session, make_user, 4 * 365)
    msg = models.ChatMessage(consultation_id=c.id, sender_id=c.seeker_id, message_type="image",
                             media_url="/static/chat_attachments/img.jpg")
    db_session.add(msg)
    db_session.commit()
    db_session.add(models.ModerationFlag(consultation_id=c.id, message_id=msg.id, flagged_user_id=c.seeker_id,
                                         reason="phone_number", snippet="call 98..."))
    db_session.commit()

    retention_service.purge_expired_chat_messages(db_session)

    flag = db_session.query(models.ModerationFlag).one()
    assert flag.snippet is None and flag.message_id is None
    assert not (tmp_path / "img.jpg").exists()


@pytest.mark.parametrize("value", ["", "0", "abc"])
def test_invalid_retention_setting_never_purges(db_session, make_user, monkeypatch, value):
    monkeypatch.setattr(retention_service, "get_setting", lambda key, default=None: value)
    c = _consultation(db_session, make_user, 10 * 365)
    with pytest.raises(retention_service.RetentionConfigError):
        retention_service.purge_expired_chat_messages(db_session)
    assert _messages(db_session, c) == 1


def test_cron_endpoint_refuses_without_secret_configured(client, monkeypatch):
    monkeypatch.delenv("CRON_SECRET", raising=False)
    assert client.post("/cron/retention/purge-chat-messages").status_code == 503


def test_cron_endpoint_rejects_wrong_secret_and_runs_with_right_one(client, monkeypatch):
    monkeypatch.setenv("CRON_SECRET", "s3cret")
    assert client.post("/cron/retention/purge-chat-messages", headers={"X-Cron-Secret": "nope"}).status_code == 401
    resp = client.post("/cron/retention/purge-chat-messages", headers={"X-Cron-Secret": "s3cret"})
    assert resp.status_code == 200
    assert resp.json()["retention_years"] == 3
