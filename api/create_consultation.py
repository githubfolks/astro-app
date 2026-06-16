from app.database import SessionLocal
from app.models import User, Consultation, ConsultationStatus, UserWallet
from decimal import Decimal
from datetime import datetime

db = SessionLocal()

def create():
    seeker = db.query(User).filter(User.email == "seeker@test.com").first()
    astro = db.query(User).filter(User.email == "astro@test.com").first()
    
    if not seeker or not astro:
        print("Users not found! Run seed_db.py first.")
        return

    # Check if active consultation exists
    existing = db.query(Consultation).filter(
        Consultation.seeker_id == seeker.id, 
        Consultation.astrologer_id == astro.id,
        Consultation.status != ConsultationStatus.COMPLETED
    ).first()
    
    if existing:
        print(f"Active Consultation already exists: ID {existing.id} (Status: {existing.status})")
        # Reset if needed?
        return

    print("Creating new consultation...")
    cons = Consultation(
        seeker_id=seeker.id,
        astrologer_id=astro.id,
        consultation_type="CHAT",
        rate_per_min=Decimal("10.00"),
        status=ConsultationStatus.REQUESTED,
        created_at=datetime.utcnow()
    )
    db.add(cons)
    db.commit()
    db.refresh(cons)
    print(f"Consultation Created! ID: {cons.id}")

if __name__ == "__main__":
    try:
        create()
    finally:
        db.close()
