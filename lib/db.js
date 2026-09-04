/* ============================================================
   AURA STYLE — Database layer
   Uses @vercel/postgres (serverless-safe connection pool).
   Reads POSTGRES_URL / POSTGRES_HOST etc. from env, exactly as
   configured when you create a Vercel Postgres (Neon) database.
   ============================================================ */
import { sql } from "@vercel/postgres";

/* ---------- Schema (created on first request) ---------- */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS wardrobe (
    id            BIGSERIAL PRIMARY KEY,
    name          TEXT NOT NULL,
    brand         TEXT DEFAULT '',
    color         TEXT DEFAULT '',
    category      TEXT DEFAULT 'tops',
    sub_category  TEXT DEFAULT '',
    formality     TEXT DEFAULT 'casual',
    style_tags    TEXT DEFAULT '[]',
    image_url     TEXT DEFAULT '',
    source        TEXT DEFAULT 'scan',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS outfits (
    id          BIGSERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    item_ids    TEXT NOT NULL DEFAULT '[]',
    score       NUMERIC DEFAULT 0,
    tag         TEXT DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS inspirations (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    tag         TEXT DEFAULT '',
    image_url   TEXT DEFAULT '',
    favorite    BOOLEAN NOT NULL DEFAULT false,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL
  );
`;

/* Migration: add new columns if they don't exist */
const MIGRATIONS = [
  `ALTER TABLE wardrobe ADD COLUMN IF NOT EXISTS sub_category TEXT DEFAULT ''`,
  `ALTER TABLE wardrobe ADD COLUMN IF NOT EXISTS formality TEXT DEFAULT 'casual'`,
  `ALTER TABLE wardrobe ADD COLUMN IF NOT EXISTS style_tags TEXT DEFAULT '[]'`,
];

let ready = false;

async function ensureSchema() {
  if (ready) return;
  await sql.query(SCHEMA);
  // Run migrations to add new columns to existing tables
  for (const m of MIGRATIONS) {
    try { await sql.query(m); } catch { /* column already exists */ }
  }
  ready = true;
}

/** Run after any DB operation that needs the tables to exist. */
export async function initDb() {
  await ensureSchema();
}

export { sql };
