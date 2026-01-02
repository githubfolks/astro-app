from fastapi import FastAPI, Request
from .database import engine, Base
from .routers import auth, users, astrologers, consultations, admin, wallet, chat
from fastapi.middleware.cors import CORSMiddleware

Base.metadata.create_all(bind=engine)

app = FastAPI(title="InstaAstro Replica API")
print("--- APP RELOADED ---")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
app.include_router(consultations.router)
app.include_router(wallet.router)
app.include_router(chat.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to InstaAstro Replica API"}
