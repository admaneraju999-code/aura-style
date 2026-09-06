(function () {
  if (typeof window === "undefined") return;

  const current = (window.location.pathname.split("/").pop() || "index.html").toLowerCase();
  const page = current === "" ? "index.html" : current;

  const nav = [
    { key: "index", href: "index.html", icon: "checkroom", tab: "Wardrobe", label: "Wardrobe" },
    { key: "outfit", href: "outfit-builder.html", icon: "image_arrow_up", tab: "Builder", label: "Outfit Builder" },
    { key: "discovery", href: "discovery.html", icon: "explore", tab: "Discover", label: "Discovery" },
    { key: "settings", href: "settings.html", icon: "settings", tab: "Settings", label: "Settings" },
  ];

  const extra = [
    { href: "help.html", icon: "help_outline", label: "Help & Support" },
    { href: "about.html", icon: "info", label: "About" },
    { href: "index.html", icon: "logout", label: "Sign Out" },
  ];

  const isActive = (key) =>
    (key === "index" && page === "index.html") ||
    (key === "outfit" && page === "outfit-builder.html") ||
    (key === "discovery" && page === "discovery.html") ||
    (key === "settings" && page === "settings.html");

  // ---- Mobile bottom navigation bar (Wardrobe, Builder, [Scan], Discover, Settings) ----
  const navTabs = nav
    .map(
      (n) => `
      <a href="${n.href}" class="flex flex-col items-center justify-center gap-0.5 min-w-0 ${isActive(n.key) ? "text-black" : "text-on-surface-variant/70"}">
        <span class="material-symbols-outlined text-[22px] leading-none">${n.icon}</span>
        <span class="text-[10px] font-medium tracking-wide leading-tight truncate max-w-full px-0.5">${n.tab}</span>
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

  // ---- Scan FAB handler (wired immediately so the scan button always works) ----
  try {
    const fab = bar.querySelector("[data-mobile-scan]");
    fab.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (typeof window.openScan === "function") window.openScan();
    });
  } catch (err) { /* ignore */ }

  // ---- Mobile top-bar ⋮ (more) menu with every page button ----
  const header = document.querySelector("header");
  if (header) {
    header.classList.add("relative");

    const dots = document.createElement("button");
    dots.id = "mobile-more-btn";
    dots.type = "button";
    dots.setAttribute("aria-label", "Menu");
    dots.setAttribute("aria-haspopup", "true");
    dots.setAttribute("aria-expanded", "false");
    dots.classList.add(
      "md:hidden", "flex", "items-center", "justify-center",
      "w-9", "h-9", "rounded-full", "text-on-surface-variant",
      "dark:text-on-primary-container", "hover:text-primary",
      "hover:bg-surface-container-high", "active:bg-surface-container",
      "transition-colors", "shrink-0", "cursor-pointer", "ml-2"
    );
    dots.innerHTML = '<span class="material-symbols-outlined text-[22px]">more_vert</span>';

    const menu = document.createElement("div");
    menu.id = "mobile-more-menu";
    menu.className =
      "md:hidden absolute top-full right-3 mt-2 w-64 max-w-[calc(100vw-1.5rem)] bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 py-2 hidden";
    menu.innerHTML =
      nav
        .map(
          (n) => `
        <a href="${n.href}" class="mx-2 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(n.key) ? "text-primary bg-primary/10" : "text-on-surface-variant hover:bg-surface-container-high"}">
          <span class="material-symbols-outlined text-[20px]">${n.icon}</span>
          <span class="font-label-md text-label-md">${n.label}</span>
        </a>`
        )
        .join("") +
      '<div class="my-2 mx-4 border-t border-outline-variant/20"></div>' +
      extra
        .map(
          (e) => `
        <a href="${e.href}" class="mx-2 flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${page === e.href ? "text-primary bg-primary/10" : "text-on-surface-variant hover:bg-surface-container-high"}">
          <span class="material-symbols-outlined text-[20px]">${e.icon}</span>
          <span class="font-label-md text-label-md">${e.label}</span>
        </a>`
        )
        .join("");

    header.appendChild(dots);
    header.appendChild(menu);

    function openMenu() {
      menu.classList.remove("hidden");
      dots.setAttribute("aria-expanded", "true");
    }
    function closeMenu() {
      menu.classList.add("hidden");
      dots.setAttribute("aria-expanded", "false");
    }

    dots.addEventListener("click", (e) => {
      e.stopPropagation();
      if (menu.classList.contains("hidden")) openMenu();
      else closeMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeMenu();
    });
    document.addEventListener("click", (e) => {
      if (!menu.classList.contains("hidden") && !menu.contains(e.target) && !dots.contains(e.target)) {
        closeMenu();
      }
    });
  }

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