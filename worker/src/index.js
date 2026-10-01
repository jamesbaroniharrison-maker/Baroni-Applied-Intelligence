// Contact form API as a Cloudflare Worker. Same behaviour as ../server (the
// Express version): validate, throttle, save, then email a notification.
// Storage is Cloudflare D1; email goes out through Resend.
//
// POST /api/contact   { name, email, message, company }  ->  { ok: true }
// GET  /health                                           ->  { ok: true }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_URL = 'https://api.resend.com/emails';
const RATE_WINDOW_SECONDS = 60; // one submission per visitor per minute
const MAX_BODY_CHARS = 20000;

export function validateContactSubmission(body) {
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const message = String(body?.message ?? '').trim();
  // honeypot: a field real visitors never see or fill in
  if (String(body?.company ?? '').trim()) return { valid: false, honeypot: true, errors: ['honeypot triggered'] };

  const errors = [];
  if (!name) errors.push('Name is required.');
  else if (name.length > 100) errors.push('Name must be under 100 characters.');
  if (!email) errors.push('Email is required.');
  else if (!EMAIL_RE.test(email)) errors.push('Enter a valid email address.');
  else if (email.length > 200) errors.push('Email must be under 200 characters.');
  if (!message) errors.push('Message is required.');
  else if (message.length > 5000) errors.push('Message must be under 5000 characters.');

  return errors.length ? { valid: false, errors } : { valid: true, errors: [], data: { name, email, message } };
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin');
  const headers = { Vary: 'Origin' };
  if (origin && allowedOrigins(env).includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    headers['Access-Control-Max-Age'] = '86400';
  }
  return headers;
}

function json(request, env, status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request, env) },
  });
}

async function hashIp(ip, env) {
  const data = new TextEncoder().encode(`${env.IP_SALT || ''}${ip}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendNotification({ name, email, message }, env, fetchImpl = fetch) {
  if (!env.RESEND_API_KEY || !env.CONTACT_EMAIL_TO) throw new Error('RESEND_API_KEY or CONTACT_EMAIL_TO is not set');
  const from = env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';
  const res = await fetchImpl(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `Baroni website <${from}>`,
      to: [env.CONTACT_EMAIL_TO],
      reply_to: email,
      subject: `New note from ${name.replace(/[\r\n]+/g, ' ')}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  });
  if (!res.ok) throw new Error(`Resend request failed (${res.status}): ${await res.text().catch(() => '')}`);
}

export async function handleContact(request, env, fetchImpl = fetch) {
  const origin = request.headers.get('Origin');
  // browsers always send Origin on cross-origin POSTs; refuse any that isn't ours
  if (origin && !allowedOrigins(env).includes(origin)) {
    return json(request, env, 403, { ok: false, error: 'Not allowed.' });
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_CHARS) return json(request, env, 413, { ok: false, error: 'Message is too long.' });
  let body;
  try { body = JSON.parse(raw); } catch { return json(request, env, 400, { ok: false, error: 'Invalid submission.' }); }

  const ipHash = await hashIp(request.headers.get('CF-Connecting-IP') || 'unknown', env);
  const now = Math.floor(Date.now() / 1000);

  const recent = await env.DB
    .prepare('SELECT COUNT(*) AS n FROM contact_submissions WHERE ip_hash = ? AND created_at > ?')
    .bind(ipHash, now - RATE_WINDOW_SECONDS).first();
  if ((recent?.n ?? 0) > 0) {
    return json(request, env, 429, { ok: false, error: 'Please wait a moment before sending another note.' });
  }

  const result = validateContactSubmission(body);
  if (!result.valid) {
    // a bot gets a generic rejection so it can't tell "caught" from "invalid"
    return result.honeypot
      ? json(request, env, 400, { ok: false, error: 'Invalid submission.' })
      : json(request, env, 422, { ok: false, error: result.errors.join(' ') });
  }

  try {
    await env.DB
      .prepare('INSERT INTO contact_submissions (name, email, message, ip_hash, user_agent, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(result.data.name, result.data.email, result.data.message, ipHash, (request.headers.get('User-Agent') || '').slice(0, 300), now).run();
  } catch (err) {
    console.error('save failed', err);
    return json(request, env, 500, { ok: false, error: 'Something went wrong saving your note. Please try again or email directly.' });
  }

  // email is best-effort: the note IS saved, so a failed notification must not
  // make the visitor think it wasn't received (check the Worker logs if it does)
  try {
    await sendNotification(result.data, env, fetchImpl);
  } catch (err) {
    console.error('notification failed', err);
  }

  return json(request, env, 200, { ok: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    if (pathname === '/health' && request.method === 'GET') return json(request, env, 200, { ok: true });
    if (pathname === '/api/contact' && request.method === 'POST') return handleContact(request, env);
    return json(request, env, 404, { ok: false, error: 'Not found.' });
  },
};
