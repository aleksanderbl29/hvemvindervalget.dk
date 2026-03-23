get_folketing_seat_metadata <- function() {
  constituencies <- tribble(
    ~landsdel_nr, ~landsdel, ~storkreds_nr, ~storkreds, ~constituency_seats,
    1L, "Hovedstaden", 1L, "Kobenhavns Storkreds", 17L,
    1L, "Hovedstaden", 2L, "Kobenhavns Omegns Storkreds", 11L,
    1L, "Hovedstaden", 3L, "Nordsjaellands Storkreds", 10L,
    1L, "Hovedstaden", 4L, "Bornholms Storkreds", 2L,
    2L, "Sjalland-Syddanmark", 5L, "Sjallands Storkreds", 20L,
    2L, "Sjalland-Syddanmark", 6L, "Fyns Storkreds", 12L,
    2L, "Sjalland-Syddanmark", 7L, "Sydjyllands Storkreds", 17L,
    3L, "Midtjylland-Nordjylland", 8L, "Ostjyllands Storkreds", 19L,
    3L, "Midtjylland-Nordjylland", 9L, "Vestjyllands Storkreds", 13L,
    3L, "Midtjylland-Nordjylland", 10L, "Nordjyllands Storkreds", 14L
  )

  geodk_constituencies <- tryCatch(
    geodk::constituencies() |>
      sf::st_drop_geometry() |>
      janitor::clean_names(),
    error = function(e) NULL
  )

  if (!is.null(geodk_constituencies)) {
    name_col <- intersect(c("name", "navn"), names(geodk_constituencies))

    if (length(name_col) == 1 && nrow(geodk_constituencies) == 10) {
      geodk_names <- geodk_constituencies |>
        transmute(storkreds = .data[[name_col]]) |>
        mutate(storkreds_clean = janitor::make_clean_names(storkreds))

      constituencies <- constituencies |>
        mutate(storkreds_clean = janitor::make_clean_names(storkreds)) |>
        left_join(geodk_names, by = "storkreds_clean", suffix = c("_local", "_geodk")) |>
        mutate(storkreds = coalesce(storkreds_geodk, storkreds_local)) |>
        select(-storkreds_clean, -storkreds_local, -storkreds_geodk)
    }
  }

  provinces <- constituencies |>
    distinct(landsdel_nr, landsdel) |>
    mutate(
      compensatory_seats = c(12L, 14L, 14L),
      total_seats = c(52L, 63L, 60L)
    )

  list(
    constituencies = constituencies,
    provinces = provinces,
    total_seats = 175L
  )
}

get_latest_storkreds_baseline <- function(election_results, forecast_parties) {
  latest_election_date <- max(election_results$date)
  seat_metadata <- get_folketing_seat_metadata()

  total_votes <- election_results |>
    filter(date == latest_election_date) |>
    group_by(landsdel_nr, storkreds_nr) |>
    summarise(total_votes = sum(votes, na.rm = TRUE), .groups = "drop")

  national_total_votes <- sum(total_votes$total_votes)

  party_votes <- election_results |>
    filter(
      date == latest_election_date,
      party_code %in% forecast_parties$party_code
    ) |>
    group_by(landsdel_nr, storkreds_nr, party_code) |>
    summarise(votes = sum(votes, na.rm = TRUE), .groups = "drop") |>
    right_join(
      seat_metadata$constituencies |>
        select(landsdel_nr, storkreds_nr) |>
        crossing(party_code = forecast_parties$party_code),
      by = c("landsdel_nr", "storkreds_nr", "party_code")
    ) |>
    mutate(votes = coalesce(votes, 0)) |>
    left_join(total_votes, by = c("landsdel_nr", "storkreds_nr")) |>
    left_join(
      forecast_parties |>
        select(party_code, party_id, party_name_short),
      by = "party_code"
    ) |>
    mutate(
      storkreds_share = votes / total_votes,
      storkreds_vote_weight = total_votes / national_total_votes
    )

  national_baseline <- party_votes |>
    group_by(party_code, party_id, party_name_short) |>
    summarise(votes = sum(votes), .groups = "drop") |>
    mutate(
      national_share = votes / sum(votes)
    )

  list(
    latest_election_date = latest_election_date,
    storkreds_votes = party_votes,
    national_baseline = national_baseline
  )
}

allocate_divisor_seats <- function(votes, n_seats, divisor_fn) {
  seat_counts <- rep(0L, length(votes))

  if (n_seats <= 0 || sum(votes) <= 0) {
    return(seat_counts)
  }

  for (seat_idx in seq_len(n_seats)) {
    quotients <- votes / divisor_fn(seat_counts)
    winner <- which.max(quotients)
    seat_counts[winner] <- seat_counts[winner] + 1L
  }

  seat_counts
}

project_vote_draw_to_storkreds <- function(draw_votes, baseline) {
  draw_vector <- draw_votes |>
    arrange(party_id) |>
    pull(vote_share)

  names(draw_vector) <- draw_votes |>
    arrange(party_id) |>
    pull(party_code)

  baseline_national <- baseline$national_baseline |>
    arrange(party_id)

  projected_votes <- baseline$storkreds_votes |>
    left_join(
      baseline_national |>
        select(party_code, national_share),
      by = "party_code"
    ) |>
    group_by(landsdel_nr, storkreds_nr) |>
    mutate(
      draw_share = draw_vector[party_code],
      stabilized_raw = case_when(
        national_share > 1e-6 ~
          0.85 * storkreds_share * (draw_share / national_share) +
            0.15 * draw_share * storkreds_vote_weight,
        .default = draw_share * storkreds_vote_weight
      ),
      projected_share = normalize_simplex(stabilized_raw),
      projected_votes = projected_share * first(total_votes)
    ) |>
    ungroup()

  projected_votes
}

compute_party_eligibility <- function(
  projected_votes,
  seat_metadata,
  constituency_seats_by_party
) {
  national_votes <- projected_votes |>
    group_by(party_code, party_id) |>
    summarise(votes = sum(projected_votes), .groups = "drop")

  province_votes <- projected_votes |>
    group_by(landsdel_nr, party_code, party_id) |>
    summarise(votes = sum(projected_votes), .groups = "drop")

  province_totals <- projected_votes |>
    group_by(landsdel_nr) |>
    summarise(total_votes = sum(projected_votes), .groups = "drop") |>
    left_join(
      seat_metadata$provinces |>
        select(landsdel_nr, constituency_seats = total_seats, compensatory_seats),
      by = "landsdel_nr"
    ) |>
    mutate(constituency_seats = constituency_seats - compensatory_seats)

  province_threshold_hits <- province_votes |>
    left_join(province_totals, by = "landsdel_nr") |>
    mutate(meets_province_threshold = votes >= total_votes / constituency_seats) |>
    group_by(party_code, party_id) |>
    summarise(
      province_hits = sum(meets_province_threshold),
      .groups = "drop"
    )

  constituency_winners <- constituency_seats_by_party |>
    group_by(party_code, party_id) |>
    summarise(constituency_seats = sum(constituency_seats), .groups = "drop")

  eligibility <- national_votes |>
    mutate(national_share = votes / sum(votes)) |>
    left_join(province_threshold_hits, by = c("party_code", "party_id")) |>
    left_join(constituency_winners, by = c("party_code", "party_id")) |>
    mutate(
      province_hits = coalesce(province_hits, 0L),
      constituency_seats = coalesce(constituency_seats, 0L),
      eligible = constituency_seats > 0 |
        province_hits >= 2 |
        national_share >= 0.02
    )

  eligibility
}

allocate_compensatory_province_seats <- function(
  projected_votes,
  seat_metadata,
  constituency_seats_by_party,
  party_total_seats
) {
  province_votes <- projected_votes |>
    group_by(landsdel_nr, party_code, party_id) |>
    summarise(votes = sum(projected_votes), .groups = "drop")

  province_constituency <- constituency_seats_by_party |>
    group_by(landsdel_nr, party_code, party_id) |>
    summarise(constituency_seats = sum(constituency_seats), .groups = "drop")

  province_grid <- expand_grid(
    landsdel_nr = seat_metadata$provinces$landsdel_nr,
    party_id = party_total_seats$party_id
  ) |>
    left_join(
      party_total_seats |>
        select(party_id, party_code, total_seats),
      by = "party_id"
    ) |>
    left_join(province_votes, by = c("landsdel_nr", "party_id", "party_code")) |>
    left_join(province_constituency, by = c("landsdel_nr", "party_id", "party_code")) |>
    mutate(
      votes = coalesce(votes, 0),
      constituency_seats = coalesce(constituency_seats, 0L)
    )

  party_quota <- party_total_seats |>
    mutate(compensatory_seats = pmax(total_seats - constituency_seats, 0L)) |>
    arrange(party_id)

  province_quota <- seat_metadata$provinces |>
    arrange(landsdel_nr) |>
    pull(compensatory_seats)

  assigned <- matrix(
    0L,
    nrow = nrow(party_quota),
    ncol = nrow(seat_metadata$provinces),
    dimnames = list(party_quota$party_id, seat_metadata$provinces$landsdel_nr)
  )

  party_constituency_matrix <- province_grid |>
    select(party_id, landsdel_nr, constituency_seats) |>
    pivot_wider(
      names_from = landsdel_nr,
      values_from = constituency_seats,
      values_fill = 0
    ) |>
    arrange(party_id) |>
    select(-party_id) |>
    as.matrix()

  party_vote_matrix <- province_grid |>
    select(party_id, landsdel_nr, votes) |>
    pivot_wider(
      names_from = landsdel_nr,
      values_from = votes,
      values_fill = 0
    ) |>
    arrange(party_id) |>
    select(-party_id) |>
    as.matrix()

  total_compensatory_seats <- sum(party_quota$compensatory_seats)

  if (total_compensatory_seats > 0) {
    for (seat_idx in seq_len(total_compensatory_seats)) {
      quotients <- matrix(
        -Inf,
        nrow = nrow(assigned),
        ncol = ncol(assigned)
      )

      for (party_idx in seq_len(nrow(assigned))) {
        if (sum(assigned[party_idx, ]) >= party_quota$compensatory_seats[party_idx]) {
          next
        }

        for (province_idx in seq_len(ncol(assigned))) {
          if (sum(assigned[, province_idx]) >= province_quota[province_idx]) {
            next
          }

          total_existing <- party_constituency_matrix[party_idx, province_idx] +
            assigned[party_idx, province_idx]

          quotients[party_idx, province_idx] <-
            party_vote_matrix[party_idx, province_idx] / (2 * total_existing + 1)
        }
      }

      winner <- which(quotients == max(quotients), arr.ind = TRUE)[1, ]
      assigned[winner[1], winner[2]] <- assigned[winner[1], winner[2]] + 1L
    }
  }

  province_assignments <- as_tibble(assigned, rownames = "party_id") |>
    mutate(party_id = as.integer(party_id)) |>
    pivot_longer(
      cols = -party_id,
      names_to = "landsdel_nr",
      values_to = "compensatory_seats"
    ) |>
    mutate(landsdel_nr = as.integer(landsdel_nr)) |>
    left_join(
      party_quota |>
        select(party_id, party_code),
      by = "party_id"
    )

  province_assignments
}

allocate_compensatory_storkreds_seats <- function(
  projected_votes,
  seat_metadata,
  constituency_seats_by_party,
  province_compensatory
) {
  storkreds_constituency <- constituency_seats_by_party |>
    select(landsdel_nr, storkreds_nr, party_code, party_id, constituency_seats)

  storkreds_votes <- projected_votes |>
    group_by(landsdel_nr, storkreds_nr, party_code, party_id) |>
    summarise(votes = sum(projected_votes), .groups = "drop")

  constituency_grid <- expand_grid(
    storkreds_nr = seat_metadata$constituencies$storkreds_nr,
    party_id = unique(province_compensatory$party_id)
  ) |>
    left_join(
      seat_metadata$constituencies |>
        select(landsdel_nr, storkreds_nr),
      by = "storkreds_nr"
    ) |>
    left_join(
      province_compensatory |>
        select(party_id, party_code),
      by = "party_id"
    ) |>
    distinct() |>
    left_join(storkreds_votes, by = c("landsdel_nr", "storkreds_nr", "party_id", "party_code")) |>
    left_join(
      storkreds_constituency,
      by = c("landsdel_nr", "storkreds_nr", "party_id", "party_code")
    ) |>
    mutate(
      votes = coalesce(votes, 0),
      constituency_seats = coalesce(constituency_seats, 0L)
    )

  assignments <- list()

  for (province_id in unique(province_compensatory$landsdel_nr)) {
    province_storkredse <- seat_metadata$constituencies |>
      filter(landsdel_nr == province_id) |>
      arrange(storkreds_nr) |>
      pull(storkreds_nr)

    province_parties <- province_compensatory |>
      filter(landsdel_nr == province_id, compensatory_seats > 0)

    for (row_idx in seq_len(nrow(province_parties))) {
      party_id <- province_parties$party_id[row_idx]
      party_code <- province_parties$party_code[row_idx]
      seats_to_allocate <- province_parties$compensatory_seats[row_idx]

      province_votes <- constituency_grid |>
        filter(landsdel_nr == province_id, party_id == !!party_id) |>
        arrange(storkreds_nr)

      assigned <- rep(0L, length(province_storkredse))
      names(assigned) <- province_storkredse

      if (seats_to_allocate > 0) {
        for (seat_idx in seq_len(seats_to_allocate)) {
          quotients <- province_votes$votes /
            (1 + 3 * (province_votes$constituency_seats + assigned))

          winner_idx <- which.max(quotients)
          assigned[winner_idx] <- assigned[winner_idx] + 1L
        }
      }

      assignments[[length(assignments) + 1L]] <- tibble(
        landsdel_nr = province_id,
        storkreds_nr = province_storkredse,
        party_id = party_id,
        party_code = party_code,
        compensatory_seats = assigned
      )
    }
  }

  bind_rows(assignments)
}

simulate_folketing_seats <- function(
  vote_forecast_draws,
  election_results,
  forecast_parties
) {
  seat_metadata <- get_folketing_seat_metadata()
  baseline <- get_latest_storkreds_baseline(election_results, forecast_parties)

  draw_ids <- vote_forecast_draws |>
    distinct(.draw) |>
    arrange(.draw) |>
    pull(.draw)

  seat_results <- vector("list", length(draw_ids))

  for (draw_idx in seq_along(draw_ids)) {
    draw_id <- draw_ids[draw_idx]

    draw_votes <- vote_forecast_draws |>
      filter(.draw == draw_id) |>
      distinct(.draw, party_id, party_code, party_name, party_name_short, vote_share)

    projected_votes <- project_vote_draw_to_storkreds(draw_votes, baseline)

    constituency_allocations <- projected_votes |>
      left_join(
        seat_metadata$constituencies |>
          select(landsdel_nr, storkreds_nr, constituency_seats_total = constituency_seats),
        by = c("landsdel_nr", "storkreds_nr")
      ) |>
      group_by(landsdel_nr, storkreds_nr) |>
      group_modify(~ {
        seat_counts <- allocate_divisor_seats(
          votes = .x$projected_votes,
          n_seats = first(.x$constituency_seats_total),
          divisor_fn = function(seats) seats + 1
        )

        .x |>
          mutate(constituency_seats = seat_counts)
      }) |>
      ungroup()

    constituency_by_party <- constituency_allocations |>
      group_by(landsdel_nr, storkreds_nr, party_code, party_id) |>
      summarise(constituency_seats = sum(constituency_seats), .groups = "drop")

    eligibility <- compute_party_eligibility(
      projected_votes = projected_votes,
      seat_metadata = seat_metadata,
      constituency_seats_by_party = constituency_by_party
    )

    eligible_votes <- projected_votes |>
      inner_join(
        eligibility |>
          filter(eligible) |>
          select(party_code, party_id),
        by = c("party_code", "party_id")
      )

    party_total_seats <- eligible_votes |>
      group_by(party_code, party_id) |>
      summarise(votes = sum(projected_votes), .groups = "drop") |>
      mutate(total_seats = allocate_by_largest_remainder(votes, seat_metadata$total_seats)) |>
      left_join(
        constituency_by_party |>
          group_by(party_code, party_id) |>
          summarise(constituency_seats = sum(constituency_seats), .groups = "drop"),
        by = c("party_code", "party_id")
      ) |>
      mutate(constituency_seats = coalesce(constituency_seats, 0L))

    province_compensatory <- allocate_compensatory_province_seats(
      projected_votes = eligible_votes,
      seat_metadata = seat_metadata,
      constituency_seats_by_party = constituency_by_party |>
        semi_join(eligibility |> filter(eligible), by = c("party_code", "party_id")),
      party_total_seats = party_total_seats
    )

    storkreds_compensatory <- allocate_compensatory_storkreds_seats(
      projected_votes = eligible_votes,
      seat_metadata = seat_metadata,
      constituency_seats_by_party = constituency_by_party |>
        semi_join(eligibility |> filter(eligible), by = c("party_code", "party_id")),
      province_compensatory = province_compensatory
    )

    total_seats <- draw_votes |>
      select(party_id, party_code, party_name, party_name_short) |>
      left_join(
        party_total_seats |>
          select(party_id, total_seats, constituency_seats),
        by = "party_id"
      ) |>
      left_join(
        storkreds_compensatory |>
          group_by(party_id) |>
          summarise(compensatory_seats = sum(compensatory_seats), .groups = "drop"),
        by = "party_id"
      ) |>
      mutate(
        .draw = draw_id,
        constituency_seats = coalesce(constituency_seats, 0L),
        compensatory_seats = coalesce(compensatory_seats, 0L),
        total_seats = coalesce(total_seats, 0L)
      )

    seat_results[[draw_idx]] <- total_seats
  }

  bind_rows(seat_results) |>
    arrange(.draw, desc(total_seats), party_code)
}

summarise_seat_draws <- function(seat_draws) {
  seat_draws |>
    group_by(party_code, party_name, party_name_short) |>
    summarise(
      mean_seats = mean(total_seats),
      p10 = quantile(total_seats, 0.1),
      median_seats = quantile(total_seats, 0.5),
      p90 = quantile(total_seats, 0.9),
      win_constituency_seat_prob = mean(constituency_seats > 0),
      .groups = "drop"
    ) |>
    arrange(desc(mean_seats))
}
