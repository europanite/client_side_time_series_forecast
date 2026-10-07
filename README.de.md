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

> **Hinweis zur Übersetzung:** Diese README ist eine Übersetzung der englischen Version. Bei Abweichungen gilt die englische `README.md` als maßgebliche Quelle.

!["web_ui"](./assets/images/web_ui.png)

[PlayGround](https://europanite.github.io/client_side_time_series_forecast/)

Ein clientseitiges, browserbasiertes Playground für Zeitreihenprognosen, angetrieben von XGBoost, einem experimentellen VARMA-ähnlichen Modell und Chronos-2.

Die App lädt eine CSV- oder XLSX-Datei, erkennt Datums-/Zeitspalten und numerische Spalten, lässt dich ein Prognosemodell auswählen und visualisiert sowohl beobachtete Werte als auch eine 16-Schritt-Prognose. Deine Daten bleiben im Browser.

---

## Überblick

Dies ist ein multivariates Werkzeug zur Zeitreihenprognose, das vollständig in deinem Webbrowser ausgeführt wird.
Keine Installation, Registrierung oder Zahlung erforderlich. 
Einfach im Browser aufrufen und loslegen.
Es hilft kleinen Unternehmen, die Bestellungen für den nächsten Tag vorherzusagen.

- CSV/XLSX-Zeitreihendatensätze im Browser laden
- Beliebige numerische Spalte als Prognoseziel auswählen
- Zwischen XGBoost, einem experimentellen VARMA-ähnlichen Modell und vortrainiertem Chronos-2 wählen
- Das ausgewählte Modell lokal im Browser trainieren
- Die nächsten 16 Punkte prognostizieren und an das Diagramm anhängen

Alles geschieht **innerhalb deines Browsers**. Es gibt keine Backend-API und keine Daten verlassen deinen Rechner.

---

## Demo

1. Öffne die GitHub-Pages-Demo:  
   https://europanite.github.io/client_side_time_series_forecast/
2. Lade eine Beispieldatei wie [`data/sample_data.csv`](./data/datsample_dataa.csv) oder [`data/sample_data.xlsx`](./data/sample_data.xlsx) hoch.
3. Die App wird:
   - eine **datetime-ähnliche Spalte** erkennen
   - verfügbare numerische Spalten auflisten
4. Wähle eine numerische Spalte als **Ziel** aus.
5. Wähle ein **Prognosemodell**. `XGBoost` ist die Voreinstellung, `VARMA experimental` ist eine leichtgewichtige multivariate Baseline und `Chronos-2 pretrained` ist ein Zero-Shot-Foundation-Model.
6. Für XGBoost oder VARMA zuerst **Train** anklicken. Chronos-2 ist bereits vortrainiert und benötigt kein lokales Training. Anschließend **Forecast +16** anklicken, um die nächsten 16 Punkte vorherzusagen.
7. Prüfe das Diagramm, um die beobachtete Reihe mit der Prognoselinie zu vergleichen.

---

## Datenstruktur

<pre>
datetime,item_a,item_b,item_c,...
2025-01-01 00:00:00+09:00,10,20,31,...
2025-01-02 00:00:00+09:00,12,19,31,...
2025-01-03 00:00:00+09:00,14,18,33,...
 ...
</pre>

### Anforderungen:

##### Eine datetime-ähnliche Spalte
Der Spaltenkopf enthält "date" oder "time" (Groß-/Kleinschreibung wird ignoriert).
Sie wird als Zeitachse verwendet, aber nicht direkt in numerische Merkmale umgewandelt.

##### Eine oder mehrere numerische Spalten
Diese Spalten werden als Ziel und/oder exogene Merkmale verwendet.
Die App unterstützt zwei Prognosemodi:

- **XGBoost**: Du wählst eine numerische Spalte als Ziel aus, und andere numerische Spalten werden als zusätzliche Signale verwendet.
- **VARMA experimental**: Alle numerischen Spalten werden gemeinsam modelliert, und die ausgewählte Zielspalte wird als Prognoseausgabe angezeigt.

---

## Prognoseansatz

Das Projekt stellt drei Prognosealgorithmen mit bewusst unterschiedlichen Annahmen bereit:

| Modell | Lernstil | Verwendet mehrere Eingabereihen? | Lokales Training? | Prognosestil |
| --- | --- | --- | --- | --- |
| XGBoost | Gradient-Boosted-Decision-Tree-Regression über konstruierte Zeitreihenmerkmale | Ja | Ja | Rekursive Ein-Schritt-Prognose |
| VARMA experimental | Lineare Multi-Output-Autoregression mit Ridge-Regularisierung, Residuenkorrektur und saisonaler Stabilisierung | Ja, gemeinsam | Ja | Rekursive Multi-Output-Prognose |
| Chronos-2-small INT8 ONNX | Vortrainiertes, patchbasiertes Foundation-Model für Zeitreihen | In der aktuellen UI nur das ausgewählte Ziel | Nein | Direkte probabilistische Mehrschritt-Prognose |

Diese Modelle sollten nicht als drei Implementierungen desselben Algorithmus verstanden werden. XGBoost wandelt die Zeitreihe in ein überwachtes tabellarisches Lernproblem um, VARMA modelliert verzögerte Vektoren mehrerer Reihen gemeinsam, und Chronos-2 verwendet ein vortrainiertes neuronales Prognosemodell, ohne neue Parameter an den hochgeladenen Datensatz anzupassen.

### Modellauswahl

#### XGBoost

`XGBoost` ist das standardmäßige lokal trainierte Modell. XGBoost ist ein Gradient-Boosted-Decision-Tree-Algorithmus: Viele Entscheidungsbäume werden nacheinander hinzugefügt, wobei jeder neue Baum die Fehler reduziert, die das vorherige Ensemble hinterlassen hat. Zeitreihen werden nicht direkt an XGBoost übergeben. Dieses Projekt wandelt zunächst jeden Zeitschritt in einen Merkmalsvektor um und trainiert XGBoost anschließend als Regressionsmodell.

Die Browserimplementierung verwendet:

- Ziel- und exogene Lags bis `MAX_LAG = 3`
- erste Differenzen
- einen gleitenden Mittelwert mit `ROLLING_WINDOW = 7`
- Differenz-, Verhältnis- und Produktinteraktionen zwischen numerischen Reihen
- einen Zeitindex
- Fourier-Merkmale mit den Perioden 24 und 168
- `gbtree` mit Tiefe 4, Lernrate 0.1, subsample 0.8 und 200 Boosting-Iterationen

Für eine 16-Schritt-Prognose sagt das Modell jeweils einen Schritt voraus. Jede Vorhersage wird dem Arbeitsverlauf hinzugefügt und steht dadurch für den nächsten Schritt zur Verfügung. Die rohe XGBoost-Vorhersage wird außerdem mit einer Schätzung der saisonalen Fortsetzung gemischt. Numerischer Kontext außerhalb des Ziels wird fortgeschrieben, statt konstant gehalten zu werden.

**Stärken**

- erfasst nichtlineare Beziehungen und Interaktionen zwischen Reihen
- arbeitet natürlich mit den handentwickelten multivariaten Merkmalen des Projekts
- trainiert lokal und relativ schnell im Browser
- erfordert keinen Download eines großen vortrainierten Modells

**Einschränkungen**

- die Prognosequalität hängt von der gewählten Merkmalskonstruktion ab
- rekursive Prognosen können in späteren Schritten Fehler akkumulieren
- die festen Fourier-Perioden und die saisonale Fortsetzung sind Annahmen auf Anwendungsebene und keine automatisch gelernte Kalenderstruktur

Verwende XGBoost, wenn du ein leichtgewichtiges, lokal trainiertes nichtlineares Modell möchtest, das Beziehungen zwischen mehreren numerischen Spalten nutzen kann.

#### VARMA experimental

`VARMA experimental` ist eine leichtgewichtige, browsernative multivariate Baseline. Trotz des Namens ist diese Implementierung **kein vollständiger statistischer Maximum-Likelihood-VARMA-Schätzer**. Sie ähnelt eher einem regularisierten VAR-ähnlichen Modell mit einer kleinen Residuenkorrektur und expliziter saisonaler Stabilisierung.

Die Implementierung:

1. wählt bis zu 8 numerische Reihen aus und standardisiert sie;
2. verkettet die vorherigen 7 multivariaten Vektoren zu einem Lag-Merkmalsvektor;
3. passt alle Ausgabereihen gleichzeitig mit Multi-Output-Ridge-Regression an
   (`ridge = 1e-2`);
4. schätzt eine kleine Korrektur aus aktuellen Residuen (`maLag = 1`);
5. mischt während der Prognose die autoregressive Ausgabe mit dem Vektor des saisonalen Lags
   (`seasonalLag = 7`, `seasonalBlend = 0.55`);
6. führt den vorhergesagten Vektor rekursiv dem nächsten Prognoseschritt wieder zu.

Da in jedem Schritt der vollständige numerische Vektor vorhergesagt wird, schreibt VARMA alle modellierten Reihen gemeinsam fort, statt nur das ausgewählte Ziel zu prognostizieren.

**Stärken**

- einfach und rechnerisch günstig
- modelliert mehrere numerische Reihen gemeinsam
- bietet eine nützliche lineare/klassische Baseline gegenüber XGBoost und Chronos-2
- läuft vollständig in TypeScript ohne separaten Modelldownload

**Einschränkungen**

- erfordert mindestens zwei numerische Reihen und mehr als 7 nutzbare Zeilen
- nimmt überwiegend lineare Lag-Beziehungen an
- Residuenkorrektur und saisonales Blending sind pragmatische Stabilisatoren und kein vollständiges Verfahren zur Moving-Average-Schätzung
- sollte nicht als Referenzimplementierung eines statistischen VARMA dargestellt werden

Verwende `VARMA experimental` hauptsächlich als transparente multivariate Baseline, wenn sich mehrere Reihen gemeinsam bewegen.

#### Chronos-2 pretrained

`Chronos-2 pretrained` unterscheidet sich grundlegend von den beiden lokal angepassten Modellen oben. Chronos-2 ist ein vortrainiertes, patchbasiertes Foundation-Model für Zeitreihen, das direkte mehrschrittige **Quantilprognosen** erzeugt. Dieses Repository führt `Chronos-2-small INT8` als ONNX-Modell mit ONNX Runtime Web aus, sodass die Inferenz nach dem Herunterladen des Modells lokal erfolgt.

Die aktuelle Browserintegration:

- trainiert **nicht** auf dem hochgeladenen Datensatz;
- verwendet nur die ausgewählte Zielreihe als Chronos-Kontext;
- benötigt mindestens 16 numerische Zielbeobachtungen;
- behält höchstens 5,760 Kontextbeobachtungen;
- gruppiert die Eingabe in 16-Punkt-Patches und füllt ein unvollständiges erstes Patch links mit `NaN` auf;
- führt die interne 672-Schritt-Ausgabe des ONNX-Graphen aus
  (`42 × 16`) und stellt die ersten 16 Schritte in der UI bereit;
- liest die Quantilausgabe des Modells und zeigt die Medianprognose (`p50`) zusammen mit den Unsicherheitsgrenzen `p10` und `p90` an.

Chronos-2 selbst unterstützt umfangreichere multivariate und kovariateninformierte Prognosen, aber **die aktuelle UI nutzt diese Funktionen noch nicht**. Daher sollte die gegenwärtige Chronos-Implementierung als vortrainierter univariater Ziel-Forecaster innerhalb einer ansonsten multivariaten Anwendung verstanden werden.

**Stärken**

- Zero-Shot-Prognose: keine modellspezifische Anpassung pro Datensatz erforderlich
- sagt den gesamten Prognosehorizont direkt voraus, statt rekursiv Ein-Schritt-Modelle anzupassen
- liefert probabilistische Informationen über Prognosequantile
- kann in groß angelegtem Pretraining gelernte Muster auf eine neue Reihe übertragen

**Einschränkungen**

- das Modell muss vor der ersten Verwendung heruntergeladen werden
- der Browser verwendet einen INT8-ONNX-Export, daher müssen die Ergebnisse nicht exakt mit einem offiziellen Full-Precision-Checkpoint übereinstimmen
- die aktuelle UI ignoriert zusätzliche numerische Spalten beim Aufruf von Chronos-2
- Browserspeicher und WASM-Ausführung setzen praktische Grenzen für Modellgröße und Kontextlänge

Im aktuellen AirPassengers-128/16-Holdout-Benchmark des Repositories erzielte `Chronos-2-small INT8 ONNX` unter den vergleichbaren Modellen die niedrigsten Werte für MAE, RMSE, MAPE, sMAPE und MASE. Die gemessenen Werte und das Evaluationsprotokoll findest du im Benchmark-Abschnitt weiter unten.

### 16-Schritt-Prognose

Der Standardhorizont auf Anwendungsebene beträgt 16, weil das integrierte Chronos-2-ONNX-Modell 16-Punkt-Patches verwendet und die APIs von XGBoost und VARMA zum Vergleich auf denselben Horizont abgestimmt sind.

Die Algorithmen erreichen diese 16 Punkte auf unterschiedliche Weise:

- **XGBoost** prognostiziert rekursiv. Jeder vorhergesagte Zielwert wird Teil des Verlaufs für den nächsten Schritt, während auch der Nicht-Ziel-Kontext fortgeschrieben wird.
- **VARMA experimental** prognostiziert rekursiv einen vollständigen multivariaten Vektor und führt diesen vorhergesagten Vektor dem nächsten Schritt zu.
- **Chronos-2** führt direkte probabilistische Mehrschritt-Inferenz durch und gibt die ersten 16 zukünftigen Positionen aus der Ausgabe des vortrainierten Modells zurück.

Dieser Unterschied ist beim Vergleich der Modelle wichtig: XGBoost und VARMA können rekursive Prognosefehler akkumulieren, während Chronos-2 die angeforderte zukünftige Sequenz direkt erzeugt.

---

## Merkmalskonstruktion (XGBoost)

Die handentwickelten Merkmale in diesem Abschnitt gelten für die XGBoost-Pipeline. VARMA verwendet normalisierte Lag-Vektoren direkt, während Chronos-2 ohne diese Merkmale auf der ausgewählten Zielsequenz arbeitet.

Die XGBoost-Pipeline behandelt die Eingabe als kleine multivariate Zeitreihe:

- Eine *datetime-ähnliche* Spalte (der Header enthält `date` oder `time`, unabhängig von Groß-/Kleinschreibung).
- Mehrere numerische Spalten (z. B. `item_a`, `item_b`, `item_c`, ...).
- Eine der numerischen Spalten wird als zu prognostizierendes **Ziel** ausgewählt.

Intern erstellt der Feature-Builder für jeden Zeitschritt `t` einen **umfangreichen Merkmalsvektor** und für `t + 1` einen **zukünftigen Merkmalsvektor**. Alle Merkmale werden **vollständig auf dem Client** in JavaScript/TypeScript berechnet.

### Für Merkmale verwendete Reihen

- `datetimeKey`  
  - Wird automatisch aus dem Header erkannt, der `"date"` oder `"time"` enthält.
  - Wird nur verwendet, um die Zeitachse zu bestimmen; nicht direkt als numerisches Merkmal.
- `targetKey`  
  - Numerische Spalte, die der Benutzer prognostizieren möchte.
- `featureKeys`  
  - Alle anderen numerischen Spalten (nicht datetime, nicht Ziel).
  - Werden als **exogene Reihen** behandelt.

Intern halten wir eine `seriesMap: Record<string, number[]>` mit einem numerischen Array pro Reihe.

### Merkmale pro Reihe (exogene Reihen)

Für jede exogene Reihe `x(t)` (jeden Key in `featureKeys`) und jeden Zeitschritt `t` berechnen wir:

1. **Zeitgleicher Wert**
   - `x(t)` (der Wert am Zeitindex `t`).

2. **Lag-Merkmale (Historie)**
   - Bis `MAX_LAG = 3`:
     - `x(t - 1)`
     - `x(t - 2)`
     - `x(t - 3)`
   - Dadurch kann das Modell kurzfristige zeitliche Dynamiken pro Reihe lernen.

3. **Erste Differenz**
   - `x(t) - x(t - 1)`
   - Erfasst lokale Veränderungen (Trend / Steigung) statt nur das absolute Niveau.

4. **Gleitender Mittelwert (lokaler Durchschnitt)**
   - Gleitendes Fenster von `ROLLING_WINDOW = 7` Zeitschritten:
     - `mean(x[t - 6 ... t])` (nahe dem Reihenanfang verkürzt)
   - Repräsentiert lokalen Trend / Basisniveau und glättet kurzfristiges Rauschen.

> Wenn die Reihe kürzer als das Fenster ist, verkleinert der Code das Fenster automatisch, sodass alle bis `t` verfügbaren vergangenen Punkte verwendet werden.

### Historie der Zielreihe

Für die **Zielreihe** `y(t)` selbst nehmen wir den aktuellen Wert `y(t)` **nicht** als Merkmal auf (weil er das Label dieses Schritts ist), wohl aber ihre Historie:

1. **Ziel-Lags**
   - `y(t - 1)`
   - `y(t - 2)`
   - `y(t - 3)`

2. **Zieldifferenz**
   - `y(t) - y(t - 1)`

3. **Gleitender Mittelwert des Ziels**
   - Dasselbe gleitende Fenster wie oben:
     - `mean(y[t - 6 ... t])`

So kann das Modell Muster lernen wie „der nächste Wert hängt von den letzten Werten und ihrem lokalen Trend ab“, was für Zeitreihenprognosen typisch ist.

### Interaktionen zwischen Reihen

Um **Beziehungen zwischen verschiedenen Reihen** zu erfassen, erstellen wir Interaktionsmerkmale für jedes **Paar numerischer Reihen** (einschließlich des Ziels):

- Seien `v_i(t)` und `v_j(t)` die zeitgleichen Werte zweier Reihen zum Zeitpunkt `t`.
- Für jedes geordnete Paar `(i, j)` mit `i < j` berechnen wir:

1. **Differenz**
   - `v_i(t) - v_j(t)`
   - Kodiert relative Niveauunterschiede zwischen Reihen.

2. **Verhältnis**
   - `v_i(t) / v_j(t)`
   - Um Division durch null zu vermeiden, enthält der Nenner bei Bedarf ein kleines epsilon:
     - `denom = |v_j| < 1e-9 ? sign(v_j) * 1e-9 : v_j`
   - Kodiert relative Skalierung und Proportionalität.

3. **Produkt**
   - `v_i(t) * v_j(t)`
   - Ermöglicht dem Modell, „Interaktionseffekte“ auszudrücken, bei denen es darauf ankommt, dass beide Reihen groß oder klein sind.

Diese Merkmale zwischen Reihen legen dem Booster die **Mehrreihenstruktur** explizit offen, statt sich nur auf einzelne Reihenwerte zu stützen.

### Zeitindex und Fourier-Merkmale

Wir kodieren auch die Zeit selbst als numerische Merkmale:

1. **Zeitindex**
   - Ganzzahliger Index `t = 0, 1, 2, ...` (Zeilenindex).
   - Gibt dem Booster eine einfache Möglichkeit, globale Trends zu modellieren.

2. **Fourier-Merkmale** (zyklische Muster)
   - Zwei feste Perioden (in Einheiten der „Anzahl der Zeilen“):
     - Periode 24 (z. B. 24 Stunden bei stündlichen Daten)
     - Periode 168 (z. B. 7 Tage × 24 Stunden)
   - Für jede Periode `P` berechnen wir:
     - `sin(2πt / P)`
     - `cos(2πt / P)`
   - Dies ist eine Standardmethode, um Saisonalität/Zyklen in einer Form einzubetten, die Baummodelle weiterhin nutzen können.

Der endgültige Merkmalsvektor für jeden Zeitschritt `t` ist:

```text
[ exogenous features (current, lags, diff, rolling mean for each series),
  target-series history (lags, diff, rolling mean),
  cross-series interactions (spread, ratio, product),
  time index, sin/cos(2πt/24), sin/cos(2πt/168) ]
```

### Merkmalsvektor für den zukünftigen Schritt (lastFeatureRow)
Dieselbe Logik zur Merkmalsbildung wird verwendet, um einen Merkmalsvektor für t + 1 (Ein-Schritt-Vorhersage) zu erzeugen:
- Konzeptuell behandeln wir den nächsten Zeitindex als t_next = n, wobei n die Anzahl der beobachteten Zeilen ist.
- Für die „aktuellen“ Werte jeder Reihe bei t_next verwenden wir den zuletzt beobachteten Wert erneut (index n - 1).
- Lags und gleitende Mittelwerte werden anhand der letzten MAX_LAG / ROLLING_WINDOW Schritte der beobachteten Daten berechnet.
- Zeitkodierungen verwenden t_next als Zeitindex.
- Dadurch entsteht ein einzelner Merkmalsvektor lastFeatureRow, der den nächsten Zeitschritt auf Grundlage der gesamten Historie bis zur letzten Beobachtung repräsentiert.

Die Funktion buildFeatures gibt daher zurück:
```text
{
  X: number[][];        // feature matrix for all observed steps
  y: number[];          // target series values for those steps
  lastFeatureRow: number[]; // feature vector representing t + 1
}
```

---


## 🚀 Erste Schritte

### 1. Voraussetzungen
- [Docker Compose](https://docs.docker.com/compose/)

### 2. Alle Services bauen und starten:

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

## AirPassengers-Benchmark

Siehe [`BENCHMARKS.md`](./BENCHMARKS.md) für das faire 16-Schritt-Protokoll und die Regeln zum Vergleich mit Papers.

Das Repository enthält einen AirPassengers-Datensatz und einen Benchmark-Befehl, um das Modellverhalten anhand eines klassischen monatlichen Zeitreihendatensatzes zu prüfen.

Führe den Benchmark mit Docker Compose aus:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark
```

JSON-Ausgabe:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --json
```

Seasonal-naive-Baseline:

```bash
docker compose -f docker-compose.test.yml run --rm air_passengers_benchmark \
  node scripts/benchmark-air-passengers.mjs --algorithm seasonal-naive --json
```


### 16-Schritt-Holdout-Benchmark

Die folgenden Ergebnisse verwenden für jedes vergleichbare Modell dasselbe Fixed-Origin-Evaluationsprotokoll:

- Training: erste 128 AirPassengers-Beobachtungen
- Holdout: nächste 16 Beobachtungen
- während der Prognose wird kein Holdout-Zielwert zurückgeführt
- gemeinsame Punktmetriken: MAE, RMSE, MAPE, sMAPE und MASE

Reproduziere den Benchmark mit:

```bash
docker compose -f docker-compose.test.yml run --rm \
  air_passengers_benchmark \
  sh -lc '
    npm --prefix frontend/app ci &&
    node scripts/benchmark-air-passengers-fair.mjs --markdown
  '
```

Gemessene Ergebnisse:

| Modell | Training | Horizont | MAE | RMSE | MAPE | sMAPE | MASE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| seasonal-naive | 128 | 16 | 64.2500 | 68.0808 | 14.1651% | 15.4031% | 2.1748 |
| xgboost | 128 | 16 | 24.5775 | 29.5014 | 5.5687% | 5.3717% | 0.8319 |
| Chronos-2-small INT8 ONNX | 128 | 16 | **14.7839** | **17.3376** | **3.2438%** | **3.2636%** | **0.5004** |
| VARMA experimental | 128 | 16 | N/A | N/A | N/A | N/A | N/A |

In diesem 16-Schritt-AirPassengers-Holdout erzielte Chronos-2-small INT8 ONNX bei jeder angegebenen Punktmetrik den geringsten Fehler. Dies ist ein Vergleich auf Anwendungsebene und keine direkte Reproduktion aggregierter Werte aus dem Chronos-2-Paper.

VARMA wird als N/A angegeben, weil AirPassengers univariat ist, während die experimentelle VARMA-Implementierung dieses Repositories mindestens zwei numerische Reihen benötigt. Siehe [`BENCHMARKS.md`](./BENCHMARKS.md) für das multivariate und das Paper-Vergleichsprotokoll.


### AirPassengers-xgboost-Benchmark (120/24)

#### csv: data/air_passengers.csv
|  | Diese Arbeit | seasonal-naive | 
| -------- | -------- | -------- |
| train_size | 120 | 120 | 
| test_size | 24 | 24 | 
| MAE | 43.6495 | 47.5833 | 
| RMSE | 50.8508 | 49.9867 | 
| MAPE | 9.5665% | 10.5227% | 
| sMAPE | 9.5943% | 11.1666% | 

---

# Lizenz
- Apache License 2.0
