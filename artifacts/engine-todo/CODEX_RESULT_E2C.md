# CODEX RESULT E2C - Vegetation Density Retune

## Scope

Touched only:

- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `scripts/verify-archetype-identity-sweep.mjs`
- `artifacts/engine-todo/CODEX_RESULT_E2C.md`

No public tools, renderer routes, provider geometry, persistence, money, public promotion, cars, humans, labels, panels, glows, or desert retune.

## Implementation

- Densified generated-draft vegetation through the existing zone grammar and the hash-isolated `:e2-vegetation` RNG.
- Added metro-only standalone pocket-plaza vegetation without enabling desert plaza scrub.
- Increased non-desert street-tree rhythm through archetype caps and tighter spacing.
- Increased coastal park and shoreline clusters.
- Added river two-bank shoreline clusters.
- Increased mountain high-relief pine clusters.
- Added prairie shelter-row, field-corner, and park-cluster density.
- Left `desert_basin` scrub unchanged.

## Representative Counts

| archetype | representative county | trees | bushes | vegetation | target |
| --- | --- | ---: | ---: | ---: | --- |
| `metro_grid` | `autauga-al` | 23 | 6 | 29 | 26-34 |
| `coastal_grid` | `aleutians-east-borough-ak` | 26 | 2 | 28 | 26-34 |
| `desert_basin` | `apache-az` | 0 | 5 | 5 | 5-8 unchanged |
| `mountain_valley` | `adams-co` | 29 | 4 | 33 | 28-38 |
| `prairie_town` | `adair-ia` | 29 | 4 | 33 | 32-44 |
| `river_town` | `butler-al` | 23 | 4 | 27 | 26-34 |

## Full-Index Prop And Window Scan

Command: inline `node` scan over built `packages/core/dist/index.js`, all 3,222 counties, cameras `desktop`, `mobile`, `residential_detail`, `commerce_detail`.

Caps:

- scene props <= 90
- visible props per window <= 36
- visible budget weight <= 1200

Result: pass, 0 failures.

- max scene props: 65/90, `orange-vt`, `mountain_valley`
- worst visible props: 35/36, `dallas-al`, `metro_grid`, `mobile`, scene props 53, visible weight 730
- worst visible weight: 782/1200, `lake-mn`, `metro_grid`, `mobile`, visible props 33

Worst visible props by camera:

| camera | county | archetype | scene props | visible props | visible weight |
| --- | --- | --- | ---: | ---: | ---: |
| `desktop` | `orange-vt` | `mountain_valley` | 65 | 31 | 454 |
| `mobile` | `dallas-al` | `metro_grid` | 53 | 35 | 730 |
| `residential_detail` | `caledonia-vt` | `mountain_valley` | 64 | 13 | 146 |
| `commerce_detail` | `franklin-vt` | `mountain_valley` | 61 | 12 | 133 |

## Graphics Estimate

Reviewer baseline: worst REAL Graphics 938/1600. Previous worst visible prop count was 20; new worst is 35, or +15 visible props. At roughly +2 Graphics per added visible prop:

- estimated worst Graphics: 938 + 30 = 968
- reviewer budget target: under 1250
- hard budget ceiling: 1600

Read: estimate remains comfortably green, but the `mobile` visible-prop cap now has only 1 prop of headroom.

## Band Updates

Updated `vegetation_presence` bands:

- `metro_grid`: vegetation 26-34
- `coastal_grid`: vegetation 26-34, park vegetation >= 7
- `desert_basin`: vegetation 5-8, trees fixed at 0
- `mountain_valley`: vegetation 28-38, park vegetation >= 7 when a park zone exists
- `prairie_town`: vegetation 32-44, park vegetation >= 7
- `river_town`: vegetation 26-34

Core test exact-count assertions now match the representative counts above.

## Verification

`pnpm build:core` - PASS

Tail:

```txt
$ pnpm --dir packages/core build
$ tsc -p tsconfig.json
```

`pnpm test:core` - PASS

Tail:

```txt
Test Files  22 passed (22)
Tests       119 passed (119)
```

`node scripts/verify-generated-district-parity.mjs` - PASS

Tail:

```txt
PASS  first-viewport composition >= 0.60 (0.688)
PASS  empty board ratio <= 0.10 (0)
PASS  no scene hard blockers
curated Riverside reference: pad fill mean 0.993, desktop lower frame 0.194
```

`node scripts/verify-archetype-identity-sweep.mjs` - PASS

Tail:

```txt
Vegetation presence - representative E2 bands:
  metro_grid      trees 23 [22-28]    bushes  6 [5-8]      veg 29 [26-34]     park 0
  coastal_grid    trees 26 [24-30]    bushes  2 [2-5]      veg 28 [26-34]     park 7
  desert_basin    trees  0 [0-0]      bushes  5 [5-8]      veg  5 [5-8]       park 0
  mountain_valley trees 29 [24-34]    bushes  4 [3-6]      veg 33 [28-38]     park 0
  prairie_town    trees 29 [28-40]    bushes  4 [3-6]      veg 33 [32-44]     park 10
  river_town      trees 23 [22-30]    bushes  4 [3-6]      veg 27 [26-34]     park 0

PASS  structural_full_index - all counties pass
PASS  vegetation_presence - all representative bands pass
ALL GATES PASS
```

Full-index prop/window scan - PASS

Tail:

```json
{
  "checkedCounties": 3222,
  "maxSceneProps": { "countySlug": "orange-vt", "archetype": "mountain_valley", "props": 65 },
  "globalWorstVisibleProps": { "cameraId": "mobile", "countySlug": "dallas-al", "archetype": "metro_grid", "sceneProps": 53, "props": 35, "weight": 730 },
  "globalWorstVisibleWeight": { "cameraId": "mobile", "countySlug": "lake-mn", "archetype": "metro_grid", "sceneProps": 50, "props": 33, "weight": 782 },
  "caps": { "sceneProps": 90, "visibleProps": 36, "visibleWeight": 1200 },
  "failures": 0,
  "ok": true
}
```

## Risks / Honest Read

- Density targets are met without touching desert, but the full-index mobile visible-prop worst is now 35/36. Further visible vegetation should require either a placement retune or a deliberate budget decision.
- The parity verifier stayed green, including composition and empty-board, but screenshots remain the reviewer-run proof for whether the added grammar reads dense enough against `assets/reference/atlas-voxel-town-north-star.png`.
- Graphics was not run locally per packet; estimate is 968, under the requested 1250 review threshold.
