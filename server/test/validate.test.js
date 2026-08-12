const test = require('node:test');
const assert = require('node:assert/strict');
const { validateContactSubmission } = require('../validate');

test('accepts a valid submission', () => {
  const result = validateContactSubmission({ name: 'Jane', email: 'jane@example.com', message: 'Hello there' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.data, { name: 'Jane', email: 'jane@example.com', message: 'Hello there' });
});

test('trims whitespace', () => {
  const result = validateContactSubmission({ name: '  Jane  ', email: ' jane@example.com ', message: '  hi  ' });
  assert.equal(result.valid, true);
  assert.equal(result.data.name, 'Jane');
  assert.equal(result.data.email, 'jane@example.com');
  assert.equal(result.data.message, 'hi');
});

test('rejects missing name', () => {
  const result = validateContactSubmission({ email: 'jane@example.com', message: 'hi' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('Name')));
});

test('rejects missing email', () => {
  const result = validateContactSubmission({ name: 'Jane', message: 'hi' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('Email')));
});

test('rejects malformed email', () => {
  const result = validateContactSubmission({ name: 'Jane', email: 'not-an-email', message: 'hi' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('valid email')));
});

test('rejects missing message', () => {
  const result = validateContactSubmission({ name: 'Jane', email: 'jane@example.com' });
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((e) => e.includes('Message')));
});

test('rejects overlong name', () => {
  const result = validateContactSubmission({ name: 'x'.repeat(101), email: 'jane@example.com', message: 'hi' });
  assert.equal(result.valid, false);
});

test('rejects overlong message', () => {
  const result = validateContactSubmission({ name: 'Jane', email: 'jane@example.com', message: 'x'.repeat(5001) });
  assert.equal(result.valid, false);
});

test('rejects when honeypot field is filled', () => {
  const result = validateContactSubmission({ name: 'Jane', email: 'jane@example.com', message: 'hi', company: 'I am a bot' });
  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ['honeypot triggered']);
});
