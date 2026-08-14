import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Sparkles, FileText, BrainCircuit, ArrowRight } from 'lucide-react';
import './Hero.css';

const Hero: React.FC = () => {
    return (
        <section className="hero-section spiritual-bg overflow-hidden relative max-[968px]:min-h-0 min-h-screen lg:min-h-[640px] flex items-center">
            <div className="container hero-content relative z-10 py-2">
                <div className="hero-text">
                    <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-400/30 rounded-full px-4 py-1.5 mb-4 backdrop-blur-md">
                        <span className="text-amber-300 text-xs md:text-sm font-semibold tracking-wide flex items-center gap-1.5">
                            ✨ Free AI Astrologer + Human-Verified Astrology · From ₹10/min
                        </span>
                    </div>
                    <h1 className="hero-title mt-2">
                        Talk to Verified
                        <span className="gradient-text block mt-2 py-2">Astrologers Online</span>
                    </h1>
                    <p className="hero-description text-indigo-100 text-xl mt-4 opacity-90 leading-relaxed">
                        Get instant free AI chart insights or connect with India's top Vedic astrologers for live chat consultations on Kundli, Tarot, Love & Career.
                    </p>
                    <div className="hero-actions mt-8">
                        <Link
                            to="/astrologers"
                            className="group w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-[1.02] shadow-xl shadow-indigo-900/30 flex items-center justify-center gap-3"
                        >
                            <MessageCircle size={20} className="shrink-0" />
                            <span>Chat with Astrologer</span>
                            <span className="text-xs bg-white/15 px-2.5 py-1 rounded-full font-semibold">From ₹10/min</span>
                            <ArrowRight size={16} className="shrink-0 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                        </Link>

                        <div className="hero-actions-secondary mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Link
                                to="/ai-astrologer"
                                className="bg-gradient-to-br from-amber-400 to-amber-600 text-indigo-950 px-5 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.03] shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 text-sm"
                            >
                                <Sparkles size={17} className="shrink-0" />
                                <span>Ask Free AI Astrologer</span>
                            </Link>
                            <Link
                                to="/services/ai-instant-reports"
                                className="bg-emerald-500/15 hover:bg-emerald-500/25 backdrop-blur-md text-emerald-200 border border-emerald-400/30 px-5 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.03] flex items-center justify-center gap-2 text-sm"
                            >
                                <FileText size={17} className="shrink-0" />
                                <span>AI Instant Report</span>
                            </Link>
                            <Link
                                to="/memory-guru"
                                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-5 py-3.5 rounded-xl font-bold transition-all hover:scale-[1.03] flex items-center justify-center gap-2 text-sm"
                            >
                                <BrainCircuit size={17} className="shrink-0" />
                                <span>Memory Guru</span>
                            </Link>
                        </div>
                    </div>

                    <div className="hero-trust-badges mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center gap-6 text-xs text-indigo-200/80">
                        <span className="flex items-center gap-1.5 font-medium">
                            <span className="text-amber-400">🔒</span> 100% Private & Confidential
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                            <span className="text-amber-400">⭐</span> Verified Vedic Experts
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                            <span className="text-amber-400">⚡</span> Instant AI + Human Handoff
                        </span>
                    </div>
                </div>

                <div className="hero-image-container relative">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                    <img
                        src="/assets/hero_astrology.webp"
                        alt="Indian Mythological Astrology"
                        className="hero-image relative z-10 rounded-[3rem] shadow-2xl border-4 border-white/10"
                        fetchPriority="high"
                        loading="eager"
                        width="800"
                        height="600"
                    />
                    <div className="floating-card absolute -right-6 top-1/4 max-[640px]:right-2 max-[640px]:top-auto max-[640px]:-bottom-4 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl z-20 flex items-center gap-4 animate-bounce-slow">
                        <span className="text-3xl">🧠</span>
                        <div className="text text-black">
                            <strong className="block text-sm">Memory Mastery</strong>
                            <span className="text-xs opacity-70 italic">Learn Techniques</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
