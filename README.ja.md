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

XGBoost と実験的な VARMA-style baseline によって動作する、クライアントサイド・ブラウザベースの多変量時系列予測プレイグラウンドです。

このアプリはCSVまたはXLSXファイルを読み込み、日時列と数値列を検出し、予測モデルを選択できるようにします。そして観測値と10ステップ先の予測を可視化します。データはブラウザ内に留まります。

---

## 概要

これは完全にWebブラウザ内で動作する多変量時系列予測ツールです。
インストール、登録、支払いは不要です。
ブラウザでアクセスすればすぐに利用できます。
小規模事業者が明日の注文数を予測する助けになります。

- ブラウザ内でCSV/XLSXの時系列データセットを読み込む
- 任意の数値列を予測ターゲットとして選択する
- デフォルトのXGBoostモデルと実験的なVARMA-style baselineを切り替える
- 選択したモデルをブラウザ内でローカルに学習する
- 次の10点を予測し、チャートに追加する

すべての処理は **ブラウザ内** で行われます。バックエンドAPIはなく、データがあなたのマシンから外へ出ることはありません。

---

## デモ

1. GitHub Pagesのデモを開く：  
   https://europanite.github.io/client_side_time_series_forecast/
2. [`data/sample_data.csv`](./data/datsample_dataa.csv) または [`data/sample_data.xlsx`](./data/sample_data.xlsx) などのサンプルファイルをアップロードする。
3. アプリは以下を実行します：
   - **datetime-like column** を検出する
   - 利用可能な数値列を一覧表示する
4. 1つの数値列を **target** として選択する。
5. **forecast model** を選択する。`XGBoost` がデフォルトです。`VARMA experimental` は比較用の軽量な多変量ベースラインです。
6. **Train** をクリックして選択したモデルを構築し、続けて **Forecast +10** をクリックして次の10点を予測する。
7. チャートを確認し、観測系列と予測線を比較する。

---

## データ構造

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### 要件:

##### 1つのdatetime-like column
列ヘッダーに「date」または「time」が含まれます（大文字・小文字は区別しません）。時間軸として使われますが、数値特徴量には直接変換されません。

##### 1つ以上の数値列
これらの列はターゲットまたは外生特徴量として使われます。アプリは2つの予測モードをサポートします:

- **XGBoost**: 1つの数値列をターゲットとして選び、他の数値列を追加シグナルとして使います。
- **VARMA experimental**: すべての数値列をまとめてモデル化し、選択されたターゲット列を予測出力として表示します。

---

## 予測アプローチ

このプロジェクトは、ブラウザ側で動作する2つの予測アプローチを提供します。デフォルトのXGBoostモデルと、実験的なVARMA-style baselineです。

各行について、アプリは次の要素から特徴ベクトルを構築します:

- 直近のラグ値
- 局所的な差分
- 移動平均
- 系列間の相互作用
- 時間インデックス
- Fourier-styleの周期特徴量

選択されたターゲット列が予測ラベルとして使われます。モデルは、次の値がターゲットや他の数値系列の直近の挙動とどのように関係するかを学習します。

### モデル選択

#### XGBoost

`XGBoost` はデフォルトモデルです。ラグ値、移動統計量、系列間相互作用、時間特徴量を使う特徴量ベースの回帰モデルです。多変量の表形式時系列データから汎用的に強い予測を得たい場合に使います。

#### VARMA experimental

`VARMA experimental` はTypeScriptで実装された軽量なVARMA-styleの多変量ベースラインです。数値系列をまとめて予測し、選択したターゲット系列を表示します。

この実装は意図的に実験的です。完全な最尤推定によるVARMA実装ではありません。現在は残差と季節性の安定化を備えたVAR-styleの自己回帰モデルとして動作するため、XGBoostの代替ではなく比較用ベースラインとして使うべきです。

複数の数値系列が一緒に動く場合など、XGBoostを古典的な多変量時系列モデル風の手法と比較したいときに `VARMA experimental` を使います。

### 10ステップ予測

UIは10個の未来点を予測します。各未来ステップは作業履歴に追加されるため、後続ステップは先に予測された値を利用できます。

多系列データでは、非ターゲット列を最後の観測値で固定したままにしないよう、数値コンテキストも進めます。XGBoostモードでは選択したターゲットを直接予測し、非ターゲットのコンテキストを拡張します。VARMA experimentalモードではすべての数値系列を一緒に進め、選択したターゲット系列をチャートと予測テキストに表示します。

---

## 特徴量エンジニアリング

このプロジェクトは入力を小規模な多変量時系列として扱います:

- 1つの *datetime-like* column（ヘッダーに `date` または `time` を含む）。
- 複数の数値列（例: `item_a`, `item_b`, `item_c`, ...）。
- 数値列のうち1つを予測する **target** として選択します。

内部では、特徴量ビルダーが各時刻 `t` の **rich feature vector** と `t + 1` の **future feature vector** を構築します。すべての特徴量はJavaScript/TypeScriptで **完全にクライアント側** で計算されます。

### 特徴量に使う系列

- `datetimeKey`  
  - `"date"` または `"time"` を含むヘッダーから自動検出されます。
  - 時間軸の特定だけに使われ、数値特徴量としては直接使われません。
- `targetKey`  
  - ユーザーが予測対象として選ぶ数値列です。
- `featureKeys`  
  - その他すべての数値列（datetimeでもtargetでもない列）です。
  - **外生系列** として扱われます。

内部では、系列ごとに1つの数値配列を持つ `seriesMap: Record<string, number[]>` を保持します。

### 系列ごとの特徴量（外生系列）

各外生系列 `x(t)`（`featureKeys` の各キー）と各時刻 `t` について、次を計算します:

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

### ターゲット系列の履歴

**target series** `y(t)` 自体については、現在値 `y(t)` はそのステップのラベルであるため特徴量には含めません。ただし履歴は含めます:

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

### 系列間相互作用

**異なる系列の関係** を捉えるため、ターゲットを含むすべての **数値系列のペア** について相互作用特徴量を作ります:

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

### 時間インデックスとFourier特徴量

時間そのものも数値特徴量としてエンコードします:

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

### Future-step feature vector (lastFeatureRow)
同じ特徴量構築ロジックを使い、t + 1（一歩先予測）用の特徴ベクトルを生成します:
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


## 🚀 はじめに

### 1. 前提条件
- [Docker Compose](https://docs.docker.com/compose/)

### 2. すべてのサービスをビルドして起動する:

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

## AirPassengersベンチマーク

このリポジトリにはAirPassengersデータセットと、古典的な月次時系列データセットに対するモデル挙動を確認するためのベンチマークコマンドが含まれています。

Docker Composeでベンチマークを実行します:

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
