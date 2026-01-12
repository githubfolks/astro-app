import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Home, Users, BookOpen, Phone } from 'lucide-react';
import './Header.css';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header className="site-header">
            <div className="container header-content">
                <div className="logo-area">
                    <button className="mobile-menu-btn" onClick={toggleMenu}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <Link to="/" className="brand-logo">AstroApp</Link>
                </div>

                <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
                    <ul>
                        <li>
                            <Link to="/" onClick={() => setIsMenuOpen(false)}>
                                <Home size={18} /> Home
                            </Link>
                        </li>
                        <li>
                            <Link to="/about-us" onClick={() => setIsMenuOpen(false)}>
                                <Users size={18} /> About Us
                            </Link>
                        </li>
                        <li>
                            <Link to="/blog" onClick={() => setIsMenuOpen(false)}>
                                <BookOpen size={18} /> Blog
                            </Link>
                        </li>
                        <li>
                            <Link to="/contact-us" onClick={() => setIsMenuOpen(false)}>
                                <Phone size={18} /> Contact Us
                            </Link>
                        </li>
                    </ul>
                    <div className="mobile-actions">
                        <Link to="/chat-with-astrologers" className="btn btn-primary chat-btn-mobile" onClick={() => setIsMenuOpen(false)}>Chat with Astrologer</Link>
                    </div>
                </nav>

                <div className="header-actions">
                    <Link to="/chat-with-astrologers" className="btn btn-primary chat-btn">Chat with Astrologer</Link>
                    <Link to="/login" className="btn btn-outline login-btn">Login</Link>
                </div>
            </div>
        </header>
    );
};

export default Header;
