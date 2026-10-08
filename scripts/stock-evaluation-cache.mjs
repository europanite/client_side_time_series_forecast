/** Point-in-time input fingerprinting for expensive daily WASM backtests. */
import { createHash } from 'node:crypto';

export const CACHE_FORMAT_VERSION = 1;
export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');
}

/** Drop the unknown target-session prices completely, even before passing rows to model code. */
export function asOfFrame(rows, origin, window) {
  if (!Number.isInteger(window) || window < 82 || origin < window || origin >= rows.length)
    throw new Error('Invalid as-of training window or origin');
  const historical = rows.slice(origin - window, origin);
  return [...historical, { date: rows[origin].date, prices: {} }];
}

/** Cache key includes exactly the information available BEFORE the predicted trading session. */
export function predictionKey(frame, group, factors, algorithm, engineHash, foreignSymbols = []) {
  const inputs = frame.slice(0, -1).map(row => [row.date, row.prices[group.target],
    ...factors.map(symbol => row.prices[symbol] ?? null)]);
  return sha256({version: CACHE_FORMAT_VERSION, engineHash, target: group.target,
    algorithm, factors, foreignSymbols, originDate: frame.at(-1).date, inputs});
}

export function emptyCache(engineHash) {
  return {version: CACHE_FORMAT_VERSION, engineHash, entries: {}};
}

export function compatibleCache(data, engineHash) {
  return data?.version === CACHE_FORMAT_VERSION && data.engineHash === engineHash &&
    data.entries && typeof data.entries === 'object' && !Array.isArray(data.entries)
    ? data : emptyCache(engineHash);
}
