# Work Packet 0.76-4 - Terrain Features

Implementation driver on the Atlas voxel engine (read
`docs/codex/CODEX_DRIVER_ADAPTER.md` boot sequence first). Implement
completely, verify what you can, leave the working tree UNCOMMITTED. Do not
commit. Do not push. Prerequisite: `0.76-3 Massing & Zone Variants` is local
green and documented in `artifacts/0.76-3-massing/CODEX_RESULT.md`.

North star: NS-6. Lever 4 of 4. Terrain must make the six generated USA-region
archetypes read different before the user inspects individual buildings.

> Scope discipline: implement only this packet. Do not touch split guards,
> `artifacts/current-update.json`, Hosted Clawd, persistence, Stripe, MCP tools,
> public Anaheim/Ontario, renderer seams, or curated Riverside source. Any file
> changed must appear in `artifacts/0.76-4-terrain/CODEX_RESULT.md` with a reason.

## Repo

- Canonical: `C:\Users\mzwin\Documents\Atlas`, branch
  `codex/integrate-hosted-clawd-fable-058e`.
- Terrain inputs: `packages/core/src/voxel/cityWorldGeneratedDistrict.ts` and
  `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts`.
- Terrain compiler seam: `packages/core/src/voxel/cityWorldParametricGenerator.ts`
  (`heightGrid`, `createParametricTerrain`, `terrainVisualGrammar`,
  `terrainElevationProfile`, `terrainChunkEdgeProfile`).
- Diagnostics: `packages/core/src/voxel/cityWorldDiagnostics.ts` and
  `scripts/verify-archetype-identity-sweep.mjs`.
- Existing terrain guards:
  `scripts/verify-terrain-chunk-massing-grammar.mjs`,
  `scripts/verify-terrain-elevation-chunk-grammar.mjs`,
  `scripts/verify-terrain-parcel-composition.mjs`, and
  `scripts/verify-generated-district-parity.mjs`.

## Problem

0.76-1 through 0.76-3 made palettes, landmarks, road grammar, and building
massing region-aware. The ground still reads too much like a shared board with
local decorations. At overview zoom, terrain should tell the user whether they
are looking at a coast, river town, prairie grid, mountain valley, desert basin,
or metro county.

## Goal

Each archetype gets a deterministic terrain feature pattern using the existing
compiled scene grammar:

- `heightGrid` relief;
- `terrainComposition`;
- `terrainElevation`;
- `chunkEdge`;
- `terrainChunkMassing`;
- existing regional terrain palettes.

Do not add a new renderer contract unless an existing typed token cannot express
the feature. Prefer authored compiler metadata consumed by the current renderer.
No bitmap textures, Three.js, shader/filter work, new prop kinds, provider
geometry, or generated public-playable claims.

## Per-archetype terrain read

| Archetype | Terrain feature | What must read at overview |
| --- | --- | --- |
| `metro_grid` | civic plinth, compact block aprons, subtle hardscape seams | dense engineered ground, not open field |
| `desert_basin` | mesa shelves, dry wash cuts, low sparse vegetation gaps | broad dry relief and stepped basin floor |
| `coastal_grid` | waterfront bank cut, shore road shelf, low dune/edge rhythm | water-edge settlement with land falling to shore |
| `mountain_valley` | terraced height bands, ridge civic shelf, valley floor | terrain slope organizes the town |
| `prairie_town` | low swales, field strips, long flat road shoulders | flat agricultural grid with large open parcels |
| `river_town` | riverbank cut, floodplain strip, parallel levee/main street shelf | town follows the river edge |

Use `resolveCountyParameters(...).modulation` rather than reclassifying from
county name. `reliefScale`, `dryReliefBoost`, `vegetationDensity`, and
`waterAffinity` should bias intensity inside safe clamps. Two counties in the
same archetype should vary, but the archetype terrain signature must remain
recognizable.

## Gates

1. Terrain-feature distinctness: extend
   `scripts/verify-archetype-identity-sweep.mjs` with a deterministic terrain
   signature gate. Compare terrain elevation, chunk-edge mix, height-grid
   relief, water-edge ratio, and authored terrain composition. Closest pair
   must clear an explicit floor; report the pair and distance.
2. Existing terrain grammar guards stay green:
   `verify-terrain-chunk-massing-grammar`,
   `verify-terrain-elevation-chunk-grammar`, and
   `verify-terrain-parcel-composition`.
3. Parity floors stay green: composition >= 0.60, contact >= 0.95,
   empty-board <= 0.10, clone pressure <= 0.30, unsafe roofs = 0.
4. Graphics worst-window target remains <= 1400, hard ceiling <= 1600. Terrain
   features add commands; estimate per archetype and keep metro/coastal mobile
   under control.
5. Curated Riverside source remains byte-identical:
   `git diff --exit-code -- packages/core/src/voxel/riversideDemoScene.ts`.
6. No new public MCP tools, renderer route, provider-created geometry,
   persistence, money, or public Anaheim/Ontario promotion.

## Verification you can run

- `pnpm typecheck:starter`
- `pnpm test:core`
- `node scripts/verify-generated-district-parity.mjs`
- `node scripts/verify-archetype-identity-sweep.mjs`
- `node scripts/verify-terrain-chunk-massing-grammar.mjs`
- `node scripts/verify-terrain-elevation-chunk-grammar.mjs`
- `node scripts/verify-terrain-parcel-composition.mjs`
- `git diff --exit-code -- packages/core/src/voxel/riversideDemoScene.ts`

## Reviewer-run verification

List these as not run if the sandbox cannot run browser/build gates:

- `pnpm build:web`
- `node scripts/verify-generated-district-widget.mjs`
- `node scripts/verify-widget-performance.mjs`
- screenshots for one county per archetype at desktop and 390x844 mobile

## Deliverable

- Implementation, uncommitted.
- `artifacts/0.76-4-terrain/CODEX_RESULT.md` with:
  - terrain feature per archetype;
  - how `CountyGenerationParameters.modulation` affects intensity;
  - terrain-feature distinctness metric and closest pair;
  - parity tails per archetype;
  - Graphics worst-window estimates;
  - files touched with reasons;
  - can-run evidence and reviewer-run list;
  - curated Riverside byte-identical confirmation;
  - risks;
  - honest NS-6 before/after read.
- Update `docs/BUILD_LOG.md` and `docs/NEXT_QUESTS.md`, promoting
  `0.76-5 Gate promotion + batch sweep` only if this packet is locally green.
