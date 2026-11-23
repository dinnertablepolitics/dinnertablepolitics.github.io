# 06_website_data.R: exports the numbers shown on the PS4 website
# Output: ../website/assets/data/results.json (only if the website folder exists)

source("code/00_functions.R")
if (!dir.exists("../website")) { message("no ../website folder, skipping"); } else {

d <- prep(fread("data/derived/data_clean_random.csv"))
m <- est_main(d)
b <- coef(m)[main_terms]; V <- vcov(m)[main_terms, main_terms]

# who sits at the table: distribution of family orientation (person level, rounded)
pp <- d[, .(fam = rw_family[1], own = rw_self[1]), by = id]
fam_dist <- pp[, .N, by = .(v = round(fam))][order(v)][, share := N / sum(N)]

ev1 <- fread("output/figures/figure1_estimates.csv"); ev2 <- fread("output/figures/figure2_estimates.csv")
ext <- fread("output/tables/extension_results.csv")[term == "fam"]
thr <- fread("output/tables/threats_events.csv")[term == "fam"]
sel <- fread("output/tables/threats_selection.csv")

desc <- c("Baseline" = "Our replication of the paper's main model",
          "Simple index" = "Opinion score built without the nearest-neighbour method",
          "Excl. low-quality" = "Drops answers that tick the same box for every statement and people sharing an IP address",
          "Placebo week" = "Pretends Thanksgiving happened two weeks earlier; should show no effect",
          "No 2019" = "Leaves out 2019 (Canadian election, US impeachment hearings)",
          "No CA 2019" = "Leaves out Canada in 2019",
          "No US 2019" = "Leaves out the US in 2019")
rob <- rbind(ext[, .(spec = col, b, se, p, p_wild, n, ids, sd_y)],
             thr[col != "All waves", .(spec = col, b, se, p, p_wild, n, ids, sd_y = sd(d$rw_index))])
rob[, b_sd := b / sd_y]; rob[, se_sd := se / sd_y]; rob[, about := desc[spec]]

r3 <- function(x) round(x, 4)
out <- list(
  generated = format(Sys.time(), "%Y-%m-%d"),
  sample = list(observations = nrow(d), people = uniqueN(d$id), thanksgiving_obs = sum(d$thanksgiving),
                survey_weeks = uniqueN(d$time), index_sd = r3(sd(d$rw_index)), index_mean = r3(mean(d$rw_index))),
  paper = list(T = -0.123, fam = 0.048, own = -0.004, se_fam = 0.021),
  main = list(b = as.list(r3(setNames(b, names(main_terms)))),
              vcov = unname(lapply(seq_len(3), function(i) signif(V[i, ], 5)))),
  family_distribution = lapply(seq_len(nrow(fam_dist)), function(i) list(v = fam_dist$v[i], share = r3(fam_dist$share[i]))),
  discussion = lapply(split(ev1, ev1$sample), function(x) { x <- x[order(week)]; list(week = x$week, b = r3(x$b), se = r3(x$se)) }),
  opinion = lapply(split(ev2, ev2$sample), function(x) { x <- x[order(week)]; list(week = x$week, b = r3(x$b), se = r3(x$se)) }),
  robustness = lapply(seq_len(nrow(rob)), function(i) as.list(rob[i, lapply(.SD, function(z) if (is.numeric(z)) r3(z) else z)])),
  selection = list(tg_week = r3(sel[term == "tg_week"][1]$b), tg_week_se = r3(sel[term == "tg_week"][1]$se),
                   fam = r3(sel[term == "tg_week:rw_family"]$b), fam_se = r3(sel[term == "tg_week:rw_family"]$se))
)
dir.create("../website/assets/data", recursive = TRUE, showWarnings = FALSE)
jsonlite::write_json(out, "../website/assets/data/results.json", auto_unbox = TRUE, digits = NA, pretty = TRUE)
# same data as a script, so the page also works when opened straight from the file system
writeLines(c("window.RESULTS = ", readLines("../website/assets/data/results.json"), ";"), "../website/assets/data/results.js")
message("wrote ../website/assets/data/results.json and results.js")
}
