import React, { useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import SEO from '../components/SEO';

const ComingSoon: React.FC = () => {
    useEffect(() => {
        AOS.init({
            duration: 1000,
            once: true,
        });
    }, []);

    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center text-white bg-[#0f172a]">
            <SEO
                title="Coming Soon | Aadikarta - Ancient Wisdom for Modern Life"
                description="We are bringing something sacred and transformative. Aadikarta is coming soon to guide your spiritual journey."
            />

            {/* Celestial Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#1e1b4b,0%,#0f172a_100%)]"></div>
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30"></div>

            {/* Ambient Glows */}
            <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute -bottom-20 -left-20 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <main className="relative z-10 w-full max-w-6xl mx-auto px-6 py-20 flex flex-col md:flex-row items-center justify-between gap-12">

                {/* Text Content */}
                <div className="flex-1 text-center md:text-left" data-aos="fade-right">
                    <div>
                        <span className="inline-block px-4 py-1.5 mb-6 text-sm font-medium tracking-widest uppercase border border-amber-400/30 text-amber-400 bg-amber-400/5 rounded-full backdrop-blur-sm">
                            Opening Soon
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
                            Bringing <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">Ancient Wisdom</span> to Modern Life
                        </h1>
                        <p className="text-xl md:text-2xl text-indigo-100/70 mb-12 font-light leading-relaxed max-w-xl">
                            Unlock the secrets of Vedic astrology and spiritual mastery. We are crafting a sanctuary for seekers, coming very soon.
                        </p>
                    </div>
                </div>

                {/* Hero Image */}
                <div
                    className="flex-1 relative"
                    data-aos="zoom-in"
                    data-aos-delay="200"
                >
                    <div className="relative z-10">
                        <img
                            src="/assets/hero_astrology.png"
                            alt="Ancient Wisdom"
                            className="w-full h-auto drop-shadow-[0_0_50px_rgba(245,158,11,0.2)] animate-float"
                        />
                    </div>

                    {/* Decorative Elements */}
                    <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/20 to-transparent blur-3xl -z-10 rounded-full"></div>
                </div>
            </main>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
                <div className="w-1 h-12 rounded-full bg-gradient-to-b from-amber-400/50 to-transparent"></div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}} />
        </div>
    );
};

export default ComingSoon;
