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

一个完全在客户端浏览器中运行的时间序列预测 Playground，由 XGBoost、实验性 VARMA 风格模型和 Chronos-2 提供支持。

该应用可加载 CSV 或 XLSX 文件，检测日期时间列和数值列，让你选择预测模型，并同时可视化观测值和未来 16 步预测。你的数据始终保留在浏览器中。

---

## 概述

这是一个完全在 Web 浏览器中运行的多变量时间序列预测工具。
无需安装、注册或付费。 
只需通过浏览器访问即可开始使用。
它可以帮助小型企业预测明天的订单量。

- 在浏览器中加载 CSV/XLSX 时间序列数据集
- 选择任意数值列作为预测目标
- 在 XGBoost、实验性 VARMA 风格模型和预训练 Chronos-2 之间选择
- 在浏览器中本地训练所选模型
- 预测接下来的 16 个点并将其追加到图表中

所有处理都发生在**你的浏览器内部**。没有后端 API，也不会有数据离开你的设备。

---

## 演示

1. 打开 GitHub Pages 演示：  
   https://europanite.github.io/client_side_time_series_forecast/
2. 上传示例文件，例如 [`data/sample_data.csv`](./data/datsample_dataa.csv) 或 [`data/sample_data.xlsx`](./data/sample_data.xlsx)。
3. 应用将：
   - 检测一个**类似日期时间的列**
   - 列出可用的数值列
4. 选择一个数值列作为**目标**。
5. 选择一个**预测模型**。`XGBoost` 为默认模型，`VARMA experimental` 是轻量级多变量基线，`Chronos-2 pretrained` 是零样本基础模型。
6. 对于 XGBoost 或 VARMA，先点击 **Train**。Chronos-2 已完成预训练，不需要本地训练。然后点击 **Forecast +16**，预测接下来的 16 个点。
7. 查看图表，对比观测序列和预测曲线。

---

## 数据结构

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### 要求：

##### 一个类似日期时间的列
列标题中包含 "date" 或 "time"（不区分大小写）。
该列用作时间轴，但不会直接转换为数值特征。

##### 一个或多个数值列
这些列用作目标和/或外生特征。
应用支持两种预测模式：

- **XGBoost**：选择一个数值列作为目标，其余数值列用作附加信号。
- **VARMA experimental**：所有数值列共同建模，所选目标列作为预测输出显示。

---

## 预测方法

本项目提供三种预测算法，它们刻意采用不同的假设：

| 模型 | 学习方式 | 使用多个输入序列？ | 本地训练？ | 预测方式 |
| --- | --- | --- | --- | --- |
| XGBoost | 基于人工构造时间序列特征的梯度提升决策树回归 | 是 | 是 | 递归单步预测 |
| VARMA experimental | 带岭正则化、残差修正和季节性稳定处理的线性多输出自回归 | 是，联合建模 | 是 | 递归多输出预测 |
| Chronos-2-small INT8 ONNX | 预训练的基于 patch 的时间序列基础模型 | 当前 UI 中仅使用所选目标 | 否 | 直接概率多步预测 |

不应把这三个模型理解为同一种算法的三个实现。XGBoost 将时间序列转换为监督式表格学习问题；VARMA 联合建模多个序列的滞后向量；Chronos-2 则使用预训练神经预测模型，而无需针对上传的数据集拟合新参数。

### 模型选择

#### XGBoost

`XGBoost` 是默认的本地训练模型。XGBoost 是梯度提升决策树算法：依次加入许多决策树，每棵新树都会减少此前集成模型留下的误差。时间序列不会直接传给 XGBoost。本项目首先把每个时间步转换为特征向量，然后将 XGBoost 作为回归模型进行训练。

浏览器实现使用：

- 目标序列和外生序列的滞后项，最多到 `MAX_LAG = 3`
- 一阶差分
- `ROLLING_WINDOW = 7` 的滚动均值
- 数值序列之间的差值、比值和乘积交互
- 时间索引
- 周期为 24 和 168 的 Fourier 特征
- `gbtree`，深度 4、学习率 0.1、subsample 0.8、200 次 boosting 迭代

对于 16 步预测，模型每次预测一步。每个预测值都会追加到工作历史中，因此可供下一步使用。原始 XGBoost 预测值还会与季节性延续估计进行混合。非目标数值上下文会继续向前推进，而不是保持不变。

**优势**

- 能捕捉序列之间的非线性关系和交互作用
- 能自然利用项目中手工构造的多变量特征
- 可在浏览器中本地、较快地训练
- 不需要下载大型预训练模型

**局限**

- 预测质量取决于所选择的特征工程
- 递归预测可能在后续步骤中累积误差
- 固定 Fourier 周期和季节性延续属于应用层假设，而不是自动学习得到的日历结构

当你需要一个轻量、本地训练且能利用多个数值列之间关系的非线性模型时，可使用 XGBoost。

#### VARMA experimental

`VARMA experimental` 是一个轻量、浏览器原生的多变量基线。尽管名称如此，这个实现**并不是完整的统计最大似然 VARMA 估计器**。它更接近带少量残差修正和显式季节性稳定处理的正则化 VAR 风格模型。

其实现方式如下：

1. 选择最多 8 个数值序列并进行标准化；
2. 将前 7 个多变量向量拼接为一个滞后特征向量；
3. 使用多输出岭回归同时拟合所有输出序列
   (`ridge = 1e-2`)；
4. 根据最近的残差估计一个小幅修正 (`maLag = 1`)；
5. 在预测期间，将自回归输出与季节滞后的向量混合
   (`seasonalLag = 7`, `seasonalBlend = 0.55`)；
6. 将预测出的向量递归反馈到下一预测步骤。

由于每一步都会预测完整的数值向量，因此 VARMA 会让所有已建模序列一起向前推进，而不是只预测所选目标。

**优势**

- 简单且计算成本低
- 联合建模多个数值序列
- 可作为对比 XGBoost 和 Chronos-2 的实用线性/经典风格基线
- 完全使用 TypeScript 运行，不需要单独下载模型

**局限**

- 至少需要两个数值序列以及超过 7 行可用数据
- 主要假设线性的滞后关系
- 残差修正和季节性混合是实用的稳定手段，并不是完整的移动平均估计过程
- 不应将其作为统计 VARMA 的参考实现来介绍

当多个序列共同变化时，主要将 `VARMA experimental` 用作透明的多变量基线。

#### Chronos-2 pretrained

`Chronos-2 pretrained` 与上面两个本地拟合模型有根本区别。Chronos-2 是一个预训练、基于 patch 的时间序列基础模型，可直接生成多步**分位数预测**。本仓库通过 ONNX Runtime Web 将 `Chronos-2-small INT8` 作为 ONNX 模型运行，因此模型下载完成后，推理在本地执行。

当前浏览器集成：

- **不会**在上传的数据集上训练；
- 仅使用所选目标序列作为 Chronos 上下文；
- 至少需要 16 个数值型目标观测值；
- 最多保留 5,760 个上下文观测值；
- 将输入分组为 16 点 patch，对不完整的第一个 patch 在左侧用 `NaN` 填充；
- 运行 ONNX 图内部的 672 步输出
  (`42 × 16`)，并向 UI 暴露前 16 步；
- 读取模型的分位数输出，显示中位数 (`p50`) 预测，同时显示
  `p10` 和 `p90` 不确定性边界。

Chronos-2 本身支持更丰富的多变量预测和利用协变量信息的预测，但**当前 UI 尚未使用这些能力**。因此，目前的 Chronos 实现应理解为：在一个整体上支持多变量的应用中，作为预训练的单变量目标预测器使用。

**优势**

- 零样本预测：无需针对每个数据集单独拟合模型
- 直接预测完整预测范围，而不是递归拟合单步模型
- 通过预测分位数提供概率信息
- 可将大规模预训练中学到的模式迁移到新的序列

**局限**

- 首次使用前必须下载模型
- 浏览器使用 INT8 ONNX 导出，因此结果不一定与全精度官方 checkpoint 完全一致
- 当前 UI 在调用 Chronos-2 时忽略其他数值列
- 浏览器内存和 WASM 执行会对模型大小和上下文长度施加实际限制

在本仓库当前的 AirPassengers 128/16 holdout benchmark 中，`Chronos-2-small INT8 ONNX` 在可比较模型里取得了最低的 MAE、RMSE、MAPE、sMAPE 和 MASE。具体测量值和评估协议请参见下面的 benchmark 部分。

### 16 步预测

应用层默认预测范围为 16，因为集成的 Chronos-2 ONNX 模型使用 16 点 patch，同时 XGBoost 和 VARMA API 也统一到相同范围以便比较。

三种算法以不同方式得到这 16 个点：

- **XGBoost** 采用递归预测。每个预测出的目标值都会成为下一步历史的一部分，同时非目标上下文也会向前推进。
- **VARMA experimental** 递归预测完整多变量向量，并将该预测向量反馈给下一步。
- **Chronos-2** 执行直接的多步概率推理，并从预训练模型输出中返回前 16 个未来位置。

这个差异对模型比较很重要：XGBoost 和 VARMA 可能累积递归预测误差，而 Chronos-2 会直接生成所请求的未来序列。

---

## 特征工程 (XGBoost)

本节中的手工构造特征适用于 XGBoost pipeline。VARMA 直接使用标准化的滞后向量，而 Chronos-2 不使用这些特征，只对所选目标序列进行处理。

XGBoost pipeline 将输入视为一个小型多变量时间序列：

- 一个*类似日期时间*的列（标题中以任意大小写形式包含 `date` 或 `time`）。
- 多个数值列（例如 `item_a`, `item_b`, `item_c`, ...）。
- 选择其中一个数值列作为要预测的**目标**。

在内部，特征构建器会为每个时间步 `t` 构建一个**丰富的特征向量**，并为 `t + 1` 构建一个**未来特征向量**。所有特征都通过 JavaScript/TypeScript **完全在客户端**计算。

### 用于特征的序列

- `datetimeKey`  
  - 从包含 `"date"` 或 `"time"` 的标题中自动检测。
  - 仅用于定位时间轴；不会直接作为数值特征使用。
- `targetKey`  
  - 用户选择用于预测的数值列。
- `featureKeys`  
  - 所有其他数值列（非日期时间、非目标）。
  - 被视为**外生序列**。

内部维护一个 `seriesMap: Record<string, number[]>`，每个序列对应一个数值数组。

### 每个序列的特征（外生序列）

对于每个外生序列 `x(t)`（`featureKeys` 中的每个 key）以及每个时间步 `t`，我们计算：

1. **同期值**
   - `x(t)`（时间索引 `t` 处的值）。

2. **滞后特征（历史）**
   - 最多到 `MAX_LAG = 3`：
     - `x(t - 1)`
     - `x(t - 2)`
     - `x(t - 3)`
   - 这使模型能够学习每个序列的短期时间动态。

3. **一阶差分**
   - `x(t) - x(t - 1)`
   - 捕捉局部变化（趋势/斜率），而不仅仅是绝对水平。

4. **滚动均值（局部平均）**
   - `ROLLING_WINDOW = 7` 个时间步的滚动窗口：
     - `mean(x[t - 6 ... t])`（在序列开头附近会截短）
   - 表示局部趋势/基准水平，并平滑短期噪声。

> 如果序列比窗口短，代码会自动缩小窗口，以使用截至 `t` 为止所有可用的历史点。

### 目标序列历史

对于**目标序列** `y(t)` 本身，我们**不会**把当前值 `y(t)` 作为特征（因为它是该步骤的标签），但会包含其历史：

1. **目标滞后项**
   - `y(t - 1)`
   - `y(t - 2)`
   - `y(t - 3)`

2. **目标差分**
   - `y(t) - y(t - 1)`

3. **目标滚动均值**
   - 与上面相同的滚动窗口：
     - `mean(y[t - 6 ... t])`

这使模型可以学习诸如“下一个值取决于最近几个值及其局部趋势”这样的模式，这在时间序列预测中很常见。

### 跨序列交互

为了捕捉**不同序列之间的关系**，我们为每一对**数值序列**（包括目标）构建交互特征：

- 设 `v_i(t)` 和 `v_j(t)` 为两个序列在时间 `t` 的同期值。
- 对每个满足 `i < j` 的有序对 `(i, j)`，计算：

1. **差值**
   - `v_i(t) - v_j(t)`
   - 编码序列之间的相对水平差异。

2. **比值**
   - `v_i(t) / v_j(t)`
   - 为避免除以零，如有需要，分母会加入一个很小的 epsilon：
     - `denom = |v_j| < 1e-9 ? sign(v_j) * 1e-9 : v_j`
   - 编码相对尺度和比例关系。

3. **乘积**
   - `v_i(t) * v_j(t)`
   - 使模型可以表达两个序列同时较大或较小时才重要的“交互效应”。

这些跨序列特征把**多序列结构**显式提供给 booster，而不是只依赖各个序列自身的值。

### 时间索引和 Fourier 特征

我们还将时间本身编码为数值特征：

1. **时间索引**
   - 整数索引 `t = 0, 1, 2, ...`（行索引）。
   - 为 booster 提供一种简单方式来建模全局趋势。

2. **Fourier 特征**（周期模式）
   - 两个固定周期（单位为“行数”）：
     - 周期 24（例如小时级数据中的 24 小时）
     - 周期 168（例如 7 天 × 24 小时）
   - 对每个周期 `P`，计算：
     - `sin(2πt / P)`
     - `cos(2πt / P)`
   - 这是将季节性/周期嵌入为树模型仍能利用的形式的一种标准方法。

每个时间步 `t` 的最终特征向量为：

```text
[ exogenous features (current, lags, diff, rolling mean for each series),
  target-series history (lags, diff, rolling mean),
  cross-series interactions (spread, ratio, product),
  time index, sin/cos(2πt/24), sin/cos(2πt/168) ]
```

### 未来步骤特征向量 (lastFeatureRow)
使用相同的特征构建逻辑，为 t + 1（提前一步预测）生成特征向量：
- 从概念上讲，我们把下一个时间索引视为 t_next = n，其中 n 是已观测行数。
- 对于 t_next 时每个序列的“当前”值，复用最后一个观测值（index n - 1）。
- 滞后项和滚动均值使用观测数据最后 MAX_LAG / ROLLING_WINDOW 个步骤计算。
- 时间编码使用 t_next 作为时间索引。
- 这样得到一个单独的特征向量 lastFeatureRow，它基于直到最后一个观测为止的全部历史来表示下一时间步。

因此，buildFeatures 函数返回：
```text
{
  X: number[][];        // feature matrix for all observed steps
  y: number[];          // target series values for those steps
  lastFeatureRow: number[]; // feature vector representing t + 1
}
```

---


## 🚀 快速开始

### 1. 前置条件
- [Docker Compose](https://docs.docker.com/compose/)

### 2. 构建并启动所有服务：

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. 测试：
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## AirPassengers Benchmark

关于公平的 16 步评估协议和论文比较规则，请参阅 [`BENCHMARKS.md`](./BENCHMARKS.md)。

该仓库包含 AirPassengers 数据集以及一个 benchmark 命令，用于在经典月度时间序列数据集上检查模型行为。

使用 Docker Compose 运行 benchmark：

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark
```

JSON 输出：

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --json
```

季节性 naive 基线：

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --algorithm seasonal-naive --json
```


### 16 步 holdout benchmark

以下结果对所有可比较模型采用相同的固定起点评估协议：

- 训练：AirPassengers 的前 128 个观测值
- holdout：接下来的 16 个观测值
- 预测期间不会将任何 holdout 目标值反馈给模型
- 通用点预测指标：MAE、RMSE、MAPE、sMAPE 和 MASE

使用以下命令复现 benchmark：

```bash
docker compose -f docker-compose.test.yml run --rm \
  air_passengers_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-air-passengers-fair.mjs --markdown
  '
```

测量结果：

| 模型 | 训练 | 预测范围 | MAE | RMSE | MAPE | sMAPE | MASE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| seasonal-naive | 128 | 16 | 64.2500 | 68.0808 | 14.1651% | 15.4031% | 2.1748 |
| xgboost | 128 | 16 | 24.5775 | 29.5014 | 5.5687% | 5.3717% | 0.8319 |
| Chronos-2-small INT8 ONNX | 128 | 16 | **14.7839** | **17.3376** | **3.2438%** | **3.2636%** | **0.5004** |
| VARMA experimental | 128 | 16 | N/A | N/A | N/A | N/A | N/A |

在这个 16 步 AirPassengers holdout 中，Chronos-2-small INT8 ONNX 在所有报告的点预测指标上都取得了最低误差。这是应用层面的比较，而不是对 Chronos-2 论文聚合分数的直接复现。

VARMA 被标记为 N/A，因为 AirPassengers 是单变量数据，而本仓库的实验性 VARMA 实现至少需要两个数值序列。关于多变量和论文比较协议，请参阅 [`BENCHMARKS.md`](./BENCHMARKS.md)。


### AirPassengers xgboost benchmark (120/24)

#### csv: data/air_passengers.csv
|  | 本实现 | seasonal-naive | 
| -------- | -------- | -------- |
| train_size | 120 | 120 | 
| test_size | 24 | 24 | 
| MAE | 43.6495 | 47.5833 | 
| RMSE | 50.8508 | 49.9867 | 
| MAPE | 9.5665% | 10.5227% | 
| sMAPE | 9.5943% | 11.1666% | 

---

# 许可证
- Apache License 2.0
