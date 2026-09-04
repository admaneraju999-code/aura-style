/* ============================================================
   AURA STYLE — Wardrobe page (index.html)
   Loads items from /api/wardrobe and renders the grid, keeping
   the static placeholder items only when the API is unavailable.
   Also syncs the category filter chips with the loaded data.
   ============================================================ */
import { api } from "./api.js";

const CATEGORY_LABELS = {
  tops: "Tops",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  accessories: "Accessories",
  shoes: "Shoes",
};

export function itemCard(item) {
  const category = item.category || "tops";
  const brand = item.brand || "";
  const color = item.color || "";
  const label = color ? `${brand} • ${color}` : brand;
  return `
  <div class="group cursor-pointer" data-category="${category}">
    <div class="bg-white rounded-lg border border-outline-variant/30 overflow-hidden aspect-[3/4] relative mb-3 shadow-[0_4px_20px_rgba(0,0,0,0.03)] group-hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
      ${item.image_url
        ? `<img class="w-full h-full object-cover" src="${esc(item.image_url)}" alt="${esc(item.name)}" loading="lazy">`
        : `<div class="w-full h-full flex items-center justify-center bg-surface-container-high text-on-surface-variant">
             <span class="material-symbols-outlined" style="font-size:40px;">checkroom</span>
           </div>`}
      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300"></div>
    </div>
    <div>
      <h3 class="font-label-md text-label-md text-primary truncate">${esc(item.name)}</h3>
      <p class="font-label-sm text-label-sm text-on-surface-variant mt-1">${esc(label || CATEGORY_LABELS[category] || "Item")}</p>
    </div>
  </div>`;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function loadWardrobe() {
  const grid = document.getElementById("wardrobe-grid");
  if (!grid) return;

  try {
    const items = await api.listItems();
    if (items.length > 0) {
      grid.innerHTML = items.map(itemCard).join("");
      syncFilters(items);
    }
  } catch (err) {
    // Keep static fallback items; optionally surface a subtle notice.
    console.warn("Wardrobe API unavailable, showing placeholders:", err.message);
  }
}

function syncFilters(items) {
  const categories = new Set(items.map((i) => i.category).filter(Boolean));
  const bar = document.querySelector("[data-filterbar]");
  if (!bar) return;
  const btn = bar.querySelector('[data-filter="all"]');
  if (btn) btn.setAttribute("data-active", "true");
  // Every loaded item card already carries data-category, so the existing
  // filter chips work against them. No chip rebuild needed for dynamic sets.
  const scope = document.querySelector("[data-filter-scope]");
  if (window.__filtersApplied && typeof window.__triggerFilter === "function") {
    window.__triggerFilter("all");
  }
}

export function initWardrobe() {
  loadWardrobe();
}

// Global refresh so the Scan modal (and filters) can reload after adding.
if (typeof window !== "undefined") {
  window.refreshWardrobe = () => loadWardrobe();
  window.reloadWardrobe = () => loadWardrobe();
}
