import { Capacitor } from '@capacitor/core';

export const isNative = (): boolean => Capacitor.isNativePlatform();

export const getPlatform = (): 'android' | 'ios' | 'web' => {
    return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
};
