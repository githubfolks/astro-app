"""Batch-name uniqueness and class-session validation for the /edu endpoints."""
from app import models, models_edu

from tests.conftest import auth_headers


def _course(db_session, teacher):
    course = models_edu.Course(title="Vedic Basics", teacher_id=teacher.id, price=0)
    db_session.add(course)
    db_session.commit()
    db_session.refresh(course)
    return course


def _batch(client, headers, course_id, name):
    return client.post("/edu/batches", json={"course_id": course_id, "name": name}, headers=headers)


def _session_payload(batch_id, **overrides):
    payload = {
        "batch_id": batch_id,
        "title": "Introduction to 9 Grahas",
        "miro_room_id": f"room-{batch_id}-1",
        "scheduled_start": "2026-10-01T10:00:00Z",
        "scheduled_end": "2026-10-01T11:30:00Z",
    }
    payload.update(overrides)
    return payload


def test_duplicate_batch_name_rejected_case_and_whitespace_insensitive(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    headers = auth_headers(tutor)
    course = _course(db_session, tutor)

    assert _batch(client, headers, course.id, "Batch 1").status_code == 200
    for name in ("Batch 1", "batch 1", "  BATCH 1  "):
        resp = _batch(client, headers, course.id, name)
        assert resp.status_code == 409, name
    assert db_session.query(models_edu.Batch).filter_by(course_id=course.id).count() == 1


def test_same_batch_name_allowed_in_different_courses(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    headers = auth_headers(tutor)
    course_a = _course(db_session, tutor)
    course_b = _course(db_session, tutor)

    assert _batch(client, headers, course_a.id, "Batch 1").status_code == 200
    assert _batch(client, headers, course_b.id, "Batch 1").status_code == 200


def test_blank_batch_name_rejected(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    course = _course(db_session, tutor)
    assert _batch(client, auth_headers(tutor), course.id, "   ").status_code == 422


def test_session_requires_topic_and_end_after_start(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    headers = auth_headers(tutor)
    course = _course(db_session, tutor)
    batch_id = _batch(client, headers, course.id, "Batch 1").json()["id"]

    assert client.post("/edu/sessions", json=_session_payload(batch_id, title="  "), headers=headers).status_code == 422
    # End before start (the 23:00 -> 11:30 AM/PM mix-up)
    bad = _session_payload(batch_id, scheduled_start="2026-09-25T23:00:00+05:30", scheduled_end="2026-09-25T11:30:00+05:30")
    assert client.post("/edu/sessions", json=bad, headers=headers).status_code == 422
    equal = _session_payload(batch_id, scheduled_end="2026-10-01T10:00:00Z")
    assert client.post("/edu/sessions", json=equal, headers=headers).status_code == 422

    ok = client.post("/edu/sessions", json=_session_payload(batch_id), headers=headers)
    assert ok.status_code == 200
    assert ok.json()["title"] == "Introduction to 9 Grahas"


def test_session_update_rejects_end_before_start(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    headers = auth_headers(tutor)
    course = _course(db_session, tutor)
    batch_id = _batch(client, headers, course.id, "Batch 1").json()["id"]
    session_id = client.post("/edu/sessions", json=_session_payload(batch_id), headers=headers).json()["id"]

    # Only end moved, to before the stored start
    resp = client.put(f"/edu/sessions/{session_id}", json={"scheduled_end": "2026-10-01T09:00:00Z"}, headers=headers)
    assert resp.status_code == 422
    assert client.put(f"/edu/sessions/{session_id}", json={"title": ""}, headers=headers).status_code == 422

    resp = client.put(f"/edu/sessions/{session_id}", json={"scheduled_end": "2026-10-01T12:00:00Z"}, headers=headers)
    assert resp.status_code == 200


def _batch_with_session(client, db_session, tutor):
    headers = auth_headers(tutor)
    course = _course(db_session, tutor)
    batch_id = _batch(client, headers, course.id, "Batch 1").json()["id"]
    session_id = client.post("/edu/sessions", json=_session_payload(batch_id), headers=headers).json()["id"]
    return batch_id, session_id


def test_owner_can_delete_session_and_it_is_audited(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    _, session_id = _batch_with_session(client, db_session, tutor)

    resp = client.delete(f"/edu/sessions/{session_id}", headers=auth_headers(tutor))
    assert resp.status_code == 200
    assert db_session.query(models_edu.ClassSession).filter_by(id=session_id).first() is None
    assert db_session.query(models.AuditLog).filter_by(action="CLASS_SESSION_DELETED", resource_id=str(session_id)).count() == 1


def test_owner_can_delete_empty_batch_with_its_sessions(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    batch_id, session_id = _batch_with_session(client, db_session, tutor)

    resp = client.delete(f"/edu/batches/{batch_id}", headers=auth_headers(tutor))
    assert resp.status_code == 200
    assert db_session.query(models_edu.Batch).filter_by(id=batch_id).first() is None
    assert db_session.query(models_edu.ClassSession).filter_by(id=session_id).first() is None


def test_batch_with_enrolled_students_cannot_be_deleted(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER)
    batch_id, _ = _batch_with_session(client, db_session, tutor)
    db_session.add(models_edu.BatchEnrollment(user_id=student.id, batch_id=batch_id))
    db_session.commit()

    resp = client.delete(f"/edu/batches/{batch_id}", headers=auth_headers(tutor))
    assert resp.status_code == 409
    assert db_session.query(models_edu.Batch).filter_by(id=batch_id).first() is not None


def test_session_with_attendance_cannot_be_deleted(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER)
    batch_id, session_id = _batch_with_session(client, db_session, tutor)
    db_session.add(models_edu.Attendance(session_id=session_id, user_id=student.id))
    db_session.commit()

    headers = auth_headers(tutor)
    assert client.delete(f"/edu/sessions/{session_id}", headers=headers).status_code == 409
    assert client.delete(f"/edu/batches/{batch_id}", headers=headers).status_code == 409
    assert db_session.query(models_edu.ClassSession).filter_by(id=session_id).first() is not None


def test_other_tutor_and_seeker_cannot_delete(client, db_session, make_user):
    owner = make_user(models.UserRole.TUTOR)
    other_tutor = make_user(models.UserRole.TUTOR)
    seeker = make_user(models.UserRole.SEEKER)
    batch_id, session_id = _batch_with_session(client, db_session, owner)

    for user in (other_tutor, seeker):
        headers = auth_headers(user)
        assert client.delete(f"/edu/sessions/{session_id}", headers=headers).status_code == 403
        assert client.delete(f"/edu/batches/{batch_id}", headers=headers).status_code == 403
    assert client.delete("/edu/batches/99999", headers=auth_headers(owner)).status_code == 404


def test_admin_can_delete_any_batch(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    admin = make_user(models.UserRole.ADMIN)
    batch_id, _ = _batch_with_session(client, db_session, tutor)

    assert client.delete(f"/edu/batches/{batch_id}", headers=auth_headers(admin)).status_code == 200
