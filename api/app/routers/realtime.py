"""Per-user realtime inbox.

A lightweight WebSocket, separate from the chat socket, that delivers
server->client notifications (new requests, queue updates, your-turn,
astrologer-online/offline, moderation alerts). It does NOT decide whether an
astrologer is shown Online — that is is_online + availability window (see
astrologers.is_astrologer_available), so a backgrounded/suspended browser
never flips an astrologer OFFLINE.

One user can hold several sockets (dashboard + chat tab); messages fan out to all.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import logging
from datetime import datetime

from .. import models, database
from .chat import get_user_from_token, receive_ws_token

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/realtime", tags=["Realtime"])


class NotificationManager:
    def __init__(self):
        # user_id -> list[WebSocket]
        self.connections: dict[int, list[WebSocket]] = {}
        # Unauthenticated sockets (logged-out visitors browsing the astrologer
        # list/profile) — they get public broadcasts (ASTRO_ONLINE/OFFLINE) only,
        # never per-user sends.
        self.guest_connections: list[WebSocket] = []

    def is_user_connected(self, user_id: int) -> bool:
        return user_id in self.connections

    async def connect(self, user_id: int, websocket: WebSocket):
        # Socket is already accepted by receive_ws_token() during the auth handshake.
        self.connections.setdefault(user_id, []).append(websocket)

    def disconnect(self, user_id: int, websocket: WebSocket):
        conns = self.connections.get(user_id)
        if not conns:
            return
        self.connections[user_id] = [w for w in conns if w != websocket]
        if not self.connections[user_id]:
            del self.connections[user_id]

    def connect_guest(self, websocket: WebSocket):
        self.guest_connections.append(websocket)

    def disconnect_guest(self, websocket: WebSocket):
        if websocket in self.guest_connections:
            self.guest_connections.remove(websocket)

    async def send(self, user_id: int, payload: dict):
        for ws in list(self.connections.get(user_id, [])):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception as e:
                logger.error(f"notify send failed to user {user_id}: {e}")

    async def broadcast(self, payload: dict):
        for uid, conns in list(self.connections.items()):
            for ws in list(conns):
                try:
                    await ws.send_text(json.dumps(payload))
                except Exception as e:
                    logger.error(f"broadcast send failed to user {uid}: {e}")
        for ws in list(self.guest_connections):
            try:
                await ws.send_text(json.dumps(payload))
            except Exception as e:
                logger.error(f"broadcast send failed to guest: {e}")


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


def broadcast_event(payload: dict):
    """Fire-and-forget broadcast to all active connections.

    Safe to call from sync (threadpool) or async code."""
    coro = notifier.broadcast(payload)
    try:
        running = asyncio.get_running_loop()
        running.create_task(coro)
        return
    except RuntimeError:
        pass
    if _main_loop and _main_loop.is_running():
        try:
            asyncio.run_coroutine_threadsafe(coro, _main_loop)
            return
        except Exception as e:
            logger.error(f"broadcast_event threadsafe schedule failed: {e}")
    else:
        coro.close()
        logger.warning("broadcast_event: no event loop available; broadcast dropped")


@router.websocket("/ws")
async def realtime_endpoint(websocket: WebSocket):
    token = await receive_ws_token(websocket)

    user = None
    if token is not None:
        db = database.SessionLocal()
        try:
            user = await get_user_from_token(token, db)
        finally:
            db.close()

    if not user:
        # Guest connection (logged-out visitor, or an expired/invalid token) —
        # kept open (instead of closed) so the astrologer list/profile pages
        # still get live ASTRO_ONLINE/OFFLINE updates without a page refresh,
        # same as an authenticated seeker would.
        notifier.connect_guest(websocket)
        try:
            while True:
                data = await websocket.receive_text()
                try:
                    msg = json.loads(data)
                except json.JSONDecodeError:
                    continue
                if msg.get("type") == "PING":
                    await websocket.send_text(json.dumps({"type": "PONG"}))
        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.error(f"Realtime guest socket error: {e}")
        finally:
            notifier.disconnect_guest(websocket)
        return

    await notifier.connect(user.id, websocket)
    logger.info(f"Realtime connected: user={user.id} role={user.role}")

    # Availability doesn't depend on this socket, so connecting changes nothing
    # seekers see. Still resolve any pending Knocks for an available astrologer —
    # e.g. ones recorded before availability stopped depending on the socket.
    if user.role == models.UserRole.ASTROLOGER:
        db = database.SessionLocal()
        try:
            from .astrologers import is_astrologer_available, _notify_waiting_seekers
            profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user.id).first()
            if profile and is_astrologer_available(profile):
                try:
                    _notify_waiting_seekers(db, user.id)
                except Exception as e:
                    logger.error(f"notify_waiting_seekers on reconnect failed for {user.id}: {e}")
        finally:
            db.close()

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                continue
            if msg.get("type") == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))
    except WebSocketDisconnect:
        logger.info(f"Realtime disconnected: user={user.id}")
        # Disconnecting (switching window/app, phone suspending the page) must
        # not change availability or the manual is_online preference.
        notifier.disconnect(user.id, websocket)
    except Exception as e:
        logger.error(f"Realtime socket error (user {user.id}): {e}")
        notifier.disconnect(user.id, websocket)
