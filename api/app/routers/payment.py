from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .. import models, schemas, database, audit
from .auth import get_current_user, get_current_admin
from ..services.wallet_limits import get_wallet_cap
import razorpay
import hmac
import hashlib
import json
from decimal import Decimal
from pydantic import BaseModel

router = APIRouter(
    prefix="/payment",
    tags=["Payment"]
)

# Razorpay credentials are admin-configurable (test vs. live key pair) via
# /admin/settings > Razorpay Payment Gateway, backed by settings_service —
# see DEFAULTS there for the env vars that seed each key on first run. Read
# per-request (not at import time) so an admin flipping "razorpay_mode" takes
# effect without a redeploy.

# Reviewer test accounts (see api/create_test_accounts.py) must never be
# charged real money, even while the platform-wide mode is "live" — they
# always order under the test key pair regardless of the admin setting.
TEST_MODE_FORCED_EMAILS = {"seeker1@aadikarta.org", "seeker2@aadikarta.org"}


def get_razorpay_mode(user: models.User | None = None) -> str:
    """The key pair currently selected for new orders: 'test' or 'live'."""
    if user is not None and user.email in TEST_MODE_FORCED_EMAILS:
        return "test"
    from ..services.settings_service import get_setting
    mode = (get_setting("razorpay_mode") or "live").strip().lower()
    return "test" if mode == "test" else "live"


def get_razorpay_keys(mode: str | None = None) -> tuple[str | None, str | None]:
    """The key_id/key_secret pair for `mode` (defaults to the active mode)."""
    from ..services.settings_service import get_setting
    mode = mode or get_razorpay_mode()
    key_id = get_setting(f"razorpay_key_id_{mode}")
    key_secret = get_setting(f"razorpay_key_secret_{mode}")
    return key_id, key_secret


def get_razorpay_client(mode: str | None = None):
    """A Client for `mode` (defaults to the active mode), or None if that mode's keys aren't configured."""
    key_id, key_secret = get_razorpay_keys(mode)
    if not key_id or not key_secret:
        return None
    return razorpay.Client(auth=(key_id, key_secret))

class OrderCreate(BaseModel):
    amount: float # In Rupees

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class RefundRequest(BaseModel):
    amount: float | None = None  # In Rupees. Defaults to the full remaining (unrefunded) amount.
    notes: str | None = None

@router.post("/order")
def create_payment_order(
    order: OrderCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user),
):
    if order.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")

    # Enforce the wallet balance cap before charging the card — checking
    # post-capture (in /verify or the webhook) would leave a seeker's money
    # taken but un-creditable, which is worse than rejecting the top-up here.
    cap = get_wallet_cap(current_user)
    if cap is not None:
        wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == current_user.id).first()
        current_balance = wallet.balance if wallet else Decimal("0")
        if Decimal(str(current_balance)) + Decimal(str(order.amount)) > cap:
            raise HTTPException(
                status_code=400,
                detail=f"This top-up would exceed the maximum wallet balance of ₹{cap} allowed for your account. Please recharge a smaller amount or use it before adding more."
            )

    # Razorpay expects amount in paise (1 INR = 100 paise)
    amount_paise = int(order.amount * 100)

    mode = get_razorpay_mode(current_user)
    key_id, key_secret = get_razorpay_keys(mode)
    client = razorpay.Client(auth=(key_id, key_secret)) if key_id and key_secret else None
    if not client:
        raise HTTPException(
            status_code=503,
            detail=f"Razorpay {mode} keys are not configured. Set them in Admin > Settings > Razorpay Payment Gateway.",
        )

    data = {
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"receipt_user_{current_user.id}",
        # "notes": { "user_id": str(current_user.id) }
    }

    try:
        razorpay_order = client.order.create(data=data)
        db.add(models.PaymentOrder(
            order_id=razorpay_order['id'], user_id=current_user.id,
            amount_paise=razorpay_order['amount'], is_mock=False,
            razorpay_mode=mode,
        ))
        db.commit()
        return {
            "order_id": razorpay_order['id'],
            "amount": razorpay_order['amount'],
            "currency": razorpay_order['currency'],
            "key_id": key_id
        }
    except Exception as e:
        print(f"Error creating Razorpay order: {e}")
        raise HTTPException(status_code=500, detail="Could not create payment order")

@router.post("/verify")
def verify_payment(data: PaymentVerification, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        amount_paid_inr = 0.0

        # Every order is persisted at creation time in POST /payment/order —
        # look it up rather than trusting anything derived from the
        # client-supplied order id string.
        order = db.query(models.PaymentOrder).filter(
            models.PaymentOrder.order_id == data.razorpay_order_id
        ).first()
        if not order:
            raise HTTPException(status_code=400, detail="Unknown order")
        if order.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Order does not belong to this account")
        if order.consumed:
            return {"message": "Payment already processed", "status": "success"}

        # Use the key pair this order was actually created under (recorded at
        # creation time) rather than whatever mode is active *now* — an admin
        # may have flipped test/live in Settings in between.
        order_mode = order.razorpay_mode or get_razorpay_mode()
        _, key_secret = get_razorpay_keys(order_mode)
        client = get_razorpay_client(order_mode)
        if not key_secret or not client:
            raise HTTPException(status_code=500, detail="Razorpay is not configured for this order's mode")

        # Verify Signature
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }

        # client.utility.verify_payment_signature(params_dict) # This method raises error if invalid

        # Manual verification to be extra sure or if client util issues arise
        msg = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
        generated_signature = hmac.new(
            bytes(key_secret, 'utf-8'),
            bytes(msg, 'utf-8'),
            hashlib.sha256
        ).hexdigest()

        if generated_signature != data.razorpay_signature:
             raise HTTPException(status_code=400, detail="Invalid Payment Signature")

        order_details = client.order.fetch(data.razorpay_order_id)
        amount_paid_inr = order_details['amount'] / 100.0

        # Payment Successful -> Update Wallet
        # 1. Check if transaction already recorded (idempotency check using order_id as ref)
        existing_txn = db.query(models.WalletTransaction).filter(models.WalletTransaction.reference_id == data.razorpay_order_id).first()
        if existing_txn:
             return {"message": "Payment already processed", "status": "success"}

        # 2. Get/Create Wallet
        wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == current_user.id).first()
        if not wallet:
            wallet = models.UserWallet(user_id=current_user.id, balance=0.0)
            db.add(wallet)
        
        # 3. Add Balance. wallet.balance is a DECIMAL column, so coerce the float
        # amount to Decimal to avoid `Decimal + float` TypeErrors.
        wallet.balance = (wallet.balance or Decimal("0")) + Decimal(str(amount_paid_inr))
        
        # 4. Record Transaction
        txn = models.WalletTransaction(
            user_id=current_user.id,
            amount=amount_paid_inr,
            transaction_type=models.TransactionType.PAYMENT_GATEWAY,
            description=f"Razorpay Payment: {data.razorpay_payment_id}",
            reference_id=data.razorpay_order_id,
            gateway_payment_id=data.razorpay_payment_id
        )
        db.add(txn)
        order.consumed = True

        try:
            db.commit()
        except IntegrityError:
            # Lost the race to a concurrent request crediting the same order
            # (unique index on reference_id for PAYMENT_GATEWAY transactions) —
            # the other request's credit stands, this one is a no-op.
            db.rollback()
            return {"message": "Payment already processed", "status": "success"}

        # The order-creation cap check already blocks most overages; this
        # only catches the rare race of two concurrent orders each individually
        # under the cap. Money's already captured by Razorpay at this point,
        # so we flag for review rather than reject the credit.
        cap = get_wallet_cap(current_user)
        if cap is not None and wallet.balance > cap:
            audit.log(db, "WALLET_CAP_EXCEEDED", actor_id=current_user.id, resource_type="user",
                      resource_id=current_user.id,
                      details={"balance": float(wallet.balance), "cap": float(cap), "order_id": data.razorpay_order_id})
            db.commit()

        return {"message": "Payment successful", "status": "success", "new_balance": wallet.balance}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Payment Verification Failed: {e}")
        raise HTTPException(status_code=400, detail="Payment verification failed")


@router.post("/razorpay-webhook")
async def razorpay_webhook(request: Request, db: Session = Depends(database.get_db)):
    """
    Server-to-server webhook from Razorpay. Handles payment.captured events
    as a reliable backup to the client-side /verify flow.
    """
    raw_body = await request.body()
    from ..services.settings_service import get_setting
    # Razorpay's test and live dashboards each have their own webhook secret;
    # accept either since we don't know which mode fired this event until
    # after the signature is verified.
    webhook_secrets = [
        s for s in (get_setting("razorpay_webhook_secret_live"), get_setting("razorpay_webhook_secret_test"))
        if s
    ]
    if not webhook_secrets:
        raise RuntimeError("Razorpay webhook secret is not configured.")

    received_sig = request.headers.get("X-Razorpay-Signature", "")
    signature_valid = any(
        hmac.compare_digest(
            hmac.new(s.encode("utf-8"), raw_body, hashlib.sha256).hexdigest(),
            received_sig,
        )
        for s in webhook_secrets
    )
    if not signature_valid:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        payload = json.loads(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = payload.get("event")
    if event != "payment.captured":
        return {"status": "ignored", "event": event}

    payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    order_id = payment_entity.get("order_id")
    payment_id = payment_entity.get("id")
    amount_paise = payment_entity.get("amount", 0)
    notes = payment_entity.get("notes", {})
    user_id = notes.get("user_id")

    if not order_id or not user_id:
        return {"status": "skipped", "reason": "missing order_id or user_id in notes"}

    # Idempotency: skip if already credited
    existing = db.query(models.WalletTransaction).filter(
        models.WalletTransaction.reference_id == order_id
    ).first()
    if existing:
        return {"status": "already_processed"}

    amount_inr = amount_paise / 100.0
    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == int(user_id)).first()
    if not wallet:
        wallet = models.UserWallet(user_id=int(user_id), balance=0.0)
        db.add(wallet)

    wallet.balance = (wallet.balance or Decimal("0")) + Decimal(str(amount_inr))
    txn = models.WalletTransaction(
        user_id=int(user_id),
        amount=amount_inr,
        transaction_type=models.TransactionType.PAYMENT_GATEWAY,
        description=f"Razorpay webhook: {payment_id}",
        reference_id=order_id,
        gateway_payment_id=payment_id
    )
    db.add(txn)
    audit.log(db, "WALLET_TOPPED_UP_VIA_WEBHOOK", resource_type="user", resource_id=user_id,
              details={"amount": amount_inr, "order_id": order_id, "payment_id": payment_id})

    # See /verify: the order-creation cap check already blocks most overages;
    # this only catches the rare race of two concurrent orders. Money's
    # already captured by Razorpay, so flag for review rather than reject.
    credited_user = db.query(models.User).filter(models.User.id == int(user_id)).first()
    cap = get_wallet_cap(credited_user) if credited_user else None
    if cap is not None and wallet.balance > cap:
        audit.log(db, "WALLET_CAP_EXCEEDED", actor_id=int(user_id), resource_type="user",
                  resource_id=user_id,
                  details={"balance": float(wallet.balance), "cap": float(cap), "order_id": order_id})

    try:
        db.commit()
    except IntegrityError:
        # Lost the race to a concurrent /payment/verify (or a webhook retry)
        # crediting the same order — the other request's credit stands.
        db.rollback()
        return {"status": "already_processed"}
    return {"status": "ok"}


@router.post("/refund/{transaction_id}")
def refund_payment(
    transaction_id: int,
    data: RefundRequest,
    db: Session = Depends(database.get_db),
    admin: models.User = Depends(get_current_admin)
):
    """
    Issues a real Razorpay refund (money back to the original card/UPI/etc.)
    for a wallet top-up, e.g. when the top-up itself was erroneous or duplicated.
    This is distinct from a dispute resolution, which only credits the wallet.
    """
    original = db.query(models.WalletTransaction).filter(
        models.WalletTransaction.id == transaction_id
    ).first()
    if not original:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if original.transaction_type != models.TransactionType.PAYMENT_GATEWAY:
        raise HTTPException(status_code=400, detail="Only gateway top-up transactions can be refunded")

    if not original.gateway_payment_id or original.gateway_payment_id.startswith("pay_mock_"):
        raise HTTPException(status_code=400, detail="Mock/test payments cannot be refunded through Razorpay")

    # Refund through whichever key pair (test/live) the original order was
    # placed under, not whatever mode is active now.
    original_order = db.query(models.PaymentOrder).filter(
        models.PaymentOrder.order_id == original.reference_id
    ).first()
    order_mode = original_order.razorpay_mode if original_order else None
    client = get_razorpay_client(order_mode)
    if not client:
        raise HTTPException(status_code=503, detail="Razorpay is not configured for this transaction's mode")

    already_refunded = db.query(models.WalletTransaction).filter(
        models.WalletTransaction.transaction_type == models.TransactionType.PAYMENT_REFUND,
        models.WalletTransaction.reference_id == original.reference_id
    ).all()
    refunded_so_far = sum(abs(t.amount) for t in already_refunded) if already_refunded else Decimal("0")
    remaining = Decimal(str(original.amount)) - refunded_so_far

    refund_amount = Decimal(str(data.amount)) if data.amount is not None else remaining
    if refund_amount <= 0 or refund_amount > remaining:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid refund amount. Remaining refundable: {remaining}"
        )

    amount_paise = int(refund_amount * 100)
    try:
        razorpay_refund = client.payment.refund(original.gateway_payment_id, {
            "amount": amount_paise,
            "speed": "normal",
            "notes": {"reason": data.notes or "Admin-initiated refund", "admin_id": str(admin.id)}
        })
    except Exception as e:
        print(f"Razorpay refund failed: {e}")
        raise HTTPException(status_code=502, detail="Razorpay refund request failed")

    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == original.user_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="User wallet not found")

    # The refunded money leaves via Razorpay regardless of whether the user has
    # already spent the wallet credit, so this can take the balance negative —
    # that's expected and reflects the user now owing the platform.
    wallet.balance = (wallet.balance or Decimal("0")) - refund_amount

    txn = models.WalletTransaction(
        user_id=original.user_id,
        amount=-refund_amount,
        transaction_type=models.TransactionType.PAYMENT_REFUND,
        description=f"Razorpay refund {razorpay_refund['id']} for payment {original.gateway_payment_id}"
                    + (f": {data.notes}" if data.notes else ""),
        reference_id=original.reference_id,
        gateway_payment_id=razorpay_refund['id']
    )
    db.add(txn)
    audit.log(db, "PAYMENT_REFUNDED", actor_id=admin.id, resource_type="wallet_transaction",
              resource_id=transaction_id,
              details={"refund_amount": float(refund_amount), "razorpay_refund_id": razorpay_refund['id'],
                        "user_id": original.user_id})
    db.commit()

    return {
        "status": "success",
        "razorpay_refund_id": razorpay_refund['id'],
        "refunded_amount": float(refund_amount),
        "new_balance": wallet.balance
    }
