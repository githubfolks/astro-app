"""End-to-end tests for the authentication flow.

Covers signup -> email verification -> login -> forgot-password -> verify-otp ->
reset-password, plus the regressions we fixed: the login error path, the signup
response contract, and the OTP-endpoint account-enumeration leaks.
"""
import pytest

from app import models


# --- helpers -----------------------------------------------------------------

VALID_PASSWORD = "Sup3r$ecret!"
NEW_PASSWORD = "Even$tronger9"


def _signup(client, email="seeker@example.com", phone="9000000001", password=VALID_PASSWORD):
    return client.post(
        "/signup",
        json={"email": email, "phone_number": phone, "password": password, "role": "SEEKER"},
    )


def _latest_otp(db_session, email, verification_type):
    user = db_session.query(models.User).filter(models.User.email == email).first()
    assert user is not None, f"no user for {email}"
    token = (
        db_session.query(models.VerificationToken)
        .filter(
            models.VerificationToken.user_id == user.id,
            models.VerificationToken.verification_type == verification_type,
        )
        .order_by(models.VerificationToken.created_at.desc())
        .first()
    )
    assert token is not None, "no OTP issued"
    return token.token


def _verified_user(client, db_session, email="seeker@example.com", phone="9000000001"):
    """Create and email-verify a SEEKER, returning their credentials."""
    assert _signup(client, email=email, phone=phone).status_code == 200
    otp = _latest_otp(db_session, email, models.VerificationTokenType.EMAIL_VERIFICATION)
    assert client.post("/verify-email", json={"email": email, "otp": otp}).status_code == 200
    return email, VALID_PASSWORD


# --- signup ------------------------------------------------------------------

def test_signup_returns_verification_message_not_token(client):
    """Regression: signup must NOT return access_token/user_id (the frontend used
    to assume it did and broke). It returns a 'check your email' message."""
    resp = _signup(client)
    assert resp.status_code == 200
    body = resp.json()
    assert "message" in body
    assert "access_token" not in body
    assert "verification" in body["message"].lower() or "verify" in body["message"].lower()


def test_signup_duplicate_email_rejected(client):
    assert _signup(client).status_code == 200
    dup = _signup(client, phone="9000000999")  # same email, different phone
    assert dup.status_code == 400


def test_signup_rejects_weak_password(client):
    resp = _signup(client, password="weak")
    assert resp.status_code == 422


def test_signup_rejects_non_seeker_role(client):
    resp = client.post(
        "/signup",
        json={"email": "a@b.com", "phone_number": "9000000002", "password": VALID_PASSWORD, "role": "ASTROLOGER"},
    )
    assert resp.status_code == 400


# --- email verification + login ----------------------------------------------

def test_login_before_verification_is_blocked(client):
    assert _signup(client).status_code == 200
    resp = client.post("/login", data={"username": "seeker@example.com", "password": VALID_PASSWORD})
    assert resp.status_code == 403


def test_full_signup_verify_login_flow(client, db_session):
    email, password = _verified_user(client, db_session)
    resp = client.post("/login", data={"username": email, "password": password})
    assert resp.status_code == 200
    body = resp.json()
    # The login contract the frontend depends on.
    assert body["access_token"]
    assert body["token_type"] == "bearer"
    assert body["role"] == "SEEKER"
    assert "full_name" in body  # present (None until profile completed)


def test_login_wrong_password_returns_401(client, db_session):
    """Regression: wrong credentials must surface as a clean 401 so the login page
    can show an inline error (not get swallowed by the 401 redirect handler)."""
    email, _ = _verified_user(client, db_session)
    resp = client.post("/login", data={"username": email, "password": "WrongPass1!"})
    assert resp.status_code == 401


def test_login_unknown_user_returns_401(client):
    resp = client.post("/login", data={"username": "nobody@example.com", "password": VALID_PASSWORD})
    assert resp.status_code == 401


# --- forgot password: anti-enumeration ---------------------------------------

def test_forgot_password_known_and_unknown_are_indistinguishable(client, db_session):
    """Both a real and a fake email must yield the same status + body so the
    endpoint can't be used to discover which accounts exist."""
    _verified_user(client, db_session)

    known = client.post("/forgot-password", json={"email": "seeker@example.com"})
    unknown = client.post("/forgot-password", json={"email": "ghost@example.com"})

    assert known.status_code == unknown.status_code == 200
    assert known.json() == unknown.json()


def test_verify_otp_unknown_email_returns_generic_400(client):
    """Regression: /verify-otp used to return 404 'User not found' for unknown
    emails, leaking existence. It must now return the same generic 400 as a bad OTP."""
    resp = client.post("/verify-otp", json={"email": "ghost@example.com", "otp": "123456"})
    assert resp.status_code == 400


def test_verify_otp_wrong_otp_returns_400(client, db_session):
    _verified_user(client, db_session)
    client.post("/forgot-password", json={"email": "seeker@example.com"})
    resp = client.post("/verify-otp", json={"email": "seeker@example.com", "otp": "000000"})
    assert resp.status_code == 400


# --- full password reset flow ------------------------------------------------

def test_full_password_reset_flow(client, db_session):
    email, _ = _verified_user(client, db_session)

    assert client.post("/forgot-password", json={"email": email}).status_code == 200
    otp = _latest_otp(db_session, email, models.VerificationTokenType.FORGOT_PASSWORD)

    verify = client.post("/verify-otp", json={"email": email, "otp": otp})
    assert verify.status_code == 200
    reset_token = verify.json()["reset_token"]
    assert reset_token

    reset = client.post("/reset-password", json={"token": reset_token, "new_password": NEW_PASSWORD})
    assert reset.status_code == 200

    # Old password rejected, new password works.
    assert client.post("/login", data={"username": email, "password": VALID_PASSWORD}).status_code == 401
    assert client.post("/login", data={"username": email, "password": NEW_PASSWORD}).status_code == 200


def test_otp_cannot_be_reused(client, db_session):
    email, _ = _verified_user(client, db_session)
    client.post("/forgot-password", json={"email": email})
    otp = _latest_otp(db_session, email, models.VerificationTokenType.FORGOT_PASSWORD)

    assert client.post("/verify-otp", json={"email": email, "otp": otp}).status_code == 200
    # Second use of the same OTP must fail.
    assert client.post("/verify-otp", json={"email": email, "otp": otp}).status_code == 400
