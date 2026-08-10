# Setting up the content admin (`/admin`)

The site now has a real editing UI at `yoursite.com/admin` — built on
[Decap CMS](https://decapcms.org), a free, open-source admin panel that
edits files directly in this GitHub repo. There's no database and no
custom backend: every save is just a git commit, which triggers the same
Render auto-deploy that already runs when you push code yourself.

**One thing needs setting up before login works, and it needs your GitHub
account** — I can't do this step for you. Here's exactly what to do.

## Why this step exists

GitHub needs proof that whoever's logging into `/admin` is actually you,
not a stranger who found the URL. That proof is handled by a tiny "OAuth
proxy" — a small piece of code that sits between the admin page and
GitHub during login only. It's not involved in day-to-day editing at all,
just the login handshake.

## Step 1 — Create a GitHub OAuth App

1. Go to GitHub → Settings → Developer settings → OAuth Apps → **New OAuth App**
   (direct path: `github.com/settings/developers`).
2. Fill in:
   - **Application name**: anything, e.g. "Daddys Website Admin"
   - **Homepage URL**: your live site URL (e.g. `https://daddys-website.onrender.com`)
   - **Authorization callback URL**: `https://<your-oauth-proxy-domain>/callback`
     (you'll get this domain in Step 2 — you can come back and fill this in after)
3. Click **Register application**.
4. Copy the **Client ID**, then click **Generate a new client secret** and
   copy that too. Treat the secret like a password — don't commit it
   anywhere in this repo.

## Step 2 — Deploy the OAuth proxy

The proxy itself is a small, well-known piece of open-source code — you're
not writing this from scratch. The most common free, no-maintenance option
is a Cloudflare Worker (Cloudflare's free tier covers this easily, and
unlike a free Render service it doesn't go to sleep between logins).

1. Search GitHub for **`sveltia-cms-auth`** (by kyoshino) — it's a small,
   widely-used Cloudflare Worker OAuth helper that's compatible with Decap
   CMS's GitHub backend. Follow its README to deploy it via the Cloudflare
   dashboard or `wrangler`.
2. When deploying, set these as the worker's environment variables /
   secrets:
   - `GITHUB_CLIENT_ID` — from Step 1
   - `GITHUB_CLIENT_SECRET` — from Step 1
3. Once deployed, Cloudflare gives you a worker URL, something like
   `https://sveltia-cms-auth.<your-subdomain>.workers.dev`.
4. Go back to the GitHub OAuth App from Step 1 and set its **Authorization
   callback URL** to `https://<that-worker-url>/callback`.

(If you'd rather not use Cloudflare, any small hosted OAuth proxy for
Decap/Netlify CMS's GitHub backend works the same way — the requirement is
just that it exposes `/auth` and `/callback` endpoints backed by your
OAuth App's Client ID and Secret.)

## Step 3 — Point the CMS at your proxy

Open [admin/config.yml](admin/config.yml) and replace the placeholder:

```yaml
backend:
  name: github
  repo: jamesbaroniharrison-maker/Daddys-Website
  branch: main
  base_url: https://REPLACE-WITH-YOUR-OAUTH-PROXY-URL
```

with your actual worker URL (no trailing `/callback`, just the base
domain), then commit and push that one-line change.

## Step 4 — Log in

Visit `yoursite.com/admin`, click "Login with GitHub", and authorize the
app. You should land in the CMS with five sections in the sidebar: Site
Settings, Work / Portfolio, Services, How I Work. Editing and saving
commits straight to `main` and Render redeploys automatically — same as
if you'd pushed the change yourself.

**Access control**: by default, anyone with a GitHub account can attempt
to log in, but Decap's GitHub backend only lets you *save* if that GitHub
account has write access to this repo. Since only your account does,
that's the actual access boundary — no separate password system needed.

## What's editable now

- **Site Settings**: hero text, About/Work/Services/Contact copy, contact
  links, accent color (bronze or moss), font pairing, and which sections
  are visible on the page at all.
- **Work / Portfolio**: add, remove, and reorder project entries. Each one
  has a title, tags, description, and an optional numbered flow diagram
  (leave the flow steps empty to hide that diagram for a given project).
- **Services**: add, remove, and reorder what you take on.
- **How I Work**: add, remove, and reorder your process steps.

Images: the CMS is already configured to upload into `/uploads` in this
repo. Nothing on the site currently uses a photo (deliberate — see the
project brief on why), but any image field added later will work with no
extra setup.

## What's *not* covered by "curated controls"

Per the scope we agreed on, the admin panel intentionally does **not**
offer freeform color pickers, font uploads, or drag-and-drop section
reordering/building. Colors and fonts are two deliberately curated pairs;
sections can be shown or hidden but not rearranged or newly invented from
the admin UI. If you want more freedom than that later, it's a bigger,
separate piece of work — worth a fresh conversation about scope rather
than assuming it into this one.
