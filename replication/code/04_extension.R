# 04_extension.R: robustness of Table 1, column 1
# (1) baseline replication
# (2) simple opinion index instead of the k-NN index (no neighbours, no tie rule)
# (3) drop answers that straightline all statements and people who share an IP address
# (4) placebo: pretend Thanksgiving happened two weeks earlier (real Thanksgiving week dropped)
# For every column we also report the interaction's standard error clustered at the
# country x survey-week level (the level at which Thanksgiving timing varies: 66 clusters)
# and a wild cluster bootstrap p-value at that level.
# Output: output/tables/table_extension.tex, output/tables/extension_results.csv

source("code/00_functions.R")
d <- prep(fread("data/derived/data_clean_random.csv"))

d_alt <- copy(d)[, rw_index := rw_index_alt]
d_q   <- d[straightline == FALSE & shared_ip == 0]
d_q[, cnt := .N, by = id]; d_q <- d_q[cnt > 1]                 # keep the paper's >= 2 weeks rule
d_pl  <- d[thanksgiving == 0][, thanksgiving := as.numeric(days_since >= -14 & days_since <= -8)]

cols <- list("Baseline" = d, "Simple index" = d_alt, "Excl. low-quality" = d_q, "Placebo week" = d_pl)
res <- rbindlist(lapply(names(cols), function(k) {
  dd <- cols[[k]]
  m  <- est_main(dd)                                   # paper's clustering
  mw <- est_main(dd, cluster = ~cl_week)               # country x week clusters
  wb <- wild_p(mw, dd, "thanksgiving:rw_family", "cl_week", B = N_BOOT)
  rbindlist(lapply(names(main_terms), function(t) {
    a <- coef_of(m, main_terms[[t]]); w <- coef_of(mw, main_terms[[t]])
    data.table(col = k, term = t, b = a[["b"]], se = a[["se"]], p = a[["p"]], se_week = w[["se"]], p_week = w[["p"]],
               p_wild = if (t == "fam") wb[["p"]] else NA_real_, G = wb[["G"]],
               sd_y = sd(dd$rw_index[obs(m)]), n = nobs(m), ids = uniqueN(dd$id[obs(m)]), treated = sum(dd$thanksgiving[obs(m)]))
  }))
}))
fwrite(res, "output/tables/extension_results.csv")

labels <- c(T = "Thanksgiving", fam = "\\quad $\\times$ family orientation",
            self = "\\quad $\\times$ own orientation")
K <- names(cols); body <- character(0)
for (t in names(main_terms)) {
  r <- res[term == t][match(K, col)]
  body <- c(body, paste0(labels[[t]], " & ", paste(cell_b(r$b, r$p), collapse = " & "), " \\\\"),
            paste0(" & ", paste(cell_se(r$se), collapse = " & "), " \\\\"))
}
rf <- res[term == "fam"][match(K, col)]
tex <- c(
  "\\begin{tabular}{lcccc}", "\\toprule",
  paste0(" & ", paste(K, collapse = " & "), " \\\\"),
  " & (1) & (2) & (3) & (4) \\\\", "\\midrule", body, "\\midrule",
  "\\multicolumn{5}{l}{\\textit{Inference on Thanksgiving $\\times$ family, country $\\times$ week clusters}} \\\\",
  paste0("Clustered SE & ", paste(paste0("[", fmt(rf$se_week), "]"), collapse = " & "), " \\\\"),
  paste0("Wild cluster bootstrap $p$-value & ", paste(fmt(rf$p_wild), collapse = " & "), " \\\\"),
  "\\midrule",
  paste0("SD of outcome & ", paste(fmt(rf$sd_y, 2), collapse = " & "), " \\\\"),
  paste0("Observations & ", paste(fmt_n(rf$n), collapse = " & "), " \\\\"),
  paste0("Individuals & ", paste(fmt_n(rf$ids), collapse = " & "), " \\\\"),
  paste0("Treated observations & ", paste(fmt_n(rf$treated), collapse = " & "), " \\\\"),
  "\\bottomrule", "\\end{tabular}")
write_tex(tex, "output/tables/table_extension.tex")
print(res, digits = 3)
