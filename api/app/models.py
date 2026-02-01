from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, DECIMAL, Text, Date, Time, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    SEEKER = "SEEKER"
    ASTROLOGER = "ASTROLOGER"

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
    city = Column(String, nullable=True)
    id_proof_url = Column(String, nullable=True)
    astrology_types = Column(JSON, nullable=True) # List of types
    is_approved = Column(Boolean, default=False)
    legal_agreement_accepted = Column(Boolean, default=False)
    legal_agreement_accepted_at = Column(DateTime(timezone=True), nullable=True)

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
    user_id = Column(Integer, ForeignKey("users.id"))
    amount = Column(DECIMAL(10, 2), nullable=False) # Positive for credit, negative for debit
    transaction_type = Column(Enum(TransactionType), nullable=False)
    reference_id = Column(String) # Can be Consultation ID or Payment Gateway ID
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="wallet_transactions")

class Consultation(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    seeker_id = Column(Integer, ForeignKey("users.id"))
    astrologer_id = Column(Integer, ForeignKey("users.id"))
    consultation_type = Column(Enum(ConsultationType), nullable=False)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer, default=0)
    rate_per_min = Column(DECIMAL(10, 2), nullable=False)
    total_cost = Column(DECIMAL(10, 2), default=0.0)
    status = Column(Enum(ConsultationStatus), default=ConsultationStatus.REQUESTED)
    disconnection_snapshot = Column(Text) # JSON string for resume state
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    seeker = relationship("User", foreign_keys=[seeker_id])
    astrologer = relationship("User", foreign_keys=[astrologer_id])
    review = relationship("Review", back_populates="consultation", uselist=False)
    seeker_profile = relationship("SeekerProfile", primaryjoin="foreign(Consultation.seeker_id) == SeekerProfile.user_id", viewonly=True, uselist=False)
    astrologer_profile = relationship("AstrologerProfile", primaryjoin="foreign(Consultation.astrologer_id) == AstrologerProfile.user_id", viewonly=True, uselist=False)

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
    consultation_id = Column(Integer, ForeignKey("consultations.id"))
    sender_id = Column(Integer, ForeignKey("users.id"))
    message = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class VerificationTokenType(str, enum.Enum):
    FORGOT_PASSWORD = "FORGOT_PASSWORD"
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    ONBOARDING_OTP = "ONBOARDING_OTP"

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
    status = Column(Enum(PayoutStatus), default=PayoutStatus.PENDING)
    period_start = Column(DateTime(timezone=True))
    period_end = Column(DateTime(timezone=True))
    transaction_reference = Column(String, nullable=True) # Bank ref ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    astrologer = relationship("User", foreign_keys=[astrologer_id])

class DeviceToken(Base):
    __tablename__ = "device_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
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

