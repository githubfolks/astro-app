"""Generates copy-paste-ready SEO copy for YouTube Shorts, Instagram Reels,
Facebook, X (Twitter), and LinkedIn from a piece of content's basic info
(topic, description, keywords, CTA link, price, language).

Pure text generation -- no publish API calls (unlike content_studio_social.py /
content_studio_youtube.py which post Content Studio's rendered videos directly).
Powered by the Groq API, same provider/model already used by content_studio_llm.py.
"""
import os
import re

import httpx
from fastapi import HTTPException

from .. import schemas_social_copy

GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions"
DEFAULT_MODEL = "llama-3.3-70b-versatile"

_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Social copy generation failed. Please try again.",
)

BRAND_PRIMER = (
    "You are a social media manager for Aadikarta, India's trusted marketplace for "
    "verified Vedic astrologers (aadikarta.org), writing SEO-optimized copy for a short "
    "vertical astrology video (Reel/Short) so it can be pasted directly into that "
    "platform's posting UI."
)


def _build_context(payload: schemas_social_copy.SocialCopyRequest) -> str:
    lines = [
        f"Topic: {payload.topic}",
        f"Description/script summary: {payload.description}",
        f"Target keyword(s): {payload.keywords}",
        f"CTA link: {payload.cta_link}",
        f"Language: {payload.language}",
    ]
    if payload.price:
        lines.append(f"Price: {payload.price}")
    return "\n".join(lines)


def _call_groq(system_prompt: str, user_content: str, max_tokens: int, temperature: float = 0.7) -> str:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Social Copy Generator is unavailable. GROQ_API_KEY is not set.")

    body = {
        "model": os.getenv("AI_ASTROLOGER_MODEL", DEFAULT_MODEL),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    try:
        response = httpx.post(
            GROQ_CHAT_URL,
            json=body,
            headers={"Authorization": f"Bearer {api_key}"},
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        print(f"Social Copy Generator: Groq request failed: {e}")
        raise _UPSTREAM_ERROR

    if response.status_code != 200:
        print(f"Social Copy Generator: Groq error {response.status_code}: {response.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        reply = (response.json()["choices"][0]["message"]["content"] or "").strip()
    except (KeyError, IndexError, ValueError) as e:
        print(f"Social Copy Generator: unexpected Groq response shape: {e}")
        raise _UPSTREAM_ERROR

    if not reply:
        raise _UPSTREAM_ERROR

    if reply.startswith("```"):
        reply = re.sub(r"^```[a-zA-Z]*\n", "", reply)
        reply = re.sub(r"\n```$", "", reply)

    return reply


def _parse_sentinel_sections(reply: str, section_names: list[str]) -> dict:
    """Splits a reply on ===NAME=== markers. Raises if any section is missing/empty."""
    pattern = r"===(" + "|".join(section_names) + r")===\s*"
    parts = re.split(pattern, reply)
    # re.split with a capturing group returns [pre, name1, body1, name2, body2, ...]
    sections = {}
    for i in range(1, len(parts) - 1, 2):
        name = parts[i].strip().lower()
        body = parts[i + 1].strip()
        sections[name] = body

    for name in section_names:
        key = name.lower()
        if not sections.get(key):
            print(f"Social Copy Generator: missing/empty section '{name}' in reply: {reply[:500]}")
            raise _UPSTREAM_ERROR

    return sections


def _parse_tags_sentinel(reply: str) -> dict:
    match = re.search(r"\n?TAGS:\s*(.+)\s*$", reply, re.IGNORECASE | re.DOTALL)
    if match:
        text = reply[:match.start()].strip()
        tags = match.group(1).strip()
    else:
        text, tags = reply, ""
    if not text or not tags:
        print(f"Social Copy Generator: malformed TAGS: reply: {reply[:500]}")
        raise _UPSTREAM_ERROR
    return {"text": text, "tags": tags}


def _warn_hashtag_count(platform: str, hashtags: str, min_count: int, max_count: int) -> None:
    count = len([h for h in hashtags.split() if h.startswith("#")])
    if not (min_count <= count <= max_count):
        print(f"Social Copy Generator: {platform} hashtag count {count} outside expected {min_count}-{max_count}: {hashtags}")


YOUTUBE_SYSTEM_PROMPT = (
    BRAND_PRIMER + " Write copy for a YOUTUBE SHORT following these rules exactly:\n\n"
    "TITLE: Front-load a real, specific keyword drawn from the given target keyword(s) "
    "(e.g. 'Vedic Astrologer', 'Kundli', 'Online Astrology') within the first few words. "
    "Do not lead with generic clickbait phrasing that has no keyword in it. Keep it under 90 characters.\n\n"
    "DESCRIPTION: The first line must combine the emotional hook AND a conversion phrase together in one line "
    "(never as separate lines) -- state the CTA, the link, and the price (if given) within this first line or "
    "the very next line, never buried further down. After that, include 3-5 relevant hashtags on their own line.\n\n"
    "HASHTAGS: Exactly 3 to 5 hashtags, space-separated, no duplicates: one platform tag (#shorts), one to two "
    "niche/topic tags drawn from the topic/keywords, one conversion-intent tag (#onlineastrologer or "
    "#astrologyconsultation), one brand tag (#aadikarta). Never include generic viral filler tags like #fyp, "
    "#explore, #foryou, #viral, or #facts.\n\n"
    "VIDEO_TAGS: 8-12 multi-word, business-intent search phrases (NOT hashtags -- no # symbol), written as plain "
    "comma-separated phrases someone would actually search, tailored to the given topic/keywords (e.g. 'online "
    "astrologer chat', 'astrology consultation online', 'talk to astrologer online', 'free kundli reading' -- "
    "don't reuse these verbatim, generate ones specific to the topic).\n\n"
    "PINNED_COMMENT: One short line: a call-to-action plus the link.\n\n"
    "Respond with ONLY the following, in this exact order, each field's content on the line(s) immediately after "
    "its marker, nothing else before or after:\n"
    "===TITLE===\n<title>\n"
    "===DESCRIPTION===\n<description with hashtags>\n"
    "===HASHTAGS===\n<3-5 hashtags>\n"
    "===VIDEO_TAGS===\n<8-12 comma-separated phrases>\n"
    "===PINNED_COMMENT===\n<pinned comment>"
)


def generate_youtube_copy(payload: schemas_social_copy.SocialCopyRequest) -> dict:
    reply = _call_groq(YOUTUBE_SYSTEM_PROMPT, _build_context(payload), max_tokens=600)
    sections = _parse_sentinel_sections(reply, ["TITLE", "DESCRIPTION", "HASHTAGS", "VIDEO_TAGS", "PINNED_COMMENT"])
    _warn_hashtag_count("YouTube", sections["hashtags"], 3, 5)
    return {
        "title": sections["title"],
        "description": sections["description"],
        "hashtags": sections["hashtags"],
        "video_tags": sections["video_tags"],
        "pinned_comment": sections["pinned_comment"],
    }


INSTAGRAM_SYSTEM_PROMPT = (
    BRAND_PRIMER + " Write copy for an INSTAGRAM REEL following these rules exactly:\n\n"
    "CAPTION: Put the hook plus the target keyword within the first 1-2 lines (before where Instagram truncates "
    "with '...more'), written as natural sentences -- never a keyword dump -- with the CTA and link appearing "
    "near the top, not at the end. Then include 3-5 relevant hashtags naturally at the end of this SAME caption "
    "text (Instagram hashtags belong in the caption itself).\n\n"
    "HASHTAGS: The same 3-5 hashtags used in the caption, repeated here on their own for convenience/editing: a "
    "mix of one broad tag, one niche tag, one branded tag (#aadikarta), one conversion-intent tag.\n\n"
    "ALT_TEXT: A real, keyword-rich plain-English description of what the video visually shows, written for "
    "Instagram's Accessibility > Alt Text field -- descriptive, not a caption rehash, no hashtags.\n\n"
    "COVER_TEXT: A short, punchy line under 6 words suitable for the custom cover-frame text overlay.\n\n"
    "PINNED_COMMENT: One short line: a call-to-action plus the link.\n\n"
    "Respond with ONLY the following, in this exact order, each field's content on the line(s) immediately after "
    "its marker, nothing else before or after:\n"
    "===CAPTION===\n<caption with hashtags inline>\n"
    "===HASHTAGS===\n<the same 3-5 hashtags>\n"
    "===ALT_TEXT===\n<alt text>\n"
    "===COVER_TEXT===\n<cover text>\n"
    "===PINNED_COMMENT===\n<pinned comment>"
)


def generate_instagram_copy(payload: schemas_social_copy.SocialCopyRequest) -> dict:
    reply = _call_groq(INSTAGRAM_SYSTEM_PROMPT, _build_context(payload), max_tokens=600)
    sections = _parse_sentinel_sections(reply, ["CAPTION", "HASHTAGS", "ALT_TEXT", "COVER_TEXT", "PINNED_COMMENT"])
    _warn_hashtag_count("Instagram", sections["hashtags"], 3, 5)
    return {
        "caption": sections["caption"],
        "hashtags": sections["hashtags"],
        "alt_text": sections["alt_text"],
        "cover_text": sections["cover_text"],
        "pinned_comment": sections["pinned_comment"],
    }


TWO_FIELD_SYSTEM_PROMPTS = {
    "facebook": (
        BRAND_PRIMER + " Write a FACEBOOK post promoting the video: a slightly longer, narrative caption (line "
        "breaks are fine), natural tone, with the hook up top and the CTA/link stated clearly. Do not include "
        "hashtags in the post body. After the post body, on a new line, write 'TAGS:' followed by 1-3 relevant "
        "hashtags, EACH starting with a '#' character (space-separated, single line)."
    ),
    "twitter": (
        BRAND_PRIMER + " Write a concise post for X (Twitter), under 280 characters total (hard constraint -- "
        "count carefully), hook-first, with the CTA/link included. Do not include hashtags in the post body. "
        "After the post body, on a new line, write 'TAGS:' followed by exactly 1-2 relevant hashtags, EACH "
        "starting with a '#' character (space-separated, single line)."
    ),
    "linkedin": (
        BRAND_PRIMER + " Write a professional, thought-leadership style LinkedIn post: a short hook line, 2-4 "
        "short paragraphs or bullet points, and a closing line inviting engagement, with the CTA/link included "
        "naturally. Do not include hashtags in the post body. After the post body, on a new line, write 'TAGS:' "
        "followed by 3-5 professional-register hashtags, EACH starting with a '#' character (space-separated, "
        "single line, e.g. #VedicAstrology #AstrologyConsultation #Kundli -- not casual/meme-style tags)."
    ),
}

_HASHTAG_RANGES = {"facebook": (1, 3), "twitter": (1, 2), "linkedin": (3, 5)}


def _generate_two_field_copy(platform: str, payload: schemas_social_copy.SocialCopyRequest) -> dict:
    max_tokens = {"facebook": 350, "twitter": 150, "linkedin": 400}[platform]
    reply = _call_groq(TWO_FIELD_SYSTEM_PROMPTS[platform], _build_context(payload), max_tokens=max_tokens)
    parsed = _parse_tags_sentinel(reply)
    min_count, max_count = _HASHTAG_RANGES[platform]
    _warn_hashtag_count(platform, parsed["tags"], min_count, max_count)
    return {"text": parsed["text"], "hashtags": parsed["tags"]}


def generate_facebook_copy(payload: schemas_social_copy.SocialCopyRequest) -> dict:
    return _generate_two_field_copy("facebook", payload)


def generate_twitter_copy(payload: schemas_social_copy.SocialCopyRequest) -> dict:
    return _generate_two_field_copy("twitter", payload)


def generate_linkedin_copy(payload: schemas_social_copy.SocialCopyRequest) -> dict:
    return _generate_two_field_copy("linkedin", payload)
