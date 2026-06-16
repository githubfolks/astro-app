import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import vitePrerender from 'vite-plugin-prerender';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PUBLIC_ROUTES = [
    '/',
    '/astrologers',
    '/about-us',
    '/contact-us',
    '/blog',
    '/how-it-works',
    '/pricing',
    '/join-as-astrologer',
    '/memory-guru',
    '/horoscope',
    '/horoscope/aries',
    '/horoscope/taurus',
    '/horoscope/gemini',
    '/horoscope/cancer',
    '/horoscope/leo',
    '/horoscope/virgo',
    '/horoscope/libra',
    '/horoscope/scorpio',
    '/horoscope/sagittarius',
    '/horoscope/capricorn',
    '/horoscope/aquarius',
    '/horoscope/pisces',
    '/services/vedic-astrology',
    '/services/kundli-matching',
    '/services/tarot-reading',
    '/services/love-advice',
    '/services/daily-horoscope',
    '/services/vastu-shastra',
    '/privacy-policy',
    '/terms-of-service',
    '/refund-policy',
    '/disclaimer',
];

export default defineConfig(({ mode }) => ({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
            manifest: {
                name: 'Aadikarta',
                short_name: 'Aadikarta',
                description: 'Connect with expert astrologers',
                theme_color: '#ffffff',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: 'pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        }),
        // Pre-render public pages at build time so search engines get real HTML.
        // Skipped for mobile builds since Capacitor serves the SPA directly.
        ...(mode !== 'mobile' ? [
            vitePrerender({
                staticDir: path.join(__dirname, 'dist'),
                routes: PUBLIC_ROUTES,
                renderer: new vitePrerender.PuppeteerRenderer({
                    renderAfterTime: 2000,
                    headless: true,
                }),
            }),
        ] : []),
    ],
    build: {
        target: 'esnext',
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
                }
            }
        }
    }
}));
