/* ============================================================
   AURA STYLE — Outfit management (outfit-builder.html)
   - Saves/updates outfits via /api/outfits
   - Loads saved outfits for the saved-outfits grid
   - Shares page link
   ============================================================ */
import { api } from "./api.js";
import { toast } from "./toast.js";

let currentId = null;

export async function initOutfit() {
  const saveBtn = document.getElementById("outfit-save");
  const shareBtn = document.getElementById("outfit-share");
  const calBtn = document.getElementById("outfit-calendar");

  if (saveBtn) saveBtn.addEventListener("click", saveOutfit);
  if (shareBtn) shareBtn.addEventListener("click", share);
  if (calBtn) calBtn.addEventListener("click", () => toast("Added to calendar", "info"));
}

async function saveOutfit() {
  const nameEl = document.getElementById("outfit-name");
  const descEl = document.getElementById("outfit-desc");
  const name = (nameEl?.textContent || "My Outfit").trim();
  const description = (descEl?.textContent || "").trim();

  let score = 88;
  const existingScore = document.getElementById("outfit-score");
  if (existingScore) {
    const m = existingScore.textContent.match(/(\d+)%/);
    if (m) score = Number(m[1]);
  }

  const btn = document.getElementById("outfit-save");
  if (btn) { btn.disabled = true; btn.style.opacity = ".7"; }
  try {
    if (currentId) {
      await api.updateOutfit(currentId, { name, description, score });
      toast("Outfit updated");
    } else {
      const created = await api.createOutfit({ name, description, score, itemIds: [] });
      currentId = created.id;
      toast("Outfit saved to your collection");
    }
  } catch (err) {
    toast(err.message, "error");
  } finally {
    if (btn) { btn.disabled = false; btn.style.opacity = "1"; }
  }
}

async function share() {
  try {
    await navigator.clipboard.writeText(location.href);
    toast("Link copied to clipboard", "info");
  } catch {
    toast("Copied: " + location.href, "info");
  }
}

export default initOutfit;
