import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const Blog: React.FC = () => {
    return (
        <div className="blog-page">
            <Header />
            <div className="container" style={{ padding: '60px 20px', minHeight: '60vh' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '40px', textAlign: 'center', color: '#1A1A1A' }}>AstroApp Blog</h1>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                    {[1, 2, 3].map((post) => (
                        <div key={post} style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <div style={{ height: '200px', background: '#eee' }}></div>
                            <div style={{ padding: '20px' }}>
                                <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>Understanding Vedic Astrology</h3>
                                <p style={{ fontSize: '14px', color: '#666' }}>Discover the ancient wisdom of the stars and how they influence your daily life.</p>
                                <button style={{ marginTop: '15px', color: '#FFB700', fontWeight: '600', border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>Read More &rarr;</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Blog;
