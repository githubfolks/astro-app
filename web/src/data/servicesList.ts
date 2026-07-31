export interface ServiceLink {
    title: string;
    to: string;
}

// Single source of truth for "all services" links — used by the homepage
// ServicesGrid and the Header "Services" nav dropdown, so both stay in sync.
// Seeker-facing services only. The Kundli report generators (/kundli,
// /kundli/matching, /kundli/muhurat) are astrologer tools for generating
// reports on behalf of seekers — see ASTROLOGER_TOOLS_LIST below.
export const SERVICES_LIST: ServiceLink[] = [
    { title: 'Daily Horoscope', to: '/services/horoscope' },
    { title: 'Tarot Reading', to: '/services/tarot-reading' },
    { title: 'Vastu Shastra', to: '/services/vastu-shastra' },
    { title: 'Love Advice', to: '/services/love-advice' },
    { title: 'Daily Panchang', to: '/panchang' },
    { title: 'Vedic Astrology', to: '/services/vedic-astrology' },
    { title: 'Manglik Dosha Checker', to: '/tools/manglik-dosha-checker' },
    { title: 'Navamsa (D9) Chart', to: '/tools/navamsa-chart' },
    { title: 'Numerology Calculator', to: '/tools/numerology-calculator' },
];

// Report-generator tools used by astrologers on behalf of their seekers.
// Shown only to logged-in Astrologer users, never in the public/seeker nav.
export const ASTROLOGER_TOOLS_LIST: ServiceLink[] = [
    { title: 'Kundli Generator', to: '/kundli' },
    { title: 'Kundli Matching', to: '/kundli/matching' },
    { title: 'Muhurat Search', to: '/kundli/muhurat' },
];
