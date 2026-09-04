(function () {
  if (typeof window === "undefined") return;

  const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const page = current === "" ? "index.html" : current;

  const nav = [
    { key: "index", href: "index.html", icon: "checkroom", label: "Wardrobe" },
    { key: "outfit", href: "outfit-builder.html", icon: "image_arrow_up", label: "Builder" },
    { key: "discovery", href: "discovery.html", icon: "explore", label: "Discover" },
    { key: "settings", href: "settings.html", icon: "settings", label: "Settings" },
  ];

  const isActive = (key) =>
    (key === "index" && page === "index.html") ||
    (key === "outfit" && page === "outfit-builder.html") ||
    (key === "discovery" && page === "discovery.html") ||
    (key === "settings" && page === "settings.html");

  const isMoreActive = page === "help.html" || page === "about.html";

  const extra = [
    { href: "help.html", icon: "help_outline", label: "Help & Support", desc: "FAQ and getting started" },
    { href: "about.html", icon: "info", label: "About", desc: "About VES Aura Style" },
    { href: "index.html", icon: "logout", label: "Sign Out" },
  ];

  // ---- Mobile bottom navigation bar (Wardrobe, Builder, [Scan], Discover, Settings) ----
  const navTabs = nav
    .map(
      (n) => `
      <a href="${n.href}" class="flex flex-col items-center justify-center gap-0.5 min-w-0 ${isActive(n.key) ? "text-black" : "text-on-surface-variant/70"}">
        <span class="material-symbols-outlined text-[22px] leading-none">${n.icon}</span>
        <span class="text-[10px] font-medium tracking-wide leading-tight truncate max-w-full px-0.5">${n.label}</span>
      </a>`
    )
    .join("");

  const bar = document.createElement("div");
  bar.id = "mobile-bottom-nav";
  bar.innerHTML = `
    <div class="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-outline-variant/30 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div class="relative h-[56px] max-w-lg mx-auto px-4 flex items-stretch">
        <nav class="flex items-stretch justify-between flex-1">
          ${navTabs}
        </nav>
        <button data-mobile-scan aria-label="Scan new item"
          class="absolute left-1/2 -translate-x-1/2 -top-7 w-[60px] h-[60px] rounded-full bg-black text-white flex items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.35)] hover:opacity-90 active:scale-95 transition-all cursor-pointer border-4 border-surface-container-lowest">
          <span class="material-symbols-outlined text-[28px]">add_a_photo</span>
        </button>
      </div>
    </div>`;
  document.body.appendChild(bar);

  // ---- Slide-in drawer (opened by tapping the brand title on mobile) ----
  const overlay = document.createElement("div");
  overlay.id = "mobile-menu-overlay";
  overlay.className = "md:hidden fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm hidden";
  overlay.addEventListener("click", closeDrawer);

  const drawer = document.createElement("div");
  drawer.id = "mobile-drawer";
  drawer.className = "md:hidden fixed top-0 right-0 bottom-0 w-72 max-w-[80vw] z-[80] bg-surface-container-lowest shadow-2xl flex flex-col translate-x-full transition-transform duration-300";
  drawer.innerHTML = `
    <div class="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
      <span class="font-display-lg-mobile text-primary tracking-tighter">Aura Style</span>
      <button id="mobile-drawer-close" class="text-on-surface-variant p-1" aria-label="Close menu">
        <span class="material-symbols-outlined">close</span>
      </button>
    </div>
    <div class="px-2 py-3 flex-1 overflow-y-auto">
      <p class="px-3 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/50">Navigate</p>
      <nav class="space-y-1 mb-3">
        ${nav
          .map(
            (n) => `
            <a href="${n.href}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(n.key) ? "text-primary bg-primary/10" : "text-on-surface-variant opacity-80 hover:bg-surface-container-high"}">
              <span class="material-symbols-outlined text-[20px]">${n.icon}</span>
              <span class="font-label-md text-label-md">${n.label}</span>
            </a>`
          )
          .join("")}
      </nav>
      <p class="px-3 pt-3 pb-2 border-t border-outline-variant/20 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/50">More</p>
      <nav class="space-y-1">
        ${extra
          .map(
            (n) => `
            <a href="${n.href}" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-on-surface-variant opacity-80 hover:bg-surface-container-high">
              <span class="material-symbols-outlined text-[20px]">${n.icon}</span>
              <span class="font-label-md text-label-md">${n.label}</span>
            </a>`
          )
          .join("")}
      </nav>
    </div>`;

  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  drawer.querySelector("#mobile-drawer-close").addEventListener("click", closeDrawer);

  function openDrawer() {
    overlay.classList.remove("hidden");
    drawer.classList.remove("translate-x-full");
  }
  function closeDrawer() {
    overlay.classList.add("hidden");
    drawer.classList.add("translate-x-full");
  }

  const mobileTitle = document.querySelector("header .md\\:hidden h1, header .md\\:hidden h2");
  if (mobileTitle) {
    mobileTitle.classList.add("cursor-pointer");
    mobileTitle.addEventListener("click", openDrawer);
  }

  // ---- Scan FAB handler ----
  bar.querySelector("[data-mobile-scan]").addEventListener("click", (e) => {
    e.preventDefault();
    if (typeof window.openScan === "function") window.openScan();
  });

  // ---- Keep fixed bottom bar clear of page content on mobile ----
  const style = document.createElement("style");
  style.textContent = `
    @media (max-width: 767px) {
      main, footer { padding-bottom: calc(84px + env(safe-area-inset-bottom, 0px)) !important; }
      .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
    }
  `;
  document.head.appendChild(style);
})();
