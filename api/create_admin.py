from app.database import SessionLocal
from app.models import User, UserRole, UserWallet
from app.routers.auth import get_password_hash
import sys

def create_admin():
    db = SessionLocal()
    try:
        email = "admin@test.com"
        password = "adminpassword"
        
        user = db.query(User).filter(User.email == email).first()
        if user:
            print(f"Admin user {email} already exists. Updating password...")
            user.hashed_password = get_password_hash(password)
            user.role = UserRole.ADMIN
            user.is_active = True
        else:
            print(f"Creating new admin user {email}...")
            hashed_password = get_password_hash(password)
            user = User(
                email=email,
                hashed_password=hashed_password,
                role=UserRole.ADMIN,
                is_active=True,
                phone_number="0000000000" # Dummy phone for admin
            )
            db.add(user)
            db.flush() # get ID
            
            # Create wallet if needed (though admins might not need it, schema might enforce or logic might expect it)
            wallet = UserWallet(user_id=user.id)
            db.add(wallet)
            
        db.commit()
        print("Success! Admin configured:")
        print(f"Email: {email}")
        print(f"Password: {password}")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Running Admin Creation Script...")
    create_admin()
