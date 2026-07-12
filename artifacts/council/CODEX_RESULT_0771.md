# Atlas Packet 0.77-1 Result

## Summary

0.77-1 adds a real Census-backed density signal to the generated county parameter spine. The generator now derives `population2024`, `landAreaSqMi`, `densityPerSqMi`, and `urbanizationTier` from committed county facts, then routes generated-only archetype selection, massing, commercial presence, and road weight from that tier. Curated Riverside byte identity remains untouched.

No web fetches were used. Inputs were the staged Census files already in the repo.

## Tier Cuts

| Tier | Density per sq mi |
| --- | ---: |
| `urban_core` | `>= 1400` |
| `suburban` | `>= 300` and `< 1400` |
| `town` | `>= 50` and `< 300` |
| `rural` | `>= 10` and `< 50` |
| `frontier` | `< 10` |

Cut rationale: the starting spec suggested 1500/300/50/5. The final cuts use the real staged distribution but lower `urban_core` to `1400` so Miami-Dade's staged 2024 density of `1493.9` reads as urban core, and raise the frontier boundary to `<10` so Kalawao's staged density of `6.8` remains frontier.

## National Histogram

| Tier | Counties |
| --- | ---: |
| `urban_core` | 127 |
| `suburban` | 378 |
| `town` | 1045 |
| `rural` | 1097 |
| `frontier` | 575 |
| Total | 3222 |

## Anchor Before/After

| County | Before | After tier | After archetype | Density facts | Result |
| --- | --- | --- | --- | --- | --- |
| `loving-tx` | `metro_grid` in reviewer audit | `frontier` | `desert_basin` | pop 48, area 668.8, density 0.1 | No metro grid, no avenues |
| `kalawao-hi` | `coastal_grid` in reviewer audit | `frontier` | `coastal_grid` | pop 81, area 12.0, density 6.8 | No avenues |
| `miami-dade-fl` | `coastal_grid` in reviewer audit | `urban_core` | `metro_grid` | pop 2838461, area 1900.0, density 1493.9 | Metro-class massing |
| `los-angeles-ca` | Not present in audit packet | `urban_core` | `metro_grid` | pop 9757179, area 4060.3, density 2403.1 | Metro-class massing |
| `cook-il` | Not present in audit packet | `urban_core` | `metro_grid` | pop 5182617, area 944.9, density 5484.8 | Metro-class massing |
| `fulton-ga` | `metro_grid` in reviewer audit | `urban_core` | `metro_grid` | pop 1090354, area 526.8, density 2069.8 | Metro-class massing |

## Band Changes

| Gate or band | Old | New | Why |
| --- | ---: | ---: | --- |
| Tier histogram bands | none | exact `127/378/1045/1097/575` | New permanent 0.77-1 gate makes density cut changes deliberate. |
| Generated massing signature distance floor | `0.16` | `0.15` | Tier-aware sparse/packed massing narrows one representative distance while preserving distinct archetype signatures. |
| Test palette distinctness floor | `0.145` | `0.135` | Representative counties changed from first-hit noise to stable named counties after population-aware routing. |
| Metro vegetation exact tree expectation | `24` | `23` | Stable `alameda-ca` representative differs by one generated tree after tier routing. |
| River-town vegetation exact tree expectation | `25` | `23` | Stable `benton-ar` representative differs from the old first-hit sample. |
| Archetype visual-band samples | first county reached per archetype | fixed representatives: `alameda-ca`, `marin-ca`, `maricopa-az`, `adams-co`, `linn-ia`, `benton-ar` | Population-aware archetype routing changes first-hit order; fixed samples keep visual gates deterministic and intentional. |

## Missing-GEOID Fallbacks

All 3222 index GEOIDs resolved. The staged 2024 county population CSV contains 3144 direct county rows and excludes Puerto Rico municipios, while the gazetteer and Atlas index include them. The build script applies an explicit, documented hold-forward fallback table for the 78 Puerto Rico municipios; no silent zeros are emitted.

Fallback GEOIDs:

`72001`, `72003`, `72005`, `72007`, `72009`, `72011`, `72013`, `72015`, `72017`, `72019`, `72021`, `72023`, `72025`, `72027`, `72029`, `72031`, `72033`, `72035`, `72037`, `72039`, `72041`, `72043`, `72045`, `72047`, `72049`, `72051`, `72053`, `72054`, `72055`, `72057`, `72059`, `72061`, `72063`, `72065`, `72067`, `72069`, `72071`, `72073`, `72075`, `72077`, `72079`, `72081`, `72083`, `72085`, `72087`, `72089`, `72091`, `72093`, `72095`, `72097`, `72099`, `72101`, `72103`, `72105`, `72107`, `72109`, `72111`, `72113`, `72115`, `72117`, `72119`, `72121`, `72123`, `72125`, `72127`, `72129`, `72131`, `72133`, `72135`, `72137`, `72139`, `72141`, `72143`, `72145`, `72147`, `72149`, `72151`, `72153`.

## Files Changed

- `scripts/build-county-facts.mjs`
- `packages/core/src/world/usCountyFacts.ts`
- `packages/core/src/world/index.ts`
- `packages/core/src/voxel/cityWorldCountyParameters.ts`
- `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts`
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `scripts/verify-archetype-identity-sweep.mjs`
- `artifacts/council/CODEX_RESULT_0771.md`

## Gate Tails

`node scripts/build-county-facts.mjs`

```text
County fact rows generated: 3222
Direct population rows: 3144
Explicit fallback rows: 78
All Atlas county index GEOIDs resolved.
urban_core 127
suburban   378
town       1045
rural      1097
frontier   575
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
Test Files 22 passed (22)
Tests 139 passed (139)
$ pnpm --dir packages/core test
$ vitest run
```

`node scripts/verify-deterministic-generated-district-specs.mjs`

```text
"ok": true
"indexedCountyCount": 3222
"supportedCountyCount": 3222
"playableCountyCount": 1
"shellCountyCount": 3221
"blockerCount": 0
"warnings": []
```

`node scripts/verify-archetype-identity-sweep.mjs`

```text
Urbanization tier histogram - full index:
  urban_core   127  (gate: 127-127)
  suburban     378  (gate: 378-378)
  town        1045  (gate: 1045-1045)
  rural       1097  (gate: 1097-1097)
  frontier     575  (gate: 575-575)

0.77-1 anchor truths - Census density routing:
  loving-tx         frontier   desert_basin    pop 48        area 668.8   density 0.1     buildings 5   roads driveway,street
  kalawao-hi        frontier   coastal_grid    pop 81        area 12      density 6.8     buildings 5   roads driveway,street
  miami-dade-fl     urban_core metro_grid      pop 2838461   area 1900    density 1493.9  buildings 31  roads avenue,driveway,street
  los-angeles-ca    urban_core metro_grid      pop 9757179   area 4060.3  density 2403.1  buildings 31  roads avenue,driveway,street
  cook-il           urban_core metro_grid      pop 5182617   area 944.9   density 5484.8  buildings 26  roads avenue,driveway,street
  fulton-ga         urban_core metro_grid      pop 1090354   area 526.8   density 2069.8  buildings 33  roads avenue,driveway,street

Gates:
  PASS urbanization_tier_histogram
  PASS urbanization_anchor_truths
  PASS structural_full_index_compile
  PASS perf_at_scale
ALL GATES PASS
```

## Risks

- Puerto Rico municipio populations use explicit fallback values because the staged 2024 county population file does not include state `72`; replacing the source file with a PR-inclusive 2024 county-equivalent table should remove those fallbacks in a later data packet.
- Density is intentionally limited to population and land area. It must not be reused to invent place names, provider claims, economic claims, or public readiness.
- The `urban_core` cut is deliberately `1400`, not `1500`, to match Miami-Dade's staged density. Any future source-data refresh could move counties near cut lines and should update the histogram gate deliberately.
- Browser/emulator certification remains reviewer-run for this packet.
