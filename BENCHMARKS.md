# Benchmarking

This repository keeps application-level benchmarks separate from paper-level
comparisons. The application benchmarks reproduce the browser forecasting
policy as closely as practical and use fixed-origin holdouts with no target
feedback from the holdout.

## 1. AirPassengers fair benchmark

Dataset: `data/air_passengers.csv`

Default protocol:

- first 128 observations are training/context;
- the next 16 observations are a fixed holdout;
- no holdout target value is fed back during forecasting;
- Seasonal Naive, XGBoost, LightGBM, and Chronos-2-small INT8 ONNX are scored
  on the same 16 targets;
- common point metrics are MAE, RMSE, MAPE, sMAPE, and MASE;
- VARMA is N/A because AirPassengers is univariate.

Run all comparable models:

```bash
docker compose -f docker-compose.test.yml run --rm \
  air_passengers_fair_benchmark
```

Run LightGBM only:

```bash
docker compose -f docker-compose.test.yml run --rm \
  lightgbm_air_passengers_benchmark
```

Direct JSON:

```bash
docker compose -f docker-compose.test.yml run --rm \
  lightgbm_air_passengers_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-air-passengers-fair.mjs \
      --algorithm lightgbm --json
  '
```

## 2. Multivariate LightGBM benchmark

Dataset by default: `data/sample_data_synthetic.csv`

The sample dataset contains three numeric series: `ITEM_A`, `ITEM_B`, and
`ITEM_C`. The benchmark evaluates each numeric column once as the target.

Default protocol:

- final 16 rows are the holdout;
- all earlier rows are training/context;
- default seasonal period is 7;
- LightGBM uses the same engineered multivariate features as the browser app;
- the LightGBM model is fitted once at the forecast origin;
- recursive target forecasts are fed back instead of holdout truth;
- non-target numeric series are advanced by seasonal continuation;
- no numeric value from a holdout row is used as future model context;
- Seasonal Naive is reported as a baseline;
- MAE, RMSE, MAPE, sMAPE, and MASE are reported per target;
- macro means across targets are also reported.

Run:

```bash
docker compose -f docker-compose.test.yml run --rm \
  lightgbm_multivariate_benchmark
```

JSON:

```bash
docker compose -f docker-compose.test.yml run --rm \
  lightgbm_multivariate_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-multivariate-lightgbm.mjs --json
  '
```

Evaluate one target:

```bash
docker compose -f docker-compose.test.yml run --rm \
  lightgbm_multivariate_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-multivariate-lightgbm.mjs \
      --target ITEM_A --algorithm lightgbm --markdown
  '
```

A different multivariate CSV can be supplied with `--csv`. The script detects
a datetime-like column from a header containing `date` or `time` and treats
columns whose values are all numeric as candidate targets.

## 3. Interpreting the application benchmarks

These are application-level comparisons. They are useful for checking the
behavior of the implementations in this repository under a common local
protocol, but they should not be compared directly with published benchmark
tables unless the dataset, split, lookback/context, prediction horizon,
normalization, metric definitions, and fitting/zero-shot conditions all match.

For paper-oriented multivariate comparisons, use public datasets such as ETT,
Exchange, Weather, or Electricity and reproduce the protocol used by the paper
being compared.
