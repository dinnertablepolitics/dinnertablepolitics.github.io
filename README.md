# Dinner Table Politics

Interactive website for Problem Set 4 (Empirical Methods, UZH, HS 2026): a plain-language
explainer and replication of

> Cornelson, K. (2026). Politics at the Dinner Table: Thanksgiving and Social Influences on
> Political Polarisation. *The Economic Journal*, 136(675), 1125–1139.

Plain HTML, CSS and JavaScript. No build step, no libraries, no third-party requests.

## Structure

| Path | What it is |
|---|---|
| `index.html` | the page: summary, design, charts, calculator, robustness table, quiz, about |
| `privacy.html`, `terms.html`, `404.html` | legal pages and the custom “not found” page |
| `assets/css/style.css` | all styles (tokens at the top) |
| `assets/js/main.js` | charts, calculator, table, quiz validation, consent-gated analytics |
| `assets/js/config.js` | public settings (analytics off by default); never put secrets here |
| `assets/data/results.json` / `results.js` | all numbers, exported by `replication/code/06_website_data.R` |
| `assets/img/` | compressed WebP pictures, favicons, social preview |
| `assets/fonts/` | Bricolage Grotesque (SIL Open Font License), self-hosted |
| `robots.txt`, `sitemap.xml`, `.nojekyll` | for search engines and GitHub Pages |
| `tools/` | helper scripts (not needed by visitors): local server, link check, URL setter |

## Preview locally

```
node tools/serve.mjs 8766
```

then open http://127.0.0.1:8766/. Opening `index.html` directly from the file system also works.

## Update the numbers

Run `Rscript 00_master.R` in `../replication`. The last step rewrites `assets/data/results.json`
and `results.js`; the page picks them up on reload.

## Publish on GitHub Pages

1. Create a repository on GitHub (public, or private if your account has GitHub Pro/Education),
   e.g. `dinner-table-politics`, and push this folder to it.
2. Settings → Pages → Source: “Deploy from a branch”, branch `main`, folder `/ (root)`.
3. Settings → Pages → tick **Enforce HTTPS** once the site is live.
4. Put the real address into the files that need it:
   `node tools/set-site-url.mjs https://<user>.github.io/<repo>/ https://github.com/<user>/<repo>`
   then commit and push again.
5. Run `node tools/check-links.mjs` before every push.
6. If the repository is private, invite the TAs as collaborators.

## Launch checklist

| # | Item | Status |
|---|---|---|
| 1 | Privacy policy page | `privacy.html` |
| 2 | Terms & conditions page | `terms.html` (add the code licence once chosen) |
| 3 | Secrets off the frontend | No keys or tokens exist; `config.js` holds public settings only. |
| 4 | Force HTTPS | CSP `upgrade-insecure-requests` on every page; tick “Enforce HTTPS” in GitHub Pages (step 3 above). |
| 5 | Cookie consent banner | Built and consent-gated. It only appears if analytics is switched on, because the site sets no cookies otherwise. |
| 6 | Meta titles + descriptions | On every page, plus canonical links. |
| 7 | Social preview image | `assets/img/social-preview.jpg`, 1200×630, Open Graph and Twitter tags. |
| 8 | Favicon | SVG, 32 px PNG and 180 px Apple touch icon. |
| 9 | Sitemap + robots.txt | Present; the real address is set with `tools/set-site-url.mjs`. |
| 10 | Alt text on images | Every picture has a description; charts and drawings have SVG titles. |
| 11 | Compress your images | WebP, 39–320 KB each, responsive `srcset`, lazy loading below the fold. |
| 12 | Check page load speed | About 410 KB in total, no third-party requests, font preloaded. Run Lighthouse once live. |
| 13 | Fix color contrast | All text meets WCAG AA (black on mint, grey and orange; grey text #595959 on white is 7:1). |
| 14 | Make it mobile friendly | Own phone layout; checked at 390, 768 and 1440 px. |
| 15 | Custom 404 page | `404.html` (“This seat is empty”). |
| 16 | Fix broken links | `node tools/check-links.mjs` checks every local link, file and anchor. |
| 17 | Form validation | Quiz answers are validated in the browser with clear messages. |
| 18 | Spam protection | Nothing is ever submitted to a server, so there is nothing to spam. A contact form, if added later, needs a honeypot field or a service with spam filtering. |
| 19 | Set up analytics | Prepared for GoatCounter (cookieless) behind the consent banner; switched off until you create an account (see `config.js`). |
| 20 | One clear call to action | “Seat your family”: the calculator, in the top bar, the hero and the picture board. |

## Still to do before submission

- Decide the code licence and add a `LICENSE` file.
- Optional: switch on GoatCounter (see `assets/js/config.js`).

## Credits

Pictures: Marjory Collins, “Thanksgiving grace” and “Thanksgiving dinner at the house of Earle
Landis”, 1942, Library of Congress (public domain); Winslow Homer, “Thanksgiving Day – The Dinner”,
1858, Cleveland Museum of Art (CC0); J. S. Pughe, “Our international Thanksgiving dinner”, Puck,
1901, and J. Keppler, “Thanksgiving”, Puck, 1883, Library of Congress (public domain). Film clips
(`assets/video/`): “A Day of Thanksgiving”, Centron Corporation, 1951, Internet Archive
(https://archive.org/details/DayofTha1951, public domain), cut, greyscale, no sound. Source pages
are listed in `assets/img/credits.json`. Typeface: Bricolage Grotesque, SIL Open Font License 1.1.
Data: Cornelson (2025), replication package, Zenodo, doi:10.5281/zenodo.16962525, CC BY 4.0.
