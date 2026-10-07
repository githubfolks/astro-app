"""Web Push (VAPID) delivery for browser astrologers.

iPhone Safari suspends a backgrounded page and kills its realtime socket within
seconds, so new requests can't reach a browser astrologer through the socket.
They can subscribe to standard Web Push (iOS 16.4+ Home Screen web app) instead.
"""
import json
from unittest.mock import MagicMock

import pytest
from pywebpush import WebPushException

from app import database, models, notifications
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
