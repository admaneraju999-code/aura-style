/* ============================================================
   AURA STYLE — Outfit Suggestions (Outfit Builder page)
   Fetches AI-generated outfit combinations from the wardrobe
   and renders them as browsable cards with save capability.
   ============================================================ */
import { api } from "./api.js";
import { toast } from "./toast.js";

const CATEGORY_ICONS = {
  tops: "checkroom",
  bottoms: "dry_cleaning",
  outerwear: "coat",
  shoes: "footwear",
  accessories: "watch",
};

const OCCASION_FILTERS = [
  { key: null, label: "All" },
  { key: "Casual", label: "Casual" },
  { key: "Business Casual", label: "Business" },
  { key: "Evening", label: "Evening" },
  { key: "All-Day", label: "All Day" },
];

let currentOutfits = [];
let currentIndex = 0;
let activeOccasion = null;

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function scoreColor(score) {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-primary";
  return "text-on-surface-variant";
}

function scoreLabel(score) {
  if (score >= 90) return "Perfect Match";
  if (score >= 80) return "Great Combo";
  if (score >= 70) return "Good Pairing";
  return "Wearable";
}

/* ── Render the full outfit suggestions section ───────────── */
export function renderOutfitSuggestions(container) {
  if (!container) return;

  container.innerHTML = `
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h2 class="font-headline-md text-headline-md text-primary mb-1">AI Outfit Combinations</h2>
        <p class="font-body-md text-body-md text-on-surface-variant" id="outfit-subtitle">
          Analyzing your wardrobe for the best pairings...
        </p>
      </div>
      <div class="flex gap-2" id="occasion-filters">
        ${OCCASION_FILTERS.map((f) => `
          <button data-occasion="${f.key || ""}"
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-all
            ${f.key === activeOccasion ? "bg-primary text-on-primary" : "border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary"}">
            ${esc(f.label)}
          </button>
        `).join("")}
      </div>
    </div>
    <div id="outfit-carousel" class="relative">
      <div id="outfit-loading" class="flex flex-col items-center justify-center py-20">
        <div class="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
        <p class="font-label-md text-on-surface-variant">Generating outfit combinations...</p>
      </div>
      <div id="outfit-cards" class="hidden"></div>
      <div id="outfit-empty" class="hidden text-center py-20">
        <span class="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-4 block">checkroom</span>
        <p class="font-headline-sm text-on-surface-variant mb-2">Not enough items to generate outfits</p>
        <p class="font-body-md text-on-surface-variant/70">Add at least 2 items from different categories to your wardrobe.</p>
      </div>
    </div>
  `;

  // Bind occasion filters
  container.querySelectorAll("[data-occasion]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeOccasion = btn.dataset.occasion || null;
      loadOutfits(container);
      // Update active state
      container.querySelectorAll("[data-occasion]").forEach((b) => {
        b.className = b.dataset.occasion === (activeOccasion || "")
          ? "px-4 py-1.5 rounded-full text-sm font-medium transition-all bg-primary text-on-primary"
          : "px-4 py-1.5 rounded-full text-sm font-medium transition-all border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary";
      });
    });
  });

  loadOutfits(container);
}

async function loadOutfits(container) {
  const loading = container.querySelector("#outfit-loading");
  const cards = container.querySelector("#outfit-cards");
  const empty = container.querySelector("#outfit-empty");
  const subtitle = container.querySelector("#outfit-subtitle");

  loading.classList.remove("hidden");
  cards.classList.add("hidden");
  empty.classList.add("hidden");

  try {
    const url = activeOccasion
      ? `/api/outfit-generate?occasion=${encodeURIComponent(activeOccasion)}`
      : "/api/outfit-generate";
    const res = await fetch(url);
    const body = await res.json();
    const data = body.data || body;

    currentOutfits = data.outfits || [];
    currentIndex = 0;

    if (subtitle) {
      subtitle.textContent = data.itemCount
        ? `${data.generatedCount} combinations found from ${data.itemCount} wardrobe items`
        : "Add clothes to your wardrobe to see AI-generated outfits";
    }

    if (currentOutfits.length === 0) {
      loading.classList.add("hidden");
      empty.classList.remove("hidden");
      return;
    }

    loading.classList.add("hidden");
    cards.classList.remove("hidden");
    renderCards(cards);
  } catch (err) {
    loading.classList.add("hidden");
    empty.classList.remove("hidden");
    if (subtitle) subtitle.textContent = "Could not load outfits — try refreshing";
    console.warn("Outfit generation failed:", err.message);
  }
}

function renderCards(container) {
  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="outfit-grid">
      ${currentOutfits.map((outfit, idx) => outfitCard(outfit, idx)).join("")}
    </div>
  `;

  // Bind save buttons
  container.querySelectorAll("[data-save-outfit]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.dataset.saveOutfit, 10);
      saveOutfit(currentOutfits[idx]);
    });
  });
}

function outfitCard(outfit, idx) {
  const itemImages = outfit.items
    .filter((i) => i.image_url && !i.image_url.startsWith("data:"))
    .slice(0, 4);
  const dataImages = outfit.items
    .filter((i) => i.image_url && i.image_url.startsWith("data:"))
    .slice(0, 4);
  const images = [...itemImages, ...dataImages];

  const primaryImage = images[0] || "";

  return `
    <div class="bg-surface-container-lowest rounded-xl border border-outline-variant/20 overflow-hidden
      shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300"
      data-outfit-idx="${idx}">

      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-outline-variant/15">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-lg">auto_awesome</span>
          </div>
          <div>
            <h3 class="font-label-md text-label-md text-primary">${esc(outfit.template)}</h3>
            <p class="font-label-sm text-label-sm text-on-surface-variant">${esc(outfit.occasion)} • ${outfit.items.length} pieces</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-label-md text-label-md ${scoreColor(outfit.score)}">${outfit.score}%</span>
          <span class="material-symbols-outlined text-on-surface-variant text-lg">star</span>
        </div>
      </div>

      <!-- Item Strip -->
      <div class="flex gap-0.5 h-40 bg-surface-container-high">
        ${outfit.items.map((item) => `
          <div class="flex-1 relative overflow-hidden group">
            ${item.image_url
              ? `<img src="${esc(item.image_url)}" alt="${esc(item.name)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">`
              : `<div class="w-full h-full flex items-center justify-center bg-surface-container">
                   <span class="material-symbols-outlined text-on-surface-variant/40">${CATEGORY_ICONS[item.category] || "checkroom"}</span>
                 </div>`
            }
            <div class="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent p-2">
              <span class="font-label-sm text-white text-[10px] uppercase tracking-wider">${esc(item.slotLabel || item.category)}</span>
            </div>
          </div>
        `).join("")}
      </div>

      <!-- Description + Items List -->
      <div class="px-5 py-4">
        <p class="font-body-md text-body-md text-on-surface-variant mb-3">${esc(outfit.description)}</p>
        <div class="flex flex-wrap gap-2 mb-4">
          ${outfit.items.map((item) => `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-high text-xs font-medium text-on-surface-variant">
              <span class="material-symbols-outlined text-[14px]">${CATEGORY_ICONS[item.category] || "checkroom"}</span>
              ${esc(item.name)}
              <span class="text-on-surface-variant/50">•</span>
              ${esc(item.color)}
            </span>
          `).join("")}
        </div>

        <!-- Tags -->
        <div class="flex gap-2 mb-4">
          ${outfit.tags.map((t) => `
            <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant">${esc(t)}</span>
          `).join("")}
          <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary">${scoreLabel(outfit.score)}</span>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button data-save-outfit="${idx}" class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-on-primary hover:opacity-90 transition-opacity font-label-md text-label-md">
            <span class="material-symbols-outlined text-[18px]">save</span>
            Save Outfit
          </button>
          <button class="px-4 py-2.5 rounded-lg border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-colors font-label-md text-label-md"
            onclick="navigator.clipboard.writeText('Aura Style Outfit: ${esc(outfit.template)} — ${outfit.items.map(i => i.name).join(', ')}').then(() => toast('Copied to clipboard'))">
            <span class="material-symbols-outlined text-[18px]">share</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

async function saveOutfit(outfit) {
  try {
    await api.createOutfit({
      name: outfit.template,
      description: outfit.description,
      score: outfit.score,
      itemIds: outfit.items.map((i) => i.id),
      tag: outfit.occasion,
    });
    toast(`"${outfit.template}" saved to your collection`);
  } catch (err) {
    toast(err.message, "error");
  }
}

export default renderOutfitSuggestions;
