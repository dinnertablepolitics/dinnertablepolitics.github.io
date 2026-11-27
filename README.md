# Dinner Table Politics

Replication package (Problem Set 3) and interactive website (Problem Set 4) for Empirical
Methods, UZH, HS 2026: our replication of

> Cornelson, K. (2026). Politics at the Dinner Table: Thanksgiving and Social Influences on
> Political Polarisation. *The Economic Journal*, 136(675), 1125–1139.

Plain HTML, CSS and JavaScript. No build step, no libraries, no third-party requests.

**Live site:** https://dinnertablepolitics.github.io/
**Made by:** Julian Hasler, Lilly Schiemann and Yuhan Ye (team name: Dinner Table Politics)

## Problem Set 3: replication package

Everything for the PS3 report is in [`replication/`](replication/): our R code, the data we
used and the tables and figures in the report. Run `Rscript 00_master.R` inside `replication/`
to reproduce all of them; [`replication/README.md`](replication/README.md) explains the folder
structure, the order of the scripts and which script produces which table and figure.

The author's original replication package is not included. We used its raw data file and
read its Stata do-files: Cornelson, K. (2025), replication package, Zenodo,
https://doi.org/10.5281/zenodo.16962525 (CC BY 4.0).

| Folder | Problem set |
|---|---|
| `replication/` | PS3: replication code, data, output |
| everything else (`index.html`, `assets/`, …) | PS4: the website |

## Where to find the Problem Set 4 requirements

| Requirement | Where on the site |
|---|---|
| Paper summary box in non-technical language | “The short version” (`#summary`): question, study, answer, our check |
| Intuitive headline for every section | every section starts with a plain-language headline |
| Table with dynamic functionality | “How sure are we?” (`#sure`): switch robustness checks on and off, switch units (share of spread / score points) |
| Chart with dynamic functionality | “More politics at the table” (`#table-talk`): outcome toggle and US / Canada filter; also the “Seat your family” calculator (`#try`) with two sliders |
| Three exam-style questions below the charts, getting harder | “Test yourself” (`#quiz`): multiple choice, a calculation, an omitted-variable-bias question; each with a hint and a model answer |
| Code | this repository; the R replication is in `replication/` (`00_master.R` runs everything) |

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
| `replication/` | the PS3 replication package (R code, data, output); see its README |

## Preview locally

```
node tools/serve.mjs 8766
```

then open http://127.0.0.1:8766/. Opening `index.html` directly from the file system also works.

## Update the numbers

Run `Rscript 00_master.R` in `replication/`. The last step rewrites `assets/data/results.json`
and `results.js`; the page picks them up on reload.

## Deployment

The site is served by GitHub Pages from the `main` branch (root folder), with HTTPS enforced.
Run `node tools/check-links.mjs` before every push. If the address ever changes, update it with
`node tools/set-site-url.mjs <new-site-url> <new-repo-url>`.

## Launch checklist

| # | Item | Status |
|---|---|---|
| 1 | Privacy policy page | `privacy.html` |
| 2 | Terms & conditions page | `terms.html` |
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

Pictures and animations: 3D scenes built from primitives in Blender 5.3 by the team (script: `tools/blender-scenes.py`). Typeface: Bricolage Grotesque, SIL Open Font License 1.1. Data: Cornelson (2025), replication package, Zenodo, doi:10.5281/zenodo.16962525, CC BY 4.0.

The previous design with archival photographs, cartoons and 1951 film clips is kept as the git tag `v1-archival` and the branch `backup/archival-design`. To switch the live site back: `git checkout main && git reset --hard v1-archival && git push --force-with-lease`, or `git revert` the 3D commit.
