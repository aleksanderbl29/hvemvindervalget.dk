data {
  int<lower=2> K;
  int<lower=1> K_alr;
  int<lower=1> N_polls;
  int<lower=1> N_days;
  int<lower=1> P;
  matrix[N_polls, K_alr] z_obs;
  array[N_polls] int<lower=1, upper=N_days> day_idx;
  array[N_polls] int<lower=1, upper=P> pollster_idx;
  vector<lower=1>[N_polls] n_eff;
  vector[K_alr] prior_mean;
  vector<lower=0>[K_alr] prior_sd;
  vector<lower=0>[K_alr] innovation_scale_prior;
  vector<lower=0>[K_alr] house_scale_prior;
  cholesky_factor_corr[K_alr] L_corr;
}

parameters {
  vector[K_alr] alpha_initial_raw;
  matrix[K_alr, N_days - 1] eta;
  vector<lower=0>[K_alr] sigma_rw;
  vector<lower=0>[K_alr] sigma_obs;
  vector<lower=0>[K_alr] sigma_house;
  matrix[P, K_alr] house_raw;
}

transformed parameters {
  matrix[N_days, K_alr] alpha;
  matrix[P, K_alr] house_effect;

  {
    row_vector[K_alr] house_raw_mean;
    house_raw_mean = rep_row_vector(0, K_alr);

    for (p in 1:P) {
      house_raw_mean += house_raw[p];
    }

    house_raw_mean /= P;

    for (p in 1:P) {
      house_effect[p] = (house_raw[p] - house_raw_mean) .* to_row_vector(sigma_house);
    }
  }

  alpha[1] = to_row_vector(prior_mean + prior_sd .* alpha_initial_raw);

  for (t in 2:N_days) {
    alpha[t] = alpha[t - 1] +
      to_row_vector(diag_pre_multiply(sigma_rw, L_corr) * eta[, t - 1]);
  }
}

model {
  to_vector(alpha_initial_raw) ~ std_normal();
  to_vector(eta) ~ std_normal();
  to_vector(house_raw) ~ std_normal();

  sigma_rw ~ normal(innovation_scale_prior, innovation_scale_prior);
  sigma_obs ~ normal(0.08, 0.05);
  sigma_house ~ normal(house_scale_prior, house_scale_prior);

  for (i in 1:N_polls) {
    for (k in 1:K_alr) {
      z_obs[i, k] ~ normal(
        alpha[day_idx[i], k] + house_effect[pollster_idx[i], k],
        sqrt(square(sigma_obs[k]) + 1.0 / fmax(n_eff[i], 50.0))
      );
    }
  }
}

generated quantities {
  simplex[K] election_day_vote;
  matrix[P, K] pollster_bias_vote;

  {
    vector[K] baseline_eta;
    baseline_eta[1:K_alr] = to_vector(alpha[N_days]);
    baseline_eta[K] = 0;
    election_day_vote = softmax(baseline_eta);

    for (p in 1:P) {
      vector[K] pollster_eta;
      pollster_eta[1:K_alr] = to_vector(alpha[N_days]) + to_vector(house_effect[p]);
      pollster_eta[K] = 0;
      pollster_bias_vote[p] = to_row_vector(softmax(pollster_eta) - election_day_vote);
    }
  }
}
