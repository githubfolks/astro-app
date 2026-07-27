"""
Removes mock-mode wallet top-up transactions (created while ENABLE_MOCK_PAYMENTS=true
or when no live Razorpay keys were configured) and rolls back the corresponding
credit from each affected user's wallet balance, so the ledger stays consistent.

A mock top-up is identified by reference_id starting with 'order_mock_' or
gateway_payment_id starting with 'pay_mock_' on a PAYMENT_GATEWAY transaction.

Usage:
    python scripts/cleanup_mock_transactions.py               # dry run (default) - prints what would change
    python scripts/cleanup_mock_transactions.py --apply        # deletes rows and adjusts balances; skips users who'd go negative
    python scripts/cleanup_mock_transactions.py --apply --floor-negative-at-zero
        # same, but for users who'd go negative, floors their balance at 0 instead of skipping
        # (use only after confirming the spend was test activity, not real customer usage)

If a user's balance would go negative after rollback (because the mock credit was
already spent on something, e.g. a real consultation), that user is skipped and
reported for manual review by default instead of silently going negative.
"""
import argparse
import os
import sys
from decimal import Decimal

from sqlalchemy import create_engine, or_
from sqlalchemy.orm import sessionmaker

api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

from app.database import SQLALCHEMY_DATABASE_URL
from app import models


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Actually apply the changes (default is dry-run)")
    parser.add_argument("--floor-negative-at-zero", action="store_true",
                         help="For users whose rollback would go negative, set balance to 0 instead of skipping")
    args = parser.parse_args()

    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    mock_txns = session.query(models.WalletTransaction).filter(
        models.WalletTransaction.transaction_type == models.TransactionType.PAYMENT_GATEWAY,
        or_(
            models.WalletTransaction.reference_id.like("order_mock_%"),
            models.WalletTransaction.gateway_payment_id.like("pay_mock_%"),
        )
    ).order_by(models.WalletTransaction.user_id, models.WalletTransaction.id).all()

    if not mock_txns:
        print("No mock transactions found.")
        return

    by_user = {}
    for t in mock_txns:
        by_user.setdefault(t.user_id, []).append(t)

    print(f"Found {len(mock_txns)} mock transaction(s) across {len(by_user)} user(s).\n")

    skipped_users = []
    to_delete = []  # (wallet, new_balance, txns)

    for user_id, txns in by_user.items():
        wallet = session.query(models.UserWallet).filter(models.UserWallet.user_id == user_id).first()
        current_balance = wallet.balance if wallet else Decimal("0")
        total_mock_credit = sum(Decimal(str(t.amount)) for t in txns)
        resulting_balance = (current_balance or Decimal("0")) - total_mock_credit

        would_go_negative = resulting_balance < 0
        action = ""
        if would_go_negative and not args.floor_negative_at_zero:
            action = " [SKIP: would go negative]"
        elif would_go_negative:
            action = " [floored to ₹0]"

        print(f"User {user_id}: {len(txns)} mock txn(s), total ₹{total_mock_credit}, "
              f"balance ₹{current_balance} -> ₹{max(resulting_balance, Decimal('0')) if (would_go_negative and args.floor_negative_at_zero) else resulting_balance}"
              f"{action}")

        if would_go_negative and not args.floor_negative_at_zero:
            skipped_users.append(user_id)
            continue

        new_balance = max(resulting_balance, Decimal("0")) if would_go_negative else resulting_balance
        to_delete.append((wallet, new_balance, txns))

    print(f"\n{len(to_delete)} user(s) will be cleaned up; {len(skipped_users)} skipped "
          f"(balance would go negative — likely already spent the mock credit; review manually): "
          f"{skipped_users}")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to make these changes.")
        session.close()
        return

    for wallet, new_balance, txns in to_delete:
        wallet.balance = new_balance
        for t in txns:
            session.delete(t)

    session.commit()
    print(f"\nDeleted {sum(len(t) for _, _, t in to_delete)} mock transaction(s) and adjusted "
          f"{len(to_delete)} wallet balance(s).")
    session.close()


if __name__ == "__main__":
    main()
