"""Tests for admin-configured wallet bonus recharge packages and their wiring
into the payment order/verify/webhook flow (see routers/wallet_packages.py
and the wallet_package_id handling in routers/payment.py)."""
import hashlib
import hmac as hmac_lib
import json as json_lib
from decimal import Decimal
from app import models
from app.routers import payment as payment_router
from tests.conftest import auth_headers
from tests.test_payment import _FakeRazorpayClient, _use_fake_razorpay, _signed_verify_body

FAKE_KEY_SECRET = "fake_secret"


def _create_package(db_session, amount=500, bonus_amount=50, is_active=True):
    pkg = models.WalletPackage(amount=Decimal(str(amount)), bonus_amount=Decimal(str(bonus_amount)), is_active=is_active)
    db_session.add(pkg)
    db_session.commit()
    db_session.refresh(pkg)
    return pkg


def test_list_wallet_packages_is_public_and_active_only(client, db_session):
    active = _create_package(db_session, amount=500, bonus_amount=50)
    _create_package(db_session, amount=1000, bonus_amount=150, is_active=False)

    resp = client.get("/wallet-packages/")
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["id"] == active.id
    assert float(body[0]["amount"]) == 500
    assert float(body[0]["bonus_amount"]) == 50


def test_create_wallet_package_requires_admin(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/wallet-packages/", headers=auth_headers(seeker), json={"amount": 500, "bonus_amount": 50})
    assert resp.status_code == 403


def test_create_wallet_package_rejects_negative_bonus(client, make_user):
    admin = make_user(models.UserRole.ADMIN)
    resp = client.post("/wallet-packages/", headers=auth_headers(admin), json={"amount": 500, "bonus_amount": -10})
    assert resp.status_code == 400


def test_admin_can_create_update_and_deactivate_package(client, make_user):
    admin = make_user(models.UserRole.ADMIN)

    create_resp = client.post("/wallet-packages/", headers=auth_headers(admin), json={"amount": 500, "bonus_amount": 50})
    assert create_resp.status_code == 200
    pkg_id = create_resp.json()["id"]

    update_resp = client.patch(f"/wallet-packages/{pkg_id}", headers=auth_headers(admin), json={"bonus_amount": 75})
    assert update_resp.status_code == 200
    assert float(update_resp.json()["bonus_amount"]) == 75

    admin_list = client.get("/wallet-packages/admin", headers=auth_headers(admin))
    assert admin_list.status_code == 200
    assert len(admin_list.json()) == 1

    delete_resp = client.delete(f"/wallet-packages/{pkg_id}", headers=auth_headers(admin))
    assert delete_resp.status_code == 200

    public_list = client.get("/wallet-packages/")
    assert public_list.json() == []


def test_order_with_package_uses_server_side_amount_not_client_amount(client, make_user, db_session, monkeypatch):
    """A tampered client-supplied `amount` must never override the package's
    real price — the whole point of snapshotting server-side."""
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    pkg = _create_package(db_session, amount=500, bonus_amount=50)

    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 1, "wallet_package_id": pkg.id})
    assert resp.status_code == 200
    assert resp.json()["amount"] == 50000  # 500 INR in paise, not the tampered 1

    order = db_session.query(models.PaymentOrder).filter(models.PaymentOrder.order_id == resp.json()["order_id"]).first()
    assert order.wallet_package_id == pkg.id
    assert float(order.bonus_amount) == 50


def test_order_rejects_inactive_or_unknown_package(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    inactive = _create_package(db_session, amount=500, bonus_amount=50, is_active=False)

    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 500, "wallet_package_id": inactive.id})
    assert resp.status_code == 404

    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 500, "wallet_package_id": 999999})
    assert resp.status_code == 404


def test_order_without_package_has_zero_bonus(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 200})
    assert resp.status_code == 200
    order = db_session.query(models.PaymentOrder).filter(models.PaymentOrder.order_id == resp.json()["order_id"]).first()
    assert order.wallet_package_id is None
    assert float(order.bonus_amount) == 0


def test_verify_credits_amount_plus_bonus_as_separate_transactions(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    pkg = _create_package(db_session, amount=500, bonus_amount=50)

    order_resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 500, "wallet_package_id": pkg.id})
    order_id = order_resp.json()["order_id"]

    verify_resp = client.post("/payment/verify", headers=auth_headers(seeker), json=_signed_verify_body(order_id))
    assert verify_resp.status_code == 200
    assert float(verify_resp.json()["new_balance"]) == 550  # 500 paid + 50 bonus

    bal = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert float(bal.json()["balance"]) == 550

    txns = db_session.query(models.WalletTransaction).filter(models.WalletTransaction.reference_id == order_id).all()
    types = {t.transaction_type: float(t.amount) for t in txns}
    assert types[models.TransactionType.PAYMENT_GATEWAY] == 500
    assert types[models.TransactionType.WALLET_BONUS] == 50


def test_verify_without_package_credits_only_paid_amount(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    order_resp = client.post("/payment/order", headers=auth_headers(seeker), json={"amount": 200})
    order_id = order_resp.json()["order_id"]

    verify_resp = client.post("/payment/verify", headers=auth_headers(seeker), json=_signed_verify_body(order_id))
    assert float(verify_resp.json()["new_balance"]) == 200

    txns = db_session.query(models.WalletTransaction).filter(models.WalletTransaction.reference_id == order_id).all()
    assert len(txns) == 1
    assert txns[0].transaction_type == models.TransactionType.PAYMENT_GATEWAY


def test_webhook_credits_amount_plus_bonus(client, make_user, db_session, monkeypatch):
    from app.services import settings_service

    seeker = make_user(models.UserRole.SEEKER)
    pkg = _create_package(db_session, amount=500, bonus_amount=50)
    order = models.PaymentOrder(
        order_id="order_wh_bonus_1", user_id=seeker.id, amount_paise=50000, is_mock=False,
        razorpay_mode="test", wallet_package_id=pkg.id, bonus_amount=pkg.bonus_amount,
    )
    db_session.add(order)
    db_session.commit()

    secret = "whsec_test"
    monkeypatch.setattr(settings_service, "get_setting", lambda key: secret if key == "razorpay_webhook_secret_test" else None)

    payload = {
        "event": "payment.captured",
        "payload": {"payment": {"entity": {
            "id": "pay_wh_bonus_1",
            "order_id": "order_wh_bonus_1",
            "amount": 50000,
            "notes": {},
        }}},
    }
    raw_body = json_lib.dumps(payload).encode("utf-8")
    sig = hmac_lib.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()

    resp = client.post(
        "/payment/razorpay-webhook",
        content=raw_body,
        headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"

    bal = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert float(bal.json()["balance"]) == 550

    db_session.refresh(order)
    assert order.consumed is True
