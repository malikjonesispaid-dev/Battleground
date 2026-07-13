# Viral Content Studio

An idea-to-post content pipeline: type in an idea, get a generated
hook/caption/hashtags, review and edit it, then queue it to the social pages
you manage. A background worker publishes anything that's due.

**What this is not:** a guarantee of virality or income. No tool can promise
that. This automates the repetitive parts of running content for pages you
already have the right to post to — it doesn't replace having an audience,
a niche, or a reason for people to care.

## How it works

- **Compose** — enter an idea, generate a draft (hook, caption, hashtags),
  edit it, pick target pages and an optional schedule, queue it.
- **Publisher connectors** — each `Page` is one social account. Posting goes
  through a real per-platform connector (Meta Graph API for
  Instagram/Facebook, YouTube Data API, TikTok Content Posting API) or a
  generic webhook connector you can point at Zapier/Make/n8n/Buffer/your own
  endpoint for anything else.
- **Worker** — `npm run worker` polls for due posts and publishes them. Run
  it as a long-lived process (cron, systemd, a background dyno, etc).

## Safety defaults

- **`DRY_RUN=true` by default.** Nothing is posted anywhere — connectors log
  what they *would* send and mark the post `DRY_RUN`. You have to explicitly
  set `DRY_RUN=false` to go live.
- Even with `DRY_RUN=false`, a page only actually posts once you've filled in
  its real credentials (`accessToken`/`externalId` or `webhookUrl`) on the
  Clients & Pages screen. Pages without credentials just fail loudly instead
  of silently doing nothing.
- TikTok posts default to `privacy_level: SELF_ONLY` and YouTube uploads
  default to `privacyStatus: private` — public posting requires a
  deliberate code change, not just flipping an env var.

## Setup

```bash
npm install
cp .env.example .env
npx prisma migrate dev   # creates dev.db and applies the schema
npm run dev              # http://localhost:3000
```

That's the whole zero-config path: no API keys needed. Content generation
falls back to a deterministic template, and every publish is a dry run.

### Going live

1. **Content generation (optional but better):** set `ANTHROPIC_API_KEY` in
   `.env`. Without it, generation uses a template fallback that still works,
   just less interestingly.
2. **Per-page credentials**, set on the page itself in Clients & Pages, not
   in `.env`:
   - **Facebook / Instagram:** a Meta Graph API access token for a Page you
     administer, plus its Page ID / IG Business Account ID as `externalId`.
     Instagram requires a public `mediaUrl` on the post — it has no
     text-only post type.
   - **YouTube:** an OAuth2 access token with the `youtube.upload` scope (not
     a plain API key), plus a `mediaUrl` pointing at the video file.
   - **TikTok:** an access token from an approved TikTok developer app with
     `video.publish` scope. Unaudited apps can only post as
     self-only/private — see TikTok's Content Posting API docs before
     expecting public posts.
   - **Anything else:** set a `webhookUrl` on the page instead of the above.
     This takes priority over the platform connector and POSTs the generated
     content as JSON to that URL — the easiest way to wire up a service
     without a dedicated connector here.
3. Set `DRY_RUN=false` in `.env`.
4. Run the worker alongside the app: `npm run worker`.

## Data model

`Client` → `Page` (one social account, one platform, its own credentials) →
`Post` (one generated piece of content) → `PostTarget` (one page's publish
attempt for a post, with its own status/error).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the web app |
| `npm run worker` | Start the publish worker (polls every 60s by default, `WORKER_POLL_INTERVAL_MS` to change) |
| `npm run db:migrate` | Apply/create Prisma migrations |
| `npm run db:studio` | Browse the SQLite DB |
| `npm run build` | Production build |
