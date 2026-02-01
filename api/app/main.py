from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
import os
from .database import engine, Base
from .routers import auth, users, astrologers, consultations, admin, wallet, chat, seekers, cms, public, payment, payouts

from fastapi.middleware.cors import CORSMiddleware

# Ensure upload directory exists
os.makedirs("uploads", exist_ok=True)

app = FastAPI(title="Aadikarta API")

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
    "http://localhost:5173",
    "https://astro-app-web.vercel.app",
    "https://astro-app-admin.vercel.app",
    "https://dev.aadikarta.org",

    "https://dev-admin.aadikarta.org"

    "https://dev-admin.aadikarta.org",
    "http://localhost:3002"

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"REQUEST: {request.method} {request.url}")
    response = await call_next(request)
    return response

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

@app.get("/")
def read_root():
    return {"message": "Welcome to Aadikarta API"}
