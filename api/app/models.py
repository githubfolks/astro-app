from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, DECIMAL, Text, Date, Time
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
    is_online = Column(Boolean, default=False)
    rating_avg = Column(DECIMAL(3, 2), default=0.0)
    total_consultations = Column(Integer, default=0)
    availability_hours = Column(String, nullable=True)

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
