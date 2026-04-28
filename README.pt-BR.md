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

Um playground de previsão de séries temporais multivariadas, baseado em navegador e executado no lado do cliente, alimentado por XGBoost e por uma baseline experimental no estilo VARMA.

O app carrega um arquivo CSV ou XLSX, detecta colunas de data/hora e colunas numéricas, permite escolher um modelo de previsão e visualiza tanto os valores observados quanto uma previsão de 10 passos. Seus dados permanecem no navegador.

---

## Visão geral

Esta é uma ferramenta de previsão de séries temporais multivariadas que roda inteiramente no seu navegador.
Não requer instalação, cadastro ou pagamento.
Basta acessar pelo navegador e começar a usar.
Ela ajuda pequenos negócios a prever os pedidos de amanhã.

- Carregar datasets de séries temporais CSV/XLSX no navegador
- Selecionar qualquer coluna numérica como alvo da previsão
- Escolher entre o modelo XGBoost padrão e uma baseline experimental no estilo VARMA
- Treinar o modelo selecionado localmente no navegador
- Prever os próximos 10 pontos e adicioná-los ao gráfico

Tudo acontece **dentro do seu navegador**. Não há API de backend e nenhum dado sai da sua máquina.

---

## Demonstração

1. Abra a demo no GitHub Pages:  
   https://europanite.github.io/client_side_time_series_forecast/
2. Faça upload de um arquivo de exemplo como [`data/sample_data.csv`](./data/datsample_dataa.csv) ou [`data/sample_data.xlsx`](./data/sample_data.xlsx).
3. O app irá:
   - Detectar uma **coluna semelhante a datetime**
   - Listar as colunas numéricas disponíveis
4. Escolha uma coluna numérica como **target**.
5. Escolha um **forecast model**. `XGBoost` é o padrão. `VARMA experimental` é uma baseline multivariada leve para comparação.
6. Clique em **Train** para construir o modelo selecionado e depois em **Forecast +10** para prever os próximos 10 pontos.
7. Inspecione o gráfico para comparar a série observada e a linha de previsão.

---

## Estrutura dos dados

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### Requisitos:

##### Una columna similar a fecha/hora
O cabeçalho da coluna contém "date" ou "time" sem diferenciar maiúsculas e minúsculas. É usado como eixo de tempo, mas não é convertido diretamente em features numéricas.

##### Una o más columnas numéricas
Essas colunas são usadas como alvo e/ou features exógenas. O app suporta dois modos de previsão:

- **XGBoost**: você escolhe uma coluna numérica como alvo, e as outras colunas numéricas são usadas como sinais adicionais.
- **VARMA experimental**: todas as colunas numéricas são modeladas em conjunto, e a coluna alvo selecionada é exibida como saída da previsão.

---

## Abordagem de previsão

O projeto oferece duas abordagens de previsão no navegador: o modelo XGBoost padrão e uma baseline experimental no estilo VARMA.

Para cada linha, o app constrói um vetor de features a partir de:

- valores defasados recentes
- diferenças locais
- médias móveis
- interações entre séries
- índice de tempo
- features cíclicas no estilo Fourier

A coluna alvo selecionada é usada como rótulo de previsão. O modelo aprende como o próximo valor se relaciona com o comportamento recente do alvo e de outras séries numéricas.

### Seleção de modelo

#### XGBoost

`XGBoost` é o modelo padrão. É um modelo de regressão baseado em features que usa valores defasados, estatísticas móveis, interações entre séries e features de tempo. Use este modelo quando quiser a previsão geral mais forte para dados tabulares multivariados de séries temporais.

#### VARMA experimental

`VARMA experimental` é uma baseline multivariada leve no estilo VARMA implementada em TypeScript. Ela prevê séries numéricas em conjunto e exibe a série alvo selecionada.

Esta implementação é intencionalmente experimental. Não é uma implementação VARMA completa por máxima verossimilhança. Atualmente ela se comporta como um modelo autorregressivo no estilo VAR com estabilização residual e sazonal; portanto deve ser usada como baseline de comparação, não como substituto do XGBoost.

Use `VARMA experimental` quando quiser comparar XGBoost com um modelo clássico multivariado de séries temporais, especialmente quando várias séries numéricas se movem juntas.

### Previsão de 10 etapas

A UI prevê 10 pontos futuros. Cada passo futuro é anexado ao histórico de trabalho para que passos posteriores possam usar valores previstos anteriormente.

Para dados com múltiplas séries, o app também avança o contexto numérico para que a previsão não apenas mantenha cada coluna não alvo fixa no último valor observado. No modo XGBoost, o alvo selecionado é previsto diretamente enquanto o contexto não alvo é estendido. No modo VARMA experimental, todas as séries numéricas avançam juntas e a série alvo selecionada aparece no gráfico e no texto da previsão.

---

## Engenharia de features

Este projeto trata a entrada como uma pequena série temporal multivariada:

- Uma coluna *datetime-like* (o cabeçalho contém `date` ou `time`).
- Várias colunas numéricas (por exemplo, `item_a`, `item_b`, `item_c`, ...).
- Uma das colunas numéricas é escolhida como **target** a ser prevista.

Internamente, o construtor de features cria um **rich feature vector** para cada passo de tempo `t` e um **future feature vector** para `t + 1`. Todas as features são calculadas **inteiramente no cliente**, em JavaScript/TypeScript.

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


## 🚀 Primeiros passos

### 1. Pré-requisitos
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Construir e iniciar todos os serviços:

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

## Benchmark AirPassengers

O repositório inclui um dataset AirPassengers e um comando de benchmark para verificar o comportamento do modelo em relação a um dataset mensal clássico de séries temporais.

Execute o benchmark com Docker Compose:

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
