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

> **Aviso de traducción:** Este README es una traducción de la versión en inglés. En caso de discrepancia, el `README.md` en inglés es la fuente de referencia.

!["web_ui"](./assets/images/web_ui.png)

[PlayGround](https://europanite.github.io/client_side_time_series_forecast/)

Un entorno de pruebas de pronóstico de series temporales basado en navegador y ejecutado del lado del cliente, impulsado por XGBoost, un modelo experimental de estilo VARMA y Chronos-2.

La aplicación carga un archivo CSV o XLSX, detecta columnas de fecha/hora y columnas numéricas, permite elegir un modelo de pronóstico y visualiza tanto los valores observados como un pronóstico de 16 pasos. Tus datos permanecen en tu navegador.

---

## Descripción general

Esta es una herramienta de pronóstico de series temporales multivariantes que se ejecuta por completo en tu navegador web.
No requiere instalación, registro ni pago. 
Solo tienes que acceder desde el navegador y estará lista para usar.
Ayuda a pequeñas empresas a predecir los pedidos del día siguiente.

- Cargar conjuntos de datos de series temporales CSV/XLSX en el navegador
- Seleccionar cualquier columna numérica como objetivo del pronóstico
- Elegir entre XGBoost, un modelo experimental de estilo VARMA y Chronos-2 preentrenado
- Entrenar localmente en el navegador el modelo seleccionado
- Pronosticar los próximos 16 puntos y añadirlos al gráfico

Todo ocurre **dentro de tu navegador**. No existe una API de backend y ningún dato sale de tu equipo.

---

## Demo

1. Abre la demo de GitHub Pages:  
   https://europanite.github.io/client_side_time_series_forecast/
2. Carga un archivo de ejemplo como [`data/sample_data.csv`](./data/datsample_dataa.csv) o [`data/sample_data.xlsx`](./data/sample_data.xlsx).
3. La aplicación:
   - Detectará una **columna con aspecto de fecha/hora**
   - Mostrará las columnas numéricas disponibles
4. Elige una columna numérica como **objetivo**.
5. Elige un **modelo de pronóstico**. `XGBoost` es el predeterminado, `VARMA experimental` es una línea base multivariante ligera y `Chronos-2 pretrained` es un modelo fundacional zero-shot.
6. Para XGBoost o VARMA, primero haz clic en **Train**. Chronos-2 ya está preentrenado y no requiere entrenamiento local. Después, haz clic en **Forecast +16** para predecir los próximos 16 puntos.
7. Examina el gráfico para comparar la serie observada con la línea de pronóstico.

---

## Estructura de los datos

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### Requisitos:

##### Una columna con aspecto de fecha/hora
El encabezado de la columna contiene "date" o "time" (sin distinguir mayúsculas de minúsculas).
Se utiliza como eje temporal, pero no se convierte directamente en características numéricas.

##### Una o más columnas numéricas
Estas columnas se utilizan como objetivo y/o como características exógenas.
La aplicación admite dos modos de pronóstico:

- **XGBoost**: eliges una columna numérica como objetivo y las demás columnas numéricas se utilizan como señales adicionales.
- **VARMA experimental**: todas las columnas numéricas se modelan conjuntamente y la columna objetivo seleccionada se muestra como salida del pronóstico.

---

## Enfoque de pronóstico

El proyecto ofrece tres algoritmos de pronóstico con supuestos deliberadamente diferentes:

| Modelo | Estilo de aprendizaje | ¿Usa varias series de entrada? | ¿Entrenamiento local? | Estilo de pronóstico |
| --- | --- | --- | --- | --- |
| XGBoost | Regresión con árboles de decisión potenciados por gradiente sobre características de series temporales diseñadas | Sí | Sí | Pronóstico recursivo de un paso |
| VARMA experimental | Autorregresión lineal multi-salida con regularización ridge, corrección de residuos y estabilización estacional | Sí, conjuntamente | Sí | Pronóstico recursivo multi-salida |
| Chronos-2-small INT8 ONNX | Modelo fundacional de series temporales preentrenado y basado en patches | Solo el objetivo seleccionado en la UI actual | No | Pronóstico probabilístico directo de varios pasos |

Estos modelos no deben interpretarse como tres implementaciones del mismo algoritmo. XGBoost convierte la serie temporal en un problema de aprendizaje supervisado tabular, VARMA modela conjuntamente vectores rezagados de varias series y Chronos-2 utiliza un modelo neuronal de pronóstico preentrenado sin ajustar nuevos parámetros al conjunto de datos cargado.

### Selección del modelo

#### XGBoost

`XGBoost` es el modelo predeterminado entrenado localmente. XGBoost es un algoritmo de árboles de decisión potenciados por gradiente: se añaden muchos árboles de decisión de forma secuencial y cada árbol nuevo reduce los errores que deja el conjunto anterior. Las series temporales no se pasan directamente a XGBoost. Este proyecto primero convierte cada paso temporal en un vector de características y después entrena XGBoost como modelo de regresión.

La implementación en navegador utiliza:

- rezagos del objetivo y de las variables exógenas hasta `MAX_LAG = 3`
- primeras diferencias
- una media móvil con `ROLLING_WINDOW = 7`
- interacciones de diferencia, razón y producto entre series numéricas
- un índice temporal
- características de Fourier con periodos 24 y 168
- `gbtree` con profundidad 4, tasa de aprendizaje 0.1, subsample 0.8 y 200 iteraciones de boosting

Para un pronóstico de 16 pasos, el modelo predice un paso cada vez. Cada predicción se añade al historial de trabajo y, por tanto, queda disponible para el siguiente paso. La predicción bruta de XGBoost también se combina con una estimación de continuación estacional. El contexto numérico no objetivo avanza en lugar de mantenerse constante.

**Fortalezas**

- captura relaciones no lineales e interacciones entre series
- funciona de forma natural con las características multivariantes diseñadas manualmente en el proyecto
- se entrena localmente y con relativa rapidez en el navegador
- no requiere descargar un gran modelo preentrenado

**Limitaciones**

- la calidad del pronóstico depende de la ingeniería de características elegida
- el pronóstico recursivo puede acumular errores en pasos posteriores
- los periodos de Fourier fijos y la continuación estacional son supuestos a nivel de aplicación, no una estructura de calendario aprendida automáticamente

Usa XGBoost cuando quieras un modelo no lineal ligero, entrenado localmente, que pueda aprovechar las relaciones entre varias columnas numéricas.

#### VARMA experimental

`VARMA experimental` es una línea base multivariante ligera y nativa del navegador. A pesar del nombre, esta implementación **no es un estimador VARMA estadístico completo por máxima verosimilitud**. Se parece más a un modelo de estilo VAR regularizado con una pequeña corrección de residuos y estabilización estacional explícita.

La implementación:

1. selecciona hasta 8 series numéricas y las estandariza;
2. concatena los 7 vectores multivariantes anteriores para formar un vector de características rezagadas;
3. ajusta simultáneamente todas las series de salida mediante regresión ridge multi-salida
   (`ridge = 1e-2`);
4. estima una pequeña corrección a partir de residuos recientes (`maLag = 1`);
5. durante el pronóstico, combina la salida autorregresiva con el vector del rezago estacional
   (`seasonalLag = 7`, `seasonalBlend = 0.55`);
6. realimenta recursivamente el vector predicho en el siguiente paso de pronóstico.

Como en cada paso se predice el vector numérico completo, VARMA hace avanzar conjuntamente todas las series modeladas en lugar de pronosticar solo el objetivo seleccionado.

**Fortalezas**

- simple y poco costoso computacionalmente
- modela conjuntamente varias series numéricas
- proporciona una línea base lineal/de estilo clásico útil frente a XGBoost y Chronos-2
- se ejecuta por completo en TypeScript sin descargar un modelo independiente

**Limitaciones**

- requiere al menos dos series numéricas y más de 7 filas utilizables
- asume relaciones de rezago principalmente lineales
- la corrección de residuos y la mezcla estacional son estabilizadores pragmáticos, no un procedimiento completo de estimación de media móvil
- no debe presentarse como una implementación de referencia de VARMA estadístico

Usa `VARMA experimental` principalmente como una línea base multivariante transparente cuando varias series se mueven conjuntamente.

#### Chronos-2 pretrained

`Chronos-2 pretrained` es fundamentalmente diferente de los dos modelos ajustados localmente anteriores. Chronos-2 es un modelo fundacional de series temporales preentrenado y basado en patches que produce directamente **pronósticos por cuantiles** de varios pasos. Este repositorio ejecuta `Chronos-2-small INT8` como modelo ONNX con ONNX Runtime Web, por lo que la inferencia se realiza localmente una vez descargado el modelo.

La integración actual en el navegador:

- **no** entrena con el conjunto de datos cargado;
- utiliza únicamente la serie objetivo seleccionada como contexto de Chronos;
- requiere al menos 16 observaciones numéricas del objetivo;
- conserva como máximo 5,760 observaciones de contexto;
- agrupa la entrada en patches de 16 puntos y rellena por la izquierda con `NaN` el primer patch incompleto;
- ejecuta la salida interna de 672 pasos del grafo ONNX
  (`42 × 16`) y expone los primeros 16 pasos en la UI;
- lee la salida de cuantiles del modelo y muestra el pronóstico mediano (`p50`) junto con los límites de incertidumbre `p10` y `p90`.

Chronos-2 en sí admite pronósticos multivariantes más ricos y con información de covariables, pero **la UI actual todavía no utiliza esas capacidades**. Por tanto, la implementación actual de Chronos debe entenderse como un predictor preentrenado univariante del objetivo dentro de una aplicación que, por lo demás, es multivariante.

**Fortalezas**

- pronóstico zero-shot: no es necesario ajustar un modelo para cada conjunto de datos
- predice directamente todo el horizonte de pronóstico en lugar de ajustar recursivamente modelos de un paso
- proporciona información probabilística mediante cuantiles de pronóstico
- puede transferir a una nueva serie patrones aprendidos durante un preentrenamiento a gran escala

**Limitaciones**

- el modelo debe descargarse antes del primer uso
- el navegador utiliza una exportación INT8 ONNX, por lo que los resultados no tienen por qué coincidir exactamente con un checkpoint oficial de precisión completa
- la UI actual ignora las columnas numéricas adicionales al llamar a Chronos-2
- la memoria del navegador y la ejecución WASM imponen límites prácticos al tamaño del modelo y a la longitud del contexto

En el benchmark holdout AirPassengers 128/16 actual del repositorio, `Chronos-2-small INT8 ONNX` obtuvo el menor MAE, RMSE, MAPE, sMAPE y MASE entre los modelos comparables. Consulta la sección de benchmark más abajo para ver los valores medidos y el protocolo de evaluación.

### Pronóstico de 16 pasos

El horizonte predeterminado a nivel de aplicación es 16 porque el modelo ONNX Chronos-2 integrado utiliza patches de 16 puntos, y las API de XGBoost y VARMA están alineadas con el mismo horizonte para facilitar la comparación.

Los algoritmos alcanzan esos 16 puntos de formas distintas:

- **XGBoost** predice de forma recursiva. Cada valor objetivo predicho pasa a formar parte del historial para el siguiente paso, mientras que el contexto no objetivo también avanza.
- **VARMA experimental** predice recursivamente un vector multivariante completo y realimenta ese vector predicho en el siguiente paso.
- **Chronos-2** realiza inferencia probabilística directa de varios pasos y devuelve las primeras 16 posiciones futuras de la salida del modelo preentrenado.

Esta diferencia importa al comparar los modelos: XGBoost y VARMA pueden acumular error de pronóstico recursivo, mientras que Chronos-2 genera directamente la secuencia futura solicitada.

---

## Ingeniería de características (XGBoost)

Las características diseñadas manualmente en esta sección se aplican al pipeline de XGBoost. VARMA utiliza directamente vectores de rezagos normalizados, mientras que Chronos-2 opera sobre la secuencia objetivo seleccionada sin estas características.

El pipeline de XGBoost trata la entrada como una pequeña serie temporal multivariante:

- Una columna *con aspecto de fecha/hora* (el encabezado contiene `date` o `time` sin distinguir mayúsculas de minúsculas).
- Varias columnas numéricas (por ejemplo, `item_a`, `item_b`, `item_c`, ...).
- Una de las columnas numéricas se elige como **objetivo** a pronosticar.

Internamente, el constructor de características crea un **vector de características rico** para cada paso temporal `t` y un **vector de características futuro** para `t + 1`. Todas las características se calculan **íntegramente en el cliente**, en JavaScript/TypeScript.

### Series utilizadas para las características

- `datetimeKey`  
  - Se detecta automáticamente a partir del encabezado que contiene `"date"` o `"time"`.
  - Solo se utiliza para localizar el eje temporal; no se usa directamente como característica numérica.
- `targetKey`  
  - Columna numérica que el usuario elige pronosticar.
- `featureKeys`  
  - Todas las demás columnas numéricas (no datetime y no objetivo).
  - Se tratan como **series exógenas**.

Internamente mantenemos un `seriesMap: Record<string, number[]>` con un array numérico por serie.

### Características por serie (series exógenas)

Para cada serie exógena `x(t)` (cada key de `featureKeys`) y cada paso temporal `t`, calculamos:

1. **Valor contemporáneo**
   - `x(t)` (el valor en el índice temporal `t`).

2. **Características de rezago (historial)**
   - Hasta `MAX_LAG = 3`:
     - `x(t - 1)`
     - `x(t - 2)`
     - `x(t - 3)`
   - Esto permite al modelo aprender la dinámica temporal de corto plazo de cada serie.

3. **Primera diferencia**
   - `x(t) - x(t - 1)`
   - Captura cambios locales (tendencia / pendiente) en lugar de solo el nivel absoluto.

4. **Media móvil (promedio local)**
   - Ventana móvil de `ROLLING_WINDOW = 7` pasos temporales:
     - `mean(x[t - 6 ... t])` (truncada cerca del comienzo de la serie)
   - Representa la tendencia local / nivel base y suaviza el ruido de corto plazo.

> Si la serie es más corta que la ventana, el código reduce automáticamente la ventana para usar todos los puntos pasados disponibles hasta `t`.

### Historial de la serie objetivo

Para la propia **serie objetivo** `y(t)`, **no** incluimos el valor actual `y(t)` como característica (porque es la etiqueta de ese paso), pero sí incluimos su historial:

1. **Rezagos del objetivo**
   - `y(t - 1)`
   - `y(t - 2)`
   - `y(t - 3)`

2. **Diferencia del objetivo**
   - `y(t) - y(t - 1)`

3. **Media móvil del objetivo**
   - La misma ventana móvil indicada arriba:
     - `mean(y[t - 6 ... t])`

Esto permite al modelo aprender patrones como «el siguiente valor depende de los últimos valores y de su tendencia local», algo habitual en el pronóstico de series temporales.

### Interacciones entre series

Para capturar **relaciones entre distintas series**, construimos características de interacción para cada **par de series numéricas** (incluido el objetivo):

- Sean `v_i(t)` y `v_j(t)` los valores contemporáneos de dos series en el tiempo `t`.
- Para cada par ordenado `(i, j)` con `i < j`, calculamos:

1. **Diferencia**
   - `v_i(t) - v_j(t)`
   - Codifica diferencias relativas de nivel entre series.

2. **Razón**
   - `v_i(t) / v_j(t)`
   - Para evitar una división por cero, el denominador incluye un pequeño epsilon si es necesario:
     - `denom = |v_j| < 1e-9 ? sign(v_j) * 1e-9 : v_j`
   - Codifica la escala relativa y la proporcionalidad.

3. **Producto**
   - `v_i(t) * v_j(t)`
   - Permite al modelo expresar «efectos de interacción» en los que importa que ambas series sean grandes o pequeñas.

Estas características entre series exponen explícitamente la **estructura multiserie** al booster en lugar de depender solo de los valores individuales de cada serie.

### Índice temporal y características de Fourier

También codificamos el propio tiempo como características numéricas:

1. **Índice temporal**
   - Índice entero `t = 0, 1, 2, ...` (índice de fila).
   - Proporciona al booster una forma sencilla de modelar tendencias globales.

2. **Características de Fourier** (patrones cíclicos)
   - Dos periodos fijos (en unidades de «número de filas»):
     - Periodo 24 (por ejemplo, 24 horas en datos horarios)
     - Periodo 168 (por ejemplo, 7 días × 24 horas)
   - Para cada periodo `P` calculamos:
     - `sin(2πt / P)`
     - `cos(2πt / P)`
   - Es una forma estándar de incorporar estacionalidad/ciclos en un formato que los modelos de árboles todavía pueden aprovechar.

El vector final de características para cada paso temporal `t` es:

```text
[ exogenous features (current, lags, diff, rolling mean for each series),
  target-series history (lags, diff, rolling mean),
  cross-series interactions (spread, ratio, product),
  time index, sin/cos(2πt/24), sin/cos(2πt/168) ]
```

### Vector de características del paso futuro (lastFeatureRow)
La misma lógica de construcción de características se utiliza para producir un vector de características para t + 1 (predicción a un paso):
- Conceptualmente, tratamos el siguiente índice temporal como t_next = n, donde n es el número de filas observadas.
- Para los valores «actuales» de cada serie en t_next, reutilizamos el último valor observado (index n - 1).
- Los rezagos y las medias móviles se calculan usando los últimos MAX_LAG / ROLLING_WINDOW pasos de los datos observados.
- Las codificaciones temporales utilizan t_next como índice temporal.
- Esto produce un único vector de características lastFeatureRow que representa el siguiente paso temporal basándose en todo el historial hasta la última observación.

Por tanto, la función buildFeatures devuelve:
```text
{
  X: number[][];        // feature matrix for all observed steps
  y: number[];          // target series values for those steps
  lastFeatureRow: number[]; // feature vector representing t + 1
}
```

---


## 🚀 Primeros pasos

### 1. Requisitos previos
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Compilar e iniciar todos los servicios:

```bash

# Build the image
docker compose build

# Run the container
docker compose up

```

### 3. Pruebas:
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## Benchmark de AirPassengers

Consulta [`BENCHMARKS.md`](./BENCHMARKS.md) para ver el protocolo justo de 16 pasos y las reglas de comparación con artículos.

El repositorio incluye un conjunto de datos AirPassengers y un comando de benchmark para comprobar el comportamiento de los modelos frente a un conjunto de datos clásico de series temporales mensuales.

Ejecuta el benchmark con Docker Compose:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark
```

Salida JSON:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --json
```

Línea base seasonal naive:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --algorithm seasonal-naive --json
```


### Benchmark holdout de 16 pasos

Los siguientes resultados utilizan el mismo protocolo de evaluación con origen fijo para todos los modelos comparables:

- entrenamiento: primeras 128 observaciones de AirPassengers
- holdout: siguientes 16 observaciones
- ningún valor objetivo del holdout se realimenta durante el pronóstico
- métricas puntuales comunes: MAE, RMSE, MAPE, sMAPE y MASE

Reproduce el benchmark con:

```bash
docker compose -f docker-compose.test.yml run --rm \
  air_passengers_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-air-passengers-fair.mjs --markdown
  '
```

Resultados medidos:

| Modelo | Entrenamiento | Horizonte | MAE | RMSE | MAPE | sMAPE | MASE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| seasonal-naive | 128 | 16 | 64.2500 | 68.0808 | 14.1651% | 15.4031% | 2.1748 |
| xgboost | 128 | 16 | 24.5775 | 29.5014 | 5.5687% | 5.3717% | 0.8319 |
| Chronos-2-small INT8 ONNX | 128 | 16 | **14.7839** | **17.3376** | **3.2438%** | **3.2636%** | **0.5004** |
| VARMA experimental | 128 | 16 | N/A | N/A | N/A | N/A | N/A |

En este holdout de AirPassengers de 16 pasos, Chronos-2-small INT8 ONNX produjo el menor error en todas las métricas puntuales informadas. Esta es una comparación a nivel de aplicación, no una reproducción directa de las puntuaciones agregadas del artículo de Chronos-2.

VARMA aparece como N/A porque AirPassengers es univariante, mientras que la implementación experimental de VARMA de este repositorio requiere al menos dos series numéricas. Consulta [`BENCHMARKS.md`](./BENCHMARKS.md) para ver el protocolo multivariante y de comparación con artículos.


### Benchmark xgboost de AirPassengers (120/24)

#### csv: data/air_passengers.csv
|  | Este trabajo | seasonal-naive | 
| -------- | -------- | -------- |
| train_size | 120 | 120 | 
| test_size | 24 | 24 | 
| MAE | 43.6495 | 47.5833 | 
| RMSE | 50.8508 | 49.9867 | 
| MAPE | 9.5665% | 10.5227% | 
| sMAPE | 9.5943% | 11.1666% | 

---

# Licencia
- Apache License 2.0
