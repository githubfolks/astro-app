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

You will also be given the video's overall topic and this scene's specific focus. Multiple scenes in the same video often name the SAME graha or rashi (e.g. every scene in a Shani-transit video mentions Shani) — when that happens, keep that graha/rashi as the one central classical figure in every scene (per the iconography rules above), but let each scene's specific focus drive the SUPPORTING composition (setting, props, symbolic background) so scenes are visually distinct from each other, not repeats of the same generic backdrop. For example, across a multi-scene Shani-transit video: a career-focused scene shows Shani with workplace/professional visual cues in the background; a relationship-focused scene shows Shani with the 7th house wheel or a couple motif; a remedy-focused scene shows Shani alongside a havan/puja setup; a general/introductory scene can use the standard cosmic/karmic backdrop. Never default to the same shadowy-karmic-chains backdrop for every scene just because the same graha is named.

Not every scene names a specific rashi or graha — many describe life themes instead: career/profession, love and marriage, money and wealth, poverty and hardship, health, or remedies (puja, homa/havan, upay). For these, ground the imagery in authentic Indian culture, never generic Western stock-photo tropes:
- Career/profession: Indian professionals in culturally recognizable settings (a farmer in a mustard field, a doctor with a stethoscope in a modest clinic, a shopkeeper in a bazaar, a student with books and a diya) — not Western business-suit boardroom clichés.
- Love/marriage: a diya-lit mandap, a couple in traditional Indian wedding attire (sindoor, mangalsutra, sherwani, red bridal saree), marigold garlands and rose petals — not Western hearts, roses alone, or European wedding imagery.
- Money/wealth: gold coins, an overflowing kalash, Goddess Lakshmi's lotus-and-coin motifs, rangoli patterns, Indian currency — not piggy banks or dollar signs.
- Poverty/hardship: a modest thatched-roof home, an unlit diya, simple worn cotton clothing — depicted with dignity and respect, never caricature or mockery.
- Health: Ayurvedic elements (tulsi plant, neem, turmeric, a healer's hands) or a figure in a yogic meditation posture — not generic Western clinical/hospital imagery.
- Puja, homa/havan, and remedies (upay): a puja thali with flowers, kumkum and rice, a diya, incense smoke, a copper kalash, a Rudraksha mala, folded hands (namaste) before a home temple; for homa/havan specifically, a sacred fire pit (agni kund/havan kund) with rising smoke and ghee offerings.
- Stars, clouds, or cosmic scenes not tied to a specific graha: a Vedic-style star field or cloudscape with subtle mandala/yantra patterns, not a generic Western sci-fi galaxy.

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
- "An Indian farmer in a mustard field at golden hour, hands raised in gratitude toward the sky, warm amber and green tones, Vedic astrology prosperity theme, peaceful rural India setting, spiritual and hopeful mood, vertical composition."
- "Traditional Indian wedding mandap decorated with marigold garlands and diyas, bride and groom's hands with mehendi and sindoor visible, warm golden light, festive red and gold tones, auspicious and joyful mood, romantic Vedic astrology visualization."
- "Overflowing brass kalash pouring gold coins, surrounded by lotus flowers and soft golden light, Goddess Lakshmi's blessing symbols nearby, rich gold and red tones, prosperity and abundance theme, ornate Vedic art style."
- "A modest thatched-roof Indian home at dusk with a single unlit diya on the doorstep, humble and dignified mood, warm earthy tones, soft hopeful light on the horizon, respectful depiction of hardship, Vedic astrology theme."
- "Ayurvedic healer's hands holding fresh tulsi leaves and turmeric root, warm natural light, soft green and golden tones, healing and wellness aura, traditional Indian medicine theme, peaceful and restorative mood."
- "Person performing havan at a sacred fire pit, rising smoke and ghee offerings, folded hands in prayer, warm firelight glow, copper and saffron tones, sacred ritual atmosphere, traditional Vedic remedy visualization."

Respond with ONLY the image prompt text. No markdown, no quotes, no commentary."""

_UPSTREAM_ERROR = HTTPException(
    status_code=502,
    detail="Image prompt generation failed. Please try again.",
)


def generate_image_prompt(narration_hi: str, topic: str = "", scene_theme: str = "") -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=503, detail="Content Studio is unavailable. ANTHROPIC_API_KEY is not set.")

    user_lines = []
    if topic:
        user_lines.append(f"Video topic: {topic}")
    if scene_theme:
        user_lines.append(f"This scene's specific focus: {scene_theme}")
    user_lines.append(f"Scene narration (Hindi): {narration_hi}")

    body = {
        "model": os.getenv("ANTHROPIC_IMAGE_PROMPT_MODEL", DEFAULT_MODEL),
        "max_tokens": 200,
        "system": IMAGE_PROMPT_SYSTEM,
        "messages": [{"role": "user", "content": "\n".join(user_lines)}],
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
