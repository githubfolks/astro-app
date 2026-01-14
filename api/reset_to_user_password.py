from app.database import SessionLocal
from app.models import User
from app.routers.auth import get_password_hash

db = SessionLocal()
email = "admin@test.com"
password = "adminpassword"

user = db.query(User).filter(User.email == email).first()
if user:
    user.hashed_password = get_password_hash(password)
    db.commit()
    print(f"Password for {email} has been reset to: {password}")
else:
    print(f"User {email} not found.")

db.close()
