"""AI Astrologer callback leads: guests who used up the free questions can
leave a phone number (with explicit consent); admins list, export and track
follow-up status, with every status change audit-logged."""
from app import models
from app.routers.ai_astrologer import CALLBACK_CONSENT_TEXT
from tests.conftest import auth_headers


def _payload(phone="9876543210", name="Asha  Rao", consent=True, **birth):
    details = {
        "name": name,
        "date_of_birth": "1992-03-14",
        "time_of_birth": "06:30",
        "place_of_birth": " Pune, Maharashtra ",
        "gender": "FEMALE",
        **birth,
    }
    return {"birth_details": details, "phone_number": phone, "consent": consent}


def _leads(db_session):
    db_session.expire_all()
    return db_session.query(models.AiAstrologerLead).all()


def test_callback_request_stores_lead_with_consent(client, db_session):
    resp = client.post("/ai-astrologer/callback-request", json=_payload())

    assert resp.status_code == 201
    assert "id" not in resp.json()  # internal id is never exposed publicly
    [lead] = _leads(db_session)
    assert lead.phone_number == "9876543210"
    assert lead.name == "Asha Rao"
    assert lead.place_of_birth == "Pune, Maharashtra"
    assert lead.time_of_birth.strftime("%H:%M") == "06:30"
    assert lead.gender == models.GenderType.FEMALE
    assert lead.status == models.AiAstrologerLeadStatus.NEW
    assert lead.request_count == 1
    assert lead.consent_text == CALLBACK_CONSENT_TEXT
    assert lead.consented_at is not None


def test_unknown_birth_time_is_allowed(client, db_session):
    resp = client.post("/ai-astrologer/callback-request", json=_payload(time_of_birth=None))
    assert resp.status_code == 201
    assert _leads(db_session)[0].time_of_birth is None


def test_repeat_request_updates_same_lead_and_reopens_it(client, db_session):
    client.post("/ai-astrologer/callback-request", json=_payload())
    lead = _leads(db_session)[0]
    lead.status = models.AiAstrologerLeadStatus.CLOSED
    db_session.commit()

    resp = client.post("/ai-astrologer/callback-request", json=_payload(name="Asha R", place_of_birth="Mumbai"))

    assert resp.status_code == 201
    [lead] = _leads(db_session)
    assert lead.request_count == 2
    assert lead.name == "Asha R"
    assert lead.place_of_birth == "Mumbai"
    assert lead.status == models.AiAstrologerLeadStatus.NEW


def test_consent_is_required(client, db_session):
    for body in (_payload(consent=False), {k: v for k, v in _payload().items() if k != "consent"}):
        assert client.post("/ai-astrologer/callback-request", json=body).status_code == 422
    assert _leads(db_session) == []


def test_invalid_phone_is_rejected(client, db_session):
    for phone in ("12345", "98765abcde", "+919876543210", "1" * 16):
        assert client.post("/ai-astrologer/callback-request", json=_payload(phone=phone)).status_code == 422
    assert _leads(db_session) == []


def test_admin_endpoints_require_admin(client, make_user):
    client.post("/ai-astrologer/callback-request", json=_payload())
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)

    for headers in ({}, auth_headers(seeker), auth_headers(astro)):
        assert client.get("/reports/ai-astrologer-leads", headers=headers).status_code in (401, 403)
        assert client.get("/reports/ai-astrologer-leads/export", headers=headers).status_code in (401, 403)
        assert client.patch("/reports/ai-astrologer-leads/1", json={"status": "CONTACTED"}, headers=headers).status_code in (401, 403)


def test_admin_lists_filters_and_exports(client, make_user):
    client.post("/ai-astrologer/callback-request", json=_payload(phone="9876543210", name="Asha Rao"))
    client.post("/ai-astrologer/callback-request", json=_payload(phone="9123456780", name="Ravi Kumar"))
    admin = make_user(models.UserRole.ADMIN)
    h = auth_headers(admin)

    body = client.get("/reports/ai-astrologer-leads", headers=h).json()
    assert body["total"] == 2
    assert {l["phone_number"] for l in body["leads"]} == {"9876543210", "9123456780"}

    body = client.get("/reports/ai-astrologer-leads", params={"search": "ravi"}, headers=h).json()
    assert [l["name"] for l in body["leads"]] == ["Ravi Kumar"]

    body = client.get("/reports/ai-astrologer-leads", params={"status": "CONTACTED"}, headers=h).json()
    assert body["total"] == 0

    csv_resp = client.get("/reports/ai-astrologer-leads/export", headers=h)
    assert csv_resp.status_code == 200
    assert csv_resp.headers["content-type"].startswith("text/csv")
    assert "9876543210" in csv_resp.text and "Ravi Kumar" in csv_resp.text


def test_admin_status_change_is_audited(client, make_user, db_session):
    client.post("/ai-astrologer/callback-request", json=_payload())
    lead_id = _leads(db_session)[0].id
    admin = make_user(models.UserRole.ADMIN)

    resp = client.patch(f"/reports/ai-astrologer-leads/{lead_id}", json={"status": "CONTACTED"}, headers=auth_headers(admin))

    assert resp.status_code == 200
    assert resp.json()["status"] == "CONTACTED"
    db_session.expire_all()
    [entry] = db_session.query(models.AuditLog).filter_by(action="AI_ASTROLOGER_LEAD_STATUS_CHANGED").all()
    assert entry.actor_id == admin.id
    assert entry.resource_id == str(lead_id)
    assert entry.details == {"from": "NEW", "to": "CONTACTED"}


def test_admin_status_change_validation(client, make_user):
    h = auth_headers(make_user(models.UserRole.ADMIN))
    assert client.patch("/reports/ai-astrologer-leads/999999", json={"status": "CONTACTED"}, headers=h).status_code == 404
    client.post("/ai-astrologer/callback-request", json=_payload())
    lead_id = client.get("/reports/ai-astrologer-leads", headers=h).json()["leads"][0]["id"]
    assert client.patch(f"/reports/ai-astrologer-leads/{lead_id}", json={"status": "BOGUS"}, headers=h).status_code == 422
