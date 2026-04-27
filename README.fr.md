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

Un bac à sable de prévision de séries temporelles multivariées, côté client et basé sur le navigateur, propulsé par XGBoost et une base expérimentale de style VARMA.

L'application charge un fichier CSV ou XLSX, détecte les colonnes de date/heure et les colonnes numériques, vous permet de choisir un modèle de prévision, puis visualise les valeurs observées ainsi qu'une prévision à 10 pas. Vos données restent dans votre navigateur.

---

## Vue d’ensemble

Il s'agit d'un outil de prévision de séries temporelles multivariées qui s'exécute entièrement dans votre navigateur Web.
Aucune installation, inscription ou paiement n'est nécessaire.
Ouvrez simplement l'application dans votre navigateur pour commencer.
Elle aide les petites entreprises à prévoir les commandes du lendemain.

- Charger des jeux de données de séries temporelles CSV/XLSX dans le navigateur
- Sélectionner n'importe quelle colonne numérique comme cible de prévision
- Choisir entre le modèle XGBoost par défaut et une base expérimentale de style VARMA
- Entraîner localement le modèle sélectionné dans le navigateur
- Prévoir les 10 prochains points et les ajouter au graphique

Tout se passe **dans votre navigateur**. Il n'y a pas d'API backend et aucune donnée ne quitte votre machine.

---

## Démo

1. Ouvrez la démo GitHub Pages :  
   https://europanite.github.io/client_side_time_series_forecast/
2. Téléversez un fichier d'exemple comme [`data/sample_data.csv`](./data/datsample_dataa.csv) ou [`data/sample_data.xlsx`](./data/sample_data.xlsx).
3. L'application va :
   - Détecter une **colonne de type date/heure**
   - Lister les colonnes numériques disponibles
4. Choisissez une colonne numérique comme **target**.
5. Choisissez un **forecast model**. `XGBoost` est le choix par défaut. `VARMA experimental` est une base multivariée légère pour comparaison.
6. Cliquez sur **Train** pour construire le modèle sélectionné, puis sur **Forecast +10** pour prédire les 10 prochains points.
7. Inspectez le graphique pour comparer la série observée et la ligne de prévision.

---

## Structure des données

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### Exigences :

##### Una columna similar a fecha/hora
L’en-tête de colonne contient "date" ou "time" sans tenir compte de la casse. Il sert d’axe temporel, mais n’est pas converti directement en caractéristiques numériques.

##### Una o más columnas numéricas
Ces colonnes sont utilisées comme cible et/ou comme caractéristiques exogènes. L’application prend en charge deux modes de prévision :

- **XGBoost** : vous choisissez une colonne numérique comme cible, et les autres colonnes numériques sont utilisées comme signaux supplémentaires.
- **VARMA experimental** : toutes les colonnes numériques sont modélisées ensemble, et la colonne cible sélectionnée est affichée comme sortie de prévision.

---

## Approche de prévision

Le projet fournit deux approches de prévision côté navigateur : le modèle XGBoost par défaut et une base expérimentale de style VARMA.

Pour chaque ligne, l’application construit un vecteur de caractéristiques à partir de :

- valeurs de retard récentes
- différences locales
- moyennes mobiles
- interactions entre séries
- indice temporel
- caractéristiques cycliques de type Fourier

La colonne cible sélectionnée est utilisée comme étiquette de prédiction. Le modèle apprend comment la valeur suivante dépend du comportement récent de la cible et des autres séries numériques.

### Sélection du modèle

#### XGBoost

`XGBoost` est le modèle par défaut. C’est un modèle de régression basé sur des caractéristiques qui utilise des valeurs de retard, des statistiques mobiles, des interactions entre séries et des caractéristiques temporelles. Utilisez-le lorsque vous voulez la prévision généraliste la plus robuste pour des données tabulaires multivariées de séries temporelles.

#### VARMA experimental

`VARMA experimental` est une base multivariée légère de style VARMA implémentée en TypeScript. Elle prévoit les séries numériques ensemble et affiche la série cible sélectionnée.

Cette implémentation est volontairement expérimentale. Ce n’est pas une implémentation VARMA complète par maximum de vraisemblance. Elle se comporte actuellement comme un modèle autorégressif de style VAR avec stabilisation résiduelle et saisonnière ; elle doit donc servir de base de comparaison plutôt que de remplacement à XGBoost.

Utilisez `VARMA experimental` pour comparer XGBoost à un modèle classique multivarié de séries temporelles, surtout lorsque plusieurs séries numériques évoluent ensemble.

### Prévision en 10 étapes

L’interface prévoit 10 points futurs. Chaque pas futur est ajouté à l’historique de travail afin que les pas suivants puissent utiliser les valeurs prédites précédemment.

Pour les données multisé­ries, l’application avance aussi le contexte numérique afin que la prévision ne garde pas simplement chaque colonne non cible figée à sa dernière valeur observée. En mode XGBoost, la cible sélectionnée est prévue directement tandis que le contexte non cible est étendu. En mode VARMA experimental, toutes les séries numériques avancent ensemble et la série cible sélectionnée apparaît dans le graphique et le texte de prévision.

---

## Ingénierie des caractéristiques

Ce projet traite l’entrée comme une petite série temporelle multivariée :

- Une colonne *datetime-like* (l’en-tête contient `date` ou `time`, quelle que soit la casse).
- Plusieurs colonnes numériques (par exemple `item_a`, `item_b`, `item_c`, ...).
- Une des colonnes numériques est choisie comme **target** à prévoir.

En interne, le constructeur de caractéristiques crée un **rich feature vector** pour chaque pas temporel `t` et un **future feature vector** pour `t + 1`. Toutes les caractéristiques sont calculées **entièrement côté client**, en JavaScript/TypeScript.

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

Pour chaque série exogène `x(t)` (chaque clé dans `featureKeys`) et chaque pas temporel `t`, nous calculons :

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

Pour la **target series** `y(t)`, nous n’incluons pas la valeur courante `y(t)` comme caractéristique, car elle est l’étiquette de ce pas, mais nous incluons son historique :

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

Pour capturer les **relations entre différentes séries**, nous créons des caractéristiques d’interaction pour chaque **paire de séries numériques** (y compris la cible) :

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

Nous encodons également le temps lui-même comme caractéristiques numériques :

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
La même logique de construction de caractéristiques est utilisée pour produire un vecteur pour t + 1 (prédiction à un pas) :
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


## 🚀 Bien démarrer

### 1. Prérequis
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Construire et démarrer tous les services :

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

Le dépôt inclut un jeu de données AirPassengers et une commande de benchmark pour vérifier le comportement du modèle face à un jeu de données mensuel classique de séries temporelles.

Exécutez le benchmark avec Docker Compose:

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
