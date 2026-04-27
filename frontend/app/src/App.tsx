import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native-web";
import type { LoadedData } from "./core";
import {
  loadFromCSV,
  loadFromXLSX,
  trainModel,
  predictNext,
  forecastNextN,
} from "./core";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
} from "chart.js";
import type { ChartData, ChartOptions } from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip
);


type ForecastPoint = {
  label: string;
  value: number;
};

function parseDateLike(value: unknown): Date | null {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value;
  }
  if (typeof value !== "string" && typeof value !== "number") {
    return null;
  }
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export default function App() {
  const [status, setStatus] = useState("idle");
  const [data, setData] = useState<LoadedData | null>(null);
  const [target, setTarget] = useState<string | null>(null);
  const [model, setModel] = useState<any>(null);
  const [forecast, setForecast] = useState<string>("");
  const [forecastPoints, setForecastPoints] = useState<ForecastPoint[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadSampleData(): Promise<void> {
      setStatus("loading sample data ...");

      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}sample_data.csv`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(`failed to load sample_data.csv (${response.status})`);
        }

        const text = await response.text();
        const loaded = await loadFromCSV(text);

        if (cancelled) return;

        setData(loaded);
        setTarget(guessTarget(loaded));
        setModel(null);
        setForecast("");
        setForecastPoints([]);
        setStatus("sample data loaded");
      } catch (err: any) {
        if (cancelled) return;
        setStatus(`error: ${err.message || String(err)}`);
      }
    }

    void loadSampleData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>
  ): Promise<void> {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(`reading ${file.name} ...`);

    const ext = file.name.toLowerCase().split(".").pop();
    try {
      if (ext === "csv") {
        const text = await file.text();
        const loaded = await loadFromCSV(text);
        setData(loaded);
        setTarget(guessTarget(loaded));
        setStatus("data loaded");
      } else if (ext === "xlsx") {
        const buf = await file.arrayBuffer();
        const loaded = await loadFromXLSX(buf);
        setData(loaded);
        setTarget(guessTarget(loaded));
        setStatus("data loaded");
      } else {
        throw new Error("Unsupported file type (use .csv or .xlsx)");
      }

      setModel(null);
      setForecast("");
      setForecastPoints([]);
    } catch (err: any) {
      setStatus(`error: ${err.message || String(err)}`);
    }
  }

  function guessTarget(loaded: LoadedData): string | null {
    return loaded.headers.find((h) => h !== loaded.datetimeKey) ?? null;
  }

  async function handleTrain(): Promise<void> {
    if (!data || !target) return;
    setStatus("training ...");
    try {
      const booster = await trainModel(data, target);
      setModel(booster);
      setForecast("");
      setForecastPoints([]);
      setStatus("trained");
    } catch (err: any) {
      setStatus(`error: ${err.message || String(err)}`);
    }
  }

  async function predictFuturePoints(
    baseData: LoadedData,
    selectedTarget: string,
    initialModel: any,
    steps: number
  ): Promise<ForecastPoint[]> {
    const numericKeys = baseData.headers.filter((header) => {
      if (header === baseData.datetimeKey) return false;
      return baseData.rows.some((row) => Number.isFinite(Number(row[header])));
    });

    if (!numericKeys.includes(selectedTarget)) {
      throw new Error(`Target column is not numeric: ${selectedTarget}`);
    }

    const workingRows = baseData.rows.map((row) => ({ ...row }));
    const points: ForecastPoint[] = [];

    for (let step = 0; step < steps; step += 1) {
      const workingData: LoadedData = {
        ...baseData,
        rows: workingRows,
      };
      const previousRow = workingRows[workingRows.length - 1] ?? {};
      const nextRow: Record<string, any> = { ...previousRow };

      if (baseData.datetimeKey) {
        nextRow[baseData.datetimeKey] = buildFutureLabel(
          workingRows,
          baseData.datetimeKey,
          step + 1
        );
      }

      for (const key of numericKeys) {
        const keyModel =
          key === selectedTarget
            ? initialModel
            : await trainModel(workingData, key);
        const predicted = Number(predictNext(workingData, key, keyModel));

        nextRow[key] = Number.isFinite(predicted)
          ? predicted
          : Number(previousRow[key] ?? 0);
      }

      workingRows.push(nextRow);
      points.push({
        label: baseData.datetimeKey
          ? String(nextRow[baseData.datetimeKey])
          : String(baseData.rows.length + step),
        value: Number(nextRow[selectedTarget]),
      });
    }

    return points;
  }

  function buildFutureLabel(
    rows: Record<string, any>[],
    datetimeKey: string,
    fallbackStep: number
  ): string {
    const lastRaw = rows[rows.length - 1]?.[datetimeKey];
    const prevRaw = rows[rows.length - 2]?.[datetimeKey];
    const lastDate = parseDateLike(lastRaw);
    const prevDate = parseDateLike(prevRaw);

    if (lastDate) {
      const next = new Date(lastDate.getTime());
      const lastText = String(lastRaw ?? "");

      if (/^\d{4}-\d{2}$/.test(lastText)) {
        next.setMonth(next.getMonth() + 1);
        return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
      }

      if (prevDate) {
        const delta = lastDate.getTime() - prevDate.getTime();
        if (Number.isFinite(delta) && delta > 0) {
          next.setTime(lastDate.getTime() + delta);
          return formatDateLike(next, lastText);
        }
      }

      next.setDate(next.getDate() + 1);
      return formatDateLike(next, lastText);
    }

    return String(rows.length + fallbackStep);
  }

  function parseDateLike(value: unknown): Date | null {
    if (value instanceof Date && Number.isFinite(value.getTime())) {
      return value;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      const excelEpoch = Date.UTC(1899, 11, 30);
      return new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
    }

    const text = String(value ?? "").trim();
    if (!text) return null;

    const normalized = text.replace(" ", "T");
    const parsed = new Date(normalized);
    return Number.isFinite(parsed.getTime()) ? parsed : null;
  }

  function formatDateLike(date: Date, originalText: string): string {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");

    if (/^\d{4}-\d{2}$/.test(originalText)) {
      return `${yyyy}-${mm}`;
    }

    return `${yyyy}-${mm}-${dd}`;
  }

  async function handlePredict(): Promise<void> {
    if (!data || !target || !model) return;

    setStatus("predicting 10 steps ...");

    try {
      const points = forecastNextN(data, target, model, 10);
      setForecastPoints(points);

      setForecast(
        [
          `Target="${target}" → next 10 forecasts:`,
          ...points.map(
            (point, index) =>
              `+${index + 1} ${point.label}: ${point.value.toFixed(4)}`
          ),
        ].join("\n")
      );
      setStatus("predicted 10 steps");
    } catch (err: any) {
      setStatus(`error: ${err.message || String(err)}`);
    }
  }

  const chart = buildChartData(data, target, forecastPoints);
  const REPO_URL =
    "https://github.com/europanite/client_side_time_series_forecast";

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000000ff",
        padding: 24,
        alignItems: "center",
      }}
    >
      {/* GitHub link (Pressable + window.open, no Linking / TouchableOpacity) */}
      <Pressable
        onPress={() =>
          window.open(REPO_URL, "_blank", "noopener,noreferrer")
        }
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "800",
            marginBottom: 12,
            color: "#ffffffff",
            textDecorationLine: "underline",
          }}
        >
          Client-Side Time-Series Forecast
        </Text>
        <Text style={{ color: "#ffffffff", marginBottom: 16 }}>
          Upload a CSV or XLSX file, choose a numeric column as the target, and predict the next time step using XGBoost running entirely in your browser. Your data never leaves this page.
        </Text>
      </Pressable>

      {/* File input */}
      <View
        style={{
          width: "100%",
          maxWidth: 960,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <input
          type="file"
          accept=".csv,.xlsx"
          onChange={handleFileChange}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #5a5a5a",
            background: "#111827",
            color: "#e5e7eb",
            flex: 1,
          }}
        />
        <Text style={{ marginLeft: 12, color: "#9ca3af" }}>
          Status: {status}
        </Text>
      </View>

      {/* Controls */}
      <View
        style={{
          width: "100%",
          maxWidth: 960,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <Text style={{ color: "#9ca3af" }}>Target:</Text>
        <select
          value={target ?? ""}
          onChange={(e) => {
            setTarget(e.target.value || null);
            setModel(null);
            setForecast("");
            setForecastPoints([]);
          }}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid #4b5563",
            background: "#111827",
            color: "#e5e7eb",
            minWidth: 120,
          }}
        >
          <option value="">(select)</option>
          {data?.headers
            .filter((h) => h !== data.datetimeKey)
            .map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
        </select>

        <Pressable
          onPress={handleTrain}
          style={{
            width: 100,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 999,
            backgroundColor: "#22c55e",
          }}
        >
          <Text style={{ color: "#020817", fontWeight: "600" }}>Train</Text>
        </Pressable>

        <Pressable
          onPress={handlePredict}
          style={{
            width: 100,
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 999,
            backgroundColor: model ? "#38bdf8" : "#371f1f",
            opacity: model ? 1 : 0.4,
          }}
        >
          <Text style={{ color: "#020817", fontWeight: "600" }}>
            Forecast +10
          </Text>
        </Pressable>
      </View>

      {/* Chart */}
      <View
        style={{
          width: "100%",
          maxWidth: 960,
          height: 360,
          backgroundColor: "#000000ff",
          borderRadius: 16,
          padding: 12,
        }}
      >
        {chart ? (
          <Line data={chart.data} options={chart.options} />
        ) : (
          <Text
            style={{
              color: "#6b7280",
              textAlign: "center",
              marginTop: 16,
            }}
          >
            Upload a CSV/XLSX file to visualize all series.
          </Text>
        )}
      </View>

      {/* Output */}
      <ScrollView
        style={{
          width: "100%",
          maxWidth: 960,
          marginTop: 12,
          backgroundColor: "#000000ff",
          borderRadius: 12,
          padding: 12,
        }}
      >
        <Text
          style={{
            color: "#e5e7eb",
            fontFamily: "monospace",
          }}
        >
          {forecast || "Prediction result will appear here."}
        </Text>
      </ScrollView>
    </View>
  );
}

async function predictFuturePoints(
  data: LoadedData,
  targetKey: string,
  model: any,
  steps: number
): Promise<ForecastPoint[]> {
  const workingRows = data.rows.map((row) => ({ ...row }));
  const points: ForecastPoint[] = [];

  for (let i = 0; i < steps; i += 1) {
    const workingData: LoadedData = {
      ...data,
      rows: workingRows,
    };

    const rawPrediction = await Promise.resolve(
      predictNext(workingData, targetKey, model)
    );
    const yhat = Number(rawPrediction);

    if (!Number.isFinite(yhat)) {
      throw new Error(`Prediction for step ${i + 1} is not finite.`);
    }

    const label = buildFutureLabel(data, workingRows.length, i + 1);
    points.push({ label, value: yhat });

    workingRows.push(buildFutureRow(data, workingRows, targetKey, label, yhat));
  }

  return points;
}

function buildFutureRow(
  data: LoadedData,
  workingRows: any[],
  targetKey: string,
  label: string,
  yhat: number
): Record<string, any> {
  const previous = workingRows[workingRows.length - 1] ?? {};
  const row: Record<string, any> = {};

  for (const header of data.headers) {
    if (header === data.datetimeKey) {
      row[header] = label;
    } else if (header === targetKey) {
      row[header] = yhat;
    } else {
      row[header] = previous[header];
    }
  }

  return row;
}

function buildFutureLabel(
  data: LoadedData,
  nextIndex: number,
  step: number
): string {
  if (!data.datetimeKey || data.rows.length < 1) {
    return `+${step}`;
  }

  const labels = data.rows.map((row) =>
    String(row[data.datetimeKey as string] ?? "")
  );
  const lastLabel = labels[labels.length - 1];
  if (/^\d{4}-\d{2}$/.test(lastLabel)) {
    const [year, month] = lastLabel.split("-").map(Number);
    const futureMonthIndex = year * 12 + (month - 1) + step;
    const futureYear = Math.floor(futureMonthIndex / 12);
    const futureMonth = (futureMonthIndex % 12) + 1;
    return `${futureYear}-${String(futureMonth).padStart(2, "0")}`;
  }

  const lastDate = Date.parse(lastLabel);

  if (!Number.isFinite(lastDate)) {
    return `+${step}`;
  }

  const previousLabel = labels[labels.length - 2];
  const previousDate =
    previousLabel === undefined ? NaN : Date.parse(previousLabel);
  const stepMs = Number.isFinite(previousDate)
    ? lastDate - previousDate
    : 24 * 60 * 60 * 1000;

  const safeStepMs = stepMs > 0 ? stepMs : 24 * 60 * 60 * 1000;
  const futureDate = new Date(lastDate + safeStepMs * step);

  if (/^\d{4}-\d{2}-\d{2}$/.test(lastLabel)) {
    return futureDate.toISOString().slice(0, 10);
  }

  return String(nextIndex);
}


function buildChartData(
  data: LoadedData | null,
  target: string | null,
  forecastPoints: ForecastPoint[]
): { data: ChartData<"line">; options: ChartOptions<"line"> } | null {
  if (!data || !data.rows.length) return null;

  const useDatetime =
    !!data.datetimeKey && data.headers.includes(data.datetimeKey);

  const observedLabels: string[] = useDatetime
    ? data.rows.map((r) => String(r[data.datetimeKey as string] ?? ""))
    : data.rows.map((_, i) => String(i)); // unify as string

  const labels = [
    ...observedLabels,
    ...forecastPoints.map((point) => point.label),
  ];

  const numericKeys = data.headers.filter((h) => {
    if (h === data.datetimeKey) return false;
    const v = data.rows[0]?.[h];
    const n = Number(v);
    return Number.isFinite(n);
  });

  if (!numericKeys.length) return null;

  const palette = [
    "#22c55e",
    "#60a5fa",
    "#f59e0b",
    "#ef4444",
    "#a78bfa",
    "#14b8a6",
  ];

  const targetSeriesColor =
    target && numericKeys.includes(target)
      ? palette[numericKeys.indexOf(target) % palette.length]
      : palette[0];

  const datasets = numericKeys.map((k, i) => ({
    label: k,
    data: [
      ...data.rows.map((r) => Number(r[k])),
      ...forecastPoints.map(() => null),
    ],
    borderColor: palette[i % palette.length],
    backgroundColor: palette[i % palette.length],
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.25,
  }));

  const chartDatasets = [...datasets];

  if (target && forecastPoints.length > 0) {
    chartDatasets.push({
      label: `${target} forecast`,
      data: [
        ...data.rows.map(() => null),
        ...forecastPoints.map((point) => point.value),
      ],
      borderColor: targetSeriesColor,
      backgroundColor: targetSeriesColor,
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 3,
      tension: 0.25,
    });
  }

  return {
    data: {
      labels,
      datasets: chartDatasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        x: { display: true },
        y: { display: true },
      },
    },
  };
}
