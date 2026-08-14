import React from 'react';
import { Link } from 'react-router-dom';
import { ScrollText, Zap, MessageSquare, ArrowRight, FileHeart, HeartHandshake, Briefcase } from 'lucide-react';
import './InstantReportsBanner.css';

const InstantReportsBanner: React.FC = () => {
    return (
        <section className="instant-reports-banner py-20 relative overflow-hidden">
            {/* Midnight celestial background, amber-led to differentiate from the AI Astrologer banner */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,#451a03,0%,#0f172a_100%)]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
            <div className="absolute -top-20 right-1/3 w-[400px] h-[400px] bg-amber-500/15 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="reports-banner-content flex flex-col lg:flex-row-reverse items-center gap-12 max-w-5xl mx-auto">
                    {/* Report icons visual */}
                    <div className="relative shrink-0" data-aos="zoom-in">
                        <div className="w-44 h-44 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-amber-400/30 via-orange-500/20 to-yellow-400/30 border border-white/20 backdrop-blur-xl flex items-center justify-center gap-2 shadow-[0_0_80px_rgba(251,191,36,0.15)]">
                            <FileHeart className="w-10 h-10 md:w-12 md:h-12 text-amber-300" />
                            <HeartHandshake className="w-10 h-10 md:w-12 md:h-12 text-amber-200" />
                            <Briefcase className="w-10 h-10 md:w-12 md:h-12 text-amber-300" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-indigo-950 text-xs font-extrabold px-4 py-1.5 rounded-full rotate-6 shadow-lg">
                            From ₹149
                        </div>
                    </div>

                    {/* Copy + CTA */}
                    <div className="text-center lg:text-left" data-aos="fade-right">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 mb-5">
                            <ScrollText className="w-4 h-4 text-amber-400" />
                            <span className="text-amber-200 text-xs font-bold tracking-widest uppercase">AI Instant Reports · No Login Needed</span>
                        </div>
                        <h2 className="reports-banner-title text-3xl md:text-4xl text-white mb-4 leading-tight">
                            Your Kundli, Ready in <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">Moments</span>
                        </h2>
                        <p className="reports-banner-description text-lg text-indigo-100/70 font-light mb-8 max-w-xl">
                            Get a detailed AI-synthesized Vedic report — Full Kundli, Gun Milan compatibility, or Career & Finance — delivered instantly as a web report and PDF. No wallet, no waiting.
                        </p>

                        <div className="reports-banner-features flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-2 text-indigo-100/80 text-sm mb-8">
                            <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" /> Delivered instantly</span>
                            <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-amber-400" /> WhatsApp delivery</span>
                        </div>

                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <Link to="/services/ai-instant-reports" className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-indigo-950 px-7 py-3.5 rounded-2xl font-bold transition-all hover:scale-105 shadow-xl shadow-amber-900/20 flex items-center gap-2">
                                <span>Get Your Instant Report</span>
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InstantReportsBanner;
