calc_house_effects <- function(
  election_results,
  election_dates,
  polls,
  parties,
  max_days_out = 60
) {
  latest_historical_election <- election_dates |>
    filter(valg_id != 999) |>
    summarise(latest_election = max(valg_dato)) |>
    pull(latest_election)

  national_results <- election_results |>
    filter(party_code %in% parties$party_code) |>
    group_by(date, party_code, party_name) |>
    summarise(
      votes = sum(votes, na.rm = TRUE),
      total_votes = sum(total_votes, na.rm = TRUE),
      result_share = 100 * votes / total_votes,
      .groups = "drop"
    )

  raw_house_effects <- polls |>
    filter(
      segment == "all",
      election_date <= latest_historical_election,
      days_out >= 0,
      days_out <= max_days_out
    ) |>
    inner_join(
      national_results,
      by = c("election_date" = "date", "party_code")
    ) |>
    mutate(
      party_name = coalesce(party_name.y, party_name.x),
      house_effect = result_share - value,
      abs_house_effect = abs(house_effect)
    ) |>
    select(-matches("party_name\\.[xy]$"))

  pollster_party_summary <- raw_house_effects |>
    group_by(pollster, party_code, party_name) |>
    summarise(
      mean_bias = mean(house_effect, na.rm = TRUE),
      bias_sd = sd(house_effect, na.rm = TRUE),
      rmse = sqrt(mean(house_effect^2, na.rm = TRUE)),
      n_observations = n(),
      .groups = "drop"
    ) |>
    mutate(
      bias_sd = coalesce(bias_sd, rmse, 1),
      rmse = coalesce(rmse, bias_sd, 1)
    )

  party_summary <- pollster_party_summary |>
    group_by(party_code, party_name) |>
    summarise(
      avg_abs_bias = mean(abs(mean_bias), na.rm = TRUE),
      avg_rmse = mean(rmse, na.rm = TRUE),
      house_effect_scale = pmax(mean(rmse, na.rm = TRUE) / 100, 0.01),
      .groups = "drop"
    )

  message(glue(
    "Calculated {nrow(raw_house_effects)} historical poll-party observations ",
    "for {nrow(pollster_party_summary)} pollster-party house-effect estimates."
  ))

  list(
    raw = raw_house_effects,
    pollster_party_summary = pollster_party_summary,
    party_summary = party_summary
  )
}

# tar_read(house_effects) |>
#   group_by(kommune) |>
#   ggplot(aes(valgsted_delta, pollster, color = party_code)) +
#   geom_jitter()
