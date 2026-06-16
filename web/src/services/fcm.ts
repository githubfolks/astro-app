import { api } from './api';
import { isNative, getPlatform } from '../utils/platform';

// Native push notifications
let PushNotifications: any = null;

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
            try {
                await loadNativePush();
                if (!PushNotifications) return null;

                const permResult = await PushNotifications.requestPermissions();
                if (permResult.receive !== 'granted') {
                    console.log('Push notification permission denied');
                    return null;
                }

                // Register for push notifications
                await PushNotifications.register();

                // Listen for registration token
                return new Promise<string | null>((resolve) => {
                    PushNotifications.addListener('registration', async (token: { value: string }) => {
                        console.log('Push registration token:', token.value);
                        const platform = getPlatform(); // 'android' or 'ios'
                        await api.updateDeviceToken(token.value, platform);
                        resolve(token.value);
                    });

                    PushNotifications.addListener('registrationError', (error: any) => {
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

        // Web path: browser Notification API
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return null;
        }

        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                console.log('Notification permission granted.');
                const mockToken = "mock_fcm_token_" + Date.now();
                await api.updateDeviceToken(mockToken, 'web');
                return mockToken;
            } else {
                console.log('Unable to get permission to notify.');
            }
        } catch (error) {
            console.error('Error getting permission or token', error);
        }
        return null;
    }
};
