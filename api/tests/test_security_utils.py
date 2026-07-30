import pytest
from fastapi import HTTPException
from app.security_utils import validate_password_strength, sanitize_input_string
from app import models
from tests.conftest import auth_headers

# --- Password Strength Tests --------------------------------------------------

def test_password_strength_valid():
    # Strong password should pass without raising HTTPException
    validate_password_strength("StrongP@ss1")

def test_password_strength_too_short():
    with pytest.raises(HTTPException) as exc:
        validate_password_strength("Short1A")
    assert exc.value.status_code == 400
    assert "at least 8 characters" in exc.value.detail

def test_password_strength_no_uppercase():
    with pytest.raises(HTTPException) as exc:
        validate_password_strength("lowercase1!")
    assert exc.value.status_code == 400
    assert "uppercase" in exc.value.detail

def test_password_strength_no_lowercase():
    with pytest.raises(HTTPException) as exc:
        validate_password_strength("UPPERCASE1!")
    assert exc.value.status_code == 400
    assert "lowercase" in exc.value.detail

def test_password_strength_no_digit():
    with pytest.raises(HTTPException) as exc:
        validate_password_strength("NoDigitsHere!")
    assert exc.value.status_code == 400
    assert "number" in exc.value.detail


# --- Input Sanitization Tests ------------------------------------------------

def test_sanitize_input_string_strips_script_tags():
    raw_input = "<script>alert('xss')</script>Hello World"
    sanitized = sanitize_input_string(raw_input)
    assert sanitized == "Hello World"

def test_sanitize_input_string_strips_control_characters():
    raw_input = "Clean\x00Text\x08With\x1FControl\x7FChars"
    sanitized = sanitize_input_string(raw_input)
    assert sanitized == "CleanTextWithControlChars"

def test_sanitize_input_string_truncates_length():
    long_input = "a" * 100
    sanitized = sanitize_input_string(long_input, max_length=10)
    assert len(sanitized) == 10
    assert sanitized == "a" * 10


# --- Authorization & CSRF Middleware Tests -----------------------------------

def test_seeker_cannot_access_admin_endpoint(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    response = client.get("/admin/users", headers=auth_headers(seeker))
    assert response.status_code == 403

def test_csrf_middleware_blocks_unauthenticated_post_without_token(client):
    # Set csrf_token cookie, but omit X-CSRF-Token header on POST request to non-exempt route
    client.cookies.set("csrf_token", "valid_cookie_token")
    response = client.post(
        "/wallet/add-money",
        json={"user_id": 1, "amount": 10},
        headers={"X-CSRF-Token": "invalid_header_token"}
    )
    assert response.status_code == 403
    assert "CSRF token validation failed" in response.json()["detail"]
