assign_poll_election <- function(polls, election_dates, election_day) {
  forecast_election <- tibble(
    election_id = 999L,
    election_date = election_day,
    election = paste0("FV", year(election_day))
  )

  elections <- election_dates |>
    filter(valg_id != 999) |>
    transmute(
      election_id = as.integer(valg_id),
      election_date = valg_dato,
      election = valg
    ) |>
    arrange(election_date) |>
    bind_rows(forecast_election)

  next_idx <- findInterval(
    as.numeric(polls$poll_date),
    as.numeric(elections$election_date)
  ) + 1L

  next_idx <- pmin(next_idx, nrow(elections))

  polls |>
    mutate(
      election_id = elections$election_id[next_idx],
      election_date = elections$election_date[next_idx],
      election = elections$election[next_idx],
      days_out = as.numeric(difftime(election_date, poll_date, units = "days"))
    )
}

bind_polls <- function(
  election_dates,
  verian_polls,
  gallup_polls,
  epinion_polls,
  election_day,
  parties
) {
  polls <- bind_rows(verian_polls, gallup_polls, epinion_polls) |>
    mutate(
      poll_date = as_date(poll_date),
      value = as.numeric(value),
      n = as.numeric(n)
    ) |>
    select(-party_name) |>
    left_join(parties, by = "party_code") |>
    filter(
      party_code %in% parties$party_code,
      poll_date >= party_begin,
      poll_date <= election_day
    ) |>
    assign_poll_election(election_dates, election_day) |>
    arrange(desc(poll_date), pollster, segment, party_code) |>
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
      election_id,
      election_date,
      election,
      days_out
    )

  upload_polls(polls)

  polls
}

complete_poll_party_grid <- function(polls, forecast_parties) {
  poll_index <- polls |>
    distinct(
      poll_date,
      pollster,
      segment,
      n,
      election_id,
      election_date,
      election,
      days_out
    ) |>
    arrange(poll_date, pollster, segment) |>
    mutate(poll_id = row_number())

  poll_index |>
    crossing(forecast_parties |> select(party_code)) |>
    left_join(
      polls |>
        select(
          poll_date,
          pollster,
          segment,
          n,
          election_id,
          election_date,
          election,
          days_out,
          party_code,
          value
        ),
      by = c(
        "poll_date",
        "pollster",
        "segment",
        "n",
        "election_id",
        "election_date",
        "election",
        "days_out",
        "party_code"
      )
    ) |>
    mutate(value = coalesce(value, 0))
}

prepare_model_inputs <- function(
  polls,
  forecast_parties,
  election_day,
  lookback_days = 365,
  segment_filter = "all"
) {
  filtered_polls <- polls |>
    filter(
      election_date == election_day,
      segment == segment_filter,
      poll_date >= election_day - days(lookback_days),
      poll_date <= election_day,
      !is.na(n),
      n > 0
    )

  if (nrow(filtered_polls) == 0) {
    stop("No usable polls found for the requested election window.")
  }

  completed_polls <- complete_poll_party_grid(filtered_polls, forecast_parties) |>
    left_join(
      forecast_parties |>
        select(party_code, party_id, stan_name),
      by = "party_code"
    ) |>
    group_by(poll_id) |>
    mutate(
      share = value / 100,
      share = safe_party_share(share, n()),
      share = normalize_simplex(share),
      share_sum = sum(share)
    ) |>
    ungroup()

  first_poll_date <- min(completed_polls$poll_date)

  if (first_poll_date >= election_day) {
    first_poll_date <- election_day - days(1)
  }

  day_lookup <- tibble(
    poll_date = seq(first_poll_date, election_day, by = "day")
  ) |>
    mutate(day_id = row_number())

  pollster_lookup <- completed_polls |>
    distinct(pollster) |>
    arrange(pollster) |>
    mutate(pollster_id = row_number())

  poll_matrix <- completed_polls |>
    select(poll_id, party_id, share) |>
    pivot_wider(
      names_from = party_id,
      values_from = share,
      values_fill = 0
    ) |>
    arrange(poll_id)

  poll_metadata <- completed_polls |>
    distinct(
      poll_id,
      poll_date,
      pollster,
      n,
      election_date,
      election,
      days_out
    ) |>
    left_join(day_lookup, by = "poll_date") |>
    left_join(pollster_lookup, by = "pollster") |>
    arrange(poll_id)

  y_matrix <- poll_matrix |>
    select(-poll_id) |>
    as.matrix()

  z_matrix <- t(apply(y_matrix, 1, alr_transform))

  list(
    forecast_parties = forecast_parties,
    poll_metadata = poll_metadata,
    completed_polls = completed_polls,
    day_lookup = day_lookup,
    pollster_lookup = pollster_lookup,
    y = y_matrix,
    z = z_matrix
  )
}

diagnose_model_inputs <- function(
  polls,
  forecast_parties,
  election_day,
  lookback_days = 365,
  segment_filter = "all"
) {
  current_cycle <- polls |>
    filter(election_date == election_day)

  recent_cycle <- current_cycle |>
    filter(
      poll_date >= election_day - days(lookback_days),
      poll_date <= election_day
    )

  segment_drops <- current_cycle |>
    count(segment, name = "n_rows") |>
    mutate(
      kept_for_model = segment == segment_filter
    )

  diagnostics <- prepare_model_inputs(
    polls = polls,
    forecast_parties = forecast_parties,
    election_day = election_day,
    lookback_days = lookback_days,
    segment_filter = segment_filter
  )

  coverage_by_pollster <- diagnostics$poll_metadata |>
    count(pollster, name = "n_polls") |>
    arrange(desc(n_polls), pollster)

  coverage_by_party <- diagnostics$completed_polls |>
    group_by(party_code) |>
    summarise(
      n_observations = sum(value > 0, na.rm = TRUE),
      avg_share = mean(share, na.rm = TRUE),
      .groups = "drop"
    ) |>
    arrange(desc(avg_share))

  dropped_summary <- tibble(
    total_cycle_rows = nrow(current_cycle),
    recent_cycle_rows = nrow(recent_cycle),
    usable_poll_rows = nrow(diagnostics$completed_polls),
    usable_polls = nrow(diagnostics$poll_metadata),
    dropped_non_all_segments = sum(current_cycle$segment != segment_filter, na.rm = TRUE),
    dropped_missing_n = sum(is.na(recent_cycle$n) | recent_cycle$n <= 0, na.rm = TRUE)
  )

  simplex_check <- diagnostics$completed_polls |>
    group_by(poll_id) |>
    summarise(simplex_sum = sum(share), .groups = "drop")

  message(glue(
    "Prepared {nrow(diagnostics$poll_metadata)} polls across ",
    "{nrow(diagnostics$pollster_lookup)} pollsters and ",
    "{nrow(diagnostics$forecast_parties)} parties."
  ))
  message(glue(
    "Dropped {dropped_summary$dropped_non_all_segments} non-`{segment_filter}` rows ",
    "and {dropped_summary$dropped_missing_n} rows with invalid sample sizes."
  ))

  list(
    segment_drops = segment_drops,
    coverage_by_pollster = coverage_by_pollster,
    coverage_by_party = coverage_by_party,
    dropped_summary = dropped_summary,
    simplex_check = simplex_check
  )
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

  safe_db_write_table(
    con = con,
    name = "polls",
    value = polls |>
      mutate(days_out = as.character(days_out)),
    overwrite = TRUE
  )

  dbDisconnect(con)
}

get_latest_poll <- function(polls) {
  con <- connect_to_db()

  latest_poll <- polls |>
    filter(poll_date == max(poll_date), segment == "all") |>
    mutate(days_out = as.character(days_out))

  message(glue(
    "Writing latest_poll with {nrow(latest_poll)} rows and max poll_date={max(latest_poll$poll_date)}."
  ))

  safe_db_write_table(
    con = con,
    name = "latest_poll",
    value = latest_poll,
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
      n_polls = n(),
      .groups = "drop"
    ) |>
    filter(segment == "all") |>
    left_join(parties, by = "party_code") |>
    mutate(updated_at = now())

  safe_db_write_table(
    con = con,
    name = "weighted_poll",
    value = weighted_poll,
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
