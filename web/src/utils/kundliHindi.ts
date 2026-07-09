/** Hindi (Devanagari) translations for the Kundli panel's English/Hindi toggle.
 * Keyed by the exact English string FreeAstroAPI returns, so lookups are a
 * plain object index — unmapped strings fall through to the English original. */

export type Lang = 'en' | 'hi';

/** `hi(map, key, lang)` — returns the Hindi translation when lang is 'hi' and a
 * mapping exists, otherwise returns the original English key untouched. */
export function hi(map: Record<string, string>, key: string | undefined | null, lang: Lang): string {
    if (!key) return '';
    if (lang !== 'hi') return key;
    return map[key] || key;
}

export const PLANET_NAME_HI: Record<string, string> = {
    Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध',
    Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु',
};

// Keyed by lowercase planet name, matching PLANET_SHORT/PLANET_COLORS keys in KundliChart.
export const PLANET_SHORT_HI: Record<string, string> = {
    sun: 'सू', moon: 'चं', mars: 'मं', mercury: 'बु',
    jupiter: 'गु', venus: 'शु', saturn: 'श', rahu: 'रा', ketu: 'के',
};

export const RASHI_HI: Record<string, string> = {
    Aries: 'मेष', Taurus: 'वृषभ', Gemini: 'मिथुन', Cancer: 'कर्क',
    Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चिक',
    Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};

// Shortened (2-3 char) forms for the tight space inside chart house cells.
export const RASHI_SHORT_HI: Record<string, string> = {
    Aries: 'मेष', Taurus: 'वृष', Gemini: 'मिथु', Cancer: 'कर्क',
    Leo: 'सिंह', Virgo: 'कन्या', Libra: 'तुला', Scorpio: 'वृश्चि',
    Sagittarius: 'धनु', Capricorn: 'मकर', Aquarius: 'कुंभ', Pisces: 'मीन',
};

export const NAKSHATRA_HI: Record<string, string> = {
    Ashwini: 'अश्विनी', Bharani: 'भरणी', Krittika: 'कृत्तिका', Rohini: 'रोहिणी',
    Mrigashira: 'मृगशिरा', Mrigashirsha: 'मृगशिरा', Ardra: 'आर्द्रा', Punarvasu: 'पुनर्वसु',
    Pushya: 'पुष्य', Ashlesha: 'आश्लेषा', Magha: 'मघा',
    'Purva Phalguni': 'पूर्व फाल्गुनी', 'Uttara Phalguni': 'उत्तर फाल्गुनी',
    Hasta: 'हस्त', Chitra: 'चित्रा', Swati: 'स्वाति', Vishakha: 'विशाखा',
    Anuradha: 'अनुराधा', Jyeshtha: 'ज्येष्ठा', Mula: 'मूल',
    'Purva Ashadha': 'पूर्वाषाढ़ा', 'Uttara Ashadha': 'उत्तराषाढ़ा',
    Shravana: 'श्रवण', Dhanishta: 'धनिष्ठा', Dhanishtha: 'धनिष्ठा',
    Shatabhisha: 'शतभिषा', 'Purva Bhadrapada': 'पूर्व भाद्रपद',
    'Uttara Bhadrapada': 'उत्तर भाद्रपद', Revati: 'रेवती',
};

export const TITHI_HI: Record<string, string> = {
    Pratipada: 'प्रतिपदा', Dwitiya: 'द्वितीया', Tritiya: 'तृतीया', Chaturthi: 'चतुर्थी',
    Panchami: 'पंचमी', Shashthi: 'षष्ठी', Saptami: 'सप्तमी', Ashtami: 'अष्टमी',
    Navami: 'नवमी', Dashami: 'दशमी', Ekadashi: 'एकादशी', Dwadashi: 'द्वादशी',
    Trayodashi: 'त्रयोदशी', Chaturdashi: 'चतुर्दशी', Purnima: 'पूर्णिमा', Amavasya: 'अमावस्या',
};

export const PANCHANG_YOGA_HI: Record<string, string> = {
    Vishkambha: 'विष्कम्भ', Priti: 'प्रीति', Ayushman: 'आयुष्मान', Saubhagya: 'सौभाग्य',
    Shobhana: 'शोभन', Atiganda: 'अतिगण्ड', Sukarma: 'सुकर्मा', Dhriti: 'धृति',
    Shula: 'शूल', Ganda: 'गण्ड', Vriddhi: 'वृद्धि', Vriddha: 'वृद्धि', Dhruva: 'ध्रुव',
    Vyaghata: 'व्याघात', Harshana: 'हर्षण', Vajra: 'वज्र', Siddhi: 'सिद्धि',
    Vyatipata: 'व्यतीपात', Variyana: 'वरीयान', Parigha: 'परिघ', Shiva: 'शिव',
    Siddha: 'सिद्ध', Sadhya: 'साध्य', Shubha: 'शुभ', Shukla: 'शुक्ल',
    Brahma: 'ब्रह्म', Indra: 'इन्द्र', Vaidhriti: 'वैधृति',
};

export const KARANA_HI: Record<string, string> = {
    Bava: 'बव', Balava: 'बालव', Kaulava: 'कौलव', Taitila: 'तैतिल', Gara: 'गर',
    Vanija: 'वणिज', Vishti: 'विष्टि', Shakuni: 'शकुनि', Chatushpada: 'चतुष्पद',
    Naga: 'नाग', Kimstughna: 'किंस्तुघ्न',
};

export const WEEKDAY_HI: Record<string, string> = {
    Sunday: 'रविवार', Monday: 'सोमवार', Tuesday: 'मंगलवार', Wednesday: 'बुधवार',
    Thursday: 'गुरुवार', Friday: 'शुक्रवार', Saturday: 'शनिवार',
};

export const PAKSHA_HI: Record<string, string> = {
    Krishna: 'कृष्ण', Shukla: 'शुक्ल',
};

export const LUNAR_MONTH_HI: Record<string, string> = {
    Chaitra: 'चैत्र', Vaishakha: 'वैशाख', Jyeshtha: 'ज्येष्ठ', Ashadha: 'आषाढ़',
    Shravana: 'श्रावण', Bhadrapada: 'भाद्रपद', Ashwina: 'आश्विन', Kartika: 'कार्तिक',
    Margashirsha: 'मार्गशीर्ष', Pausha: 'पौष', Magha: 'माघ', Phalguna: 'फाल्गुन',
};

// Keyed by the yoga's stable `id` field (from the API), not its display name,
// since a couple of names share words (e.g. "Raj Yoga" vs "Vipareeta Raj Yoga").
export const YOGA_NAME_HI: Record<string, string> = {
    manglik_dosha: 'मांगलिक दोष',
    kala_sarpa_yoga: 'काल सर्प योग',
    gajakesari_yoga: 'गजकेसरी योग',
    budha_aditya_yoga: 'बुध-आदित्य योग',
    chandra_mangala_yoga: 'चंद्र-मंगल योग',
    adhi_yoga: 'अधि योग',
    saraswati_yoga: 'सरस्वती योग',
    lakshmi_yoga: 'लक्ष्मी योग',
    ruchaka_yoga: 'रुचक योग',
    bhadra_yoga: 'भद्र योग',
    hamsa_yoga: 'हंस योग',
    malavya_yoga: 'मालव्य योग',
    sasa_yoga: 'शश योग',
    raj_yoga: 'राज योग',
    dharma_karmadhipati_yoga: 'धर्म-कर्माधिपति योग',
    dhana_yoga: 'धन योग',
    vipareeta_raj_yoga: 'विपरीत राज योग',
    neecha_bhanga_raja_yoga: 'नीच भंग राज योग',
};

export const YOGA_CATEGORY_HI: Record<string, string> = {
    Affliction: 'पीड़ा', 'Grace & Reputation': 'कृपा एवं प्रतिष्ठा', Intellect: 'बुद्धि',
    Wealth: 'धन', Power: 'शक्ति', Learning: 'विद्या', Fortune: 'भाग्य',
    'Panch Mahapurusha': 'पंच महापुरुष', Cancellation: 'भंग',
};

export const STRENGTH_HI: Record<string, string> = {
    Weak: 'कमज़ोर', Medium: 'मध्यम', Strong: 'प्रबल',
};

export const DASHA_LEVEL_HI: Record<string, string> = {
    Mahadasha: 'महादशा', Antardasha: 'अंतर्दशा', Pratyantardasha: 'प्रत्यंतर्दशा',
};

/** Static UI chrome (section headings, field labels, states) — not API data. */
export const UI_HI = {
    lagna: 'लग्न',
    lord: 'स्वामी',
    pada: 'पद',
    birthPanchang: 'जन्म पंचांग',
    vaara: 'वार',
    tithi: 'तिथि',
    nakshatra: 'नक्षत्र',
    yoga: 'योग',
    lunarMonth: 'चंद्र मास',
    sunrise: 'सूर्योदय',
    sunset: 'सूर्यास्त',
    rahuKalam: 'राहु काल',
    planetPositions: 'ग्रह स्थिति',
    planet: 'ग्रह',
    signHouse: 'राशि / भाव',
    house: 'भाव',
    retrogradeAbbr: 'व',
    houseDetails: 'भाव विवरण',
    vimshottariDasha: 'विंशोत्तरी दशा',
    yrsRemainingOf: (remaining: string, total: string) => `${total} वर्ष में से ${remaining} वर्ष शेष`,
    yogasAndDoshas: 'योग एवं दोष',
    activeOf: (active: number, total: number) => `${total} में से ${active} सक्रिय`,
    noActiveYogas: 'कोई सक्रिय योग या दोष नहीं मिला।',
    planetaryStrength: 'ग्रह बल',
    sarvashtakavarga: (points: number) => `सर्वाष्टकवर्ग: ${points} अंक`,
    rupas: (value: string, ratio: string) => `${value} रूपा (${ratio}x)`,
    generatingKundli: 'कुंडली बन रही है...',
    calculatingPositions: 'ग्रह स्थिति की गणना हो रही है...',
    failedToGenerate: 'कुंडली बनाने में विफल',
    noChartData: 'चार्ट डेटा उपलब्ध नहीं है',
    legendRetrograde: 'वक्री',
    legendCombust: 'अस्त',
    legendVargottama: 'वर्गोत्तम',
    legendExalted: 'उच्च',
    legendDebilitated: 'नीच',
    status: 'स्थिति',
};
