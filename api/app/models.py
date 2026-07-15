from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, DECIMAL, Text, Date, Time, JSON, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SEEKER = "SEEKER"
    ASTROLOGER = "ASTROLOGER"
    TUTOR = "TUTOR"

class GenderType(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class ConsultationType(str, enum.Enum):
    CHAT = "CHAT"
    VOICE = "VOICE"
    VIDEO = "VIDEO"

class ConsultationStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    ACCEPTED = "ACCEPTED"
    ACTIVE = "ACTIVE"
    PAUSED = "PAUSED"
    AUTO_ENDED = "AUTO_ENDED"
    REJECTED = "REJECTED"
    MISSED = "MISSED"

class TransactionType(str, enum.Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    CHAT_DEDUCTION = "CHAT_DEDUCTION"
    CHAT_REFUND = "CHAT_REFUND"
    PAYMENT_GATEWAY = "PAYMENT_GATEWAY"
    COURSE_PURCHASE = "COURSE_PURCHASE"
    PACKAGE_PURCHASE = "PACKAGE_PURCHASE"

class OnboardingStage(str, enum.Enum):
    APPLIED = "APPLIED"
    INTERVIEW_SCHEDULED = "INTERVIEW_SCHEDULED"
    PROFILE_ACTIVATED = "PROFILE_ACTIVATED"
    ONBOARDING_INTIMATED = "ONBOARDING_INTIMATED"
    ONBOARDING_STARTED = "ONBOARDING_STARTED"
    TRAINING_SCHEDULED = "TRAINING_SCHEDULED"
    COMPLETED = "COMPLETED"
    REJECTED = "REJECTED"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    role = Column(Enum(UserRole), nullable=False)
    hashed_password = Column(String) # Valid for JWT auth
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    seeker_profile = relationship("SeekerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    astrologer_profile = relationship("AstrologerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    wallet = relationship("UserWallet", back_populates="user", uselist=False, cascade="all, delete-orphan")
    wallet_transactions = relationship("WalletTransaction", back_populates="user", cascade="all, delete-orphan")

class SeekerProfile(Base):
    __tablename__ = "seeker_profiles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    full_name = Column(String)
    date_of_birth = Column(Date)
    time_of_birth = Column(Time)
    place_of_birth = Column(String)
    gender = Column(Enum(GenderType))
    profile_picture_url = Column(String)

    user = relationship("User", back_populates="seeker_profile")

class AstrologerProfile(Base):
    __tablename__ = "astrologer_profiles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    full_name = Column(String, nullable=False)
    display_name = Column(String, nullable=True)  # Public stage name shown to seekers; falls back to full_name
    profile_picture_url = Column(String)
    short_bio = Column(String) # For card view
    about_me = Column(Text)
    experience_years = Column(Integer)
    languages = Column(String)
    specialties = Column(String)
    consultation_fee_per_min = Column(DECIMAL(10, 2), default=0.0)
    commission_percentage = Column(DECIMAL(5, 2), default=70.0) # Percentage share for Astrologer
    is_online = Column(Boolean, default=False)
    rating_avg = Column(DECIMAL(3, 2), default=0.0)
    total_consultations = Column(Integer, default=0)
    availability_hours = Column(String, nullable=True)
    whatsapp_number = Column(String, nullable=True)  # Alternate contact number, entered post-login during onboarding
    city = Column(String, nullable=True)
    id_proof_url = Column(String, nullable=True)
    slug = Column(String, unique=True, index=True, nullable=True)
    astrology_types = Column(JSON, nullable=True) # List of types
    is_approved = Column(Boolean, default=False)
    is_premium = Column(Boolean, default=False, nullable=False)  # Admin-granted: surfaces astrologer at the top of listings
    onboarding_stage = Column(Enum(OnboardingStage), default=OnboardingStage.APPLIED, nullable=False)
    onboarding_meta = Column(JSON, nullable=True)  # Last-entered email fields per step, for card re-display
    legal_agreement_accepted = Column(Boolean, default=False)
    legal_agreement_accepted_at = Column(DateTime(timezone=True), nullable=True)

    # Post-login onboarding checklist (see onboarding-tasks.md) --------------
    # Digital contract — set server-side only by POST /astrologers/contract/sign,
    # never through the generic profile-update endpoint, so it can't be forged.
    contract_signed_at = Column(DateTime(timezone=True), nullable=True)
    contract_signature_name = Column(String, nullable=True)  # Typed full name used as the e-signature
    # KYC
    pan_number = Column(String, nullable=True)
    pan_doc_url = Column(String, nullable=True)
    aadhaar_number = Column(String, nullable=True)
    aadhaar_doc_url = Column(String, nullable=True)
    bank_account_holder_name = Column(String, nullable=True)
    bank_account_number = Column(String, nullable=True)
    bank_ifsc = Column(String, nullable=True)
    bank_name = Column(String, nullable=True)
    bank_address = Column(String, nullable=True)
    # Set by admin after manually reviewing the KYC docs/certificates below.
    kyc_verified = Column(Boolean, default=False, nullable=False)
    kyc_verified_at = Column(DateTime(timezone=True), nullable=True)
    # Certificates — optional, for internal verification only (never shown publicly)
    certificate_urls = Column(JSON, nullable=True)

    user = relationship("User", back_populates="astrologer_profile")

class UserWallet(Base):
    __tablename__ = "user_wallets"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    balance = Column(DECIMAL(10, 2), default=0.0)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="wallet")

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    amount = Column(DECIMAL(10, 2), nullable=False) # Positive for credit, negative for debit
    transaction_type = Column(Enum(TransactionType), nullable=False)
    reference_id = Column(String) # Can be Consultation ID or Payment Gateway ID
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="wallet_transactions")

class ChatPackage(Base):
    __tablename__ = "chat_packages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    duration_minutes = Column(Integer, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Consultation(Base):
    __tablename__ = "consultations"
    __table_args__ = (
        Index("ix_consultations_astrologer_id_status", "astrologer_id", "status"),
        Index("ix_consultations_seeker_id_status", "seeker_id", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    seeker_id = Column(Integer, ForeignKey("users.id"))
    astrologer_id = Column(Integer, ForeignKey("users.id"))
    consultation_type = Column(Enum(ConsultationType), nullable=False)
    topic = Column(String, nullable=True)
    concern_note = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer, default=0)
    rate_per_min = Column(DECIMAL(10, 2), nullable=False)
    total_cost = Column(DECIMAL(10, 2), default=0.0)
    # Seeker's very first-ever chat: billed at a flat promotional rate for the first 5
    # minutes (see promotional_rate_total) instead of the astrologer's normal rate_per_min.
    is_promotional_first_chat = Column(Boolean, default=False)
    promotional_rate_total = Column(DECIMAL(10, 2), nullable=True)
    status = Column(Enum(ConsultationStatus), default=ConsultationStatus.REQUESTED)
    disconnection_snapshot = Column(Text) # JSON string for resume state
    # Package billing fields (nullable — only set when booked via a fixed-time package)
    package_id = Column(Integer, ForeignKey("chat_packages.id"), nullable=True)
    package_seconds_remaining = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    seeker = relationship("User", foreign_keys=[seeker_id])
    astrologer = relationship("User", foreign_keys=[astrologer_id])
    review = relationship("Review", back_populates="consultation", uselist=False)
    seeker_profile = relationship("SeekerProfile", primaryjoin="foreign(Consultation.seeker_id) == SeekerProfile.user_id", viewonly=True, uselist=False)
    astrologer_profile = relationship("AstrologerProfile", primaryjoin="foreign(Consultation.astrologer_id) == AstrologerProfile.user_id", viewonly=True, uselist=False)
    package = relationship("ChatPackage", foreign_keys=[package_id])

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), unique=True)
    astrologer_id = Column(Integer, ForeignKey("users.id"))
    seeker_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer)
    comment = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    consultation = relationship("Consultation", back_populates="review")
    astrologer = relationship("User", foreign_keys=[astrologer_id])
    seeker = relationship("User", foreign_keys=[seeker_id])

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), index=True)
    sender_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    message_type = Column(String, nullable=False, server_default="text")  # "text" | "image"
    media_url = Column(String, nullable=True)  # set when message_type == "image"
    is_flagged = Column(Boolean, default=False)  # Set when moderation detects a violation
    flag_reason = Column(String, nullable=True)  # e.g. "phone_number,contact_intent"
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class AppSetting(Base):
    """Generic key/value store for super-admin-managed runtime config
    (moderation recipient, tunables)."""
    __tablename__ = "app_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class AiAstrologerUsage(Base):
    """Free-question counter for the public AI Astrologer teaser.
    Identity is name + date of birth (normalized), since guests aren't logged in."""
    __tablename__ = "ai_astrologer_usage"

    identity = Column(String, primary_key=True)  # "<lowercased name>|<YYYY-MM-DD>"
    questions_used = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())


class AvailabilityNotification(Base):
    """A seeker's request to be notified when a specific astrologer comes online."""
    __tablename__ = "availability_notifications"
    __table_args__ = (
        Index("ix_availability_notifications_astrologer_id_notified", "astrologer_id", "notified"),
    )

    id = Column(Integer, primary_key=True, index=True)
    seeker_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    astrologer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    seeker = relationship("User", foreign_keys=[seeker_id])
    astrologer = relationship("User", foreign_keys=[astrologer_id])


class ModerationFlagStatus(str, enum.Enum):
    OPEN = "OPEN"
    REVIEWED = "REVIEWED"
    DISMISSED = "DISMISSED"


class ModerationFlag(Base):
    """A flagged chat message (spam / contact-sharing) surfaced to the super admin."""
    __tablename__ = "moderation_flags"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False)
    message_id = Column(Integer, ForeignKey("chat_messages.id"), nullable=True)
    flagged_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Who sent the offending message
    reason = Column(String, nullable=False)  # comma-separated violation types
    snippet = Column(Text, nullable=True)  # Original (unmasked) text, admin-only
    status = Column(Enum(ModerationFlagStatus), default=ModerationFlagStatus.OPEN)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    consultation = relationship("Consultation", foreign_keys=[consultation_id])
    flagged_user = relationship("User", foreign_keys=[flagged_user_id])

class VerificationTokenType(str, enum.Enum):
    FORGOT_PASSWORD = "FORGOT_PASSWORD"
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"

class VerificationToken(Base):
    __tablename__ = "verification_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    token = Column(String, index=True)
    verification_type = Column(Enum(VerificationTokenType), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_used = Column(Boolean, default=False)

    user = relationship("User", foreign_keys=[user_id])

class PostStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    featured_image = Column(String, nullable=True)
    status = Column(Enum(PostStatus), default=PostStatus.DRAFT)
    author_id = Column(Integer, ForeignKey("users.id"))
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    author = relationship("User", backref="posts")

class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    content = Column(Text, nullable=False)
    seo_title = Column(String, nullable=True)
    seo_description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class ZodiacSign(str, enum.Enum):
    ARIES = "ARIES"
    TAURUS = "TAURUS"
    GEMINI = "GEMINI"
    CANCER = "CANCER"
    LEO = "LEO"
    VIRGO = "VIRGO"
    LIBRA = "LIBRA"
    SCORPIO = "SCORPIO"
    SAGITTARIUS = "SAGITTARIUS"
    CAPRICORN = "CAPRICORN"
    AQUARIUS = "AQUARIUS"
    PISCES = "PISCES"

class HoroscopePeriod(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    YEARLY = "YEARLY"

class Horoscope(Base):
    __tablename__ = "horoscopes"

    id = Column(Integer, primary_key=True, index=True)
    sign = Column(Enum(ZodiacSign), nullable=False)
    period = Column(Enum(HoroscopePeriod), nullable=False)
    date = Column(Date, nullable=False)
    content = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class PayoutStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSED = "PROCESSED"

class Payout(Base):
    __tablename__ = "payouts"

    id = Column(Integer, primary_key=True, index=True)
    astrologer_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(DECIMAL(10, 2), nullable=False)
    tds_deducted = Column(DECIMAL(10, 2), default=0.0, nullable=True)
    pg_charge_deducted = Column(DECIMAL(10, 2), default=0.0, nullable=True)
    status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING)
    period_start = Column(DateTime(timezone=True))
    period_end = Column(DateTime(timezone=True))
    transaction_reference = Column(String, nullable=True)
    admin_comments = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    astrologer = relationship("User", foreign_keys=[astrologer_id])

class AstrologerOnlineSession(Base):
    """Tracks each online→offline window for an astrologer, used to compute avg online time."""
    __tablename__ = "astrologer_online_sessions"
    __table_args__ = (
        Index("ix_astrologer_online_sessions_astrologer_id_ended_at", "astrologer_id", "ended_at"),
    )

    id = Column(Integer, primary_key=True, index=True)
    astrologer_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    astrologer = relationship("User", foreign_keys=[astrologer_id])


class DeviceToken(Base):
    __tablename__ = "device_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    fcm_token = Column(String, unique=True, index=True, nullable=False)
    platform = Column(String) # android, ios, web
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

    user = relationship("User", backref="device_tokens")

class InquiryStatus(str, enum.Enum):
    NEW = "NEW"
    READ = "READ"
    RESPONDED = "RESPONDED"
    ARCHIVED = "ARCHIVED"

class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    message = Column(Text, nullable=False)
    status = Column(Enum(InquiryStatus), default=InquiryStatus.NEW)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Null for system events
    action = Column(String, nullable=False, index=True)
    resource_type = Column(String, nullable=True)  # e.g. "consultation", "dispute", "payout"
    resource_id = Column(String, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    actor = relationship("User", foreign_keys=[actor_id])


class DisputeStatus(str, enum.Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    RESOLVED = "RESOLVED"
    REJECTED = "REJECTED"

class Dispute(Base):
    __tablename__ = "disputes"

    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False)
    raised_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(DisputeStatus), default=DisputeStatus.OPEN)
    admin_notes = Column(Text, nullable=True)
    resolution_amount = Column(DECIMAL(10, 2), nullable=True)  # Refund amount if applicable
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    consultation = relationship("Consultation", foreign_keys=[consultation_id])
    raised_by = relationship("User", foreign_keys=[raised_by_id])


class KundliReport(Base):
    __tablename__ = "kundli_reports"

    id = Column(Integer, primary_key=True, index=True)
    seeker_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Nullable for manual entry
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)  # Astrologer who generated
    full_name = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=False)
    time_of_birth = Column(Time, nullable=False)
    place_of_birth = Column(String, nullable=False)
    latitude = Column(DECIMAL(10, 6), nullable=True)
    longitude = Column(DECIMAL(10, 6), nullable=True)
    timezone = Column(String, default="Asia/Kolkata")
    chart_data = Column(JSON, nullable=False)  # Full AstroAPI JSON response
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Dasha Insights are cached here (1:1 with the report) rather than a separate
    # table, keyed by the reference date used — insights are re-fetched at most
    # once per calendar day since some facts are relative to "today".
    dasha_insights_data = Column(JSON, nullable=True)
    dasha_insights_date = Column(Date, nullable=True)

    seeker = relationship("User", foreign_keys=[seeker_id])
    astrologer = relationship("User", foreign_keys=[generated_by])


class PanchangCache(Base):
    """Cached standalone daily Panchang lookups, keyed by date + rounded location,
    so repeat requests for the same day/city don't re-hit FreeAstroAPI."""
    __tablename__ = "panchang_cache"
    __table_args__ = (
        Index("ix_panchang_cache_lookup", "date", "latitude", "longitude", unique=True),
    )

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    latitude = Column(DECIMAL(6, 2), nullable=False)  # rounded to 2dp so nearby queries hit cache
    longitude = Column(DECIMAL(6, 2), nullable=False)
    place_label = Column(String, nullable=True)
    timezone = Column(String, default="Asia/Kolkata")
    panchang_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class KundliMatchReport(Base):
    """Cached Kuta (Guna Milan) compatibility report between two birth charts."""
    __tablename__ = "kundli_match_reports"
    __table_args__ = (
        Index(
            "ix_kundli_match_reports_lookup",
            "boy_date_of_birth", "boy_time_of_birth", "boy_place_of_birth",
            "girl_date_of_birth", "girl_time_of_birth", "girl_place_of_birth",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    boy_seeker_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    girl_seeker_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    boy_full_name = Column(String, nullable=True)
    boy_date_of_birth = Column(Date, nullable=False)
    boy_time_of_birth = Column(Time, nullable=False)
    boy_place_of_birth = Column(String, nullable=False)
    boy_latitude = Column(DECIMAL(10, 6), nullable=True)
    boy_longitude = Column(DECIMAL(10, 6), nullable=True)

    girl_full_name = Column(String, nullable=True)
    girl_date_of_birth = Column(Date, nullable=False)
    girl_time_of_birth = Column(Time, nullable=False)
    girl_place_of_birth = Column(String, nullable=False)
    girl_latitude = Column(DECIMAL(10, 6), nullable=True)
    girl_longitude = Column(DECIMAL(10, 6), nullable=True)

    match_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    astrologer = relationship("User", foreign_keys=[generated_by])
    boy_seeker = relationship("User", foreign_keys=[boy_seeker_id])
    girl_seeker = relationship("User", foreign_keys=[girl_seeker_id])


class MuhuratSearch(Base):
    """Cached auspicious-timing (Muhurat) search results, generic or personalized
    to a birth chart, keyed by the search parameters so repeat lookups don't
    re-hit FreeAstroAPI."""
    __tablename__ = "muhurat_searches"
    __table_args__ = (
        Index(
            "ix_muhurat_searches_lookup",
            "purpose", "start_date", "end_date", "latitude", "longitude",
            "personalized", "subject_date_of_birth", "subject_time_of_birth", "subject_place_of_birth",
        ),
    )

    id = Column(Integer, primary_key=True, index=True)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    seeker_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    purpose = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    place = Column(String, nullable=False)
    latitude = Column(DECIMAL(6, 2), nullable=False)
    longitude = Column(DECIMAL(6, 2), nullable=False)

    personalized = Column(Boolean, default=False, nullable=False)
    subject_date_of_birth = Column(Date, nullable=True)
    subject_time_of_birth = Column(Time, nullable=True)
    subject_place_of_birth = Column(String, nullable=True)

    muhurat_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    astrologer = relationship("User", foreign_keys=[generated_by])
    seeker = relationship("User", foreign_keys=[seeker_id])


class ContentType(str, enum.Enum):
    SHORT_VIDEO = "SHORT_VIDEO"
    VOICE_OVER_IMAGE = "VOICE_OVER_IMAGE"


class VoiceGender(str, enum.Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"


class ContentJobStatus(str, enum.Enum):
    SCENES_GENERATED = "SCENES_GENERATED"
    RENDERING = "RENDERING"
    DONE = "DONE"
    FAILED = "FAILED"


class ContentStudioJob(Base):
    __tablename__ = "content_studio_jobs"

    id = Column(Integer, primary_key=True, index=True)
    topic = Column(String, nullable=False)
    content_type = Column(Enum(ContentType), nullable=False)
    voice_gender = Column(Enum(VoiceGender), default=VoiceGender.FEMALE, nullable=False)
    status = Column(Enum(ContentJobStatus), default=ContentJobStatus.SCENES_GENERATED, nullable=False)
    scenes = Column(JSON, nullable=False)  # [{index, narration_hi, image_prompt_en, image_url, audio_url, duration_sec, error}]
    output_video_url = Column(String, nullable=True)
    error_message = Column(Text, nullable=True)
    posted_facebook_at = Column(DateTime(timezone=True), nullable=True)
    posted_instagram_at = Column(DateTime(timezone=True), nullable=True)
    posted_youtube_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    creator = relationship("User", foreign_keys=[created_by])

