import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Home } from 'lucide-react';
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
                    <button className="mobile-menu-btn" onClick={toggleMenu} aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <Link to="/" className="brand-logo" aria-label="Aadikarta Home">
                        <img src="/assets/logo.png" alt="Aadikarta" className="h-10 w-auto" width="160" height="40" />
                    </Link>
                </div>

                <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
                    <ul>
                        <li>
                            <Link to="/" onClick={() => setIsMenuOpen(false)}>
                                <Home size={18} /> Home
                            </Link>
                        </li>
                    </ul>
                </nav>

                <div className="header-actions">
                    {/* Actions removed for landing page only branch */}
                </div>
            </div>
        </header>
    );
};

export default Header;
