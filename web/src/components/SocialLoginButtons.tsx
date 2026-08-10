import React, { useEffect, useState } from 'react';
import { getErrorMessage } from '../utils/errors';
import { api } from '../services/api';
import { socialAuth, socialAuthConfigured, ensureInitialized } from '../services/socialAuth';
import './SocialLoginButtons.css';

interface SocialLoginData {
    access_token: string;
    token_type: string;
    user_id: number;
    role: string;
    full_name?: string;
}

interface Props {
    onSuccess: (data: SocialLoginData) => void;
    onError: (message: string) => void;
    disabled?: boolean;
}

const SocialLoginButtons: React.FC<Props> = ({ onSuccess, onError, disabled }) => {
    const [loadingProvider, setLoadingProvider] = useState<'google' | 'facebook' | null>(null);

    // Must run on every mount, not just on click: this is also what completes the
    // handoff when this page is loaded inside the Google/Facebook OAuth popup
    // itself after it redirects back (see ensureInitialized's doc comment).
    useEffect(() => {
        if (socialAuthConfigured.google || socialAuthConfigured.facebook) {
            ensureInitialized().catch((err) => console.error('Social login init failed:', err));
        }
    }, []);

    if (!socialAuthConfigured.google && !socialAuthConfigured.facebook) {
        return null;
    }

    const handleGoogle = async () => {
        setLoadingProvider('google');
        try {
            const idToken = await socialAuth.loginWithGoogle();
            const data = await api.auth.google(idToken);
            onSuccess(data);
        } catch (err) {
            onError(getErrorMessage(err) || 'Google sign-in failed');
        } finally {
            setLoadingProvider(null);
        }
    };

    const handleFacebook = async () => {
        setLoadingProvider('facebook');
        try {
            const accessToken = await socialAuth.loginWithFacebook();
            const data = await api.auth.facebook(accessToken);
            onSuccess(data);
        } catch (err) {
            onError(getErrorMessage(err) || 'Facebook sign-in failed');
        } finally {
            setLoadingProvider(null);
        }
    };

    const isDisabled = disabled || loadingProvider !== null;

    return (
        <div className="social-login">
            <div className="social-login-divider"><span>or continue with</span></div>
            <div className="social-login-buttons">
                {socialAuthConfigured.google && (
                    <button
                        type="button"
                        className="social-btn social-btn-google"
                        onClick={handleGoogle}
                        disabled={isDisabled}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                            <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
                            <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.9v2.33A9 9 0 0 0 9 18z" />
                            <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.97H.9A9 9 0 0 0 0 9c0 1.45.35 2.83.9 4.03l3.05-2.33z" />
                            <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .9 4.97l3.05 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
                        </svg>
                        {loadingProvider === 'google' ? 'Connecting…' : 'Google'}
                    </button>
                )}
                {socialAuthConfigured.facebook && (
                    <button
                        type="button"
                        className="social-btn social-btn-facebook"
                        onClick={handleFacebook}
                        disabled={isDisabled}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" fill="#fff">
                            <path d="M17 9a8 8 0 1 0-9.25 7.9v-5.59H5.9V9h1.85V7.4c0-1.83 1.09-2.84 2.76-2.84.8 0 1.63.14 1.63.14v1.8h-.92c-.9 0-1.19.56-1.19 1.14V9h2.02l-.32 2.31H10v5.59A8 8 0 0 0 17 9z" />
                        </svg>
                        {loadingProvider === 'facebook' ? 'Connecting…' : 'Facebook'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default SocialLoginButtons;
