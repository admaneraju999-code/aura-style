/* ============================================================
   AURA STYLE — Computer Vision helpers (Scan New Item)
   Runs inside a Vercel Node serverless function.

   Analyzes an uploaded photo to extract:
     1. DOMINANT COLOR → mapped to a friendly name + hex
     2. CATEGORY → tops / bottoms / outerwear / shoes / accessories
        (improved heuristic using edge density, aspect ratio, color
         distribution, and region-of-interest profiling)
     3. FORMALITY → formal / smart / casual / sporty
        (inferred from color palette, brightness, and texture cues)
     4. STYLE TAGS → e.g. "minimalist", "bold", "earthy", "classic"
     5. Clean square PREVIEW crop

   The UI lets the user correct all fields before saving.
   ============================================================ */
import sharp from "sharp";

const COLOR_PALETTE = [
  ["Black", [20, 20, 24]],
  ["Charcoal", [60, 62, 68]],
  ["Grey", [128, 128, 132]],
  ["Silver", [185, 188, 196]],
  ["Ivory", [245, 240, 228]],
  ["White", [250, 250, 250]],
  ["Beige", [222, 205, 178]],
  ["Tan", [201, 166, 122]],
  ["Camel", [173, 139, 94]],
  ["Brown", [120, 78, 48]],
  ["Navy", [38, 47, 78]],
  ["Midnight Blue", [24, 28, 52]],
  ["Sky Blue", [150, 190, 220]],
  ["Royal Blue", [38, 74, 150]],
  ["Teal", [30, 120, 116]],
  ["Emerald", [36, 130, 86]],
  ["Green", [66, 142, 66]],
  ["Olive", [110, 120, 60]],
  ["Forest", [40, 82, 46]],
  ["Red", [176, 40, 40]],
  ["Burgundy", [104, 36, 44]],
  ["Terracotta", [190, 96, 58]],
  ["Coral", [228, 118, 98]],
  ["Pink", [230, 160, 178]],
  ["Rose", [188, 108, 128]],
  ["Magenta", [190, 54, 128]],
  ["Purple", [120, 62, 140]],
  ["Lavender", [180, 158, 208]],
  ["Plum", [96, 48, 82]],
  ["Yellow", [222, 190, 70]],
  ["Gold", [194, 156, 66]],
  ["Mustard", [190, 154, 60]],
  ["Orange", [220, 128, 52]],
  ["Peach", [238, 182, 148]],
  ["Cream", [240, 232, 206]],
];

function nearestColor(r, g, b) {
  let best = "Neutral";
  let bestDist = Infinity;
  for (const [name, [cr, cg, cb]] of COLOR_PALETTE) {
    const d = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = name;
    }
  }
  return best;
}

const NEUTRALS = new Set([
  "Ivory", "White", "Beige", "Cream", "Black", "Charcoal",
  "Grey", "Silver", "Tan", "Camel", "Brown", "Navy",
]);

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Analyze an image buffer.
 * Returns { color, colorHex, category, subCategory, formality,
 *            styleTags, confidence, width, height, previewDataUrl }
 */
export async function analyzeImage(buffer) {
  const image = sharp(buffer);
  const meta = await image.metadata();
  const width = meta.width || 0;
  const height = meta.height || 0;

  /* ── 1. Color grid analysis (32×32) ───────────────────── */
  const { data: gridData, info: gridInfo } = await image
    .resize(32, 32, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let rSum = 0, gSum = 0, bSum = 0;
  let satSum = 0;
  const n = gridInfo.width * gridInfo.height;
  for (let i = 0; i < n; i++) {
    const r = gridData[i * 3];
    const g = gridData[i * 3 + 1];
    const b = gridData[i * 3 + 2];
    rSum += r; gSum += g; bSum += b;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    satSum += max === 0 ? 0 : (max - min) / max;
  }

  const rAvg = rSum / n;
  const gAvg = gSum / n;
  const bAvg = bSum / n;
  const saturation = satSum / n;
  const brightness = (rAvg + gAvg + bAvg) / 3;

  const color = nearestColor(Math.round(rAvg), Math.round(gAvg), Math.round(bAvg));
  const colorHex = "#" + [Math.round(rAvg), Math.round(gAvg), Math.round(bAvg)]
    .map((v) => v.toString(16).padStart(2, "0")).join("");

  /* ── 2. Edge density analysis (texture complexity) ─────── */
  const { data: edgeData } = await image
    .resize(64, 64, { fit: "cover" })
    .greyscale()
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let edgeCount = 0;
  const ew = 64, eh = 64;
  for (let y = 1; y < eh - 1; y++) {
    for (let x = 1; x < ew - 1; x++) {
      const idx = y * ew + x;
      const gx = -edgeData[idx - 1] + edgeData[idx + 1];
      const gy = -edgeData[idx - ew] + edgeData[idx + ew];
      const mag = Math.sqrt(gx * gx + gy * gy);
      if (mag > 30) edgeCount++;
    }
  }
  const edgeDensity = edgeCount / ((ew - 2) * (eh - 2));

  /* ── 3. Region brightness profiling (top/mid/bottom) ──── */
  const { data: regionData } = await image
    .resize(16, 48, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let topSum = 0, midSum = 0, botSum = 0;
  for (let y = 0; y < 48; y++) {
    for (let x = 0; x < 16; x++) {
      const idx = (y * 16 + x) * 3;
      const lum = (regionData[idx] + regionData[idx + 1] + regionData[idx + 2]) / 3;
      if (y < 16) topSum += lum;
      else if (y < 32) midSum += lum;
      else botSum += lum;
    }
    topSum += 0; midSum += 0; botSum += 0;
  }
  const topBright = topSum / (16 * 16);
  const midBright = midSum / (16 * 16);
  const botBright = botSum / (16 * 16);

  /* ── 4. Color variance (how many distinct hues) ────────── */
  let hueCount = new Set();
  const { data: hueData } = await image
    .resize(16, 16, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < 256; i++) {
    const r = hueData[i * 3], g = hueData[i * 3 + 1], b = hueData[i * 3 + 2];
    const hue = rgbToHue(r, g, b);
    hueCount.add(Math.round(hue / 30) * 30); // bucket into 30° segments
  }

  /* ── 4b. Leg-seam (leg split) analysis ────────────────────
     Trousers/jeans/skirts laid flat or on a hanger often show a
     vertical middle seam where the two legs meet — the central
     column tends to be darker than the two side columns. This is
     a strong, aspect-independent signal that the garment is a
     bottom rather than a top. */
  const { data: seamData } = await image
    .resize(32, 96, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const sW = 32, sH = 96;
  let midColSum = 0, edgeColSum = 0;
  for (let y = 0; y < sH; y++) {
    for (let x = 0; x < sW; x++) {
      const idx = (y * sW + x) * 3;
      const lum = (seamData[idx] + seamData[idx + 1] + seamData[idx + 2]) / 3;
      // central ~20% of width vs the outer edges
      if (x >= sW * 0.40 && x <= sW * 0.60) midColSum += lum;
      else edgeColSum += lum;
    }
  }
  const midCnt = Math.round(sH * (sW * 0.21));
  const edgeCnt = sW * sH - midCnt;
  const midColBright = midColSum / midCnt;
  const edgeColBright = edgeColSum / edgeCnt;
  // Positive → middle darker than edges (leg split / seam). Negative → middle brighter.
  // Guard against divide-by-zero on very dark images.
  const seamSignal = edgeColBright > 1
    ? (edgeColBright - midColBright) / edgeColBright
    : 0;

  /* ── 5. Category detection ─────────────────────────────── */
  const aspect = width / Math.max(height, 1);
  const isPortrait = aspect < 0.85;

  let category = "tops";
  let subCategory = "shirt";
  let confidence = 0.65;

  // Shoes: a single shoe cropped tightly — very narrow, short, and typically
  // shows sole/outline texture (higher edge density). Full-frame portrait
  // garments fill the frame and are handled by the bottoms branch below.
  if (aspect < 0.35 && edgeDensity > 0.06 && saturation < 0.3) {
    category = "shoes";
    subCategory = "footwear";
    confidence = 0.7;
  }
  // Accessories: very wide, low edge density (bag), or wide+dark+low-sat (belt)
  else if (aspect > 1.8 && edgeDensity < 0.08) {
    category = "accessories";
    subCategory = "bag";
    confidence = 0.6;
  }
  else if (aspect > 1.5 && edgeDensity < 0.05 && brightness < 90) {
    category = "accessories";
    subCategory = "belt";
    confidence = 0.55;
  }
  // ── Bottoms: strong leg-seam signal (middle column clearly darker) ──
  else if (seamSignal > 0.12) {
    category = "bottoms";
    subCategory = seamSignal > 0.3 ? "jeans" : "trousers";
    confidence = Math.min(0.9, 0.66 + seamSignal);
  }
  // ── Bottoms: portrait (tall) garment filling the frame, not shoes.
  //    Tops (tees/shirts) are almost never extreme portrait crops; jeans,
  //    trousers, dresses and skirts very often are. ──
  else if (isPortrait && brightness > 40) {
    category = "bottoms";
    subCategory = aspect < 0.6 ? "trousers" : "skirt";
    confidence = 0.64;
  }
  // ── Bottoms: desaturated, mid garment with edge structure (denim).
  //    Restricted to portrait/1.5:1 crops so wide jackets fall through
  //    to the outerwear branch below. ──
  else if (aspect >= 0.8 && aspect < 1.4 && saturation < 0.25 && brightness < 150) {
    category = "bottoms";
    subCategory = "jeans";
    confidence = 0.64;
  }
  // ── Skirt: near-square to wide, panel-like (low edge density) ──
  else if (aspect >= 1.1 && aspect < 1.7 && edgeDensity < 0.05 && saturation > 0.15) {
    category = "bottoms";
    subCategory = "skirt";
    confidence = 0.58;
  }
  // Outerwear: wider than tall, medium-high brightness, structured edges
  else if (aspect > 1.3 && brightness > 110 && edgeDensity > 0.06) {
    category = "outerwear";
    subCategory = aspect > 1.6 ? "coat" : "jacket";
    confidence = 0.68;
  }
  else if (aspect > 1.5 && saturation < 0.15) {
    category = "outerwear";
    subCategory = "blazer";
    confidence = 0.62;
  }
  // Tops: default, but refine sub-category
  else {
    category = "tops";
    if (brightness > 180 && saturation < 0.1) subCategory = "tshirt";
    else if (edgeDensity > 0.12) subCategory = "patterned_top";
    else if (aspect < 0.85) subCategory = "dress";
    else subCategory = "shirt";
    confidence = 0.65;
  }

  /* ── 6. Formality estimation ───────────────────────────── */
  let formality = "casual";
  const isDark = brightness < 80;
  const isNeutral = NEUTRALS.has(color);
  const isLowSat = saturation < 0.15;

  if (isDark && isNeutral && category !== "shoes") {
    formality = "formal";
  } else if (isNeutral && isLowSat && category === "outerwear") {
    formality = "smart";
  } else if (isNeutral && (category === "tops" || category === "bottoms")) {
    formality = "smart";
  } else if (saturation > 0.4) {
    formality = "casual";
  }
  // Shoes: dark leather = formal
  if (category === "shoes" && isDark && edgeDensity < 0.1) {
    formality = "formal";
  }

  /* ── 7. Style tags ─────────────────────────────────────── */
  const styleTags = [];
  if (saturation < 0.1) styleTags.push("minimalist");
  if (saturation > 0.35) styleTags.push("bold");
  if (NEUTRALS.has(color)) styleTags.push("classic");
  if (["Olive", "Forest", "Terracotta", "Camel", "Brown", "Tan"].includes(color)) {
    styleTags.push("earthy");
  }
  if (["Red", "Burgundy", "Magenta", "Royal Blue", "Emerald"].includes(color)) {
    styleTags.push("statement");
  }
  if (edgeDensity > 0.12) styleTags.push("textured");
  if (brightness > 180) styleTags.push("bright");
  if (brightness < 60) styleTags.push("dark");
  if (styleTags.length === 0) styleTags.push("versatile");

  /* ── 8. Preview crop ───────────────────────────────────── */
  const previewBuffer = await sharp(buffer)
    .resize(400, 400, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82 })
    .toBuffer();
  const previewDataUrl = `data:image/jpeg;base64,${previewBuffer.toString("base64")}`;

  return {
    color,
    colorHex,
    category,
    subCategory,
    formality,
    styleTags,
    confidence,
    width,
    height,
    previewDataUrl,
  };
}

/** Approximate RGB to hue (0-360). */
function rgbToHue(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === min) return 0;
  const d = max - min;
  let h;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return h * 360;
}

export const isNeutral = (color) => NEUTRALS.has(color);
export { hexToRgb };
