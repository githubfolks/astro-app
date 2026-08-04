"""Tests for the ErrorLog capture in main.py's request middleware and the
admin endpoint that surfaces it."""
from sqlalchemy.orm import sessionmaker
from app import models, database
from app.main import app
from tests.conftest import auth_headers


def _install_boom_route(path):
    """Adds a route that raises an uncaught exception, so we can exercise the
    real top-level middleware exactly as production traffic would. Removed
    after the test so it doesn't leak into other tests sharing `app`."""
    @app.get(path)
    def _boom():
        raise ValueError("kaboom")


def _remove_route(path):
    app.router.routes = [r for r in app.router.routes if getattr(r, "path", None) != path]


def _point_session_local_at(db_session, monkeypatch):
    """main.py's middleware calls database.SessionLocal() directly (no
    request-scoped dependency to override), so point it at the same
    in-memory DB `db_session` is using. Built from db_session's own bind
    rather than importing conftest's `TestingSessionLocal` — tests/ has no
    __init__.py, so `from tests.conftest import X` and pytest's own conftest
    auto-import load two separate module instances with two separate engines."""
    monkeypatch.setattr(database, "SessionLocal", sessionmaker(bind=db_session.get_bind()))


def test_unhandled_exception_returns_generic_500(client, db_session, monkeypatch):
    _point_session_local_at(db_session, monkeypatch)
    _install_boom_route("/__boom_1__")
    try:
        resp = client.get("/__boom_1__")
        assert resp.status_code == 500
        assert resp.json() == {"detail": "Internal Server Error"}
    finally:
        _remove_route("/__boom_1__")


def test_unhandled_exception_is_persisted_to_error_log(client, db_session, monkeypatch):
    _point_session_local_at(db_session, monkeypatch)
    _install_boom_route("/__boom_2__")
    try:
        client.get("/__boom_2__")
    finally:
        _remove_route("/__boom_2__")

    entry = db_session.query(models.ErrorLog).filter(models.ErrorLog.path == "/__boom_2__").first()
    assert entry is not None
    assert entry.method == "GET"
    assert entry.error_type == "ValueError"
    assert entry.message == "kaboom"
    assert "kaboom" in entry.traceback
    assert entry.user_id is None


def test_unhandled_exception_records_authenticated_user(client, db_session, make_user, monkeypatch):
    _point_session_local_at(db_session, monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    _install_boom_route("/__boom_3__")
    try:
        client.get("/__boom_3__", headers=auth_headers(seeker))
    finally:
        _remove_route("/__boom_3__")

    entry = db_session.query(models.ErrorLog).filter(models.ErrorLog.path == "/__boom_3__").first()
    assert entry is not None
    assert entry.user_id == seeker.id


def test_admin_error_logs_requires_admin(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.get("/admin/error-logs", headers=auth_headers(seeker))
    assert resp.status_code == 403


def test_admin_error_logs_lists_and_filters(client, db_session, make_user):
    admin = make_user(models.UserRole.ADMIN)
    db_session.add(models.ErrorLog(
        method="GET", path="/consultations/123", error_type="KeyError",
        message="'astrologer_id'", traceback="Traceback...",
    ))
    db_session.add(models.ErrorLog(
        method="POST", path="/payment/order", error_type="ValueError",
        message="bad amount", traceback="Traceback...",
    ))
    db_session.commit()

    resp = client.get("/admin/error-logs", headers=auth_headers(admin))
    assert resp.status_code == 200
    assert resp.json()["total"] == 2

    resp = client.get("/admin/error-logs", headers=auth_headers(admin), params={"error_type": "KeyError"})
    body = resp.json()
    assert body["total"] == 1
    assert body["logs"][0]["path"] == "/consultations/123"

    resp = client.get("/admin/error-logs", headers=auth_headers(admin), params={"path": "payment"})
    assert resp.json()["total"] == 1
