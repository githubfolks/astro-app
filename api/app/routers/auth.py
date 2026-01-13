from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from .. import models, schemas, database

from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import os
import random
import string
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr

router = APIRouter()

import bcrypt

# Email Configuration
conf = ConnectionConfig(
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "user"),
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "password"),
    MAIL_FROM = os.getenv("MAIL_FROM", "admin@example.com"),
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS = True,
    MAIL_SSL_TLS = False,
    USE_CREDENTIALS = True,
    VALIDATE_CERTS = False 
)

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") # Also fixed path while here

# Secret key settings (would typically be in env variables)
SECRET_KEY = "dummy_secret_key_for_demo_purposes"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

from typing import Optional
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.post("/signup", response_model=schemas.Token)
def signup(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    if user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=400, detail="Only seekers can sign up via this endpoint")
    # Check existing
    db_user = db.query(models.User).filter((models.User.email == user.email) | (models.User.phone_number == user.phone_number)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Phone or Email either blank or already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        phone_number=user.phone_number,
        hashed_password=hashed_password,
        role=models.UserRole(user.role.value)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Initialize profile based on role
    if user.role == models.UserRole.SEEKER:
        profile = models.SeekerProfile(user_id=new_user.id)
        db.add(profile)
        # Init wallet
        wallet = models.UserWallet(user_id=new_user.id)
        db.add(wallet)
    elif user.role == models.UserRole.ASTROLOGER:
        # Require some minimal profile info or set defaults? For now just create empty shell
        # In real app, might require more info at signup
        profile = models.AstrologerProfile(user_id=new_user.id, full_name="Astrologer")
        db.add(profile)
        # Init wallet for earnings
        wallet = models.UserWallet(user_id=new_user.id)
        db.add(wallet)
    
    db.commit()

    # Get full name to return
    full_name = None
    if user.role == models.UserRole.SEEKER:
        # We just created it empty, so likely None, but good to be explicit
        full_name = None
    elif user.role == models.UserRole.ASTROLOGER:
        full_name = "Astrologer"

    access_token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role.value})
    return {"access_token": access_token, "token_type": "bearer", "user_id": new_user.id, "role": new_user.role, "full_name": full_name}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter((models.User.email == form_data.username) | (models.User.phone_number == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role.value})
    
    # Fetch full name
    full_name = None
    if user.role == models.UserRole.SEEKER:
        if user.seeker_profile:
            full_name = user.seeker_profile.full_name
    elif user.role == models.UserRole.ASTROLOGER:
        if user.astrologer_profile:
            full_name = user.astrologer_profile.full_name

    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "role": user.role, "full_name": full_name}

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

@router.post("/forgot-password")
async def forgot_password(request: schemas.ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # Don't reveal if user exists or not, but for now helpful for debugging
        # raise HTTPException(status_code=404, detail="User not found")
        return {"message": "If the email is registered, an OTP has been sent."}

    otp = generate_otp()
    # Expire in 10 minutes
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    # Store OTP
    db_token = models.VerificationToken(
        user_id=user.id,
        token=otp,
        verification_type=models.VerificationTokenType.FORGOT_PASSWORD,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()

    # Send Email
    message = MessageSchema(
        subject="Password Reset OTP",
        recipients=[request.email],
        body=f"Your OTP for password reset is: {otp}. It is valid for 10 minutes.",
        subtype=MessageType.html
    )
    
    fm = FastMail(conf)
    # Using background task to avoid blocking
    background_tasks.add_task(fm.send_message, message)

    return {"message": "OTP sent to email"}

@router.post("/verify-otp")
def verify_otp(request: schemas.VerifyOTPRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find valid OTP
    token = db.query(models.VerificationToken).filter(
        models.VerificationToken.user_id == user.id,
        models.VerificationToken.token == request.otp,
        models.VerificationToken.verification_type == models.VerificationTokenType.FORGOT_PASSWORD,
        models.VerificationToken.is_used == False,
        models.VerificationToken.expires_at > datetime.utcnow()
    ).first()

    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    # Mark as used
    token.is_used = True
    db.commit()

    # Generate a temporary token for password reset
    # This token enables the /reset-password endpoint
    reset_token = create_access_token(
        data={"sub": str(user.id), "scope": "RESET_PASSWORD"},
        expires_delta=timedelta(minutes=15)
    )
    return {"message": "OTP verified", "reset_token": reset_token}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    try:
        payload = jwt.decode(request.token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        scope: str = payload.get("scope")
        if user_id is None or scope != "RESET_PASSWORD":
             raise HTTPException(status_code=401, detail="Invalid reset token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid reset token")

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()

    return {"message": "Password updated successfully"}
