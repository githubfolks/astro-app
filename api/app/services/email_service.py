"""
Centralized email service.

Sends transactional emails through the Resend HTTP API and holds a set of
branded HTML templates used across the app (signup verification, password
reset, welcome / onboarding, batch-creation and astrologer-lifecycle
notifications). Routers should import the ``build_*`` helpers and
``send_email`` from here rather than talking to the mail provider directly.
"""
import os
import logging
from typing import List, Tuple

import httpx
from fastapi import BackgroundTasks

logger = logging.getLogger(__name__)

# --- Configuration -----------------------------------------------------------

APP_NAME = os.getenv("APP_NAME", "Aadikarta")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://aadikarta.org").rstrip("/")
SUPPORT_EMAIL = os.getenv("SUPPORT_EMAIL") or os.getenv("MAIL_FROM", "support@aadikarta.org")
OTP_VALIDITY_MINUTES = 10

# Resend (https://resend.com) transactional email API.
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_API_URL = "https://api.resend.com/emails"
# The sender must be an address on a domain verified in your Resend account.
MAIL_FROM = os.getenv("MAIL_FROM", "no-reply@aadikarta.org")
MAIL_FROM_NAME = os.getenv("MAIL_FROM_NAME", APP_NAME)

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


# --- Astrologer onboarding step emails ---------------------------------------
# Copy ported from docs/email-contents/Step 1..5*.txt. ##companyName## -> APP_NAME,
# and the support/footer line is already supplied by _layout().


def _detail_rows(pairs: List[Tuple[str, str]]) -> str:
    rows = "".join(
        f'<tr><td style="padding:4px 0;color:#6b7280;white-space:nowrap;">{label}:</td>'
        f'<td style="padding:4px 0 4px 16px;font-weight:600;color:#374151;">{value}</td></tr>'
        for label, value in pairs
    )
    return (
        '<table role="presentation" cellpadding="0" cellspacing="0" '
        'style="margin:8px 0 16px 0;font-size:14px;">' + rows + "</table>"
    )


def _greeting(name: str = None, word: str = "Dear") -> str:
    who = name if name else "there"
    return f'<p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">{word} {who},</p>'


def _signoff(regards: str = "Warm regards,") -> str:
    return (
        f'<p style="margin:24px 0 0 0;font-size:15px;line-height:24px;">'
        f'{regards}<br>Team {APP_NAME}</p>'
    )


def build_interview_scheduled_email(
    name: str, date: str, time: str, interviewer: str, meeting_link: str
) -> Tuple[str, str]:
    """Step 1 - interview scheduled for astrologer."""
    content = f"""
      {_greeting(name)}
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;">
        We are pleased to inform you that your interview with {APP_NAME} has been scheduled as per the details below:
      </p>
      {_detail_rows([
        ("Date", date or "—"),
        ("Time", time or "—"),
        ("Interviewer", interviewer or "—"),
      ])}
      {_button("Join the meeting", meeting_link) if meeting_link else ""}
      <p style="margin:0 0 16px 0;font-size:14px;line-height:24px;color:#6b7280;">
        Please make sure to join the meeting 5 minutes before the interview time using the link above.
      </p>
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;"><strong>About {APP_NAME}:</strong></p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        {APP_NAME} is one of India's fastest-growing astrology platforms, trusted by millions of users.
        We connect skilled astrologers and tarot readers with people seeking guidance in love, career,
        health, and life decisions. We're excited to explore how you can be part of this growing family.
      </p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        If you have any questions, feel free to reach out to our team by replying to this email.
        Looking forward to seeing you in the interview!
      </p>
      {_signoff()}"""
    return f"Your interview with {APP_NAME} is scheduled", _layout(
        "Interview scheduled", content, preheader=f"Your {APP_NAME} interview details"
    )


def build_profile_activation_email(name: str) -> Tuple[str, str]:
    """Step 2 - astrologer profile activation."""
    content = f"""
      {_greeting(name)}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        We're happy to inform you that your documents have been successfully verified, and your
        profile is now <strong>ACTIVE</strong> on {APP_NAME}! &#127881;
      </p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        As part of your initial training, our advisors will call you in the next 1&ndash;2 days to guide
        you through the next steps. You're now ready to connect with users seeking your astrological guidance.
      </p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        We're excited to have you onboard and look forward to seeing your journey and success on our platform.
        If you have any questions or need assistance, please feel free to reach out to your account manager.
      </p>
      {_signoff()}"""
    return f"Your {APP_NAME} profile is now active", _layout(
        "Your profile is active", content, preheader=f"Your {APP_NAME} profile is now active"
    )


def build_onboarding_welcome_email(name: str) -> Tuple[str, str]:
    """Step 3 - welcome to aadikarta (selected after interview)."""
    content = f"""
      {_greeting(name)}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">Namaste and Congratulations! &#10024;</p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        We're thrilled to welcome you to {APP_NAME} &ndash; one of India's fastest growing astrology
        platforms, trusted by millions seeking clarity, guidance, and healing.
      </p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        We're pleased to inform you that you have been successfully selected after your interview. Your
        expertise, passion, and dedication truly stood out, and we are excited to have you join our family
        of top astrologers and tarot readers.
      </p>
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;"><strong>What's Next?</strong></p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        Within 24&ndash;48 hours, you'll receive your login credentials for the {APP_NAME} Astrologer App.
        You will also receive a digital contract to read and sign after logging in. Please complete this
        process promptly so we can begin your onboarding.
      </p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        Our team is always here to support you. Let's work together to bring guidance and light to those
        in need through the power of astrology. Welcome aboard!
      </p>
      {_signoff()}"""
    return f"Welcome to {APP_NAME} - You've been selected!", _layout(
        f"Welcome to {APP_NAME}", content, preheader=f"You've been selected to join {APP_NAME}"
    )


def build_onboarding_started_email(name: str) -> Tuple[str, str]:
    """Step 4 - astrologer welcome onboard (onboarding checklist)."""
    steps = [
        f"<strong>Login to the {APP_NAME} Astrologer App:</strong> Use your registered mobile number and the OTP sent to you.",
        "<strong>Fill in Personal Details:</strong> Add your alternate/WhatsApp number.",
        "<strong>Sign the Contract:</strong> You'll be prompted to sign it digitally after login.",
        "<strong>Upload Your Documents:</strong> Complete KYC by uploading valid ID proof (PAN, Aadhaar, Bank details).",
        "<strong>Upload Gallery Photos:</strong> Add 2&ndash;3 professional, clear photos that will be visible to users.",
        "<strong>Upload Certificates:</strong> Astrology certificates (optional but recommended) for internal verification.",
    ]
    steps_html = "".join(
        f'<li style="margin:0 0 10px 0;font-size:15px;line-height:24px;">{s}</li>' for s in steps
    )
    content = f"""
      {_greeting(name)}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        We're thrilled to welcome you officially to the {APP_NAME} family &mdash; one of the fastest growing
        astrology platforms in India. You've successfully cleared the selection process, and your astrologer
        profile has now been created.
      </p>
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;"><strong>What's Next?</strong></p>
      <p style="margin:0 0 12px 0;font-size:15px;line-height:24px;">
        To begin receiving calls, chats, and live sessions &mdash; and become discoverable on the app &mdash;
        please complete the following onboarding steps:
      </p>
      <ol style="margin:0 0 16px 0;padding-left:20px;color:#374151;">{steps_html}</ol>
      <p style="margin:0 0 16px 0;font-size:14px;line-height:24px;color:#6b7280;">
        If you face any issues, please reach out to your onboarding manager by clicking the "Need Help"
        button in the app. Let's begin this exciting journey together!
      </p>
      {_button("Open the Astrologer App", FRONTEND_URL)}
      {_signoff()}"""
    return f"Welcome onboard to {APP_NAME}!", _layout(
        f"Welcome onboard, {name}!" if name else "Welcome onboard!",
        content,
        preheader=f"Complete your {APP_NAME} onboarding steps",
    )


def build_growth_meeting_email(
    name: str, day: str, date: str, time: str, timezone: str, meeting_link: str
) -> Tuple[str, str]:
    """Step 5 - astrologers growth meeting / training."""
    when = " ".join(p for p in [day, date] if p) or "—"
    at = " ".join(p for p in [time, timezone] if p) or "—"
    content = f"""
      {_greeting(name, word="Hello")}
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;">
        Kindly join the meeting scheduled as per the details below:
      </p>
      {_detail_rows([
        ("Day & Date", when),
        ("Time", at),
      ])}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        In this meeting, we will discuss Astrologer Performance Growth &amp; Training on how to effectively
        use the application.
      </p>
      {_button("Join the meeting", meeting_link) if meeting_link else ""}
      {_signoff(regards="Regards,")}"""
    return f"{APP_NAME} - Growth & Training meeting", _layout(
        "Growth & training meeting", content, preheader="Your performance growth & training meeting"
    )


# --- Transactional notification templates ------------------------------------


def build_payout_processed_email(
    amount: float, transaction_reference: str, tds_amount: float, payout_date: str = None, comments: str = None,
    pg_charge: float = 0.0
) -> Tuple[str, str]:
    rows = [
        ("Amount", f"&#8377;{amount:,.2f}"),
        ("TDS deducted", f"&#8377;{tds_amount:,.2f}"),
        ("Payment gateway charge (3%)", f"&#8377;{pg_charge:,.2f}"),
        ("Transaction reference", transaction_reference or "—"),
    ]
    if payout_date:
        rows.append(("Payment Date", payout_date))
    if comments:
        rows.append(("Comments", comments))

    content = f"""
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        Good news &mdash; your payout has been processed.
      </p>
      {_detail_rows(rows)}
      <p style="margin:0 0 8px 0;font-size:14px;line-height:24px;color:#6b7280;">
        Please allow 1&ndash;3 business days for the amount to reflect in your account.
      </p>"""
    return f"{APP_NAME} - Payout Processed", _layout(
        "Payout processed", content, preheader="Your payout has been processed"
    )


def build_astrologer_approved_email() -> Tuple[str, str]:
    content = f"""
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        Congratulations! Your astrologer application on {APP_NAME} has been <strong>approved</strong>.
      </p>
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;">
        You can now log in and start accepting consultations.
      </p>
      {_button("Log in", f"{FRONTEND_URL}/login")}
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">Welcome to the {APP_NAME} family!</p>"""
    return f"{APP_NAME} - Your Application Has Been Approved!", _layout(
        "Application approved", content, preheader=f"Your {APP_NAME} application was approved"
    )


def build_astrologer_rejected_email(reason: str) -> Tuple[str, str]:
    content = f"""
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        Thank you for your interest in joining {APP_NAME} as an astrologer.
      </p>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        After reviewing your application, we are unable to approve it at this time.
      </p>
      {_detail_rows([("Reason", reason or "—")])}
      <p style="margin:0 0 8px 0;font-size:14px;line-height:24px;color:#6b7280;">
        If you believe this is an error or would like to reapply, please contact support.
      </p>"""
    return f"{APP_NAME} - Application Status Update", _layout(
        "Application status update", content, preheader=f"Update on your {APP_NAME} application"
    )


def build_admin_password_reset_email() -> Tuple[str, str]:
    content = f"""
      <p style="margin:0 0 16px 0;font-size:15px;line-height:24px;">
        An administrator has reset your {APP_NAME} account password.
      </p>
      <p style="margin:0 0 8px 0;font-size:15px;line-height:24px;">
        Please log in using your new credentials.
      </p>
      {_button("Log in", f"{FRONTEND_URL}/login")}
      <p style="margin:0 0 16px 0;font-size:14px;line-height:24px;color:#6b7280;">
        If you did not request this change, please contact support immediately.
      </p>"""
    return f"{APP_NAME} - Your Password Has Been Reset", _layout(
        "Your password was reset", content, preheader=f"Your {APP_NAME} password was reset"
    )


# --- Sending -----------------------------------------------------------------


def _send_via_resend(recipients: List[str], subject: str, html_body: str) -> None:
    """Deliver one email through the Resend API. Runs in a background task.

    Failures are logged rather than raised so a mail outage never breaks the
    request that scheduled the email.
    """
    if not RESEND_API_KEY:
        logger.warning(
            "RESEND_API_KEY not configured; skipping email %r to %s", subject, recipients
        )
        return
    payload = {
        "from": f"{MAIL_FROM_NAME} <{MAIL_FROM}>",
        "to": recipients,
        "subject": subject,
        "html": html_body,
    }
    try:
        resp = httpx.post(
            RESEND_API_URL,
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=15.0,
        )
        if resp.status_code >= 400:
            logger.error(
                "Resend API error %s sending %r to %s: %s",
                resp.status_code, subject, recipients, resp.text,
            )
        else:
            logger.info("Sent email %r to %s", subject, recipients)
    except Exception:  # noqa: BLE001 - background task must never propagate
        logger.exception("Failed to send email %r to %s", subject, recipients)


def send_email(
    background_tasks: BackgroundTasks,
    recipients: List[str],
    subject: str,
    html_body: str,
) -> None:
    """Queue an HTML email to be sent in the background via Resend.

    No-ops when there are no recipients so callers don't need to guard.
    """
    recipients = [r for r in (recipients or []) if r]
    if not recipients:
        return
    background_tasks.add_task(_send_via_resend, recipients, subject, html_body)
