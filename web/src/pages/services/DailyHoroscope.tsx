import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { Sun, Sparkles, ShieldAlert, Eye, Compass, Heart } from 'lucide-react';
import './ServicesDetail.css';

const horoscopeStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/daily-horoscope#service',
            name: 'Daily Horoscope Consultation',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Personalized daily horoscope readings from expert astrologers covering love, career, health, and finance predictions for all 12 zodiac signs. Live chat sessions starting from ₹10/min.',
            areaServed: 'IN',
            offers: { '@type': 'Offer', priceCurrency: 'INR', price: '10', priceSpecification: { '@type': 'UnitPriceSpecification', price: '10', priceCurrency: 'INR', unitText: 'per minute' } },
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'What is the difference between a sun sign and moon sign horoscope?', acceptedAnswer: { '@type': 'Answer', text: 'Sun sign horoscopes are based on your birth date (Western astrology). Moon sign horoscopes (Vedic/Indian) use the lunar sign, which many Vedic astrologers consider more accurate for daily and monthly predictions.' } },
                { '@type': 'Question', name: 'How is a personalized horoscope different from a generic one?', acceptedAnswer: { '@type': 'Answer', text: 'A personalized horoscope is based on your exact birth date, time, and location, giving predictions tailored to your unique planetary positions. Generic sun-sign horoscopes apply to everyone born in the same month.' } },
                { '@type': 'Question', name: 'Which zodiac sign has the best horoscope today?', acceptedAnswer: { '@type': 'Answer', text: 'Daily planetary transits affect each sign differently. Rather than a "best" sign, each sign has favorable days based on its ruling planet\'s position. An astrologer can identify your power days each week.' } },
                { '@type': 'Question', name: 'How much does a daily horoscope consultation cost on Aadikarta?', acceptedAnswer: { '@type': 'Answer', text: 'Daily horoscope consultations on Aadikarta start from ₹10 per minute. A quick daily or weekly reading typically takes 10–15 minutes.' } },
            ],
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://aadikarta.org/astrologers' },
                { '@type': 'ListItem', position: 3, name: 'Daily Horoscope', item: 'https://aadikarta.org/services/daily-horoscope' },
            ],
        },
    ],
};

const ZODIAC_SIGNS = [
    { name: 'Aries', slug: 'aries', glyph: '🐏' },
    { name: 'Taurus', slug: 'taurus', glyph: '🐂' },
    { name: 'Gemini', slug: 'gemini', glyph: '👯' },
    { name: 'Cancer', slug: 'cancer', glyph: '🦀' },
    { name: 'Leo', slug: 'leo', glyph: '🦁' },
    { name: 'Virgo', slug: 'virgo', glyph: '👧' },
    { name: 'Libra', slug: 'libra', glyph: '⚖️' },
    { name: 'Scorpio', slug: 'scorpio', glyph: '🦂' },
    { name: 'Sagittarius', slug: 'sagittarius', glyph: '🏹' },
    { name: 'Capricorn', slug: 'capricorn', glyph: '🕷️' },
    { name: 'Aquarius', slug: 'aquarius', glyph: '🏺' },
    { name: 'Pisces', slug: 'pisces', glyph: '🐟' }
];

const DailyHoroscope: React.FC = () => {
    useEffect(() => {
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Today's Horoscope | Personalized Zodiac Predictions"
                description="Get today's horoscope for all 12 zodiac signs, plus personalized readings from expert astrologers — love, career, health & finance. From ₹10/min."
                structuredData={horoscopeStructuredData}
            />
            <Header />
            
            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 text-center overflow-hidden min-h-[460px] flex flex-col items-center justify-center">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <span className="text-amber-500 font-normal uppercase tracking-widest text-sm mb-3 block">Service Details</span>
                    <h1 className="text-4xl md:text-6xl font-normal text-white mb-6">Daily Horoscope</h1>
                    <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                        Align your actions with the cosmic rhythm every single day.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                {/* Intro Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" data-aos="fade-up">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="title-icon-wrapper"><Sun size={20} /></div>
                            <h2 className="text-2xl md:text-3xl font-normal text-white">What is a Daily Horoscope?</h2>
                        </div>
                        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                            <p>
                                A daily horoscope is a snapshot of the celestial landscape, mapping the <span className="font-normal text-amber-500">transits of planets</span> against your zodiac sign.
                            </p>
                            <p>
                                By understanding the Moon's transit and planetary alignments, you can better navigate emotional tides and choose the most auspicious moments for action.
                            </p>
                        </div>
                    </div>
                    
                    <div className="service-glass-panel p-8" data-aos="fade-left">
                        <h3 className="text-lg font-normal text-white mb-6 text-center">Quick Select Zodiac Sign</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                            {ZODIAC_SIGNS.map((sign, idx) => (
                                <Link 
                                    to={`/horoscope/${sign.slug}`}
                                    key={idx} 
                                    className="aspect-square bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 hover:border-amber-500/30 transition-all cursor-pointer shadow-md group p-2"
                                >
                                    <span className="text-3xl flex justify-center mb-2 group-hover:scale-110 transition-transform" role="img" aria-label={`${sign.name} icon`}>
                                        {sign.glyph}
                                    </span>
                                    <span className="text-[11px] text-gray-300 group-hover:text-amber-500 transition-colors font-normal">{sign.name}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why Read Section */}
                <section className="service-glass-panel p-10 md:p-16 relative overflow-hidden" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-normal text-white mb-12">Why Read Your Horoscope Daily?</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            {[
                                { icon: <Sparkles size={24} />, title: 'Clarity of Mind', desc: 'Start your day with an intentional focus, grounded in cosmic awareness.' },
                                { icon: <ShieldAlert size={24} />, title: 'Preparedness', desc: 'Identify potential pitfalls before they arise and navigate them with grace.' },
                                { icon: <Eye size={24} />, title: 'Opportunity', desc: 'Spot hidden lucky patches in your timeline for major moves.' }
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
                    <h2 className="text-3xl font-normal text-white mb-6">Expert Guidance at Your Fingertips</h2>
                    <div className="grid md:grid-cols-2 gap-8 text-left mt-12">
                        {[
                            { icon: <Compass size={24} />, title: 'Personalized Transits', desc: 'Go beyond general sun-sign astrology to see how planets move through your specific chart.' },
                            { icon: <Heart size={24} />, title: 'Remedial Tips', desc: 'Simple color, habit, and mantra recommendations to optimize your daily outcome.' }
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
                        Get Your Full Reading
                    </Link>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default DailyHoroscope;
