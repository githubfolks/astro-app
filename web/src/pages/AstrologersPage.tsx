import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AstrologerList from '../components/AstrologerList';
import SEO from '../components/SEO';
import { api } from '../services/api';

const buildStructuredData = (trustStats: { total_reviews: number, average_rating: number } | null) => ({
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'CollectionPage',
            '@id': 'https://aadikarta.org/astrologers#page',
            name: 'Expert Astrologers Online — Aadikarta Vedic Astrology',
            url: 'https://aadikarta.org/astrologers',
            description: 'Browse verified Vedic astrologers, tarot readers, and numerologists on Aadikarta Vedic Astrology for live chat consultations starting from ₹10/min.',
            publisher: { '@id': 'https://aadikarta.org/#organization' },
            // Only emit aggregateRating when there are real platform reviews behind
            // it — Google's review-snippet policy requires this to reflect actual
            // reviews, never a placeholder number.
            ...(trustStats && trustStats.total_reviews > 0 ? {
                aggregateRating: {
                    '@type': 'AggregateRating',
                    ratingValue: trustStats.average_rating,
                    reviewCount: trustStats.total_reviews,
                    bestRating: '5',
                    worstRating: '1'
                }
            } : {}),
            breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                    { '@type': 'ListItem', position: 2, name: 'Astrologers', item: 'https://aadikarta.org/astrologers' },
                ],
            },
        },
        {
            '@type': 'ItemList',
            name: 'Astrology Services on Aadikarta Vedic Astrology',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Vedic Astrology', url: 'https://aadikarta.org/services/vedic-astrology' },
                { '@type': 'ListItem', position: 2, name: 'Kundli Matching', url: 'https://aadikarta.org/services/kundli-matching' },
                { '@type': 'ListItem', position: 3, name: 'Tarot Reading', url: 'https://aadikarta.org/services/tarot-reading' },
                { '@type': 'ListItem', position: 4, name: 'Love Advice', url: 'https://aadikarta.org/services/love-advice' },
                { '@type': 'ListItem', position: 5, name: 'Daily Horoscope', url: 'https://aadikarta.org/services/daily-horoscope' },
                { '@type': 'ListItem', position: 6, name: 'Vastu Shastra', url: 'https://aadikarta.org/services/vastu-shastra' },
            ],
        },
    ],
});

const AstrologersPage: React.FC = () => {
    const [trustStats, setTrustStats] = useState<{ total_reviews: number, average_rating: number } | null>(null);

    useEffect(() => {
        let cancelled = false;
        api.cms.getTrustStats()
            .then((data) => { if (!cancelled) setTrustStats(data); })
            .catch(() => { /* keep aggregateRating omitted rather than show placeholder numbers */ });
        return () => { cancelled = true; };
    }, []);

    return (
        <div className="astrologers-page pb-20 md:pb-0">
            <SEO
                title="Talk to Astrologers Online | Live Chat and Call | Aadikarta"
                description="Browse top verified astrologers on Aadikarta. Instant live chat for Vedic astrology, Kundli matching, tarot & career guidance from ₹10/min."
                keywords="Aadikarta Vedic Astrology, online astrologers, talk to astrologer Aadikarta, chat with Vedic astrologer, tarot readers online"
                structuredData={buildStructuredData(trustStats)}
            />
            <Header />
            <main id="main-content">
                <h1 className="sr-only">Talk to Verified Astrologers Online</h1>
                <div className="page-content" style={{ minHeight: '60vh' }}>
                    <AstrologerList />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AstrologersPage;
