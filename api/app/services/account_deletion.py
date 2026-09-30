"""Self-service seeker account deletion.

The user row is anonymized rather than removed: consultations, wallet
transactions, payment orders, reviews and audit logs reference it and must be
kept for tax, dispute and payout records. Personal data (contact details,
birth details, login identifiers, device tokens, astrologer-generated Kundli
reports) is erased. Chat messages are not erased here — they are kept for
dispute resolution and purged by retention_service like everyone else's.
"""
import secrets
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import audit, models
from ..routers.auth import get_password_hash

# A consultation in any of these states may still bill, refund or be resumed.
IN_PROGRESS_STATUSES = [
    models.ConsultationStatus.REQUESTED,
    models.ConsultationStatus.ONGOING,
    models.ConsultationStatus.ACCEPTED,
    models.ConsultationStatus.ACTIVE,
    models.ConsultationStatus.PAUSED,
]
OPEN_DISPUTE_STATUSES = [models.DisputeStatus.OPEN, models.DisputeStatus.INVESTIGATING]


class AccountDeletionBlocked(Exception):
    """Deletion can't proceed; the message is safe to show the user."""

    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code
        self.message = message


def check_deletable(db: Session, user: models.User) -> None:
    if user.role != models.UserRole.SEEKER:
        raise AccountDeletionBlocked(
            "ROLE_NOT_SELF_SERVICE",
            "Astrologer and staff accounts can't be deleted from the app, because pending payouts and tax "
            "records must be settled first. Please contact support to close your account.",
        )

    wallet = db.query(models.UserWallet).filter(models.UserWallet.user_id == user.id).first()
    balance = Decimal(str(wallet.balance or 0)) if wallet else Decimal("0")
    if balance > 0:
        raise AccountDeletionBlocked(
            "WALLET_BALANCE_REMAINING",
            f"Your wallet still has ₹{balance:.2f}. Please use it, or contact support to request a refund, "
            "before deleting your account.",
        )

    in_progress = db.query(models.Consultation.id).filter(
        models.Consultation.seeker_id == user.id,
        models.Consultation.status.in_(IN_PROGRESS_STATUSES),
    ).first()
    if in_progress:
        raise AccountDeletionBlocked(
            "CONSULTATION_IN_PROGRESS",
            "You have a consultation that is still in progress. Please end it before deleting your account.",
        )

    open_dispute = db.query(models.Dispute.id).filter(
        models.Dispute.raised_by_id == user.id,
        models.Dispute.status.in_(OPEN_DISPUTE_STATUSES),
    ).first()
    if open_dispute:
        raise AccountDeletionBlocked(
            "DISPUTE_OPEN",
            "You have a dispute that is still being reviewed. Please wait for it to be resolved before "
            "deleting your account.",
        )


def delete_seeker_account(db: Session, user: models.User) -> None:
    """Anonymize `user` and erase their personal data. Caller must have run
    check_deletable. Commits."""
    check_deletable(db, user)
    user_id = user.id

    # Login identifiers: freed so the email/phone can register again, and the
    # password replaced with an unknowable one.
    user.email = f"deleted-{uuid.uuid4().hex}@deleted.invalid"
    user.phone_number = None
    user.hashed_password = get_password_hash(secrets.token_urlsafe(32))
    user.oauth_provider = None
    user.oauth_id = None
    user.is_verified = False
    user.is_active = False
    user.deleted_at = datetime.now(timezone.utc)

    # Profile row is kept (consultation/review views join to it) but emptied.
    profile = db.query(models.SeekerProfile).filter(models.SeekerProfile.user_id == user_id).first()
    if profile:
        profile.full_name = None
        profile.date_of_birth = None
        profile.time_of_birth = None
        profile.place_of_birth = None
        profile.gender = None
        profile.profile_picture_url = None

    # Personal details the seeker typed into consultation requests (concern,
    # partner's birth details). Billing fields on the row are kept.
    db.query(models.Consultation).filter(models.Consultation.seeker_id == user_id).update({
        models.Consultation.concern_note: None,
        models.Consultation.spouse_name: None,
        models.Consultation.spouse_date_of_birth: None,
        models.Consultation.spouse_time_of_birth: None,
        models.Consultation.spouse_place_of_birth: None,
    }, synchronize_session=False)

    db.query(models.KundliReport).filter(models.KundliReport.seeker_id == user_id).delete(synchronize_session=False)
    db.query(models.KundliMatchReport).filter(or_(
        models.KundliMatchReport.boy_seeker_id == user_id,
        models.KundliMatchReport.girl_seeker_id == user_id,
    )).delete(synchronize_session=False)
    db.query(models.DeviceToken).filter(models.DeviceToken.user_id == user_id).delete(synchronize_session=False)
    db.query(models.VerificationToken).filter(models.VerificationToken.user_id == user_id).delete(synchronize_session=False)
    db.query(models.AvailabilityNotification).filter(
        models.AvailabilityNotification.seeker_id == user_id
    ).delete(synchronize_session=False)
    db.query(models.AstrologerAllowedSeeker).filter(
        models.AstrologerAllowedSeeker.seeker_id == user_id
    ).delete(synchronize_session=False)

    audit.log(db, "ACCOUNT_DELETED", actor_id=user_id, resource_type="user", resource_id=user_id,
              details={"role": user.role.value})
    db.commit()
