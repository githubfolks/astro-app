import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.aadikarta.web',
  appName: 'Aadikarta Vedic Astrology',
  webDir: 'dist',
  server: {
    // Allow API calls to production server
    allowNavigation: ['aadikarta.org', 'api.aadikarta.org'],
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#FFF9F0',
      showSpinner: true,
      spinnerColor: '#E91E63',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
    },
    // 'body' mode's own JS-driven resize got stuck reserving keyboard-sized
    // space after backgrounding the app during an external OAuth flow (e.g.
    // Google/Facebook sign-in), leaving a permanent gap at the bottom of
    // every page afterward -- confirmed via window.innerHeight staying
    // short by exactly the IME's inset hint even with the keyboard closed.
    // The AndroidManifest activity now sets windowSoftInputMode="adjustResize"
    // so the OS handles keyboard resizing natively instead.
    Keyboard: {
      resize: 'none',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: true,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
