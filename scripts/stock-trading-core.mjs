/** Pure, deterministic long-only next-session open-to-close paper trading. */

export function maxDrawdownPct(equities) {
  let peak = equities[0];
  let largest = 0;
  for (const value of equities) {
    if (!Number.isFinite(value) || value < 0) throw new Error('Non-finite equity');
    peak = Math.max(peak, value);
    if (peak > 0) largest = Math.max(largest, (peak - value) / peak);
  }
  return largest * 100;
}

export function checkParams(params) {
  for (const key of ['initialCash', 'lotSize', 'feeBps', 'slippageBps', 'thresholdBps']) {
    if (!Number.isFinite(params[key]) || params[key] < 0) throw new Error(`Invalid ${key}`);
  }
  if (params.initialCash <= 0 || !Number.isInteger(params.lotSize) || params.lotSize < 1) {
    throw new Error('Initial cash must be positive, lot size a positive integer');
  }
  if (params.feeBps + params.slippageBps >= 10000) throw new Error('Unreasonable transaction costs');
}

function buyFill(open, params) {
  return open * (1 + params.slippageBps / 10000);
}
function sellFill(close, params) {
  return close * (1 - params.slippageBps / 10000);
}
function buyCost(shares, open, params) {
  return shares * buyFill(open, params) * (1 + params.feeBps / 10000);
}
function saleProceeds(shares, close, params) {
  return shares * sellFill(close, params) * (1 - params.feeBps / 10000);
}
function affordableShares(cash, open, params) {
  const perShare = buyCost(1, open, params);
  const lots = Math.floor(cash / (perShare * params.lotSize) + 1e-10);
  return Math.max(0, lots) * params.lotSize;
}
function verifyBars(bars, requireForecast) {
  if (!bars.length) throw new Error('No simulation days');
  for (const [index, row] of bars.entries()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
        (index > 0 && row.date <= bars[index - 1].date) ||
        ![row.previousClose, row.open, row.close].every(n => Number.isFinite(n) && n > 0) ||
        (requireForecast && !(Number.isFinite(row.predicted) && row.predicted > 0))) {
      throw new Error(`Invalid session data at row ${index + 1}`);
    }
  }
}
function summary(initialCash, cash, curves, trades, wins, days) {
  return {
    initialCash,
    finalEquity: cash,
    profitJpy: cash - initialCash,
    returnPct: 100 * (cash / initialCash - 1),
    maxDrawdownPct: maxDrawdownPct([initialCash, ...curves.map(x => x.equity)]),
    tradeCount: trades,
    winningTrades: wins,
    winRatePct: trades ? wins / trades * 100 : null,
    exposurePct: trades / days * 100,
    equityCurve: curves,
  };
}

/** Every signal is computed before the *next* session open; no same-session data is used to decide. */
export function simulateLongOnly(bars, params) {
  checkParams(params);
  verifyBars(bars, true);
  let cash = params.initialCash;
  let trades = 0;
  let wins = 0;
  let hit = 0;
  let absError = 0;
  const curve = [];
  const details = [];

  for (const bar of bars) {
    const predictedReturnBps = 10000 * (bar.predicted / bar.previousClose - 1);
    const entered = predictedReturnBps > params.thresholdBps;
    const before = cash;
    const quantity = entered ? affordableShares(cash, bar.open, params) : 0;
    if (quantity > 0) {
      const entryCost = buyCost(quantity, bar.open, params);
      const exitValue = saleProceeds(quantity, bar.close, params);
      cash += exitValue - entryCost;
      trades++;
      if (exitValue > entryCost) wins++;
    }
    const directionPredicted = Math.sign(bar.predicted - bar.previousClose);
    const directionActual = Math.sign(bar.close - bar.previousClose);
    if (directionPredicted === directionActual) hit++;
    absError += Math.abs(bar.predicted - bar.close);
    const netPnl = cash - before;
    curve.push({ date: bar.date, equity: cash });
    details.push({
      date: bar.date,
      previousClose: bar.previousClose,
      predictedClose: bar.predicted,
      open: bar.open,
      close: bar.close,
      predictedReturnBps,
      action: quantity > 0 ? 'BUY_AT_OPEN_SELL_AT_CLOSE' : 'CASH',
      shares: quantity,
      pnlJpy: netPnl,
      endEquity: cash,
    });
  }
  return {
    ...summary(params.initialCash, cash, curve, trades, wins, bars.length),
    meanAbsoluteForecastErrorJpy: absError / bars.length,
    directionAccuracyPct: hit / bars.length * 100,
    observations: bars.length,
    details,
  };
}

/** Buy at the first tested session's open, hold until the final tested close. */
export function simulateBuyHold(bars, params) {
  checkParams(params);
  verifyBars(bars, false);
  const shares = affordableShares(params.initialCash, bars[0].open, params);
  const purchaseCost = buyCost(shares, bars[0].open, params);
  const remainder = params.initialCash - purchaseCost;
  const curve = bars.map(bar => ({
    date: bar.date,
    equity: remainder + saleProceeds(shares, bar.close, params),
  }));
  const cash = curve.at(-1).equity;
  return { ...summary(params.initialCash, cash, curve, shares ? 1 : 0, cash > params.initialCash ? 1 : 0, bars.length), shares, method: 'Buy open on first test day; sell close on last test day' };
}
