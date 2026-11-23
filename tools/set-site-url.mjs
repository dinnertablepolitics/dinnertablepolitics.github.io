// Usage: node tools/set-site-url.mjs https://<user>.github.io/<repo>/ [https://github.com/<user>/<repo>]
// Replaces the placeholder site address (and optionally the repository link) in every file
// that needs an absolute address: canonical links, social preview tags, sitemap, robots.txt,
// and the <base> of the 404 page.
import { readFileSync, writeFileSync } from "node:fs";
const [site, repo] = process.argv.slice(2);
if (!site || !/^https:\/\/.+\/$/.test(site)) {
  console.error("Give the site address with https:// and a trailing slash, e.g. https://team.github.io/dinner-table-politics/");
  process.exit(1);
}
const OLD_SITE = process.env.OLD_SITE || "https://dinnertablepolitics.github.io/site/";
const OLD_REPO = process.env.OLD_REPO || "https://github.com/dinnertablepolitics/site";
const basePath = new URL(site).pathname;
for (const f of ["index.html", "privacy.html", "terms.html", "404.html", "sitemap.xml", "robots.txt"]) {
  let t = readFileSync(f, "utf8");
  t = t.split(OLD_SITE).join(site);
  if (repo) t = t.split(OLD_REPO).join(repo.replace(/\/$/, ""));
  if (f === "404.html") t = t.replace(/<base href="[^"]*">/, `<base href="${basePath}">`);
  writeFileSync(f, t);
  console.log("updated", f);
}
