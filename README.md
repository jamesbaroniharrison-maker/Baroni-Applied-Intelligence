# Baroni Applied Intelligence - site

Live at **https://baroniapplied.co.uk**, served by GitHub Pages from this
repo's `main` branch (custom domain set in `CNAME`, DNS at Porkbun). Every
push to `main` goes live in a minute or two.

A small multi-page site in plain HTML/CSS/JS - no framework, no npm
dependencies. All the text lives in `content/content.json`; `scripts/render.js`
turns it into the pages, and the editor at `/admin` edits it (see
[EDITOR.md](EDITOR.md)).

Also here: Open Graph / Twitter Card meta with a branded share image
(`og-image.png`), JSON-LD structured data, and Cloudflare Web Analytics (see
[ANALYTICS_SETUP.md](ANALYTICS_SETUP.md)).

The contact form posts to a Google Apps Script ([apps-script/](apps-script/),
emails your Gmail and logs notes in a Google Sheet; see
[CONTACT_SETUP_GMAIL.md](CONTACT_SETUP_GMAIL.md)). Its address is
"Form sends to" under Site-wide in the editor; left empty, the form opens the
visitor's own email app instead. [worker/](worker/) is the Cloudflare Worker
alternative ([CONTACT_SETUP.md](CONTACT_SETUP.md)); `server/` is an earlier
Express version, not used.

## Pages

Each page ends with a big **Next** link (Home -> How it works -> Case files ->
Services -> About -> Book a call -> back to Home) and has its own scroll rail on
wide screens.

- `index.html` - hero with the pipeline panel, fact strip, the week planner
  ("What I automate", swept once when it comes into view), the idea, four tiles
  linking to the other pages.
- `how.html` - the three steps as a run panel, and the safety checks.
- `work.html` - the case files as folders; `case-1.html`, `case-2.html`… one
  page per case study (folders grow into their page).
- `services.html` - "You say…" rows, each linked to a case file.
- `about.html` - bio, facts, background.
- `book.html` - the contact form and the FAQ on a curved strip.

All of these are generated - edit `content/content.json` (or use `/admin`),
then `node scripts/build.mjs`.

## Files

- `content/content.json` - every piece of text on the site.
- `scripts/render.js` - the page templates (used by the build and by the
  editor, in the browser). `scripts/build.mjs` writes the pages;
  `scripts/serve.mjs` serves the site and the editor locally.
- `styles.css` - the base styling: colour tokens, type (Newsreader / Geist /
  Geist Mono), header, hero, pipeline panel, form, footer.
- `site.css` - the multi-page sections on top of it.
- `script.js` - intro animation, hero pipeline, scroll rail, menu, copy-email,
  contact form, and each section's behaviour (week planner, tiles, steps,
  services, FAQ strip, case visuals).
- `admin/` - the editor (`app.js`, `schema.js` = which fields each page shows,
  `frame.js` = click-to-edit inside the preview).
- `brand/` - the Baroni mark (size tiers + light versions), favicons and app
  icons. Use the size tier that matches the display size: `lg` 96px+, `md`
  48-95px, `sm` 28-47px, `xs` under 28px, and `-light` files on light
  backgrounds.
- `apps-script/`, `worker/` - the contact form back ends, with tests
  (`node --test apps-script/test/code.test.js`; `node --test test/worker.test.js`
  from inside `worker/`).

## Things to know before editing

- **The hero pipeline's last row** ("Fax to head office") is a fixed joke in
  `scripts/render.js`, not in the editor. Leave it as it is.
- **Pricing is on application.** There is no scarcity counter.
- Bump `ASSET_VERSION` at the top of `scripts/render.js` when you change
  `styles.css`, `site.css` or `script.js`, then rebuild, so browsers don't keep
  an old copy.

## Running it locally

```
node scripts/serve.mjs
```

Site on http://localhost:8080, editor at http://localhost:8080/admin/.

## Design notes

- Colours, fonts and spacing are CSS custom properties at the top of
  `styles.css` (`:root { ... }`). Gold is the main accent; sage marks things
  that are done or running.
- The hero pipeline and the How it works steps only change state (no
  movement), so they run even with reduced motion on.
- All interactive elements have a visible keyboard focus state.
