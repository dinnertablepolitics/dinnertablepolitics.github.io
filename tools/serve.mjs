// Tiny local static server for previewing the site: node tools/serve.mjs [port]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const port = Number(process.argv[2] || 8765);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".xml": "application/xml", ".txt": "text/plain" };
createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p.endsWith("/")) p += "index.html";
  const file = normalize(join(root, p));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  try { const body = await readFile(file); res.writeHead(200, { "Content-Type": types[extname(file)] || "application/octet-stream" }); res.end(body); }
  catch { const nf = await readFile(join(root, "404.html")).catch(() => "Not found"); res.writeHead(404, { "Content-Type": types[".html"] }); res.end(nf); }
}).listen(port, "127.0.0.1", () => console.log(`http://127.0.0.1:${port}/`));
