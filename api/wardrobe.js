import { ok, created, badRequest, serverError, sendOptions } from "../lib/response.js";
import { initDb, sql } from "../lib/db.js";

const CATEGORIES = ["tops", "bottoms", "outerwear", "accessories", "shoes"];

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);
  if (req.method === "GET") return list(req, res);
  if (req.method === "POST") return create(req, res);
  return sendOptions(res);
}

async function list(req, res) {
  try {
    await initDb();
    const { rows } = await sql.query(
      `SELECT * FROM wardrobe ORDER BY created_at DESC`
    );
    return ok(res, rows);
  } catch (err) {
    return serverError(res, err.message);
  }
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

async function create(req, res) {
  try {
    const body = await readBody(req);
    const name = (body.name || "").toString().trim();
    if (!name) return badRequest(res, "name is required");

    const brand = (body.brand || "").toString().trim();
    const color = (body.color || "").toString().trim();
    const category = CATEGORIES.includes(body.category) ? body.category : "tops";
    const subCategory = (body.sub_category || body.subCategory || "").toString().trim();
    const formality = (body.formality || "casual").toString().trim();
    const styleTags = Array.isArray(body.style_tags) ? body.style_tags
      : Array.isArray(body.styleTags) ? body.styleTags : [];
    const imageUrl = (body.image_url || "").toString().trim();
    const source = (body.source || "manual").toString().trim();

    await initDb();
    const result = await sql.query(
      `INSERT INTO wardrobe (name, brand, color, category, sub_category, formality, style_tags, image_url, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [name, brand, color, category, subCategory, formality, JSON.stringify(styleTags), imageUrl, source]
    );
    return created(res, result.rows[0]);
  } catch (err) {
    return serverError(res, err.message);
  }
}
