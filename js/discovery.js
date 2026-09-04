/* ============================================================
   AURA STYLE — Discovery page (discovery.html)
   Loads inspirations from /api/discovery and renders the masonry
   grid. Wires favorite toggles. Keeps the static cards as a
   graceful fallback if the API is unreachable.
   ============================================================ */
import { api } from "./api.js";
import { toast } from "./toast.js";

const TAG_LABELS = { casual: "Casual", streetwear: "Streetwear", office: "Office", evening: "Evening Wear", formal: "Formal" };

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function cardHTML(item) {
  const tag = item.tag || "";
  const label = TAG_LABELS[tag] || "Inspiration";
  const favIcon = item.favorite
    ? '<span class="material-symbols-outlined text-[20px] text-primary" style="font-variation-settings:\'FILL\' 1;">favorite</span>'
    : '<span class="material-symbols-outlined text-[20px] text-primary">favorite</span>';
  const img = item.image_url
    ? `<img class="w-full h-auto object-cover transform group-hover:scale-[1.02] transition-transform duration-700 ease-out" src="${esc(item.image_url)}" alt="${esc(item.title)}" loading="lazy">`
    : `<div class="w-full h-64 flex items-center justify-center bg-gradient-to-br from-surface-container-high to-surface-container"><span class="material-symbols-outlined text-5xl text-on-surface-variant">checkroom</span></div>`;

  return `
  <div class="break-inside-avoid relative group rounded-[20px] overflow-hidden bg-surface-container-lowest cursor-pointer shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300" data-category="${esc(tag)}" data-id="${item.id}">
    ${img}
    <div class="absolute top-4 left-4 bg-white/85 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/50">
      <span class="material-symbols-outlined text-[16px] text-tertiary-container" style="font-variation-settings: 'FILL' 1;">checkroom</span>
      <span class="font-label-sm text-label-sm text-tertiary-container font-semibold tracking-wide">${esc(label)}</span>
    </div>
    <div class="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
      <h3 class="font-label-md text-label-md text-white font-semibold">${esc(item.title)}</h3>
    </div>
    <div class="absolute top-3 right-3">
      <button class="scan-fav w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-surface-container-low transition-transform active:scale-90" data-id="${item.id}" data-fav="${item.favorite ? "1" : "0"}" title="${item.favorite ? "Remove favorite" : "Favorite"}">
        ${favIcon}
      </button>
    </div>
  </div>`;
}

export async function loadDiscovery() {
  const grid = document.getElementById("discovery-grid");
  if (!grid) return;

  try {
    const items = await api.listInspirations();
    grid.innerHTML = items.map(cardHTML).join("");

    grid.querySelectorAll(".scan-fav").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        toggleFav(btn);
      });
    });

    // Re-apply the currently active style filter to the dynamic cards.
    const active = document.querySelector('[data-filterbar] [data-active]');
    if (active && window.__filters) {
      window.__filters(active.dataset.filter);
    }
  } catch (err) {
    console.warn("Discovery API unavailable, showing placeholders:", err.message);
  }
}

async function toggleFav(btn) {
  const id = Number(btn.dataset.id);
  const next = btn.dataset.fav === "1" ? false : true;
  btn.disabled = true;
  try {
    const updated = await api.toggleFavorite(id, next);
    btn.dataset.fav = updated.favorite ? "1" : "0";
    btn.innerHTML = updated.favorite
      ? '<span class="material-symbols-outlined text-[20px] text-primary" style="font-variation-settings:\'FILL\' 1;">favorite</span>'
      : '<span class="material-symbols-outlined text-[20px] text-primary">favorite</span>';
    toast(updated.favorite ? "Saved to favorites" : "Removed from favorites", "info");
  } catch (err) {
    toast(err.message, "error");
  } finally {
    btn.disabled = false;
  }
}

export function initDiscovery() {
  loadDiscovery();
}
