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

> **번역 안내:** 이 README는 영어 버전을 번역한 문서입니다. 내용에 차이가 있는 경우 영어 `README.md`를 기준 문서로 합니다.

!["web_ui"](./assets/images/web_ui.png)

[PlayGround](https://europanite.github.io/client_side_time_series_forecast/)

XGBoost, 실험적 VARMA 스타일 모델, Chronos-2로 구동되는 클라이언트 사이드 브라우저 기반 시계열 예측 Playground입니다.

이 앱은 CSV 또는 XLSX 파일을 불러오고 datetime 및 숫자형 열을 감지하며, 예측 모델을 선택할 수 있게 하고 관측값과 16-step 예측을 함께 시각화합니다. 데이터는 브라우저 안에 그대로 유지됩니다.

---

## 개요

이 도구는 웹 브라우저 안에서 완전히 실행되는 다변량 시계열 예측 도구입니다.
설치, 등록, 결제가 필요하지 않습니다. 
브라우저로 접속하기만 하면 바로 사용할 수 있습니다.
소규모 사업자가 다음 날 주문량을 예측하는 데 도움을 줍니다.

- 브라우저에서 CSV/XLSX 시계열 데이터셋 불러오기
- 임의의 숫자형 열을 예측 대상(target)으로 선택하기
- XGBoost, 실험적 VARMA 스타일 모델, 사전 학습된 Chronos-2 중 선택하기
- 선택한 모델을 브라우저에서 로컬 학습하기
- 다음 16개 포인트를 예측해 차트에 추가하기

모든 처리는 **브라우저 내부**에서 이루어집니다. 백엔드 API가 없으며 데이터가 사용자의 컴퓨터 밖으로 나가지 않습니다.

---

## 데모

1. GitHub Pages 데모를 엽니다:  
   https://europanite.github.io/client_side_time_series_forecast/
2. [`data/sample_data.csv`](./data/datsample_dataa.csv) 또는 [`data/sample_data.xlsx`](./data/sample_data.xlsx) 같은 샘플 파일을 업로드합니다.
3. 앱은 다음 작업을 수행합니다:
   - **datetime 형태의 열** 감지
   - 사용 가능한 숫자형 열 목록 표시
4. 숫자형 열 하나를 **target**으로 선택합니다.
5. **예측 모델**을 선택합니다. `XGBoost`가 기본값이며, `VARMA experimental`은 경량 다변량 baseline이고, `Chronos-2 pretrained`는 zero-shot foundation model입니다.
6. XGBoost 또는 VARMA를 사용하는 경우 먼저 **Train**을 클릭합니다. Chronos-2는 이미 사전 학습되어 있으므로 로컬 학습이 필요하지 않습니다. 그런 다음 **Forecast +16**을 클릭하여 다음 16개 포인트를 예측합니다.
7. 차트를 확인하여 관측 시계열과 예측선을 비교합니다.

---

## 데이터 구조

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### 요구 사항:

##### datetime 형태의 열 1개
열 헤더에 "date" 또는 "time"이 포함되어야 합니다(대소문자 구분 없음).
시간 축으로 사용되지만 숫자형 특징으로 직접 변환되지는 않습니다.

##### 하나 이상의 숫자형 열
이 열들은 target 및/또는 외생 특징으로 사용됩니다.
앱은 두 가지 예측 모드를 지원합니다:

- **XGBoost**: 숫자형 열 하나를 target으로 선택하고, 다른 숫자형 열은 추가 신호로 사용합니다.
- **VARMA experimental**: 모든 숫자형 열을 함께 모델링하고, 선택한 target 열을 예측 출력으로 표시합니다.

---

## 예측 방식

이 프로젝트는 의도적으로 서로 다른 가정을 사용하는 세 가지 예측 알고리즘을 제공합니다:

| 모델 | 학습 방식 | 여러 입력 시계열 사용? | 로컬 학습? | 예측 방식 |
| --- | --- | --- | --- | --- |
| XGBoost | 설계된 시계열 특징을 이용한 gradient-boosted decision-tree 회귀 | 예 | 예 | 재귀적 one-step 예측 |
| VARMA experimental | ridge 정규화, 잔차 보정, 계절 안정화를 포함한 선형 multi-output 자기회귀 | 예, 공동으로 | 예 | 재귀적 multi-output 예측 |
| Chronos-2-small INT8 ONNX | 사전 학습된 patch 기반 시계열 foundation model | 현재 UI에서는 선택된 target만 | 아니요 | 직접 확률적 multi-step 예측 |

이 모델들을 같은 알고리즘의 세 가지 구현으로 해석해서는 안 됩니다. XGBoost는 시계열을 지도학습 기반 tabular-learning 문제로 변환하고, VARMA는 여러 시계열의 lagged vector를 공동 모델링하며, Chronos-2는 업로드된 데이터셋에 새 파라미터를 적합하지 않고 사전 학습된 신경망 예측 모델을 사용합니다.

### 모델 선택

#### XGBoost

`XGBoost`는 기본 로컬 학습 모델입니다. XGBoost는 gradient-boosted decision-tree 알고리즘으로, 많은 결정 트리를 순차적으로 추가하고 각 새 트리가 이전 ensemble이 남긴 오차를 줄입니다. 시계열은 XGBoost에 직접 전달되지 않습니다. 이 프로젝트는 먼저 각 시점을 feature vector로 변환한 다음 XGBoost를 회귀 모델로 학습합니다.

브라우저 구현에서는 다음을 사용합니다:

- `MAX_LAG = 3`까지의 target 및 외생 시계열 lag
- 1차 차분
- `ROLLING_WINDOW = 7` 이동 평균
- 숫자형 시계열 간 spread, ratio, product 상호작용
- 시간 인덱스
- 주기 24 및 168의 Fourier 특징
- depth 4, learning rate 0.1, subsample 0.8, 200 boosting iterations의 `gbtree`

16-step 예측에서는 모델이 한 번에 한 step씩 예측합니다. 각 예측값은 작업 이력에 추가되어 다음 step에서 사용할 수 있습니다. 원시 XGBoost 예측값은 계절 연속성 추정값과도 혼합됩니다. target이 아닌 숫자형 context는 고정하지 않고 앞으로 진행시킵니다.

**장점**

- 시계열 간 비선형 관계와 상호작용을 포착함
- 프로젝트의 수작업 다변량 특징과 자연스럽게 함께 동작함
- 브라우저에서 로컬로 비교적 빠르게 학습됨
- 대형 사전 학습 모델 다운로드가 필요 없음

**제한 사항**

- 예측 품질이 선택한 feature engineering에 의존함
- 재귀적 예측은 뒤쪽 step에서 오차가 누적될 수 있음
- 고정된 Fourier 주기와 계절 연속성은 자동 학습된 달력 구조가 아니라 애플리케이션 수준의 가정임

여러 숫자형 열의 관계를 활용할 수 있는 가볍고 로컬 학습 가능한 비선형 모델이 필요할 때 XGBoost를 사용하세요.

#### VARMA experimental

`VARMA experimental`은 가벼운 브라우저 네이티브 다변량 baseline입니다. 이름과 달리 이 구현은 **완전한 통계적 maximum-likelihood VARMA estimator가 아닙니다**. 작은 잔차 보정과 명시적 계절 안정화를 가진 정규화된 VAR 스타일 모델에 더 가깝습니다.

구현 방식은 다음과 같습니다:

1. 최대 8개의 숫자형 시계열을 선택하고 표준화합니다;
2. 이전 7개의 다변량 벡터를 연결해 lag feature vector를 만듭니다;
3. multi-output ridge regression으로 모든 출력 시계열을 동시에 적합합니다
   (`ridge = 1e-2`);
4. 최근 잔차에서 작은 보정값을 추정합니다 (`maLag = 1`);
5. 예측 시 자기회귀 출력을 계절 lag 벡터와 혼합합니다
   (`seasonalLag = 7`, `seasonalBlend = 0.55`);
6. 예측된 벡터를 다음 예측 step에 재귀적으로 다시 입력합니다.

각 step에서 전체 숫자 벡터를 예측하기 때문에 VARMA는 선택된 target만 예측하는 대신 모델링된 모든 시계열을 함께 앞으로 진행시킵니다.

**장점**

- 단순하고 계산 비용이 낮음
- 여러 숫자형 시계열을 공동으로 모델링함
- XGBoost 및 Chronos-2와 비교할 수 있는 유용한 선형/고전적 스타일 baseline을 제공함
- 별도 모델 다운로드 없이 TypeScript에서 완전히 실행됨

**제한 사항**

- 최소 두 개의 숫자형 시계열과 7개를 초과하는 사용 가능한 행이 필요함
- 주로 선형 lag 관계를 가정함
- 잔차 보정과 계절 blending은 실용적인 안정화 기법이며 완전한 moving-average 추정 절차가 아님
- 통계적 VARMA의 참조 구현으로 제시해서는 안 됨

여러 시계열이 함께 움직일 때 `VARMA experimental`을 주로 투명한 다변량 baseline으로 사용하세요.

#### Chronos-2 pretrained

`Chronos-2 pretrained`는 위의 두 로컬 적합 모델과 근본적으로 다릅니다. Chronos-2는 직접적인 multi-step **quantile forecast**를 생성하는 사전 학습된 patch 기반 시계열 foundation model입니다. 이 저장소는 `Chronos-2-small INT8`을 ONNX Runtime Web을 이용한 ONNX 모델로 실행하므로, 모델을 다운로드한 뒤에는 추론이 로컬에서 수행됩니다.

현재 브라우저 통합은 다음과 같습니다:

- 업로드된 데이터셋으로 **학습하지 않음**;
- Chronos context로 선택한 target 시계열만 사용함;
- 최소 16개의 숫자형 target 관측값이 필요함;
- 최대 5,760개의 context 관측값을 유지함;
- 입력을 16-point patch로 묶고 불완전한 첫 patch의 왼쪽을 `NaN`으로 padding함;
- ONNX graph 내부의 672-step 출력을 실행하고
  (`42 × 16`) 첫 16 step을 UI에 제공함;
- 모델의 quantile 출력을 읽어 중앙값 (`p50`) 예측을
  `p10` 및 `p90` 불확실성 경계와 함께 표시함.

Chronos-2 자체는 더 풍부한 다변량 예측과 공변량 정보를 활용한 예측을 지원하지만, **현재 UI는 아직 이러한 기능을 사용하지 않습니다**. 따라서 현재 Chronos 구현은 전체적으로는 다변량인 애플리케이션 안에서 동작하는 사전 학습된 단변량 target forecaster로 이해해야 합니다.

**장점**

- zero-shot 예측: 데이터셋별 모델 적합이 필요 없음
- one-step 모델을 재귀적으로 적합하는 대신 전체 예측 horizon을 직접 예측함
- 예측 quantile을 통해 확률 정보를 제공함
- 대규모 사전 학습에서 학습한 패턴을 새로운 시계열에 전이할 수 있음

**제한 사항**

- 첫 사용 전에 모델을 다운로드해야 함
- 브라우저는 INT8 ONNX export를 사용하므로 결과가 full-precision 공식 checkpoint와 정확히 일치하지 않을 수 있음
- 현재 UI는 Chronos-2 호출 시 추가 숫자형 열을 무시함
- 브라우저 메모리와 WASM 실행으로 인해 모델 크기와 context 길이에 실용적 제한이 있음

이 저장소의 현재 AirPassengers 128/16 holdout benchmark에서 `Chronos-2-small INT8 ONNX`는 비교 가능한 모델 중 MAE, RMSE, MAPE, sMAPE, MASE 모두에서 가장 낮은 값을 기록했습니다. 측정값과 평가 프로토콜은 아래 benchmark 섹션을 참조하세요.

### 16-step 예측

애플리케이션 수준의 기본 horizon은 16입니다. 통합된 Chronos-2 ONNX 모델이 16-point patch를 사용하고, 비교를 위해 XGBoost와 VARMA API도 같은 horizon에 맞추었기 때문입니다.

각 알고리즘은 서로 다른 방식으로 그 16개 포인트에 도달합니다:

- **XGBoost**는 재귀적으로 예측합니다. 예측된 각 target 값은 다음 step의 이력 일부가 되며, target이 아닌 context도 함께 앞으로 진행합니다.
- **VARMA experimental**은 전체 다변량 벡터를 재귀적으로 예측하고 그 예측 벡터를 다음 step에 입력합니다.
- **Chronos-2**는 직접적인 multi-step 확률 추론을 수행하고 사전 학습 모델 출력에서 미래의 첫 16개 위치를 반환합니다.

이 차이는 모델을 비교할 때 중요합니다. XGBoost와 VARMA는 재귀 예측 오차가 누적될 수 있지만, Chronos-2는 요청된 미래 시퀀스를 직접 생성합니다.

---

## 특징 엔지니어링 (XGBoost)

이 섹션의 수작업 특징은 XGBoost pipeline에 적용됩니다. VARMA는 정규화된 lag vector를 직접 사용하고, Chronos-2는 이러한 특징 없이 선택된 target sequence에서 동작합니다.

XGBoost pipeline은 입력을 작은 다변량 시계열로 처리합니다:

- 하나의 *datetime 형태* 열(헤더에 대소문자와 관계없이 `date` 또는 `time` 포함).
- 여러 숫자형 열(예: `item_a`, `item_b`, `item_c`, ...).
- 숫자형 열 중 하나를 예측할 **target**으로 선택합니다.

내부적으로 feature builder는 각 time step `t`에 대해 **풍부한 feature vector**를 구성하고 `t + 1`에 대해 **미래 feature vector**를 구성합니다. 모든 특징은 JavaScript/TypeScript로 **완전히 클라이언트에서** 계산됩니다.

### 특징에 사용되는 시계열

- `datetimeKey`  
  - `"date"` 또는 `"time"`을 포함하는 헤더에서 자동 감지됩니다.
  - 시간 축을 찾는 데만 사용되며 숫자형 특징으로 직접 사용되지 않습니다.
- `targetKey`  
  - 사용자가 예측하도록 선택한 숫자형 열입니다.
- `featureKeys`  
  - 나머지 모든 숫자형 열(non-datetime, non-target)입니다.
  - **외생 시계열**로 취급됩니다.

내부에서는 시계열마다 하나의 숫자 배열을 갖는 `seriesMap: Record<string, number[]>`을 유지합니다.

### 시계열별 특징(외생 시계열)

각 외생 시계열 `x(t)`(`featureKeys`의 각 key)과 각 time step `t`에 대해 다음을 계산합니다:

1. **동시점 값**
   - `x(t)`(time index `t`의 값).

2. **Lag 특징(이력)**
   - `MAX_LAG = 3`까지:
     - `x(t - 1)`
     - `x(t - 2)`
     - `x(t - 3)`
   - 이를 통해 모델이 각 시계열의 단기 시간 동역학을 학습할 수 있습니다.

3. **1차 차분**
   - `x(t) - x(t - 1)`
   - 절대 수준만이 아니라 국소 변화(trend / slope)를 포착합니다.

4. **이동 평균(국소 평균)**
   - `ROLLING_WINDOW = 7` time step의 rolling window:
     - `mean(x[t - 6 ... t])`(시계열 시작 부분에서는 축소됨)
   - 국소 trend / baseline level을 나타내고 단기 noise를 완화합니다.

> 시계열이 window보다 짧으면 코드는 자동으로 window를 줄여 `t`까지 사용 가능한 모든 과거 포인트를 사용합니다.

### Target 시계열 이력

**Target 시계열** `y(t)` 자체에 대해서는 현재 값 `y(t)`가 해당 step의 label이므로 feature로 **포함하지 않지만**, 이력은 포함합니다:

1. **Target lag**
   - `y(t - 1)`
   - `y(t - 2)`
   - `y(t - 3)`

2. **Target 차분**
   - `y(t) - y(t - 1)`

3. **Target 이동 평균**
   - 위와 동일한 rolling window:
     - `mean(y[t - 6 ... t])`

이를 통해 모델은 “다음 값은 최근 몇 개 값과 그 국소 trend에 의존한다”와 같은 시계열 예측의 전형적인 패턴을 학습할 수 있습니다.

### 시계열 간 상호작용

**서로 다른 시계열 간의 관계**를 포착하기 위해 target을 포함한 모든 **숫자형 시계열 쌍**에 대해 상호작용 특징을 구성합니다:

- `v_i(t)`와 `v_j(t)`를 time `t`에서 두 시계열의 동시점 값이라고 합니다.
- `i < j`인 각 순서쌍 `(i, j)`에 대해 다음을 계산합니다:

1. **Spread**
   - `v_i(t) - v_j(t)`
   - 시계열 간 상대적 수준 차이를 인코딩합니다.

2. **Ratio**
   - `v_i(t) / v_j(t)`
   - 0으로 나누는 것을 피하기 위해 필요하면 분모에 작은 epsilon을 포함합니다:
     - `denom = |v_j| < 1e-9 ? sign(v_j) * 1e-9 : v_j`
   - 상대적 scale과 비례 관계를 인코딩합니다.

3. **Product**
   - `v_i(t) * v_j(t)`
   - 두 시계열이 모두 크거나 작다는 사실이 중요한 “interaction effect”를 모델이 표현할 수 있게 합니다.

이러한 시계열 간 특징은 개별 시계열 값에만 의존하는 대신 **multi-series 구조**를 booster에 명시적으로 제공합니다.

### 시간 인덱스와 Fourier 특징

시간 자체도 숫자형 특징으로 인코딩합니다:

1. **시간 인덱스**
   - 정수 인덱스 `t = 0, 1, 2, ...`(행 인덱스).
   - booster가 전체 trend를 모델링하는 간단한 방법을 제공합니다.

2. **Fourier 특징**(주기 패턴)
   - 두 개의 고정 주기("행 수" 단위):
     - 주기 24(예: 시간 단위 데이터에서 24시간)
     - 주기 168(예: 7일 × 24시간)
   - 각 주기 `P`에 대해 다음을 계산합니다:
     - `sin(2πt / P)`
     - `cos(2πt / P)`
   - 이는 tree model도 활용할 수 있는 형태로 계절성/주기를 임베딩하는 표준적인 방법입니다.

각 time step `t`의 최종 feature vector는 다음과 같습니다:

```text
[ exogenous features (current, lags, diff, rolling mean for each series),
  target-series history (lags, diff, rolling mean),
  cross-series interactions (spread, ratio, product),
  time index, sin/cos(2πt/24), sin/cos(2πt/168) ]
```

### 미래 step feature vector (lastFeatureRow)
동일한 feature-building logic을 사용해 t + 1(one-step-ahead prediction)의 feature vector를 생성합니다:
- 개념적으로 다음 time index를 t_next = n으로 두며, n은 관측된 행 수입니다.
- t_next에서 각 시계열의 “현재” 값은 마지막 관측값(index n - 1)을 재사용합니다.
- Lag와 rolling mean은 관측 데이터의 마지막 MAX_LAG / ROLLING_WINDOW step을 사용해 계산합니다.
- 시간 인코딩에는 t_next를 time index로 사용합니다.
- 이렇게 하면 마지막 관측까지의 전체 이력을 기반으로 다음 time step을 나타내는 단일 feature vector lastFeatureRow가 만들어집니다.

따라서 buildFeatures 함수는 다음을 반환합니다:
```text
{
  X: number[][];        // feature matrix for all observed steps
  y: number[];          // target series values for those steps
  lastFeatureRow: number[]; // feature vector representing t + 1
}
```

---


## 🚀 시작하기

### 1. 사전 요구 사항
- [Docker Compose](https://docs.docker.com/compose/)

### 2. 모든 서비스를 빌드하고 시작:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. 테스트:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## AirPassengers Benchmark

공정한 16-step 프로토콜과 논문 비교 규칙은 [`BENCHMARKS.md`](./BENCHMARKS.md)를 참조하세요.

이 저장소에는 AirPassengers 데이터셋과 고전적인 월별 시계열 데이터셋에 대해 모델 동작을 확인하는 benchmark 명령이 포함되어 있습니다.

Docker Compose로 benchmark를 실행합니다:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark
```

JSON 출력:

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

다음 결과는 비교 가능한 모든 모델에 동일한 fixed-origin 평가 프로토콜을 사용합니다:

- train: AirPassengers의 처음 128개 관측값
- holdout: 다음 16개 관측값
- 예측 중 holdout target 값은 다시 입력하지 않음
- 공통 point metric: MAE, RMSE, MAPE, sMAPE, MASE

다음 명령으로 benchmark를 재현할 수 있습니다:

```bash
docker compose -f docker-compose.test.yml run --rm \
  air_passengers_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-air-passengers-fair.mjs --markdown
  '
```

측정 결과:

| 모델 | 학습 | Horizon | MAE | RMSE | MAPE | sMAPE | MASE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| seasonal-naive | 128 | 16 | 64.2500 | 68.0808 | 14.1651% | 15.4031% | 2.1748 |
| xgboost | 128 | 16 | 24.5775 | 29.5014 | 5.5687% | 5.3717% | 0.8319 |
| Chronos-2-small INT8 ONNX | 128 | 16 | **14.7839** | **17.3376** | **3.2438%** | **3.2636%** | **0.5004** |
| VARMA experimental | 128 | 16 | N/A | N/A | N/A | N/A | N/A |

이 16-step AirPassengers holdout에서 Chronos-2-small INT8 ONNX는 보고된 모든 point metric에서 가장 낮은 오차를 기록했습니다. 이는 애플리케이션 수준의 비교이며 Chronos-2 논문의 aggregate score를 직접 재현한 것이 아닙니다.

AirPassengers는 단변량인 반면 이 저장소의 experimental VARMA 구현은 최소 두 개의 숫자형 시계열이 필요하므로 VARMA는 N/A로 표시됩니다. 다변량 및 논문 비교 프로토콜은 [`BENCHMARKS.md`](./BENCHMARKS.md)를 참조하세요.


### AirPassengers xgboost benchmark (120/24)

#### csv: data/air_passengers.csv
|  | 이 구현 | seasonal-naive | 
| -------- | -------- | -------- |
| train_size | 120 | 120 | 
| test_size | 24 | 24 | 
| MAE | 43.6495 | 47.5833 | 
| RMSE | 50.8508 | 49.9867 | 
| MAPE | 9.5665% | 10.5227% | 
| sMAPE | 9.5943% | 11.1666% | 

---

# 라이선스
- Apache License 2.0
