import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
    return (
        <footer className="footer-section">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-column brand-column">
                        <div className="footer-logo">
                            <span style={{ fontSize: '24px', marginRight: '8px' }}>✨</span>
                            AstroApp
                        </div>
                        <p className="footer-desc">
                            Your trusted companion for astrological guidance.
                            Connecting you with India's best astrologers for a better tomorrow.
                        </p>
                        <div className="social-links">
                            <a href="#" className="social-link"><Facebook size={20} /></a>
                            <a href="#" className="social-link"><Twitter size={20} /></a>
                            <a href="#" className="social-link"><Instagram size={20} /></a>
                            <a href="#" className="social-link"><Youtube size={20} /></a>
                        </div>
                    </div>

                    <div className="footer-column">
                        <h4 className="footer-title">Quick Links</h4>
                        <ul className="footer-links">
                            <li><Link to="/about-us">About Us</Link></li>
                            <li><Link to="/chat-with-astrologers">Our Astrologers</Link></li>
                            <li><Link to="/blog">Blog</Link></li>
                            <li><Link to="/contact-us">Contact Us</Link></li>
                            {/* <li><Link to="/join">Join as Astrologer</Link></li> */}
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4 className="footer-title">Services</h4>
                        <ul className="footer-links">
                            <li><Link to="/horoscopes">Horoscope</Link></li>
                            <li><Link to="/kundli">Kundli Matching</Link></li>
                            <li><Link to="/tarot">Tarot Reading</Link></li>
                            <li><Link to="/vastu">Vastu Shastra</Link></li>
                            <li><Link to="/numerology">Numerology</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column contact-column">
                        <h4 className="footer-title">Contact Us</h4>
                        <ul className="contact-list">
                            <li>
                                <Mail size={16} className="contact-icon" />
                                support@astroapp.com
                            </li>
                            <li>
                                <Phone size={16} className="contact-icon" />
                                +91 98765 43210
                            </li>
                            <li>
                                <MapPin size={16} className="contact-icon" />
                                123 Cosmic Way, Galaxy Tower,
                                Mumbai, India
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>&copy; 2026 AstroApp. All rights reserved.</p>
                    <div className="footer-legal">
                        <Link to="/privacy-policy">Privacy Policy</Link>
                        <Link to="/terms-of-service">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
