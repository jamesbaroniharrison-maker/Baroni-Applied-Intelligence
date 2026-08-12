const test = require('node:test');
const assert = require('node:assert/strict');
const { createRateLimiter } = require('../rateLimit');

test('allows the first request from an IP', () => {
  const isAllowed = createRateLimiter({ windowMs: 1000, now: () => 0 });
  assert.equal(isAllowed('1.2.3.4'), true);
});

test('blocks a second request within the window', () => {
  let time = 0;
  const isAllowed = createRateLimiter({ windowMs: 1000, now: () => time });
  assert.equal(isAllowed('1.2.3.4'), true);
  time = 500;
  assert.equal(isAllowed('1.2.3.4'), false);
});

test('allows again after the window passes', () => {
  let time = 0;
  const isAllowed = createRateLimiter({ windowMs: 1000, now: () => time });
  assert.equal(isAllowed('1.2.3.4'), true);
  time = 1500;
  assert.equal(isAllowed('1.2.3.4'), true);
});

test('tracks different IPs independently', () => {
  const isAllowed = createRateLimiter({ windowMs: 1000, now: () => 0 });
  assert.equal(isAllowed('1.2.3.4'), true);
  assert.equal(isAllowed('5.6.7.8'), true);
});
