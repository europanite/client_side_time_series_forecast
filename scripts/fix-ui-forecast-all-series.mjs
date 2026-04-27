#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";

const filePath = "frontend/app/src/App.tsx";

function findFunctionRange(source, functionName) {
  const marker = `function ${functionName}`;
  const start = source.indexOf(marker);
  if (start < 0) {
    throw new Error(`Could not find ${marker}`);
  }

  const bodyStart = source.indexOf("{", start);
  if (bodyStart < 0) {
    throw new Error(`Could not find body for ${marker}`);
  }

  let depth = 0;
  let inString = null;
  let escaped = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = bodyStart; i < source.length; i += 1) {
    const ch = source[i];
    const next = source[i + 1];

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === "*" && next === "/") {
        inBlockComment = false;
        i += 1;
      }
      continue;
    }
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === "/" && next === "/") {
      inLineComment = true;
      i += 1;
      continue;
    }
    if (ch === "/" && next === "*") {
      inBlockComment = true;
      i += 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inString = ch;
      continue;
    }

    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return { start, end: i + 1 };
      }
    }
  }

  throw new Error(`Could not find end of ${marker}`);
}

function replaceFunction(source, functionName, replacement) {
  const range = findFunctionRange(source, functionName);
  return `${source.slice(0, range.start)}${replacement}${source.slice(range.end)}`;
}

let source = readFileSync(filePath, "utf8");

if (!source.includes("setForecastRows")) {
  throw new Error(
    "setForecastRows was not found. Apply the Forecast +10 UI patch first."
  );
}

if (!source.includes("buildFutureLabel")) {
  throw new Error(
    "buildFutureLabel was not found. Apply the forecast display fix patch first."
  );
}

const newHandlePredict = `async function handlePredict(): Promise<void> {
    if (!data || !target || !model) return;

    const horizon = 10;
    const numericKeys = getNumericKeysForForecast(data);

    if (!numericKeys.includes(target)) {
      numericKeys.push(target);
    }

    setStatus(\`forecasting \${horizon} steps ...\`);

    try {
      const futureRows: any[] = [];
      let workingData: LoadedData = {
        ...data,
        rows: [...data.rows],
      };

      const lines: string[] = [
        \`Target=\"\${target}\" → next \${horizon} forecasts:\`,
      ];

      for (let step = 1; step <= horizon; step += 1) {
        const previous = workingData.rows[workingData.rows.length - 1] ?? {};
        const nextRow: any = {};

        for (const header of workingData.headers) {
          if (header === workingData.datetimeKey) {
            nextRow[header] = buildFutureLabel(workingData, step);
          } else {
            nextRow[header] = previous[header];
          }
        }

        for (const key of numericKeys) {
          const booster =
            key === target && step === 1
              ? model
              : await trainModel(workingData, key);
          const yhat = predictNext(workingData, key, booster);
          nextRow[key] = Number.isFinite(yhat) ? Number(yhat) : previous[key];
        }

        futureRows.push(nextRow);
        workingData = {
          ...workingData,
          rows: [...workingData.rows, nextRow],
        };

        const yhat = Number(nextRow[target]);
        lines.push(
          Number.isFinite(yhat)
            ? \`+\${step} \${String(nextRow[workingData.datetimeKey ?? ""] ?? step)}: \${yhat.toFixed(4)}\`
            : \`+\${step}: \${String(nextRow[target])}\`
        );
      }

      setForecastRows(futureRows);
      setForecast(lines.join("\\n"));
      setStatus(\`predicted \${horizon} steps\`);
    } catch (err: any) {
      setStatus(\`error: \${err.message || String(err)}\`);
    }
  }`;

