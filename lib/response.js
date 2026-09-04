/* ============================================================
   AURA STYLE — HTTP response helpers (Vercel Node style)
   Helpers take `res` (the Node ServerResponse) and send JSON.
   ============================================================ */

function send(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
  });
  res.end(JSON.stringify(payload));
}

export const ok = (res, data) => send(res, 200, { ok: true, data });
export const created = (res, data) => send(res, 201, { ok: true, data });
export const badRequest = (res, message) => send(res, 400, { ok: false, error: message });
export const notFound = (res, message) => send(res, 404, { ok: false, error: message || "Not found" });
export const serverError = (res, message) => send(res, 500, { ok: false, error: message || "Server error" });

export function sendOptions(res) {
  res.writeHead(204, {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "Content-Type, Authorization",
  });
  res.end();
}
