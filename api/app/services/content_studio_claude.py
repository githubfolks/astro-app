"""Writes each scene's image_prompt_en via Claude (Anthropic Messages API).

Split out from Groq's scene-narration generation (content_studio_llm.py) --
Groq still writes the Hindi narration, Claude writes the matching image
prompt sent to Pollinations, using the exact same Vedic-iconography
instructions that previously lived inside Groq's combined prompt (moved
here verbatim, only the executing model changed).
"""
import os

import httpx
from fastapi import HTTPException

ANTHROPIC_MESSAGES_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
DEFAULT_MODEL = "claude-haiku-4-5-20251001"

IMAGE_PROMPT_SYSTEM = """You write English image-generation prompts for an AI image API, illustrating short Vedic astrology (Jyotish) videos for Aadikarta, India's trusted marketplace for verified Vedic astrologers.

Given one scene's Hindi narration, write a short English prompt (under 40 words) for an AI image generator, depicting the SPECIFIC rashi or graha named in that narration using its traditional Vedic iconography — not generic mystical imagery. ALL NINE NAVAGRAHA (Surya, Chandra, Mangal, Budha, Guru, Shukra, Shani, Rahu, Ketu) are traditionally male gods — there is no female graha. Always say "male Hindu god" or "god" explicitly (never the gender-neutral word "deity" alone), otherwise the image generator defaults to a feminine goddess look. Use the classical depiction by name, e.g.: Surya as a radiant male god on a chariot pulled by seven horses; Chandra as a serene male moon god holding a lotus; Mangal as a red four-armed male warrior god; Budha as a green-robed male god on a lion; Guru/Brihaspati as a golden-robed male sage holding a book/staff; Shukra as a male god on a lotus or chariot; Shani as a dark-hued male god on a crow or buffalo, holding a sword; Rahu/Ketu as serpent-bodied male figures. For rashi (zodiac signs), depict their classical symbol: Mesha (ram), Vrishabha (bull), Mithuna (twins), Karka (crab), Simha (lion), Kanya (maiden with grain), Tula (scales), Vrishchika (scorpion), Dhanu (archer centaur), Makara (crocodile/sea-creature), Kumbha (water-bearer), Meena (fish).
Depict only ONE central figure or symbol per image. If the scene's narration involves two grahas (e.g. one transiting another), pick the single most narratively active graha as the one full god figure, and represent the second one only through its symbolic object in the background (e.g. a crescent moon shape, a small ram symbol) — never as a second full competing figure. Image generators reliably merge two full figures into one confused hybrid, so keep every prompt to one clear subject. Composition should read clearly when center-cropped to a tall vertical frame. Do not include any text-in-image requests.

Match the level of detail and specificity in these example image prompts (write a new prompt tailored to the actual scene each time — only reuse one verbatim if it's a genuine exact match):
- "Intricate illustration of Scorpio zodiac symbol in center, surrounded by mystical purple-blue cosmic energy and glowing planets, Vedic astrology style, ornate Sanskrit patterns, gold and deep indigo color palette, high detail, spiritual and mysterious vibe, professional astrology artwork, symmetrical composition."
- "Vedic birth chart wheel with all 12 zodiac signs arranged in a circle, planets positioned authentically, intricate Sanskrit labels, ornate gold decorative elements, cosmic stars in background, professional astrology wheel, Vedic art style, warm gold and deep blue tones, detailed and symmetrical."
- "Two fish Pisces symbol surrounded by flowing water and cosmic energy, dreamy ethereal Vedic art, soft blues and purples, glowing moon and stars, spiritual mystical vibe, ornate celestial patterns, romantic and emotional mood."
- "Planet Mars glowing red and fiery, surrounded by cosmic warrior energy, Vedic astrology illustration, dynamic and powerful aura, red and gold tones, celestial patterns around it, Sanskrit symbols, intense and dynamic mood, vertical composition."
- "Planet Saturn with prominent rings, surrounded by karmic symbols and cosmic chains, dark blue and silver tones, Vedic art style, mystical and serious mood, ornate decorative elements, Saturn return astrology visualization, detailed and symbolic."
- "Moon and Jupiter planets together with divine blessing energy, soft silver and golden glow, celestial clouds, Sanskrit mantras, Vedic blessing symbols, spiritual and auspicious mood, cosmic light rays, peaceful and prosperous vibes."
- "Goddess Lakshmi seated in meditation posture, surrounded by golden coins and lotus flowers, divine golden light halo, ornate jewelry and saree, celestial background with planets, prosperity and wealth symbols, spiritual and auspicious."
- "Lord Shiva in cosmic dance (Nataraja pose) with blue skin, surrounded by fire and cosmic energy, third eye glowing, moon crescent on forehead, meditation and transformation vibes, spiritual power, gold and blue tones."
- "Goddess Saraswati holding veena, seated on white lotus, surrounded by books and knowledge symbols, celestial white light, Sanskrit mantras floating around, wisdom and learning aura, yellow and white divine colors."
- "Goddess Durga riding lion, multiple arms holding weapons, cosmic power and protection energy surrounding her, fierce and divine expression, golden ornaments and red saree, celestial stars background, triumph over darkness."
- "Sacred Om symbol in glowing golden Sanskrit script, surrounded by meditation light and cosmic energy, chakra symbols below, lotus petals, peaceful spiritual atmosphere, blue and gold color palette, celestial stars and moon background."
- "Complex Vedic birth chart (kundli) with 12 houses, planets in correct positions, Sanskrit labels, intricate geometric patterns, gold and jewel-tone colors, spiritual and precise, ornate border designs, detailed and symmetrical."
- "Sacred Rudraksha beads arranged in circular mala, glowing with divine protection energy, Sanskrit protection mantras around them, cosmic spiritual light, deep earth tones with golden highlights, chakra symbols, mystical and protective mood."
- "Two zodiac signs connected by glowing cosmic energy and heart light, surrounded by love and partnership symbols, celestial stars creating bridge between them, romantic mystical mood, deep purples and blues, spiritual connection visualization."

Respond with ONLY the image prompt text. No markdown, no quotes, no commentary."""

_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Image prompt generation failed. Please try again.",
)


def generate_image_prompt(narration_hi: str) -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Content Studio is unavailable. ANTHROPIC_API_KEY is not set.")

    body = {
        "model": os.getenv("ANTHROPIC_IMAGE_PROMPT_MODEL", DEFAULT_MODEL),
        "max_tokens": 200,
        "system": IMAGE_PROMPT_SYSTEM,
        "messages": [{"role": "user", "content": f"Scene narration (Hindi): {narration_hi}"}],
    }

    try:
        response = httpx.post(
            ANTHROPIC_MESSAGES_URL,
            json=body,
            headers={
                "x-api-key": api_key,
                "anthropic-version": ANTHROPIC_VERSION,
                "content-type": "application/json",
            },
            timeout=30.0,
        )
    except httpx.HTTPError as e:
        print(f"Content Studio image prompt (Claude): request failed: {e}")
        raise _UPSTREAM_ERROR

    if response.status_code != 200:
        print(f"Content Studio image prompt (Claude): error {response.status_code}: {response.text[:500]}")
        raise _UPSTREAM_ERROR

    try:
        text = response.json()["content"][0]["text"].strip()
    except (KeyError, IndexError, ValueError) as e:
        print(f"Content Studio image prompt (Claude): unexpected response shape: {e}")
        raise _UPSTREAM_ERROR

    if not text:
        raise _UPSTREAM_ERROR

    return text
