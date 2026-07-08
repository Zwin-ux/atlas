# 0.75C-3 Close-Zoom Material Texture

## Result

Implemented.

Walls and roofs now get a quiet close-zoom material pass in the vector renderer.
The pass is gated at `camera.zoom >= 1.55`, so desktop/mobile overview cameras
do not emit the new material texture commands. Riverside authored data and
generated scene/compiler data are unchanged.

## Texture Grammar

Wall grammar:
- One batched `Graphics` per vector building for all wall material texture.
- Draws only after base wall fills and before block courses/facade windows.
- Uses `wallSurface`, `wallPoint`, and `wallQuadPoints` only.
- Adds coarse horizontal masonry-course quads per face.
- Adds occasional offset block cells keyed by building id, face, and course.
- Uses `shadeColor(geometry.bodyColor, delta)` with deltas `-16`, `-10`, `10`,
  and `16`, low alpha only.

Roof grammar:
- One batched `Graphics` per vector building for all roof material texture.
- Draws only inside the roof path after structural roof lines and before
  parapets/authored roof profiles.
- Uses diamond-clipped roof coordinates through `roofMaterialPoint` and
  `roofMaterialQuadPoints`.
- Adds eave-parallel seams, occasional roof course cells, and small pitched-roof
  ridge caps.
- Uses `shadeColor(roofColor, delta)` with the same small delta family.

Determinism:
- All variation is seeded from `materialTextureSeed(building.id, face, course)`.
- No `Math.random`, noise, gradients, filters, shaders, bitmaps, or textures were
  added.

## Zoom Gate

Threshold: `1.55`.

Current Riverside preset readout from `verify-material-texture-grammar`:
- `desktop`: `1.46` below threshold
- `mobile`: `0.92` below threshold
- `residential_detail`: `1.74` above threshold
- `commerce_detail`: `1.62` above threshold

Reviewer live check:
- Residential material: run the preview and open
  `/preview?atlasCamera=residential_detail`.
- Commerce material: run the preview and open
  `/preview?atlasCamera=commerce_detail`.
- Overview comparison: open `/preview?atlasCamera=desktop`; the new texture pass
  is not emitted there.

## Files Touched

- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-material-texture-grammar.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `artifacts/current-update.json`
- `artifacts/0.75c-material-texture/CODEX_RESULT.md`

## Verification

Passed:
- `pnpm typecheck:starter`
- `pnpm test:core` - 99 passed
- `node scripts\verify-generated-district-parity.mjs`
- `node scripts\verify-material-texture-grammar.mjs`
- `node scripts\verify-object-kit-renderer-consumption.mjs`
- `node scripts\verify-object-authorship-scene-grammar.mjs`
- `node scripts\verify-roads-roofs-scene-grammar.mjs`
- `node scripts\verify-public-object-kit-prefab-palette.mjs`
- `node scripts\verify-terrain-chunk-massing-grammar.mjs`
- `node scripts\verify-terrain-elevation-chunk-grammar.mjs`
- `node scripts\verify-terrain-parcel-composition.mjs`
- `node scripts\verify-face-orientation-source-contrast.mjs`
- `node scripts\verify-commerce-strip-prefab-geometry.mjs`
- `node scripts\verify-plaza-row-focused-capture.mjs`
- `node scripts\verify-civic-venue-object-kit-contract.mjs`
- `node scripts\verify-public-object-identity-civic-service.mjs`
- `node scripts\verify-public-civic-landmark-authorship.mjs`
- `node scripts\verify-no-google-in-renderer.mjs`
- `node scripts\verify-provider-boundaries.mjs`
- `node scripts\verify-tool-result-shape.mjs`
- `node scripts\verify-render-command-layer-budget.mjs`
- `node scripts\verify-scene-window-compiler.mjs`
- `node scripts\verify-dynamic-window-refresh.mjs`
- `node scripts\verify-fable-prop-cleanup.mjs`
- `node scripts\verify-cityworld-mobile-occlusion.mjs`
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
- `git diff --check`

Material verifier proof:
- below-threshold planned texture commands: `0`
- above-threshold sample texture commands: `20`
- repeated same-input seeded run: identical
- sibling building id run: different
- wall texture batching: `1` `Graphics`
- roof texture batching: `1` `Graphics`

Not run by instruction:
- `pnpm build:web`
- `node scripts\verify-generated-district-widget.mjs`
- `node scripts\verify-widget-performance.mjs`

## Known Risks

- Actual Pixi rebuild latency and world `Graphics` count must be measured in
  the reviewer browser environment because this sandbox must not run the blocked
  esbuild/widget/performance path. The implementation keeps texture objects
  batched per building and the node-side verifier enforces that shape.
- The texture is intentionally subtle. It should read only at detail cameras;
  if a reviewer wants stronger material separation, raise alpha slightly before
  changing deltas or adding new linework.
