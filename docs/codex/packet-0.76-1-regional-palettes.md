# Work Packet 0.76-1 — Regional Palettes

You are the implementation driver on the Atlas voxel engine (see
`docs/codex/CODEX_DRIVER_ADAPTER.md` — read it and the boot sequence first).
Implement this packet completely, verify what you can, and leave the working
tree UNCOMMITTED for review. Do not commit. Do not push.

**North star:** NS-6 (every county at the curated bar). **Lever 1 of 4.**

## Repo
- Canonical: `C:\Users\mzwin\Documents\Atlas`, branch
  `codex/integrate-hosted-clawd-fable-058e` (clean at start).
- Archetype identity: `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts`
  (`selectGeneratedDistrictArchetype`, `generatedZones`, `generatedRoadSeeds`,
  `generatedHeightGrid`, `BASE_HEIGHT_GRIDS`).
- Building palettes: `packages/core/src/voxel/cityWorldParametricGenerator.ts` —
  `RESIDENTIAL_TEMPLATE_POOL` (~L681), commercial/apartment/civic pools below
  it, `bodyColors`/`roofColors` per building **kind**, resolved through
  `withBuildingMetadata` (~L744, `pick(rng, template.bodyColors)`). Terrain
  tone paletteKey at ~L347 (`terrain.${kind}`).
- Types: `cityWorldGeneratedDistrictTypes.ts` (`GeneratedDistrictArchetype`).
- HARD CONSTRAINTS: no new dependencies, no Three.js, do NOT touch the authored
  Riverside scene (`riversideDemoScene.ts`) or curated props, no scene compiler
  contract changes, no MCP tool changes. Curated Riverside must stay
  byte-identical (it does not go through the archetype path — verify it doesn't
  regress anyway).

## Problem
Building/roof/terrain palettes are keyed by building **kind** (a single global
beige/blue set), NOT by archetype. A generated desert county and a generated
coastal county render the same colors — they differ only by terrain slope. This
is the core "six templates × jitter" failure of NS-6: a cold screenshot fails
the "which one is curated?" / "which region is this?" test.

## Goal
Each of the six archetypes resolves a **distinct regional palette** for body,
roof, and terrain tone, so an overview screenshot reads its region before any
other cue. Curated Riverside is untouched; when no archetype palette is present,
behavior is byte-identical to today.

## Target palettes (starting point — tune for the voxel read, justify changes)
| Archetype | Body | Roof | Terrain tone |
|---|---|---|---|
| `desert_basin` | sand / adobe / pale ochre | terracotta / rust / clay | bleached tan / dry sage |
| `coastal_grid` | whitewash / pale sand / foam | navy / weathered teal / slate | pale sand / shore green |
| `mountain_valley` | timber brown / stone grey / cedar | slate / dark green / iron | pine green / granite |
| `prairie_town` | grain gold / cream / barn red | barn red / tin silver / green | prairie gold-green / soil |
| `river_town` | brick red / ochre / moss stone | slate blue / moss green / tin | river green / mud bank |
| `metro_grid` | concrete grey / warm tan / glass blue | grey / dark steel / copper | urban grey-green / paved |

Keep 2–3 body + 2–3 roof colors per archetype so intra-archetype variety
survives (clone pressure) while inter-archetype identity is unmistakable.

## Approach (your call on exact mechanism; justify in the result note)
Prefer the **compiler-authored** path, consistent with the 0.73F facade
contract (no draw-time sniffing):
1. Define a typed `RegionalPalette` (body[], roof[], terrainTone) and a
   `REGIONAL_PALETTES: Record<GeneratedDistrictArchetype, RegionalPalette>`.
2. Thread the selected archetype's palette into the parametric spec — e.g. an
   optional `regionalPalette?: RegionalPalette` on `CityWorldParametricSpec`
   (or pass `archetype`), consumed by `withBuildingMetadata` / the terrain-tone
   resolver so it **overrides the kind-keyed pool** when present. When absent
   (curated Riverside), the existing kind-keyed pools resolve exactly as today.
3. Keep resolution deterministic (`pick(rng, ...)` seeding unchanged) so
   generation stays reproducible.

## Gates — design against these explicitly
1. **Palette distinctness (NEW — you add this):** add a deterministic assertion
   (core test + a check in `verify-generated-district-parity.mjs`) that any two
   archetypes resolve measurably different dominant body/roof/terrain palettes.
   This gate is the permanent guard against "six templates × jitter" — it must
   exist and pass by end of this packet.
2. **Home clone pressure ≤ 0.30** (`verify-generated-district-parity.mjs`):
   keeping only 2–3 body colors per archetype narrows variety — confirm clone
   pressure stays under 0.30 for each archetype; report the tail.
3. Composition ≥ 0.60, empty-board ≤ 0.10, contact ≥ 0.95, roof safety — run
   parity, report tails; none should move (palette-only change).
4. **Graphics ≤ 1,600 worst-window** (`verify-widget-performance.mjs`,
   reviewer-run): palette change adds no geometry — Graphics should be
   unchanged. State that expectation for the reviewer.
5. `pnpm test:core` — update only tests that assert the OLD global palette
   deliberately; never loosen a quality assertion. Add the palette-distinctness
   test.

## Verification you CAN run (do it)
- `pnpm typecheck:starter`
- `pnpm test:core`
- `node scripts/verify-generated-district-parity.mjs`
- the new palette-distinctness assertion

## Verification you CANNOT run (sandbox blocks esbuild/Chrome — reviewer-run)
- `pnpm build:web`, `verify-generated-district-widget.mjs`,
  `verify-widget-performance.mjs`, and all browser/screenshot verifiers.
  List them as reviewer-run in the result note. The reviewer will screenshot
  one generated county per archetype and judge the region read.

## Deliverable
- Implementation, uncommitted.
- `artifacts/0.76-1-regional-palettes/CODEX_RESULT.md`: mechanism chosen + why,
  the `REGIONAL_PALETTES` table as implemented, palette-distinctness metric per
  archetype pair, clone-pressure tails per archetype, files touched, CAN-run
  verify evidence, the reviewer-run list, confirmation curated Riverside is
  byte-identical, known risks, honest NS-6 before/after read.
- Update `docs/BUILD_LOG.md` + `docs/NEXT_QUESTS.md` (promote 0.76-2 to READY).
