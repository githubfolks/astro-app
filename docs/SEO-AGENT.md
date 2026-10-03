# SEO Agent

Drafts blog posts with Claude from an admin-curated keyword queue. **Nothing is published automatically.** An admin reviews, edits and publishes each draft in the post editor (Growth Plan decision D3, 2026-10-03). Publishing may be automated later, after a trial period.

Admin UI: **SEO Agent** in the sidebar (`/seo-agent`). AI drafts show an "AI draft" badge in **Content (Blog)**.

## Workflow

1. **Queue topics** on the SEO Agent page, from three sources:
   - **Admin:** type or paste keywords, one per line, with optional notes for the writer.
   - **Suggest topics (AI):** Claude proposes long-tail topics. These carry **no search-volume data**; none is estimated.
   - **Import from Search Console:** queries the site already gets impressions for (last 28 days, ending 3 days ago because of GSC's data lag). The import stores impressions, clicks, position and the top page. Re-importing refreshes the metrics but never changes a keyword's status.
2. **Draft post:** Claude writes a DRAFT post (title, slug, excerpt, HTML body, FAQs, tags, keywords). The quality check runs and its report is saved with the draft.
3. **Review** in the post editor. The AI draft panel shows the target keyword, the model and the quality report. **Re-check saved version** re-runs the check on what is saved.
4. **Publish** by setting the status to Published and saving. For AI drafts the quality check runs again on the saved content, and publishing is **refused** until it passes. On success the post records `reviewed_by` and `reviewed_at`, and the keyword becomes PUBLISHED.
5. The web rebuild (`deploy/rebuild-if-new-content.sh`, every 30 min via cron) prerenders the new post and adds it to the sitemap. The Growth Plan's decision D1 is satisfied by this script, **if the cron is installed on the VPS** (not verified from the repo).

Keyword statuses: `NEW`, `DRAFTED`, `PUBLISHED`, `FAILED` (last draft attempt errored; the error is shown and the keyword can be retried), `IGNORED`.

## Quality check (`api/app/services/seo_quality.py`)

A draft fails if it has:
- fewer words than **Min words** or fewer complete FAQs than **Min FAQs**
- a missing excerpt, or one longer than 160 characters (the excerpt is the meta description)
- any **banned phrase**. Word-like phrases match whole words, so "cure" does not match "secure".
- a specific **year, clock time or planetary degree**. Drafts are evergreen explainers and are not given computed astrological data, so any such value would be invented.
- external links, or internal links outside **Allowed internal links** and published `/blog/<slug>` posts
- no internal link at all
- `<h1>`, `<script>`, `<style>`, `<iframe>`, `<form>`, `<object>` or `<embed>` elements
- a title with 60% or more word overlap with an existing post title

Manual (non-AI) posts are not checked.

## Configuration

Admin → Settings → **SEO Agent** (stored in `app_settings`):

| Setting | Default | Purpose |
|---|---|---|
| `seo_agent_daily_draft_limit` | 5 | Max AI drafts per UTC day (cost cap; checked before calling Claude) |
| `seo_agent_min_words` | 800 | Quality check |
| `seo_agent_min_faqs` | 3 | Quality check |
| `seo_agent_suggestion_count` | 10 | Topics per "Suggest topics" click (0 disables it) |
| `seo_agent_banned_phrases` | starter list | **Needs legal review** (Growth Plan risk R4) |
| `seo_agent_internal_links` | free tools and services | `/path \| description` per line; every path must be a live public route |

Environment (API container, via the root `.env`):

| Variable | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | none (required) | Without it, drafting and suggestions return 503 |
| `SEO_AGENT_MODEL` | `claude-sonnet-5-5` | Drafting and suggestion model |
| `SEO_AGENT_EFFORT` | `medium` | `output_config.effort` (`low` to `max`) |

## Claude call

`client.beta.messages.create` with a JSON-schema `output_config.format` (generated from Pydantic models via `anthropic.transform_schema`), validated with Pydantic, and with server-side refusal fallback (`fallbacks: "default"`, beta `server-side-fallback-2026-07-01`). API errors are shown to the admin with the API's own message (e.g. billing). Each draft stores model, input/output tokens and request ID in `posts.agent_meta`, and an `SEO_AGENT_DRAFT_CREATED` audit-log entry.

**Unverified as of 2026-10-03:** no live call has succeeded. The Anthropic account returned "credit balance is too low". The request format is covered by tests against a mocked transport only. Cost per draft is not yet measured. At Sonnet 5.5 list prices ($2 / $10 per million input/output tokens), a draft of roughly 3k input and 4k output tokens would cost about $0.05, but this is an estimate, not a measurement.

## Data

Migration `d5f7b9c1e3a2` (additive):
- New table `seo_keywords`.
- New columns on `posts`: `generated_by` (default `manual`, which existing rows get), `agent_meta`, `reviewed_by`, `reviewed_at`.

Public post endpoints do not expose any of the agent fields. The CMS endpoints use the `AdminPost` schema for them.

## API (admin only)

`/admin/seo-agent/`:
- `GET status`
- `GET keywords`
- `POST keywords`
- `POST keywords/import-gsc`
- `POST keywords/suggest`
- `POST keywords/{id}/draft`
- `POST keywords/{id}/ignore`
- `POST keywords/{id}/restore`
- `GET posts/{post_id}/quality`

`suggest` and `draft` are rate-limited to 5 per minute.

## Not built yet (Growth Plan Phase 1 remainder)

- 14/28-day Search Console monitoring of published agent posts, and refresh suggestions
- Scheduled (cron) drafting. Drafting is admin-triggered only during the manual-review trial.
