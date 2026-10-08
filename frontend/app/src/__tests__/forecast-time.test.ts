import { forecastTimeLabels } from "../forecast-time";

const dates = (values: Array<string | number>) => values.map((Date) => ({ Date }));

describe("forecastTimeLabels", () => {
  it("uses calendar dates instead of t+ labels for daily observations", () => {
    expect(forecastTimeLabels(dates(["2026-01-01", "2026-01-02", "2026-01-03"]), "Date", 2))
      .toEqual(["2026-01-04", "2026-01-05"]);
  });

  it("infers hourly timestamps and preserves the time of day", () => {
    expect(forecastTimeLabels(dates(["2026-01-01 09:00", "2026-01-01 10:00", "2026-01-01 11:00"]), "Date", 2))
      .toEqual(["2026-01-01 12:00", "2026-01-01 13:00"]);
  });

  it("preserves ISO offsets in hourly observations", () => {
    expect(forecastTimeLabels(dates(["2026-01-01T09:00+09:00", "2026-01-01T10:00+09:00"]), "Date", 2))
      .toEqual(["2026-01-01T11:00+09:00", "2026-01-01T12:00+09:00"]);
  });

  it("handles monthly data without drifting away from month ends", () => {
    expect(forecastTimeLabels(dates(["2026-01-31", "2026-02-28", "2026-03-31"]), "Date", 2))
      .toEqual(["2026-04-30", "2026-05-31"]);
    expect(forecastTimeLabels(dates(["2026-01", "2026-02", "2026-03"]), "Date", 2))
      .toEqual(["2026-04", "2026-05"]);
  });

  it("excludes Saturdays and Sundays for inferred trading-day series", () => {
    expect(forecastTimeLabels(dates([
      "2026-01-05", "2026-01-06", "2026-01-07", "2026-01-08", "2026-01-09",
      "2026-01-12", "2026-01-13", "2026-01-14", "2026-01-15", "2026-01-16",
    ]), "Date", 2)).toEqual(["2026-01-19", "2026-01-20"]);
  });

  it("falls back to t+ steps when calendar dates do not exist", () => {
    expect(forecastTimeLabels(dates(["t0", "t1"]), "Date", 2)).toEqual(["t+1", "t+2"]);
    expect(forecastTimeLabels([{ target: 10 }], null, 2)).toEqual(["t+1", "t+2"]);
    expect(forecastTimeLabels(dates(["2026-01-02", "2026-01-01"]), "Date", 2))
      .toEqual(["t+1", "t+2"]);
  });

  it("preserves the 16-step horizon", () => {
    const points = forecastTimeLabels(dates(["2026-01-01"]), "Date", 16);
    expect(points).toHaveLength(16);
    expect(points[0]).toBe("2026-01-02");
    expect(points[15]).toBe("2026-01-17");
  });
});
