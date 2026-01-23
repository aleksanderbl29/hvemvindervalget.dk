connect_to_db <- function() {
  DBI::dbConnect(
    RPostgres::Postgres(),
    dbname = "neondb",
    host = Sys.getenv("DB_HOST"),
    user = Sys.getenv("DB_USER"),
    password = Sys.getenv("DB_PASS"),
    sslmode = "require"
  )
}
