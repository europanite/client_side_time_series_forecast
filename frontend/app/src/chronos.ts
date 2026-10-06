import * as ort from "onnxruntime-web";
import { DEFAULT_FORECAST_HORIZON } from "./forecast-config";

const MODEL_URL =
  "https://huggingface.co/OpenSTEF/chronos-2-small-onnx/resolve/main/chronos-2-small_int8.onnx";

const MODEL_NAME = "Chronos-2-small INT8";

const MAX_CONTEXT_LENGTH = 5760;
const PREDICTION_LENGTH = DEFAULT_FORECAST_HORIZON;

// The exported ONNX graph keeps the model's native forecast horizon:
// 42 output patches * 16 points = 672 future positions.
// Run the full internal horizon, then expose only the first
// PREDICTION_LENGTH points to the existing UI.
const MODEL_OUTPUT_PATCH_SIZE = 16;
const MODEL_HORIZON_PATCHES = 42;
const MODEL_HORIZON =
  MODEL_OUTPUT_PATCH_SIZE * MODEL_HORIZON_PATCHES;

const QUANTILES = [
  0.01,
  0.05,
  0.1,
  0.2,
  0.3,
  0.4,
  0.5,
  0.6,
  0.7,
  0.8,
  0.9,
  0.95,
  0.99,
] as const;

const Q10_INDEX = QUANTILES.indexOf(0.1);
const Q50_INDEX = QUANTILES.indexOf(0.5);
const Q90_INDEX = QUANTILES.indexOf(0.9);

type ProgressCallback = (message: string) => void;

export type ChronosForecast = {
  lower: number[];
  median: number[];
  upper: number[];
  quantileLevels: number[];
};

let sessionPromise: Promise<ort.InferenceSession> | null = null;

// GitHub Pages does not provide cross-origin isolation.
// Keep WASM single-threaded for maximum browser compatibility.
ort.env.wasm.numThreads = 1;

// Load the ONNX Runtime WASM runtime from a pinned CDN path.
// Model inference itself still happens entirely in the browser.
ort.env.wasm.wasmPaths =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.30.0/dist/";

async function fetchModel(
  onProgress?: ProgressCallback
): Promise<Uint8Array> {
  onProgress?.(`downloading ${MODEL_NAME} ...`);

  const response = await fetch(MODEL_URL);

  if (!response.ok) {
    throw new Error(
      `Failed to download ${MODEL_NAME}: ` +
      `${response.status} ${response.statusText}`
    );
  }

  const total = Number(
    response.headers.get("content-length") ?? 0
  );

  if (!response.body) {
    return new Uint8Array(await response.arrayBuffer());
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];

  let received = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;
    if (!value) continue;

    chunks.push(value);
    received += value.length;

    if (total > 0) {
      const percent = (received / total) * 100;

      onProgress?.(
        `downloading ${MODEL_NAME}: ${percent.toFixed(1)}%`
      );
    } else {
      onProgress?.(
        `downloading ${MODEL_NAME}: ` +
        `${(received / 1024 / 1024).toFixed(1)} MB`
      );
    }
  }

  const model = new Uint8Array(received);

  let offset = 0;

  for (const chunk of chunks) {
    model.set(chunk, offset);
    offset += chunk.length;
  }

  return model;
}

async function createSession(
  onProgress?: ProgressCallback
): Promise<ort.InferenceSession> {
  const model = await fetchModel(onProgress);

  onProgress?.(`initializing ${MODEL_NAME} ...`);

  return await ort.InferenceSession.create(model, {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  });
}

async function getSession(
  onProgress?: ProgressCallback
): Promise<ort.InferenceSession> {
  if (!sessionPromise) {
    sessionPromise = createSession(onProgress).catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }

  return await sessionPromise;
}

export async function forecastChronos(
  series: number[],
  onProgress?: ProgressCallback
): Promise<ChronosForecast> {
  const clean = series.filter((value) =>
    Number.isFinite(value)
  );

  if (clean.length < 16) {
    throw new Error(
      "Chronos-2 requires at least 16 numeric observations."
    );
  }

  const contextValues = clean.slice(-MAX_CONTEXT_LENGTH);

  // Chronos-2 uses patches of 16 values. The original PyTorch
  // implementation left-pads incomplete patches with NaN.
  // The ONNX export does not reliably preserve that Python branch,
  // so reproduce the padding explicitly before inference.
  const patchSize = 16;
  const paddingLength =
    (patchSize - (contextValues.length % patchSize)) % patchSize;

  const contextLength =
    contextValues.length + paddingLength;

  // The ONNX graph still contains a reshape to [1, 42, 16].
  // Therefore future_covariates and its mask must cover all 672
  // internal future positions, even though the UI displays 16.
  const horizon = MODEL_HORIZON;

  const context =
    new Float32Array(contextLength);

  context.fill(Number.NaN);

  context.set(
    contextValues,
    paddingLength
  );

  const attentionMask =
    new Float32Array(contextLength);

  attentionMask.fill(
    1,
    paddingLength
  );

  onProgress?.(
    `Chronos context: ${contextValues.length} observations + ${paddingLength} padding = ${contextLength}`
  );

  onProgress?.(
    `Chronos internal horizon: ${MODEL_HORIZON} steps; displaying first ${PREDICTION_LENGTH}`
  );

  // For the target series, future values are unknown.
  // The zero mask tells Chronos that these values must
  // be forecast rather than treated as known covariates.
  const futureCovariates =
    new Float32Array(horizon);

  const futureCovariatesMask =
    new Float32Array(horizon);

  const groupIds =
    BigInt64Array.from([0n]);

  const session = await getSession(onProgress);

  onProgress?.(`running ${MODEL_NAME} forecast ...`);

  const feeds: Record<string, ort.Tensor> = {
    context: new ort.Tensor(
      "float32",
      context,
      [1, contextLength]
    ),

    group_ids: new ort.Tensor(
      "int64",
      groupIds,
      [1]
    ),

    attention_mask: new ort.Tensor(
      "float32",
      attentionMask,
      [1, contextLength]
    ),

    future_covariates: new ort.Tensor(
      "float32",
      futureCovariates,
      [1, horizon]
    ),

    future_covariates_mask: new ort.Tensor(
      "float32",
      futureCovariatesMask,
      [1, horizon]
    ),
  };

  const results = await session.run(feeds);

  const output = results.quantile_preds;

  if (!output) {
    throw new Error(
      "Chronos-2 did not return quantile_preds."
    );
  }

  const dims = output.dims.map(Number);

  if (dims.length !== 3) {
    throw new Error(
      `Unexpected Chronos output shape: [${dims.join(", ")}]`
    );
  }

  const [batchSize, quantileCount, outputLength] = dims;

  if (
    batchSize !== 1 ||
    quantileCount !== QUANTILES.length
  ) {
    throw new Error(
      `Unexpected Chronos output shape: [${dims.join(", ")}]`
    );
  }

  const data = output.data as ArrayLike<number>;

  const valueAt = (
    quantileIndex: number,
    timeIndex: number
  ): number => {
    const index =
      quantileIndex * outputLength + timeIndex;

    return Number(data[index]);
  };

  const length = Math.min(
    PREDICTION_LENGTH,
    outputLength
  );

  const lower: number[] = [];
  const median: number[] = [];
  const upper: number[] = [];

  for (let t = 0; t < length; t++) {
    lower.push(valueAt(Q10_INDEX, t));
    median.push(valueAt(Q50_INDEX, t));
    upper.push(valueAt(Q90_INDEX, t));
  }

  return {
    lower,
    median,
    upper,
    quantileLevels: [...QUANTILES],
  };
}

export async function disposeChronos(): Promise<void> {
  const current = sessionPromise;

  sessionPromise = null;

  if (!current) return;

  try {
    const session = await current;
    await session.release();
  } catch {
    // Best-effort cleanup.
  }
}

// Compatibility adapter for the existing React UI.
export type ChronosForecastResult = {
  points: Array<{
    label: string;
    value: number;
  }>;
  lower: number[];
  median: number[];
  upper: number[];
};

export async function forecastChronosNext16(
  data: { rows: any[] },
  targetKey: string,
  onProgress?: (message: string) => void
): Promise<ChronosForecastResult> {
  const series = data.rows
    .map((row) => Number(row[targetKey]))
    .filter((value) => Number.isFinite(value));

  const result = await forecastChronos(
    series,
    onProgress
  );

  return {
    points: result.median.map(
      (value: number, index: number) => ({
        label: `t+${index + 1}`,
        value,
      })
    ),
    lower: result.lower,
    median: result.median,
    upper: result.upper,
  };
}
