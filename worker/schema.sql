-- Run once against the D1 database (see ../CONTACT_SETUP.md, step 14).
CREATE TABLE IF NOT EXISTS contact_submissions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL,
  message     TEXT NOT NULL,
  ip_hash     TEXT,
  user_agent  TEXT,
  created_at  INTEGER NOT NULL  -- unix seconds
);

CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx
  ON contact_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_submissions_ip_idx
  ON contact_submissions (ip_hash, created_at);
