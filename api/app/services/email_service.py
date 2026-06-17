"""
Centralized email service.

Holds the single SMTP connection configuration and a set of branded HTML
templates used across the app (signup verification, password reset, welcome /
onboarding, batch-creation notifications). Routers should import the
``build_*`` helpers and ``send_email`` from here rather than constructing
``MessageSchema`` objects inline.
"""
import os
import logging
from typing import List, Tuple

from fastapi import BackgroundTasks
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

logger = logging.getLogger(__name__)

# --- Configuration -----------------------------------------------------------

APP_NAME = os.getenv("APP_NAME", "Aadikarta")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://aadikarta.org").rstrip("/")
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL") or os.getenv("MAIL_FROM", "support@aadikarta.org")
OTP_VALIDITY_MINUTES = 10

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "user"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "password"),
    MAIL_FROM=os.getenv("MAIL_FROM", "admin@example.com"),
    MAIL_FROM_NAME=os.getenv("MAIL_FROM_NAME", APP_NAME),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False,
)

# --- Base layout -------------------------------------------------------------

_BRAND_COLOR = "#5b21b6"  # deep purple
_ACCENT_COLOR = "#f59e0b"  # saffron


def _layout(heading: str, content_html: str, preheader: str = "") -> str:
    """Wrap inner content in a branded, responsive, inline-styled shell."""
    year = __import__("datetime").datetime.utcnow().year
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#333333;">
  <span style="display:none;font-size:1px;color:#f4f4f7;">{preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background-color:{_BRAND_COLOR};padding:28px 32px;text-align:center;">
              <span style="font-size:24px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">{APP_NAME}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 16px 32px;">
              <h1 style="margin:0 0 16px 0;font-size:20px;color:#1f2937;">{heading}</h1>
              {content_html}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 32px 32px;border-top:1px solid #eeeeee;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:18px;">
                Need help? Contact us at
                <a href="mailto:{SUPPORT_EMAIL}" style="color:{_BRAND_COLOR};text-decoration:none;">{SUPPORT_EMAIL}</a>.<br>
                &copy; {year} {APP_NAME}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""


def _otp_block(otp: str) -> str:
    return f"""
      <div style="margin:24px 0;text-align:center;">
        <span style="display:inline-block;background-color:#f3f0ff;border:1px dashed {_BRAND_COLOR};border-radius:10px;padding:16px 28px;font-size:32px;font-weight:700;letter-spacing:8px;color:{_BRAND_COLOR};">{otp}</span>
      </div>
      <p style="margin:0 0 8px 0;font-size:14px;color:#6b7280;text-align:center;">
        This code is valid for {OTP_VALIDITY_MINUTES} minutes.
      </p>"""


def _button(label: str, url: str) -> str:
    return f"""
      <div style="margin:28px 0;text-align:center;">
        <a href="{url}" style="display:inline-block;background-color:{_ACCENT_COLOR};color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;">{label}</a>
      </div>"""


# --- Template builders -------------------------------------------------------
# Each returns (subject, html_body).


def build_verification_email(otp: str) -> Tuple[str, str]:
    content = f"""
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;">
        Welcome to {APP_NAME}! Use the verification code below to confirm your email address and activate your account.
      </p>
      {_otp_block(otp)}
      <p style="margin:16px 0 0 0;font-size:13px;color:#9ca3af;">
        If you didn't create an account, you can safely ignore this email.
      </p>"""
    return f"{APP_NAME} - Verify Your Email", _layout(
        "Verify your email", content, preheader=f"Your {APP_NAME} verification code"
    )


def build_password_reset_email(otp: str) -> Tuple[str, str]:
    content = f"""
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;">
        We received a request to reset your {APP_NAME} password. Enter the code below to continue.
      </p>
      {_otp_block(otp)}
      <p style="margin:16px 0 0 0;font-size:13px;color:#9ca3af;">
        If you didn't request a password reset, please ignore this email — your password will remain unchanged.
      </p>"""
    return "Password Reset OTP", _layout(
        "Reset your password", content, preheader=f"Your {APP_NAME} password reset code"
    )


def build_welcome_email(name: str = None) -> Tuple[str, str]:
    greeting = f"Hi {name}," if name else "Hi there,"
    content = f"""
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">{greeting}</p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        Your email is verified and your {APP_NAME} account is now active. We're delighted to have you on board.
      </p>
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;">
        You can now explore consultations with verified astrologers, generate your kundli, and enroll in courses.
      </p>
      {_button("Get started", FRONTEND_URL)}"""
    return f"Welcome to {APP_NAME}!", _layout(
        f"Welcome to {APP_NAME}", content, preheader=f"Your {APP_NAME} account is ready"
    )


def build_batch_created_student_email(
    student_name: str, batch_name: str, course_title: str
) -> Tuple[str, str]:
    greeting = f"Hi {student_name}," if student_name else "Hi there,"
    content = f"""
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">{greeting}</p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        A new batch has been created for the course <strong>{course_title}</strong>.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;font-size:14px;color:#374151;">
        <tr><td style="padding:4px 0;color:#6b7280;">Course:</td><td style="padding:4px 0 4px 12px;font-weight:600;">{course_title}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Batch:</td><td style="padding:4px 0 4px 12px;font-weight:600;">{batch_name}</td></tr>
      </table>
      {_button("View your courses", f"{FRONTEND_URL}/courses")}"""
    return f"New batch for {course_title}", _layout(
        "A new batch is available", content, preheader=f"New batch for {course_title}"
    )


def build_batch_created_admin_email(
    tutor_name: str, batch_name: str, course_title: str
) -> Tuple[str, str]:
    content = f"""
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        A new batch has just been created on {APP_NAME}.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px 0;font-size:14px;color:#374151;">
        <tr><td style="padding:4px 0;color:#6b7280;">Created by:</td><td style="padding:4px 0 4px 12px;font-weight:600;">{tutor_name}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Course:</td><td style="padding:4px 0 4px 12px;font-weight:600;">{course_title}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Batch:</td><td style="padding:4px 0 4px 12px;font-weight:600;">{batch_name}</td></tr>
      </table>"""
    return f"New batch created: {course_title}", _layout(
        "New batch created", content, preheader=f"{tutor_name} created a new batch"
    )


# --- Sending -----------------------------------------------------------------


def send_email(
    background_tasks: BackgroundTasks,
    recipients: List[str],
    subject: str,
    html_body: str,
) -> None:
    """Queue an HTML email to be sent in the background.

    No-ops when there are no recipients so callers don't need to guard.
    """
    recipients = [r for r in (recipients or []) if r]
    if not recipients:
        return
    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=html_body,
        subtype=MessageType.html,
    )
    fm = FastMail(conf)
    background_tasks.add_task(fm.send_message, message)
