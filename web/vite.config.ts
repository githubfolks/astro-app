/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
        css: false,
        // Unit/integration tests live under src/. Playwright owns e2e/.
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        exclude: ['e2e/**', 'node_modules/**'],
        // The api service reads import.meta.env.VITE_API_URL; pin it so MSW handlers
        // can match a stable origin.
        env: {
            VITE_API_URL: 'http://localhost:8000',
        },
    },
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
    ],
    build: {
        target: 'esnext',
        // Per-chunk CSS splitting scatters styles shared across many routes
        // (Header, Footer, AstrologerList, aos.css, ...) into a dozen tiny
        // files that all become separate render-blocking <link> requests on
        // first load (each paying full request latency on mobile). Total CSS
        // for the whole app is ~34KB gzipped — cheaper as one request than as
        // many small ones.
        cssCodeSplit: false,
        rollupOptions: {
            output: {
                // The plain { vendor: [pkg names] } shorthand only reliably matches a
                // package's main entry point — react-dom is imported here via the
                // 'react-dom/client' subpath (see main.tsx), which that shorthand
                // missed, so react/react-dom/scheduler were silently landing in the
                // main entry chunk instead of vendor. Matching by node_modules path
                // catches every subpath/import specifier for these packages.
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (/node_modules\/(react|react-dom|scheduler|react-router-dom|react-router)\//.test(id)) {
                            return 'vendor';
                        }
                        if (id.includes('node_modules/lucide-react')) {
                            return 'vendor-icons';
                        }
                    }
                }
            }
        }
    }
});
