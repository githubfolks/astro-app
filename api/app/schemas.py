from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time, datetime
from enum import Enum
from decimal import Decimal

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

# Auth Schemas
class UserBase(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole

class UserLogin(BaseModel):
    username: str # Can be email or phone
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str

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
    about_me: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[str] = None
    specialties: Optional[str] = None
    consultation_fee_per_min: Decimal
    availability_hours: Optional[str] = None

class AstrologerProfileCreate(AstrologerProfileBase):
    pass

class AstrologerProfileUPDATE(BaseModel):
    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
    about_me: Optional[str] = None
    experience_years: Optional[int] = None
    languages: Optional[str] = None
    specialties: Optional[str] = None
    consultation_fee_per_min: Optional[Decimal] = None
    availability_hours: Optional[str] = None
    is_online: Optional[bool] = None

class AstrologerProfile(AstrologerProfileBase):
    user_id: int
    is_online: bool
    rating_avg: Decimal
    total_consultations: int
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

class AdminUserListItem(BaseModel):
    id: int
    email: Optional[str]
    phone_number: Optional[str]
    role: UserRole
    is_verified: bool
    created_at: datetime
    class Config:
        from_attributes = True
