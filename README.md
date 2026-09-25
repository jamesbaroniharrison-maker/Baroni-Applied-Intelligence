# Baroni Applied Intelligence - site

Live at **https://baroniapplied.co.uk**, served by GitHub Pages from this
repo's `main` branch (custom domain set in `CNAME`, DNS at Porkbun). Every
push to `main` goes live in a minute or two.

The site itself (`index.html`, `styles.css`, `script.js`) is plain
HTML/CSS/JS - no build step, no framework. Content lives in `content/*.json`,
fetched and rendered client-side on load, editable through a real admin UI
at `/admin` (Decap CMS, commits straight to this repo) - see
[CMS_SETUP.md](CMS_SETUP.md) for the one-time login setup.

Also here: Open Graph / Twitter Card meta with a branded share image
(`og-image.png`), JSON-LD structured data, and Cloudflare Web Analytics (see
[ANALYTICS_SETUP.md](ANALYTICS_SETUP.md)).

[server/](server/) is a small, tested Express API (Neon Postgres + Resend)
that the contact form can post to. It isn't deployed yet - GitHub Pages only
serves static files, so it needs its own host (see
[SERVER_SETUP.md](SERVER_SETUP.md)). Until then the form opens the visitor's
email app with the note pre-filled.

## Page order

Header -> Hero (with the pipeline run log) -> Proof strip -> 01 How it works ->
02 Case studies -> 03 Services -> 04 FAQ -> 05 Credentials -> 06 Book a call ->
Footer, plus a sticky "Book a call" bar on phones and a scroll rail on wide
screens.

## Files

- `index.html` - page structure. Text is overwritten at load time from
  `content/*.json`; the static text in the HTML is the fallback shown if
  those fetches ever fail.
- `styles.css` - all styling: colour tokens, type (Newsreader / Geist /
  Geist Mono), layout, responsive rules (menu collapses below 900px).
- `script.js` - fetches `content/*.json`, renders it into the page, then
  wires up the interactions: mobile menu, active nav link, scroll rail, hero
  run-log animation, case-study step strips, FAQ accordion, spots counter,
  copy-email, contact form, mobile bar.
- `content/site.json` - hero, section headings, the Book a call section
  (email, LinkedIn, GitHub), footer, section visibility.
- `content/work.json`, `services.json`, `process.json` (How it works),
  `faq.json`, `credentials.json` - the repeatable lists, each editable
  (add/remove/reorder) from `/admin`.
- `brand/` - the Baroni mark (size tiers + light versions), favicons and app
  icons. Use the size tier that matches the display size: `lg` 96px+, `md`
  48-95px, `sm` 28-47px, `xs` under 28px, and `-light` files on light
  backgrounds.
- `admin/` - the Decap CMS admin UI and its config.
- `server/` - the contact form API, with its own tests (`npm test` from
  inside `server/`).

## Things to know before editing

- **The hero pipeline run log** (including the "Fax to head office - Just
  kidding!" row) is deliberately hand-written in `index.html`, not driven by
  the CMS. Leave it as it is unless you mean to change it.
- **The spots counter** in the proof strip is date-based, not a live count:
  2 left in the first month of each quarter, 1 in the second, 0 in the third.
  It's `initSpots()` in `script.js`.
- **`CONTACT_API_BASE`** near the top of `script.js` is a placeholder until
  the server is deployed.
- CSS/JS links in `index.html` carry a `?v=` number - bump it when you change
  `styles.css` or `script.js` so browsers don't keep an old copy.

## Running it locally

Content is fetched via `fetch('content/site.json')` etc., which browsers
block under `file://`. Serve the folder instead:

```
python -m http.server 8000
```

then open `http://localhost:8000`.

## Design notes

- Colours, fonts and spacing are CSS custom properties at the top of
  `styles.css` (`:root { ... }`) - change a value there and it updates
  everywhere. Gold is the only accent; sage appears only in the pipeline
  panel and the rail.
- The hero run log and the case-study strips only change state (no movement),
  so they run even with reduced motion on; the pulsing dots and smooth
  scrolling switch off.
- All interactive elements have a visible keyboard focus state.
