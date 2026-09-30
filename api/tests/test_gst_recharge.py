"""GST on wallet recharges: the seeker pays recharge + GST, the wallet is
credited only the recharge amount (plus any package bonus, which carries no
GST), and gateway refunds return the proportional GST on top of the credit."""
import hashlib
import hmac as hmac_lib
import json
from decimal import Decimal

from app import models
from app.routers import payment as payment_router
from app.services import gst as gst_service
from app.services import settings_service
from tests.conftest import auth_headers
from tests.test_payment import _signed_verify_body, _use_fake_razorpay, _FakeOrderAPI


def _set_gst_rate(monkeypatch, value):
    real = gst_service.get_setting
    monkeypatch.setattr(gst_service, "get_setting", lambda key, default=None: value if key == "gst_rate_percent" else real(key, default))


def _order(client, seeker, **body):
    return client.post("/payment/order", headers=auth_headers(seeker), json=body)


def _balance(client, seeker):
    return Decimal(str(client.get("/wallet/balance", headers=auth_headers(seeker)).json()["balance"]))


def test_order_charges_gst_on_top_and_snapshots_breakdown(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    resp = _order(client, seeker, amount=100)
    assert resp.status_code == 200
    body = resp.json()
    assert body["amount"] == 11800
    assert body["base_amount"] == 100.0
    assert body["gst_amount"] == 18.0
    assert body["gst_rate_percent"] == 18.0
    assert body["total_amount"] == 118.0

    order = db_session.query(models.PaymentOrder).filter_by(order_id=body["order_id"]).one()
    assert order.amount_paise == 11800
    assert Decimal(order.base_amount) == Decimal("100.00")
    assert Decimal(order.gst_amount) == Decimal("18.00")
    assert Decimal(order.gst_rate_percent) == Decimal("18")


def test_gst_rounds_half_up_to_paise(client, make_user, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    body = _order(client, seeker, amount=99.99).json()  # 18% of 99.99 = 17.9982
    assert body["gst_amount"] == 18.0
    assert body["amount"] == 11799


def test_gst_rate_comes_from_settings(client, make_user, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    _set_gst_rate(monkeypatch, "5")
    seeker = make_user(models.UserRole.SEEKER)
    body = _order(client, seeker, amount=200).json()
    assert body["gst_amount"] == 10.0
    assert body["amount"] == 21000


def test_invalid_gst_rate_refuses_recharge_without_creating_order(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    _set_gst_rate(monkeypatch, "")
    seeker = make_user(models.UserRole.SEEKER)
    assert _order(client, seeker, amount=100).status_code == 503
    assert db_session.query(models.PaymentOrder).count() == 0


def test_verify_credits_recharge_amount_not_gst(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    order_id = _order(client, seeker, amount=100).json()["order_id"]

    resp = client.post("/payment/verify", headers=auth_headers(seeker), json=_signed_verify_body(order_id))
    assert resp.status_code == 200
    assert _balance(client, seeker) == Decimal("100")

    txn = db_session.query(models.WalletTransaction).filter_by(reference_id=order_id).one()
    assert Decimal(txn.amount) == Decimal("100")
    assert "18.00 GST" in txn.description


def test_package_bonus_is_not_charged_gst(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    pkg = models.WalletPackage(amount=Decimal("500"), bonus_amount=Decimal("50"), is_active=True)
    db_session.add(pkg)
    db_session.commit()

    body = _order(client, seeker, amount=500, wallet_package_id=pkg.id).json()
    assert body["amount"] == 59000  # (500 + 18%) — bonus not taxed
    client.post("/payment/verify", headers=auth_headers(seeker), json=_signed_verify_body(body["order_id"]))
    assert _balance(client, seeker) == Decimal("550")


def test_verify_rejects_gateway_amount_mismatch(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    order_id = _order(client, seeker, amount=100).json()["order_id"]
    _FakeOrderAPI._orders[order_id]["amount"] = 10000  # gateway says ₹100, order expects ₹118

    resp = client.post("/payment/verify", headers=auth_headers(seeker), json=_signed_verify_body(order_id))
    assert resp.status_code == 400
    assert _balance(client, seeker) == Decimal("0")
    assert db_session.query(models.AuditLog).filter_by(action="PAYMENT_AMOUNT_MISMATCH").count() == 1


def test_pre_gst_order_still_credits_full_amount_paid(client, make_user, db_session, monkeypatch):
    """Orders created before this change have no base_amount; an in-flight one
    completing after deploy must credit what was paid, as it always did."""
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    _FakeOrderAPI._orders["order_legacy_1"] = {"id": "order_legacy_1", "amount": 10000, "currency": "INR"}
    db_session.add(models.PaymentOrder(order_id="order_legacy_1", user_id=seeker.id, amount_paise=10000, razorpay_mode="test"))
    db_session.commit()

    resp = client.post("/payment/verify", headers=auth_headers(seeker), json=_signed_verify_body("order_legacy_1"))
    assert resp.status_code == 200
    assert _balance(client, seeker) == Decimal("100")


def _webhook(client, monkeypatch, order_id, amount_paise, payment_id="pay_wh_1"):
    secret = "whsec_test"
    monkeypatch.setattr(settings_service, "get_setting", lambda key, default=None: secret if key == "razorpay_webhook_secret_test" else None)
    payload = json.dumps({"event": "payment.captured", "payload": {"payment": {"entity": {
        "id": payment_id, "order_id": order_id, "amount": amount_paise, "notes": {},
    }}}}).encode()
    sig = hmac_lib.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return client.post("/payment/razorpay-webhook", content=payload,
                       headers={"X-Razorpay-Signature": sig, "Content-Type": "application/json"})


def test_webhook_credits_recharge_amount_not_gst(client, make_user, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    order_id = _order(client, seeker, amount=100).json()["order_id"]
    resp = _webhook(client, monkeypatch, order_id, 11800)
    assert resp.json()["status"] == "ok"
    assert _balance(client, seeker) == Decimal("100")


def test_webhook_skips_amount_mismatch(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    order_id = _order(client, seeker, amount=100).json()["order_id"]
    resp = _webhook(client, monkeypatch, order_id, 10000)
    assert resp.json()["status"] == "skipped"
    assert _balance(client, seeker) == Decimal("0")
    assert db_session.query(models.AuditLog).filter_by(action="PAYMENT_AMOUNT_MISMATCH").count() == 1


class _CapturingPaymentAPI:
    calls: list = []

    def refund(self, payment_id, data):
        self.calls.append(data["amount"])
        return {"id": f"rfnd_{len(self.calls)}", "amount": data["amount"]}


class _RefundClient:
    def __init__(self):
        self.payment = _CapturingPaymentAPI()


def test_refunds_return_proportional_gst_summing_exactly(client, make_user, db_session, monkeypatch):
    _use_fake_razorpay(monkeypatch)
    seeker = make_user(models.UserRole.SEEKER)
    admin = make_user(models.UserRole.ADMIN)
    order_id = _order(client, seeker, amount=100).json()["order_id"]
    client.post("/payment/verify", headers=auth_headers(seeker), json=_signed_verify_body(order_id, "pay_real_9"))
    txn = db_session.query(models.WalletTransaction).filter_by(reference_id=order_id).one()

    _CapturingPaymentAPI.calls = []
    monkeypatch.setattr(payment_router, "get_razorpay_client", lambda mode=None: _RefundClient())

    first = client.post(f"/payment/refund/{txn.id}", headers=auth_headers(admin), json={"amount": 33.33}).json()
    assert first["refunded_amount"] == 33.33
    assert first["gst_refunded"] == 6.0          # 18 * 33.33/100 = 5.9994 → 6.00
    assert first["gateway_refund_amount"] == 39.33

    second = client.post(f"/payment/refund/{txn.id}", headers=auth_headers(admin), json={}).json()
    assert second["refunded_amount"] == 66.67
    assert second["gst_refunded"] == 12.0

    assert sum(_CapturingPaymentAPI.calls) == 11800  # every paisa the seeker paid, no drift
    assert _balance(client, seeker) == Decimal("0")  # wallet debited only the credit (100)
