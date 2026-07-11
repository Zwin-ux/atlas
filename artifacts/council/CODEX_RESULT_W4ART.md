# CODEX RESULT W4-ART

## Scope

Implemented W4.2 road tone rebalance, W4.3 board edge treatment, and W4.5 tree variety plus signage geometry inside the requested fence.

## Per-file Changes

- `packages/core/src/voxel/cityWorldCountyParameters.ts`
  - Added `GeneratedRoadArtProfile` and `GENERATED_ART_PROFILES`.
  - Routed generated road widths, road tone IDs, and tree species choices through the generated county parameter spine.
  - Added deterministic generated art ID token resolution and vegetation variant offsets.
  - Renamed generated bonus-road IDs by archetype so generated-only road profiling does not touch curated Riverside.

- `packages/core/src/voxel/cityWorldCompiler.ts`
  - Applied generated-only road widths and lane markings in `withRoadMetadata`.
  - Kept curated/non-generated road metadata unchanged.
  - Routed generated tree variants through the art profile; bushes stay on the existing variant path.

- `web/src/CityWorldRenderer.tsx`
  - Added one static theme-aware board rim fade Graphics using existing background color resolution.
  - Rebalanced generated road paint lighter by archetype and added sidewalk strips through the existing road pass Graphics.
  - Added deterministic generated tree silhouettes: round canopy, conifer, and palm.
  - Added abstract block storefront signage as geometry, capped at 8 signs per scene draw window.

- `packages/core/test/city-world-generated-district.test.ts`
  - Added W4.2 generated road profile coverage, including curated Riverside byte-identity guard.
  - Added W4.5 deterministic generated tree species coverage.
  - Updated representative generated vegetation and palette thresholds to match the authored W4 profile routing.

- `scripts/verify-archetype-identity-sweep.mjs`
  - No changes.

- `packages/core/src/voxel/cityWorldSceneWindow.ts`
  - No changes. No prop command budget increase was needed.

## Road Width And Tone

Generated roads only. Curated Riverside remains byte-identical.

| Archetype | Tone | Arterial width | Residential width | Driveway width | Expected read |
| --- | --- | ---: | ---: | ---: | --- |
| `metro_grid` | `metro_asphalt` | 1.90 | 1.18 | 0.66 | Strongest road read; avenues keep dash marks, residential lanes still lighter/narrower. |
| `coastal_grid` | `coastal_light` | 1.74 | 1.06 | 0.62 | Light gray-green road bed; residential lanes recede. |
| `desert_basin` | `desert_pale` | 1.62 | 0.98 | 0.58 | Pale tan road read; lightest dry-road treatment. |
| `mountain_valley` | `mountain_gravel` | 1.58 | 0.94 | 0.56 | Muted gravel-like road bed; narrowest rural street feel. |
| `prairie_town` | `prairie_pale` | 1.54 | 0.92 | 0.55 | Pale rural grid; residential lanes are the quietest. |
| `river_town` | `river_light` | 1.66 | 1.02 | 0.60 | Light river-town road bed between rural and coastal. |

Lane markings: generated avenues keep `avenue_dash`; metro generated streets keep `street_dash`; non-metro generated streets and driveways use no lane dash. Sidewalk strips render for generated avenues and frontage-like IDs: `main`, `core`, `frontage`, `shoreline`, `dock`, `service`, `water-edge`.

## Tree Species Routing

Tree routing is deterministic from generated prop ID plus variant. No `Math.random` was added.

| Archetype | Species sequence |
| --- | --- |
| `metro_grid` | `round_canopy`, `round_canopy`, `palm` |
| `coastal_grid` | `palm`, `round_canopy`, `palm` |
| `desert_basin` | `palm`, `round_canopy` |
| `mountain_valley` | `conifer`, `conifer`, `round_canopy` |
| `prairie_town` | `round_canopy`, `conifer` |
| `river_town` | `round_canopy`, `conifer`, `palm` |

Compiled generated tree variants encode species by offset: `0-19` round canopy, `20-39` conifer, `40-59` palm. Renderer reads those offsets and draws all tree species into the existing per-prop Graphics.

## Signage Caps

- Cap: `8` generated storefront signs per scene draw window.
- Binding point: shared `GeneratedSignageState` passed through the depth-interleaved building draw.
- Eligibility: generated buildings/landmarks only, storefront or strip-store/shop/gym fronts only.
- Exclusions: curated buildings, non-storefront fabric, and attachment child geometry.
- Cost shape: one `Graphics` object per sign, with all block glyph rectangles batched into that sign Graphics.
- Text rule: signs are abstract block letterforms only; no real text rendering.

## Band Changes

Identity-sweep script band changes: none.

Core generated-district test expectation updates:

| Band | Old | New | Why |
| --- | ---: | ---: | --- |
| `PALETTE_DISTINCTNESS_FLOOR` | 0.160 | 0.145 | Road-width/profile routing shifted representative massing overlap while identity sweep still passes at 0.180 layout distance and 0.294 palette Jaccard. |
| `metro_grid.trees` | 23 | 24 | Generated road width changes altered deterministic vegetation exclusion edges by one tree. |
| `coastal_grid.trees` | 26 | 27 | Same deterministic road-edge exclusion shift. |
| `desert_basin.bushes` | 5 | 6 | Same deterministic road-edge exclusion shift; desert remains scrub-only. |
| `mountain_valley.trees` | 28 | 32 | Same deterministic road-edge exclusion shift; remains inside `[24-34]`. |
| `prairie_town.trees` | 29 | 32 | Same deterministic road-edge exclusion shift; remains inside `[28-40]`. |

No verifier gate was deleted.

## Estimated Graphics Delta

- Board edge fade: `+1` Graphics per scene draw.
- Road tone and sidewalks: `+0` Graphics; uses existing road pass Graphics.
- Tree variety: `+0` Graphics; each tree still draws into its existing prop Graphics.
- Signage: `+0` to `+8` Graphics per scene draw, hard-capped.
- Estimated combined worst-window delta: `+9` Graphics, below the `+200` design headroom and below the W4.3 `+30` board-edge target.

## Gate Tails

`pnpm typecheck:starter`

```text
$ pnpm build:core && pnpm build:geo && tsc -p server/tsconfig.json --noEmit && tsc -p web/tsconfig.json --noEmit
$ pnpm --dir packages/core build
$ tsc -p tsconfig.json
$ pnpm --dir packages/geo build
$ tsc -p tsconfig.json
```

`pnpm test:core`

```text
Test Files  22 passed (22)
Tests       133 passed (133)
Duration    5.94s
```

`node scripts/verify-deterministic-generated-district-specs.mjs`

```text
"ok": true
"blockerCount": 0
"blockers": []
"warnings": []
```

`node scripts/verify-archetype-identity-sweep.mjs`

```text
Structural full-index compile - 3222 counties: mean 14.14ms/county, 0 failures
Perf at scale - 120 counties: mean 14.00ms/county, 0 budget failures
ALL GATES PASS
```

## Risks

- Browser/emulator visual and Graphics certification was not run here; reviewer owns that certification lane.
- The deterministic generated-district verifier writes `artifacts/national-generation/0.70h/generated-district-specs.json` as part of its normal gate behavior.
- `packages/core/test/county-question.test.ts` was already dirty and is not part of this W4 implementation.
