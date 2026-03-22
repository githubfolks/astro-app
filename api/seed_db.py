import random
from app.database import SessionLocal, engine, Base
from app.models import User, UserRole, SeekerProfile, AstrologerProfile, UserWallet, GenderType
from app.models_edu import Course, Batch, ClassSession, BatchEnrollment
from app.routers.auth import get_password_hash
from decimal import Decimal
from datetime import datetime, timedelta

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

def seed():
    # 0. Create Admin
    admin_email = "admin@test.com"
    admin = db.query(User).filter(User.email == admin_email).first()
    if not admin:
        print(f"Creating Admin: {admin_email}")
        admin = User(
            email=admin_email,
            phone_number="0000000000",
            hashed_password=get_password_hash("password"),
            role=UserRole.ADMIN,
            is_verified=True
        )
        db.add(admin)
        db.commit()
    else:
        print(f"Admin already exists: {admin_email}")

    # 0b. Create Tutor
    tutor_email = "tutor@test.com"
    tutor = db.query(User).filter(User.email == tutor_email).first()
    if not tutor:
        print(f"Creating Tutor: {tutor_email}")
        tutor = User(
            email=tutor_email,
            phone_number="1111111111",
            hashed_password=get_password_hash("password"),
            role=UserRole.TUTOR,
            is_verified=True
        )
        db.add(tutor)
        db.commit()
    else:
        print(f"Tutor already exists: {tutor_email}")

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
            "about": "Expert in Vedic Astrology",
            "rating": "5.0"
        },
        {
            "email": "luna@test.com",
            "phone": "8888888001",
            "name": "Mystic Luna",
            "specialties": "Tarot, Psychic",
            "languages": "English, Spanish",
            "exp": 8,
            "fee": "15.00",
            "about": "Intuitive Tarot reader and Psychic medium.",
            "rating": "4.8"
        },
        {
            "email": "guru@test.com",
            "phone": "8888888002",
            "name": "Guru Dev",
            "specialties": "Vedic, Palmistry",
            "languages": "Hindi, Sanskrit, English",
            "exp": 15,
            "fee": "20.00",
            "about": "Traditional Vedic Astrologer with deep knowledge of scriptures.",
            "rating": "4.9"
        },
        {
            "email": "bella@test.com",
            "phone": "8888888003",
            "name": "Astro Bella",
            "specialties": "Numerology, Western",
            "languages": "English, French",
            "exp": 3,
            "fee": "12.00",
            "about": "Helping you find your path through numbers and stars.",
            "rating": "4.5"
        },
        {
            "email": "pandit@test.com",
            "phone": "8888888004",
            "name": "Pandit Ji",
            "specialties": "Vedic, Vastu",
            "languages": "Hindi, English",
            "exp": 20,
            "fee": "25.00",
            "about": "Expert in Vastu Shastra and Vedic remedies.",
            "rating": "4.7"
        },
        {
            "email": "ray@test.com",
            "phone": "8888888005",
            "name": "Cosmic Ray",
            "specialties": "K.P., Nadi",
            "languages": "English, Tamil",
            "exp": 10,
            "fee": "18.00",
            "about": "Precision astrology using K.P. and Nadi systems.",
            "rating": "4.6"
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
                is_online=random.choice([True, False]),
                rating_avg=Decimal(data["rating"])
            ))
            # Wallet
            db.add(UserWallet(user_id=astro.id, balance=Decimal("0.00")))
            db.commit()
        else:
            print(f"Astrologer already exists: {astro_email}")

    # 3. Create Education Data
    print("Seeding Education Data...")
    tutor_user = db.query(User).filter(User.role == UserRole.TUTOR).first()
    seeker_user = db.query(User).filter(User.role == UserRole.SEEKER).first()

    if tutor_user and seeker_user:
        # Courses
        edu_courses = [
            {"title": "Vedic Astrology Foundation", "desc": "Learn the basics of Vedic astrology."},
            {"title": "Advanced Palmistry", "desc": "Master the art of reading palms."}
        ]
        
        for c_data in edu_courses:
            course = db.query(Course).filter(Course.title == c_data["title"]).first()
            if not course:
                print(f"Creating Course: {c_data['title']}")
                course = Course(title=c_data["title"], description=c_data["desc"], teacher_id=tutor_user.id)
                db.add(course)
                db.commit()
                db.refresh(course)
                
                # Batch
                batch = Batch(course_id=course.id, name="Batch A - Spring 2026", max_students=10)
                db.add(batch)
                db.commit()
                db.refresh(batch)
                
                # Enrollment
                enrollment = BatchEnrollment(batch_id=batch.id, user_id=seeker_user.id)
                db.add(enrollment)
                db.commit()
                
                # Sessions (One active now, one upcoming)
                now = datetime.utcnow()
                active_session = ClassSession(
                    batch_id=batch.id,
                    title=f"{course.title} - Intro Session",
                    scheduled_start=now - timedelta(minutes=5),
                    scheduled_end=now + timedelta(hours=1),
                    miro_room_id=f"room_{course.id}_{batch.id}"
                )
                db.add(active_session)
                
                upcoming_session = ClassSession(
                    batch_id=batch.id,
                    title=f"{course.title} - Q&A Session",
                    scheduled_start=now + timedelta(days=1),
                    scheduled_end=now + timedelta(days=1, hours=1),
                    miro_room_id=f"room_qa_{course.id}_{batch.id}"
                )
                db.add(upcoming_session)
                db.commit()

    print("Seeding Complete!")

if __name__ == "__main__":
    try:
        seed()
    finally:
        db.close()
