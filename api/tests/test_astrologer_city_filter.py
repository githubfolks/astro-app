"""City filtering for the public astrologer list (backs /astrologers/city/<slug>)
and admin persistence of the astrologer's city."""
from app import models
from tests.conftest import auth_headers


def _listed_astrologer(make_user, db_session, full_name, city):
    user = make_user(models.UserRole.ASTROLOGER, full_name=full_name)
    profile = db_session.query(models.AstrologerProfile).filter_by(user_id=user.id).one()
    profile.city = city
    profile.is_approved = True
    profile.onboarding_stage = models.OnboardingStage.COMPLETED
    db_session.commit()
    return user


def _names(resp):
    assert resp.status_code == 200, resp.text
    return {p["full_name"] for p in resp.json()}


def _seed(make_user, db_session):
    _listed_astrologer(make_user, db_session, "Hyd Exact", "Hyderabad")
    _listed_astrologer(make_user, db_session, "Hyd State", "  hyderabad, Telangana ")
    _listed_astrologer(make_user, db_session, "Blr Alias", "Bengaluru")
    _listed_astrologer(make_user, db_session, "Hyd Prefix Trap", "Hyderabadi Colony")
    _listed_astrologer(make_user, db_session, "No City", None)


def test_city_filter_returns_only_astrologers_based_in_that_city(client, make_user, db_session):
    _seed(make_user, db_session)
    names = _names(client.get("/astrologers/", params={"city": "Hyderabad"}))
    assert names == {"Hyd Exact", "Hyd State"}


def test_city_filter_accepts_spelling_variants(client, make_user, db_session):
    _seed(make_user, db_session)
    names = _names(client.get("/astrologers/", params=[("city", "Bangalore"), ("city", "Bengaluru")]))
    assert names == {"Blr Alias"}


def test_exclude_city_returns_everyone_else_including_no_city(client, make_user, db_session):
    _seed(make_user, db_session)
    names = _names(client.get("/astrologers/", params={"exclude_city": "Hyderabad"}))
    assert names == {"Blr Alias", "Hyd Prefix Trap", "No City"}


def test_city_and_exclude_city_partition_the_full_list(client, make_user, db_session):
    _seed(make_user, db_session)
    everyone = _names(client.get("/astrologers/"))
    local = _names(client.get("/astrologers/", params={"city": "Hyderabad"}))
    rest = _names(client.get("/astrologers/", params={"exclude_city": "Hyderabad"}))
    assert local.isdisjoint(rest)
    assert local | rest == everyone


def test_city_filter_with_no_matches_returns_empty_list(client, make_user, db_session):
    _seed(make_user, db_session)
    assert _names(client.get("/astrologers/", params={"city": "Pune"})) == set()


def test_city_filter_treats_like_wildcards_literally(client, make_user, db_session):
    _seed(make_user, db_session)
    assert _names(client.get("/astrologers/", params={"city": "%"})) == set()
    assert _names(client.get("/astrologers/", params={"city": "_yderabad"})) == set()


def test_city_filter_still_hides_unapproved_astrologers(client, make_user, db_session):
    user = make_user(models.UserRole.ASTROLOGER, full_name="Pending Hyd")
    profile = db_session.query(models.AstrologerProfile).filter_by(user_id=user.id).one()
    profile.city = "Hyderabad"
    db_session.commit()
    assert _names(client.get("/astrologers/", params={"city": "Hyderabad"})) == set()


def test_city_and_exclude_city_together_is_rejected(client):
    resp = client.get("/astrologers/", params={"city": "Hyderabad", "exclude_city": "Pune"})
    assert resp.status_code == 422


def test_oversized_city_filter_is_rejected(client):
    assert client.get("/astrologers/", params={"city": "x" * 61}).status_code == 422
    too_many = [("city", f"c{i}") for i in range(11)]
    assert client.get("/astrologers/", params=too_many).status_code == 422


def _admin_payload(astro, **overrides):
    payload = {
        "email": astro.email,
        "phone_number": astro.phone_number,
        "password": "",
        "full_name": "Astro Test",
        "experience_years": 5,
        "languages": "Hindi",
        "specialties": "Vedic",
        "consultation_fee_per_min": "20.00",
    }
    payload.update(overrides)
    return payload


def test_admin_update_sets_and_clears_city(client, make_user, db_session):
    admin = make_user(models.UserRole.ADMIN)
    astro = make_user(models.UserRole.ASTROLOGER)

    resp = client.put(f"/admin/astrologers/{astro.id}", json=_admin_payload(astro, city=" Hyderabad "), headers=auth_headers(admin))
    assert resp.status_code == 200, resp.text
    profile = db_session.query(models.AstrologerProfile).filter_by(user_id=astro.id).one()
    db_session.refresh(profile)
    assert profile.city == "Hyderabad"

    listed = client.get("/admin/astrologers_full", headers=auth_headers(admin)).json()["astrologers"]
    assert next(a for a in listed if a["id"] == astro.id)["profile"]["city"] == "Hyderabad"

    resp = client.put(f"/admin/astrologers/{astro.id}", json=_admin_payload(astro, city=""), headers=auth_headers(admin))
    assert resp.status_code == 200, resp.text
    db_session.refresh(profile)
    assert profile.city is None


def test_admin_update_without_city_field_keeps_existing_city(client, make_user, db_session):
    admin = make_user(models.UserRole.ADMIN)
    astro = make_user(models.UserRole.ASTROLOGER)
    profile = db_session.query(models.AstrologerProfile).filter_by(user_id=astro.id).one()
    profile.city = "Pune"
    db_session.commit()

    resp = client.put(f"/admin/astrologers/{astro.id}", json=_admin_payload(astro), headers=auth_headers(admin))
    assert resp.status_code == 200, resp.text
    db_session.refresh(profile)
    assert profile.city == "Pune"


def test_admin_astrologer_update_requires_admin(client, make_user):
    seeker = make_user(models.UserRole.SEEKER)
    astro = make_user(models.UserRole.ASTROLOGER)
    resp = client.put(f"/admin/astrologers/{astro.id}", json=_admin_payload(astro, city="Hyderabad"), headers=auth_headers(seeker))
    assert resp.status_code in (401, 403)
