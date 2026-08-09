# James Baroni Harrison — Portfolio / Business Site (Level 3)

Plain HTML, CSS, and vanilla JS. No build step, no framework, no dependencies
besides two Google Fonts loaded via `<link>` tags. This is deliberate — Level 1
should not need anything more than a browser to run.

## Files

- `index.html` — all page content and structure
- `styles.css` — all styling (colors, type, layout, responsive rules)
- `script.js` — the only interactive behavior: the mobile nav menu toggle

## Before you deploy — replace these placeholders

Search `index.html` for these and swap in your real details:

- `[email protected]` (appears twice: the `mailto:` link and the visible text)
- `https://linkedin.com/in/your-profile`
- `https://github.com/your-username`

## Running it locally

You can just double-click `index.html` and it'll open in your browser — no
server needed at this level. If you'd rather serve it properly (closer to how
it'll behave once hosted), from this folder run:

python3 -m http.server 8000

then open `http://localhost:8000`.

## What's intentionally NOT here yet

No backend, no database, no working contact form (the email/LinkedIn/GitHub
links work, a real form doesn't yet), no build tooling. That's correct for
Level 1 — those show up at later levels once there's an actual reason for them
(Render for hosting once we deploy, Neon once there's real data to store).

## Design notes

- Colors, fonts, and spacing are all defined as CSS custom properties at the
  top of `styles.css` (`:root { ... }`) — change a value there and it updates
  everywhere.
- The branching line graphic in the hero is hand-built SVG, not an image file
  — it's meant to echo the "one event → many outputs" shape of your actual
  automation work.
- Respects `prefers-reduced-motion` throughout, and all interactive elements
  have a visible focus state for keyboard navigation.

## Adding new content (Level 3 pattern)

Work items, process steps, and services are each a self-contained, repeatable
block in `index.html`, marked with a comment explaining exactly what to copy.
Search the file for "copy" to find all three spots. No build step, no data
file — just copy a whole block and edit the text. This is deliberately simple:
a custom templating system isn't worth the complexity until there's dozens of
these, not a handful.

## Next: Level 4

Content management — right now everything lives in index.html by hand, which
is fine at this size. Level 4 is about deciding whether/when that changes
(e.g. if a blog gets added) without overbuilding for content that doesn't
exist yet.

## Framework note

We deliberately stayed vanilla HTML/CSS/JS through Level 3 rather than moving
to React — this site doesn't have the kind of interdependent, changing UI
state that a framework earns its keep on. That's expected to change around
Level 6, when there's a real app (dashboard, auth, live data) behind the
marketing site. At that point React gets introduced specifically for that
piece, likely as a separate app from this static site, not a rewrite of it.