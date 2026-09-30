#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/sitemap.xml');
const BASE = process.env.VITE_SITE_URL || 'https://aadikarta.org';
const API_URL = process.env.VITE_API_URL || 'https://api.aadikarta.org';

const URLS = [
    { loc: '/',                          changefreq: 'daily',   priority: '1.0' },
    { loc: '/astrologers',               changefreq: 'daily',   priority: '0.9' },
    { loc: '/astrologers/city/delhi',     changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/mumbai',    changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/bangalore', changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/kolkata',   changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/chennai',   changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/hyderabad', changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/pune',      changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/ahmedabad', changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/jaipur',    changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/lucknow',   changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/chandigarh', changefreq: 'weekly', priority: '0.8' },
    { loc: '/astrologers/city/indore',    changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/patna',     changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/surat',     changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/kochi',     changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/varanasi',  changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/nagpur',    changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/bhopal',    changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/coimbatore', changefreq: 'weekly', priority: '0.8' },
    { loc: '/astrologers/city/ludhiana',  changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/gurgaon',   changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/noida',     changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/dubai',     changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/london',    changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/toronto',   changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/singapore', changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/new-york',  changefreq: 'weekly',  priority: '0.8' },
    { loc: '/astrologers/city/sydney',    changefreq: 'weekly',  priority: '0.8' },
    { loc: '/ai-astrologer',             changefreq: 'monthly', priority: '0.9' },
    { loc: '/how-it-works',              changefreq: 'monthly', priority: '0.8' },
    { loc: '/pricing',                   changefreq: 'monthly', priority: '0.8' },
    { loc: '/panchang',                  changefreq: 'daily',   priority: '0.7' },
    { loc: '/blog',                      changefreq: 'daily',   priority: '0.8' },
    { loc: '/services/horoscope',                 changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/aries',           changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/taurus',          changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/gemini',          changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/cancer',          changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/leo',             changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/virgo',           changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/libra',           changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/scorpio',         changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/sagittarius',     changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/capricorn',       changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/aquarius',        changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/pisces',          changefreq: 'monthly', priority: '0.8' },
    { loc: '/services/horoscope/yearly',                 changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/aries',           changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/taurus',          changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/gemini',          changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/cancer',          changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/leo',             changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/virgo',           changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/libra',           changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/scorpio',         changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/sagittarius',     changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/capricorn',       changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/aquarius',        changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/horoscope/yearly/pisces',          changefreq: 'yearly', priority: '0.7' },
    { loc: '/services/vedic-astrology',  changefreq: 'monthly', priority: '0.7' },
    { loc: '/services/kundli-matching',  changefreq: 'monthly', priority: '0.7' },
    { loc: '/services/love-advice',      changefreq: 'monthly', priority: '0.7' },
    { loc: '/services/daily-horoscope',  changefreq: 'daily',   priority: '0.7' },
    { loc: '/services/tarot-reading',    changefreq: 'monthly', priority: '0.7' },
    { loc: '/services/vastu-shastra',    changefreq: 'monthly', priority: '0.7' },
    { loc: '/services/ai-instant-reports', changefreq: 'monthly', priority: '0.7' },
    { loc: '/tools/manglik-dosha-checker', changefreq: 'monthly', priority: '0.7' },
    { loc: '/tools/numerology-calculator', changefreq: 'monthly', priority: '0.7' },
    { loc: '/tools/kundli-matching',       changefreq: 'monthly', priority: '0.7' },
    { loc: '/tools/kundli-chart',          changefreq: 'monthly', priority: '0.7' },
    { loc: '/tools/navamsa-chart',         changefreq: 'monthly', priority: '0.6' },
    { loc: '/about-us',                  changefreq: 'monthly', priority: '0.6' },
    { loc: '/contact-us',                changefreq: 'monthly', priority: '0.6' },
    { loc: '/join-as-astrologer',        changefreq: 'monthly', priority: '0.6' },
    { loc: '/astrologer-benefits',       changefreq: 'monthly', priority: '0.6' },
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

// Each post carries its real last-edit date so <lastmod> stays truthful —
// stamping every URL with the build date teaches Google to ignore lastmod.
const toDate = (iso) => (iso ? String(iso).slice(0, 10) : undefined);
const fetchBlogRoutes = () => fetchAllPages(
    '/public/posts',
    (p) => ({ loc: `/blog/${p.slug}`, lastmod: toDate(p.updated_at || p.published_at) }),
    (d) => d.posts,
);
const fetchAstrologerRoutes = () => fetchAllPages('/astrologers/', (a) => `/astrologers/${a.slug || a.user_id}`);

const blogRoutes = await fetchBlogRoutes().catch(() => []);
const astrologerRoutes = await fetchAstrologerRoutes().catch(() => []);

// The /blog index changes only when a post is published or edited.
const latestBlogDate = blogRoutes.map((r) => r.lastmod).filter(Boolean).sort().pop();
const staticUrls = URLS.map((u) => (u.loc === '/blog' && latestBlogDate ? { ...u, lastmod: latestBlogDate } : u));

const dynamicUrls = [
    ...blogRoutes.map(({ loc, lastmod }) => ({ loc, lastmod, changefreq: 'monthly', priority: '0.7' })),
    ...astrologerRoutes.map(loc => ({ loc, changefreq: 'weekly', priority: '0.8' }))
];

const allUrls = [...staticUrls, ...dynamicUrls];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(({ loc, lastmod, changefreq, priority }) => `  <url>
    <loc>${BASE}${loc}</loc>${lastmod ? `
    <lastmod>${lastmod}</lastmod>` : ''}
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>`;

// Ensure this writes to the correct location synchronously or asynchronously
writeFileSync(OUT, xml, 'utf8');
console.log(`Sitemap written to ${OUT} (${allUrls.length} URLs)`);

export { URLS };
