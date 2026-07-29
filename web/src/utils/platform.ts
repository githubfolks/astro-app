import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

export const isNative = (): boolean => Capacitor.isNativePlatform();

export const getPlatform = (): 'android' | 'ios' | 'web' => {
    return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
};

const MOBILE_VIEWPORT_QUERY = '(max-width: 767px)';

export const isMobileViewport = (): boolean =>
    window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;

export const useIsMobileViewport = (): boolean => {
    const [isMobile, setIsMobile] = useState(isMobileViewport);

    useEffect(() => {
        const mql = window.matchMedia(MOBILE_VIEWPORT_QUERY);
        const handleChange = () => setIsMobile(mql.matches);
        mql.addEventListener('change', handleChange);
        return () => mql.removeEventListener('change', handleChange);
    }, []);

    return isMobile;
};
