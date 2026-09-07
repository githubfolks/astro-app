"""Tests for the public blog listing endpoint (GET /public/posts) that powers
the /blog index page."""
from datetime import datetime

from app import models


def _make_post(db_session, author, **overrides):
    fields = dict(
        title="Vedic Transits Explained",
        slug=f"vedic-transits-{overrides.get('slug_n', 1)}",
        content="<p>" + ("Mars moves into the 7th house. " * 40) + "</p>",
        excerpt=None,
        featured_image="/static/cms_posts/abc.jpg",
        author_id=author.id,
        status=models.PostStatus.PUBLISHED,
        published_at=datetime.utcnow(),
    )
    fields.pop("slug_n", None)
    fields.update({k: v for k, v in overrides.items() if k != "slug_n"})
    post = models.Post(**fields)
    db_session.add(post)
    db_session.commit()
    db_session.refresh(post)
    return post


def test_public_posts_omits_full_content(client, make_user, db_session):
    author = make_user(models.UserRole.ADMIN)
    _make_post(db_session, author, slug="with-excerpt", excerpt="Short teaser.")

    resp = client.get("/public/posts")
    assert resp.status_code == 200
    body = resp.json()
    assert body["total"] == 1
    post = body["posts"][0]
    assert "content" not in post
    assert post["excerpt"] == "Short teaser."
    assert post["slug"] == "with-excerpt"
    assert post["featured_image"] == "/static/cms_posts/abc.jpg"


def test_public_posts_derives_excerpt_when_missing(client, make_user, db_session):
    author = make_user()
    _make_post(db_session, author, slug="no-excerpt", excerpt=None)

    resp = client.get("/public/posts")
    assert resp.status_code == 200
    post = resp.json()["posts"][0]
    assert post["excerpt"]
    assert "<p>" not in post["excerpt"]
    assert post["excerpt"].endswith("…")
    assert len(post["excerpt"]) <= 160


def test_public_posts_excludes_drafts(client, make_user, db_session):
    author = make_user()
    _make_post(db_session, author, slug="draft", status=models.PostStatus.DRAFT, published_at=None)

    resp = client.get("/public/posts")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0
