import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AstrologerList from '../components/AstrologerList';
import SEO from '../components/SEO';

const AstrologersPage: React.FC = () => {
    return (
        <div className="astrologers-page pb-20 md:pb-0">
            <SEO
                title="Our Astrologers"
                description="Connect with India's best astrologers. Get guidance on career, marriage, health, and more from our verified experts."
            />
            <Header />
            <main id="main-content">
                <div className="page-content" style={{ minHeight: '60vh' }}>
                    <AstrologerList />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default AstrologersPage;
