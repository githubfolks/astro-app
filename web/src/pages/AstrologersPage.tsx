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
            <div className="container mx-auto px-4 mt-8">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Expert Astrologers</h1>
            </div>
            <div className="page-content" style={{ minHeight: '60vh' }}>
                <AstrologerList />
            </div>
            <Footer />
        </div>
    );
};

export default AstrologersPage;
