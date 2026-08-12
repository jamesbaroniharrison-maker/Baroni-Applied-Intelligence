const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../app');

function startTestServer(overrides = {}) {
  const inserted = [];
  const emailed = [];
  const app = createApp({
    insertSubmission: async (data) => { inserted.push(data); return { id: 1, created_at: new Date() }; },
    sendEmail: async (data) => { emailed.push(data); },
    isAllowed: () => true,
    allowedOrigins: ['http://example.com'],
    ...overrides,
  });
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, port, inserted, emailed, url: (path) => `http://127.0.0.1:${port}${path}` });
    });
  });
}

test('POST /api/contact accepts a valid submission, stores it, and emails', async () => {
  const { server, url, inserted, emailed } = await startTestServer();
  try {
    const res = await fetch(url('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', message: 'Hello' }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(inserted.length, 1);
    assert.equal(inserted[0].name, 'Jane');
    assert.equal(emailed.length, 1);
  } finally {
    server.close();
  }
});

test('POST /api/contact rejects an invalid submission without storing or emailing', async () => {
  const { server, url, inserted, emailed } = await startTestServer();
  try {
    const res = await fetch(url('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email', message: '' }),
    });
    const body = await res.json();
    assert.equal(res.status, 422);
    assert.equal(body.ok, false);
    assert.equal(inserted.length, 0);
    assert.equal(emailed.length, 0);
  } finally {
    server.close();
  }
});

test('POST /api/contact silently rejects when the honeypot field is filled', async () => {
  const { server, url, inserted } = await startTestServer();
  try {
    const res = await fetch(url('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bot', email: 'bot@example.com', message: 'spam', company: 'filled in' }),
    });
    assert.equal(res.status, 400);
    assert.equal(inserted.length, 0);
  } finally {
    server.close();
  }
});

test('POST /api/contact returns 429 when rate-limited', async () => {
  const { server, url } = await startTestServer({ isAllowed: () => false });
  try {
    const res = await fetch(url('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', message: 'Hello' }),
    });
    assert.equal(res.status, 429);
  } finally {
    server.close();
  }
});

test('POST /api/contact still saves the submission even if the email send fails', async () => {
  const { server, url, inserted } = await startTestServer({
    sendEmail: async () => { throw new Error('email provider down'); },
  });
  try {
    const res = await fetch(url('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', message: 'Hello' }),
    });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
    assert.equal(inserted.length, 1);
  } finally {
    server.close();
  }
});

test('POST /api/contact returns 500 if the database insert fails', async () => {
  const { server, url } = await startTestServer({
    insertSubmission: async () => { throw new Error('db down'); },
  });
  try {
    const res = await fetch(url('/api/contact'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Jane', email: 'jane@example.com', message: 'Hello' }),
    });
    assert.equal(res.status, 500);
  } finally {
    server.close();
  }
});

test('GET /health responds ok', async () => {
  const { server, url } = await startTestServer();
  try {
    const res = await fetch(url('/health'));
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.ok, true);
  } finally {
    server.close();
  }
});
