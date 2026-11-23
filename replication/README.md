# Replication code

The R code behind every number on the site. Data are not included: download `data_raw.dta` from the replication package (https://doi.org/10.5281/zenodo.16962525, folder Data/) into `data/raw/` and run `Rscript 00_master.R`.

# Replication code: Cornelson (2026), "Politics at the Dinner Table"

Replication of Table 1 (column 1) and Figures 1–2 (panels a–c) of

> Cornelson, K. (2026). Politics at the Dinner Table: Thanksgiving and Social Influences on
> Political Polarisation. *The Economic Journal*, 136(675), 1125–1139. https://doi.org/10.1093/ej/ueaf085

plus a robustness extension, for Problem Set 3 of Empirical Methods (UZH, HS 2026).

## Data

`data/raw/data_raw.dta` is the raw survey file from the author's replication package
(Zenodo, https://doi.org/10.5281/zenodo.16962525, file `3-replication-package.zip`,
folder `Data/`, licence CC-BY 4.0, downloaded 23 November 2026). It is never modified;
all cleaning happens in `code/01_clean.R`.

## How to run

From this folder:

```
Rscript 00_master.R
```

Runtime: about 2.5 minutes on a laptop (most of it is the 50 tie-break seeds and the
wild bootstrap). The run log, including `sessionInfo()`, is written to
`output/logs/master_log.txt`.

Software used: R 4.5.2 with data.table 1.18.6.1, fixest 0.14.2, haven 2.5.5,
ggplot2 4.0.3.

## Structure

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
