import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import {
    Shield,
    Star,
    Zap,
    Users,
    Sparkles,
    Moon,
    BookOpen,
    MessageCircle,
    Smartphone,
    Heart,
    Compass,
    Brain,
    Target,
    Award
} from 'lucide-react';
import SEO from '../components/SEO';

const ComingSoon: React.FC = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
            mirror: false,
        });
    }, []);

    const services = [
        { icon: <Moon className="text-indigo-400" />, title: "Vedic Astrology", desc: "Gain clarity with personalized birth chart readings." },
        { icon: <Compass className="text-amber-400" />, title: "Vastu Shastra", desc: "Harmonize your living space for prosperity." },
        { icon: <Brain className="text-purple-400" />, title: "Memory Mastery", desc: "Unlock mental potential with Rajesh Chaudhary." },
        { icon: <Heart className="text-rose-400" />, title: "Love & Relationships", desc: "Find spiritual guidance for your emotional journey." },
        { icon: <Target className="text-emerald-400" />, title: "Kundli Matching", desc: "Discover celestial compatibility for long-term harmony." },
        { icon: <Star className="text-yellow-400" />, title: "Daily Horoscopes", desc: "Start your day with aligned cosmic insights." }
    ];

    const differentiators = [
        { icon: Shield, color: "text-amber-400", title: "100% Privacy", desc: "Military-grade encryption ensures your spiritual journey remains strictly confidential." },
        { icon: Award, color: "text-indigo-400", title: "Verified Experts", desc: "A rigorous 4-step screening process ensures only genuine, compassionate experts join our circle." },
        { icon: Sparkles, color: "text-purple-400", title: "Satisfaction Guaranteed", desc: "Your spiritual peace is our priority. Hassle-free refund policy for every consultation." }
    ];

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "AadiKarta",
        "url": "https://aadikarta.org",
        "logo": "https://aadikarta.org/assets/logo.png",
        "sameAs": [
            "https://facebook.com/aadikartaastro",
            "https://instagram.com/astro_aadikarta",
            "https://x.com/astro_aadikarta"
        ]
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden flex flex-col text-white bg-[#0f172a] font-sans">
            <SEO
                title="Coming Soon | Aadikarta - Ancient Wisdom for Modern Life"
                description="We are bringing something sacred and transformative. Aadikarta is coming soon to guide your spiritual journey and unlock your mental potential."
                structuredData={organizationSchema}
            />

            {/* Celestial Background */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,#1e1b4b,0%,#0f172a_100%)] -z-20"></div>
            <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 -z-10"></div>

            {/* Hero Section */}
            <main className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-32 pb-20 flex flex-col items-center justify-center text-center">
                <div data-aos="fade-up">
                    <span className="inline-block px-4 py-1.5 mb-8 text-sm font-medium tracking-widest uppercase border border-amber-400/30 text-amber-400 bg-amber-400/5 rounded-full backdrop-blur-sm">
                        Opening Soon
                    </span>
                    <h1 className="text-6xl md:text-8xl mb-10 leading-tight tracking-tight">
                        Bringing <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">Ancient Wisdom</span><br />to Modern Life
                    </h1>
                    <p className="text-xl md:text-3xl text-indigo-100/70 mb-16 font-light leading-relaxed max-w-3xl mx-auto">
                        Your sanctuary for Vedic astrology, spiritual growth, and absolute mental mastery. We are crafting a bridge to your highest potential.
                    </p>
                </div>

                <div className="relative w-full max-w-4xl mx-auto" data-aos="zoom-in" data-aos-delay="200">
                    <img
                        src="/assets/hero_astrology.png"
                        alt="Ancient Wisdom"
                        className="w-full h-auto drop-shadow-[0_0_80px_rgba(245,158,11,0.25)] animate-float"
                    />
                    <div className="absolute -inset-10 bg-gradient-to-tr from-amber-500/20 to-transparent blur-[100px] -z-10 rounded-full"></div>
                </div>
            </main>

            {/* What is AadiKarta Section */}
            <section className="relative z-10 py-32 px-6 bg-white/5 backdrop-blur-md border-y border-white/10">
                <div className="max-w-5xl mx-auto text-center" data-aos="fade-up">
                    <h2 className="text-4xl md:text-5xl mb-10">What is <span className="text-amber-400">AadiKarta?</span></h2>
                    <p className="text-xl md:text-2xl text-indigo-100/80 leading-relaxed font-light">
                        AadiKarta is a technology-driven spiritual platform that bridges the gap between ancient Vedic traditions and modern life.
                        We connect seekers with India's most prestigious spiritual network of verified expert astrologers and
                        educational visionaries like <span className="text-amber-400 font-medium">Rajesh Chaudhary (Memory Guru)</span>.
                    </p>
                </div>
            </section>

            {/* Who We Serve Section */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20" data-aos="fade-up">
                        <h2 className="text-4xl md:text-5xl mb-6">Our <span className="text-amber-400">Purpose</span></h2>
                        <p className="text-xl text-indigo-100/60 font-light">Empowering every soul on their unique path.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        {[
                            { icon: <Users />, title: "The Seeker", desc: "Individuals looking for spiritual clarity and cosmic insights into life's mysteries." },
                            { icon: <BookOpen />, title: "The Student", desc: "Learners seeking to unlock hidden mental potential and academic mastery." },
                            { icon: <Award />, title: "The Expert", desc: "Verified spiritual guides joining India's most prestigious spiritual network." }
                        ].map((item, idx) => (
                            <div key={idx} className="p-10 rounded-[2.5rem] bg-indigo-950/40 border border-white/10 hover:border-amber-400/30 transition-all duration-500 group overflow-hidden relative" data-aos="fade-up" data-aos-delay={idx * 100}>
                                <div className="text-amber-400 mb-8 p-4 bg-amber-400/10 rounded-2xl w-fit group-hover:scale-110 transition-transform duration-500">
                                    {item.icon}
                                </div>
                                <h3 className="text-2xl mb-4">{item.title}</h3>
                                <p className="text-indigo-100/60 leading-relaxed font-light">{item.desc}</p>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/5 blur-3xl rounded-full translate-x-10 -translate-y-10 group-hover:bg-amber-400/10 transition-colors"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Main Services Section */}
            <section className="relative z-10 py-32 px-6 bg-indigo-950/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20" data-aos="fade-up">
                        <h2 className="text-4xl md:text-5xl mb-6">Celestial <span className="text-amber-400">Offerings</span></h2>
                        <p className="text-xl text-indigo-100/60 font-light">Comprehensive spiritual and mental growth services.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service, idx) => (
                            <div key={idx} className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-500" data-aos="fade-up" data-aos-delay={idx * 50}>
                                <div className="mb-6 p-4 bg-white/5 rounded-2xl w-fit">
                                    {service.icon}
                                </div>
                                <h4 className="text-xl mb-3">{service.title}</h4>
                                <p className="text-indigo-100/50 font-light text-sm">{service.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why We Are Different Section */}
            <section className="relative z-10 py-32 px-6 bg-gradient-to-b from-transparent to-black/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20" data-aos="fade-up">
                        <h2 className="text-4xl md:text-5xl mb-6">The <span className="text-amber-400">AadiKarta</span> Difference</h2>
                        <p className="text-xl text-indigo-100/60 font-light">Built on foundation of trust, authenticity, and results.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        {differentiators.map((diff, idx) => (
                            <div key={idx} className="flex flex-col items-center text-center px-6" data-aos="fade-up" data-aos-delay={idx * 150}>
                                <div className={`mb-8 p-6 bg-white/5 rounded-[2rem] border border-white/10 hover:rotate-6 transition-transform duration-500 ${diff.color}`}>
                                    <diff.icon size={40} />
                                </div>
                                <h4 className="text-2xl mb-4">{diff.title}</h4>
                                <p className="text-indigo-100/60 font-light leading-relaxed">{diff.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Memory Guru Section */}
            <section className="relative z-10 py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white/5 backdrop-blur-xl rounded-[3rem] p-10 md:p-16 border border-white/10 overflow-hidden relative">
                        <div className="flex flex-col md:flex-row items-center gap-12">
                            <div className="w-full md:w-1/3 flex-shrink-0" data-aos="fade-right">
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-[2.5rem] blur-2xl group-hover:opacity-100 transition duration-1000"></div>
                                    <img
                                        src="/assets/memory_guru/rajesh-1.jpeg"
                                        alt="Rajesh Chaudhary - Memory Guru"
                                        className="relative rounded-[2.5rem] shadow-2xl w-full border-4 border-white/10 object-cover aspect-[4/5] transform transition-all duration-500 hover:scale-[1.02]"
                                    />
                                    <div className="absolute -bottom-4 -right-4 bg-amber-500 text-indigo-950 px-4 py-2 rounded-xl shadow-xl text-xs font-medium tracking-widest uppercase">
                                        India Book of Records
                                    </div>
                                </div>
                            </div>

                            <div className="flex-grow space-y-6" data-aos="fade-left">
                                <span className="text-amber-400 font-medium uppercase tracking-widest text-sm block">Mental Potential Coach</span>
                                <h2 className="text-4xl md:text-5xl leading-tight">Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 font-medium">Memory Guru</span></h2>
                                <h3 className="text-2xl text-indigo-100/90 font-light">Rajesh Chaudhary</h3>
                                <p className="text-lg text-indigo-100/60 leading-relaxed font-light">
                                    Unlock your hidden mental potential with scientific memory systems and accelerated learning techniques.
                                    Rajesh Chaudhary, popularly known as the Memory Guru, is a recognized motivator and India Book of Records holder
                                    dedicated to transforming how students and professionals learn, retain, and perform.
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                    {[
                                        "Scientific Memory Systems",
                                        "Rapid Recall Methods",
                                        "Concentration Enhancement",
                                        "Confidence Development"
                                    ].map((skill, i) => (
                                        <div key={i} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full"></div>
                                            <span className="text-indigo-100/70 text-sm font-light">{skill}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Future Launch Features Section */}
            <section className="relative z-10 py-32 px-6 overflow-hidden">
                <div className="max-w-5xl mx-auto bg-gradient-to-r from-amber-500/20 via-indigo-500/10 to-transparent p-12 md:p-20 rounded-[3rem] border border-white/10 relative" data-aos="zoom-in">
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl mb-10 leading-tight">The Horizon <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">of Our Mission</span></h2>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {[
                                { icon: <MessageCircle className="text-amber-400" />, title: "Live Consultations", desc: "Real-time spiritual guidance via chat and video." },
                                { icon: <Zap className="text-amber-400" />, title: "Interactive Classrooms", desc: "Unlock higher mental performance in live workshops." },
                                { icon: <Smartphone className="text-amber-400" />, title: "Elite Community", desc: "Exclusive access to India's top spiritual experts." },
                                { icon: <Smartphone className="text-amber-400" />, title: "Mobile Integration", desc: "Experience spiritual growth on the go." }
                            ].map((feature, idx) => (
                                <li key={idx} className="flex gap-4">
                                    <div className="mt-1">{feature.icon}</div>
                                    <div>
                                        <h5 className="text-lg mb-1">{feature.title}</h5>
                                        <p className="text-indigo-100/50 font-light text-sm">{feature.desc}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                    {/* Decorative Blur */}
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full"></div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-20 px-6 border-t border-white/5 text-center">
                <div className="max-w-7xl mx-auto flex flex-col items-center gap-10">
                    <img src="/assets/logo.png" alt="AadiKarta Logo" className="h-12 w-auto brightness-200 opacity-80" />
                    <p className="text-indigo-100/40 text-sm font-light uppercase tracking-[0.3em]">Ancient Wisdom • Modern Guidance</p>
                    <div className="w-16 h-[1px] bg-white/10"></div>
                    <p className="text-indigo-100/30 text-xs">© {new Date().getFullYear()} AadiKarta. All rights reserved.</p>
                </div>
            </footer>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .font-sans {
                    font-family: 'Open Sans', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
                }
            `}} />
        </div>
    );
};

export default ComingSoon;

