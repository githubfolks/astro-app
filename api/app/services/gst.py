"""GST on wallet recharges.

GST is charged on top of the recharge amount: a seeker who recharges ₹100 at
18% pays ₹118 and their wallet is credited ₹100. The rate comes from the
admin-managed `gst_rate_percent` setting; it is snapshotted onto each
PaymentOrder at creation so a later rate change never alters an in-flight or
historical order.
"""
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation

from .settings_service import get_setting

PAISA = Decimal("0.01")


class GstConfigError(Exception):
    """The configured GST rate is missing or invalid."""


def to_rupees(value) -> Decimal:
    """Quantize a rupee amount to paise, rounding half up."""
    return Decimal(str(value)).quantize(PAISA, rounding=ROUND_HALF_UP)


def get_gst_rate_percent() -> Decimal:
    raw = (get_setting("gst_rate_percent") or "").strip()
    try:
        rate = Decimal(raw)
    except InvalidOperation:
        raise GstConfigError(f"Invalid gst_rate_percent setting: {raw!r}")
    if not rate.is_finite() or rate < 0 or rate > 100:
        raise GstConfigError(f"gst_rate_percent out of range: {raw!r}")
    return rate


def compute_gst(base_amount: Decimal, rate_percent: Decimal) -> Decimal:
    return to_rupees(Decimal(base_amount) * rate_percent / Decimal("100"))


def gst_share_of_refund(order_gst: Decimal, order_base: Decimal, refunded_before: Decimal, refund_now: Decimal) -> Decimal:
    """GST to return alongside a (possibly partial) refund of wallet credit.

    Computed cumulatively — GST due on everything refunded so far minus GST
    already returned — so a series of partial refunds sums exactly to the
    order's GST once the full credit has been refunded, with no rounding drift.
    """
    if not order_gst or not order_base:
        return Decimal("0")
    before = to_rupees(order_gst * refunded_before / order_base)
    after = to_rupees(order_gst * (refunded_before + refund_now) / order_base)
    return after - before
