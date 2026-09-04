/* ============================================================
   AURA STYLE — Tiny toast notifications
   Adds a lightweight, on-brand toast layer shared by all pages.
   ============================================================ */
let toastRoot = null;

function ensureRoot() {
  if (toastRoot) return toastRoot;
  toastRoot = document.createElement("div");
  toastRoot.setAttribute(
    "style",
    "position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:360px;"
  );
  document.body.appendChild(toastRoot);
  return toastRoot;
}

export function toast(message, type = "success") {
  const root = ensureRoot();
  const el = document.createElement("div");
  const bg =
    type === "error" ? "#b3261e" : type === "info" ? "#3b3b3b" : "#176b4d";
  el.textContent = message;
  el.setAttribute(
    "style",
    `background:${bg};color:#fff;padding:12px 18px;border-radius:12px;font-family:inter,system-ui,sans-serif;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,0.16);opacity:0;transform:translateY(8px);transition:all .25s ease;`
  );
  root.appendChild(el);
  requestAnimationFrame(() => {
    el.style.opacity = "1";
    el.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    setTimeout(() => el.remove(), 250);
  }, 2600);
}

export default toast;
