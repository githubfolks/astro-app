import type { CapacitorConfig } from '@capacitor/cli';

// mobile:run:dev sets this so a local build can reach the developer's own
// Docker backend over plain HTTP/WS (10.0.2.2 is the Android emulator's
// alias for the host's localhost) instead of production HTTPS/WSS — the
// default (unset) path below is byte-identical to before for every other
// build command. Pairs with android/app/src/main/res/xml/network_security_config.xml,
// which scopes the matching cleartext allowance to debuggable builds only.
const isDev = process.env.CAPACITOR_ENV === 'development';

const config: CapacitorConfig = {
  appId: 'com.aadikarta.web',
  appName: 'Aadikarta Vedic Astrology',
  webDir: 'dist',
  server: {
    // Allow API calls to production server
    allowNavigation: isDev
      ? ['aadikarta.org', 'api.aadikarta.org', '10.0.2.2', 'localhost']
      : ['aadikarta.org', 'api.aadikarta.org'],
    // Capacitor defaults to serving the WebView over https://, which makes a
    // plain ws:// chat connection get blocked as mixed content — only an
    // issue for local dev, since production always talks wss://.
    ...(isDev ? { androidScheme: 'http' } : {}),
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
    // Android 16 (SDK 36, our targetSdkVersion) forces edge-to-edge with no
    // opt-out, so the WebView content can render behind the system status/nav
    // bars unless real inset values are supplied. 'css' mode injects them as
    // --safe-area-inset-* custom properties on <html>, which index.css's
    // .native-app rules already read (see the safe-area-bottom comment there).
    SystemBars: {
      insetsHandling: 'css',
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
