import React, { useState, useEffect } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, Phone, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
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
                            <img src="/assets/logo.png" alt="Aadikarta" className="h-12 w-auto" width="160" height="48" />
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

                    {/* Services Column */}
                    <div className="footer-column">
                        <div className="info-group">
                            <h4 className="footer-title">Services</h4>
                            <ul className="footer-links">
                                <li><Link to="/services/vedic-astrology" onClick={scrollToTop}>Vedic Astrology</Link></li>
                                <li><Link to="/services/kundli-matching" onClick={scrollToTop}>Kundli Matching</Link></li>
                                <li><Link to="/services/tarot-reading" onClick={scrollToTop}>Tarot Reading</Link></li>
                                <li><Link to="/services/love-advice" onClick={scrollToTop}>Love Advice</Link></li>
                                <li><Link to="/services/daily-horoscope" onClick={scrollToTop}>Daily Horoscope</Link></li>
                                <li><Link to="/services/vastu-shastra" onClick={scrollToTop}>Vastu Shastra</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Company Column */}
                    <div className="footer-column">
                        <div className="info-group">
                            <h4 className="footer-title">Company</h4>
                            <ul className="footer-links">
                                <li><Link to="/about-us" onClick={scrollToTop}>About Us</Link></li>
                                <li><Link to="/astrologers" onClick={scrollToTop}>Our Astrologers</Link></li>
                                <li><Link to="/blog" onClick={scrollToTop}>Blog</Link></li>
                                <li><Link to="/how-it-works" onClick={scrollToTop}>How It Works</Link></li>
                                <li><Link to="/join-as-astrologer" onClick={scrollToTop}>Join as Astrologer</Link></li>
                                <li><Link to="/contact-us" onClick={scrollToTop}>Contact Us</Link></li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact Us Column */}
                    <div className="footer-column">
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
                    <div className="footer-legal">
                        <Link to="/privacy-policy" onClick={scrollToTop}>Privacy Policy</Link>
                        <Link to="/refund-policy" onClick={scrollToTop}>Refund Policy</Link>
                        <Link to="/disclaimer" onClick={scrollToTop}>Disclaimer</Link>
                        <Link to="/terms-of-service" onClick={scrollToTop}>Terms of Service</Link>
                    </div>
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
