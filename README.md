# James Baroni Harrison — Portfolio / Business Site (Level 6)

The site itself (`index.html`, `styles.css`, `script.js`) is still plain
HTML/CSS/JS — no build step, no framework. Content lives in `content/*.json`,
fetched and rendered client-side on load, editable through a real admin UI
at `/admin` (Decap CMS, commits straight to this repo) — see
[CMS_SETUP.md](CMS_SETUP.md) for the one-time login setup.

Level 5 added conversion/measurement basics: Open Graph + Twitter Card meta
tags with a branded share image, a favicon, JSON-LD structured data, and
Cloudflare Web Analytics (see [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md)).

Level 6 added the first real backend: [server/](server/) is a small, tested
Express API (separate Render deploy from the static site) that the contact
form posts to — it validates submissions, stores them in a Neon Postgres
database, and emails a notification. See
[SERVER_SETUP.md](SERVER_SETUP.md) for the one-time Neon/Resend/Render
setup. No auth/login-protected dashboard yet — deferred until there's a
concrete reason for one (see Next, below).

## Files

- `index.html` — page structure/shell; text content is overwritten at load
  time by `content/site.json`, and the Work/Services/Process lists are
  rendered entirely from their JSON files. The static text already in the
  HTML is the fallback shown if those fetches ever fail.
- `styles.css` — all styling (colors, type, layout, responsive rules,
  the two curated accent/font variants)
- `script.js` — fetches `content/*.json`, renders it into the page, then
  wires up all interactive behavior (mobile nav, scroll reveal, hero
  parallax, scroll-progress spine, copy-email)
- `content/site.json` — hero/about/work/services/contact copy, contact
  links, accent + font choice, section visibility
- `content/work.json`, `content/services.json`, `content/process.json` —
  the three repeatable lists, each editable (add/remove/reorder) from `/admin`
- `admin/` — the Decap CMS admin UI and its config
- `server/` — the contact form API (Express + Postgres), deployed as its
  own Render Web Service, entirely separate from the static site. Has its
  own tests (`server/test/`, run with `npm test` from inside `server/`).

## Before you deploy — replace these placeholders

Edit `content/site.json` (either directly, or through `/admin` once it's set
up — see [CMS_SETUP.md](CMS_SETUP.md)) and swap in your real details under
`contact`:

- `email`
- `linkedin_url`
- `github_url`

`index.html` has the same placeholder values baked in as its static
fallback — update those too if you want the fallback to match in case the
content fetch ever fails.

Also in `script.js`, near the top: `CONTACT_API_BASE` is still a
placeholder until the backend is deployed — see
[SERVER_SETUP.md](SERVER_SETUP.md).

## Running it locally

Content is now fetched via `fetch('content/site.json')` etc., which browsers
block under the `file://` protocol (CORS). Double-clicking `index.html` will
still render *something* — the static fallback text baked into the HTML —
but not your actual current content. To see the real thing, serve it:

python3 -m http.server 8000

then open `http://localhost:8000`.

## What's intentionally NOT here yet

No auth, no login-protected views, no build tooling for the static site
itself. The admin UI at `/admin` edits content by committing directly to
this git repo — there's no server-side app behind it, which is what keeps
that piece free and simple. The contact form backend (`server/`) is the
one real server-side app so far; auth shows up if/when there's a concrete
reason for a login-gated page (e.g. a submissions dashboard) rather than
being built speculatively ahead of that need.

## Design notes

- Colors, fonts, and spacing are all defined as CSS custom properties at the
  top of `styles.css` (`:root { ... }`) — change a value there and it updates
  everywhere.
- The branching line graphic in the hero is hand-built SVG, not an image file
  — it's meant to echo the "one event → many outputs" shape of your actual
  automation work.
- Respects `prefers-reduced-motion` throughout, and all interactive elements
  have a visible focus state for keyboard navigation.

## Adding new content (Level 4 pattern)

Work items, process steps, and services each live as a list in their own
JSON file (`content/work.json`, `content/process.json`,
`content/services.json`) and are rendered into the page by `script.js` at
load time. Add, remove, or reorder entries either by editing the JSON
directly or through `/admin`. No build step — the JSON is fetched as-is,
same as any other static asset.

## Next: Level 7

Elite production: CI/CD, monitoring/error tracking on the new `server/` API,
accessibility/perf audits, and documentation polish. Auth + a submissions
dashboard could also happen here or later — still deferred until there's a
concrete reason to build it, per the Level 6 note above.

## Framework note

Still vanilla HTML/CSS/JS for the site itself, and now for `server/` too —
a handful of REST endpoints don't need a framework beyond Express. React
gets introduced only if/when there's real interdependent, changing UI state
to justify it (e.g. a submissions dashboard with filtering/sorting/live
updates) — not by default just because a backend now exists.