/* Validates robot paths of DB routes that short-circuit BEFORE hitting Postgres:
   - wardrobe POST with no name -> 400
   - wardrobe/[id] GET with bad id -> 400
   - outfits POST with no name -> 400
   - settings PUT with no valid keys -> 400
   These prove handler/req/res wiring without a live DB. */
import { Readable } from "node:stream";
import wardrobe from "../api/wardrobe.js";
import wardrobeId from "../api/wardrobe/[id].js";
import outfits from "../api/outfits.js";
import settings from "../api/settings.js";

function makeReq({ method, body } = {}) {
  const req = new Readable();
  if (body !== undefined) req.push(Buffer.from(JSON.stringify(body)));
  req.push(null);
  req.method = method;
  req.headers = { "content-type": "application/json" };
  return req;
}

function makeRes() {
  const chunks = [];
  return {
    statusCode: 200, headers: {},
    writeHead(s, h){ this.statusCode=s; this.headers=h||{}; },
    write(d){ chunks.push(Buffer.from(d)); },
    end(d){ if(d) chunks.push(Buffer.from(d)); },
    _body(){ return Buffer.concat(chunks).toString(); },
  };
}

async function expect(fn, wantStatus, label) {
  const res = makeRes();
  await fn(res);
  const body = res._body();
  const parsed = body ? JSON.parse(body) : {};
  const pass = res.statusCode === wantStatus;
  console.log(`${pass ? "PASS" : "FAIL"}  ${label} -> ${res.statusCode} (want ${wantStatus}) ${parsed.error ? `err=${parsed.error}` : ""}`);
  if (!pass) process.exitCode = 1;
}

await expect((res) => wardrobe(makeReq({ method: "POST", body: {} }), res), 400, "wardrobe POST no name");
await expect((res) => wardrobeId({ method: "GET", query: { id: "abc" } }, res), 400, "wardrobe/[id] bad id");
await expect((res) => wardrobeId({ method: "GET", query: { id: "-5" } }, res), 400, "wardrobe/[id] negative id");
await expect((res) => outfits(makeReq({ method: "POST", body: { itemIds: [] } }), res), 400, "outfits POST no name");
await expect((res) => settings(makeReq({ method: "PUT", body: { bogus: 1 } }), res), 400, "settings PUT no valid keys");
console.log("VALIDATION TESTS DONE");
