# Growth Plan — SEO Agent & Shorts Agent

**Goal:** Bring new visitors to aadikarta.org and route them into the funnel: free tool / free AI report (lead) → wallet recharge (the only paid step) → astrologer chat.
**Date:** 2026-10-03
**Status:** Phase 0 implemented in code (commit `01bac9e`, 2026-10-03); not yet deployed, and the GTM-side setup is pending. Everything else is still a plan unless marked **Existing** or **Done**.

Legend used throughout:
- **Existing** — verified in this codebase on 2026-10-03.
- **Proposed** — new work described by this plan.
- **Unverified** — an external fact that must be checked against official documentation before we build on it.

---

## 1. Why these two channels

- Organic search and short-form video are the two acquisition channels we can run without ad spend. The competitor report (`docs/COMPETITOR-REPORT.md`) recommends defending long-tail SEO rather than competing with Astrotalk and InstaAstro on ad spend.
- Both channels draw on the same daily data (panchang, horoscopes, muhurat, festivals). One daily data pull can feed both web pages and videos.
- **Supply constraint:** per `TODO.md` there are only 1–5 astrologers. Every call to action should therefore point to the **free tools and free AI reports** (lead capture), then **wallet packages**, which scale without limit. AI reports are free today (no payment step), so they generate leads, not revenue. Chat is promoted only when astrologers are online.

---

## 2. What already exists (reuse, don't rebuild)

| Capability | Where | Notes |
|---|---|---|
| Blog CMS with SEO fields | `models.Post` (faqs, tags, secondary/longtail keywords, social keywords), `routers/cms.py`, public `GET /public/posts`, `/blog/:slug` | Posts have DRAFT / PUBLISHED / ARCHIVED states, so they can go through a review step |
| Horoscope content | `models.Horoscope` (DAILY/WEEKLY/MONTHLY/YEARLY per sign), `DailyHoroscopeBulk` (FreeAstroAPI cache), `/horoscope/:sign`, `/services/horoscope/yearly/:sign` | |
| Panchang | `routers/panchang.py` `GET /panchang/daily`, `PanchangCache`, `/panchang` page | One page, no dated archive |
| Muhurat | `muhurat_calc.py`, `GET /muhurat/live` | The `/muhurat` page **requires login** and is disallowed in `robots.txt`. Don't use it as a landing page for cold traffic |
| Translation | `translation_service.py` + `TranslationCache` (Groq) | Hindi is a client-side toggle; there are **no Hindi URLs** (only `web/public/dictionaries/en_US`) |
| Prerender for crawlers | `web/scripts/prerender.js` (fetches blog and astrologer routes from the API at build time) | **New pages are only crawlable as HTML after a web rebuild** |
| Sitemap | `web/scripts/generate-sitemap.js` | Static list plus blog and astrologer URLs fetched from the API at build time; real `lastmod` on blog posts. Every public route is covered (the remaining routes are redirects, or login-only and disallowed in `robots.txt`) |
| Search Console data | `services/gsc_service.py` `fetch_seo_analytics()` (by date, query, page) | Read-only analytics |
| GA4 via GTM | `web/index.html`, `analytics.ts` | Pushes `page_view`, `sign_up`, `generate_lead`, `purchase` (Phase 0). GTM-side tags must be configured; see `docs/ANALYTICS-EVENTS.md` |
| Video pipeline | `routers/content_studio.py` + `services/content_studio_*` | Scenes (Hindi narration), image generation, TTS, render, post to YouTube / Instagram / Facebook, YouTube metadata read/update |
| Caption / social copy | `content_studio` `generate-caption`, `generate-youtube-copy`, `generate-social-copy`; `routers/social_copy.py` | Copy-paste text generation only; publishes nothing. The fixed-template `auto-post` endpoint was removed on 2026-10-03 |
| Scheduler hooks | `routers/cron.py`, using the `X-Cron-Secret` header | See risk R7 |
| LLM | `content_studio_claude.py` (default `claude-haiku-4-5-20251001`, overridable by env var) | |

---

## 3. SEO Agent (#1)

### 3.1 What it does

A weekly and daily loop that finds search demand we can realistically win, drafts pages grounded in **our own computed data**, sends them through human review, publishes them, and then measures and refreshes them.

```
GSC + keyword list ─► Opportunity finder ─► Brief ─► Draft (Claude) ─► Automated quality gate
                                                                              │
     Refresh / prune ◄── Monitor (GSC 14/28 days) ◄── Publish + rebuild ◄── Human review (admin, DRAFT)
```

### 3.2 Page types, in priority order

| # | Page type | Data source (Existing) | URL approach | Why |
|---|---|---|---|---|
| A | **Long-tail explainers** answering queries where GSC already shows impressions but the page ranks below position 10 | GSC queries + our tools | `/blog/:slug` (existing CMS) | Google already associates us with these queries, so they're the fastest wins. Uses existing CMS, no new routes |
| B | **Festival / vrat muhurat pages by year** (e.g. "<festival> 2026 muhurat") | `muhurat_calc.py`, panchang | Proposed: `/muhurat/:festival-:year`, or blog posts as an interim | Strong seasonal demand. Pages must be published 3–6 weeks before each date. Festival date source is **Unverified** (we need an authoritative list) |
| C | **Tool-intent pages** (e.g. specific manglik / kundli-matching questions) linking to the free tool | Existing tools + Post | `/blog/:slug` | Highest conversion intent, because the reader is one click from a free tool and the free report (lead capture) |
| D | **Daily panchang archive** by date | `PanchangCache` | Proposed: `/panchang/:date` | Unique data every day. Only worth building after the pages can be crawled without a rebuild (decision D1) |
| E | **Horoscope pages** (`/horoscope/:sign`) | Existing | Keep the existing **evergreen URLs**, refreshed daily. No dated archive pages | Avoids thousands of thin near-duplicate pages (risk R1) |

**Hindi:** most astrology search demand is in Hindi, but we have no Hindi URLs. Indexable Hindi pages (`/hi/...` + `hreflang`) are a separate decision (D2). They are probably the single biggest SEO lever, but they need routing, prerender and sitemap work.

### 3.3 Agent steps (Proposed)

1. **Opportunity finder** (weekly cron): pull GSC query/page data through `gsc_service`, store it in a new `seo_opportunities` table (query, page, impressions, clicks, avg position, status), and rank by impressions × position gap. Optionally add keyword volumes from Google Keyword Planner (access is **Unverified**). No volumes are invented: if data is missing, the opportunity has no score.
2. **Brief**: target query, search intent, outline, required data fields, the internal link to the relevant free tool, and the CTA (free report or wallet package; chat only if astrologers are online).
3. **Draft**: Claude writes a `Post` in **DRAFT** status. Every astrological fact must come from our computed data or a cited classical source passed into the prompt. The model may not make up planetary positions, dates or timings.
4. **Automated quality gate** (fails the draft back to the queue):
   - no guaranteed-outcome language, health or cure claims, or fear-based remedy selling (see R4)
   - every date, time and position in the text matches the source data
   - near-duplicate check against existing posts
   - minimum useful length, an FAQ block (existing `faqs` → FAQPage schema), internal links to existing routes only
5. **Human review**: admin approves, edits or rejects in the existing CMS. **Nothing auto-publishes in the MVP.**
6. **Publish**: set the post to PUBLISHED, then trigger the rebuild that regenerates the prerendered HTML and sitemap (D1).
7. **Monitor & refresh**: after 14 and 28 days, read the page's GSC data. Queue pages with impressions but low CTR for a title/meta rewrite. After 90 days, review pages with no impressions to improve, merge or archive.

### 3.4 Foundation fixes (from `docs/SEO-AUDIT.md`), status 2026-10-03

- **Done (before Phase 0):** sitemap includes blog and astrologer URLs with real blog `lastmod`; duplicate Organization JSON-LD and the `@aadikarta` Twitter handle are gone from `index.html`; base URL comes from `VITE_SITE_URL` in `SEO.tsx` and `generate-sitemap.js`.
- **Done in Phase 0:** homepage title shortened to 55 characters and meta description to 140.

### 3.5 Cadence

Start with **3–5 reviewed posts per week**. Increase only once Search Console shows the new posts being indexed and gaining impressions. Quality and correctness matter more than volume (R1).

---

## 4. Shorts Agent (#2)

### 4.1 What it does

Every day it turns that day's real data into ready-to-approve Hindi short videos using the **existing content studio**, posts them after approval, and tracks which videos send visitors who pay.

```
Daily data (panchang, horoscope, muhurat, festival calendar)
   └─► Create content_studio job (topic + scenes) ─► images + TTS ─► render
          └─► Human approval in admin ─► post YouTube / Instagram / Facebook (existing endpoints)
                 └─► UTM link to the right free tool ─► GA4 attribution ─► weekly report
```

### 4.2 Content series (Proposed)

| Series | Frequency | Source | CTA (tracked link) |
|---|---|---|---|
| Aaj ka panchang / shubh muhurat | Daily | `/panchang/daily`, `muhurat` | `/panchang` (`/muhurat` requires login) |
| Rashifal (sign rotation, or all 12 in one video) | Daily | `DailyHoroscopeBulk` / `Horoscope` | `/horoscope/:sign`, then a report |
| Festival countdown / vrat vidhi | Seasonal | Festival calendar (source **Unverified**) | Festival page (SEO type B) |
| "Check free" tool explainers (manglik, kundli match, numerology) | 2× per week | Tool features | `/tools/...`, then the free report |
| Explainers made from top-performing blog posts | Weekly | SEO Agent winners | `/blog/:slug` |

The number of videos posted per day is limited by platform quotas (R5). Start with **1–2 videos per day**.

### 4.3 Agent steps (Proposed)

1. **Daily job creator** (cron, early morning IST): build the topic and scenes from that day's real data and create a `ContentStudioJob`. Add proposed fields `series`, `source_date` and `campaign_slug` so each video is traceable to its data and its UTM campaign.
2. **Asset generation and render**: reuse the existing scene image, audio and render endpoints/services.
3. **Approval queue**: admin previews the video, edits the narration or caption, and approves. **No auto-posting in the MVP.**
4. **Post**: existing `post/youtube`, `post/instagram`, `post/facebook`, with the description link `https://aadikarta.org/<route>?utm_source=<platform>&utm_medium=short&utm_campaign=<campaign_slug>`.
5. **Measure**: views from `get_youtube_video` (existing). Instagram and Facebook insights are not built yet (**Unverified** API access). Clicks and conversions come from GA4 UTMs.
6. **Scripts** come from the LLM through the content studio scene generation. (The old fixed-string `social_copy/auto-post` endpoint was removed on 2026-10-03.)

---

## 5. Measurement (shared)

**Leading indicators:** pages indexed, GSC impressions, clicks, average position; videos published, views, link clicks.
**Business indicators:** organic and social sessions → sign-ups and leads (free reports, callbacks) → wallet recharges (attributed by UTM and landing page).

- **Done (Phase 0):** GA4 recommended events `sign_up`, `generate_lead`, `purchase` (wallet recharge, server-computed amounts). Event list, GTM setup and the UTM convention are in `docs/ANALYTICS-EVENTS.md`. Not yet tracked: free-tool completions and chat starts.
- **Proposed:** a weekly admin-only growth report endpoint that combines GSC, GA4 and database revenue. Every number comes from a real source; anything unavailable is shown as "no data".
- **Targets:** set after a 2-week baseline. None are set in this plan because there is no measured baseline yet.

---

## 6. Data model & API changes (all Proposed, via Alembic migrations)

- `seo_opportunities`: query, page, impressions, clicks, ctr, position, captured_at, status (NEW/BRIEFED/DRAFTED/PUBLISHED/IGNORED), post_id.
- `posts`: add `generated_by` (manual/agent), `source_refs` (JSON: what data the draft used), `reviewed_by`, `reviewed_at`.
- `content_studio_jobs`: add `series`, `source_date`, `campaign_slug`, `approved_by`, `approved_at`.
- Cron endpoints in `routers/cron.py`: `POST /cron/seo/refresh-opportunities` (weekly), `POST /cron/seo/draft-posts` (daily, with a cap), `POST /cron/shorts/create-daily-jobs` (daily), `POST /cron/growth/weekly-report`. All must **refuse to run when `CRON_SECRET` is unset** (R7).
- Admin pages: an SEO opportunity queue, the post review step (existing CMS, plus a source-data panel), and a Shorts approval queue.
- All limits (posts per day, videos per day, model names, cadence) live in `AppSetting` or environment variables, not in code.

---

## 7. Phased timeline

| Phase | Weeks | Scope | Exit criteria |
|---|---|---|---|
| 0. Foundations | 1 | Sitemap fix, SEO-audit fixes, GA4 conversion events, UTM convention, decisions D1–D3 | Sitemap lists all public pages; conversions visible in GA4. **Code done 2026-10-03**; remaining: deploy, GTM tags, confirm in GA4 DebugView |
| 1. SEO Agent MVP | 2–4 | Opportunity finder, drafting + quality gate, review flow, publish + rebuild, 14/28-day monitor | ≥10 reviewed posts live and indexed |
| 2. Shorts Agent MVP | 3–6 | Daily job creator, approval queue, tracked posting, views report | 1–2 videos/day posted for 3 consecutive weeks |
| 3. Optimize | 7+ | Weekly report; double down on winners, prune losers; consider Hindi URLs (D2) and the panchang archive (type D) | Attributed paying users from each channel visible weekly |

SEO typically takes several months to compound. Judge it on impressions and indexing first, revenue later.

---

## 8. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Google's scaled content abuse policy.** Mass AI pages with little value can be demoted site-wide | Pages grounded in unique computed data, human review, low cadence, prune pages that get no impressions. No dated horoscope archive |
| R2 | **FreeAstroAPI terms** for republishing derived content publicly — **Unverified** | Check their terms before generating pages or videos from `DailyHoroscopeBulk` / panchang data |
| R3 | **Factual errors** in dates, timings or positions damage trust | The quality gate checks every value against the source data; the model may not invent astrological facts |
| R4 | **Advertising / legal:** ASCI code, Drugs and Magic Remedies Act, platform policies on guaranteed outcomes and health claims — **Unverified** specifics | Banned-claims list in the quality gate, disclaimer link, legal review of the claims list |
| R5 | **Platform limits:** YouTube Data API daily upload quota, Instagram content-publishing limits, OAuth token expiry — **Unverified** current numbers | Check official docs; cap videos per day in settings; alert on token or quota failures; never report a failed post as posted |
| R6 | **AI-content disclosure rules** on YouTube and Meta for synthetic media — **Unverified** | Check current policy; label as required |
| R7 | **`_check_cron_secret` skips the check when `CRON_SECRET` is unset**, leaving the existing onboarding and checkout-nudge endpoints open | New endpoints (which spend LLM money and publish content) must hard-fail without the secret. Confirm `CRON_SECRET` is set on the VPS |
| R8 | **New pages aren't crawlable until a rebuild** (build-time prerender) | Decision D1 |
| R9 | **Astrologer supply (1–5)**: traffic sent to chat goes unserved | CTAs point to free tools and free AI reports; chat CTAs only when astrologers are online |
| R10 | **LLM, image and TTS cost per video or post** — not yet measured | Measure the cost of the first 10 jobs, then set a monthly budget cap in settings |

---

## 9. Decisions needed before building

- **D1 — Making new pages crawlable:** (a) automated nightly web rebuild with prerender plus sitemap regeneration (simplest, but pages go live up to 24h late), or (b) server-side rendering for `/blog/*` and new SEO routes (immediate, more work). **Decided 2026-10-03: (a), nightly rebuild, for the MVP.**
- **D2 — Hindi URLs:** build `/hi/...` + `hreflang` in Phase 3, or earlier? Probably the biggest long-term SEO lever, but it touches routing, prerender and sitemap.
- **D3 — Reviewers: decided 2026-10-03.** The admin reviews and publishes posts and videos manually for an initial trial of a few days. If quality holds, publishing will be automated. Agents only create drafts and unposted jobs. Keep publish a separate action that can later be switched to automatic by a setting.
- **D4 — Accounts:** confirm the YouTube channel, Instagram professional account and Facebook page are connected and their tokens are valid.
- **D5 — Monthly budget** for LLM, image and TTS calls.
- **D6 — Festival calendar source:** which authoritative source to use for festival and vrat dates.
