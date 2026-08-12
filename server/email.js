const RESEND_URL = 'https://api.resend.com/emails';

async function sendContactNotification({ name, email, message }, fetchImpl = fetch) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL_TO;
  const from = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';

  if (!apiKey || !to) {
    throw new Error('RESEND_API_KEY or CONTACT_EMAIL_TO is not set');
  }

  const res = await fetchImpl(RESEND_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Website Contact Form <${from}>`,
      to: [to],
      reply_to: email,
      subject: `New contact form message from ${name}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend request failed (${res.status}): ${body}`);
  }

  return res.json();
}

module.exports = { sendContactNotification };
