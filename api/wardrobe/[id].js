import { ok, badRequest, notFound, serverError, sendOptions } from "../../lib/response.js";
import { readJson } from "../../lib/body.js";
import { initDb, sql } from "../../lib/db.js";

const CATEGORIES = ["tops", "bottoms", "outerwear", "accessories", "shoes"];

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);

  const id = Number(req.query.id);
  if (!Number.isFinite(id) || id <= 0) return badRequest(res, "Invalid id");

  if (req.method === "GET") return get(req, res, id);
  if (req.method === "PATCH" || req.method === "PUT") return update(req, res, id);
  if (req.method === "DELETE") return remove(req, res, id);
  return sendOptions(res);
}

async function get(req, res, id) {
  try {
    const { rows } = await sql.query(`SELECT * FROM wardrobe WHERE id = $1`, [id]);
    if (!rows[0]) return notFound(res, "Item not found");
    return ok(res, rows[0]);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function update(req, res, id) {
  try {
    const body = await readJson(req);
    const fields = [];
    const values = [];
    const push = (col, v) => {
      if (v !== undefined) {
        fields.push(col);
        values.push(v);
      }
    };
    push("name", body.name != null ? body.name.toString().trim() : undefined);
    push("brand", body.brand != null ? body.brand.toString() : undefined);
    push("color", body.color != null ? body.color.toString() : undefined);
    push("image_url", body.image_url != null ? body.image_url.toString() : undefined);
    push("source", body.source != null ? body.source.toString() : undefined);
    push("sub_category", body.sub_category != null ? body.sub_category.toString() : undefined);
    push("formality", body.formality != null ? body.formality.toString() : undefined);
    if (body.style_tags !== undefined || body.styleTags !== undefined) {
      const tags = Array.isArray(body.style_tags) ? body.style_tags
        : Array.isArray(body.styleTags) ? body.styleTags : [];
      fields.push("style_tags");
      values.push(JSON.stringify(tags));
    }
    if (body.category !== undefined) {
      const cat = CATEGORIES.includes(body.category) ? body.category : null;
      if (!cat) return badRequest(res, "Invalid category");
      fields.push("category");
      values.push(cat);
    }

    if (fields.length === 0) return badRequest(res, "Nothing to update");

    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(", ");
    const result = await sql.query(
      `UPDATE wardrobe SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    if (!result.rows[0]) return notFound(res, "Item not found");
    return ok(res, result.rows[0]);
  } catch (err) {
    return serverError(res, err.message);
  }
}

async function remove(req, res, id) {
  try {
    const result = await sql.query(`DELETE FROM wardrobe WHERE id = $1 RETURNING id`, [id]);
    if (!result.rows[0]) return notFound(res, "Item not found");
    return ok(res, { deleted: id });
  } catch (err) {
    return serverError(res, err.message);
  }
}
