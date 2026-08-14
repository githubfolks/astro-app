from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Enum, DECIMAL, Text, Date, Time, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base
import enum

class ReportType(str, enum.Enum):
    FULL_KUNDLI = "FULL_KUNDLI"
    GUN_MILAN = "GUN_MILAN"
    CAREER_FINANCE = "CAREER_FINANCE"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    PAID = "PAID"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"
    INTERNAL_TEST = "INTERNAL_TEST"  # admin-triggered QA report — no payment, excluded from revenue

class ReportStatus(str, enum.Enum):
    PENDING = "PENDING"
    GENERATING = "GENERATING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class ReportLead(Base):
    __tablename__ = "report_leads"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    phone_number = Column(String, index=True, nullable=False)
    email = Column(String, nullable=True)
    date_of_birth = Column(Date, nullable=False)
    time_of_birth = Column(Time, nullable=False)
    place_of_birth = Column(String, nullable=False)
    gender = Column(String, nullable=True)
    campaign_source = Column(String, default="aadikarta.org")
    marketing_segment = Column(String, nullable=True)  # e.g. "marriage_intent", "career_intent"
    report_type = Column(Enum(ReportType), nullable=True)  # which product they were browsing at capture time
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Only populated for GUN_MILAN leads — the second person in the match.
    partner_full_name = Column(String, nullable=True)
    partner_date_of_birth = Column(Date, nullable=True)
    partner_time_of_birth = Column(Time, nullable=True)
    partner_place_of_birth = Column(String, nullable=True)

    # Abandoned-checkout recovery: set once a WhatsApp nudge has been sent so
    # the cron job never nudges the same lead twice.
    checkout_nudge_sent_at = Column(DateTime(timezone=True), nullable=True)

    orders = relationship("AdHocReportOrder", back_populates="lead", cascade="all, delete-orphan")

class AdHocReportOrder(Base):
    __tablename__ = "adhoc_report_orders"

    id = Column(Integer, primary_key=True, index=True)
    order_reference = Column(String, unique=True, index=True, nullable=False)
    lead_id = Column(Integer, ForeignKey("report_leads.id"), nullable=False)
    report_type = Column(Enum(ReportType), nullable=False)
    language = Column(String, default="en")  # "en", "hi", "mr", "ta", "te", "gu"
    amount = Column(DECIMAL(10, 2), nullable=False)
    currency = Column(String, default="INR")
    payment_status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    report_status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)
    gateway_order_id = Column(String, nullable=True)
    gateway_payment_id = Column(String, nullable=True)
    razorpay_mode = Column(String, nullable=True)  # "test" or "live" — key pair the order was created under
    pdf_url = Column(String, nullable=True)
    report_data = Column(JSON, nullable=True)  # Full synthesized report JSON
    whatsapp_sent = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    lead = relationship("ReportLead", back_populates="orders")

class ReportAnalytics(Base):
    __tablename__ = "report_analytics"

    id = Column(Integer, primary_key=True, index=True)
    report_type = Column(Enum(ReportType), nullable=False)
    action = Column(String, nullable=False)  # "LEAD_CAPTURED", "PAYMENT_INITIATED", "PAYMENT_SUCCESS", "PDF_DOWNLOADED", "CHAT_CONVERTED"
    order_id = Column(Integer, ForeignKey("adhoc_report_orders.id"), nullable=True)
    referrer = Column(String, nullable=True)
    device_type = Column(String, nullable=True)
    user_location = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
