from app.database import SessionLocal
from app.models import Consultation

db = SessionLocal()
c = db.query(Consultation).filter(Consultation.id == 6).first()
if c:
    print(f"ID: {c.id}")
    print(f"Status: {c.status}")
    print(f"Seeker: {c.seeker_id}")
    print(f"Astrologer: {c.astrologer_id}")
else:
    print("Consultation 6 not found.")
db.close()
