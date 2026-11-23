# 01_clean.R
# R translation of the parts of Data/data_cleaning.do (Cornelson 2026, EJ replication
# package) that are needed for Table 1, Figures 1-2 and our extension.
# Input : data/raw/data_raw.dta
# Output: data/derived/data_clean_<tag>.csv
#
# clean_data(tiemode, seed, tag)
#   tiemode = "random"  : a tie in the k-NN vote (two classes with the same number of
#                         neighbours) is broken by a random draw, using `seed`
#             "missing" : a tied vote gives a missing prediction (Stata's documented
#                         default for -discrim knn-, ties(missing))
#             "first"   : a tied vote goes to the lowest (most left-wing) class

suppressMessages({library(haven); library(data.table)})

clean_data <- function(tiemode = "random", seed = 1, tag = tiemode,
                       raw = file.path("data", "raw", "data_raw.dta"),
                       outdir = file.path("data", "derived")) {

  d <- as.data.table(zap_formats(zap_labels(read_dta(raw))))
  chr <- names(d)[sapply(d, is.character)]
  d[, (chr) := lapply(.SD, function(x) replace(x, x == "", NA_character_)), .SDcols = chr]
  n_raw <- nrow(d)

  # ---- 1. survey waves and baseline information --------------------------------------
  # Baseline questions (demographics, political orientation of self and family) are only
  # asked in the first survey of a wave (surveynum 1 for Canada, 7 for the US). They are
  # merged onto every week of the same person and wave, as in the do-file.
  d[, surveywave := fcase(year == 2019 & surveynum <= 6, 1L, year == 2019 & surveynum >= 7, 2L,
                          year == 2021 & surveynum <= 6, 3L, year == 2021 & surveynum >= 7, 4L,
                          year == 2022 & surveynum <= 6, 5L, year == 2022 & surveynum >= 7, 6L)]
  basev <- c("country", "age", "gender", "race", "birth_country", "educ", "language_mt", "region",
             "rw_self", "rw_spouse", "rw_parents", "rw_siblings", "rw_children", "rw_fam",
             "rw_friends", "rw_coworkers", "rw_neighbors", "fedelec")
  b <- unique(d[surveynum %in% c(1, 7), c("id", "surveywave", basev), with = FALSE])
  b <- b[!duplicated(b, by = c("id", "surveywave"))]
  d <- merge(d, b, by = c("id", "surveywave"), all.x = TRUE, suffixes = c("", ".b"), sort = FALSE)
  matched <- d[, paste0(id, "_", surveywave)] %in% b[, paste0(id, "_", surveywave)]
  d <- d[matched]                                   # do-file: drop if _merge==1
  for (v in basev) {
    vb <- paste0(v, ".b"); i <- is.na(d[[v]])
    set(d, which(i), v, d[[vb]][i]); d[, (vb) := NULL]
  }

  # ---- 2. recode text answers (English and French questionnaires) ----------------------
  rw <- function(x) fcase(
    x == "Extremely left wing" | grepl("^Extr.*gauche$", x), 0,
    x == "Left wing" | x == "Gauche", 1,
    x == "Somewhat left wing" | x == "Un peu pour la gauche ", 2,
    x == "Neither left nor right wing" | x == "Ni gauche ni droite", 3,
    x == "Somewhat right wing" | x == "Un peu pour la droite", 4,
    x == "Right wing" | x == "Droite", 5,
    x == "Extremely right wing" | grepl("^Extr.*droite$", x), 6, default = NA_real_)
  for (x in c("self", "spouse", "parents", "siblings", "children", "fam", "friends",
              "coworkers", "neighbors")) {
    v <- paste0("rw_", x); set(d, NULL, v, rw(d[[v]]))
  }
  ag <- function(x) fcase(
    x == "Strongly disagree" | grepl("^Fortement en", x), 1,
    x == "Somewhat disagree" | grepl("^En d", x), 2,
    x == "Neither agree nor disagree" | grepl("^Ni d", x), 3,
    x == "Somewhat agree" | grepl("^D.{1,6}accord$", x), 4,
    x == "Strongly agree" | x == "Fortement d'accord", 5, default = NA_real_)
  Q <- paste0("agree_q", 1:20)
  for (v in Q) set(d, NULL, v, ag(d[[v]]))

  d[, french := as.numeric(language_mt %in% c("French", "Autre", "Anglais") | grepl("^Fran", language_mt))]
  d[language_survey != "English" & country == "CA", french := 1]
  d[, french := as.numeric(sum(french, na.rm = TRUE) >= 1), by = id]
  d[, native := as.numeric((country == "US" & birth_country %in% "United States") |
                           (country == "CA" & birth_country %in% "Canada"))]
  pat <- c(parents = "Parents", siblings = "Siblings|^.*Fr.*res et s",
           children = "Adult children|Enfants adultes")
  for (p in names(pat)) d[, paste0("discuss_", p) := as.numeric(grepl(pat[p], discuss_any))]
  d[, discuss_fam := as.numeric(grepl("Extended family|Famille", discuss_any))]
  d[, sa := social_any]
  d[, social_any := fcase(sa %in% c("No", "Non"), 1, sa %in% c("Yes, both", "Oui, les deux"), 2,
                          sa %in% c("Yes, family", "Oui, famille"), 3,
                          sa %in% c("Yes, friends", "Oui, les amis"), 4, default = NA_real_)]

  # ---- 3. Thanksgiving timing ----------------------------------------------------------
  # Dates in Stata days since 1 Jan 1960; the six Thanksgiving dates are hard-coded in the do-file.
  d[, date := as.numeric(as.Date(sprintf("%d-%02d-%02d", year, month, day)) - as.Date("1960-01-01"))]
  tg <- c(CA2019 = 21835, CA2021 = 22563, CA2022 = 22927, US2019 = 21881, US2021 = 22609, US2022 = 22973)
  d[, days_since := date - tg[paste0(country, year)]]
  d[, thanksgiving := as.numeric(!is.na(days_since) & days_since >= 0 & days_since <= 6)]

  # ---- 4. right-wing opinion index (k-nearest neighbours) ------------------------------
  # For every one of the choose(20,3) = 1140 triples of statements, people who answered all
  # three are classified into the self-placement (0-6) that is most common among their
  # k = 5 nearest neighbours (Euclidean distance on the 1-5 answers, training sample = all
  # people with a self-placement). Neighbours tied at the 5th distance are all included,
  # as -discrim knn- does. The index is the mean prediction over the triples a person
  # answered (8 statements shown per week -> 56 triples).
  set.seed(seed)
  y  <- d$rw_self
  A  <- as.matrix(d[, ..Q])
  grid <- as.matrix(expand.grid(1:5, 1:5, 1:5)); DD <- as.matrix(dist(grid))
  pred <- function(idx) {
    ok <- rowSums(is.na(A[, idx])) == 0; cell <- rep(NA_integer_, nrow(A))
    cell[ok] <- (A[ok, idx[1]] - 1) + 5 * (A[ok, idx[2]] - 1) + 25 * (A[ok, idx[3]] - 1) + 1L
    tr <- ok & !is.na(y)
    ct <- matrix(0, 125, 7); ct[, ] <- table(factor(cell[tr], 1:125), factor(y[tr], 0:6))
    nc <- rowSums(ct); out <- rep(NA_real_, 125)
    for (i in which(tabulate(cell[ok], 125) > 0)) {
      o <- order(DD[i, ]); cs <- cumsum(nc[o]); if (max(cs) < 5) next
      dk <- DD[i, o[which(cs >= 5)[1]]]; nb <- DD[i, ] <= dk + 1e-9
      v <- colSums(ct[nb, , drop = FALSE]); w <- which(v == max(v))
      if (length(w) == 1) out[i] <- w - 1
      else if (tiemode == "random") out[i] <- sample(w - 1, 1)
      else if (tiemode == "first") out[i] <- w[1] - 1
      # tiemode == "missing": stays NA
    }
    out[cell]
  }
  cmb <- combn(20, 3)
  R <- vapply(seq_len(ncol(cmb)), function(j) pred(cmb[, j]), numeric(nrow(A)))
  d[, rw_index := rowMeans(R, na.rm = TRUE)]; d[is.nan(rw_index), rw_index := NA]

  # Simple alternative index (used in the extension): for each statement and answer, the
  # average self-placement of everyone who gave that answer; averaged over the statements
  # the person saw that week. No neighbours, no ties.
  Alt <- sapply(Q, function(q) { m <- tapply(y, d[[q]], mean, na.rm = TRUE)
                                 as.numeric(m[as.character(d[[q]])]) })
  d[, rw_index_alt := rowMeans(Alt, na.rm = TRUE)]; d[is.nan(rw_index_alt), rw_index_alt := NA]

  # Data-quality flags (used in the extension; not in the original paper)
  # straightline: identical answer to every statement shown that week
  d[, straightline := apply(A, 1, function(x) { x <- x[!is.na(x)]; length(x) > 1 && length(unique(x)) == 1 })]
  ipn <- unique(d[!is.na(ip_id), .(ip_id, id)])[, .(n_ids = .N), by = ip_id]
  d <- merge(d, ipn, by = "ip_id", all.x = TRUE, sort = FALSE)
  d[, shared_ip := as.numeric(max(fcoalesce(n_ids, 1L)) > 1), by = id]

  # ---- 5. sample restrictions (in the order of the do-file) ----------------------------
  steps <- list()
  steps$raw <- n_raw; steps$merged <- nrow(d)
  d <- d[!is.na(rw_self)];                                            steps$own_orientation <- nrow(d)
  d[, tmp := rowMeans(cbind(rw_parents, rw_siblings, rw_children, rw_fam), na.rm = TRUE)]
  d <- d[!is.nan(tmp)];                                               steps$family_orientation <- nrow(d)
  d <- d[!is.na(rw_index)];                                           steps$opinion_index <- nrow(d)
  d <- d[french == 0];                                                steps$not_french <- nrow(d)
  d <- d[native == 1];                                                steps$native_born <- nrow(d)
  d[, cnt := .N, by = id]; d <- d[cnt > 1];                           steps$at_least_two_weeks <- nrow(d)
  d[, time := .GRP, by = .(year, surveynum)]                          # survey-week identifier

  keep <- c("id", "year", "surveynum", "country", "time", "days_since", "thanksgiving",
            "rw_index", "rw_index_alt", "rw_self", "rw_parents", "rw_siblings", "rw_children", "rw_fam",
            "discuss_parents", "discuss_siblings", "discuss_children", "discuss_fam", "social_any",
            "straightline", "shared_ip")
  setorder(d, id, year, surveynum)
  dir.create(outdir, showWarnings = FALSE, recursive = TRUE)
  fwrite(d[, ..keep], file.path(outdir, paste0("data_clean_", tag, ".csv")))
  invisible(list(n = nrow(d), ids = uniqueN(d$id), steps = unlist(steps)))
}
