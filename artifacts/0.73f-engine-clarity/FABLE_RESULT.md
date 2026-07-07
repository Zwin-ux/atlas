# 0.73F Fable Engine Clarity Pass

Date: 2026-07-06
Worktree: `C:\Users\mzwin\Documents\atlas-53e-fable`
Branch: `fable/0.58e-prop-cleanup` (uncommitted, stacked on the 0.72H-b working-tree changes)

## Status

Working-tree candidate, not committed. Verified green (see Verification).

## What this pass was

A root-cause engine quality pass on the CityWorld renderer + parametric
generator. Layer-bisection QA (via a new `window.__ATLAS_QA__` hook) attributed
the scene-wide "translucent ghost town" read to five systemic defects, all
fixed at the source:

1. **Misregistered translucent decals.** Windows, storefront bands, and 15
   accreted "authorship pass" functions drew screen-space shapes with ad-hoc
   offsets at 0.1–0.6 alpha — floating off walls, leaking past silhouettes,
   averaging into fog. Replaced with ONE wall-plane facade system
   (`wallSurface`/`wallPoint`/`wallQuadPoints` + `drawWallFacade`): every
   window/storefront/door is authored in wall-plane (u,v) coordinates through
   the same corner math as the wall quads, opaque, and cannot escape the wall.
2. **Cast shadows at 0.5 alpha swept ~100px** painted half-black sheets across
   roads and pads. Now a short 0.14 sweep + 0.05 penumbra.
3. **Translucent pads/lots** (0.46–0.52 alpha) read as cream cards floating on
   grass. Pads and lots are now opaque ground material with a thin solid slab
   lip; waterfront lots draw nothing (water terrain carries the surface).
4. **Sprite art on parametric footprints.** Generated buildings are pinned to
   a primitive-fallback sprite key; the authored rowhome/strip textures (which
   assume curated Eastvale footprints) can no longer explode on jittered
   generated widths. Hero-sprite strips retired from the generator.
5. **Roof scribble stacks** (shingle courses + chevron tile courses + metal
   sheen + parapet squiggles + naked sawtooth strokes). One stroke system per
   roof; sawtooth is now filled alternating lit/shade tooth strips.

Structural fixes that came out of the same diagnosis:

- **Road/lot layering**: lots draw under roads, so an embedded road cuts a
  park instead of a park sheet covering the road.
- **Sample district re-authored as blocks between a road grid** (x=16, x=28,
  y=13) with full clearance — roads bound blocks, never slice them — plus a
  `parcelClearsRoads` safety net so no generated building can straddle a
  corridor on any future spec.
- **Self-optimizing commerce camera**: `commerce_detail` scores candidate
  centers with the real projected frame (same formula as the diagnostics
  composition floor) instead of averaging dispersed zone centers into a road
  gap.
- **Selection ring** moved to the ground layers (padLayer) so it can never
  draw across a wall.
- Place-marker/QA extras: `__ATLAS_QA__` exposes `{app, world, scene}` for
  layer-bisection QA and future verifiers.

## Files touched (this pass)

- `web/src/CityWorldRenderer.tsx` — facade system, shadow/pad/lot/roof fixes,
  layer order, marker ring, QA hook
- `packages/core/src/voxel/cityWorldParametricGenerator.ts` — primitive sprite
  pinning, road-grid district plan, parcel/road clearance, anchor pad hug,
  camera optimizer
- `artifacts/0.73f-engine-clarity/` — this file + verifier screenshots

## Verification

- `pnpm typecheck:starter` — pass
- `pnpm test:core` — 95/95 pass (20 files)
- `node scripts/verify-generated-district-parity.mjs` — **OK**: all 10 gates,
  all 4 scene floors (incl. first-viewport composition ≥ 0.60 and mobile
  lower-frame ≥ 0.10 that the old layout failed), all 6 detection proofs fire
- `node scripts/verify-generated-district-widget.mjs` (live :8793) — pass on
  desktop 1280×720 and mobile 390×844: generated mode, honest banner, labels
  suppressed, 1 canvas, no overflow
- Before/after screenshots: authored Riverside + generated district at both
  viewports; baseline ghosting/smears/sprite wrecks all gone

## Honest visual read

Baseline was ~2/10 against `assets/reference/atlas-voxel-town-north-star.png`
(translucent ghost buildings, floating decals, incoherent roads). This pass
lands ~6/10: solid, registered, coherent — it reads as an authored isometric
town. The remaining gap to the north star is identity, not correctness:
voxel-chunky silhouettes, terrain relief (hills/beach/shore strand), richer
prop kit (blocky trees, plaza furniture), and road intersection joins. That is
the next visual slice; nothing in this pass blocks it.
