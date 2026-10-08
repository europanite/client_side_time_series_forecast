# Fixed-group stock data collector

The backend runs **one-shot downloads** from Yahoo Finance using `yfinance`.
It does not serve predictions or provide an API: the browser continues to
perform its own XGBoost, LightGBM, VARMA, and Chronos-2 forecasting locally.

Run from the repository root:

```bash
# Fetch the complete fixed Japanese equity universe plus market factors.
docker compose run --rm --build backend

# Explicit history length or historical data cutoff.
docker compose run --rm backend --period 3y --through 2026-10-07

# Python unit tests (no host Python installation needed).
docker compose run --rm --entrypoint python backend \
  -m unittest discover -s tests -p 'test_*.py' -v

# Follow with the daily benchmark and README regeneration.
docker compose -f docker-compose.stock.yml run --rm --build stock_benchmark
```

The collector writes these files into `data/stocks/`:

- `multivariate.csv`: aligned daily Close observations for all fixed targets and factors
- `multivariate.opens.csv`: daily opening prices for the fixed prediction targets
- `multivariate.meta.json`: data provenance, group metadata and SHA-256 hashes

The forecast groups are **defined in**
[`config/stock-evaluation-groups.json`](../config/stock-evaluation-groups.json).
Only available completed daily bars are used; missing observations must not be
fabricated. `--through` is an observation-date cutoff, not a point-in-time
market-data guarantee. Before 18:00 JST, the default cutoff is the previous
calendar day.

For experimental design, scheduled evaluation and trading caveats, see
[`STOCK_EVALUATION.md`](../STOCK_EVALUATION.md).
Yahoo Finance data use and public redistribution may be restricted. Verify
permission before publishing downloaded market data.
