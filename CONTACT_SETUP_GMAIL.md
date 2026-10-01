# Contact form using only your own Gmail (no Resend, no Cloudflare)

A small Google Apps Script receives the "Send a note" form, emails you from
your own Gmail, and adds a row to a Google Sheet for every note. Free, no
DNS changes, nothing to install. The code is in `apps-script/Code.gs`.

```
visitor presses Send  ->  your Google Apps Script  ->  1. a row in your Google Sheet (the log)
                                                    ->  2. an email to your Gmail
```

Do all of this signed in to **james.bh.ai404@gmail.com** (the account that will
own the script and receive the notes).

## Setup (about 10 minutes)

1. Go to **sheets.google.com** -> **Blank spreadsheet**. Rename it
   "Baroni website notes" (top left). This sheet is your log of every note.
2. In the sheet: **Extensions -> Apps Script**. A code editor opens.
3. Delete everything in the editor. Open `apps-script/Code.gs` in this repo,
   copy all of it, paste it in, and press **Ctrl+S** to save. (Optionally
   rename the project, top left, to "Baroni contact form".)
4. Give it permission to send email and edit the sheet. In the dropdown at the
   top (next to **Run**) choose **authorise**, then press **Run**.
   - Google asks you to review permissions: pick your account.
   - You'll see **"Google hasn't verified this app"**. That's normal, because
     you wrote it yourself. Click **Advanced** -> **Go to Baroni contact form
     (unsafe)** -> **Allow**.
   - The run finishes with "Authorised. Notes will go to ..." in the log.
5. Publish it: **Deploy -> New deployment**. Click the gear icon next to
   "Select type" -> **Web app**, then set:
   - **Execute as:** Me
   - **Who has access:** **Anyone**
   Press **Deploy**. (It has to be "Anyone" so visitors' browsers can reach
   it. The form's spam trap and rate limits protect it.)
6. Copy the **Web app URL**. It ends in `/exec`.
7. Check it is live: paste that URL into a browser tab. You should see
   `{"ok":true}`.
8. Connect the site: in `script.js`, near the top, set `CONTACT_API_BASE` to
   that full URL (including `/exec`). Or just give the URL to Claude, who will
   do it and push it live.
9. Test it for real from https://baroniapplied.co.uk (about a minute after the
   push): send a note, then check that the page says "Thanks", that an email
   "New note from ..." arrives in Gmail, and that a row appears in the sheet.

## Good to know

- **Who the email is from / to:** it comes from your Gmail to your Gmail, with
  *Reply-To* set to the visitor, so pressing **Reply** writes straight to them.
  Gmail sometimes doesn't push-notify for mail you send to yourself. If you
  want a proper alert, either create a filter (Gmail -> Settings -> Filters ->
  subject contains "New note from" -> Star it, Mark as important, Never send to
  spam), or send the notes to a different address: in Apps Script go to
  **Project Settings -> Script properties -> Add** a property `NOTIFY_TO` with
  the address (for example james@baroniapplied.co.uk once your Zoho email is
  working).
- **Your Gmail address isn't published:** the script sends to whoever owns it,
  and the repo contains no personal address. Visitors never see it.
- **Limits:** a normal Gmail account can send about 100 of these a day, far
  more than you need. The script also allows one note per email address per
  minute and 30 an hour overall.
- **Notes are never lost:** each note is added to the sheet *before* the email
  is sent, so even if email fails, you still have it.
- **Changing the code later:** after editing the script, the live version does
  not change until you press **Deploy -> Manage deployments -> the pencil icon
  -> Version: New version -> Deploy**. The URL stays the same.
- **Your domain email** (james@baroniapplied.co.uk, shown on the site) still
  needs the Zoho MX records to receive direct emails. That's separate: the form
  works without it. See CONTACT_SETUP.md Part A.

## If something doesn't work

| Problem | Likely cause |
|---|---|
| Opening the URL shows a Google sign-in page | "Who has access" isn't set to **Anyone** (step 5). Edit the deployment |
| The form says "Something went wrong" | `CONTACT_API_BASE` is wrong or missing `/exec`, or the deployment is older than your latest code |
| The note is in the sheet but no email | Step 4 permissions weren't granted. Run **authorise** again; check Gmail's Spam folder |
| "Please wait a moment" | One note per email address per minute |
| "Too many notes right now" | The 30-an-hour safety limit was hit |
| Errors you can't explain | In Apps Script, open **Executions** (left menu) to see what happened |

## Tests

`cd apps-script` then `node --test test/code.test.js` runs the script's logic
against stand-ins for Google's services.

## Cloudflare route instead

CONTACT_SETUP.md describes a heavier alternative (a Cloudflare Worker +
database + Resend). You don't need it if you use this.
