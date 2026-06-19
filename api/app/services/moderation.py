"""Rule-based chat moderation: detect contact-sharing and spam.

Pure-Python, zero external cost. Runs inline on every outbound chat message.
Returns the list of violation types found and a masked version of the text with
the offending substrings replaced by ****, so the contact info is never delivered
to the other party even though the original is retained (admin-only) for evidence.
"""
import re

# Spelled-out digit words used to obfuscate phone numbers ("nine eight seven...").
_DIGIT_WORDS = (
    r"(?:zero|one|two|three|four|five|six|seven|eight|nine|"
    r"oh|nought|double|triple)"
)

# Phone numbers, including spaced/dashed/dotted obfuscation: 98765 43210, 9-8-7-6..., +91 98765-43210
_PHONE_RE = re.compile(
    r"(?:(?:\+|00)?\d[\d\s().\-]{7,}\d)",
)

# Sequences of spelled-out digits ("nine eight seven six ...") — 5+ in a row.
_SPELLED_RE = re.compile(
    rf"(?:\b{_DIGIT_WORDS}\b[\s,.\-]*){{5,}}",
    re.IGNORECASE,
)

_EMAIL_RE = re.compile(r"\b[\w.+\-]+@[\w\-]+\.[\w.\-]+\b", re.IGNORECASE)

# External contact channels / "take it off-platform" intent.
_INTENT_RE = re.compile(
    r"\b(whats\s?app|whtsapp|wsap|telegram|signal|insta(?:gram)?|"
    r"call\s+me|phone\s+me|my\s+number|contact\s+me\s+on|"
    r"gpay|g\s?pay|paytm|phonepe|google\s*pay)\b",
    re.IGNORECASE,
)

_URL_RE = re.compile(r"\b(?:https?://|www\.)\S+", re.IGNORECASE)


def _digit_count(s: str) -> int:
    return sum(c.isdigit() for c in s)


def scan(text: str) -> tuple[list[str], str]:
    """Return (violation_types, masked_text).

    violation_types is empty when the message is clean.
    """
    if not text:
        return [], text

    violations: list[str] = []
    masked = text

    def _mask(pattern: re.Pattern, label: str, *, min_digits: int = 0):
        nonlocal masked
        found = False
        for m in pattern.finditer(text):
            chunk = m.group(0)
            if min_digits and _digit_count(chunk) < min_digits:
                continue
            found = True
            masked = masked.replace(chunk, "****")
        if found and label not in violations:
            violations.append(label)

    # Phone: require at least 7 digits to avoid masking ordinary numbers/dates.
    _mask(_PHONE_RE, "phone_number", min_digits=7)
    _mask(_SPELLED_RE, "phone_number")
    _mask(_EMAIL_RE, "email")
    _mask(_URL_RE, "external_link")
    _mask(_INTENT_RE, "contact_intent")

    return violations, masked
