/* ============================================================
   AURA STYLE — Outfit Generation API
   GET  /api/outfit-generate          → auto-generate from wardrobe
   POST /api/outfit-generate          → generate from custom item set
   GET  /api/outfit-generate?occasion=Casual → filter by occasion
   ============================================================ */
import { ok, badRequest, serverError, sendOptions } from "../lib/response.js";
import { initDb, sql } from "../lib/db.js";
import { generateOutfits, pairScore, suggestPairs } from "../lib/outfit-engine.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);

  try {
    await initDb();

    // Fetch all wardrobe items
    const { data: rows } = await sql.query(
      `SELECT id, name, color, category, image_url, brand FROM wardrobe ORDER BY created_at DESC`
    );

    if (rows.length === 0) {
      return ok(res, {
        outfits: [],
        message: "No wardrobe items yet. Scan some clothes first!",
      });
    }

    // Parse optional query params
    const url = new URL(req.url, "http://localhost");
    const occasion = url.searchParams.get("occasion") || null;
    const maxOutfits = parseInt(url.searchParams.get("limit") || "8", 10);

    // Normalize items for the engine
    const items = rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      color: r.color || "Grey",
      category: r.category || "tops",
      image_url: r.image_url || "",
      brand: r.brand || "",
    }));

    const outfits = generateOutfits(items, { maxOutfits, occasion });

    return ok(res, {
      outfits,
      itemCount: items.length,
      generatedCount: outfits.length,
    });
  } catch (err) {
    return serverError(res, err.message);
  }
}
