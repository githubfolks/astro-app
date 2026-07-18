# SEO Content Audit
## aadikarta.org
### Date: 2026-07-18 (previous audit: 2026-06-17)

---

## Site Availability — Resolved During This Audit

**aadikarta.org was down (`502 Bad Gateway`) for roughly an hour during this audit**, confirmed across multiple retries on every path (`/`, `/robots.txt`, `/sitemap.xml`, `http://`/`https://`, with/without `www`), then came back on its own around **2026-07-18 17:02 GMT** (per the live `Last-Modified` header) — someone/something restarted or redeployed the `web` container during the session. The site is now confirmed live and serving `200 OK` with correctly prerendered HTML on every route spot-checked (homepage, `/services/vedic-astrology`, `/horoscope`, `/horoscope/aries`, `/astrologers` — each returns a unique, fully-rendered `<title>` and `<h1>`, not a blank SPA shell).

**Likely cause — `d49fe01` "seo fixes" (2026-07-16):** This commit added a build-time prerendering step (`web/scripts/prerender.js`) that boots a headless Chromium and renders every route before shipping the Docker image, and switched the build's base image from `node:20-alpine` to the much heavier `mcr.microsoft.com/playwright:v1.61.0-noble`. The script had a bug: `if (failed > 0) process.exitCode = 1;` meant **a single route timing out during prerender (e.g. one slow blog post fetched from the live API) would fail the entire production build**. I couldn't confirm this from VPS logs (no SSH access from this environment), but it's a real, reproducible bug regardless of whether it caused this specific incident.

**Fixed locally during this audit** — [`web/scripts/prerender.js:153-158`](web/scripts/prerender.js#L153): the build now only fails if *zero* routes prerendered (i.e. the mechanism itself is broken), not on an isolated per-route failure, matching the script's own stated intent that a missed prerender just falls back to the normal SPA shell for that one page — not a regression. **This fix has not been deployed yet** — the currently-live build still predates it and predates the `og:image` fix below (confirmed live: `og-image.jpg` still 404s in production).

All findings below combine the earlier source-code audit with live verification once the site came back up.

---

## SEO Health Score: 80/100 (up from 64/100 on 2026-06-17)

| Category | Score | Change | Weight |
|---|---|---|---|
| Site Availability | 90/100 | ⚠️ ~1hr outage during this audit, since resolved — worth root-causing | High |
| Technical SEO (crawlability) | 78/100 | ▲ from 40 — prerendering added and confirmed working live | High |
| On-Page SEO | 85/100 | ▲ from 80 | High |
| Structured Data | 82/100 | ▲ from 78 | Medium |
| Content Quality (E-E-A-T) | 62/100 | — unchanged | High |
| URL Structure | 55/100 | — unchanged | Medium |
| Internal Linking | 65/100 | — unchanged | Medium |
| Sitemap & Robots | 80/100 | ▼ slightly (dynamic routes still missing) | Medium |

The biggest structural gap from the last audit — a pure client-side SPA invisible to non-JS crawlers — has been substantially addressed via the new build-time prerendering step, confirmed working live on multiple routes. Three previously-flagged bugs (dead CTA, wrong breadcrumb URL, unsubstantiated `aggregateRating` claim) have all been fixed since. The ~1hr outage during this audit (see above) didn't recur, but its root cause wasn't confirmed — worth a quick VPS log check to make sure it doesn't repeat on the next deploy.

---

## Fixed Since Last Audit (2026-06-17 → today)

| Issue | Status |
|---|---|
| SPA sends blank shell to crawlers on every non-homepage route | ✅ Fixed — build-time prerendering (`prerender.js`) now renders all static + dynamic routes to static HTML |
| Dead "Book a Reading Now" CTA on `/services/vedic-astrology` (no `onClick`/`Link`) | ✅ Fixed — now a proper `<Link to="/astrologers">` ([VedicAstrology.tsx:142](web/src/pages/services/VedicAstrology.tsx#L142)) |
| Horoscope page `BreadcrumbList` pointed position 2 at `/astrologers` instead of a horoscope hub | ✅ Fixed — now points to `/horoscope` ([HoroscopeSign.tsx:222](web/src/pages/horoscope/HoroscopeSign.tsx#L222)), and a `/horoscope` listing page now exists (`HoroscopeListing.tsx`, in sitemap) |
| Organization schema claimed `aggregateRating` of 4.8★/1,200 reviews with no visible reviews on the page (Rich Results / manual-action risk) | ✅ Fixed — `aggregateRating` removed from `Home.tsx`'s structured data entirely |
| Canonical URL trailing-slash inconsistency between `index.html` and `SEO.tsx` | ✅ Fixed — both now consistently use `https://aadikarta.org/` |
| Homepage meta description was 199 chars (30% truncated in SERPs) | ✅ Fixed — now 140 chars |
| Title tags over 70+ chars sitewide | ✅ Partially fixed — e.g. Vedic Astrology page title now 58 chars; homepage still 71 chars (see below) |
| Three.js particle animation on `/services/vedic-astrology` (LCP/TBT liability) | ✅ Removed — no longer in the codebase or `package.json` |

## New Issue Found & Fixed Locally (Not Yet Deployed)

| Issue | Status |
|---|---|
| Every page's `og:image`/`twitter:image` pointed to `/assets/og-image.jpg`, but only `og-image.png` exists on disk — confirmed live (`og-image.jpg` still 404s on production as of this audit) — every social share (WhatsApp, X, Facebook, LinkedIn link previews) of any page is currently rendering a broken image card | ✅ Fixed in source — [`SEO.tsx:22`](web/src/components/SEO.tsx#L22), [`index.html:24`](web/index.html#L24), [`index.html:36`](web/index.html#L36) now point to the `.png` that actually exists. **Needs a rebuild + redeploy to take effect in production.** |

---

## On-Page SEO Checklist

### Title Tag
| Page | Current | Length | Status |
|---|---|---|---|
| Homepage | `Talk to Verified Astrologers Online \| Vedic, Kundli & Tarot \| Aadikarta` | 71 chars | ⚠️ Needs work — will truncate in SERPs |
| Vedic Astrology | `Vedic Astrology (Jyotish) Consultations Online \| Aadikarta` | 58 chars | ✅ Pass |
| Static fallback (`index.html`, pre-hydration) | `Aadikarta — Talk to Expert Astrologers Online` | 46 chars | ✅ Pass, but **differs from the Helmet-rendered title** — see below |

**Issue:** The static `index.html` title/description and the per-page `SEO.tsx` (Helmet) title/description are two independent, hand-maintained sources of truth for the homepage. They already disagree (`Aadikarta — Talk to Expert Astrologers Online` vs `Talk to Verified Astrologers Online | Vedic, Kundli & Tarot | Aadikarta`). Since the new prerender step now bakes the Helmet-rendered version into `dist/index.html` at build time, the static `<head>` in `web/index.html` is dead weight for the homepage specifically — worth removing the duplicate title/description/OG/canonical block from `index.html` (keep the JSON-LD Organization block only) to eliminate the drift risk going forward, or explicitly sync them.

**Recommended homepage title (60 chars):** `Talk to Verified Astrologers Online | Vedic & Tarot | Aadikarta`

### Meta Description
Homepage now 140 chars ✅ (was 199). Good improvement, no further action needed.

### Heading Hierarchy
Single H1 on homepage ("Talk to Verified Astrologers Online" — inside `<Hero>`), no duplicate/missing H1s found in the homepage's component tree. This is a change from the last audit's H1 ("Unlock Your Cosmic Destiny") — the H1 has since been rewritten to include the primary keyword directly. ✅

### Image Optimization
All sampled `<img>` tags on the homepage (hero, header logo, footer logo, Memory Guru banner, astrologer cards) have non-empty, descriptive `alt` text and explicit `width`/`height`. No missing-alt cases found. ✅

### Internal Linking
Not re-audited in full this pass (unchanged since 2026-06-17 findings — homepage still has no direct links to individual `/services/*` pages; footer remains thin). See prior recommendations below, still open.

### URL Structure
Astrologer profile pages still use numeric IDs (`/astrologers/123`) rather than slugs — unchanged, still the top open URL-structure issue (see Prioritized Recommendations).

---

## Content Quality (E-E-A-T)
Not re-verified this pass — requires the live site. Carrying forward from 2026-06-17: Experience (Weak), Expertise (Present), Authoritativeness (Weak — no blog author bylines), Trustworthiness (Present). Re-check once the site is back up.

---

## Technical SEO

### Crawlability — Substantially Improved
The core fix from the last audit's #1 recommendation has been implemented: `web/scripts/prerender.js` now headlessly renders every route (34 static routes from `generate-sitemap.js`, plus blog posts and astrologer profiles fetched live from the API at build time) and writes fully-rendered HTML to `dist/`, so crawlers without JS execution now see real content instead of an empty `<div id="app">` shell — for every route that successfully prerenders.

**Gap:** Per the script's own comment ([prerender.js:10-12](web/scripts/prerender.js#L10)), CMS pages served via a generic `/:slug` route are *not* prerendered — there's no public API endpoint to enumerate all CMS slugs. If any CMS-driven pages are meant to rank, this is an open gap.

### Robots.txt — ✅ Good, unchanged
Well-structured; private/auth routes disallowed, AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) explicitly allowed, sitemap referenced.

### Sitemap.xml — ⚠️ Still Incomplete
`web/scripts/generate-sitemap.js` hand-maintains 34 static URLs (including the now-added `/horoscope` hub). **Still missing:** individual blog post URLs and individual astrologer profile URLs — both are prerendered (so crawlable via internal links) but not listed in `sitemap.xml`, meaning they rely entirely on discovery through links rather than the sitemap. `lastmod` is set to the build date for every URL uniformly (not per-page actual last-modified), which is low-value but harmless.

**Fix:** Have `generate-sitemap.js` fetch blog slugs and astrologer slugs from the API (the same data `prerender.js` already fetches) and append them before writing `sitemap.xml`.

### Canonical / Base URL — Fragile, Hardcoded in 3 Places
`https://aadikarta.org` is hardcoded independently in `web/index.html`, `web/src/components/SEO.tsx` (`BASE_URL`), and `web/scripts/generate-sitemap.js` (`BASE`) — no single source of truth (no `.env`-driven `VITE_SITE_URL` or similar). Not a bug today, but any future staging/environment change requires editing all three in sync, and a missed one would silently ship wrong canonical/OG/sitemap URLs.

### Twitter Handle — Still Inconsistent
`index.html:32` uses `@aadikarta`; `SEO.tsx:67` uses `@astro_aadikarta`. The Footer links to `x.com/astro_aadikarta`, suggesting `@astro_aadikarta` is correct — recommend fixing `index.html` to match (or vice versa if the handle changed).

### Structured Data — Duplicate Organization Schema
`index.html` still defines a static `Organization` JSON-LD block (name, url, logo, description — no `aggregateRating` now, which is good) *and* `Home.tsx` independently defines Organization schema again via Helmet as part of a `WebSite`+`Organization` `@graph`. Both can end up present depending on how the prerendered HTML merges with the static block. Low risk now that the `aggregateRating` claim is gone from both, but still worth consolidating to one source.

---

## Prioritized Recommendations

### Critical (Fix Immediately)
1. **Deploy the two local fixes made during this audit** (`prerender.js` build-resilience fix, `og-image.png` path fix) — neither is live yet. Standard flow: `git pull && docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build web` on the VPS.
2. **Confirm what caused the ~1hr outage today.** Check `docker compose logs web` on the VPS around 2026-07-18 16:00–17:02 GMT to see whether it matches the `prerender.js` build-failure theory above, so you know whether the fix actually addresses it.

### High Priority (This Week)
1. Shorten the homepage title tag from 71 to ≤60 chars so it doesn't truncate in SERPs.
2. Add blog post and astrologer profile URLs to `sitemap.xml` (data already fetched in `prerender.js`, easy to share with `generate-sitemap.js`).
3. Fix the Twitter handle mismatch (`@aadikarta` vs `@astro_aadikarta`) in `index.html`.
4. Consolidate the duplicate `Organization` JSON-LD (pick `Home.tsx`'s Helmet version, drop the static one in `index.html`, or vice versa).

### Medium Priority (This Month)
1. Migrate astrologer profile URLs from numeric IDs (`/astrologers/123`) to slugs — these are your highest-transactional-intent pages and are currently unfriendly to search by URL.
2. Remove the now-redundant static title/description/OG block from `index.html`'s homepage `<head>` (the prerender step already bakes the correct per-page version into `dist/index.html`), or make it explicitly track `SEO.tsx`'s output to stop the two from drifting.
3. Extend `prerender.js` to cover CMS `/:slug` pages once a slug-listing API endpoint exists.
4. Re-run the full content/E-E-A-T and internal-linking checks from the 2026-06-17 audit once the site is back up — those weren't re-verified this pass.

### Low Priority (When Resources Allow)
1. Single source of truth for the site's base URL (env var) instead of hardcoding `https://aadikarta.org` in three separate files.
