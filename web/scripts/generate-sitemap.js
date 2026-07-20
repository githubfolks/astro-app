#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/sitemap.xml');
const BASE = process.env.VITE_SITE_URL || 'https://aadikarta.org';
const API_URL = process.env.VITE_API_URL || 'https://api.aadikarta.org';
const today = new Date().toISOString().slice(0, 10);

const URLS = [
    { loc: '/',                          changefreq: 'daily',   priority: '1.0' },
    { loc: '/astrologers',               changefreq: 'daily',   priority: '0.9' },
    { loc: '/ai-astrologer',             changefreq: 'monthly', priority: '0.9' },
    { loc: '/how-it-works',              changefreq: 'monthly', priority: '0.8' },
    { loc: '/pricing',                   changefreq: 'monthly', priority: '0.8' },
    { loc: '/blog',                      changefreq: 'daily',   priority: '0.8' },
    { loc: '/horoscope',                 changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/aries',           changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/taurus',          changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/gemini',          changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/cancer',          changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/leo',             changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/virgo',           changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/libra',           changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/scorpio',         changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/sagittarius',     changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/capricorn',       changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/aquarius',        changefreq: 'monthly', priority: '0.8' },
    { loc: '/horoscope/pisces',          changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/vedic-astrology',  changefreq: 'monthly', priority: '0.7' },
    { loc: '/services/kundli-matching',  changefreq: 'monthly', priority: '0.7' },
    { loc: '/services/love-advice',      changefreq: 'monthly', priority: '0.7' },
    { loc: '/services/daily-horoscope',  changefreq: 'daily',   priority: '0.7' },
    { loc: '/services/tarot-reading',    changefreq: 'monthly', priority: '0.7' },
    { loc: '/services/vastu-shastra',    changefreq: 'monthly', priority: '0.7' },
    { loc: '/about-us',                  changefreq: 'monthly', priority: '0.6' },
    { loc: '/contact-us',                changefreq: 'monthly', priority: '0.6' },
    { loc: '/join-as-astrologer',        changefreq: 'monthly', priority: '0.6' },
    { loc: '/memory-guru',               changefreq: 'monthly', priority: '0.6' },
    { loc: '/book',                      changefreq: 'monthly', priority: '0.5' },
    { loc: '/privacy-policy',            changefreq: 'yearly',  priority: '0.3' },
    { loc: '/terms-of-service',          changefreq: 'yearly',  priority: '0.3' },
    { loc: '/refund-policy',             changefreq: 'yearly',  priority: '0.3' },
    { loc: '/disclaimer',                changefreq: 'yearly',  priority: '0.3' },
];

async function fetchAllPages(path, mapItem, getItems = (d) => d) {
    const out = [];
    let skip = 0;
    const limit = 100;
    for (;;) {
        const sep = path.includes('?') ? '&' : '?';
        const res = await fetch(`${API_URL}${path}${sep}skip=${skip}&limit=${limit}`);
        if (!res.ok) {
            console.warn(`  ! ${path} fetch failed (HTTP ${res.status})`);
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

const fetchBlogRoutes = () => fetchAllPages('/public/posts', (p) => `/blog/${p.slug}`, (d) => d.posts);
const fetchAstrologerRoutes = () => fetchAllPages('/astrologers/', (a) => `/astrologers/${a.slug || a.user_id}`);

const blogRoutes = await fetchBlogRoutes().catch(() => []);
const astrologerRoutes = await fetchAstrologerRoutes().catch(() => []);

const dynamicUrls = [
    ...blogRoutes.map(loc => ({ loc, changefreq: 'monthly', priority: '0.7' })),
    ...astrologerRoutes.map(loc => ({ loc, changefreq: 'weekly', priority: '0.8' }))
];

const allUrls = [...URLS, ...dynamicUrls];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(({ loc, changefreq, priority }) => `  <url>
    <loc>${BASE}${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// Ensure this writes to the correct location synchronously or asynchronously
writeFileSync(OUT, xml, 'utf8');
console.log(`Sitemap written to ${OUT} (${allUrls.length} URLs)`);

export { URLS };
