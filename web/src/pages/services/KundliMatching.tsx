import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SEO from '../../components/SEO';
import { HeartHandshake, Users, CheckCircle, Award, Sparkles, Activity } from 'lucide-react';
import './ServicesDetail.css';

const kundliStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/kundli-matching#service',
            name: 'Kundli Matching for Marriage',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Expert kundli matching (kundali milan) service for marriage using 36-gun Milan analysis, manglik dosha check, and detailed compatibility report from verified Vedic astrologers.',
            areaServed: 'IN',
            offers: { '@type': 'Offer', priceCurrency: 'INR', price: '10', priceSpecification: { '@type': 'UnitPriceSpecification', price: '10', priceCurrency: 'INR', unitText: 'per minute' } },
        },
        {
            '@type': 'FAQPage',
            mainEntity: [
                { '@type': 'Question', name: 'What is kundli matching?', acceptedAnswer: { '@type': 'Answer', text: 'Kundli matching (kundali milan) is a Vedic astrology practice where birth charts of a prospective bride and groom are compared using 36 gunas (qualities) to assess compatibility for marriage.' } },
                { '@type': 'Question', name: 'How many gunas are required for marriage?', acceptedAnswer: { '@type': 'Answer', text: 'Traditionally, a minimum of 18 out of 36 gunas are required for marriage. A score of 24–32 is considered good, and above 32 is excellent compatibility.' } },
                { '@type': 'Question', name: 'What is manglik dosha?', acceptedAnswer: { '@type': 'Answer', text: 'Manglik dosha (Mars dosha) occurs when Mars is placed in the 1st, 4th, 7th, 8th, or 12th house of the birth chart. Many astrologers recommend matching Manglik individuals with other Mangliks to neutralize the dosha.' } },
                { '@type': 'Question', name: 'How much does kundli matching cost on Aadikarta?', acceptedAnswer: { '@type': 'Answer', text: 'Kundli matching consultations on Aadikarta start from ₹10 per minute. A detailed kundali milan session typically takes 20–30 minutes.' } },
            ],
        },
        {
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://aadikarta.org' },
                { '@type': 'ListItem', position: 2, name: 'Services', item: 'https://aadikarta.org/astrologers' },
                { '@type': 'ListItem', position: 3, name: 'Kundli Matching', item: 'https://aadikarta.org/services/kundli-matching' },
            ],
        },
    ],
};

const KundliMatching: React.FC = () => {
    useEffect(() => {
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Kundli Matching for Marriage | Kundali Milan Online"
                description="Expert kundali milan (kundli matching) for marriage — 36-gun analysis, manglik dosha check & compatibility report from verified Vedic astrologers. From ₹10/min."
                structuredData={kundliStructuredData}
            />
            <Header />

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 px-6 text-center overflow-hidden min-h-[460px] flex flex-col items-center justify-center">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <span className="text-amber-500 font-normal uppercase tracking-widest text-sm mb-3 block">Service Details</span>
                    <h1 className="text-4xl md:text-6xl font-normal text-white mb-6">Kundli Matching</h1>
                    <p className="text-xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
                        Discover divine compatibility and ensure a harmonious union through the ancient wisdom of Vedic Astrology.
                    </p>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-24">
                {/* What is Kundli Matching */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center" data-aos="fade-up">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="title-icon-wrapper"><HeartHandshake size={20} /></div>
                            <h2 className="text-2xl md:text-3xl font-normal text-white">What is Kundli Matching?</h2>
                        </div>
                        <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                            <p>
                                Kundli Matching, also known as <span className="font-normal text-amber-500">Guna Milan</span> or Horoscope Matching, is the time-tested Vedic practice of comparing the celestial blueprints of two individuals before they enter the sacred bond of marriage.
                            </p>
                            <p>
                                At its core, it utilizes the <span className="italic text-amber-500">Ashta-koota</span> system, which evaluates 8 different aspects (Kootas) of compatibility, resulting in a total score out of 36 Gunas.
                            </p>
                        </div>
                    </div>
                    
                    <div className="service-glass-panel p-8" data-aos="fade-left">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Varna', desc: 'Work profile/ego' },
                                { label: 'Vashya', desc: 'Mutual control' },
                                { label: 'Tara', desc: 'Destiny/health' },
                                { label: 'Yoni', desc: 'Physical affinity' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center hover:border-amber-500/20 transition-all hover:-translate-y-0.5">
                                    <span className="block text-amber-500 font-normal text-base mb-1">{item.label}</span>
                                    <span className="text-xs text-gray-400 font-light">{item.desc}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 text-center text-xs text-amber-500/60 uppercase tracking-widest font-normal">The Pillars of Compatibility</div>
                    </div>
                </section>

                {/* Why is it Required for a Couple */}
                <section className="service-glass-panel p-10 md:p-16 relative overflow-hidden" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-3xl font-normal text-white mb-12">Why is it Required for a Couple?</h2>
                        <div className="grid md:grid-cols-3 gap-8 text-left">
                            {[
                                { icon: <Activity size={24} />, title: 'Health & Longevity', desc: 'Predictions regarding the physical and mental well-being of both partners after marriage.' },
                                { icon: <Users size={24} />, title: 'Family & Progeny', desc: 'Assessing the happiness of the household and the potential for healthy offspring.' },
                                { icon: <HeartHandshake size={24} />, title: 'Mental Accord', desc: 'Analyzing temperamental compatibility to prevent future conflicts and foster mutual respect.' }
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

                {/* How Aadikarta Helps */}
                <section className="text-center py-10" data-aos="fade-up">
                    <h2 className="text-3xl font-normal text-white mb-6">How Aadikarta Astrologers Help You</h2>
                    <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-12">
                        While digital matching gives you a score, only an expert astrologer can interpret the deeper nuances and provide effective mitigation strategies.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        {[
                            { icon: <CheckCircle size={24} />, title: 'Detailed Dosha Analysis', desc: 'Comprehensive checking for Manglik Dosha, Bhakoot Dosha, and Nadi Dosha.' },
                            { icon: <Award size={24} />, title: 'Remedial Solutions', desc: 'Personalized remedies including gemstones, mantras, and pujas to neutralize influences.' },
                            { icon: <Users size={24} />, title: 'Face-to-Face Clarity', desc: 'Direct interaction with verified Vedic experts to discuss specific concerns.' },
                            { icon: <Sparkles size={24} />, title: 'Holistic Prediction', desc: 'Going beyond simple scores to analyze Navamsha charts and planetary periods.' }
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
                        Consult an Expert Now
                    </Link>
                </section>
            </main>
            <Footer />
        </div>
    );
};

export default KundliMatching;
