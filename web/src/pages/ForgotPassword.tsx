import React, { useState } from 'react';
import { api } from '../services/api';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        try {
            await api.auth.forgotPassword(email);
            // Navigate to verify-otp with email in state
            navigate('/verify-otp', { state: { email } });
        } catch (err: any) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="decor-circle decor-1"></div>
            <div className="decor-circle decor-2"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <h2 className="auth-title">Forgot Password</h2>
                    <p className="auth-subtitle">Enter your email to receive an OTP</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={isLoading}>
                        {isLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Remember your password?
                        <Link to="/login" className="auth-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
