get_national_results <- function(election_results, forecast_parties) {
  message(glue(
    "Building national results from {nrow(election_results)} election rows ",
    "for {nrow(forecast_parties)} forecast parties."
  ))

  total_votes <- election_results |>
    group_by(valg, date) |>
    summarise(total_votes = sum(votes, na.rm = TRUE), .groups = "drop")

  vote_totals <- election_results |>
    filter(party_code %in% forecast_parties$party_code) |>
    group_by(valg, date, party_code) |>
    summarise(votes = sum(votes, na.rm = TRUE), .groups = "drop")

  election_grid <- election_results |>
    distinct(valg, date) |>
    crossing(party_code = forecast_parties$party_code)

  election_grid |>
    left_join(vote_totals, by = c("valg", "date", "party_code")) |>
    mutate(votes = coalesce(votes, 0)) |>
    left_join(total_votes, by = c("valg", "date")) |>
    left_join(
      forecast_parties |>
        select(party_code, party_name, party_name_short, party_id),
      by = "party_code"
    ) |>
    mutate(voteshare = votes / total_votes) |>
    arrange(date, party_id)
}

build_national_prior <- function(
  national_results,
  forecast_parties,
  house_effects
) {
  history_matrix <- national_results |>
    select(date, party_id, voteshare) |>
    pivot_wider(
      names_from = party_id,
      values_from = voteshare,
      values_fill = 0
    ) |>
    arrange(date)

  vote_history <- history_matrix |>
    select(-date) |>
    as.matrix()

  smoothed_history <- t(apply(vote_history, 1, normalize_simplex))
  alr_history <- t(apply(smoothed_history, 1, alr_transform))

  alr_swings <- diff(alr_history)

  prior_mean <- alr_history[nrow(alr_history), ]

  if (is.null(dim(alr_swings))) {
    alr_swings <- matrix(alr_swings, nrow = 1)
  }

  innovation_scale <- if (nrow(alr_swings) > 1) {
    apply(alr_swings, 2, sd, na.rm = TRUE)
  } else {
    rep(0.15, ncol(alr_history))
  }

  innovation_scale <- pmax(innovation_scale, 0.05)
  prior_sd <- pmax(innovation_scale * 2, 0.10)

  correlation_matrix <- if (nrow(alr_swings) > 1) {
    cor(alr_swings)
  } else {
    diag(ncol(alr_history))
  }

  correlation_matrix[is.na(correlation_matrix)] <- 0
  diag(correlation_matrix) <- 1

  vote_share_sd <- apply(smoothed_history, 2, sd, na.rm = TRUE)
  vote_share_sd[is.na(vote_share_sd)] <- 0.01
  vote_share_sd <- pmax(vote_share_sd, 0.01)

  vote_share_prior <- tibble(
    party_code = forecast_parties$party_code,
    party_name = forecast_parties$party_name,
    vote_share_mean = inv_alr_transform(prior_mean),
    vote_share_sd = vote_share_sd
  )

  house_scale <- forecast_parties |>
    left_join(
      house_effects$party_summary |>
        select(party_code, house_effect_scale),
      by = "party_code"
    ) |>
    arrange(party_id) |>
    mutate(house_effect_scale = coalesce(house_effect_scale, 0.02)) |>
    pull(house_effect_scale)

  list(
    forecast_parties = forecast_parties,
    national_results = national_results,
    alr_history = alr_history,
    prior_mean = prior_mean,
    prior_sd = prior_sd,
    innovation_scale = innovation_scale,
    correlation_matrix = correlation_matrix,
    house_scale = house_scale[-length(house_scale)],
    vote_share_prior = vote_share_prior
  )
}

compare_prior_to_polling <- function(national_prior, weighted_poll) {
  weighted_poll |>
    transmute(
      party_code,
      current_weighted_poll = voteshare / 100
    ) |>
    right_join(
      national_prior$vote_share_prior,
      by = "party_code"
    ) |>
    mutate(
      prior_gap = current_weighted_poll - vote_share_mean
    ) |>
    arrange(desc(abs(prior_gap)))
}
