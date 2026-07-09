# 0.76-2 Region-Aware Landmarks - Codex Result

Status: local-green implementation complete, left uncommitted.

## Slice Contract

Player-facing promise: each generated USA archetype now gets a readable, region-appropriate signature landmark instead of the same universal water tower.

Engineering promise: landmark choice reads the 0.76-P `CountyGenerationParameters` spine and expresses identity through building massing, roof shape, facade style, height, and host-cell placement. Props remain accents from the existing vocabulary only.

Axis: `usa_region_quality_landmarks`.

Contract: no new dependencies, no Three.js, no new prop kinds, no MCP tool changes, no renderer seam changes, no curated Riverside edits, forbidden props still blocked, `maxPropCommands` still 90.

Metric/verifier: `scripts/verify-archetype-identity-sweep.mjs` now asserts one expected landmark per archetype, parameter-spine selection, and distinct landmark silhouettes across archetypes. `pnpm test:core` includes a deterministic landmark-per-archetype test.

Stop condition: 0.76-2 stops after local-green code, docs, and reviewer handoff. Browser/esbuild gates remain reviewer-run in this sandbox.

## Landmark Massing

| Archetype | Signature | Host cell | Massing read | Why it fits |
| --- | --- | --- | --- | --- |
| `coastal_grid` | low pier hall | water edge | `hip` roof, `strip_store` facade, long low hall | Reads as a waterfront pier building. Existing `dock` and `boat` props reinforce the shoreline without adding prop vocabulary. |
| `river_town` | boathouse / bridge-abutment hall | water edge | `gable` roof, `storefront` facade, compact low hall | Reads as a riverside utility building near the water band. Existing `dock` and `boat` props carry the river edge. |
| `desert_basin` | mesa tower | highest block corner | `tower` roof shape, `civic` facade, tall narrow mass | Keeps the old water-tower read only where it belongs: a desert mesa marker. Existing `water_tower` prop is an accent, not the whole landmark. |
| `mountain_valley` | ridge lodge | ridge / high ground | steep `gable` roof, `civic` facade, broad lodge mass | Reads through roof pitch and ridge placement. Existing `tree` props create the small lodge cluster. |
| `prairie_town` | grain-elevator tower | ag block | `tower` roof shape, `civic` facade, narrow vertical elevator mass | Places the vertical read in the agricultural/commercial edge instead of the civic core. Existing `water_tower` prop works as a small utility accent. |
| `metro_grid` | civic tower | civic core | `tower` roof shape, `civic` facade, compact vertical civic mass | Metro keeps the vertical civic marker, but it is now archetype-specific instead of universal. |

## Parameter Spine Read

`createDeterministicGeneratedDistrictSpec` now carries the resolved `CountyGenerationParameters` into `CityWorldParametricSpec`. The generator calls `expectedGeneratedLandmarkKind(parameters)`, so landmark selection reads the spine, not a re-derived archetype string.

Primary selection uses `parameters.archetype`. `generatedLandmarkMassing` then biases the same signature envelope from `nameSignal`, `regionProfile`, `climate`, and `modulation`:

- `port` / `harbor` / `bay` can make coastal massing read as a waterfront pier hall.
- `lake` / `bay` / `beach` bias water-facing coastal language.
- `falls` / `river` bias river boathouse width and label.
- `mount` / `mountain`, `snowRoofAllowed`, and roof-pitch bias sharpen the ridge lodge.
- `mesa`, desert climate, dry climate, and sun exposure bias the desert tower.
- plains/prairie region and wind exposure bias the grain-elevator tower.
- metro density biases the civic tower without changing the renderer contract.

The deterministic test includes `bay-fl` and verifies the generated coastal landmark label resolves to `Waterfront pier hall` through `nameSignal`.

## Host-Cell Logic

Water signatures prefer a water-edge zone (`water-edge` / water zone). The mountain lodge and desert mesa tower choose high non-water, non-park corners from the elevation model. The prairie grain elevator prefers the generated ag/commercial edge (`east-commons`, then `south-commerce`, then any commercial zone). The metro civic tower anchors to the civic core.

Every landmark gets a tagged lot, a tagged building, and a landmark place record. The HUD default selection now points at that landmark place when present, making the signature easy to inspect in generated county previews.

## Graphics Cost Estimate

The implementation adds one landmark lot, one landmark building, and one landmark place per generated scene, plus zero to three accent props depending on archetype. The worst extra renderer load is therefore a small constant number of existing command families.

Conservative estimate: under 35 additional `Graphics`-backed draw groups for the largest signature, keeping the known worst window below `838 + 35 = 873`, comfortably under the `1600` ceiling. The actual browser/widget performance gate is sandbox-blocked here and remains reviewer-run.

## Prop Counts

From `node scripts/verify-archetype-identity-sweep.mjs`:

| Archetype | Prop count |
| --- | ---: |
| `metro_grid` | 35 |
| `coastal_grid` | 35 |
| `desert_basin` | 31 |
| `mountain_valley` | 33 |
| `prairie_town` | 31 |
| `river_town` | 35 |

All are below the fixed `maxPropCommands` cap of 90.

## Local Evidence

Can-run gates:

- `pnpm typecheck:starter` - exit 0.
- `pnpm test:core` - exit 0, 22 files passed, 115 tests passed.
- `node scripts/verify-generated-district-parity.mjs` - exit 0. Tail: pad floor `0.492`, pad mean `0.716`, contact `1`, composition `0.688`, mobile lower frame `0.102`, regional palette distinctness min `0.161`, home clone pressure max `0.175`, all detection proofs passed.
- `node scripts/verify-archetype-identity-sweep.mjs` - exit 0. Tail: 3222 counties checked, mean `4.76ms/county`, failures `0`; gates `coverage_all_archetypes`, `zone_presence`, `palette_distinctness`, `density_variation`, `roofline_variation`, `prop_count_cap`, `forbidden_props`, `landmark_presence`, and `landmark_silhouette_distinctness` all PASS.

Landmark readout tail:

```text
metro_grid      metro_civic_tower       civic_core           tower/civic        massing 2.28x2.04x4.12     props 35  accent none
coastal_grid    coastal_pier_hall       water_edge           hip/strip_store    massing 4.7x1.34x1.14      props 35  accent dock,boat
desert_basin    desert_mesa_tower       highest_block_corner tower/civic        massing 1.16x1.18x3.84     props 31  accent water_tower
mountain_valley mountain_ridge_lodge    ridge                gable/civic        massing 4.18x2.24x2.11     props 33  accent tree
prairie_town    prairie_grain_elevator  ag_block             tower/civic        massing 1.18x1.76x3.56     props 31  accent water_tower
river_town      river_boathouse         water_edge           gable/storefront   massing 3.25x1.58x1.34     props 35  accent dock,boat
```

Curated Riverside confirmation: `packages/core/src/voxel/riversideDemoScene.ts` was not touched. `git diff --exit-code -- packages/core/src/voxel/riversideDemoScene.ts` returned exit 0.

## Reviewer-Run Gates

Sandbox-blocked / reviewer-run:

- `pnpm build:web`
- `node scripts/verify-generated-district-widget.mjs`
- `node scripts/verify-widget-performance.mjs`
- Browser and screenshot verifiers
- Reviewer screenshot read: one county per archetype, judging whether the landmark silhouette reads without labels or new props

## Files Touched

- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/src/voxel/cityWorldGeneratedDistrict.ts`
- `packages/core/src/voxel/index.ts`
- `packages/core/src/index.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `scripts/verify-archetype-identity-sweep.mjs`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `artifacts/0.76-2-landmarks/CODEX_RESULT.md`

## Risks

- The browser/widget performance number is estimated locally from command shape; the actual widget performance verifier is reviewer-run because this sandbox blocks the web build/browser path.
- Water archetypes rely on existing shoreline `dock` and `boat` props rather than adding new place-scoped prop kinds. This keeps vocabulary fixed but means the landmark read must come primarily from massing.
- The generator now lowers non-metro civic-core massing so the universal tower no longer leaks across archetypes. Parity and identity gates are green, but screenshot review should still judge whether the civic center remains legible enough outside metro counties.

## NS-6 Read

Before 0.76-2: about `6.2/10` for national archetype identity. The parameter spine and regional palettes were present, but the universal water tower and repeated civic tower weakened silhouette truth.

After 0.76-2: about `6.8/10`. The six archetypes now have distinct structural landmarks and verifier-backed silhouette separation. It still is not a curated-art bar; 0.76-3 needs stronger massing and zone variants, and screenshot review needs to confirm the landmarks read at real widget scale.
