request_headers <- list(
  # "X-Election-ID" = "1705ff7b-7390-48d8-b701-6bcd430dc835", #kv25
  "X-Election-ID" = "47b883ef-d0d3-4cb6-9da5-91963f0e9ba0", #fv26
  # "X-Election-ID" = "987875fe-0dae-42ac-be5b-62cf0bd5d65e", #fv22
  "Cookie" = paste0(
    "NSC_mc_wt_wbm_qspe=",
    "0dde57ead4f0f501e1df555e53be196b"
    # this random string was generated with:
    # paste0(sample(c(0:9, letters[1:6]), 32, replace = TRUE), collapse = "")
  )
)

safe_valg_request <- function(request_obj, context) {
  tryCatch(
    request_obj |>
      req_perform(),
    error = function(e) {
      message(glue("valg.dk request failed for {context}: {conditionMessage(e)}"))
      NULL
    }
  )
}

get_map_area_name <- function(x) {
  if ("name" %in% names(x)) {
    return(x |> pull(name))
  }

  if ("displayName" %in% names(x)) {
    return(x |> pull(displayName))
  }

  if ("code" %in% names(x)) {
    return(x |> pull(code))
  }

  return(NA_character_)
}

normalize_map_area_names <- function(x) {
  x <- as_tibble(x)

  if (!("name" %in% names(x))) {
    if ("displayName" %in% names(x)) {
      x <- x |> mutate(name = displayName)
    } else if ("code" %in% names(x)) {
      x <- x |> mutate(name = code)
    } else {
      x <- x |> mutate(name = NA_character_)
    }
  }

  x
}

get_election_overview <- function(
  # base_url = "https://valg.dk/api/overview/kv-election-overview"
  base_url = "https://valg.dk/api/overview/ge-election-overview"
) {
  last_update <- request(base_url) |>
    req_headers(!!!request_headers) |>
    req_perform() |>
    resp_body_string() |>
    jsonlite::fromJSON() |>
    _$voteCountStatusDto$recentUpdateTimestamp |>
    as_datetime()

  request(base_url) |>
    req_headers(!!!request_headers) |>
    req_perform() |>
    resp_body_string() |>
    jsonlite::fromJSON() |>
    # _$municipalities |>
    _$mapAreaDtoList |>
    normalize_map_area_names() |>
    mutate(lastUpdate = as_datetime(last_update))
}

get_data_csv <- function(
  municipality_id
) {
  # base_url <- "https://valg.dk/api/export-data/export-kv-data-csv"
  base_url <- "https://valg.dk/api/export-data/export-ge-data-csv"
  election_id <- "47b883ef-d0d3-4cb6-9da5-91963f0e9ba0"

  url <- paste0(
    base_url,
    "?",
    "ElectionId=",
    election_id,
    "&",
    "MunicipalityId=",
    municipality_id |> pull(id)
  )

  message(glue(
    "Fetching valg.dk export for municipality_id={municipality_id |> pull(id)} ",
    "with election_id={election_id}."
  ))

  response <- request(url) |>
    req_headers(!!!request_headers) |>
    safe_valg_request(
      context = glue("get_data_csv({municipality_id |> pull(id)})")
    )

  if (is.null(response)) {
    return(tibble(
      municipality = get_map_area_name(municipality_id),
      municipality_id = municipality_id |> pull(id),
      last_pull = now(),
      status = "request_failed"
    ))
  }

  x <- response |>
    resp_body_string() |>
    read_csv2(col_types = cols("c", "c", "c", "c", "d")) |>
    janitor::clean_names() |>
    mutate(
      municipality = get_map_area_name(municipality_id),
      municipality_id = municipality_id |> pull(id),
      last_pull = now(),
      status = "ok"
    )

  Sys.sleep(api_sleep_time)

  return(x)
}
# "https://valg.dk/api/export-data/export-kv-data-csv?
# ElectionId=1705ff7b-7390-48d8-b701-6bcd430dc835
# &
# MunicipalityId=613bbb61-4de7-426d-a1a9-e6ffbaf41140"

get_coalitions <- function(municipality_id) {
  url <- paste0(
    "https://valg.dk/api/detail/municipality/",
    municipality_id |> pull(id)
  )

  message(glue(
    "Fetching valg.dk coalitions for municipality_id={municipality_id |> pull(id)}."
  ))

  response <- request(url) |>
    req_headers(!!!request_headers) |>
    safe_valg_request(
      context = glue("get_coalitions({municipality_id |> pull(id)})")
    )

  if (is.null(response)) {
    return(list(
      municipality_name = get_map_area_name(municipality_id),
      coalitions = list(),
      status = "request_failed"
    ))
  }

  response <- response |>
    resp_body_string() |>
    jsonlite::fromJSON()

  x <- response |>
    _$electoralCoalitionList$listLettersOrName |>
    str_split(",\\s*")

  Sys.sleep(api_sleep_time)

  return(list(municipality_name = response$countStatusDto$name, coalitions = x))
}

get_election_ids <- function() {
  url <- paste0(
    "https://valg.dk/api/election" #,
    # municipality_id |> pull(id)
  )

  request(url) |>
    req_headers(!!!list("Cookie" = request_headers$Cookie)) |>
    req_perform() |>
    resp_body_string() |>
    jsonlite::fromJSON() |>
    _$municipalElections |>
    as_tibble() |>
    mutate(electionDate = ymd(electionDate)) |>
    arrange(desc(electionDate))
}
