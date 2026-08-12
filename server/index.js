const { createApp } = require('./app');
const { createPool, insertSubmission } = require('./db');
const { sendContactNotification } = require('./email');
const { createRateLimiter } = require('./rateLimit');

const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (allowedOrigins.length === 0) {
  console.warn('ALLOWED_ORIGINS is not set — no browser origin will be able to call this API.');
}

const pool = createPool();
const isAllowed = createRateLimiter({ windowMs: 60_000 });

const app = createApp({
  insertSubmission: (data) => insertSubmission(pool, data),
  sendEmail: (data) => sendContactNotification(data),
  isAllowed,
  allowedOrigins,
});

app.listen(PORT, () => {
  console.log(`Contact API listening on port ${PORT}`);
});
