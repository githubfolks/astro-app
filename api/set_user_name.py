from app.database import SessionLocal
from app.models import User, SeekerProfile, UserRole

db = SessionLocal()

def set_name():
    # Find a seeker
    user = db.query(User).filter(User.role == UserRole.SEEKER).first()
    if not user:
        print("No seeker found. Please create one first.")
        return

    print(f"Updating user {user.email} (ID: {user.id})")
    
    # Check profile
    profile = db.query(SeekerProfile).filter(SeekerProfile.user_id == user.id).first()
    if not profile:
        print("Creating profile...")
        profile = SeekerProfile(user_id=user.id, full_name="Vikram Singh")
        db.add(profile)
    else:
        print(f"Updating existing profile (was {profile.full_name})...")
        profile.full_name = "Vikram Singh"
    
    db.commit()
    print("User profile updated with full_name='Vikram Singh'")

if __name__ == "__main__":
    try:
        set_name()
    finally:
        db.close()
