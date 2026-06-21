import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

const tarotStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/tarot-reading#service',
            name: 'Online Tarot Card Reading',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Accurate online tarot card readings from expert tarot readers. Past, present, and future readings covering love, career, finances, and life guidance. Live chat sessions from ₹10/min.',
            areaServed: 'IN',
            offers: { '@type': 'Offer', priceCurrency: 'INR', price: '10', priceSpecification: { '@type': 'UnitPriceSpecification', price: '10', priceCurrency: 'INR', unitText: 'per minute' } },
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'How accurate is tarot card reading?', acceptedAnswer: { '@type': 'Answer', text: 'Tarot accuracy depends on the reader\'s intuition, experience, and the clarity of the question asked. Skilled readers use the cards as a tool for insight and reflection, not literal prediction.' } },
                { '@type': 'Question', name: 'What questions can I ask in a tarot reading?', acceptedAnswer: { '@type': 'Answer', text: 'You can ask about love, relationships, career, finances, health, decisions, and personal growth. Open-ended questions like "What do I need to know about X?" tend to yield the most insightful readings.' } },
                { '@type': 'Question', name: 'Is online tarot reading as accurate as in-person?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, online tarot readings can be just as accurate as in-person sessions. The energy and intention of the question, not physical proximity, are what matter to experienced tarot readers.' } },
                { '@type': 'Question', name: 'How much does a tarot reading cost on Aadikarta?', acceptedAnswer: { '@type': 'Answer', text: 'Tarot readings on Aadikarta start from ₹10 per minute. A standard 3-card reading session takes about 10–15 minutes; a full Celtic Cross spread typically runs 30–45 minutes.' } },
            ],
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
        <div className="bg-purple-50/30 text-slate-900 leading-relaxed min-h-screen font-['Open Sans']">
            <SEO
                title="Online Tarot Card Reading | Expert Tarot Readers"
                description="Accurate online tarot readings from expert readers. Past, present & future guidance on love, career & life. Live chat sessions from ₹10/min."
                structuredData={tarotStructuredData}
            />
            <Header />
            {/* Hero Section */}
            <header className="celestial-bg text-white py-24 px-6 text-center relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
                <div className="max-w-4xl mx-auto relative z-10 pointer-events-none">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-5xl md:text-5xl mb-4 drop-shadow-2xl">Tarot Reading</h1>
                    </div>
                    <p className="text-xl text-purple-100 font-light max-w-2xl mx-auto mt-8">
                        Unlock the subconscious through the symbolic language of the divine deck.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
                <section className="flex flex-col md:flex-row items-center gap-12" data-aos="fade-up">
                    <div className="md:w-1/2" data-aos="fade-right">
                        <h2 className="text-3xl font-bold text-indigo-900 mb-6 flex items-center gap-3">
                            <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600 animate-pulse">🃏</span>
                            What is Tarot Reading?
                        </h2>
                        <div className="space-y-4 text-slate-600 text-lg">
                            <p>
                                Tarot is a symbolic language spoken through a deck of 78 cards, used to mirror your subconscious mind and reveal hidden truths.
                            </p>
                            <p>
                                Whether you seek answers about love or career, the Major and Minor Arcana act as celestial archetypes that guide you toward clarity.
                            </p>
                        </div>
                    </div>
                    <div className="md:w-1/2 bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100/50 border border-indigo-50 transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl" data-aos="fade-left">
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-indigo-50 flex items-center justify-center gap-4">
                            <div className="w-16 h-24 bg-indigo-200 rounded-lg animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-16 h-24 bg-indigo-600 rounded-lg animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <div className="w-16 h-24 bg-indigo-200 rounded-lg animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                        </div>
                    </div>
                </section>

                <section className="bg-indigo-900 rounded-[3rem] p-10 md:p-16 text-white overflow-hidden relative" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-bold mb-10" data-aos="fade-down">The Path to Mystical Clarity</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            {[
                                { emoji: '👁️', title: 'Intuitive Insights', desc: 'Go beyond the surface to understand underlying motivations and unseen obstacles.' },
                                { emoji: '🔮', title: 'Future Pathways', desc: 'Map out potential outcomes based on your current energy and decisions.' },
                                { emoji: '🧘', title: 'Spiritual Growth', desc: 'Identify karmic lessons and spiritual milestones on your soul\'s journey.' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 transition-all hover:bg-white/10" data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
                                    <div className="text-purple-300 text-3xl mb-4">{item.emoji}</div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-indigo-100 font-light leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Expert Tarot Interpretations</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                        <div className="p-8 rounded-2xl bg-white border border-indigo-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-right">
                            <h4 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-3">🎴 Celtic Cross Spreads</h4>
                            <p className="text-slate-600 font-light">Comprehensive 10-card analysis for deep life questions and situational audits.</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white border border-indigo-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-left">
                            <h4 className="text-xl font-bold text-indigo-900 mb-4 flex items-center gap-3">🕯️ One-on-One Sessions</h4>
                            <p className="text-slate-600 font-light">Direct interaction with intuitive readers to explore specific concerns in real-time.</p>
                        </div>
                    </div>
                    <button className="mt-16 bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-indigo-200 transition-all hover:scale-110 active:scale-95" data-aos="zoom-in">
                        Start Your Reading
                    </button>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default TarotReading;
