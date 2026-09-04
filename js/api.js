/* ============================================================
   AURA STYLE — Front-end API client
   Thin wrapper over fetch() for the Vercel serverless API.
   ============================================================ */
const BASE = ""; // same origin (Vercel serves pages + /api together)

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error((body && body.error) || `Request failed (${res.status})`);
  }
  return body.data !== undefined ? body.data : body;
}

export const api = {
  // Wardrobe
  listItems: () => request("/api/wardrobe"),
  createItem: (payload) => request("/api/wardrobe", { method: "POST", body: JSON.stringify(payload) }),
  getItem: (id) => request(`/api/wardrobe/${id}`),
  updateItem: (id, payload) => request(`/api/wardrobe/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteItem: (id) => request(`/api/wardrobe/${id}`, { method: "DELETE" }),

  // Outfits
  listOutfits: () => request("/api/outfits"),
  createOutfit: (payload) => request("/api/outfits", { method: "POST", body: JSON.stringify(payload) }),
  updateOutfit: (id, payload) => request(`/api/outfits/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteOutfit: (id) => request(`/api/outfits/${id}`, { method: "DELETE" }),

  // Discovery
  listInspirations: () => request("/api/discovery"),
  toggleFavorite: (id, favorite) =>
    request(`/api/discovery/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ favorite }),
    }),

  // Settings
  getSettings: () => request("/api/settings"),
  updateSettings: (payload) => request("/api/settings", { method: "PUT", body: JSON.stringify(payload) }),

  // Scan
  scan: async (file, { name, save } = {}) => {
    const fd = new FormData();
    fd.append("image", file);
    if (name) fd.append("name", name);
    if (save) fd.append("save", "true");
    const res = await fetch(`${BASE}/api/scan`, { method: "POST", body: fd });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Scan failed");
    return body.data;
  },
};

export default api;
