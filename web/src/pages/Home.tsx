import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import TrustBar from '../components/TrustBar';
import HowItWorks from '../components/HowItWorks';
import ServicesGrid from '../components/ServicesGrid';
import AstrologerList from '../components/AstrologerList';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import MemoryGuruBanner from '../components/MemoryGuruBanner';
import AiAstrologerBanner from '../components/AiAstrologerBanner';
import InstantReportsBanner from '../components/InstantReportsBanner';
import HoroscopeSection from '../components/HoroscopeSection';
import PanchangSection from '../components/PanchangSection';
import FAQSection from '../components/FAQSection';
import { useSupportContact } from '../hooks/useSupportContact';

const homeFaqs = [
    {
        question: 'How does an online astrology consultation work?',
        answer: "Pick an astrologer based on their specialization, ratings, and price, then start a live chat. Share your birth date, time, and place, and the astrologer reads your kundli to answer your questions in real time.",
    },
    {
        question: 'How are astrologers verified on Aadikarta?',
        answer: 'Every astrologer goes through a screening process covering their background, expertise, and communication skills before being approved, so you only connect with genuine, qualified experts.',
    },
    {
        question: 'Is my personal information kept private?',
        answer: 'Yes. Your birth details and chat conversations are kept strictly confidential and are never shared with third parties.',
    },
    {
        question: 'What can I ask an astrologer about?',
        answer: 'You can ask about love and relationships, marriage compatibility, career and finance, health, and general life guidance using Vedic astrology, kundli matching, and tarot reading.',
    },
    {
        question: 'How much does a consultation cost?',
        answer: "Pricing varies by astrologer and starts from ₹10/min. You can see each astrologer's exact per-minute rate on their profile before you start chatting.",
    },
    {
        question: 'Is the Kundli generator free?',
        answer: 'Yes, generating your Vedic birth chart (Kundli) on Aadikarta is completely free. You only pay if you choose to start a live consultation with an astrologer.',
    },
    {
        question: 'What if I’m not satisfied with my consultation?',
        answer: 'We offer a hassle-free refund policy if you’re not satisfied with your consultation — see our Refund Policy page for full details.',
    },
    {
        question: 'Which languages can I consult in?',
        answer: 'Aadikarta and our astrologers support both English and Hindi consultations.',
    },
    {
        question: 'How do I become an astrologer on Aadikarta?',
        answer: 'Visit the "Join as Astrologer" page, submit your details and credentials, and our team will review your application as part of our verification process.',
    },
];

const buildHomeStructuredData = (supportEmail: string, supportPhone: string) => ({
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": "https://aadikarta.org/#website",
            "url": "https://aadikarta.org",
            "name": "Aadikarta Vedic Astrology",
            "alternateName": ["Aadikarta", "Aadikarta Astro", "Aadikarta Vedic Astrology Platform"],
            "description": "India's trusted AI-assisted online marketplace for verified Vedic astrologers, tarot readers, and AI Kundli chat on Aadikarta. Live chat consultations from ₹10/min.",
            "publisher": { "@id": "https://aadikarta.org/#organization" }
        },
        {
            "@type": ["Organization", "Corporation"],
            "@id": "https://aadikarta.org/#organization",
            "name": "Aadikarta Vedic Astrology",
            "legalName": "Aadikarta Private Limited",
            "alternateName": ["Aadikarta", "Aadikarta Astro", "Aadikarta Vedic Astrology App", "Aadikarta Vedic Astrology Online"],
            "url": "https://aadikarta.org",
            "logo": "https://aadikarta.org/assets/logo.png",
            "image": "https://aadikarta.org/assets/og-image.png",
            "description": "Aadikarta Vedic Astrology connects you with instant AI astrological insights and India's top verified Vedic astrologers, tarot card readers, and spiritual guides for live consultations, Kundli matching, daily horoscope, and Vastu advice.",
            "disambiguatingDescription": "Aadikarta.org is a private limited company specializing in AI-assisted Vedic astrology services and digital consultations. It is distinct and not associated with any public figures or other entities sharing a similar name.",
            "email": supportEmail,
            "telephone": supportPhone,
            "areaServed": "IN",
            "knowsAbout": [
                "AI Astrologer",
                "AI-Assisted Vedic Astrology",
                "Aadikarta Vedic Astrology",
                "Vedic Astrology",
                "Jyotish",
                "Tarot Reading",
                "Kundli Matching",
                "Numerology",
                "Vastu Shastra",
                "Daily Horoscope",
                "Love Compatibility",
                "Spiritual Guidance"
            ],
            "contactPoint": {
                "@type": "ContactPoint",
                "telephone": supportPhone,
                "email": supportEmail,
                "contactType": "customer support",
                "availableLanguage": ["English", "Hindi"],
                "areaServed": "IN"
            },
            "sameAs": [
                "https://www.facebook.com/astroaadikarta",
                "https://x.com/astro_aadikarta",
                "https://www.instagram.com/astro_aadikarta/",
                "https://www.youtube.com/@astro-aadikarta",
                "https://www.linkedin.com/in/aadikarta-vedic-astrology"
            ]
        },
        {
            "@type": "FAQPage",
            "mainEntity": homeFaqs.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            }))
        }
    ]
});

const Home: React.FC = () => {
    const { support_email, support_phone } = useSupportContact();
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
            disable: 'mobile',
            offset: 50
        });
        // Refresh AOS to ensure it picks up dynamically rendered content
        AOS.refresh();
    }, []);

    return (
        <div className="home-page pb-20 md:pb-0">
            <SEO
                title="Free Astrology & Vedic Insights | Talk to Astrologers Online | Aadikarta"
                description="Get instant free astrology predictions, free AI birth chart insights & live consultations with top verified Vedic astrologers on Aadikarta. Kundli matching, daily horoscope & tarot. From ₹10/min."
                keywords="free astrology, free online astrology, free vedic astrology, Aadikarta Vedic Astrology, Free AI Astrologer, AI astrology chat, free janam kundli, talk to astrologers online, Vedic astrology online, online kundli matching, daily horoscope, tarot reading Aadikarta"
                structuredData={buildHomeStructuredData(support_email, support_phone)}
            />
            <Helmet>
                <link rel="preload" href="/assets/hero_astrology.webp" as="image" fetchPriority="high" />
            </Helmet>
            <Header />
            <main id="main-content">
                <Hero />
                <AiAstrologerBanner />
                <TrustBar />
                <HowItWorks />
                <AstrologerList limit={10} topRankingOnly={false} showFilters={true} />
                <MemoryGuruBanner />
                <ServicesGrid />
                <InstantReportsBanner />
                <HoroscopeSection />

                {/* Daily Panchang Section */}
                <section className="panchang-section py-24 relative overflow-hidden bg-gradient-to-b from-[#0f0927] to-[#03010b]">
                    <div className="absolute top-[20%] left-[-150px] w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>
                    <div className="absolute bottom-[20%] right-[-150px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-4xl mx-auto">
                            <PanchangSection />
                        </div>
                    </div>
                </section>

                <section className="promise-section py-24 bg-indigo-50/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-3xl mx-auto mb-16 text-center" data-aos="fade-up">
                            <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Trust & Quality</span>
                            <h2 className="text-3xl md:text-4xl text-gray-900 mb-6">
                                Our Promise <span className="text-indigo-600">to You</span>
                            </h2>
                            <p className="text-xl text-gray-600 leading-relaxed">We are committed to authenticity, privacy, and your total satisfaction in every spiritual consultation.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group" data-aos="fade-up" data-aos-delay="100">
                                <div className="text-5xl mb-8 bg-indigo-100/50 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-indigo-600 group-hover:text-white">🔒</div>
                                <h3 className="text-2xl text-gray-900 mb-4">100% Privacy</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">Your personal details and conversations are kept strictly confidential. We use military-grade encryption to protect your data.</p>
                            </div>
                            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group" data-aos="fade-up" data-aos-delay="200">
                                <div className="text-5xl mb-8 bg-purple-100/50 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-purple-600 group-hover:text-white">✅</div>
                                <h3 className="text-2xl text-gray-900 mb-4">Verified Experts</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">Every astrologer undergoes a rigorous 4-step screening process. We ensure only genuine, compassionate experts join our circle.</p>
                            </div>
                            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group" data-aos="fade-up" data-aos-delay="300">
                                <div className="text-5xl mb-8 bg-orange-100/50 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-orange-600 group-hover:text-white">💰</div>
                                <h3 className="text-2xl text-gray-900 mb-4">Satisfaction Guaranteed</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">Not satisfied with your consultation? We offer a hassle-free refund policy. Your spiritual peace is our absolute priority.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <Testimonials />

                <section className="faq-wrapper-section py-8 relative overflow-hidden bg-gradient-to-b from-[#0f0927] to-[#03010b]">
                    <FAQSection faqs={homeFaqs} title="Frequently Asked Questions" />
                </section>

                <section className="join-astrologer-section py-32 relative overflow-hidden">
                    {/* Midnight Celestial Background */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#1e1b4b,0%,#0f172a_100%)]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>

                    {/* Dynamic Glow Elements */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <div className="max-w-4xl mx-auto" data-aos="zoom-in">
                            <h2 className="text-4xl md:text-4xl mb-10 leading-tight text-white">
                                Are You an <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-sm">Expert Astrologer?</span>
                            </h2>
                            <p className="text-xl md:text-2xl mb-14 text-indigo-100/70 font-light leading-relaxed max-w-2xl mx-auto">
                                Join India's most prestigious spiritual network. Share your celestial wisdom with millions of seekers across the globe.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                                <Link
                                    to="/join-as-astrologer"
                                    className="group relative px-12 py-5 rounded-[2rem] font-bold text-xl transition-all duration-500 hover:scale-105 active:scale-95 overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"></div>
                                    <span className="relative text-indigo-950 flex items-center gap-2">
                                        Join Our Elite Circle
                                        <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                    </span>
                                </Link>
                                <Link
                                    to="/astrologer-benefits"
                                    className="px-12 py-5 rounded-[2rem] font-bold text-xl text-white border-2 border-white/10 hover:border-amber-400/50 transition-all duration-500 hover:bg-white/5 backdrop-blur-sm"
                                >
                                    Explore Benefits
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default Home;
