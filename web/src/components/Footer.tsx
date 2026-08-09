import React, { useState, useEffect } from 'react';
import { Facebook, Twitter, Instagram, Youtube, Linkedin, Mail, Phone, ArrowUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSupportContact } from '../hooks/useSupportContact';
import { isNative } from '../utils/platform';
import { useAuth } from '../context/AuthContext';
import './Footer.css';

const NativeFooter: React.FC = () => (
    <footer className="footer-section native-footer">
        <div className="container">
            <div className="footer-logo">
                <img src="/assets/logo.webp" alt="Aadikarta Vedic Astrology" className="h-12 w-auto" width="160" height="48" />
            </div>
            <div className="social-links">
                <a href="https://www.facebook.com/astroaadikarta" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Facebook page"><Facebook size={20} /></a>
                <a href="https://x.com/astro_aadikarta" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Twitter profile"><Twitter size={20} /></a>
                <a href="https://www.instagram.com/astro_aadikarta/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Instagram profile"><Instagram size={20} /></a>
                <a href="https://www.youtube.com/@astro-aadikarta" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our YouTube channel"><Youtube size={20} /></a>
                <a href="https://www.linkedin.com/in/aadikarta-vedic-astrology" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our LinkedIn profile"><Linkedin size={20} /></a>
            </div>
            <div className="footer-bottom">
                <p>&copy; 2026 Aadikarta Vedic Astrology. All rights reserved.</p>
                <div className="footer-legal">
                    <Link to="/privacy-policy">Privacy Policy</Link>
                    <Link to="/refund-policy">Refund Policy</Link>
                    <Link to="/terms-of-service">Terms of Service</Link>
                </div>
            </div>
        </div>
    </footer>
);

const Footer: React.FC = () => {
    const [showScrollTop, setShowScrollTop] = useState(false);
    const { support_email, support_phone } = useSupportContact();
    const { user } = useAuth();
    const isAstrologer = user?.role === 'ASTROLOGER';

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

    if (isNative()) {
        return <NativeFooter />;
    }

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <footer className="footer-section">
            <div className="container">
                <div className={`footer-content ${isAstrologer ? 'footer-content-compact' : ''}`}>
                    {/* Left Column: Brand Info */}
                    <div className="footer-column brand-column">
                        <div className="footer-logo">
                            <img src="/assets/logo.webp" alt="Aadikarta Vedic Astrology" className="h-12 w-auto" width="160" height="48" />
                        </div>
                        <p className="footer-desc">
                            Your trusted companion for astrological guidance.
                            Connecting you with India's best astrologers for a better tomorrow.
                        </p>
                        <div className="social-links">
                            <a href="https://www.facebook.com/astroaadikarta" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Facebook page"><Facebook size={20} /></a>
                            <a href="https://x.com/astro_aadikarta" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Twitter profile"><Twitter size={20} /></a>
                            <a href="https://www.instagram.com/astro_aadikarta/" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our Instagram profile"><Instagram size={20} /></a>
                            <a href="https://www.youtube.com/@astro-aadikarta" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our YouTube channel"><Youtube size={20} /></a>
                            <a href="https://www.linkedin.com/in/aadikarta-vedic-astrology" target="_blank" rel="noopener noreferrer" className="social-link" aria-label="Visit our LinkedIn profile"><Linkedin size={20} /></a>
                        </div>
                    </div>

                    {/* Services Column — seeker-facing services, not relevant once you're an astrologer on the platform */}
                    {!isAstrologer && (
                        <div className="footer-column">
                            <div className="info-group">
                                <h4 className="footer-title">Services</h4>
                                <ul className="footer-links">
                                    <li><Link to="/ai-astrologer" onClick={scrollToTop}>Free AI Astrologer</Link></li>
                                    <li><Link to="/services/horoscope" onClick={scrollToTop}>Free Daily Horoscope</Link></li>
                                    <li><Link to="/panchang" onClick={scrollToTop}>Free Panchang</Link></li>
                                    <li><Link to="/tools/kundli-chart" onClick={scrollToTop}>Free Kundli Generator</Link></li>
                                    <li><Link to="/tools/kundli-matching" onClick={scrollToTop}>Free Kundli Matching</Link></li>
                                    <li><Link to="/services/vedic-astrology" onClick={scrollToTop}>Vedic Astrology</Link></li>
                                    <li><Link to="/services/tarot-reading" onClick={scrollToTop}>Tarot Reading</Link></li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Company Column */}
                    <div className="footer-column">
                        <div className="info-group">
                            <h4 className="footer-title">Company</h4>
                            <ul className="footer-links">
                                <li><Link to="/about-us" onClick={scrollToTop}>About Us</Link></li>
                                <li><Link to="/blog" onClick={scrollToTop}>Blog</Link></li>
                                {!isAstrologer && <li><Link to="/astrologers" onClick={scrollToTop}>Our Astrologers</Link></li>}
                                {!isAstrologer && <li><Link to="/pricing" onClick={scrollToTop}>Pricing</Link></li>}
                                {!isAstrologer && <li><Link to="/how-it-works" onClick={scrollToTop}>How It Works</Link></li>}
                                {!isAstrologer && <li><Link to="/join-as-astrologer" onClick={scrollToTop}>Join as Astrologer</Link></li>}
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
                                    {support_email}
                                </li>
                                {support_phone && (
                                    <li>
                                        <Phone size={16} className="contact-icon" />
                                        {support_phone}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="footer-disclaimer">
                    <p>
                        Aadikarta.org is a private limited company specializing in Vedic services and is not associated with any public figures or other entities sharing a similar name.
                    </p>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 Aadikarta Vedic Astrology. All rights reserved.</p>
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
