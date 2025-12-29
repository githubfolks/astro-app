from app.database import SessionLocal, engine, Base
from app.models import User, UserRole, SeekerProfile, AstrologerProfile, UserWallet, GenderType
from app.routers.auth import get_password_hash
from decimal import Decimal

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed():
    # 1. Create Seeker
    seeker_email = "seeker@test.com"
    seeker = db.query(User).filter(User.email == seeker_email).first()
    if not seeker:
        print(f"Creating Seeker: {seeker_email}")
        seeker = User(
            email=seeker_email,
            phone_number="9999999999",
            hashed_password=get_password_hash("password"),
            role=UserRole.SEEKER,
            is_verified=True
        )
        db.add(seeker)
        db.commit()
        db.refresh(seeker)
        
        # Profile
        db.add(SeekerProfile(user_id=seeker.id, full_name="Test Seeker", gender=GenderType.MALE))
        # Wallet with money
        db.add(UserWallet(user_id=seeker.id, balance=Decimal("1000.00")))
        db.commit()
    else:
        print(f"Seeker already exists: {seeker_email}")

    # 2. Create Astrologer
    astro_email = "astro@test.com"
    astro = db.query(User).filter(User.email == astro_email).first()
    if not astro:
        print(f"Creating Astrologer: {astro_email}")
        astro = User(
            email=astro_email,
            phone_number="8888888888",
            hashed_password=get_password_hash("password"),
            role=UserRole.ASTROLOGER,
            is_verified=True
        )
        db.add(astro)
        db.commit()
        db.refresh(astro)
        
        # Profile
        db.add(AstrologerProfile(
            user_id=astro.id, 
            full_name="Astro Star",
            specialties="Vedic, Numerology",
            languages="English, Hindi",
            experience_years=5,
            consultation_fee_per_min=Decimal("10.00"),
            about_me="Expert in Vedic Astrology",
            is_online=True
        ))
        # Wallet
        db.add(UserWallet(user_id=astro.id, balance=Decimal("0.00")))
        db.commit()
    else:
        print(f"Astrologer already exists: {astro_email}")

    print("Seeding Complete!")

if __name__ == "__main__":
    try:
        seed()
    finally:
        db.close()
