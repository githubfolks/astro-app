from app.database import SessionLocal
from app.models import Consultation

db = SessionLocal()
c = db.query(Consultation).order_by(Consultation.id.desc()).first()
if c:
    print(f"ID: {c.id}")
    print(f"Status: {c.status}")
    print(f"Seeker: {c.seeker_id}")
    print(f"Astrologer: {c.astrologer_id}")
else:
    print("No consultations found.")
db.close()
