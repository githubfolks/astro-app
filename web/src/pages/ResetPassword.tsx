import React, { useState } from 'react';
import { api } from '../services/api';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Auth.css';

export const ResetPassword: React.FC = () => {
    const location = useLocation();
    const token = location.state?.token;
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError('Invalid session. Please start over.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            await api.auth.resetPassword(token, newPassword);
            navigate('/login');
        } catch (err: any) {
            setError(err.message || 'Failed to reset password');
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
                    <h2 className="auth-title">Reset Password</h2>
                    <p className="auth-subtitle">Enter your new password</p>
                </div>

                {error && <div className="error-banner">{error}</div>}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="New Password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={isLoading}>
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>
                        <Link to="/login" className="auth-link">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};
