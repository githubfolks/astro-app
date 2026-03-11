from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
import os
from .database import engine, Base
from .routers import auth, users, astrologers, consultations, admin, wallet, chat, seekers, cms, public, payment, payouts, kundli

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
def startup_event():
    print("--- APP STARTUP ---")
    try:
        print("Connecting to database and creating tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
    except Exception as e:
        print(f"FAILED to connect to DB or create tables: {e}")
        # We don't raise here so the app can still start and show 500s on endpoints but not crash entirely

origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:5173",
    "https://astro-app-web.vercel.app",
    "https://astro-app-admin.vercel.app",
    "https://dev.aadikarta.org",
    "https://dev-admin.aadikarta.org",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in origins if o],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    max_age=3600,
)

@app.middleware("http")
async def csrf_middleware(request: Request, call_next):
    # Set CSRF cookie if not present
    csrf_token = request.cookies.get("csrf_token")
    if not csrf_token:
        csrf_token = secrets.token_urlsafe(32)
    
    # State-changing methods require token validation
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        header_token = request.headers.get("X-CSRF-Token")
        # Bypass for certain origins/paths if needed, but for now strict
        if not header_token or header_token != csrf_token:
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=403, content={"detail": "CSRF token validation failed"})

    response = await call_next(request)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False, # Must be accessible by dynamic JS for double-submit
        samesite="Lax",
        secure=True if os.getenv("ENVIRONMENT") == "production" else False
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
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.cloudinary.com"
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
            content={"detail": "Internal Server Error", "error": str(e)},
            headers={
                "Access-Control-Allow-Origin": origin if origin in origins else origins[0],
                "Access-Control-Allow-Credentials": "true"
            }
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

@app.get("/")
def read_root():
    return {"message": "Welcome to Aadikarta API"}
