/** Reuse the frontend's actual WASM ML libraries; not Python substitutes. */
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';

const requireApp = createRequire(resolve('frontend/app/package.json'));
async function loadPackage(name) {
  try { return requireApp(name); }
  catch (err) {
    if (err?.code !== 'ERR_REQUIRE_ESM') throw err;
    return import(pathToFileURL(requireApp.resolve(name)).href);
  }
}
export async function predictWasm(algorithm, X, y, row) {
  if (algorithm === 'lightgbm') {
    const mod = await loadPackage('@wlearn/lightgbm');
    const factory = mod?.LGBModel ?? mod?.default?.LGBModel ?? mod?.default;
    if (!factory?.create) throw new Error('LightGBM WASM factory unavailable');
    const model = await factory.create({
      task: 'regression', learning_rate: 0.05, num_leaves: 15, max_depth: 3,
      subsample: 0.9, colsample_bytree: 0.9, numRound: 120, verbosity: -1,
    });
    try {
      await model.fit(X, y);
      const r = await model.predict([row]);
      return Number(r[0]);
    } finally { if (typeof model.dispose === 'function') model.dispose(); }
  }
  if (algorithm !== 'xgboost') throw new Error(`Unsupported WASM model ${algorithm}`);
  const mod = await loadPackage('ml-xgboost');
  let obj = mod;
  while (obj?.default || typeof obj?.then === 'function') {
    obj = typeof obj.then === 'function' ? await obj : obj.default;
  }
  const ctor = obj?.XGBoost ?? (typeof obj === 'function' ? obj : null);
  if (!ctor) throw new Error('XGBoost WASM constructor unavailable');
  const wasm = readFileSync(resolve('frontend/app/public/vendor/ml-xgboost/xgboost.wasm'));
  const original = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (String(url).includes('xgboost.wasm')) return new Response(wasm, { status: 200, headers: { 'Content-Type': 'application/wasm' }});
    if (!original) throw new Error('External fetch unavailable');
    return original(input, init);
  };
  try {
    const model = new ctor({ booster: 'gbtree', objective: 'reg:linear', max_depth: 3,
      eta: 0.08, min_child_weight: 2, subsample: 0.9, colsample_bytree: 0.9,
      silent: 1, iterations: 120 });
    await model.train(X, y);
    const result = await model.predict([row]);
    return Number(Array.isArray(result) || ArrayBuffer.isView(result) ? result[0] : result);
  } finally { if (original) globalThis.fetch = original; else delete globalThis.fetch; }
}
