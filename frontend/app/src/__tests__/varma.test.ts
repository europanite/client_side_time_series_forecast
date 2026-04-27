import { forecastVarmaNextN, trainVarmaModel } from "../varma";
import type { LoadedData } from "../core";

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
