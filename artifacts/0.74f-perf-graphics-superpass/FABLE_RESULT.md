# 0.74F Engine Performance + Voxel Graphics Superpass

Date: 2026-07-06
Worktree: `C:\Users\mzwin\Documents\atlas-53e-fable`
Branch: `fable/0.58e-prop-cleanup`
Commits: `6a7211c` (0.72H-b+0.73F baseline) → `5c855d4`, `55b32a9`, `f6c180d`, `3c03925`, `c447e8b`, `4fc6b87`, `5fd1dc8`, `7531900` + this stage.

## What shipped (9 stages, each committed + verified)

### Performance

1. **Scene-window compile** (core): the render-command buffer builds ONCE per
   compile (was twice), sourceIds resolve through an id-indexed
   `CityWorldSceneItemIndex` (was O(commands × items) linear scans), chunk
   membership uses Sets, and `createCityWorldSceneWindowCompiler` memoizes all
   frame-independent artifacts per scene so streaming pan refreshes only
   re-run the frame filter.
2. **Perf probe**: `__ATLAS_QA__.perf` exposes sceneRebuilds / lastRebuildMs /
   overlayRedraws / renderedFrames / animatedTargetCount() / loopParked() /
   graphicsCount().
3. **Incremental hover/selection**: the base scene is focus-agnostic; a
   dedicated `focusLayer` overlay effect draws the emphasized ring (owning the
   pulse animation), stroke-only building silhouettes, and the emphasized
   label. Hover cost went from a full teardown of ~5,400 Graphics to ~4–10
   overlay Graphics. Proven live: pointerover leaves `sceneRebuilds` frozen.
4. **Render-on-demand**: `app.stop()` + component-owned rAF loop that renders
   only when dirty or animating (ambient capped ~30fps via wall-clock — rAF
   timestamps are virtualized in headless environments), then PARKS at 0fps.
   The focus pulse freezes 4s after a focus change so the permanent default
   selection can't pin the loop. ResizeObserver replaces ticker-driven resize.
5. **Merged Graphics**: terrain/lots merge into depth-band Graphics
   (`floor((x+y)/4)`, order-safe by band partition); the road network renders
   as 11 pass Graphics; pads/cast shadows fold to one Graphics each.

**Measured (authored Riverside desktop): 5,423 → ~700 world Graphics; window
rebuild 73ms → 10–25ms; idle 60fps → 0fps parked.**

### Graphics

6. **Terrain relief**: bilinear heightGrid relief quantized to road-grid block
   z levels {0, 0.5, 1}; water + shore ring force z=0; road corridors take the
   lower bordering block. Tiles/lots/buildings/props/places/roads inherit
   block z (core-tested). The generator authors
   `visualGrammar.elevation {z, dropSides, dropDepth}`; the renderer extrudes
   stacked voxel cliff courses (sun-consistent lit/shade on south/east, dark
   cuts on north/west that also cover the projection gap). Shore upgraded to a
   beach read (sand wedge + dry/wet lines). Riverside untouched (no
   heightGrid → z=0 by construction).
7. **Chunky buildings**: stepped flat-roof parapet (inner well + raised inset
   cap), per-storey wall block-courses in wall-plane coordinates, setback top
   tier for tall apartment slabs, sun-corner pillar. All inset-or-vertical —
   parity roof/facade gates can't regress.
8. **Full prop kit** (user-approved contract revision): forbidden set is now
   {parked_car, cloud} across render commands AND scene diagnostics, with a
   `maxPropCommands: 90` window cap replacing the blanket ban. New `voxelBox`
   primitive; trees/bushes are stacked-cube voxel canopies; new dock, boat,
   water tower kinds (+ atlas palettes). Deterministic per-zone placement in
   the generator (fountain plazas, streetlights, benches, signs, shore dock +
   moored boat, one district water tower on the highest block) and ~12 curated
   props for authored Riverside (Eastvale Core fountain plaza, Hamner/Limonite
   streetlights, river dock + boat, gym-block water tower).
9. **`scripts/verify-widget-performance.mjs`** (`pnpm verify:widget:perf`):
   gates hover-never-rebuilds, idle-parks/ambient-capped, small-pan-is-
   transform-only, streaming rebuild latency (min of 2 samples ≤ 350ms — wall
   time tolerates host load) and the deterministic world-Graphics ceiling
   (≤ 1,600; a merged-architecture regression trips it at any load).

## Verification (final sweep, all green)

- `pnpm typecheck:starter` · `pnpm test:core` **97/97**
- `verify-generated-district-parity` (all gates + floors + detection proofs)
- `verify-generated-district-widget` (desktop + mobile)
- `verify-widget-performance` (hover 0 rebuilds / idle parked / rebuild
  10.8ms / 790 Graphics worst window)
- Full 19-verifier renderer-coupled sweep, including the two contract updates
  (`verify-object-kit-renderer-consumption`,
  `verify-public-object-identity-civic-service`) rewritten from the retired
  decal-read contract to the wall-plane facade + tiered-crown + sawtooth
  identity contract (both had been red since 0.73F removed the decal calls).
- Screenshots in `screens/` (authored + generated, desktop + mobile).

## Honest visual read

0.73F landed at ~6/10 vs `assets/reference/atlas-voxel-town-north-star.png`.
This pass reads **~7.5/10**: terrain plateaus with stacked cliff courses and a
recessed shore basin, stepped chunky buildings, seamless road grid with end
caps, and a living prop layer (voxel tree groves, fountain plazas,
streetlights, dock + boat). The remaining gap: richer material texture inside
walls/roofs at close zoom, denser residential fabric, and prop/building depth
interleaving (props layer above buildings — fine at map zoom, wrong occlusion
possible at extreme detail zoom). None of it blocks product work.
