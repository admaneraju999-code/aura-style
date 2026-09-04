import { Readable } from "node:stream";
import sharp from "sharp";
import handler from "../api/scan.js";

function makeRes() {
  const chunks = [];
  return {
    statusCode: 200,
    headers: {},
    writeHead(status, headers) { this.statusCode = status; this.headers = headers || {}; },
    setHeader(k, v) { this.headers[k] = v; },
    write(d) { chunks.push(Buffer.from(d)); },
    end(d) { if (d) chunks.push(Buffer.from(d)); },
    _body() { return Buffer.concat(chunks).toString("utf8"); },
  };
}

function makeMultipart(buffer, name, boundary) {
  return Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\n${name}\r\n`, "utf8"),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="image"; filename="item.png"\r\nContent-Type: image/png\r\n\r\n`, "utf8"),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`, "utf8"),
  ]);
}

async function run() {
  const png = await sharp({
    create: { width: 220, height: 320, channels: 3, background: { r: 38, g: 47, b: 78 } },
  }).png().toBuffer();

  const boundary = "----testboundary123";
  const raw = makeMultipart(png, "Navy Jacket", boundary);

  const req = new Readable();
  req.push(raw);
  req.push(null);
  req.method = "POST";
  req.headers = {
    "content-type": `multipart/form-data; boundary=${boundary}`,
    "content-length": String(raw.length),
  };

  const res = makeRes();
  await handler(req, res);
  const parsed = JSON.parse(res._body());
  console.log("status:", res.statusCode);
  console.log("color:", parsed.data && parsed.data.color);
  console.log("category:", parsed.data && parsed.data.category);
  console.log("has preview:", !!(parsed.data && parsed.data.preview));
  console.log("savedItem:", parsed.data && parsed.data.savedItem);
  if (parsed.data && parsed.data.color !== "Navy") {
    throw new Error("Expected Navy color");
  }
  console.log("SCAN TEST PASSED");
}

run().catch((e) => { console.error("TEST FAILED:", e.message); process.exit(1); });
