# CODEX RESULT 0.79-1 - Per-County Visual Score + Worst-50 Report

## Scope

Implemented the 0.79-1 visual score packet inside the requested fence:

- Added `scripts/lib/visual-score.mjs` as the shared sweep/report helper layer.
- Added `scripts/build-visual-score-report.mjs` to score all 3,222 counties and write `artifacts/visual-score/report.json` plus `artifacts/visual-score/REPORT.md`.
- Refactored `scripts/verify-archetype-identity-sweep.mjs` to import shared helpers and added the visual score floor gate.
- Left `web/*`, `server/*`, `packages/core/src/*`, and docs untouched.

## Weights

The exported `WEIGHTS` table is:

| Signal | Weight |
| --- | ---: |
| compositionOccupancy | 18 |
| waterVisibility | 14 |
| vegetationBandFit | 14 |
| paletteNeighborDistance | 16 |
| massingSignatureDistance | 16 |
| roadClassMixSanity | 12 |
| labelGrammarCoverage | 10 |

## Observed Distribution

First real national run scored `3222/3222` counties.

| Metric | Score |
| --- | ---: |
| min | 75.9 |
| p10 | 90.45 |
| p25 | 95.5 |
| median | 98.46 |
| p75 | 99.02 |
| p90 | 99.58 |
| max | 100 |
| mean | 96.64 |

Histogram:

| Score range | Counties |
| --- | ---: |
| 0-9 | 0 |
| 10-19 | 0 |
| 20-29 | 0 |
| 30-39 | 0 |
| 40-49 | 0 |
| 50-59 | 0 |
| 60-69 | 0 |
| 70-79 | 5 |
| 80-89 | 309 |
| 90-99 | 2642 |
| 100 | 266 |

## Chosen Floors

- `VISUAL_SCORE_MEDIAN_FLOOR = 93.46`
- `VISUAL_SCORE_HARD_FLOOR = 70.9`

Rationale: both floors are exactly five points below the first measured real distribution (`median 98.46`, `min 75.9`). These are initial ratchet floors and should not move down silently.

## Worst 50

| Rank | County | Score | Archetype | Tier | Failing signals |
| ---: | --- | ---: | --- | --- | --- |
| 1 | butte-id | 75.9 | mountain_valley | frontier | compositionOccupancy: opening buildings 2 below 3 for frontier; vegetationBandFit: vegetation 11 outside 28-38 |
| 2 | brooke-wv | 76.94 | mountain_valley | town | compositionOccupancy: opening buildings 3 below 6 for town; vegetationBandFit: vegetation 45 outside 28-38 |
| 3 | lamoille-vt | 77 | mountain_valley | town | compositionOccupancy: opening buildings 4 below 6 for town; vegetationBandFit: vegetation 48 outside 28-38 |
| 4 | powell-mt | 77 | mountain_valley | frontier | compositionOccupancy: opening buildings 2 below 3 for frontier; vegetationBandFit: vegetation 16 outside 28-38 |
| 5 | morgan-wv | 79.1 | mountain_valley | town | compositionOccupancy: opening buildings 4 below 6 for town; vegetationBandFit: vegetation 45 outside 28-38 |
| 6 | boise-id | 80.4 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 11 outside 28-38 |
| 7 | meagher-mt | 80.4 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 17 outside 28-38 |
| 8 | la-plata-co | 80.52 | mountain_valley | rural | compositionOccupancy: opening buildings 2 below 5 for rural; massingSignatureDistance: nearest river_town distance 0.14 below 0.15; vegetationBandFit: vegetation 25 outside 28-38 |
| 9 | lincoln-wv | 80.74 | mountain_valley | rural | compositionOccupancy: opening buildings 0 below 5 for rural |
| 10 | mineral-wv | 81.14 | mountain_valley | town | compositionOccupancy: opening buildings 3 below 6 for town; vegetationBandFit: vegetation 42 outside 28-38 |
| 11 | logan-wv | 81.44 | mountain_valley | town | compositionOccupancy: opening buildings 5 below 6 for town; vegetationBandFit: vegetation 45 outside 28-38 |
| 12 | custer-co | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 15 outside 28-38 |
| 13 | fallon-mt | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 17 outside 28-38 |
| 14 | glacier-mt | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 16 outside 28-38 |
| 15 | goshen-wy | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 16 outside 28-38 |
| 16 | idaho-id | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 16 outside 28-38 |
| 17 | jackson-co | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 18 outside 28-38 |
| 18 | jefferson-mt | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 15 outside 28-38 |
| 19 | juab-ut | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 16 outside 28-38 |
| 20 | kiowa-co | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 18 outside 28-38 |
| 21 | madison-mt | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 17 outside 28-38 |
| 22 | park-wy | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 17 outside 28-38 |
| 23 | prowers-co | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 17 outside 28-38 |
| 24 | richland-mt | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 16 outside 28-38 |
| 25 | sedgwick-co | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 17 outside 28-38 |
| 26 | washakie-wy | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 17 outside 28-38 |
| 27 | wibaux-mt | 81.5 | mountain_valley | frontier | compositionOccupancy: score 0.75; vegetationBandFit: vegetation 16 outside 28-38 |
| 28 | summit-ut | 81.9 | mountain_valley | rural | compositionOccupancy: opening buildings 3 below 5 for rural; vegetationBandFit: vegetation 23 outside 28-38 |
| 29 | monongalia-wv | 82.7 | mountain_valley | suburban | compositionOccupancy: opening buildings 7 below 8 for suburban; vegetationBandFit: vegetation 45 outside 28-38 |
| 30 | box-elder-ut | 83.04 | mountain_valley | rural | compositionOccupancy: opening buildings 2 below 5 for rural; vegetationBandFit: vegetation 26 outside 28-38 |
| 31 | lake-in | 83.6 | metro_grid | suburban | roadClassMixSanity: metro diagonal avenues 0 outside 1-2; vegetationBandFit: vegetation 17 outside 26-34 |
| 32 | lake-oh | 83.6 | metro_grid | suburban | roadClassMixSanity: metro diagonal avenues 0 outside 1-2; vegetationBandFit: vegetation 19 outside 26-34 |
| 33 | rock-island-il | 83.6 | metro_grid | suburban | roadClassMixSanity: metro diagonal avenues 0 outside 1-2; vegetationBandFit: vegetation 19 outside 26-34 |
| 34 | franklin-vt | 83.84 | mountain_valley | town | vegetationBandFit: vegetation 49 outside 28-38 |
| 35 | lewis-and-clark-mt | 84.7 | mountain_valley | rural | compositionOccupancy: opening buildings 3 below 5 for rural; vegetationBandFit: vegetation 25 outside 28-38 |
| 36 | carbon-mt | 84.9 | mountain_valley | frontier | vegetationBandFit: vegetation 15 outside 28-38 |
| 37 | converse-wy | 84.9 | mountain_valley | frontier | vegetationBandFit: vegetation 16 outside 28-38 |
| 38 | crowley-co | 84.9 | mountain_valley | frontier | vegetationBandFit: vegetation 17 outside 28-38 |
| 39 | dimmit-tx | 84.9 | river_town | frontier | vegetationBandFit: vegetation 13 outside 26-34 |
| 40 | kit-carson-co | 84.9 | mountain_valley | frontier | vegetationBandFit: vegetation 17 outside 28-38 |
| 41 | mesa-co | 84.9 | mountain_valley | rural | vegetationBandFit: vegetation 19 outside 28-38 |
| 42 | petroleum-mt | 84.9 | mountain_valley | frontier | vegetationBandFit: vegetation 11 outside 28-38 |
| 43 | san-juan-co | 84.9 | mountain_valley | frontier | vegetationBandFit: vegetation 16 outside 28-38 |
| 44 | san-miguel-co | 84.9 | mountain_valley | frontier | vegetationBandFit: vegetation 17 outside 28-38 |
| 45 | el-paso-tx | 85 | metro_grid | suburban | roadClassMixSanity: metro diagonal avenues 0 outside 1-2; vegetationBandFit: vegetation 40 outside 26-34 |
| 46 | jefferson-tn | 85 | river_town | town | compositionOccupancy: opening buildings 4 below 6 for town; massingSignatureDistance: nearest mountain_valley distance 0.13 below 0.15; vegetationBandFit: vegetation 25 outside 26-34 |
| 47 | lower-connecticut-river-valley-planning-region-ct | 85 | metro_grid | suburban | roadClassMixSanity: metro diagonal avenues 0 outside 1-2; vegetationBandFit: vegetation 20 outside 26-34 |
| 48 | lubbock-tx | 85 | metro_grid | suburban | roadClassMixSanity: metro diagonal avenues 0 outside 1-2; vegetationBandFit: vegetation 40 outside 26-34 |
| 49 | preston-wv | 85.64 | mountain_valley | town | compositionOccupancy: opening buildings 5 below 6 for town; vegetationBandFit: vegetation 42 outside 28-38 |
| 50 | adams-id | 86 | mountain_valley | frontier | vegetationBandFit: vegetation 15 outside 28-38 |

## Refactor Map

- `scripts/lib/visual-score.mjs`
  - Moved/refactored sweep constants and helpers: archetype constants, representative county resolution, full-index coverage, structural inspection, palette fingerprinting, massing fingerprinting, vegetation counts/bands, layout road metrics, water/relief/opening-frame readouts, open-block fill readouts, attachment readouts, place identity readouts, distinctness matrices, and perf probe support.
  - Added shared 0.79-1 scoring helpers: `WEIGHTS`, floor constants, `buildVisualScoreReport`, `scoreCountyVisualSignals`, distribution/histogram summarizers, Markdown rendering, and shared `roadClassMixFailures`.
- `scripts/verify-archetype-identity-sweep.mjs`
  - Now imports the shared helper layer instead of owning duplicate helper bodies.
  - Keeps all previous gates and adds `visual_score_floor_0791`.
- `scripts/build-visual-score-report.mjs`
  - Builds the national visual score report, writes deterministic JSON/Markdown artifacts, and fails if count or floor gates fail.

## Verification

- `node scripts/build-visual-score-report.mjs` twice:
  - `3222/3222` counties.
  - median `98.46`, floor `93.46`.
  - min `75.9`, hard floor `70.9`.
  - `report.json` SHA-256 was identical both runs: `97608F0B32492890DE084C190A167DC63E915B3340B0182592A25814ACD90175`.
  - `REPORT.md` SHA-256 was identical both runs: `65FB94CEB1C9A983E128F23C4B075F53DBCC3DF3ED57F90809F3106644A02BA0`.
- `pnpm test:core`: passed, `23` test files and `148` tests.
- `node scripts/verify-archetype-identity-sweep.mjs`: passed all gates, including:
  - `perf_at_scale`: `16.82ms`, `0` failures.
  - `visual_score_floor_0791`: `3222/3222`, median `98.46 >= 93.46`, min `75.9 >= 70.9`.

## Risks

- The score is a triage metric, not a replacement for owner visual review. Worst-tail counties still need the emulator screenshot loop.
- The first worst-tail is dominated by mountain/frontier opening occupancy and vegetation-band misses. That is useful signal, but fixes should raise the floor deliberately rather than tuning the score to hide the tail.
- The existing perf gate showed host-load sensitivity once during verification (`23.18ms` over the old `20ms` ceiling) while other Node processes were active. A rerun of the unchanged gate passed at `16.82ms`; no perf ceiling was changed.
- Floors are initial ratchets. Future packets should move them up only with explicit measured distributions and should not lower them silently.
