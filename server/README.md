# Jarvis proxy

A minimal server that holds one Anthropic API key and forwards chat requests
from the Jarvis Android app to `api.anthropic.com`. This is what lets the app
work for everyone without each person needing their own key — the key lives
here, server-side, never inside the app.

You still pay for the usage (it's your key), and you're responsible for
watching for abuse. Deploy it somewhere you control.

## Run locally

```
cd server
npm install
cp .env.example .env   # fill in ANTHROPIC_API_KEY and a random PROXY_SHARED_SECRET
npm start
```

## Deploy

Any host that runs a Dockerfile or a plain Node process works — for example
[Render](https://render.com), [Fly.io](https://fly.io), or
[Railway](https://railway.app):

1. Point the host at this repo, with `server/` as the root/build directory.
2. Set the environment variables `ANTHROPIC_API_KEY` and `PROXY_SHARED_SECRET`
   as secrets in the host's dashboard (never commit them).
3. Deploy. Note the public HTTPS URL the host gives you.
4. In the Jarvis app, open Settings and paste that URL (plus the shared
   secret) into the "Server" fields.

## Endpoints

- `GET /health` — returns `{ "ok": true }`, useful for host health checks.
- `POST /v1/chat` — body `{ "model": "...", "system": "...", "messages": [...] }`,
  same shape as the Anthropic Messages API. Requires header
  `x-proxy-secret: <PROXY_SHARED_SECRET>` if that env var is set. Response is
  the raw Anthropic response, passed through unmodified.

## Limitations

- The shared secret only filters out casual scanners — anyone who decompiles
  the APK can read it out, same as an embedded API key. Real abuse control is
  the per-IP rate limit (20 requests/minute by default, in `src/index.js`) and
  keeping an eye on your Anthropic usage dashboard.
- No per-user accounts or quotas — everyone who has your app shares one budget.
  If that becomes a problem, that's a sign you need real auth in front of this,
  not just a shared secret.
