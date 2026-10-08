/** Calendar labels for forecast points. No model computations depend on dates. */
const DAY_MS = 86_400_000;

type Cadence =
  | { kind: "months"; interval: number }
  | { kind: "business-days" }
  | { kind: "milliseconds"; interval: number };

function parseTimestamp(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    // Spreadsheet serial dates, Unix seconds, and Unix milliseconds.
    const millis = value >= 1e12 ? value : value >= 1e9 ? value * 1000
      : value >= 20_000 && value <= 100_000 ? Date.UTC(1899, 11, 30) + value * DAY_MS
      : NaN;
    return Number.isFinite(millis) ? new Date(millis) : null;
  }
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (/^\d+$/.test(trimmed)) return parseTimestamp(Number(trimmed));
  // Avoid JS Date's browser-specific interpretation of arbitrary strings.
  if (!/^\d{4}-\d{2}(?:-\d{2})?(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.test(trimmed)) {
    return null;
  }
  const parsed = new Date(trimmed);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function isMonthEnd(date: Date): boolean {
  return date.getUTCDate() === new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
}

function median(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function inferCadence(dates: Date[], lastRaw: unknown): Cadence {
  if (typeof lastRaw === "string" && /^\d{4}-\d{2}$/.test(lastRaw.trim())) {
    const intervals = dates.slice(1).map((d, i) =>
      (d.getUTCFullYear() - dates[i].getUTCFullYear()) * 12 + d.getUTCMonth() - dates[i].getUTCMonth()
    ).filter((n) => n > 0);
    return { kind: "months", interval: intervals.length ? median(intervals) : 1 };
  }

  if (dates.length >= 3) {
    const monthSteps = dates.slice(1).map((d, i) => {
      const prev = dates[i];
      const months = (d.getUTCFullYear() - prev.getUTCFullYear()) * 12 + d.getUTCMonth() - prev.getUTCMonth();
      const consistentDay = d.getUTCDate() === prev.getUTCDate() || (isMonthEnd(d) && isMonthEnd(prev));
      return months > 0 && consistentDay ? months : 0;
    });
    if (monthSteps.every((step) => step > 0) && median(monthSteps) <= 12) {
      return { kind: "months", interval: median(monthSteps) };
    }
  }

  const diffs = dates.slice(1).map((d, i) => d.getTime() - dates[i].getTime())
    .filter((ms) => Number.isFinite(ms) && ms > 0);
  const step = diffs.length ? median(diffs) : DAY_MS;
  const dayScale = step / DAY_MS;
  const dateOnly = typeof lastRaw !== "string" || /^\d{4}-\d{2}-\d{2}$/.test(lastRaw.trim());
  const weekdaysOnly = dates.length >= 5 && dates.every((d) => {
    const day = d.getUTCDay();
    return day !== 0 && day !== 6;
  });
  const hasWeekendGap = diffs.some((ms) => ms >= 2.5 * DAY_MS && ms <= 4.5 * DAY_MS);
  if (dateOnly && weekdaysOnly && hasWeekendGap && dayScale >= 0.9 && dayScale <= 1.1) {
    return { kind: "business-days" };
  }
  // Daily data with missing weekends may have 3-day gaps; use the typical step.
  const interval = dayScale >= 0.9 && Math.abs(dayScale - Math.round(dayScale)) < 0.05
    ? Math.round(dayScale) * DAY_MS : step;
  return { kind: "milliseconds", interval: interval > 0 ? interval : DAY_MS };
}

function advanceMonth(start: Date, offset: number): Date {
  const result = new Date(start.getTime());
  const originalDay = start.getUTCDate();
  const monthEnd = isMonthEnd(start);
  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + offset);
  const lastDay = new Date(Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)).getUTCDate();
  result.setUTCDate(monthEnd ? lastDay : Math.min(originalDay, lastDay));
  return result;
}

function formatTimestamp(date: Date, raw: unknown): string {
  const stamp = date.toISOString();
  if (typeof raw === "string") {
    const source = raw.trim();
    if (/^\d{4}-\d{2}$/.test(source)) return stamp.slice(0, 7);
    if (/^\d{4}-\d{2}-\d{2}$/.test(source)) return stamp.slice(0, 10);
    if (/\d{2}:\d{2}/.test(source)) {
      const separator = source.includes("T") ? "T" : " ";
      const withSeconds = /:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/.test(source);
      const suffix = source.match(/(Z|[+-]\d{2}:?\d{2})$/)?.[1];
      const pad = (n: number) => String(n).padStart(2, "0");
      let year: number, month: number, day: number, hours: number, minutes: number, seconds: number;
      if (suffix) {
        const match = /^([+-])(\d{2}):?(\d{2})$/.exec(suffix);
        const offset = match ? (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3])) : 0;
        const shifted = new Date(date.getTime() + offset * 60_000);
        year = shifted.getUTCFullYear(); month = shifted.getUTCMonth() + 1;
        day = shifted.getUTCDate(); hours = shifted.getUTCHours();
        minutes = shifted.getUTCMinutes(); seconds = shifted.getUTCSeconds();
      } else {
        // No offset in the input: preserve the user's browser-local wall clock.
        year = date.getFullYear(); month = date.getMonth() + 1;
        day = date.getDate(); hours = date.getHours();
        minutes = date.getMinutes(); seconds = date.getSeconds();
      }
      const formatted = `${year}-${pad(month)}-${pad(day)}${separator}${pad(hours)}:${pad(minutes)}` +
        (withSeconds ? `:${pad(seconds)}` : "");
      return formatted + (suffix ?? "");
    }
  }
  if (typeof raw === "number" || (typeof raw === "string" && /^\d+$/.test(raw.trim()))) {
    const numeric = Number(raw);
    if (numeric >= 1e9 || (numeric >= 20_000 && numeric <= 100_000 && numeric % 1 !== 0)) {
      return stamp.replace(/\.000Z$/, "Z");
    }
  }
  return stamp.slice(0, 10);
}

/**
 * Project the actual input's calendar forward rather than emitting t+1, t+2, ...
 * When no valid timestamp is available, return relative steps (never invent dates).
 * Business days exclude weekends, not exchange-specific market holidays.
 */
export function forecastTimeLabels(
  rows: Record<string, any>[],
  datetimeKey: string | null | undefined,
  horizon: number
): string[] {
  if (!Number.isInteger(horizon) || horizon < 0) throw new Error("Invalid forecast horizon");
  const relative = () => Array.from({ length: horizon }, (_, i) => `t+${i + 1}`);
  if (!rows.length || !datetimeKey) return relative();

  const raw = rows[rows.length - 1]?.[datetimeKey];
  const last = parseTimestamp(raw);
  if (!last) return relative();
  const dates = rows.slice(-64).map((row) => parseTimestamp(row[datetimeKey]))
    .filter((d): d is Date => d !== null);
  // The cadence must follow the provided order, not a reordered calendar.
  if (dates.some((d, i) => i > 0 && d.getTime() <= dates[i - 1].getTime())) {
    return relative();
  }
  const cadence = inferCadence(dates, raw);
  return Array.from({ length: horizon }, (_, index) => {
    const step = index + 1;
    if (cadence.kind === "months") {
      return formatTimestamp(advanceMonth(last, cadence.interval * step), raw);
    }
    if (cadence.kind === "business-days") {
      const next = new Date(last.getTime());
      let remaining = step;
      while (remaining > 0) {
        next.setUTCDate(next.getUTCDate() + 1);
        if (next.getUTCDay() !== 0 && next.getUTCDay() !== 6) remaining -= 1;
      }
      return formatTimestamp(next, raw);
    }
    return formatTimestamp(new Date(last.getTime() + cadence.interval * step), raw);
  });
}
