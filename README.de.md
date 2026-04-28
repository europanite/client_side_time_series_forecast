# [Client-Side Time-Series Forecast](https://github.com/europanite/client_side_time_series_forecast "Client-Side Time-Series Forecast")

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
![OS](https://img.shields.io/badge/OS-Linux%20%7C%20macOS%20%7C%20Windows-blue)
[![CI](https://github.com/europanite/client_side_time_series_forecast/actions/workflows/ci.yml/badge.svg)](https://github.com/europanite/client_side_time_series_forecast/actions/workflows/ci.yml)
[![docker](https://github.com/europanite/client_side_time_series_forecast/actions/workflows/docker.yml/badge.svg)](https://github.com/europanite/client_side_time_series_forecast/actions/workflows/docker.yml)
[![pages](https://github.com/europanite/client_side_time_series_forecast/actions/workflows/pages.yml/badge.svg)](https://github.com/europanite/client_side_time_series_forecast/actions/workflows/pages.yml)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Jest](https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)


<p align="right">
  <a href="./README.md">🇺🇸 English</a> |
  <a href="./README.hi.md">🇮🇳 हिंदी </a> |
  <a href="./README.ja.md">🇯🇵 日本語</a> |
  <a href="./README.zh-CN.md">🇨🇳 简体中文</a> |
  <a href="./README.es.md">🇪🇸 Español</a> |
  <a href="./README.pt-BR.md">🇧🇷 Português (Brasil)</a> |
  <a href="./README.ko.md">🇰🇷 한국어</a> |
  <a href="./README.de.md">🇩🇪 Deutsch</a> |
  <a href="./README.fr.md">🇫🇷 Français</a>
</p>


!["web_ui"](./assets/images/web_ui.png)

[PlayGround](https://europanite.github.io/client_side_time_series_forecast/)

Ein clientseitiges, browserbasiertes Playground-Projekt für multivariate Zeitreihenprognosen, betrieben mit XGBoost und einer experimentellen VARMA-artigen Baseline.

Die App lädt eine CSV- oder XLSX-Datei, erkennt Datums-/Zeitspalten und numerische Spalten, lässt dich ein Prognosemodell auswählen und visualisiert sowohl beobachtete Werte als auch eine 10-Schritt-Prognose. Deine Daten bleiben im Browser.

---

## Überblick

Dies ist ein Werkzeug für multivariate Zeitreihenprognosen, das vollständig in deinem Webbrowser läuft.
Keine Installation, Registrierung oder Zahlung erforderlich.
Einfach im Browser öffnen und loslegen.
Es hilft kleinen Unternehmen, die Bestellungen von morgen vorherzusagen.

- CSV/XLSX-Zeitreihendatensätze im Browser laden
- Eine beliebige numerische Spalte als Prognoseziel auswählen
- Zwischen dem Standardmodell XGBoost und einer experimentellen VARMA-artigen Baseline wählen
- Das ausgewählte Modell lokal im Browser trainieren
- Die nächsten 10 Punkte prognostizieren und an das Diagramm anhängen

Alles geschieht **in deinem Browser**. Es gibt keine Backend-API und keine Daten verlassen deinen Rechner.

---

## Demo

1. Öffne die GitHub-Pages-Demo:  
   https://europanite.github.io/client_side_time_series_forecast/
2. Lade eine Beispieldatei wie [`data/sample_data.csv`](./data/datsample_dataa.csv) oder [`data/sample_data.xlsx`](./data/sample_data.xlsx) hoch.
3. Die App wird:
   - Eine **datetime-like column** erkennen
   - Verfügbare numerische Spalten auflisten
4. Wähle eine numerische Spalte als **target**.
5. Wähle ein **forecast model**. `XGBoost` ist der Standard. `VARMA experimental` ist eine leichte multivariate Baseline zum Vergleich.
6. Klicke auf **Train**, um das ausgewählte Modell zu erstellen, und dann auf **Forecast +10**, um die nächsten 10 Punkte vorherzusagen.
7. Prüfe das Diagramm, um die beobachtete Reihe mit der Prognoselinie zu vergleichen.

---

## Datenstruktur

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### Anforderungen:

##### Una columna similar a fecha/hora
Der Spaltenkopf enthält „date“ oder „time“ (ohne Beachtung der Groß-/Kleinschreibung). Er wird als Zeitachse verwendet, aber nicht direkt in numerische Features umgewandelt.

##### Una o más columnas numéricas
Diese Spalten werden als Ziel und/oder exogene Features verwendet. Die App unterstützt zwei Prognosemodi:

- **XGBoost**: Du wählst eine numerische Spalte als Ziel, und andere numerische Spalten werden als zusätzliche Signale verwendet.
- **VARMA experimental**: Alle numerischen Spalten werden gemeinsam modelliert, und die ausgewählte Zielspalte wird als Prognoseausgabe angezeigt.

---

## Prognoseansatz

Das Projekt bietet zwei browserseitige Prognoseansätze: das Standardmodell XGBoost und eine experimentelle VARMA-artige Baseline.

Für jede Zeile erstellt die App einen Feature-Vektor aus:

- aktuellen Lag-Werten
- lokalen Differenzen
- rollenden Mittelwerten
- Interaktionen zwischen Reihen
- Zeitindex
- Fourier-artigen zyklischen Features

Die ausgewählte Zielspalte wird als Vorhersage-Label verwendet. Das Modell lernt, wie der nächste Wert vom jüngsten Verhalten des Ziels und anderer numerischer Reihen abhängt.

### Modellauswahl

#### XGBoost

`XGBoost` ist das Standardmodell. Es ist ein featurebasiertes Regressionsmodell, das Lag-Werte, rollende Statistiken, Interaktionen zwischen Reihen und Zeitfeatures verwendet. Verwende dieses Modell, wenn du eine starke allgemeine Prognose aus multivariaten tabellarischen Zeitreihendaten möchtest.

#### VARMA experimental

`VARMA experimental` ist eine leichte VARMA-artige multivariate Baseline, implementiert in TypeScript. Sie prognostiziert numerische Reihen gemeinsam und zeigt die ausgewählte Zielreihe an.

Diese Implementierung ist absichtlich experimentell. Sie ist keine vollständige Maximum-Likelihood-VARMA-Implementierung. Derzeit verhält sie sich wie ein VAR-artiges autoregressives Modell mit Residuen- und Saisonstabilisierung und sollte daher als Vergleichsbaseline statt als Ersatz für XGBoost verwendet werden.

Verwende `VARMA experimental`, wenn du XGBoost mit einem klassischen multivariaten Zeitreihenmodell vergleichen möchtest, besonders wenn mehrere numerische Reihen gemeinsam verlaufen.

### 10-Schritt-Prognose

Die UI prognostiziert 10 zukünftige Punkte. Jeder zukünftige Schritt wird an die Arbeitshistorie angehängt, sodass spätere Schritte frühere Vorhersagewerte nutzen können.

Bei Mehrreihendaten erweitert die App auch den numerischen Kontext, damit die Prognose nicht einfach jede Nicht-Ziel-Spalte auf dem letzten beobachteten Wert festhält. Im XGBoost-Modus wird das ausgewählte Ziel direkt prognostiziert, während der Nicht-Ziel-Kontext erweitert wird. Im VARMA-experimental-Modus werden alle numerischen Reihen gemeinsam fortgeschrieben und die ausgewählte Zielreihe im Diagramm und Prognosetext angezeigt.

---

## Feature Engineering

Dieses Projekt behandelt die Eingabe als kleine multivariate Zeitreihe:

- Eine *datetime-like* Spalte (Header enthält `date` oder `time`).
- Mehrere numerische Spalten (z. B. `item_a`, `item_b`, `item_c`, ...).
- Eine der numerischen Spalten wird als **target** für die Prognose gewählt.

Intern erstellt der Feature-Builder für jeden Zeitschritt `t` einen **rich feature vector** und für `t + 1` einen **future feature vector**. Alle Features werden **rein clientseitig** in JavaScript/TypeScript berechnet.

### Series usadas para las características

- `datetimeKey`  
  - Se detecta automáticamente a partir del encabezado que contiene `"date"` o `"time"`.
  - Solo se usa para ubicar el eje temporal; no se usa directamente como característica numérica.
- `targetKey`  
  - Columna numérica que el usuario elige pronosticar.
- `featureKeys`  
  - Todas las demás columnas numéricas (no datetime, no target).
  - Se tratan como **series exógenas**.

Internamente mantenemos un `seriesMap: Record<string, number[]>` con un arreglo numérico por serie.

### Características por serie (series exógenas)

Für jede exogene Reihe `x(t)` (jeder Schlüssel in `featureKeys`) und jeden Zeitschritt `t` berechnen wir:

1. **Contemporaneous value**
   - `x(t)`

2. **Lag features (history)**
   - Up to `MAX_LAG = 3`:
     - `x(t - 1)`
     - `x(t - 2)`
     - `x(t - 3)`
   - This allows the model to learn short-term temporal dynamics per series.

3. **First difference**
   - `x(t) - x(t - 1)`
   - Captures local changes (trend / slope) rather than absolute level only.

4. **Rolling mean (local average)**
   - Rolling window of `ROLLING_WINDOW = 7` time steps:
     - `mean(x[t - 6 ... t])`
   - Represents local trend / baseline level and smooths short-term noise.

> If the series is shorter than the window, the code automatically shrinks the window so that all available past points up to `t` are used.

### Historial de la serie objetivo

Für die **target series** `y(t)` selbst nehmen wir den aktuellen Wert `y(t)` nicht als Feature auf, weil er das Label dieses Schritts ist; wir nehmen aber seine Historie auf:

1. **Target lags**
   - `y(t - 1)`
   - `y(t - 2)`
   - `y(t - 3)`

2. **Target difference**
   - `y(t) - y(t - 1)`

3. **Target rolling mean**
   - Same rolling window as above:
     - `mean(y[t - 6 ... t])`

This lets the model learn patterns like “the next value depends on the last few values and their local trend,” which is typical in time-series forecasting.

### Interacciones entre series

Um **Beziehungen zwischen verschiedenen Reihen** zu erfassen, erstellen wir Interaktionsfeatures für jedes **Paar numerischer Reihen** (einschließlich des Ziels):

- Let `v_i(t)` and `v_j(t)` be the contemporaneous values of two series at time `t`.
- For each ordered pair `(i, j)` with `i < j`, we compute:

1. **Spread**
   - `v_i(t) - v_j(t)`
   - Encodes relative level differences between series.

2. **Ratio**
   - `v_i(t) / v_j(t)`
   - To avoid division by zero, the denominator includes a small epsilon if needed:
     - `denom = |v_j| < 1e-9 ? sign(v_j) * 1e-9 : v_j`
   - Encodes relative scale and proportionality.

3. **Product**
   - `v_i(t) * v_j(t)`
   - Allows the model to express “interaction effects” where both series being large or small matters.

These cross-series features explicitly expose **multi-series structure** to the booster instead of relying only on individual series values.

### Índice temporal y características Fourier

Wir kodieren auch die Zeit selbst als numerische Features:

1. **Time index**
   - Integer index `t = 0, 1, 2, ...` (row index).
   - Gives the booster a simple way to model global trends.

2. **Fourier features** (cyclical patterns)
   - Two fixed periods (in units of “number of rows”):
     - Period 24 (e.g., 24 hours in hourly data)
     - Period 168 (e.g., 7 days × 24 hours)
   - For each period `P` we compute:
     - `sin(2πt / P)`
     - `cos(2πt / P)`
   - This is a standard way to embed seasonality/cycles in a form that tree models can still exploit.

The final feature vector for each time step `t` is:

```text
[ exogenous features (current, lags, diff, rolling mean for each series),
  target-series history (lags, diff, rolling mean),
  cross-series interactions (spread, ratio, product),
  time index, sin/cos(2πt/24), sin/cos(2πt/168) ]
```

### Vector de características del paso futuro (lastFeatureRow)
Dieselbe Feature-Building-Logik wird verwendet, um einen Feature-Vektor für t + 1 zu erzeugen (Ein-Schritt-Vorhersage):
- Conceptually, we treat the next time index as t_next = n where n is the number of observed rows.
- For the “current” values of each series at t_next, we reuse the last observed value (index n - 1).
- Lags and rolling means are computed using the last MAX_LAG / ROLLING_WINDOW steps in the observed data.
- Time encodings use t_next as the time index.
- This gives a single feature vector lastFeatureRow that represents the next time step based on all history up to the last observation.

The buildFeatures function therefore returns:
```text
{
  X: number[][];        // feature matrix for all observed steps
  y: number[];          // target series values for those steps
  lastFeatureRow: number[]; // feature vector representing t + 1
}
```

---


## 🚀 Erste Schritte

### 1. Voraussetzungen
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Alle Services bauen und starten:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. Test:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## AirPassengers-Benchmark

Das Repository enthält einen AirPassengers-Datensatz und einen Benchmark-Befehl, um das Modellverhalten gegenüber einem klassischen monatlichen Zeitreihendatensatz zu prüfen.

Führe den Benchmark mit Docker Compose aus:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark
```

JSON output:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --json
```

Seasonal naive baseline:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --algorithm seasonal-naive --json
```

### AirPassengers xgboost benchmark

#### csv: data/air_passengers.csv
|  | This Work | seasonal-naive | 
| -------- | -------- | -------- |
| train_size | 120 | 120 | 
| test_size | 24 | 24 | 
| MAE | 43.6495 | 47.5833 | 
| RMSE | 50.8508 | 49.9867 | 
| MAPE | 9.5665% | 10.5227% | 
| sMAPE | 9.5943% | 11.1666% | 

---

# License
- Apache License 2.0
