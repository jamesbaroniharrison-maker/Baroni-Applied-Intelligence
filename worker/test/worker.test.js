// Run with: node --test worker/test   (from the repo root)
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { handleContact, validateContactSubmission } from '../src/index.js';

const ORIGIN = 'https://baroniapplied.co.uk';

// minimal stand-in for D1: stores rows in memory, answers the two queries the Worker runs
function fakeDb() {
  const rows = [];
  return {
    rows,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              const [ipHash, since] = args;
              return { n: rows.filter((r) => r.ip_hash === ipHash && r.created_at > since).length };
            },
            async run() {
              const [name, email, message, ip_hash, user_agent, created_at] = args;
              rows.push({ name, email, message, ip_hash, user_agent, created_at });
            },
          };
        },
      };
    },
  };
}

const makeEnv = (extra = {}) => ({
  DB: fakeDb(), ALLOWED_ORIGINS: `${ORIGIN},http://localhost:8000`,
  RESEND_API_KEY: 're_test', CONTACT_EMAIL_TO: 'james@baroniapplied.co.uk', CONTACT_EMAIL_FROM: 'notifications@baroniapplied.co.uk',
  ...extra,
});

const post = (body, { origin = ORIGIN, ip = '1.1.1.1', raw } = {}) =>
  new Request('https://x.workers.dev/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}), 'CF-Connecting-IP': ip },
    body: raw ?? JSON.stringify(body),
  });

const good = { name: 'Sam', email: 'sam@example.com', message: 'Automate my Friday emails', company: '' };

test('valid submission is saved, emailed, and returns ok', async () => {
  const env = makeEnv(); const sent = [];
  const res = await handleContact(post(good), env, async (url, init) => { sent.push({ url, init }); return new Response('{}', { status: 200 }); });
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true });
  assert.equal(env.DB.rows.length, 1);
  assert.equal(env.DB.rows[0].email, 'sam@example.com');
  assert.equal(sent.length, 1);
  const mail = JSON.parse(sent[0].init.body);
  assert.deepEqual(mail.to, ['james@baroniapplied.co.uk']);
  assert.equal(mail.reply_to, 'sam@example.com');
  assert.match(mail.from, /notifications@baroniapplied\.co\.uk/);
  assert.equal(sent[0].init.headers.Authorization, 'Bearer re_test');
});

test('CORS: allowed origin is echoed back, others get 403', async () => {
  const env = makeEnv();
  const ok = await handleContact(post(good), env, async () => new Response('{}'));
  assert.equal(ok.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const bad = await handleContact(post(good, { origin: 'https://evil.example' }), env, async () => new Response('{}'));
  assert.equal(bad.status, 403);
  assert.equal(env.DB.rows.length, 1);
});

test('preflight OPTIONS succeeds for the site and carries CORS headers', async () => {
  const res = await worker.fetch(new Request('https://x.workers.dev/api/contact', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), makeEnv());
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.match(res.headers.get('Access-Control-Allow-Headers'), /Content-Type/);
});

test('validation errors return 422 and save nothing', async () => {
  const env = makeEnv();
  const res = await handleContact(post({ name: '', email: 'nope', message: '' }), env, async () => new Response('{}'));
  assert.equal(res.status, 422);
  const body = await res.json();
  assert.equal(body.ok, false);
  assert.match(body.error, /Name is required/);
  assert.match(body.error, /valid email/);
  assert.equal(env.DB.rows.length, 0);
});

test('honeypot is rejected generically and saves nothing', async () => {
  const env = makeEnv();
  const res = await handleContact(post({ ...good, company: 'Spam Ltd' }), env, async () => new Response('{}'));
  assert.equal(res.status, 400);
  assert.equal((await res.json()).error, 'Invalid submission.');
  assert.equal(env.DB.rows.length, 0);
});

test('a second submission from the same visitor within a minute gets 429', async () => {
  const env = makeEnv(); const f = async () => new Response('{}');
  assert.equal((await handleContact(post(good), env, f)).status, 200);
  assert.equal((await handleContact(post(good), env, f)).status, 429);
  assert.equal((await handleContact(post(good, { ip: '2.2.2.2' }), env, f)).status, 200); // different visitor is fine
  assert.equal(env.DB.rows.length, 2);
});

test('a failed email still returns ok because the note was saved', async () => {
  const env = makeEnv();
  const res = await handleContact(post(good), env, async () => new Response('domain not verified', { status: 403 }));
  assert.equal(res.status, 200);
  assert.equal(env.DB.rows.length, 1);
});

test('missing Resend key does not break saving', async () => {
  const env = makeEnv({ RESEND_API_KEY: undefined });
  const res = await handleContact(post(good), env, async () => new Response('{}'));
  assert.equal(res.status, 200);
  assert.equal(env.DB.rows.length, 1);
});

test('a database failure returns 500 and no success', async () => {
  const env = makeEnv();
  env.DB.prepare = () => ({ bind: () => ({ first: async () => ({ n: 0 }), run: async () => { throw new Error('d1 down'); } }) });
  const res = await handleContact(post(good), env, async () => new Response('{}'));
  assert.equal(res.status, 500);
  assert.equal((await res.json()).ok, false);
});

test('oversized and malformed bodies are refused', async () => {
  const env = makeEnv();
  assert.equal((await handleContact(post(null, { raw: 'x'.repeat(21000) }), env)).status, 413);
  assert.equal((await handleContact(post(null, { raw: 'not json' }), env)).status, 400);
});

test('IP addresses are stored hashed, never raw', async () => {
  const env = makeEnv();
  await handleContact(post(good, { ip: '203.0.113.9' }), env, async () => new Response('{}'));
  assert.notEqual(env.DB.rows[0].ip_hash, '203.0.113.9');
  assert.match(env.DB.rows[0].ip_hash, /^[0-9a-f]{64}$/);
});

test('health check and unknown routes', async () => {
  const env = makeEnv();
  assert.equal((await worker.fetch(new Request('https://x.workers.dev/health'), env)).status, 200);
  assert.equal((await worker.fetch(new Request('https://x.workers.dev/nope'), env)).status, 404);
});

test('validateContactSubmission matches the Express version on the happy path', () => {
  const r = validateContactSubmission({ name: ' Sam ', email: 'sam@example.com', message: ' hi ', company: '' });
  assert.deepEqual(r.data, { name: 'Sam', email: 'sam@example.com', message: 'hi' });
});
