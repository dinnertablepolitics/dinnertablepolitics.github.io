# 00_master.R: runs the whole replication from the raw data.
# Run from this folder:   Rscript 00_master.R
# Requires R >= 4.3 and the packages haven, data.table, fixest, ggplot2, jsonlite.

stopifnot(file.exists("data/raw/data_raw.dta"))   # must be run from the project folder
for (p in c("haven", "data.table", "fixest", "ggplot2", "jsonlite"))
  if (!requireNamespace(p, quietly = TRUE)) stop("Please install the R package '", p, "'")

N_SEEDS <- 50      # random tie-break seeds for the sensitivity column of Table 1
N_BOOT  <- 9999    # wild cluster bootstrap replications

dir.create("output/tables", recursive = TRUE, showWarnings = FALSE)
dir.create("output/figures", recursive = TRUE, showWarnings = FALSE)
dir.create("output/logs", recursive = TRUE, showWarnings = FALSE)
sink("output/logs/master_log.txt", split = TRUE)
cat("Run started", format(Sys.time()), "\n\n")

source("code/01_clean.R")
for (tm in c("random", "missing")) {
  r <- clean_data(tiemode = tm, seed = 1, tag = tm)
  cat("Cleaning, tie rule =", tm, ": N =", r$n, ", individuals =", r$ids, "\n"); print(r$steps)
}
cat("\n== Table 1 ==\n");    source("code/02_table1.R")
cat("\n== Figures ==\n");    source("code/03_figures.R")
cat("\n== Extension ==\n");  source("code/04_extension.R")
cat("\n== Threats ==\n");    source("code/05_threats.R")
cat("\n== Website data ==\n"); source("code/06_website_data.R")

# Optional, for the authors only: copy the report's tables and figures into a local clone of
# the Overleaf project if one sits next to the repository. Does nothing anywhere else.
ol <- "../../overleaf"
if (dir.exists(ol)) {
  dir.create(file.path(ol, "tables"), showWarnings = FALSE); dir.create(file.path(ol, "figures"), showWarnings = FALSE)
  file.copy(c("output/tables/table1.tex", "output/tables/table_extension.tex", "output/tables/table_threats.tex"), file.path(ol, "tables"), overwrite = TRUE)
  file.copy(c("output/figures/figure1.pdf", "output/figures/figure2.pdf"), file.path(ol, "figures"), overwrite = TRUE)
  cat("\nCopied tables and figures to the local Overleaf clone (not pushed)\n")
}

cat("\nRun finished", format(Sys.time()), "\n\n"); print(sessionInfo())
sink()
