# Setting up the contact form backend

The contact form on the site posts to a small API in [server/](server/) —
a separate Node/Express app, tested (`server/test/`, run with `npm test`),
that validates submissions, stores them in Postgres, and emails you a
notification. It's a **separate deploy from the static site** — the site
itself stays a Render Static Site exactly as before; this is a second,
small Render Web Service alongside it.

Three things need setting up, all with your own accounts. I can't create
any of these for you.

## 1. Database — Neon

1. Create a project at [neon.tech](https://neon.tech) (free tier is
   plenty for a contact form).
2. In the Neon dashboard, open **Connection Details** and copy the
   **pooled connection string** (hostname contains `-pooler`) — that's
   your `DATABASE_URL`.
3. Run the schema once, using Neon's built-in SQL Editor (dashboard →
   your project → SQL Editor) — paste in the contents of
   [server/schema.sql](server/schema.sql) and run it. This creates the
   `contact_submissions` table.

## 2. Email — Resend

1. Create an account at [resend.com](https://resend.com) (free tier:
   100 emails/day).
2. Dashboard → **API Keys** → create one → that's your `RESEND_API_KEY`.
3. For `CONTACT_EMAIL_FROM`: to start, you can use Resend's shared
   `onboarding@resend.dev` sandbox address with zero setup (already the
   default in `.env.example`). When you're ready for better
   deliverability, verify your own domain in Resend and switch to an
   address on it.
4. `CONTACT_EMAIL_TO` is just your real inbox — where notifications land.

## 3. API hosting — Render Web Service

This is a **new, second service** on Render, separate from the static
site.

1. Render dashboard → **New → Web Service** → connect the same GitHub
   repo.
2. **Root Directory**: `server`
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Environment variables** (Render dashboard → Environment):
   - `DATABASE_URL` — from step 1
   - `RESEND_API_KEY` — from step 2
   - `CONTACT_EMAIL_TO` — from step 2
   - `CONTACT_EMAIL_FROM` — from step 2 (or leave as `onboarding@resend.dev`)
   - `ALLOWED_ORIGINS` — comma-separated list of every origin allowed to
     call this API, e.g.
     `https://baroniapplied.co.uk,https://www.baroniapplied.co.uk,http://localhost:8000`
6. Deploy. Render gives this service its own URL, something like
   `https://daddys-contact-api.onrender.com`.
7. Check it's alive: visit `https://<that-url>/health` — should return
   `{"ok":true}`.

**Note on the free tier**: like the static site's git-based CMS, this
free Web Service spins down after 15 minutes of no traffic and takes
~30-50s to wake up on the next request. The first form submission after
a quiet period will feel slow — that's this, not a bug. The frontend
shows a "Sending…" state the whole time so it doesn't look stuck.

## 4. Point the frontend at it

Open [script.js](script.js) and replace the placeholder near the top:

```js
const CONTACT_API_BASE = 'https://REPLACE-WITH-YOUR-CONTACT-API-URL';
```

with your actual deployed API URL (no trailing slash), e.g.
`https://daddys-contact-api.onrender.com`. Commit and push — Render
redeploys the static site as usual.

## Testing it end to end

1. Visit the live site, scroll to Contact, submit the form with real
   values.
2. You should see "Message sent — I'll get back to you soon." and get an
   email at `CONTACT_EMAIL_TO` within a few seconds (longer on a cold
   start).
3. Check Neon's SQL Editor: `SELECT * FROM contact_submissions ORDER BY
   created_at DESC;` — your submission should be there even if the email
   step ever fails, since the database write happens first and the email
   is best-effort.

## Local development

```
cd server
cp .env.example .env   # fill in real values
npm install
npm start               # runs on :3000
npm test                # runs the test suite (no live DB/email needed —
                         # tests use fake implementations)
```
