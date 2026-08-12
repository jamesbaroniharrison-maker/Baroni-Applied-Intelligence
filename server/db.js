const { Pool } = require('pg');

function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

async function insertSubmission(pool, { name, email, message, ipAddress, userAgent }) {
  const result = await pool.query(
    `INSERT INTO contact_submissions (name, email, message, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, created_at`,
    [name, email, message, ipAddress || null, userAgent || null]
  );
  return result.rows[0];
}

module.exports = { createPool, insertSubmission };
