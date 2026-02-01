from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from .. import models, schemas, database
from .auth import get_current_user
import razorpay
import uuid
import os
import hmac
import hashlib
from pydantic import BaseModel

router = APIRouter(
    prefix="/payment",
    tags=["Payment"]
)

# Initialize Razorpay Client
# Access credentials from environment variables
# Ensure these are set in your .env or system environment
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

# Check if keys are present (optional logic, or fail hard)
if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
    print("WARNING: Razorpay keys not found in environment variables.")

client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class OrderCreate(BaseModel):
    amount: float # In Rupees

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

@router.post("/order")
def create_payment_order(order: OrderCreate, current_user: models.User = Depends(get_current_user)):
    if order.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    # Razorpay expects amount in paise (1 INR = 100 paise)
    amount_paise = int(order.amount * 100)
    
    # Mock Mode
    if not RAZORPAY_KEY_ID or RAZORPAY_KEY_ID == "mock_key":
        return {
            "order_id": f"order_mock_{uuid.uuid4().hex[:10]}",
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
        
        # Check if Mock Order
        if data.razorpay_order_id.startswith("order_mock_"):
            print(f"Processing Mock Payment: {data.razorpay_order_id}")
            # For mock flow, we default to 100 INR or assumes logic handled handled upstream
            amount_paid_inr = 100.0 # Default test amount
        
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
        
        # 3. Add Balance
        wallet.balance += amount_paid_inr
        
        # 4. Record Transaction
        txn = models.WalletTransaction(
            user_id=current_user.id,
            amount=amount_paid_inr,
            transaction_type=models.TransactionType.PAYMENT_GATEWAY,
            description=f"Razorpay Payment: {data.razorpay_payment_id} {'(MOCK)' if data.razorpay_order_id.startswith('order_mock') else ''}",
            reference_id=data.razorpay_order_id
        )
        db.add(txn)
        
        db.commit()
        
        return {"message": "Payment successful", "status": "success", "new_balance": wallet.balance}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Payment Verification Failed: {e}")
        raise HTTPException(status_code=400, detail="Payment verification failed")
