import pytest
import os
from datetime import datetime, timedelta
from jose import jwt
from app import models
from tests.conftest import auth_headers
from app.routers.auth import SECRET_KEY, ALGORITHM

# --- Idempotency & Duplicate Request Tests -----------------------------------

def test_idempotency_key_prevents_duplicate_credit(client, make_user):
    seeker = make_user(models.UserRole.SEEKER, balance=0.0)
    admin = make_user(models.UserRole.ADMIN)

    payload = {
        "amount": 100.0,
        "description": "Test credit with idempotency",
        "idempotency_key": "idempotency-key-uuid-12345"
    }

    # First request - should credit the wallet
    resp1 = client.post(
        f"/admin/users/{seeker.id}/wallet/credit",
        headers=auth_headers(admin),
        json=payload
    )
    assert resp1.status_code == 200
    assert resp1.json()["new_balance"] == 100.0

    # Second request with EXACT SAME idempotency_key - should be ignored
    resp2 = client.post(
        f"/admin/users/{seeker.id}/wallet/credit",
        headers=auth_headers(admin),
        json=payload
    )
    assert resp2.status_code == 200
    assert "already applied" in resp2.json()["message"]
    assert resp2.json()["new_balance"] == 100.0

    # Verify seeker's balance remained 100.0 (not 200.0)
    bal_res = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert bal_res.status_code == 200
    assert float(bal_res.json()["balance"]) == 100.0


# --- JWT Tampering & Signature Tests -----------------------------------------

def test_jwt_expired_token_rejected(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    
    # Generate expired token (expired 10 minutes ago)
    expired_time = datetime.utcnow() - timedelta(minutes=10)
    expired_token = jwt.encode(
        {"sub": str(seeker.id), "exp": expired_time},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    resp = client.get("/wallet/balance", headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401
    assert "Could not validate credentials" in resp.json()["detail"]


def test_jwt_invalid_signature_rejected(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    
    # Sign token with forged key
    forged_token = jwt.encode(
        {"sub": str(seeker.id), "exp": datetime.utcnow() + timedelta(minutes=15)},
        "forged_secret_key_12345",
        algorithm=ALGORITHM
    )

    resp = client.get("/wallet/balance", headers={"Authorization": f"Bearer {forged_token}"})
    assert resp.status_code == 401
    assert "Could not validate credentials" in resp.json()["detail"]


def test_jwt_altered_sub_rejected(client):
    # Valid token with non-existent user_id sub
    non_existent_token = jwt.encode(
        {"sub": "9999999", "exp": datetime.utcnow() + timedelta(minutes=15)},
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    resp = client.get("/wallet/balance", headers={"Authorization": f"Bearer {non_existent_token}"})
    assert resp.status_code == 401
    assert "Could not validate credentials" in resp.json()["detail"]


# --- Wallet Limit Edge Cases -------------------------------------------------

def test_wallet_credit_negative_balance_rejected(client, make_user):
    seeker = make_user(models.UserRole.SEEKER, balance=10.0)
    admin = make_user(models.UserRole.ADMIN)

    # Attempt debit larger than current balance
    resp = client.post(
        f"/admin/users/{seeker.id}/wallet/credit",
        headers=auth_headers(admin),
        json={"amount": -50.0, "description": "Over-debit test"}
    )
    assert resp.status_code == 400
    assert "negative balance" in resp.json()["detail"]


def test_wallet_credit_exceeds_max_cap_rejected(client, make_user):
    seeker = make_user(models.UserRole.SEEKER, balance=0.0)
    admin = make_user(models.UserRole.ADMIN)

    # Attempt crediting massive amount exceeding wallet cap
    resp = client.post(
        f"/admin/users/{seeker.id}/wallet/credit",
        headers=auth_headers(admin),
        json={"amount": 100000000.0, "description": "Exceed cap test"}
    )
    assert resp.status_code == 400
    assert "maximum wallet balance" in resp.json()["detail"]
