import { ok, created, badRequest, serverError, sendOptions } from "../lib/response.js";
import { readJson } from "../lib/body.js";
import { initDb, sql } from "../lib/db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);
  if (req.method === "GET") return list(req, res);
  if (req.method === "POST") return create(req, res);
  return sendOptions(res);
}

async function list(req, res) {
  try {
    await initDb();
    const { data } = await sql.query(
      `SELECT *, item_ids::text AS item_ids FROM outfits ORDER BY created_at DESC`
    );
    return ok(res, data.map(parseOutfit));
  } catch (err) {
    return serverError(res, err.message);
  }
}

function parseOutfit(row) {
  let itemIds = [];
  try {
    itemIds = JSON.parse(row.item_ids || "[]");
  } catch {
    itemIds = [];
  }
  return {
    id: Number(row.id),
    name: row.name,
    description: row.description || "",
    itemIds,
    score: Number(row.score || 0),
    tag: row.tag || "",
    created_at: row.created_at,
  };
}

async function create(req, res) {
  try {
    const body = await readJson(req);
    const name = (body.name || "").toString().trim();
    if (!name) return badRequest(res, "name is required");

    const description = (body.description || "").toString();
    const tag = (body.tag || "").toString();
    const itemIds = Array.isArray(body.itemIds) ? body.itemIds.map(Number) : [];
    const score = Number.isFinite(Number(body.score)) ? Number(body.score) : 0;

    await initDb();
    const result = await sql.query(
      `INSERT INTO outfits (name, description, item_ids, score, tag)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *, item_ids::text AS item_ids`,
      [name, description, JSON.stringify(itemIds), score, tag]
    );
    return created(res, parseOutfit(result.rows[0]));
  } catch (err) {
    return serverError(res, err.message);
  }
}
