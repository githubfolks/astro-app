import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';

const loveStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/love-advice#service',
            name: 'Love & Relationship Astrology',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Personalized love and relationship astrology consultations covering compatibility, marriage timing, breakup recovery, and finding your soulmate from expert Vedic and Western astrologers.',
            areaServed: 'IN',
            offers: { '@type': 'Offer', priceCurrency: 'INR', price: '10', priceSpecification: { '@type': 'UnitPriceSpecification', price: '10', priceCurrency: 'INR', unitText: 'per minute' } },
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'Can astrology predict when I will get married?', acceptedAnswer: { '@type': 'Answer', text: 'Yes, Vedic astrology uses the 7th house (house of marriage), its lord, and planetary periods (dashas) to predict marriage timing. Jupiter and Venus transits also play a key role.' } },
                { '@type': 'Question', name: 'Which zodiac signs are most compatible in love?', acceptedAnswer: { '@type': 'Answer', text: 'Generally, signs of the same element are highly compatible: Fire signs (Aries, Leo, Sagittarius), Earth signs (Taurus, Virgo, Capricorn), Air signs (Gemini, Libra, Aquarius), and Water signs (Cancer, Scorpio, Pisces).' } },
                { '@type': 'Question', name: 'Can an astrologer help fix my relationship problems?', acceptedAnswer: { '@type': 'Answer', text: 'An astrologer can identify planetary influences causing relationship stress, suggest remedies (gemstones, mantras, timing), and guide you on the best periods for reconciliation or moving forward.' } },
                { '@type': 'Question', name: 'How much does a love astrology consultation cost on Aadikarta?', acceptedAnswer: { '@type': 'Answer', text: 'Love astrology consultations on Aadikarta start from ₹10 per minute. Most relationship readings take 15–30 minutes.' } },
            ],
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://aadikarta.org/astrologers' },
                { '@type': 'ListItem', position: 3, name: 'Love Advice', item: 'https://aadikarta.org/services/love-advice' },
            ],
        },
    ],
};

const LoveAdvice: React.FC = () => {
    useEffect(() => {
        AOS.init({ duration: 1000, once: false, mirror: true });
    }, []);

    return (
        <div className="bg-rose-50/30 text-slate-900 leading-relaxed min-h-screen font-['Open Sans']">
            <SEO
                title="Love & Relationship Astrology | Expert Advice Online"
                description="Personalized love & relationship astrology consultations. Compatibility analysis, marriage timing & predictions from expert Vedic astrologers. From ₹10/min."
                structuredData={loveStructuredData}
            />
            <Header />
            {/* Hero Section */}
            <header className="spiritual-bg text-white py-24 px-6 text-center relative overflow-hidden min-h-[600px] flex flex-col items-center justify-center">
                <div className="max-w-4xl mx-auto relative z-10 pointer-events-none">
                    <div className="flex flex-col items-center justify-center">
                        <h1 className="text-5xl md:text-5xl mb-4 drop-shadow-2xl">Love & Relationships</h1>
                    </div>
                    <p className="text-xl text-rose-100 font-light max-w-2xl mx-auto mt-8">
                        Navigate the complexities of the heart with celestial insight and compassionate guidance.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-24">
                <section className="flex flex-col md:flex-row items-center gap-12" data-aos="fade-up">
                    <div className="md:w-1/2" data-aos="fade-right">
                        <h2 className="text-3xl font-bold text-rose-900 mb-6 flex items-center gap-3">
                            <span className="bg-rose-100 p-2 rounded-lg text-rose-600 animate-pulse">❤️</span>
                            What is Love Advice?
                        </h2>
                        <div className="space-y-4 text-slate-600 text-lg">
                            <p>
                                Love advice in astrology is the sacred practice of analyzing the <span className="font-semibold text-rose-700">7th House</span>, Venus, and Mars positions to understand your soul's romantic path.
                            </p>
                            <p>
                                Whether you are navigating a new romance or seeking to deepen a commitment, celestial guidance provides clarity that logic often cannot reach.
                            </p>
                        </div>
                    </div>
                    <div className="md:w-1/2 bg-white p-6 rounded-3xl shadow-xl shadow-rose-100/50 border border-rose-50 transition-all duration-400 hover:-translate-y-2 hover:shadow-2xl" data-aos="fade-left">
                        <div className="relative rounded-2xl overflow-hidden aspect-video bg-rose-50 flex items-center justify-center">
                            <span className="text-6xl animate-bounce">💖</span>
                            <div className="absolute inset-0 bg-gradient-to-t from-rose-900/20 to-transparent"></div>
                        </div>
                    </div>
                </section>

                <section className="bg-rose-900 rounded-[3rem] p-10 md:p-16 text-white overflow-hidden relative" data-aos="zoom-in">
                    <div className="absolute -left-20 -top-20 w-64 h-64 bg-rose-400/20 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-bold mb-10" data-aos="fade-down">The Benefits of Relationship Guidance</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                { emoji: '✨', title: 'Syncing Energies', desc: 'Align your personal vibrations with your partner for deeper emotional resonance.' },
                                { emoji: '🕊️', title: 'Conflict Resolution', desc: 'Understand root causes of friction through planetary aspect analysis.' },
                                { emoji: '⏳', title: 'Divine Timing', desc: 'Identify perfect moments for life-changing romantic decisions and commitments.' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 transition-all hover:bg-white/20" data-aos="fade-up" data-aos-delay={(idx + 1) * 100}>
                                    <div className="text-rose-300 text-3xl mb-4">{item.emoji}</div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-rose-100 font-light leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-6">Aadikarta: Compassion Meets Wisdom</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                        <div className="p-8 rounded-2xl bg-white border border-rose-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-right">
                            <h4 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Synastry Reports
                            </h4>
                            <p className="text-slate-600 font-light">Deep-dive comparison of two birth charts to map out emotional, intellectual, and physical compatibility zones.</p>
                        </div>
                        <div className="p-8 rounded-2xl bg-white border border-rose-100 transition-all hover:shadow-lg hover:-translate-y-1" data-aos="fade-left">
                            <h4 className="text-xl font-bold text-rose-900 mb-4 flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Venus Positioning
                            </h4>
                            <p className="text-slate-600 font-light">Understanding your love language and how to effectively communicate your needs to your significant other.</p>
                        </div>
                    </div>
                    <button className="mt-16 bg-rose-600 hover:bg-rose-700 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-rose-200 transition-all hover:scale-110 active:scale-95" data-aos="zoom-in">
                        Connect with Love Expert
                    </button>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default LoveAdvice;
