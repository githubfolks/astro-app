import React, { useState } from 'react';
import { api } from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

export const VerifyOTP: React.FC = () => {
    const location = useLocation();
    const email = location.state?.email || '';
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Email not found. Please try again.');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            const data = await api.auth.verifyOtp(email, otp);
            // Navigate to reset-password with token
            navigate('/reset-password', { state: { token: data.reset_token } });
        } catch (err: any) {
            setError(err.message || 'Verification failed');
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
                    <h2 className="auth-title">Verify OTP</h2>
                    <p className="auth-subtitle">Enter the OTP sent to {email}</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Didn't receive OTP?
                        <Link to="/forgot-password" className="auth-link">Resend</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
