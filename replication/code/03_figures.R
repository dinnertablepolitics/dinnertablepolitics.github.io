# 03_figures.R: event-study figures
# Figure 1 (paper, panels a-c): probability of discussing politics with close family,
#   by week relative to Thanksgiving, net of individual fixed effects.
# Figure 2 (paper, panels a-c): how the opinion index moves with close family's
#   orientation in each week relative to Thanksgiving (ev x family interactions).
# Output: output/figures/figure1.pdf, output/figures/figure2.pdf (+ csv of the estimates)

source("code/00_functions.R")
suppressMessages(library(ggplot2))

d <- prep(fread("data/derived/data_clean_random.csv"))
samples <- list(Canada   = d[canadian == 1 & surveynum <= 6],
                US       = d[canadian == 0 & surveynum >= 7],
                Combined = d)
week_lab <- c("-2" = "-2+", "-1" = "-1", "0" = "0", "1" = "1", "2" = "2", "3" = "3+")

event <- function(fml, pattern, strip) {
  r <- rbindlist(lapply(names(samples), function(s) {
    m <- feols(fml, samples[[s]], cluster = ~cl_week, fixef.rm = "singleton")
    ct <- coeftable(m); k <- grep(pattern, rownames(ct))
    wk <- as.numeric(sub(".*ev::(-?[0-9]+).*", "\\1", rownames(ct)[k]))
    rbind(data.table(sample = s, week = wk, b = ct[k, 1], se = ct[k, 2]),
          data.table(sample = s, week = -1, b = 0, se = 0))
  }))
  r[, sample := factor(sample, levels = names(samples))]
  r[]
}

plot_event <- function(r, ylab) {
  ggplot(r, aes(week, b)) +
    geom_hline(yintercept = 0, colour = "grey60") +
    geom_vline(xintercept = -0.5, linetype = 2, colour = "grey40") +
    geom_errorbar(aes(ymin = b - 1.96 * se, ymax = b + 1.96 * se), width = 0.15, colour = "#2b5d8a") +
    geom_point(size = 1.8, colour = "#2b5d8a") +
    facet_wrap(~sample, nrow = 1) +
    scale_x_continuous(breaks = -2:3, labels = week_lab) +
    labs(x = "Weeks relative to Thanksgiving (reference: week -1)", y = ylab) +
    theme_bw(base_size = 10) +
    theme(panel.grid.minor = element_blank(), strip.background = element_rect(fill = "grey95"))
}

# Figure 1: discussion of politics with close family (Figure1.do: no week FE, id FE)
f1 <- event(discuss_close ~ i(ev, ref = "-1") | id, "^ev::", "")
fwrite(f1, "output/figures/figure1_estimates.csv")
ggsave("output/figures/figure1.pdf", plot_event(f1, "Change in P(political discussion\nwith close family)"),
       width = 6.5, height = 2.6)

# Figure 2: opinion index x close-family orientation (Figure2.do: event dummies,
# their interactions with family orientation, family orientation, id FE)
f2 <- event(rw_index ~ i(ev, ref = "-1") + i(ev, rw_close, ref = "-1") + rw_close | id,
            "^ev::-?[0-9]+:rw_close$", "")
fwrite(f2, "output/figures/figure2_estimates.csv")
ggsave("output/figures/figure2.pdf", plot_event(f2, "Effect of close family being\none point further right"),
       width = 6.5, height = 2.6)
print(f1[order(sample, week)], digits = 3); print(f2[order(sample, week)], digits = 3)
