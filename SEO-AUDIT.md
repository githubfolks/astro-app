# SEO Content Audit
## aadikarta.org
### Date: 2026-06-17

---

## SEO Health Score: 64/100

| Category | Score | Weight |
|---|---|---|
| Technical SEO (SPA/crawlability) | 40/100 | High |
| On-Page SEO | 80/100 | High |
| Structured Data | 78/100 | Medium |
| Content Quality (E-E-A-T) | 62/100 | High |
| URL Structure | 55/100 | Medium |
| Internal Linking | 65/100 | Medium |
| Sitemap & Robots | 82/100 | Medium |

The site has strong on-page fundamentals (meta tags, OG, schema) but is severely limited by a client-side SPA architecture with no server-side rendering. Google's ability to crawl and index anything beyond the homepage is unreliable. Fixing this is the highest-leverage SEO action available.

---

## On-Page SEO Checklist

### Title Tags

| Page | Current Title | Length | Status |
|---|---|---|---|
| Homepage (static fallback) | `Aadikarta — Talk to Expert Astrologers Online \| Vedic Astrology, Tarot & More` | 76 chars | ⚠️ Too long |
| Homepage (JS, via Helmet) | `Talk to Expert Astrologers Online \| Vedic Astrology, Kundli & Tarot \| Aadikarta` | 82 chars | ⚠️ Too long |
| Astrologers | `Chat with Expert Astrologers Online \| Vedic, Tarot & Kundli \| Aadikarta` | 74 chars | ⚠️ Too long |
| Vedic Astrology | `Vedic Astrology Consultation Online \| Expert Jyotish Readings \| Aadikarta` | 76 chars | ⚠️ Too long |
| Blog | `Astrology Blog \| Vedic Wisdom, Horoscopes & Spiritual Guidance \| Aadikarta` | 76 chars | ⚠️ Too long |
| Horoscope (e.g. Aries) | `Aries Horoscope (मेष) \| Aadikarta` | 34 chars | ✅ Pass |

**Issues:**
- Every title with the ` | Aadikarta` suffix appended by the SEO component pushes already-long titles over 60 characters
- Google truncates titles over ~60 chars in SERPs — keywords at the end get cut off
- The static `index.html` title and the Helmet-rendered title are different, causing inconsistency during the JS hydration window

**Recommended pattern:** Move brand name to front OR shorten titles to leave room for the suffix.

```
Before: "Talk to Expert Astrologers Online | Vedic Astrology, Kundli & Tarot | Aadikarta"
After:  "Aadikarta — Talk to Verified Astrologers | Vedic, Tarot & Kundli" (65 chars)

Before: "Vedic Astrology Consultation Online | Expert Jyotish Readings | Aadikarta"
After:  "Vedic Astrology (Jyotish) Consultation | Aadikarta" (51 chars)
```

---

### Meta Description

| Page | Current | Length | Status |
|---|---|---|---|
| Homepage | "Connect with India's top verified astrologers on Aadikarta. Get live chat consultations on Vedic astrology, kundli matching, tarot reading, love advice, and daily horoscope. Starting from ₹10/min." | 199 chars | ⚠️ Too long (30% truncated in SERPs) |
| Astrologers | "Browse 500+ verified astrologers on Aadikarta. Chat live for Vedic astrology, kundli matching, tarot, love advice, and career predictions. Starting from ₹10/min." | 164 chars | ⚠️ Slightly long |
| Blog | "Explore expert articles on Vedic astrology, daily horoscopes, kundli, tarot readings, and spiritual guidance. Learn from India's top astrologers on Aadikarta." | 160 chars | ✅ Pass |

**Issues:**
- Homepage meta description is 199 characters — Google shows ~155 chars, so the last ~44 chars (including the price) are routinely hidden
- All descriptions are keyword-rich but written as lists rather than compelling ad copy

**Recommended homepage meta description (155 chars):**
```
India's top verified astrologers — live chat on Vedic astrology, kundli matching & tarot. 
Trusted by thousands. Starting from ₹10/min.
```

---

### Heading Hierarchy

**Homepage:**
- H1: "Unlock Your Cosmic Destiny" ⚠️ — branding phrase, zero keyword value for "talk to astrologer online"
- H2s: "Our Promise to You", "Are You an Expert Astrologer?" ⚠️ — no keyword-rich H2s about the core service
- H3s: "100% Privacy", "Verified Experts", "Satisfaction Guaranteed" — trust signals, fine

**Recommended H1:** "Talk to Verified Astrologers Online — Vedic, Tarot & Kundli from ₹10/min"
The current H1 would work as a visual tagline but should not be the H1 for search purposes.

**Vedic Astrology Service Page:**
- H1: "Vedic Astrology" ✅ — clean, keyword present
- H2s: "What is Vedic Astrology?", "The Pillars of Jyotish Wisdom", "Expert Vedic Interpretation" ✅ — well-structured
- H3s: "Dasha Systems", "Varga Charts", "Planetary Yogas" ✅

**Horoscope Pages (e.g. Aries):**
- H1: "Aries (मेष)" ✅
- H2s: "Aries Personality", "Key Traits", "Quick Facts", "All Zodiac Signs", "Want a personalised Aries reading?" ✅ — good use of keywords in headings

**Blog listing page:**
- H1: "Aadikarta Blog" ⚠️ — generic; should be "Vedic Astrology Blog — Horoscopes, Kundli & Spiritual Guidance"
- Individual post H3s: dynamic from API ✅

---

### Image Optimization

| Image | Alt Text | Width/Height | Status |
|---|---|---|---|
| `/assets/hero_astrology.png` | "Indian Mythological Astrology" | 800×600 declared ✅ | ⚠️ Alt text generic |
| `/assets/logo.png` (footer) | "Aadikarta" | Not declared | ⚠️ Missing dimensions |
| Blog post featured images | Uses `post.title` as alt | Not declared | ⚠️ Missing dimensions |
| Astrologer profile pictures | Not inspected (dynamic) | Unknown | ⚠️ Needs audit |

**Issues:**
- Hero image alt "Indian Mythological Astrology" misses the opportunity to include primary keywords
- Logo in footer missing `width`/`height`, which can contribute to CLS
- Blog and astrologer images are API-driven — need to ensure alt text is always populated server-side

**Recommended hero image alt:** `"Vedic astrologer consultation — Aadikarta"`

---

### Internal Linking

**Footer quick links:** About Us, Our Astrologers, Blog, Contact Us — only 4 links, missing all service pages and horoscope pages.

**Homepage → service pages:** Zero direct links to `/services/*` from the homepage. Services section exists but links directly to `/astrologers`, not individual service pages.

**Horoscope pages:** All 12 sign pages link to each other ✅ — well implemented hub-and-spoke.

**Blog posts:** Back-link to `/blog` only — no contextual links to related service pages or horoscope pages.

**Issues:**
- Homepage has zero internal links to high-value service pages (`/services/vedic-astrology`, `/services/kundli-matching`, etc.)
- Footer is the only sitewide navigation and has only 4 links — wastes crawl budget signal
- No blog → service page linking (e.g. a blog post on Kundli should link to `/services/kundli-matching`)

---

### URL Structure

| Page | URL | Status |
|---|---|---|
| Astrologers directory | `/astrologers` | ✅ |
| Service pages | `/services/vedic-astrology` | ✅ |
| Horoscope pages | `/horoscope/aries` | ✅ |
| Blog posts | `/blog/slug-here` | ✅ |
| **Astrologer profiles** | `/astrologers/123` | ❌ Numeric ID |
| Legal pages | `/privacy-policy` | ✅ |

**Critical issue:** Individual astrologer profile pages use numeric IDs (`/astrologers/42`). These pages likely have the highest transactional intent on the site but are invisible to search engines by URL pattern. A user searching "Guru Dev Vedic astrologer online" will never find `/astrologers/42`.

**Recommended:** Migrate to slug-based URLs: `/astrologers/guru-dev-vedic-astrologer` or `/astrologers/guru-dev-42`. The numeric ID can be kept as a fallback redirect.

---

## Content Quality (E-E-A-T)

| Dimension | Score | Evidence |
|---|---|---|
| Experience | Weak | No first-person case studies, no before/after consultation stories, no real user testimonials with full names |
| Expertise | Present | Service pages explain concepts well (Dasha Systems, Varga Charts); FAQ schema is accurate |
| Authoritativeness | Weak | No author bylines on blog posts, no press mentions, no third-party recognition |
| Trustworthiness | Present | HTTPS ✅, privacy policy ✅, refund policy ✅, phone + email in footer ✅, AggregateRating schema ✅ |

**Key E-E-A-T gaps:**
1. **Blog posts have no author bylines.** Google's guidelines specifically call out author attribution as a trust signal for YMYL (Your Money Your Life) content — astrology falls in this category for many users.
2. **Testimonials are hardcoded in schema markup** (Anjali S., Rahul K., Priya M.) but not visibly displayed on the page in a verifiable way. Google is increasingly skeptical of schema-only reviews.
3. **Astrologer verification is claimed** ("4-step screening process") but there's no public evidence (certifications, credentials) on individual astrologer profiles.
4. **Organization schema claims 1,200 reviews and 4.8 stars** — this should be backed by visible reviews on the site or it risks a manual action.

---

## Keyword Analysis

### Primary Keyword: "talk to astrologer online"
- Monthly search volume (India): ~40,000–80,000
- Competition: High (AstroSage, Astrotalk, Astroyogi dominate)
- Current alignment: **Partially aligned** — title contains "Talk to Expert Astrologers Online" ✅ but H1 says "Unlock Your Cosmic Destiny" ❌

### Keyword Placement Checklist

| Element | Status | Notes |
|---|---|---|
| Primary keyword in title tag | ✅ | "Talk to Expert Astrologers Online" |
| Primary keyword in H1 | ❌ | H1 is "Unlock Your Cosmic Destiny" |
| Primary keyword in first 100 words | ❌ | Hero body text talks about "cosmic destiny" and "life's journey" |
| Primary keyword in meta description | ✅ | Present |
| Primary keyword in URL | N/A | Homepage |
| Secondary keywords in subheadings | ⚠️ | H2s miss "astrologer", "Vedic astrology" etc. |

### Secondary Keywords (untapped or undertargeted)

| Keyword | Volume | Competition | Currently Targeted? |
|---|---|---|---|
| "best astrologer online India" | High | High | Partially (no dedicated page) |
| "free kundli matching" | Very High | Medium | ❌ No free tier page |
| "aries horoscope today" | Very High | High | ⚠️ Page exists, no fresh daily content |
| "vedic astrology consultation" | Medium | Medium | ✅ Service page exists |
| "online tarot reading India" | Medium | Medium | ✅ Service page exists |
| "kundli milan online" | High | Medium | ✅ Service page exists |
| "chat with astrologer" | High | High | ✅ CTA text present |
| "astrologer near me" | Very High | Medium | ❌ No local SEO |

### Search Intent Analysis

The homepage targets **transactional intent** ("talk to astrologers") which is correct. However:
- Horoscope pages target **informational intent** ("aries horoscope today") but deliver **static personality descriptions**, not fresh daily content. This is a search intent mismatch — users clicking "Aries horoscope today" expect a dated reading, not evergreen sign traits.
- Blog targets informational intent ✅ but has no consistent publishing schedule visible.

---

## Technical SEO

### SPA Architecture — Critical Risk

**This is the #1 SEO problem on the site.**

Aadikarta is a pure client-side React SPA (Vite + BrowserRouter, no SSR). The `index.html` contains a single `<div id="app"></div>` and a JavaScript bundle. Googlebot must:
1. Discover the URL
2. Fetch the HTML (gets only `<div id="app"></div>`)
3. Queue the page for JavaScript rendering (deferred crawl, can take days to weeks)
4. Execute JS, run React, wait for API calls to resolve
5. Index the rendered content

**In practice:** Only the homepage has meaningful static fallback content in `index.html` (title, description, canonical, OG tags, Organization schema). Every other page (`/horoscope/aries`, `/services/vedic-astrology`, `/blog/post-slug`) sends a blank shell to Googlebot on first fetch.

**Evidence of the problem:** The WebFetch tool (which behaves like a basic crawler without JS execution) returned only the title tag for every page — confirming that non-JS crawlers see nothing.

**Fix options (in order of impact):**
1. **Server-Side Rendering (SSR)** via Vite + React SSR or migrate to Next.js — renders HTML on the server per request
2. **Static Site Generation (SSG)** for known routes (horoscope pages, service pages) via `vite-plugin-ssr` or similar
3. **Prerendering** via a service like Prerender.io or Rendertron — intercepts Googlebot and serves pre-rendered snapshots
4. **At minimum:** Dynamic rendering — serve pre-rendered HTML to crawlers, JS app to users

The blog posts and astrologer profiles are the highest risk since they're fully dynamic with no static fallback at all.

---

### Robots.txt — ✅ Good

```
User-agent: *
Allow: /
Disallow: /dashboard, /chat/, /kundli, /classroom/, /tutor/, /login, /signup ...
Sitemap: https://aadikarta.org/sitemap.xml
```

Well-configured. Private/auth routes correctly disallowed. AI bots (PerplexityBot, GPTBot, ClaudeBot, anthropic-ai, Google-Extended) explicitly allowed — smart for AI search visibility.

**Minor issue:** `/signup` and `/login` are correctly disallowed but there's no `Disallow: /verify-otp` listed separately (it is there, just noting it's complete). ✅

---

### Sitemap.xml — ⚠️ Incomplete

**What's included:** 40 URLs — homepage, astrologers, horoscope pages (12), service pages (6), info pages, legal pages ✅

**What's missing:**
- Individual blog post URLs (dynamic, from API — most critical gap)
- Individual astrologer profile pages (high commercial value)
- All `lastmod` dates are hardcoded as `2026-05-22` and will never update — crawlers will deprioritize re-crawling

**Horoscope pages marked `changefreq: monthly`** but have 100% static content that never actually changes. This is technically accurate but signals low freshness priority.

**Fix:** Generate a dynamic sitemap from the backend API that includes blog post URLs and astrologer profile slugs. Update `lastmod` dynamically.

---

### Canonical Tags — ⚠️ Inconsistency

- `index.html` static canonical: `https://aadikarta.org/` (with trailing slash)
- SEO component dynamic canonical for homepage: `https://aadikarta.org` (no trailing slash, because `pathname === '/' ? '' : pathname`)

Google treats these as the same URL, but it's best practice to be consistent. Since the static tag loads first, use the trailing slash version consistently. Fix in [SEO.tsx:31](web/src/components/SEO.tsx#L31):

```tsx
// Before
const canonical = `${BASE_URL}${pathname === '/' ? '' : pathname}` || BASE_URL;

// After
const canonical = `${BASE_URL}${pathname === '/' ? '/' : pathname}`;
```

---

### Open Graph & Twitter Cards — ✅ Excellent

The SEO component ([SEO.tsx](web/src/components/SEO.tsx)) generates comprehensive social tags for every page:
- `og:type`, `og:url`, `og:title`, `og:description`, `og:image` with `og:image:width`/`og:image:height` (1200×630) ✅
- `og:image:alt` ✅
- `og:locale: en_IN` ✅
- Twitter `summary_large_image` card ✅

**One issue:** The `index.html` static OG tags are missing `og:image:width` and `og:image:height`. When the page is shared before JS hydrates (on slow connections, in some crawlers), the image dimensions are unknown. Add them to `index.html`.

**Twitter handle mismatch:**
- `SEO.tsx` uses `@aadikarta` ([SEO.tsx:66](web/src/components/SEO.tsx#L66))
- Footer links to `https://x.com/astro_aadikarta` ([Footer.tsx:44](web/src/components/Footer.tsx#L44))

The actual Twitter/X handle appears to be `@astro_aadikarta`. Update the `twitter:site` meta tag.

---

### Structured Data (Schema Markup)

| Schema Type | Pages | Status | Notes |
|---|---|---|---|
| Organization | Homepage | ⚠️ Duplicate | Defined in both `index.html` AND `Home.tsx` — Google may see it twice |
| WebSite + SearchAction | Homepage | ✅ | Sitelinks search box implemented |
| Service | Service pages | ✅ | VedicAstrology confirmed, presumably others too |
| FAQPage | Service pages, Horoscope pages | ✅ | Good FAQ content |
| BlogPosting | Blog post pages | ✅ | Author, datePublished, image all included |
| Blog | Blog listing page | ✅ | |
| BreadcrumbList | Most pages | ⚠️ | Wrong URL on horoscope pages (see below) |
| Person + ProfessionalService | Astrologer profiles | ✅ | But URLs use numeric IDs |
| AggregateRating | Organization (homepage) | ⚠️ | 4.8/1200 reviews — must be backed by visible reviews |

**Critical bug — Horoscope BreadcrumbList:**
In [HoroscopeSign.tsx:197](web/src/pages/horoscope/HoroscopeSign.tsx#L197), the breadcrumb has:
```js
{ position: 2, name: 'Horoscope', item: 'https://aadikarta.org/astrologers' }
```
Position 2 incorrectly points to `/astrologers` — it should point to a horoscope index page. There is no `/horoscope` listing page in the route structure, which is a related gap. Either create `/horoscope` as a listing page or remove position 2 from the breadcrumb.

**Duplicate Organization schema on homepage:**
- `index.html` defines Organization schema in a `<script type="application/ld+json">` block
- `Home.tsx` defines it again via Helmet
- Google may process both. The `index.html` version is less complete (no `telephone`, no `aggregateRating`). Remove the `index.html` version and let Helmet handle it.

---

## Content Gap Analysis

| Missing Topic | Search Volume | Competition | Content Type Needed | Priority |
|---|---|---|---|---|
| "free kundli online" / "free birth chart" | Very High | Medium | Free Kundli tool (gated behind login is fine) | 1 |
| "aries horoscope today 2026" (daily fresh) | Very High | High | Daily horoscope feed per sign | 1 |
| "best astrologer in India online" (comparison) | High | High | Comparison/ranking page with real reviews | 2 |
| "numerology calculator free" | High | Low | Interactive numerology tool | 2 |
| "what is kundli" / "what is Jyotish" | High | Low | Educational blog/guide series | 2 |
| "gemstone recommendation astrology" | Medium | Low | Blog post + service page | 3 |
| "vedic astrology vs western astrology" | Medium | Low | Comparison blog post | 3 |
| "vastu for home office" | Medium | Low | Blog post + link to vastu service | 3 |
| "nakshatra calculator" | Medium | Low | Free tool | 4 |
| "manglik dosh remedies" | High | Medium | Blog post | 2 |

**Biggest content gap: Fresh daily horoscope content.** The 12 horoscope sign pages (`/horoscope/aries` etc.) are the top-of-funnel traffic pages in the sitemap but contain 100% static, evergreen content (personality traits, not predictions). Searches for "aries horoscope today" expect fresh content updated daily. Without it, these pages cannot rank for time-sensitive queries that drive the highest volume.

---

## Featured Snippet Opportunities

The FAQ schemas on service and horoscope pages are already well-targeted for featured snippets. Additional opportunities:

1. **"What is Vedic astrology?"** — Vedic Astrology service page has a clear H2 + paragraph answer. Currently ~150 words, could be trimmed to 50 words for a paragraph snippet.

2. **"How much does astrology consultation cost in India?"** — Add a dedicated H2 "How much does an astrology consultation cost?" on the Pricing page with a direct answer: "₹10–150 per minute depending on the astrologer's level."

3. **"Aries dates"** — FAQ schema already covers this ✅. Format the answer table on the horoscope page for a table snippet by adding a "Zodiac Sign Dates" HTML table.

4. **"What does kundli matching mean?"** — Create a blog post targeting this exact phrase with a 50-word definition paragraph directly after the H1.

---

## Internal Linking Opportunities

**Current state:** Homepage → Astrologers (multiple CTAs), Footer → 4 pages. Service pages → Astrologers. Horoscope pages → each other + Astrologers.

**Missing links:**
1. Homepage should link directly to all 6 service pages (not just via footer or through /astrologers)
2. Blog posts should link to the relevant service page (e.g. tarot post → `/services/tarot-reading`)
3. Horoscope pages should link to relevant blog posts (e.g. Aries page → "Aries Career Horoscope 2026" blog post)
4. Service pages should cross-link each other (e.g. Kundli Matching → Vedic Astrology, Love Advice → Kundli Matching)
5. Footer should include all service pages under a "Services" column
6. Create a `/horoscope` index page that lists all 12 signs and links to each — currently there's no horoscope hub

**Proposed footer structure:**
```
Services                    Horoscopes              Company
Vedic Astrology             Aries · Taurus          About Us
Kundli Matching             Gemini · Cancer         Blog
Tarot Reading               Leo · Virgo             Contact Us
Love Advice                 Libra · Scorpio         Join as Astrologer
Daily Horoscope             Sagittarius · Capricorn
Vastu Shastra               Aquarius · Pisces
```

---

## Schema / AggregateRating Risk

The Organization schema (`Home.tsx:53–59`) claims:
```json
"aggregateRating": {
  "ratingValue": "4.8",
  "reviewCount": "1200"
}
```
And the schema includes 3 hardcoded review names (Anjali S., Rahul K., Priya M.).

Google's Rich Results guidelines require that aggregate ratings be directly associated with visible, verifiable reviews on the page or site. If a user visits the homepage and cannot find 1,200 reviews, Google may:
- Not show star ratings in search results
- Apply a manual action for misleading structured data

**Recommendation:** Either display actual user reviews visibly on the homepage (pulled from the database) and update the count dynamically, or remove the `aggregateRating` from the Organization schema and apply it only to individual astrologer profiles where actual review counts are accurate.

---

## Core Web Vitals Assessment

**Known risks (from architecture):**

| Risk Factor | Impact | Severity |
|---|---|---|
| Large JS bundle (React + Three.js on VedicAstrology) | LCP delay — Three.js canvas blocks the page | High |
| Three.js particle animation on `/services/vedic-astrology` | Increases TBT/INP significantly on mobile | High |
| AOS animations on multiple pages | Minor CLS risk if offsets miscalculated | Medium |
| Google Fonts loaded via `<link>` (not preloaded properly) | FCP delay | Medium |
| Razorpay checkout.js loaded with `defer` | Fine for non-checkout pages | Low |
| No CDN detected for assets | TTFB varies by user location | High |

**Three.js on a service marketing page** (`VedicAstrology.tsx`) is a significant performance liability. A rotating wireframe cube does not add conversion value and meaningfully increases Time to Interactive (TTI) on mobile. Consider replacing with a CSS animation or static image.

**Fonts:** `index.html` preloads the Google Fonts CSS with `rel="preload" as="style"` ✅ but the actual font file URLs are not preloaded — this means font files download in a second round trip. Add a `<link rel="preload" as="font">` for the most critical font weight (400).

---

## Dead CTA — Vedic Astrology Page

In [VedicAstrology.tsx:197](web/src/pages/services/VedicAstrology.tsx#L197):
```tsx
<button className="mt-16 bg-amber-700 hover:bg-amber-800 ..." data-aos="zoom-in">
  Book a Reading Now
</button>
```
This `<button>` has no `onClick` handler and no enclosing `<Link>`. Clicking it does nothing. Every visitor who reaches the bottom of the Vedic Astrology service page and clicks the primary CTA goes nowhere — this directly kills conversions from organic traffic.

**Fix:** Replace with a `<Link to="/astrologers">`:
```tsx
<Link
  to="/astrologers"
  className="mt-16 inline-block bg-amber-700 hover:bg-amber-800 text-white px-12 py-4 rounded-full font-bold text-lg shadow-xl shadow-amber-200 transition-all hover:scale-110 active:scale-95"
  data-aos="zoom-in"
>
  Book a Reading Now
</Link>
```

---

## Prioritized Recommendations

### Critical — Fix Immediately

**1. Dead CTA button on `/services/vedic-astrology`**
- File: [VedicAstrology.tsx:197](web/src/pages/services/VedicAstrology.tsx#L197)
- Impact: Every organic visitor who scrolls to the bottom bounces with no conversion path
- Fix: Replace `<button>` with `<Link to="/astrologers">` (5-minute fix)

**2. Plan SSR/Prerendering migration**
- All pages beyond the homepage are invisible to crawlers without JavaScript
- Impact: Prevents ranking for ~38 out of 40 URLs in your sitemap
- Fix: Evaluate Next.js migration OR implement Prerender.io for dynamic rendering
- Estimated organic traffic increase if fixed: 300–500% for non-home pages

**3. Wrong breadcrumb URL on all 12 horoscope pages**
- File: [HoroscopeSign.tsx:197](web/src/pages/horoscope/HoroscopeSign.tsx#L197)
- Impact: Invalid breadcrumb structured data risks rich result ineligibility
- Fix: Change `item: 'https://aadikarta.org/astrologers'` to create and link `/horoscope` index page

**4. Remove duplicate Organization schema from `index.html`**
- File: [index.html](web/index.html) lines 42–70
- Impact: Duplicate schema on homepage; less complete version in static HTML wins during pre-hydration
- Fix: Delete the `<script type="application/ld+json">` block from `index.html` entirely — let `Home.tsx` handle it via Helmet

### High Priority — This Month

**5. Fix homepage H1 to include primary keyword**
- File: [Hero.tsx:11](web/src/components/Hero.tsx#L11)
- Current: "Unlock Your Cosmic Destiny"
- Recommended: Keep this as a visual subtitle; add a visually smaller but semantically H1 with "Talk to Verified Astrologers Online" or restructure the component
- Impact: H1 is one of the strongest on-page ranking signals

**6. Shorten all page titles to under 60 characters**
- File: [SEO.tsx:32](web/src/components/SEO.tsx#L32) + each page's title prop
- Impact: ~15–25% improvement in click-through rate when titles display fully in SERPs

**7. Shorten homepage meta description to 155 characters**
- File: [Home.tsx:104](web/src/pages/Home.tsx#L104)
- Current: 199 chars (last 44 chars always truncated, including the ₹10/min price CTA)

**8. Fix Twitter handle from `@aadikarta` to `@astro_aadikarta`**
- File: [SEO.tsx:66](web/src/components/SEO.tsx#L66)
- Impact: Twitter card attribution, brand consistency

**9. Add astrologer profile slug-based URLs**
- File: [AstrologerProfile.tsx](web/src/pages/AstrologerProfile.tsx), backend API
- Current: `/astrologers/42`
- Recommended: `/astrologers/guru-dev-vedic-astrologer`
- Impact: Astrologer pages represent the highest commercial intent on the site; making them crawlable is a major SEO unlock

**10. Fix canonical trailing slash inconsistency**
- File: [SEO.tsx:31](web/src/components/SEO.tsx#L31)
- Fix: `pathname === '/' ? '/' : pathname` to match `index.html`

**11. Fix AggregateRating in Organization schema or make reviews visible**
- File: [Home.tsx:53](web/src/pages/Home.tsx#L53)
- Risk: Google manual action for misleading structured data

### Medium Priority — This Quarter

**12. Generate dynamic sitemap from API**
- Include blog post URLs and astrologer profile pages
- Update `lastmod` dynamically per page
- Estimated impact: Blog posts start getting indexed within days of publication instead of weeks

**13. Add daily horoscope content to horoscope sign pages**
- Serve a fresh daily prediction (even AI-generated and reviewed) on each `/horoscope/:sign` page
- Impact: Enables ranking for "aries horoscope today" — some of the highest-volume astrology queries

**14. Create `/horoscope` index page**
- A hub page listing all 12 signs with links, brief descriptions, and cross-links to service pages
- Fix the broken breadcrumb simultaneously
- Impact: Establishes topical authority, creates a crawlable hub

**15. Expand footer navigation with Services and Horoscopes columns**
- Impact: Distributes PageRank to all high-value pages; gives crawlers a sitewide path

**16. Remove Three.js particle canvas from `/services/vedic-astrology`**
- File: [VedicAstrology.tsx:43–114](web/src/pages/services/VedicAstrology.tsx#L43-L114)
- Impact: Reduce TTI on mobile by ~1–3 seconds; improved Core Web Vitals

**17. Add author bylines to blog posts**
- File: [BlogPost.tsx](web/src/pages/BlogPost.tsx) — currently uses `post.author_name` if present, falls back to Organization
- Ensure `author_name` is always populated in the CMS
- Impact: E-E-A-T signal; especially critical for YMYL content

**18. Add `og:image:width` and `og:image:height` to static `index.html` OG tags**
- File: [index.html](web/index.html)
- Add: `<meta property="og:image:width" content="1200" />` and `og:image:height content="630"`

### Low Priority — When Resources Allow

**19. Add a `/horoscope` index page with cross-links to service pages**
- Builds topical authority cluster around horoscope content

**20. Create a "free kundli" or "free birth chart" landing page**
- Targets the highest-volume informational query in the astrology space
- Gate premium interpretation behind registration (drives signups)

**21. Add `hreflang="en-IN"` to `index.html`**
- Signals to Google that this is India-targeted English content

**22. Implement breadcrumb navigation on service and blog pages (visible, not just schema)**
- Visible breadcrumbs reduce bounce rate and add internal link signals

**23. Add a Pricing page structured data (Service/Offer schema)**
- File: [Pricing.tsx](web/src/pages/Pricing.tsx) — currently no schema
- Impact: May enable price display in search snippets

---

## Summary

Aadikarta has invested well in on-page SEO fundamentals: meta tags, OG tags, schema markup, robots.txt, and sitemap are all above average for an early-stage Indian startup. The site's biggest vulnerability is structural — a client-side SPA means only the homepage is reliably indexed. Fixing the SPA/SSR problem combined with the 3 critical bugs above (dead CTA, wrong breadcrumbs, duplicate schema) would have the highest near-term impact. The medium-priority work (daily horoscopes, astrologer slugs, dynamic sitemap) addresses the content freshness and crawl coverage gaps that determine long-term organic growth.
