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

> **翻訳版について:** このREADMEは英語版から翻訳されたものです。内容に相違がある場合は、英語版の `README.md` を正本とします。

!["web_ui"](./assets/images/web_ui.png)

[PlayGround](https://europanite.github.io/client_side_time_series_forecast/)

XGBoost、実験的なVARMAスタイルのモデル、Chronos-2を利用する、クライアントサイド・ブラウザベースの時系列予測Playgroundです。

このアプリはCSVまたはXLSXファイルを読み込み、日時列と数値列を検出し、予測モデルを選択できるようにし、観測値と16ステップ先の予測の両方を可視化します。データはブラウザ内に保持されます。

---

## 概要

これは、Webブラウザ内だけで完全に動作する多変量時系列予測ツールです。
インストール、登録、支払いは不要です。 
ブラウザからアクセスするだけですぐに利用できます。
小規模事業者が翌日の注文数を予測するのに役立ちます。

- ブラウザでCSV/XLSX時系列データセットを読み込む
- 任意の数値列を予測対象として選択する
- XGBoost、実験的なVARMAスタイルのモデル、事前学習済みChronos-2から選択する
- 選択したモデルをブラウザ内でローカル学習する
- 次の16点を予測してチャートに追加する

すべての処理は**ブラウザ内**で行われます。バックエンドAPIはなく、データが端末外へ送信されることもありません。

---

## デモ

1. GitHub Pagesのデモを開きます:  
   https://europanite.github.io/client_side_time_series_forecast/
2. [`data/sample_data.csv`](./data/datsample_dataa.csv) または [`data/sample_data.xlsx`](./data/sample_data.xlsx) などのサンプルファイルをアップロードします。
3. アプリは次の処理を行います:
   - **日時らしい列**を検出する
   - 利用可能な数値列を一覧表示する
4. 1つの数値列を**予測対象**として選択します。
5. **予測モデル**を選択します。`XGBoost` がデフォルトで、`VARMA experimental` は軽量な多変量ベースライン、`Chronos-2 pretrained` はゼロショットの基盤モデルです。
6. XGBoostまたはVARMAでは、最初に **Train** をクリックします。Chronos-2はすでに事前学習済みで、ローカル学習は不要です。次に **Forecast +16** をクリックして、次の16点を予測します。
7. チャートを確認し、観測系列と予測線を比較します。

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

##### 日時らしい列が1つ
列ヘッダーに "date" または "time" が含まれていること（大文字小文字を区別しません）。
時間軸として使用されますが、直接数値特徴量には変換されません。

##### 1つ以上の数値列
これらの列は、予測対象および／または外生特徴量として使用されます。
アプリは2つの予測モードをサポートします:

- **XGBoost**: 1つの数値列を予測対象として選択し、その他の数値列を追加シグナルとして使用します。
- **VARMA experimental**: すべての数値列をまとめてモデル化し、選択した予測対象列を予測出力として表示します。

---

## 予測アプローチ

このプロジェクトでは、意図的に異なる前提を持つ3つの予測アルゴリズムを提供しています:

| モデル | 学習方式 | 複数の入力系列を使用? | ローカル学習? | 予測方式 |
| --- | --- | --- | --- | --- |
| XGBoost | 設計した時系列特徴量に対する勾配ブースティング決定木回帰 | はい | はい | 再帰的1ステップ予測 |
| VARMA experimental | リッジ正則化、残差補正、季節安定化を備えた線形多出力自己回帰 | はい、同時に | はい | 再帰的多出力予測 |
| Chronos-2-small INT8 ONNX | 事前学習済みのパッチベース時系列基盤モデル | 現在のUIでは選択した予測対象のみ | いいえ | 直接的な確率的多ステップ予測 |

これらのモデルを、同一アルゴリズムの3つの実装と解釈すべきではありません。XGBoostは時系列を教師あり表形式学習の問題へ変換し、VARMAは複数系列のラグ付きベクトルを同時にモデル化し、Chronos-2はアップロードされたデータセットに対して新しいパラメータを学習することなく、事前学習済みニューラル予測モデルを使用します。

### モデル選択

#### XGBoost

`XGBoost` はデフォルトのローカル学習モデルです。XGBoostは勾配ブースティング決定木アルゴリズムで、多数の決定木を順番に追加し、それぞれの新しい木がそれまでのアンサンブルに残った誤差を減らします。時系列はXGBoostへ直接入力されません。このプロジェクトでは、まず各時点を特徴ベクトルへ変換し、その後XGBoostを回帰モデルとして学習します。

ブラウザ実装では次を使用します:

- `MAX_LAG = 3` までの予測対象および外生系列のラグ
- 1階差分
- `ROLLING_WINDOW = 7` の移動平均
- 数値系列間の差、比率、積の相互作用
- 時間インデックス
- 周期24および168のフーリエ特徴量
- 深さ4、学習率0.1、subsample 0.8、200回のブースティング反復を設定した `gbtree`

16ステップ予測では、モデルは1ステップずつ予測します。各予測値は作業用履歴へ追加され、そのため次のステップで利用できます。XGBoostの生の予測値は、季節的継続の推定値ともブレンドされます。予測対象以外の数値コンテキストは固定せず、先へ進めます。

**長所**

- 系列間の非線形関係や相互作用を捉えられる
- このプロジェクトで手作業設計された多変量特徴量と自然に組み合わせられる
- ブラウザ内でローカルに、比較的短時間で学習できる
- 大規模な事前学習済みモデルのダウンロードが不要

**制約**

- 予測品質が選択した特徴量設計に依存する
- 再帰的予測では後半のステップほど誤差が蓄積する可能性がある
- 固定されたフーリエ周期と季節的継続は、自動的に学習されたカレンダー構造ではなく、アプリケーションレベルの仮定である

複数の数値列の関係を活用できる、軽量でローカル学習可能な非線形モデルが必要な場合はXGBoostを使用してください。

#### VARMA experimental

`VARMA experimental` は軽量なブラウザネイティブの多変量ベースラインです。名称に反して、この実装は**統計的な完全最尤VARMA推定器ではありません**。小さな残差補正と明示的な季節安定化を備えた、正則化VARスタイルのモデルに近いものです。

実装は次のとおりです:

1. 最大8個の数値系列を選択し、標準化する;
2. 直前7個の多変量ベクトルを連結してラグ特徴ベクトルを作る;
3. 多出力リッジ回帰ですべての出力系列を同時に適合させる
   (`ridge = 1e-2`);
4. 最近の残差から小さな補正を推定する (`maLag = 1`);
5. 予測時に、自己回帰出力を季節ラグのベクトルとブレンドする
   (`seasonalLag = 7`, `seasonalBlend = 0.55`);
6. 予測したベクトルを次の予測ステップへ再帰的に入力する。

各ステップで完全な数値ベクトルを予測するため、VARMAは選択した予測対象だけを予測するのではなく、モデル化されたすべての系列をまとめて先へ進めます。

**長所**

- 単純で計算コストが低い
- 複数の数値系列を同時にモデル化する
- XGBoostやChronos-2と比較するための有用な線形／古典的スタイルのベースラインを提供する
- 別途モデルをダウンロードせず、完全にTypeScriptで動作する

**制約**

- 少なくとも2つの数値系列と、利用可能な行が7行を超えて必要
- 主に線形なラグ関係を仮定する
- 残差補正と季節ブレンディングは実用的な安定化処理であり、完全な移動平均推定手順ではない
- 統計的VARMAの参照実装として提示すべきではない

複数の系列が連動して動く場合に、透明性の高い多変量ベースラインとして主に `VARMA experimental` を使用してください。

#### Chronos-2 pretrained

`Chronos-2 pretrained` は、上記2つのローカル適合モデルとは根本的に異なります。Chronos-2は事前学習済みのパッチベース時系列基盤モデルで、直接的な多ステップの**分位点予測**を生成します。このリポジトリでは `Chronos-2-small INT8` をONNX Runtime WebでONNXモデルとして実行するため、モデルをダウンロードした後の推論はローカルで行われます。

現在のブラウザ統合では:

- アップロードされたデータセットでは**学習しない**;
- Chronosのコンテキストとして選択した予測対象系列のみを使用する;
- 少なくとも16個の数値予測対象観測値が必要;
- コンテキスト観測値は最大5,760個まで保持する;
- 入力を16点のパッチにまとめ、不完全な最初のパッチは左側を `NaN` でパディングする;
- ONNXグラフ内部の672ステップ出力
  (`42 × 16`) を実行し、最初の16ステップをUIに公開する;
- モデルの分位点出力を読み取り、中央値 (`p50`) の予測を
  `p10` および `p90` の不確実性境界とともに表示する。

Chronos-2自体は、より豊かな多変量予測や共変量情報を利用した予測をサポートしていますが、**現在のUIではまだこれらの機能を使用していません**。したがって、現状のChronos実装は、多変量アプリケーションの中で動作する事前学習済みの単変量予測対象フォーキャスターとして理解してください。

**長所**

- ゼロショット予測: データセットごとのモデル適合が不要
- 1ステップモデルを再帰的に適合する代わりに、予測ホライズン全体を直接予測する
- 予測分位点を通じて確率的情報を提供する
- 大規模事前学習で学んだパターンを新しい系列へ転移できる

**制約**

- 初回利用前にモデルをダウンロードする必要がある
- ブラウザではINT8 ONNXエクスポートを使用するため、結果が完全精度の公式チェックポイントと完全には一致しない場合がある
- 現在のUIではChronos-2呼び出し時に追加の数値列を無視する
- ブラウザメモリとWASM実行により、モデルサイズとコンテキスト長に実用上の制約がある

このリポジトリの現在のAirPassengers 128/16ホールドアウトベンチマークでは、`Chronos-2-small INT8 ONNX` が比較可能なモデルの中でMAE、RMSE、MAPE、sMAPE、MASEのすべてについて最小値を達成しました。測定値と評価プロトコルは下記のベンチマーク節を参照してください。

### 16ステップ予測

アプリケーションレベルのデフォルト予測ホライズンは16です。統合されたChronos-2 ONNXモデルが16点パッチを使用しており、比較のためXGBoostとVARMAのAPIも同じホライズンに揃えているためです。

各アルゴリズムは異なる方法でその16点へ到達します:

- **XGBoost** は再帰的に予測します。予測された各予測対象値は次のステップの履歴の一部となり、予測対象以外のコンテキストも同時に先へ進みます。
- **VARMA experimental** は完全な多変量ベクトルを再帰的に予測し、その予測ベクトルを次のステップへ入力します。
- **Chronos-2** は直接的な多ステップ確率推論を行い、事前学習済みモデルの出力から将来位置の最初の16点を返します。

この違いはモデル比較で重要です。XGBoostとVARMAでは再帰的予測誤差が蓄積し得る一方、Chronos-2は要求された将来系列を直接生成します。

---

## 特徴量設計 (XGBoost)

この節の手作業で設計した特徴量はXGBoostパイプラインに適用されます。VARMAは正規化済みラグベクトルを直接使用し、Chronos-2はこれらの特徴量を使わず、選択された予測対象系列上で動作します。

XGBoostパイプラインは、入力を小規模な多変量時系列として扱います:

- 1つの*日時らしい*列（ヘッダーに大文字小文字を問わず `date` または `time` を含む）。
- 複数の数値列（例: `item_a`, `item_b`, `item_c`, ...）。
- 数値列の1つを予測する**予測対象**として選択する。

内部では、特徴量ビルダーが各時点 `t` について**豊富な特徴ベクトル**を構築し、`t + 1` について**将来特徴ベクトル**を構築します。すべての特徴量はJavaScript/TypeScriptで、**完全にクライアント側**で計算されます。

### 特徴量に使用する系列

- `datetimeKey`  
  - `"date"` または `"time"` を含むヘッダーから自動検出されます。
  - 時間軸の特定にのみ使用され、直接数値特徴量としては使用されません。
- `targetKey`  
  - ユーザーが予測対象として選択する数値列。
- `featureKeys`  
  - その他すべての数値列（非日時、非予測対象）。
  - **外生系列**として扱われます。

内部では、系列ごとに1つの数値配列を持つ `seriesMap: Record<string, number[]>` を保持します。

### 系列ごとの特徴量（外生系列）

各外生系列 `x(t)`（`featureKeys` の各キー）と各時点 `t` について、次を計算します:

1. **同時点の値**
   - `x(t)`（時刻インデックス `t` における値）。

2. **ラグ特徴量（履歴）**
   - `MAX_LAG = 3` まで:
     - `x(t - 1)`
     - `x(t - 2)`
     - `x(t - 3)`
   - これにより、モデルは系列ごとの短期的な時間ダイナミクスを学習できます。

3. **1階差分**
   - `x(t) - x(t - 1)`
   - 絶対水準だけではなく、局所的変化（トレンド／傾き）を捉えます。

4. **移動平均（局所平均）**
   - `ROLLING_WINDOW = 7` 時点のローリングウィンドウ:
     - `mean(x[t - 6 ... t])`（系列の先頭付近では短縮）
   - 局所トレンド／基準水準を表し、短期ノイズを平滑化します。

> 系列がウィンドウより短い場合、コードは自動的にウィンドウを縮小し、`t` までに利用可能な過去の全点を使用します。

### 予測対象系列の履歴

**予測対象系列** `y(t)` 自体については、現在値 `y(t)` はそのステップのラベルであるため特徴量に**含めません**が、その履歴は含めます:

1. **予測対象のラグ**
   - `y(t - 1)`
   - `y(t - 2)`
   - `y(t - 3)`

2. **予測対象の差分**
   - `y(t) - y(t - 1)`

3. **予測対象の移動平均**
   - 上記と同じローリングウィンドウ:
     - `mean(y[t - 6 ... t])`

これによりモデルは、「次の値は直近数点とその局所トレンドに依存する」といった、時系列予測で典型的なパターンを学習できます。

### 系列間相互作用

**異なる系列間の関係**を捉えるため、予測対象を含む**すべての数値系列のペア**について相互作用特徴量を構築します:

- `v_i(t)` と `v_j(t)` を、時点 `t` における2系列の同時点値とします。
- `i < j` を満たす各順序付きペア `(i, j)` について、次を計算します:

1. **差**
   - `v_i(t) - v_j(t)`
   - 系列間の相対的な水準差を表現します。

2. **比率**
   - `v_i(t) / v_j(t)`
   - ゼロ除算を避けるため、必要に応じて分母に小さなepsilonを加えます:
     - `denom = |v_j| < 1e-9 ? sign(v_j) * 1e-9 : v_j`
   - 相対スケールと比例関係を表現します。

3. **積**
   - `v_i(t) * v_j(t)`
   - 両方の系列が大きい、または小さいことが重要になる「相互作用効果」をモデルが表現できるようにします。

これらの系列間特徴量により、個別系列の値だけに依存するのではなく、**複数系列構造**をブースターへ明示的に提示します。

### 時間インデックスとフーリエ特徴量

時間そのものも数値特徴量としてエンコードします:

1. **時間インデックス**
   - 整数インデックス `t = 0, 1, 2, ...`（行インデックス）。
   - ブースターが全体的なトレンドをモデル化するための単純な手段を提供します。

2. **フーリエ特徴量**（周期パターン）
   - 2つの固定周期（「行数」を単位とする）:
     - 周期24（例: 1時間ごとのデータなら24時間）
     - 周期168（例: 7日 × 24時間）
   - 各周期 `P` について次を計算します:
     - `sin(2πt / P)`
     - `cos(2πt / P)`
   - これは、木モデルでも利用可能な形で季節性／周期を埋め込む標準的な方法です。

各時点 `t` の最終特徴ベクトルは次のとおりです:

```text
[ exogenous features (current, lags, diff, rolling mean for each series),
  target-series history (lags, diff, rolling mean),
  cross-series interactions (spread, ratio, product),
  time index, sin/cos(2πt/24), sin/cos(2πt/168) ]
```

### 将来ステップの特徴ベクトル (lastFeatureRow)
同じ特徴構築ロジックを使用して、t + 1（1ステップ先予測）の特徴ベクトルを生成します:
- 概念上、次の時間インデックスを t_next = n とし、n は観測済み行数とします。
- t_next における各系列の「現在」値には、最後に観測された値（index n - 1）を再利用します。
- ラグと移動平均は、観測データの最後の MAX_LAG / ROLLING_WINDOW ステップを使用して計算します。
- 時間エンコーディングには t_next を時間インデックスとして使用します。
- これにより、最後の観測までの全履歴に基づいて次の時点を表す、単一の特徴ベクトル lastFeatureRow が得られます。

したがって、buildFeatures関数は次を返します:
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

### 2. すべてのサービスをビルドして起動:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. テスト:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## AirPassengers ベンチマーク

公平な16ステップ評価プロトコルと論文比較のルールについては、[`BENCHMARKS.md`](./BENCHMARKS.md) を参照してください。

このリポジトリにはAirPassengersデータセットと、古典的な月次時系列データセットに対してモデルの挙動を確認するためのベンチマークコマンドが含まれています。

Docker Composeでベンチマークを実行します:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark
```

JSON出力:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --json
```

季節ナイーブベースライン:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --algorithm seasonal-naive --json
```


### 16ステップ・ホールドアウトベンチマーク

以下の結果では、比較可能なすべてのモデルに同じ固定起点評価プロトコルを使用しています:

- 学習: AirPassengersの最初の128観測値
- ホールドアウト: 続く16観測値
- 予測中にホールドアウトの予測対象値をフィードバックしない
- 共通の点予測指標: MAE、RMSE、MAPE、sMAPE、MASE

次のコマンドでベンチマークを再現できます:

```bash
docker compose -f docker-compose.test.yml run --rm \
  air_passengers_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-air-passengers-fair.mjs --markdown
  '
```

測定結果:

| モデル | 学習 | ホライズン | MAE | RMSE | MAPE | sMAPE | MASE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| seasonal-naive | 128 | 16 | 64.2500 | 68.0808 | 14.1651% | 15.4031% | 2.1748 |
| xgboost | 128 | 16 | 24.5775 | 29.5014 | 5.5687% | 5.3717% | 0.8319 |
| Chronos-2-small INT8 ONNX | 128 | 16 | **14.7839** | **17.3376** | **3.2438%** | **3.2636%** | **0.5004** |
| VARMA experimental | 128 | 16 | N/A | N/A | N/A | N/A | N/A |

この16ステップAirPassengersホールドアウトでは、Chronos-2-small INT8 ONNXが報告されたすべての点予測指標で最小誤差を示しました。これはアプリケーションレベルの比較であり、Chronos-2論文の集約スコアを直接再現したものではありません。

AirPassengersは単変量である一方、このリポジトリの実験的VARMA実装は少なくとも2つの数値系列を必要とするため、VARMAはN/Aとしています。多変量および論文比較プロトコルについては [`BENCHMARKS.md`](./BENCHMARKS.md) を参照してください。


### AirPassengers xgboost ベンチマーク (120/24)

#### csv: data/air_passengers.csv
|  | この実装 | seasonal-naive | 
| -------- | -------- | -------- |
| train_size | 120 | 120 | 
| test_size | 24 | 24 | 
| MAE | 43.6495 | 47.5833 | 
| RMSE | 50.8508 | 49.9867 | 
| MAPE | 9.5665% | 10.5227% | 
| sMAPE | 9.5943% | 11.1666% | 

---

# ライセンス
- Apache License 2.0
