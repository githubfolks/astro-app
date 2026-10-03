"""Unit tests for the SEO Agent quality gate (services/seo_quality.py)."""
from app.services import seo_quality
from app.services.seo_quality import QualityRules, check_draft

WORDS = " ".join(["Vedic astrology reads the birth chart through houses and planets."] * 20)  # 200 words


def _rules(**overrides) -> QualityRules:
    base = dict(
        min_words=100,
        min_faqs=2,
        banned_phrases=["guarantee", "cure", "100%"],
        allowed_paths={"/tools/kundli-chart", "/astrologers"},
        published_blog_slugs={"what-is-manglik-dosha"},
        existing_titles=["What Is Manglik Dosha?"],
    )
    base.update(overrides)
    return QualityRules(**base)


def _faqs(n=2):
    return [{"question": f"Question {i}?", "answer": f"Answer {i}."} for i in range(n)]


def _codes(report):
    return {i["code"] for i in report.issues}


def _good_html(extra=""):
    return f'<h2>Overview</h2><p>{WORDS}</p><p>Try the <a href="/tools/kundli-chart">free Kundli</a>.</p>{extra}'


def test_clean_draft_passes():
    report = check_draft(title="Saturn in the Seventh House", excerpt="What Saturn in the 7th house means for marriage.",
                         content_html=_good_html(), faqs=_faqs(), rules=_rules())
    assert report.passed, report.issues
    assert report.stats == {"words": 205, "faqs": 2, "internal_links": 1}  # 200 body + 1 heading + 4 link sentence


def test_too_short_and_too_few_faqs():
    report = check_draft(title="Saturn in the Seventh House", excerpt="x",
                         content_html='<p>Short. <a href="/astrologers">Ask</a></p>', faqs=_faqs(1), rules=_rules())
    assert {"too_short", "too_few_faqs"} <= _codes(report)


def test_faq_with_empty_answer_does_not_count():
    faqs = [{"question": "Q1?", "answer": "A1."}, {"question": "Q2?", "answer": "  "}]
    report = check_draft(title="Saturn in the Seventh House", excerpt="x", content_html=_good_html(), faqs=faqs, rules=_rules())
    assert "too_few_faqs" in _codes(report)


def test_banned_phrases_use_word_boundaries():
    secure = check_draft(title="Saturn in the Seventh House", excerpt="A secure, careful reading.",
                         content_html=_good_html(), faqs=_faqs(), rules=_rules())
    assert "banned_phrase" not in _codes(secure)

    cure = check_draft(title="Saturn in the Seventh House", excerpt="This remedy will cure it.",
                       content_html=_good_html(), faqs=_faqs(), rules=_rules())
    assert "banned_phrase" in _codes(cure)


def test_banned_symbol_phrase_matches_substring():
    report = check_draft(title="Saturn in the Seventh House", excerpt="Results 100% of the time.",
                         content_html=_good_html(), faqs=_faqs(), rules=_rules())
    assert "banned_phrase" in _codes(report)


def test_banned_phrase_in_faq_answer_is_caught():
    faqs = _faqs() + [{"question": "Will it work?", "answer": "We guarantee it."}]
    report = check_draft(title="Saturn in the Seventh House", excerpt="x", content_html=_good_html(), faqs=faqs, rules=_rules())
    assert "banned_phrase" in _codes(report)


def test_specific_year_time_and_degree_rejected():
    html = _good_html("<p>In 2027 Saturn moves at 10:30 to 15° Aries.</p>")
    report = check_draft(title="Saturn in the Seventh House", excerpt="x", content_html=html, faqs=_faqs(), rules=_rules())
    assert {"specific_year", "specific_time", "specific_degree"} <= _codes(report)


def test_external_and_unknown_links_rejected():
    html = _good_html('<p><a href="https://example.com/x">ext</a> <a href="/tools/does-not-exist">bad</a></p>')
    report = check_draft(title="Saturn in the Seventh House", excerpt="x", content_html=html, faqs=_faqs(), rules=_rules())
    assert {"external_link", "unknown_link"} <= _codes(report)


def test_links_to_published_blog_posts_allowed_but_not_unpublished():
    ok = _good_html('<p><a href="/blog/what-is-manglik-dosha">related</a></p>')
    assert check_draft(title="Saturn in the Seventh House", excerpt="x", content_html=ok, faqs=_faqs(), rules=_rules()).passed

    bad = _good_html('<p><a href="/blog/some-draft-post">draft</a></p>')
    report = check_draft(title="Saturn in the Seventh House", excerpt="x", content_html=bad, faqs=_faqs(), rules=_rules())
    assert "unknown_link" in _codes(report)


def test_requires_at_least_one_internal_link():
    report = check_draft(title="Saturn in the Seventh House", excerpt="x", content_html=f"<p>{WORDS}</p>",
                         faqs=_faqs(), rules=_rules())
    assert "no_internal_link" in _codes(report)


def test_forbidden_tags_rejected():
    html = _good_html("<h1>Dup title</h1><script>alert(1)</script>")
    report = check_draft(title="Saturn in the Seventh House", excerpt="x", content_html=html, faqs=_faqs(), rules=_rules())
    assert "forbidden_tag" in _codes(report)
    assert "alert" not in " ".join(i["message"] for i in report.issues)


def test_near_duplicate_title_rejected():
    report = check_draft(title="What is Manglik Dosha", excerpt="x", content_html=_good_html(), faqs=_faqs(), rules=_rules())
    assert "near_duplicate" in _codes(report)


def test_excerpt_missing_or_too_long():
    missing = check_draft(title="Saturn in the Seventh House", excerpt="  ", content_html=_good_html(), faqs=_faqs(), rules=_rules())
    assert "missing_excerpt" in _codes(missing)
    long = check_draft(title="Saturn in the Seventh House", excerpt="x" * 161, content_html=_good_html(), faqs=_faqs(), rules=_rules())
    assert "excerpt_too_long" in _codes(long)


def test_parse_internal_links_setting():
    value = "/tools/kundli-chart | Kundli\n/panchang/ | Panchang\nnot-a-path | x\n\n"
    assert seo_quality.parse_internal_links(value) == {"/tools/kundli-chart", "/panchang"}


def test_parse_banned_phrases_setting():
    assert seo_quality.parse_banned_phrases(" Guarantee \n\n100%\n") == ["guarantee", "100%"]
