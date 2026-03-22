get_reference_party_code <- function(parties) {
  if ("A" %in% parties$party_code) {
    return("A")
  }

  parties |>
    slice_head(n = 1) |>
    pull(party_code)
}

get_forecast_parties <- function(parties, election_day) {
  active_parties <- parties |>
    filter(party_begin <= election_day) |>
    arrange(party_code)

  ref_party <- get_reference_party_code(active_parties)

  bind_rows(
    active_parties |> filter(party_code != ref_party),
    active_parties |> filter(party_code == ref_party)
  ) |>
    mutate(
      party_id = row_number(),
      stan_name = case_when(
        party_code == "Æ" ~ "ae",
        party_code == "Ø" ~ "oe",
        party_code == "Å" ~ "aa",
        .default = str_to_lower(party_code)
      )
    )
}

normalize_simplex <- function(x, eps = 1e-6) {
  x <- pmax(x, eps)
  x / sum(x)
}

alr_transform <- function(x) {
  x <- normalize_simplex(x)
  log(x[-length(x)] / x[length(x)])
}

inv_alr_transform <- function(z) {
  exp_z <- exp(c(z, 0))
  exp_z / sum(exp_z)
}

safe_party_share <- function(value, n_parties) {
  pmax(value, 5e-4)
}

allocate_by_largest_remainder <- function(votes, n_seats) {
  quota <- sum(votes) / n_seats

  if (quota <= 0) {
    return(rep(0L, length(votes)))
  }

  raw <- votes / quota
  seats <- floor(raw)

  remaining <- n_seats - sum(seats)

  if (remaining > 0) {
    remainders <- raw - seats
    order_idx <- order(remainders, decreasing = TRUE)
    seats[order_idx[seq_len(remaining)]] <- seats[order_idx[seq_len(remaining)]] + 1
  }

  seats
}

summarise_draw_quantiles <- function(x, probs = c(0.1, 0.5, 0.9)) {
  qs <- quantile(x, probs = probs, na.rm = TRUE)

  tibble(
    p10 = unname(qs[[1]]),
    median = unname(qs[[2]]),
    p90 = unname(qs[[3]])
  )
}
