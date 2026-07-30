"""Tests for the payment money-path against a fake Razorpay client (no network).
Covers order creation, signature verification crediting the wallet, invalid
signatures, ownership checks, idempotency, and refunds."""
import hashlib
import hmac as hmac_lib
from decimal import Decimal
from app import models
from app.routers import payment as payment_router
from tests.conftest import auth_headers

FAKE_KEY_ID = "rzp_test_fake"
FAKE_KEY_SECRET = "fake_secret"


class _FakeOrderAPI:
    # Shared across instances: create_payment_order and verify_payment each
    # construct their own razorpay.Client() (a fresh _FakeRazorpayClient), so
    # an order created in one must still be fetchable from the other.
    _orders: dict = {}

    def create(self, data):
        order_id = f"order_test_{len(self._orders) + 1}"
        order = {"id": order_id, "amount": data["amount"], "currency": data["currency"]}
        self._orders[order_id] = order
        return order

    def fetch(self, order_id):
        return self._orders[order_id]


class _FakePaymentAPI:
    def refund(self, payment_id, data):
        return {"id": "rfnd_test_1", "amount": data["amount"]}


class _FakeRazorpayClient:
    def __init__(self, *args, **kwargs):
        self.order = _FakeOrderAPI()
        self.payment = _FakePaymentAPI()


def _use_fake_razorpay(monkeypatch):
    """Point the module's key lookup + Client construction at fakes, so order
    creation/verification never hits the real Razorpay API."""
    monkeypatch.setattr(payment_router, "get_razorpay_keys", lambda mode=None: (FAKE_KEY_ID, FAKE_KEY_SECRET))
    monkeypatch.setattr(payment_router.razorpay, "Client", _FakeRazorpayClient)


def _signed_verify_body(order_id, payment_id="pay_test_1"):
    msg = f"{order_id}|{payment_id}"
    signature = hmac_lib.new(FAKE_KEY_SECRET.encode(), msg.encode(), hashlib.sha256).hexdigest()
    return {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": signature,
    }


def _create_order(client, seeker, amount=100):
    """/payment/verify requires a PaymentOrder row created via /payment/order
    (rather than trusting an order id string) — tests must create one first."""
    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": amount})
    assert resp.status_code == 200
    return resp.json()["order_id"]


def test_create_order_requires_auth(client):
    assert client.post("/payment/order", json={"amount": 100}).status_code == 401


def test_create_order_rejects_non_positive_amount(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 0})
    assert resp.status_code == 400


def test_create_order_fails_when_keys_not_configured(client, make_user, monkeypatch):
    monkeypatch.setattr(payment_router, "get_razorpay_keys", lambda mode=None: (None, None))
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 100})
    assert resp.status_code == 503


def test_create_order_returns_key_id_from_active_mode(client, make_user, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 100})
    assert resp.status_code == 200
    body = resp.json()
    assert body["amount"] == 10000  # paise
    assert body["key_id"] == FAKE_KEY_ID


def test_verify_credits_wallet(client, make_user, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    order_id = _create_order(client, seeker)

    resp = client.post("/payment/verify", headers=auth_headers(seeker), json=_signed_verify_body(order_id))
    assert resp.status_code == 200
    assert resp.json()["status"] == "success"
    assert float(resp.json()["new_balance"]) == 100.0

    bal = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert float(bal.json()["balance"]) == 100.0


def test_verify_rejects_invalid_signature(client, make_user, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    order_id = _create_order(client, seeker)

    body = _signed_verify_body(order_id)
    body["razorpay_signature"] = "not_the_real_signature"
    resp = client.post("/payment/verify", headers=auth_headers(seeker), json=body)
    assert resp.status_code == 400


def test_verify_rejects_unknown_order(client, make_user, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/verify", headers=auth_headers(seeker), json=_signed_verify_body("order_never_issued"))
    assert resp.status_code == 400


def test_verify_rejects_order_owned_by_another_user(client, make_user, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    owner = make_user(models.UserRole.SEEKER)
    attacker = make_user(models.UserRole.SEEKER)
    order_id = _create_order(client, owner)

    resp = client.post("/payment/verify", headers=auth_headers(attacker), json=_signed_verify_body(order_id))
    assert resp.status_code == 403


def test_verify_is_idempotent(client, make_user, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    order_id = _create_order(client, seeker)
    body = _signed_verify_body(order_id)

    first = client.post("/payment/verify", headers=auth_headers(seeker), json=body)
    assert first.status_code == 200
    second = client.post("/payment/verify", headers=auth_headers(seeker), json=body)
    assert second.status_code == 200
    assert second.json()["message"] == "Payment already processed"

    # Wallet credited only once.
    bal = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert float(bal.json()["balance"]) == 100.0


def test_refund_requires_admin(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/refund/1", headers=auth_headers(seeker), json={})
    assert resp.status_code == 403


def test_refund_credits_back_to_gateway_and_debits_wallet(client, make_user, db_session, monkeypatch):
    monkeypatch.setattr(payment_router, "get_razorpay_client", lambda mode=None: _FakeRazorpayClient())
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
    monkeypatch.setattr(payment_router, "get_razorpay_client", lambda mode=None: _FakeRazorpayClient())
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
    monkeypatch.setattr(payment_router, "get_razorpay_client", lambda mode=None: _FakeRazorpayClient())
    admin = make_user(models.UserRole.ADMIN)
    seeker = make_user(models.UserRole.SEEKER)

    txn = models.WalletTransaction(
        user_id=seeker.id,
        amount=Decimal("100.0"),
        transaction_type=models.TransactionType.PAYMENT_GATEWAY,
        description="Historical mock payment (pre-removal of mock mode)",
        reference_id="order_mock_10000_abc",
        gateway_payment_id="pay_mock_1",
    )
    db_session.add(txn)
    db_session.commit()
    db_session.refresh(txn)

    resp = client.post(f"/payment/refund/{txn.id}", headers=auth_headers(admin), json={})
    assert resp.status_code == 400
