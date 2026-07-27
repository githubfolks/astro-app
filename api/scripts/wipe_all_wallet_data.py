"""
Full reset of the wallet ledger: deletes every row in wallet_transactions and
resets every user's wallet balance to 0. Intended for pre-launch cleanup when
ALL existing transaction data is known to be test/mock activity — unlike
cleanup_mock_transactions.py, this does NOT try to distinguish mock from real,
it wipes everything.

Does not touch consultations, disputes, or payouts records.

Usage:
    python scripts/wipe_all_wallet_data.py            # dry run (default) - prints counts only
    python scripts/wipe_all_wallet_data.py --apply     # wipes, after typed confirmation
"""
import argparse
import os
import sys
from decimal import Decimal

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

from app.database import SQLALCHEMY_DATABASE_URL
from app import models


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Actually wipe (default is dry-run)")
    args = parser.parse_args()

    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    txn_count = session.query(models.WalletTransaction).count()
    wallets = session.query(models.UserWallet).all()
    nonzero_wallets = [w for w in wallets if (w.balance or Decimal("0")) != 0]
    total_balance = sum((Decimal(str(w.balance or 0)) for w in wallets), Decimal("0"))

    print(f"wallet_transactions rows: {txn_count}")
    print(f"user_wallets rows: {len(wallets)} ({len(nonzero_wallets)} with nonzero balance, "
          f"total ₹{total_balance} across all wallets)")

    if not args.apply:
        print("\nDry run only. Re-run with --apply to wipe.")
        session.close()
        return

    confirm = input(
        f"\nType DELETE ALL to permanently delete all {txn_count} wallet_transactions rows "
        f"and reset all {len(wallets)} wallet balances to 0: "
    )
    if confirm.strip() != "DELETE ALL":
        print("Confirmation text did not match. Aborting, nothing changed.")
        session.close()
        return

    session.query(models.WalletTransaction).delete()
    for w in wallets:
        w.balance = Decimal("0")

    session.commit()
    print(f"\nDeleted {txn_count} wallet_transactions row(s) and reset {len(wallets)} wallet balance(s) to 0.")
    session.close()


if __name__ == "__main__":
    main()
