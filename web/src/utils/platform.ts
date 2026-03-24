export const isNative = (): boolean => false;

export const getPlatform = (): 'android' | 'ios' | 'web' => {
    return 'web';
};
