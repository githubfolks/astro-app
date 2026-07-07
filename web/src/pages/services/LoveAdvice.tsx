import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { Heart, HeartHandshake, Flame, Activity, Sparkles, CheckCircle } from 'lucide-react';
import './ServicesDetail.css';

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
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Love & Relationship Astrology | Expert Advice Online"
                description="Personalized love & relationship astrology consultations. Compatibility analysis, marriage timing & predictions from expert Vedic astrologers. From ₹10/min."
                structuredData={loveStructuredData}
            />
            <Header />
            
            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 text-center overflow-hidden min-h-[460px] flex flex-col items-center justify-center">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <span className="text-amber-500 font-normal uppercase tracking-widest text-sm mb-3 block">Service Details</span>
                    <h1 className="text-4xl md:text-6xl font-normal text-white mb-6">Love & Relationships</h1>
                    <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                        Navigate the complexities of the heart with celestial insight and compassionate guidance.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                {/* Intro Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" data-aos="fade-up">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="title-icon-wrapper"><Heart size={20} /></div>
                            <h2 className="text-2xl md:text-3xl font-normal text-white">What is Love Advice?</h2>
                        </div>
                        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                            <p>
                                Love advice in astrology is the sacred practice of analyzing the <span className="font-normal text-amber-500">7th House</span>, Venus, and Mars positions to understand your soul's romantic path.
                            </p>
                            <p>
                                Whether you are navigating a new romance or seeking to deepen a commitment, celestial guidance provides clarity that logic often cannot reach.
                            </p>
                        </div>
                    </div>
                    
                    <div className="service-glass-panel p-8 flex items-center justify-center min-h-[250px]" data-aos="fade-left">
                        <div className="relative w-full text-center py-10">
                            <div className="floating-box inline-block mb-4 p-4 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20">
                                <Heart size={48} fill="currentColor" />
                            </div>
                            <h3 className="text-lg font-normal text-white mb-2">Sync Your Fates</h3>
                            <p className="text-gray-400 text-sm max-w-xs mx-auto">Explore planetary aspects that trigger romantic attachments and compatibility.</p>
                        </div>
                    </div>
                </section>

                {/* Benefits of Guidance */}
                <section className="service-glass-panel p-10 md:p-16 relative overflow-hidden" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-normal text-white mb-12">The Benefits of Relationship Guidance</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            {[
                                { icon: <Flame size={24} />, title: 'Syncing Energies', desc: 'Align your personal vibrations with your partner for deeper emotional resonance.' },
                                { icon: <HeartHandshake size={24} />, title: 'Conflict Resolution', desc: 'Understand root causes of friction through planetary aspect analysis.' },
                                { icon: <Activity size={24} />, title: 'Divine Timing', desc: 'Identify perfect moments for life-changing romantic decisions and commitments.' }
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
                    <h2 className="text-3xl font-normal text-white mb-6">Aadikarta: Compassion Meets Wisdom</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                        {[
                            { icon: <CheckCircle size={24} />, title: 'Synastry Reports', desc: 'Deep-dive comparison of two birth charts to map out emotional, intellectual, and physical compatibility zones.' },
                            { icon: <Sparkles size={24} />, title: 'Venus Positioning', desc: 'Understanding your love language and how to effectively communicate your needs to your significant other.' }
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
                        Connect with Love Expert
                    </Link>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default LoveAdvice;
