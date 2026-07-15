import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PanchangSection from '../components/PanchangSection';

const panchangStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebPage',
            '@id': 'https://aadikarta.org/panchang#webpage',
            name: "Today's Panchang | Daily Vedic Almanac",
            description: 'Real-time daily Panchang — Tithi, Nakshatra, Yoga, Sunrise, Sunset and Rahu Kalam for your location.',
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'What is Panchang?', acceptedAnswer: { '@type': 'Answer', text: 'Panchang is the traditional Vedic almanac that describes five key elements of a day: Tithi (lunar day), Nakshatra (constellation), Yoga, Karana, and Vaara (weekday), used to determine auspicious timings.' } },
                { '@type': 'Question', name: "How is today's Panchang calculated?", acceptedAnswer: { '@type': 'Answer', text: "Today's Panchang is calculated using precise Vedic astronomical calculations for your detected location, including sunrise, sunset, and planetary positions." } },
            ],
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                { '@type': 'ListItem', position: 2, name: 'Panchang', item: 'https://aadikarta.org/panchang' },
            ],
        },
    ],
};

const Panchang: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#03010b]">
            <SEO
                title="Today's Panchang | Daily Vedic Almanac"
                description="Real-time daily Panchang for your location — Tithi, Nakshatra, Yoga, Sunrise, Sunset and Rahu Kalam, calculated using accurate Vedic astronomy."
                structuredData={panchangStructuredData}
            />
            <Header />

            <section className="panchang-section pt-32 pb-24 relative overflow-hidden bg-gradient-to-b from-[#0f0927] to-[#03010b]">
                <div className="absolute top-[20%] left-[-150px] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[20%] right-[-150px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <PanchangSection />
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default Panchang;
