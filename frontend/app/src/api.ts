
// Utility helpers for parsing and feature engineering (English only)

/** Parse a CSV string to rows of objects */
export function parseCSV(csvText: string): { rows: any[]; headers: string[] } {
  // PapaParse is heavy to import eagerly; for simplicity, a tiny CSV parser is ok for demo
  // But we will import papaparse dynamically for robustness
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return window.__parseCSV
    ? window.__parseCSV(csvText)
    : simpleCSV(csvText);
}

/** Minimal CSV parser (fallback) */
function simpleCSV(text: string): { rows: any[]; headers: string[] } {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const vals = line.split(",").map((v) => v.trim());
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => (obj[h] = vals[i]));
    return obj;
  });
  return { rows, headers };
}

/** Build features for tabular tree models: other series + time features */
export function buildFeatures(
  rows: any[],
  datetimeKey: string,
  targetKey: string
): { X: number[][]; y: number[]; lastFeatureRow: number[] } {
  const headers = Object.keys(rows[0] ?? {});
  const featureKeys = headers.filter(
    (h) => h !== datetimeKey && h !== targetKey
  );
  // time index engineered features (sin/cos seasonality + index)
  const X: number[][] = [];
  const y: number[] = [];
  const toNum = (v: any) => (v === "" || v == null ? NaN : Number(v));

  rows.forEach((r, idx) => {
    const t = idx;
    const feats: number[] = [];
    // other series
    featureKeys.forEach((k) => feats.push(toNum(r[k])));
    // time encodings
    feats.push(t);
    feats.push(Math.sin((2 * Math.PI * t) / 24)); // daily-like
    feats.push(Math.cos((2 * Math.PI * t) / 24));
    feats.push(Math.sin((2 * Math.PI * t) / 168)); // weekly-like
    feats.push(Math.cos((2 * Math.PI * t) / 168));
    X.push(feats);
    y.push(toNum(r[targetKey]));
  });

  // next-step features = last row with t = rows.length
  const last = rows[rows.length - 1];
  const tNext = rows.length;
  const nextFeats: number[] = [];
  featureKeys.forEach((k) => nextFeats.push(toNum(last[k])));
  nextFeats.push(tNext);
  nextFeats.push(Math.sin((2 * Math.PI * tNext) / 24));
  nextFeats.push(Math.cos((2 * Math.PI * tNext) / 24));
  nextFeats.push(Math.sin((2 * Math.PI * tNext) / 168));
  nextFeats.push(Math.cos((2 * Math.PI * tNext) / 168));

  return { X, y, lastFeatureRow: nextFeats };
}

/** Safely parse XLSX ArrayBuffer into rows */
export function parseXLSX(buf: ArrayBuffer): { rows: any[]; headers: string[] } {
  const XLSX = (window as any).XLSX;
  if (!XLSX) throw new Error("XLSX library not found on window");
  const wb = XLSX.read(new Uint8Array(buf), { type: "array" });
  const wsName = wb.SheetNames[0];
  const ws = wb.Sheets[wsName];
  const rows: any[] = XLSX.utils.sheet_to_json(ws, { raw: true });
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { rows, headers };
}
