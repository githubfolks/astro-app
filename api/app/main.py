from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
import os
import json
import asyncio
from .database import engine, Base
from .routers import auth, users, astrologers, consultations, admin, wallet, chat, seekers, cms, public, payment, payouts, kundli, edu, packages, disputes
from . import models_edu # To ensure tables are created

from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import secrets

# Ensure upload directory exists
os.makedirs("uploads", exist_ok=True)

from .limiter import limiter

app = FastAPI(title="Aadikarta API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Mount static files
app.mount("/static", StaticFiles(directory="uploads"), name="static")

@app.on_event("startup")
async def startup_event():
    print("--- APP STARTUP ---")
    try:
        print("Connecting to database and creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"FAILED to connect to DB or create tables: {e}")

    # Crash recovery: restart billing loops for any ACTIVE consultations
    await _recover_active_billing_loops()


async def _recover_active_billing_loops():
    from .redis_client import get_redis
    from .database import SessionLocal
    from . import models
    from .routers.chat import billing_loop

    redis = get_redis()
    if not redis:
        print("Redis unavailable — skipping crash recovery scan.")
        return

    try:
        keys = redis.keys("active_consultation:*")
        if not keys:
            print("No active consultations found in Redis — nothing to recover.")
            return

        print(f"Found {len(keys)} possibly interrupted billing session(s). Verifying DB state...")
        with SessionLocal() as db:
            for key in keys:
                try:
                    raw = redis.get(key)
                    if not raw:
                        continue
                    data = json.loads(raw)
                    consultation_id = int(key.split(":")[-1])
                    rate_per_min = float(data.get("rate_per_min", 0))

                    cons = db.query(models.Consultation).filter(models.Consultation.id == consultation_id).first()
                    if cons and cons.status == models.ConsultationStatus.ACTIVE and rate_per_min > 0:
                        print(f"Recovering billing loop for consultation {consultation_id}")
                        asyncio.create_task(billing_loop(consultation_id, rate_per_min, SessionLocal))
                    else:
                        # Stale key — clean up
                        redis.delete(key)
                except Exception as ex:
                    print(f"Error recovering key {key}: {ex}")
    except Exception as e:
        print(f"Crash recovery scan failed: {e}")

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    "http://192.168.1.13:5173",
    "http://127.0.0.1:5173",
    "https://dev.aadikarta.org",
    "http://dev.aadikarta.org",
    "https://api.aadikarta.org",
    "http://api.aadikarta.org",
    "https://admin.aadikarta.org",
    "http://admin.aadikarta.org",
    "http://localhost:4001",
    "http://localhost:4002",
    "http://localhost:9000",
]

@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    # Set CSRF cookie if not present
    csrf_token = request.cookies.get("csrf_token")
    if not csrf_token:
        csrf_token = secrets.token_urlsafe(32)
    
    # State-changing methods require token validation
    # EXEMPTIONS for initial auth where session doesn't exist yet
    exempt_paths = ["/login", "/signup", "/forgot-password", "/verify-otp", "/reset-password", "/payment/razorpay-webhook"]
    
    # Also exempt requests with Bearer token (JWT) as they are inherently CSRF-protected
    auth_header = request.headers.get("Authorization")
    is_jwt = auth_header and auth_header.startswith("Bearer ")

    if request.method in ["POST", "PUT", "DELETE", "PATCH"] and request.url.path not in exempt_paths and not is_jwt:
        header_token = request.headers.get("X-CSRF-Token")
        if not header_token or header_token != csrf_token:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=403, content={"detail": "CSRF token validation failed"})

    response = await call_next(request)
    
    # Set/Refresh CSRF cookie
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False, # Accessible by JS for double-submit
        samesite="None", # Required for cross-site requests
        secure=True # Required when samesite="None"
    )
    return response

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self' https://dev.aadikarta.org http://dev.aadikarta.org https://api.aadikarta.org http://api.aadikarta.org https://admin.aadikarta.org http://admin.aadikarta.org; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://dev.aadikarta.org http://dev.aadikarta.org https://api.aadikarta.org http://api.aadikarta.org https://admin.aadikarta.org http://admin.aadikarta.org http://localhost:9000 http://localhost:4001 http://localhost:4002 http://localhost:8001 http://192.168.1.13:8001"
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    origin = request.headers.get("origin")
    print(f"REQUEST: {request.method} {request.url} ORIGIN: {origin}")
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        print(f"ERROR processing request: {e}")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(e)}
        )

# CORS Middleware (Add LAST to be Outer-Most for responses)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_origin_regex=r"https?://.*\.aadikarta\.org", # Allow all subdomains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(astrologers.router)
app.include_router(seekers.router)
app.include_router(consultations.router)
app.include_router(wallet.router)
app.include_router(chat.router)
app.include_router(admin.router)
app.include_router(cms.router)
app.include_router(public.router)
app.include_router(payment.router)
app.include_router(payouts.router)
app.include_router(kundli.router)
app.include_router(edu.router)
app.include_router(packages.router)
app.include_router(disputes.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Aadikarta API"}
