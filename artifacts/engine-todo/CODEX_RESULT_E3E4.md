# CODEX_RESULT_E3E4

Status: local-green for the allowed Codex gates.

Scope touched only:
- `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts`
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `web/src/CityWorldRenderer.tsx`
- `packages/core/test/city-world-generated-district.test.ts`
- `scripts/verify-archetype-identity-sweep.mjs`
- `artifacts/engine-todo/CODEX_RESULT_E3E4.md`

## Layout Changes

### coastal_grid

- Replaced the old corner-biased water patch with a full east-edge water band:
  - rect: `x=36..44`, `y=0..32`
  - water tiles: `297`
  - shoreline road held at `x=35`
- Narrowed the waterfront strip by one tile so buildings stay landward of the new shore.
- Dock and boat now sit near the landward edge of the widened band.

### river_town

- River axis is seed-chosen:
  - even seed: horizontal crossing river
  - odd seed: vertical crossing river
- Representative horizontal river (`butler-al`):
  - rect: `x=0..44`, `y=15..20`
  - water tiles: `270`
  - relief spread: `0.5`
  - drop tiles: `77`
- Representative vertical river (`clay-al`):
  - rect: `x=21..25`, `y=0..32`
  - water tiles: `165`
  - relief spread: `0.5`
- Bridge/crossing roads remain; roads may draw over water as the existing road treatment.
- Added an east-bank market on the horizontal river layout so the wider water band does not starve massing or the existing parity palette gate.
- Horizontal shoreline vegetation now uses north/south bank rows instead of the old vertical-bank helper.

### mountain_valley

- Amplified the generated height grid within the existing 3-level quantization model.
- Representative spread: `1.0`
- Representative drop tiles: `115`
- No new quantization level was added.

### desert_basin

- Boosted mesa rim relief around high edges/corners within the existing 3-level quantization model.
- Representative spread: `0.5`
- Representative drop tiles: `56`
- No new quantization level was added.

## Renderer Treatment

- Deepened water terrain from teal toward north-star blue.
- Strengthened water depth gradient, dark falloff, and sheen inside the existing water tile branch.
- Strengthened compiler-authored shore strands from `terrainContact.waterEdgeSides`.
- Deepened waterfront bank extrusion color/depth.
- Added stratum strokes inside existing cliff-course Graphics paths so mountain/desert courses read as stacked cliff layers.
- No gesture, camera, browser QA, or unrelated renderer paths changed.

## Gate Numbers

- Coastal water floor in sweep: `>=250`; representative: `297`.
- River water floor in sweep: `>=150`; representative horizontal: `270`; representative vertical: `165`.
- Mountain relief floor: spread `>=1`, drop tiles `>=80`; representative: `1`, `115`.
- Desert relief floor: spread `>=0.5`, drop tiles `>=40`; representative: `0.5`, `56`.
- River relief floor: spread `>=0.5`, drop tiles `>=30`; representative: `0.5`, `77`.
- Massing/layout distinctness stayed green; final closest pair: `metro_grid~coastal_grid = 0.20`.
- Parity regional palette distinctness stayed green at the hard floor: `min 0.16`.

## Window / Weight Scan

Full-index weight-only scene-window scan:

- counties: `3,222`
- windows: `12,888`
- failures over `1200`: `0`
- worst visible weight: `782/1200`
- worst weight cell: `lake-mn`, `metro_grid`, `mobile`
- worst visible commands: `623` (`union-ky`, `metro_grid`, `mobile`)
- worst prop commands: `35` (`dallas-al`, `metro_grid`, `mobile`)

Desktop/mobile full-budget scan:

- counties: `3,222`
- windows: `6,444`
- failures: `0`
- worst visible weight: `782/1200`

Graphics estimate:

- No new Pixi `Graphics` objects were added for terrain, water, or cliff rendering; the renderer changes add path strokes/fills inside existing batched terrain Graphics.
- The only object-count pressure is generated scene content, covered by the window weight scan above.
- Reviewer still owns actual browser/Pixi Graphics measurement against `<=1600`.

## Verification Tails

`pnpm build:core`

```text
$ pnpm --dir packages/core build
$ tsc -p tsconfig.json
```

`pnpm test:core`

```text
Test Files  22 passed (22)
Tests       120 passed (120)
```

`node scripts\verify-generated-district-parity.mjs`

```text
Generated district parity: OK
PASS  regional palette distinctness >= 0.16 (min 0.16)
PASS  per-archetype home clone pressure <= 0.30 (max 0.28)
PASS  no scene hard blockers
```

`node scripts\verify-archetype-identity-sweep.mjs`

```text
PASS  massing_layout_distinctness [closest metro_grid~coastal_grid = 0.2]
PASS  vegetation_presence [all representative bands pass]
PASS  water_relief_bands [all representative E3/E4 bands pass]
PASS  structural_full_index [all counties pass]
ALL GATES PASS
```

Full-index window scan:

```text
checkedCounties: 3222
checkedWindows: 12888
worst visibleBudgetWeight: 782
failureCount: 0
```

## Risks / Skips

- Browser/web/esbuild, screenshots, audit, and real Pixi Graphics measurement were not run per instruction; reviewer runs those.
- The parity palette floor is exactly `0.16` after the river layout change, so future river building-mix changes should watch that gate.
- Full-budget evaluation on all four cameras can still trip existing detail-camera `roadCommandCount` blockers; desktop/mobile full-budget evaluation is green, and the requested all-window weight ceiling is green.

## Honest Read

Water should now read as actual water at overview: coastal is a board-edge blue band, river towns have a board-crossing river, and shore/dock/boat accents are tied to the new band geometry. Terrain strata now has measurable relief: mountains expose two-course drops on high sides, desert has one-course mesa rims, and river banks step down to water. The remaining visual judgment is screenshot-based water color and cliff read against the north-star reference.
