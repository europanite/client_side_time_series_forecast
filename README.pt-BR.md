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

> **Aviso de tradução:** Este README é uma tradução da versão em inglês. Em caso de divergência, o `README.md` em inglês é a fonte oficial.

!["web_ui"](./assets/images/web_ui.png)

[PlayGround](https://europanite.github.io/client_side_time_series_forecast/)

Um playground de previsão de séries temporais baseado em navegador e executado no lado do cliente, alimentado por XGBoost, um modelo experimental no estilo VARMA e Chronos-2.

O aplicativo carrega um arquivo CSV ou XLSX, detecta colunas de data/hora e numéricas, permite escolher um modelo de previsão e visualiza tanto os valores observados quanto uma previsão de 16 passos. Seus dados permanecem no seu navegador.

---

## Visão geral

Esta é uma ferramenta de previsão de séries temporais multivariadas que funciona inteiramente no seu navegador web.
Não é necessário instalar, criar conta nem pagar. 
Basta acessar pelo navegador e começar a usar.
Ela ajuda pequenas empresas a prever os pedidos do dia seguinte.

- Carregar conjuntos de dados de séries temporais CSV/XLSX no navegador
- Selecionar qualquer coluna numérica como alvo da previsão
- Escolher entre XGBoost, um modelo experimental no estilo VARMA e Chronos-2 pré-treinado
- Treinar localmente no navegador o modelo selecionado
- Prever os próximos 16 pontos e adicioná-los ao gráfico

Tudo acontece **dentro do seu navegador**. Não há API de backend e nenhum dado sai da sua máquina.

---

## Demonstração

1. Abra a demonstração no GitHub Pages:  
   https://europanite.github.io/client_side_time_series_forecast/
2. Faça upload de um arquivo de exemplo, como [`data/sample_data.csv`](./data/datsample_dataa.csv) ou [`data/sample_data.xlsx`](./data/sample_data.xlsx).
3. O aplicativo irá:
   - Detectar uma **coluna com formato de data/hora**
   - Listar as colunas numéricas disponíveis
4. Escolha uma coluna numérica como **alvo**.
5. Escolha um **modelo de previsão**. `XGBoost` é o padrão, `VARMA experimental` é uma baseline multivariada leve e `Chronos-2 pretrained` é um modelo fundacional zero-shot.
6. Para XGBoost ou VARMA, clique primeiro em **Train**. O Chronos-2 já é pré-treinado e não exige treinamento local. Em seguida, clique em **Forecast +16** para prever os próximos 16 pontos.
7. Analise o gráfico para comparar a série observada e a linha de previsão.

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

##### Uma coluna com formato de data/hora
O cabeçalho da coluna contém "date" ou "time" (sem diferenciar maiúsculas de minúsculas).
Ela é usada como eixo temporal, mas não é convertida diretamente em características numéricas.

##### Uma ou mais colunas numéricas
Essas colunas são usadas como alvo e/ou características exógenas.
O aplicativo oferece dois modos de previsão:

- **XGBoost**: você escolhe uma coluna numérica como alvo, e as outras colunas numéricas são usadas como sinais adicionais.
- **VARMA experimental**: todas as colunas numéricas são modeladas em conjunto, e a coluna-alvo selecionada é exibida como saída da previsão.

---

## Abordagem de previsão

O projeto oferece três algoritmos de previsão com premissas deliberadamente diferentes:

| Modelo | Estilo de aprendizado | Usa várias séries de entrada? | Treinamento local? | Estilo de previsão |
| --- | --- | --- | --- | --- |
| XGBoost | Regressão com árvores de decisão gradient-boosted sobre características de séries temporais construídas | Sim | Sim | Previsão recursiva de um passo |
| VARMA experimental | Autorregressão linear multi-output com regularização ridge, correção de resíduos e estabilização sazonal | Sim, em conjunto | Sim | Previsão recursiva multi-output |
| Chronos-2-small INT8 ONNX | Modelo fundacional de séries temporais pré-treinado e baseado em patches | Apenas o alvo selecionado na UI atual | Não | Previsão probabilística direta de vários passos |

Esses modelos não devem ser interpretados como três implementações do mesmo algoritmo. O XGBoost transforma a série temporal em um problema de aprendizado supervisionado tabular, o VARMA modela em conjunto vetores defasados de várias séries, e o Chronos-2 usa um modelo neural de previsão pré-treinado sem ajustar novos parâmetros ao conjunto de dados enviado.

### Seleção do modelo

#### XGBoost

`XGBoost` é o modelo padrão treinado localmente. XGBoost é um algoritmo de árvores de decisão gradient-boosted: várias árvores são adicionadas sequencialmente, e cada nova árvore reduz os erros deixados pelo ensemble anterior. As séries temporais não são passadas diretamente ao XGBoost. Primeiro, este projeto converte cada passo de tempo em um vetor de características e, depois, treina o XGBoost como modelo de regressão.

A implementação no navegador usa:

- defasagens do alvo e das séries exógenas até `MAX_LAG = 3`
- primeiras diferenças
- uma média móvel com `ROLLING_WINDOW = 7`
- interações de diferença, razão e produto entre séries numéricas
- um índice temporal
- características de Fourier com períodos 24 e 168
- `gbtree` com profundidade 4, taxa de aprendizado 0.1, subsample 0.8 e 200 iterações de boosting

Para uma previsão de 16 passos, o modelo prevê um passo por vez. Cada previsão é adicionada ao histórico de trabalho e, portanto, fica disponível para o passo seguinte. A previsão bruta do XGBoost também é combinada com uma estimativa de continuação sazonal. O contexto numérico que não é alvo avança em vez de permanecer constante.

**Pontos fortes**

- captura relações não lineares e interações entre séries
- funciona naturalmente com as características multivariadas construídas manualmente no projeto
- treina localmente e com relativa rapidez no navegador
- não exige o download de um grande modelo pré-treinado

**Limitações**

- a qualidade da previsão depende da engenharia de características escolhida
- a previsão recursiva pode acumular erros nos passos mais distantes
- os períodos fixos de Fourier e a continuação sazonal são premissas no nível da aplicação, e não uma estrutura de calendário aprendida automaticamente

Use XGBoost quando quiser um modelo não linear leve, treinado localmente, capaz de explorar relações entre várias colunas numéricas.

#### VARMA experimental

`VARMA experimental` é uma baseline multivariada leve e nativa do navegador. Apesar do nome, esta implementação **não é um estimador VARMA estatístico completo por máxima verossimilhança**. Ela se aproxima mais de um modelo regularizado no estilo VAR, com uma pequena correção de resíduos e estabilização sazonal explícita.

A implementação:

1. seleciona até 8 séries numéricas e as padroniza;
2. concatena os 7 vetores multivariados anteriores em um vetor de características defasadas;
3. ajusta todas as séries de saída simultaneamente com regressão ridge multi-output
   (`ridge = 1e-2`);
4. estima uma pequena correção a partir de resíduos recentes (`maLag = 1`);
5. durante a previsão, combina a saída autorregressiva com o vetor da defasagem sazonal
   (`seasonalLag = 7`, `seasonalBlend = 0.55`);
6. realimenta recursivamente o vetor previsto no próximo passo de previsão.

Como o vetor numérico completo é previsto em cada passo, o VARMA avança todas as séries modeladas em conjunto, em vez de prever apenas o alvo selecionado.

**Pontos fortes**

- simples e computacionalmente barato
- modela várias séries numéricas em conjunto
- fornece uma baseline linear/de estilo clássico útil para comparação com XGBoost e Chronos-2
- funciona inteiramente em TypeScript, sem download separado de modelo

**Limitações**

- requer pelo menos duas séries numéricas e mais de 7 linhas utilizáveis
- pressupõe relações de defasagem predominantemente lineares
- a correção de resíduos e a combinação sazonal são estabilizadores pragmáticos, não um procedimento completo de estimação de média móvel
- não deve ser apresentado como uma implementação de referência de VARMA estatístico

Use `VARMA experimental` principalmente como uma baseline multivariada transparente quando várias séries se movem em conjunto.

#### Chronos-2 pretrained

`Chronos-2 pretrained` é fundamentalmente diferente dos dois modelos ajustados localmente acima. Chronos-2 é um modelo fundacional de séries temporais pré-treinado e baseado em patches que produz diretamente **previsões por quantis** de vários passos. Este repositório executa `Chronos-2-small INT8` como um modelo ONNX com ONNX Runtime Web, portanto a inferência é realizada localmente depois que o modelo é baixado.

A integração atual no navegador:

- **não** treina no conjunto de dados enviado;
- usa apenas a série-alvo selecionada como contexto do Chronos;
- requer pelo menos 16 observações numéricas do alvo;
- mantém no máximo 5,760 observações de contexto;
- agrupa a entrada em patches de 16 pontos, preenchendo à esquerda com `NaN` o primeiro patch incompleto;
- executa a saída interna de 672 passos do grafo ONNX
  (`42 × 16`) e expõe os primeiros 16 passos na UI;
- lê a saída de quantis do modelo e exibe a previsão mediana (`p50`) junto com os limites de incerteza `p10` e `p90`.

O Chronos-2 em si oferece suporte a previsões multivariadas mais ricas e informadas por covariáveis, mas **a UI atual ainda não utiliza esses recursos**. Portanto, a implementação atual do Chronos deve ser entendida como um previsor univariado pré-treinado do alvo dentro de uma aplicação que, no restante, é multivariada.

**Pontos fortes**

- previsão zero-shot: não é necessário ajustar um modelo para cada conjunto de dados
- prevê diretamente todo o horizonte de previsão em vez de ajustar recursivamente modelos de um passo
- fornece informações probabilísticas por meio dos quantis de previsão
- pode transferir para uma nova série padrões aprendidos durante o pré-treinamento em larga escala

**Limitações**

- o modelo precisa ser baixado antes do primeiro uso
- o navegador usa uma exportação INT8 ONNX, portanto os resultados podem não corresponder exatamente a um checkpoint oficial em precisão total
- a UI atual ignora colunas numéricas adicionais ao chamar o Chronos-2
- a memória do navegador e a execução WASM impõem limites práticos ao tamanho do modelo e ao comprimento do contexto

No benchmark holdout AirPassengers 128/16 atual do repositório, `Chronos-2-small INT8 ONNX` obteve os menores MAE, RMSE, MAPE, sMAPE e MASE entre os modelos comparáveis. Consulte a seção de benchmark abaixo para os valores medidos e o protocolo de avaliação.

### Previsão de 16 passos

O horizonte padrão no nível da aplicação é 16 porque o modelo ONNX Chronos-2 integrado usa patches de 16 pontos, e as APIs de XGBoost e VARMA foram alinhadas ao mesmo horizonte para comparação.

Os algoritmos chegam a esses 16 pontos de maneiras diferentes:

- **XGBoost** prevê recursivamente. Cada valor-alvo previsto passa a fazer parte do histórico do próximo passo, enquanto o contexto não alvo também avança.
- **VARMA experimental** prevê recursivamente um vetor multivariado completo e realimenta esse vetor previsto no passo seguinte.
- **Chronos-2** realiza inferência probabilística direta de vários passos e retorna as primeiras 16 posições futuras da saída do modelo pré-treinado.

Essa diferença importa na comparação dos modelos: XGBoost e VARMA podem acumular erro de previsão recursiva, enquanto o Chronos-2 gera diretamente a sequência futura solicitada.

---

## Engenharia de características (XGBoost)

As características construídas manualmente nesta seção se aplicam ao pipeline do XGBoost. O VARMA usa diretamente vetores de defasagem normalizados, enquanto o Chronos-2 opera sobre a sequência-alvo selecionada sem essas características.

O pipeline do XGBoost trata a entrada como uma pequena série temporal multivariada:

- Uma coluna *com formato de data/hora* (o cabeçalho contém `date` ou `time`, independentemente de maiúsculas/minúsculas).
- Várias colunas numéricas (por exemplo, `item_a`, `item_b`, `item_c`, ...).
- Uma das colunas numéricas é escolhida como **alvo** da previsão.

Internamente, o construtor de características cria um **vetor de características rico** para cada passo de tempo `t` e um **vetor de características futuro** para `t + 1`. Todas as características são calculadas **inteiramente no cliente**, em JavaScript/TypeScript.

### Séries usadas nas características

- `datetimeKey`  
  - Detectada automaticamente a partir do cabeçalho que contém `"date"` ou `"time"`.
  - Usada apenas para localizar o eixo temporal; não é usada diretamente como característica numérica.
- `targetKey`  
  - Coluna numérica que o usuário escolhe prever.
- `featureKeys`  
  - Todas as outras colunas numéricas (não datetime, não alvo).
  - Tratadas como **séries exógenas**.

Internamente mantemos um `seriesMap: Record<string, number[]>` com um array numérico por série.

### Características por série (séries exógenas)

Para cada série exógena `x(t)` (cada key em `featureKeys`) e cada passo de tempo `t`, calculamos:

1. **Valor contemporâneo**
   - `x(t)` (o valor no índice temporal `t`).

2. **Características de defasagem (histórico)**
   - Até `MAX_LAG = 3`:
     - `x(t - 1)`
     - `x(t - 2)`
     - `x(t - 3)`
   - Isso permite que o modelo aprenda a dinâmica temporal de curto prazo de cada série.

3. **Primeira diferença**
   - `x(t) - x(t - 1)`
   - Captura mudanças locais (tendência / inclinação), e não apenas o nível absoluto.

4. **Média móvel (média local)**
   - Janela móvel de `ROLLING_WINDOW = 7` passos de tempo:
     - `mean(x[t - 6 ... t])` (truncada próximo ao início da série)
   - Representa a tendência local / nível base e suaviza o ruído de curto prazo.

> Se a série for menor do que a janela, o código reduz automaticamente a janela para usar todos os pontos passados disponíveis até `t`.

### Histórico da série-alvo

Para a própria **série-alvo** `y(t)`, **não** incluímos o valor atual `y(t)` como característica (porque ele é o rótulo naquele passo), mas incluímos seu histórico:

1. **Defasagens do alvo**
   - `y(t - 1)`
   - `y(t - 2)`
   - `y(t - 3)`

2. **Diferença do alvo**
   - `y(t) - y(t - 1)`

3. **Média móvel do alvo**
   - A mesma janela móvel acima:
     - `mean(y[t - 6 ... t])`

Isso permite que o modelo aprenda padrões como “o próximo valor depende dos últimos valores e de sua tendência local”, algo típico em previsão de séries temporais.

### Interações entre séries

Para capturar **relações entre séries diferentes**, construímos características de interação para cada **par de séries numéricas** (incluindo o alvo):

- Considere `v_i(t)` e `v_j(t)` como os valores contemporâneos de duas séries no tempo `t`.
- Para cada par ordenado `(i, j)` com `i < j`, calculamos:

1. **Diferença**
   - `v_i(t) - v_j(t)`
   - Codifica diferenças relativas de nível entre as séries.

2. **Razão**
   - `v_i(t) / v_j(t)`
   - Para evitar divisão por zero, o denominador inclui um pequeno epsilon quando necessário:
     - `denom = |v_j| < 1e-9 ? sign(v_j) * 1e-9 : v_j`
   - Codifica escala relativa e proporcionalidade.

3. **Produto**
   - `v_i(t) * v_j(t)`
   - Permite que o modelo represente “efeitos de interação” em que importa que ambas as séries estejam altas ou baixas.

Essas características entre séries expõem explicitamente a **estrutura multissérie** ao booster, em vez de depender apenas dos valores individuais de cada série.

### Índice temporal e características de Fourier

Também codificamos o próprio tempo como características numéricas:

1. **Índice temporal**
   - Índice inteiro `t = 0, 1, 2, ...` (índice da linha).
   - Oferece ao booster uma maneira simples de modelar tendências globais.

2. **Características de Fourier** (padrões cíclicos)
   - Dois períodos fixos (em unidades de “número de linhas”):
     - Período 24 (por exemplo, 24 horas em dados horários)
     - Período 168 (por exemplo, 7 dias × 24 horas)
   - Para cada período `P`, calculamos:
     - `sin(2πt / P)`
     - `cos(2πt / P)`
   - Essa é uma forma padrão de incorporar sazonalidade/ciclos em um formato que modelos de árvores ainda conseguem explorar.

O vetor final de características para cada passo de tempo `t` é:

```text
[ exogenous features (current, lags, diff, rolling mean for each series),
  target-series history (lags, diff, rolling mean),
  cross-series interactions (spread, ratio, product),
  time index, sin/cos(2πt/24), sin/cos(2πt/168) ]
```

### Vetor de características do passo futuro (lastFeatureRow)
A mesma lógica de construção de características é usada para produzir um vetor de características para t + 1 (previsão de um passo à frente):
- Conceitualmente, tratamos o próximo índice temporal como t_next = n, em que n é o número de linhas observadas.
- Para os valores “atuais” de cada série em t_next, reutilizamos o último valor observado (index n - 1).
- As defasagens e médias móveis são calculadas usando os últimos MAX_LAG / ROLLING_WINDOW passos dos dados observados.
- As codificações temporais usam t_next como índice temporal.
- Isso produz um único vetor de características lastFeatureRow que representa o próximo passo de tempo com base em todo o histórico até a última observação.

Assim, a função buildFeatures retorna:
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

### 2. Compile e inicie todos os serviços:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. Teste:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## Benchmark AirPassengers

Consulte [`BENCHMARKS.md`](./BENCHMARKS.md) para o protocolo justo de 16 passos e as regras de comparação com artigos.

O repositório inclui um conjunto de dados AirPassengers e um comando de benchmark para verificar o comportamento dos modelos em um conjunto de dados clássico de séries temporais mensais.

Execute o benchmark com Docker Compose:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark
```

Saída JSON:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --json
```

Baseline seasonal naive:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --algorithm seasonal-naive --json
```


### Benchmark holdout de 16 passos

Os resultados a seguir usam o mesmo protocolo de avaliação de origem fixa para todos os modelos comparáveis:

- treino: primeiras 128 observações de AirPassengers
- holdout: 16 observações seguintes
- nenhum valor-alvo do holdout é realimentado durante a previsão
- métricas pontuais comuns: MAE, RMSE, MAPE, sMAPE e MASE

Reproduza o benchmark com:

```bash
docker compose -f docker-compose.test.yml run --rm \
  air_passengers_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-air-passengers-fair.mjs --markdown
  '
```

Resultados medidos:

| Modelo | Treino | Horizonte | MAE | RMSE | MAPE | sMAPE | MASE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| seasonal-naive | 128 | 16 | 64.2500 | 68.0808 | 14.1651% | 15.4031% | 2.1748 |
| xgboost | 128 | 16 | 24.5775 | 29.5014 | 5.5687% | 5.3717% | 0.8319 |
| Chronos-2-small INT8 ONNX | 128 | 16 | **14.7839** | **17.3376** | **3.2438%** | **3.2636%** | **0.5004** |
| VARMA experimental | 128 | 16 | N/A | N/A | N/A | N/A | N/A |

Neste holdout de 16 passos do AirPassengers, Chronos-2-small INT8 ONNX apresentou o menor erro em todas as métricas pontuais relatadas. Esta é uma comparação no nível da aplicação, e não uma reprodução direta das pontuações agregadas do artigo do Chronos-2.

O VARMA é indicado como N/A porque AirPassengers é univariado, enquanto a implementação experimental de VARMA deste repositório exige pelo menos duas séries numéricas. Consulte [`BENCHMARKS.md`](./BENCHMARKS.md) para o protocolo multivariado e de comparação com artigos.


### Benchmark xgboost do AirPassengers (120/24)

#### csv: data/air_passengers.csv
|  | Este trabalho | seasonal-naive | 
| -------- | -------- | -------- |
| train_size | 120 | 120 | 
| test_size | 24 | 24 | 
| MAE | 43.6495 | 47.5833 | 
| RMSE | 50.8508 | 49.9867 | 
| MAPE | 9.5665% | 10.5227% | 
| sMAPE | 9.5943% | 11.1666% | 

---

# Licença
- Apache License 2.0
