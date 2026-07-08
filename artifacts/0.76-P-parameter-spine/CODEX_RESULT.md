# 0.76-P Parameter Model Spine - Codex Result

Status: implementation complete, local CAN-run gates green, left uncommitted.

## Contract

`resolveCountyParameters(county, seed) -> CountyGenerationParameters` is a pure
function of honest input only: `geoid`, `stateCode`, `name`, `countySlug`,
`centroid`, and deterministic `seed`.

Implemented contract:

```ts
type CountyGenerationParameters = {
  archetype: GeneratedDistrictArchetype;
  archetypeProfile: ArchetypeProfile;
  region: CensusDivision;
  regionProfile: RegionProfile;
  climate: {
    latitudeBand: LatitudeBand;
    aridity: AridityBand;
    aridityScore: number;
    coastalProximity: "coastal" | "near_coastal" | "inland";
    inlandAridProxy: boolean;
    snowRoofAllowed: boolean;
  };
  nameSignal: NameSignal[];
  palette: RegionalPalette;
  seed: number;
  modulation: {
    paletteVariantOffset: 0 | 1 | 2;
    densityScale: number;
    reliefScale: number;
    heightBias: number;
    civicElevationBoost: number;
    dryReliefBoost: number;
    vegetationDensity: number;
    waterAffinity: number;
  };
  envelope: {
    coastalAriditySuppressed: boolean;
    snowRoofSuppressed: boolean;
    forbidsCoastalDesert: true;
    forbidsSubtropicalSnowRoof: true;
  };
};
```

`createDeterministicGeneratedDistrictSpec` now resolves parameters first, then
reads `parameters.archetype`, `parameters.palette`, `generatedHeightGrid`,
`generatedZones`, and `generatedRoadSeeds`.

## Config Tables

### STATE_TO_DIVISION

```txt
new_england: CT, ME, MA, NH, RI, VT
middle_atlantic: NJ, NY, PA
east_north_central: IL, IN, MI, OH, WI
west_north_central: IA, KS, MN, MO, ND, NE, SD
south_atlantic: DE, DC, FL, GA, MD, NC, PR, SC, VA, WV
east_south_central: AL, KY, MS, TN
west_south_central: AR, LA, OK, TX
mountain: AZ, CO, ID, MT, NM, NV, UT, WY
pacific: AK, CA, HI, OR, WA
```

Note: PR is mapped into `south_atlantic` as the Atlas 9-division model fallback
for the indexed municipio rows; this does not claim an official Census division
for Puerto Rico.

### REGION_PROFILES

```txt
new_england: offset 1, aridity -0.24, vegetation 0.22, roofPitch 0.18, coastal true
middle_atlantic: offset 2, aridity -0.16, vegetation 0.14, roofPitch 0.10, coastal true
east_north_central: offset 0, aridity -0.10, vegetation 0.12, roofPitch 0.08, coastal false
west_north_central: offset 1, aridity 0.04, vegetation 0.02, roofPitch 0.04, coastal false
south_atlantic: offset 2, aridity -0.02, vegetation 0.08, roofPitch -0.08, coastal true
east_south_central: offset 0, aridity 0.02, vegetation 0.08, roofPitch -0.04, coastal false
west_south_central: offset 1, aridity 0.14, vegetation -0.04, roofPitch -0.08, coastal true
mountain: offset 2, aridity 0.24, vegetation -0.12, roofPitch 0.16, coastal false
pacific: offset 0, aridity 0.04, vegetation 0.10, roofPitch 0.02, coastal true
```

`ARCHETYPE_PROFILES` now holds the six archetype base palettes, height grids,
bonus zones, bonus roads, and palette variant clamps. The clamps keep the
existing `0.16` regional palette floor intact.

### NAME_SIGNAL_TOKENS

```txt
bay: bay
beach: beach, shore
cape: cape
creek: creek
desert: desert, dunes
falls: falls
fort: fort, ft
harbor: harbor, harbour
island: island, isle
lake: lake, lakes
mesa: mesa
mount: mount, mt
mountain: mountain, mountains
port: port
river: river, rivers, rio
springs: spring, springs
valley: valley
```

## Phase A Equality Proof

Baseline from HEAD `df6cf73` before edits:

- `node scripts/verify-generated-district-parity.mjs`: PASS, palette
  distinctness min `0.161`, per-archetype max clone pressure `0.175`.
- `node scripts/verify-archetype-identity-sweep.mjs`: PASS,
  `metro_grid 1323`, `coastal_grid 675`, `desert_basin 105`,
  `mountain_valley 277`, `prairie_town 608`, `river_town 234`, worst pair
  `n/a = 0`, 120-county mean `4.58ms`, 0 failures.

After Phase A resolver plumbing:

- Parity output matched the baseline tails exactly, including every numeric
  parity gate listed above.
- Sweep distribution matched baseline exactly:
  `1323 / 675 / 105 / 277 / 608 / 234`, worst pair `n/a = 0`.
- Only timing changed by wall-clock noise: `4.41ms` mean.

## Phase B Results

Activated bounded modulators:

- region/climate/name/seed -> palette variant offset, density scale, relief
  scale, height bias, civic elevation boost, dry relief boost, vegetation
  density, water affinity.
- Existing spec fields only: `regionalPalette`, `heightGrid`, `zones`,
  `roadSeeds`.
- No renderer seam change, no new geometry system, no provider input.

Distinctness:

- `node scripts/verify-generated-district-parity.mjs`: PASS, palette
  distinctness min `0.161`, max clone pressure `0.175`.
- `node scripts/verify-archetype-identity-sweep.mjs`: PASS, worst Jaccard
  `n/a = 0`, 120-county mean `4.43ms`, 0 failures.
- Phase B sweep distribution:
  `metro_grid 1323`, `coastal_grid 703`, `desert_basin 77`,
  `mountain_valley 277`, `prairie_town 608`, `river_town 234`.

Within-archetype diversity:

- Pair: `bay-fl` and `king-wa`.
- Both resolve `coastal_grid`.
- Differences: region, latitude band, name signal, density scale, relief scale,
  water affinity, vegetation/civic modulation.
- Diversity score: `7` using the core-test metric.

CA classifier fix:

- Before: CA desert count `28/58`; `orange-ca` resolved `desert_basin`.
- After: CA desert count `5/58`.
- Final CA desert list:
  `imperial-ca`, `inyo-ca`, `kern-ca`, `riverside-ca`,
  `san-bernardino-ca`.
- Regression examples:
  `orange-ca`, `los-angeles-ca`, `san-diego-ca`, `ventura-ca`,
  `santa-barbara-ca`, `san-francisco-ca`, `san-mateo-ca`,
  `santa-cruz-ca`, `monterey-ca`, `san-luis-obispo-ca` resolve
  `coastal_grid`.

Envelope constraints:

- Coastal or near-coastal generated counties clamp aridity to `<= 0.5` unless
  the CA inland-arid proxy is true.
- `coastal_grid` may not resolve `arid`.
- `tropical` and `subtropical` counties cannot allow snow roof state.
- Full-index check across 3,222 counties:
  `coastalArid = 0`, `subtropicalSnow = 0`.

## Files Touched

- `packages/core/src/voxel/cityWorldCountyParameters.ts`
- `packages/core/src/voxel/cityWorldGeneratedDistrict.ts`
- `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts`
- `packages/core/src/voxel/cityWorldRegionalPalettes.ts`
- `packages/core/src/voxel/index.ts`
- `packages/core/src/index.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `artifacts/0.76-P-parameter-spine/CODEX_RESULT.md`

## CAN-Run Evidence

- `pnpm build:core`: PASS.
- `pnpm typecheck:starter`: PASS.
- `pnpm test:core`: PASS, 22 files, 114 tests.
- `node scripts/verify-generated-district-parity.mjs`: PASS.
- `node scripts/verify-archetype-identity-sweep.mjs`: PASS.

## Reviewer-Run List

Sandbox blocks esbuild/Chrome gates here. Reviewer should run:

- `pnpm build:web`
- `node scripts/verify-generated-district-widget.mjs`
- `node scripts/verify-widget-performance.mjs`
- browser/screenshot verifiers

Expected graphics impact: Phase B changes parameter values and existing zone
selection, not draw systems. Worst-window Graphics should remain under the
existing 1,600 ceiling, but this still needs reviewer Chrome proof.

## Curated Riverside Confirmation

`packages/core/src/voxel/riversideDemoScene.ts` was not touched and has no git
diff. SHA-256 stayed:

```txt
26BD1F477A244803D6D4B9DD763B69B150E73D1A183DF5C7713C02C9F11AC429
```

Curated props were not touched.

## Risks

- The CA arid-inland classifier is a deterministic centroid/coast-distance
  proxy, not real coastline geometry. It fixes the known coastal SoCal bug and
  stays honest, but it is still a coarse proxy.
- PR uses a `south_atlantic` fallback to keep the model on the requested
  9-division key space.
- Palette variant clamps are now data in `ARCHETYPE_PROFILES` to keep the
  existing distinctness floor from regressing. Later visual packets should
  extend this through authored landmark/massing/terrain config, not loosen the
  floor.
- Browser visual proof is reviewer-run because this sandbox cannot run
  esbuild/Chrome gates.

## Honest NS-6 Before/After

Before 0.76-P: 0.76-1 regional palettes were green, but identity still flowed
mostly through six buckets plus seed jitter; region/climate/name were not a
first-class model, and the CA desert bug contradicted coastal identity.

After 0.76-P: the substrate exists and is verifier-protected. Counties now
resolve a typed parameter object with region, climate, name signal, seed, and
envelope clamps; the CA coastal/desert split is materially more honest.

This does not make generated counties curated-quality yet. NS-6 moves from
"palette-only substrate" to "parameter-spine substrate"; landmarks, massing,
terrain features, and browser visual proof remain for the next packets.
