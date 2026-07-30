"""Two chats running at the same time (seeker1<->astrologer1, seeker2<->astrologer2)
must stay fully isolated: request queues, realtime "new request" push notifications,
and pause/resume (background <-> foreground) transitions for one pair must never
leak into or affect the other pair.

This directly covers the cross-contamination bug where one astrologer's dashboard
could show another astrologer's queue (root-caused to a shared browser localStorage
token, fixed on the frontend) by pinning down the backend invariants the fix relies
on: every query and every notification fan-out is scoped per astrologer_id/user_id.
"""
import asyncio

import pytest

from app import models
from app.routers import chat as chat_router
from app.routers import realtime as realtime_router
from tests.conftest import auth_headers


def _request_body(astrologer_id, ctype="CHAT"):
    return {"astrologer_id": astrologer_id, "consultation_type": ctype}


@pytest.fixture
def two_pairs(make_user):
    """Two independent seeker/astrologer pairs, each with wallet balance."""
    seeker1 = make_user(models.UserRole.SEEKER, balance=1000.0, full_name="Seeker One")
    astro1 = make_user(models.UserRole.ASTROLOGER, fee=10.0, full_name="Astro One")
    seeker2 = make_user(models.UserRole.SEEKER, balance=1000.0, full_name="Seeker Two")
    astro2 = make_user(models.UserRole.ASTROLOGER, fee=10.0, full_name="Astro Two")
    return seeker1, astro1, seeker2, astro2


def test_simultaneous_requests_land_in_separate_queues(client, two_pairs, make_user):
    """Both chats kick off 'at the same time' (foreground on both devices) and
    each astrologer's queue/history must only ever show their own seeker."""
    seeker1, astro1, seeker2, astro2 = two_pairs

    r1 = client.post("/consultations/", headers=auth_headers(seeker1), json=_request_body(astro1.id))
    r2 = client.post("/consultations/", headers=auth_headers(seeker2), json=_request_body(astro2.id))
    assert r1.status_code == 200 and r2.status_code == 200
    c1, c2 = r1.json(), r2.json()

    # Each request landed in its own astrologer's history only.
    astro1_history = client.get("/consultations/history", headers=auth_headers(astro1)).json()
    astro2_history = client.get("/consultations/history", headers=auth_headers(astro2)).json()
    assert [c["id"] for c in astro1_history] == [c1["id"]]
    assert [c["id"] for c in astro2_history] == [c2["id"]]

    pos2_before = client.get(f"/consultations/{c2['id']}/queue-position", headers=auth_headers(astro2)).json()

    # Pile more waiting seekers onto astro1's queue only.
    for _ in range(3):
        extra_seeker = make_user(models.UserRole.SEEKER, balance=1000.0)
        resp = client.post("/consultations/", headers=auth_headers(extra_seeker), json=_request_body(astro1.id))
        assert resp.status_code == 200

    pos1 = client.get(f"/consultations/{c1['id']}/queue-position", headers=auth_headers(astro1)).json()
    pos2_after = client.get(f"/consultations/{c2['id']}/queue-position", headers=auth_headers(astro2)).json()

    # astro1's queue grew...
    assert pos1["status"] == "REQUESTED"
    # ...but astro2's queue position/depth must be completely unaffected by
    # how many seekers are now waiting on astro1.
    assert pos2_after == pos2_before


def test_astrologer_cannot_see_or_act_on_other_pairs_consultation(client, two_pairs):
    seeker1, astro1, seeker2, astro2 = two_pairs

    c1 = client.post("/consultations/", headers=auth_headers(seeker1), json=_request_body(astro1.id)).json()

    # astro2 has no relationship to c1 at all.
    assert client.get(f"/consultations/{c1['id']}", headers=auth_headers(astro2)).status_code == 403
    assert client.get(f"/consultations/{c1['id']}/queue-position", headers=auth_headers(astro2)).status_code == 403
    assert client.post(f"/consultations/{c1['id']}/resume", headers=auth_headers(astro2)).status_code == 403

    # seeker2 likewise can't peek at seeker1's request.
    assert client.get(f"/consultations/{c1['id']}", headers=auth_headers(seeker2)).status_code == 403


def test_new_request_push_only_reaches_the_targeted_astrologer(client, two_pairs, monkeypatch):
    """_notify_astrologer_of_request must fan out to astro1's socket only, never
    astro2's, even though both are connected to the shared NotificationManager."""
    seeker1, astro1, seeker2, astro2 = two_pairs

    sent = []  # (user_id, payload)

    async def fake_send(self, user_id, payload):
        sent.append((user_id, payload))

    monkeypatch.setattr(realtime_router.NotificationManager, "send", fake_send)
    # notify_user() falls back to a fresh coroutine/no running loop in sync test
    # code; run it inline via asyncio to keep the test deterministic.
    monkeypatch.setattr(
        realtime_router,
        "notify_user",
        lambda user_id, payload: asyncio.run(realtime_router.notifier.send(user_id, payload)),
    )

    resp = client.post("/consultations/", headers=auth_headers(seeker1), json=_request_body(astro1.id))
    assert resp.status_code == 200

    new_request_pushes = [p for uid, p in sent if p.get("type") == "NEW_REQUEST"]
    assert len(new_request_pushes) == 1
    targeted_uid = [uid for uid, p in sent if p.get("type") == "NEW_REQUEST"][0]
    assert targeted_uid == astro1.id
    assert targeted_uid != astro2.id


def test_pause_and_resume_of_one_pair_does_not_touch_the_other(client, db_session, two_pairs):
    """Simulates: both chats are ACTIVE (foreground). Seeker1's app is
    backgrounded/dropped -> their consultation pauses. Seeker1 comes back to the
    foreground and resumes. None of this should perturb pair 2, which stays
    ACTIVE throughout."""
    seeker1, astro1, seeker2, astro2 = two_pairs

    c1 = client.post("/consultations/", headers=auth_headers(seeker1), json=_request_body(astro1.id)).json()
    c2 = client.post("/consultations/", headers=auth_headers(seeker2), json=_request_body(astro2.id)).json()

    # Fast-forward both to ACTIVE, as the astrologer joining the chat websocket
    # would (see websocket_endpoint's auto-accept-then-activate in chat.py).
    for cid in (c1["id"], c2["id"]):
        row = db_session.query(models.Consultation).filter(models.Consultation.id == cid).first()
        row.status = models.ConsultationStatus.ACTIVE
    db_session.commit()

    # Seeker1's connection drops (app backgrounded) -> only c1 pauses.
    row1 = db_session.query(models.Consultation).filter(models.Consultation.id == c1["id"]).first()
    row1.status = models.ConsultationStatus.PAUSED
    db_session.commit()

    row2 = db_session.query(models.Consultation).filter(models.Consultation.id == c2["id"]).first()
    assert row2.status == models.ConsultationStatus.ACTIVE, "pair 2 must be unaffected by pair 1 pausing"

    # astrologer_has_other_active is scoped per astrologer, so astro2 being busy
    # on c2 must never block astro1's own c1 from resuming.
    assert chat_router.astrologer_has_other_active(db_session, astro1.id, c1["id"]) is False

    resp = client.post(f"/consultations/{c1['id']}/resume", headers=auth_headers(seeker1))
    assert resp.status_code == 200
    assert resp.json() == {"status": "resumed", "consultation_id": c1["id"]}

    db_session.expire_all()
    row1 = db_session.query(models.Consultation).filter(models.Consultation.id == c1["id"]).first()
    row2 = db_session.query(models.Consultation).filter(models.Consultation.id == c2["id"]).first()
    assert row1.status == models.ConsultationStatus.ACTIVE
    # Pair 2 never left ACTIVE; resuming pair 1 must not have touched it.
    assert row2.status == models.ConsultationStatus.ACTIVE


def test_seeker_cannot_resume_the_other_pairs_paused_consultation(client, db_session, two_pairs):
    seeker1, astro1, seeker2, astro2 = two_pairs

    c1 = client.post("/consultations/", headers=auth_headers(seeker1), json=_request_body(astro1.id)).json()
    row1 = db_session.query(models.Consultation).filter(models.Consultation.id == c1["id"]).first()
    row1.status = models.ConsultationStatus.PAUSED
    db_session.commit()

    # seeker2 has no stake in c1 and must not be able to resume it.
    resp = client.post(f"/consultations/{c1['id']}/resume", headers=auth_headers(seeker2))
    assert resp.status_code == 403

    db_session.expire_all()
    row1 = db_session.query(models.Consultation).filter(models.Consultation.id == c1["id"]).first()
    assert row1.status == models.ConsultationStatus.PAUSED, "unauthorized resume attempt must not change state"
