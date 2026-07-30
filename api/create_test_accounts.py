"""
One-off script to create test accounts on the VPS:
  - astro1@aadikarta.org, astro2@aadikarta.org: pre-approved, restricted-visibility
    astrologers, hidden from public listing/profile and visible only to the
    seeker accounts below.
  - seeker1@aadikarta.org, seeker2@aadikarta.org: verified seekers, allow-listed
    against both astrologers.

Run once from api/ with the venv active and DB env vars set:
    TEST_ACCOUNTS_PASSWORD='<strong password>' python create_test_accounts.py

Idempotent: re-running updates existing rows instead of failing.
"""
import os
import sys

from app.database import SessionLocal
from app.models import (
    User, UserRole, UserWallet, SeekerProfile,
    AstrologerProfile, AstrologerAllowedSeeker, OnboardingStage,
)
from app.routers.auth import get_password_hash

ASTROLOGERS = [
    {"email": "astro1@aadikarta.org", "phone": "9000000001", "full_name": "Test Astrologer One"},
    {"email": "astro2@aadikarta.org", "phone": "9000000002", "full_name": "Test Astrologer Two"},
]
SEEKERS = [
    {"email": "seeker1@aadikarta.org", "phone": "9000000011", "full_name": "Test Seeker One"},
    {"email": "seeker2@aadikarta.org", "phone": "9000000012", "full_name": "Test Seeker Two"},
]


def get_or_create_user(db, email, phone, role, hashed_password):
    user = db.query(User).filter(User.email == email).first()
    if user:
        user.hashed_password = hashed_password
        user.role = role
        user.is_verified = True
        user.is_active = True
        print(f"Updated existing user {email}")
    else:
        user = User(
            email=email,
            phone_number=phone,
            hashed_password=hashed_password,
            role=role,
            is_verified=True,
            is_active=True,
        )
        db.add(user)
        db.flush()
        db.add(UserWallet(user_id=user.id))
        print(f"Created user {email}")
    return user


def main():
    password = os.getenv("TEST_ACCOUNTS_PASSWORD")
    if not password:
        print("Error: TEST_ACCOUNTS_PASSWORD environment variable not set.")
        sys.exit(1)
    hashed_password = get_password_hash(password)

    db = SessionLocal()
    try:
        seeker_users = []
        for s in SEEKERS:
            user = get_or_create_user(db, s["email"], s["phone"], UserRole.SEEKER, hashed_password)
            db.flush()
            if not user.seeker_profile:
                db.add(SeekerProfile(user_id=user.id, full_name=s["full_name"]))
            seeker_users.append(user)

        astro_users = []
        for a in ASTROLOGERS:
            user = get_or_create_user(db, a["email"], a["phone"], UserRole.ASTROLOGER, hashed_password)
            db.flush()
            profile = db.query(AstrologerProfile).filter(AstrologerProfile.user_id == user.id).first()
            if profile:
                profile.is_approved = True
                profile.is_restricted = True
                profile.onboarding_stage = OnboardingStage.COMPLETED
            else:
                profile = AstrologerProfile(
                    user_id=user.id,
                    full_name=a["full_name"],
                    consultation_fee_per_min=10,
                    experience_years=5,
                    languages="English, Hindi",
                    is_approved=True,
                    is_restricted=True,
                    onboarding_stage=OnboardingStage.COMPLETED,
                )
                db.add(profile)
            astro_users.append(user)

        db.commit()

        for astro in astro_users:
            for seeker in seeker_users:
                existing = db.query(AstrologerAllowedSeeker).filter(
                    AstrologerAllowedSeeker.astrologer_id == astro.id,
                    AstrologerAllowedSeeker.seeker_id == seeker.id,
                ).first()
                if not existing:
                    db.add(AstrologerAllowedSeeker(astrologer_id=astro.id, seeker_id=seeker.id))
                    print(f"Allow-listed seeker {seeker.email} for astrologer {astro.email}")
        db.commit()

        print("\nDone. Accounts created/updated:")
        for a in ASTROLOGERS + SEEKERS:
            print(f"  {a['email']}  (password: as passed via TEST_ACCOUNTS_PASSWORD)")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
