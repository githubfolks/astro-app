"""Isolation of concurrent chats at the message layer: two independent
seeker<->astrologer pairs chatting "at the same time" must never see or affect
each other's messages, history, or websocket fan-out.

Complements test_concurrent_chats.py, which covers queue/notification/pause
isolation at the consultation-state layer. This file targets chat.py's
/history, /send, and ConnectionManager.broadcast — the actual message path.
"""
import asyncio
import json

import pytest

from app import models
from app.routers import chat as chat_router
from tests.conftest import auth_headers


@pytest.fixture
def two_pairs(make_user):
    seeker1 = make_user(models.UserRole.SEEKER, balance=1000.0, full_name="Seeker One")
    astro1 = make_user(models.UserRole.ASTROLOGER, fee=10.0, full_name="Astro One")
    seeker2 = make_user(models.UserRole.SEEKER, balance=1000.0, full_name="Seeker Two")
    astro2 = make_user(models.UserRole.ASTROLOGER, fee=10.0, full_name="Astro Two")
    return seeker1, astro1, seeker2, astro2


def _active_consultation(db_session, seeker, astro):
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


# --- REST /chat/history and /chat/send: authorization + data isolation --------

def test_chat_history_not_visible_to_outsiders(client, db_session, two_pairs):
    seeker1, astro1, seeker2, astro2 = two_pairs
    c1 = _active_consultation(db_session, seeker1, astro1)

    for outsider in (seeker2, astro2):
        resp = client.get(f"/chat/history/{c1.id}", headers=auth_headers(outsider))
        assert resp.status_code == 403


def test_chat_send_rejected_for_non_participant(client, db_session, two_pairs):
    seeker1, astro1, seeker2, astro2 = two_pairs
    c1 = _active_consultation(db_session, seeker1, astro1)

    resp = client.post(
        "/chat/send",
        headers=auth_headers(astro2),
        json={"consultation_id": c1.id, "content": "I shouldn't be able to send this"},
    )
    assert resp.status_code == 403


def test_messages_do_not_leak_across_concurrent_chats(client, db_session, two_pairs):
    """Messages sent in pair 1's chat must never appear in pair 2's history, even
    when both chats are ACTIVE at the same time and interleaved."""
    seeker1, astro1, seeker2, astro2 = two_pairs
    c1 = _active_consultation(db_session, seeker1, astro1)
    c2 = _active_consultation(db_session, seeker2, astro2)

    # Interleave sends across both chats.
    assert client.post("/chat/send", headers=auth_headers(seeker1), json={"consultation_id": c1.id, "content": "pair1-msg-a"}).status_code == 200
    assert client.post("/chat/send", headers=auth_headers(seeker2), json={"consultation_id": c2.id, "content": "pair2-msg-a"}).status_code == 200
    assert client.post("/chat/send", headers=auth_headers(astro1), json={"consultation_id": c1.id, "content": "pair1-msg-b"}).status_code == 200
    assert client.post("/chat/send", headers=auth_headers(astro2), json={"consultation_id": c2.id, "content": "pair2-msg-b"}).status_code == 200

    hist1 = client.get(f"/chat/history/{c1.id}", headers=auth_headers(seeker1)).json()
    hist2 = client.get(f"/chat/history/{c2.id}", headers=auth_headers(seeker2)).json()

    hist1_texts = {m["message"] for m in hist1}
    hist2_texts = {m["message"] for m in hist2}

    assert hist1_texts == {"pair1-msg-a", "pair1-msg-b"}
    assert hist2_texts == {"pair2-msg-a", "pair2-msg-b"}
    assert hist1_texts.isdisjoint(hist2_texts)


def test_send_to_nonexistent_consultation_returns_404(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/chat/send", headers=auth_headers(seeker), json={"consultation_id": 999999, "content": "hi"})
    assert resp.status_code == 404


def test_share_image_rejected_for_seeker_role(client, db_session, two_pairs):
    """Only the astrologer may share a chart image; a seeker attempting it on
    their own (legitimate) consultation must still be rejected."""
    seeker1, astro1, _, _ = two_pairs
    c1 = _active_consultation(db_session, seeker1, astro1)

    resp = client.post(
        f"/chat/{c1.id}/share-image",
        headers=auth_headers(seeker1),
        files={"file": ("chart.png", b"\x89PNG\r\n\x1a\n", "image/png")},
    )
    assert resp.status_code == 403


def test_share_image_rejected_for_non_participant_astrologer(client, db_session, two_pairs):
    seeker1, astro1, seeker2, astro2 = two_pairs
    c1 = _active_consultation(db_session, seeker1, astro1)

    resp = client.post(
        f"/chat/{c1.id}/share-image",
        headers=auth_headers(astro2),
        files={"file": ("chart.png", b"\x89PNG\r\n\x1a\n", "image/png")},
    )
    assert resp.status_code == 403


# --- ConnectionManager: websocket fan-out isolation ----------------------------

class _FakeWebSocket:
    def __init__(self):
        self.sent = []

    async def send_text(self, text):
        self.sent.append(json.loads(text))


def test_broadcast_only_reaches_sockets_in_the_same_consultation():
    """The actual fan-out primitive behind every chat websocket push: a message
    broadcast to consultation A's room must never reach consultation B's sockets,
    even when both rooms have connections open at once."""
    manager = chat_router.ConnectionManager()

    seeker1_ws, astro1_ws = _FakeWebSocket(), _FakeWebSocket()
    seeker2_ws, astro2_ws = _FakeWebSocket(), _FakeWebSocket()

    seeker1 = models.User(id=101, role=models.UserRole.SEEKER)
    astro1 = models.User(id=102, role=models.UserRole.ASTROLOGER)
    seeker2 = models.User(id=201, role=models.UserRole.SEEKER)
    astro2 = models.User(id=202, role=models.UserRole.ASTROLOGER)

    async def _setup():
        await manager.connect(seeker1_ws, consultation_id=1, user=seeker1)
        await manager.connect(astro1_ws, consultation_id=1, user=astro1)
        await manager.connect(seeker2_ws, consultation_id=2, user=seeker2)
        await manager.connect(astro2_ws, consultation_id=2, user=astro2)

        await manager.broadcast(1, {"type": "NEW_MESSAGE", "content": "room1-only"})

    asyncio.run(_setup())

    assert [m["content"] for m in seeker1_ws.sent] == ["room1-only"]
    assert [m["content"] for m in astro1_ws.sent] == ["room1-only"]
    # Room 2's sockets received nothing from room 1's broadcast.
    assert seeker2_ws.sent == []
    assert astro2_ws.sent == []


def test_broadcast_exclude_user_id_still_scoped_to_its_own_room():
    """exclude_user_id (used to skip echoing back to the sender) must not leak a
    message into a different consultation's connections."""
    manager = chat_router.ConnectionManager()

    room1_ws = _FakeWebSocket()
    room2_ws = _FakeWebSocket()

    sender = models.User(id=1, role=models.UserRole.SEEKER)
    other_room_user = models.User(id=2, role=models.UserRole.SEEKER)

    async def _setup():
        await manager.connect(room1_ws, consultation_id=1, user=sender)
        await manager.connect(room2_ws, consultation_id=2, user=other_room_user)
        await manager.broadcast(1, {"type": "NEW_MESSAGE", "content": "hello"}, exclude_user_id=999)

    asyncio.run(_setup())

    assert [m["content"] for m in room1_ws.sent] == ["hello"]
    assert room2_ws.sent == []


def test_disconnect_from_one_room_does_not_affect_the_other():
    manager = chat_router.ConnectionManager()
    room1_ws = _FakeWebSocket()
    room2_ws = _FakeWebSocket()
    user1 = models.User(id=1, role=models.UserRole.SEEKER)
    user2 = models.User(id=2, role=models.UserRole.SEEKER)

    async def _setup():
        await manager.connect(room1_ws, consultation_id=1, user=user1)
        await manager.connect(room2_ws, consultation_id=2, user=user2)

    asyncio.run(_setup())
    manager.disconnect(room1_ws, consultation_id=1)

    assert 1 not in manager.active_connections
    assert 2 in manager.active_connections
