from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from .. import models, schemas, database

from datetime import datetime, timedelta
from jose import JWTError, jwt
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import os
import random
import string
import httpx
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_auth_requests
from pydantic import EmailStr
from ..limiter import limiter
from ..services import email_service
from ..security_utils import validate_password_strength
from fastapi import Request

router = APIRouter()

import bcrypt

# pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login") # Also fixed path while here

# Secret key settings — must be set in the environment; no insecure fallback
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET_KEY environment variable is not set. Refusing to start.")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Google ID tokens are minted with different audiences depending on which client
# initiated sign-in (web page vs iOS app vs Android app via Credential Manager,
# which uses the web client as its "server" client). We accept any of these as
# a valid audience so the same backend endpoint serves every platform.
GOOGLE_WEB_CLIENT_ID = os.getenv("GOOGLE_WEB_CLIENT_ID")
GOOGLE_IOS_CLIENT_ID = os.getenv("GOOGLE_IOS_CLIENT_ID")
GOOGLE_VALID_AUDIENCES = [aud for aud in (GOOGLE_WEB_CLIENT_ID, GOOGLE_IOS_CLIENT_ID) if aud]

FACEBOOK_APP_ID = os.getenv("FACEBOOK_APP_ID")
FACEBOOK_APP_SECRET = os.getenv("FACEBOOK_APP_SECRET")

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

def get_current_user_optional(request: Request, db: Session = Depends(database.get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.replace("Bearer ", "")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        user = db.query(models.User).filter(models.User.id == user_id).first()
        return user
    except JWTError:
        return None

def get_current_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user

@router.post("/signup")
@limiter.limit("5/minute")
def signup(request: Request, user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    if user.role != models.UserRole.SEEKER:
        raise HTTPException(status_code=400, detail="Only seekers can sign up via this endpoint")
    # Check existing
    db_user = db.query(models.User).filter((models.User.email == user.email) | (models.User.phone_number == user.phone_number)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Phone or Email already registered")
    
    validate_password_strength(user.password)
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        phone_number=user.phone_number,
        hashed_password=hashed_password,
        role=models.UserRole(user.role.value),
        is_verified=False
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
    
    # Generate and Send Verification Email
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    db_token = models.VerificationToken(
        user_id=new_user.id,
        token=otp,
        verification_type=models.VerificationTokenType.EMAIL_VERIFICATION,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()

    subject, html = email_service.build_verification_email(otp)
    email_service.send_email(background_tasks, [user.email], subject, html)

    return {"message": "Signup successful. Please check your email for verification code."}

@router.post("/login", response_model=schemas.Token)
@limiter.limit("10/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter((models.User.email == form_data.username) | (models.User.phone_number == form_data.username)).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")
    
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified. Please verify your account.")
    
    # No refresh-token flow exists yet, so the access token must outlive a full
    # chat session — a 15-30 min token was expiring mid-chat and forcing both
    # the seeker and astrologer to be logged out right as (or after) they ended it.
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES * 48)  # 24h
    )
    
    # Fetch full name
    full_name = None
    if user.role == models.UserRole.SEEKER:
        if user.seeker_profile:
            full_name = user.seeker_profile.full_name
    elif user.role == models.UserRole.ASTROLOGER:
        if user.astrologer_profile:
            full_name = user.astrologer_profile.full_name
            # Logging in means the astrologer is available: flip them online
            # so seekers see the Chat button without a manual toggle.
            if user.astrologer_profile.is_approved and not user.astrologer_profile.is_online:
                user.astrologer_profile.is_online = True
                db.commit()
                from .astrologers import _notify_waiting_seekers
                try:
                    _notify_waiting_seekers(db, user.id)
                except Exception as e:
                    print(f"notify waiting seekers on login failed: {e}")

    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "role": user.role, "full_name": full_name}

def _social_login(db: Session, provider: str, provider_user_id: str, email: Optional[str], full_name: Optional[str]) -> dict:
    """Shared find-or-create + token issuance for Google/Facebook sign-in.

    Matches an existing account by (provider, provider_user_id) first, then falls
    back to matching by verified email so a user who originally signed up with a
    password can link a social account without creating a duplicate.
    """
    if not email:
        raise HTTPException(status_code=400, detail=f"Your {provider.capitalize()} account has no email address. Please use email/password signup instead.")

    user = db.query(models.User).filter(
        models.User.oauth_provider == provider,
        models.User.oauth_id == provider_user_id
    ).first()

    if not user:
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            # Existing password (or other-provider) account with the same email — link it.
            user.oauth_provider = provider
            user.oauth_id = provider_user_id
            if not user.is_verified:
                user.is_verified = True
            db.commit()
            db.refresh(user)
        else:
            user = models.User(
                email=email,
                role=models.UserRole.SEEKER,
                oauth_provider=provider,
                oauth_id=provider_user_id,
                is_verified=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            profile = models.SeekerProfile(user_id=user.id, full_name=full_name)
            db.add(profile)
            wallet = models.UserWallet(user_id=user.id)
            db.add(wallet)
            db.commit()

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is deactivated")

    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES * 48)  # 24h, matches /login
    )

    resolved_full_name = full_name
    if user.role == models.UserRole.SEEKER and user.seeker_profile:
        resolved_full_name = user.seeker_profile.full_name or full_name
    elif user.role == models.UserRole.ASTROLOGER and user.astrologer_profile:
        resolved_full_name = user.astrologer_profile.full_name

    return {"access_token": access_token, "token_type": "bearer", "user_id": user.id, "role": user.role, "full_name": resolved_full_name}

@router.post("/auth/google", response_model=schemas.Token)
@limiter.limit("10/minute")
def google_login(request: Request, payload: schemas.GoogleLoginRequest, db: Session = Depends(database.get_db)):
    if not GOOGLE_VALID_AUDIENCES:
        raise HTTPException(status_code=503, detail="Google sign-in is not configured")
    try:
        idinfo = google_id_token.verify_oauth2_token(
            payload.id_token, google_auth_requests.Request()
        )
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    if idinfo.get("aud") not in GOOGLE_VALID_AUDIENCES:
        raise HTTPException(status_code=401, detail="Invalid Google token audience")
    if not idinfo.get("email_verified", False):
        raise HTTPException(status_code=401, detail="Google email is not verified")

    result = _social_login(
        db, "google", idinfo["sub"], idinfo.get("email"), idinfo.get("name")
    )
    return result

@router.post("/auth/facebook", response_model=schemas.Token)
@limiter.limit("10/minute")
def facebook_login(request: Request, payload: schemas.FacebookLoginRequest, db: Session = Depends(database.get_db)):
    if not FACEBOOK_APP_ID or not FACEBOOK_APP_SECRET:
        raise HTTPException(status_code=503, detail="Facebook sign-in is not configured")

    app_access_token = f"{FACEBOOK_APP_ID}|{FACEBOOK_APP_SECRET}"
    with httpx.Client(timeout=10) as client:
        try:
            debug_resp = client.get(
                "https://graph.facebook.com/debug_token",
                params={"input_token": payload.access_token, "access_token": app_access_token},
            )
            debug_resp.raise_for_status()
            debug_data = debug_resp.json().get("data", {})
        except httpx.HTTPError:
            raise HTTPException(status_code=401, detail="Could not verify Facebook token")

    if not debug_data.get("is_valid") or str(debug_data.get("app_id")) != str(FACEBOOK_APP_ID):
        raise HTTPException(status_code=401, detail="Invalid Facebook token")

    fb_user_id = debug_data.get("user_id")
    if not fb_user_id:
        raise HTTPException(status_code=401, detail="Invalid Facebook token")

    with httpx.Client(timeout=10) as client:
        try:
            profile_resp = client.get(
                f"https://graph.facebook.com/{fb_user_id}",
                params={"fields": "id,name,email", "access_token": payload.access_token},
            )
            profile_resp.raise_for_status()
            profile = profile_resp.json()
        except httpx.HTTPError:
            raise HTTPException(status_code=401, detail="Could not fetch Facebook profile")

    result = _social_login(
        db, "facebook", str(profile["id"]), profile.get("email"), profile.get("name")
    )
    return result

import secrets

def generate_otp(length=6):
    return ''.join(secrets.choice(string.digits) for _ in range(length))

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(request_data: schemas.ForgotPasswordRequest, background_tasks: BackgroundTasks, request: Request, db: Session = Depends(database.get_db)):
    # Generic response used whether or not the account exists, so this endpoint
    # can't be used to enumerate registered emails.
    generic_response = {"message": "If the email is registered, an OTP has been sent."}

    user = db.query(models.User).filter(models.User.email == request_data.email).first()
    if not user:
        return generic_response

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
    subject, html = email_service.build_password_reset_email(otp)
    email_service.send_email(background_tasks, [user.email], subject, html)

    return generic_response

@router.post("/verify-email")
def verify_email(request: schemas.VerifyOTPRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find valid OTP
    token = db.query(models.VerificationToken).filter(
        models.VerificationToken.user_id == user.id,
        models.VerificationToken.token == request.otp,
        models.VerificationToken.verification_type == models.VerificationTokenType.EMAIL_VERIFICATION,
        models.VerificationToken.is_used == False,
        models.VerificationToken.expires_at > datetime.utcnow()
    ).order_by(models.VerificationToken.created_at.desc()).first()

    if not token:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    # Mark user as verified
    user.is_verified = True
    token.is_used = True
    db.commit()

    # Send welcome / onboarding email now that the account is active
    name = user.seeker_profile.full_name if user.seeker_profile else None
    subject, html = email_service.build_welcome_email(name)
    email_service.send_email(background_tasks, [user.email], subject, html)

    return {"message": "Email verified successfully. You can now login."}

@router.post("/resend-verification")
def resend_verification(request_data: schemas.ResendVerificationRequest, background_tasks: BackgroundTasks, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request_data.email).first()
    if not user:
        return {"message": "If the email is registered, a new verification code has been sent."}
    
    if user.is_verified:
        return {"message": "Email is already verified."}

    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    db_token = models.VerificationToken(
        user_id=user.id,
        token=otp,
        verification_type=models.VerificationTokenType.EMAIL_VERIFICATION,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()

    subject, html = email_service.build_verification_email(otp)
    email_service.send_email(background_tasks, [user.email], subject, html)

    return {"message": "New verification code sent to email."}

@router.post("/verify-otp")
def verify_otp(request: schemas.VerifyOTPRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()

    # Look up a valid OTP only if the user exists. We deliberately return the same
    # generic error for "no such user" and "bad/expired OTP" so this endpoint can't
    # be used to enumerate which emails are registered (matches /forgot-password).
    token = None
    if user:
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
    
    validate_password_strength(request.new_password)
    # Update password
    user.hashed_password = get_password_hash(request.new_password)
    db.commit()

    return {"message": "Password updated successfully"}
