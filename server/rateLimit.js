// Simple in-memory per-IP throttle. Resets on server restart, which is
// fine at this scale (a personal contact form, not a high-traffic API) —
// not meant as a substitute for a real WAF/rate-limiting service, just
// enough to blunt naive bot spam.

function createRateLimiter({ windowMs = 60_000, now = () => Date.now() } = {}) {
  const lastSeen = new Map();

  return function isAllowed(key) {
    const last = lastSeen.get(key);
    const current = now();
    if (last !== undefined && current - last < windowMs) {
      return false;
    }
    lastSeen.set(key, current);
    return true;
  };
}

module.exports = { createRateLimiter };
