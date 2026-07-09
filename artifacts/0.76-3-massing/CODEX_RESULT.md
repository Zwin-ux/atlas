# 0.76-3 Massing & Zone Variants - CODEX_RESULT

Status: implementation complete, uncommitted, scoped to the packet.

HEAD prerequisite observed: `200a2f4` (`0.76-2 landmarks` committed).

## Packet Scope

Implemented only the 0.76-3 massing/layout packet:
- archetype-specific `generatedZones` and `generatedRoadSeeds`
- modulation/profile-driven massing in the parametric generator
- new deterministic core massing-variation test
- new identity-sweep massing/layout gate
- required build log, next quest pointer, and this result artifact

No MCP tools, renderer seams, curated Riverside files, split guard, loop log,
`artifacts/current-update.json`, `docs/0.75R_HANDOFF.md`, clay-board files,
or thread/worker orchestration were touched by this packet.

## Archetype Layout And Massing

| Archetype | Layout and street grammar | Massing read |
| --- | --- | --- |
| `metro_grid` | Tight orthogonal block grid, close avenue/street spacing, civic core, apartment core, south rowhomes, pocket plaza. | Highest density sample: 30 non-landmark buildings, mean height `1.58`, max `3.58`, compact footprint mean `2.46`, apartment ratio `0.13`. Metro mobile visible props were capped by converting the pocket park to a plaza. |
| `desert_basin` | Low wide sprawl around a broad frontage road, dry plaza, mesa civic, sparse arterial/service grammar. | Low and wide: 28 buildings, mean height `0.99`, max `1.95`, widest mean footprint `4.05`, no apartments, road length `125`. |
| `coastal_grid` | Shoreline road fronting the water edge, waterfront strip, back-shore homes, stepback homes, compact coastal grid. | Waterfront strip with moderate mass: 29 buildings, mean height `1.20`, max `3.03`, water-lot ratio `0.03`, linearity `1.26`. |
| `mountain_valley` | Contour-like terrace roads, ridge civic, mid/lower terrace homes, valley main street. | Terraced and taller: 17 buildings, mean height `1.65`, max `3.65`, largest footprint mean `4.29`, elevation spread `0.50`. |
| `prairie_town` | Wide low town grid, long straight section roads, east commons/ag edge, low court. | Low grid: 18 buildings, mean height `1.06`, road length `208`, footprint mean `3.48`, low apartment ratio `0.06`. |
| `river_town` | Linear town along the river edge, north/south main strips, dock district, river plaza, parallel river road. | Narrow linear fabric: 16 buildings, mean height `1.26`, shop ratio `0.31`, water-lot ratio `0.06`, road length `152`. |

## Parameter Spine Use

The implementation reads `resolveCountyParameters(...).archetypeProfile` and
`resolveCountyParameters(...).modulation` carried on `CityWorldParametricSpec`.
It uses:
- `ARCHETYPE_PROFILES` for selected archetype, base bonus zone/road, height
  profile, and palette source.
- `densityScale` to scale zone densities.
- `heightBias` to bias generated building heights.
- `reliefScale` and `civicElevationBoost` to lift mountain/desert civic and
  terrace reads.
- `vegetationDensity` to open/close green gaps without adding renderer props.
- `waterAffinity` to bias coastal/river water-edge layout.

The massing code does not reclassify counties from the archetype string or
county name. It reads the already-resolved profile/modulation spine.

## Graphics Worst-Window Estimate

The reviewer-run Chrome/Graphics gate is still authoritative. The estimate
below is a conservative local proxy from scene-window weight, visible building
commands, visible prop commands, and non-landmark building count. Target:
max `<= 1400`; packet ceiling: do not approach `1600`.

| Archetype | Sample county | Worst window | Visible weight | Building cmds | Prop cmds | Estimated Graphics |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| `metro_grid` | `autauga-al` | mobile | `723` | `29` | `14` | `1127` |
| `coastal_grid` | `aleutians-east-borough-ak` | mobile | `691` | `24` | `17` | `1102` |
| `desert_basin` | `apache-az` | mobile | `659` | `20` | `10` | `1046` |
| `mountain_valley` | `adams-co` | mobile | `579` | `9` | `9` | `888` |
| `prairie_town` | `adair-ia` | mobile | `540` | `17` | `7` | `855` |
| `river_town` | `butler-al` | mobile | `544` | `12` | `12` | `858` |

Max estimate: `1127` (`metro_grid`), under the `1400` target.

## Parity Tails Per Archetype

| Archetype | Composition | Contact | Clone | Empty board | Unsafe roofs |
| --- | ---: | ---: | ---: | ---: | ---: |
| `metro_grid` | `0.701` | `1.000` | `0.280` | `0.033` | `0` |
| `coastal_grid` | `0.775` | `1.000` | `0.208` | `0.058` | `0` |
| `desert_basin` | `0.727` | `1.000` | `0.200` | `0.069` | `0` |
| `mountain_valley` | `0.675` | `1.000` | `0.182` | `0.020` | `0` |
| `prairie_town` | `0.631` | `1.000` | `0.188` | `0.035` | `0` |
| `river_town` | `0.637` | `1.000` | `0.300` | `0.031` | `0` |

The existing parity verifier also passed the canonical generated sample:
composition `0.688`, contact `1`, clone `0.105`, empty board `0`, unsafe roofs
`0`, mobile lower frame `0.102`.

## Massing-Variation Metric

Added `analyzeGeneratedDistrictMassingSignature(scene)` and
`generatedDistrictMassingSignatureDistance(a, b)`.

The signature excludes `gen-landmark-*` buildings so the 0.76-2 landmark work
cannot satisfy the 0.76-3 gate. It compares:
- building and lot counts
- road count and total road length
- mean/max building height
- footprint mean/stddev
- high-rise, apartment, shop, civic, water-lot ratios
- built span, linearity, and elevation spread

Gate floor: `GENERATED_MASSING_SIGNATURE_DISTANCE_FLOOR = 0.16`.

Identity sweep result:
- Closest pair: `coastal_grid ~ desert_basin = 0.17`
- Gate: PASS

## Rebuild Estimate

`node scripts/verify-archetype-identity-sweep.mjs` sampled 120 counties at
`14.48ms/county`, with `0` budget failures. Scene-window worst weights stayed
under the generated draft budget (`maxVisibleBudgetWeight 1200`); metro mobile
was the heaviest local window at weight `723`.

## Files Touched

Every file changed by this packet:

- `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts` - added six
  archetype-specific zone and road layouts wired to profile/modulation data.
- `packages/core/src/voxel/cityWorldParametricGenerator.ts` - added
  profile-driven density/height/footprint/template massing, generated camera
  focus scoring, and non-landmark massing signature analysis.
- `packages/core/src/voxel/index.ts` - exported the massing signature contract
  for scripts/tests.
- `packages/core/src/index.ts` - re-exported the massing signature contract
  from the package entrypoint.
- `packages/core/test/city-world-generated-district.test.ts` - added the
  deterministic 0.76-3 massing/layout variation core test.
- `scripts/verify-archetype-identity-sweep.mjs` - added the
  `massing_layout_distinctness` gate and JSON/readout surface.
- `docs/BUILD_LOG.md` - recorded Entry 219 for this packet.
- `docs/NEXT_QUESTS.md` - advanced the 0.76 queue from 0.76-3 to 0.76-4.
- `artifacts/0.76-3-massing/CODEX_RESULT.md` - this required result artifact.

## CAN-Run Evidence

All allowed gates were run, one command per exit code:

- `pnpm typecheck:starter` - exit `0`
  - built core and geo; server/web TypeScript checks passed.
- `pnpm test:core` - exit `0`
  - 22 test files passed, 116 tests passed.
- `node scripts/verify-generated-district-parity.mjs` - exit `0`
  - parity OK; composition `0.688`, contact `1`, clone `0.105`, empty board
    `0`, unsafe roofs `0`, mobile lower frame `0.102`.
- `node scripts/verify-archetype-identity-sweep.mjs` - exit `0`
  - all gates pass; 3222 counties classified; massing closest pair `0.17`;
    perf `14.48ms/county`, 0 failures.
- `git diff --exit-code -- packages/core/src/voxel/riversideDemoScene.ts` -
  exit `0`
  - curated Riverside source is byte-identical in this diff.

## Reviewer-Run List

Sandbox blocks esbuild/Chrome/browser gates here. Reviewer should run:
- `pnpm build:web`
- `node scripts/verify-generated-district-widget.mjs`
- `node scripts/verify-widget-performance.mjs`
- browser/screenshot verifiers
- actual Graphics ceiling gate
- overview screenshot review for all six archetypes

## Risks

- The Graphics numbers above are estimates, not Chrome Graphics measurements.
- The closest massing pair is `0.17`, only `0.01` above the new floor; this is
  deliberate but worth watching if 0.76-4 terrain changes increase overlap.
- Prairie and river composition tails are green but still the lowest visual
  reads (`0.631`, `0.637`); terrain features should improve them without
  adding clutter.
- No screenshot proof was run in this sandbox.

## Honest NS-6 Before / After

Before 0.76-3: about `5.6/10` for NS-6 archetype identity. 0.76-1 and 0.76-2
made palettes and landmarks distinct, but the non-landmark county fabric still
shared too much block/road DNA.

After 0.76-3: about `6.6/10` node-side. The six archetypes now differ in
layout, road grammar, height, footprint, and density with executable gates.
It is still not a visual victory lap until 0.76-4 terrain features and
reviewer-run screenshots confirm the overview silhouette in the widget.
