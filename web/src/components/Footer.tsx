import React, { useState, useEffect } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, ArrowUp } from 'lucide-react';
import './Footer.css';

const Footer: React.FC = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className="footer-section">
            <div className="container">
                <div className="footer-content">
                    {/* Left Column: Brand Info */}
                    <div className="footer-column brand-column">
                        <div className="footer-logo">
                            <img src="/assets/logo.png" alt="Aadikarta" className="h-12 w-auto" />
                        </div>
                        <p className="footer-desc">
                            Your trusted companion for astrological guidance.
                            Connecting you with India's best astrologers for a better tomorrow.
                        </p>
                        <div className="social-links">
                            <a href="https://www.facebook.com/aadikartaastro" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Facebook page"><Facebook size={20} /></a>
                            <a href="https://x.com/astro_aadikarta" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Twitter profile"><Twitter size={20} /></a>
                            <a href="https://www.instagram.com/astro_aadikarta/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Instagram profile"><Instagram size={20} /></a>
                            <a href="https://www.youtube.com/channel/UC1cAAmALtOOln2EJ3CLj5Bw" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our YouTube channel"><Youtube size={20} /></a>
                        </div>
                    </div>

                    {/* Right Column: Contact Only */}
                    <div className="footer-column info-column">
                        <div className="info-group">
                            <h4 className="footer-title">Contact Us</h4>
                            <ul className="contact-list">
                                <li>
                                    <Mail size={16} className="contact-icon" />
                                    support@aadikarta.org
                                </li>
                                <li>
                                    <Phone size={16} className="contact-icon" />
                                    +91 86503 54783
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 Aadikarta. All rights reserved.</p>
                </div>
            </div>

            {/* Scroll to Top Button */}
            <button
                className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
                onClick={scrollToTop}
                aria-label="Scroll to top"
            >
                <ArrowUp size={20} />
            </button>
        </footer>
    );
};

export default Footer;
