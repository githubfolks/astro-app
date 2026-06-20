"""Tests for the wallet money-path: balance, admin credit, transaction history,
and the auth/authorization rules that protect them."""
from app import models
from tests.conftest import auth_headers


def test_balance_requires_auth(client):
    assert client.get("/wallet/balance").status_code == 401


def test_new_seeker_starts_with_zero_balance(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert resp.status_code == 200
    assert float(resp.json()["balance"]) == 0.0


def test_admin_can_credit_wallet(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    admin = make_user(models.UserRole.ADMIN)

    resp = client.post(
        "/wallet/add-money",
        headers=auth_headers(admin),
        json={
            "user_id": seeker.id,
            "amount": "150.00",
            "transaction_type": "DEPOSIT",
            "description": "Test credit",
        },
    )
    assert resp.status_code == 200
    assert float(resp.json()["balance"]) == 150.0

    # Balance is reflected on the seeker's own balance endpoint.
    bal = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert float(bal.json()["balance"]) == 150.0


def test_non_admin_cannot_credit_wallet(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    other = make_user(models.UserRole.SEEKER)
    resp = client.post(
        "/wallet/add-money",
        headers=auth_headers(seeker),
        json={"user_id": other.id, "amount": "100.00", "transaction_type": "DEPOSIT"},
    )
    assert resp.status_code == 403


def test_credit_rejects_non_positive_amount(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    admin = make_user(models.UserRole.ADMIN)
    resp = client.post(
        "/wallet/add-money",
        headers=auth_headers(admin),
        json={"user_id": seeker.id, "amount": "0", "transaction_type": "DEPOSIT"},
    )
    assert resp.status_code == 400


def test_credit_records_transaction_history(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    admin = make_user(models.UserRole.ADMIN)
    client.post(
        "/wallet/add-money",
        headers=auth_headers(admin),
        json={"user_id": seeker.id, "amount": "75.00", "transaction_type": "DEPOSIT"},
    )

    txns = client.get("/wallet/transactions", headers=auth_headers(seeker))
    assert txns.status_code == 200
    body = txns.json()
    assert len(body) == 1
    assert float(body[0]["amount"]) == 75.0
    assert body[0]["transaction_type"] == "DEPOSIT"


def test_transactions_are_isolated_per_user(client, make_user):
    seeker_a = make_user(models.UserRole.SEEKER)
    seeker_b = make_user(models.UserRole.SEEKER)
    admin = make_user(models.UserRole.ADMIN)
    client.post(
        "/wallet/add-money",
        headers=auth_headers(admin),
        json={"user_id": seeker_a.id, "amount": "10.00", "transaction_type": "DEPOSIT"},
    )
    # seeker_b must not see seeker_a's transactions.
    txns = client.get("/wallet/transactions", headers=auth_headers(seeker_b))
    assert txns.json() == []
