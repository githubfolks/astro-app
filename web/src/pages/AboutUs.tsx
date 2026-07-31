import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Lock, Eye, Heart } from 'lucide-react';
import SEO from '../components/SEO';
import AOS from 'aos';
import 'aos/dist/aos.css';

const AboutUs: React.FC = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
            disable: 'mobile',
            offset: 50
        });
        AOS.refresh();
    }, []);

    const structuredData = {
        "@context": "https://schema.org",
        "@type": ["Organization", "Corporation"],
        "@id": "https://aadikarta.org/#organization",
        "name": "Aadikarta Vedic Astrology",
        "legalName": "Aadikarta Private Limited",
        "alternateName": ["Aadikarta", "Aadikarta Astro"],
        "url": "https://aadikarta.org",
        "logo": "https://aadikarta.org/assets/logo.png",
        "description": "Aadikarta Vedic Astrology bridges ancient Vedic wisdom with modern technology, providing authentic online astrological guidance from verified experts.",
        "disambiguatingDescription": "Aadikarta.org is a private limited company specializing in Vedic services and is not associated with any public figures or other entities sharing a similar name.",
        "sameAs": [
            "https://www.facebook.com/astroaadikarta",
            "https://x.com/astro_aadikarta_2026",
            "https://www.instagram.com/astro_aadikarta_2026/",
            "https://www.youtube.com/channel/UC1cAAmALtOOln2EJ3CLj5Bw",
            "https://www.linkedin.com/in/aadikarta-vedic-astrology"
        ]
    };

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="About Aadikarta Vedic Astrology | India's Trusted Online Astrology Platform"
                description="Aadikarta Vedic Astrology is India's premier online marketplace for verified Vedic astrologers, tarot readers & numerologists. Learn about our mission and story."
                keywords="About Aadikarta Vedic Astrology, Aadikarta Astro team, online astrology platform India, verified Vedic astrologers Aadikarta"
                structuredData={structuredData}
            />
            <Header />

            {/* Hero Section */}
            <div className="relative h-[220px] md:h-[480px] flex items-center justify-center text-white overflow-hidden">
                <div
                    className="absolute inset-0 celestial-bg z-0"
                >
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>
                <div className="relative z-10 container mx-auto px-4 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-7xl mb-6 tracking-tight" data-aos="fade-down">
                        About <span className="gradient-text">Aadikarta</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-2xl font-light opacity-90 max-w-2xl mx-auto leading-relaxed text-justify" data-aos="fade-up" data-aos-delay="200">
                        Bridging ancient wisdom with modern technology for your spiritual journey.
                    </p>
                </div>
            </div>

            <main className="flex-1">
                {/* Mission Section */}
                <div className="container mx-auto px-4 py-12 md:py-32">
                    <div className="flex flex-col md:flex-row items-center gap-16 md:gap-24">
                        <div className="w-full md:w-1/2" data-aos="fade-right">
                            <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Our Story</span>
                            <h2 className="text-2xl sm:text-3xl md:text-5xl text-gray-900 mb-8 relative">
                                Our <span className="text-indigo-600">Mission</span>
                            </h2>
                            <div className="prose prose-lg text-gray-700 space-y-6">
                                <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed text-justify">
                                    AadiKarta is a digital platform designed to bridge the gap between experienced astrologers and individuals seeking guidance, clarity, and insights into their lives. We provide a trusted space where seekers can connect with professional Vedic astrologers for authentic consultations.
                                </p>
                                <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed text-justify">
                                    Our mission is to make authentic astrological guidance accessible, transparent, and convenient through technology. We believe astrology is a tool for self-reflection and informed decision-making, not a substitute for personal judgment or professional advice.
                                </p>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2" data-aos="fade-left">
                            <div className="relative rounded-[3rem] overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-500 border-8 border-white group">
                                <img
                                    src="/assets/about-mission.webp"
                                    alt="Our Mission - Guidance and Clarity"
                                    className="w-full h-auto object-cover"
                                    loading="lazy"
                                    width="600"
                                    height="400"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                                <div className="absolute bottom-10 left-10 text-white font-medium text-2xl">
                                    Guiding you towards clarity
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Core Values Section */}
                <section className="py-12 md:py-24 bg-indigo-50/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-3xl mx-auto mb-8 md:mb-20 text-center" data-aos="fade-up">
                            <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Trust & Framework</span>
                            <h2 className="text-2xl sm:text-3xl md:text-5xl text-gray-900 mb-8">
                                Why Choose <span className="text-indigo-600">Aadikarta?</span>
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed text-justify sm:text-center">We are committed to providing a safe, authentic, and enriching experience for every seeker.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
                            {[
                                { icon: <Shield size={20} />, title: "Verified Experts", text: "Every astrologer on our platform undergoes a rigorous verification process to ensure authenticity and expertise.", delay: 100, color: "indigo" },
                                { icon: <Lock size={20} />, title: "Secure & Private", text: "Your consultations are 100% private and secure. We respect your confidentiality above all else.", delay: 200, color: "purple" },
                                { icon: <Heart size={20} />, title: "Ethical Guidance", text: "We promote responsible spiritual guidance and do not encourage superstition or fear-mongering.", delay: 300, color: "pink" },
                                { icon: <Eye size={20} />, title: "Transparency", text: "Clear pricing, honest reviews, and transparent policies. No hidden charges or false promises.", delay: 400, color: "orange" }
                            ].map((value, index) => (
                                <div
                                    key={index}
                                    className="bg-white/70 backdrop-blur-xl p-5 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
                                    data-aos="fade-up"
                                    data-aos-delay={value.delay}
                                >
                                    <div className="flex items-center md:flex-col md:items-start gap-3 mb-3 md:mb-8">
                                        <div className={`flex-shrink-0 bg-${value.color}-100/50 w-10 h-10 md:w-20 md:h-20 rounded-xl md:rounded-3xl flex items-center justify-center text-${value.color}-600 group-hover:scale-110 transition-transform duration-500 group-hover:bg-${value.color}-600 group-hover:text-white`}>
                                            {value.icon}
                                        </div>
                                        <h3 className="text-lg md:text-2xl text-gray-900">{value.title}</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg text-justify sm:text-left">
                                        {value.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Disclaimer Strip */}
                <div className="bg-indigo-950 text-indigo-100 py-12 md:py-20 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30"></div>
                    <div className="container mx-auto px-4 text-center relative z-10" data-aos="zoom-in">
                        <h3 className="text-xl sm:text-2xl font-bold mb-6 text-white tracking-wide">Our Commitment to Reality</h3>
                        <p className="max-w-3xl mx-auto opacity-80 text-sm sm:text-base md:text-lg leading-relaxed font-light text-justify sm:text-center">
                            We do not promote superstition or guarantee outcomes. Our platform encourages seekers to use astrological insights as supportive guidance while making their own informed choices.
                        </p>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AboutUs;
