"""Per-user realtime inbox + presence.

A lightweight WebSocket, separate from the chat socket, that delivers
server->client notifications (new requests, queue updates, your-turn,
astrologer-online, moderation alerts) and maintains live presence in Redis so
seekers see accurate Online/Busy/Offline status.

One user can hold several sockets (dashboard + chat tab); messages fan out to all.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
import asyncio
import json
import logging
from datetime import datetime

from .. import models, database
from .chat import get_user_from_token
from ..redis_client import get_redis
from ..services.settings_service import get_setting

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/realtime", tags=["Realtime"])


def _presence_key(user_id: int) -> str:
    return f"astro_presence:{user_id}"


def _presence_ttl() -> int:
    try:
        return int(get_setting("presence_ttl_seconds") or 60)
    except (TypeError, ValueError):
        return 60


def mark_present(user_id: int):
    redis = get_redis()
    if redis:
        try:
            redis.set(_presence_key(user_id), "1", ex=_presence_ttl())
        except Exception as e:
            logger.error(f"presence set failed for {user_id}: {e}")


def clear_present(user_id: int):
    redis = get_redis()
    if redis:
        try:
            redis.delete(_presence_key(user_id))
        except Exception as e:
            logger.error(f"presence clear failed for {user_id}: {e}")


def is_present(user_id: int) -> bool:
    redis = get_redis()
    if not redis:
        # Without Redis we cannot track live presence; fall back to "present"
        # so the manual is_online toggle remains the source of truth.
        return True
    try:
        return redis.exists(_presence_key(user_id)) == 1
    except Exception:
        return True


class NotificationManager:
    def __init__(self):
        # user_id -> list[WebSocket]
        self.connections: dict[int, list[WebSocket]] = {}

    async def connect(self, user_id: int, websocket: WebSocket):
        await websocket.accept()
        self.connections.setdefault(user_id, []).append(websocket)
        mark_present(user_id)

    def disconnect(self, user_id: int, websocket: WebSocket):
        conns = self.connections.get(user_id)
        if not conns:
            return
        self.connections[user_id] = [w for w in conns if w != websocket]
        if not self.connections[user_id]:
            del self.connections[user_id]
            clear_present(user_id)

    async def send(self, user_id: int, payload: dict):
        for ws in list(self.connections.get(user_id, [])):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception as e:
                logger.error(f"notify send failed to user {user_id}: {e}")


notifier = NotificationManager()

# The main asyncio loop the WebSockets live on. Captured at app startup so that
# sync request handlers (run in FastAPI's threadpool) can schedule sends safely.
_main_loop: asyncio.AbstractEventLoop | None = None


def set_main_loop(loop: asyncio.AbstractEventLoop):
    global _main_loop
    _main_loop = loop


def notify_user(user_id: int, payload: dict):
    """Fire-and-forget notification to a user's realtime sockets.

    Safe to call from sync (threadpool) or async code."""
    if not user_id:
        return
    coro = notifier.send(int(user_id), payload)
    try:
        # Same thread as the loop (async caller): schedule directly.
        running = asyncio.get_running_loop()
        running.create_task(coro)
        return
    except RuntimeError:
        pass
    # Sync caller in a worker thread: hop onto the main loop thread-safely.
    if _main_loop and _main_loop.is_running():
        try:
            asyncio.run_coroutine_threadsafe(coro, _main_loop)
            return
        except Exception as e:
            logger.error(f"notify_user threadsafe schedule failed: {e}")
    else:
        coro.close()
        logger.warning("notify_user: no event loop available; notification dropped")


@router.websocket("/ws")
async def realtime_endpoint(websocket: WebSocket, token: str = Query(...)):
    db = database.SessionLocal()
    try:
        user = await get_user_from_token(token, db)
    finally:
        db.close()

    if not user:
        await websocket.close(code=4003)
        return

    await notifier.connect(user.id, websocket)
    logger.info(f"Realtime connected: user={user.id} role={user.role}")

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                continue
            if msg.get("type") == "PING":
                mark_present(user.id)  # heartbeat refreshes presence TTL
                await websocket.send_text(json.dumps({"type": "PONG"}))
    except WebSocketDisconnect:
        notifier.disconnect(user.id, websocket)
        logger.info(f"Realtime disconnected: user={user.id}")
    except Exception as e:
        logger.error(f"Realtime socket error (user {user.id}): {e}")
        notifier.disconnect(user.id, websocket)
