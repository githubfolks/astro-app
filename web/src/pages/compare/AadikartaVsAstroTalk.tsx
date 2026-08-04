import React from 'react';
import ComparisonPage from './ComparisonTemplate';

const AadikartaVsAstroTalk: React.FC = () => (
    <ComparisonPage
        competitorName="AstroTalk"
        competitorSlug="astrotalk"
        metaTitle="Aadikarta vs AstroTalk: Pricing & Features Compared | Aadikarta Vedic Astrology"
        metaDescription="Comparing Aadikarta and AstroTalk on pricing, astrologer verification, and features like AI astrology chat — see which fits your budget for your first consultation."
        keywords="Aadikarta vs AstroTalk, AstroTalk alternative, astrology app comparison, cheap astrology consultation India"
        intro="Both platforms connect you with astrologers over live chat. Here's how the entry pricing, verification, and feature set actually compare."
        dataAsOf="August 2026"
        rows={[
            { label: 'Entry price', aadikarta: 'From ₹10/min', competitor: 'From ₹10/min (varies widely by astrologer, up to ₹250+/min)' },
            { label: 'AI astrologer option', aadikarta: 'Yes — instant AI chat alongside human astrologers', competitor: 'Not a core offering' },
            { label: 'Astrologer verification', aadikarta: 'Verified profiles, live status shown', competitor: 'Verified profiles, large network (10,000+ astrologers)' },
            { label: 'Consultation types', aadikarta: 'Vedic astrology, kundli matching, tarot, vastu, daily horoscope', competitor: 'Vedic astrology, tarot, palmistry, numerology, and more' },
            { label: 'First-time offer', aadikarta: 'Low ₹10/min entry tier available immediately', competitor: 'Free first chat commonly offered' },
        ]}
        differentiators={[
            { title: 'Instant AI Astrologer', desc: 'Get an immediate answer from Aadikarta\'s AI astrologer while you wait for or choose a human expert — no queue for a first read.' },
            { title: 'Transparent ₹10/min entry tier', desc: 'Budget-friendly consultations are available from the moment you sign up, with clearly tiered pricing as you move to senior astrologers.' },
            { title: 'Focused, fast experience', desc: 'A leaner platform built around live chat consultations, kundli matching, and daily horoscopes without a cluttered feature set.' },
            { title: 'India-first support', desc: 'Built and supported for the Indian market, with content and predictions aligned to Vedic (sidereal) astrology conventions.' },
        ]}
        faqs={[
            { question: 'Is Aadikarta cheaper than AstroTalk?', answer: 'Both platforms offer entry-level consultations from around ₹10/min, though AstroTalk\'s per-astrologer pricing can range much higher (up to ₹250+/min) depending on experience. Aadikarta keeps its tiering simple and transparent.' },
            { question: 'Does AstroTalk have an AI astrologer like Aadikarta?', answer: 'AI-powered instant astrology chat is a core, dedicated feature on Aadikarta. It is not a primary offering on AstroTalk, which is built around its large human-astrologer network.' },
            { question: 'Which platform has more astrologers, Aadikarta or AstroTalk?', answer: 'AstroTalk has built one of the largest astrologer networks in India over several years. Aadikarta is a newer platform focused on a curated, verified roster plus its AI astrologer for instant answers.' },
            { question: 'Can I switch between Aadikarta and AstroTalk?', answer: 'Yes — there\'s no lock-in on either platform. Many users compare a reading across both before choosing where to continue.' },
        ]}
    />
);

export default AadikartaVsAstroTalk;
