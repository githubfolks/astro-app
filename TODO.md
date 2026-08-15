
# Business priorities (from financials discussion, 2026-08-15):
1. [DONE 2026-08-15] Ship the SSR fix — ₹10/min pricing and content are invisible to every crawler; this is blocking the entire organic channel, not a nice-to-have.
   Verified live in prod via `curl -A Googlebot`: homepage, all 12 horoscope pages, /astrologers, /ai-astrologer, and the free tool pages (manglik/numerology/kundli) all serve fully-rendered HTML with ₹10/min pricing to crawlers. www redirect and blog/astrologer-profile prerendering not yet verified (api.aadikarta.org was down during this check — see outage note below).
   [OPEN INCIDENT] api.aadikarta.org is returning 502 on every endpoint as of 2026-08-15: commit f0808f9 made MIROTALK_JWT_SECRET/MIROTALK_PEER_PASSWORD required at startup (correctly removing insecure hardcoded fallbacks), but the VPS .env doesn't have them set, so the api container crash-loops. Fix: set both vars in the VPS .env (`openssl rand -hex 32` each) and restart the api service. No SSH access from this environment to apply it. Also: TLS cert for aadikarta.org/api.aadikarta.org expires 2026-08-16 07:51 GMT — worth confirming certbot renewal is still working while on the VPS.
2. [DONE — per user, 2026-08-15] Onboard more astrologers — supply-capped at 1-5 regardless of demand.
3. [DONE 2026-08-15 for GA4; Search Console still open] Get real analytics wired up (GA4 + Search Console) — without it, revenue/traffic projections stay guesses.
   GA4 measurement ID G-TCQTDGKSY5 is live in production: verified via curl that api.aadikarta.org's build Last-Modified advanced past the deploy, the CSP header now allows googletagmanager.com/google-analytics.com (was silently blocking GA entirely before this fix — script-src and connect-src didn't whitelist those domains), and the gtag snippet is present on the live homepage. Along the way this caught and fixed a real production bug (CSP blocking analytics) in both web/nginx.conf and aadikarta_nginx.conf. Real-user confirmation still needed: open GA4 Realtime and visit the live site to see an active user appear — the historical data in the account from before Aug 15 (predating the property/tag entirely) is unexplained and should be checked (correct property selected? stray data?) before trusting any of GA4's numbers.
   REMAINING — Search Console: verify the site (HTML tag method), paste the verification content into VITE_GSC_VERIFICATION in web/.env.production (currently blank), then submit sitemap.xml (already generated + referenced in robots.txt) in the GSC UI.
4. [DONE 2026-08-15] Paid ad-hoc PDF report flow (`reports.py` create-direct-order) is fully built and live (real Razorpay orders, HMAC-verified payment, AI report + PDF + WhatsApp delivery). Added the missing cross-sell: new `web/src/components/ReportUpsellCTA.tsx` renders after each free tool's result and opens `ReportPurchaseModal` pre-set to the matching report_type — Manglik Checker → FULL_KUNDLI, Kundli Match Checker → GUN_MILAN, Numerology Calculator → CAREER_FINANCE. Verified via a component test (renders correct report title/price per type, opens modal on click) plus `tsc`/`eslint`/production build all clean. Pushed (commit 2c1cb50) and confirmed deployed live.
5. [DONE 2026-08-15] Add bonus-credit wallet recharge packages — to lift ARPU without needing more astrologers.
   Built from scratch (existing `packages.py`/ChatPackage was a different, already-live feature — prepaid chat-minute bundles, unrelated). New: `WalletPackage` model + migration (`api/alembic/versions/d3f8a1c9b2e5_add_wallet_packages.py`, also fixed a pre-existing bug where PACKAGE_PURCHASE was never added to the Postgres enum type, breaking chat-package checkout), `api/app/routers/wallet_packages.py` (public list + admin CRUD), `payment.py` order-create/verify/webhook wired so the amount charged and bonus credited both come from the server-side package row — never trusted from the client — recorded as a separate WALLET_BONUS wallet transaction (refund accounting stays accurate since it only ever refunds the real gateway payment). Admin UI at `/wallet-packages` (admin/src/pages/WalletPackages.jsx) for create/edit/toggle/deactivate. Seeker-facing `PaymentModal.tsx` shows packages alongside the existing custom-amount entry (per decision: alongside, not replacing). No packages seeded — admin-configurable only, per decision to avoid fabricating pricing.
   Verified: 10 new backend tests + all 28 existing payment/wallet tests pass; migration tested up/down against local dev Postgres; full stack driven end-to-end in real browsers (admin create/toggle → public list updates; seeker PaymentModal shows packages, selecting one shows correct bonus/total, correctly overrides tampered client amount server-side).
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
 