/* ============================================================
   AURA STYLE — Animation boost
   Adds scroll-reveal + a few micro-interactions that need JS.
   Degrades gracefully (no-op if anything fails).
   ============================================================ */
(function () {
  "use strict";

  /* Scroll reveal: mark any element with class .js-reveal OR
     any major block (section, div.grid child, article) with a
     subtle reveal on scroll. Safe on every page. */
  function observeReveal() {
    if (!("IntersectionObserver" in window)) return;

    const els = document.querySelectorAll(
      ".js-reveal, section, article, .grid > div, main .columns > div, main .columns-1 > div"
    );
    // Limit to a reasonable batch to avoid excess
    const targets = Array.from(els).slice(0, 60);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -8% 0px" }
    );

    targets.forEach((t) => {
      if (!t.classList.contains("is-visible")) {
        t.classList.add("js-reveal");
        io.observe(t);
      }
    });
  }

  /* Ripple effect on buttons (nice tactile feel) */
  function bindRipple() {
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("button, a.btn");
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const r = document.createElement("span");
      const d = Math.max(rect.width, rect.height);
      r.className = "ripple-ink";
      r.style.width = r.style.height = d + "px";
      r.style.left = e.clientX - rect.left - d / 2 + "px";
      r.style.top = e.clientY - rect.top - d / 2 + "px";
      btn.appendChild(r);
      setTimeout(() => r.remove(), 650);
    });
  }

  /* Animate numbers counting up when scrolled into view (scores, etc.) */
  function bindCounters() {
    document.querySelectorAll("[data-count]").forEach((el) => {
      const target = parseFloat(el.dataset.count) || 0;
      const suffix = el.dataset.suffix || "";
      const io = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          io.unobserve(el);
          const start = performance.now();
          const dur = 900;
          function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        },
        { threshold: 0.5 }
      );
      io.observe(el);
    });
  }

  /* Floating particle background (subtle ambient dots) */
  function addAmbient() {
    if (document.querySelector(".aura-ambient")) return;
    const wrap = document.createElement("div");
    wrap.className = "aura-ambient";
    wrap.setAttribute("aria-hidden", "true");
    for (let i = 0; i < 18; i++) {
      const d = document.createElement("span");
      d.className = "aura-dot";
      d.style.left = Math.random() * 100 + "%";
      d.style.top = Math.random() * 100 + "%";
      d.style.animationDelay = Math.random() * 8 + "s";
      d.style.animationDuration = 8 + Math.random() * 10 + "s";
      wrap.appendChild(d);
    }
    document.body.appendChild(wrap);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    observeReveal();
    bindRipple();
    bindCounters();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches === false) {
      addAmbient();
    }
  }
})();
