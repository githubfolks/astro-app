"""_pause_active_consultation_on_disconnect must fire for ANY socket-level
disconnect, not just the clean WebSocketDisconnect case — a network drop or any
other exception is just as dead a connection, and billing_loop must stop
deducting from the seeker's wallet once nobody is actually connected.

This directly covers the gap where the old code's `except Exception` branch in
websocket_endpoint disconnected the manager but never flipped the consultation
to PAUSED, leaving an ACTIVE session billing against an empty room."""
import asyncio
import json

from sqlalchemy.orm import sessionmaker

from app import database, models
from app.routers.chat import _pause_active_consultation_on_disconnect
from tests.conftest import auth_headers


def _request_body(astrologer_id, ctype="CHAT"):
    return {"astrologer_id": astrologer_id, "consultation_type": ctype}


def _bind_session_local_to(db_session, monkeypatch):
    # _pause_active_consultation_on_disconnect opens its own DB session via
    # database.SessionLocal (same pattern billing_loop uses), independent of the
    # `db_session`/`client` fixtures' overridden session. Bind a sessionmaker to
    # db_session's own engine (rather than importing tests.conftest's module-level
    # engine, which pytest's plugin loader and a plain `import tests.conftest` can
    # end up treating as two separate module instances with two separate engines)
    # so it reliably sees the same in-memory database this test set up.
    monkeypatch.setattr(database, "SessionLocal", sessionmaker(bind=db_session.get_bind()))


def test_pauses_active_consultation_and_records_snapshot(client, db_session, make_user, monkeypatch):
    _bind_session_local_to(db_session, monkeypatch)

    seeker = make_user(models.UserRole.SEEKER, balance=1000.0)
    astro = make_user(models.UserRole.ASTROLOGER, fee=10.0)

    c = client.post("/consultations/", headers=auth_headers(seeker), json=_request_body(astro.id)).json()
    row = db_session.query(models.Consultation).filter(models.Consultation.id == c["id"]).first()
    row.status = models.ConsultationStatus.ACTIVE
    db_session.commit()

    asyncio.run(_pause_active_consultation_on_disconnect(c["id"], models.UserRole.ASTROLOGER))

    db_session.expire_all()
    row = db_session.query(models.Consultation).filter(models.Consultation.id == c["id"]).first()
    assert row.status == models.ConsultationStatus.PAUSED
    snapshot = json.loads(row.disconnection_snapshot)
    assert snapshot["paused_by"] == "ASTROLOGER"
    assert "paused_at" in snapshot


def test_noop_when_consultation_is_not_active(db_session, make_user, monkeypatch):
    """REQUESTED/ACCEPTED/already-PAUSED/terminal sessions must be left alone —
    only a live ACTIVE session should ever transition to PAUSED on disconnect."""
    _bind_session_local_to(db_session, monkeypatch)

    seeker = make_user(models.UserRole.SEEKER, balance=1000.0)
    astro = make_user(models.UserRole.ASTROLOGER, fee=10.0)
    cons = models.Consultation(
        seeker_id=seeker.id, astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT, rate_per_min=10.0,
        status=models.ConsultationStatus.REQUESTED,
    )
    db_session.add(cons)
    db_session.commit()
    db_session.refresh(cons)

    asyncio.run(_pause_active_consultation_on_disconnect(cons.id, models.UserRole.SEEKER))

    db_session.expire_all()
    row = db_session.query(models.Consultation).filter(models.Consultation.id == cons.id).first()
    assert row.status == models.ConsultationStatus.REQUESTED
    assert row.disconnection_snapshot is None
