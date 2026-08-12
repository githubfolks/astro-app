import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Hero from '../components/Hero';
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
                <Hero />

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
