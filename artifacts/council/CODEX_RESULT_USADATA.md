# Atlas Packet USA-DATA Result

## Summary

This packet expands the committed Census-backed county facts without changing
generation routing. `US_COUNTY_FACTS` now appends `waterAreaSqMi` and
`waterFraction` to each county fact row:

`[geoid, population2024, landAreaSqMi, waterAreaSqMi, waterFraction]`

Existing density behavior remains on the original population and land-area
tuple slots. No network fetches were run. No `voxel/`, `server/`, `web/`, or
package metadata files were edited.

## Water Fraction Histogram

| Bin | Counties |
| --- | ---: |
| `dry_0` | 117 |
| `trace_lt_0_01` | 1278 |
| `low_0_01_to_0_05` | 1231 |
| `moderate_0_05_to_0_15` | 284 |
| `high_0_15_to_0_40` | 174 |
| `very_high_gte_0_40` | 138 |
| Total | 3222 |

## Spot Truths

| County | GEOID | Land sq mi | Water sq mi | Water fraction | Result |
| --- | --- | ---: | ---: | ---: | --- |
| `kalawao-hi` | `15005` | 12.0 | 40.8 | 0.773 | High water fraction confirmed. |
| `loving-tx` | `48301` | 668.8 | 7.7 | 0.011 | Near-zero water fraction confirmed. |
| `aleutians-east-borough-ak` | `02013` | 6986.3 | 8029.9 | 0.535 | Very high water fraction confirmed. |

## Inventory Summary

`docs/COUNTY_DATA_INVENTORY.md` catalogs the public county data spine:

| Status | Count |
| --- | ---: |
| STAGED | 2 |
| RECOMMENDED | 6 |
| REJECTED | 1 |

Staged now:

- Census 2024 county gazetteer: identity, land area, water area, centroids.
- Census 2024 PEP county population estimates: 3,144 direct county rows plus
  explicit Puerto Rico municipio fallback rows.

Recommended later:

- TIGER/Line water/coastline flags.
- USGS 3DEP elevation.
- NLCD land-cover proportions.
- Census place names within county.
- County seat names through an audited public source.
- NOAA 1991-2020 climate normals.

Rejected for the current scene spine:

- FCC Broadband Data Collection location-level availability. It does not move
  county-world identity enough to justify claim risk in this packet.

## Files Changed

- `scripts/build-county-facts.mjs`
- `packages/core/src/world/usCountyFacts.ts`
- `packages/core/src/world/index.ts`
- `packages/core/test/us-county-facts.test.ts`
- `docs/COUNTY_DATA_INVENTORY.md`
- `artifacts/council/CODEX_RESULT_USADATA.md`

## Gate Tails

`node scripts/build-county-facts.mjs`

```text
generated rows: 3222
resolved geoids: 3222
water fraction histogram:
  dry_0: 117
  trace_lt_0_01: 1278
  low_0_01_to_0_05: 1231
  moderate_0_05_to_0_15: 284
  high_0_15_to_0_40: 174
  very_high_gte_0_40: 138
```

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
Tests 146 passed (146)
$ pnpm --dir packages/core test
$ vitest run
```

Focused facts check:

```text
pnpm --dir packages/core test test/us-county-facts.test.ts
Test Files 1 passed (1)
Tests 3 passed (3)
```

## Risks

- Puerto Rico municipio population values still use the documented explicit
  fallback table because the staged PEP file excludes state `72` county rows.
  Gazetteer land and water areas are direct staged Census values for those
  municipios.
- Some rows can round `waterAreaSqMi` to `0.0` while keeping a non-zero
  `waterFraction`; the fraction is derived from the raw gazetteer land/water
  values, then rounded to 3 decimals.
- Recommended future datasets need offline staging and GEOID coverage
  verification before they can influence generated parameters.
- `docs/BUILD_LOG.md`, `docs/NEXT_QUESTS.md`, and
  `artifacts/current-update.json` were not updated because the packet fence
  allowed only the files listed above.
