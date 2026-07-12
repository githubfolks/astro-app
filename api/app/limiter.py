from slowapi import Limiter
from slowapi.util import get_remote_address

# Global default applied to every HTTP route that doesn't set its own
# @limiter.limit(...). Routes with an explicit decorator (login, signup,
# ai-astrologer chat, etc.) override this instead of stacking with it.
# Enforced via SlowAPIMiddleware, which only wraps the "http" ASGI scope —
# WebSocket connections (/realtime/ws, /chat/ws/{id}) are a different scope
# and never pass through it, so they're unaffected by this default.
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
