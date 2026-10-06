"""Per-user realtime inbox + presence.

A lightweight WebSocket, separate from the chat socket, that delivers
server->client notifications (new requests, queue updates, your-turn,
astrologer-online, moderation alerts) and maintains live presence in Redis so
seekers see accurate Online/Busy/Offline status.

One user can hold several sockets (dashboard + chat tab); messages fan out to all.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
import json
import logging
from datetime import datetime

from .. import models, database
from .chat import get_user_from_token, receive_ws_token
from ..redis_client import get_redis
from ..services.settings_service import get_setting

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/realtime", tags=["Realtime"])


def _presence_key(user_id: int) -> str:
    return f"astro_presence:{user_id}"


def _presence_ttl() -> int:
    # Must comfortably exceed the client's heartbeat interval *as throttled by the
    # browser*: Chrome checks timers only once per minute in a tab hidden for
    # 5+ minutes, so a 60s TTL lapsed and flipped an astrologer OFFLINE whenever
    # they switched to another window/tab. A real disconnect clears the key
    # immediately (NotificationManager.disconnect), so this is only a backstop.
    try:
        return int(get_setting("presence_ttl_seconds") or 180)
    except (TypeError, ValueError):
        return 180


def _presence_push_grace() -> int:
    """How long an astrologer who can still be reached by push stays ONLINE
    after their last realtime socket drops (e.g. iPhone Safari backgrounded,
    which suspends the page and kills the socket within seconds). 0 disables."""
    try:
        return max(0, int(get_setting("presence_push_grace_seconds") or 0))
    except (TypeError, ValueError):
        return 0


def has_reachable_push_token(user_id: int) -> bool:
    """True if the user has a push target that can actually deliver: a native
    FCM token (android/ios) or a browser subscription while VAPID is configured."""
    from ..notifications import WEB_PUSH_PLATFORM, web_push_configured
    platforms = ["android", "ios"]
    if web_push_configured():
        platforms.append(WEB_PUSH_PLATFORM)
    db = database.SessionLocal()
    try:
        return db.query(models.DeviceToken.id).filter(
            models.DeviceToken.user_id == user_id,
            models.DeviceToken.platform.in_(platforms),
        ).first() is not None
    finally:
        db.close()


def mark_present(user_id: int, ttl: int | None = None):
    redis = get_redis()
    if redis:
        try:
            redis.set(_presence_key(user_id), "1", ex=ttl or _presence_ttl())
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
        # Unauthenticated sockets (logged-out visitors browsing the astrologer
        # list/profile) — they get public broadcasts (ASTRO_ONLINE/OFFLINE) only,
        # never per-user sends, and never affect presence.
        self.guest_connections: list[WebSocket] = []
        # user_id -> pending "grace expired, announce ASTRO_OFFLINE" task
        self.offline_tasks: dict[int, asyncio.Task] = {}

    def is_user_connected(self, user_id: int) -> bool:
        return user_id in self.connections

    def _cancel_offline_task(self, user_id: int):
        task = self.offline_tasks.pop(user_id, None)
        if task and not task.done():
            task.cancel()

    async def connect(self, user_id: int, websocket: WebSocket):
        # Socket is already accepted by receive_ws_token() during the auth handshake.
        self._cancel_offline_task(user_id)
        self.connections.setdefault(user_id, []).append(websocket)
        mark_present(user_id)

    def disconnect(self, user_id: int, websocket: WebSocket) -> bool:
        """Remove a socket. Returns True if it was the user's last one."""
        conns = self.connections.get(user_id)
        if not conns:
            return False
        self.connections[user_id] = [w for w in conns if w != websocket]
        if not self.connections[user_id]:
            del self.connections[user_id]
            return True
        return False

    def handle_last_disconnect(self, user_id: int, is_astrologer: bool):
        """The user has no realtime socket left. An astrologer who can still be
        reached by push keeps presence for the grace period (their phone may
        just have suspended the page) and is announced OFFLINE only if they
        don't come back in time; anyone else goes OFFLINE immediately."""
        grace = _presence_push_grace() if is_astrologer else 0
        try:
            reachable = bool(grace) and has_reachable_push_token(user_id)
        except Exception as e:
            # Can't confirm they're reachable — don't advertise them as ONLINE.
            logger.error(f"push-reachability check failed for {user_id}: {e}")
            reachable = False
        if reachable:
            mark_present(user_id, ttl=grace)
            self._cancel_offline_task(user_id)
            self.offline_tasks[user_id] = asyncio.create_task(self._announce_offline_after(user_id, grace))
            logger.info(f"Realtime: astrologer {user_id} disconnected, push-reachable — keeping presence {grace}s")
            return
        clear_present(user_id)
        if is_astrologer:
            asyncio.create_task(self.broadcast({"type": "ASTRO_OFFLINE", "astrologer_id": user_id}))

    async def _announce_offline_after(self, user_id: int, delay: int):
        try:
            await asyncio.sleep(delay)
        except asyncio.CancelledError:
            return
        self.offline_tasks.pop(user_id, None)
        if not self.is_user_connected(user_id):
            await self.broadcast({"type": "ASTRO_OFFLINE", "astrologer_id": user_id})

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

    # If astrologer connects and is set to online manually, broadcast online status
    if user.role == models.UserRole.ASTROLOGER:
        db = database.SessionLocal()
        try:
            profile = db.query(models.AstrologerProfile).filter(models.AstrologerProfile.user_id == user.id).first()
            if profile and profile.is_online:
                asyncio.create_task(notifier.broadcast({"type": "ASTRO_ONLINE", "astrologer_id": user.id}))
                # Reconnecting (e.g. unlocking the phone and reopening the app,
                # without tapping the notification) makes the astrologer reachable
                # again just like the manual online toggle does — resolve pending
                # Knock subscriptions here too, not only from that toggle endpoint,
                # otherwise seekers who knocked never get told the astrologer is back.
                from .astrologers import _notify_waiting_seekers
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
                mark_present(user.id)  # heartbeat refreshes presence TTL
                await websocket.send_text(json.dumps({"type": "PONG"}))
    except WebSocketDisconnect:
        logger.info(f"Realtime disconnected: user={user.id}")
        # Presence (is_present, Redis TTL) already makes _apply_availability show this
        # astrologer as OFFLINE while no socket is connected — don't also overwrite the
        # manual is_online preference, or navigating between pages (e.g. into a chat,
        # which doesn't hold this socket) permanently flips them offline even after
        # they return and reconnect.
        if notifier.disconnect(user.id, websocket):
            notifier.handle_last_disconnect(user.id, user.role == models.UserRole.ASTROLOGER)
    except Exception as e:
        logger.error(f"Realtime socket error (user {user.id}): {e}")
        if notifier.disconnect(user.id, websocket):
            notifier.handle_last_disconnect(user.id, user.role == models.UserRole.ASTROLOGER)
