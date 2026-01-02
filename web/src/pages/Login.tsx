import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Moon, Star } from 'lucide-react';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            const data = await api.auth.login(username, password);
            login(data.access_token, { id: data.user_id, role: data.role, email: '', phone_number: '' }); // Simplified user obj
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 text-purple-500 opacity-20 transform -translate-x-1/2 -translate-y-1/2">
                <Moon size={300} />
            </div>
            <div className="absolute bottom-0 right-0 text-yellow-500 opacity-20 transform translate-x-1/2 translate-y-1/2">
                <Star size={300} />
            </div>

            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 border border-gray-700">
                <h2 className="text-3xl font-bold text-center mb-2 text-purple-400">Welcome Back</h2>
                <p className="text-gray-400 text-center mb-8">Login to continue your cosmic journey</p>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <Mail className="absolute top-3 left-3 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Email or Phone"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute top-3 left-3 text-gray-500" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02]"
                    >
                        Login
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-purple-400 hover:text-purple-300 font-semibold">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
};
