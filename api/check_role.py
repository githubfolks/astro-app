from app.database import SessionLocal
from app.models import User, UserRole

db = SessionLocal()
u = db.query(User).filter(User.id == 4).first()
if u:
    print(f"User 4 Role: {u.role}")
    print(f"Is Astrologer Enum? {u.role == UserRole.ASTROLOGER}")
    print(f"UserRole.ASTROLOGER value: {UserRole.ASTROLOGER.value}")
    print(f"Type of role: {type(u.role)}")
else:
    print("User 4 not found")
db.close()
