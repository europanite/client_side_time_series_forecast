#!/usr/bin/env node
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_CSV = "data/sample_data_synthetic.csv";
const DEFAULT_HORIZON = 16;
const DEFAULT_PERIOD = 7;

function parseArgs(argv) {
  const args = {
    csv: DEFAULT_CSV,
    horizon: DEFAULT_HORIZON,
    period: DEFAULT_PERIOD,
    trainSize: null,
    target: null,
    algorithm: "all",
    json: false,
    markdown: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--csv") args.csv = argv[++i];
    else if (arg === "--horizon") args.horizon = Number(argv[++i]);
    else if (arg === "--period") args.period = Number(argv[++i]);
    else if (arg === "--train-size") args.trainSize = Number(argv[++i]);
    else if (arg === "--target") args.target = argv[++i];
    else if (arg === "--algorithm") args.algorithm = argv[++i];
    else if (arg === "--json") args.json = true;
    else if (arg === "--markdown") args.markdown = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${arg}`);
    }
  }

  const allowed = ["all", "seasonal-naive", "lightgbm"];
  if (!allowed.includes(args.algorithm)) {
    throw new Error(`algorithm must be one of: ${allowed.join(", ")}`);
  }

  return args;
}

function printHelp() {
  console.log(`Usage: node scripts/benchmark-multivariate-lightgbm.mjs [options]

Fixed-origin multivariate benchmark for the browser LightGBM pipeline.

Defaults:
  csv:               data/sample_data.csv
  forecast horizon:  16
  seasonal period:   7
  train size:        all rows before the final horizon
  targets:           all numeric columns

During recursive forecasting, no numeric value from the holdout is fed back.
Non-target numeric series are advanced with seasonal continuation, matching the
application-level recursive forecast policy.

Options:
  --csv <path>
  --train-size <n>
  --horizon <n>
  --period <n>
  --target <column>
  --algorithm <all|seasonal-naive|lightgbm>
  --json
  --markdown
  -h, --help
`);
}

function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) throw new Error("CSV must contain a header and data rows");

  const headers = lines.shift().split(",").map((value) => value.trim());
  const rows = lines.map((line, rowIndex) => {
    const cells = line.split(",").map((value) => value.trim());
    if (cells.length !== headers.length) {
      throw new Error(
        `row ${rowIndex + 2} has ${cells.length} cells; expected ${headers.length}`
      );
    }

    const row = {};
    headers.forEach((header, index) => {
      row[header] = cells[index];
    });
    return row;
  });

  return { headers, rows };
}

function detectDateKey(headers) {
  return (
    headers.find((header) => {
      const normalized = header.toLowerCase();
      return normalized.includes("date") || normalized.includes("time");
    }) ?? null
  );
}

function numericKeys(rows, headers, dateKey) {
  return headers.filter((key) => {
    if (key === dateKey) return false;
    return rows.every((row) => Number.isFinite(Number(row[key])));
  });
}

function validateProtocol(rows, keys, args) {
  if (!rows.length) throw new Error("dataset has no rows");
  if (keys.length < 2) {
    throw new Error("multivariate benchmark requires at least two numeric columns");
  }
  if (!Number.isInteger(args.horizon) || args.horizon <= 0) {
    throw new Error("horizon must be a positive integer");
  }
  if (!Number.isInteger(args.period) || args.period <= 0) {
    throw new Error("period must be a positive integer");
  }

  const trainSize = args.trainSize ?? rows.length - args.horizon;
  if (!Number.isInteger(trainSize) || trainSize <= 0) {
    throw new Error("train-size must be a positive integer");
  }
  if (trainSize + args.horizon > rows.length) {
    throw new Error(
      `train-size + horizon exceeds dataset length ${rows.length}`
    );
  }
  if (trainSize <= args.period) {
    throw new Error("train-size must be larger than the seasonal period");
  }

  if (args.target && !keys.includes(args.target)) {
    throw new Error(
      `target ${args.target} is not one of the numeric columns: ${keys.join(", ")}`
    );
  }

  return trainSize;
}

function mean(values) {
  const finite = values.filter(Number.isFinite);
  if (!finite.length) return NaN;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
}

function seasonalContinuationRows(rows, key, period) {
  const values = rows.map((row) => Number(row[key])).filter(Number.isFinite);
  if (!values.length) return NaN;
  if (values.length <= period) return values[values.length - 1];

  const anchor = values[values.length - period];
  const recent = values.slice(Math.max(0, values.length - period));
  const previous = values.slice(
    Math.max(0, values.length - period * 2),
    Math.max(0, values.length - period)
  );
  const levelShift = mean(recent) - mean(previous);

  return Number.isFinite(anchor + levelShift)
    ? anchor + levelShift
    : values[values.length - 1];
}

function seasonalScale(values, period) {
  if (values.length <= period) return NaN;

  let sum = 0;
  let count = 0;
  for (let i = period; i < values.length; i += 1) {
    const current = values[i];
    const previous = values[i - period];
    if (!Number.isFinite(current) || !Number.isFinite(previous)) continue;
    sum += Math.abs(current - previous);
    count += 1;
  }

  return count ? sum / count : NaN;
}

function metrics(predictions, trainValues, period) {
  let absError = 0;
  let squaredError = 0;
  let ape = 0;
  let sape = 0;
  let mapeCount = 0;
  let smapeCount = 0;

  for (const row of predictions) {
    const error = row.predicted - row.actual;
    const abs = Math.abs(error);
    absError += abs;
    squaredError += error * error;

    if (row.actual !== 0) {
      ape += abs / Math.abs(row.actual);
      mapeCount += 1;
    }

    const denominator = Math.abs(row.actual) + Math.abs(row.predicted);
    if (denominator !== 0) {
      sape += (2 * abs) / denominator;
      smapeCount += 1;
    }
  }

  const n = predictions.length;
  const mae = absError / n;
  const scale = seasonalScale(trainValues, period);

  return {
    count: n,
    mae,
    rmse: Math.sqrt(squaredError / n),
    mape: mapeCount ? (ape / mapeCount) * 100 : NaN,
    smape: smapeCount ? (sape / smapeCount) * 100 : NaN,
    mase: Number.isFinite(scale) && scale !== 0 ? mae / scale : NaN,
  };
}

// Mirrors frontend/app/src/api.ts buildFeatures().
function buildFeatures(rows, datetimeKey, targetKey) {
  const MAX_LAG = 3;
  const ROLLING_WINDOW = 7;
  const EPS = 1e-9;

  if (!rows.length) {
    return { X: [], y: [], lastFeatureRow: [] };
  }

  const headers = Object.keys(rows[0] ?? {});
  const featureKeys = headers.filter(
    (header) => header !== datetimeKey && header !== targetKey
  );

  const toNum = (value) =>
    value === "" ||
    value == null ||
    (typeof value === "number" && Number.isNaN(value))
      ? NaN
      : Number(value);

  const seriesKeys = [...featureKeys];
  if (targetKey && headers.includes(targetKey)) {
    seriesKeys.push(targetKey);
  }

  const seriesMap = {};
  for (const key of seriesKeys) {
    seriesMap[key] = rows.map((row) => toNum(row[key]));
  }

  const n = rows.length;

  const getValue = (key, t) => {
    const array = seriesMap[key];
    if (!array || !array.length) return NaN;
    const index = t <= 0 ? 0 : t >= array.length ? array.length - 1 : t;
    return array[index];
  };

  const rollingMean = (key, t) => {
    const array = seriesMap[key];
    if (!array || !array.length) return NaN;

    const end = t >= array.length ? array.length - 1 : t;
    const start = Math.max(0, end - (ROLLING_WINDOW - 1));

    let sum = 0;
    let count = 0;
    for (let i = start; i <= end; i += 1) {
      const value = array[i];
      if (Number.isFinite(value)) {
        sum += value;
        count += 1;
      }
    }

    return count ? sum / count : NaN;
  };

  const allKeysForCross = [...seriesKeys];

  const buildRowFeatures = (t, isFuture) => {
    const features = [];
    const baseIndex = isFuture ? n - 1 : t;

    for (const key of featureKeys) {
      features.push(getValue(key, baseIndex));
    }

    for (const key of featureKeys) {
      const current = getValue(key, baseIndex);

      for (let lag = 1; lag <= MAX_LAG; lag += 1) {
        features.push(getValue(key, baseIndex - lag));
      }

      const previous = getValue(key, baseIndex - 1);
      features.push(current - previous);
      features.push(rollingMean(key, baseIndex));
    }

    for (let i = 0; i < allKeysForCross.length; i += 1) {
      const leftKey = allKeysForCross[i];
      const leftValue = getValue(leftKey, baseIndex);

      for (let j = i + 1; j < allKeysForCross.length; j += 1) {
        const rightKey = allKeysForCross[j];
        const rightValue = getValue(rightKey, baseIndex);

        features.push(leftValue - rightValue);

        const denominator =
          Math.abs(rightValue) < EPS
            ? rightValue >= 0
              ? EPS
              : -EPS
            : rightValue;
        features.push(leftValue / denominator);
        features.push(leftValue * rightValue);
      }
    }

    const timeIndex = isFuture ? n : t;
    features.push(timeIndex);
    features.push(Math.sin((2 * Math.PI * timeIndex) / 24));
    features.push(Math.cos((2 * Math.PI * timeIndex) / 24));
    features.push(Math.sin((2 * Math.PI * timeIndex) / 168));
    features.push(Math.cos((2 * Math.PI * timeIndex) / 168));

    return features;
  };

  const X = [];
  const y = [];

  for (let t = 0; t < n; t += 1) {
    X.push(buildRowFeatures(t, false));
    const targetSeries = seriesMap[targetKey];
    const targetValue =
      targetSeries && targetSeries.length > t
        ? targetSeries[t]
        : toNum(rows[t]?.[targetKey]);
    y.push(targetValue);
  }

  return {
    X,
    y,
    lastFeatureRow: buildRowFeatures(n, true),
  };
}

function findFirstExistingPath(paths) {
  return paths.find((candidate) => existsSync(candidate)) ?? null;
}

function frontendRequire() {
  const packageJsonPath = findFirstExistingPath([
    resolve(process.cwd(), "frontend/app/package.json"),
    "/app/package.json",
  ]);

  if (!packageJsonPath) {
    throw new Error("could not locate frontend/app/package.json");
  }

  return createRequire(packageJsonPath);
}

async function loadLightGBMFactory() {
  const requireFromApp = frontendRequire();
  let mod;

  try {
    mod = requireFromApp("@wlearn/lightgbm");
  } catch (error) {
    if (error?.code !== "ERR_REQUIRE_ESM") throw error;
    const resolved = requireFromApp.resolve("@wlearn/lightgbm");
    mod = await import(pathToFileURL(resolved).href);
  }

  const factory =
    mod?.LGBModel ??
    mod?.default?.LGBModel ??
    mod?.default;

  if (!factory || typeof factory.create !== "function") {
    throw new Error("@wlearn/lightgbm did not expose LGBModel.create()");
  }

  return factory;
}

async function trainLightGBM(trainRows, dateKey, targetKey) {
  const { X, y } = buildFeatures(trainRows, dateKey, targetKey);
  const LGBModel = await loadLightGBMFactory();
  const model = await LGBModel.create({
    task: "regression",
    learning_rate: 0.1,
    num_leaves: 31,
    max_depth: 4,
    subsample: 0.8,
    colsample_bytree: 1,
    numRound: 200,
    verbosity: -1,
  });

  await model.fit(X, y);
  return model;
}

function predictionValue(prediction) {
  if (
    prediction != null &&
    typeof prediction !== "number" &&
    typeof prediction.length === "number"
  ) {
    return Number(prediction[0]);
  }

  return Number(prediction);
}

function buildNextRow(historyRows, templateRow, headers, dateKey, targetKey, value, period) {
  const previous = historyRows[historyRows.length - 1] ?? {};
  const next = { ...previous };

  if (dateKey) {
    next[dateKey] = templateRow[dateKey];
  }

  for (const key of headers) {
    if (key === dateKey) continue;
    const previousValue = Number(previous[key]);
    if (!Number.isFinite(previousValue)) continue;

    next[key] =
      key === targetKey
        ? value
        : seasonalContinuationRows(historyRows, key, period);
  }

  return next;
}

async function runLightGBM(trainRows, testRows, headers, dateKey, targetKey, period) {
  const model = await trainLightGBM(trainRows, dateKey, targetKey);
  const historyRows = trainRows.map((row) => ({ ...row }));
  const predictions = [];

  try {
    for (const actualRow of testRows) {
      const { lastFeatureRow } = buildFeatures(
        historyRows,
        dateKey,
        targetKey
      );
      const raw = predictionValue(await model.predict([lastFeatureRow]));
      const seasonal = seasonalContinuationRows(historyRows, targetKey, period);
      const predicted = Number.isFinite(raw)
        ? raw * 0.35 + seasonal * 0.65
        : seasonal;

      if (!Number.isFinite(predicted)) {
        throw new Error(
          `non-finite LightGBM forecast for target ${targetKey}`
        );
      }

      predictions.push({
        label: dateKey ? actualRow[dateKey] : String(predictions.length + 1),
        actual: Number(actualRow[targetKey]),
        predicted,
      });

      // No leakage: no numeric value from actualRow is appended.
      historyRows.push(
        buildNextRow(
          historyRows,
          actualRow,
          headers,
          dateKey,
          targetKey,
          predicted,
          period
        )
      );
    }
  } finally {
    if (typeof model.dispose === "function") {
      model.dispose();
    }
  }

  return predictions;
}

function runSeasonalNaive(trainRows, testRows, dateKey, targetKey, period) {
  const historyRows = trainRows.map((row) => ({ ...row }));
  const predictions = [];

  for (const actualRow of testRows) {
    const predicted = seasonalContinuationRows(historyRows, targetKey, period);

    predictions.push({
      label: dateKey ? actualRow[dateKey] : String(predictions.length + 1),
      actual: Number(actualRow[targetKey]),
      predicted,
    });

    const previous = historyRows[historyRows.length - 1] ?? {};
    const next = { ...previous };
    if (dateKey) next[dateKey] = actualRow[dateKey];
    next[targetKey] = predicted;
    historyRows.push(next);
  }

  return predictions;
}

function resultFor(target, algorithm, predictions, trainRows, period) {
  const trainValues = trainRows.map((row) => Number(row[target]));
  return {
    target,
    algorithm,
    trainSize: trainRows.length,
    testSize: predictions.length,
    ...metrics(predictions, trainValues, period),
    predictions,
  };
}

function formatNumber(value) {
  return Number.isFinite(value) ? value.toFixed(4) : "N/A";
}

function aggregate(results) {
  const groups = new Map();

  for (const result of results) {
    if (!groups.has(result.algorithm)) {
      groups.set(result.algorithm, []);
    }
    groups.get(result.algorithm).push(result);
  }

  return [...groups.entries()].map(([algorithm, rows]) => ({
    algorithm,
    targets: rows.length,
    mae: mean(rows.map((row) => row.mae)),
    rmse: mean(rows.map((row) => row.rmse)),
    mape: mean(rows.map((row) => row.mape)),
    smape: mean(rows.map((row) => row.smape)),
    mase: mean(rows.map((row) => row.mase)),
  }));
}

function markdown(results, summary, args, trainSize, targets) {
  const rows = results.map(
    (result) =>
      `| ${result.target} | ${result.algorithm} | ${result.trainSize} | ` +
      `${result.testSize} | ${formatNumber(result.mae)} | ` +
      `${formatNumber(result.rmse)} | ${formatNumber(result.mape)}% | ` +
      `${formatNumber(result.smape)}% | ${formatNumber(result.mase)} |`
  );

  const summaryRows = summary.map(
    (result) =>
      `| ${result.algorithm} | ${result.targets} | ` +
      `${formatNumber(result.mae)} | ${formatNumber(result.rmse)} | ` +
      `${formatNumber(result.mape)}% | ${formatNumber(result.smape)}% | ` +
      `${formatNumber(result.mase)} |`
  );

  return [
    `### Multivariate LightGBM ${args.horizon}-step holdout`,
    "",
    `Dataset: \`${args.csv}\``,
    `Train: first ${trainSize}; holdout: next ${args.horizon}.`,
    `Targets: ${targets.map((target) => `\`${target}\``).join(", ")}.`,
    "No holdout numeric value is fed back during recursive forecasting.",
    "",
    "| Target | Model | Train | Horizon | MAE | RMSE | MAPE | sMAPE | MASE |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...rows,
    "",
    "Macro mean across targets:",
    "",
    "| Model | Targets | MAE | RMSE | MAPE | sMAPE | MASE |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...summaryRows,
  ].join("\n");
}

const args = parseArgs(process.argv.slice(2));
const csvPath = resolve(process.cwd(), args.csv);
const { headers, rows } = parseCSV(readFileSync(csvPath, "utf8"));
const dateKey = detectDateKey(headers);
const keys = numericKeys(rows, headers, dateKey);
const trainSize = validateProtocol(rows, keys, args);

const trainRows = rows.slice(0, trainSize);
const testRows = rows.slice(trainSize, trainSize + args.horizon);
const targets = args.target ? [args.target] : keys;

const requested =
  args.algorithm === "all"
    ? ["seasonal-naive", "lightgbm"]
    : [args.algorithm];

const results = [];

for (const target of targets) {
  for (const name of requested) {
    console.error(`running ${name} target=${target} ...`);

    const predictions =
      name === "lightgbm"
        ? await runLightGBM(
            trainRows,
            testRows,
            headers,
            dateKey,
            target,
            args.period
          )
        : runSeasonalNaive(
            trainRows,
            testRows,
            dateKey,
            target,
            args.period
          );

    results.push(
      resultFor(
        target,
        name === "lightgbm" ? "LightGBM WASM" : "seasonal-naive",
        predictions,
        trainRows,
        args.period
      )
    );
  }
}

const summary = aggregate(results);

if (args.json) {
  console.log(
    JSON.stringify(
      {
        dataset: args.csv,
        protocol: "fixed-origin-no-holdout-numeric-feedback",
        trainSize,
        horizon: args.horizon,
        period: args.period,
        dateKey,
        targets,
        results,
        macroMean: summary,
      },
      null,
      2
    )
  );
} else if (args.markdown || args.algorithm === "all") {
  console.log(markdown(results, summary, args, trainSize, targets));
} else {
  console.log(JSON.stringify(results, null, 2));
}
