# Replication package: Cornelson (2026), "Politics at the Dinner Table"

Problem Set 3, Empirical Methods (UZH, HS 2026). Julian Hasler, Lilly Schiemann, Yuhan Ye.

Our own R replication of Table 1 (column 1) and Figures 1–2 (panels a–c) of

> Cornelson, K. (2026). Politics at the Dinner Table: Thanksgiving and Social Influences on
> Political Polarisation. *The Economic Journal*, 136(675), 1125–1139. https://doi.org/10.1093/ej/ueaf085

plus the robustness extension and the checks of the critical evaluation in our report.
The same numbers feed the Problem Set 4 website in the repository root.

## Original replication package

The author's package (Stata) is **not** included here. We relied on it for the raw data and
read its `data_cleaning.do` and table do-files to translate the cleaning steps to R:

> Cornelson, K. (2025). Replication package for "Politics at the Dinner Table". Zenodo.
> https://doi.org/10.5281/zenodo.16962525 (CC BY 4.0)

## Data

`data/raw/data_raw.dta` is the raw survey file from that package (file
`3-replication-package.zip`, folder `Data/`, licence CC BY 4.0, downloaded 23 November 2026).
It is the only data we use and it is never modified; all cleaning happens in
`code/01_clean.R`, which writes the analysis files to `data/derived/`.

## How to run

Requires R ≥ 4.3 with the packages `haven`, `data.table`, `fixest`, `ggplot2` and `jsonlite`.
From this folder (`replication/`):

```
Rscript 00_master.R
```

`00_master.R` runs the scripts in `code/` in their numbered order (01 → 06). Runtime is about
2.5 minutes on a laptop (most of it is the 50 tie-break seeds and the wild bootstrap). The run
log, including `sessionInfo()`, is written to `output/logs/master_log.txt`.

Software used for the results in the report: R 4.5.2 with data.table 1.18.6.1, fixest 0.14.2,
haven 2.5.5, ggplot2 4.0.3, jsonlite 2.0.0.

## Folder structure

```
replication/
├── 00_master.R          runs everything
├── code/                one script per step (see table below)
├── data/raw/            the author's raw survey file (input)
├── data/derived/        cleaned analysis files (written by 01_clean.R)
└── output/
    ├── tables/          LaTeX tables in the report + the numbers as csv
    ├── figures/         figures in the report (pdf) + the estimates as csv
    └── logs/            run log
```

## Which script produces what

| In the report | Script | File |
|---|---|---|
| Table 1 (main replication) | `code/02_table1.R` | `output/tables/table1.tex` |
| Figure 1 (event study, talking politics with family) | `code/03_figures.R` | `output/figures/figure1.pdf` |
| Figure 2 (event study, opinion index × family orientation) | `code/03_figures.R` | `output/figures/figure2.pdf` |
| Table on threats to internal validity | `code/05_threats.R` | `output/tables/table_threats.tex` |
| Extension and robustness table | `code/04_extension.R` | `output/tables/table_extension.tex` |
| Numbers on the PS4 website | `code/06_website_data.R` | `../assets/data/results.json`, `results.js` |

## All scripts

| File | What it does | Output |
|---|---|---|
| `00_master.R` | runs everything in order, sets `N_SEEDS` and `N_BOOT` | `output/logs/master_log.txt` |
| `code/00_functions.R` | variable construction, regression helpers, LaTeX formatting, wild cluster bootstrap | – |
| `code/01_clean.R` | R translation of the author's `data_cleaning.do` (only the variables we need), including the k-nearest-neighbour opinion index | `data/derived/data_clean_random.csv`, `data_clean_missing.csv` |
| `code/02_table1.R` | Table 1 column 1: paper vs. our estimates under two tie rules, and the range over 50 random seeds; all 8 columns of Table 1 for comparison | `output/tables/table1.tex`, `table1_seeds.csv`, `table1_all_columns.csv` |
| `code/03_figures.R` | event-study figures (paper Figure 1 a–c and Figure 2 a–c) | `output/figures/figure1.pdf`, `figure2.pdf` (+ estimates as csv) |
| `code/04_extension.R` | robustness: simple index, excluding low-quality answers, placebo week, country × week clustering with wild cluster bootstrap | `output/tables/table_extension.tex`, `extension_results.csv` |
| `code/05_threats.R` | checks for the critical evaluation: Table 1 col. 1 without the 2019 waves; response behaviour in the Thanksgiving week (person × week grid) | `output/tables/table_threats.tex`, `threats_*.csv` |

## Notes on differences from the original code

* **Opinion index ties.** The index classifies each answer pattern with Stata's
  `discrim knn` (k = 5). When two classes get the same number of neighbour votes the
  prediction is a tie. We break ties at random with a fixed seed (`seed = 1`, column 2 of
  Table 1) and also report the rule "tie = missing", which is Stata's documented default
  (column 3). Neither rule reproduces the author's numbers exactly, so column 4 shows the
  range over 50 seeds. All sample sizes match the paper exactly.
* **Standard errors.** Clustered as in the do-files; fixest's default small-sample
  correction matches `reghdfe`.
* **Wild cluster bootstrap.** Implemented by hand in `code/00_functions.R` (restricted,
  Rademacher weights, 9,999 draws, seed 20261130) to avoid an extra package dependency.
  It runs on the country × survey-week clusters (66 clusters, 11 with Thanksgiving weeks).
