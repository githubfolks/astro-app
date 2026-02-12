import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Users, BookOpen, ChevronDown, LayoutDashboard, LogOut, User as UserIcon } from 'lucide-react';
import './Header.css';

import { useAuth } from '../context/AuthContext';

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setIsDropdownOpen(false);
        navigate('/');
    };

    const handleDashboard = () => {
        setIsDropdownOpen(false);
        navigate('/dashboard');
    };

    // Get display name
    const getDisplayName = () => {
        if (!user) return '';
        // Use full name (first name) if available, otherwise email prefix, or role fallback
        if (user.full_name) {
            return user.full_name.split(' ')[0];
        }
        return user.email?.split('@')[0] || (user.role === 'SEEKER' ? 'User' : 'Astrologer');
    };

    return (
        <header className="site-header">
            <div className="container header-content">
                <div className="logo-area">
                    <button className="mobile-menu-btn" onClick={toggleMenu}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <Link to="/" className="brand-logo">
                        <img src="/assets/logo.png" alt="Aadikarta" className="h-10 w-auto" />
                    </Link>
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
                    </ul>
                    <div className="mobile-actions">
                        {(!user || user.role !== 'ASTROLOGER') && (
                            <>
                                <Link to="/chat-with-astrologers" className="btn btn-primary chat-btn-mobile" onClick={() => setIsMenuOpen(false)}>Chat with Astrologer</Link>
                                <Link to="/join-as-astrologer" className="btn btn-outline-white chat-btn-mobile" style={{ marginTop: '10px' }} onClick={() => setIsMenuOpen(false)}>Join as Astrologer</Link>
                            </>
                        )}
                        {/* Mobile user menu */}
                        {user && (
                            <div className="mobile-user-menu" style={{ marginTop: '16px', padding: '16px', borderTop: '1px solid #eee' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                    <UserIcon size={20} />
                                    <span style={{ fontWeight: 600 }}>Hi, {getDisplayName()}</span>
                                </div>
                                <Link
                                    to="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: '#333' }}
                                >
                                    <LayoutDashboard size={18} /> Dashboard
                                </Link>
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                                >
                                    <LogOut size={18} /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                <div className="header-actions">
                    {(!user || user.role !== 'ASTROLOGER') && (
                        <div className="flex items-center gap-3">
                            <Link to="/join-as-astrologer" className="hidden lg:flex text-gray-700 hover:text-indigo-600 font-medium text-sm transition-colors">Join as Astrologer</Link>
                            <Link to="/chat-with-astrologers" className="btn btn-primary chat-btn">Chat with Astrologer</Link>
                        </div>
                    )}
                    {!user && (
                        <Link to="/login" className="btn btn-outline login-btn">Login</Link>
                    )}
                    {user && (
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-[#E91E63] hover:shadow-sm transition-all"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#E91E63] to-[#FF5722] flex items-center justify-center text-white font-bold text-sm">
                                    {getDisplayName()[0]?.toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-700 hidden md:inline">Hi, {getDisplayName()}</span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-900">{getDisplayName()}</p>
                                        <p className="text-xs text-gray-500">{user.role === 'SEEKER' ? 'Seeker' : 'Astrologer'}</p>
                                    </div>
                                    <button
                                        onClick={handleDashboard}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-sm text-left"
                                    >
                                        <LayoutDashboard size={18} className="text-gray-400" />
                                        Dashboard
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-sm text-left"
                                    >
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
