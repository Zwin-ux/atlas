# Work Packet 0.76-3 — Massing & Zone Variants

Implementation driver on the Atlas voxel engine (read
`docs/codex/CODEX_DRIVER_ADAPTER.md` boot sequence first). Implement completely,
verify what you can, leave the working tree UNCOMMITTED. Do not commit. Do not
push. **Prerequisite: 0.76-2 landmarks committed (HEAD `200a2f4`).**

**North star:** NS-6. **Lever 2 of 4 — the biggest remaining crop-test lever.**

> SCOPE DISCIPLINE (reviewer will enforce): implement ONLY what this packet
> describes. Do NOT touch loop logs, split guards (`verify-alpha-rc-split.mjs`),
> `artifacts/current-update.json`, or any file outside the Files-Touched list
> you will declare. Any file you change MUST appear in your CODEX_RESULT
> "Files Touched" list with a reason. Undeclared changes are reverted and the
> packet is bounced.

## Repo
- Canonical: `C:\Users\mzwin\Documents\Atlas`, branch
  `codex/integrate-hosted-clawd-fable-058e`.
- Zone/road layout: `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts`
  — `generatedZones` / `generatedRoadSeeds` are TODAY near-identical across all
  six archetypes (shared rectangles + one bonus zone/road).
- Parameter spine (0.76-P): `packages/core/src/voxel/cityWorldCountyParameters.ts`
  — `resolveCountyParameters` returns `modulation` (densityScale, reliefScale,
  heightBias, civicElevationBoost, dryReliefBoost, vegetationDensity,
  waterAffinity) and `ARCHETYPE_PROFILES` (base palettes, height grids, bonus
  zones/roads). USE THESE — do not re-derive from the archetype string.
- Building templates / massing: `packages/core/src/voxel/cityWorldParametricGenerator.ts`
  (`RESIDENTIAL_TEMPLATE_POOL`, commercial/apartment/civic pools, footprint/height).
- HARD CONSTRAINTS: no new deps, no Three.js, no new prop kinds, no MCP tool
  changes, no renderer seam changes, do NOT touch `riversideDemoScene.ts` /
  curated props. Curated Riverside must stay byte-identical (it does not pass
  through the generated archetype path — confirm with a git diff).

## Problem
Every archetype uses the same zone layout and road grid, so at OVERVIEW zoom the
six regions have the same footprint — only palette and the single landmark
differ. 0.76-2 review confirmed the landmark alone reads modestly; the region
needs to read in the MASSING and STREET PATTERN, not just color.

## Goal
Each archetype produces a distinct overview SILHOUETTE — block pattern, building
massing, and street grammar that says the region before palette does. Two
same-archetype counties still vary via the spine's modulation, but the six
archetypes must be unmistakable in shape.

## Per-archetype massing & layout (drive from ARCHETYPE_PROFILES + modulation)
| Archetype | Block pattern | Building massing | Street grammar |
|---|---|---|---|
| `metro_grid` | tight dense core, small blocks | taller, apartment weight up, stepped setbacks | close-spaced orthogonal grid |
| `desert_basin` | low wide sprawl, big dry plaza | single-story setback, wide low footprints | few wide arterials, long gaps |
| `coastal_grid` | commercial strip fronting the water edge; homes step back from shore | low-mid, waterfront-facing | shoreline road + perpendicular streets |
| `mountain_valley` | elevation-terraced blocks, fewer larger lots | stepped by height band (reliefScale) | roads follow contour, civic on ridge |
| `prairie_town` | wide low grid, agricultural district | low, broad, sparse | long straight through-roads |
| `river_town` | linear town following the river band | low-mid, dock district | main street parallel to river |

Use `modulation.densityScale` for block/lot density, `heightBias` for massing
height, `reliefScale`/`civicElevationBoost` for terraced placement,
`vegetationDensity` for green spacing. Keep it deterministic and seed-threaded.

## Gates — design against these explicitly
1. **Graphics worst-window <= 1,600** (`verify-widget-performance.mjs`,
   reviewer-run) — THIS IS THE PRIMARY RISK. Denser/taller massing adds
   Graphics; metro dense core is the worst case. Estimate the per-archetype
   worst-window Graphics and keep the MAX comfortably under 1,600 (target
   <= 1,400). Report your estimate per archetype; if metro would breach, cap
   density/height rather than the ceiling. Current baseline worst-window: 838.
2. **Massing-variation gate (NEW — add it):** extend
   `scripts/verify-archetype-identity-sweep.mjs` with a deterministic assertion
   that the six archetypes differ measurably in a massing/layout signature
   (e.g. mean building height, footprint area distribution, block count, or
   road length) — any two archetypes must differ beyond a threshold. This is
   the structural guard that this packet actually changed the SHAPE, not just
   parameters. Keep the existing sweep gates green.
3. **Composition >= 0.60, contact >= 0.95, empty-board <= 0.10, roof safety,
   clone pressure <= 0.30** (parity) — denser fabric threatens these; run and
   report tails per archetype.
4. **Streaming rebuild <= 350ms** — more geometry raises rebuild; report.
5. `pnpm test:core` — add a deterministic massing-variation test; update any
   test asserting old shared-layout constants deliberately; never loosen a
   quality assertion.

## Verification you CAN run (do it)
- `pnpm typecheck:starter`, `pnpm test:core`
- `node scripts/verify-generated-district-parity.mjs`
- `node scripts/verify-archetype-identity-sweep.mjs`

## Verification you CANNOT run (reviewer-run — list them)
- `pnpm build:web`, `verify-generated-district-widget.mjs`,
  `verify-widget-performance.mjs`, all browser/screenshot verifiers. Reviewer
  screenshots one county per archetype and judges the overview SILHOUETTE read.

## Deliverable
- Implementation, uncommitted.
- `artifacts/0.76-3-massing/CODEX_RESULT.md`: per-archetype layout/massing +
  how it reads modulation/ARCHETYPE_PROFILES, per-archetype Graphics worst-window
  estimate (esp. metro), parity tails per archetype, massing-variation metric,
  rebuild estimate, Files Touched (with reasons; nothing outside the engine),
  CAN-run evidence, reviewer-run list, curated-Riverside byte-identical
  confirmation, risks, honest NS-6 before/after.
- Update `docs/BUILD_LOG.md`, `docs/NEXT_QUESTS.md`. Then STOP.
