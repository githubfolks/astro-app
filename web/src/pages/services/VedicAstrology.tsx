import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import PageHeading from '../../components/PageHeading';
import SEO from '../../components/SEO';
import FAQSection from '../../components/FAQSection';
import { Compass, Layers, Award, BookOpen, Sparkles, Activity } from 'lucide-react';
import './ServicesDetail.css';

const faqs = [
    { question: 'What is Vedic astrology?', answer: 'Vedic astrology (Jyotish) is an ancient Indian science that studies planetary positions at the time of birth to understand personality, life events, and future trends using the sidereal zodiac.' },
    { question: 'How accurate is Vedic astrology?', answer: 'Vedic astrology uses precise calculations of planetary positions and the natal chart to provide insights. Accuracy depends on the birth time, date, and location, and the expertise of the astrologer.' },
    { question: 'What can a Vedic astrology reading tell me?', answer: 'A Vedic reading can reveal your personality traits, career path, relationship compatibility, health tendencies, financial prospects, and upcoming planetary periods (dashas) that influence your life.' },
    { question: 'How much does a Vedic astrology consultation cost on Aadikarta Vedic Astrology?', answer: 'Vedic astrology consultations on Aadikarta Vedic Astrology start from ₹10 per minute, with expert astrologers available at ₹31–60/min and master-level Jyotish scholars at ₹61–150/min.' },
];

const vedicStructuredData = {
    '@context': 'https://schema.org',
    '@graph': [
        {
            '@type': 'Service',
            '@id': 'https://aadikarta.org/services/vedic-astrology#service',
            name: 'Vedic Astrology Consultation on Aadikarta Vedic Astrology',
            provider: { '@id': 'https://aadikarta.org/#organization' },
            description: 'Authentic Vedic astrology (Jyotish) consultations including natal chart analysis, planetary transits, dasha predictions, and life guidance on Aadikarta Vedic Astrology.',
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
                { '@type': 'ListItem', position: 3, name: 'Vedic Astrology', item: 'https://aadikarta.org/services/vedic-astrology' },
            ],
        },
    ],
};

const VedicAstrology: React.FC = () => {
    useEffect(() => {
        AOS.init({ duration: 1000, once: true, disable: 'mobile' });
    }, []);

    return (
        <div className="service-detail-page min-h-screen">
            <SEO
                title="Vedic Astrology (Jyotish) Consultations Online | Aadikarta Vedic Astrology"
                description="Authentic Vedic astrology consultations on Aadikarta Vedic Astrology from India's top Jyotish experts. Natal chart analysis, planetary transits, dasha predictions. From ₹10/min."
                keywords="Aadikarta Vedic Astrology, Vedic astrology online, Jyotish consultation, Kundli reading Aadikarta, talk to Jyotish expert"
                structuredData={vedicStructuredData}
            />
            <Header />
            
            {/* Hero Section */}
            <header className="relative pt-8 pb-6 md:pt-16 md:pb-12 px-6 text-center overflow-hidden">
                <div className="absolute top-[10%] left-[-150px] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[10%] right-[-150px] w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto relative z-10">
                    <PageHeading
                        eyebrow="Service Details"
                        title="Vedic Astrology"
                        subtitle="The science of light that illuminates your soul's journey through time."
                    />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 md:py-12 space-y-12 md:space-y-24">
                {/* Intro Section */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-center" data-aos="fade-up">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="title-icon-wrapper"><Compass size={20} /></div>
                            <h2 className="text-2xl md:text-3xl font-normal text-white">What is Vedic Astrology?</h2>
                        </div>
                        <div className="space-y-4 text-gray-300 text-base md:text-lg leading-relaxed">
                            <p>
                                Vedic Astrology, or <span className="font-normal text-amber-500">Jyotish</span> (the science of light), is the world's most ancient system of understanding human destiny.
                            </p>
                            <p>
                                Unlike Western systems, it uses the sidereal zodiac and Nakshatras (lunar mansions) to provide surgical precision in timing life milestones.
                            </p>
                        </div>
                    </div>
                    
                    <div className="service-glass-panel p-5 md:p-8 flex items-center justify-center min-h-[180px] md:min-h-[250px]" data-aos="fade-left">
                        <div className="w-full">
                            <h3 className="text-base md:text-lg font-normal text-white mb-3 md:mb-6 text-center">Planetary Influences</h3>
                            <div className="grid grid-cols-4 gap-3 text-center">
                                {[
                                    { code: 'ASC', glyph: '↑' },
                                    { code: 'SUN', glyph: '☉' },
                                    { code: 'MOO', glyph: '☽' },
                                    { code: 'MER', glyph: '☿' },
                                    { code: 'VEN', glyph: '♀' },
                                    { code: 'MAR', glyph: '♂' },
                                    { code: 'JUP', glyph: '♃' },
                                    { code: 'SAT', glyph: '♄' },
                                ].map(({ code, glyph }, idx) => (
                                    <div key={idx} className={`p-3 rounded-xl border text-xs font-normal transition-all hover:-translate-y-0.5 ${code === 'SUN' || code === 'MOO' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                                        <span className="block text-lg leading-none mb-1">{glyph}</span>
                                        {code}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pillars of Jyotish */}
                <section className="service-glass-panel p-5 md:p-16 relative overflow-hidden" data-aos="zoom-in">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
                    <div className="relative z-10 text-center">
                        <h2 className="text-xl md:text-3xl font-normal text-white mb-6 md:mb-12">The Pillars of Jyotish Wisdom</h2>
                        <div className="grid md:grid-cols-3 gap-4 md:gap-8 text-left">
                            {[
                                { icon: <Activity size={24} />, title: 'Dasha Systems', desc: 'Unique planetary time periods that reveal exactly WHEN events will manifest.' },
                                { icon: <Layers size={24} />, title: 'Varga Charts', desc: 'Divisional charts that act like a microscope, showing specific details about life.' },
                                { icon: <Award size={24} />, title: 'Remedies', desc: 'Practical actions like gemstones, mantras, and charity to balance planetary influences.' }
                            ].map((item, idx) => (
                                <div key={idx} className="p-4 md:p-8 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/15">
                                    <div className="text-amber-500 mb-4">{item.icon}</div>
                                    <h3 className="text-base md:text-xl font-normal text-white mb-1.5 md:mb-3">{item.title}</h3>
                                    <p className="text-gray-300 font-light leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features list */}
                <section className="text-center py-5 md:py-10" data-aos="fade-up">
                    <h2 className="text-xl md:text-3xl font-normal text-white mb-3 md:mb-6">Explore the Science of Planets</h2>
                    <div className="grid md:grid-cols-2 gap-4 md:gap-8 text-left mt-6 md:mt-12">
                        {[
                            { icon: <BookOpen size={24} />, title: 'Janma Kundli', desc: 'Your birth chart details planetary coordinates mapping your strengths, weaknesses, and potential.' },
                            { icon: <Sparkles size={24} />, title: 'Transit Calculations', desc: 'Understand how moving planets interact with your natal chart today to shape immediate events.' }
                        ].map((item, idx) => (
                            <div key={idx} className="custom-list-item">
                                <div className="icon-box">{item.icon}</div>
                                <div>
                                    <h4 className="text-base md:text-xl font-normal text-white mb-1 md:mb-2">{item.title}</h4>
                                    <p className="text-sm md:text-base text-gray-300 font-light">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Link to="/astrologers" className="inline-block mt-8 md:mt-16 bg-amber-500 text-indigo-950 px-8 md:px-12 py-3 md:py-4 rounded-full font-normal text-base md:text-lg shadow-xl shadow-amber-500/10 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all">
                        Consult with Astrologer
                    </Link>
                </section>

                <FAQSection faqs={faqs} />
            </main>
            <Footer />
        </div>
    );
};

export default VedicAstrology;
