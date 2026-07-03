# Pre-Alpha 0.10E - Terrain / World-Edge Measured Correction

Status: complete locally as a measured terrain-engine correction.

## Promise

The public Riverside playable map should feel less like a flat board without
adding props, labels, panels, or fake density.

## Result

0.10E moves the public Riverside terrain axis with diagnostics instead of taste
language:

- `terrainMassingCoverageRatio`: `0.796`
- `emptyBoardRatio`: `0.151`
- `firstViewportCompositionScore`: `0.754`
- `chunkEdgeReadabilityFloorScore`: `0.668`
- desktop chunk-edge readability: `0.843`
- mobile chunk-edge readability: `0.668`
- residential-detail chunk-edge readability: `0.761`

## What Changed

- Diagnostics now report `chunkEdgeRatio`, `terrainElevationVisibleRatio`, and
  `chunkEdgeReadabilityScore` for every camera viewport.
- Riverside terrain massing fields are broader and more coherent around the
  civic core, neighborhood shelves, commercial slab fields, park basin, water
  edge, and outer world edge.
- Existing renderer side faces, rims, shadows, and strata are slightly stronger
  for current massing profiles.
- Core tests and the terrain verifier now lock the metric floors.

## Boundaries

No new terrain type names. No cars, humans, walkers, props, labels, panels,
glows, provider geometry, GameBlocks import, public Anaheim/Ontario promotion,
MCP tool-list changes, persistence, Hosted Clawd, Stripe, XP, evidence, OAuth,
automation, reports, or exports.

## Evidence

Passed verification:

- `pnpm --dir packages/core test`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `pnpm verify:preview:http`
- `node scripts\debug-city-world-engine.mjs --out C:\Users\mzwin\AppData\Local\Temp\atlas-e010-debug-engine --json-only`
- `node scripts\verify-terrain-chunk-massing-grammar.mjs --json-only`
- `node scripts\verify-worldbasis-terrain-sampler.mjs --json-only`
- `node scripts\verify-no-google-in-renderer.mjs --json-only`
- `node scripts\verify-provider-boundaries.mjs --json-only`
- `node scripts\verify-tool-result-shape.mjs --json-only`
- strict `engine-beta-data` split guard
- Engine Beta browser coverage proof under
  `C:\Users\mzwin\AppData\Local\Temp\atlas-e010-engine-coverage`
- opt-in `?atlasDebug=engine` proof under
  `C:\Users\mzwin\AppData\Local\Temp\atlas-e010-debug-overlay`

## Next

Default next update:
Pre-Alpha 0.11E - Metric Review / Object Authorship Decision.

If screenshots show terrain lift but object identity still feels weak, move to
hidden Anaheim or public Riverside object authorship. If mobile terrain still
feels flat, target chunk-edge readability again instead of broad art polish.
