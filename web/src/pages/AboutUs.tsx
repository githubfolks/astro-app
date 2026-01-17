import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AboutUs: React.FC = () => {
    return (
        <div className="about-page">
            <Header />
            <div className="container" style={{ padding: '60px 20px', minHeight: '60vh', textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '20px', color: '#1A1A1A' }}>About Aadikarta</h1>
                <p style={{ maxWidth: '800px', margin: '0 auto', color: '#666', lineHeight: '1.8' }}>
                    Welcome to Aadikarta, India's most trusted astrology platform. We bridge the gap between ancient vedic wisdom and modern technology.
                    Our mission is to provide accurate, accessible, and personalized guidance to help you navigate life's journey with confidence.
                </p>
            </div>
            <Footer />
        </div>
    );
};

export default AboutUs;
