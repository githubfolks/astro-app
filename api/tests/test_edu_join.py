"""Join-window checks for /edu/sessions/{id}/join."""
from datetime import datetime, timedelta, timezone

from app import models, models_edu
from app.routers.edu import _as_utc

from tests.conftest import auth_headers

IST = timezone(timedelta(hours=5, minutes=30))


def _session(db_session, teacher, start, end, is_active=True):
    course = models_edu.Course(title="Vedic Basics", teacher_id=teacher.id, price=0)
    db_session.add(course)
    db_session.flush()
    batch = models_edu.Batch(course_id=course.id, name="Batch 1")
    db_session.add(batch)
    db_session.flush()
    session = models_edu.ClassSession(
        batch_id=batch.id,
        title="Introduction to 9 Grahas",
        miro_room_id=f"room-{batch.id}-{start.timestamp()}",
        scheduled_start=start,
        scheduled_end=end,
        is_active=is_active,
    )
    db_session.add(session)
    db_session.commit()
    return session


def test_as_utc_converts_offset_aware_values_instead_of_dropping_offset():
    # 17:00 IST is 11:30 UTC — the old code treated it as 17:00 UTC.
    assert _as_utc(datetime(2026, 9, 25, 17, 0, tzinfo=IST)) == datetime(2026, 9, 25, 11, 30, tzinfo=timezone.utc)
    assert _as_utc(datetime(2026, 9, 25, 11, 30)) == datetime(2026, 9, 25, 11, 30, tzinfo=timezone.utc)


def test_tutor_can_join_live_session(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    now = datetime.now(timezone.utc)
    s = _session(db_session, tutor, now - timedelta(minutes=1), now + timedelta(minutes=30))

    resp = client.get(f"/edu/sessions/{s.id}/join", headers=auth_headers(tutor))
    assert resp.status_code == 200, resp.text
    assert resp.json()["role"] == "moderator"


def test_join_opens_ten_minutes_before_start(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    now = datetime.now(timezone.utc)
    early_ok = _session(db_session, tutor, now + timedelta(minutes=9), now + timedelta(minutes=60))
    too_early = _session(db_session, tutor, now + timedelta(minutes=11), now + timedelta(minutes=60))

    headers = auth_headers(tutor)
    assert client.get(f"/edu/sessions/{early_ok.id}/join", headers=headers).status_code == 200
    resp = client.get(f"/edu/sessions/{too_early.id}/join", headers=headers)
    assert resp.status_code == 400
    assert "not started" in resp.json()["detail"]


def test_cannot_join_ended_or_inactive_session(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    now = datetime.now(timezone.utc)
    ended = _session(db_session, tutor, now - timedelta(hours=2), now - timedelta(minutes=1))
    inactive = _session(db_session, tutor, now - timedelta(minutes=1), now + timedelta(minutes=30), is_active=False)

    headers = auth_headers(tutor)
    resp = client.get(f"/edu/sessions/{ended.id}/join", headers=headers)
    assert resp.status_code == 400 and "ended" in resp.json()["detail"]
    resp = client.get(f"/edu/sessions/{inactive.id}/join", headers=headers)
    assert resp.status_code == 400 and "not active" in resp.json()["detail"]
