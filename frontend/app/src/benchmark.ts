export type NumericPoint = {
  date: string;
  value: number;
};

export type ForecastPair = {
  date: string;
  actual: number;
  predicted: number;
};

export type ForecastMetrics = {
  count: number;
  mae: number;
  rmse: number;
  mape: number;
  smape: number;
};

export type BenchmarkResult = ForecastMetrics & {
  trainSize: number;
  testSize: number;
  predictions: ForecastPair[];
};

export type OneStepPredictor = (history: NumericPoint[], step: number) => number;

export function parseNumericSeriesCSV(
  csvText: string,
  dateKey = "Date",
  valueKey = "Passengers"
): NumericPoint[] {
  const trimmed = csvText.trim();
  if (!trimmed) return [];

  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = (lines[0] ?? "").split(",").map((h) => h.trim());
  const dateIndex = headers.indexOf(dateKey);
  const valueIndex = headers.indexOf(valueKey);

  if (dateIndex < 0) {
    throw new Error(`missing date column: ${dateKey}`);
  }
  if (valueIndex < 0) {
    throw new Error(`missing value column: ${valueKey}`);
  }

  return lines.slice(1).map((line, rowIndex) => {
    const cells = line.split(",").map((v) => v.trim());
    const value = Number(cells[valueIndex]);
    if (!Number.isFinite(value)) {
      throw new Error(`invalid numeric value at data row ${rowIndex + 1}`);
    }
    return {
      date: cells[dateIndex],
      value,
    };
  });
}

export function chronologicalSplit<T>(items: T[], trainSize: number): {
  train: T[];
  test: T[];
} {
  if (!Number.isInteger(trainSize) || trainSize <= 0) {
    throw new Error("trainSize must be a positive integer");
  }
  if (trainSize >= items.length) {
    throw new Error("trainSize must be smaller than the series length");
  }
  return {
    train: items.slice(0, trainSize),
    test: items.slice(trainSize),
  };
}

export function calculateForecastMetrics(pairs: ForecastPair[]): ForecastMetrics {
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

export function runOneStepBenchmark(
  series: NumericPoint[],
  trainSize: number,
  predict: OneStepPredictor
): BenchmarkResult {
  const { train, test } = chronologicalSplit(series, trainSize);
  const history = [...train];
  const predictions: ForecastPair[] = [];

  test.forEach((point, step) => {
    const predicted = Number(predict([...history], step));
    if (!Number.isFinite(predicted)) {
      throw new Error(`predictor returned a non-finite value at step ${step}`);
    }
    predictions.push({
      date: point.date,
      actual: point.value,
      predicted,
    });
    history.push(point);
  });

  return {
    ...calculateForecastMetrics(predictions),
    trainSize: train.length,
    testSize: test.length,
    predictions,
  };
}

export function seasonalNaivePredictor(period = 12): OneStepPredictor {
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("period must be a positive integer");
  }

  return (history) => {
    const seasonalIndex = history.length - period;
    const fallback = history[history.length - 1]?.value;
    return seasonalIndex >= 0 ? history[seasonalIndex].value : fallback;
  };
}
