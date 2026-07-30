from decimal import Decimal
from .. import models

# RBI's Master Direction on Prepaid Payment Instruments caps a minimum-KYC
# ("small"/semi-closed) PPI wallet's outstanding balance at Rs. 10,000 at any
# time, redeemable only against goods/services — which matches how seeker
# wallets here work (spend only, no cash-out). Seekers have no identity-KYC
# (PAN/Aadhaar) flow today, so every seeker wallet is treated as minimum-KYC
# for now; branch by tier here once a full-KYC path exists for seekers.
WALLET_BALANCE_CAP = Decimal("10000.00")


def get_wallet_cap(user: models.User) -> Decimal | None:
    """Returns the max outstanding balance allowed for this user's wallet, or
    None if no cap applies (e.g. astrologer/admin wallets aren't PPI-style
    recharge wallets)."""
    if user.role == models.UserRole.SEEKER:
        return WALLET_BALANCE_CAP
    return None
