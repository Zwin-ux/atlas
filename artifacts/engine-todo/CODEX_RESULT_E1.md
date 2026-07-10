# Packet 1 Result - E1 + E9

## Root Cause

Seven arid Texas counties matched `river_town` only through the seed modulo fallback. Their resolved climate was `arid`, so `bonusZoneFor(...)` stripped the water bonus zone into a dry plaza. The `river_boathouse` landmark then looked for a `water_edge` host, found no water zone, returned `null`, and the compiled scene had zero water tiles and no `gen-landmark-*` building.

Previously broken slugs:

- `andrews-tx`
- `brewster-tx`
- `gaines-tx`
- `garza-tx`
- `scurry-tx`
- `stonewall-tx`
- `sutton-tx`

## Fix Mechanism

- Added water-dependent archetype awareness in `cityWorldCountyParameters.ts`.
- Kept non-arid selection order seed-stable.
- Rerouted arid water-dependent matches to `desert_basin`, which matches the actual climate envelope and uses the highest-block landmark host.
- Added a belt-and-braces guard in `cityWorldGeneratedDistrictArchetypes.ts`: water-dependent archetypes cannot strip water because of aridity, and they normalize back to a water-edge bonus zone if their fallback zone is somehow not water.
- Promoted `verify-archetype-identity-sweep.mjs` from classification-only coverage to one full-index compile loop with structural assertions.

## Archetype Distribution

Before:

| Archetype | Count |
|---|---:|
| metro_grid | 1323 |
| coastal_grid | 703 |
| desert_basin | 77 |
| mountain_valley | 277 |
| prairie_town | 608 |
| river_town | 234 |

After:

| Archetype | Count |
|---|---:|
| metro_grid | 1323 |
| coastal_grid | 703 |
| desert_basin | 84 |
| mountain_valley | 277 |
| prairie_town | 608 |
| river_town | 227 |

Moved counties: 7, all from `river_town` to `desert_basin`.

## Previously Broken Slugs - New State

| Slug | New archetype | Aridity | Water tiles | Landmark | Host cell | Buildings | Places |
|---|---|---|---:|---|---|---:|---:|
| `andrews-tx` | `desert_basin` | `arid` | 0 | `desert_mesa_tower` | `highest_block_corner` | 23 | 7 |
| `brewster-tx` | `desert_basin` | `arid` | 0 | `desert_mesa_tower` | `highest_block_corner` | 23 | 6 |
| `gaines-tx` | `desert_basin` | `arid` | 0 | `desert_mesa_tower` | `highest_block_corner` | 15 | 7 |
| `garza-tx` | `desert_basin` | `arid` | 0 | `desert_mesa_tower` | `highest_block_corner` | 18 | 7 |
| `scurry-tx` | `desert_basin` | `arid` | 0 | `desert_mesa_tower` | `highest_block_corner` | 19 | 7 |
| `stonewall-tx` | `desert_basin` | `arid` | 0 | `desert_mesa_tower` | `highest_block_corner` | 24 | 6 |
| `sutton-tx` | `desert_basin` | `arid` | 0 | `desert_mesa_tower` | `highest_block_corner` | 20 | 7 |

## Test Evidence

- Added deterministic regression coverage for all seven E1 slugs.
- Added sampled water-archetype coverage that asserts `coastal_grid` / `river_town` samples have water terrain and a generated landmark.
- Extended the archetype identity sweep structural gate across all 3,222 counties:
  - no compile throw
  - `buildings.length > 0`
  - `places.length > 0`
  - `gen-landmark-*` building exists
  - all building positions and dimensions are finite
  - `coastal_grid` and `river_town` have more than zero water terrain tiles

## CAN-Run Tails

`pnpm build:core`

```txt
$ pnpm --dir packages/core build
$ tsc -p tsconfig.json
```

`pnpm test:core`

```txt
Test Files  22 passed (22)
Tests       118 passed (118)
```

`node scripts/verify-generated-district-parity.mjs`

```txt
PASS  regional palette distinctness >= 0.16 (min 0.16)
PASS  per-archetype home clone pressure <= 0.30 (max 0.3)
PASS  no scene hard blockers
curated Riverside reference: pad fill mean 0.993, desktop lower frame 0.194
```

`node scripts/verify-archetype-identity-sweep.mjs`

```txt
Index coverage - 3222 counties classified:
  metro_grid       1323
  coastal_grid      703
  desert_basin       84
  mountain_valley   277
  prairie_town      608
  river_town        227
Structural full-index compile - 3222 counties: mean 10.86ms/county, 0 failures
PASS  structural_full_index - all counties compile with buildings, places, landmarks, finite buildings, and water for water archetypes  [all counties pass]
ALL GATES PASS
```

`git diff --check -- <touched files>`

```txt
exit 0; only CRLF-normalization warnings from Git
```

`git diff --quiet -- packages/core/src/voxel/riversideDemoScene.ts`

```txt
riversideDemoScene.ts clean
```

## Reviewer-Run

- `pnpm build:web`
- `pnpm verify:emulator:audit`
- `pnpm verify:emulator:perf`

## Risks

- The parameter-spine fix intentionally changes the full-index distribution by exactly seven counties. This is expected and bounded.
- The structural sweep now compiles all 3,222 counties, so the verifier runtime is materially higher than the old classification-only sweep. Measured local run: about 38 seconds wall time, with structural mean 10.86ms/county.
- The generator-level `water_edge` host fallback itself was not edited because the requested scope prohibited touching `cityWorldParametricGenerator.ts`; the promoted sweep now catches any future no-landmark regression at index scale.
