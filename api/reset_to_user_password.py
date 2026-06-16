from app.database import SessionLocal
from app.models import User
from app.routers.auth import get_password_hash

import os
db = SessionLocal()
email = os.getenv("ADMIN_EMAIL", "admin@test.com")
password = os.getenv("ADMIN_PASSWORD")

if not password:
    print("Error: ADMIN_PASSWORD environment variable not set.")
    sys.exit(1)

user = db.query(User).filter(User.email == email).first()
if user:
    user.hashed_password = get_password_hash(password)
    db.commit()
    print(f"Password for {email} has been reset to: {password}")
else:
    print(f"User {email} not found.")

db.close()
