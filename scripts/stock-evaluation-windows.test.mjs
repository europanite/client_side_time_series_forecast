import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_EVALUATION_WINDOWS } from './stock-evaluation-windows.mjs';
import { asOfFrame, predictionKey } from './stock-evaluation-cache.mjs';

test('daily evaluation uses a 256/256/32 fixed session protocol', () => {
  assert.deepEqual(DEFAULT_EVALUATION_WINDOWS, { window: 256, long: 256, recent: 32 });
  assert.equal(DEFAULT_EVALUATION_WINDOWS.window + DEFAULT_EVALUATION_WINDOWS.long + 1, 513);
  assert.ok(DEFAULT_EVALUATION_WINDOWS.recent < DEFAULT_EVALUATION_WINDOWS.long);
  assert.ok(Object.isFrozen(DEFAULT_EVALUATION_WINDOWS));
});

test('256-session model context excludes current and later target prices', () => {
  const { window, long, recent } = DEFAULT_EVALUATION_WINDOWS;
  const rows = Array.from({ length: 550 }, (_, i) => ({
    date: new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10),
    prices: { target: 100 + i, peer: 200 + i },
  }));
  const origin = rows.length - long;
  const frame = asOfFrame(rows, origin, window);
  assert.equal(frame.length, window + 1);
  assert.deepEqual(frame.at(-1).prices, {});
  assert.equal(frame[0].date, rows[origin-window].date);
  assert.equal(frame.at(-2).date, rows[origin - 1].date);
  assert.equal(rows.length - (rows.length - recent), recent);
  const g = { target: 'target' };
  const key = predictionKey(frame, g, ['peer'], 'xgboost', 'engine');
  rows[origin].prices.target = -999;
  rows[origin].prices.peer = -999;
  rows[origin + 1].prices.peer = -999;
  assert.equal(key, predictionKey(asOfFrame(rows, origin, window), g, ['peer'], 'xgboost', 'engine'));
});
