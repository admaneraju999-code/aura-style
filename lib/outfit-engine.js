/* ============================================================
   AURA STYLE — Outfit Generation Engine
   Given a wardrobe of categorized items, generates outfit
   combinations using color harmony rules, formality matching,
   and style scoring.

   This is a pure logic module — no DB, no HTTP.
   Can run on server (API) or be ported to client.
   ============================================================ */

/* ── Color Map: friendly name → hue range (0-360) ────────── */
const COLOR_HUE = {
  "Red": 0, "Burgundy": 350, "Coral": 15, "Terracotta": 22,
  "Orange": 30, "Peach": 28, "Gold": 43, "Yellow": 52,
  "Mustard": 48, "Green": 120, "Emerald": 155, "Olive": 80,
  "Forest": 140, "Teal": 175, "Sky Blue": 205, "Royal Blue": 220,
  "Navy": 225, "Midnight Blue": 235, "Purple": 280,
  "Lavender": 270, "Plum": 310, "Magenta": 320, "Pink": 340,
  "Rose": 350,
  // Neutrals have no meaningful hue
  "Black": -1, "Charcoal": -1, "Grey": -1, "Silver": -1,
  "White": -1, "Ivory": -1, "Beige": -1, "Cream": -1,
  "Tan": 30, "Camel": 30, "Brown": 25,
};

const NEUTRALS = new Set([
  "Black", "Charcoal", "Grey", "Silver", "White", "Ivory",
  "Beige", "Cream", "Tan", "Camel", "Brown", "Navy",
]);

/* ── Color Harmony Scoring ────────────────────────────────── */
function hueDiff(a, b) {
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}

function colorHarmonyScore(c1, c2) {
  if (c1 === c2) return 100;
  const h1 = COLOR_HUE[c1] ?? -1;
  const h2 = COLOR_HUE[c2] ?? -1;

  // Both neutrals: always match
  if (h1 === -1 && h2 === -1) return 95;

  // One neutral: always works, slight bonus for dark+light contrast
  if (h1 === -1 || h2 === -1) {
    const bright = [c1, c2].some((c) =>
      ["White", "Ivory", "Cream", "Silver", "Beige"].includes(c)
    );
    return bright ? 92 : 88;
  }

  // Both chromatic: check harmony type
  const diff = hueDiff(h1, h2);
  if (diff < 15) return 85;        // same family
  if (diff >= 15 && diff <= 40) return 90;  // analogous
  if (diff >= 150 && diff <= 210) return 88; // complementary
  if (diff >= 90 && diff <= 130) return 78;  // triadic-ish
  return 60; // clashing
}

/* ── Formality Levels ──────────────────────────────────────── */
const FORMALITY = {
  formal: 4,
  smart: 3,
  casual: 2,
  sporty: 1,
};

function formalityCompat(a, b) {
  const fa = FORMALITY[a] || 2;
  const fb = FORMALITY[b] || 2;
  return Math.abs(fa - fb) <= 1;
}

/* ── Outfit Templates ──────────────────────────────────────── */
const TEMPLATES = [
  {
    name: "Classic Casual",
    description: "A relaxed everyday look combining comfort with effortless style.",
    occasion: "Casual",
    slots: [
      { category: "tops", label: "Top", required: true },
      { category: "bottoms", label: "Bottom", required: true },
    ],
    preferredFormality: "casual",
    tags: ["everyday", "relaxed"],
  },
  {
    name: "Smart Layered",
    description: "A polished three-piece ensemble with structured outerwear for a refined silhouette.",
    occasion: "Business Casual",
    slots: [
      { category: "tops", label: "Base Layer", required: true },
      { category: "bottoms", label: "Bottom", required: true },
      { category: "outerwear", label: "Layer", required: true },
    ],
    preferredFormality: "smart",
    tags: ["professional", "layered"],
  },
  {
    name: "Evening Ready",
    description: "A sophisticated dark-toned outfit perfect for dinner or events.",
    occasion: "Evening",
    slots: [
      { category: "tops", label: "Top", required: true },
      { category: "bottoms", label: "Bottom", required: true },
      { category: "outerwear", label: "Outerwear", required: false },
      { category: "shoes", label: "Shoes", required: false },
    ],
    preferredFormality: "smart",
    tags: ["evening", "elegant"],
  },
  {
    name: "Street Style",
    description: "A bold urban-inspired combination mixing textures and statement pieces.",
    occasion: "Casual",
    slots: [
      { category: "tops", label: "Top", required: true },
      { category: "bottoms", label: "Bottom", required: true },
      { category: "shoes", label: "Shoes", required: false },
      { category: "accessories", label: "Accessory", required: false },
    ],
    preferredFormality: "casual",
    tags: ["urban", "trendy"],
  },
  {
    name: "Business Formal",
    description: "A tailored power look with structured layers for meetings and presentations.",
    occasion: "Business",
    slots: [
      { category: "tops", label: "Shirt", required: true },
      { category: "bottoms", label: "Trousers", required: true },
      { category: "outerwear", label: "Blazer", required: true },
      { category: "shoes", label: "Shoes", required: false },
    ],
    preferredFormality: "formal",
    tags: ["professional", "power"],
  },
  {
    name: "Weekend Comfort",
    description: "A cozy, laid-back outfit built for leisure and comfort.",
    occasion: "Lounge",
    slots: [
      { category: "tops", label: "Top", required: true },
      { category: "bottoms", label: "Bottom", required: true },
    ],
    preferredFormality: "casual",
    tags: ["cozy", "weekend"],
  },
  {
    name: "Full Stack",
    description: "A complete four-piece outfit with every layer covered from head to toe.",
    occasion: "All-Day",
    slots: [
      { category: "tops", label: "Top", required: true },
      { category: "bottoms", label: "Bottom", required: true },
      { category: "outerwear", label: "Outerwear", required: true },
      { category: "shoes", label: "Shoes", required: true },
    ],
    preferredFormality: "smart",
    tags: ["complete", "polished"],
  },
  {
    name: "Accessorized Look",
    description: "An elevated outfit finished with a statement accessory.",
    occasion: "Social",
    slots: [
      { category: "tops", label: "Top", required: true },
      { category: "bottoms", label: "Bottom", required: true },
      { category: "accessories", label: "Accessory", required: true },
    ],
    preferredFormality: "smart",
    tags: ["finished", "styled"],
  },
];

/* ── Group wardrobe items by category ─────────────────────── */
function groupByCategory(items) {
  const groups = {};
  for (const item of items) {
    const cat = item.category || "tops";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

/* ── Score a single outfit combination ────────────────────── */
function scoreOutfit(combo) {
  if (combo.length === 0) return 0;

  let totalColorScore = 0;
  let pairs = 0;

  // Color harmony: average of all adjacent pairs
  for (let i = 0; i < combo.length - 1; i++) {
    totalColorScore += colorHarmonyScore(combo[i].color, combo[i + 1].color);
    pairs++;
  }
  // Also score first/last if 3+ items
  if (combo.length >= 3) {
    totalColorScore += colorHarmonyScore(combo[0].color, combo[combo.length - 1].color) * 0.7;
    pairs++;
  }
  const avgColorScore = pairs > 0 ? totalColorScore / pairs : 80;

  // Formality consistency
  const formalities = combo.map((i) => i.formality || "casual");
  let formalityScore = 100;
  for (let i = 0; i < formalities.length - 1; i++) {
    if (!formalityCompat(formalities[i], formalities[i + 1])) {
      formalityScore -= 20;
    }
  }

  // Variety bonus: more categories = slightly better
  const uniqueCategories = new Set(combo.map((i) => i.category));
  const varietyBonus = Math.min(uniqueCategories.size * 3, 12);

  // Dark-on-dark or light-on-light penalty (unless intentional)
  const allDark = combo.every((i) =>
    ["Black", "Charcoal", "Navy", "Midnight Blue", "Brown", "Burgundy", "Forest", "Plum"].includes(i.color)
  );
  const allLight = combo.every((i) =>
    ["White", "Ivory", "Cream", "Beige", "Silver", "Lavender"].includes(i.color)
  );
  let contrastPenalty = 0;
  if (combo.length >= 2 && (allDark || allLight)) {
    contrastPenalty = combo.length >= 3 ? -8 : -5;
  }

  const raw = avgColorScore * 0.5 + formalityScore * 0.3 + varietyBonus + contrastPenalty;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/* ── Generate all valid combos for a template ─────────────── */
function combosForTemplate(template, groups) {
  const results = [];

  // Check if all required categories have items
  for (const slot of template.slots) {
    if (slot.required && (!groups[slot.category] || groups[slot.category].length === 0)) {
      return []; // can't fulfill this template
    }
  }

  // Build slot item options
  const slotOptions = template.slots.map((slot) => {
    const items = groups[slot.category] || [];
    return items.map((item) => ({ ...item, slotLabel: slot.label, required: slot.required }));
  });

  // Generate combinations (limit per slot to avoid explosion)
  const MAX_PER_SLOT = 8;

  function buildCombo(slotIdx, current) {
    if (slotIdx === slotOptions.length) {
      results.push([...current]);
      return;
    }
    const options = slotOptions[slotIdx].slice(0, MAX_PER_SLOT);
    for (const opt of options) {
      // Skip if same item already in combo
      if (current.some((c) => c.id === opt.id)) continue;
      current.push(opt);
      buildCombo(slotIdx + 1, current);
      current.pop();
    }
  }

  buildCombo(0, []);
  return results;
}

/* ── Main: Generate outfits ───────────────────────────────── */
/**
 * @param {Array} items - wardrobe items, each with { id, name, color, category, formality?, image_url?, ... }
 * @param {Object} [opts]
 * @param {number} [opts.maxOutfits=6] - max outfits to return
 * @param {string} [opts.occasion] - filter templates by occasion
 * @returns {Array} array of outfit objects sorted by score desc
 */
export function generateOutfits(items, opts = {}) {
  const maxOutfits = opts.maxOutfits || 6;
  const occasionFilter = opts.occasion || null;

  const groups = groupByCategory(items);
  const allOutfits = [];

  for (const template of TEMPLATES) {
    if (occasionFilter && template.occasion !== occasionFilter) continue;

    const combos = combosForTemplate(template, groups);
    for (const combo of combos) {
      const score = scoreOutfit(combo);
      if (score < 55) continue; // too low to suggest

      allOutfits.push({
        template: template.name,
        description: template.description,
        occasion: template.occasion,
        tags: template.tags,
        score,
        items: combo.map((c) => ({
          id: c.id,
          name: c.name,
          color: c.color,
          category: c.category,
          image_url: c.image_url || "",
          slotLabel: c.slotLabel,
        })),
      });
    }
  }

  // Sort by score descending
  allOutfits.sort((a, b) => b.score - a.score);

  // Deduplicate: same set of item IDs (regardless of order)
  const seen = new Set();
  const unique = [];
  for (const outfit of allOutfits) {
    const key = outfit.items.map((i) => i.id).sort().join(",");
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(outfit);
    if (unique.length >= maxOutfits) break;
  }

  return unique;
}

/**
 * Score how well two specific items pair together.
 */
export function pairScore(itemA, itemB) {
  return colorHarmonyScore(itemA.color, itemB.color);
}

/**
 * Get suggested items to pair with a given item.
 */
export function suggestPairs(item, items, limit = 5) {
  return items
    .filter((i) => i.id !== item.id && i.category !== item.category)
    .map((i) => ({ ...i, pairScore: colorHarmonyScore(item.color, i.color) }))
    .sort((a, b) => b.pairScore - a.pairScore)
    .slice(0, limit);
}
