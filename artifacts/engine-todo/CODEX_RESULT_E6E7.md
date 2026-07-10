# CODEX RESULT E6+E7

Packet: E6 + E7 material/roof grammar routing
Branch: `codex/integrate-hosted-clawd-fable-058e`
Head at start: `6a3e28e`

## Routing Design

- `buildingVisualGrammar` now resolves through authored-property helpers:
  - `buildingMaterialProfile(kind, facadeStyle)`
  - `buildingRoofProfile(kind, roofShape, facadeStyle)`
  - `buildingAuthoredObjectFamily(kind, roofShape, facadeStyle)`
- Curated ID checks remain only as object-family/no-label overrides layered over the property base:
  - Anaheim / Angel Stadium -> `venue_anchor`
  - ARTIC / Ontario airport -> `transit_anchor`
  - Platinum Triangle -> `lowrise_cluster`
  - Downtown service fallback -> `service_block`
- Non-civic `roofShape: "tower"` now resolves to `blue_metal_utility`.
- Civic `kind: "civic" + facadeStyle: "civic" + roofShape: "tower"` still resolves to `civic_glass_cap`, preserving curated civic tower output.
- Desert and prairie generated utility landmarks now author the existing service vocabulary:
  - `buildingKind: "gym"`
  - `facadeStyle: "fitness"`
  - `roofShape: "tower"`
  - compiler result: `objectFamily: "service_block"`, `roofProfile: "blue_metal_utility"`, `noLabelPriority: "supporting"`

No new renderer paths, profile strings, unions, or dependencies were added.

## Curated Byte Identity

Baseline file: `artifacts/engine-todo/curated-compile-baseline.txt`

Pre-change captured hash:
`e4f59cff91620974e4fb8333ed260d088fdd1d545778a7292df612253878d516`

Post-change recomputed hash:
`e4f59cff91620974e4fb8333ed260d088fdd1d545778a7292df612253878d516`

Result: byte-identical for `JSON.stringify(compileCityWorldScene(riversideDemoVoxelScene))`.

## E6 Profile Metric

Metric: per representative archetype, material and roof non-default rates must each be >= `0.60`.

Defaults:
- material: `socal_stucco_warm`
- roof: `terracotta_barrel_tile`

| Archetype | Before material | Before roof | After material | After roof |
|---|---:|---:|---:|---:|
| metro_grid | 28/31 = 0.903 | 28/31 = 0.903 | 28/31 = 0.903 | 28/31 = 0.903 |
| coastal_grid | 19/30 = 0.633 | 19/30 = 0.633 | 19/30 = 0.633 | 19/30 = 0.633 |
| desert_basin | 25/29 = 0.862 | 25/29 = 0.862 | 24/29 = 0.828 | 25/29 = 0.862 |
| mountain_valley | 14/18 = 0.778 | 15/18 = 0.833 | 14/18 = 0.778 | 15/18 = 0.833 |
| prairie_town | 16/19 = 0.842 | 16/19 = 0.842 | 15/19 = 0.789 | 16/19 = 0.842 |
| river_town | 25/31 = 0.806 | 24/31 = 0.774 | 25/31 = 0.806 | 24/31 = 0.774 |

All after rates clear the floor.

## E7 Tower Treatment

Before:
- `gen-landmark-desert_mesa_tower`: `civic/civic/tower/civic_glass_cap`
- `gen-landmark-prairie_grain_elevator`: `civic/civic/tower/civic_glass_cap`

After:
- `gen-landmark-desert_mesa_tower`: `gym/fitness/tower/service_block/blue_metal_utility/supporting`
- `gen-landmark-prairie_grain_elevator`: `gym/fitness/tower/service_block/blue_metal_utility/supporting`

This uses the existing `blue_metal_utility` roof vocabulary for utility/elevator tower caps.

## Verification Tails

`pnpm build:core`
- `tsc -p tsconfig.json`
- exit 0

`pnpm test:core`
- `Test Files 22 passed (22)`
- `Tests 122 passed (122)`
- exit 0

`node scripts\verify-generated-district-parity.mjs`
- `Generated district parity: OK`
- `PASS regional palette distinctness >= 0.16 (min 0.16)`
- `PASS per-archetype home clone pressure <= 0.30 (max 0.28)`
- `PASS no scene hard blockers`
- `curated Riverside reference: pad fill mean 0.993, desktop lower frame 0.194`
- exit 0

`node scripts\verify-archetype-identity-sweep.mjs`
- `Structural full-index compile - 3222 counties: mean 10.71ms/county, 0 failures`
- `PASS material_roof_profile_routing ... [all representative E6/E7 profile bands pass]`
- `PASS structural_full_index ... [all counties pass]`
- `ALL GATES PASS`
- exit 0

Curated hash check:
- `e4f59cff91620974e4fb8333ed260d088fdd1d545778a7292df612253878d516`
- matches baseline

## Risks / Honest Read

- The source vocabulary has no industrial/utility building kind. I used existing `gym` + `fitness` as the service/utility authored hint for generated water-tower/elevator landmarks rather than adding a type or renderer path.
- Desert/prairie material non-default rates drop by one building because those landmarks no longer author civic material. Both still clear the new floor.
- Reviewer still owns esbuild/browser/screenshot certification.
