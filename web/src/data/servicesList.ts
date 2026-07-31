export interface ServiceLink {
    title: string;
    to: string;
}

// Single source of truth for "all services" links — used by the homepage
// ServicesGrid and the Header "Services" nav dropdown, so both stay in sync.
export const SERVICES_LIST: ServiceLink[] = [
    { title: 'Free Kundli', to: '/kundli' },
    { title: 'Kundli Matching', to: '/kundli/matching' },
    { title: 'Daily Horoscope', to: '/services/horoscope' },
    { title: 'Tarot Reading', to: '/services/tarot-reading' },
    { title: 'Vastu Shastra', to: '/services/vastu-shastra' },
    { title: 'Love Advice', to: '/services/love-advice' },
    { title: 'Daily Panchang', to: '/panchang' },
    { title: 'Shubh Muhurat', to: '/kundli/muhurat' },
    { title: 'Vedic Astrology', to: '/services/vedic-astrology' },
    { title: 'Manglik Dosha Checker', to: '/tools/manglik-dosha-checker' },
    { title: 'Navamsa (D9) Chart', to: '/tools/navamsa-chart' },
    { title: 'Numerology Calculator', to: '/tools/numerology-calculator' },
];
