import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Wallet, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isNative } from '../utils/platform';

export const MobileNavBar: React.FC = () => {
    useAuth();
    const location = useLocation();

    // Hide on chat pages (full-screen chat experience)
    if (location.pathname.startsWith('/chat/')) return null;

    const chatPath = '/chat-with-astrologers';
    const walletPath = '/dashboard';
    const profilePath = '/dashboard';

    const navItems = [
        { name: 'Home', icon: Home, path: '/' },
        { name: 'Consult', icon: MessageCircle, path: chatPath },
        { name: 'Wallet', icon: Wallet, path: walletPath },
        { name: 'Profile', icon: UserIcon, path: profilePath },
    ];

    // On native: always show. On web: only show below md breakpoint (md:hidden)
    const containerClass = isNative()
        ? 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 z-50 mobile-bottom-nav'
        : 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 md:hidden z-50 pb-safe';

    return (
        <nav className={containerClass}>
            <div className="flex justify-around items-center">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 ${isActive
                                ? 'text-purple-600 scale-105'
                                : 'text-gray-500 hover:text-gray-900 active:scale-95'
                            }`
                        }
                    >
                        <item.icon size={24} strokeWidth={2} />
                        <span className="text-[10px] font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </nav>
    );
};
