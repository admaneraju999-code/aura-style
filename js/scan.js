/* ============================================================
   AURA STYLE — Scan New Item modal
   Provides a global openScan() usable from any page:
     1. User picks / drops a photo.
     2. POST -> /api/scan  (CV detects color + category)
     3. User reviews + edits name / category / color.
     4. Save -> /api/wardrobe  (source 'scan').
   Exposes window.openScan() so every "Scan New Item" control can
   open the modal on any page.
   ============================================================ */
import { api } from "./api.js";
import { toast } from "./toast.js";

let injected = false;

const CATEGORY_LABELS = {
  tops: "Tops",
  bottoms: "Bottoms",
  outerwear: "Outerwear",
  accessories: "Accessories",
  shoes: "Shoes",
};

function modalHTML() {
  return `
  <div id="scan-modal" class="fixed inset-0 z-[9998] hidden items-center justify-center p-4">
    <div id="scan-backdrop" class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
    <div class="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden anim-zoom">
      <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
        <h3 class="font-headline-sm text-headline-sm text-primary">Scan New Item</h3>
        <button id="scan-close" class="text-on-surface-variant hover:text-primary transition-colors">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <div id="scan-body" class="p-6"></div>
    </div>
  </div>`;
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inject() {
  if (injected) return;
  injected = true;
  const div = document.createElement("div");
  div.innerHTML = modalHTML();
  document.body.appendChild(div.firstElementChild);

  document.getElementById("scan-close").addEventListener("click", close);
  document.getElementById("scan-backdrop").addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
  });
}

function bodyEl() {
  return document.getElementById("scan-body");
}

function open() {
  inject();
  const modal = document.getElementById("scan-modal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  showPicker();
}

function close() {
  const modal = document.getElementById("scan-modal");
  if (!modal) return;
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function showPicker() {
  bodyEl().innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
      <label class="w-full flex flex-col items-center justify-center gap-2.5 border-2 border-dashed border-outline-variant rounded-xl py-10 cursor-pointer hover:border-primary transition-colors text-center">
        <span class="material-symbols-outlined text-5xl text-on-surface-variant">upload_file</span>
        <span class="font-label-md text-label-md text-primary">Upload photo</span>
        <span class="font-label-sm text-label-sm text-on-surface-variant">JPG, PNG or WebP — up to 8 MB</span>
        <input id="scan-file" type="file" accept="image/*" class="hidden" />
      </label>
      <button id="scan-camera" class="w-full flex-col flex items-center justify-center gap-2.5 border-2 border-dashed border-primary rounded-xl py-10 cursor-pointer hover:bg-primary/5 transition-colors text-center">
        <span class="material-symbols-outlined text-5xl text-primary">photo_camera</span>
        <span class="font-label-md text-label-md text-primary">Use camera</span>
        <span class="font-label-sm text-label-sm text-on-surface-variant">Take a photo now</span>
        <input id="scan-camera-file" type="file" accept="image/*" capture="environment" class="hidden" />
      </button>
    </div>
    <p id="scan-drag" class="text-center font-label-sm text-label-sm text-on-surface-variant mt-1">...or drag &amp; drop an image here</p>`;

  document.getElementById("scan-file").addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  });

  const camera = document.getElementById("scan-camera");
  const cameraFile = document.getElementById("scan-camera-file");
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (!isTouch) {
    camera.remove();
    const fileLabel = document.getElementById("scan-file").parentElement;
    if (fileLabel) fileLabel.classList.add("sm:col-span-2");
  } else {
    camera.addEventListener("click", (e) => {
      e.preventDefault();
      cameraFile.click();
    });
    cameraFile.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
    });
  }

  const drag = document.getElementById("scan-drag").parentElement;
  ["dragover", "drop"].forEach((t) => {
    drag.addEventListener(t, (e) => e.preventDefault());
  });
  drag.addEventListener("drop", (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  });
}

async function processFile(file) {
  bodyEl().innerHTML = `
    <div class="flex flex-col items-center justify-center gap-3 py-12">
      <div class="w-10 h-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      <p class="font-label-md text-label-md text-on-surface-variant">Analyzing with Aura Vision...</p>
    </div>`;

  try {
    const result = await api.scan(file, { name: "Scanned Item" });
    showResult(result);
  } catch (err) {
    bodyEl().innerHTML = `
      <div class="text-center py-8">
        <p class="font-body-md text-body-md text-on-surface-variant mb-4">Could not analyze that image. <br>${esc(err.message)}</p>
        <button id="scan-retry" class="px-5 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md">Try Again</button>
      </div>`;
    document.getElementById("scan-retry").addEventListener("click", showPicker);
  }
}

function showResult(result) {
  bodyEl().innerHTML = `
    <div class="flex gap-4 mb-5">
      <div class="w-24 h-24 rounded-xl overflow-hidden bg-surface-container-high shrink-0 border border-outline-variant/30">
        <img id="scan-preview" src="${result.preview}" class="w-full h-full object-cover" alt="preview" />
      </div>
      <div class="flex-1">
        <label class="block font-label-md text-label-md text-on-surface-variant mb-1">Item name</label>
        <input id="scan-name" class="w-full border-b border-outline-variant focus:border-primary focus:outline-none bg-transparent font-body-md text-body-md" value="Scanned Item" />
      </div>
    </div>
    <div class="grid grid-cols-2 gap-4 mb-3">
      <div>
        <label class="block font-label-md text-label-md text-on-surface-variant mb-1">Category</label>
        <select id="scan-category" class="w-full border border-outline-variant rounded-lg px-3 py-2 bg-surface-container-lowest font-body-md text-body-md">
          ${Object.entries(CATEGORY_LABELS).map(([k, v]) =>
            `<option value="${k}" ${k === result.category ? "selected" : ""}>${v}</option>`
          ).join("")}
        </select>
      </div>
      <div>
        <label class="block font-label-md text-label-md text-on-surface-variant mb-1">Color</label>
        <input id="scan-color" class="w-full border border-outline-variant rounded-lg px-3 py-2 font-body-md text-body-md" value="${esc(result.color)}" />
      </div>
    </div>
    <div class="flex flex-wrap gap-2 mb-4">
      ${result.subCategory ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-xs font-medium text-on-surface-variant">
        <span class="material-symbols-outlined text-[12px]">label</span>${esc(result.subCategory.replace('_', ' '))}</span>` : ""}
      ${result.formality ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-high text-xs font-medium text-on-surface-variant">
        <span class="material-symbols-outlined text-[12px]">signal_cellular_alt</span>${esc(result.formality)}</span>` : ""}
      ${(result.styleTags || []).map(t => `<span class="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">${esc(t)}</span>`).join("")}
    </div>
    <p class="font-label-sm text-label-sm text-on-surface-variant mb-5">Detected <b>${esc(result.color)}</b> · ${esc(result.category)} · confidence ${Math.round((result.confidence || 0) * 100)}%</p>
    <div class="flex justify-end gap-3">
      <button id="scan-rescan" class="px-5 py-2.5 rounded-full border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary font-label-md text-label-md">Rescan</button>
      <button id="scan-save" class="px-6 py-2.5 rounded-full bg-primary text-on-primary hover:opacity-90 font-label-md text-label-md">Save to Wardrobe</button>
    </div>`;

  document.getElementById("scan-preview").addEventListener("load", () => {});
  document.getElementById("scan-rescan").addEventListener("click", showPicker);
  document.getElementById("scan-save").addEventListener("click", () => save(result));
}

async function save(result) {
  const name = document.getElementById("scan-name").value.trim() || "Scanned Item";
  const category = document.getElementById("scan-category").value;
  const color = document.getElementById("scan-color").value.trim() || result.color;
  const payload = {
    name,
    category,
    color,
    image_url: result.preview,
    source: "scan",
  };

  document.getElementById("scan-save").disabled = true;
  document.getElementById("scan-save").textContent = "Saving...";

  try {
    await api.createItem(payload);
    toast("Item added to your wardrobe");
    if (window.refreshWardrobe) window.refreshWardrobe();
    setTimeout(close, 650);
  } catch (err) {
    toast(err.message, "error");
    document.getElementById("scan-save").disabled = false;
    document.getElementById("scan-save").textContent = "Save to Wardrobe";
  }
}

export function openScan() {
  open();
}

// Expose globally so the non-module page scripts and any "Scan New Item"
// button can trigger the modal from any page.
if (typeof window !== "undefined") window.openScan = openScan;

export default openScan;
