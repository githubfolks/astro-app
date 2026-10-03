# Analytics Events & UTM Convention

GA4 runs through Google Tag Manager (container `GTM-WGS7TLDK`, loaded in `web/index.html`).
The web app only pushes events into `window.dataLayer` (`web/src/utils/analytics.ts`).
**Whether an event reaches GA4 depends on the GTM container configuration, which lives in the GTM web UI, not in this repo.**

Event names and parameters follow GA4's recommended-event schema:
<https://developers.google.com/analytics/devguides/collection/ga4/reference/events>

## Events pushed by the web app

| Event | Fired when | Parameters | Where |
|---|---|---|---|
| `page_view` | Every SPA route change | `page_path`, `page_location`, `page_title` | `components/Analytics.tsx` |
| `sign_up` | Email account verified (`/verify-email` succeeds) | `method: "email"` | `pages/VerifyEmail.tsx` |
| `sign_up` | Google/Facebook sign-in that **created** the account (backend returns `is_new_user: true`) | `method: "google" \| "facebook"` | `components/SocialLoginButtons.tsx` |
| `generate_lead` | Free AI report request delivered | `lead_source: "ai_report_full_kundli" \| "ai_report_gun_milan" \| "ai_report_career_finance"` | `components/ReportPurchaseModal.tsx` |
| `generate_lead` | AI Astrologer callback request submitted | `lead_source: "ai_astrologer_callback"` | `pages/AiAstrologer.tsx` |
| `purchase` | Wallet recharge **after** `/payment/verify` succeeds | `ecommerce: { transaction_id, value, tax, currency, items }` | `components/PaymentModal.tsx`, `pages/Chat.tsx` |

Rules:
- `purchase` amounts come from the server-created order (`/payment/order` response): `value` = recharge amount before GST, `tax` = GST, `currency` from the order. `transaction_id` is the Razorpay order id. Nothing is taken from user input.
- `generate_lead` sends no `value`. AI reports are currently free and callback requests have no price, so any value would be invented.
- Wallet recharge is the only paid conversion today. AI reports are free (`ReportPurchaseModal`: "Reports are free — no payment step").

## Required GTM setup (manual, in the GTM UI)

Not verifiable from this repo. Someone with GTM access must confirm or create:

1. **Triggers** (Custom Event): `sign_up`, `generate_lead`, `purchase`.
2. **Tags** (Google Analytics: GA4 Event), event name `{{Event}}`:
   - For `purchase`: under *More Settings → Ecommerce*, tick **Send Ecommerce data**, data source **Data Layer**.
   - For `sign_up` / `generate_lead`: add Data Layer Variables for `method` and `lead_source` and map them as event parameters.
3. **GA4 Admin → Key events**: mark `sign_up`, `generate_lead`, `purchase` as key events.
4. Verify with GTM Preview mode plus GA4 DebugView by running each flow once.

## UTM convention

Every link we place outside aadikarta.org (YouTube/Instagram/Facebook descriptions, WhatsApp, emails) uses:

```
https://aadikarta.org/<route>?utm_source=<source>&utm_medium=<medium>&utm_campaign=<campaign>
```

| Param | Values | Notes |
|---|---|---|
| `utm_source` | `youtube`, `instagram`, `facebook`, `whatsapp`, `email`, `x`, `linkedin` | lowercase platform name |
| `utm_medium` | `short` (Shorts/Reels), `video`, `post`, `bio`, `message` | the content format |
| `utm_campaign` | `<series>-<yyyymmdd>` e.g. `panchang-20261004`, `rashifal-20261004`; evergreen: `<series>` | matches `campaign_slug` on content studio jobs (Growth Plan §6) |
| `utm_content` | optional, e.g. `cta-pinned`, `cta-description` | only when testing link placement |

Rules:
- Lowercase, hyphens, no spaces.
- `<route>` must be a public, crawlable route. Not `/muhurat`, `/kundli` or `/kundli/matching`: those require login.
- GA4 reads UTMs from the landing URL's `page_location` on the first `page_view`. No extra code is needed.
