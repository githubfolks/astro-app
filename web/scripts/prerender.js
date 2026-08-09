#!/usr/bin/env node
//
// Build-time prerenderer: after `vite build`, boots a static preview of dist/,
// visits every known + API-enumerable route with a real headless browser, and
// overwrites each route's index.html with the fully-rendered DOM. This is what
// crawlers (Googlebot, GPTBot, ClaudeBot, PerplexityBot...) will see instead of
// the empty <div id="app"></div> shell — no SSR server, no runtime changes for
// real users, who still get the same SPA and hydrate on top as before.
//
// CMS pages served via the generic `/:slug` route aren't included: there's no
// public endpoint to list all CMS page slugs (only get-by-slug), so they can't
// be enumerated here. Add one if those pages need the same treatment.

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { chromium } from 'playwright-core';
import { URLS as STATIC_URLS } from './generate-sitemap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const API_URL = process.env.VITE_API_URL || 'https://api.aadikarta.org';
// Must be one of the API's allowed CORS origins (see api/app/main.py's
// `origins` list, which now includes http://localhost:4321 for this) — pages
// that fetch data client-side (e.g. BlogPost) will silently fail and render
// an empty/error state otherwise, since the browser blocks the cross-origin
// request before it ever reaches the network tab.
const PORT = process.env.PRERENDER_PORT || 4321;
// Explicit IPv4 loopback, not "localhost" — some containers (Debian) resolve
// vite preview's default bind to ::1 only, while Node's fetch/undici resolves
// "localhost" to 127.0.0.1 first with no fallback, causing ECONNREFUSED even
// though the server is genuinely up (curl masks this by trying both).
const HOST = '127.0.0.1';
const BASE = `http://${HOST}:${PORT}`;

// Mirrors public/robots.txt — never prerender auth/private routes.
const EXCLUDE_PREFIXES = [
    '/dashboard', '/chat', '/kundli', '/classroom', '/tutor',
    '/login', '/signup', '/verify-otp', '/verify-email',
    '/forgot-password', '/reset-password',
];

// Highest-value routes for search/AEO — if these fail to prerender the build
// should fail loudly instead of silently shipping a blank homepage shell to
// crawlers again (see 2026-08-09 incident: homepage + all 12 horoscope pages
// were serving an empty <div id="app"> in production for days undetected).
const CRITICAL_ROUTES = new Set([
    '/', '/astrologers', '/ai-astrologer',
    ...['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra',
        'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
        .map((s) => `/services/horoscope/${s}`),
]);

// Third-party calls that are slow/rate-limited and irrelevant to the
// prerendered SEO snapshot (e.g. IP geolocation for the Panchang widget's
// default city) — block them so the app hits its own fast fallback instead
// of a real network round-trip that can hang well past the page timeout.
const BLOCKED_THIRD_PARTY = ['https://ipapi.co/**'];

async function fetchAllPages(path, mapItem, getItems = (d) => d) {
    const out = [];
    let skip = 0;
    const limit = 100;
    for (;;) {
        const sep = path.includes('?') ? '&' : '?';
        const res = await fetch(`${API_URL}${path}${sep}skip=${skip}&limit=${limit}`);
        if (!res.ok) {
            console.warn(`  ! ${path} fetch failed (HTTP ${res.status}) — skipping these dynamic routes`);
            break;
        }
        const items = getItems(await res.json());
        if (!Array.isArray(items) || items.length === 0) break;
        for (const item of items) out.push(mapItem(item));
        skip += limit;
        if (items.length < limit) break;
    }
    return out;
}

const fetchBlogRoutes = () =>
    fetchAllPages('/public/posts', (p) => `/blog/${p.slug}`, (d) => d.posts);

const fetchAstrologerRoutes = () =>
    fetchAllPages('/astrologers/', (a) => `/astrologers/${a.slug || a.user_id}`);

// Confirms not just that *something* is listening on the port, but that it's
// actually our own preview server — this machine may run other projects on
// the same port, and a false-positive here would silently prerender someone
// else's app instead of failing loudly.
function waitForServer(url, timeoutMs = 20000) {
    const start = Date.now();
    return new Promise((resolvePromise, reject) => {
        const tick = async () => {
            try {
                const res = await fetch(url);
                if (res.ok && (await res.text()).includes('id="app"')) return resolvePromise();
            } catch {
                // server not up yet
            }
            if (Date.now() - start > timeoutMs) {
                return reject(new Error(`preview server on ${url} did not respond with the Aadikarta app within ${timeoutMs}ms`));
            }
            setTimeout(tick, 300);
        };
        tick();
    });
}

async function main() {
    if (!existsSync(DIST)) {
        console.error('dist/ not found — run `vite build` before prerendering');
        process.exit(1);
    }

    console.log('Fetching dynamic routes from the API...');
    const [blogRoutes, astrologerRoutes] = await Promise.all([
        fetchBlogRoutes().catch((e) => { console.warn(`  ! blog route discovery failed: ${e.message}`); return []; }),
        fetchAstrologerRoutes().catch((e) => { console.warn(`  ! astrologer route discovery failed: ${e.message}`); return []; }),
    ]);

    const routes = [...new Set([
        ...STATIC_URLS.map((u) => u.loc),
        ...blogRoutes,
        ...astrologerRoutes,
    ])].filter((r) => !EXCLUDE_PREFIXES.some((p) => r === p || r.startsWith(`${p}/`)));

    console.log(
        `Prerendering ${routes.length} routes ` +
        `(${STATIC_URLS.length} static, ${blogRoutes.length} blog, ${astrologerRoutes.length} astrologer)`
    );

    console.log(`Starting preview server on port ${PORT}...`);
    // Spawn the local vite binary directly, not via `npx` — npx launches vite
    // as its own child process, so killing the npx process (below, in the
    // `finally` block) leaves the real server running and this script hanging
    // forever waiting on its still-open stderr pipe.
    const viteBin = resolve(ROOT, 'node_modules/.bin/vite');
    const preview = spawn(viteBin, ['preview', '--host', HOST, '--port', String(PORT), '--strictPort'], {
        cwd: ROOT,
        stdio: ['ignore', 'ignore', 'pipe'],
    });
    preview.stderr.on('data', (d) => process.stderr.write(d));
    preview.on('error', (e) => { throw e; });

    let browser;
    try {
        await waitForServer(BASE);

        browser = await chromium.launch({ args: ['--no-sandbox'] });
        const context = await browser.newContext();
        for (const pattern of BLOCKED_THIRD_PARTY) {
            await context.route(pattern, (route) => route.abort());
        }
        const page = await context.newPage();
        let recentErrors = [];
        page.on('pageerror', (e) => recentErrors.push(`page error: ${e.message}`));
        page.on('console', (msg) => {
            if (msg.type() === 'error') recentErrors.push(`console: ${msg.text()}`);
        });

        let ok = 0;
        let failed = 0;
        const failedCritical = [];
        for (const route of routes) {
            recentErrors = [];
            try {
                try {
                    await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 20000 });
                } catch (e) {
                    // Heavier pages (e.g. the homepage, with animations, live
                    // astrologer status, and multiple data widgets) can have
                    // background network activity that never goes fully quiet,
                    // especially under a slower/resource-constrained build
                    // container — failing here would silently drop the page's
                    // most valuable route. `load` still guarantees the SPA has
                    // mounted; the extra wait lets client-side data fetches settle.
                    await page.goto(`${BASE}${route}`, { waitUntil: 'load', timeout: 20000 });
                }
                // Wait for react-helmet-async's title write rather than a fixed
                // sleep — faster on light routes, still generous (10s) for
                // heavy ones so real slowness doesn't get misread as a bug.
                await page.waitForFunction(() => !!document.title, { timeout: 10000 }).catch(() => {});
                const html = await page.content();
                // A route that never actually rendered (JS error before mount,
                // etc.) still resolves goto() successfully and still returns
                // *some* HTML — so without this check every such failure was
                // silently counted as "ok" and the raw SPA shell got written
                // back to disk as if it were the prerendered page. Treat it as
                // a failure instead: skip the write and leave the route's
                // existing unprerendered dist/ shell in place (same fallback
                // behavior as a thrown goto()/timeout below), and count it so
                // it shows up in the final tally instead of hiding inside "ok".
                if (!html.includes('<title>') || html.length < 7600) {
                    console.warn(`  ! ${route} rendered but looks like an unmounted shell (${html.length} bytes, has <title>: ${html.includes('<title>')}) — not writing, leaving unprerendered fallback`);
                    if (recentErrors.length) console.warn(`    last page errors: ${recentErrors.slice(-3).join(' | ')}`);
                    failed++;
                    if (CRITICAL_ROUTES.has(route)) failedCritical.push(route);
                    continue;
                }
                const outDir = route === '/' ? DIST : join(DIST, route);
                mkdirSync(outDir, { recursive: true });
                writeFileSync(join(outDir, 'index.html'), html, 'utf8');
                ok++;
            } catch (e) {
                console.warn(`  ! failed to prerender ${route}: ${e.message}`);
                if (recentErrors.length) console.warn(`    last page errors: ${recentErrors.slice(-3).join(' | ')}`);
                failed++;
                if (CRITICAL_ROUTES.has(route)) failedCritical.push(route);
            }
        }

        console.log(`Prerendered ${ok} routes (${failed} failed).`);
        // A route that fails to prerender just falls back to the unprerendered
        // SPA shell for crawlers (same as before this script existed) — not a
        // regression for real users, EXCEPT for CRITICAL_ROUTES (homepage,
        // horoscope pages, astrologers, ai-astrologer): those are too
        // high-value to fail silently, so a failure there fails the build.
        if (ok === 0 && routes.length > 0) process.exitCode = 1;
        if (failedCritical.length > 0) {
            console.error(`Critical routes failed to prerender: ${failedCritical.join(', ')}`);
            process.exitCode = 1;
        }
    } finally {
        if (browser) await browser.close();
        preview.kill();
    }
}

main()
    .then(() => process.exit(process.exitCode || 0)) // belt-and-suspenders: don't hang on any other lingering handle
    .catch((e) => {
        console.error('Prerender failed:', e);
        process.exit(1);
    });
