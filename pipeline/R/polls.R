bind_polls <- function(
  election_dates,
  verian_polls,
  gallup_polls,
  epinion_polls
  parties
) {
  x <- bind_rows(verian_polls, gallup_polls, epinion_polls) |>
    mutate(
      kv01 = election_dates$valg_dato[1],
      kv05 = election_dates$valg_dato[2],
      kv09 = election_dates$valg_dato[3],
      kv13 = election_dates$valg_dato[4],
      kv17 = election_dates$valg_dato[5],
      kv21 = election_dates$valg_dato[6],
      kv25 = election_dates$valg_dato[7],
      fv26 = today(tz = "Europe/Copenhagen") + weeks(6),
      ttl_kv01 = kv01 - poll_date,
      ttl_kv05 = kv05 - poll_date,
      ttl_kv09 = kv09 - poll_date,
      ttl_kv13 = kv13 - poll_date,
      ttl_kv17 = kv17 - poll_date,
      ttl_kv21 = kv21 - poll_date,
      ttl_kv25 = kv25 - poll_date,
      ttl_fv26 = fv26 - poll_date
    ) |>
    mutate(
      across(
        where(~ inherits(.x, "difftime")),
        ~ replace(.x, .x < 0, as.difftime(NA_real_, units = attr(.x, "units")))
      )
    )

  ttl_cols <- x |> select(starts_with(c("ttl_kv", "ttl_fv"))) |> names()

  long_min <- x |>
    pivot_longer(
      cols = all_of(ttl_cols),
      names_to = "election",
      values_to = "time_to"
    ) |>
    filter(!is.na(time_to)) |>
    group_by(poll_date) |>
    slice_min(as.numeric(time_to, units = "days"), with_ties = FALSE) |>
    ungroup() |>
    mutate(
      days_out = as.numeric(time_to, units = "days"),
      election = sub("^ttl_", "", election)
    )

  kv_lookup <- x |>
    select(starts_with(c("kv", "fv"))) |>
    slice_head(n = 1) |>
    pivot_longer(
      everything(),
      names_to = "election_name",
      values_to = "election_date"
    )

  polls <- x |>
    left_join(
      long_min |>
        left_join(kv_lookup, by = c("election" = "election_name")) |>
        select(poll_date, election = election_date, days_out),
      by = "poll_date"
    ) |>
    mutate(days_out = as.difftime(days_out, units = "days")) |>
    select(-starts_with(c("ttl", "kv", "fv"))) |>
    arrange(desc(poll_date)) |>
    filter(party_code %in% parties$party_code)

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
