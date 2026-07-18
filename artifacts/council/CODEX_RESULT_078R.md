# CODEX RESULT 0.78-R - Renderer LOD + Streaming

## Status

Implemented the renderer-side 0.78-R packet slice inside the allowed fence.

Reviewer fix round applied for the two real failures found after the first
packet:

- Jefferson AL zoom-transition peak Graphics exceeded the 1600 ceiling because
  invalid outgoing retained chunks could remain mounted while earlier
  replacement chunks were already drawn.
- Riverside emulator audit `canvas_single` display-mode checks timed out during
  fullscreen/inline resize pressure. I found no separate tool-delivery or
  display-mode state cause in the inspected path; the failure aligns with the
  same transient renderer pressure starving the host/React update window.

Current quest: `0.78-R Renderer LOD + Streaming`, absorbing W6.1/W6.2.

## Files Changed

- `web/src/CityWorldRenderer.tsx`
- `packages/core/src/voxel/cityWorldSceneWindow.ts`
- `packages/core/test/city-world-scene-window.test.ts`
- `scripts/verify-emulator-perf.mjs`
- `artifacts/council/CODEX_RESULT_078R.md`

Skipped per user fence: docs, app/view/server/emulator host, package files, commits, pushes.

## Chunking Design

The scene window compiler now builds a coverage-based spatial chunk index. The default chunk size remains 8 tile-space cells. Each render command is assigned to every chunk touched by its coverage frame, not only by its anchor point, so long roads and footprint geometry survive chunk-boundary windows.

Window visibility now works as:

1. camera frame intersects chunk cells
2. chunk command ids are unioned into a candidate set
3. candidates are restored to original scene command order
4. the existing exact `commandTouchesFrame` predicate filters final visibility

This removes the global whole-scene command scan from the hot window path while preserving exact visibility semantics.

The renderer mounts retained chunk display groups under persistent root layers. Chunk groups are tracked by chunk id with a command-key, active LOD tier, and material-texture gate state. On refresh, chunks that leave the window are unmounted, chunks whose key is unchanged are reused, and only changed chunks are redrawn.

Root layers remain shared rather than wrapping every chunk in a single container. That keeps painter/depth behavior compatible with the existing renderer: terrain and lot layers use band z-order, building/prop depth interleave stays in a shared sortable layer, and HUD/pin/label surfaces remain on top.

## LOD Plumbing Choice

I chose the hashed-safe path.

No compiled scene command buffer shape was changed, and `cityWorldCompiler.ts` was not edited. The LOD tier is added only on the scene-window view as `lodTier: 0` for all current commands. The renderer then culls commands above the active zoom tier:

- overview `< 0.8`: LOD 0
- mid `0.8 - 1.4`: LOD 0 + 1
- detail `>= 1.4`: LOD 0 + 1 + 2

Because all existing content defaults to tier 0 outside the hashed compile output, current scenes should be behavior-identical and curated Riverside compile byte identity is not disturbed.

## Incremental Rebuild Coverage

Incremental:

- camera window crossings mount/unmount only entering/leaving chunk display groups
- unchanged active chunks are reused across refreshes
- texture-gate changes dirty only currently visible retained chunks
- LOD band changes dirty only currently visible retained chunks
- material and LOD crossings during gestures are deferred through the existing gesture throttle path

Fix-round transition contract:

- `drawScene` now precomputes active chunk command keys, removes chunks leaving
  the active window, and then destroys every retained chunk whose command key,
  LOD tier, or material-texture gate is invalid before drawing any replacement
  chunk.
- Replacement chunks are drawn only after the stale set is gone, so a
  zoom/window transition cannot observe outgoing and incoming chunk groups
  mounted together.
- Settled scene content is unchanged: this is a lifecycle/order fix, not a
  render-command, data, palette, geometry, or curated-byte change.

Still full reset by design:

- first scene draw
- scene object identity changes
- static renderer option changes that alter debug/label/texture signatures
- atlas texture signature changes after texture load

Those cases alter global renderer assumptions or layer content enough that a retained reset is the safer boundary.

## Perf Expectations

`windowFor` now scales with chunks intersecting the camera window plus overincluded coverage candidates, rather than the full command buffer. Renderer refreshes should allocate/destroy fewer Pixi objects during pan, zoom-band, and texture-gate transitions because retained chunks survive unchanged refreshes.

The Graphics count should remain in the same budget class for current scenes, but the chunk split can duplicate some pass-level Graphics across active chunks. The browser perf gate remains the authority for the `Graphics <= 1600` and `rebuild <= 350ms` budgets.

The gesture throttle contract is preserved: the existing 250ms refresh cadence still drives gesture window refresh, and LOD/material gate crossings now share that deferred path.

Fix-round verifier hardening:

- `scripts/verify-emulator-perf.mjs` now samples Graphics during the zoom
  transition and stores the peak as `zoomTransition.graphics`.
- The same report also records `settledGraphics`, `settledMs`, and `settled`;
  a transition that does not reach a stable rebuild/Graphics snapshot inside
  two seconds fails.
- This keeps the peak Graphics contract strict while making Riverside resize
  settlement visible in reviewer-run browser proof.

## Gates

- `pnpm typecheck:starter`: PASS
- `pnpm test:core`: PASS, 148 tests
- `node scripts\verify-deterministic-generated-district-specs.mjs`: PASS
- `node scripts\verify-archetype-identity-sweep.mjs`: BLOCKED after structural compile by verifier script `ReferenceError: MOUNTAIN_OPENING_DROP_TILE_FLOOR is not defined` at `scripts/verify-archetype-identity-sweep.mjs:350`

Browser perf/audit and screenshot comparison were not run locally. The perf script now includes an additive zoom-transition timing probe, but the reviewer-run browser lane should execute the full matrix and the before/after screenshot compare for Riverside plus one generated county.

## Risks

- Same-band terrain or lot drawing is now split by chunk. Shared root layers and z-ordering are preserved, but screenshot compare is still required to prove zero visual diff.
- Future nonzero LOD content must assign tiers before the window annotation point if it needs compile-time ownership. For this packet, tier 0 default is intentional to protect byte identity.
- The archetype sweep blocker is in an out-of-fence verifier script state, so I did not patch it in this packet.
