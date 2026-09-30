"""Seeker self-service account deletion: blocked while money or an open
process is outstanding; otherwise personal data is erased, financial records
are kept, and the account's tokens stop working."""
from datetime import date, datetime, time, timedelta
from decimal import Decimal

from app import models
from app.routers.auth import get_password_hash
from tests.conftest import auth_headers


def _delete(client, user, confirm="DELETE"):
    return client.request("DELETE", "/users/me", headers=auth_headers(user), json={"confirm": confirm})


def _consultation(db, seeker, astro, status, **kw):
    c = models.Consultation(
        seeker_id=seeker.id, astrologer_id=astro.id, consultation_type=models.ConsultationType.CHAT,
        rate_per_min=Decimal("10"), status=status, **kw,
    )
    db.add(c)
    db.commit()
    return c


def test_requires_auth(client):
    assert client.request("DELETE", "/users/me", json={"confirm": "DELETE"}).status_code == 401


def test_requires_exact_confirmation(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    assert _delete(client, seeker, confirm="delete").status_code == 400


def test_astrologer_cannot_self_delete(client, make_user):
    astro = make_user(models.UserRole.ASTROLOGER)
    resp = _delete(client, astro)
    assert resp.status_code == 409
    assert resp.json()["detail"]["code"] == "ROLE_NOT_SELF_SERVICE"


def test_blocked_while_wallet_has_balance(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=0.01)
    resp = _delete(client, seeker)
    assert resp.status_code == 409
    assert resp.json()["detail"]["code"] == "WALLET_BALANCE_REMAINING"
    db_session.refresh(seeker)
    assert seeker.deleted_at is None


def test_blocked_while_consultation_in_progress(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    _consultation(db_session, seeker, astro, models.ConsultationStatus.PAUSED)
    resp = _delete(client, seeker)
    assert resp.status_code == 409
    assert resp.json()["detail"]["code"] == "CONSULTATION_IN_PROGRESS"


def test_blocked_while_dispute_open(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    c = _consultation(db_session, seeker, astro, models.ConsultationStatus.COMPLETED)
    db_session.add(models.Dispute(consultation_id=c.id, raised_by_id=seeker.id, reason="x"))
    db_session.commit()
    resp = _delete(client, seeker)
    assert resp.status_code == 409
    assert resp.json()["detail"]["code"] == "DISPUTE_OPEN"


def test_deletion_erases_personal_data_and_keeps_financial_records(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, full_name="Asha Rao")
    astro = make_user(models.UserRole.ASTROLOGER)
    seeker_id, old_email, old_phone = seeker.id, seeker.email, seeker.phone_number

    profile = db_session.query(models.SeekerProfile).filter_by(user_id=seeker_id).one()
    profile.date_of_birth = date(1990, 1, 1)
    profile.time_of_birth = time(6, 30)
    profile.place_of_birth = "Mathura"
    c = _consultation(db_session, seeker, astro, models.ConsultationStatus.COMPLETED,
                      concern_note="marriage", spouse_name="Ravi", total_cost=Decimal("50"))
    db_session.add_all([
        models.WalletTransaction(user_id=seeker_id, amount=Decimal("-50"), transaction_type=models.TransactionType.CHAT_DEDUCTION, reference_id=str(c.id)),
        models.DeviceToken(user_id=seeker_id, fcm_token="tok"),
        models.ChatMessage(consultation_id=c.id, sender_id=seeker_id, message="hello"),
        models.KundliReport(seeker_id=seeker_id, generated_by=astro.id, full_name="Asha Rao",
                            date_of_birth=date(1990, 1, 1), time_of_birth=time(6, 30), place_of_birth="Mathura", chart_data={}),
    ])
    db_session.commit()
    headers = auth_headers(seeker)

    resp = _delete(client, seeker)
    assert resp.status_code == 200

    db_session.expire_all()
    user = db_session.get(models.User, seeker_id)
    assert user.deleted_at is not None and user.is_active is False
    assert user.email != old_email and user.email.endswith("@deleted.invalid")
    assert user.phone_number is None and user.oauth_id is None

    profile = db_session.query(models.SeekerProfile).filter_by(user_id=seeker_id).one()
    assert (profile.full_name, profile.date_of_birth, profile.time_of_birth, profile.place_of_birth) == (None, None, None, None)

    consult = db_session.get(models.Consultation, c.id)
    assert consult.concern_note is None and consult.spouse_name is None
    assert Decimal(consult.total_cost) == Decimal("50")  # billing record kept
    assert db_session.query(models.WalletTransaction).filter_by(user_id=seeker_id).count() == 1
    assert db_session.query(models.ChatMessage).filter_by(consultation_id=c.id).count() == 1  # left to retention purge
    assert db_session.query(models.DeviceToken).filter_by(user_id=seeker_id).count() == 0
    assert db_session.query(models.KundliReport).filter_by(seeker_id=seeker_id).count() == 0
    assert db_session.query(models.AuditLog).filter_by(action="ACCOUNT_DELETED").count() == 1

    # Existing token is dead, and the old email/phone can register again.
    assert client.get("/users/profile", headers=headers).status_code == 401
    db_session.add(models.User(email=old_email, phone_number=old_phone, role=models.UserRole.SEEKER,
                               hashed_password=get_password_hash("x")))
    db_session.commit()


def test_negative_balance_does_not_block(client, make_user):
    seeker = make_user(models.UserRole.SEEKER, balance=-5)
    assert _delete(client, seeker).status_code == 200
