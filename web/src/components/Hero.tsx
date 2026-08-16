import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Sparkles, FileText, BrainCircuit } from 'lucide-react';
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
                        <div className="hero-actions-grid grid grid-cols-2 gap-3 max-w-xs sm:max-w-sm mx-auto sm:mx-0">
                            <Link
                                to="/astrologers"
                                className="hero-square-btn bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-900/30"
                            >
                                <MessageCircle size={62} className="shrink-0" />
                                <span>Chat with Astrologer</span>
                            </Link>
                            <Link
                                to="/ai-astrologer"
                                className="hero-square-btn bg-gradient-to-br from-amber-400 to-amber-600 text-indigo-950 shadow-lg shadow-amber-900/20"
                            >
                                <Sparkles size={62} className="shrink-0" />
                                <span>Ask Free AI Astrologer</span>
                            </Link>
                            <Link
                                to="/services/ai-instant-reports"
                                className="hero-square-btn bg-emerald-500/15 text-emerald-200 border border-emerald-400/30"
                            >
                                <FileText size={62} className="shrink-0" />
                                <span>AI Instant Report</span>
                            </Link>
                            <Link
                                to="/memory-guru"
                                className="hero-square-btn bg-white/10 text-white border border-white/20"
                            >
                                <BrainCircuit size={62} className="shrink-0" />
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
