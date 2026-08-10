import { getErrorMessage } from '../utils/errors';
import { getPasswordError, PASSWORD_REQUIREMENTS } from '../utils/password';
import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PasswordInput from '../components/PasswordInput';
import SocialLoginButtons from '../components/SocialLoginButtons';
import './Auth.css';

export const Signup: React.FC = () => {
    const [formData, setFormData] = useState({
        email: '',
        phone_number: '',
        password: '',
        role: 'SEEKER'
    });
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    // Google/Facebook accounts already have a verified email, so unlike the
    // password form above, social signup logs the user straight in.
    const handleSocialSuccess = (data: { access_token: string; user_id: number; role: string; full_name?: string }) => {
        const role = data.role ? String(data.role).trim().toUpperCase() : 'SEEKER';
        login(data.access_token, {
            id: data.user_id,
            role: role as 'SEEKER' | 'ASTROLOGER' | 'ADMIN' | 'TUTOR',
            email: '',
            phone_number: '',
            full_name: data.full_name
        });
        navigate(role === 'ASTROLOGER' ? '/dashboard' : '/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const passwordError = getPasswordError(formData.password);
        if (passwordError) {
            setError(passwordError);
            return;
        }
        setIsLoading(true);
        try {
            setError('');
            await api.auth.signup(formData);
            // Backend creates an unverified account and emails a verification code.
            // Send the user to the email-verification screen; they can log in only
            // after verifying.
            navigate('/verify-email', { state: { email: formData.email } });
        } catch (err) {
            setError(getErrorMessage(err) || 'Signup failed');
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
                    <h2 className="auth-title">Join Aadikarta</h2>
                    <p className="auth-subtitle">Start your spiritual journey today</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="Email"
                            autoComplete="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Phone Number"
                            autoComplete="tel"
                            value={formData.phone_number}
                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <PasswordInput
                            placeholder="Password"
                            autoComplete="new-password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            disabled={isLoading}
                        />
                        <p className="field-hint">{PASSWORD_REQUIREMENTS}</p>
                    </div>

                    <button type="submit" className="auth-btn" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <SocialLoginButtons
                    disabled={isLoading}
                    onSuccess={handleSocialSuccess}
                    onError={(msg) => setError(msg)}
                />

                <div className="auth-footer">
                    <p>
                        Already have an account?
                        <Link to="/login" className="auth-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

