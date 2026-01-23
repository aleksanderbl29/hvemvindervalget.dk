web_plot_polls <- function(polls, parties) {
  con <- connect_to_db()

  plot <- polls |>
    filter(
      party_code %in% parties$party_code,
      segment == "all"
    ) |>
    ggplot(aes(
      x = poll_date,
      y = value,
      color = party_code
    )) +
    geom_point() + #aes(shape = pollster), show.legend = FALSE) +
    geom_line() +
    labs(x = NULL, y = NULL, shape = NULL, color = "Parti") +
    scale_color_manual(
      values = parties$party_color
    ) +
    theme_bw()

  plotly_plot <- ggplotly(plot) |>
    hide_legend()

  dbAppendTable(
    con,
    "plots",
    tibble(
      name = "polls",
      plotly_json = plotly_json(plotly_plot, jsonedit = FALSE),
      last_update = Sys.time()
    )
  )

  dbDisconnect(con)

  plotly_plot
}
