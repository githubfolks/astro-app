import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

const Hero: React.FC = () => {
    return (
        <section className="hero-section spiritual-bg overflow-hidden relative min-h-screen lg:min-h-[640px] flex items-center">
            <div className="container hero-content relative z-10 py-2">
                <div className="hero-text">
                    <h1 className="hero-title mt-2">
                        Unlock Your
                        <span className="gradient-text block mt-2"> Cosmic Destiny</span>
                    </h1>
                    <p className="hero-description text-indigo-100 text-xl mt-6 opacity-90 leading-relaxed">
                        Connect with expert astrologers, get accurate horoscopes, and find guidance for your life's journey. Your future awaits.
                    </p>
                    <div className="hero-actions mt-10 flex flex-wrap gap-4">
                        <Link to="/chat-with-astrologers" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105 shadow-xl shadow-indigo-900/20">Chat with Astrologer</Link>
                        <Link to="/memory-guru" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-2xl font-bold transition-all hover:scale-105">Memory Guru</Link>
                    </div>
                </div>

                <div className="hero-image-container relative">
                    <div className="absolute inset-0 bg-indigo-500/10 blur-[100px] rounded-full"></div>
                    <img
                        src="/assets/hero_astrology.png"
                        alt="Indian Mythological Astrology"
                        className="hero-image relative z-10 rounded-[3rem] shadow-2xl border-4 border-white/10"
                        fetchPriority="high"
                        loading="eager"
                        width="800"
                        height="600"
                    />
                    <div className="floating-card absolute -right-6 top-1/4 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl z-20 flex items-center gap-4 animate-bounce-slow">
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
