library(targets)
library(tarchetypes)
library(stantargets)
library(glue)

api_sleep_time <- 0.25 # Sleep API calls for some time.

tar_option_set(
  packages = c(
    "tidyverse",
    "glue",
    "dkstat",
    "geodk",
    "cmdstanr",
    "posterior",
    "lubridate",
    "httr2",
    "tibble",
    "sf",
    "brms",
    "tidybayes",
    "ggdist",
    "plotly",
    "DBI",
    "RPostgres"
  ),
  format = "qs",
  seed = 42,
  controller = crew::crew_controller_local(
    workers = parallel::detectCores(),
    seconds_idle = 60
  ),
  repository = "aws", # It is actually not on AWS, but just uses S3.
  repository_meta = "aws", # It is actually not on AWS, but just uses S3.
  resources = tar_resources(
    aws = tar_resources_aws(
      bucket = Sys.getenv("backend_s3_bucket_name"),
      prefix = Sys.getenv("backend_s3_bucket_prefix"),
      region = Sys.getenv("backend_s3_bucket_region"),
      endpoint = Sys.getenv("backend_s3_bucket_endpoint")
    )
  ),
  error = "continue"
)
tar_source()

list(
  tar_target(this_week, week(today("CET"))),
  tar_target(run_date, today()),
  tar_target(election_day, dmy("24-03-2026")),
  tar_target(model_lookback_days, 365),

  # Set options for runtime and estimation
  tar_target(n_chains, 6),
  tar_target(n_cores, getOption("mc.cores")),
  # tar_target(n_warmup, 250),
  # tar_target(n_iter, 1000),
  tar_target(n_warmup, 1000),
  tar_target(n_iter, 3500),
  tar_target(n_sampling, n_iter * 0.1),
  tar_target(n_refresh, n_sampling * 0.1),
  tar_target(sigma_measure_noise_national, 0.05),
  tar_target(sigma_measure_noise_state, 0.05),
  tar_target(sigma_c, 0.06),
  tar_target(sigma_m, 0.04),
  tar_target(sigma_pop, 0.04),
  tar_target(sigma_e_bias, 0.02),

  # Municipality level data
  tar_target(mcp_geo, get_mcp_geo(this_week)),
  # tar_target(mcp_pop, get_mcp_pop(this_week)),
  tar_target(mcp_info, get_mcp_info(mcp_geo)),
  tar_target(mcp_accounts, get_mcp_accounts(this_week)),
  tar_target(mcp_daycare_pricing, get_mcp_daycare_pricing(this_week)),
  tar_target(turnout_pct, get_turnout_pct(this_week)),

  # Valg.dk
  tar_group_by(election_overview, get_election_overview(), id),
  tar_group_by(election_ids, get_election_ids(), id),
  tar_target(
    current_election_results,
    get_data_csv(election_overview),
    pattern = map(election_overview)
  ),
  # tar_target(
  #   coalitions,
  #   get_coalitions(election_overview),
  #   pattern = map(election_overview)
  # ),

  # Election results
  tar_target(
    dst_population_metadata,
    get_dst_table_metadata("FOLK1D", geo = TRUE)
  ),
  tar_file_read(election_dates, "data/dst/Valg.csv", read_election_dates(!!.x)),
  tar_file_read(
    election_results,
    "data/dst/ValgData.csv",
    read_election_results(!!.x, election_dates, mcp_info, parties)
  ),
  tar_target(mcp_hist_results, get_mcp_hist_results(election_results)),

  # Parties
  tar_target(parties, get_parties()),
  tar_target(forecast_parties, get_forecast_parties(parties, election_day)),

  # Polls
  ## Verian
  tar_file_read(
    verian_polls,
    "data/verian/PI250604.xlsx",
    read_verian_excel(!!.x)
  ),
  tar_file_read(
    gallup_polls,
    "data/verian/Politisk indeks 1953-2023.xlsx",
    read_gallup_excel(!!.x)
  ),
  ## Epinion
  tar_url(
    epinion_poll_list_url,
    "https://www.dr.dk/nyheder/politik/meningsmaalinger/api/opinionPollData"
  ),
  tar_group_by(
    epinion_poll_list,
    get_epinion_poll_list(epinion_poll_list_url),
    id
  ),
  tar_target(
    epinion_polls,
    get_epinion_polls(epinion_poll_list, parties),
    pattern = map(epinion_poll_list)
  ),

  ## Merged
  tar_target(
    polls,
    bind_polls(
      election_dates,
      verian_polls,
      gallup_polls,
      epinion_polls,
      election_day,
      parties
    )
  ),

  tar_target(pollsters, get_pollsters(polls)),
  tar_target(latest_poll, get_latest_poll(polls)),
  tar_target(weighted_poll, weight_poll(polls, parties, half_life = 14)),

  ## House effects
  tar_target(
    house_effects,
    calc_house_effects(
      election_results,
      election_dates,
      polls,
      parties
    )
  ),

  # Correlation matrixes
  ## Vote correlations
  tar_target(vote_correlation, get_vote_correlation(mcp_hist_results)),
  tar_target(vote_covariance, cor(vote_correlation)),
  ## Municipality correlations
  tar_target(municipality_correlation, get_municipality_correlation(mcp_info)),
  tar_target(municipality_covariance, cor(municipality_correlation)),
  ## Region correlations
  tar_target(region_correlation, get_region_correlation(mcp_info)),
  tar_target(regions_covariance, cor(region_correlation)),
  ## Matrix
  tar_target(
    C,
    construct_correlation_matrix(
      vote_covariance,
      # municipality_covariance,
      regions_covariance
    )
  ),

  # Calculate prior
  tar_target(
    national_results,
    get_national_results(election_results, forecast_parties)
  ),
  tar_target(
    national_prior,
    build_national_prior(national_results, forecast_parties, house_effects)
  ),
  tar_target(
    prior_poll_comparison,
    compare_prior_to_polling(national_prior, weighted_poll)
  ),

  # Run model
  tar_target(
    model_diagnostics,
    diagnose_model_inputs(
      polls,
      forecast_parties,
      election_day,
      model_lookback_days
    )
  ),
  tar_target(
    model_inputs,
    prepare_model_inputs(
      polls,
      forecast_parties,
      election_day,
      model_lookback_days
    )
  ),
  tar_target(stan_file, "stan/denmark_election_model.stan", format = "file"),
  tar_target(stan_data, make_stan_data(model_inputs, national_prior)),
  tar_target(
    model,
    run_model(
      stan_file,
      stan_data,
      n_chains = n_chains,
      n_cores = n_cores,
      n_warmup = n_warmup,
      n_iter = n_iter,
      n_refresh = n_refresh
    )
  ),
  tar_target(
    vote_forecast_draws,
    extract_vote_forecast_draws(model, forecast_parties)
  ),
  tar_target(
    vote_forecast_summary,
    summarise_vote_forecast_draws(vote_forecast_draws)
  ),
  tar_target(
    estimated_house_effect_draws,
    extract_house_effect_draws(
      model,
      forecast_parties,
      model_inputs$pollster_lookup
    )
  ),
  tar_target(
    estimated_house_effect_summary,
    summarise_house_effect_draws(estimated_house_effect_draws)
  ),
  tar_target(
    seat_draws,
    simulate_folketing_seats(
      vote_forecast_draws,
      election_results,
      forecast_parties
    )
  ),
  tar_target(seat_summary, summarise_seat_draws(seat_draws))
)
