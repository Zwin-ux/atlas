# CODEX RESULT 0.79-T - Worst-Tail Lift (NS-1/NS-6)

## Scope

Packet: `ATLAS PACKET 0.79-T - WORST-TAIL LIFT (NS-1/NS-6)`

Read first:

- `artifacts/visual-score/REPORT.md`
- `artifacts/council/CODEX_RESULT_0791.md`

Fence held:

- Changed only core voxel generation/test files, visual-score helper/report artifacts, sweep floor reporting, and this result note.
- Did not edit `web/*`, `server/*`, `world/*`, or docs.
- Did not git add, commit, or push.

## Per-Defect Fix Design

### 1. Opening Frame Emptiness

- Added generated overview focus compliance scoring for non-water generated counties.
- Candidate scoring now rewards frames that contain at least `max(3, ceil(primaryBoardBuildings / 2))` primary buildings and keep the generated landmark fully inside the desktop/mobile frame.
- Added landmark, fabric-center, and landmark-to-zone midpoint candidates so sparse generated boards can frame real fabric without moving buildings toward the camera.
- Added a 0.79-T regression test for `butte-id`: desktop opening now shows `3/4` primary buildings, keeps the ridge lodge fully in-frame, and keeps the landmark visible.

### 2. Sparse-Board Road Spaghetti

- Changed mountain-valley sparse lower-contour road placement so it joins the lower built fabric instead of floating as a disconnected pale strip.
- Added a rural/frontier mountain-valley road clamp that keeps the largest connected non-crosswalk network, caps total sparse road length by tier, and drops disconnected low-priority road islands.
- Added a regression assertion that Butte's non-crosswalk road network has exactly one connected component.

### 3. Mountain Relief Visibility

- Extended the mountain opening relief anchor set from `summit-co` to `summit-co` plus `butte-id`.
- Added mountain-specific focus offsets and a relief bonus that continues rewarding visibly larger cliff-course exposure instead of saturating at the old floor.
- Raised mountain quantization visibility so sparse mountain first frames show stepped relief.
- Gate tail after fix: `summit-co drops 49 [48+]`; `butte-id drops 31 [30+]`.

### 4. Vegetation Band Fit

- Added generated vegetation band normalization across archetypes.
- If generated vegetation is below band, deterministic vegetation is added from authored fill zones first.
- If generated vegetation is above band, non-landmark vegetation is trimmed toward the band midpoint.
- Mountain representative after fix: `trees 28`, `bushes 4`, `vegetation 32 [28-38]`.

### 5. Material/Roof Grammar Regression From Mountain Lift

- The mountain representative briefly fell to `8/14 = 0.571` non-default material/roof profiles after the ridge/landmark work.
- Added a deterministic mountain cottage variant in the generator so selected mountain cottages resolve as ranch/hip silhouettes.
- Sweep after fix: mountain material `21/25 = 0.84`; roof `21/25 = 0.84`.

## Before / After Worst 10

| Rank | Before 0.79-1 worst tail | Score | After 0.79-T worst tail | Score |
| ---: | --- | ---: | --- | ---: |
| 1 | butte-id / mountain_valley / frontier | 75.9 | montcalm-mi / prairie_town / town | 83.36 |
| 2 | brooke-wv / mountain_valley / town | 76.94 | potter-tx / prairie_town / town | 83.36 |
| 3 | lamoille-vt / mountain_valley / town | 77 | jackson-wi / prairie_town / rural | 83.38 |
| 4 | powell-mt / mountain_valley / frontier | 77 | bibb-al / prairie_town / rural | 83.66 |
| 5 | morgan-wv / mountain_valley / town | 79.1 | okfuskee-ok / prairie_town / rural | 83.66 |
| 6 | boise-id / mountain_valley / frontier | 80.4 | franklin-nc / prairie_town / town | 83.92 |
| 7 | meagher-mt / mountain_valley / frontier | 80.4 | marion-ia / prairie_town / town | 83.92 |
| 8 | la-plata-co / mountain_valley / rural | 80.52 | carteret-nc / prairie_town / town | 84.34 |
| 9 | lincoln-wv / mountain_valley / rural | 80.74 | jasper-in / prairie_town / town | 84.34 |
| 10 | mineral-wv / mountain_valley / town | 81.14 | mercer-ky / prairie_town / town | 84.34 |

Worst confirmed mountain tail after fix:

| County | Before | After | Notes |
| --- | ---: | ---: | --- |
| butte-id | 75.9 | 98.9 | landmark full-frame, `3/4` primary buildings, vegetation in band, roads connected |
| brooke-wv | 76.94 | 98.32 | vegetation band fixed |
| lamoille-vt | 77 | 95.5 | remaining composition score only |
| powell-mt | 77 | 95.5 | remaining composition score only |
| morgan-wv | 79.1 | 89.74 | remaining composition miss: `4/6` town opening buildings |
| boise-id | 80.4 | 98.9 | vegetation/opening fixed |
| meagher-mt | 80.4 | 98.9 | vegetation/opening fixed |
| la-plata-co | 80.52 | 100 | rural mountain tail cleared |
| lincoln-wv | 80.74 | 100 | rural mountain tail cleared |
| mineral-wv | 81.14 | 99.16 | vegetation/opening fixed |

## Distribution And Floor Raises

Baseline from 0.79-1:

- Count: `3222/3222`
- Min: `75.9`
- p10: `90.45`
- p25: `95.5`
- Median: `98.46`
- p75: `99.02`
- p90: `99.58`
- Max: `100`
- Mean: `96.64`

After 0.79-T:

- Count: `3222/3222`
- Min: `83.36`
- p10: `94.06`
- p25: `97.9`
- Median: `98.6`
- p75: `99.58`
- p90: `100`
- Max: `100`
- Mean: `97.84`

Floor raises:

- `VISUAL_SCORE_MEDIAN_FLOOR`: `93.46 -> 98.46` (`+5`)
- `VISUAL_SCORE_HARD_FLOOR`: `70.9 -> 78.36` (`+7.46`, five-point cushion under new observed min `83.36`)

## Gate Tails

- `pnpm typecheck:starter` - PASS.
- `pnpm test:core` - PASS, `23` files, `149` tests. The count increased from the prior 148 because 0.79-T adds the Butte regression test. The curated Riverside byte-identity test remains green.
- `node scripts/build-visual-score-report.mjs` - PASS, `3222/3222`; median `98.6 >= 98.46`; min `83.36 >= 78.36`; worst `montcalm-mi:83.36`.
- `node scripts/verify-deterministic-generated-district-specs.mjs` - PASS, `ok: true`, blockerCount `0`, warnings `[]`.
- `node scripts/verify-archetype-identity-sweep.mjs ALL GATES` - PASS, all gates pass.
  - Structural full-index compile: `3222` counties, `0` failures.
  - Perf gate: `10.45ms/county`, `0` budget failures.
  - Massing/layout closest pair: `desert_basin ~ river_town = 0.15`, floor held.
  - Mountain opening relief: `summit-co drops 49 [48+]`, `butte-id drops 31 [30+]`.
  - Visual score floor gate: count `3222/3222`; median `98.6`; min `83.36`.

## Risks / Follow-Up

- The confirmed mountain tail is lifted, but the new worst national tail is sparse `prairie_town` composition, not mountain vegetation/road relief.
- The road clamp is intentionally scoped to rural/frontier `mountain_valley` because a broader sparse-road clamp caused road-class and median regressions during exploration.
- The focus scorer strongly rewards landmark-full, half-board frames where possible. Some dispersed non-mountain boards still fail composition scoring because their authored layout physically spreads buildings beyond one opening frame.
- No docs were updated because the packet explicitly forbade docs.
