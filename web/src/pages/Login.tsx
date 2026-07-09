import { getErrorMessage } from '../utils/errors';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './Auth.css';

export const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const justVerified = location.state?.verified === true;
    const [isLoading, setIsLoading] = useState(false);
    const [savePassword, setSavePassword] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('saved_username');
        const savedPass = localStorage.getItem('saved_password');
        if (savedUser && savedPass) {
            setUsername(savedUser);
            setPassword(savedPass);
            setSavePassword(true);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            setError('');
            const data = await api.auth.login(username, password);

            if (savePassword) {
                localStorage.setItem('saved_username', username);
                localStorage.setItem('saved_password', password);
            } else {
                localStorage.removeItem('saved_username');
                localStorage.removeItem('saved_password');
            }

            // Normalize role to handle potential casing/whitespace issues
            const role = data.role ? String(data.role).trim().toUpperCase() : 'SEEKER';


            // Pass normalized role to AuthContext
            login(data.access_token, {
                id: data.user_id,
                role: role as 'SEEKER' | 'ASTROLOGER' | 'ADMIN' | 'TUTOR',
                email: '',
                phone_number: '',
                full_name: data.full_name
            });

            if (role === 'ASTROLOGER') {
                navigate('/dashboard');
            } else {
                navigate('/');
            }
        } catch (err) {
            setError(getErrorMessage(err) || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="auth-container">
            <Link to="/" className="back-to-home-link">
                <ArrowLeft size={20} /> Back to Home
            </Link>
            <div className="decor-circle decor-1"></div>
            <div className="decor-circle decor-2"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <h2 className="auth-title">Welcome Back</h2>
                    <p className="auth-subtitle">Login to continue your cosmic journey</p>
                </div>

                {justVerified && !error && <div className="info-banner">Email verified! You can now log in.</div>}
                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form" autoComplete="on">
                    <div className="form-group">
                        <input
                            type="text"
                            name="username"
                            autoComplete="username"
                            placeholder="Email or Phone"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                            <label className="remember-me-container">
                                <input
                                    type="checkbox"
                                    checked={savePassword}
                                    onChange={(e) => setSavePassword(e.target.checked)}
                                    disabled={isLoading}
                                />
                                Save password
                            </label>
                            <Link to="/forgot-password" className="auth-link" style={{ fontSize: '0.9rem' }}>Forgot Password?</Link>
                        </div>
                    </div>

                    <button type="submit" className="auth-btn" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Don't have an account?
                        <Link to="/signup" className="auth-link">Sign up</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

