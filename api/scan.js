/* ============================================================
   AURA STYLE — Scan New Item
   POST /api/scan (multipart/form-data)
     image  : file blob (jpeg/png/webp)
     name   : optional display name (defaults to "Scanned Item")
     save   : optional "true" -> also insert into wardrobe
   Returns CV analysis: detected color, category, preview image.
   ============================================================ */
import Busboy from "busboy";
import { analyzeImage } from "../lib/cv.js";
import { ok, badRequest, serverError, sendOptions } from "../lib/response.js";
import { initDb, sql } from "../lib/db.js";

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendOptions(res);
  if (req.method !== "POST") return sendOptions(res);

  try {
    const { fileBuffer, name, save } = await parseUpload(req);

    if (!fileBuffer || fileBuffer.length === 0) {
      return badRequest(res, "An image file is required (field name 'image')");
    }

    const analysis = await analyzeImage(fileBuffer);

    let savedItem = null;
    if (save) {
      await initDb();
      const itemName = (name || "Scanned Item").toString().trim();
      const result = await sql.query(
        `INSERT INTO wardrobe (name, color, category, sub_category, formality, style_tags, image_url, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'scan')
         RETURNING *`,
        [
          itemName, analysis.color, analysis.category,
          analysis.subCategory || "", analysis.formality || "casual",
          JSON.stringify(analysis.styleTags || []),
          analysis.previewDataUrl,
        ]
      );
      savedItem = result.rows[0];
    }

    return ok(res, {
      color: analysis.color,
      colorHex: analysis.colorHex,
      category: analysis.category,
      subCategory: analysis.subCategory,
      formality: analysis.formality,
      styleTags: analysis.styleTags,
      confidence: analysis.confidence,
      width: analysis.width,
      height: analysis.height,
      preview: analysis.previewDataUrl,
      savedItem,
    });
  } catch (err) {
    return serverError(res, err.message);
  }
}

function parseUpload(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 8 * 1024 * 1024, files: 1 } });
    let fileBuffer = Buffer.alloc(0);
    let name = "";
    let save = false;

    busboy.on("file", (fieldname, file, info) => {
      const chunks = [];
      file.on("data", (d) => chunks.push(d));
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("field", (fieldname, val) => {
      if (fieldname === "name") name = val;
      if (fieldname === "save") save = val === "true" || val === "1";
    });

    busboy.on("error", reject);
    busboy.on("finish", () => resolve({ fileBuffer, name, save }));
    req.pipe(busboy);
  });
}
