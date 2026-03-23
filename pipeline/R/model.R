stabilize_correlation_matrix <- function(x) {
  x <- as.matrix(x)
  x[is.na(x)] <- 0
  x <- (x + t(x)) / 2
  diag(x) <- 1

  eigen_decomp <- eigen(x, symmetric = TRUE)
  min_eigen <- min(eigen_decomp$values)

  message(glue(
    "Repairing correlation matrix of size {nrow(x)} with minimum eigenvalue {signif(min_eigen, 4)}."
  ))

  repaired_values <- pmax(eigen_decomp$values, 1e-8)
  repaired <- eigen_decomp$vectors %*% diag(repaired_values) %*% t(eigen_decomp$vectors)
  repaired <- (repaired + t(repaired)) / 2

  scale_vec <- sqrt(diag(repaired))
  scale_vec[scale_vec <= 0] <- 1

  repaired <- sweep(repaired, 1, scale_vec, "/")
  repaired <- sweep(repaired, 2, scale_vec, "/")
  repaired <- (repaired + t(repaired)) / 2
  diag(repaired) <- 1

  chol_candidate <- try(chol(repaired), silent = TRUE)

  if (!inherits(chol_candidate, "try-error")) {
    return(list(
      matrix = repaired,
      cholesky = t(chol_candidate)
    ))
  }

  identity_matrix <- diag(nrow(x))

  list(
    matrix = identity_matrix,
    cholesky = identity_matrix
  )
}

discover_cmdstan_path <- function() {
  current_path <- tryCatch(
    cmdstanr::cmdstan_path(),
    error = function(e) ""
  )

  if (!is.null(current_path) && nzchar(current_path)) {
    return(current_path)
  }

  cmdstan_root <- path.expand("~/.cmdstan")

  if (!dir.exists(cmdstan_root)) {
    return("")
  }

  candidates <- list.dirs(cmdstan_root, recursive = FALSE, full.names = TRUE)

  if (length(candidates) == 0) {
    return("")
  }

  candidates[length(candidates)]
}

ensure_cmdstan_ready <- function() {
  cmdstan_path <- discover_cmdstan_path()

  if (!nzchar(cmdstan_path)) {
    stop("CmdStan path could not be found. Install CmdStan or set the cmdstanr path.")
  }

  cmdstanr::set_cmdstan_path(cmdstan_path)

  stanc_path <- file.path(cmdstan_path, "bin", "stanc")

  message(glue("Using CmdStan from `{cmdstan_path}`."))

  if (!file.exists(stanc_path)) {
    stop(glue("CmdStan appears incomplete; missing `{stanc_path}`."))
  }

  invisible(cmdstan_path)
}

get_cmdstan_output_dir <- function() {
  output_dir <- file.path(getwd(), "_targets", "stan-output")
  dir.create(output_dir, recursive = TRUE, showWarnings = FALSE)
  output_dir
}

check_cmdstan_fit_success <- function(fit) {
  return_codes <- tryCatch(
    fit$return_codes(),
    error = function(e) integer()
  )

  if (length(return_codes) == 0) {
    stop("CmdStan fit did not expose any chain return codes.")
  }

  if (all(return_codes == 0)) {
    return(invisible(fit))
  }

  chain_logs <- vapply(
    seq_along(return_codes),
    function(i) {
      tryCatch(
        paste(capture.output(fit$output(i)), collapse = "\n"),
        error = function(e) glue("Chain {i} output unavailable: {conditionMessage(e)}")
      )
    },
    character(1)
  )

  stop(glue(
    "CmdStan chains failed. Return codes: {paste(return_codes, collapse = ', ')}.\n\n",
    "{paste(chain_logs, collapse = '\n\n')}"
  ))
}

make_stan_data <- function(model_inputs, national_prior) {
  correlation <- stabilize_correlation_matrix(national_prior$correlation_matrix)

  list(
    K = nrow(model_inputs$forecast_parties),
    K_alr = nrow(model_inputs$forecast_parties) - 1L,
    N_polls = nrow(model_inputs$poll_metadata),
    N_days = nrow(model_inputs$day_lookup),
    P = nrow(model_inputs$pollster_lookup),
    z_obs = model_inputs$z,
    day_idx = model_inputs$poll_metadata$day_id,
    pollster_idx = model_inputs$poll_metadata$pollster_id,
    n_eff = pmax(model_inputs$poll_metadata$n, 100),
    prior_mean = national_prior$prior_mean,
    prior_sd = national_prior$prior_sd,
    innovation_scale_prior = national_prior$innovation_scale,
    house_scale_prior = national_prior$house_scale,
    L_corr = correlation$cholesky
  )
}

run_model <- function(
  stan_file,
  stan_data,
  n_chains = 4,
  n_cores = 4,
  n_warmup = 1000,
  n_iter = 3500,
  n_refresh = 100
) {
  if (is.null(n_cores) || is.na(n_cores)) {
    n_cores <- n_chains
  }

  ensure_cmdstan_ready()
  output_dir <- get_cmdstan_output_dir()

  Sys.setenv(
    TMPDIR = output_dir,
    TMP = output_dir,
    TEMP = output_dir
  )

  message(glue(
    "Compiling Stan model `{stan_file}` with K={stan_data$K}, N_polls={stan_data$N_polls}, ",
    "N_days={stan_data$N_days}, P={stan_data$P}, output_dir={output_dir}."
  ))

  compiled_model <- tryCatch(
    cmdstanr::cmdstan_model(stan_file, pedantic = TRUE),
    error = function(e) {
      message(glue("Stan compilation failed: {conditionMessage(e)}"))
      stop(e)
    }
  )

  fit <- compiled_model$sample(
    data = stan_data,
    chains = n_chains,
    parallel_chains = min(n_chains, n_cores),
    iter_warmup = n_warmup,
    iter_sampling = max(n_iter - n_warmup, 500),
    refresh = n_refresh,
    adapt_delta = 0.9,
    max_treedepth = 12,
    output_dir = output_dir
  )

  check_cmdstan_fit_success(fit)
}

extract_vote_forecast_draws <- function(model, forecast_parties) {
  check_cmdstan_fit_success(model)

  vote_draws <- model$draws(variables = "election_day_vote") |>
    posterior::as_draws_df() |>
    as_tibble() |>
    select(.chain, .iteration, .draw, starts_with("election_day_vote[")) |>
    pivot_longer(
      cols = starts_with("election_day_vote["),
      names_to = "party_id",
      values_to = "vote_share"
    ) |>
    mutate(
      party_id = str_extract(party_id, "\\d+") |> as.integer()
    ) |>
    left_join(
      forecast_parties |>
        select(party_id, party_code, party_name, party_name_short),
      by = "party_id"
    ) |>
    arrange(.draw, party_id)

  vote_draws
}

summarise_vote_forecast_draws <- function(vote_forecast_draws) {
  vote_forecast_draws |>
    group_by(party_code, party_name, party_name_short) |>
    summarise(
      mean_vote_share = mean(vote_share),
      p10 = quantile(vote_share, 0.1),
      median_vote_share = quantile(vote_share, 0.5),
      p90 = quantile(vote_share, 0.9),
      .groups = "drop"
    ) |>
    arrange(desc(mean_vote_share))
}

extract_house_effect_draws <- function(model, forecast_parties, pollster_lookup) {
  check_cmdstan_fit_success(model)

  model$draws(variables = "pollster_bias_vote") |>
    posterior::as_draws_df() |>
    as_tibble() |>
    select(.chain, .iteration, .draw, starts_with("pollster_bias_vote[")) |>
    pivot_longer(
      cols = starts_with("pollster_bias_vote["),
      names_to = "coord",
      values_to = "bias_vote_share"
    ) |>
    extract(
      coord,
      into = c("pollster_id", "party_id"),
      regex = "pollster_bias_vote\\[(\\d+),(\\d+)\\]",
      convert = TRUE
    ) |>
    left_join(pollster_lookup, by = "pollster_id") |>
    left_join(
      forecast_parties |>
        select(party_id, party_code, party_name, party_name_short),
      by = "party_id"
    ) |>
    arrange(.draw, pollster_id, party_id)
}

summarise_house_effect_draws <- function(house_effect_draws) {
  house_effect_draws |>
    group_by(pollster, party_code, party_name, party_name_short) |>
    summarise(
      mean_bias = mean(bias_vote_share),
      p10 = quantile(bias_vote_share, 0.1),
      median_bias = quantile(bias_vote_share, 0.5),
      p90 = quantile(bias_vote_share, 0.9),
      .groups = "drop"
    ) |>
    arrange(pollster, desc(abs(mean_bias)))
}
