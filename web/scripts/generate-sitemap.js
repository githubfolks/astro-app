#!/usr/bin/env node
/**
 * Generates public/sitemap.xml by combining static routes with dynamic
 * astrologer profiles and blog post slugs fetched from the API.
 *
 * Usage:
 *   VITE_API_URL=https://api.aadikarta.org node scripts/generate-sitemap.js
 *
 * Add to package.json build step:
 *   "build": "node scripts/generate-sitemap.js && tsc && vite build"
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/sitemap.xml');
const BASE = 'https://aadikarta.org';
const API_URL = process.env.VITE_API_URL;

const today = new Date().toISOString().slice(0, 10);

// Static routes — kept in sync with the router
const STATIC_URLS = [
    { loc: '/',                          changefreq: 'daily',   priority: '1.0' },
    { loc: '/astrologers',               changefreq: 'daily',   priority: '0.9' },
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
    { loc: '/contact-us',               changefreq: 'monthly', priority: '0.6' },
    { loc: '/join-as-astrologer',        changefreq: 'monthly', priority: '0.6' },
    { loc: '/memory-guru',               changefreq: 'monthly', priority: '0.6' },
    { loc: '/book',                      changefreq: 'monthly', priority: '0.5' },
    { loc: '/privacy-policy',            changefreq: 'yearly',  priority: '0.3' },
    { loc: '/terms-of-service',          changefreq: 'yearly',  priority: '0.3' },
    { loc: '/refund-policy',             changefreq: 'yearly',  priority: '0.3' },
    { loc: '/disclaimer',                changefreq: 'yearly',  priority: '0.3' },
];

function urlEntry({ loc, changefreq, priority, lastmod }) {
    return `  <url>
    <loc>${BASE}${loc}</loc>
    <lastmod>${lastmod || today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function fetchJson(path) {
    if (!API_URL) return null;
    try {
        const res = await fetch(`${API_URL}${path}`);
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

async function main() {
    const entries = STATIC_URLS.map(urlEntry);

    // Dynamic: blog posts
    const postsData = await fetchJson('/api/cms/posts?limit=500&status=published');
    if (postsData?.posts) {
        for (const post of postsData.posts) {
            if (!post.slug) continue;
            entries.push(urlEntry({
                loc: `/blog/${post.slug}`,
                changefreq: 'weekly',
                priority: '0.7',
                lastmod: (post.updated_at || post.published_at || today).slice(0, 10),
            }));
        }
        console.log(`Added ${postsData.posts.length} blog post URLs`);
    } else {
        console.warn('Could not fetch blog posts — set VITE_API_URL to include dynamic posts');
    }

    // Dynamic: astrologer profiles
    const astroData = await fetchJson('/api/astrologers?limit=500&status=active');
    const astrologers = astroData?.astrologers || astroData?.data || astroData;
    if (Array.isArray(astrologers)) {
        for (const a of astrologers) {
            const slug = a.slug || a.id;
            if (!slug) continue;
            entries.push(urlEntry({
                loc: `/astrologers/${slug}`,
                changefreq: 'weekly',
                priority: '0.7',
                lastmod: today,
            }));
        }
        console.log(`Added ${astrologers.length} astrologer profile URLs`);
    } else {
        console.warn('Could not fetch astrologers — set VITE_API_URL to include dynamic profiles');
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

    writeFileSync(OUT, xml, 'utf8');
    console.log(`Sitemap written to ${OUT} (${entries.length} URLs)`);
}

main().catch(err => { console.error(err); process.exit(1); });
