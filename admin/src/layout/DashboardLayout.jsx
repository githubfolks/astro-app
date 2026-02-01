import React from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, Star, FileText, LogOut, Menu, Files, Moon, Mail, ShieldCheck } from 'lucide-react';
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
        { text: 'Approvals', icon: <ShieldCheck size={20} />, path: '/astrologer-approvals' },
        { text: 'Content (Blog)', icon: <FileText size={20} />, path: '/cms/posts' },
        { text: 'Pages', icon: <Files size={20} />, path: '/cms/pages' },
        { text: 'Horoscopes', icon: <Moon size={20} />, path: '/cms/horoscopes' },
        { text: 'Inquiries', icon: <Mail size={20} />, path: '/cms/contact-inquiries' },
    ];

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <aside
                className={clsx(
                    "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
                    sidebarOpen ? "w-64" : "w-16"
                )}
            >
                <div className="h-16 flex items-center justify-center border-b border-gray-200">
                    {sidebarOpen ? (
                        <h1 className="text-xl font-bold text-indigo-600">Aadikarta</h1>
                    ) : (
                        <span className="text-xl font-bold text-indigo-600">A</span>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={clsx(
                                "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                location.pathname === item.path
                                    ? "bg-indigo-50 text-indigo-700"
                                    : "text-gray-700 hover:bg-gray-100",
                                !sidebarOpen && "justify-center"
                            )}
                            title={!sidebarOpen ? item.text : undefined}
                        >
                            {item.icon}
                            {sidebarOpen && <span className="ml-3">{item.text}</span>}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={handleLogout}
                        className={clsx(
                            "flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors",
                            !sidebarOpen && "justify-center"
                        )}
                        title={!sidebarOpen ? "Logout" : undefined}
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span className="ml-3">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
                    >
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-4">Admin</span>
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
