import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SEO from '../components/SEO';
import { IndianRupee, Clock, Globe2, ShieldCheck, TrendingUp, Users, GraduationCap, Headset } from 'lucide-react';
import AOS from 'aos';
import 'aos/dist/aos.css';

const benefits = [
    {
        icon: <IndianRupee size={20} />,
        title: 'Set Your Own Rates',
        text: 'Charge between ₹10–₹150 per minute based on your expertise. Top astrologers on Aadikarta earn over ₹1 lakh per month.',
        color: 'indigo',
    },
    {
        icon: <Clock size={20} />,
        title: 'Work On Your Schedule',
        text: 'Choose your own availability hours and consult from anywhere. No fixed shifts, no office commute.',
        color: 'purple',
    },
    {
        icon: <Globe2 size={20} />,
        title: 'Reach Seekers Nationwide',
        text: 'Get discovered by thousands of seekers across India looking for live chat consultations every day.',
        color: 'pink',
    },
    {
        icon: <ShieldCheck size={20} />,
        title: 'Free & Secure to Join',
        text: 'Joining is completely free. We only take a small commission when you complete a paid consultation, with secure, on-time payouts.',
        color: 'orange',
    },
    {
        icon: <TrendingUp size={20} />,
        title: 'Grow Your Reputation',
        text: 'Build a verified profile with genuine reviews and ratings that help you attract repeat clients over time.',
        color: 'emerald',
    },
    {
        icon: <Users size={20} />,
        title: 'Verified Community',
        text: 'Join a trusted network of verified Vedic astrologers, tarot readers, numerologists, and Vastu consultants.',
        color: 'sky',
    },
    {
        icon: <GraduationCap size={20} />,
        title: 'Showcase Your Expertise',
        text: 'Highlight your specializations, languages, and experience so seekers can find the right fit for their needs.',
        color: 'amber',
    },
    {
        icon: <Headset size={20} />,
        title: 'Platform Support',
        text: 'Our team helps with onboarding, verification, and day-to-day support so you can focus on your consultations.',
        color: 'rose',
    },
];

const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': 'https://aadikarta.org/astrologer-benefits#page',
    name: 'Benefits of Joining Aadikarta as an Astrologer',
    url: 'https://aadikarta.org/astrologer-benefits',
    description: 'Discover the benefits of joining Aadikarta Vedic Astrology as a verified astrologer — flexible hours, your own rates, nationwide reach, and secure payouts.',
    publisher: { '@id': 'https://aadikarta.org/#organization' },
};

const AstrologerBenefits: React.FC = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
            disable: 'mobile',
            offset: 50,
        });
    }, []);

    return (
        <div className="flex flex-col min-h-screen">
            <SEO
                title="Benefits of Joining as an Astrologer | Aadikarta Vedic Astrology"
                description="Explore the benefits of becoming an astrologer on Aadikarta — set your own rates, flexible hours, nationwide reach, verified community, and secure payouts."
                keywords="astrologer benefits, join as astrologer, earn as astrologer online, Aadikarta astrologer perks"
                structuredData={structuredData}
            />
            <Header />

            {/* Hero Section */}
            <div className="relative h-[220px] md:h-[300px] flex items-center justify-center text-white overflow-hidden">
                <div className="absolute inset-0 celestial-bg z-0">
                    <div className="absolute inset-0 bg-black/40"></div>
                </div>
                <div className="relative z-10 container mx-auto px-4 text-center">
                    <h1 className="text-3xl sm:text-4xl md:text-7xl mb-6 tracking-tight" data-aos="fade-down">
                        Benefits of Joining <span className="gradient-text">Aadikarta</span>
                    </h1>
                    <p className="text-base sm:text-lg md:text-2xl font-light opacity-90 max-w-2xl mx-auto leading-relaxed" data-aos="fade-up" data-aos-delay="200">
                        Everything you gain when you share your celestial wisdom on our platform.
                    </p>
                </div>
            </div>

            <main className="flex-1">
                <section className="py-12 md:py-24 relative overflow-hidden">
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="max-w-3xl mx-auto mb-8 md:mb-20 text-center" data-aos="fade-up">
                            <span className="text-indigo-600 font-semibold uppercase tracking-widest text-sm mb-4 block">Why Astrologers Choose Us</span>
                            <h2 className="text-2xl sm:text-3xl md:text-5xl text-gray-900 mb-8">
                                Grow Your Practice <span className="text-indigo-600">With Aadikarta</span>
                            </h2>
                            <p className="text-base sm:text-lg md:text-xl text-gray-600 leading-relaxed">
                                We handle the technology and the traffic, so you can focus on what you do best — guiding seekers.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-10">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={benefit.title}
                                    className="bg-white/70 backdrop-blur-xl p-5 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] border border-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group"
                                    data-aos="fade-up"
                                    data-aos-delay={(index % 4) * 100}
                                >
                                    <div className="flex items-center md:flex-col md:items-start gap-3 mb-3 md:mb-8">
                                        <div className={`flex-shrink-0 bg-${benefit.color}-100/50 w-10 h-10 md:w-20 md:h-20 rounded-xl md:rounded-3xl flex items-center justify-center text-${benefit.color}-600 group-hover:scale-110 transition-transform duration-500 group-hover:bg-${benefit.color}-600 group-hover:text-white`}>
                                            {benefit.icon}
                                        </div>
                                        <h3 className="text-lg md:text-2xl text-gray-900">{benefit.title}</h3>
                                    </div>
                                    <p className="text-gray-600 leading-relaxed text-sm sm:text-base md:text-lg">
                                        {benefit.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="join-astrologer-section py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#1e1b4b,0%,#0f172a_100%)]"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>

                    <div className="container mx-auto px-4 relative z-10 text-center">
                        <div className="max-w-3xl mx-auto" data-aos="zoom-in">
                            <h2 className="text-3xl md:text-4xl mb-8 leading-tight text-white">
                                Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 drop-shadow-sm">Get Started?</span>
                            </h2>
                            <p className="text-lg md:text-xl mb-10 text-indigo-100/70 font-light leading-relaxed">
                                Applying takes just a few minutes, and verification is usually completed within 2–3 business days.
                            </p>
                            <Link
                                to="/join-as-astrologer"
                                className="group relative inline-block px-12 py-5 rounded-[2rem] font-bold text-xl transition-all duration-500 hover:scale-105 active:scale-95 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600"></div>
                                <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20"></div>
                                <span className="relative text-indigo-950 flex items-center gap-2 justify-center">
                                    Join Our Elite Circle
                                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default AstrologerBenefits;
