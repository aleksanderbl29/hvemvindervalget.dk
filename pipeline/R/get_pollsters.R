get_pollsters <- function(polls) {
  con <- connect_to_db()

  pollsters <- polls |>
    filter(segment == "all") |>
    group_by(pollster) |>
    summarise(
      timerange_min = min(poll_date) |> year(),
      timerange_max = max(poll_date) |> year(),
      n_polls = n()
    ) |>
    mutate(timerange = glue("{timerange_min} til {timerange_max}")) |>
    select(name = pollster, n_polls, timerange)

  con |>
    tbl("pollsters") |>
    rows_upsert(pollsters, copy = TRUE)

  dbDisconnect(con)

  pollsters
}
