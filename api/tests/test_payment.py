"""Tests for the payment money-path using the built-in Razorpay mock mode
(no network). Covers order creation, mock verification crediting the wallet,
the mock-disabled guard, and idempotency."""
from decimal import Decimal
from app import models
from app.routers import payment as payment_router
from tests.conftest import auth_headers


def _mock_verify_body(order_id="order_mock_abc123"):
    return {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": "pay_mock_1",
        "razorpay_signature": "sig_mock",
    }


def test_create_order_requires_auth(client):
    assert client.post("/payment/order", json={"amount": 100}).status_code == 401


def test_create_order_rejects_non_positive_amount(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 0})
    assert resp.status_code == 400


def test_create_mock_order(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 100})
    assert resp.status_code == 200
    body = resp.json()
    assert body["order_id"].startswith("order_mock_")
    assert body["amount"] == 10000  # paise
    assert body["key_id"] == "mock_key"


def test_mock_verify_credits_wallet(client, make_user, monkeypatch):
    monkeypatch.setenv("ENABLE_MOCK_PAYMENTS", "true")
    seeker = make_user(models.UserRole.SEEKER)

    resp = client.post("/payment/verify", headers=auth_headers(seeker), json=_mock_verify_body())
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
    assert float(resp.json()["new_balance"]) == 100.0

    bal = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert float(bal.json()["balance"]) == 100.0


def test_mock_verify_blocked_when_mock_disabled(client, make_user, monkeypatch):
    monkeypatch.delenv("ENABLE_MOCK_PAYMENTS", raising=False)
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/verify", headers=auth_headers(seeker), json=_mock_verify_body())
    assert resp.status_code == 400


def test_verify_is_idempotent(client, make_user, monkeypatch):
    monkeypatch.setenv("ENABLE_MOCK_PAYMENTS", "true")
    seeker = make_user(models.UserRole.SEEKER)
    body = _mock_verify_body(order_id="order_mock_dup")

    first = client.post("/payment/verify", headers=auth_headers(seeker), json=body)
    assert first.status_code == 200
    second = client.post("/payment/verify", headers=auth_headers(seeker), json=body)
    assert second.status_code == 200
    assert second.json()["message"] == "Payment already processed"

    # Wallet credited only once.
    bal = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert float(bal.json()["balance"]) == 100.0


class _FakePaymentAPI:
    def refund(self, payment_id, data):
        return {"id": "rfnd_test_1", "amount": data["amount"]}


class _FakeRazorpayClient:
    payment = _FakePaymentAPI()


def test_refund_requires_admin(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/refund/1", headers=auth_headers(seeker), json={})
    assert resp.status_code == 403


def test_refund_credits_back_to_gateway_and_debits_wallet(client, make_user, db_session, monkeypatch):
    monkeypatch.setattr(payment_router, "client", _FakeRazorpayClient())
    admin = make_user(models.UserRole.ADMIN)
    seeker = make_user(models.UserRole.SEEKER, balance=50.0)

    txn = models.WalletTransaction(
        user_id=seeker.id,
        amount=Decimal("100.0"),
        transaction_type=models.TransactionType.PAYMENT_GATEWAY,
        description="Razorpay Payment: pay_real_123",
        reference_id="order_real_abc",
        gateway_payment_id="pay_real_123",
    )
    db_session.add(txn)
    db_session.commit()
    db_session.refresh(txn)

    resp = client.post(f"/payment/refund/{txn.id}", headers=auth_headers(admin), json={"amount": 40})
    assert resp.status_code == 200
    body = resp.json()
    assert body["refunded_amount"] == 40.0
    assert body["razorpay_refund_id"] == "rfnd_test_1"

    bal = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert float(bal.json()["balance"]) == 10.0  # 50 - 40


def test_refund_cannot_exceed_remaining_amount(client, make_user, db_session, monkeypatch):
    monkeypatch.setattr(payment_router, "client", _FakeRazorpayClient())
    admin = make_user(models.UserRole.ADMIN)
    seeker = make_user(models.UserRole.SEEKER, balance=100.0)

    txn = models.WalletTransaction(
        user_id=seeker.id,
        amount=Decimal("100.0"),
        transaction_type=models.TransactionType.PAYMENT_GATEWAY,
        description="Razorpay Payment: pay_real_456",
        reference_id="order_real_def",
        gateway_payment_id="pay_real_456",
    )
    db_session.add(txn)
    db_session.commit()
    db_session.refresh(txn)

    resp = client.post(f"/payment/refund/{txn.id}", headers=auth_headers(admin), json={"amount": 150})
    assert resp.status_code == 400


def test_refund_blocks_mock_payment(client, make_user, db_session, monkeypatch):
    monkeypatch.setattr(payment_router, "client", _FakeRazorpayClient())
    admin = make_user(models.UserRole.ADMIN)
    seeker = make_user(models.UserRole.SEEKER)

    txn = models.WalletTransaction(
        user_id=seeker.id,
        amount=Decimal("100.0"),
        transaction_type=models.TransactionType.PAYMENT_GATEWAY,
        description="Mock payment",
        reference_id="order_mock_10000_abc",
        gateway_payment_id="pay_mock_1",
    )
    db_session.add(txn)
    db_session.commit()
    db_session.refresh(txn)

    resp = client.post(f"/payment/refund/{txn.id}", headers=auth_headers(admin), json={})
    assert resp.status_code == 400
