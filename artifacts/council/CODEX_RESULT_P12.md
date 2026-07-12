# Atlas Packet P1.2 Result

## Summary

P1.2 replaces generated-place identity camouflage with deterministic, honest
common-noun labels and fact-built tray descriptions.

No web fetches were used. No county-seat source exists in the committed Census
inventory, so this packet explicitly rejects fake seat or town names. The
district display label is derived only from the committed Census county `NAME`
pattern: `Mobile County` displays as `Mobile`, `Miami-Dade County` displays as
`Miami-Dade`, and county/equivalent suffix stripping is controlled by a new
committed suffix table.

Generated place labels remain common nouns. They do not use invented local
proper names, provider places, coverage claims, or real-business claims.

## Label Grammar

| Archetype | Place labels | Water-aware labels | Landmark labels |
| --- | --- | --- | --- |
| `metro_grid` | `Block homes`, `City homes`, `Market row`, `Main street shops`, `Civic square`, `Apartment court`, `Walk-up court`, `Service yard`, `Pocket park`, `Public square` | `Waterfront market`, `Landing row`, `Waterfront green`, `Waterfront square` when staged water facts or water affinity justify it | `Courthouse square` |
| `coastal_grid` | `Shore homes`, `Back-shore homes`, `Shore market`, `Waterfront landing`, `Civic overlook`, `Shore flats`, `Shore service`, `Shore green`, `Coastal edge`, `Shore square` | Water table always applies for coastal grammar; labels stay generic, not local proper nouns | `Shore landing`, `Waterfront landing` |
| `desert_basin` | `Basin homes`, `Low desert homes`, `Frontage row`, `Desert market row`, `Civic rise`, `Service yard`, `Scrub common`, `Dry plaza` | none | `Desert water tower`, `Mesa water tower` |
| `mountain_valley` | `Terrace homes`, `Valley homes`, `Valley market`, `Main street shops`, `Ridge civic hall`, `Lodge court`, `Trail service`, `Ridge commons`, `Valley square` | none | `Ridge lodge`, `Valley lodge` |
| `prairie_town` | `Town homes`, `Grid homes`, `Market row`, `Main street shops`, `Civic square`, `Low court`, `Machine yard`, `Field edge`, `Town square` | none | `Grain elevator` |
| `river_town` | `Bank homes`, `River homes`, `Riverfront landing`, `Market row`, `Civic bluff`, `River flats`, `River service`, `River green`, `River channel`, `River square` | River labels always apply for river grammar; labels stay generic, not local proper nouns | `Riverfront landing` |

Tray descriptions are one sentence from generated place role plus staged facts,
for example: `Commerce strip in a frontier desert county.` Banned jargon words
for generated place identity are `alpha`, `tier`, `spec`, `generated`, `draft`,
and `archetype`.

## Sample Counties

| County | District label | Archetype | Density band | Water band | Sample labels | Sample description |
| --- | --- | --- | --- | --- | --- | --- |
| `mobile-al` | `Mobile` | `river_town` | `suburban` | `high` | `Bank homes`, `Riverfront landing`, `River flats`, `River channel` | `Commerce strip in a suburban river county with a lot of mapped water.` |
| `miami-dade-fl` | `Miami-Dade` | `metro_grid` | `urban_core` | `high` | `City homes`, `Block homes`, `Civic square`, `Walk-up court`, `Service yard`, `Water edge`, `Courthouse square` | `Civic block in a dense urban city county with a lot of mapped water.` |
| `loving-tx` | `Loving` | `desert_basin` | `frontier` | `low` | `Basin homes`, `Desert market row`, `Civic rise`, `Desert water tower` | `Commerce strip in a frontier desert county.` |
| `kalawao-hi` | `Kalawao` | `coastal_grid` | `frontier` | `very_high` | `Back-shore homes`, `Civic overlook`, `Waterfront landing`, `Shore green`, `Coastal edge` | `Commerce strip in a frontier coastal county with a lot of mapped water.` |
| `summit-co` | `Summit` | `mountain_valley` | `town` | `low` | `Terrace homes`, `Valley homes`, `Valley market`, `Lodge court`, `Valley lodge` | `Homes in a small-town mountain county.` |
| `cook-il` | `Cook` | `metro_grid` | `urban_core` | `very_high` | `City homes`, `Block homes`, `Civic square`, `Landing row`, `Waterfront market`, `Courthouse square` | `Civic block in a dense urban city county with a lot of mapped water.` |
| `sedgwick-ks` | `Sedgwick` | `prairie_town` | `suburban` | `low` | `Grid homes`, `Market row`, `Low court`, `Field edge`, `Grain elevator` | `Commerce strip in a suburban prairie county.` |
| `honolulu-hi` | `Honolulu` | `metro_grid` | `urban_core` | `very_high` | `City homes`, `Block homes`, `Civic square`, `Walk-up court`, `Service yard`, `Water edge`, `Courthouse square` | `Homes in a dense urban city county with a lot of mapped water.` |

## Band Changes

| Gate or band | Old | New | Why |
| --- | --- | --- | --- |
| P1.2 place identity sweep | none | full-index deterministic label and banned-jargon gate across `3,222` counties | New permanent gate for honest generated place identity. |
| District display-name source | `<County> Generated District` display copy | Census `NAME` suffix-derived label, such as `Mobile` from `Mobile County` | Anchors display identity to committed county names without inventing a seat or town. |
| County water facts in generator parameters | population, land area, density only | adds staged water area, water fraction, and water band | Lets labels and descriptions use committed water facts without provider geometry. |
| Urbanization histogram bands | `127/378/1045/1097/575` | unchanged | Label work did not retune density routing. |
| Existing visual bands | prior 0.77-2 floors | unchanged | No visual thresholds were loosened for this packet. |

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
Test Files 23 passed (23)
Tests 148 passed (148)
```

`node scripts\verify-deterministic-generated-district-specs.mjs`

```text
"ok": true
"indexedCountyCount": 3222
"supportedCountyCount": 3222
"playableCountyCount": 1
"shellCountyCount": 3221
"blockerCount": 0
"warnings": []
```

`node scripts\verify-archetype-identity-sweep.mjs`

```text
P1.2 honest place identity - full-index deterministic label sweep:
  checked 3222 counties; failures 0; banned words alpha, tier, spec, generated, draft, archetype

Gates:
  PASS  p12_place_identity_labels - P1.2 generated place labels are deterministic full-index and free of banned jargon  [3222 counties pass]
  PASS  structural_full_index - all counties compile with buildings, places, landmarks, finite buildings, and water bands for water archetypes  [all counties pass]
  PASS  perf_at_scale - mean generation <= 20ms, 0 budget failures  [10.43ms, 0 failures]

ALL GATES PASS
```

## Files Changed

- `packages/core/src/voxel/cityWorldCountyParameters.ts`
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `scripts/verify-archetype-identity-sweep.mjs`
- `artifacts/council/CODEX_RESULT_P12.md`

## Risks

- County seats remain unstaged. The district display label is a county-name
  anchor, not a seat claim.
- Common-noun place labels describe generated roles only. They are not real
  businesses, real civic assets, or public-playable coverage.
- Water language comes from staged Census water area bands and generated
  archetype grammar, not hydrography geometry or coastline joins.
- `Courthouse square` is limited to the civic landmark grammar. It should not
  be reused as a claim that a real courthouse has been placed.
