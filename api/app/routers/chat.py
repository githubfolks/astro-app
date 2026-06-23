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


def persist_and_moderate(db: Session, consultation: "models.Consultation", sender_id: int, content: str):
    """Save a chat message, run rule-based moderation, and raise alerts on violations.

    Returns (new_msg, broadcast_content) where broadcast_content has any contact
    info masked so it is never delivered to the other participant.
    """
    from ..services import moderation
    from ..services.settings_service import get_setting
    from .realtime import notify_user

    violations, masked = moderation.scan(content or "")
    flagged = bool(violations)

    new_msg = models.ChatMessage(
        consultation_id=consultation.id,
        sender_id=sender_id,
        message=content,
        is_flagged=flagged,
        flag_reason=",".join(violations) if violations else None,
    )
    db.add(new_msg)
    db.commit()
    db.refresh(new_msg)

    if not flagged:
        return new_msg, content

    reason = ",".join(violations)
    try:
        db.add(models.ModerationFlag(
            consultation_id=consultation.id,
            message_id=new_msg.id,
            flagged_user_id=sender_id,
            reason=reason,
            snippet=content,
        ))
        audit.log(db, "CHAT_MODERATION_FLAG", actor_id=sender_id,
                  resource_type="consultation", resource_id=consultation.id,
                  details={"reason": reason, "message_id": new_msg.id})
        db.commit()
    except Exception as e:
        logger.error(f"Failed to persist moderation flag: {e}")
        db.rollback()

    # Strong alarm in both seeker and astrologer panels.
    alert = {
        "type": "MODERATION_ALERT",
        "consultation_id": consultation.id,
        "reason": reason,
        "message": "Sharing personal contact details or external links is not allowed. This conversation is monitored.",
    }
    try:
        asyncio.create_task(manager.broadcast(consultation.id, alert))
    except RuntimeError:
        pass

    # Alert the super admin (in-app).
    try:
        admin_user_id = get_setting("moderation_admin_user_id")
        if admin_user_id:
            notify_user(int(admin_user_id), {
                "type": "MODERATION_ALERT",
                "consultation_id": consultation.id,
                "flagged_user_id": sender_id,
                "reason": reason,
                "snippet": content,
            })
    except Exception as e:
        logger.error(f"Failed to alert admin of moderation flag: {e}")

    return new_msg, masked


# Statuses that mean an astrologer is currently occupied with a session.
BUSY_STATUSES = (
    models.ConsultationStatus.ACCEPTED,
    models.ConsultationStatus.ACTIVE,
    models.ConsultationStatus.PAUSED,
)


def astrologer_has_other_active(db: Session, astrologer_id: int, exclude_id: int) -> bool:
    """True if the astrologer is already engaged in a different live session.
    Enforces the one-chat-at-a-time policy."""
    return db.query(models.Consultation).filter(
        models.Consultation.astrologer_id == astrologer_id,
        models.Consultation.id != exclude_id,
        models.Consultation.status.in_(BUSY_STATUSES),
    ).first() is not None


def promote_next_in_queue(db: Session, astrologer_id: int):
    """When an astrologer frees up, alert the next waiting seeker that it's their turn."""
    from .realtime import notify_user
    from ..services.settings_service import get_setting

    next_req = db.query(models.Consultation).filter(
        models.Consultation.astrologer_id == astrologer_id,
        models.Consultation.status == models.ConsultationStatus.REQUESTED,
    ).order_by(models.Consultation.created_at.asc()).first()
    if not next_req:
        return

    # Refresh the astrologer's dashboard and tell the seeker it's their turn.
    notify_user(astrologer_id, {"type": "QUEUE_UPDATE", "consultation_id": next_req.id})
    notify_user(next_req.seeker_id, {
        "type": "YOUR_TURN",
        "consultation_id": next_req.id,
        "astrologer_id": astrologer_id,
    })
    try:
        for tok in db.query(models.DeviceToken).filter(models.DeviceToken.user_id == next_req.seeker_id).all():
            send_push_notification(
                token=tok.fcm_token,
                title="It's your turn!",
                body="The astrologer is now available for your consultation.",
                data={"consultation_id": str(next_req.id), "type": "YOUR_TURN"},
            )
    except Exception as e:
        logger.error(f"promote_next_in_queue push failed: {e}")


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
        
        # Save to DB (+ moderation). broadcast_content has contact info masked.
        new_msg, broadcast_content = persist_and_moderate(db, consultation, current_user.id, data.content)

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

        # Broadcast to any active WS connections (masked content if flagged)
        await manager.broadcast(data.consultation_id, {
            "type": "NEW_MESSAGE",
            "id": new_msg.id,
            "sender_id": current_user.id,
            "content": broadcast_content,
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
                         body=broadcast_content[:50] + ("..." if len(broadcast_content) > 50 else ""),
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
                        promote_next_in_queue(db, consultation.astrologer_id)
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
                        promote_next_in_queue(db, consultation.astrologer_id)
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
    logger.info(f"New WS connection attempt: consultation_id={consultation_id}")

    # Create a new session for this connection scope
    db = database.SessionLocal()

    try:
        user = await get_user_from_token(token, db)

        if not user:
            logger.warning(f"WS reject (consultation {consultation_id}): invalid token or user not found")
            await websocket.close(code=4003)
            return

        consultation = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
        if not consultation:
            logger.warning(f"WS reject: consultation {consultation_id} not found")
            await websocket.close(code=4004)
            return

        # Verify participant
        if user.id != consultation.seeker_id and user.id != consultation.astrologer_id:
            logger.warning(f"WS reject: user {user.id} not a participant of consultation {consultation_id}")
            await websocket.close(code=4003)
            return

        await manager.connect(websocket, consultation_id, user)
        logger.info(f"WS connected: user={user.id} role={user.role} consultation={consultation_id}")
    except Exception as e:
        logger.error(f"WS exception during handshake (consultation {consultation_id}): {e}")
        await websocket.close(code=4000)
        return

    try:
        # Auto-accept if astrologer joins — but enforce one chat at a time.
        if user.role == models.UserRole.ASTROLOGER and consultation.status == models.ConsultationStatus.REQUESTED:
            if astrologer_has_other_active(db, consultation.astrologer_id, consultation.id):
                await websocket.send_text(json.dumps({
                    "type": "ERROR",
                    "code": "ALREADY_IN_SESSION",
                    "message": "Finish your current chat before starting a new one.",
                }))
                await websocket.close(code=4009)
                manager.disconnect(websocket, consultation_id)
                return
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

                # Save to DB (+ moderation). broadcast_content has contact info masked.
                new_msg, broadcast_content = persist_and_moderate(db, consultation, user.id, content)

                # Re-read latest status; billing_loop runs on a separate session and
                # may have changed status (PAUSED/AUTO_ENDED) since this socket connected.
                db.refresh(consultation)

                # Check for Timer Start (First Astrologer Message)
                if user.role == models.UserRole.ASTROLOGER and consultation.status == models.ConsultationStatus.ACCEPTED:
                    if astrologer_has_other_active(db, consultation.astrologer_id, consultation.id):
                        await websocket.send_text(json.dumps({
                            "type": "ERROR",
                            "code": "ALREADY_IN_SESSION",
                            "message": "Finish your current chat before starting a new one.",
                        }))
                        continue
                    consultation.status = models.ConsultationStatus.ACTIVE
                    consultation.start_time = datetime.utcnow()
                    db.commit()

                    # Notify Timer Start
                    await manager.broadcast(consultation_id, {"type": "TIMER_STARTED"})
                    
                    # Start Billing Loop
                    asyncio.create_task(billing_loop(consultation_id, float(consultation.rate_per_min), database.SessionLocal))
                
                # Broadcast (masked content if flagged)
                await manager.broadcast(consultation_id, {
                    "type": "NEW_MESSAGE",
                    "id": new_msg.id,
                    "sender_id": user.id,
                    "content": broadcast_content,
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
                            body=broadcast_content[:50] + ("..." if len(broadcast_content) > 50 else ""),
                            data={"consultation_id": str(consultation_id), "type": "CHAT_MESSAGE"}
                        )
                
            elif msg_type == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))

            elif msg_type == "RESUME_CHAT":
                db.refresh(consultation)
                if consultation.status == models.ConsultationStatus.PAUSED:
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
                db.refresh(consultation)
                # Don't overwrite a terminal status already set by billing_loop
                if consultation.status in (models.ConsultationStatus.COMPLETED, models.ConsultationStatus.AUTO_ENDED):
                    await manager.broadcast(consultation_id, {"type": "CHAT_ENDED", "reason": "already_ended"})
                    break
                consultation.status = models.ConsultationStatus.COMPLETED
                consultation.end_time = datetime.utcnow()
                audit.log(db, "CHAT_ENDED_BY_USER", actor_id=user.id,
                          resource_type="consultation", resource_id=consultation_id,
                          details={"total_cost": float(consultation.total_cost or 0),
                                   "duration_seconds": consultation.duration_seconds or 0})
                db.commit()
                await manager.broadcast(consultation_id, {"type": "CHAT_ENDED", "reason": "user_ended"})
                # Astrologer is now free — alert the next seeker in their queue.
                promote_next_in_queue(db, consultation.astrologer_id)
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
