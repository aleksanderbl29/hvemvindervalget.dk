#' Ingest data from S3 to Convex
#'
#' After uploading data to Sevala S3, call this function to trigger
#' Convex ingestion of the CSV file.
#'
#' @param bucket S3 bucket name
#' @param key S3 object key (file path)
#' @param table Target Convex table name (e.g., "national_overview", "municipalities", "polls", "scenarios")
#' @param endpoint Sevala S3 endpoint URL (optional, uses env var if not provided)
#' @param convex_url Convex HTTP action URL (defaults to CONVEX_INGEST_URL env var)
#' @param secret_token Secret token for authentication (defaults to CONVEX_INGEST_SECRET_TOKEN env var)
#'
#' @return httr2 response object
#' @export
ingest_to_convex <- function(
    bucket,
    key,
    table,
    endpoint = NULL,
    convex_url = NULL,
    secret_token = NULL) {
  # Get defaults from environment if not provided
  if (is.null(convex_url)) {
    convex_url <- Sys.getenv("CONVEX_INGEST_URL")
    if (convex_url == "") {
      stop("CONVEX_INGEST_URL environment variable not set")
    }
  }

  if (is.null(secret_token)) {
    secret_token <- Sys.getenv("CONVEX_INGEST_SECRET_TOKEN")
    if (secret_token == "") {
      stop("CONVEX_INGEST_SECRET_TOKEN environment variable not set")
    }
  }

  if (is.null(endpoint)) {
    endpoint <- Sys.getenv("backend_s3_bucket_endpoint")
  }

  # Prepare request body
  body <- list(
    bucket = bucket,
    key = key,
    table = table,
    secretToken = secret_token
  )

  if (!is.null(endpoint) && endpoint != "") {
    body$endpoint <- endpoint
  }

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
        "Convex ingestion failed with status ", status, ": ", body_text
      )
    )
  }

  return(response)
}
