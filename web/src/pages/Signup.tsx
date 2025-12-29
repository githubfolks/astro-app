import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Mail, Phone } from 'lucide-react';

export const Signup: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        phone_number: '',
        password: '',
        role: 'SEEKER'
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            const data = await api.auth.signup(formData);
            login(data.access_token, { id: data.user_id, role: data.role, email: '', phone_number: '' });
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white relative overflow-hidden">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md z-10 border border-gray-700">
                <h2 className="text-3xl font-bold text-center mb-2 text-purple-400">Join InstaAstro</h2>
                <p className="text-gray-400 text-center mb-8">Start your spiritual journey today</p>

                {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="relative">
                        <Mail className="absolute top-3 left-3 text-gray-500" size={20} />
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <Phone className="absolute top-3 left-3 text-gray-500" size={20} />
                        <input
                            type="text"
                            placeholder="Phone Number"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    <div className="relative">
                        <Lock className="absolute top-3 left-3 text-gray-500" size={20} />
                        <input
                            type="password"
                            placeholder="Password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-4 focus:outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>

                    <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="role"
                                value="SEEKER"
                                checked={formData.role === 'SEEKER'}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="hidden"
                            />
                            <div className={`p-3 rounded-lg border text-center ${formData.role === 'SEEKER' ? 'bg-purple-600 border-purple-600' : 'bg-gray-900 border-gray-700 hover:border-gray-600'}`}>
                                Seeker
                            </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="role"
                                value="ASTROLOGER"
                                checked={formData.role === 'ASTROLOGER'}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="hidden"
                            />
                            <div className={`p-3 rounded-lg border text-center ${formData.role === 'ASTROLOGER' ? 'bg-purple-600 border-purple-600' : 'bg-gray-900 border-gray-700 hover:border-gray-600'}`}>
                                Astrologer
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 rounded-lg transition-all transform hover:scale-[1.02]"
                    >
                        Create Account
                    </button>
                </form>

                <p className="mt-6 text-center text-gray-400">
                    Already have an account?{' '}
                    <Link to="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
};
