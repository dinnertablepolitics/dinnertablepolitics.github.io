# 02_table1.R: main result, Table 1 column 1 of Cornelson (2026)
# Output: output/tables/table1.tex      (paper vs. replication, LaTeX tabular)
#         output/tables/table1_seeds.csv (column-1 coefficients for every random seed)
#         output/tables/table1_all_columns.csv (all 8 columns of Table 1, seed 1)

source("code/00_functions.R"); source("code/01_clean.R")

paper <- data.table(term = names(main_terms), b = c(-0.123, 0.048, -0.004), se = c(0.070, 0.021, 0.016))
paper[, p := 2 * pnorm(-abs(b / se))]

d_rand <- prep(fread("data/derived/data_clean_random.csv"))
d_miss <- prep(fread("data/derived/data_clean_missing.csv"))
m_rand <- est_main(d_rand); m_miss <- est_main(d_miss)

# ---- sensitivity to the tie rule: rerun cleaning + regression for many seeds ----------
seeds <- 1:N_SEEDS
tmp <- file.path(tempdir(), "seeds"); dir.create(tmp, showWarnings = FALSE)
seed_res <- rbindlist(lapply(seeds, function(s) {
  clean_data("random", s, "s", outdir = tmp)
  m <- est_main(prep(fread(file.path(tmp, "data_clean_s.csv"))))
  rbindlist(lapply(names(main_terms), function(t) {
    k <- coef_of(m, main_terms[[t]]); data.table(seed = s, term = t, b = k[["b"]], se = k[["se"]], p = k[["p"]])
  }))
}))
fwrite(seed_res, "output/tables/table1_seeds.csv")
rng <- seed_res[, .(lo = min(b), hi = max(b), share10 = mean(p < .1), share05 = mean(p < .05)), by = term]

# ---- LaTeX table --------------------------------------------------------------------------
labels <- c(T = "Thanksgiving", fam = "\\quad $\\times$ family orientation",
            self = "\\quad $\\times$ own orientation")
rows <- character(0)
for (t in names(main_terms)) {
  pb <- paper[term == t]; a <- coef_of(m_rand, main_terms[[t]]); b <- coef_of(m_miss, main_terms[[t]])
  r <- rng[term == t]
  rows <- c(rows,
    sprintf("%s & %s & %s & %s & $[%s, %s]$ \\\\", labels[[t]], cell_b(pb$b, pb$p), cell_b(a[["b"]], a[["p"]]),
            cell_b(b[["b"]], b[["p"]]), fmt(r$lo), fmt(r$hi)),
    sprintf(" & %s & %s & %s & \\\\", cell_se(pb$se), cell_se(a[["se"]]), cell_se(b[["se"]])))
}
tex <- c(
  "\\begin{tabular}{lcccc}", "\\toprule",
  " & Paper & \\multicolumn{3}{c}{Replication} \\\\", "\\cmidrule(lr){3-5}",
  " & & Random tie-break & Ties missing & Range over \\\\",
  sprintf(" & & (seed 1) & (Stata default) & %d seeds \\\\", N_SEEDS),
  " & (1) & (2) & (3) & (4) \\\\", "\\midrule", rows, "\\midrule",
  sprintf("Observations & 10,092 & %s & %s & %s \\\\", fmt_n(nobs(m_rand)), fmt_n(nobs(m_miss)), fmt_n(nobs(m_rand))),
  sprintf("Individuals & 2,006 & %s & %s & %s \\\\", fmt_n(uniqueN(d_rand$id)), fmt_n(uniqueN(d_miss$id)), fmt_n(uniqueN(d_rand$id))),
  "Individual FE, survey-week FE & Yes & Yes & Yes & Yes \\\\",
  "\\bottomrule", "\\end{tabular}")
write_tex(tex, "output/tables/table1.tex")

# ---- all eight columns of Table 1 (seed 1) for the reconciliation worksheet --------------
d <- copy(d_rand)
d[, wave := fifelse(surveynum <= 6, 1L, 2L)]; setorder(d, id, year, wave, surveynum)
d[, first := as.numeric(seq_len(.N) == 1), by = .(id, year, wave)]
d[, rwfirst := max(rw_index * first), by = .(id, year, wave)]
d[, df1 := rw_family - rw_self]; d[, df2 := rw_family - rwfirst]
d[, adf1 := abs(df1)]; d[, adf2 := abs(df2)]; d[, adf_lhs := abs(rw_index - rw_family)]
for (v in c("df1", "df2", "adf1", "adf2", "rw_self", "rwfirst")) d[, paste0("cl_", v) := .GRP, by = c("country", "time", v)]
spec <- list(
  c1 = list(f_main, ~cl_fam, NULL, -0.123, 0.048),
  c2 = list(rw_index ~ thanksgiving + thanksgiving:df1 + df1 + factor(time) | id, ~cl_df1, NULL, 0.013, 0.016),
  c3 = list(rw_index ~ thanksgiving + thanksgiving:df2 + df2 + factor(time) | id, ~cl_df2, "first==0", 0.015, 0.016),
  c4 = list(adf_lhs ~ thanksgiving + factor(time) | id, ~cl_week, NULL, -0.037, NA),
  c5 = list(adf_lhs ~ thanksgiving + thanksgiving:adf1 + adf1 + factor(time) | id, ~cl_adf1, NULL, -0.009, -0.022),
  c6 = list(adf_lhs ~ thanksgiving + thanksgiving:adf2 + adf2 + factor(time) | id, ~cl_adf2, "first==0", 0.040, -0.060),
  c7 = list(rw_index ~ thanksgiving + thanksgiving:rw_self + rw_self + factor(time) | id, ~cl_rw_self, NULL, -0.011, 0.012),
  c8 = list(rw_index ~ thanksgiving + thanksgiving:rwfirst + rwfirst + factor(time) | id, ~cl_rwfirst, "first==0", -0.004, 0.009))
allc <- rbindlist(lapply(names(spec), function(k) {
  s <- spec[[k]]; dd <- if (is.null(s[[3]])) d else d[eval(parse(text = s[[3]]))]
  m <- feols(s[[1]], dd, cluster = s[[2]], fixef.rm = "singleton"); ct <- coeftable(m)
  inter <- grep("^thanksgiving:", rownames(ct), value = TRUE)[1]
  data.table(column = k, n = nobs(m),
             b_T = ct["thanksgiving", 1], paper_T = s[[4]],
             b_x = if (is.na(inter)) NA else ct[inter, 1], paper_x = s[[5]])
}))
fwrite(allc, "output/tables/table1_all_columns.csv")
print(allc, digits = 3)
print(rng, digits = 3)
