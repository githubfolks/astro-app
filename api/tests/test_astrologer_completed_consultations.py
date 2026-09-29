"""Public consultation counts come from real completed Consultation rows, never
from the unused AstrologerProfile.total_consultations column or an estimate."""
from app import models


def _listed_astrologer(make_user, db_session, full_name="Astro Count"):
    user = make_user(models.UserRole.ASTROLOGER, full_name=full_name)
    profile = db_session.query(models.AstrologerProfile).filter_by(user_id=user.id).one()
    profile.is_approved = True
    profile.onboarding_stage = models.OnboardingStage.COMPLETED
    profile.slug = f"astro-{user.id}"
    db_session.commit()
    return user


def _consultation(db_session, seeker, astro, status):
    db_session.add(models.Consultation(
        seeker_id=seeker.id,
        astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT,
        rate_per_min=10.0,
        status=status,
    ))
    db_session.commit()


def _seed(make_user, db_session):
    astro = _listed_astrologer(make_user, db_session)
    other = _listed_astrologer(make_user, db_session, full_name="Astro Other")
    seeker = make_user(models.UserRole.SEEKER)
    for status in (
        models.ConsultationStatus.COMPLETED,
        models.ConsultationStatus.AUTO_ENDED,
        models.ConsultationStatus.CANCELLED,
        models.ConsultationStatus.MISSED,
        models.ConsultationStatus.REJECTED,
        models.ConsultationStatus.REQUESTED,
    ):
        _consultation(db_session, seeker, astro, status)
    return astro, other


def test_list_reports_only_completed_and_auto_ended(client, make_user, db_session):
    astro, other = _seed(make_user, db_session)
    counts = {p["user_id"]: p["completed_consultations"] for p in client.get("/astrologers/").json()}
    assert counts[astro.id] == 2
    assert counts[other.id] == 0


def test_single_profile_reports_completed_count(client, make_user, db_session):
    astro, _ = _seed(make_user, db_session)
    body = client.get(f"/astrologers/{astro.id}").json()
    assert body["completed_consultations"] == 2
    # The stale column is untouched — the real count lives in its own field.
    assert body["total_consultations"] == 0


def test_trust_stats_count_real_completed_consultations(client, make_user, db_session):
    _seed(make_user, db_session)
    assert client.get("/public/trust-stats").json()["total_consultations"] == 2
