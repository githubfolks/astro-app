#!/usr/bin/env node
/**
 * Post-build static pre-renderer.
 * Runs after `vite build` to snapshot each public route to its own index.html
 * so Googlebot gets real HTML without executing JavaScript.
 *
 * Usage: node scripts/prerender.cjs
 * Called automatically by the `build` npm script.
 */

'use strict';

const path = require('path');
const fs = require('fs');
const Prerenderer = require('@prerenderer/prerenderer');
const PuppeteerRenderer = require('@prerenderer/renderer-puppeteer');

const DIST = path.resolve(__dirname, '../dist');

const ROUTES = [
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

async function main() {
    const prerenderer = new Prerenderer({
        staticDir: DIST,
        renderer: new PuppeteerRenderer({
            renderAfterTime: 2000,
            headless: true,
            // Required for Docker containers: /dev/shm is too small for Chrome by default
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
            navigationOptions: { timeout: 60000 },
        }),
    });

    try {
        await prerenderer.initialize();
        console.log(`[prerender] Rendering ${ROUTES.length} routes...`);

        const rendered = await prerenderer.renderRoutes(ROUTES);

        for (const { route, html } of rendered) {
            const isRoot = route === '/';
            const outPath = isRoot
                ? path.join(DIST, 'index.html')
                : path.join(DIST, route, 'index.html');

            fs.mkdirSync(path.dirname(outPath), { recursive: true });
            fs.writeFileSync(outPath, html, 'utf-8');
            console.log(`[prerender] ✓ ${route}`);
        }

        console.log(`[prerender] Done — ${rendered.length} pages written.`);
    } catch (err) {
        console.error('[prerender] Failed:', err.message);
        process.exit(1);
    } finally {
        prerenderer.destroy();
    }
}

main();
