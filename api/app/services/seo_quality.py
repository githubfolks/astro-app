"""Quality gate for SEO Agent drafts.

Pure checks over a draft's title/excerpt/HTML/FAQs, with the rules (banned
phrases, allowed links, minimums) passed in so they stay configurable via
app settings. Runs when a draft is created (report shown to the reviewer) and
again when an admin publishes an agent draft (publishing is refused on
failure), so manual edits are re-checked too.
"""
import re
from dataclasses import dataclass, field
from html.parser import HTMLParser
from typing import Iterable
from urllib.parse import urlsplit

# Drafts are evergreen explainers: anything that pins a specific date, clock
# time or planetary degree must come from our computed data, which these
# drafts are not given — so any such value would be invented.
_YEAR_RE = re.compile(r"\b(?:19|20)\d{2}\b")
_CLOCK_RE = re.compile(r"\b\d{1,2}:\d{2}\b")
_DEGREE_RE = re.compile(r"\d\s*°")

_FORBIDDEN_TAGS = {"h1", "script", "style", "iframe", "form", "object", "embed"}
_STOPWORDS = {
    "a", "an", "and", "the", "of", "in", "on", "for", "to", "is", "are", "what", "how", "why",
    "your", "you", "with", "its", "it", "do", "does", "can", "vs", "guide", "complete", "explained",
}
DUPLICATE_TITLE_SIMILARITY = 0.6
EXCERPT_MAX_CHARS = 160


@dataclass
class QualityRules:
    min_words: int
    min_faqs: int
    banned_phrases: list[str]
    allowed_paths: set[str]          # e.g. {"/tools/kundli-chart", ...}
    published_blog_slugs: set[str]   # /blog/<slug> links allowed for these
    existing_titles: list[str]       # other posts, for near-duplicate detection


@dataclass
class QualityReport:
    passed: bool
    issues: list[dict] = field(default_factory=list)
    stats: dict = field(default_factory=dict)

    def as_dict(self) -> dict:
        return {"passed": self.passed, "issues": self.issues, "stats": self.stats}


class _ArticleParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.text_parts: list[str] = []
        self.hrefs: list[str] = []
        self.forbidden_tags: set[str] = set()
        self._skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in _FORBIDDEN_TAGS:
            self.forbidden_tags.add(tag)
        if tag in ("script", "style"):
            self._skip_depth += 1
        if tag == "a":
            href = dict(attrs).get("href")
            self.hrefs.append(href or "")

    def handle_endtag(self, tag):
        if tag in ("script", "style") and self._skip_depth:
            self._skip_depth -= 1

    def handle_data(self, data):
        if not self._skip_depth:
            self.text_parts.append(data)


def parse_internal_links(setting_value: str) -> set[str]:
    """Parse the seo_agent_internal_links setting ("/path | description" per line) into paths."""
    paths = set()
    for line in (setting_value or "").splitlines():
        path = line.split("|", 1)[0].strip()
        if path.startswith("/"):
            paths.add(path.rstrip("/") or "/")
    return paths


def parse_banned_phrases(setting_value: str) -> list[str]:
    return [p.strip().lower() for p in (setting_value or "").splitlines() if p.strip()]


def _title_tokens(title: str) -> set[str]:
    return {t for t in re.findall(r"[a-z0-9]+", title.lower()) if t not in _STOPWORDS}


def title_similarity(a: str, b: str) -> float:
    ta, tb = _title_tokens(a), _title_tokens(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


def _contains_phrase(text: str, phrase: str) -> bool:
    # Word boundaries for word-like phrases ("cure" must not match "secure");
    # plain substring for symbols such as "100%".
    if re.fullmatch(r"[\w\s'-]+", phrase):
        return re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text) is not None
    return phrase in text


def check_draft(
    *,
    title: str,
    excerpt: str | None,
    content_html: str,
    faqs: Iterable[dict] | None,
    rules: QualityRules,
) -> QualityReport:
    issues: list[dict] = []

    def issue(code: str, message: str):
        issues.append({"code": code, "message": message})

    parser = _ArticleParser()
    parser.feed(content_html or "")
    body_text = " ".join(" ".join(parser.text_parts).split())
    faq_list = [f for f in (faqs or []) if isinstance(f, dict)]
    faq_text = " ".join(f"{f.get('question', '')} {f.get('answer', '')}" for f in faq_list)
    all_text = " ".join([title or "", excerpt or "", body_text, faq_text])
    all_lower = all_text.lower()

    word_count = len(re.findall(r"\w+", body_text))
    if word_count < rules.min_words:
        issue("too_short", f"Article has {word_count} words; minimum is {rules.min_words}.")

    complete_faqs = [f for f in faq_list if str(f.get("question", "")).strip() and str(f.get("answer", "")).strip()]
    if len(complete_faqs) < rules.min_faqs:
        issue("too_few_faqs", f"{len(complete_faqs)} complete FAQs; minimum is {rules.min_faqs}.")

    if not (excerpt or "").strip():
        issue("missing_excerpt", "Excerpt (used as the meta description) is empty.")
    elif len(excerpt.strip()) > EXCERPT_MAX_CHARS:
        issue("excerpt_too_long", f"Excerpt is {len(excerpt.strip())} characters; keep it to {EXCERPT_MAX_CHARS} or fewer.")

    for phrase in rules.banned_phrases:
        if _contains_phrase(all_lower, phrase):
            issue("banned_phrase", f'Contains banned phrase "{phrase}".')

    for code, regex, label in (
        ("specific_year", _YEAR_RE, "a specific year"),
        ("specific_time", _CLOCK_RE, "a clock time"),
        ("specific_degree", _DEGREE_RE, "a planetary degree"),
    ):
        found = sorted(set(regex.findall(all_text)))
        if found:
            issue(code, f"Mentions {label} ({', '.join(found[:5])}). Evergreen drafts must not state dates, timings or positions that are not from our computed data.")

    for tag in sorted(parser.forbidden_tags):
        issue("forbidden_tag", f"Content contains a <{tag}> element.")

    internal_links = 0
    for href in parser.hrefs:
        parts = urlsplit(href)
        if parts.scheme or parts.netloc or not parts.path.startswith("/"):
            issue("external_link", f'Link "{href}" is not an internal link.')
            continue
        path = parts.path.rstrip("/") or "/"
        if path in rules.allowed_paths:
            internal_links += 1
        elif path.startswith("/blog/") and path[len("/blog/"):] in rules.published_blog_slugs:
            internal_links += 1
        else:
            issue("unknown_link", f'Link "{href}" does not point to an allowed page.')
    if internal_links == 0:
        issue("no_internal_link", "Article must link to at least one allowed internal page (a free tool or service).")

    for other in rules.existing_titles:
        sim = title_similarity(title or "", other)
        if sim >= DUPLICATE_TITLE_SIMILARITY:
            issue("near_duplicate", f'Title is too similar to existing post "{other}" ({sim:.0%} word overlap).')

    return QualityReport(
        passed=not issues,
        issues=issues,
        stats={"words": word_count, "faqs": len(complete_faqs), "internal_links": internal_links},
    )
