import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet } from './Wallet';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <nav className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                        AstroApp
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    {user?.role === 'SEEKER' && <Wallet />}

                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <div className="font-medium text-gray-200">User ID: {user?.id}</div>
                            <div className="text-xs text-purple-400 uppercase">{user?.role}</div>
                        </div>
                        <div className="bg-purple-600 p-2 rounded-full">
                            <User size={20} />
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-gray-700 hover:bg-red-600 p-2 rounded-lg transition-colors"
                        >
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto p-6">
                {children}
            </main>
        </div>
    );
};
