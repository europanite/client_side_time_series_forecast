/** Leak-resistant daily predictors, group discovery and trade simulations.
 * Every feature of target session t is computed exclusively from information
 * available after target session t-1. Foreign-market bars receive extra lag.
 */
import { simulateLongOnly, simulateBuyHold } from './stock-trading-core.mjs';

export function parsePanel(csv, meta) {
  const lines = csv.trim().split(/\r?\n/);
  const header = lines.shift().split(',');
  if (header[0] !== 'Date' || new Set(header).size !== header.length) {
    throw new Error('Panel must start with Date and target, with distinct columns');
  }
  const rows = lines.map((line, index) => {
    const cells = line.split(',');
    if (cells.length !== header.length || !/^\d{4}-\d{2}-\d{2}$/.test(cells[0]))
      throw new Error(`Invalid panel row ${index + 2}`);
    const prices = Object.fromEntries(header.slice(1).map((sym, i) => {
      const raw = cells[i + 1];
      const price = raw === '' ? null : Number(raw);
      if (price !== null && !(Number.isFinite(price) && price > 0))
        throw new Error(`Invalid price for ${sym} at ${cells[0]}`);
      return [sym, price];
    }));
    if (meta.targets.some(sym => prices[sym] === null || prices[sym] === undefined)) throw new Error('Missing target close');
    return { date: cells[0], prices };
  });
  if (rows.length < 220 || rows.some((r, i) => i && r.date <= rows[i - 1].date))
    throw new Error('Too few / out-of-order panel observations');
  const symbols = new Set(header.slice(1));
  if ((meta.symbols || []).some(s => !symbols.has(s)) || (meta.targets || []).some(s => !symbols.has(s))) throw new Error('Metadata symbol absent');
  return rows;
}

function logReturn(a, b) { return Math.log(a / b) * 10000; }
function mean(a) { return a.reduce((s, v) => s + v, 0) / a.length; }
const isoPreviousCalendarDate = (date) => new Date(Date.parse(`${date}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);

export function featureVector(rows, i, target, factors, globalSymbols = []) {
  if (i < 22 || i >= rows.length) throw new Error('Insufficient preceding observations');
  const prior = rows[i - 1];
  const targetHistory = rows.slice(i - 21, i).map(r => r.prices[target]);
  const rt = targetHistory.slice(1).map((p, j) => logReturn(p, targetHistory[j]));
  const features = [
    rt.at(-1), rt.at(-2), rt.at(-3), mean(rt.slice(-5)), mean(rt.slice(-10)),
    logReturn(targetHistory.at(-1), targetHistory.at(-6)),
    logReturn(targetHistory.at(-1), targetHistory[0]),
    Math.sqrt(mean(rt.slice(-10).map(v => (v - mean(rt.slice(-10))) ** 2))),
  ];
  const foreign = new Set(globalSymbols);
  for (const sym of factors) {
    const cutoff = foreign.has(sym) ? isoPreviousCalendarDate(prior.date) : prior.date;
    const known = [];
    // Never use factor bars from target session i (including same-dated US closes).
    for (let j = 0; j < i; j++) {
      const item = rows[j];
      if (item.date > cutoff) break;
      if (item.prices[sym] !== null && item.prices[sym] !== undefined) known.push(item);
    }
    const last = known.at(-1);
    const staleDays = last ? (Date.parse(prior.date) - Date.parse(last.date)) / 86400000 : Infinity;
    if (known.length >= 7 && staleDays <= 9) {
      const p = known.map(r => r.prices[sym]);
      features.push(logReturn(p.at(-1), p.at(-2)), logReturn(p.at(-1), p.at(-6)), 0);
    } else {
      features.push(0, 0, 1); // Missing indicator, not invented future prices
    }
  }
  return features;
}

export function datasetUntil(rows, limit, target, factors, globalSymbols) {
  const X = [], y = [];
  for (let i = 22; i < limit; i++) {
    X.push(featureVector(rows, i, target, factors, globalSymbols));
    y.push(logReturn(rows[i].prices[target], rows[i - 1].prices[target]));
  }
  if (X.length < 60) throw new Error('Not enough pre-origin data');
  return { X, y };
}

function solve(A, b) {
  const n = b.length;
  const aug = A.map((r, i) => [...r, b[i]]);
  for (let i = 0; i < n; i++) {
    let m = i;
    for (let j = i + 1; j < n; j++) if (Math.abs(aug[j][i]) > Math.abs(aug[m][i])) m = j;
    if (Math.abs(aug[m][i]) < 1e-10) throw new Error('Singular ridge matrix');
    [aug[i], aug[m]] = [aug[m], aug[i]];
    const inv = 1 / aug[i][i];
    for (let k = i; k <= n; k++) aug[i][k] *= inv;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const r = aug[j][i];
      for (let k = i; k <= n; k++) aug[j][k] -= r * aug[i][k];
    }
  }
  return aug.map(row => row[n]);
}

export function fitRidge(X, y, lambda = 0.3) {
  const p = X[0].length;
  if (!X.length || y.length !== X.length || X.some(row => row.length !== p)) throw new Error('Invalid ridge input');
  const center = Array.from({ length: p }, (_, k) => mean(X.map(row => row[k])));
  const scale = center.map((_, k) => Math.max(1, Math.sqrt(mean(X.map(row => (row[k] - center[k]) ** 2)))));
  const XX = X.map(row => [1, ...row.map((v, k) => (v - center[k]) / scale[k])]);
  const d = p + 1;
  const A = Array.from({ length: d }, () => Array(d).fill(0));
  const b = Array(d).fill(0);
  for (let t = 0; t < XX.length; t++) {
    for (let a = 0; a < d; a++) {
      b[a] += XX[t][a] * y[t];
      for (let c = 0; c < d; c++) A[a][c] += XX[t][a] * XX[t][c];
    }
  }
  for (let i = 1; i < d; i++) A[i][i] += lambda * X.length;
  const beta = solve(A, b);
  return row => {
    if (row.length !== p) throw new Error('Wrong feature width');
    return beta[0] + row.reduce((sum, v, k) => sum + beta[k + 1] * (v - center[k]) / scale[k], 0);
  };
}

export function forecastClose(previous, bps) {
  if (!Number.isFinite(bps)) throw new Error('Nonfinite predicted return');
  // Guard against unreasonably large model extrapolation.
  return previous * Math.exp(Math.max(-1500, Math.min(1500, bps)) / 10000);
}

export function ridgeBacktest(rows, target, factors, globalSymbols, start, end) {
  const output = [];
  for (let i = start; i < end; i++) {
    const { X, y } = datasetUntil(rows, i, target, factors, globalSymbols);
    const model = fitRidge(X, y);
    const previousClose = rows[i - 1].prices[target];
    const predicted = forecastClose(previousClose, model(featureVector(rows, i, target, factors, globalSymbols)));
    output.push({ date: rows[i].date, previousClose, predicted, close: rows[i].prices[target] });
  }
  return output;
}
export function mae(bars) { return mean(bars.map(r => Math.abs(r.predicted - r.close))); }
export function scoreBars(bars, ohlc, params) {
  const prices = new Map(ohlc.map(r => [r.date, r]));
  return simulateLongOnly(bars.map(r => {
    const match = prices.get(r.date);
    if (!match || match.close !== r.close) throw new Error(`OHLC mismatch at ${r.date}`);
    return { ...r, open: match.open };
  }), params);
}
export { simulateBuyHold };
