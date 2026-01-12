#' Upload a dataframe directly to Convex via HTTP API
#'
#' Converts a dataframe to CSV and sends it directly to Convex ingestion endpoint.
#'
#' @param data A dataframe or tibble to upload
#' @param table Target Convex table name (e.g., "national_overview", "municipality_snapshots", "polls", "scenarios")
#' @param convex_url Convex HTTP action URL (defaults to CONVEX_INGEST_DIRECT_URL env var, falls back to CONVEX_INGEST_URL)
#' @param secret_token Secret token for authentication (defaults to CONVEX_INGEST_SECRET_TOKEN env var)
#'
#' @return httr2 response object from Convex ingestion
#' @export
convex_upload <- function(
    data,
    table,
    convex_url = NULL,
    secret_token = NULL) {
  # Get the convex URL and secret token from the environment
  if (is.null(convex_url)) {
    # Try direct ingest URL first, fall back to regular ingest URL
    convex_url <- Sys.getenv("CONVEX_INGEST_DIRECT_URL")
    if (convex_url == "") {
      convex_url <- Sys.getenv("CONVEX_INGEST_URL")
      if (convex_url != "") {
        # Replace /ingest with /ingestDirect if using the old URL
        convex_url <- sub("/ingest$", "/ingestDirect", convex_url)
      }
    }
    if (convex_url == "") {
      stop("CONVEX_INGEST_DIRECT_URL or CONVEX_INGEST_URL environment variable not set")
    }
  }

  if (is.null(secret_token)) {
    secret_token <- Sys.getenv("CONVEX_INGEST_SECRET_TOKEN")
    if (secret_token == "") {
      stop("CONVEX_INGEST_SECRET_TOKEN environment variable not set")
    }
  }

  # Convert dataframe to CSV string
  csv_string <- readr::format_csv(data)

  # Prepare request body
  body <- list(
    table = table,
    data = csv_string,
    secretToken = secret_token
  )

  # Make HTTP POST request to Convex
  response <- httr2::request(convex_url) |>
    httr2::req_method("POST") |>
    httr2::req_headers("Content-Type" = "application/json") |>
    httr2::req_body_json(body) |>
    httr2::req_perform()

  # Check response status
  status <- httr2::resp_status(response)
  if (status >= 400) {
    body_text <- httr2::resp_body_string(response)
    warning(
      paste0(
        "Convex upload failed with status ", status, ": ", body_text
      )
    )
  }

  return(response)
}
