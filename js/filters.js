/* ============================================================
   AURA STYLE — Filtering
   Makes category / style filter chips actually filter content.
   Works generically:
   - Button must have:  data-filter="value"  (use "all" for show-everything)
   - Items must have:   data-category="value"  (matches the button value)
   Graceful no-op when nothing to filter.
   ============================================================ */
(function () {
  "use strict";

  function init() {
    const bars = document.querySelectorAll("[data-filterbar]");

    if (bars.length === 0) {
      // Legacy: autodetect chips that carry data-filter
      document.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-filter]");
        if (!btn) return;
        const value = btn.dataset.filter;
        const scope = btn.closest("[data-filter-scope]") || document;
        applyFilter(scope, value, (cur) => {
          const group = btn.parentElement;
          group.querySelectorAll("[data-filter]").forEach((b) => {
            const on = b === btn;
            b.classList.toggle("active", on);
            if (on) {
              // Tailwind active styles applied via JS fallback below
              b.setAttribute("data-active", "true");
            } else {
              b.removeAttribute("data-active");
            }
          });
        });
      });
      return;
    }

    bars.forEach((bar) => {
      bar.addEventListener("click", (e) => {
        const btn = e.target.closest("[data-filter]");
        if (!btn) return;
        bar.querySelectorAll("[data-filter]").forEach((b) => {
          const on = b === btn;
          if (on) b.setAttribute("data-active", "true");
          else b.removeAttribute("data-active");
        });
        const scope = btn.closest("[data-filter-scope]") || document;
        applyFilter(scope, btn.dataset.filter);
      });
    });
  }

  function resolveScope(scope) {
    // The filter bar's wrapper usually contains the items. But when the grid
    // lives elsewhere in the same view, fall back to the whole document so the
    // filter still works. Each page has a single filterable set.
    if (scope && scope.querySelectorAll("[data-category]").length === 0) {
      return document;
    }
    return scope || document;
  }

  function applyFilter(scope, value) {
    scope = resolveScope(scope);
    const items = scope.querySelectorAll("[data-category]");
    if (items.length === 0) return;
    items.forEach((item) => {
      const show = value === "all" || item.dataset.category === value;
      item.style.display = show ? "" : "none";
      if (show) {
        item.classList.add("anim-zoom");
        // replay entrance
        item.style.animation = "none";
        void item.offsetWidth;
        item.style.animation = "";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Public hook: re-apply the currently active filter (used after dynamic
  // content replaces the grid, e.g. Discovery cards loaded from the API).
  if (typeof window !== "undefined") {
    window.__filters = function (value) {
      const active = document.querySelector("[data-filterbar] [data-active]");
      const val = value || (active && active.dataset.filter) || "all";
      const scope = active ? active.closest("[data-filter-scope]") : document;
      applyFilter(scope, val);
    };
  }
})();
