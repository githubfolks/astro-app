from app.database import SessionLocal
from app import models
from app.routers.auth import get_password_hash

db = SessionLocal()
admin = db.query(models.User).filter(models.User.role == models.UserRole.ADMIN).first()
if admin:
    admin_created_email = "admin@aadikarta.org"
    print(f"Admin exists: {admin_created_email}")
    if admin.email != admin_created_email:
        print(f"Update email manually if needed. Found: {admin.email}")
    admin.hashed_password = get_password_hash("admin123")
    db.commit()
    print("Password reset to: admin123")
else:
    print("Creating admin user...")
    new_admin = models.User(
        email="admin@aadikarta.org",
        phone_number="+1234567890",
        hashed_password=get_password_hash("admin123"),
        role=models.UserRole.ADMIN,
        is_verified=True
    )
    db.add(new_admin)
    db.commit()
    print("Admin created: admin@aadikarta.org / admin123")
