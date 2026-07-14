"""Tests for astrologer payouts (TDS + payment-gateway charge) and performance stats."""
from datetime import datetime, timedelta

from app import models
from app.routers.payouts import _compute_pg_charge, _compute_tds, PG_CHARGE_RATE
from tests.conftest import auth_headers


def _complete_consultation(db_session, seeker, astrologer, *, total_cost, duration_seconds=700, days_ago=0):
    start = datetime.utcnow() - timedelta(days=days_ago)
    c = models.Consultation(
        seeker_id=seeker.id,
        astrologer_id=astrologer.id,
        consultation_type=models.ConsultationType.CHAT,
        start_time=start,
        end_time=start + timedelta(seconds=duration_seconds),
        duration_seconds=duration_seconds,
        rate_per_min=10.0,
        total_cost=total_cost,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(c)
    db_session.commit()
    db_session.refresh(c)
    return c


def test_compute_pg_charge_is_flat_no_threshold():
    # Unlike TDS, PG charge applies to every rupee, no threshold.
    assert _compute_pg_charge(1000.0, 0.0) == 30.0
    assert _compute_pg_charge(100.0, 0.0) == 3.0


def test_compute_pg_charge_accounts_for_prior_deductions():
    # 3% of 1000 = 30; if 10 was already withheld on a prior payout, only 20 remains due.
    assert _compute_pg_charge(1000.0, 10.0) == 20.0


def test_compute_tds_still_threshold_based():
    # Sanity check: TDS logic must remain untouched by the PG charge addition.
    assert _compute_tds(20_000.0, 0.0) == 0.0
    assert _compute_tds(40_000.0, 0.0) == 1_000.0  # 10% of (40000 - 30000)


def test_pending_earnings_includes_pg_charge(client, make_user, db_session):
    admin = make_user(models.UserRole.ADMIN)
    astro = make_user(models.UserRole.ASTROLOGER)
    seeker = make_user(models.UserRole.SEEKER)
    _complete_consultation(db_session, seeker, astro, total_cost=1000.0)

    resp = client.get("/admin/payouts/pending", headers=auth_headers(admin))
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    entry = body[0]
    # commission_percentage defaults to 70%, so gross_share = 700.
    assert entry["gross_earnings"] == 700.0
    assert entry["pg_charge"] == round(700.0 * PG_CHARGE_RATE, 2)
    assert entry["pending_amount"] == round(700.0 - entry["tds_deduction"] - entry["pg_charge"], 2)


def test_mark_paid_persists_pg_charge_and_shows_in_history(client, make_user, db_session):
    admin = make_user(models.UserRole.ADMIN)
    astro = make_user(models.UserRole.ASTROLOGER)

    gen = client.post(
        "/admin/payouts/generate",
        headers=auth_headers(admin),
        params={"astrologer_id": astro.id, "amount": 485.0, "tds_deducted": 0.0, "pg_charge_deducted": 15.0},
    )
    assert gen.status_code == 200
    payout_id = gen.json()["id"]

    paid = client.post(
        f"/admin/payouts/{payout_id}/mark-paid",
        headers=auth_headers(admin),
        params={"transaction_reference": "TESTREF123"},
    )
    assert paid.status_code == 200

    history = client.get("/admin/payouts/history", headers=auth_headers(admin))
    assert history.status_code == 200
    row = next(r for r in history.json() if r["id"] == payout_id)
    assert row["pg_charge_deducted"] == 15.0


def test_astrologer_stats_poor_chat_and_loyalty(client, make_user, db_session):
    admin = make_user(models.UserRole.ADMIN)
    astro = make_user(models.UserRole.ASTROLOGER)
    loyal_seeker = make_user(models.UserRole.SEEKER)

    # Loyal seeker: two consultations with this astrologer within 15 days, second > 10 min.
    _complete_consultation(db_session, loyal_seeker, astro, total_cost=100.0, duration_seconds=120, days_ago=10)
    _complete_consultation(db_session, loyal_seeker, astro, total_cost=100.0, duration_seconds=900, days_ago=1)

    # A poor review.
    db_session.add(models.Review(astrologer_id=astro.id, seeker_id=loyal_seeker.id, rating=1))
    db_session.commit()

    resp = client.get(f"/admin/astrologers/{astro.id}/stats", headers=auth_headers(admin))
    assert resp.status_code == 200
    body = resp.json()
    assert body["poor_chat_percentage"] == 100.0
    assert body["loyal_user_percentage"] == 100.0
    assert body["avg_online_hours_per_day_30d"] == 0.0


def test_admin_transactions_lists_seeker_wallet_history(client, make_user, db_session):
    admin = make_user(models.UserRole.ADMIN)
    seeker = make_user(models.UserRole.SEEKER)
    db_session.add(models.WalletTransaction(
        user_id=seeker.id, amount=200.0, transaction_type=models.TransactionType.DEPOSIT,
        description="Test deposit",
    ))
    db_session.commit()

    resp = client.get("/admin/transactions", headers=auth_headers(admin))
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    assert body["transactions"][0]["amount"] == 200.0


def test_admin_transactions_requires_admin(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.get("/admin/transactions", headers=auth_headers(seeker))
    assert resp.status_code == 403
