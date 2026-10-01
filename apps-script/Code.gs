/**
 * Contact form back end on Google Apps Script - uses only your own Google
 * account (see ../CONTACT_SETUP_GMAIL.md). Receives the site's "Send a note"
 * form, emails you from your own Gmail, and logs every note in the Google
 * Sheet this script is attached to.
 *
 * Nothing private lives in this file: notes are emailed to the Gmail account
 * that owns the script. To send them somewhere else, add a Script Property
 * called NOTIFY_TO (Project Settings -> Script properties).
 */

var MAX_BODY_CHARS = 20000;
var HOURLY_LIMIT = 30; // across all visitors, to blunt a spam flood

// The site posts the form as text/plain (a "simple" request, so the browser
// needs no CORS pre-flight, which Apps Script can't answer).
function doPost(e) {
  try {
    var raw = (e && e.postData && e.postData.contents) || '';
    if (raw.length > MAX_BODY_CHARS) return reply_({ ok: false, error: 'Message is too long.' });

    var body;
    try { body = JSON.parse(raw); } catch (err) { return reply_({ ok: false, error: 'Invalid submission.' }); }

    var result = validate_(body);
    if (!result.valid) return reply_({ ok: false, error: result.errors.join(' ') });
    var data = result.data;

    var limited = rateLimited_(data.email);
    if (limited) return reply_({ ok: false, error: limited });

    // log first, so a note is never lost even if the email step fails
    try { log_(data); } catch (err) { console.error('log failed: ' + err); }

    MailApp.sendEmail({
      to: notifyTo_(),
      replyTo: data.email,
      name: 'Baroni website',
      subject: 'New note from ' + data.name.replace(/[\r\n]+/g, ' '),
      body: 'From: ' + data.name + ' <' + data.email + '>\n\n' + data.message,
    });

    return reply_({ ok: true });
  } catch (err) {
    console.error(err);
    return reply_({ ok: false, error: 'Something went wrong sending that - try again, or email me directly.' });
  }
}

// Lets you open the web app address in a browser to check it is live.
function doGet() {
  return reply_({ ok: true });
}

// Run this once from the editor (Run button) to grant the permissions the
// script needs (send email, edit the sheet). See the setup guide.
function authorise() {
  MailApp.getRemainingDailyQuota();
  SpreadsheetApp.getActiveSpreadsheet().getName();
  console.log('Authorised. Notes will go to ' + notifyTo_());
}

function validate_(body) {
  var name = String((body && body.name) || '').trim();
  var email = String((body && body.email) || '').trim();
  var message = String((body && body.message) || '').trim();
  // honeypot: a field real visitors never see or fill in. Pretend all is well
  // so a bot can't tell it was caught (nothing is saved or sent).
  if (String((body && body.company) || '').trim()) return { valid: false, honeypot: true, errors: ['Invalid submission.'] };

  var errors = [];
  if (!name) errors.push('Name is required.');
  else if (name.length > 100) errors.push('Name must be under 100 characters.');
  if (!email) errors.push('Email is required.');
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Enter a valid email address.');
  else if (email.length > 200) errors.push('Email must be under 200 characters.');
  if (!message) errors.push('Message is required.');
  else if (message.length > 5000) errors.push('Message must be under 5000 characters.');

  return errors.length ? { valid: false, errors: errors } : { valid: true, errors: [], data: { name: name, email: email, message: message } };
}

// One note per email address per minute, and HOURLY_LIMIT notes overall.
function rateLimited_(email) {
  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var key = 'rl:' + email.toLowerCase();
    if (cache.get(key)) return 'Please wait a moment before sending another note.';
    var n = Number(cache.get('hourly') || 0);
    if (n >= HOURLY_LIMIT) return 'Too many notes right now. Please email me directly instead.';
    cache.put(key, '1', 60);
    cache.put('hourly', String(n + 1), 3600);
    return null;
  } finally {
    lock.releaseLock();
  }
}

function log_(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(['Received', 'Name', 'Email', 'Message']);
  sheet.appendRow([new Date(), data.name, data.email, data.message]);
}

function notifyTo_() {
  return PropertiesService.getScriptProperties().getProperty('NOTIFY_TO') || Session.getEffectiveUser().getEmail();
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
