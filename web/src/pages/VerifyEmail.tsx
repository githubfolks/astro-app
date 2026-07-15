import { getErrorMessage } from '../utils/errors';
import React, { useState } from 'react';
import { api } from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

export const VerifyEmail: React.FC = () => {
    const location = useLocation();
    const email = location.state?.email || '';
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError('Email not found. Please sign up again.');
            return;
        }
        setIsLoading(true);
        setError('');
        setInfo('');
        try {
            await api.auth.verifyEmail(email, otp);
            navigate('/login', { state: { verified: true } });
        } catch (err) {
            setError(getErrorMessage(err) || 'Verification failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        if (!email) {
            setError('Email not found. Please sign up again.');
            return;
        }
        setIsResending(true);
        setError('');
        setInfo('');
        try {
            const data = await api.auth.resendVerification(email);
            setInfo(data.message || 'A new verification code has been sent.');
        } catch (err) {
            setError(getErrorMessage(err) || 'Failed to resend verification code');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="decor-circle decor-1"></div>
            <div className="decor-circle decor-2"></div>

            <div className="auth-card">
                <div className="auth-header">
                    <h2 className="auth-title">Verify Your Email</h2>
                    <p className="auth-subtitle">Enter the verification code sent to {email || 'your email'}</p>
                </div>

                {error && <div className="error-banner">{error}</div>}
                {info && <div className="info-banner">{info}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <input
                            type="text"
                            placeholder="Enter verification code"
                            autoComplete="one-time-code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={isLoading}>
                        {isLoading ? 'Verifying...' : 'Verify Email'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        Didn't receive a code?
                        <button
                            type="button"
                            className="auth-link"
                            onClick={handleResend}
                            disabled={isResending}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                            {isResending ? 'Resending...' : 'Resend'}
                        </button>
                    </p>
                    <p>
                        Already verified?
                        <Link to="/login" className="auth-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
