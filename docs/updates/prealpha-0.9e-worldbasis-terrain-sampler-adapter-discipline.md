# Pre-Alpha 0.9E - WorldBasis / TerrainSampler Adapter Discipline

Status: complete locally as an engine contract slice.

## Promise

Atlas keeps the current public product behavior, but the voxel engine now has a
shared coordinate and terrain-sampling contract before more visual art work.

This is not a GameBlocks import. GameBlocks remains reference-only.

## Result

Board-space projection, tile diamond geometry, viewport frames, frame
intersection, terrain sampling, and contact helpers now live in core
`@atlas/core/voxel` modules.

Diagnostics and the Pixi renderer consume the shared helpers instead of keeping
private duplicate projection and viewport math.

## What Changed

- Added `cityWorldBasis` for 2:1 tile constants, projection, diamonds,
  viewport frames, bounds/intersection, footprint, segment, and distance
  helpers.
- Added `cityWorldTerrainSampler` for viewport terrain/lots/roads/buildings,
  authored terrain counts, empty-board counts, terrain massing counts, and
  road/lot/building contact helpers.
- Rewired engine diagnostics through the sampler and shared basis helpers.
- Rewired `CityWorldRenderer` projection and diamond drawing through the shared
  basis.
- Added focused core tests for projection, viewport frames, sampler parity, and
  contact helper behavior.
- Added `verify-worldbasis-terrain-sampler.mjs` to guard deterministic math,
  diagnostics parity, renderer import discipline, and no GameBlocks/Three/Rapier
  drift.

## Evidence

Expected verification:

- `pnpm --dir packages/core test`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `node scripts\verify-worldbasis-terrain-sampler.mjs --json-only`
- `node scripts\debug-city-world-engine.mjs --out <temp-dir> --json-only`
- existing provider/tool/split guards
- Engine Beta browser coverage proof after renderer import changes

## Boundaries

No visual improvement claim. No GameBlocks vendoring. No Three.js, Rapier,
physics, actor systems, vehicles, provider geometry, public Anaheim/Ontario
promotion, MCP tool-list changes, persistence, Hosted Clawd, Stripe, XP,
evidence, OAuth, automation, reports, or exports.

## Next

Default next update:
Pre-Alpha 0.10E - Metric-Driven Engine Correction.

Use `debug-city-world-engine` and `verify-worldbasis-terrain-sampler` to choose
the axis. Do not run another art pass unless it names the metric it will move.
