import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Lock, Eye, Heart } from 'lucide-react';
import SEO from '../components/SEO';

const AboutUs: React.FC = () => {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Aadikarta",
        "url": "https://aadikarta.org",
        "logo": "https://aadikarta.org/assets/logo.png",
        "description": "We bridge ancient Vedic wisdom with modern life, providing authentic astrological guidance."
    };

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="About Us"
                description="Learn about Aadikarta's mission to bring ancient Vedic wisdom to the modern world. Meet our team of expert astrologers and spiritual guides."
                structuredData={structuredData}
            />
            <Header />

            {/* Hero Section */}
            <div className="relative h-[400px] flex items-center justify-center text-white">
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{
                        backgroundImage: "url('/assets/about-hero-bg.png')",
                    }}
                >
                    <div className="absolute inset-0 bg-black/50"></div>
                </div>
                <div className="relative z-10 container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">About Aadikarta</h1>
                    <p className="text-xl md:text-2xl font-light opacity-90 max-w-2xl mx-auto">
                        Bridging ancient wisdom with modern technology for your spiritual journey.
                    </p>
                </div>
            </div>

            <main className="flex-1">
                {/* Mission Section */}
                <div className="container mx-auto px-4 py-20 md:py-16">
                    <div className="flex flex-col md:flex-row items-center gap-12">
                        <div className="w-full md:w-1/2">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 relative">
                                Our Mission
                                <span className="absolute bottom-0 left-0 w-20 h-1 bg-indigo-600 rounded-full mb-[-8px]"></span>
                            </h2>
                            <div className="prose prose-lg text-gray-700 space-y-6">
                                <p>
                                    AadiKarta is a digital platform designed to bridge the gap between experienced astrologers and individuals seeking guidance, clarity, and insights into their lives. We provide a trusted space where seekers can connect with professional Vedic astrologers for authentic consultations.
                                </p>
                                <p>
                                    Our mission is to make authentic astrological guidance accessible, transparent, and convenient through technology. We believe astrology is a tool for self-reflection and informed decision-making, not a substitute for personal judgment or professional advice.
                                </p>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
                                <img
                                    src="/assets/about-mission.png"
                                    alt="Our Mission - Guidance and Clarity"
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <div className="absolute bottom-6 left-6 text-white font-medium text-lg">
                                    Guiding you towards clarity
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Core Values Section */}
                <div className="bg-gray-50 py-16 md:py-24">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose Aadikarta?</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">We are committed to providing a safe, authentic, and enriching experience for every seeker.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-indigo-500">
                                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-6 text-indigo-600">
                                    <Shield size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Verified Astrologers</h3>
                                <p className="text-gray-600">
                                    Every astrologer on our platform undergoes a rigorous verification process to ensure authenticity and expertise.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-purple-500">
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mb-6 text-purple-600">
                                    <Lock size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
                                <p className="text-gray-600">
                                    Your consultations are 100% private and secure. We respect your confidentiality above all else.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-pink-500">
                                <div className="w-14 h-14 bg-pink-100 rounded-full flex items-center justify-center mb-6 text-pink-600">
                                    <Heart size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Ethical Guidance</h3>
                                <p className="text-gray-600">
                                    We promote responsible spiritual guidance and do not encourage superstition or fear-mongering.
                                </p>
                            </div>

                            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-t-4 border-orange-500">
                                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mb-6 text-orange-600">
                                    <Eye size={28} />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Transparency</h3>
                                <p className="text-gray-600">
                                    Clear pricing, honest reviews, and transparent policies. No hidden charges or false promises.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Disclaimer Strip */}
                <div className="bg-indigo-900 text-indigo-100 py-12">
                    <div className="container mx-auto px-4 text-center">
                        <h3 className="text-xl font-semibold mb-4 text-white">Our Commitment to Reality</h3>
                        <p className="max-w-3xl mx-auto opacity-90 leading-relaxed">
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
