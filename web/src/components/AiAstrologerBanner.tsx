import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, MessageCircleQuestion, Zap, Gift, ArrowRight } from 'lucide-react';
import './AiAstrologerBanner.css';

const AiAstrologerBanner: React.FC = () => {
    return (
        <section className="ai-astrologer-banner py-20 relative overflow-hidden">
            {/* Midnight celestial background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,#1e1b4b,0%,#0f172a_100%)]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            <div className="absolute -top-20 left-1/3 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="ai-banner-content flex flex-col lg:flex-row items-center gap-12 max-w-5xl mx-auto">
                    {/* Crystal ball visual */}
                    <div className="relative shrink-0" data-aos="zoom-in">
                        <div className="w-44 h-44 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-indigo-400/30 via-purple-500/20 to-amber-400/30 border border-white/20 backdrop-blur-xl flex items-center justify-center text-8xl md:text-9xl shadow-[0_0_80px_rgba(251,191,36,0.15)] animate-bounce-slow">
                            🔮
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-indigo-950 text-xs font-extrabold px-4 py-1.5 rounded-full rotate-6 shadow-lg">
                            FREE ✨
                        </div>
                    </div>

                    {/* Copy + CTA */}
                    <div className="text-center lg:text-left" data-aos="fade-left">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-5">
                            <Sparkles className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-200 text-xs font-bold tracking-widest uppercase">Free AI Astrologer · 5 Free Questions</span>
                        </div>
                        <h2 className="ai-banner-title text-3xl md:text-4xl text-white mb-4 leading-tight">
                            Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">Aadi</span> — Your Free AI Astrologer
                        </h2>
                        <p className="ai-banner-description text-lg text-indigo-100/70 font-light mb-8 max-w-xl">
                            Get instant free AI chart readings on career, love and marriage, then seamlessly connect with verified human astrologers for deeper live guidance.
                        </p>

                        <div className="ai-banner-features flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-indigo-100/80 text-sm mb-8">
                            <span className="flex items-center gap-2"><Gift className="w-4 h-4 text-amber-400" /> 5 free instant questions</span>
                            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> 24×7 Instant Answers</span>
                            <span className="flex items-center gap-2"><MessageCircleQuestion className="w-4 h-4 text-amber-400" /> English & Hindi</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <Link to="/ai-astrologer" className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-indigo-950 px-7 py-3.5 rounded-2xl font-bold transition-all hover:scale-105 shadow-xl shadow-amber-900/20 flex items-center gap-2">
                                <span>Try Free AI Astrologer</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link to="/astrologers" className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-7 py-3.5 rounded-2xl font-bold transition-all hover:scale-105">
                                Talk to Our Expert Astrologers
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AiAstrologerBanner;
