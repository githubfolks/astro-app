from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from .. import models, schemas, database, audit
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

@router.get("/history/{consultation_id}", response_model=list[schemas.ChatMessage])
async def get_chat_history(
    consultation_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
    if not consultation:
        raise HTTPException(status_code=404, detail="Consultation not found")
    
    if current_user.id != consultation.seeker_id and current_user.id != consultation.astrologer_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this chat history")
    
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.consultation_id == consultation_id
    ).order_by(models.ChatMessage.timestamp.asc()).all()
    
    return messages

@router.post("/send")
async def send_message(
    data: schemas.ChatMessageCreate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        consultation = db.query(models.Consultation).filter(models.Consultation.id == data.consultation_id).first()
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")
        
        if current_user.id != consultation.seeker_id and current_user.id != consultation.astrologer_id:
            raise HTTPException(status_code=403, detail="Not authorized to participate in this chat")
        
        # Save to DB
        new_msg = models.ChatMessage(
            consultation_id=data.consultation_id,
            sender_id=current_user.id,
            message=data.content
        )
        db.add(new_msg)
        db.commit()
        db.refresh(new_msg)
        
        # Check for Timer Start (First Astrologer Message)
        if current_user.role == models.UserRole.ASTROLOGER and consultation.status == models.ConsultationStatus.ACCEPTED:
            try:
                consultation.status = models.ConsultationStatus.ACTIVE
                consultation.start_time = datetime.utcnow()
                db.commit()
                # Start Billing Loop
                asyncio.create_task(billing_loop(consultation.id, float(consultation.rate_per_min), database.SessionLocal))
                # Broadcast via WS if any
                await manager.broadcast(consultation.id, {"type": "TIMER_STARTED"})
            except Exception as e:
                logger.error(f"Error starting timer: {e}")

        # Broadcast to any active WS connections
        await manager.broadcast(data.consultation_id, {
            "type": "NEW_MESSAGE",
            "id": new_msg.id,
            "sender_id": current_user.id,
            "content": data.content,
            "timestamp": new_msg.timestamp.isoformat() if new_msg.timestamp else datetime.utcnow().isoformat()
        })
        
        # Send Push Notification if recipient is offline
        try:
             recipient_id = consultation.astrologer_id if current_user.id == consultation.seeker_id else consultation.seeker_id
             is_recipient_online = False
             if consultation.id in manager.active_connections:
                  for conn in manager.active_connections[consultation.id]:
                      if conn["user_id"] == recipient_id:
                          is_recipient_online = True
                          break
             
             if not is_recipient_online:
                 tokens = db.query(models.DeviceToken).filter(models.DeviceToken.user_id == recipient_id).all()
                 sender_name = "User"
                 if current_user.role == models.UserRole.SEEKER and current_user.seeker_profile:
                     sender_name = current_user.seeker_profile.full_name or "Seeker"
                 elif current_user.role == models.UserRole.ASTROLOGER and current_user.astrologer_profile:
                     sender_name = current_user.astrologer_profile.full_name or "Astrologer"
                     
                 for token_obj in tokens:
                     send_push_notification(
                         token=token_obj.fcm_token,
                         title=f"New Message from {sender_name}",
                         body=data.content[:50] + ("..." if len(data.content) > 50 else ""),
                         data={"consultation_id": str(consultation.id), "type": "CHAT_MESSAGE"}
                     )
        except Exception as push_err:
             logger.error(f"Push notification error in send_message: {push_err}")

        return {"status": "sent", "message_id": int(new_msg.id)}
    except Exception as e:
        import traceback
        logger.error(f"Error in send_message: {str(e)}\n{traceback.format_exc()}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")

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
    Registers session in Redis so startup recovery can restart the loop after a crash.
    """
    logger.info(f"Starting billing loop for {consultation_id}")
    redis = get_redis()

    # Register this session in Redis for crash recovery
    if redis:
        redis.set(
            f"active_consultation:{consultation_id}",
            json.dumps({"rate_per_min": rate_per_min}),
            ex=86400  # 24 hour TTL as safety net
        )

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
                    logger.info(f"Billing loop ended for {consultation_id}: Status is {consultation.status if consultation else 'NOT_FOUND'}")
                    if redis:
                        redis.delete(f"active_consultation:{consultation_id}")
                    break
                
                consultation.duration_seconds = (consultation.duration_seconds or 0) + 60
                is_package_session = consultation.package_id is not None and (consultation.package_seconds_remaining or 0) > 0

                if is_package_session:
                    # Package billing: deduct 60 seconds from remaining package time
                    pkg_secs = (consultation.package_seconds_remaining or 0) - 60
                    if pkg_secs <= 0:
                        consultation.package_seconds_remaining = 0
                        consultation.status = models.ConsultationStatus.AUTO_ENDED
                        consultation.end_time = datetime.utcnow()
                        audit.log(db, "CHAT_AUTO_ENDED", resource_type="consultation",
                                  resource_id=consultation_id,
                                  details={"reason": "package_time_exhausted", "total_cost": float(consultation.total_cost or 0)})
                        db.commit()
                        if redis:
                            redis.delete(f"active_consultation:{consultation_id}")
                        await manager.broadcast(consultation_id, {"type": "CHAT_ENDED", "reason": "package_time_exhausted"})
                        break

                    consultation.package_seconds_remaining = pkg_secs
                    db.commit()

                    minutes_remaining = pkg_secs / 60
                    await manager.broadcast(consultation_id, {
                        "type": "BALANCE_UPDATE",
                        "balance": 0,  # Wallet not used
                        "spent": float(consultation.total_cost or 0),
                        "minutes_remaining": round(minutes_remaining, 1),
                        "package_seconds_remaining": pkg_secs
                    })

                    if minutes_remaining <= 5:
                        await manager.broadcast(consultation_id, {
                            "type": "BALANCE_WARNING",
                            "balance": 0,
                            "minutes_remaining": round(minutes_remaining, 1),
                            "source": "package"
                        })
                else:
                    # Wallet billing
                    user_wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == consultation.seeker_id).first()
                    if not user_wallet:
                        break

                    cost = rate_per_min
                    if float(user_wallet.balance) < cost:
                        consultation.status = models.ConsultationStatus.AUTO_ENDED
                        consultation.end_time = datetime.utcnow()
                        audit.log(db, "CHAT_AUTO_ENDED", resource_type="consultation",
                                  resource_id=consultation_id,
                                  details={"reason": "insufficient_balance", "total_cost": float(consultation.total_cost or 0)})
                        db.commit()
                        if redis:
                            redis.delete(f"active_consultation:{consultation_id}")
                        await manager.broadcast(consultation_id, {"type": "CHAT_ENDED", "reason": "insufficient_balance"})
                        break

                    user_wallet.balance -= cost
                    consultation.total_cost = (consultation.total_cost or 0) + cost

                    txn = models.WalletTransaction(
                        user_id=consultation.seeker_id,
                        amount=-cost,
                        transaction_type=models.TransactionType.CHAT_DEDUCTION,
                        reference_id=str(consultation.id),
                        description=f"Chat deduction min {int(consultation.duration_seconds / 60)}"
                    )
                    db.add(txn)
                    db.commit()

                    remaining_balance = float(user_wallet.balance)
                    minutes_remaining = remaining_balance / rate_per_min if rate_per_min > 0 else 0
                    await manager.broadcast(consultation_id, {
                        "type": "BALANCE_UPDATE",
                        "balance": remaining_balance,
                        "spent": float(consultation.total_cost),
                        "minutes_remaining": round(minutes_remaining, 1)
                    })

                    if minutes_remaining <= 5:
                        await manager.broadcast(consultation_id, {
                            "type": "BALANCE_WARNING",
                            "balance": remaining_balance,
                            "minutes_remaining": round(minutes_remaining, 1),
                            "source": "wallet"
                        })
                
    except Exception as e:
        logger.error(f"Billing loop error: {e}")
        if redis:
            redis.delete(f"active_consultation:{consultation_id}")

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
        rate = float(consultation.rate_per_min) if consultation.rate_per_min else 0.0
        if consultation.seeker_id:
            u_wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == consultation.seeker_id).first()
            if u_wallet: wallet_balance = float(u_wallet.balance)

        if consultation.total_cost:
            spent = float(consultation.total_cost)

        minutes_remaining = round(wallet_balance / rate, 1) if rate > 0 else 0

        await websocket.send_text(json.dumps({
            "type": "STATE_SYNC",
            "status": consultation.status.value if hasattr(consultation.status, 'value') else consultation.status,
            "timer_active": is_active,
            "balance": wallet_balance,
            "spent": spent,
            "minutes_remaining": minutes_remaining
        }))
        
        # Per-connection rate limiter: max 20 messages per 10 seconds
        _rate_window_start = datetime.utcnow().timestamp()
        _rate_count = 0
        RATE_LIMIT = 20
        RATE_WINDOW_SECS = 10

        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            msg_type = message_data.get("type")

            # Rate limiting (skip PING which is client infrastructure, not user content)
            if msg_type != "PING":
                now = datetime.utcnow().timestamp()
                if now - _rate_window_start >= RATE_WINDOW_SECS:
                    _rate_window_start = now
                    _rate_count = 0
                _rate_count += 1
                if _rate_count > RATE_LIMIT:
                    await websocket.send_text(json.dumps({
                        "type": "ERROR",
                        "code": "RATE_LIMITED",
                        "message": f"Too many messages. Max {RATE_LIMIT} per {RATE_WINDOW_SECS}s."
                    }))
                    continue
            
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
                
            elif msg_type == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))

            elif msg_type == "RESUME_CHAT":
                if consultation.status == models.ConsultationStatus.PAUSED:
                    db.refresh(consultation)
                    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == consultation.seeker_id).first()
                    if wallet and float(wallet.balance) >= float(consultation.rate_per_min):
                        consultation.status = models.ConsultationStatus.ACTIVE
                        db.commit()
                        asyncio.create_task(billing_loop(consultation_id, float(consultation.rate_per_min), database.SessionLocal))
                        await manager.broadcast(consultation_id, {
                            "type": "CONSULTATION_RESUMED",
                            "balance": float(wallet.balance)
                        })
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "RESUME_FAILED",
                            "reason": "insufficient_balance"
                        }))

            elif msg_type == "END_CHAT":
                consultation.status = models.ConsultationStatus.COMPLETED
                consultation.end_time = datetime.utcnow()
                audit.log(db, "CHAT_ENDED_BY_USER", actor_id=user.id,
                          resource_type="consultation", resource_id=consultation_id,
                          details={"total_cost": float(consultation.total_cost or 0),
                                   "duration_seconds": consultation.duration_seconds or 0})
                db.commit()
                await manager.broadcast(consultation_id, {"type": "CHAT_ENDED", "reason": "user_ended"})
                break

    except WebSocketDisconnect:
        manager.disconnect(websocket, consultation_id)
        # Pause billing whenever either participant disconnects during an ACTIVE session
        with database.SessionLocal() as db_disc:
            cons = db_disc.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
            if cons and cons.status == models.ConsultationStatus.ACTIVE:
                cons.status = models.ConsultationStatus.PAUSED
                # Populate disconnection_snapshot for crash recovery
                seeker_wallet = db_disc.query(models.UserWallet).filter(models.UserWallet.user_id == cons.seeker_id).first()
                cons.disconnection_snapshot = json.dumps({
                    "paused_at": datetime.utcnow().isoformat(),
                    "paused_by": user.role.value,
                    "balance_at_pause": float(seeker_wallet.balance) if seeker_wallet else 0,
                    "total_cost_at_pause": float(cons.total_cost or 0),
                    "duration_seconds_at_pause": cons.duration_seconds or 0
                })
                db_disc.commit()
                reason = "astrologer_disconnected" if user.role == models.UserRole.ASTROLOGER else "seeker_disconnected"
                asyncio.create_task(manager.broadcast(consultation_id, {"type": "CONSULTATION_PAUSED", "reason": reason}))
                logger.info(f"Consultation {consultation_id} paused due to {reason}")

    except Exception as e:
        logger.error(f"WebSocket Error: {e}")
        try:
            await websocket.close(code=4000)
        except:
            pass
        manager.disconnect(websocket, consultation_id)
        
    finally:
        db.close()
