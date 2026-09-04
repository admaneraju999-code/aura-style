/* ============================================================
   AURA STYLE — Local dev server
   Routes /api/* to the real Vercel-style handlers so you can
   develop and test locally WITHOUT the Vercel CLI:
     1. Create a Vercel Postgres DB (or any Postgres/Neon) and set
        its connection string as POSTGRES_URL (see .env.local).
     2. npm install
     3. node scripts/dev-server.mjs   (default port 8787)
   Then open http://localhost:8787/index.html
   ============================================================ */
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal } from "./load-env.mjs";

await loadEnvLocal();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.env.PORT || 8787);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

const routes = {
  "/api": () => import("../api/index.js"),
  "/api/wardrobe": () => import("../api/wardrobe.js"),
  "/api/outfits": () => import("../api/outfits.js"),
  "/api/outfit-generate": () => import("../api/outfit-generate.js"),
  "/api/discovery": () => import("../api/discovery.js"),
  "/api/settings": () => import("../api/settings.js"),
  "/api/scan": () => import("../api/scan.js"),
};

const dynamic = [
  { re: /^\/api\/wardrobe\/(\d+)$/, load: () => import("../api/wardrobe/[id].js") },
  { re: /^\/api\/outfits\/(\d+)$/, load: () => import("../api/outfits/[id].js") },
  { re: /^\/api\/discovery\/(\d+)$/, load: () => import("../api/discovery/[id].js") },
];

function setQuery(req, id) {
  req.query = req.query || {};
  req.query.id = String(id);
}

async function serveApi(req, res) {
  const url = new URL(req.url, "http://localhost");
  req.url = url.pathname;

  // Exact routes
  if (routes[url.pathname]) {
    const mod = await routes[url.pathname]();
    return mod.default(req, res);
  }

  // Dynamic /:id routes
  for (const d of dynamic) {
    const m = url.pathname.match(d.re);
    if (m) {
      setQuery(req, m[1]);
      const mod = await d.load();
      return mod.default(req, res);
    }
  }

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "Not found" }));
}

async function serveStatic(req, res) {
  let pathname = new URL(req.url, "http://localhost").pathname.replace(/^\/+/, "");
  if (pathname === "") pathname = "index.html";

  const target = path.resolve(ROOT, pathname);
  // Prevent directory traversal
  if (!target.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      return res.writeHead(301, { Location: "/" }) && res.end();
    }
    const data = await readFile(target);
    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api")) {
    serveApi(req, res).catch((e) => {
      res.writeHead(500, { "content-type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    });
    return;
  }
  serveStatic(req, res).catch(() => {
    res.writeHead(500);
    res.end("Server error");
  });
});

server.listen(PORT, () => {
  console.log(`Aura Style dev server: http://localhost:${PORT}`);
  console.log(`API available at           http://localhost:${PORT}/api`);
});
