"""Web Push (VAPID) delivery for browser astrologers + push-aware presence grace.

iPhone Safari suspends a backgrounded page and kills its realtime socket within
seconds, so an astrologer there used to flip OFFLINE immediately. They can now
subscribe to standard Web Push (iOS 16.4+ Home Screen web app); while they have a
deliverable push target the backend keeps them ONLINE for a grace period.
"""
import asyncio
import json
from unittest.mock import MagicMock

import pytest
from pywebpush import WebPushException

from app import database, models, notifications
from app.routers import realtime
from sqlalchemy.orm import sessionmaker

from tests.conftest import auth_headers

SUB = {
    "endpoint": "https://web.push.apple.com/QGx-example-endpoint",
    "keys": {"p256dh": "BPf-example-p256dh", "auth": "example-auth"},
}


@pytest.fixture
def vapid(monkeypatch):
    monkeypatch.setattr(notifications, "VAPID_PUBLIC_KEY", "BPublicKeyExample")
    monkeypatch.setattr(notifications, "VAPID_PRIVATE_KEY", "private-key-example")
    monkeypatch.setattr(notifications, "VAPID_SUBJECT", "mailto:ops@example.com")
    # users.py imported the public key by value at import time.
    from app.routers import users
    monkeypatch.setattr(users, "VAPID_PUBLIC_KEY", "BPublicKeyExample")


@pytest.fixture
def test_sessions(monkeypatch, db_session):
    """Helpers that open their own session must hit the test DB."""
    monkeypatch.setattr(database, "SessionLocal", sessionmaker(bind=db_session.get_bind()))


# --- subscription parsing ---

def test_parse_accepts_valid_subscription_and_strips_extras():
    raw = json.dumps({**SUB, "expirationTime": None})
    assert notifications.parse_web_push_subscription(raw) == SUB


@pytest.mark.parametrize("token", [
    "fcm-opaque-token:APA91b",
    "{not json",
    json.dumps({"endpoint": "http://insecure.example/x", "keys": SUB["keys"]}),
    json.dumps({"endpoint": SUB["endpoint"], "keys": {"p256dh": "x"}}),
    json.dumps({"endpoint": SUB["endpoint"]}),
    json.dumps([SUB]),
])
def test_parse_rejects_non_subscriptions(token):
    assert notifications.parse_web_push_subscription(token) is None


# --- registration endpoint ---

def test_register_webpush_subscription_is_normalized_and_deduplicated(client, make_user, db_session):
    astro = make_user(models.UserRole.ASTROLOGER)
    headers = auth_headers(astro)
    for body in (json.dumps({**SUB, "expirationTime": None}), json.dumps({"keys": SUB["keys"], "endpoint": SUB["endpoint"]})):
        r = client.post("/users/device-token", json={"token": body, "platform": "webpush"}, headers=headers)
        assert r.status_code == 200, r.text
    rows = db_session.query(models.DeviceToken).filter(models.DeviceToken.user_id == astro.id).all()
    assert len(rows) == 1
    assert rows[0].platform == "webpush"
    assert rows[0].fcm_token == notifications.normalize_web_push_subscription(SUB)


def test_register_rejects_invalid_webpush_subscription(client, make_user, db_session):
    astro = make_user(models.UserRole.ASTROLOGER)
    r = client.post("/users/device-token", json={"token": "garbage", "platform": "webpush"}, headers=auth_headers(astro))
    assert r.status_code == 422
    assert db_session.query(models.DeviceToken).count() == 0


def test_register_rejects_subscription_under_native_platform(client, make_user):
    astro = make_user(models.UserRole.ASTROLOGER)
    r = client.post("/users/device-token", json={"token": json.dumps(SUB), "platform": "ios"}, headers=auth_headers(astro))
    assert r.status_code == 422


def test_clear_webpush_subscription(client, make_user, db_session):
    astro = make_user(models.UserRole.ASTROLOGER)
    headers = auth_headers(astro)
    client.post("/users/device-token", json={"token": json.dumps(SUB), "platform": "webpush"}, headers=headers)
    r = client.request("DELETE", "/users/device-token",
                       json={"token": json.dumps({**SUB, "expirationTime": None}), "platform": "webpush"}, headers=headers)
    assert r.status_code == 200
    assert db_session.query(models.DeviceToken).count() == 0


def test_web_push_config_requires_auth_and_configuration(client, make_user, monkeypatch, vapid):
    assert client.get("/users/web-push/config").status_code == 401
    astro = make_user(models.UserRole.ASTROLOGER)
    r = client.get("/users/web-push/config", headers=auth_headers(astro))
    assert r.status_code == 200
    assert r.json() == {"public_key": "BPublicKeyExample"}

    monkeypatch.setattr(notifications, "VAPID_PRIVATE_KEY", "")
    assert client.get("/users/web-push/config", headers=auth_headers(astro)).status_code == 503


# --- delivery routing ---

def test_send_routes_subscription_to_webpush_not_fcm(monkeypatch, vapid):
    sent = MagicMock()
    fcm = MagicMock()
    monkeypatch.setattr(notifications, "webpush", sent)
    monkeypatch.setattr(notifications.messaging, "send", fcm)
    token = notifications.normalize_web_push_subscription(SUB)

    notifications.send_push_notification(token, "New consultation request", "A seeker wants to chat",
                                         data={"type": "NEW_REQUEST", "consultation_id": "7"})

    fcm.assert_not_called()
    kwargs = sent.call_args.kwargs
    assert kwargs["subscription_info"] == SUB
    assert json.loads(kwargs["data"]) == {
        "title": "New consultation request",
        "body": "A seeker wants to chat",
        "data": {"type": "NEW_REQUEST", "consultation_id": "7"},
    }
    assert kwargs["vapid_claims"] == {"sub": "mailto:ops@example.com"}
    assert kwargs["ttl"] > 0


def test_send_skips_webpush_when_vapid_not_configured(monkeypatch):
    monkeypatch.setattr(notifications, "VAPID_PRIVATE_KEY", "")
    sent = MagicMock()
    monkeypatch.setattr(notifications, "webpush", sent)
    notifications.send_push_notification(notifications.normalize_web_push_subscription(SUB), "t", "b")
    sent.assert_not_called()


@pytest.mark.parametrize("status,deleted", [(410, True), (404, True), (500, False)])
def test_expired_subscription_is_removed(monkeypatch, vapid, test_sessions, make_user, db_session, status, deleted):
    astro = make_user(models.UserRole.ASTROLOGER)
    token = notifications.normalize_web_push_subscription(SUB)
    db_session.add(models.DeviceToken(user_id=astro.id, fcm_token=token, platform="webpush"))
    db_session.commit()

    def fail(**kwargs):
        raise WebPushException("push failed", response=MagicMock(status_code=status, text=""))
    monkeypatch.setattr(notifications, "webpush", fail)

    notifications.send_push_notification(token, "t", "b")

    db_session.expire_all()
    remaining = db_session.query(models.DeviceToken).count()
    assert remaining == (0 if deleted else 1)


# --- presence grace on last disconnect ---

class _PresenceSpy:
    def __init__(self, monkeypatch):
        self.marked: list[tuple[int, int | None]] = []
        self.cleared: list[int] = []
        monkeypatch.setattr(realtime, "mark_present", lambda uid, ttl=None: self.marked.append((uid, ttl)))
        monkeypatch.setattr(realtime, "clear_present", lambda uid: self.cleared.append(uid))


def _run_last_disconnect(manager, user_id, is_astrologer, broadcasts):
    async def go():
        async def fake_broadcast(msg):
            broadcasts.append(msg)
        manager.broadcast = fake_broadcast
        manager.handle_last_disconnect(user_id, is_astrologer)
        await asyncio.sleep(0)  # let fire-and-forget broadcast tasks run
        pending = manager.offline_tasks.get(user_id)
        if pending:
            pending.cancel()
    asyncio.run(go())


def test_push_reachable_astrologer_keeps_presence_for_grace(monkeypatch, vapid, test_sessions, make_user, db_session):
    spy = _PresenceSpy(monkeypatch)
    monkeypatch.setattr(realtime, "get_setting", lambda key: {"presence_push_grace_seconds": "300"}.get(key))
    astro = make_user(models.UserRole.ASTROLOGER)
    db_session.add(models.DeviceToken(user_id=astro.id, fcm_token=notifications.normalize_web_push_subscription(SUB), platform="webpush"))
    db_session.commit()

    broadcasts = []
    _run_last_disconnect(realtime.NotificationManager(), astro.id, True, broadcasts)

    assert spy.marked == [(astro.id, 300)]
    assert spy.cleared == []
    assert broadcasts == []  # not announced OFFLINE during the grace window


def test_astrologer_without_push_goes_offline_immediately(monkeypatch, test_sessions, make_user):
    spy = _PresenceSpy(monkeypatch)
    monkeypatch.setattr(realtime, "get_setting", lambda key: {"presence_push_grace_seconds": "300"}.get(key))
    astro = make_user(models.UserRole.ASTROLOGER)

    broadcasts = []
    _run_last_disconnect(realtime.NotificationManager(), astro.id, True, broadcasts)

    assert spy.cleared == [astro.id]
    assert broadcasts == [{"type": "ASTRO_OFFLINE", "astrologer_id": astro.id}]


def test_legacy_web_token_does_not_count_as_reachable(monkeypatch, vapid, test_sessions, make_user, db_session):
    astro = make_user(models.UserRole.ASTROLOGER)
    db_session.add(models.DeviceToken(user_id=astro.id, fcm_token="mock_fcm_token_123", platform="web"))
    db_session.commit()
    assert realtime.has_reachable_push_token(astro.id) is False


def test_webpush_token_not_reachable_without_vapid(monkeypatch, test_sessions, make_user, db_session):
    monkeypatch.setattr(notifications, "VAPID_PRIVATE_KEY", "")
    astro = make_user(models.UserRole.ASTROLOGER)
    db_session.add(models.DeviceToken(user_id=astro.id, fcm_token=notifications.normalize_web_push_subscription(SUB), platform="webpush"))
    db_session.commit()
    assert realtime.has_reachable_push_token(astro.id) is False


def test_grace_zero_disables(monkeypatch, vapid, test_sessions, make_user, db_session):
    spy = _PresenceSpy(monkeypatch)
    monkeypatch.setattr(realtime, "get_setting", lambda key: {"presence_push_grace_seconds": "0"}.get(key))
    astro = make_user(models.UserRole.ASTROLOGER)
    db_session.add(models.DeviceToken(user_id=astro.id, fcm_token="native-fcm-token", platform="ios"))
    db_session.commit()

    broadcasts = []
    _run_last_disconnect(realtime.NotificationManager(), astro.id, True, broadcasts)
    assert spy.cleared == [astro.id]
    assert broadcasts == [{"type": "ASTRO_OFFLINE", "astrologer_id": astro.id}]


def test_offline_announced_after_grace_unless_reconnected(monkeypatch):
    manager = realtime.NotificationManager()
    broadcasts = []

    async def go():
        async def fake_broadcast(msg):
            broadcasts.append(msg)
        manager.broadcast = fake_broadcast
        await manager._announce_offline_after(1, 0)          # still disconnected -> announce
        manager.connections[2] = [object()]
        await manager._announce_offline_after(2, 0)          # reconnected meanwhile -> silent
    asyncio.run(go())

    assert broadcasts == [{"type": "ASTRO_OFFLINE", "astrologer_id": 1}]


def test_reconnect_cancels_pending_offline_announcement(monkeypatch):
    monkeypatch.setattr(realtime, "mark_present", lambda uid, ttl=None: None)
    manager = realtime.NotificationManager()

    async def go():
        task = asyncio.create_task(asyncio.sleep(60))
        manager.offline_tasks[5] = task
        await manager.connect(5, object())
        await asyncio.sleep(0)
        return task
    task = asyncio.run(go())
    assert task.cancelled()
    assert 5 not in manager.offline_tasks
