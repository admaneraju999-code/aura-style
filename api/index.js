import { ok, serverError, sendOptions } from "../lib/response.js";
import { initDb, sql } from "../lib/db.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);

  try {
    await initDb();
    const counts = await sql.query(`
      SELECT
        (SELECT count(*) FROM wardrobe) AS wardrobe,
        (SELECT count(*) FROM outfits) AS outfits,
        (SELECT count(*) FROM inspirations) AS inspirations
    `);
    const row = counts.rows[0];
    return ok(res, {
      app: "Aura Style API",
      status: "ok",
      counts: {
        wardrobe: Number(row.wardrobe),
        outfits: Number(row.outfits),
        inspirations: Number(row.inspirations),
      },
    });
  } catch (err) {
    return serverError(res, err.message);
  }
}
