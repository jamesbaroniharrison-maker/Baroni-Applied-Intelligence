const express = require('express');
const cors = require('cors');
const { validateContactSubmission } = require('./validate');

function createApp({ insertSubmission, sendEmail, isAllowed, allowedOrigins }) {
  const app = express();

  app.use(express.json({ limit: '20kb' }));
  app.use(
    cors({
      origin: (origin, callback) => {
        // allow same-origin/non-browser requests (no Origin header) through
        if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
    })
  );

  app.get('/health', (req, res) => {
    res.json({ ok: true });
  });

  app.post('/api/contact', async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';

    if (!isAllowed(ip)) {
      return res.status(429).json({ ok: false, error: 'Please wait a moment before sending another message.' });
    }

    const { valid, errors, data } = validateContactSubmission(req.body);
    if (!valid) {
      // the honeypot case still gets a generic 200-shaped rejection so a
      // bot can't distinguish "spam caught" from "validation failed"
      const isHoneypot = errors[0] === 'honeypot triggered';
      return res.status(isHoneypot ? 400 : 422).json({
        ok: false,
        error: isHoneypot ? 'Invalid submission.' : errors.join(' '),
      });
    }

    try {
      await insertSubmission({
        ...data,
        ipAddress: ip,
        userAgent: req.headers['user-agent'] || null,
      });
    } catch (err) {
      req.log?.error?.(err);
      return res.status(500).json({ ok: false, error: 'Something went wrong saving your message. Please try again or email directly.' });
    }

    // email is best-effort — a failed notification shouldn't make the
    // visitor think their message wasn't received, since it WAS saved
    try {
      await sendEmail(data);
    } catch (err) {
      req.log?.error?.(err);
    }

    return res.json({ ok: true });
  });

  return app;
}

module.exports = { createApp };
