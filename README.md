# James Baroni Harrison — Portfolio / Business Site (Level 5)

Plain HTML, CSS, and vanilla JS — still no build step, no framework. Content
lives in `content/*.json` instead of hardcoded in `index.html`, fetched and
rendered client-side on load. Editable through a real admin UI at `/admin`
(Decap CMS, commits straight to this repo) — see
[CMS_SETUP.md](CMS_SETUP.md) for the one-time login setup.

Level 5 added conversion/measurement basics: Open Graph + Twitter Card meta
tags with a branded share image, a favicon, JSON-LD structured data, and
Cloudflare Web Analytics (see [ANALYTICS_SETUP.md](ANALYTICS_SETUP.md) for
the one-time site registration step).

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

## Running it locally

Content is now fetched via `fetch('content/site.json')` etc., which browsers
block under the `file://` protocol (CORS). Double-clicking `index.html` will
still render *something* — the static fallback text baked into the HTML —
but not your actual current content. To see the real thing, serve it:

python3 -m http.server 8000

then open `http://localhost:8000`.

## What's intentionally NOT here yet

No database, no working contact form (the email/LinkedIn/GitHub links work, a
real form doesn't yet), no build tooling. The admin UI at `/admin` edits
content by committing directly to this git repo — there's no server-side app
behind it, which is what keeps this free and simple. A database (Neon) and a
real backend show up at Level 6, once there's an actual reason for them
(auth, a live app, not just content editing).

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

## Next: Level 6

Full-stack: auth, a database (Neon), and a real contact form backend. That's
also when React gets introduced — see the Framework note below — since
that's the point this stops being just a marketing site.

## Framework note

We deliberately stayed vanilla HTML/CSS/JS through Level 5 rather than moving
to React — this site doesn't have the kind of interdependent, changing UI
state that a framework earns its keep on, and the admin UI (Decap CMS) is a
separate, self-contained app that doesn't touch this site's own stack.
That's expected to change around
Level 6, when there's a real app (dashboard, auth, live data) behind the
marketing site. At that point React gets introduced specifically for that
piece, likely as a separate app from this static site, not a rewrite of it.