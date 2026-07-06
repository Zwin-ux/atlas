# 0.58E Generated District Parity + Numeric Proof — Fable result

Branch: `fable/0.58e-prop-cleanup` (worktree `atlas-53e-fable`). All changes
left **uncommitted** for Codex review, per instructions.

## What this slice is

The 0.57E parity fixes (strip-row commerce, empty-ring removal, density,
roof/eave clamp, apartment window columns) were proven by screenshots only.
This slice adds the numeric layer so generated-district quality can FAIL a
gate, plus closes the residual density gaps the new numbers exposed.

## Files changed

- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
  - NEW `analyzeGeneratedDistrictParity(scene)` — generator-seam structural
    diagnostics (no screenshot OCR):
    - **pad honesty**: per buildable lot, is there a building and how much of
      the pad does its footprint fill (`emptyPadCount`,
      `padFootprintFillFloor/Mean`);
    - **roof/eave registration**: building bbox vs lot-pad bbox from the
      shared footprint bounds (`roofOverhangCount`, `maxOverhangTiles`);
    - **facade element bounds**: apartment window-column eave clearance,
      scale-free from `CITY_WORLD_TILE_BASIS` (tileHeight 24 / tileDepth 18)
      + the renderer's proportional column layout in `drawApartmentDetails`
      (`apartmentColumnClearanceFloor`, unsafe count);
    - **commerce grammar**: strip_store facade + commerce_strip prefab
      routing ratio, toy-slab width floor, bay-count floor;
    - **frame density**: screen-lower band occupancy for desktop/mobile
      presets — split on projected x+y (true screen-lower), frame clipped to
      world bounds so off-board area cannot dilute the denominator.
  - Density residuals: commercial strip columns now `ceil` (a 7-tile zone
    gets two strips, not one lonely slab); apartment courts pack tighter
    (cell 2.9, default density 0.74; sample spec cluster 0.78).
- `packages/core/src/voxel/index.ts`, `packages/core/src/index.ts` — export
  the new function + report types.
- `packages/core/test/city-world-parametric-parity.test.ts` — NEW, 6 tests:
  healthy floors + one negative test per failure mode.
- `scripts/verify-generated-district-parity.mjs` — NEW verifier (see below).
- `scripts/verify-generated-district-widget.mjs` — bugfix: `--url` was
  resolved BEFORE flag parsing, so proof runs silently hit whatever server
  owned :8787. This bit during this slice (see honesty note).
- `docs/BUILD_LOG.md` (Entry 088), `docs/NEXT_QUESTS.md` (branch-local note).

## The new verifier

`node scripts/verify-generated-district-parity.mjs [--json-only]` — exit 1 on
any failure.

- **9 numeric gates**: empty pads == 0; pad fill floor >= 0.40; pad fill mean
  >= 0.60; roof overhang == 0; apartment column clearance floor >= 1; strip
  routing ratio == 1; toy commerce == 0 (min width >= 2.4, bays >= 4);
  desktop lower-frame occupancy >= 0.18 & balance >= 0.9; mobile lower-frame
  occupancy >= 0.10 & balance >= 0.6.
- **4 shared scene floors** via `analyzeCityWorldScene` (composition >= 0.6,
  empty board <= 0.1, clone pressure <= 0.3, building/lot contact >= 0.95) +
  zero hard blockers.
- **Detection proof (the verifier can fail)**: every run degrades a clone of
  the healthy scene per known 0.57E failure mode — strip buildings off lower
  lots, shrink shops to 1.3-tile toys, push a footprint past its pad, deepen
  an apartment until columns sink below the wall, empty the screen-lower
  half — and asserts the matching gate FIRES. All 5 fire (degraded values:
  6 empty pads, 1.3 width, 1 overhang, 0.714 clearance, 0.0 lower frame).
- **Curated Riverside reference readout** (not gated): the parity target the
  generated numbers sit next to.

## Commands run (all green)

| Command | Result |
| --- | --- |
| `pnpm test:core` | 95/95 (6 new) |
| `pnpm typecheck:starter` | green |
| `pnpm build:web` | green, component.js 959.8kb |
| `node scripts/verify-parametric-generator.mjs` | OK — 37 buildings / 39 lots |
| `node scripts/verify-generated-district-parity.mjs --json-only` | ok:true — 9 gates + 4 floors + 5 detection proofs |
| `node scripts/verify-generated-district-widget.mjs` (vs :8791) | ok:true desktop+mobile, honesty banner, 0 console errors |
| `node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8791/preview --screenshots artifacts/0.58e-generated-parity-plus/verify` | ok:true desktop+mobile |
| `node scripts/verify-fable-prop-cleanup.mjs` | ok:true, 0 blockers |
| `git diff --check` | clean |

## Numeric results (healthy generated district)

- emptyPadCount **0**; lotBuildingFillRatio **1.0**; pad fill floor **0.482**
  (civic plinth pad — intentional forecourt), mean **0.719**.
- roofOverhangCount **0**, maxOverhangTiles **0**.
- apartmentColumnClearanceFloor **1.301** (unsafe count 0), min width 2.69.
- stripStoreRatio **1.0**, min strip width **2.94**, bay floor **4**, toy
  commerce **0**.
- Desktop lower frame **0.269** occupancy / balance **1.912** (curated
  Riverside reference: 0.194). Mobile lower frame **0.131** / balance
  **0.876**.
- Scene floors: composition 0.775, empty board 0, clone pressure 0.107,
  building/lot contact 1.0.

## Screenshots (fresh worktree bundle, server on :8791)

- `verify/generated-district-desktop-1280x720.png`
- `verify/generated-district-mobile-390x844.png`
- `verify/alpha-product-loop-desktop-1280x720.png`
- `verify/alpha-product-loop-mobile-390x844.png`

Visual read vs `artifacts/0.57e-parity/final-generated-desktop-1280x720.png`:
same accepted strip-row composition plus the 0.58E density gains — a second
strip in the south commons, an extra commercial-row strip, and a second
apartment court mass visible in frame. Vs curated
`riverside-with-fit.png`: closer, not equal (see residuals).

## Honesty notes

- **Stale-server hazard (caught and fixed)**: the first screenshot run
  silently hit a pre-existing dev server from the canonical
  `C:\Users\mzwin\Documents\Atlas` tree on :8787 (stale bundle). Root cause
  was the widget verifier resolving its URL before parsing `--url`. I did
  not touch that tree or its server; re-ran this worktree's server on :8791
  and recaptured. The verifier bug is fixed so this cannot silently recur.
- The mobile screenshot's deep-lower green is off-board world edge; the
  in-board lower band is what the mobile gate measures (0.131, clipped
  frame).

## Residual blockers (honest)

1. **Commercial apron terrain** — the biggest remaining procedural read.
   Commercial zones paint plaza-apron terrain across the whole zone rect,
   much larger than the strip rows on it (dotted tan fields in the desktop
   shot). Curated pad-fill mean is 0.993 vs generated 0.719. Not yet gated
   because it is terrain-level, not lot-level.
2. **Rooftop unit palette** — generated strips read more saturated
   (yellow/coral/teal units) than curated Riverside's calmer material read.
3. Mobile lower-frame balance (0.876) passes its 0.6 gate but still trails
   the upper band; the sample spec's south content is thin at mobile zoom.

## Next exact blocker

Shrink generated commercial-zone apron terrain to hug the strip rows (or
author it as parking-court composition), then gate the apron-to-strip
terrain ratio in `analyzeGeneratedDistrictParity` so it cannot regress —
that is the single change that would move the generated desktop read closest
to curated Riverside.
