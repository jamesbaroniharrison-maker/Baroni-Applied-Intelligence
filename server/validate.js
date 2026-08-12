const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactSubmission(body) {
  const errors = [];
  const name = String(body?.name ?? '').trim();
  const email = String(body?.email ?? '').trim();
  const message = String(body?.message ?? '').trim();
  // honeypot: a field real visitors never see or fill in (hidden via CSS,
  // not `type="hidden"`, since some bots skip truly hidden inputs)
  const honeypot = String(body?.company ?? '').trim();

  if (honeypot) {
    // don't tell a bot why it failed — just reject as invalid input
    errors.push('honeypot triggered');
    return { valid: false, errors, data: null };
  }

  if (!name) errors.push('Name is required.');
  else if (name.length > 100) errors.push('Name must be under 100 characters.');

  if (!email) errors.push('Email is required.');
  else if (!EMAIL_RE.test(email)) errors.push('Enter a valid email address.');
  else if (email.length > 200) errors.push('Email must be under 200 characters.');

  if (!message) errors.push('Message is required.');
  else if (message.length > 5000) errors.push('Message must be under 5000 characters.');

  if (errors.length) return { valid: false, errors, data: null };
  return { valid: true, errors: [], data: { name, email, message } };
}

module.exports = { validateContactSubmission };
