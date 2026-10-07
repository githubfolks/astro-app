"""Seeker-facing availability = Online switch + availability window.

An astrologer must stay Online whatever window/app/tab they are looking at
(iPhone Safari suspends a backgrounded page and drops its socket), so live
socket presence no longer decides status. Absent astrologers are instead
switched Offline when a request to them expires unanswered (MISSED).
"""
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import pytest
from sqlalchemy.orm import sessionmaker

from app import database, models
from app.routers import astrologers, realtime
from app.services import settings_service
from app import notifications
from tests.conftest import auth_headers

IST = ZoneInfo("Asia/Kolkata")


def _window(start_offset_h: float, end_offset_h: float):
    now = datetime.now(IST)
    return (now + timedelta(hours=start_offset_h)).time(), (now + timedelta(hours=end_offset_h)).time()


def _publish(db_session, user):
    profile = user.astrologer_profile
    profile.is_approved = True
    profile.onboarding_stage = models.OnboardingStage.COMPLETED
    db_session.commit()
    return profile


@pytest.fixture
def broadcasts(monkeypatch):
    sent = []
    monkeypatch.setattr(realtime, "broadcast_event", lambda msg: sent.append(msg))
    return sent


# --- availability rule ---

def test_online_without_window_is_available(make_user):
    astro = make_user(models.UserRole.ASTROLOGER)
    assert astrologers.is_astrologer_available(astro.astrologer_profile) is True


def test_switch_off_is_unavailable(make_user):
    astro = make_user(models.UserRole.ASTROLOGER, is_online=False)
    assert astrologers.is_astrologer_available(astro.astrologer_profile) is False


@pytest.mark.parametrize("start,end,expected", [
    (-1, 1, True),     # inside window
    (1, 2, False),     # window later today
    (-2, -1, False),   # window already over
])
def test_window_decides_availability(make_user, db_session, start, end, expected):
    astro = make_user(models.UserRole.ASTROLOGER)
    profile = astro.astrologer_profile
    profile.availability_start_time, profile.availability_end_time = _window(start, end)
    db_session.commit()
    assert astrologers.is_astrologer_available(profile) is expected


def test_public_profile_online_with_no_live_socket(client, make_user, db_session):
    """Regression: no realtime socket (astrologer on another window/app) must not
    show them OFFLINE."""
    astro = make_user(models.UserRole.ASTROLOGER)
    _publish(db_session, astro)
    assert not realtime.notifier.is_user_connected(astro.id)

    r = client.get(f"/astrologers/{astro.id}")
    assert r.status_code == 200, r.text
    assert r.json()["availability_status"] == "ONLINE"


def test_public_profile_offline_outside_window(client, make_user, db_session):
    astro = make_user(models.UserRole.ASTROLOGER)
    profile = _publish(db_session, astro)
    profile.availability_start_time, profile.availability_end_time = _window(1, 2)
    db_session.commit()

    body = client.get(f"/astrologers/{astro.id}").json()
    assert body["availability_status"] == "OFFLINE"
    assert body["knockable"] is False


def test_public_profile_switched_off_inside_window_is_knockable(client, make_user, db_session):
    astro = make_user(models.UserRole.ASTROLOGER, is_online=False)
    profile = _publish(db_session, astro)
    profile.availability_start_time, profile.availability_end_time = _window(-1, 1)
    db_session.commit()

    body = client.get(f"/astrologers/{astro.id}").json()
    assert body["availability_status"] == "OFFLINE"
    assert body["knockable"] is True


# --- server-side enforcement on chat requests ---

def _request(client, seeker, astro):
    return client.post("/consultations/", headers=auth_headers(seeker),
                       json={"astrologer_id": astro.id, "consultation_type": "CHAT"})


def test_request_to_offline_astrologer_rejected(client, make_user, db_session):
    seeker = make_user(balance=500)
    astro = make_user(models.UserRole.ASTROLOGER, is_online=False)
    r = _request(client, seeker, astro)
    assert r.status_code == 409
    assert r.json()["detail"]["code"] == "ASTROLOGER_OFFLINE"
    assert db_session.query(models.Consultation).count() == 0


def test_request_outside_window_rejected(client, make_user, db_session):
    seeker = make_user(balance=500)
    astro = make_user(models.UserRole.ASTROLOGER)
    profile = astro.astrologer_profile
    profile.availability_start_time, profile.availability_end_time = _window(1, 2)
    db_session.commit()
    assert _request(client, seeker, astro).status_code == 409
    assert db_session.query(models.Consultation).count() == 0


def test_request_to_available_astrologer_accepted(client, make_user):
    seeker = make_user(balance=500)
    astro = make_user(models.UserRole.ASTROLOGER)
    r = _request(client, seeker, astro)
    assert r.status_code == 200, r.text
    assert r.json()["status"] == "REQUESTED"


# --- auto-offline after missed requests ---

@pytest.fixture
def missed_env(monkeypatch, db_session, broadcasts):
    """Route the handler's own session/notifications to test doubles."""
    monkeypatch.setattr(database, "SessionLocal", sessionmaker(bind=db_session.get_bind()))
    notified, pushed = [], []
    monkeypatch.setattr(realtime, "notify_user", lambda uid, msg: notified.append((uid, msg)))
    monkeypatch.setattr(notifications, "send_push_notification", lambda **kw: pushed.append(kw))
    settings = {"auto_offline_after_missed_requests": "1"}
    monkeypatch.setattr(settings_service, "get_setting", lambda key, default=None: settings.get(key, default))
    return {"notified": notified, "pushed": pushed, "settings": settings, "broadcasts": broadcasts}


def _online_session(db_session, astro, started_at=None):
    s = models.AstrologerOnlineSession(astrologer_id=astro.id)
    if started_at is not None:
        s.started_at = started_at
    db_session.add(s)
    db_session.commit()
    return s


def _consultation(db_session, seeker, astro, status, created_at=None):
    c = models.Consultation(seeker_id=seeker.id, astrologer_id=astro.id, status=status,
                            consultation_type="CHAT", rate_per_min=10)
    if created_at is not None:
        c.created_at = created_at
    db_session.add(c)
    db_session.commit()
    return c


def test_one_missed_request_switches_astrologer_offline(make_user, db_session, missed_env):
    seeker = make_user(balance=500)
    astro = make_user(models.UserRole.ASTROLOGER)
    session = _online_session(db_session, astro)
    db_session.add(models.DeviceToken(user_id=astro.id, fcm_token="native-token", platform="android"))
    db_session.commit()
    _consultation(db_session, seeker, astro, models.ConsultationStatus.MISSED)

    assert astrologers.handle_missed_request(db_session, astro.id) is True

    db_session.refresh(astro.astrologer_profile)
    db_session.refresh(session)
    assert astro.astrologer_profile.is_online is False
    assert session.ended_at is not None
    assert {"type": "ASTRO_OFFLINE", "astrologer_id": astro.id} in missed_env["broadcasts"]
    assert missed_env["notified"] == [(astro.id, {"type": "AUTO_OFFLINE", "reason": "missed_request"})]
    assert [p["token"] for p in missed_env["pushed"]] == ["native-token"]
    audit = db_session.query(models.AuditLog).filter(models.AuditLog.action == "ASTROLOGER_AUTO_OFFLINE").one()
    assert audit.resource_id == str(astro.id)


def test_disabled_when_threshold_zero(make_user, db_session, missed_env):
    missed_env["settings"]["auto_offline_after_missed_requests"] = "0"
    seeker = make_user(balance=500)
    astro = make_user(models.UserRole.ASTROLOGER)
    _online_session(db_session, astro)
    _consultation(db_session, seeker, astro, models.ConsultationStatus.MISSED)

    assert astrologers.handle_missed_request(db_session, astro.id) is False
    db_session.refresh(astro.astrologer_profile)
    assert astro.astrologer_profile.is_online is True


def test_miss_before_going_online_again_does_not_count(make_user, db_session, missed_env):
    seeker = make_user(balance=500)
    astro = make_user(models.UserRole.ASTROLOGER)
    now = datetime.now(IST)
    _consultation(db_session, seeker, astro, models.ConsultationStatus.MISSED, created_at=now - timedelta(hours=2))
    _online_session(db_session, astro, started_at=now - timedelta(hours=1))

    assert astrologers.handle_missed_request(db_session, astro.id) is False
    db_session.refresh(astro.astrologer_profile)
    assert astro.astrologer_profile.is_online is True


def test_threshold_two_needs_consecutive_misses(make_user, db_session, missed_env):
    missed_env["settings"]["auto_offline_after_missed_requests"] = "2"
    seeker = make_user(balance=500)
    astro = make_user(models.UserRole.ASTROLOGER)
    now = datetime.now(IST)
    _online_session(db_session, astro, started_at=now - timedelta(hours=1))
    _consultation(db_session, seeker, astro, models.ConsultationStatus.MISSED, created_at=now - timedelta(minutes=30))
    _consultation(db_session, seeker, astro, models.ConsultationStatus.COMPLETED, created_at=now - timedelta(minutes=20))
    _consultation(db_session, seeker, astro, models.ConsultationStatus.MISSED, created_at=now - timedelta(minutes=10))
    assert astrologers.handle_missed_request(db_session, astro.id) is False  # streak broken by COMPLETED

    _consultation(db_session, seeker, astro, models.ConsultationStatus.MISSED, created_at=now - timedelta(minutes=5))
    assert astrologers.handle_missed_request(db_session, astro.id) is True


def test_already_offline_is_noop(make_user, db_session, missed_env):
    seeker = make_user(balance=500)
    astro = make_user(models.UserRole.ASTROLOGER, is_online=False)
    _consultation(db_session, seeker, astro, models.ConsultationStatus.MISSED)
    assert astrologers.handle_missed_request(db_session, astro.id) is False
    assert missed_env["notified"] == []


# --- realtime socket no longer affects status ---

def test_socket_disconnect_does_not_broadcast_offline(broadcasts):
    manager = realtime.NotificationManager()
    ws = object()
    manager.connections[42] = [ws]
    manager.disconnect(42, ws)
    assert not manager.is_user_connected(42)
    assert broadcasts == []
