# Marketing Audit: Aadikarta
**URL:** https://aadikarta.org/
**Date:** 2026-07-16
**Business Type:** Marketplace / Consumer Services (two-sided: paying users ↔ astrologers), pay-per-minute chat model, India-focused (`og:locale: en_IN`)
**Overall Marketing Score: 38/100 (Grade: F)**

> **Read this first:** the low score is driven almost entirely by one technical issue, not the underlying business. Aadikarta is a **client-side-rendered React/Vite single-page app with no server-side rendering or pre-rendering**. I confirmed this by fetching the raw HTML (as a crawler would, no JS execution) for four different routes (`/`, `/about-us`, `/blog`, `/chat-with-astrologers`) — **all four returned the byte-identical 4KB HTML shell.** Whatever content, pricing, testimonials, or copy exists on the live site is injected by JavaScript after load, which means search crawlers and AI answer engines that don't execute JS see almost nothing. This single fix (server-side rendering or static pre-rendering) would likely move several sub-scores by 20-30 points each, independent of any copy or design changes.

---

## Score Breakdown

| Category | Score | Weight | Weighted Score | Key Finding |
|----------|-------|--------|---------------|-------------|
| Content & Messaging | 35/100 | 25% | 8.75 | Only 2 sentences of copy (meta description) are visible to any non-JS crawler |
| Conversion Optimization | 40/100 | 20% | 8.0 | Pricing (₹10/min) exists only in meta tags, not in visible/crawlable page content |
| SEO & Discoverability | 38/100 | 20% | 7.6 | Good bones (robots.txt, sitemap, OG tags) undermined by zero unique content per route |
| Competitive Positioning | 25/100 | 15% | 3.75 | Zero external footprint — doesn't appear in general web search even for its own name |
| Brand & Trust | 45/100 | 10% | 4.5 | Full legal page suite present (good); zero third-party reviews found anywhere |
| Growth & Strategy | 55/100 | 10% | 5.5 | Sitemap reveals a genuinely good programmatic-SEO plan (zodiac + service pages) |
| **TOTAL** | | **100%** | **38.1/100** | |

*Confidence note: Content and Conversion scores are partly inferred, since I cannot execute the site's JavaScript to see the actually-rendered page. SEO, Competitive, Brand, and Growth scores are based on directly-verified evidence (raw HTML diffs, robots.txt, sitemap.xml, live web search results).*

---

## Executive Summary

Aadikarta is an online astrology chat platform (Vedic astrology, kundli matching, tarot, vastu) competing in a crowded Indian market against entrenched players like AstroTalk (15,000+ astrologers) and Astroyogi (5,000+ astrologers). The team has clearly thought about SEO strategically — the `robots.txt` explicitly allows `GPTBot`, `ClaudeBot`, `PerplexityBot`, and `Google-Extended` (most sites don't bother with this yet), and the `sitemap.xml` lays out a smart 36-URL content architecture: 12 zodiac-sign horoscope pages, 6 service-specific landing pages, an `/ai-astrologer` page, and a `/pricing` page.

The problem is that none of it can be seen. The site is built as a client-side-rendered single-page app (Vite + React, `<div id="app">` with an empty body), and there is no pre-rendering or SSR layer. I fetched four different URLs and got the exact same generic HTML shell every time — meaning every page on the site currently presents an identical, generic title ("Aadikarta — Talk to Expert Astrologers Online") and identical meta description to Google, Bing, GPTBot, ClaudeBot, and PerplexityBot alike. The `/horoscope/aries` page and the `/pricing` page are indistinguishable to a crawler. This also explains why Aadikarta produces zero results in a general web search for its own name — it likely has near-zero indexed, differentiated content and no backlinks or third-party reviews yet.

The good news: this is a solvable, bounded engineering problem, not a strategy problem. The content plan (sitemap) and the AI-crawler awareness (robots.txt) show the team already knows what good SEO/AEO looks like — it just isn't shipping yet. Fixing rendering, then filling in the already-planned pages with real content, is the highest-leverage path to visibility.

**Top 3 actions that would move the needle most:**
1. Ship server-side rendering or pre-rendering (even a lightweight static-generation pass for the 36 sitemap URLs) — this unlocks every other SEO/AEO investment.
2. Build out the already-mapped zodiac and service content pages with real, differentiated copy once rendering is fixed.
3. Start active backlink/review acquisition — right now there is no detectable third-party trust signal anywhere on the open web.

---

## Quick Wins (This Week)

1. **Add a lightweight prerender/static-snapshot step** for the top 5 priority URLs (`/`, `/pricing`, `/astrologers`, `/ai-astrologer`, `/blog`) using a tool like `vite-plugin-ssr`, `react-snap`, or a simple prerender.io-style middleware — doesn't require a full framework migration, just gets real text into the served HTML.
2. **Differentiate `<title>` and `<meta name="description">` per route** even before full rendering is fixed — right now every one of the 36 sitemap URLs serves the identical title/description, which is a duplicate-content signal search engines actively penalize.
3. **Surface pricing in visible/crawlable text** — "from ₹10/min" currently exists only inside `<meta>` tags, not in anything a crawler renders as page content. This is also the #1 thing an AI answer engine would need to quote Aadikarta accurately.
4. **Add `Service`/`FAQPage`/`Product` schema** beyond the single generic `Organization` JSON-LD currently present sitewide — structured data per page (pricing, service pages) directly improves AEO citation odds.
5. **Add a visible testimonials/reviews block with `Review` schema** — there is currently no detectable trust signal anywhere (see Competitive Positioning below).

## Strategic Recommendations (This Month)

1. **Move to SSR or full static generation** for all 36 sitemap routes. This is the single highest-leverage fix on this list — every SEO/AEO/content investment made before this ships is largely invisible to the systems that drive discovery.
2. **Build out the zodiac (12 pages) and service-silo (6 pages) content** already mapped in the sitemap with genuinely deep, unique copy — this is a proven content-scaling tactic in this niche (daily horoscope content drives high-frequency repeat visits and long-tail search traffic).
3. **Launch a review/backlink acquisition push** (Google Business reviews, app-store reviews if a mobile app exists, guest content, directory listings) — Aadikarta currently returns zero results in general web search even for an exact-name query, meaning there is effectively no external trust graph to draw on yet.
4. **Publish comparison/positioning content** ("Aadikarta vs AstroTalk", "how Aadikarta pricing compares") to claim competitive search queries and make the ₹10/min entry price and the `/ai-astrologer` feature (which established competitors may not emphasize) a clear differentiator.

## Long-Term Initiatives (This Quarter)

1. **Full AEO investment**: since the `robots.txt` already deliberately welcomes AI crawlers, follow through with citable, structured content (clear definitions, FAQs, stats) across the horoscope/service pages so ChatGPT/Perplexity/Claude start recommending Aadikarta by name for "best online astrology chat" type queries.
2. **Individual astrologer profile pages** with credential/schema markup, mirroring AstroTalk's proven model of one indexable landing page per astrologer — a strong long-tail SEO and trust-building lever.
3. **India-specific local layer**: city-level landing pages ("astrologer in Delhi", "kundli matching in Mumbai") to capture local intent alongside the global online-only positioning already in place.

---

## Detailed Analysis by Category

### SEO & Discoverability (Verified)
- `robots.txt` is unusually well-considered: it blocks crawl budget waste on private routes (`/dashboard`, `/chat/`, `/login`, etc.) and *explicitly allows* `PerplexityBot`, `GPTBot`, `ClaudeBot`, `anthropic-ai`, and `Google-Extended` — a forward-thinking, deliberate choice most sites at this stage haven't made.
- `sitemap.xml` is present and lists 36 well-structured URLs with sensible priority/changefreq values.
- Open Graph and Twitter Card tags are complete and well-written on the shell HTML.
- **Critical gap**: the served HTML for every route is identical — no unique `<title>`, meta description, headings, or body content per page. This is a duplicate-content problem across the entire site from a crawler's point of view, and it means the sitemap's 36 URLs currently offer no differentiated signal to rank on.
- Only one JSON-LD block exists sitewide (generic `Organization` schema) — no per-page structured data.

### Competitive Positioning (Verified)
- AstroTalk (15,000+ verified astrologers, first chat free, ₹10-250+/min depending on astrologer) and Astroyogi (5,000+ astrologers, per-minute pricing shown per profile, first consultation free) are the dominant, SEO-entrenched competitors.
- A web search for "aadikarta astrology reviews" returned **zero results referencing Aadikarta at all** — the brand currently has no detectable external footprint (no reviews, no press, no directory listings, no backlinks found).
- Aadikarta's entry pricing (₹10/min, per its own meta description) is competitive with AstroTalk's budget tier, but this isn't yet a differentiator anyone can discover, since it's invisible outside the meta tag.

### Brand & Trust (Verified)
- Full legal page suite present: Privacy Policy, Terms of Service, Refund Policy, Disclaimer — appropriate and reassuring for a paid consultation service handling payments, and something not all early-stage competitors bother to complete.
- No third-party reviews, press mentions, or citations found anywhere in open web search — zero external trust graph currently.

### Growth & Strategy (Verified via sitemap)
- The sitemap reveals a genuinely solid content strategy already planned: 12 zodiac-sign pages, 6 service-specific pages (Vedic astrology, kundli matching, love advice, daily horoscope, tarot, vastu shastra), a dedicated `/ai-astrologer` page, and a `/pricing` page.
- This is the right shape for both traditional SEO (topical content silos) and AEO (specific, quotable service pages) — the strategy is sound, execution/rendering is the blocker.

### Content & Messaging / Conversion Optimization (Lower confidence — JS-rendering blocks direct inspection)
- The only copy visible to an automated, non-JS fetch is: *"Connect with top verified astrologers on Aadikarta. Get live chat consultations on Vedic astrology, kundli matching, and daily horoscope from ₹10/min."* This is solid, benefit-led copy — but it's the only copy any crawler (or AI system) can currently read.
- Actual on-page hero copy, testimonials, CTAs, and the consultation/chat flow could not be verified — this requires either a headless-browser fetch or manual review in an actual browser, since automated fetching only returns the pre-JS shell.

---

## Revenue Impact Summary

No analytics access (traffic, conversion rate, or ARPU) was available for this audit, so dollar figures below are **illustrative only**, based on typical industry benchmarks for early-stage content/marketplace sites — treat as directional, not a forecast, until real GA4/Search Console data is reviewed.

| Recommendation | Est. Monthly Impact | Confidence | Timeline |
|---------------|-------------------|------------|----------|
| Ship SSR/pre-rendering (unlocks all downstream SEO/AEO) | Foundational — enables all other line items | High (directionally) | 2-4 weeks |
| Build out zodiac + service content pages | Meaningful organic traffic lift once indexed | Medium | 4-8 weeks |
| Review/backlink acquisition | Improves trust + indirect ranking lift | Medium | Ongoing |
| AEO/structured data investment | New acquisition channel (AI-answer citations) | Low-Medium (emerging channel) | 8-12 weeks |

---

## Next Steps

1. Fix rendering (SSR or pre-rendering) — nothing else on this list matters at scale until this ships.
2. Differentiate meta tags and add structured data per page.
3. Start closing the trust/backlink gap in parallel, since that's a slow-building asset.

*Generated by AI Marketing Suite — `/market audit` (adapted: business content was not directly fetchable due to client-side rendering; findings above are clearly labeled verified vs. inferred).*
