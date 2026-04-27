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

XGBoost और एक experimental VARMA-style baseline द्वारा संचालित, क्लाइंट-साइड ब्राउज़र-आधारित multivariate time-series forecast playground.

यह ऐप CSV या XLSX फ़ाइल लोड करता है, datetime और numeric columns पहचानता है, forecasting model चुनने देता है, और observed values तथा 10-step forecast दोनों को visualize करता है। आपका डेटा आपके browser में ही रहता है।

---

## अवलोकन

यह एक multivariate time series forecasting tool है जो पूरी तरह आपके web browser में चलता है।
Installation, registration या payment की आवश्यकता नहीं है।
बस browser से खोलें और उपयोग शुरू करें।
यह छोटे व्यवसायों को कल के orders का अनुमान लगाने में मदद करता है।

- Browser में CSV/XLSX time-series datasets लोड करें
- किसी भी numeric column को forecast target के रूप में चुनें
- Default XGBoost model और experimental VARMA-style baseline में से चुनें
- चुने गए model को browser में locally train करें
- अगले 10 points forecast करें और chart में जोड़ें

सारी प्रक्रिया **आपके browser के अंदर** होती है। कोई backend API नहीं है और कोई data आपकी machine से बाहर नहीं जाता।

---

## डेमो

1. GitHub Pages demo खोलें:  
   https://europanite.github.io/client_side_time_series_forecast/
2. [`data/sample_data.csv`](./data/datsample_dataa.csv) या [`data/sample_data.xlsx`](./data/sample_data.xlsx) जैसी sample file upload करें।
3. ऐप यह करेगा:
   - एक **datetime-like column** detect करेगा
   - उपलब्ध numeric columns दिखाएगा
4. एक numeric column को **target** के रूप में चुनें।
5. एक **forecast model** चुनें। `XGBoost` default है। `VARMA experimental` comparison के लिए lightweight multivariate baseline है।
6. Selected model बनाने के लिए **Train** क्लिक करें, फिर अगले 10 points predict करने के लिए **Forecast +10** क्लिक करें।
7. Observed series और forecast line की तुलना करने के लिए chart देखें।

---

## डेटा संरचना

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### आवश्यकताएँ:

##### Una columna similar a fecha/hora
列标题包含 “date” 或 “time”（不区分大小写）。它用作时间轴，但不会直接转换为数值特征。

##### Una o más columnas numéricas
这些列用作目标和/或外生特征。应用支持两种预测模式：

- **XGBoost**：选择一个数值列作为目标，其它数值列作为额外信号。
- **VARMA experimental**：所有数值列一起建模，并将所选目标列显示为预测输出。

---

## पूर्वानुमान दृष्टिकोण

本项目提供两种浏览器端预测方法：默认 XGBoost 模型和实验性 VARMA 风格基线。

对于每一行，应用会根据以下内容构建特征向量：

- 最近的滞后值
- 局部差分
- 滚动均值
- 序列间交互
- 时间索引
- Fourier 风格的周期特征

所选目标列用作预测标签。模型学习下一个值与目标列及其它数值序列近期行为之间的关系。

### मॉडल चयन

#### XGBoost

`XGBoost` 是默认模型。它是一个基于特征的回归模型，使用滞后值、滚动统计、序列间交互和时间特征。当你希望从多变量表格型时间序列数据中获得最强的通用预测时，可以使用此模型。

#### VARMA experimental

`VARMA experimental` 是一个用 TypeScript 实现的轻量级 VARMA 风格多变量基线。它会一起预测数值序列，并显示所选目标序列。

该实现有意保持实验性质。它不是完整的最大似然 VARMA 实现。目前它的行为更接近带残差和季节稳定化的 VAR 风格自回归模型，因此应作为与 XGBoost 比较的基线，而不是替代品。

当你想将 XGBoost 与经典多变量时间序列风格模型进行比较，尤其是多个数值序列一起变化时，可以使用 `VARMA experimental`。

### 10-स्टेप पूर्वानुमान

UI 会预测未来 10 个点。每个未来步骤都会追加到工作历史中，因此后续步骤可以使用更早的预测值。

对于多序列数据，应用还会推进数值上下文，使预测不会只是把每个非目标列固定在最后一个观测值。在 XGBoost 模式下，所选目标会被直接预测，同时扩展非目标上下文。在 VARMA experimental 模式下，所有数值序列一起推进，并在图表和预测文本中显示所选目标序列。

---

## फ़ीचर इंजीनियरिंग

本项目将输入视为一个小型多变量时间序列：

- 一个 *datetime-like* 列（表头包含 `date` 或 `time`）。
- 多个数值列（例如 `item_a`, `item_b`, `item_c`, ...）。
- 其中一个数值列被选为要预测的 **target**。

在内部，特征构建器会为每个时间步 `t` 构建 **rich feature vector**，并为 `t + 1` 构建 **future feature vector**。所有特征都在 JavaScript/TypeScript 中 **完全在客户端** 计算。

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

Para cada série exógena `x(t)` (cada chave em `featureKeys`) e cada passo de tempo `t`, calculamos:

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

Para a própria **target series** `y(t)`, não incluímos o valor atual `y(t)` como feature, porque ele é o rótulo daquele passo, mas incluímos seu histórico:

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

Para capturar **relações entre diferentes séries**, criamos features de interação para cada **par de séries numéricas** (incluindo o alvo):

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

Também codificamos o próprio tempo como features numéricas:

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
A mesma lógica de construção de features é usada para produzir um vetor para t + 1 (previsão de um passo à frente):
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


## 🚀 शुरू करना

### 1. पूर्वापेक्षाएँ
- [Docker Compose](https://docs.docker.com/compose/)

### 2. सभी सेवाएँ बिल्ड और शुरू करें:

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

## AirPassengers बेंचमार्क

Repository में AirPassengers dataset और एक benchmark command शामिल है, जिससे classic monthly time-series dataset पर model behavior जाँचा जा सकता है।

Docker Compose से benchmark चलाएँ:

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
