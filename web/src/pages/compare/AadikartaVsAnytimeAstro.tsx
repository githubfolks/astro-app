import React from 'react';
import ComparisonPage from './ComparisonTemplate';

const AadikartaVsAnytimeAstro: React.FC = () => (
    <ComparisonPage
        competitorName="AnytimeAstro"
        competitorSlug="anytimeastro"
        metaTitle="Aadikarta vs AnytimeAstro: Pricing & Features Compared"
        metaDescription="Compare Aadikarta and AnytimeAstro on consultation rates, AI astrology tools, Kundli matching, and astrologer verification."
        keywords="Aadikarta vs AnytimeAstro, AnytimeAstro alternative, cheap online astrology chat India, best Vedic astrology app"
        intro="Both Aadikarta and AnytimeAstro offer live online chat consultations with Vedic astrologers. Here is how their pricing models, AI tools, and core feature sets compare."
        dataAsOf="August 2026"
        rows={[
            { label: 'Entry price', aadikarta: 'From ₹10/min transparent pricing', competitor: 'Varies from ₹15–₹150+/min depending on astrologer rating' },
            { label: 'AI Astrologer option', aadikarta: 'Yes — instant 24/7 AI chart analysis & Q&A', competitor: 'Not available (Human astrologers only)' },
            { label: 'Astrologer verification', aadikarta: 'Strict multi-stage background check & rating audit', competitor: 'Verified astrologers list' },
            { label: 'Free Kundli & Matching', aadikarta: '100% Free 36 Guna Milan & Janam Kundli Generator', competitor: 'Basic chart tools available' },
            { label: 'Subscription / Wallet', aadikarta: 'Pay-per-minute wallet (No hidden platform subscriptions)', competitor: 'Pay-per-minute wallet system' },
        ]}
        differentiators={[
            { title: 'Dedicated AI Astrologer (Ask Aadi)', desc: 'Get instant 24/7 answers to planetary queries and chart placements without waiting for an available astrologer queue.' },
            { title: 'Transparent ₹10/min entry tier', desc: 'Consult top-rated verified astrologers starting at ₹10/min without steep per-minute markups.' },
            { title: 'Native WhatsApp Share Integration', desc: 'Share your Kundli match score card directly to WhatsApp with family and partners in 1 click.' },
            { title: 'Clean, Ad-Free UI', desc: 'Built for speed and zero clutter so you can connect directly with verified experts or AI in seconds.' },
        ]}
        faqs={[
            { question: 'Is Aadikarta cheaper than AnytimeAstro?', answer: 'Yes, Aadikarta offers introductory consultations starting at ₹10/min with transparent pricing, whereas AnytimeAstro astrologer rates frequently range between ₹15 to ₹150+/min.' },
            { question: 'Does AnytimeAstro have an AI Astrologer?', answer: 'No, AnytimeAstro relies solely on human astrologer queues. Aadikarta provides a 24/7 instant AI Astrologer alongside human expert consultations.' },
            { question: 'Can I do Kundli Matching on Aadikarta for free?', answer: 'Yes, Aadikarta provides free 36 Guna Ashtakoota Kundli Matching with direct WhatsApp sharing features.' },
            { question: 'Which platform is better for quick astrology advice?', answer: 'Aadikarta is optimized for fast response times via its AI Astrologer and verified live astrologers, while AnytimeAstro offers a broad directory of astrologers.' },
        ]}
    />
);

export default AadikartaVsAnytimeAstro;
