from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from .. import models, schemas, database, audit
from .auth import get_current_user, get_current_admin
import razorpay
import uuid
import os
import hmac
import hashlib
import json
from decimal import Decimal
from pydantic import BaseModel

router = APIRouter(
    prefix="/payment",
    tags=["Payment"]
)

# Initialize Razorpay Client
# Access credentials from environment variables. The project's .env uses the
# RZP_KEY_ID / RZP_KEY_SECRET names; RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are
# also accepted for compatibility with Razorpay's own docs/tooling.
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID") or os.getenv("RZP_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET") or os.getenv("RZP_KEY_SECRET")

def mock_payments_enabled() -> bool:
    # Admin-toggleable via /admin/settings (settings_service caches for ~30s,
    # not a hard restart, so flipping it takes effect almost immediately).
    from ..services.settings_service import get_setting
    return (get_setting("enable_mock_payments") or "").strip().lower() == "true"

if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    print("WARNING: Razorpay keys not found in environment variables.")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None

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

    # Razorpay expects amount in paise (1 INR = 100 paise)
    amount_paise = int(order.amount * 100)

    # Mock Mode: explicit opt-in via the admin-toggleable "enable_mock_payments"
    # setting, or automatic fallback when no live keys are configured at all.
    if mock_payments_enabled() or not client:
        order_id = f"order_mock_{amount_paise}_{uuid.uuid4().hex[:10]}"
        db.add(models.PaymentOrder(
            order_id=order_id, user_id=current_user.id, amount_paise=amount_paise, is_mock=True,
        ))
        db.commit()
        return {
            "order_id": order_id,
            "amount": amount_paise,
            "currency": "INR",
            "key_id": "mock_key"
        }

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
        ))
        db.commit()
        return {
            "order_id": razorpay_order['id'],
            "amount": razorpay_order['amount'],
            "currency": razorpay_order['currency'],
            "key_id": RAZORPAY_KEY_ID
        }
    except Exception as e:
        print(f"Error creating Razorpay order: {e}")
        raise HTTPException(status_code=500, detail="Could not create payment order")

@router.post("/verify")
def verify_payment(data: PaymentVerification, db: Session = Depends(database.get_db), current_user: models.User = Depends(get_current_user)):
    try:
        amount_paid_inr = 0.0

        # Every order (mock or real) is persisted at creation time in
        # POST /payment/order — look it up rather than trusting anything
        # derived from the client-supplied order id string.
        order = db.query(models.PaymentOrder).filter(
            models.PaymentOrder.order_id == data.razorpay_order_id
        ).first()
        if not order:
            raise HTTPException(status_code=400, detail="Unknown order")
        if order.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Order does not belong to this account")
        if order.consumed:
            return {"message": "Payment already processed", "status": "success"}

        # Check if Mock Order
        if data.razorpay_order_id.startswith("order_mock_"):
            if not mock_payments_enabled():
                raise HTTPException(status_code=400, detail="Mock payments are disabled in this environment")
            print(f"Processing Mock Payment: {data.razorpay_order_id}")
            amount_paid_inr = order.amount_paise / 100.0

        else:
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
                bytes(RAZORPAY_KEY_SECRET, 'utf-8'),
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
            description=f"Razorpay Payment: {data.razorpay_payment_id} {'(MOCK)' if data.razorpay_order_id.startswith('order_mock') else ''}",
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
    webhook_secret = os.getenv("RAZORPAY_WEBHOOK_SECRET")
    if not webhook_secret:
        raise RuntimeError("RAZORPAY_WEBHOOK_SECRET is not configured.")

    received_sig = request.headers.get("X-Razorpay-Signature", "")
    expected_sig = hmac.new(
        webhook_secret.encode("utf-8"),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    if not hmac.compare_digest(expected_sig, received_sig):
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
    if not client:
        raise HTTPException(status_code=503, detail="Razorpay is not configured")

    original = db.query(models.WalletTransaction).filter(
        models.WalletTransaction.id == transaction_id
    ).first()
    if not original:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if original.transaction_type != models.TransactionType.PAYMENT_GATEWAY:
        raise HTTPException(status_code=400, detail="Only gateway top-up transactions can be refunded")

    if not original.gateway_payment_id or original.gateway_payment_id.startswith("pay_mock_"):
        raise HTTPException(status_code=400, detail="Mock/test payments cannot be refunded through Razorpay")

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
