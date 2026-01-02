from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Add parent dir to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SQLALCHEMY_DATABASE_URL, Base, engine
from app import models
from app.routers.auth import get_password_hash

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def create_admin():
    db = SessionLocal()
    email = "admin@instaastro.com"
    phone = "9999999999"
    password = "adminpassword"
    
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        print(f"Admin user {email} already exists.")
        return

    admin_user = models.User(
        email=email,
        phone_number=phone,
        hashed_password=get_password_hash(password),
        role=models.UserRole.ADMIN,
        is_verified=True
    )
    db.add(admin_user)
    db.commit()
    print(f"Created admin user: {email} / {password}")
    db.close()

if __name__ == "__main__":
    try:
        # ensure tables exist
        Base.metadata.create_all(bind=engine)
        create_admin()
    except Exception as e:
        print(f"Error creating admin: {e}")
        import traceback
        traceback.print_exc()
