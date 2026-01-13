import os
from app.database import SessionLocal, engine, Base
from app.models import User, UserRole
from app.routers.auth import get_password_hash
from dotenv import load_dotenv

# Ensure we are using the local configuration by ignoring existing env var if set to production
# But actually, best way is to set APP_ENV explicitly in the code or loading the env file directly
load_dotenv(".env.development", override=True) # Force local dev env

# Ensure tables exist (just in case)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def create_admin():
    email = "admin@test.com"
    phone = "0000000000"
    password = "adminpassword"
    
    # Check if admin exists
    existing_admin = db.query(User).filter(User.email == email).first()
    if existing_admin:
        print(f"Admin user already exists: {email}")
        return

    print(f"Creating Admin User: {email}")
    admin_user = User(
        email=email,
        phone_number=phone,
        hashed_password=get_password_hash(password),
        role=UserRole.ADMIN,
        is_verified=True
    )
    
    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)
    print(f"Admin user created successfully. ID: {admin_user.id}")
    print(f"Email: {email}")
    print(f"Password: {password}")

if __name__ == "__main__":
    try:
        create_admin()
    finally:
        db.close()
