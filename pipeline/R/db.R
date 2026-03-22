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

safe_db_write_table <- function(con, name, value, overwrite = TRUE) {
  tryCatch(
    {
      DBI::dbWriteTable(
        con,
        name = name,
        value = value,
        overwrite = overwrite
      )
      TRUE
    },
    error = function(e) {
      message(glue(
        "DB write failed for table `{name}`: {conditionMessage(e)}"
      ))
      FALSE
    }
  )
}
