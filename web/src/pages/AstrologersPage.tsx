import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AstrologerList from '../components/AstrologerList';
import SEO from '../components/SEO';

const astrologersStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'CollectionPage',
            '@id': 'https://aadikarta.org/astrologers#page',
            name: 'Expert Astrologers Online — Aadikarta',
            url: 'https://aadikarta.org/astrologers',
            description: 'Browse 500+ verified Vedic astrologers, tarot readers, and numerologists for live chat consultations starting from ₹10/min.',
            publisher: { '@id': 'https://aadikarta.org/#organization' },
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
            name: 'Astrology Services on Aadikarta',
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
};

const AstrologersPage: React.FC = () => {
    return (
        <div className="astrologers-page pb-20 md:pb-0">
            <SEO
                title="Chat with Expert Astrologers Online | Vedic & Tarot"
                description="Browse 500+ verified astrologers. Live chat for Vedic astrology, kundli matching, tarot & career guidance. Starting from ₹10/min."
                structuredData={astrologersStructuredData}
            />
            <Header />
            <main id="main-content">
                <div className="page-content" style={{ minHeight: '60vh' }}>
                    <AstrologerList />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AstrologersPage;
