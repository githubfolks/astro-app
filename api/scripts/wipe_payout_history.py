"""
Deletes all rows from the payouts table (clears the History tab on
admin.aadikarta.org/payouts). Does not touch consultations, so the
"Pending" tab — which is computed live from Consultation records, not
stored separately — is unaffected by this script.

Usage:
    python scripts/wipe_payout_history.py            # dry run (default) - prints count only
    python scripts/wipe_payout_history.py --apply     # wipes, after typed confirmation
"""
import argparse
import os
import sys

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

    payouts = session.query(models.Payout).order_by(models.Payout.created_at).all()
    print(f"payouts rows: {len(payouts)}")
    for p in payouts:
        print(f"  id={p.id} astrologer_id={p.astrologer_id} amount=₹{p.amount} status={p.status.value} "
              f"created_at={p.created_at}")

    if not payouts:
        session.close()
        return

    if not args.apply:
        print("\nDry run only. Re-run with --apply to wipe.")
        session.close()
        return

    confirm = input(f"\nType DELETE ALL to permanently delete all {len(payouts)} payouts row(s): ")
    if confirm.strip() != "DELETE ALL":
        print("Confirmation text did not match. Aborting, nothing changed.")
        session.close()
        return

    session.query(models.Payout).delete()
    session.commit()
    print(f"\nDeleted {len(payouts)} payouts row(s).")
    session.close()


if __name__ == "__main__":
    main()
