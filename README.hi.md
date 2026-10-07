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

> **अनुवाद संबंधी सूचना:** यह README अंग्रेज़ी संस्करण का अनुवाद है। किसी भी अंतर की स्थिति में अंग्रेज़ी `README.md` को प्रामाणिक स्रोत माना जाएगा।

!["web_ui"](./assets/images/web_ui.png)

[PlayGround](https://europanite.github.io/client_side_time_series_forecast/)

XGBoost, एक प्रयोगात्मक VARMA-शैली मॉडल और Chronos-2 द्वारा संचालित एक client-side, browser-based time-series forecasting playground।

यह ऐप CSV या XLSX फ़ाइल लोड करता है, datetime और numeric columns का पता लगाता है, आपको forecasting model चुनने देता है, और observed values तथा 16-step forecast दोनों को visualize करता है। आपका डेटा आपके browser में ही रहता है।

---

## अवलोकन

यह एक multivariate time-series forecasting tool है जो पूरी तरह आपके web browser में चलता है।
किसी installation, registration या payment की आवश्यकता नहीं है। 
बस अपने browser से इसे खोलें और उपयोग शुरू करें।
यह छोटे व्यवसायों को अगले दिन के orders का अनुमान लगाने में मदद करता है।

- Browser में CSV/XLSX time-series datasets लोड करें
- किसी भी numeric column को forecast target के रूप में चुनें
- XGBoost, एक experimental VARMA-style model और pretrained Chronos-2 में से चुनें
- चुने गए model को browser में locally train करें
- अगले 16 points का forecast करें और उन्हें chart में जोड़ें

सब कुछ **आपके browser के अंदर** होता है। कोई backend API नहीं है और कोई डेटा आपकी machine से बाहर नहीं जाता।

---

## डेमो

1. GitHub Pages demo खोलें:  
   https://europanite.github.io/client_side_time_series_forecast/
2. [`data/sample_data.csv`](./data/datsample_dataa.csv) या [`data/sample_data.xlsx`](./data/sample_data.xlsx) जैसी sample file अपलोड करें।
3. ऐप:
   - एक **datetime-like column** का पता लगाएगा
   - उपलब्ध numeric columns की सूची दिखाएगा
4. एक numeric column को **target** के रूप में चुनें।
5. एक **forecast model** चुनें। `XGBoost` default है, `VARMA experimental` एक lightweight multivariate baseline है, और `Chronos-2 pretrained` एक zero-shot foundation model है।
6. XGBoost या VARMA के लिए पहले **Train** पर क्लिक करें। Chronos-2 पहले से pretrained है और local training की आवश्यकता नहीं है। फिर अगले 16 points का अनुमान लगाने के लिए **Forecast +16** पर क्लिक करें।
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

##### एक datetime-like column
Column header में "date" या "time" शामिल होना चाहिए (case-insensitive)।
इसे time axis के रूप में उपयोग किया जाता है, लेकिन सीधे numeric features में convert नहीं किया जाता।

##### एक या अधिक numeric columns
इन columns का उपयोग target और/या exogenous features के रूप में किया जाता है।
ऐप दो forecasting modes का समर्थन करता है:

- **XGBoost**: आप एक numeric column को target के रूप में चुनते हैं, और अन्य numeric columns को अतिरिक्त signals के रूप में उपयोग किया जाता है।
- **VARMA experimental**: सभी numeric columns को साथ में model किया जाता है, और चुना गया target column forecast output के रूप में दिखाया जाता है।

---

## Forecasting दृष्टिकोण

यह project जानबूझकर अलग-अलग assumptions वाले तीन forecasting algorithms उपलब्ध कराता है:

| Model | Learning style | कई input series का उपयोग? | Local training? | Forecast style |
| --- | --- | --- | --- | --- |
| XGBoost | Engineered time-series features पर gradient-boosted decision-tree regression | हाँ | हाँ | Recursive one-step forecasting |
| VARMA experimental | Ridge regularization, residual correction और seasonal stabilization वाला linear multi-output autoregression | हाँ, संयुक्त रूप से | हाँ | Recursive multi-output forecasting |
| Chronos-2-small INT8 ONNX | Pretrained patch-based time-series foundation model | वर्तमान UI में केवल चुना गया target | नहीं | Direct probabilistic multi-step forecasting |

इन models को एक ही algorithm के तीन implementations के रूप में नहीं समझना चाहिए। XGBoost time series को supervised tabular-learning problem में बदलता है, VARMA कई series के lagged vectors को संयुक्त रूप से model करता है, और Chronos-2 uploaded dataset पर नए parameters fit किए बिना pretrained neural forecasting model का उपयोग करता है।

### Model चयन

#### XGBoost

`XGBoost` default locally trained model है। XGBoost एक gradient-boosted decision-tree algorithm है: कई decision trees क्रमशः जोड़े जाते हैं, और हर नया tree पिछले ensemble द्वारा छोड़ी गई errors को कम करता है। Time series को सीधे XGBoost में नहीं दिया जाता। यह project पहले प्रत्येक time step को feature vector में बदलता है और फिर XGBoost को regression model के रूप में train करता है।

Browser implementation में शामिल हैं:

- `MAX_LAG = 3` तक target और exogenous lags
- first differences
- `ROLLING_WINDOW = 7` rolling mean
- numeric series के बीच spread, ratio और product interactions
- time index
- periods 24 और 168 वाले Fourier features
- depth 4, learning rate 0.1, subsample 0.8 और 200 boosting iterations के साथ `gbtree`

16-step forecast के लिए model एक समय में एक step predict करता है। प्रत्येक prediction working history में जोड़ दी जाती है और इसलिए अगले step के लिए उपलब्ध होती है। Raw XGBoost prediction को seasonal continuation estimate के साथ भी blend किया जाता है। Non-target numeric context को स्थिर रखने के बजाय आगे बढ़ाया जाता है।

**मुख्य खूबियाँ**

- series के बीच nonlinear relationships और interactions पकड़ता है
- project के hand-engineered multivariate features के साथ स्वाभाविक रूप से काम करता है
- browser में locally और अपेक्षाकृत जल्दी train होता है
- बड़े pretrained model download की आवश्यकता नहीं होती

**सीमाएँ**

- forecasting quality चुनी गई feature engineering पर निर्भर करती है
- recursive forecasting बाद के steps में errors जमा कर सकती है
- fixed Fourier periods और seasonal continuation automatically learned calendar structure नहीं, बल्कि application-level assumptions हैं

जब आपको ऐसा lightweight, locally trained nonlinear model चाहिए जो कई numeric columns के relationships का लाभ उठा सके, तब XGBoost उपयोग करें।

#### VARMA experimental

`VARMA experimental` एक lightweight browser-native multivariate baseline है। नाम के बावजूद, यह implementation **पूर्ण statistical maximum-likelihood VARMA estimator नहीं है**। यह छोटे residual correction और explicit seasonal stabilization वाले regularized VAR-style model के अधिक करीब है।

Implementation:

1. अधिकतम 8 numeric series चुनता है और उन्हें standardize करता है;
2. पिछले 7 multivariate vectors को जोड़कर lag feature vector बनाता है;
3. multi-output ridge regression के साथ सभी output series को एक साथ fit करता है
   (`ridge = 1e-2`);
4. हाल के residuals से एक छोटा correction estimate करता है (`maLag = 1`);
5. forecasting के दौरान autoregressive output को seasonal lag के vector के साथ blend करता है
   (`seasonalLag = 7`, `seasonalBlend = 0.55`);
6. predicted vector को recursively अगले forecast step में वापस feed करता है।

क्योंकि हर step पर पूरा numeric vector predict किया जाता है, VARMA केवल चुने गए target को forecast करने के बजाय सभी modeled series को साथ में आगे बढ़ाता है।

**मुख्य खूबियाँ**

- सरल और computationally inexpensive
- कई numeric series को संयुक्त रूप से model करता है
- XGBoost और Chronos-2 के मुकाबले उपयोगी linear/classical-style baseline देता है
- अलग model download के बिना पूरी तरह TypeScript में चलता है

**सीमाएँ**

- कम से कम दो numeric series और 7 से अधिक usable rows आवश्यक हैं
- मुख्यतः linear lag relationships मानता है
- residual correction और seasonal blending व्यावहारिक stabilizers हैं, पूर्ण moving-average estimation procedure नहीं
- इसे statistical VARMA के reference implementation के रूप में प्रस्तुत नहीं किया जाना चाहिए

जब कई series साथ-साथ चलती हों, तब `VARMA experimental` का मुख्यतः एक transparent multivariate baseline के रूप में उपयोग करें।

#### Chronos-2 pretrained

`Chronos-2 pretrained` ऊपर दिए गए दो locally fitted models से मूल रूप से अलग है। Chronos-2 एक pretrained, patch-based time-series foundation model है जो direct multi-step **quantile forecasts** उत्पन्न करता है। यह repository `Chronos-2-small INT8` को ONNX Runtime Web के साथ ONNX model के रूप में चलाती है, इसलिए model download होने के बाद inference locally किया जाता है।

वर्तमान browser integration:

- uploaded dataset पर **train नहीं करता**;
- Chronos context के रूप में केवल चुनी गई target series का उपयोग करता है;
- कम से कम 16 numeric target observations आवश्यक हैं;
- अधिकतम 5,760 context observations रखता है;
- input को 16-point patches में group करता है, और अधूरे पहले patch के बाएँ भाग को `NaN` से pad करता है;
- ONNX graph का internal 672-step output चलाता है
  (`42 × 16`) और पहले 16 steps UI में उपलब्ध कराता है;
- model का quantile output पढ़ता है और median (`p50`) forecast को
  `p10` तथा `p90` uncertainty bounds के साथ दिखाता है।

Chronos-2 स्वयं अधिक समृद्ध multivariate और covariate-informed forecasting का समर्थन करता है, लेकिन **वर्तमान UI अभी इन capabilities का उपयोग नहीं करता**। इसलिए मौजूदा Chronos implementation को एक अन्यथा multivariate application के भीतर pretrained univariate target forecaster के रूप में समझना चाहिए।

**मुख्य खूबियाँ**

- zero-shot forecasting: हर dataset के लिए अलग model fitting आवश्यक नहीं
- one-step models को recursively fit करने के बजाय पूरा forecast horizon सीधे predict करता है
- forecast quantiles के माध्यम से probabilistic information देता है
- बड़े पैमाने की pretraining में सीखे patterns को नई series में transfer कर सकता है

**सीमाएँ**

- पहली बार उपयोग करने से पहले model download करना पड़ता है
- browser INT8 ONNX export का उपयोग करता है, इसलिए results full-precision official checkpoint से बिल्कुल समान होना आवश्यक नहीं
- वर्तमान UI Chronos-2 को call करते समय अतिरिक्त numeric columns को ignore करता है
- browser memory और WASM execution model size तथा context length पर व्यावहारिक सीमाएँ लगाते हैं

Repository के मौजूदा AirPassengers 128/16 holdout benchmark में `Chronos-2-small INT8 ONNX` ने comparable models के बीच MAE, RMSE, MAPE, sMAPE और MASE सभी में सबसे कम मान हासिल किए। मापे गए values और evaluation protocol के लिए नीचे benchmark section देखें।

### 16-step forecast

Application-level default horizon 16 है क्योंकि integrated Chronos-2 ONNX model 16-point patches का उपयोग करता है, और तुलना के लिए XGBoost तथा VARMA APIs को भी उसी horizon पर align किया गया है।

ये algorithms उन 16 points तक अलग-अलग तरीके से पहुँचते हैं:

- **XGBoost** recursively predict करता है। हर predicted target value अगले step के history का हिस्सा बनती है, और non-target context भी आगे बढ़ता है।
- **VARMA experimental** पूरा multivariate vector recursively predict करता है और उस predicted vector को अगले step में feed करता है।
- **Chronos-2** direct multi-step probabilistic inference करता है और pretrained model output से पहले 16 future positions लौटाता है।

Models की तुलना करते समय यह अंतर महत्वपूर्ण है: XGBoost और VARMA में recursive forecast error जमा हो सकती है, जबकि Chronos-2 माँगी गई future sequence सीधे generate करता है।

---

## Feature Engineering (XGBoost)

इस section के hand-engineered features XGBoost pipeline पर लागू होते हैं। VARMA normalized lag vectors का सीधे उपयोग करता है, जबकि Chronos-2 इन features के बिना चुनी गई target sequence पर काम करता है।

XGBoost pipeline input को एक छोटी multivariate time series के रूप में मानता है:

- एक *datetime-like* column (header में किसी भी case में `date` या `time` शामिल हो)।
- कई numeric columns (जैसे `item_a`, `item_b`, `item_c`, ...)।
- numeric columns में से एक को forecast करने के लिए **target** चुना जाता है।

Internally, feature builder प्रत्येक time step `t` के लिए एक **rich feature vector** और `t + 1` के लिए एक **future feature vector** बनाता है। सभी features JavaScript/TypeScript में **पूरी तरह client पर** compute किए जाते हैं।

### Features के लिए उपयोग की जाने वाली series

- `datetimeKey`  
  - `"date"` या `"time"` वाले header से automatically detect होता है।
  - केवल time axis ढूँढने के लिए उपयोग होता है; सीधे numeric feature के रूप में उपयोग नहीं होता।
- `targetKey`  
  - Numeric column जिसे user forecast करने के लिए चुनता है।
- `featureKeys`  
  - अन्य सभी numeric columns (non-datetime, non-target)।
  - इन्हें **exogenous series** माना जाता है।

Internally हम `seriesMap: Record<string, number[]>` रखते हैं, जिसमें हर series के लिए एक numeric array होता है।

### प्रति-series features (exogenous series)

हर exogenous series `x(t)` (`featureKeys` की हर key) और हर time step `t` के लिए हम compute करते हैं:

1. **समकालिक मान**
   - `x(t)` (time index `t` पर value)।

2. **Lag features (history)**
   - `MAX_LAG = 3` तक:
     - `x(t - 1)`
     - `x(t - 2)`
     - `x(t - 3)`
   - इससे model हर series की short-term temporal dynamics सीख सकता है।

3. **First difference**
   - `x(t) - x(t - 1)`
   - केवल absolute level के बजाय local changes (trend / slope) पकड़ता है।

4. **Rolling mean (local average)**
   - `ROLLING_WINDOW = 7` time steps की rolling window:
     - `mean(x[t - 6 ... t])` (series की शुरुआत के पास truncated)
   - local trend / baseline level दर्शाता है और short-term noise को smooth करता है।

> यदि series window से छोटी है, तो code automatically window को छोटा कर देता है ताकि `t` तक उपलब्ध सभी past points उपयोग किए जा सकें।

### Target-series history

**Target series** `y(t)` के लिए हम current value `y(t)` को feature के रूप में **शामिल नहीं करते** (क्योंकि वही उस step का label है), लेकिन उसका history शामिल करते हैं:

1. **Target lags**
   - `y(t - 1)`
   - `y(t - 2)`
   - `y(t - 3)`

2. **Target difference**
   - `y(t) - y(t - 1)`

3. **Target rolling mean**
   - ऊपर वाली ही rolling window:
     - `mean(y[t - 6 ... t])`

इससे model ऐसे patterns सीख सकता है जैसे “अगला value पिछले कुछ values और उनके local trend पर निर्भर करता है,” जो time-series forecasting में सामान्य है।

### Cross-series interactions

**अलग-अलग series के relationships** पकड़ने के लिए हम हर **numeric series pair** (target सहित) के लिए interaction features बनाते हैं:

- `v_i(t)` और `v_j(t)` को time `t` पर दो series के contemporaneous values मानें।
- `i < j` वाले प्रत्येक ordered pair `(i, j)` के लिए हम compute करते हैं:

1. **Spread**
   - `v_i(t) - v_j(t)`
   - series के बीच relative level differences encode करता है।

2. **Ratio**
   - `v_i(t) / v_j(t)`
   - division by zero से बचने के लिए जरूरत पड़ने पर denominator में छोटा epsilon शामिल किया जाता है:
     - `denom = |v_j| < 1e-9 ? sign(v_j) * 1e-9 : v_j`
   - relative scale और proportionality encode करता है।

3. **Product**
   - `v_i(t) * v_j(t)`
   - model को ऐसे “interaction effects” व्यक्त करने देता है जहाँ दोनों series का बड़ा या छोटा होना मायने रखता है।

ये cross-series features केवल individual series values पर निर्भर रहने के बजाय booster को **multi-series structure** स्पष्ट रूप से उपलब्ध कराते हैं।

### Time index और Fourier features

हम समय को भी numeric features के रूप में encode करते हैं:

1. **Time index**
   - Integer index `t = 0, 1, 2, ...` (row index)।
   - Booster को global trends model करने का सरल तरीका देता है।

2. **Fourier features** (cyclical patterns)
   - दो fixed periods (“number of rows” की units में):
     - Period 24 (जैसे hourly data में 24 hours)
     - Period 168 (जैसे 7 days × 24 hours)
   - हर period `P` के लिए हम compute करते हैं:
     - `sin(2πt / P)`
     - `cos(2πt / P)`
   - यह seasonality/cycles को ऐसे रूप में embed करने का standard तरीका है जिसका tree models भी उपयोग कर सकें।

हर time step `t` के लिए final feature vector है:

```text
[ exogenous features (current, lags, diff, rolling mean for each series),
  target-series history (lags, diff, rolling mean),
  cross-series interactions (spread, ratio, product),
  time index, sin/cos(2πt/24), sin/cos(2πt/168) ]
```

### Future-step feature vector (lastFeatureRow)
उसी feature-building logic का उपयोग t + 1 (one-step-ahead prediction) के लिए feature vector बनाने में किया जाता है:
- Conceptually, अगले time index को t_next = n माना जाता है, जहाँ n observed rows की संख्या है।
- t_next पर हर series के “current” values के लिए हम last observed value (index n - 1) को reuse करते हैं।
- Lags और rolling means observed data के अंतिम MAX_LAG / ROLLING_WINDOW steps से compute किए जाते हैं।
- Time encodings में t_next को time index के रूप में उपयोग किया जाता है।
- इससे एक single feature vector lastFeatureRow मिलता है, जो अंतिम observation तक के पूरे history के आधार पर अगला time step represent करता है।

इसलिए buildFeatures function लौटाता है:
```text
{
  X: number[][];        // feature matrix for all observed steps
  y: number[];          // target series values for those steps
  lastFeatureRow: number[]; // feature vector representing t + 1
}
```

---


## 🚀 शुरुआत

### 1. पूर्वापेक्षाएँ
- [Docker Compose](https://docs.docker.com/compose/)

### 2. सभी services को build और start करें:

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

## AirPassengers Benchmark

निष्पक्ष 16-step protocol और paper-comparison rules के लिए [`BENCHMARKS.md`](./BENCHMARKS.md) देखें।

Repository में AirPassengers dataset और एक benchmark command शामिल है, जिससे classic monthly time-series dataset पर model behavior जाँचा जा सकता है।

Docker Compose के साथ benchmark चलाएँ:

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


### 16-step holdout benchmark

निम्न results हर comparable model के लिए एक ही fixed-origin evaluation protocol का उपयोग करते हैं:

- train: पहले 128 AirPassengers observations
- holdout: अगले 16 observations
- forecasting के दौरान कोई holdout target value वापस feed नहीं की जाती
- common point metrics: MAE, RMSE, MAPE, sMAPE और MASE

Benchmark को पुनः चलाएँ:

```bash
docker compose -f docker-compose.test.yml run --rm \
  air_passengers_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-air-passengers-fair.mjs --markdown
  '
```

मापे गए results:

| Model | Train | Horizon | MAE | RMSE | MAPE | sMAPE | MASE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| seasonal-naive | 128 | 16 | 64.2500 | 68.0808 | 14.1651% | 15.4031% | 2.1748 |
| xgboost | 128 | 16 | 24.5775 | 29.5014 | 5.5687% | 5.3717% | 0.8319 |
| Chronos-2-small INT8 ONNX | 128 | 16 | **14.7839** | **17.3376** | **3.2438%** | **3.2636%** | **0.5004** |
| VARMA experimental | 128 | 16 | N/A | N/A | N/A | N/A | N/A |

इस 16-step AirPassengers holdout में Chronos-2-small INT8 ONNX ने हर reported point metric पर सबसे कम error दिया। यह application-level comparison है, Chronos-2 paper के aggregate scores की direct reproduction नहीं।

VARMA को N/A दिखाया गया है क्योंकि AirPassengers univariate है, जबकि इस repository के experimental VARMA implementation को कम से कम दो numeric series चाहिए। Multivariate और paper-comparison protocol के लिए [`BENCHMARKS.md`](./BENCHMARKS.md) देखें।


### AirPassengers xgboost benchmark (120/24)

#### csv: data/air_passengers.csv
|  | यह कार्य | seasonal-naive | 
| -------- | -------- | -------- |
| train_size | 120 | 120 | 
| test_size | 24 | 24 | 
| MAE | 43.6495 | 47.5833 | 
| RMSE | 50.8508 | 49.9867 | 
| MAPE | 9.5665% | 10.5227% | 
| sMAPE | 9.5943% | 11.1666% | 

---

# लाइसेंस
- Apache License 2.0
