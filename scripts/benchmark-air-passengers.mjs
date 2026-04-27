#!/usr/bin/env node
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function parseArgs(argv) {
  const args = {
    csv: "data/air_passengers.csv",
    trainSize: 120,
    period: 12,
    algorithm: "xgboost",
    json: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--csv") args.csv = argv[++i];
    else if (arg === "--train-size") args.trainSize = Number(argv[++i]);
    else if (arg === "--period") args.period = Number(argv[++i]);
    else if (arg === "--algorithm") args.algorithm = argv[++i];
    else if (arg === "--json") args.json = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  if (!["xgboost", "seasonal-naive"].includes(args.algorithm)) {
    throw new Error("algorithm must be either xgboost or seasonal-naive");
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/benchmark-air-passengers.mjs [options]

Options:
  --csv <path>             CSV file path. Default: data/air_passengers.csv
  --train-size <n>         Number of initial rows used as training history. Default: 120
  --algorithm <name>       xgboost or seasonal-naive. Default: xgboost
  --period <n>             Seasonal period for seasonal-naive. Default: 12
  --json                  Print the full benchmark result as JSON
  -h, --help              Show this help
`);
}

function parseNumericSeriesCSV(csvText, dateKey = "Date", valueKey = "Passengers") {
  const trimmed = csvText.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = (lines[0] ?? "").split(",").map((h) => h.trim());
  const dateIndex = headers.indexOf(dateKey);
  const valueIndex = headers.indexOf(valueKey);

  if (dateIndex < 0) throw new Error(`missing date column: ${dateKey}`);
  if (valueIndex < 0) throw new Error(`missing value column: ${valueKey}`);

  return lines.slice(1).map((line, rowIndex) => {
    const cells = line.split(",").map((v) => v.trim());
    const value = Number(cells[valueIndex]);
    if (!Number.isFinite(value)) {
      throw new Error(`invalid numeric value at data row ${rowIndex + 1}`);
    }
    return { date: cells[dateIndex], value };
  });
}

function toLoadedRows(series) {
  return {
    headers: ["Date", "Passengers"],
    datetimeKey: "Date",
    targetKey: "Passengers",
    rows: series.map((point) => ({
      Date: point.date,
      Passengers: String(point.value),
    })),
  };
}

// This mirrors frontend/app/src/api.ts buildFeatures() and
// frontend/app/src/core.ts trainModel()/predictNext() for CLI benchmarking.
function buildFeatures(rows, datetimeKey, targetKey) {
  const MAX_LAG = 3;
  const ROLLING_WINDOW = 7;
  const EPS = 1e-9;

  if (!rows.length) {
    return { X: [], y: [], lastFeatureRow: [] };
  }

  const headers = Object.keys(rows[0] ?? {});
  const featureKeys = headers.filter(
    (h) => h !== datetimeKey && h !== targetKey
  );

  const toNum = (v) =>
    v === "" || v == null || (typeof v === "number" && Number.isNaN(v))
      ? NaN
      : Number(v);

  const seriesKeys = [...featureKeys];
  if (targetKey && headers.includes(targetKey)) {
    seriesKeys.push(targetKey);
  }

  const seriesMap = {};
  for (const key of seriesKeys) {
    seriesMap[key] = rows.map((r) => toNum(r[key]));
  }

  const n = rows.length;

  const getValue = (key, t) => {
    const arr = seriesMap[key];
    if (!arr || !arr.length) return NaN;
    const idx = t <= 0 ? 0 : t >= arr.length ? arr.length - 1 : t;
    return arr[idx];
  };

  const rollingMean = (key, t) => {
    const arr = seriesMap[key];
    if (!arr || !arr.length) return NaN;

    const end = t >= arr.length ? arr.length - 1 : t;
    const start = Math.max(0, end - (ROLLING_WINDOW - 1));

    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      const v = arr[i];
      if (Number.isFinite(v)) {
        sum += v;
        count += 1;
      }
    }
    return count === 0 ? NaN : sum / count;
  };

  const allKeysForCross = [...seriesKeys];

  const buildRowFeatures = (t, isFuture) => {
    const feats = [];
    const baseIndex = isFuture ? n - 1 : t;

    for (const key of featureKeys) {
      feats.push(getValue(key, baseIndex));
    }

    for (const key of featureKeys) {
      const cur = getValue(key, baseIndex);
      for (let lag = 1; lag <= MAX_LAG; lag += 1) {
        feats.push(getValue(key, baseIndex - lag));
      }
      const prev = getValue(key, baseIndex - 1);
      feats.push(cur - prev);
      feats.push(rollingMean(key, baseIndex));
    }

    for (let i = 0; i < allKeysForCross.length; i += 1) {
      const ki = allKeysForCross[i];
      const vi = getValue(ki, baseIndex);

      for (let j = i + 1; j < allKeysForCross.length; j += 1) {
        const kj = allKeysForCross[j];
        const vj = getValue(kj, baseIndex);
        feats.push(vi - vj);

        const denom = Math.abs(vj) < EPS ? (vj >= 0 ? EPS : -EPS) : vj;
        feats.push(vi / denom);
        feats.push(vi * vj);
      }
    }

    const targetCur = getValue(targetKey, baseIndex);
    for (let lag = 1; lag <= MAX_LAG; lag += 1) {
      feats.push(getValue(targetKey, baseIndex - lag));
    }
    const targetPrev = getValue(targetKey, baseIndex - 1);
    feats.push(targetCur - targetPrev);
    feats.push(rollingMean(targetKey, baseIndex));

    const timeIndex = isFuture ? n : t;
    feats.push(timeIndex);
    feats.push(Math.sin((2 * Math.PI * timeIndex) / 7));
    feats.push(Math.cos((2 * Math.PI * timeIndex) / 7));
    feats.push(Math.sin((2 * Math.PI * timeIndex) / 30));
    feats.push(Math.cos((2 * Math.PI * timeIndex) / 30));
    feats.push(Math.sin((2 * Math.PI * timeIndex) / 365));
    feats.push(Math.cos((2 * Math.PI * timeIndex) / 365));

    return feats.map((v) => (Number.isFinite(v) ? v : 0));
  };

  const X = [];
  const y = [];
  for (let t = 0; t < n; t += 1) {
    const target = Number(rows[t]?.[targetKey]);
    if (!Number.isFinite(target)) continue;
    X.push(buildRowFeatures(t, false));
    y.push(target);
  }

  return {
    X,
    y,
    lastFeatureRow: buildRowFeatures(n, true),
  };
}

function calculateForecastMetrics(pairs) {
  if (!pairs.length) {
    return { count: 0, mae: NaN, rmse: NaN, mape: NaN, smape: NaN };
  }

  let absError = 0;
  let squaredError = 0;
  let ape = 0;
  let sape = 0;
  let mapeCount = 0;
  let smapeCount = 0;

  for (const pair of pairs) {
    const error = pair.predicted - pair.actual;
    const abs = Math.abs(error);
    absError += abs;
    squaredError += error * error;

    if (pair.actual !== 0) {
      ape += abs / Math.abs(pair.actual);
      mapeCount += 1;
    }

    const denom = Math.abs(pair.actual) + Math.abs(pair.predicted);
    if (denom !== 0) {
      sape += (2 * abs) / denom;
      smapeCount += 1;
    }
  }

  return {
    count: pairs.length,
    mae: absError / pairs.length,
    rmse: Math.sqrt(squaredError / pairs.length),
    mape: mapeCount === 0 ? NaN : (ape / mapeCount) * 100,
    smape: smapeCount === 0 ? NaN : (sape / smapeCount) * 100,
  };
}

function validateTrainSize(series, trainSize) {
  if (!Number.isInteger(trainSize) || trainSize <= 0) {
    throw new Error("train-size must be a positive integer");
  }
  if (trainSize >= series.length) {
    throw new Error("train-size must be smaller than the series length");
  }
}

function runSeasonalNaiveBenchmark(series, trainSize, period) {
  validateTrainSize(series, trainSize);
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("period must be a positive integer");
  }

  const history = series.slice(0, trainSize);
  const test = series.slice(trainSize);
  const predictions = [];

  test.forEach((point) => {
    const seasonalIndex = history.length - period;
    const predicted = seasonalIndex >= 0
      ? history[seasonalIndex].value
      : history[history.length - 1].value;
    predictions.push({ date: point.date, actual: point.value, predicted });
    history.push(point);
  });

  return {
    algorithm: "seasonal-naive",
    ...calculateForecastMetrics(predictions),
    trainSize,
    testSize: test.length,
    predictions,
  };
}

function findFirstExistingPath(paths) {
  return paths.find((candidate) => existsSync(candidate)) ?? null;
}

async function resolveXGBoostCtor(mod) {
  if (!mod) return null;

  // ml-xgboost CommonJS usage returns a Promise-like value:
  // require("ml-xgboost").then((XGBoost) => ...).
  // The frontend loader also resolves Promise-like module values before
  // checking default, XGBoost, or function exports.
  if (typeof mod.then === "function") {
    return resolveXGBoostCtor(await mod);
  }

  if (mod.default) {
    const ctor = await resolveXGBoostCtor(mod.default);
    if (ctor) return ctor;
  }

  if (typeof mod.XGBoost === "function") {
    return mod.XGBoost;
  }

  if (typeof mod === "function") {
    return mod;
  }

  return null;
}

async function loadXGBoostCtor() {
  const packageJsonPath = findFirstExistingPath([
    resolve(process.cwd(), "frontend/app/package.json"),
    "/app/package.json",
  ]);

  if (!packageJsonPath) {
    throw new Error(
      "Could not find frontend/app/package.json or /app/package.json for loading ml-xgboost."
    );
  }

  const requireFromApp = createRequire(packageJsonPath);
  let mod;
  try {
    mod = requireFromApp("ml-xgboost");
  } catch (error) {
    if (error?.code !== "ERR_REQUIRE_ESM") {
      throw error;
    }
    const resolved = requireFromApp.resolve("ml-xgboost");
    mod = await import(pathToFileURL(resolved).href);
  }

  const ctor = await resolveXGBoostCtor(mod);
  if (ctor) return ctor;

  throw new Error("ml-xgboost module did not expose a usable constructor.");
}

function installLocalWasmFetch() {
  const wasmPath = findFirstExistingPath([
    resolve(process.cwd(), "frontend/app/public/vendor/ml-xgboost/xgboost.wasm"),
    "/app/public/vendor/ml-xgboost/xgboost.wasm",
  ]);

  if (!wasmPath) {
    throw new Error("Could not find xgboost.wasm for the benchmark.");
  }

  const wasm = readFileSync(wasmPath);
  const originalFetch = globalThis.fetch?.bind(globalThis);

  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input?.url;
    if (typeof url === "string" && url.includes("xgboost.wasm")) {
      return new Response(wasm, {
        status: 200,
        headers: { "Content-Type": "application/wasm" },
      });
    }

    if (typeof originalFetch === "function") {
      return originalFetch(input, init);
    }

    throw new Error(`fetch is unavailable for ${String(url)}`);
  };

  return () => {
    if (typeof originalFetch === "function") {
      globalThis.fetch = originalFetch;
    } else {
      delete globalThis.fetch;
    }
  };
}

async function trainExistingXGBoostModel(loaded) {
  const { X, y } = buildFeatures(
    loaded.rows,
    loaded.datetimeKey,
    loaded.targetKey
  );

  const restoreFetch = installLocalWasmFetch();
  try {
    const XGBoost = await loadXGBoostCtor();
    const booster = new XGBoost({
      booster: "gbtree",
      objective: "reg:linear",
      max_depth: 4,
      eta: 0.1,
      min_child_weight: 1,
      subsample: 0.8,
      colsample_bytree: 1,
      silent: 1,
      iterations: 200,
    });

    await booster.train(X, y);
    return booster;
  } finally {
    restoreFetch();
  }
}

async function predictExistingXGBoostNext(loaded, model) {
  const { lastFeatureRow } = buildFeatures(
    loaded.rows,
    loaded.datetimeKey,
    loaded.targetKey
  );
  const pred = await model.predict([lastFeatureRow]);
  return Array.isArray(pred) ? Number(pred[0]) : Number(pred);
}

async function runExistingXGBoostBenchmark(series, trainSize) {
  validateTrainSize(series, trainSize);

  const history = series.slice(0, trainSize);
  const test = series.slice(trainSize);
  const predictions = [];

  for (const point of test) {
    const loaded = toLoadedRows(history);
    const model = await trainExistingXGBoostModel(loaded);
    const predicted = await predictExistingXGBoostNext(loaded, model);

    if (!Number.isFinite(predicted)) {
      throw new Error(`xgboost returned a non-finite prediction for ${point.date}`);
    }

    predictions.push({ date: point.date, actual: point.value, predicted });
    history.push(point);
  }

  return {
    algorithm: "xgboost",
    ...calculateForecastMetrics(predictions),
    trainSize,
    testSize: test.length,
    predictions,
  };
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(4) : String(value);
}

const args = parseArgs(process.argv.slice(2));
const csvPath = resolve(process.cwd(), args.csv);
const series = parseNumericSeriesCSV(readFileSync(csvPath, "utf8"));

const result = args.algorithm === "seasonal-naive"
  ? runSeasonalNaiveBenchmark(series, args.trainSize, args.period)
  : await runExistingXGBoostBenchmark(series, args.trainSize);

if (args.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`AirPassengers ${result.algorithm} benchmark`);
  console.log(`csv: ${args.csv}`);
  console.log(`train_size: ${result.trainSize}`);
  console.log(`test_size: ${result.testSize}`);
  if (result.algorithm === "seasonal-naive") {
    console.log(`period: ${args.period}`);
  }
  console.log(`MAE: ${formatNumber(result.mae)}`);
  console.log(`RMSE: ${formatNumber(result.rmse)}`);
  console.log(`MAPE: ${formatNumber(result.mape)}%`);
  console.log(`sMAPE: ${formatNumber(result.smape)}%`);
}
