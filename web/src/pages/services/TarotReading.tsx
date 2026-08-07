import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageHeading from '../../components/PageHeading';
import SEO from '../../components/SEO';
import FAQSection from '../../components/FAQSection';
import { Sparkles, Layers, Eye, Compass, Clock } from 'lucide-react';
import './ServicesDetail.css';

const faqs = [
    { question: 'How accurate is tarot card reading?', answer: 'Tarot accuracy depends on the reader\'s intuition, experience, and the clarity of the question asked. Skilled readers use the cards as a tool for insight and reflection, not literal prediction.' },
    { question: 'What questions can I ask in a tarot reading?', answer: 'You can ask about love, relationships, career, finances, health, decisions, and personal growth. Open-ended questions like "What do I need to know about X?" tend to yield the most insightful readings.' },
    { question: 'Is online tarot reading as accurate as in-person?', answer: 'Yes, online tarot readings can be just as accurate as in-person sessions. The energy and intention of the question, not physical proximity, are what matter to experienced tarot readers.' },
    { question: 'How much does a tarot reading cost on Aadikarta Vedic Astrology?', answer: 'Tarot readings on Aadikarta Vedic Astrology start from ₹10 per minute. A standard 3-card reading session takes about 10–15 minutes; a full Celtic Cross spread typically runs 30–45 minutes.' },
];

const tarotStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/tarot-reading#service',
            name: 'Online Tarot Card Reading on Aadikarta Vedic Astrology',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Accurate online tarot card readings from expert tarot readers on Aadikarta Vedic Astrology. Past, present, and future readings covering love, career, finances, and life guidance.',
            areaServed: 'IN',
            offers: { '@type': 'Offer', priceCurrency: 'INR', price: '10', priceSpecification: { '@type': 'UnitPriceSpecification', price: '10', priceCurrency: 'INR', unitText: 'per minute' } },
        },
        {
            '@type': 'FAQPage',
            mainEntity: faqs.map(faq => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer }
            }))
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://aadikarta.org/astrologers' },
                { '@type': 'ListItem', position: 3, name: 'Tarot Reading', item: 'https://aadikarta.org/services/tarot-reading' },
            ],
        },
    ],
};

const TarotReading: React.FC = () => {
    useEffect(() => {
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Online Tarot Card Reading | Expert Tarot Readers | Aadikarta Vedic Astrology"
                description="Accurate online tarot readings on Aadikarta Vedic Astrology from expert readers. Guidance on love, career & life from ₹10/min."
                keywords="Aadikarta Vedic Astrology, online tarot reading, tarot card reading Aadikarta, love tarot reading, talk to tarot reader"
                structuredData={tarotStructuredData}
            />
            <Header />
            
            {/* Hero Section */}
            <header className="relative pt-16 pb-12 px-6 text-center overflow-hidden">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <PageHeading
                        eyebrow="Service Details"
                        title="Tarot Reading"
                        subtitle="Unlock the subconscious through the symbolic language of the divine deck."
                    />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                {/* Intro Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" data-aos="fade-up">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="title-icon-wrapper"><Layers size={20} /></div>
                            <h2 className="text-2xl md:text-3xl font-normal text-white">What is Tarot Reading?</h2>
                        </div>
                        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                            <p>
                                Tarot is a symbolic language spoken through a deck of 78 cards, used to mirror your subconscious mind and reveal hidden truths.
                            </p>
                            <p>
                                Whether you seek answers about love or career, the Major and Minor Arcana act as celestial archetypes that guide you toward clarity.
                            </p>
                        </div>
                    </div>
                    
                    <div className="service-glass-panel p-8 flex items-center justify-center min-h-[250px]" data-aos="fade-left">
                        <div className="flex gap-4 items-center justify-center w-full">
                            <div className="w-16 h-28 bg-white/5 border border-white/10 rounded-xl animate-bounce hover:border-amber-500/30 transition-colors shadow-md flex items-center justify-center text-2xl" style={{ animationDelay: '0.1s' }}>🌙</div>
                            <div className="w-18 h-32 bg-amber-500/10 border border-amber-500/30 rounded-xl animate-bounce hover:border-amber-500 transition-colors shadow-lg flex items-center justify-center text-4xl" style={{ animationDelay: '0.2s' }}>⭐</div>
                            <div className="w-16 h-28 bg-white/5 border border-white/10 rounded-xl animate-bounce hover:border-amber-500/30 transition-colors shadow-md flex items-center justify-center text-2xl" style={{ animationDelay: '0.3s' }}>☀️</div>
                        </div>
                    </div>
                </section>

                {/* Path to Mystical Clarity */}
                <section className="service-glass-panel p-10 md:p-16 relative overflow-hidden" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-normal text-white mb-12">The Path to Mystical Clarity</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            {[
                                { icon: <Eye size={24} />, title: 'Intuitive Insights', desc: 'Go beyond the surface to understand underlying motivations and unseen obstacles.' },
                                { icon: <Compass size={24} />, title: 'Future Pathways', desc: 'Map out potential outcomes based on your current energy and decisions.' },
                                { icon: <Sparkles size={24} />, title: 'Spiritual Growth', desc: 'Identify karmic lessons and spiritual milestones on your soul\'s journey.' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/15">
                                    <div className="text-amber-500 mb-4">{item.icon}</div>
                                    <h3 className="text-xl font-normal text-white mb-3">{item.title}</h3>
                                    <p className="text-gray-300 font-light leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features list */}
                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl font-normal text-white mb-6">Expert Tarot Interpretations</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                        {[
                            { icon: <Layers size={24} />, title: 'Celtic Cross Spreads', desc: 'Comprehensive 10-card analysis for deep life questions and situational audits.' },
                            { icon: <Clock size={24} />, title: 'One-on-One Sessions', desc: 'Direct interaction with intuitive readers to explore specific concerns in real-time.' }
                        ].map((item, idx) => (
                            <div key={idx} className="custom-list-item">
                                <div className="icon-box">{item.icon}</div>
                                <div>
                                    <h4 className="text-xl font-normal text-white mb-2">{item.title}</h4>
                                    <p className="text-gray-300 font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link to="/astrologers" className="inline-block mt-16 bg-amber-500 text-indigo-950 px-12 py-4 rounded-full font-normal text-lg shadow-xl shadow-amber-500/10 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all">
                        Start Your Reading
                    </Link>
                </section>

                <FAQSection faqs={faqs} />
            </main>
            <Footer />
        </div>
    );
};

export default TarotReading;
