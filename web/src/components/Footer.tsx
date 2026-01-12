import React from 'react';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone } from 'lucide-react';
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
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Our Astrologers</a></li>
                            <li><a href="#">Blog</a></li>
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">Join as Astrologer</a></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h4 className="footer-title">Services</h4>
                        <ul className="footer-links">
                            <li><a href="#">Horoscope</a></li>
                            <li><a href="#">Kundli Matching</a></li>
                            <li><a href="#">Tarot Reading</a></li>
                            <li><a href="#">Vastu Shastra</a></li>
                            <li><a href="#">Numerology</a></li>
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
                        <a href="#">Privacy Policy</a>
                        <a href="#">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
