import { ok, badRequest, notFound, serverError, sendOptions } from "../../lib/response.js";
import { initDb, sql } from "../../lib/db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);

  const id = Number(req.query.id);
  if (!Number.isFinite(id) || id <= 0) return badRequest(res, "Invalid id");

  if (req.method === "GET") return get(req, res, id);
  if (req.method === "PATCH" || req.method === "PUT") return toggleFavorite(req, res, id);
  return sendOptions(res);
}

async function get(req, res, id) {
  try {
    const { rows } = await sql.query(`SELECT * FROM inspirations WHERE id = $1`, [id]);
    if (!rows[0]) return notFound(res, "Inspiration not found");
    return ok(res, rows[0]);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function toggleFavorite(req, res, id) {
  try {
    await initDb();
    // Default: flip. Or accept explicit { favorite: bool }.
    let favorite = null;
    let body = "";
    for await (const chunk of req) body += chunk;
    if (body) {
      try {
        const parsed = JSON.parse(body);
        if (typeof parsed.favorite === "boolean") favorite = parsed.favorite;
      } catch { /* ignore */ }
    }
    let newVal;
    if (favorite !== null) {
      newVal = favorite;
    } else {
      const cur = await sql.query(`SELECT favorite FROM inspirations WHERE id = $1`, [id]);
      if (!cur.rows[0]) return notFound(res, "Inspiration not found");
      newVal = !cur.rows[0].favorite;
    }
    const result = await sql.query(
      `UPDATE inspirations SET favorite = $2 WHERE id = $1 RETURNING *`,
      [id, newVal]
    );
    if (!result.rows[0]) return notFound(res, "Inspiration not found");
    return ok(res, result.rows[0]);
  } catch (err) {
    return serverError(res, err.message);
  }
}
