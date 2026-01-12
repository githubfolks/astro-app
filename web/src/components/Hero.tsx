import React from 'react';
import './Hero.css';
import { Link } from 'react-router-dom';

const Hero: React.FC = () => {
    return (
        <section className="hero-section">
            {/* Background elements */}
            <div className="hero-bg-overlay"></div>
            <div className="hero-decor decor-orb-1"></div>
            <div className="hero-decor decor-orb-2"></div>

            <div className="container hero-content">
                <div className="hero-text">
                    <span className="hero-badge">✨ India's #1 Astrology Platform</span>
                    <h1 className="hero-title">
                        Unlock Your
                        <span className="text-highlight"> Cosmic Destiny</span>
                    </h1>
                    <p className="hero-description">
                        Connect with expert astrologers, get accurate horoscopes, and find guidance for your life's journey. Your future awaits.
                    </p>
                    <div className="hero-actions">
                        <Link to="/chat-with-astrologers" className="btn btn-primary hero-btn">Chat with Astrologer</Link>
                        <Link to="/blog" className="btn btn-primary hero-btn">View Daily Horoscope</Link>
                    </div>

                    <div className="hero-stats">
                        <div className="stat-item">
                            <span className="stat-value">500+</span>
                            <span className="stat-label">Verified Experts</span>
                        </div>
                        <div className="stat-separator"></div>
                        <div className="stat-item">
                            <span className="stat-value">1M+</span>
                            <span className="stat-label">Happy Users</span>
                        </div>
                        <div className="stat-separator"></div>
                        <div className="stat-item">
                            <span className="stat-value">24/7</span>
                            <span className="stat-label">Live Support</span>
                        </div>
                    </div>
                </div>

                <div className="hero-image-container">
                    <img
                        src="https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                        alt="Astrology Consultation"
                        className="hero-image"
                    />
                    <div className="floating-card card-1">
                        <span className="icon">🌟</span>
                        <div className="text">
                            <strong>Daily Insights</strong>
                            <span>Updated now</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
