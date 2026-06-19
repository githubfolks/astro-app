from pydantic import BaseModel, Field, EmailStr, AfterValidator
from typing import Optional, List, Annotated
from datetime import date, time, datetime
from enum import Enum
from decimal import Decimal
import re

# Strong password policy: at least 8 characters with one lowercase letter,
# one uppercase letter, one digit and one special character.
def _validate_strong_password(value: str) -> str:
    errors = []
    if len(value) < 8:
        errors.append("at least 8 characters")
    if not re.search(r"[a-z]", value):
        errors.append("one lowercase letter")
    if not re.search(r"[A-Z]", value):
        errors.append("one uppercase letter")
    if not re.search(r"\d", value):
        errors.append("one number")
    if not re.search(r"[^A-Za-z0-9]", value):
        errors.append("one special character")
    if errors:
        raise ValueError("Password must contain " + ", ".join(errors) + ".")
    return value

# Reusable annotated type so every password field shares one policy.
StrongPassword = Annotated[str, AfterValidator(_validate_strong_password)]

# Enums
class UserRole(str, Enum):
    ADMIN = "ADMIN"
    SEEKER = "SEEKER"
    ASTROLOGER = "ASTROLOGER"

class GenderType(str, Enum):
    MALE = "MALE"
    FEMALE = "FEMALE"
    OTHER = "OTHER"

class TransactionType(str, Enum):
    DEPOSIT = "DEPOSIT"
    WITHDRAWAL = "WITHDRAWAL"
    CHAT_DEDUCTION = "CHAT_DEDUCTION"
    CHAT_REFUND = "CHAT_REFUND"
    PAYMENT_GATEWAY = "PAYMENT_GATEWAY"
    COURSE_PURCHASE = "COURSE_PURCHASE"

# Auth Schemas
class UserBase(BaseModel):
    phone_number: Optional[str] = Field(None, pattern=r'^\d{10,15}$')
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: StrongPassword
    role: UserRole

class UserLogin(BaseModel):
    username: str # Can be email or phone
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    full_name: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResendVerificationRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str
    verification_type: str = "FORGOT_PASSWORD"

class ResetPasswordRequest(BaseModel):
    token: str # The reset token received after verifying OTP
    new_password: StrongPassword

class AdminPasswordResetRequest(BaseModel):
    new_password: StrongPassword

# Seeker Profile Schemas
class SeekerProfileBase(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    time_of_birth: Optional[time] = None
    place_of_birth: Optional[str] = None
    gender: Optional[GenderType] = None
    profile_picture_url: Optional[str] = None

class SeekerProfileCreate(SeekerProfileBase):
    pass

class SeekerProfile(SeekerProfileBase):
    user_id: int
    class Config:
        from_attributes = True

# Astrologer Profile Schemas
class AstrologerProfileBase(BaseModel):
    full_name: str
    profile_picture_url: Optional[str] = None
    short_bio: Optional[str] = None
    about_me: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[str] = None
    specialties: Optional[str] = None
    consultation_fee_per_min: Decimal
    availability_hours: Optional[str] = None
    city: Optional[str] = None
    id_proof_url: Optional[str] = None
    astrology_types: Optional[List[str]] = None
    is_approved: bool = False
    legal_agreement_accepted: bool = False
    legal_agreement_accepted_at: Optional[datetime] = None

class AstrologerProfileCreate(AstrologerProfileBase):
    pass

class AstrologerProfileUPDATE(BaseModel):
    full_name: Optional[str] = None
    display_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    short_bio: Optional[str] = None
    about_me: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[str] = None
    specialties: Optional[str] = None
    consultation_fee_per_min: Optional[Decimal] = None
    availability_hours: Optional[str] = None
    is_online: Optional[bool] = None
    city: Optional[str] = None
    id_proof_url: Optional[str] = None
    astrology_types: Optional[List[str]] = None
    # is_approved, legal_agreement_accepted, legal_agreement_accepted_at are admin-only — never expose here

class AstrologerProfile(AstrologerProfileBase):
    user_id: int
    slug: Optional[str] = None
    display_name: Optional[str] = None
    is_online: bool
    rating_avg: Decimal
    total_consultations: int
    # Computed at response time (not DB columns):
    availability_status: Optional[str] = None  # ONLINE | BUSY | OFFLINE
    queue_length: Optional[int] = None         # seekers currently waiting (REQUESTED)
    class Config:
        from_attributes = True

# Wallet Schemas
class WalletTransactionBase(BaseModel):
    amount: Decimal
    transaction_type: TransactionType
    reference_id: Optional[str] = None
    description: Optional[str] = None

class WalletTransactionCreate(WalletTransactionBase):
    user_id: int

class WalletTransaction(WalletTransactionBase):
    id: int
    user_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class UserWallet(BaseModel):
    user_id: int
    balance: Decimal
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

# Consultation Schemas
class ConsultationBase(BaseModel):
    astrologer_id: int
    consultation_type: str # CHAT, VOICE, VIDEO
    rate_per_min: Optional[Decimal] = None # Optional request, usually set by system

class ConsultationCreate(ConsultationBase):
    pass

class Consultation(ConsultationBase):
    id: int
    seeker_id: int
    status: str
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = 0
    total_cost: Optional[Decimal] = 0.0
    created_at: datetime
    
    seeker_profile: Optional[SeekerProfile] = None
    astrologer_profile: Optional[AstrologerProfile] = None
    review: Optional['Review'] = None
    
    class Config:
        from_attributes = True

# Review Schemas
class ReviewCreate(BaseModel):
    consultation_id: int
    rating: int  # 1-5
    comment: Optional[str] = None

class Review(ReviewCreate):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

class ChatMessage(BaseModel):
    sender_id: int
    message: str
    timestamp: datetime
    class Config:
        from_attributes = True

class ChatMessageCreate(BaseModel):
    consultation_id: int
    content: str

class AdminUserListItem(BaseModel):
    id: int
    email: Optional[str]
    phone_number: Optional[str]
    role: UserRole
    is_verified: bool
    is_active: bool
    created_at: datetime
    wallet_balance: Optional[Decimal] = 0.0
    class Config:
        from_attributes = True

class UserPaginationResponse(BaseModel):
    total: int
    users: List[AdminUserListItem]

class AdminCreateAstrologer(BaseModel):
    # User info
    email: str
    phone_number: str
    password: StrongPassword
    # Profile info
    full_name: str
    short_bio: Optional[str] = None
    about_me: Optional[str] = None
    experience_years: int
    languages: str
    specialties: str
    consultation_fee_per_min: Decimal
    commission_percentage: Optional[Decimal] = Decimal("70.0")
    availability_hours: Optional[str] = None
    profile_picture_url: Optional[str] = None
    is_verified: bool = True
    city: Optional[str] = None
    id_proof_url: Optional[str] = None
    astrology_types: Optional[List[str]] = None

class AstrologerOnboardingRequest(BaseModel):
    # User fields
    full_name: str
    email: str
    phone_number: str
    password: StrongPassword
    # Profile fields
    astrology_types: List[str]
    experience_years: int
    languages: str
    preferred_working_hours: str
    city: Optional[str] = None
    short_bio: str
    profile_photo_url: str
    id_proof_url: Optional[str] = None
    legal_agreement_accepted: bool = True

class ContactInquiryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    message: str = Field(..., min_length=10, max_length=1000)

class ContactInquiry(ContactInquiryCreate):
    id: int
    status: str
    created_at: datetime
    class Config:
        from_attributes = True


# Kundli Schemas
class KundliGenerateRequest(BaseModel):
    seeker_id: Optional[int] = None  # If generating from existing seeker profile
    full_name: Optional[str] = None  # For manual entry
    date_of_birth: date
    time_of_birth: time
    place_of_birth: str

class KundliReportResponse(BaseModel):
    id: int
    seeker_id: Optional[int]
    full_name: Optional[str]
    date_of_birth: date
    time_of_birth: time
    place_of_birth: str
    latitude: Optional[float]
    longitude: Optional[float]
    chart_data: dict
    created_at: datetime
    class Config:
        from_attributes = True

