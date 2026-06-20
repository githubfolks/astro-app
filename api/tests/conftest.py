"""Shared pytest fixtures for the API test suite.

These tests run the real FastAPI app against an in-memory SQLite database with a
no-op email sender and rate limiting disabled, so the full request/response
contract is exercised without touching Postgres, Redis or the mail provider.
"""
import os

# The app reads these at import time and refuses to start without JWT_SECRET_KEY,
# so they must be set before importing anything under `app`. The SQLite URL keeps
# database.py's module-level engine harmless; every request uses the overridden
# session below instead.
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("SQLALCHEMY_DATABASE_URL", "sqlite://")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app  # registers all models + routers on import
from app import database, models
from app.limiter import limiter
from app.routers.auth import create_access_token, get_password_hash
from app.services import email_service

# A single in-memory SQLite database shared across connections for the test run.
engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(autouse=True)
def _disable_rate_limit():
    """slowapi keys limits by client IP; all test requests share one address, so
    multi-step flows would trip the limiter. Disable it for the duration."""
    previously_enabled = limiter.enabled
    limiter.enabled = False
    yield
    limiter.enabled = previously_enabled


@pytest.fixture
def db_session():
    """Fresh schema per test, dropped afterwards for isolation."""
    database.Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        database.Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_session, monkeypatch):
    """TestClient wired to the test DB session with email delivery stubbed out.

    Note: we intentionally do NOT use `with TestClient(app)` — the lifespan
    startup hook calls create_all on the real Postgres engine and spawns Redis /
    background billing loops, none of which we want in unit tests.
    """
    monkeypatch.setattr(email_service, "send_email", lambda *args, **kwargs: None)

    def override_get_db():
        yield db_session

    app.dependency_overrides[database.get_db] = override_get_db

    # Use an https base_url so the Secure csrf_token cookie is actually stored by
    # the client (it's set with secure=True, samesite=None).
    test_client = TestClient(app, base_url="https://testserver")
    # The app's CSRF middleware requires non-exempt POST/PUT/DELETE requests to echo
    # the csrf_token cookie in an X-CSRF-Token header (the browser does this via
    # document.cookie). Prime it once so tests exercise real auth logic rather than
    # tripping CSRF. A GET to any path gets the cookie set on the response.
    test_client.get("/__csrf_prime__")
    csrf = test_client.cookies.get("csrf_token")
    if csrf:
        test_client.headers.update({"X-CSRF-Token": csrf})

    yield test_client
    app.dependency_overrides.clear()


def auth_headers(user):
    """Bearer-token header for an existing user (matches the /login token shape)."""
    token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def make_user(db_session):
    """Factory that creates a verified user (with wallet/profile) directly in the DB.

    Returns the User model. Bypasses the signup/verify flow so money-path tests
    can focus on their own logic. Use auth_headers(user) for authenticated calls.
    """
    counter = {"n": 0}

    def _make(role=models.UserRole.SEEKER, *, full_name=None, fee=10.0, balance=0.0):
        counter["n"] += 1
        n = counter["n"]
        user = models.User(
            email=f"user{n}@example.com",
            phone_number=f"90000000{n:02d}",
            hashed_password=get_password_hash("Sup3r$ecret!"),
            role=role,
            is_verified=True,
        )
        db_session.add(user)
        db_session.commit()
        db_session.refresh(user)

        if role == models.UserRole.SEEKER:
            db_session.add(models.SeekerProfile(user_id=user.id, full_name=full_name))
            db_session.add(models.UserWallet(user_id=user.id, balance=balance))
        elif role == models.UserRole.ASTROLOGER:
            db_session.add(models.AstrologerProfile(
                user_id=user.id,
                full_name=full_name or "Astro Test",
                consultation_fee_per_min=fee,
            ))
            db_session.add(models.UserWallet(user_id=user.id, balance=balance))
        db_session.commit()
        db_session.refresh(user)
        return user

    return _make
