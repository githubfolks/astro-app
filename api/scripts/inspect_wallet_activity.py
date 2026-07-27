"""
Diagnostic: prints a user's identity plus their full wallet transaction history,
so you can judge whether mock-funded spend (e.g. real consultations paid for with
mock top-up money) needs manual reconciliation before cleanup_mock_transactions.py
removes the mock credit.

Usage:
    python scripts/inspect_wallet_activity.py 17 18
"""
import os
import sys

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

api_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(api_dir)

from app.database import SQLALCHEMY_DATABASE_URL
from app import models


def main():
    if len(sys.argv) < 2:
        print("Usage: python scripts/inspect_wallet_activity.py <user_id> [user_id ...]")
        sys.exit(1)

    user_ids = [int(a) for a in sys.argv[1:]]

    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    for user_id in user_ids:
        user = session.query(models.User).filter(models.User.id == user_id).first()
        wallet = session.query(models.UserWallet).filter(models.UserWallet.user_id == user_id).first()
        if not user:
            print(f"\n=== User {user_id}: NOT FOUND ===")
            continue

        print(f"\n=== User {user_id}: {user.email} | role={user.role.value} "
              f"| created_at={user.created_at} | balance=₹{wallet.balance if wallet else 'no wallet'} ===")

        txns = session.query(models.WalletTransaction).filter(
            models.WalletTransaction.user_id == user_id
        ).order_by(models.WalletTransaction.created_at).all()

        for t in txns:
            print(f"  [{t.created_at}] {t.transaction_type.value:<18} amount=₹{t.amount:<10} "
                  f"ref={t.reference_id} desc={t.description}")

        consultations = session.query(models.Consultation).filter(
            models.Consultation.seeker_id == user_id
        ).order_by(models.Consultation.created_at).all()

        if consultations:
            print(f"  -- {len(consultations)} consultation(s) as seeker --")
            for c in consultations:
                print(f"  [{c.created_at}] consultation_id={c.id} astrologer_id={c.astrologer_id} "
                      f"status={getattr(c, 'status', None)}")

    session.close()


if __name__ == "__main__":
    main()
