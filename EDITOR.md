# Editing the site

Everything you can read on the site lives in one file, `content/content.json`.
The editor at **baroniapplied.co.uk/admin** edits it for you, so you never
need to open that file yourself.

## Using the editor

- **Pick a page** on the left. Case studies sit under Case files; **Site-wide**
  holds the things on every page (contact details, menu, footer, phone bar,
  the text Google shows).
- **Click any text on the page** to type over it, or use the fields on the
  right. Hovering over text shows which field it is.
- **Lists** (facts, steps, case studies, services, questions…) have buttons
  to move items up and down, duplicate, delete and add.
- **Find any text** at the top left searches the whole site and jumps to the
  field.
- **Computer / Tablet / Phone** switches the preview size.
- **Undo / Redo** (Ctrl+Z / Ctrl+Shift+Z) work for every change.
- **Changes** lists everything you've changed since the last publish, before
  and after, with an Undo for each one. Click a change to jump to it.
- **Publish** (Ctrl+S) puts it live. On the real site that's one GitHub
  commit, and the site updates in about a minute.
- **History** lists every publish. "Bring back" loads an older version as
  unpublished changes, so you can check it before publishing it again.
- Unpublished changes are kept in your browser, so closing the tab by
  accident doesn't lose them. The editor offers them back next time.

## Signing in (the live editor)

The editor signs in with GitHub through the same login service the old admin
used (`mywebsite.james-baroniharrison.workers.dev`, a sveltia-cms-auth
Cloudflare Worker backed by a GitHub OAuth App). Nothing new to set up. If
sign-in ever fails, check that the OAuth App's callback URL is still
`https://mywebsite.james-baroniharrison.workers.dev/callback`.

## Editing on your own computer

```
node scripts/serve.mjs
```

Then open http://localhost:8080/admin/. In this mode Publish saves to
`content/content.json` on your computer, rebuilds the pages and keeps a copy
of every save in `history/` (not committed). Commit and push when you want it
live. `node scripts/serve.mjs --lan` also serves the site (not the editor) to
your phone, for example over Tailscale.

## How it fits together

- `scripts/render.js` turns `content.json` into every page. The build, the
  editor's preview and the editor's publish all use this one file, so the
  preview always matches what goes live.
- `node scripts/build.mjs` rebuilds the pages after you edit `content.json`
  or `render.js` by hand. The `.html` files in the repo root are generated:
  don't edit them directly.
- `admin/schema.js` decides which fields the editor shows on each page. Any
  text in `content.json` that it doesn't list still appears under Site-wide
  -> "Other text", so nothing is ever uneditable.
