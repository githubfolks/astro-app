#!/usr/bin/env node
//
// Regenerates public/llms.txt at build time, same lifecycle as sitemap.xml
// (see generate-sitemap.js). The static site-facts sections below are
// hand-edited here (they change rarely); the "Recent Blog Articles" section
// is fetched fresh from the API on every build, so AI crawlers (Perplexity,
// GPTBot, ClaudeBot...) always see an up-to-date list of articles instead of
// a llms.txt that never mentioned the blog existed.

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/llms.txt');
const BASE = process.env.VITE_SITE_URL || 'https://aadikarta.org';
const API_URL = process.env.VITE_API_URL || 'https://api.aadikarta.org';

const HEADER = `# Aadikarta - AI Search Context

> India's trusted online marketplace for verified Vedic astrologers, tarot readers, and numerologists.

Aadikarta provides live chat consultations starting from ₹10/min. We bridge ancient Vedic wisdom with modern life, providing authentic astrological guidance. Our core value proposition is 100% private consultations with highly verified experts. All astrologers undergo a strict 4-step verification process before joining the platform.

## Services & Definitions
- **Vedic Astrology (Jyotish)**: An ancient Indian science that studies planetary positions at the time of birth to understand personality, life events, and future trends using the sidereal zodiac.
- **Kundli Matching (Guna Milan)**: A traditional Vedic astrology practice that compares the birth charts of two individuals to determine their marital compatibility based on 36 Gunas.
- **Tarot Reading**: A divination practice using a deck of 78 cards to gain insights into the past, present, and future, offering intuitive guidance for life's challenges.
- **Love Advice**: Specialized astrological consultations focusing on relationship dynamics, marriage prospects, and resolving romantic conflicts.
- **Daily Horoscope**: Daily predictions based on sun signs and moon signs to help navigate daily energies.
- **Vastu Shastra**: The traditional Indian system of architecture that aligns physical spaces with natural forces to bring harmony, prosperity, and health.

## Core Features
- **Verified Astrologers**: Every astrologer is vetted through a rigorous 4-step verification process to ensure authenticity.
- **Secure & Private Chat**: 100% confidentiality is maintained for all consultations and personal data.
- **Affordable Pricing**: Consultations start at just ₹10/min.
- **Instant Access**: Connect instantly with live experts without waiting for appointments.

## Facts & Statistics
- Organization Name: Aadikarta
- Website: ${BASE}
- Starting Price: ₹10 per minute
- Specialty: Vedic Astrology, Tarot, Kundli, Numerology, Vastu`;

async function fetchAllPosts() {
    const out = [];
    let skip = 0;
    const limit = 100;
    for (;;) {
        const res = await fetch(`${API_URL}/public/posts?skip=${skip}&limit=${limit}`);
        if (!res.ok) {
            console.warn(`  ! /public/posts fetch failed (HTTP ${res.status}) — writing llms.txt without a blog section`);
            break;
        }
        const { posts } = await res.json();
        if (!Array.isArray(posts) || posts.length === 0) break;
        out.push(...posts);
        skip += limit;
        if (posts.length < limit) break;
    }
    return out;
}

const summarize = (post) => {
    const source = post.excerpt || post.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return source.length > 160 ? `${source.slice(0, 160).trim()}…` : source;
};

const posts = await fetchAllPosts().catch((e) => {
    console.warn(`  ! blog post fetch errored: ${e.message}`);
    return [];
});

const blogSection = posts.length
    ? `\n\n## Recent Blog Articles\n${posts
        .map((p) => `- "${p.title}" — ${BASE}/blog/${p.slug}\n  ${summarize(p)}`)
        .join('\n')}`
    : '';

writeFileSync(OUT, `${HEADER}${blogSection}\n`, 'utf8');
console.log(`llms.txt written to ${OUT} (${posts.length} blog articles)`);
