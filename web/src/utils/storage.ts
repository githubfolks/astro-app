import { Preferences } from '@capacitor/preferences';
import { isNative } from './platform';

/**
 * Cross-platform storage abstraction.
 * Uses Capacitor Preferences on native, localStorage on web.
 */
export const storage = {
    async getItem(key: string): Promise<string | null> {
        if (isNative()) {
            const { value } = await Preferences.get({ key });
            return value;
        }
        return localStorage.getItem(key);
    },

    async setItem(key: string, value: string): Promise<void> {
        if (isNative()) {
            await Preferences.set({ key, value });
        } else {
            localStorage.setItem(key, value);
        }
    },

    async removeItem(key: string): Promise<void> {
        if (isNative()) {
            await Preferences.remove({ key });
        } else {
            localStorage.removeItem(key);
        }
    }
};
