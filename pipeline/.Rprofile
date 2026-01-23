if (requireNamespace("rprofile", quietly = TRUE)) {
  rprofile::load()
}
source("renv/activate.R")

if (interactive()) {
  source("~/.Rprofile")
}

if (file.exists("env.R")) {
  source("env.R")
}

library(targets)
library(tarchetypes)
# library(plumber2)
library(plumber)

tar_view <- function(target) {
  targets::tar_read_raw(target) |>
    View()
}
