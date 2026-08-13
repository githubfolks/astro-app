import React from 'react';
import ComparisonPage from './ComparisonTemplate';

const AadikartaVsAstroyogi: React.FC = () => (
    <ComparisonPage
        competitorName="Astroyogi"
        competitorSlug="astroyogi"
        metaTitle="Aadikarta vs Astroyogi: Pricing & Features Compared"
        metaDescription="Compare Aadikarta and Astroyogi on pricing, astrologer verification, and AI chart features to choose your consultation platform."
        keywords="Aadikarta vs Astroyogi, Astroyogi alternative, astrology app comparison, cheap astrology consultation India"
        intro="Both platforms connect you with astrologers over live chat and call. Here's how the entry pricing, verification, and feature set actually compare."
        dataAsOf="August 2026"
        rows={[
            { label: 'Entry price', aadikarta: 'From ₹10/min', competitor: 'Per-astrologer pricing, shown on each profile' },
            { label: 'AI astrologer option', aadikarta: 'Yes — instant AI chat alongside human astrologers', competitor: 'Not a core offering' },
            { label: 'Astrologer verification', aadikarta: 'Verified profiles, live status shown', competitor: 'Verified profiles, established network (5,000+ astrologers)' },
            { label: 'Consultation types', aadikarta: 'Vedic astrology, kundli matching, tarot, vastu, daily horoscope', competitor: 'Vedic astrology, tarot, numerology, palmistry, and more' },
            { label: 'First-time offer', aadikarta: 'Low ₹10/min entry tier available immediately', competitor: 'Free first consultation commonly offered' },
        ]}
        differentiators={[
            { title: 'Instant AI Astrologer', desc: 'Get an immediate answer from Aadikarta\'s AI astrologer while you wait for or choose a human expert — no queue for a first read.' },
            { title: 'Transparent ₹10/min entry tier', desc: 'Budget-friendly consultations are available from the moment you sign up, with clearly tiered pricing as you move to senior astrologers.' },
            { title: 'Focused, fast experience', desc: 'A leaner platform built around live chat consultations, kundli matching, and daily horoscopes without a cluttered feature set.' },
            { title: 'India-first support', desc: 'Built and supported for the Indian market, with content and predictions aligned to Vedic (sidereal) astrology conventions.' },
        ]}
        faqs={[
            { question: 'Is Aadikarta cheaper than Astroyogi?', answer: 'Aadikarta offers a simple, transparent ₹10/min entry tier. Astroyogi\'s pricing is set per astrologer and shown on each profile, so it can vary more depending on who you choose.' },
            { question: 'Does Astroyogi have an AI astrologer like Aadikarta?', answer: 'AI-powered instant astrology chat is a core, dedicated feature on Aadikarta. It is not a primary offering on Astroyogi, which is built around its established human-astrologer network.' },
            { question: 'Which platform has more astrologers, Aadikarta or Astroyogi?', answer: 'Astroyogi has built a large, established astrologer network over many years. Aadikarta is a newer platform focused on a curated, verified roster plus its AI astrologer for instant answers.' },
            { question: 'Can I switch between Aadikarta and Astroyogi?', answer: 'Yes — there\'s no lock-in on either platform. Many users compare a reading across both before choosing where to continue.' },
        ]}
    />
);

export default AadikartaVsAstroyogi;
