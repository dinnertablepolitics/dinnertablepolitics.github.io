// Checks every local link, image, script and stylesheet in the site's HTML and CSS files,
// including #anchors. External links are listed but not fetched.
// Usage: node tools/check-links.mjs
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
const pages = ["index.html", "privacy.html", "terms.html", "404.html"];
let bad = 0; const external = new Set();
const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
for (const p of pages) {
  const html = readFileSync(p, "utf8");
  const base = p === "404.html" ? "" : dirname(p);
  const own = ids(html);
  for (const m of html.matchAll(/\s(?:href|src|srcset)="([^"]+)"/g)) {
    for (let ref of m[1].split(",").map((s) => s.trim().split(/\s+/)[0])) {
      if (!ref || ref.startsWith("mailto:")) continue;
      if (/^https?:/.test(ref)) { external.add(ref); continue; }
      if (ref.startsWith("/")) continue; // <base> path of the 404 page
      const [path, hash] = ref.split("#");
      const target = path === "" ? p : path === "./" ? "index.html" : join(base, path);
      if (path !== "" && !existsSync(target)) { console.log(`MISSING  ${p}: ${ref}`); bad++; continue; }
      if (hash) {
        const tgtIds = path === "" ? own : ids(readFileSync(target, "utf8"));
        if (!tgtIds.has(hash)) { console.log(`NO ANCHOR ${p}: ${ref}`); bad++; }
      }
    }
  }
}
const css = readFileSync("assets/css/style.css", "utf8");
for (const m of css.matchAll(/url\("?([^")]+)"?\)/g)) {
  const target = join("assets/css", m[1]);
  if (!existsSync(target)) { console.log(`MISSING  style.css: ${m[1]}`); bad++; }
}
console.log(`\nExternal links (not fetched): ${external.size}`);
for (const e of external) console.log("  " + e);
console.log(bad ? `\n${bad} broken local link(s)` : "\nAll local links, files and anchors resolve.");
process.exit(bad ? 1 : 0);
