import { forecastVarmaNextN, trainVarmaModel } from "../varma";
import type { LoadedData } from "../core";
import { DEFAULT_FORECAST_HORIZON } from "../forecast-config";

describe("VARMA experimental", () => {
  const data: LoadedData = {
    datetimeKey: "date",
    headers: ["date", "sales", "ads", "price"],
    rows: Array.from({ length: 12 }, (_, i) => ({
      date: `2026-01-${String(i + 1).padStart(2, "0")}`,
      sales: String(100 + i * 3 + (i % 2)),
      ads: String(20 + i * 2),
      price: String(50 - i * 0.2),
    })),
  };

  it("trains on multiple numeric series and forecasts the selected target", () => {
    const model = trainVarmaModel(data, { lag: 2, maLag: 1 });
    const points = forecastVarmaNextN(data, "sales", model, 3);

    expect(model.kind).toBe("varma-experimental");
    expect(model.keys).toEqual(["sales", "ads", "price"]);
    expect(points).toHaveLength(3);
    expect(points[0].label).toBe("2026-01-13");
    expect(points.every((point) => Number.isFinite(point.value))).toBe(true);
  });

  it("uses the shared 16-step horizon by default", () => {
    const model = trainVarmaModel(data, { lag: 2, maLag: 1 });
    const points = forecastVarmaNextN(data, "sales", model);

    expect(DEFAULT_FORECAST_HORIZON).toBe(16);
    expect(points).toHaveLength(DEFAULT_FORECAST_HORIZON);
    expect(points[0].label).toBe("2026-01-13");
    expect(points[points.length - 1].label).toBe("2026-01-28");
    expect(points.every((point) => Number.isFinite(point.value))).toBe(true);
  });

  it("rejects single-series data because VARMA is multivariate", () => {
    const singleSeries: LoadedData = {
      datetimeKey: "date",
      headers: ["date", "sales"],
      rows: data.rows.map((row) => ({ date: row.date, sales: row.sales })),
    };

    expect(() => trainVarmaModel(singleSeries)).toThrow(
      /requires at least two numeric series/
    );
  });
});
