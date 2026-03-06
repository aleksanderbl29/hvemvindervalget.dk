bind_polls <- function(
  election_dates,
  verian_polls,
  gallup_polls,
  epinion_polls,
  election_day,
  parties
) {
  polls <- bind_rows(verian_polls, gallup_polls, epinion_polls) |>
    select(-party_name) |>
    left_join(parties, by = "party_code") |>
    filter(poll_date >= party_begin) |>
    mutate(
      fv26 = election_day,
      days_out = election_day - poll_date
    ) |>
    mutate(
      across(
        where(~ inherits(.x, "difftime")),
        ~ replace(.x, .x < 0, as.difftime(NA_real_, units = attr(.x, "units")))
      )
    ) |>
    mutate(days_out = as.difftime(days_out, units = "days")) |>
    arrange(desc(poll_date)) |>
    filter(party_code %in% parties$party_code) |>
    select(
      party_code,
      poll_date,
      value,
      segment,
      pollster,
      n,
      party_name,
      party_name_short,
      l_r_scale,
      days_out
    )

  upload_polls(polls)

  polls
}

wide_polls <- function(polls) {
  polls |>
    distinct() |>
    filter(
      party_code %in%
        c("A", "B", "C", "F", "I", "M", "O", "V", "Æ", "Ø", "Å", "H"),
    ) |>
    select(-party_name) |>
    pivot_wider(
      names_from = c("party_code"),
      values_from = "value",
      values_fn = mean
    )
}

upload_polls <- function(polls) {
  con <- connect_to_db()

  dbWriteTable(
    con,
    "polls",
    polls |>
      mutate(days_out = str(days_out)),
    overwrite = TRUE
  )

  dbDisconnect(con)
}

get_latest_poll <- function(polls) {
  con <- connect_to_db()

  latest_poll <- polls |>
    filter(poll_date == max(poll_date), segment == "all") |>
    mutate(days_out = str(days_out))

  dbWriteTable(
    con,
    "latest_poll",
    latest_poll,
    overwrite = TRUE
  )

  dbDisconnect(con)

  latest_poll
}

weight_poll <- function(polls, parties, half_life) {
  con <- connect_to_db()

  weighted_poll <- polls |>
    mutate(
      age_days = as.numeric(Sys.Date() - poll_date),
      w_time = 0.5^(age_days / half_life),
      w_sample = sqrt(n),
      weight = w_time * w_sample
    ) |>
    group_by(party_code, segment) |>
    summarise(
      voteshare = weighted_mean(value, weight),
    ) |>
    filter(segment == "all") |>
    left_join(parties)

  dbWriteTable(
    con,
    "weighted_poll",
    weighted_poll,
    overwrite = TRUE
  )

  dbDisconnect(con)

  weighted_poll
}

weighted_mean <- function(x, w) sum(x * w) / sum(w)

# A
# Å
# Æ
# B
# C
# F
# H
# I
# M
# O
# Ø
# V
# D
# K
# Q
# G
# E
# P
# Z
# U
# Y
# R
# S
# L
