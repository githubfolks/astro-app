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
        cssCodeSplit: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom', 'lucide-react']
                }
            }
        }
    }
});
