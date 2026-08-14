export interface ServiceLink {
    title: string;
    to: string;
}

// Single source of truth for "all services" links — used by the homepage
// ServicesGrid and the Header "Services" nav dropdown, so both stay in sync.
// Seeker-facing services only. The Kundli report generators (/kundli,
// /kundli/matching) are astrologer tools for generating reports on behalf
// of seekers — see ASTROLOGER_TOOLS_LIST below.
export const SERVICES_LIST: ServiceLink[] = [
    // FREE SERVICES & TOOLS (Placed First for Low-Friction Entry)
    { title: 'Free AI Astrologer', to: '/ai-astrologer' },
    { title: 'Free Daily Horoscope', to: '/services/horoscope' },
    { title: 'Free Kundli Generator', to: '/tools/kundli-chart' },
    { title: 'Free Kundli Matching', to: '/tools/kundli-matching' },
    { title: 'Free Daily Panchang', to: '/panchang' },
    { title: 'Free Manglik Checker', to: '/tools/manglik-dosha-checker' },
    { title: 'Free Navamsa (D9) Chart', to: '/tools/navamsa-chart' },
    { title: 'Free Numerology Calculator', to: '/tools/numerology-calculator' },

    // AI INSTANT REPORTS (one-time paid, no login required)
    { title: 'AI Instant Reports', to: '/services/ai-instant-reports' },

    // PAID CONSULTATIONS
    { title: 'Vedic Astrology Consultation', to: '/services/vedic-astrology' },
    { title: 'Tarot Reading Consultation', to: '/services/tarot-reading' },
    { title: 'Vastu Shastra Consultation', to: '/services/vastu-shastra' },
    { title: 'Love Advice Consultation', to: '/services/love-advice' },
];

// Report-generator tools used by astrologers on behalf of their seekers.
// Shown only to logged-in Astrologer users, never in the public/seeker nav.
export const ASTROLOGER_TOOLS_LIST: ServiceLink[] = [
    { title: 'Kundli Generator', to: '/kundli' },
    { title: 'Kundli Matching', to: '/kundli/matching' },
    { title: 'Live Hora & Muhurat', to: '/muhurat' },
];
