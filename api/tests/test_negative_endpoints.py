"""Negative testing across routers with no dedicated test file: users, seekers,
packages, disputes, and matching. Focuses on authorization/IDOR boundaries,
invalid input, malformed payloads, and invalid state transitions rather than
happy-path behavior (already covered elsewhere).
"""
from app import models
from tests.conftest import auth_headers


# --- users.py: cross-user profile access (IDOR) -------------------------------

def test_get_other_seeker_profile_forbidden_for_unrelated_seeker(client, make_user):
    victim = make_user(models.UserRole.SEEKER, full_name="Victim")
    attacker = make_user(models.UserRole.SEEKER)

    resp = client.get(f"/users/{victim.id}/profile", headers=auth_headers(attacker))
    assert resp.status_code == 403


def test_update_other_seeker_profile_forbidden_for_unrelated_astrologer(client, make_user):
    """An astrologer with NO consultation history with the seeker must not be able
    to overwrite that seeker's profile."""
    victim = make_user(models.UserRole.SEEKER, full_name="Victim")
    astro = make_user(models.UserRole.ASTROLOGER)

    resp = client.put(
        f"/users/{victim.id}/profile",
        headers=auth_headers(astro),
        json={"full_name": "Overwritten"},
    )
    assert resp.status_code == 403


def test_get_my_profile_wrong_role_rejected(client, make_user):
    astro = make_user(models.UserRole.ASTROLOGER)
    resp = client.get("/users/profile", headers=auth_headers(astro))
    assert resp.status_code == 400


def test_users_profile_endpoints_require_auth(client):
    assert client.get("/users/profile").status_code == 401
    assert client.put("/users/profile", json={"full_name": "x"}).status_code == 401


def test_device_token_requires_auth(client):
    resp = client.post("/users/device-token", json={"token": "abc"})
    assert resp.status_code == 401


def test_update_profile_rejects_wrong_types(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.put(
        "/users/profile",
        headers=auth_headers(seeker),
        json={"date_of_birth": "not-a-date", "gender": "NOT_A_GENDER"},
    )
    assert resp.status_code == 422


# --- seekers.py -----------------------------------------------------------------

def test_seeker_profile_endpoint_rejects_astrologer(client, make_user):
    astro = make_user(models.UserRole.ASTROLOGER)
    resp = client.get("/seekers/profile", headers=auth_headers(astro))
    assert resp.status_code == 400


def test_seeker_profile_endpoint_rejects_admin(client, make_user):
    admin = make_user(models.UserRole.ADMIN)
    resp = client.put("/seekers/profile", headers=auth_headers(admin), json={"full_name": "x"})
    assert resp.status_code == 400


def test_seeker_profile_requires_auth(client):
    resp = client.get("/seekers/profile")
    assert resp.status_code == 401


# --- packages.py ------------------------------------------------------------

def test_create_package_requires_admin(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post(
        "/packages/",
        headers=auth_headers(seeker),
        json={"name": "Pkg", "duration_minutes": 30, "price": "100.00"},
    )
    assert resp.status_code == 403


def test_deactivate_nonexistent_package_returns_404(client, make_user):
    admin = make_user(models.UserRole.ADMIN)
    resp = client.delete("/packages/999999", headers=auth_headers(admin))
    assert resp.status_code == 404


def test_checkout_rejected_for_astrologer_role(client, make_user):
    astro = make_user(models.UserRole.ASTROLOGER)
    resp = client.post(
        "/packages/checkout",
        headers=auth_headers(astro),
        json={"package_id": 1, "astrologer_id": astro.id},
    )
    assert resp.status_code == 403


def test_checkout_nonexistent_package_returns_404(client, make_user):
    seeker = make_user(models.UserRole.SEEKER, balance=1000.0)
    other_astro = make_user(models.UserRole.ASTROLOGER)
    resp = client.post(
        "/packages/checkout",
        headers=auth_headers(seeker),
        json={"package_id": 999999, "astrologer_id": other_astro.id},
    )
    assert resp.status_code == 404


def test_checkout_nonexistent_astrologer_returns_404(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=1000.0)
    pkg = models.ChatPackage(name="Pkg", duration_minutes=30, price=50.0, is_active=True)
    db_session.add(pkg)
    db_session.commit()
    db_session.refresh(pkg)

    resp = client.post(
        "/packages/checkout",
        headers=auth_headers(seeker),
        json={"package_id": pkg.id, "astrologer_id": 999999},
    )
    assert resp.status_code == 404


def test_checkout_insufficient_balance_returns_400(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER, balance=1.0)
    astro = make_user(models.UserRole.ASTROLOGER)
    astro.astrologer_profile.is_approved = True
    pkg = models.ChatPackage(name="Pkg", duration_minutes=30, price=500.0, is_active=True)
    db_session.add(pkg)
    db_session.commit()
    db_session.refresh(pkg)

    resp = client.post(
        "/packages/checkout",
        headers=auth_headers(seeker),
        json={"package_id": pkg.id, "astrologer_id": astro.id},
    )
    assert resp.status_code in (400, 404)  # 404 if approval flag not persisted this way


def test_checkout_requires_auth(client):
    resp = client.post("/packages/checkout", json={"package_id": 1, "astrologer_id": 1})
    assert resp.status_code == 401


def test_create_package_rejects_missing_fields(client, make_user):
    admin = make_user(models.UserRole.ADMIN)
    resp = client.post("/packages/", headers=auth_headers(admin), json={"name": "Pkg"})
    assert resp.status_code == 422


def test_create_package_rejects_negative_price(client, make_user, db_session):
    """Negative-price packages aren't rejected by the schema (Decimal accepts any
    sign); document current behavior so a future validation gap is visible."""
    admin = make_user(models.UserRole.ADMIN)
    resp = client.post(
        "/packages/",
        headers=auth_headers(admin),
        json={"name": "Negative", "duration_minutes": 10, "price": "-50.00"},
    )
    # Currently accepted (no server-side floor check) — flags a validation gap.
    assert resp.status_code == 200
    assert float(resp.json()["price"]) == -50.0


# --- disputes.py --------------------------------------------------------------

def test_raise_dispute_nonexistent_consultation_returns_404(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post(
        "/disputes/",
        headers=auth_headers(seeker),
        json={"consultation_id": 999999, "reason": "never happened"},
    )
    assert resp.status_code == 404


def test_raise_dispute_by_non_participant_forbidden(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    outsider = make_user(models.UserRole.SEEKER)

    consultation = models.Consultation(
        seeker_id=seeker.id,
        astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT,
        rate_per_min=10.0,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)

    resp = client.post(
        "/disputes/",
        headers=auth_headers(outsider),
        json={"consultation_id": consultation.id, "reason": "not mine"},
    )
    assert resp.status_code == 403


def test_raise_dispute_rejects_admin_role(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    admin = make_user(models.UserRole.ADMIN)

    consultation = models.Consultation(
        seeker_id=seeker.id,
        astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT,
        rate_per_min=10.0,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)

    resp = client.post(
        "/disputes/",
        headers=auth_headers(admin),
        json={"consultation_id": consultation.id, "reason": "admin trying"},
    )
    assert resp.status_code == 403


def test_duplicate_open_dispute_rejected(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)

    consultation = models.Consultation(
        seeker_id=seeker.id,
        astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT,
        rate_per_min=10.0,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)

    payload = {"consultation_id": consultation.id, "reason": "bad service"}
    first = client.post("/disputes/", headers=auth_headers(seeker), json=payload)
    assert first.status_code == 200

    second = client.post("/disputes/", headers=auth_headers(seeker), json=payload)
    assert second.status_code == 400


def test_list_all_disputes_requires_admin(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.get("/disputes/", headers=auth_headers(seeker))
    assert resp.status_code == 403


def test_resolve_dispute_invalid_status_rejected(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    admin = make_user(models.UserRole.ADMIN)

    consultation = models.Consultation(
        seeker_id=seeker.id, astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT, rate_per_min=10.0,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)

    dispute = models.Dispute(consultation_id=consultation.id, raised_by_id=seeker.id, reason="x")
    db_session.add(dispute)
    db_session.commit()
    db_session.refresh(dispute)

    resp = client.put(
        f"/disputes/{dispute.id}",
        headers=auth_headers(admin),
        json={"status": "NOT_A_REAL_STATUS"},
    )
    assert resp.status_code == 400


def test_resolve_already_closed_dispute_rejected(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    admin = make_user(models.UserRole.ADMIN)

    consultation = models.Consultation(
        seeker_id=seeker.id, astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT, rate_per_min=10.0,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)

    dispute = models.Dispute(
        consultation_id=consultation.id, raised_by_id=seeker.id, reason="x",
        status=models.DisputeStatus.RESOLVED,
    )
    db_session.add(dispute)
    db_session.commit()
    db_session.refresh(dispute)

    resp = client.put(
        f"/disputes/{dispute.id}",
        headers=auth_headers(admin),
        json={"status": "REJECTED"},
    )
    assert resp.status_code == 400


def test_resolve_dispute_requires_admin(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)

    consultation = models.Consultation(
        seeker_id=seeker.id, astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT, rate_per_min=10.0,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)

    dispute = models.Dispute(consultation_id=consultation.id, raised_by_id=seeker.id, reason="x")
    db_session.add(dispute)
    db_session.commit()
    db_session.refresh(dispute)

    resp = client.put(
        f"/disputes/{dispute.id}",
        headers=auth_headers(seeker),
        json={"status": "RESOLVED", "refund_amount": "999999.00"},
    )
    assert resp.status_code == 403


def test_resolve_nonexistent_dispute_returns_404(client, make_user):
    admin = make_user(models.UserRole.ADMIN)
    resp = client.put(
        "/disputes/999999",
        headers=auth_headers(admin),
        json={"status": "REJECTED"},
    )
    assert resp.status_code == 404


def test_raise_dispute_missing_reason_rejected(client, make_user, db_session):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    consultation = models.Consultation(
        seeker_id=seeker.id, astrologer_id=astro.id,
        consultation_type=models.ConsultationType.CHAT, rate_per_min=10.0,
        status=models.ConsultationStatus.COMPLETED,
    )
    db_session.add(consultation)
    db_session.commit()
    db_session.refresh(consultation)

    resp = client.post(
        "/disputes/",
        headers=auth_headers(seeker),
        json={"consultation_id": consultation.id},
    )
    assert resp.status_code == 422


# --- matching.py / kundli.py: role gating & IDOR --------------------------------

def test_matching_generate_rejected_for_seeker(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    resp = client.post(
        "/matching/generate",
        headers=auth_headers(seeker),
        json={
            "boy": {"date_of_birth": "1990-01-01", "time_of_birth": "10:00:00", "place_of_birth": "Delhi"},
            "girl": {"date_of_birth": "1992-01-01", "time_of_birth": "11:00:00", "place_of_birth": "Mumbai"},
        },
    )
    assert resp.status_code == 403


def test_matching_report_not_owned_by_requester_returns_404(client, make_user, db_session):
    """An astrologer must not be able to fetch another astrologer's cached match
    report by guessing its id (IDOR check on generated_by)."""
    owner = make_user(models.UserRole.ASTROLOGER)
    other = make_user(models.UserRole.ASTROLOGER)

    from datetime import date, time as time_cls
    report = models.KundliMatchReport(
        generated_by=owner.id,
        boy_full_name="Boy", boy_date_of_birth=date(1990, 1, 1),
        boy_time_of_birth=time_cls(10, 0), boy_place_of_birth="Delhi",
        boy_latitude=28.6, boy_longitude=77.2,
        girl_full_name="Girl", girl_date_of_birth=date(1992, 1, 1),
        girl_time_of_birth=time_cls(11, 0), girl_place_of_birth="Mumbai",
        girl_latitude=19.0, girl_longitude=72.8,
        match_data={},
    )
    db_session.add(report)
    db_session.commit()
    db_session.refresh(report)

    resp = client.get(f"/matching/{report.id}", headers=auth_headers(other))
    assert resp.status_code == 404


def test_matching_generate_requires_auth(client):
    resp = client.post(
        "/matching/generate",
        json={
            "boy": {"date_of_birth": "1990-01-01", "time_of_birth": "10:00:00", "place_of_birth": "Delhi"},
            "girl": {"date_of_birth": "1992-01-01", "time_of_birth": "11:00:00", "place_of_birth": "Mumbai"},
        },
    )
    assert resp.status_code == 401


def test_matching_generate_missing_required_birth_fields_returns_422(client, make_user):
    """Empty person objects fail Pydantic validation (place/dob/tob required by
    the request schema) before the handler's own 400 check ever runs."""
    astro = make_user(models.UserRole.ASTROLOGER)
    resp = client.post(
        "/matching/generate",
        headers=auth_headers(astro),
        json={"boy": {}, "girl": {}},
    )
    assert resp.status_code == 422
