# 05_threats.R: two checks for the critical evaluation
# (A) Concurrent country-specific events: re-estimate Table 1 col. 1 without the 2019 waves
#     (Canadian federal election 21 Oct 2019, one week after Canadian Thanksgiving;
#      US impeachment hearings 13-21 Nov 2019, just before US Thanksgiving)
# (B) Selective response: who skips the survey in the Thanksgiving week?
#     Person x survey-week grid of the weeks each person could have answered; outcome = responded.
# Output: output/tables/table_threats.tex, output/tables/threats_events.csv,
#         output/tables/threats_selection.csv

source("code/00_functions.R")
d <- prep(fread("data/derived/data_clean_random.csv"))

# ---- (A) dropping the 2019 waves -------------------------------------------------------------
drop_rule <- function(dd) { dd <- copy(dd); dd[, cnt := .N, by = id]; dd[cnt > 1] }
samp <- list("All waves"  = d,
             "No 2019"    = drop_rule(d[year != 2019]),
             "No CA 2019" = drop_rule(d[!(country == "CA" & year == 2019)]),
             "No US 2019" = drop_rule(d[!(country == "US" & year == 2019)]))
ev <- rbindlist(lapply(names(samp), function(k) {
  dd <- samp[[k]]; m <- est_main(dd); mw <- est_main(dd, cluster = ~cl_week)
  wb <- wild_p(mw, dd, "thanksgiving:rw_family", "cl_week", B = N_BOOT)
  rbindlist(lapply(names(main_terms), function(t) {
    a <- coef_of(m, main_terms[[t]])
    data.table(col = k, term = t, b = a[["b"]], se = a[["se"]], p = a[["p"]],
               p_wild = if (t == "fam") wb[["p"]] else NA_real_,
               n = nobs(m), ids = uniqueN(dd$id[obs(m)]), treated = sum(dd$thanksgiving[obs(m)]),
               clusters = wb[["G"]])
  }))
}))
fwrite(ev, "output/tables/threats_events.csv")

labels <- c(T = "Thanksgiving", fam = "\\quad $\\times$ family orientation", self = "\\quad $\\times$ own orientation")
K <- names(samp); body <- character(0)
for (t in names(main_terms)) {
  r <- ev[term == t][match(K, col)]
  body <- c(body, paste0(labels[[t]], " & ", paste(cell_b(r$b, r$p), collapse = " & "), " \\\\"),
            paste0(" & ", paste(cell_se(r$se), collapse = " & "), " \\\\"))
}
rf <- ev[term == "fam"][match(K, col)]
write_tex(c("\\begin{tabular}{lcccc}", "\\toprule",
  paste0(" & ", paste(K, collapse = " & "), " \\\\"), " & (1) & (2) & (3) & (4) \\\\", "\\midrule", body, "\\midrule",
  paste0("Wild bootstrap $p$ (family) & ", paste(fmt(rf$p_wild), collapse = " & "), " \\\\"),
  paste0("Observations & ", paste(fmt_n(rf$n), collapse = " & "), " \\\\"),
  paste0("Individuals & ", paste(fmt_n(rf$ids), collapse = " & "), " \\\\"),
  paste0("Treated observations & ", paste(fmt_n(rf$treated), collapse = " & "), " \\\\"),
  "\\bottomrule", "\\end{tabular}"), "output/tables/table_threats.tex")

# ---- (B) selective response in the Thanksgiving week -----------------------------------------
d[, wave := fifelse(surveynum <= 6, 1L, 2L)]
# a survey week counts as a Thanksgiving week for a country if most answers in it fall in days 0-6
wk <- d[, .(tg_week = as.numeric(mean(thanksgiving) > 0.5)), by = .(country, year, surveynum)]
# every person can answer every survey week of their wave; the first week they answered
# (baseline) is dropped because answering it is required to enter the sample
per <- d[, .(first = min(surveynum), rw_family = rw_family[1], rw_self = rw_self[1], country = country[1]),
         by = .(id, year, wave)]
grid <- per[, .(surveynum = if (wave == 1) 1:6 else 7:12), by = .(id, year, wave, first, rw_family, rw_self, country)]
grid <- grid[surveynum > first]
grid <- merge(grid, unique(d[, .(id, year, surveynum)])[, responded := 1], by = c("id", "year", "surveynum"), all.x = TRUE)
grid[is.na(responded), responded := 0]
grid <- merge(grid, wk, by = c("country", "year", "surveynum"), all.x = TRUE)
grid <- grid[!is.na(tg_week)]                       # weeks with no answers from that country at all
grid[, time := .GRP, by = .(year, surveynum)]; grid[, cl_week := .GRP, by = .(country, year, surveynum)]

rates <- grid[, .(response_rate = mean(responded), cells = .N), by = .(country, tg_week)][order(country, tg_week)]
m1 <- feols(responded ~ tg_week | id + time, grid, cluster = ~cl_week)
m2 <- feols(responded ~ tg_week + tg_week:rw_family + tg_week:rw_self | id + time, grid, cluster = ~cl_week)
sel <- rbind(
  data.table(model = "responded ~ TG week", term = rownames(coeftable(m1)), coeftable(m1)[, 1:4, drop = FALSE]),
  data.table(model = "responded ~ TG week x family/own", term = rownames(coeftable(m2)), coeftable(m2)[, 1:4, drop = FALSE]),
  fill = TRUE)
setnames(sel, c("model", "term", "b", "se", "t", "p"))
fwrite(sel, "output/tables/threats_selection.csv")
fwrite(rates, "output/tables/threats_response_rates.csv")
cat("Person-week grid:", nrow(grid), "cells,", uniqueN(grid$id), "people\n")
print(rates, digits = 3); print(sel, digits = 3); print(ev, digits = 3)
