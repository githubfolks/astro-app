import { SocialLogin } from '@capgo/capacitor-social-login';
import { getPlatform } from '../utils/platform';

const GOOGLE_WEB_CLIENT_ID = import.meta.env.VITE_GOOGLE_WEB_CLIENT_ID;
const GOOGLE_IOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID;
const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
// Only required on native Android/iOS (the Facebook SDK there rejects init
// without it); the web JS SDK works with just the App ID.
const FACEBOOK_CLIENT_TOKEN = import.meta.env.VITE_FACEBOOK_CLIENT_TOKEN;

let initPromise: Promise<void> | null = null;

// The plugin's Google init creates a <script> tag on web and must run before
// the first login() call; safe to call multiple times since we cache the promise.
//
// This also has a second job: the plugin's web implementation only loads the
// first time ANY SocialLogin method is called (Capacitor lazy-loads it), and
// its constructor is what detects "this window is a Google OAuth popup
// returning from accounts.google.com" and messages the result back to the tab
// that opened it. So this must run eagerly on page load (see
// SocialLoginButtons' mount effect) — not only on button click — or a popup
// that lands back on /login without the user clicking anything here will
// never complete the handoff and the original tab hangs forever.
export const ensureInitialized = (): Promise<void> => {
    if (!initPromise) {
        initPromise = SocialLogin.initialize({
            google: GOOGLE_WEB_CLIENT_ID
                ? {
                    webClientId: GOOGLE_WEB_CLIENT_ID,
                    iOSClientId: GOOGLE_IOS_CLIENT_ID || undefined,
                    iOSServerClientId: GOOGLE_WEB_CLIENT_ID,
                    // Pin the web OAuth popup's redirect_uri to a fixed path that always
                    // renders SocialLoginButtons (so the popup's page load re-triggers
                    // ensureInitialized above), rather than the plugin's default of
                    // origin+pathname (which would 404/blank on arbitrary routes) or the
                    // bare origin (which renders Home, a page with no login UI at all).
                    redirectUrl: `${window.location.origin}/login`,
                }
                : undefined,
            facebook: FACEBOOK_APP_ID
                ? { appId: FACEBOOK_APP_ID, clientToken: FACEBOOK_CLIENT_TOKEN || undefined }
                : undefined,
        }).catch((err) => {
            // Don't wedge every future login attempt behind one bad init (e.g. a
            // missing Facebook clientToken on native shouldn't also break Google,
            // and fixing the config should let a later click succeed).
            initPromise = null;
            throw err;
        });
    }
    return initPromise;
};

export const socialAuthConfigured = {
    google: Boolean(GOOGLE_WEB_CLIENT_ID) && (getPlatform() !== 'ios' || Boolean(GOOGLE_IOS_CLIENT_ID)),
    facebook: Boolean(FACEBOOK_APP_ID) && (getPlatform() === 'web' || Boolean(FACEBOOK_CLIENT_TOKEN)),
};

export const socialAuth = {
    /** Runs the native/web Google sign-in flow and returns the ID token to send to the backend. */
    loginWithGoogle: async (): Promise<string> => {
        await ensureInitialized();
        // No `scopes` here on purpose: the plugin already requests email/profile/openid
        // by default on every platform, and passing scopes explicitly makes Android's
        // native provider demand a custom MainActivity we haven't (and don't need to) set up.
        const res = await SocialLogin.login({ provider: 'google', options: {} });
        const idToken = res.result && 'idToken' in res.result ? res.result.idToken : undefined;
        if (!idToken) {
            throw new Error('Google sign-in did not return an ID token');
        }
        return idToken;
    },

    /** Runs the native/web Facebook login flow and returns the access token to send to the backend. */
    loginWithFacebook: async (): Promise<string> => {
        await ensureInitialized();
        const res = await SocialLogin.login({ provider: 'facebook', options: { permissions: ['email', 'public_profile'] } });
        const accessToken = res.result && 'accessToken' in res.result ? res.result.accessToken?.token : undefined;
        if (!accessToken) {
            throw new Error('Facebook login did not return an access token');
        }
        return accessToken;
    },
};
