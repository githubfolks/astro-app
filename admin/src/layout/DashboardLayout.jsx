import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import { LayoutDashboard, Users, Star, FileText, LogOut, Menu, Files, Moon, DollarSign, Mail, ShieldCheck, GraduationCap, AlertCircle, AlertTriangle, Settings, Video, ListVideo } from 'lucide-react';

import { Button } from '../components/ui/Button';
import clsx from 'clsx';

export default function DashboardLayout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = React.useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const menuItems = [
        { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
        { text: 'Users', icon: <Users size={20} />, path: '/users' },
        { text: 'Astrologers', icon: <Star size={20} />, path: '/astrologers' },
        { text: 'Onboarding', icon: <ShieldCheck size={20} />, path: '/astrologer-onboarding' },
        { text: 'Payouts', icon: <DollarSign size={20} />, path: '/payouts' },
        { text: 'Content (Blog)', icon: <FileText size={20} />, path: '/cms/posts' },
        { text: 'Content Studio', icon: <Video size={20} />, path: '/content-studio' },
        { text: 'Content Library', icon: <ListVideo size={20} />, path: '/content-studio/library' },
        { text: 'Edu Reports', icon: <GraduationCap size={20} />, path: '/edu-reports' },

        { text: 'Disputes', icon: <AlertCircle size={20} />, path: '/disputes' },
        { text: 'Moderation', icon: <AlertTriangle size={20} />, path: '/moderation' },
        { text: 'Inquiries', icon: <Mail size={20} />, path: '/cms/contact-inquiries' },
        { text: 'Settings', icon: <Settings size={20} />, path: '/settings' },

    ];

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "bg-slate-100 border-r border-slate-200 transition-all duration-300 flex flex-col",
                    sidebarOpen ? "w-64" : "w-16"
                )}
            >
                <div className="h-16 flex items-center justify-center border-b border-slate-200">
                    {sidebarOpen ? (
                        <h1 className="text-xl font-bold text-orange-600">Aadikarta</h1>
                    ) : (
                        <span className="text-xl font-bold text-orange-600">A</span>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={clsx(
                                "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
                                location.pathname === item.path
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-900 hover:bg-slate-200 hover:text-slate-900",
                                !sidebarOpen && "justify-center"
                            )}
                            title={!sidebarOpen ? item.text : undefined}
                        >
                            <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                                {item.icon}
                            </span>
                            {sidebarOpen && <span className="ml-3">{item.text}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={handleLogout}
                        className={clsx(
                            "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors cursor-pointer",
                            !sidebarOpen && "justify-center"
                        )}
                        title={!sidebarOpen ? "Logout" : undefined}
                    >
                        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            <LogOut size={20} />
                        </span>
                        {sidebarOpen && <span className="ml-3">Logout</span>}
                    </button>
                </div>

            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-md text-gray-900 hover:bg-gray-100 focus:outline-none"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center">
                        <span className="text-sm text-gray-900 mr-4">Admin</span>
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                            A
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
