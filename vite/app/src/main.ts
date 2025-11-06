import "./style.css";
import { parseCSV, parseXLSX, buildFeatures } from "./api";
import { initXGBoostCtor } from "./xgb";

let Chart: any;

type TrainState = {
  targetKey: string | null;
  datetimeKey: string | null;
  rows: any[];
  headers: string[];
  model: any | null;   // Booster instance
  xgbCtor: any | null; // XGBoost constructor/class returned by factory
};

const state: TrainState = {
  targetKey: null,
  datetimeKey: null,
  rows: [],
  headers: [],
  model: null,
  xgbCtor: null,
};

// ---- UI scaffold ------------------------------------------------------------

const app = document.createElement("div");
app.id = "app";
document.body.appendChild(app);

app.innerHTML = `
  <h1>Time-series Forecaster</h1>

  <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
    <input id="file" type="file" accept=".csv, .xlsx" />
    <span id="status" style="opacity:0.8">Status: idle</span>
  </div>

  <div style="margin-top:12px; display:flex; gap:12px; align-items:center;">
    <label>Datetime column:</label>
    <select id="datetimeSelect"></select>

    <label>Target:</label>
    <select id="targetSelect"></select>

    <button id="trainBtn" disabled>Train (XGBoost)</button>
    <button id="predictBtn" disabled>Predict +1</button>
  </div>

  <div id="chartWrap" style="max-width:1100px; width:95vw; height:420px; margin-top:16px;">
    <canvas id="chart"></canvas>
  </div>

  <pre id="out" style="margin-top:16px; padding:12px; background:#0b1020; color:#e6f1ff; border-radius:8px; white-space:pre-wrap;"></pre>
`;

// ---- Element refs -----------------------------------------------------------

const els = {
  file: document.getElementById("file") as HTMLInputElement,
  status: document.getElementById("status") as HTMLSpanElement,
  dtSel: document.getElementById("datetimeSelect") as HTMLSelectElement,
  targetSel: document.getElementById("targetSelect") as HTMLSelectElement,
  train: document.getElementById("trainBtn") as HTMLButtonElement,
  predict: document.getElementById("predictBtn") as HTMLButtonElement,
  chart: document.getElementById("chart") as HTMLCanvasElement,
  out: document.getElementById("out") as HTMLPreElement,
};

function setStatus(s: string) {
  els.status.textContent = `Status: ${s}`;
}

// ---- Chart rendering --------------------------------------------------------

let chartInstance: any = null;

async function ensureChart() {
  if (!Chart) {
    Chart = (await import("chart.js/auto")).default;
  }
}

function fillSelect(sel: HTMLSelectElement, options: string[]) {
  sel.innerHTML = options.map((o) => `<option value="${o}">${o}</option>`).join("");
}

async function renderChart(rows: any[], headers: string[], datetimeKey: string | null) {
  await ensureChart();
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }
  if (!rows?.length || !headers?.length) return;

  const useDatetime = !!(datetimeKey && headers.includes(datetimeKey));
  const xLabels = useDatetime
    ? rows.map((r) => String(r[datetimeKey] ?? ""))
    : rows.map((_, i) => i);

  const isNumericCol = (key: string) => {
    const n = Math.min(rows.length, 10);
    for (let i = 0; i < n; i++) {
      const v = rows[i]?.[key];
      const num = typeof v === "number" ? v : Number((v ?? "").toString().trim());
      if (Number.isFinite(num)) return true;
    }
    return false;
  };

  const seriesKeys = headers.filter((h) => h !== datetimeKey).filter(isNumericCol);
  if (!seriesKeys.length) {
    console.warn("[chart] no numeric series detected");
    return;
  }

  if (!seriesKeys.length) {
    console.warn("[chart] no numeric series detected", { headers, datetimeKey });
    return;
  }

  const toNumOrNull = (v: any) => {
    const num = typeof v === "number" ? v : Number((v ?? "").toString().trim());
    return Number.isFinite(num) ? num : null;
  };

  const palette = [
    "#22c55e", "#60a5fa", "#f59e0b", "#ef4444",
    "#a78bfa", "#14b8a6", "#e11d48", "#94a3b8",
  ];

   const datasets = seriesKeys.map((k, i) => {
     const points = rows.map((r, idx) => ({
       x: useDatetime ? xLabels[idx] : idx,
       y: toNumOrNull(r[k]),
     }));
     return {
       label: k,
       data: points,
       borderColor: palette[i % palette.length],
       backgroundColor: palette[i % palette.length],
       borderWidth: 2,
       pointRadius: 1,
       tension: 0.25,
       spanGaps: true,
     };
   });

  let yMin = Number.POSITIVE_INFINITY;
  let yMax = Number.NEGATIVE_INFINITY;

  for (const ds of datasets) {
    for (const p of ds.data as Array<{x:any; y:number|null}>) {
      const v = p?.y;
      if (v == null) continue;
      if (v < yMin) yMin = v;
      if (v > yMax) yMax = v;
    }
  }

  if (!Number.isFinite(yMin) || !Number.isFinite(yMax)) {
    console.warn("[chart] all points are null; nothing to draw", { seriesKeys });
    return;
  }

  if (yMin === yMax) {
    yMin -= 1;
    yMax += 1;
  }
  const pad = (yMax - yMin) * 0.05;
  const suggestedMin = yMin - pad;
  const suggestedMax = yMax + pad;

  const wrap = document.getElementById("chartWrap") as HTMLDivElement | null;
  if (wrap) {
    wrap.style.minHeight = "320px";
    wrap.style.minWidth = "320px";
  }

  const ctx = els.chart.getContext("2d");
  if (!ctx) return;

  chartInstance = new Chart(ctx, {
    type: "line",
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: true, position: "top" } },
      scales: {
        x: {
          display: true,
          grid: { display: false },
          type: useDatetime ? "category" : "linear",
        },
        y: {
          type: "linear",
          display: true,
          grid: { color: "rgba(255,255,255,0.1)" },
          suggestedMin,
          suggestedMax,
        },
      },
    },
  });

  chartInstance.update();
}

function updateSelectors(headers: string[]) {
  fillSelect(els.dtSel, headers);
  fillSelect(els.targetSel, headers);
  const dtCandidate = headers.find(
    (h) => h.toLowerCase().includes("date") || h.toLowerCase().includes("time")
  );
  if (dtCandidate) els.dtSel.value = dtCandidate;
  const targetCandidate = headers.find((h) => h !== els.dtSel.value);
  if (targetCandidate) els.targetSel.value = targetCandidate;
}

// ---- File loading (CSV/XLSX) -----------------------------------------------

async function loadCSVText(text: string) {
  // Prefer PapaParse if available; fall back to tiny parser inside api.ts
  try {
    const Papa = (await import("papaparse")).default;
    (window as any).__parseCSV = (t: string) => {
      const res = Papa.parse(t, { header: true, dynamicTyping: true, skipEmptyLines: true });
      return { rows: res.data as any[], headers: res.meta.fields ?? [] };
    };
  } catch {
    // fallback handled by parseCSV
  }
  const { rows, headers } = parseCSV(text);
  state.rows = rows;
  state.headers = headers;
  updateSelectors(headers);
  state.datetimeKey = els.dtSel.value || null;
  state.targetKey = els.targetSel.value || null;

  await renderChart(rows, headers, state.datetimeKey);
  els.train.disabled = !state.targetKey;
  els.predict.disabled = true;
  setStatus("data loaded");
}

async function loadXLSXBuffer(buf: ArrayBuffer) {
  const XLSX = await import("xlsx");
  (window as any).XLSX = XLSX; // api.ts expects XLSX on window
  const { rows, headers } = parseXLSX(buf);
  state.rows = rows;
  state.headers = headers;
  updateSelectors(headers);
  state.datetimeKey = els.dtSel.value || null;
  state.targetKey = els.targetSel.value || null;

  await renderChart(rows, headers, state.datetimeKey);
  els.train.disabled = !state.targetKey;
  els.predict.disabled = true;
  setStatus("data loaded");
}

// ---- Events ----------------------------------------------------------------

els.file.addEventListener("change", async () => {
  const f = els.file.files?.[0];
  if (!f) return;
  setStatus(`reading ${f.name} ...`);
  const ext = f.name.toLowerCase().split(".").pop();
  try {
    if (ext === "csv") {
      const text = await f.text();
      await loadCSVText(text);
    } else if (ext === "xlsx") {
      const buf = await f.arrayBuffer();
      await loadXLSXBuffer(buf);
    } else {
      throw new Error("Unsupported file type (use .csv or .xlsx)");
    }
  } catch (err: any) {
    setStatus(`error: ${err.message || err}`);
  }
});

els.dtSel.addEventListener("change", async () => {
  state.datetimeKey = els.dtSel.value || null;
  await renderChart(state.rows, state.headers, state.datetimeKey);
});

els.targetSel.addEventListener("change", () => {
  state.targetKey = els.targetSel.value || null;
  els.train.disabled = !state.targetKey;
});

// ---- Train / Predict (ml-xgboost through xgb.ts) ---------------------------

els.train.addEventListener("click", async () => {
  if (!state.rows.length || !state.targetKey) return;

  setStatus("building features ...");
  els.train.disabled = true;
  els.predict.disabled = true;

  const { X, y } = buildFeatures(
    state.rows,
    state.datetimeKey!,
    state.targetKey
  );

  try {
    setStatus("initializing ml-xgboost ...");
    const XGBoost = await initXGBoostCtor();     // ← xgb.ts handles WASM path & export shape
    state.xgbCtor = XGBoost;

    const booster = new XGBoost({
      booster: "gbtree",
      // Older XGBoost build in this WASM doesn't support "reg:squarederror"
      // Use the legacy alias:
      objective: "reg:linear",
      max_depth: 4,
      eta: 0.1,
      min_child_weight: 1,
      subsample: 0.8,
      colsample_bytree: 1,
      silent: 1,
      iterations: 200,
      // (optional) eval_metric: "rmse"
    });

    setStatus("training (ml-xgboost) ...");
    booster.train(X, y);

    state.model = booster;
    setStatus("trained with ml-xgboost");
    els.predict.disabled = false;
  } catch (e: any) {
    console.error(e);
    state.model = null;
    setStatus(`error: failed to initialize or train ml-xgboost (${e?.message || e})`);
  } finally {
    els.train.disabled = false;
  }
});

els.predict.addEventListener("click", () => {
  if (!state.rows.length || !state.targetKey || !state.model) return;
  const { lastFeatureRow } = buildFeatures(
    state.rows,
    state.datetimeKey!,
    state.targetKey
  );
  const pred = state.model.predict([lastFeatureRow]);
  const yhat = Array.isArray(pred) ? Number(pred[0]) : Number(pred);
  els.out.textContent = `Target="${state.targetKey}" → next(+1) forecast: ${
    Number.isFinite(yhat) ? yhat.toFixed(4) : String(yhat)
  }`;
  setStatus("predicted");
});

// Free model if possible
window.addEventListener("beforeunload", () => {
  try { state.model?.free?.(); } catch { /* ignore */ }
});
