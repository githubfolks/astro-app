"""Tests for the admin mock-data cleanup tool: wipes WalletTransaction rows,
zeroes UserWallet.balance, and deletes Payout rows for selected users."""
from decimal import Decimal

from app import models
from tests.conftest import auth_headers


def _add_txn(db_session, user, amount="10.00"):
    db_session.add(models.WalletTransaction(
        user_id=user.id,
        amount=Decimal(amount),
        transaction_type=models.TransactionType.DEPOSIT,
        description="seed",
    ))
    db_session.commit()


def _add_payout(db_session, astrologer, amount="500.00"):
    db_session.add(models.Payout(
        astrologer_id=astrologer.id,
        amount=Decimal(amount),
        status=models.PayoutStatus.PENDING,
    ))
    db_session.commit()


def test_deletes_transactions_and_zeroes_balance(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=250.0)
    admin = make_user(models.UserRole.ADMIN)
    _add_txn(db_session, seeker)
    _add_txn(db_session, seeker)

    resp = client.post(
        "/admin/users/delete-mock-data",
        headers=auth_headers(admin),
        json={"user_ids": [seeker.id]},
    )
    assert resp.status_code == 200
    result = resp.json()["results"][0]
    assert result["transactions_deleted"] == 2
    assert result["wallet_reset_from"] == 250.0

    bal = client.get("/wallet/balance", headers=auth_headers(seeker))
    assert float(bal.json()["balance"]) == 0.0
    txns = client.get("/wallet/transactions", headers=auth_headers(seeker))
    assert txns.json() == []


def test_deletes_payouts_for_astrologer(client, make_user, db_session):
    astro = make_user(models.UserRole.ASTROLOGER)
    admin = make_user(models.UserRole.ADMIN)
    _add_payout(db_session, astro)
    _add_payout(db_session, astro)

    resp = client.post(
        "/admin/users/delete-mock-data",
        headers=auth_headers(admin),
        json={"user_ids": [astro.id]},
    )
    assert resp.status_code == 200
    assert resp.json()["results"][0]["payouts_deleted"] == 2

    remaining = db_session.query(models.Payout).filter(models.Payout.astrologer_id == astro.id).count()
    assert remaining == 0


def test_seeker_has_no_payouts_to_delete(client, make_user):
    seeker = make_user(models.UserRole.SEEKER, balance=10.0)
    admin = make_user(models.UserRole.ADMIN)

    resp = client.post(
        "/admin/users/delete-mock-data",
        headers=auth_headers(admin),
        json={"user_ids": [seeker.id]},
    )
    assert resp.status_code == 200
    assert resp.json()["results"][0]["payouts_deleted"] == 0


def test_404_on_unknown_user_id(client, make_user):
    admin = make_user(models.UserRole.ADMIN)
    resp = client.post(
        "/admin/users/delete-mock-data",
        headers=auth_headers(admin),
        json={"user_ids": [999999]},
    )
    assert resp.status_code == 404


def test_400_when_any_selected_user_is_admin(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=10.0)
    target_admin = make_user(models.UserRole.ADMIN)
    admin = make_user(models.UserRole.ADMIN)
    _add_txn(db_session, seeker)

    resp = client.post(
        "/admin/users/delete-mock-data",
        headers=auth_headers(admin),
        json={"user_ids": [seeker.id, target_admin.id]},
    )
    assert resp.status_code == 400

    # Nothing should have been deleted — the whole batch is rejected up front.
    txns = client.get("/wallet/transactions", headers=auth_headers(seeker))
    assert len(txns.json()) == 1


def test_multi_user_batch_reports_per_user_counts(client, make_user, db_session):
    seeker_a = make_user(models.UserRole.SEEKER, balance=100.0)
    seeker_b = make_user(models.UserRole.SEEKER, balance=50.0)
    admin = make_user(models.UserRole.ADMIN)
    _add_txn(db_session, seeker_a)
    _add_txn(db_session, seeker_b)
    _add_txn(db_session, seeker_b)

    resp = client.post(
        "/admin/users/delete-mock-data",
        headers=auth_headers(admin),
        json={"user_ids": [seeker_a.id, seeker_b.id]},
    )
    assert resp.status_code == 200
    results = {r["user_id"]: r for r in resp.json()["results"]}
    assert results[seeker_a.id]["transactions_deleted"] == 1
    assert results[seeker_a.id]["wallet_reset_from"] == 100.0
    assert results[seeker_b.id]["transactions_deleted"] == 2
    assert results[seeker_b.id]["wallet_reset_from"] == 50.0


def test_non_admin_cannot_call_delete_mock_data(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post(
        "/admin/users/delete-mock-data",
        headers=auth_headers(seeker),
        json={"user_ids": [seeker.id]},
    )
    assert resp.status_code == 403


def test_preview_matches_delete_counts(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=75.0)
    admin = make_user(models.UserRole.ADMIN)
    _add_txn(db_session, seeker)

    resp = client.get(
        f"/admin/users/mock-data-preview?user_ids={seeker.id}",
        headers=auth_headers(admin),
    )
    assert resp.status_code == 200
    result = resp.json()["results"][0]
    assert result["transaction_count"] == 1
    assert result["wallet_balance"] == 75.0
    assert result["payout_count"] == 0
