import { Preferences } from '@capacitor/preferences';
import { isNative } from './platform';

/**
 * Cross-platform storage abstraction.
 * Uses Capacitor Preferences on native, localStorage on web.
 *
 * Auth keys (token/user) use sessionStorage on web instead of localStorage:
 * localStorage is shared across all tabs of the same browser, so logging
 * into a second account in another tab silently swapped the token used by
 * every open tab's API calls, cross-wiring different users' data (e.g. one
 * astrologer's dashboard showing another astrologer's request queue).
 * sessionStorage is scoped per tab, which avoids that.
 */
const AUTH_KEYS = new Set(['token', 'user']);

const webStorageFor = (key: string): Storage =>
    AUTH_KEYS.has(key) ? sessionStorage : localStorage;

export const storage = {
    async getItem(key: string): Promise<string | null> {
        if (isNative()) {
            const { value } = await Preferences.get({ key });
            return value;
        }
        return webStorageFor(key).getItem(key);
    },

    async setItem(key: string, value: string): Promise<void> {
        if (isNative()) {
            await Preferences.set({ key, value });
        } else {
            webStorageFor(key).setItem(key, value);
        }
    },

    async removeItem(key: string): Promise<void> {
        if (isNative()) {
            await Preferences.remove({ key });
        } else {
            webStorageFor(key).removeItem(key);
        }
    }
};
