import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import PanchangSection from '../components/PanchangSection';
import ConnectExpertCTA from '../components/ConnectExpertCTA';
import './services/ServicesDetail.css';

const panchangStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'WebPage',
            '@id': 'https://aadikarta.org/panchang#webpage',
            name: "Today's Panchang & Hindu Almanac — Aadikarta Vedic Astrology",
            description: 'Real-time daily Panchang on Aadikarta Vedic Astrology — Tithi, Nakshatra, Yoga, Sunrise, Sunset and Rahu Kalam for your location.',
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'What is Panchang?', acceptedAnswer: { '@type': 'Answer', text: 'Panchang is the traditional Vedic almanac that describes five key elements of a day: Tithi (lunar day), Nakshatra (constellation), Yoga, Karana, and Vaara (weekday), used to determine auspicious timings.' } },
                { '@type': 'Question', name: "How is today's Panchang calculated on Aadikarta Vedic Astrology?", acceptedAnswer: { '@type': 'Answer', text: "Today's Panchang on Aadikarta Vedic Astrology is calculated using precise Vedic astronomical calculations for your detected location, including sunrise, sunset, and planetary positions." } },
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
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Today's Panchang & Hindu Almanac | Aadikarta Vedic Astrology"
                description="Real-time daily Panchang on Aadikarta Vedic Astrology — Tithi, Nakshatra, Yoga, Rahu Kalam & Abhijit Muhurat calculated with accurate Vedic astronomy."
                keywords="Aadikarta Vedic Astrology, today Panchang, daily Hindu calendar, today Tithi, Rahu Kalam today, Abhijit Muhurat Aadikarta"
                structuredData={panchangStructuredData}
            />
            <Header />

            <section className="panchang-section pt-32 pb-24 relative overflow-hidden bg-gradient-to-b from-[#0f0927] to-[#03010b]">
                <div className="absolute top-[20%] left-[-150px] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[20%] right-[-150px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto">
                        <PanchangSection />

                        <section className="mt-16 service-glass-panel p-8">
                            <h2 className="text-2xl font-normal text-white mb-4">Why Panchang Matters</h2>
                            <div className="space-y-3 text-gray-300 leading-relaxed">
                                <p>
                                    Panchang is the traditional Hindu almanac describing five elements of each day — Tithi, Nakshatra, Yoga, Karana, and Vaara — used for centuries to plan daily life around the sky's rhythms rather than just the calendar date.
                                </p>
                                <p>
                                    People check it before starting something important, scheduling a journey, or simply to know which hours (like Rahu Kalam) are best avoided today. It turns abstract planetary movement into practical, day-to-day guidance.
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </section>

            <ConnectExpertCTA
                variant="dark"
                text="Want today's Panchang interpreted for your specific birth chart? Talk to an expert astrologer."
            />

            <Footer />
        </div>
    );
};

export default Panchang;
