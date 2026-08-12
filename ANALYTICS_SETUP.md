# Setting up Cloudflare Web Analytics

The site has a Cloudflare Web Analytics beacon script already in
[index.html](index.html), just before `</body>`, with a placeholder token.
This is free, doesn't use cookies, and doesn't need a cookie-consent
banner (Cloudflare's Web Analytics is designed to be privacy-preserving by
default — no cross-site tracking, no persistent identifiers).

## Steps

1. Log into the Cloudflare dashboard (same account as the OAuth worker
   from CMS_SETUP.md).
2. Go to **Analytics & Logs → Web Analytics**.
3. Click **Add a site**, enter your site's hostname (e.g.
   `daddys-website.onrender.com`, or your custom domain once you have
   one).
4. Cloudflare gives you a snippet that looks like:

   ```html
   <script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "abc123..."}'></script>
   ```

5. Copy just the token value (the part inside `"token": "..."`) and
   replace `REPLACE-WITH-YOUR-BEACON-TOKEN` in `index.html` with it.
6. Commit and push. Render redeploys, and Cloudflare's dashboard starts
   showing pageviews within a few minutes of the next visit.

## What you get

Pageviews, top pages, referrers, countries, and Core Web Vitals — all in
the Cloudflare dashboard under Web Analytics, no code beyond the one
script tag already in place.
