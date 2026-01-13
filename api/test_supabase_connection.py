
from app.database import SessionLocal
from app.models import User

def test_connection():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Connection Successful! Found {len(users)} users.")
        for user in users:
            print(f"- {user.email} (Role: {user.role})")
    except Exception as e:
        print(f"Connection Failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    test_connection()
