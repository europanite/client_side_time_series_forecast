# Docker Compose: fixed-group stock collector

`docker-compose.override.yml` is merged automatically into the default
`docker-compose.yml` command. The `backend` profile provides a one-shot
Python/yfinance collector; no always-on backend service is needed.

```bash
# Fetch 3 years for the current fixed-group evaluation (default).
docker compose run --rm --build backend

# Use a historical observation cutoff for a repeatable input snapshot.
docker compose run --rm backend --period 3y --through 2026-10-07

# Run collector unit tests.
docker compose run --rm --entrypoint python backend \
  -m unittest discover -s tests -p 'test_*.py' -v
```

These commands generate `data/stocks/multivariate.csv`,
`data/stocks/multivariate.opens.csv`, and `data/stocks/multivariate.meta.json`.
Evaluation, browser samples, report JSON and the README are generated
separately with `docker compose -f docker-compose.stock.yml run --rm
--build stock_benchmark`.

On Linux the backend defaults to UID/GID 1000. Override them if needed:

```bash
LOCAL_UID="$(id -u)" LOCAL_GID="$(id -g)" \
  docker compose run --rm --build backend
```

The downloaded historical bars are not a true point-in-time archive;
check Yahoo Finance data usage rights before redistribution.
