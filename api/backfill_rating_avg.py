from sqlalchemy import func
from app.database import SessionLocal
from app import models

db = SessionLocal()
rows = db.query(
    models.Review.astrologer_id,
    func.avg(models.Review.rating).label('avg_rating'),
    func.count(models.Review.id).label('review_count')
).group_by(models.Review.astrologer_id).all()

updated = 0
for astrologer_id, avg_rating, review_count in rows:
    profile = db.query(models.AstrologerProfile).filter(
        models.AstrologerProfile.user_id == astrologer_id
    ).first()
    if profile is None:
        continue
    new_avg = round(float(avg_rating), 2)
    if profile.rating_avg != new_avg:
        print(f"astrologer {astrologer_id}: {profile.rating_avg} -> {new_avg} ({review_count} reviews)")
        profile.rating_avg = new_avg
        updated += 1

db.commit()
print(f"Updated {updated} astrologer profile(s).")
