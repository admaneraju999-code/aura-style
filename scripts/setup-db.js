/* ============================================================
   AURA STYLE — DB setup
   Creates tables + optional seed data.
   Run against local Postgres or Vercel Postgres:
     set POSTGRES_URL, then:  npm run db:init
   ============================================================ */
import { sql } from "@vercel/postgres";

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

const MIGRATIONS = [
  `ALTER TABLE wardrobe ADD COLUMN IF NOT EXISTS sub_category TEXT DEFAULT ''`,
  `ALTER TABLE wardrobe ADD COLUMN IF NOT EXISTS formality TEXT DEFAULT 'casual'`,
  `ALTER TABLE wardrobe ADD COLUMN IF NOT EXISTS style_tags TEXT DEFAULT '[]'`,
];

async function main() {
  await sql.query(SCHEMA);
  console.log("Schema ready: wardrobe, outfits, inspirations, settings");
  process.exit(0);
}

main().catch((err) => {
  console.error("DB init failed:", err.message);
  process.exit(1);
});
