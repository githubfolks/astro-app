"""Classroom tokens, server-generated room ids, and the MiroTalk attendance webhook."""
from datetime import datetime, timedelta, timezone
from urllib.parse import parse_qs, urlparse

import pytest
from jose import jwt

from app import models, models_edu
from app.services import miro_service

from tests.conftest import auth_headers


@pytest.fixture(autouse=True)
def _no_webhook_secret(monkeypatch):
    # database.py loads .env.development when present, which may set this; the
    # Docker deployment leaves it unset (MiroTalk calls the API directly).
    monkeypatch.delenv("MIROTALK_WEBHOOK_SECRET", raising=False)


def _live_session(db_session, teacher, room_id="aadikarta-test-room"):
    course = models_edu.Course(title="Vedic Basics", teacher_id=teacher.id, price=0)
    db_session.add(course)
    db_session.flush()
    batch = models_edu.Batch(course_id=course.id, name="Batch 1")
    db_session.add(batch)
    db_session.flush()
    now = datetime.now(timezone.utc)
    session = models_edu.ClassSession(
        batch_id=batch.id,
        title="Introduction to 9 Grahas",
        miro_room_id=room_id,
        scheduled_start=now - timedelta(minutes=1),
        scheduled_end=now + timedelta(minutes=90),
    )
    db_session.add(session)
    db_session.commit()
    return session, batch


def _enroll(db_session, student, batch):
    db_session.add(models_edu.BatchEnrollment(user_id=student.id, batch_id=batch.id))
    db_session.commit()


def _join(client, user, session_id):
    resp = client.get(f"/edu/sessions/{session_id}/join", headers=auth_headers(user))
    assert resp.status_code == 200, resp.text
    return resp.json()


# --- Tokens ---------------------------------------------------------------

def test_tutor_token_is_presenter_with_service_account_and_identity(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    s, _ = _live_session(db_session, tutor)

    data = _join(client, tutor, s.id)
    payload = miro_service.decode_miro_token(data["token"])
    assert payload["username"] == miro_service.MIROTALK_PEER_USERNAME
    assert payload["password"] == miro_service.MIROTALK_PEER_PASSWORD
    assert payload["presenter"] == "true"
    assert payload["uid"] == str(tutor.id)
    assert payload["room"] == s.miro_room_id

    # The URL carries the same token and the session's room.
    q = parse_qs(urlparse(data["room_url"]).query)
    assert q["token"] == [data["token"]]
    assert q["room"] == [s.miro_room_id]


def test_student_token_is_not_presenter(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER)
    s, batch = _live_session(db_session, tutor)
    _enroll(db_session, student, batch)

    payload = miro_service.decode_miro_token(_join(client, student, s.id)["token"])
    assert payload["presenter"] == "false"
    assert payload["uid"] == str(student.id)


def test_token_stays_valid_until_after_scheduled_end(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    s, _ = _live_session(db_session, tutor)

    claims = jwt.get_unverified_claims(_join(client, tutor, s.id)["token"])
    # Session ends in ~90 min; token must outlive it (end + 30 min), not the old fixed 2h.
    expires_in = claims["exp"] - datetime.now(timezone.utc).timestamp()
    assert 115 * 60 < expires_in < 125 * 60


# --- Join URL -------------------------------------------------------------

def test_room_url_is_the_configured_https_origin(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    s, _ = _live_session(db_session, tutor)

    url = urlparse(_join(client, tutor, s.id)["room_url"])
    # MiroTalk's client redirects http -> https, breaking the iframe's camera/mic grant.
    assert f"{url.scheme}://{url.netloc}" == miro_service.MIROTALK_URL
    assert url.scheme == "https"
    assert url.path == "/join/"


@pytest.mark.parametrize("configured", ["", "http://localhost:4020"])
def test_join_fails_explicitly_when_mirotalk_url_is_not_https(client, db_session, make_user, monkeypatch, configured):
    monkeypatch.setattr(miro_service, "MIROTALK_URL", configured)
    tutor = make_user(models.UserRole.TUTOR)
    s, _ = _live_session(db_session, tutor)

    resp = client.get(f"/edu/sessions/{s.id}/join", headers=auth_headers(tutor))
    assert resp.status_code == 503
    assert "room_url" not in resp.json()


# --- Room ids ---------------------------------------------------------------

def test_room_id_is_generated_server_side_and_ignores_client_value(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    headers = auth_headers(tutor)
    course = models_edu.Course(title="Vedic Basics", teacher_id=tutor.id, price=0)
    db_session.add(course)
    db_session.commit()
    batch_id = client.post("/edu/batches", json={"course_id": course.id, "name": "Batch 1"}, headers=headers).json()["id"]

    body = {
        "batch_id": batch_id,
        "title": "Topic",
        "scheduled_start": "2026-10-01T10:00:00Z",
        "scheduled_end": "2026-10-01T11:00:00Z",
    }
    a = client.post("/edu/sessions", json={**body, "miro_room_id": "room-1-123"}, headers=headers)
    b = client.post("/edu/sessions", json=body, headers=headers)
    assert a.status_code == 200 and b.status_code == 200
    room_a, room_b = a.json()["miro_room_id"], b.json()["miro_room_id"]
    assert room_a != "room-1-123"
    assert room_a.startswith("aadikarta-") and len(room_a) >= 30
    assert room_a != room_b


# --- Webhook ----------------------------------------------------------------

def _post(client, event, room_id, token, key="peer_info"):
    peer = {"peer_name": "x", "peer_token": token} if token is not None else {"peer_name": "x"}
    return client.post("/edu/webhooks/mirotalk", json={"event": event, "data": {"room_id": room_id, key: peer}})


def _attendance(db_session, session_id):
    db_session.expire_all()
    return db_session.query(models_edu.Attendance).filter_by(session_id=session_id).all()


def test_join_then_exit_records_attendance(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER)
    s, batch = _live_session(db_session, tutor)
    _enroll(db_session, student, batch)
    token = _join(client, student, s.id)["token"]

    assert _post(client, "join", s.miro_room_id, token).json() == {"status": "ok"}
    # Duplicate join (reconnect) must not open a second record.
    _post(client, "join", s.miro_room_id, token)
    rows = _attendance(db_session, s.id)
    assert len(rows) == 1 and rows[0].user_id == student.id and rows[0].left_at is None

    # MiroTalk sends exit/disconnect with the peer under "peer", not "peer_info".
    assert _post(client, "exit", s.miro_room_id, token, key="peer").json() == {"status": "ok"}
    rows = _attendance(db_session, s.id)
    assert rows[0].left_at is not None


def test_disconnect_closes_attendance(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    s, _ = _live_session(db_session, tutor)
    token = _join(client, tutor, s.id)["token"]

    _post(client, "join", s.miro_room_id, token)
    _post(client, "disconnect", s.miro_room_id, token, key="peer")
    assert _attendance(db_session, s.id)[0].left_at is not None


def test_exit_after_token_expiry_still_closes_attendance(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    s, _ = _live_session(db_session, tutor)
    expired = miro_service.generate_miro_token(tutor.id, "Tutor", s.miro_room_id, "moderator", expires_delta=timedelta(seconds=-1))
    db_session.add(models_edu.Attendance(session_id=s.id, user_id=tutor.id, joined_at=datetime.now(timezone.utc)))
    db_session.commit()

    _post(client, "exit", s.miro_room_id, expired, key="peer")
    assert _attendance(db_session, s.id)[0].left_at is not None


def test_webhook_ignores_missing_forged_or_wrong_room_tokens(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    s, _ = _live_session(db_session, tutor, room_id="aadikarta-room-a")
    other, _ = _live_session(db_session, tutor, room_id="aadikarta-room-b")
    token_for_b = _join(client, tutor, other.id)["token"]
    forged = jwt.encode({"data": "x"}, "not-the-real-secret", algorithm="HS256")

    for token in (None, forged, token_for_b):
        assert _post(client, "join", s.miro_room_id, token).json() == {"status": "ignored"}
    assert _attendance(db_session, s.id) == []


def test_webhook_accepts_server_to_server_call_without_csrf(client, db_session, make_user):
    # MiroTalk posts with no cookies, no CSRF header and no bearer token.
    from fastapi.testclient import TestClient
    from app.main import app

    tutor = make_user(models.UserRole.TUTOR)
    s, _ = _live_session(db_session, tutor)
    token = _join(client, tutor, s.id)["token"]

    raw = TestClient(app, base_url="http://api:8000")
    resp = raw.post("/edu/webhooks/mirotalk", json={"event": "join", "data": {"room_id": s.miro_room_id, "peer_info": {"peer_token": token}}})
    assert resp.status_code == 200, resp.text
    assert len(_attendance(db_session, s.id)) == 1


def test_webhook_rejects_malformed_body(client):
    resp = client.post(
        "/edu/webhooks/mirotalk",
        content=b"not json",
        headers={"Content-Type": "application/json"},
    )
    assert resp.status_code == 400


def test_webhook_secret_header_enforced_when_configured(client, db_session, make_user, monkeypatch):
    tutor = make_user(models.UserRole.TUTOR)
    s, _ = _live_session(db_session, tutor)
    token = _join(client, tutor, s.id)["token"]
    monkeypatch.setenv("MIROTALK_WEBHOOK_SECRET", "proxy-injected-secret")

    assert _post(client, "join", s.miro_room_id, token).status_code == 401
    resp = client.post(
        "/edu/webhooks/mirotalk",
        json={"event": "join", "data": {"room_id": s.miro_room_id, "peer_info": {"peer_token": token}}},
        headers={"X-MiroTalk-Secret": "proxy-injected-secret"},
    )
    assert resp.json() == {"status": "ok"}
