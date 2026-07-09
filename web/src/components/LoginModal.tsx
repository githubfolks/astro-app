import { getErrorMessage } from '../utils/errors';
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import './LoginModal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: () => void;
}

const LoginModal: React.FC<Props> = ({ isOpen, onClose, onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [savePassword, setSavePassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const savedUser = localStorage.getItem('saved_username');
            const savedPass = localStorage.getItem('saved_password');
            if (savedUser && savedPass) {
                setUsername(savedUser);
                setPassword(savedPass);
                setSavePassword(true);
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            setError('');
            // Using the same API service as the main login page
            const data = await api.auth.login(username, password);

            if (savePassword) {
                localStorage.setItem('saved_username', username);
                localStorage.setItem('saved_password', password);
            } else {
                localStorage.removeItem('saved_username');
                localStorage.removeItem('saved_password');
            }

            login(data.access_token, { id: data.user_id, role: data.role, email: '', phone_number: '', full_name: data.full_name });
            onLoginSuccess();
            onClose();
        } catch (err) {
            setError(getErrorMessage(err) || 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h2>Login to Chat</h2>
                <p className="modal-subtitle">Connect with your favorite astrologer instantly.</p>

                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit} autoComplete="on">
                    <div className="form-group">
                        <label>Email or Phone</label>
                        <input
                            type="text"
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <label className="remember-me-container">
                        <input
                            type="checkbox"
                            checked={savePassword}
                            onChange={(e) => setSavePassword(e.target.checked)}
                            disabled={isLoading}
                        />
                        Save password
                    </label>
                    <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                    <div className="modal-footer">
                        <small>Don't have an account? <a href="/signup">Sign up</a></small>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginModal;
