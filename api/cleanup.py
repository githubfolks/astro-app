from app.database import SessionLocal
from app.models import User, SeekerProfile, AstrologerProfile, UserWallet

db = SessionLocal()

def cleanup():
    emails = ["seeker@test.com", "astro@test.com"]
    users = db.query(User).filter(User.email.in_(emails)).all()
    
    for user in users:
        # Delete related records first (cascade should handle this but to be safe/explicit if needed, 
        # though SQLA cascade='all, delete' usually works if configured, otherwise manual deletion)
        # Assuming database cascade or manual:
        db.query(SeekerProfile).filter(SeekerProfile.user_id == user.id).delete()
        db.query(AstrologerProfile).filter(AstrologerProfile.user_id == user.id).delete()
        db.query(UserWallet).filter(UserWallet.user_id == user.id).delete()
        db.delete(user)
    
    db.commit()
    print(f"Deleted users: {emails}")

if __name__ == "__main__":
    try:
        cleanup()
    finally:
        db.close()
