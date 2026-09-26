"""Public course catalogue privacy, student course list scoping, and enrollment rules."""
import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from app import models, models_edu

from tests.conftest import auth_headers


def _course(db_session, teacher, price=0, is_active=True):
    course = models_edu.Course(title="Vedic Basics", teacher_id=teacher.id, price=price, is_active=is_active)
    db_session.add(course)
    db_session.commit()
    return course


def _batch(db_session, course, name="Batch A", max_students=10, status=models_edu.BatchStatus.UPCOMING):
    batch = models_edu.Batch(course_id=course.id, name=name, max_students=max_students, status=status)
    db_session.add(batch)
    db_session.commit()
    return batch


def _add_session(db_session, batch, title, start, is_active=True, room="aadikarta-secret-room"):
    s = models_edu.ClassSession(
        batch_id=batch.id, title=title, miro_room_id=f"{room}-{batch.id}-{title}",
        scheduled_start=start, scheduled_end=start + timedelta(hours=1), is_active=is_active,
    )
    db_session.add(s)
    db_session.commit()
    return s


def _enroll_db(db_session, user, batch):
    db_session.add(models_edu.BatchEnrollment(user_id=user.id, batch_id=batch.id))
    db_session.commit()


def _enroll(client, user, batch_id):
    return client.post("/edu/enroll", json={"user_id": user.id, "batch_id": batch_id}, headers=auth_headers(user))


# --- Public catalogue ------------------------------------------------------

def test_public_catalogue_hides_student_details_and_room_ids(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER)
    course = _course(db_session, tutor)
    batch = _batch(db_session, course)
    now = datetime.now(timezone.utc)
    _add_session(db_session, batch, "Second", now + timedelta(days=2))
    _add_session(db_session, batch, "First", now + timedelta(days=1))
    _add_session(db_session, batch, "Hidden", now + timedelta(days=3), is_active=False)
    _enroll_db(db_session, student, batch)

    resp = client.get("/edu/courses")  # anonymous
    assert resp.status_code == 200
    raw = json.dumps(resp.json())
    assert student.email not in raw
    assert "aadikarta-secret-room" not in raw
    assert "enrollments" not in raw and "miro_room_id" not in raw and "teacher_id" not in raw

    b = resp.json()[0]["batches"][0]
    assert b["seats_taken"] == 1 and b["max_students"] == 10
    assert [s["title"] for s in b["sessions"]] == ["First", "Second"]  # sorted, inactive dropped
    assert resp.json()[0]["is_enrolled"] is False


def test_public_catalogue_shows_open_batches_and_students_own_batch(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER)
    course = _course(db_session, tutor)
    open_batch = _batch(db_session, course, "Open")
    _batch(db_session, course, "Cancelled", status=models_edu.BatchStatus.CANCELLED)
    done = _batch(db_session, course, "Done", status=models_edu.BatchStatus.COMPLETED)
    _enroll_db(db_session, student, done)

    anon = client.get("/edu/courses").json()[0]
    assert [b["name"] for b in anon["batches"]] == ["Open"]

    mine = client.get("/edu/courses", headers=auth_headers(student)).json()[0]
    assert mine["is_enrolled"] is True and mine["enrolled_batch_id"] == done.id
    assert {b["name"] for b in mine["batches"]} == {"Open", "Done"}
    assert open_batch.id in {b["id"] for b in mine["batches"]}


def test_student_my_courses_only_shows_own_batch_and_enrollment(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    me = make_user(models.UserRole.SEEKER)
    classmate = make_user(models.UserRole.SEEKER)
    course = _course(db_session, tutor)
    my_batch = _batch(db_session, course, "Mine")
    other_batch = _batch(db_session, course, "Other")
    _add_session(db_session, other_batch, "Other class", datetime.now(timezone.utc), room="aadikarta-other-room")
    _enroll_db(db_session, me, my_batch)
    _enroll_db(db_session, classmate, my_batch)

    resp = client.get("/edu/my/courses", headers=auth_headers(me))
    assert resp.status_code == 200
    raw = json.dumps(resp.json())
    assert classmate.email not in raw
    assert "aadikarta-other-room" not in raw
    batches = resp.json()[0]["batches"]
    assert [b["id"] for b in batches] == [my_batch.id]
    assert [e["user_id"] for e in batches[0]["enrollments"]] == [me.id]


def test_tutor_my_courses_still_lists_enrolled_students(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER)
    batch = _batch(db_session, _course(db_session, tutor))
    _enroll_db(db_session, student, batch)

    batches = client.get("/edu/my/courses", headers=auth_headers(tutor)).json()[0]["batches"]
    assert batches[0]["enrollments"][0]["user"]["email"] == student.email


# --- Enrollment ------------------------------------------------------------

def test_student_enrolls_in_chosen_batch(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER)
    course = _course(db_session, tutor)
    _batch(db_session, course, "A")
    chosen = _batch(db_session, course, "B")

    resp = _enroll(client, student, chosen.id)
    assert resp.status_code == 200, resp.text
    assert resp.json()["batch_id"] == chosen.id


def test_cannot_enroll_in_full_batch(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    first, second = make_user(models.UserRole.SEEKER), make_user(models.UserRole.SEEKER)
    batch = _batch(db_session, _course(db_session, tutor), max_students=1)

    assert _enroll(client, first, batch.id).status_code == 200
    resp = _enroll(client, second, batch.id)
    assert resp.status_code == 409 and "full" in resp.json()["detail"]


def test_cannot_enroll_in_closed_batch_or_inactive_course(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER)
    closed = _batch(db_session, _course(db_session, tutor), status=models_edu.BatchStatus.COMPLETED)
    inactive_course_batch = _batch(db_session, _course(db_session, tutor, is_active=False))

    assert _enroll(client, student, closed.id).status_code == 409
    assert _enroll(client, student, inactive_course_batch.id).status_code == 404


def test_cannot_enroll_twice_in_same_course(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER, balance=5000)
    course = _course(db_session, tutor, price=1000)
    a, b = _batch(db_session, course, "A"), _batch(db_session, course, "B")

    assert _enroll(client, student, a.id).status_code == 200
    resp = _enroll(client, student, b.id)
    assert resp.status_code == 409
    # Charged exactly once.
    db_session.expire_all()
    wallet = db_session.query(models.UserWallet).filter_by(user_id=student.id).one()
    assert wallet.balance == Decimal("4000")


def test_only_students_can_enroll(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    batch = _batch(db_session, _course(db_session, tutor))
    for role in (models.UserRole.TUTOR, models.UserRole.ASTROLOGER, models.UserRole.ADMIN):
        assert _enroll(client, make_user(role), batch.id).status_code == 403


def test_paid_enrollment_requires_balance(client, db_session, make_user):
    tutor = make_user(models.UserRole.TUTOR)
    student = make_user(models.UserRole.SEEKER, balance=440)
    batch = _batch(db_session, _course(db_session, tutor, price=1000))

    assert _enroll(client, student, batch.id).status_code == 402
    assert db_session.query(models_edu.BatchEnrollment).count() == 0
