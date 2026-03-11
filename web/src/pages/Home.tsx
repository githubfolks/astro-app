import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import AstrologerList from '../components/AstrologerList';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import Services from '../components/Services';

const Home: React.FC = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: false,
            mirror: true,
            offset: 100
        });
        // Refresh AOS to ensure it picks up dynamically rendered content
        AOS.refresh();
    }, []);

    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": "https://aadikarta.org/#website",
                "url": "https://aadikarta.org",
                "name": "Aadikarta",
                "description": "Connect with expert astrologers for personalized readings and spiritual guidance.",
                "publisher": { "@id": "https://aadikarta.org/#organization" },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://aadikarta.org/search?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                }
            },
            {
                "@type": "Organization",
                "@id": "https://aadikarta.org/#organization",
                "name": "Aadikarta",
                "url": "https://aadikarta.org",
                "logo": "https://aadikarta.org/assets/logo.png",
                "sameAs": [
                    "https://www.facebook.com/aadikarta",
                    "https://www.instagram.com/aadikarta"
                ]
            }
        ]
    };

    return (
        <div className="home-page pb-20 md:pb-0">
            <SEO
                title="Home"
                description="Discover your destiny with Aadikarta. Connect with expert astrologers for personalized readings, daily horoscopes, and spiritual guidance."
                structuredData={structuredData}
            />
            <Header />
            <main id="main-content">
                <h1 className="sr-only">Aadikarta: Your Trusted Guide to Vedic Astrology and Spiritual Growth</h1>
                <Hero />
                <HowItWorks />
                <AstrologerList limit={10} topRankingOnly={false} showFilters={true} />
                <Services />

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
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">100% Privacy</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">Your personal details and conversations are kept strictly confidential. We use military-grade encryption to protect your data.</p>
                            </div>
                            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group" data-aos="fade-up" data-aos-delay="200">
                                <div className="text-5xl mb-8 bg-purple-100/50 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-purple-600 group-hover:text-white">✅</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Verified Experts</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">Every astrologer undergoes a rigorous 4-step screening process. We ensure only genuine, compassionate experts join our circle.</p>
                            </div>
                            <div className="bg-white/70 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group" data-aos="fade-up" data-aos-delay="300">
                                <div className="text-5xl mb-8 bg-orange-100/50 w-20 h-20 rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 group-hover:bg-orange-600 group-hover:text-white">💰</div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">Satisfaction Guaranteed</h3>
                                <p className="text-gray-600 leading-relaxed text-lg">Not satisfied with your consultation? We offer a hassle-free refund policy. Your spiritual peace is our absolute priority.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <Testimonials />

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
                                    to="/about-us"
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
