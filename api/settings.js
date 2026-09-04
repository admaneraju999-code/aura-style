import { ok, badRequest, serverError, sendOptions } from "../lib/response.js";
import { readJson } from "../lib/body.js";
import { initDb, sql } from "../lib/db.js";

const DEFAULTS = {
  profile_name: "Aura User",
  theme: "light",
  units: "metric",
  notifications: "on",
  ai_scoring: "on",
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);
  if (req.method === "GET") return get(req, res);
  if (req.method === "PUT" || req.method === "PATCH") return update(req, res);
  return sendOptions(res);
}

async function get(req, res) {
  try {
    await initDb();
    const { data } = await sql.query(`SELECT key, value FROM settings`);
    const settings = { ...DEFAULTS };
    for (const row of data) {
      settings[row.key] = coerce(row.key, row.value);
    }
    return ok(res, settings);
  } catch (err) {
    return serverError(res, err.message);
  }
}

function coerce(key, value) {
  if (key === "ai_scoring" || key === "notifications") {
    try { return JSON.parse(value) === true ? "on" : "off"; }
    catch { return value === "on" ? "on" : "off"; }
  }
  if (key === "theme") return value === "dark" ? "dark" : "light";
  return value;
}

async function update(req, res) {
  try {
    const body = await readJson(req);
    const allowed = Object.keys(DEFAULTS);
    const entries = Object.entries(body).filter(([k]) => allowed.includes(k));
    if (entries.length === 0) return badRequest(res, "No valid settings provided");

    await initDb();
    for (const [key, value] of entries) {
      const stored = (typeof value === "boolean") ? JSON.stringify(value) : String(value);
      await sql.query(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [key, stored]
      );
    }

    return get(req, res);
  } catch (err) {
    return serverError(res, err.message);
  }
}
