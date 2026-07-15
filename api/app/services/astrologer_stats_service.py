"""Astrologer performance stats — shared by the admin detail view
(GET /admin/astrologers/{id}/stats) and the astrologer's own dashboard
(GET /astrologers/stats/performance)."""
from datetime import datetime, timedelta
from sqlalchemy import func
from sqlalchemy.orm import Session
from .. import models


def compute_performance_stats(db: Session, astrologer_id: int) -> dict:
    """
    Performance stats for an astrologer:
      - avg_online_hours_per_day_30d: rolling 30-day average daily online time
      - poor_chat_percentage: % of rated consultations with rating <= 2
      - first_user_repeat_percentage: % of "this astrologer was the seeker's very
        first consultation on the platform" seekers who came back to this astrologer again
      - loyal_user_percentage: % of this astrologer's unique seekers who returned within
        15 days of their first consultation with this astrologer AND stayed >10 min
    """
    completed_statuses = [models.ConsultationStatus.COMPLETED, models.ConsultationStatus.AUTO_ENDED]
    now = datetime.utcnow()
    window_start = now - timedelta(days=30)

    # --- Avg online time (last 30 days) ---
    sessions = db.query(models.AstrologerOnlineSession).filter(
        models.AstrologerOnlineSession.astrologer_id == astrologer_id,
        models.AstrologerOnlineSession.started_at < now,
        (models.AstrologerOnlineSession.ended_at.is_(None)) | (models.AstrologerOnlineSession.ended_at > window_start)
    ).all()
    total_online_seconds = 0.0
    for s in sessions:
        start = max(s.started_at.replace(tzinfo=None) if s.started_at.tzinfo else s.started_at, window_start)
        end = s.ended_at.replace(tzinfo=None) if s.ended_at and s.ended_at.tzinfo else (s.ended_at or now)
        end = min(end, now)
        if end > start:
            total_online_seconds += (end - start).total_seconds()
    avg_online_hours_per_day_30d = round((total_online_seconds / 30) / 3600, 2)

    # --- Poor chat % (rating <= 2) ---
    reviews = db.query(models.Review).filter(models.Review.astrologer_id == astrologer_id).all()
    total_reviews = len(reviews)
    poor_reviews = sum(1 for r in reviews if r.rating is not None and r.rating <= 2)
    poor_chat_percentage = round((poor_reviews / total_reviews) * 100, 2) if total_reviews else 0.0

    # --- First-user repeat % ---
    astro_consultations = db.query(models.Consultation).filter(
        models.Consultation.astrologer_id == astrologer_id,
        models.Consultation.status.in_(completed_statuses)
    ).order_by(models.Consultation.created_at.asc()).all()

    seeker_ids = {c.seeker_id for c in astro_consultations}
    first_ever_by_seeker = {}
    if seeker_ids:
        first_ever_rows = (
            db.query(models.Consultation.seeker_id, func.min(models.Consultation.created_at))
            .filter(models.Consultation.seeker_id.in_(seeker_ids))
            .filter(models.Consultation.status.in_(completed_statuses))
            .group_by(models.Consultation.seeker_id)
            .all()
        )
        first_ever_by_seeker = dict(first_ever_rows)

    consultations_by_seeker = {}
    for c in astro_consultations:
        consultations_by_seeker.setdefault(c.seeker_id, []).append(c)

    first_user_seeker_ids = [
        sid for sid, cons in consultations_by_seeker.items()
        if first_ever_by_seeker.get(sid) == cons[0].created_at
    ]
    first_user_repeat_count = sum(
        1 for sid in first_user_seeker_ids if len(consultations_by_seeker[sid]) >= 2
    )
    first_user_repeat_percentage = (
        round((first_user_repeat_count / len(first_user_seeker_ids)) * 100, 2) if first_user_seeker_ids else 0.0
    )

    # --- Loyal user % ---
    loyal_count = 0
    for sid, cons in consultations_by_seeker.items():
        if len(cons) < 2:
            continue
        first_time = cons[0].start_time or cons[0].created_at
        is_loyal = any(
            (c.start_time or c.created_at) and first_time and
            (c.start_time or c.created_at) - first_time <= timedelta(days=15) and
            (c.duration_seconds or 0) > 600
            for c in cons[1:]
        )
        if is_loyal:
            loyal_count += 1
    total_unique_seekers = len(consultations_by_seeker)
    loyal_user_percentage = round((loyal_count / total_unique_seekers) * 100, 2) if total_unique_seekers else 0.0

    return {
        "avg_online_hours_per_day_30d": avg_online_hours_per_day_30d,
        "poor_chat_percentage": poor_chat_percentage,
        "first_user_repeat_percentage": first_user_repeat_percentage,
        "loyal_user_percentage": loyal_user_percentage,
    }
