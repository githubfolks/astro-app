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

    # 2. Create Astrologers
    astrologers_data = [
        {
            "email": "astro@test.com",
            "phone": "8888888888",
            "name": "Astro Star",
            "specialties": "Vedic, Numerology",
            "languages": "English, Hindi",
            "exp": 5,
            "fee": "10.00",
            "about": "Expert in Vedic Astrology"
        },
        {
            "email": "luna@test.com",
            "phone": "8888888001",
            "name": "Mystic Luna",
            "specialties": "Tarot, Psychic",
            "languages": "English, Spanish",
            "exp": 8,
            "fee": "15.00",
            "about": "Intuitive Tarot reader and Psychic medium."
        },
        {
            "email": "guru@test.com",
            "phone": "8888888002",
            "name": "Guru Dev",
            "specialties": "Vedic, Palmistry",
            "languages": "Hindi, Sanskrit, English",
            "exp": 15,
            "fee": "20.00",
            "about": "Traditional Vedic Astrologer with deep knowledge of scriptures."
        },
        {
            "email": "bella@test.com",
            "phone": "8888888003",
            "name": "Astro Bella",
            "specialties": "Numerology, Western",
            "languages": "English, French",
            "exp": 3,
            "fee": "12.00",
            "about": "Helping you find your path through numbers and stars."
        },
        {
            "email": "pandit@test.com",
            "phone": "8888888004",
            "name": "Pandit Ji",
            "specialties": "Vedic, Vastu",
            "languages": "Hindi, English",
            "exp": 20,
            "fee": "25.00",
            "about": "Expert in Vastu Shastra and Vedic remedies."
        },
        {
            "email": "ray@test.com",
            "phone": "8888888005",
            "name": "Cosmic Ray",
            "specialties": "K.P., Nadi",
            "languages": "English, Tamil",
            "exp": 10,
            "fee": "18.00",
            "about": "Precision astrology using K.P. and Nadi systems."
        }
    ]

    for data in astrologers_data:
        astro_email = data["email"]
        astro = db.query(User).filter(User.email == astro_email).first()
        if not astro:
            print(f"Creating Astrologer: {astro_email}")
            astro = User(
                email=astro_email,
                phone_number=data["phone"],
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
                full_name=data["name"],
                specialties=data["specialties"],
                languages=data["languages"],
                experience_years=data["exp"],
                consultation_fee_per_min=Decimal(data["fee"]),
                about_me=data["about"],
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
