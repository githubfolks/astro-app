import os

from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request

# Same secret/algorithm as routers/auth.py. Duplicated (not imported) to avoid
# a circular import — routers.auth imports `limiter` from this module.
_JWT_SECRET = os.getenv("JWT_SECRET_KEY")
_JWT_ALGORITHM = "HS256"


def rate_limit_key(request: Request) -> str:
    """Rate-limit key: the authenticated user id from a signature-verified JWT
    when present, otherwise the caller's IP.

    Keying by IP alone lets a leaked/stolen access token dodge its account's
    limit simply by being replayed from a different IP or a rotating proxy
    pool. Keying by the token's `sub` claim instead means the limit follows
    the account, not the network address — a hijacked token still gets
    throttled account-wide no matter where the requests originate. The JWT
    signature is verified here (not just decoded) so a forged/garbage bearer
    value can't be used to fabricate an arbitrary key; anything that doesn't
    verify falls back to IP-based limiting, same as an anonymous request.
    """
    auth_header = request.headers.get("Authorization", "")
    if _JWT_SECRET and auth_header.startswith("Bearer "):
        token = auth_header[len("Bearer "):]
        try:
            payload = jwt.decode(token, _JWT_SECRET, algorithms=[_JWT_ALGORITHM])
            user_id = payload.get("sub")
            if user_id:
                return f"user:{user_id}"
        except JWTError:
            pass
    return f"ip:{get_remote_address(request)}"


# Global default applied to every HTTP route that doesn't set its own
# @limiter.limit(...). Routes with an explicit decorator (login, signup,
# ai-astrologer chat, etc.) override this instead of stacking with it.
# Enforced via SlowAPIMiddleware, which only wraps the "http" ASGI scope —
# WebSocket connections (/realtime/ws, /chat/ws/{id}) are a different scope
# and never pass through it, so they're unaffected by this default.
limiter = Limiter(key_func=rate_limit_key, default_limits=["200/minute"])
