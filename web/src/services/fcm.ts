import { api } from './api';
import { isNative, getPlatform } from '../utils/platform';

// android/app/build.gradle only applies the google-services Gradle plugin (and initializes
// FirebaseApp) when android/app/google-services.json is present — see that file's
// "google-services.json not found, google-services plugin not applied" log line. Without it,
// PushNotifications.register() calls FirebaseMessaging.getInstance() natively, which throws
// on a Capacitor bridge thread with no JS-catchable boundary and crashes the whole app.
// Flip this on (and set it in the relevant .env file) once a real google-services.json has
// been added and the app rebuilt.
const PUSH_NOTIFICATIONS_ENABLED = import.meta.env.VITE_PUSH_NOTIFICATIONS_ENABLED === 'true';

// Native push notifications (lazily imported to avoid loading the plugin on web)
let PushNotifications: typeof import('@capacitor/push-notifications').PushNotifications | null = null;

// Cached so logout can unregister the same token/platform pair it registered —
// a device that later logs into a different account must stop receiving this
// user's pushes (see clearRegisteredToken).
let lastRegisteredToken: { value: string; platform: string } | null = null;

const loadNativePush = async () => {
    if (isNative() && !PushNotifications) {
        const mod = await import('@capacitor/push-notifications');
        PushNotifications = mod.PushNotifications;
    }
};

export const fcmService = {
    async requestPermissionAndGetToken(): Promise<string | null> {
        // Native path: use Capacitor PushNotifications
        if (isNative()) {
            if (!PUSH_NOTIFICATIONS_ENABLED) {
                console.log('Push notifications disabled: Firebase is not configured for this build');
                return null;
            }
            try {
                await loadNativePush();
                if (!PushNotifications) return null;
                const push = PushNotifications;

                const permResult = await push.requestPermissions();
                if (permResult.receive !== 'granted') {
                    console.log('Push notification permission denied');
                    return null;
                }

                // Register for push notifications
                await push.register();

                // Listen for registration token
                return new Promise<string | null>((resolve) => {
                    push.addListener('registration', async (token: { value: string }) => {
                        console.log('Push registration token:', token.value);
                        const platform = getPlatform(); // 'android' or 'ios'
                        await api.updateDeviceToken(token.value, platform);
                        lastRegisteredToken = { value: token.value, platform };
                        resolve(token.value);
                    });

                    push.addListener('registrationError', (error) => {
                        console.error('Push registration error:', error);
                        resolve(null);
                    });

                    // Timeout after 10 seconds
                    setTimeout(() => resolve(null), 10000);
                });
            } catch (error) {
                console.error('Error setting up native push:', error);
                return null;
            }
        }

        // Web: never prompt here (iOS only allows the permission prompt from a
        // user tap — see enableWebPush); just re-register an existing grant.
        return syncWebPushSubscription();
    },

    async clearRegisteredToken(): Promise<void> {
        let target = lastRegisteredToken;
        if (!target && !isNative()) {
            // Page was reloaded since registering — read the live subscription.
            const sub = await getExistingSubscription();
            if (sub) target = { value: JSON.stringify(sub.toJSON()), platform: WEB_PUSH_PLATFORM };
        }
        if (!target) return;
        try {
            await api.clearDeviceToken(target.value, target.platform);
        } catch (error) {
            console.error('Error clearing device token on logout:', error);
        } finally {
            lastRegisteredToken = null;
        }
    }
};

// --- Standard Web Push (browsers / Home Screen web apps) ---
// iOS Safari supports only this (16.4+, and only once the site is added to the
// Home Screen), not FCM web tokens. The subscription JSON is sent to the backend
// as the device token with platform "webpush"; api/app/notifications.py sends to it.

const WEB_PUSH_PLATFORM = 'webpush';

export type WebPushSupport = 'supported' | 'needs-home-screen' | 'unsupported';

const isIOS = () =>
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    // iPadOS reports itself as a Mac but has touch.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

const isStandalone = () =>
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;

export const getWebPushSupport = (): WebPushSupport => {
    if (isNative()) return 'unsupported';
    if (isIOS() && !isStandalone()) return 'needs-home-screen';
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        return 'unsupported';
    }
    return 'supported';
};

const urlBase64ToUint8Array = (base64: string): Uint8Array => {
    const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(padded);
    return Uint8Array.from(raw, c => c.charCodeAt(0));
};

const getExistingSubscription = async (): Promise<PushSubscription | null> => {
    if (getWebPushSupport() !== 'supported') return null;
    try {
        const reg = await navigator.serviceWorker.ready;
        return await reg.pushManager.getSubscription();
    } catch {
        return null;
    }
};

const registerSubscription = async (sub: PushSubscription): Promise<string> => {
    const token = JSON.stringify(sub.toJSON());
    await api.updateDeviceToken(token, WEB_PUSH_PLATFORM);
    lastRegisteredToken = { value: token, platform: WEB_PUSH_PLATFORM };
    return token;
};

const subscribe = async (): Promise<PushSubscription> => {
    const { public_key } = await api.getWebPushConfig();
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return existing;
    return reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key) as BufferSource,
    });
};

/** Re-register this browser's subscription after login, without prompting. */
export const syncWebPushSubscription = async (): Promise<string | null> => {
    if (getWebPushSupport() !== 'supported' || Notification.permission !== 'granted') return null;
    try {
        return await registerSubscription(await subscribe());
    } catch (error) {
        console.error('Web push sync failed:', error);
        return null;
    }
};

/**
 * Ask for notification permission and subscribe. Must be called directly from
 * a user tap (iOS rejects the prompt otherwise). Throws with a user-facing
 * message on failure so the caller can show it.
 */
export const enableWebPush = async (): Promise<void> => {
    if (getWebPushSupport() !== 'supported') throw new Error('Notifications are not supported in this browser.');
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
        throw new Error('Notifications are blocked. Allow them in your browser settings to get new chat requests.');
    }
    await registerSubscription(await subscribe());
};
