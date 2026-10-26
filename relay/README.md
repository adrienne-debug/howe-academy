# Calendar relay

Slice 1 of the Calendar Sync Stage 1 plan (https://claude.ai/artifact/9CzM842wupbB4k84XPRmjE).
A small Cloudflare Worker shared by every family app. **Not deployed.** The app doesn't use it yet; slices 2–4 add that.

## What it does

| Address | Who calls it | What happens |
| --- | --- | --- |
| `GET /in?url=<link>` | the app | Fetches an Apple "Public Calendar" link or a Google "Secret address in iCal format" and hands it back. Any other address is refused. Nothing is stored. |
| `PUT /out/<feedId>` | the app, with `Authorization: Bearer <writeKey>` | Stores the family's outgoing calendar. The first copy claims the feed; later copies need the same key. Only a SHA-256 of the key is kept. |
| `GET /out/<feedId>.ics` | the mom's phone | Serves that calendar. This is the subscribe link. |
| `DELETE /out/<feedId>` | the app (Reset), same key | Removes the copy. |

`/in` and the writes answer only pages from `ALLOWED_ORIGINS` (`wrangler.toml`). The phone's `GET` needs no key; the long random feed id is the secret.
Limits: incoming calendars up to 3 MB, outgoing copies up to 1 MB, upstream asked at most every 5 minutes per link.

## Try it on the Mac (no account needed)

```bash
node test_calendar_relay.js
```

```bash
node relay/dev_server.js
```

The dev server runs the same worker on http://localhost:8787 with in-memory storage.

## Deploy (Adrienne's call, once, shared by every family)

1. Make a free Cloudflare account at dash.cloudflare.com.
2. In this folder: `npx wrangler login` (opens the browser; you sign in).
3. `npx wrangler kv namespace create FEEDS` → copy the `id` it prints into `wrangler.toml`.
4. `npx wrangler deploy` → it prints the relay address (`https://howe-calendar-relay.<you>.workers.dev`).
5. That address goes into the app in slice 2.

Free plan: 100,000 requests a day, far beyond three families checking every 15 minutes.
