import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Users, BookOpen, ChevronDown, LayoutDashboard, LogOut, User as UserIcon, ArrowLeft, Info, Star, HelpCircle, Briefcase, Phone, Sparkles } from 'lucide-react';
import './Header.css';

import { useAuth } from '../context/AuthContext';
import { isNative } from '../utils/platform';
import { getPageTitle } from '../utils/pageTitles';
import { SERVICES_LIST, ASTROLOGER_TOOLS_LIST } from '../data/servicesList';

const NATIVE_TAB_ROOTS = ['/', '/astrologers', '/dashboard'];

const NativeDrawer: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const getDisplayName = () => {
        if (!user) return '';
        if (user.full_name) return user.full_name.split(' ')[0];
        return user.email?.split('@')[0] || (user.role === 'SEEKER' ? 'User' : user.role === 'TUTOR' ? 'Tutor' : 'Astrologer');
    };

    const go = (path: string) => {
        onClose();
        navigate(path);
    };

    const handleLogout = () => {
        logout();
        onClose();
        navigate('/');
    };

    return createPortal(
        <div className="native-drawer-backdrop" onClick={onClose}>
            <div className="native-drawer-panel" onClick={(e) => e.stopPropagation()}>
                <div className="native-drawer-header">
                    {user ? (
                        <button className="native-drawer-user" onClick={() => go('/dashboard')}>
                            <div className="native-drawer-avatar">{getDisplayName()[0]?.toUpperCase()}</div>
                            <div>
                                <p className="native-drawer-user-name">{getDisplayName()}</p>
                                <p className="native-drawer-user-role">
                                    {user.role === 'SEEKER' ? 'Seeker' : user.role === 'TUTOR' ? 'Tutor' : 'Astrologer'}
                                </p>
                            </div>
                        </button>
                    ) : (
                        <button className="native-drawer-user" onClick={() => go('/login')}>
                            <div className="native-drawer-avatar"><UserIcon size={18} /></div>
                            <p className="native-drawer-user-name">Login</p>
                        </button>
                    )}
                    <button className="native-drawer-close" onClick={onClose} aria-label="Close menu">
                        <X size={20} />
                    </button>
                </div>

                <nav className="native-drawer-nav">
                    <button onClick={() => go('/about-us')}><Info size={18} /> About Us</button>
                    <button onClick={() => go('/blog')}><BookOpen size={18} /> Blog</button>
                    <button onClick={() => go('/contact-us')}><Phone size={18} /> Contact Us</button>
                    {user?.role === 'ASTROLOGER' ? (
                        <>
                            <div className="native-drawer-section-label"><Sparkles size={14} /> Tools</div>
                            {ASTROLOGER_TOOLS_LIST.map((tool) => (
                                <button key={tool.to} onClick={() => go(tool.to)} className="native-drawer-subitem">{tool.title}</button>
                            ))}
                        </>
                    ) : (
                        <>
                            <button onClick={() => go('/astrologers')}><Star size={18} /> Our Astrologers</button>
                            <button onClick={() => go('/how-it-works')}><HelpCircle size={18} /> How It Works</button>
                            <button onClick={() => go('/join-as-astrologer')}><Briefcase size={18} /> Join as Astrologer</button>
                            <div className="native-drawer-section-label"><Sparkles size={14} /> Services</div>
                            {SERVICES_LIST.map((service) => (
                                <button key={service.to} onClick={() => go(service.to)} className="native-drawer-subitem">{service.title}</button>
                            ))}
                        </>
                    )}
                </nav>

                <div className="native-drawer-legal">
                    <button onClick={() => go('/privacy-policy')}>Privacy Policy</button>
                    <button onClick={() => go('/terms-of-service')}>Terms of Service</button>
                    <button onClick={() => go('/refund-policy')}>Refund Policy</button>
                    <button onClick={() => go('/disclaimer')}>Disclaimer</button>
                </div>

                {user && (
                    <button className="native-drawer-logout" onClick={handleLogout}>
                        <LogOut size={18} /> Logout
                    </button>
                )}
            </div>
        </div>,
        document.body
    );
};

const NativeAppBar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const showBack = !NATIVE_TAB_ROOTS.includes(location.pathname);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    return (
        <header className="native-app-bar">
            <div className="native-app-bar-content">
                {showBack ? (
                    <button
                        className="native-app-bar-back"
                        onClick={() => navigate(-1)}
                        aria-label="Go back"
                    >
                        <ArrowLeft size={22} />
                    </button>
                ) : (
                    <span className="native-app-bar-spacer" />
                )}
                <span className="native-app-bar-title">{getPageTitle(location.pathname)}</span>
                <button
                    className="native-app-bar-menu"
                    onClick={() => setIsDrawerOpen(true)}
                    aria-label="Open menu"
                >
                    <Menu size={22} />
                </button>
            </div>
            {isDrawerOpen && <NativeDrawer onClose={() => setIsDrawerOpen(false)} />}
        </header>
    );
};

const Header: React.FC = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isServicesOpen, setIsServicesOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const servicesRef = useRef<HTMLLIElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
            if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
                setIsServicesOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (isNative()) {
        return <NativeAppBar />;
    }

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

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
        return user.email?.split('@')[0] || (user.role === 'SEEKER' ? 'User' : user.role === 'TUTOR' ? 'Tutor' : 'Astrologer');
    };

    return (
        <header className="site-header">
            <div className="container header-content">
                <div className="logo-area">
                    <button className="mobile-menu-btn" onClick={toggleMenu} aria-label={isMenuOpen ? "Close menu" : "Open menu"}>
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <Link to="/" className="brand-logo" aria-label="Aadikarta Vedic Astrology Home">
                        <img src="/assets/logo.webp" alt="Aadikarta Vedic Astrology" className="h-20 w-auto" width="146" height="80" />
                    </Link>
                </div>

                <nav className={`main-nav ${isMenuOpen ? 'open' : ''}`}>
                    <ul>
                        <li>
                            <Link to={user?.role === 'ASTROLOGER' ? '/dashboard' : '/'} onClick={() => setIsMenuOpen(false)}>
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
                        <li className="services-dropdown-wrapper" ref={servicesRef}>
                            <button
                                type="button"
                                className="services-dropdown-trigger"
                                onClick={() => setIsServicesOpen((open) => !open)}
                                aria-expanded={isServicesOpen}
                            >
                                <Sparkles size={18} /> {user?.role === 'ASTROLOGER' ? 'Tools' : 'Services'}
                                <ChevronDown size={14} className={`services-dropdown-chevron ${isServicesOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isServicesOpen && (
                                <div className="services-dropdown-panel">
                                    {(user?.role === 'ASTROLOGER' ? ASTROLOGER_TOOLS_LIST : SERVICES_LIST).map((service) => (
                                        <Link
                                            key={service.to}
                                            to={service.to}
                                            onClick={() => { setIsServicesOpen(false); setIsMenuOpen(false); }}
                                        >
                                            {service.title}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </li>
                    </ul>
                    <div className="mobile-actions">
                        {(!user || user.role !== 'ASTROLOGER') && (
                            <>
                                <Link to="/astrologers" className="btn btn-primary chat-btn-mobile" onClick={() => setIsMenuOpen(false)}>Chat with Astrologer</Link>
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
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', padding: '8px 0', color: '#333', width: '100%' }}
                                >
                                    <LayoutDashboard size={18} /> Dashboard
                                </Link>
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', padding: '8px 0', color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
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
                            <Link to="/astrologers" className="btn btn-primary chat-btn">Chat with Astrologer</Link>
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
                                <ChevronDown size={16} className={`text-gray-900 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-fade-in">
                                    <div className="px-4 py-2 border-b border-gray-100">
                                        <p className="text-sm font-semibold text-gray-900">{getDisplayName()}</p>
                                        <p className="text-xs text-gray-900">
                                            {user.role === 'SEEKER' ? 'Seeker' : user.role === 'TUTOR' ? 'Tutor' : 'Astrologer'}
                                        </p>
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
