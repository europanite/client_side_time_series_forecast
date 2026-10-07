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

> **Note de traduction :** Ce README est une traduction de la version anglaise. En cas de divergence, le fichier `README.md` en anglais fait foi.

!["web_ui"](./assets/images/web_ui.png)

[PlayGround](https://europanite.github.io/client_side_time_series_forecast/)

Un playground de prévision de séries temporelles côté client, basé sur le navigateur, propulsé par XGBoost, un modèle expérimental de type VARMA et Chronos-2.

L'application charge un fichier CSV ou XLSX, détecte les colonnes de date/heure et les colonnes numériques, vous permet de choisir un modèle de prévision et visualise à la fois les valeurs observées et une prévision à 16 pas. Vos données restent dans votre navigateur.

---

## Vue d'ensemble

Il s'agit d'un outil de prévision de séries temporelles multivariées qui s'exécute entièrement dans votre navigateur web.
Aucune installation, inscription ni paiement n'est nécessaire. 
Il suffit d'y accéder avec votre navigateur pour commencer.
Il aide les petites entreprises à prévoir les commandes du lendemain.

- Charger des jeux de données de séries temporelles CSV/XLSX dans le navigateur
- Sélectionner n'importe quelle colonne numérique comme cible de prévision
- Choisir entre XGBoost, un modèle expérimental de type VARMA et Chronos-2 préentraîné
- Entraîner localement dans le navigateur le modèle sélectionné
- Prévoir les 16 prochains points et les ajouter au graphique

Tout se passe **dans votre navigateur**. Il n'y a aucune API backend et aucune donnée ne quitte votre machine.

---

## Démo

1. Ouvrez la démo GitHub Pages :  
   https://europanite.github.io/client_side_time_series_forecast/
2. Téléversez un fichier d'exemple tel que [`data/sample_data.csv`](./data/datsample_dataa.csv) ou [`data/sample_data.xlsx`](./data/sample_data.xlsx).
3. L'application va :
   - Détecter une **colonne de type date/heure**
   - Lister les colonnes numériques disponibles
4. Choisissez une colonne numérique comme **cible**.
5. Choisissez un **modèle de prévision**. `XGBoost` est le modèle par défaut, `VARMA experimental` est une baseline multivariée légère et `Chronos-2 pretrained` est un modèle fondation zero-shot.
6. Pour XGBoost ou VARMA, cliquez d'abord sur **Train**. Chronos-2 est déjà préentraîné et ne nécessite aucun entraînement local. Cliquez ensuite sur **Forecast +16** pour prédire les 16 prochains points.
7. Examinez le graphique pour comparer la série observée et la courbe de prévision.

---

## Structure des données

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### Prérequis :

##### Une colonne de type date/heure
L'en-tête de colonne contient "date" ou "time" (sans distinction de casse).
Elle est utilisée comme axe temporel mais n'est pas convertie directement en caractéristiques numériques.

##### Une ou plusieurs colonnes numériques
Ces colonnes sont utilisées comme cible et/ou comme caractéristiques exogènes.
L'application prend en charge deux modes de prévision :

- **XGBoost** : vous choisissez une colonne numérique comme cible, et les autres colonnes numériques servent de signaux supplémentaires.
- **VARMA experimental** : toutes les colonnes numériques sont modélisées ensemble, et la colonne cible sélectionnée est affichée comme sortie de prévision.

---

## Approche de prévision

Le projet propose trois algorithmes de prévision avec des hypothèses volontairement différentes :

| Modèle | Style d'apprentissage | Utilise plusieurs séries d'entrée ? | Entraînement local ? | Style de prévision |
| --- | --- | --- | --- | --- |
| XGBoost | Régression par arbres de décision gradient-boosted sur des caractéristiques de séries temporelles construites | Oui | Oui | Prévision récursive à un pas |
| VARMA experimental | Autorégression linéaire multi-sortie avec régularisation ridge, correction des résidus et stabilisation saisonnière | Oui, conjointement | Oui | Prévision récursive multi-sortie |
| Chronos-2-small INT8 ONNX | Modèle fondation de séries temporelles préentraîné et basé sur des patches | Cible sélectionnée uniquement dans l'UI actuelle | Non | Prévision probabiliste directe multi-pas |

Ces modèles ne doivent pas être interprétés comme trois implémentations du même algorithme. XGBoost transforme la série temporelle en problème d'apprentissage supervisé tabulaire, VARMA modélise conjointement les vecteurs retardés de plusieurs séries, et Chronos-2 utilise un modèle neuronal de prévision préentraîné sans ajuster de nouveaux paramètres sur le jeu de données téléversé.

### Sélection du modèle

#### XGBoost

`XGBoost` est le modèle entraîné localement par défaut. XGBoost est un algorithme d'arbres de décision gradient-boosted : de nombreux arbres de décision sont ajoutés séquentiellement, chaque nouvel arbre réduisant les erreurs laissées par l'ensemble précédent. Les séries temporelles ne sont pas transmises directement à XGBoost. Ce projet convertit d'abord chaque pas de temps en vecteur de caractéristiques, puis entraîne XGBoost comme modèle de régression.

L'implémentation dans le navigateur utilise :

- les retards de la cible et des variables exogènes jusqu'à `MAX_LAG = 3`
- les premières différences
- une moyenne mobile avec `ROLLING_WINDOW = 7`
- des interactions de différence, de ratio et de produit entre séries numériques
- un indice temporel
- des caractéristiques de Fourier de périodes 24 et 168
- `gbtree` avec profondeur 4, taux d'apprentissage 0.1, subsample 0.8 et 200 itérations de boosting

Pour une prévision à 16 pas, le modèle prédit un pas à la fois. Chaque prédiction est ajoutée à l'historique de travail et devient donc disponible pour le pas suivant. La prédiction brute de XGBoost est également combinée à une estimation de prolongement saisonnier. Le contexte numérique hors cible est avancé au lieu d'être maintenu constant.

**Points forts**

- capture les relations non linéaires et les interactions entre séries
- fonctionne naturellement avec les caractéristiques multivariées construites manuellement dans le projet
- s'entraîne localement et relativement rapidement dans le navigateur
- ne nécessite pas le téléchargement d'un grand modèle préentraîné

**Limites**

- la qualité de la prévision dépend de l'ingénierie des caractéristiques choisie
- la prévision récursive peut accumuler des erreurs dans les pas ultérieurs
- les périodes de Fourier fixes et le prolongement saisonnier sont des hypothèses au niveau de l'application, et non une structure calendaire apprise automatiquement

Utilisez XGBoost lorsque vous souhaitez un modèle non linéaire léger, entraîné localement, capable d'exploiter les relations entre plusieurs colonnes numériques.

#### VARMA experimental

`VARMA experimental` est une baseline multivariée légère et native du navigateur. Malgré son nom, cette implémentation **n'est pas un estimateur VARMA statistique complet par maximum de vraisemblance**. Elle est plus proche d'un modèle de type VAR régularisé avec une petite correction des résidus et une stabilisation saisonnière explicite.

L'implémentation :

1. sélectionne jusqu'à 8 séries numériques et les standardise ;
2. concatène les 7 vecteurs multivariés précédents en un vecteur de caractéristiques retardées ;
3. ajuste simultanément toutes les séries de sortie avec une régression ridge multi-sortie
   (`ridge = 1e-2`) ;
4. estime une petite correction à partir des résidus récents (`maLag = 1`) ;
5. pendant la prévision, combine la sortie autorégressive avec le vecteur du retard saisonnier
   (`seasonalLag = 7`, `seasonalBlend = 0.55`) ;
6. réinjecte récursivement le vecteur prédit dans le pas de prévision suivant.

Comme le vecteur numérique complet est prédit à chaque pas, VARMA fait avancer toutes les séries modélisées ensemble plutôt que de prévoir uniquement la cible sélectionnée.

**Points forts**

- simple et peu coûteux en calcul
- modélise conjointement plusieurs séries numériques
- fournit une baseline linéaire/de style classique utile face à XGBoost et Chronos-2
- s'exécute entièrement en TypeScript sans téléchargement séparé de modèle

**Limites**

- nécessite au moins deux séries numériques et plus de 7 lignes exploitables
- suppose principalement des relations de retard linéaires
- la correction des résidus et le mélange saisonnier sont des stabilisateurs pragmatiques, pas une procédure complète d'estimation de moyenne mobile
- ne doit pas être présenté comme une implémentation de référence de VARMA statistique

Utilisez `VARMA experimental` principalement comme baseline multivariée transparente lorsque plusieurs séries évoluent ensemble.

#### Chronos-2 pretrained

`Chronos-2 pretrained` est fondamentalement différent des deux modèles ajustés localement ci-dessus. Chronos-2 est un modèle fondation de séries temporelles préentraîné et basé sur des patches qui produit directement des **prévisions par quantiles** multi-pas. Ce dépôt exécute `Chronos-2-small INT8` comme modèle ONNX avec ONNX Runtime Web, de sorte que l'inférence est effectuée localement après le téléchargement du modèle.

L'intégration actuelle dans le navigateur :

- **ne s'entraîne pas** sur le jeu de données téléversé ;
- utilise uniquement la série cible sélectionnée comme contexte Chronos ;
- nécessite au moins 16 observations numériques de la cible ;
- conserve au maximum 5,760 observations de contexte ;
- regroupe l'entrée en patches de 16 points et complète à gauche avec `NaN` le premier patch incomplet ;
- exécute la sortie interne de 672 pas du graphe ONNX
  (`42 × 16`) et expose les 16 premiers pas dans l'UI ;
- lit la sortie de quantiles du modèle et affiche la prévision médiane (`p50`) avec les bornes d'incertitude `p10` et `p90`.

Chronos-2 lui-même prend en charge des prévisions multivariées plus riches et informées par des covariables, mais **l'UI actuelle n'utilise pas encore ces capacités**. L'implémentation actuelle de Chronos doit donc être comprise comme un prédicteur univarié préentraîné de la cible au sein d'une application par ailleurs multivariée.

**Points forts**

- prévision zero-shot : aucun ajustement de modèle spécifique à chaque jeu de données n'est nécessaire
- prédit directement l'ensemble de l'horizon de prévision au lieu d'ajuster récursivement des modèles à un pas
- fournit des informations probabilistes via les quantiles de prévision
- peut transférer à une nouvelle série des motifs appris lors d'un préentraînement à grande échelle

**Limites**

- le modèle doit être téléchargé avant la première utilisation
- le navigateur utilise un export INT8 ONNX, les résultats peuvent donc ne pas correspondre exactement à un checkpoint officiel en précision complète
- l'UI actuelle ignore les colonnes numériques supplémentaires lors de l'appel à Chronos-2
- la mémoire du navigateur et l'exécution WASM imposent des limites pratiques à la taille du modèle et à la longueur du contexte

Dans le benchmark holdout AirPassengers 128/16 actuel du dépôt, `Chronos-2-small INT8 ONNX` a obtenu les plus faibles MAE, RMSE, MAPE, sMAPE et MASE parmi les modèles comparables. Consultez la section benchmark ci-dessous pour les valeurs mesurées et le protocole d'évaluation.

### Prévision à 16 pas

L'horizon par défaut au niveau de l'application est de 16, car le modèle ONNX Chronos-2 intégré utilise des patches de 16 points, et les API de XGBoost et VARMA sont alignées sur le même horizon à des fins de comparaison.

Les algorithmes atteignent ces 16 points de différentes manières :

- **XGBoost** prédit récursivement. Chaque valeur cible prédite devient une partie de l'historique pour le pas suivant, tandis que le contexte hors cible avance également.
- **VARMA experimental** prédit récursivement un vecteur multivarié complet et réinjecte ce vecteur prédit dans le pas suivant.
- **Chronos-2** effectue une inférence probabiliste directe multi-pas et renvoie les 16 premières positions futures de la sortie du modèle préentraîné.

Cette différence est importante lors de la comparaison des modèles : XGBoost et VARMA peuvent accumuler une erreur de prévision récursive, tandis que Chronos-2 génère directement la séquence future demandée.

---

## Ingénierie des caractéristiques (XGBoost)

Les caractéristiques construites manuellement dans cette section s'appliquent au pipeline XGBoost. VARMA utilise directement des vecteurs de retard normalisés, tandis que Chronos-2 fonctionne sur la séquence cible sélectionnée sans ces caractéristiques.

Le pipeline XGBoost traite l'entrée comme une petite série temporelle multivariée :

- Une colonne *de type date/heure* (l'en-tête contient `date` ou `time`, quelle que soit la casse).
- Plusieurs colonnes numériques (par exemple `item_a`, `item_b`, `item_c`, ...).
- L'une des colonnes numériques est choisie comme **cible** à prévoir.

En interne, le constructeur de caractéristiques crée un **vecteur de caractéristiques riche** pour chaque pas de temps `t` et un **vecteur de caractéristiques futur** pour `t + 1`. Toutes les caractéristiques sont calculées **entièrement côté client**, en JavaScript/TypeScript.

### Séries utilisées pour les caractéristiques

- `datetimeKey`  
  - Détectée automatiquement à partir de l'en-tête contenant `"date"` ou `"time"`.
  - Utilisée uniquement pour localiser l'axe temporel ; elle n'est pas utilisée directement comme caractéristique numérique.
- `targetKey`  
  - Colonne numérique que l'utilisateur choisit de prévoir.
- `featureKeys`  
  - Toutes les autres colonnes numériques (non datetime, non cible).
  - Traitées comme des **séries exogènes**.

En interne, nous conservons un `seriesMap: Record<string, number[]>` avec un tableau numérique par série.

### Caractéristiques par série (séries exogènes)

Pour chaque série exogène `x(t)` (chaque key de `featureKeys`) et chaque pas de temps `t`, nous calculons :

1. **Valeur contemporaine**
   - `x(t)` (la valeur à l'indice temporel `t`).

2. **Caractéristiques de retard (historique)**
   - Jusqu'à `MAX_LAG = 3` :
     - `x(t - 1)`
     - `x(t - 2)`
     - `x(t - 3)`
   - Cela permet au modèle d'apprendre la dynamique temporelle à court terme de chaque série.

3. **Première différence**
   - `x(t) - x(t - 1)`
   - Capture les changements locaux (tendance / pente) plutôt que le seul niveau absolu.

4. **Moyenne mobile (moyenne locale)**
   - Fenêtre mobile de `ROLLING_WINDOW = 7` pas de temps :
     - `mean(x[t - 6 ... t])` (tronquée près du début de la série)
   - Représente la tendance locale / le niveau de base et lisse le bruit à court terme.

> Si la série est plus courte que la fenêtre, le code réduit automatiquement la fenêtre afin d'utiliser tous les points passés disponibles jusqu'à `t`.

### Historique de la série cible

Pour la **série cible** `y(t)` elle-même, nous **n'incluons pas** la valeur actuelle `y(t)` comme caractéristique (car il s'agit du label de ce pas), mais nous incluons son historique :

1. **Retards de la cible**
   - `y(t - 1)`
   - `y(t - 2)`
   - `y(t - 3)`

2. **Différence de la cible**
   - `y(t) - y(t - 1)`

3. **Moyenne mobile de la cible**
   - Même fenêtre mobile que ci-dessus :
     - `mean(y[t - 6 ... t])`

Cela permet au modèle d'apprendre des motifs tels que « la valeur suivante dépend des dernières valeurs et de leur tendance locale », ce qui est typique des prévisions de séries temporelles.

### Interactions entre séries

Pour capturer les **relations entre différentes séries**, nous construisons des caractéristiques d'interaction pour chaque **paire de séries numériques** (cible incluse) :

- Soient `v_i(t)` et `v_j(t)` les valeurs contemporaines de deux séries au temps `t`.
- Pour chaque paire ordonnée `(i, j)` avec `i < j`, nous calculons :

1. **Écart**
   - `v_i(t) - v_j(t)`
   - Encode les différences relatives de niveau entre les séries.

2. **Ratio**
   - `v_i(t) / v_j(t)`
   - Pour éviter une division par zéro, le dénominateur inclut un petit epsilon si nécessaire :
     - `denom = |v_j| < 1e-9 ? sign(v_j) * 1e-9 : v_j`
   - Encode l'échelle relative et la proportionnalité.

3. **Produit**
   - `v_i(t) * v_j(t)`
   - Permet au modèle d'exprimer des « effets d'interaction » où le fait que les deux séries soient élevées ou faibles est important.

Ces caractéristiques inter-séries exposent explicitement la **structure multiserie** au booster au lieu de reposer uniquement sur les valeurs individuelles de chaque série.

### Indice temporel et caractéristiques de Fourier

Nous encodons également le temps lui-même sous forme de caractéristiques numériques :

1. **Indice temporel**
   - Indice entier `t = 0, 1, 2, ...` (indice de ligne).
   - Donne au booster un moyen simple de modéliser les tendances globales.

2. **Caractéristiques de Fourier** (motifs cycliques)
   - Deux périodes fixes (en unités de « nombre de lignes ») :
     - Période 24 (par exemple 24 heures pour des données horaires)
     - Période 168 (par exemple 7 jours × 24 heures)
   - Pour chaque période `P`, nous calculons :
     - `sin(2πt / P)`
     - `cos(2πt / P)`
   - Il s'agit d'une méthode standard pour intégrer saisonnalité/cycles sous une forme que les modèles d'arbres peuvent encore exploiter.

Le vecteur de caractéristiques final pour chaque pas de temps `t` est :

```text
[ exogenous features (current, lags, diff, rolling mean for each series),
  target-series history (lags, diff, rolling mean),
  cross-series interactions (spread, ratio, product),
  time index, sin/cos(2πt/24), sin/cos(2πt/168) ]
```

### Vecteur de caractéristiques du pas futur (lastFeatureRow)
La même logique de construction des caractéristiques est utilisée pour produire un vecteur de caractéristiques pour t + 1 (prédiction à un pas) :
- Conceptuellement, nous considérons le prochain indice temporel comme t_next = n, où n est le nombre de lignes observées.
- Pour les valeurs « actuelles » de chaque série à t_next, nous réutilisons la dernière valeur observée (index n - 1).
- Les retards et les moyennes mobiles sont calculés à partir des derniers pas MAX_LAG / ROLLING_WINDOW des données observées.
- Les encodages temporels utilisent t_next comme indice temporel.
- Cela produit un unique vecteur de caractéristiques lastFeatureRow qui représente le pas de temps suivant à partir de tout l'historique jusqu'à la dernière observation.

La fonction buildFeatures renvoie donc :
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

### 3. Test :
```bash
docker compose \
-f docker-compose.test.yml up \
--build --exit-code-from \
frontend_test
```

---

## Benchmark AirPassengers

Consultez [`BENCHMARKS.md`](./BENCHMARKS.md) pour le protocole équitable à 16 pas et les règles de comparaison avec les articles.

Le dépôt inclut un jeu de données AirPassengers et une commande de benchmark permettant de vérifier le comportement des modèles sur un jeu de données classique de séries temporelles mensuelles.

Exécutez le benchmark avec Docker Compose :

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark
```

Sortie JSON :

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --json
```

Baseline seasonal naive :

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --algorithm seasonal-naive --json
```


### Benchmark holdout à 16 pas

Les résultats suivants utilisent le même protocole d'évaluation à origine fixe pour chaque modèle comparable :

- entraînement : 128 premières observations AirPassengers
- holdout : 16 observations suivantes
- aucune valeur cible du holdout n'est réinjectée pendant la prévision
- métriques ponctuelles communes : MAE, RMSE, MAPE, sMAPE et MASE

Reproduisez le benchmark avec :

```bash
docker compose -f docker-compose.test.yml run --rm \
  air_passengers_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-air-passengers-fair.mjs --markdown
  '
```

Résultats mesurés :

| Modèle | Entraînement | Horizon | MAE | RMSE | MAPE | sMAPE | MASE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| seasonal-naive | 128 | 16 | 64.2500 | 68.0808 | 14.1651% | 15.4031% | 2.1748 |
| xgboost | 128 | 16 | 24.5775 | 29.5014 | 5.5687% | 5.3717% | 0.8319 |
| Chronos-2-small INT8 ONNX | 128 | 16 | **14.7839** | **17.3376** | **3.2438%** | **3.2636%** | **0.5004** |
| VARMA experimental | 128 | 16 | N/A | N/A | N/A | N/A | N/A |

Sur ce holdout AirPassengers à 16 pas, Chronos-2-small INT8 ONNX a produit l'erreur la plus faible pour chaque métrique ponctuelle rapportée. Il s'agit d'une comparaison au niveau de l'application, et non d'une reproduction directe des scores agrégés de l'article Chronos-2.

VARMA est indiqué N/A parce que AirPassengers est univarié, tandis que l'implémentation expérimentale de VARMA de ce dépôt nécessite au moins deux séries numériques. Consultez [`BENCHMARKS.md`](./BENCHMARKS.md) pour le protocole multivarié et de comparaison avec les articles.


### Benchmark xgboost AirPassengers (120/24)

#### csv: data/air_passengers.csv
|  | Ce travail | seasonal-naive | 
| -------- | -------- | -------- |
| train_size | 120 | 120 | 
| test_size | 24 | 24 | 
| MAE | 43.6495 | 47.5833 | 
| RMSE | 50.8508 | 49.9867 | 
| MAPE | 9.5665% | 10.5227% | 
| sMAPE | 9.5943% | 11.1666% | 

---

# Licence
- Apache License 2.0
