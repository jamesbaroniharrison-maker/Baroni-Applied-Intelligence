# James Baroni Harrison — Portfolio / Business Site (Level 1)

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

```
python3 -m http.server 8000
```

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

## Next: Level 2

Once you've swapped in your real contact details and sat with this for a bit,
Level 2 is about tightening the actual business case — CTA placement, what a
first-time visitor needs to see first, and whether the portfolio/business
combo is reading clearly. No new tools needed for that either.
