import React from 'react';
import Header from '../components/Header';
import Hero from '../components/Hero';
import Services from '../components/Services';
import HowItWorks from '../components/HowItWorks';
import AstrologerList from '../components/AstrologerList';
import Testimonials from '../components/Testimonials';
import Footer from '../components/Footer';

const Home: React.FC = () => {
    return (
        <div className="home-page pb-20 md:pb-0">
            <Header />
            <Hero />
            <HowItWorks />
            <AstrologerList limit={10} topRankingOnly={false} showFilters={true} />
            <Services />

            <section className="promise-section" style={{ textAlign: 'center' }}>
                <div className="container">
                    <div style={{ maxWidth: '600px', margin: '0 auto 0px' }}>
                        <h2 style={{ fontSize: '36px', color: '#1A1A1A', fontWeight: '800', marginTop: '10px' }}>
                            Our Promise to You
                        </h2>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginTop: '0px' }}>
                        <div style={{ padding: '30px', background: '#FFF9F0', borderRadius: '20px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '20px' }}>🔒</div>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>100% Privacy</h3>
                            <p style={{ color: '#666' }}>Your personal details and conversations are kept strictly confidential.</p>
                        </div>
                        <div style={{ padding: '30px', background: '#FFF9F0', borderRadius: '20px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '20px' }}>✅</div>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>Verified Astrologers</h3>
                            <p style={{ color: '#666' }}>Every astrologer undergoes a rigorous screening process for quality.</p>
                        </div>
                        <div style={{ padding: '30px', background: '#FFF9F0', borderRadius: '20px' }}>
                            <div style={{ fontSize: '40px', marginBottom: '20px' }}>💰</div>
                            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>Money Back Guarantee</h3>
                            <p style={{ color: '#666' }}>Not satisfied with your consultation? Get a full refund, no questions asked.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Testimonials />
            <Footer />
        </div>
    );
};

export default Home;
