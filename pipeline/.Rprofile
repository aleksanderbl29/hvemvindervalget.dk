options(renv.config.pak.enabled = FALSE) # Use pak for installing packages when using renv
if (requireNamespace("rprofile", quietly = TRUE)) {
  rprofile::load()
}
source("renv/activate.R")

if (interactive()) {
  source("~/.Rprofile")
}

options(renv.config.pak.enabled = FALSE) # Use pak for installing packages when using renv

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
