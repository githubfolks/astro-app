
# Business priorities (from financials discussion, 2026-08-15):
1. [DONE 2026-08-15] Ship the SSR fix — ₹10/min pricing and content are invisible to every crawler; this is blocking the entire organic channel, not a nice-to-have.
   Verified live in prod via `curl -A Googlebot`: homepage, all 12 horoscope pages, /astrologers, /ai-astrologer, and the free tool pages (manglik/numerology/kundli) all serve fully-rendered HTML with ₹10/min pricing to crawlers. www redirect and blog/astrologer-profile prerendering not yet verified (api.aadikarta.org was down during this check — see outage note below).
   [OPEN INCIDENT] api.aadikarta.org is returning 502 on every endpoint as of 2026-08-15: commit f0808f9 made MIROTALK_JWT_SECRET/MIROTALK_PEER_PASSWORD required at startup (correctly removing insecure hardcoded fallbacks), but the VPS .env doesn't have them set, so the api container crash-loops. Fix: set both vars in the VPS .env (`openssl rand -hex 32` each) and restart the api service. No SSH access from this environment to apply it. Also: TLS cert for aadikarta.org/api.aadikarta.org expires 2026-08-16 07:51 GMT — worth confirming certbot renewal is still working while on the VPS.
2. Onboard more astrologers — supply-capped at 1-5 regardless of demand.
3. [SCAFFOLDED 2026-08-15] Get real analytics wired up (GA4 + Search Console) — without it, revenue/traffic projections stay guesses.
   Code is now in place and no-ops until real values are supplied: `web/src/utils/analytics.ts` (GA4 init + trackPageView), `web/src/components/Analytics.tsx` (SPA page-view tracking on route change + GSC verification meta tag, wired into App.tsx), env vars added to `web/.env.production` — VITE_GA_MEASUREMENT_ID and VITE_GSC_VERIFICATION, both currently blank. REMAINING: (a) create/access the GA4 property and paste its G-XXXXXXX measurement ID into VITE_GA_MEASUREMENT_ID; (b) verify the site in Search Console (HTML tag method) and paste the verification content into VITE_GSC_VERIFICATION, then submit sitemap.xml (already generated + referenced in robots.txt) in the GSC UI. Neither value is a secret — both become public in rendered HTML — so they're safe to commit once filled in.
4. [VERIFIED 2026-08-15] Paid ad-hoc PDF report flow (`reports.py` create-direct-order) is fully built and live (real Razorpay orders, HMAC-verified payment, AI report + PDF + WhatsApp delivery) — but ONLY reachable via `/services/ai-instant-reports` (home/hero/footer). The Manglik/Numerology/Kundli-Match free tools have zero CTA into it; their result screens only link to astrologer consultation. Remaining work: add a CTA on each free tool's result screen (ManglikChecker.tsx, KundliMatchChecker.tsx, NumerologyCalculator.tsx) that opens ReportPurchaseModal with the matching report_type (Gun Milan for kundli match, Full Kundli/Career for the others).
5. Add bonus-credit wallet recharge packages (`packages.py`) — e.g. "recharge ₹500, get ₹550 wallet" — to lift ARPU without needing more astrologers.
6. Build organic social media (Instagram/YouTube Shorts with daily horoscope/short readings) as a top-of-funnel channel driving to the free tools → paid report funnel.
7. Once astrologer count exceeds ~10-15, add astrologer-side subscriptions/premium profile placement as a revenue line.
 
# The SEO title is 77 characters long, which is too long.
Aadikarta — Talk to Expert Astrologers Online | Vedic Astrology, Tarot & More
# The meta description is 196 characters long, which is too long.
Connect with India's top verified astrologers on Aadikarta. Get live chat consultations on Vedic astrology, kundli matching, tarot reading, love advice, and daily horoscope. Starting from ₹10/min.
# No internal links were found on the page.
Internal: 0
External: 0
# The www and non-www versions of the URL are not redirected to the same site.
You should use HTTP redirections (301 permanant redirects) to pass PageRank from the "wrong" URLs to the standard (canonical) ones. That way, your content will still benefit from backlinks if someone makes a mistake and uses the wrong URL.
# No Schema.org data was found on your page.
AIOSEO makes it extremely easy to add highly relevant Schema.org markup to your site. It has a simple graphical interface, so you don't have to get your hands dirty with complex HTML markup.
# The server is not using "expires" headers for the images.
If you use the Apache or NGINX web servers, you can edit the configuration files to set the "expires" header for all image files. For Apache, you can also use a ".htaccess" file to change the settings for each folder.

Alternatively, you can use a CMS plugin to simplify the process - it's a more user-friendly option. WordPress has a host of caching plugins, and most of them give you options to control the caching headers.

# Some Javascript files don't seem to be minified.
https://aadikarta.org/assets/index-BCXaI2kO.js

# Directory Listing seems to be enabled on the server.
Fortunately, every popular web server has options to prevent directory listings. They'll show a "403 forbidden" message instead.

# Render-blocking requests Est savings of 1,250 ms
# Improve image delivery Est savings of 788 KiB
# Use efficient cache lifetimes Est savings of 58 KiB
# Each sub-part has specific improvement strategies. Ideally, most of the LCP time should be spent on loading the resources, not within delays.
# Add schema for home page
# LCP request discovery
fetchpriority=high should be applied
Request is discoverable in initial document
# Layout shifts occur when elements move absent any user interaction. Investigate the causes of layout shifts, such as elements being added, removed or their fonts changing as the page loads.
# Avoid chaining critical requests by reducing the length of chains, reducing the download size of resources or deferring the download of unnecessary resources to improve page load.
# Document request latency Est savings of 2 KiB
# Reduce unused JavaScript Est savings of 287 KiB
# Reduce unused CSS Est savings of 107 KiB
# Image elements do not have explicit width and height


degree, retrogate, debilated, combust, exaulted
64392f96daac500b55c543cd

# Strategy 3: AI Search Engine & Generative Engine Optimization (AEO / GEO)
- [ ] Expand competitor comparison pages: `/vs/anytimeastro` (AnytimeAstro comparison) and `/vs/guruji`.
- [ ] Update machine-readable knowledge base `public/llms.txt` and `public/llms-full.txt` with competitor pricing matrix & AI chat feature specifications.
- [ ] Build structured Q&A Direct Answer Cards for Perplexity, ChatGPT Search, and Gemini citation indexing.
- [ ] Register new comparison routes in `App.tsx` and `scripts/generate-sitemap.js`.

# Strategy 5: YouTube Shorts & Instagram Reels Content Engine (auto-post-to-social)
- [ ] Implement `POST /social/auto-post` endpoint in `api/app/routers/social_copy.py` for automated YouTube Shorts & Reels script generation.
- [ ] Add 30-second Shorts/Reels script generator mode in `admin/src/pages/SocialCopyGenerator.jsx`.
- [ ] Create viral 30-second hook script templates for Manglik remedies, Kundli matching, and daily horoscope predictions.
- [ ] Integrate webhooks / auto-post scheduler for social media channels (`auto-post-to-social`).
 