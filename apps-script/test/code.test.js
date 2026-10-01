// Run with: node --test apps-script/test/code.test.js   (from the repo root)
// Loads Code.gs in a sandbox with stand-ins for Google's services.
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const code = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'Code.gs'), 'utf8');

function load({ sheetFails = false, mailFails = false, props = {} } = {}) {
  const sent = [], rows = [], store = new Map();
  const sandbox = {
    console: { error() {}, log() {} },
    JSON, String, Number, Date, Math,
    MailApp: {
      sendEmail(m) { if (mailFails) throw new Error('mail down'); sent.push(m); },
      getRemainingDailyQuota() { return 100; },
    },
    SpreadsheetApp: {
      getActiveSpreadsheet() {
        if (sheetFails) throw new Error('sheet down');
        return { getName: () => 'Notes', getSheets: () => [{ getLastRow: () => rows.length, appendRow: (r) => rows.push(r) }] };
      },
    },
    CacheService: { getScriptCache: () => ({ get: (k) => store.get(k) ?? null, put: (k, v) => store.set(k, v) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props[k] ?? null }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@gmail.example' }) },
    ContentService: {
      MimeType: { JSON: 'JSON' },
      createTextOutput: (t) => ({ text: t, setMimeType() { return this; } }),
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);
  const post = (body, raw) => JSON.parse(sandbox.doPost({ postData: { contents: raw ?? JSON.stringify(body) } }).text);
  return { sandbox, post, sent, rows };
}

const good = { name: 'Sam', email: 'sam@example.com', message: 'Automate my Friday emails', company: '' };

test('valid note is logged and emailed to the script owner with reply-to set', () => {
  const { post, sent, rows } = load();
  assert.deepEqual(post(good), { ok: true });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'owner@gmail.example');
  assert.equal(sent[0].replyTo, 'sam@example.com');
  assert.match(sent[0].subject, /New note from Sam/);
  assert.match(sent[0].body, /Automate my Friday emails/);
  assert.equal(rows.length, 2); // header row + the note
  assert.equal(rows[1][2], 'sam@example.com');
});

test('NOTIFY_TO property overrides the recipient', () => {
  const { post, sent } = load({ props: { NOTIFY_TO: 'james@baroniapplied.co.uk' } });
  post(good);
  assert.equal(sent[0].to, 'james@baroniapplied.co.uk');
});

test('validation errors are returned and nothing is saved or sent', () => {
  const { post, sent, rows } = load();
  const r = post({ name: '', email: 'nope', message: '' });
  assert.equal(r.ok, false);
  assert.match(r.error, /Name is required/);
  assert.match(r.error, /valid email/);
  assert.equal(sent.length + rows.length, 0);
});

test('honeypot: rejected, nothing saved or sent', () => {
  const { post, sent, rows } = load();
  const r = post({ ...good, company: 'Spam Ltd' });
  assert.equal(r.ok, false);
  assert.equal(sent.length + rows.length, 0);
});

test('same email twice within a minute is rate limited; a different email is fine', () => {
  const { post, sent } = load();
  assert.equal(post(good).ok, true);
  assert.equal(post(good).ok, false);
  assert.equal(post({ ...good, email: 'other@example.com' }).ok, true);
  assert.equal(sent.length, 2);
});

test('overall hourly cap stops a flood', () => {
  const { post, sent } = load();
  let blocked = 0;
  for (let i = 0; i < 35; i++) if (!post({ ...good, email: `u${i}@example.com` }).ok) blocked++;
  assert.equal(sent.length, 30);
  assert.equal(blocked, 5);
});

test('if the sheet fails the email still goes out', () => {
  const { post, sent } = load({ sheetFails: true });
  assert.equal(post(good).ok, true);
  assert.equal(sent.length, 1);
});

test('if the email fails the visitor sees an error but the note is already logged', () => {
  const { post, rows } = load({ mailFails: true });
  const r = post(good);
  assert.equal(r.ok, false);
  assert.match(r.error, /email me directly/);
  assert.equal(rows[1][2], 'sam@example.com');
});

test('oversized and malformed bodies are refused', () => {
  const { post, sent } = load();
  assert.equal(post(null, 'x'.repeat(21000)).ok, false);
  assert.equal(post(null, 'not json').ok, false);
  assert.equal(sent.length, 0);
});

test('doGet reports the endpoint is live', () => {
  const { sandbox } = load();
  assert.deepEqual(JSON.parse(sandbox.doGet().text), { ok: true });
});
