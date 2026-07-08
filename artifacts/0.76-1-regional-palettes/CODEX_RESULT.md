# 0.76-1 Regional Palettes - Codex Result

Status: local-green, uncommitted for review.

## Mechanism

Generated district specs now carry an optional `regionalPalette` selected from
`REGIONAL_PALETTES`. The parametric compiler uses it to author:

- regional building `paletteKey`s plus matching `bodyColor`/`roofColor`
- regional non-water terrain `paletteKey`s
- no extra buildings, lots, roads, props, tools, or dependencies

Why this path: diagnostics and Pixi both resolve effective colors through
palette keys. Changing raw building colors alone would not affect the player
view. Registered regional palette keys keep atlas validation strict while
keeping the renderer free of archetype sniffing.

When `regionalPalette` is absent, the old kind-keyed template pools and
`terrain.*` keys remain the path. Curated Riverside does not pass through the
generated archetype spec.

## REGIONAL_PALETTES

| Archetype | Body | Roof | Terrain tone |
|---|---|---|---|
| `metro_grid` | `#a9aca6`, `#aeb8bd`, `#8fb7c2` | `#666d70`, `#26313a`, `#b77a4f` | `#7f8987` |
| `coastal_grid` | `#f4ead6`, `#d9c69f`, `#e8f0e8` | `#2f526d`, `#3f7f82`, `#66727a` | `#d8cfa7` |
| `desert_basin` | `#d9b27c`, `#c98f62`, `#ead09a` | `#b65f38`, `#8f4b32`, `#c77a45` | `#cdbb82` |
| `mountain_valley` | `#8a6a4a`, `#6f5b42`, `#6f7650` | `#56616a`, `#244d34`, `#4e514f` | `#4f6f3f` |
| `prairie_town` | `#d6b65e`, `#a94f3e`, `#ead9b5` | `#a43f32`, `#8e938b`, `#5f7c48` | `#9fa94d` |
| `river_town` | `#8b9275`, `#c99a55`, `#a8563d` | `#2f5d8a`, `#577747`, `#9a927d` | `#4d8f83` |

## Palette Distinctness

Metric: average normalized RGB distance across dominant effective body,
dominant effective roof, and regional terrain base. Floor: `0.16`.

| Pair | Distance |
|---|---:|
| `metro_grid/coastal_grid` | `0.212` |
| `metro_grid/desert_basin` | `0.259` |
| `metro_grid/mountain_valley` | `0.216` |
| `metro_grid/prairie_town` | `0.304` |
| `metro_grid/river_town` | `0.174` |
| `coastal_grid/desert_basin` | `0.161` |
| `coastal_grid/mountain_valley` | `0.355` |
| `coastal_grid/prairie_town` | `0.269` |
| `coastal_grid/river_town` | `0.225` |
| `desert_basin/mountain_valley` | `0.395` |
| `desert_basin/prairie_town` | `0.255` |
| `desert_basin/river_town` | `0.320` |
| `mountain_valley/prairie_town` | `0.236` |
| `mountain_valley/river_town` | `0.184` |
| `prairie_town/river_town` | `0.228` |

Minimum pair: `coastal_grid/desert_basin` at `0.161`.

## Clone Pressure Tails

| Archetype | County fixture | Home clone pressure | Contact | Unsafe roofs |
|---|---|---:|---:|---:|
| `metro_grid` | `autauga-al` | `0.143` | `1.000` | `0` |
| `coastal_grid` | `aleutians-east-borough-ak` | `0.175` | `1.000` | `0` |
| `desert_basin` | `apache-az` | `0.122` | `1.000` | `0` |
| `mountain_valley` | `adams-co` | `0.119` | `1.000` | `0` |
| `prairie_town` | `adair-ia` | `0.133` | `1.000` | `0` |
| `river_town` | `butler-al` | `0.139` | `1.000` | `0` |

Max clone pressure: `0.175`, under the `0.30` gate.

## Existing Parity Tails

`node scripts/verify-generated-district-parity.mjs`:

- composition `0.688`
- empty board `0`
- home clone pressure `0.10526315789473684`
- building/lot contact `1`
- palette distinctness min `0.161`
- per-archetype max clone pressure `0.175`
- roof unsafe count `0`
- detection proof still trips all degraded cases

## Files Touched

- `packages/core/src/voxel/cityWorldRegionalPalettes.ts`
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/src/voxel/cityWorldGeneratedDistrict.ts`
- `packages/core/src/voxel/cityWorldPaletteRegistry.ts`
- `packages/core/src/voxel/index.ts`
- `packages/core/src/index.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `packages/assets/city-world/atlas.manifest.json`
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-generated-district-parity.mjs`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `artifacts/0.76-1-regional-palettes/CODEX_RESULT.md`

## CAN-run Verify Evidence

- `pnpm typecheck:starter`: passed. Tail: core build, geo build, server
  no-emit typecheck, and web no-emit typecheck completed with exit `0`.
- `pnpm test:core`: passed. Tail: `22 passed` test files, `110 passed` tests.
- `node scripts/verify-generated-district-parity.mjs`: passed. Tail:
  palette distinctness min `0.161`, per-archetype max clone pressure `0.175`,
  no hard blockers, all degradation proofs pass.
- `node scripts/verify-generated-district-parity.mjs --palette-distinctness-only`:
  passed. Tail: all 15 archetype pairs pass the `0.16` floor.

## Reviewer-run

Sandbox blocks esbuild/Chrome here. Reviewer should run:

- `pnpm build:web`
- `node scripts/verify-generated-district-widget.mjs`
- `node scripts/verify-widget-performance.mjs`
- all browser/screenshot verifiers

Graphics expectation: unchanged. This packet changes palette keys and renderer
color resolution for `terrain.region.*`; it adds no scene objects or draw
commands.

## Curated Riverside

Curated Riverside is byte-identical by mechanism:

- `packages/core/src/voxel/riversideDemoScene.ts` was not touched.
- curated props were not touched.
- `compileCityWorldScene(riversideDemoVoxelScene)` does not pass a
  `regionalPalette`.
- existing `building.*` and `terrain.*` palette entries were left in place.
- Pixi only opts into new terrain coloring for `terrain.region.*`, so default
  `terrain.*` constants keep the old path.

## Known Risks

- Browser screenshot proof is still reviewer-run. The node gates prove palette
  identity structurally, not final visual taste.
- The closest pair is `coastal_grid/desert_basin` at `0.161`; it clears the
  floor but is the pair to inspect most closely in overview screenshots.
- Some per-archetype first-viewport composition scores are below the sample
  parity floor from pre-existing layout differences. This packet did not add a
  new composition floor or change geometry.

## NS-6 Read

Before: generated archetypes had terrain-profile identity but shared global
building colors, so a region overview could collapse into six templates plus
jitter.

After: each archetype resolves a distinct body/roof/terrain palette, and a
deterministic gate prevents palette collapse. Honest score moves from roughly
draft-region read to a real first regional identity pass, but not curated parity
yet. Landmarks, massing, and terrain features still need 0.76-2 through 0.76-4.
