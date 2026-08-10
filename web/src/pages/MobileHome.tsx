import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Orbit } from 'lucide-react';
import Header from '../components/Header';
import AstrologerList from '../components/AstrologerList';
import Footer from '../components/Footer';
import MemoryGuruBanner from '../components/MemoryGuruBanner';
import HoroscopeSection from '../components/HoroscopeSection';
import PanchangSection from '../components/PanchangSection';

const MobileHome: React.FC = () => {
    return (
        <div className="home-page">
            <Header />
            <main id="main-content">
                <Link
                    to="/ai-astrologer"
                    className="mx-4 mt-4 mb-2 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-900 border border-amber-400/30 px-4 py-3 shadow-lg"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0">
                        <Orbit className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-white font-bold text-sm leading-tight">Ask Aadi, Your AI Astrologer</p>
                        <p className="text-indigo-200/70 text-xs">Get instant free AI chart insights on Kundli, Tarot, Love & Career</p>
                    </div>
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                </Link>

                <AstrologerList limit={6} topRankingOnly={false} showFilters={false} />
                <div className="text-center -mt-2 mb-2">
                    <Link to="/astrologers" className="text-indigo-600 font-semibold text-sm">
                        View All Astrologers →
                    </Link>
                </div>
                <MemoryGuruBanner />
                <HoroscopeSection />

                <section className="panchang-section relative overflow-hidden bg-gradient-to-b from-[#0f0927] to-[#03010b] py-8 px-4">
                    <PanchangSection />
                </section>
            </main>

            <Footer />
        </div>
    );
};

export default MobileHome;
