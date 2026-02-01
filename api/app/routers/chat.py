from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import models, schemas, database
from .auth import get_current_user, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
import asyncio
import json
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)

class ConnectionManager:
    def __init__(self):
        # Map consultation_id -> List of {ws, role, user_id}
        self.active_connections: dict[int, list[dict]] = {}

    async def connect(self, websocket: WebSocket, consultation_id: int, user: models.User):
        await websocket.accept()
        if consultation_id not in self.active_connections:
            self.active_connections[consultation_id] = []
        
        self.active_connections[consultation_id].append({
            "ws": websocket,
            "role": user.role,
            "user_id": user.id
        })
        logger.info(f"User {user.id} ({user.role}) connected to chat {consultation_id}")

    def disconnect(self, websocket: WebSocket, consultation_id: int):
        if consultation_id in self.active_connections:
            self.active_connections[consultation_id] = [c for c in self.active_connections[consultation_id] if c["ws"] != websocket]
            if not self.active_connections[consultation_id]:
                del self.active_connections[consultation_id]

    async def broadcast(self, consultation_id: int, message: dict):
        if consultation_id in self.active_connections:
            for connection in self.active_connections[consultation_id]:
                try:
                    await connection["ws"].send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message: {e}")

manager = ConnectionManager()

async def get_user_from_token(token: str, db: Session):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
    except JWTError:
        return None
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    return user

from ..redis_client import get_redis
from ..notifications import send_push_notification

async def billing_loop(consultation_id: int, rate_per_min: float, db_session_maker):
    """
    Background task to deduct balance every minute while chat is ACTIVE.
    Uses Redis for distributed locking to allow crash recovery / ensure single worker.
    """
    logger.info(f"Starting billing loop for {consultation_id}")
    redis = get_redis()
    
    try:
        while True:
            await asyncio.sleep(60) # Wait 1 minute
            
            # Redis Lock Key for this minute
            # We want to ensure we don't double charge for the same minute globally
            # But simpler: Lock the consultation billing process?
            # Actually, `billing_loop` is spawned per WebSocket connection start on Astro side.
            # If server crashes, this loop dies.
            # If server restarts, we need a mechanism to RESTART this loop.
            # For now, we are improving robustness against multiple loops (race conditions)
            # and ensuring state is consistent.
            
            # Proper "Heartbeat" requires an external worker. 
            # Given current architecture (FastAPI background task), we add locking 
            # to safer if we ever have multiple instances.
            
            lock_key = f"billing_lock:{consultation_id}:{int(datetime.utcnow().timestamp() // 60)}"
            
            if redis:
                # Try to acquire lock for this specific minute
                # nx=True means only set if not exists, ex=70 seconds expiry
                is_locked = redis.set(lock_key, "1", ex=70, nx=True)
                if not is_locked:
                    logger.info(f"Billing for {consultation_id} already processed for this minute. Skipping.")
                    continue
            
            with db_session_maker() as db:
                consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
                
                # Check if still active
                if not consultation or consultation.status != models.ConsultationStatus.ACTIVE:
                    logger.info(f"Billing loop ended for {consultation_id}: Status is {consultation.status}")
                    break
                
                user_wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == consultation.seeker_id).first()
                if not user_wallet:
                    break
                
                # Check Balance
                cost = rate_per_min
                if user_wallet.balance < cost:
                    # End Chat
                    consultation.status = models.ConsultationStatus.AUTO_ENDED
                    consultation.end_time = datetime.utcnow()
                    db.commit()
                    
                    await manager.broadcast(consultation_id, {"type": "CHAT_ENDED", "reason": "insufficient_balance"})
                    break
                
                # Deduct
                user_wallet.balance -= cost
                consultation.total_cost += cost
                consultation.duration_seconds += 60
                
                # Transaction Record
                txn = models.WalletTransaction(
                    user_id=consultation.seeker_id,
                    amount=-cost,
                    transaction_type=models.TransactionType.CHAT_DEDUCTION,
                    reference_id=str(consultation.id),
                    description=f"Chat Deduction for min {int(consultation.duration_seconds/60)}"
                )
                db.add(txn)
                db.commit()
                
                # Notify Balance Update
                await manager.broadcast(consultation_id, {
                    "type": "BALANCE_UPDATE", 
                    "balance": float(user_wallet.balance),
                    "spent": float(consultation.total_cost)
                })
                
    except Exception as e:
        logger.error(f"Billing loop error: {e}")

@router.websocket("/ws/{consultation_id}")
async def websocket_endpoint(websocket: WebSocket, consultation_id: int, token: str = Query(...)):
    # Debug Logging Setup
    # Debug Logging Setup
    def log_debug(msg):
        print(f"WS_DEBUG: {msg}") # Force print to console
        with open("ws_debug.log", "a") as f:
            f.write(f"{datetime.utcnow()} - {msg}\n")

    log_debug(f"NEW CONNECTION: ConsID={consultation_id} TokenPrefix={token[:10]}...")

    # Create a new session for this connection scope
    db = database.SessionLocal()
    
    try:
        user = await get_user_from_token(token, db)
        
        if not user:
            log_debug("REJECT: Invalid Token or User not found")
            await websocket.close(code=4003)
            return

        log_debug(f"USER: ID={user.id} Role={user.role}")

        consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
        if not consultation:
            log_debug("REJECT: Consultation not found")
            await websocket.close(code=4004)
            return
            
        # Verify participant
        if user.id != consultation.seeker_id and user.id != consultation.astrologer_id:
            log_debug(f"REJECT: User not participant. Seeker={consultation.seeker_id} Astro={consultation.astrologer_id}")
            await websocket.close(code=4003)
            return

        log_debug("ACCEPTING CONNECTION")
        await manager.connect(websocket, consultation_id, user)
        log_debug("CONNECTED")
    except Exception as e:
        log_debug(f"EXCEPTION during handshake: {e}")
        await websocket.close(code=4000)
        return

    
    with open("ws_debug.log", "a") as f:
        f.write(f"CONNECTED: User={user.id}\n")
    
    try:
        # Auto-accept if astrologer joins
        if user.role == models.UserRole.ASTROLOGER and consultation.status == models.ConsultationStatus.REQUESTED:
            consultation.status = models.ConsultationStatus.ACCEPTED
            db.commit()
            db.refresh(consultation)

        # Send Initial State
        is_active = consultation.status == models.ConsultationStatus.ACTIVE
        wallet_balance = 0.0
        spent = 0.0
        if consultation.seeker_id:
            u_wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == consultation.seeker_id).first()
            if u_wallet: wallet_balance = float(u_wallet.balance)
        
        if consultation.total_cost:
            spent = float(consultation.total_cost)

        await websocket.send_text(json.dumps({
            "type": "STATE_SYNC",
            "status": consultation.status,
            "timer_active": is_active,
            "balance": wallet_balance,
            "spent": spent
        }))
        
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            msg_type = message_data.get("type")
            
            if msg_type == "MESSAGE":
                content = message_data.get("content")
                
                # Save to DB
                new_msg = models.ChatMessage(
                    consultation_id=consultation_id,
                    sender_id=user.id,
                    message=content
                )
                db.add(new_msg)
                db.commit()
                
                # Check for Timer Start (First Astrologer Message)
                if user.role == models.UserRole.ASTROLOGER and consultation.status == models.ConsultationStatus.ACCEPTED:
                    consultation.status = models.ConsultationStatus.ACTIVE
                    consultation.start_time = datetime.utcnow()
                    db.commit()
                    
                    # Notify Timer Start
                    await manager.broadcast(consultation_id, {"type": "TIMER_STARTED"})
                    
                    # Start Billing Loop
                    asyncio.create_task(billing_loop(consultation_id, float(consultation.rate_per_min), database.SessionLocal))
                
                # Broadcast
                await manager.broadcast(consultation_id, {
                    "type": "NEW_MESSAGE",
                    "id": new_msg.id,
                    "sender_id": user.id,
                    "content": content,
                    "timestamp": str(new_msg.timestamp)
                })

                # Check if recipient is online, if not send Push
                recipient_id = consultation.astrologer_id if user.id == consultation.seeker_id else consultation.seeker_id
                
                is_recipient_online = False
                if consultation_id in manager.active_connections:
                     for conn in manager.active_connections[consultation_id]:
                         if conn["user_id"] == recipient_id:
                             is_recipient_online = True
                             break
                
                if not is_recipient_online:
                    # Fetch Device Token
                    tokens = db.query(models.DeviceToken).filter(models.DeviceToken.user_id == recipient_id).all()
                    for token_obj in tokens:
                        send_push_notification(
                            token=token_obj.fcm_token,
                            title=f"New Message from {user.seeker_profile.full_name if user.role == models.UserRole.SEEKER else user.astrologer_profile.full_name}",
                            body=content[:50] + ("..." if len(content) > 50 else ""),
                            data={"consultation_id": str(consultation_id), "type": "CHAT_MESSAGE"}
                        )
                
            elif msg_type == "END_CHAT":
                consultation.status = models.ConsultationStatus.COMPLETED
                consultation.end_time = datetime.utcnow()
                db.commit()
                await manager.broadcast(consultation_id, {"type": "CHAT_ENDED", "reason": "user_ended"})
                break

    except WebSocketDisconnect:
        manager.disconnect(websocket, consultation_id)
        # Handle Disconnection State
        if user.role == models.UserRole.ASTROLOGER:
             # If Astrologer disconnects, we must pause the timer/billing
             # We need a fresh DB session here as the outer one might be closed or issues
             with database.SessionLocal() as db_disc:
                 cons = db_disc.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
                 if cons and cons.status == models.ConsultationStatus.ACTIVE:
                     cons.status = models.ConsultationStatus.PAUSED
                     db_disc.commit()
                     # Billing loop will auto-exit next minute because status != ACTIVE
                     # Notify Seeker
                     asyncio.create_task(manager.broadcast(consultation_id, {"type": "CONSULTATION_PAUSED", "reason": "astrologer_disconnected"}))

    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        try:
            await websocket.close(code=4000)
        except:
            pass
        manager.disconnect(websocket, consultation_id)
        
    finally:
        db.close()
