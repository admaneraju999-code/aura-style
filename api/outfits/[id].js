import { ok, badRequest, notFound, serverError, sendOptions } from "../../lib/response.js";
import { readJson } from "../../lib/body.js";
import { initDb, sql } from "../../lib/db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);

  const id = Number(req.query.id);
  if (!Number.isFinite(id) || id <= 0) return badRequest(res, "Invalid id");

  if (req.method === "GET") return get(req, res, id);
  if (req.method === "PATCH" || req.method === "PUT") return update(req, res, id);
  if (req.method === "DELETE") return remove(req, res, id);
  return sendOptions(res);
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

async function get(req, res, id) {
  try {
    await initDb();
    const { rows } = await sql.query(
      `SELECT *, item_ids::text AS item_ids FROM outfits WHERE id = $1`, [id]
    );
    if (!rows[0]) return notFound(res, "Outfit not found");
    return ok(res, parseOutfit(rows[0]));
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function update(req, res, id) {
  try {
    const body = await readJson(req);
    const fields = [];
    const values = [];
    const push = (c, v) => {
      if (v !== undefined) { fields.push(c); values.push(v); }
    };
    push("name", body.name != null ? body.name.toString() : undefined);
    push("description", body.description != null ? body.description.toString() : undefined);
    push("tag", body.tag != null ? body.tag.toString() : undefined);
    if (body.itemIds !== undefined) {
      fields.push("item_ids");
      values.push(JSON.stringify(Array.isArray(body.itemIds) ? body.itemIds.map(Number) : []));
    }
    if (body.score !== undefined && Number.isFinite(Number(body.score))) {
      fields.push("score");
      values.push(Number(body.score));
    }
    if (fields.length === 0) return badRequest(res, "Nothing to update");

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const result = await sql.query(
      `UPDATE outfits SET ${setClause} WHERE id = $1 RETURNING *, item_ids::text AS item_ids`,
      [id, ...values]
    );
    if (!result.rows[0]) return notFound(res, "Outfit not found");
    return ok(res, parseOutfit(result.rows[0]));
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function remove(req, res, id) {
  try {
    const result = await sql.query(`DELETE FROM outfits WHERE id = $1 RETURNING id`, [id]);
    if (!result.rows[0]) return notFound(res, "Outfit not found");
    return ok(res, { deleted: id });
  } catch (err) {
    return serverError(res, err.message);
  }
}
