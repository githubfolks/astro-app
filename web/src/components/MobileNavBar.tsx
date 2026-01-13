import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, Wallet, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const MobileNavBar: React.FC = () => {
    useAuth();

    // Determine path based on role or default
    const chatPath = '/chat-with-astrologers';
    const walletPath = '/dashboard'; // Or a dedicated wallet page if it exists
    const profilePath = '/dashboard';

    const navItems = [
        { name: 'Home', icon: Home, path: '/' },
        { name: 'Consult', icon: MessageCircle, path: chatPath },
        // Only show Wallet/Profile if logged in? Or show login prompt?
        // For now, let's show them and auth guard will handle redirect if clicked
        { name: 'Wallet', icon: Wallet, path: walletPath },
        { name: 'Profile', icon: UserIcon, path: profilePath },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 md:hidden z-50 pb-safe">
            <div className="flex justify-around items-center">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${isActive
                                ? 'text-purple-600'
                                : 'text-gray-500 hover:text-gray-900'
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
