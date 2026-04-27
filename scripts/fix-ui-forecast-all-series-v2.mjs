#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const appPath = path.join(process.cwd(), "frontend/app/src/App.tsx");
let src = fs.readFileSync(appPath, "utf8");

function replaceOrThrow(pattern, replacement, label) {
  if (!pattern.test(src)) {
    throw new Error(`${label} was not found in frontend/app/src/App.tsx`);
  }
  src = src.replace(pattern, replacement);
}

// Add forecastRows state if the current UI does not already have it.
if (!src.includes("setForecastRows")) {
  replaceOrThrow(
    /const \[forecast, setForecast\] = useState<string>\(""\);/,
    `const [forecast, setForecast] = useState<string>("");\n  const [forecastRows, setForecastRows] = useState<Array<{ label: string; value: number }>>([]);`,
    "forecast state"
  );
}

// Clear forecast rows when a new file is loaded.
if (!src.includes("setForecastRows([]);")) {
  src = src.replace(/setForecast\(""\);/g, `setForecast("");\n      setForecastRows([]);`);
}

const newHandlePredict = `async function handlePredict(): Promise<void> {
    if (!data || !target || !model) return;

    setStatus("predicting 10 steps ...");

    try {
      const horizon = 10;
      const numericKeys = getNumericKeys(data);
      const futureRows: Array<{ label: string; value: number }> = [];
      let workingData: LoadedData = {
        ...data,
        rows: [...data.rows],
      };

      for (let step = 1; step <= horizon; step += 1) {
        const previous = workingData.rows[workingData.rows.length - 1] ?? {};
        const nextRow: Record<string, any> = {};

        for (const header of data.headers) {
          if (header === data.datetimeKey) {
            nextRow[header] = buildFutureLabel(workingData, step);
          } else {
            nextRow[header] = previous[header] ?? "";
          }
        }

        for (const key of numericKeys) {
          const keyModel = key === target && step === 1
            ? model
            : await trainModel(workingData, key);
          const yhat = predictNext(workingData, key, keyModel);
          const value = Number(yhat);
          nextRow[key] = Number.isFinite(value) ? value : Number(previous[key] ?? 0);
        }

        workingData = {
          ...workingData,
          rows: [...workingData.rows, nextRow],
        };

        const targetValue = Number(nextRow[target]);
        futureRows.push({
          label: String(
            data.datetimeKey ? nextRow[data.datetimeKey] : workingData.rows.length - 1
          ),
          value: targetValue,
        });
      }

      setForecastRows(futureRows);
      setForecast(
        [
          \`Target="\${target}" → next 10 forecasts:\`,
          ...futureRows.map((row, i) =>
            \`+\${i + 1} \${row.label}: \${Number(row.value).toFixed(4)}\`
          ),
        ].join("\\n")
      );
      setStatus("predicted 10 steps");
    } catch (err: any) {
      setStatus(\`error: \${err.message || String(err)}\`);
    }
  }`;

// Replace either the original +1 handler or an earlier Forecast +10 handler.
replaceOrThrow(
  /(?:async\s+)?function handlePredict\(\):\s*(?:void|Promise<void>)\s*\{[\s\S]*?\n  \}\n\n  const chart =/,
  `${newHandlePredict}\n\n  const chart =`,
  "handlePredict"
);

// Make the chart include forecast rows.
src = src.replace(
  /const chart = buildChartData\(data(?:,\s*[^)]*)?\);/,
  `const chart = buildChartData(data, forecastRows, target);`
);

// Rename the button.
src = src.replace(/Predict \+1/g, "Forecast +10");

const chartTail = `function getNumericKeys(data: LoadedData): string[] {
  return data.headers.filter((h) => {
    if (h === data.datetimeKey) return false;
    return data.rows.some((r) => Number.isFinite(Number(r[h])));
  });
}

function buildFutureLabel(data: LoadedData, fallbackStep: number): string {
  if (!data.datetimeKey || data.rows.length === 0) {
    return String(data.rows.length + fallbackStep);
  }

  const key = data.datetimeKey;
  const lastRaw = data.rows[data.rows.length - 1]?.[key];
  const previousRaw = data.rows.length >= 2
    ? data.rows[data.rows.length - 2]?.[key]
    : null;

  const last = normalizeDateValue(lastRaw);
  const previous = normalizeDateValue(previousRaw);

  if (!last) {
    return String(data.rows.length + fallbackStep);
  }

  if (previous) {
    const delta = last.getTime() - previous.getTime();
    if (Number.isFinite(delta) && delta > 0) {
      return formatDateLike(new Date(last.getTime() + delta), lastRaw);
    }
  }

  const next = new Date(last.getTime());
  next.setDate(next.getDate() + 1);
  return formatDateLike(next, lastRaw);
}

function normalizeDateValue(value: any): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    // Excel serial date: days since 1899-12-30.
    return new Date(Math.round((value - 25569) * 86400 * 1000));
  }

  if (typeof value === "string") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d;
  }

  return null;
}

function formatDateLike(date: Date, original: any): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  if (typeof original === "string" && /^\\d{4}-\\d{2}$/.test(original)) {
    return `${yyyy}-${mm}`;
  }

  return `${yyyy}-${mm}-${dd}`;
}

function buildChartData(
  data: LoadedData | null,
  forecastRows: Array<{ label: string; value: number }> = [],
  target: string | null = null
): { data: ChartData<"line">; options: ChartOptions<"line"> } | null {
  if (!data || !data.rows.length) return null;

  const useDatetime =
    !!data.datetimeKey && data.headers.includes(data.datetimeKey);

  const observedLabels: string[] = useDatetime
    ? data.rows.map((r) => String(r[data.datetimeKey as string] ?? ""))
    : data.rows.map((_, i) => String(i));

  const labels = [
    ...observedLabels,
    ...forecastRows.map((row) => row.label),
  ];

  const numericKeys = getNumericKeys(data);

  if (!numericKeys.length) return null;

  const palette = [
    "#22c55e",
    "#60a5fa",
    "#f59e0b",
    "#ef4444",
    "#a78bfa",
    "#14b8a6",
  ];

  const datasets = numericKeys.map((k, i) => ({
    label: k,
    data: [
      ...data.rows.map((r) => Number(r[k])),
      ...forecastRows.map(() => null),
    ],
    borderColor: palette[i % palette.length],
    backgroundColor: palette[i % palette.length],
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.25,
  }));

  if (forecastRows.length && target) {
    const lastActual = Number(data.rows[data.rows.length - 1]?.[target]);
    datasets.push({
      label: `${target} forecast`,
      data: [
        ...data.rows.slice(0, -1).map(() => null),
        Number.isFinite(lastActual) ? lastActual : null,
        ...forecastRows.map((row) => row.value),
      ],
      borderColor: "#f97316",
      backgroundColor: "#f97316",
      borderWidth: 3,
      borderDash: [6, 4],
      pointRadius: 3,
      tension: 0.25,
    });
  }

  return {
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: { enabled: true },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 55,
            minRotation: 55,
            color: "#6b7280",
          },
          grid: { display: false },
        },
        y: {
          ticks: { color: "#6b7280" },
          grid: { color: "rgba(148,163,184,0.15)" },
        },
      },
    },
  };
}
`;

const buildChartIndex = src.indexOf("function buildChartData(");
if (buildChartIndex === -1) {
  throw new Error("buildChartData was not found in frontend/app/src/App.tsx");
}
src = src.slice(0, buildChartIndex) + chartTail;

fs.writeFileSync(appPath, src);
console.log("Updated frontend/app/src/App.tsx to forecast all numeric series for 10 steps.");
