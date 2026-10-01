> **Simpler option:** if you just want notes sent to your own Gmail, with no Resend,
> no Cloudflare and no DNS changes, use [CONTACT_SETUP_GMAIL.md](CONTACT_SETUP_GMAIL.md)
> instead. This page is the heavier Cloudflare route.

# Making the "Send a note" form actually deliver

The site is on GitHub Pages, which can only show files - it can't receive a
message. This sets up the missing piece: a small Cloudflare Worker (in
`worker/`) that receives the form, saves every note in a database, and emails
you. Everything below is on free tiers.

How a note travels once this is done:

```
visitor presses Send  ->  Cloudflare Worker  ->  1. saved in Cloudflare D1 (your log)
                                              ->  2. emailed via Resend  ->  Zoho inbox
```

There are three parts, and Part A has to be done even if you skip the rest:

- **A. Zoho email works** (nothing can reach james@baroniapplied.co.uk yet)
- **B. Resend** sends the notification emails
- **C. The Worker** receives the form and saves it
- **D. Connect the site to it**

All DNS changes are made in **Porkbun** -> Domain Management -> your domain ->
**DNS** (the "Add record" form). In Porkbun's **Host** box, enter only the part
before your domain (e.g. `send`), or leave it **blank** for the bare domain.
Never type the full domain there.

---

## Part A - Zoho email (so james@baroniapplied.co.uk can receive mail)

Your DNS currently has no MX records, so mail to your address bounces.

1. In Porkbun, check that **Email Forwarding** is off for the domain (it would
   fight with Zoho). Delete any existing MX records.
2. Add these records (your Zoho account is on the **EU** data centre, hence `.eu`):

   | Type | Host | Answer | Priority |
   |---|---|---|---|
   | MX | *(blank)* | `mx.zoho.eu` | 10 |
   | MX | *(blank)* | `mx2.zoho.eu` | 20 |
   | MX | *(blank)* | `mx3.zoho.eu` | 50 |
   | TXT | *(blank)* | `v=spf1 include:zohomail.eu ~all` | |

   You may only have **one** SPF record (the TXT starting `v=spf1`). Leave the
   existing `zoho-verification=...` TXT record alone.
3. **DKIM** (stops your mail landing in spam): in Zoho Mail Admin Console ->
   Domains -> baroniapplied.co.uk -> **Email Configuration** -> **DKIM** ->
   add/select a selector and copy the record Zoho shows. In Porkbun add it as a
   **TXT** record, with Zoho's selector name as the Host (it looks like
   `zmail._domainkey`) and the long `v=DKIM1; ...` value as the Answer. Back in
   Zoho, press **Verify**.
4. In Zoho, press **Verify** next to the MX records too.
5. **Test it:** from Gmail, email james@baroniapplied.co.uk. It should arrive in
   Zoho. DNS can take from a few minutes up to an hour.

Optional but recommended: add a **TXT** record with Host `_dmarc` and Answer
`v=DMARC1; p=none; rua=mailto:james@baroniapplied.co.uk`.

---

## Part B - Resend (sends the notification email)

6. Go to **resend.com**, sign up (free plan).
7. **Domains** -> **Add Domain** -> `baroniapplied.co.uk`.
8. Resend shows 3 or so DNS records (a TXT for DKIM, plus an MX and a TXT on a
   `send` sub-domain). Add each to Porkbun **exactly as shown** (remember: Host
   is only the part before the domain). These sit on sub-domains, so they don't
   touch your Zoho records.
9. Back in Resend press **Verify** and wait for **Verified**.
10. **API Keys** -> **Create API Key** -> permission **Sending access** -> copy
    the key (starts `re_`). You only see it once. Keep it private - never paste
    it into a file in this repo.

*Quick test without the domain step:* until the domain is verified, Resend only
lets `onboarding@resend.dev` send, and only to the email address you signed up
to Resend with. Set `CONTACT_EMAIL_FROM = "onboarding@resend.dev"` and
`CONTACT_EMAIL_TO` to that address in `worker/wrangler.toml` to try it, then
switch back.

---

## Part C - deploy the Worker (Cloudflare)

You need Node.js (already on this PC). Open a terminal in VS Code
(**Terminal -> New Terminal**) and run each command from the repo folder.

11. `cd worker`
12. `npx wrangler login` - a browser window opens; log in to Cloudflare and allow.
13. Create the database:
    ```
    npx wrangler d1 create baroni-contact
    ```
    It prints a `database_id` (a long code). Open `worker/wrangler.toml` and
    replace `REPLACE-WITH-YOUR-DATABASE-ID` with it. Save.
14. Create the table:
    ```
    npx wrangler d1 execute baroni-contact --remote --file=schema.sql
    ```
15. Deploy:
    ```
    npx wrangler deploy
    ```
    It prints your Worker's address, like
    `https://baroni-contact.YOUR-NAME.workers.dev`. **Copy it.**
16. Store the Resend key as a secret (not in any file):
    ```
    npx wrangler secret put RESEND_API_KEY
    ```
    Paste the `re_...` key when asked and press Enter.
17. Test it (PowerShell - use your own address from step 15):
    ```
    Invoke-RestMethod -Method Post -Uri https://baroni-contact.YOUR-NAME.workers.dev/api/contact -ContentType "application/json" -Body '{"name":"Test","email":"you@example.com","message":"Hello from the terminal"}'
    ```
    You should see `ok : True`, and an email should arrive in Zoho (check Spam
    the first time).

---

## Part D - connect the site

18. In `script.js`, near the top, change `CONTACT_API_BASE` to your Worker
    address from step 15 (no trailing slash). Or just tell Claude the address
    and it will do this, bump the version number, commit and push.
19. Once pushed (about a minute), send a real note from
    https://baroniapplied.co.uk. Check three things: the page shows "Thanks",
    the email arrives, and the note is in the database (below).

---

## Reading your notes later

Every note is saved even if the email fails. To list the latest 20:

```
cd worker
npx wrangler d1 execute baroni-contact --remote --command "SELECT id, datetime(created_at,'unixepoch') AS received, name, email, message FROM contact_submissions ORDER BY id DESC LIMIT 20"
```

Or in the Cloudflare dashboard: **Storage & Databases -> D1 -> baroni-contact
-> Console**.

## If something doesn't work

| Problem | Likely cause |
|---|---|
| Form says "Something went wrong" | `CONTACT_API_BASE` is wrong, or the site's address isn't in `ALLOWED_ORIGINS` in `worker/wrangler.toml` (redeploy after changing it) |
| Step 17 says `ok : True` but no email | Resend domain not verified, `CONTACT_EMAIL_FROM` not on the verified domain, or the Zoho MX records (Part A) aren't live yet. See the Worker's logs: `npx wrangler tail` then send another test |
| Email goes to spam | DKIM (step 3) not added or not verified |
| "Please wait a moment" | Only one note per visitor per minute is allowed |
| `403 Not allowed` | The request came from a website that isn't in `ALLOWED_ORIGINS` (e.g. the `www.` version, or a new domain). Add it in `worker/wrangler.toml` and run `npx wrangler deploy` |

## Changing things later

- Where notifications go / who they're from: `CONTACT_EMAIL_TO` and
  `CONTACT_EMAIL_FROM` in `worker/wrangler.toml`, then `npx wrangler deploy`.
- Run the Worker's tests: `cd worker` then `node --test test/worker.test.js`.
- The old Express version in `server/` is no longer needed for this site; it
  can stay as a reference or be deleted.
