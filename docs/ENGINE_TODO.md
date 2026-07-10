# Engine TODO — product-engineer review vs the north star

Status: ACTIVE work queue (2026-07-10). Anchor: `assets/reference/
atlas-voxel-town-north-star.png` — the concept art every gap below is judged
against. Method: full-index error hunt (3,222 compiles, zero throws/NaN/empty
scenes — the engine is structurally sound) + side-by-side of the six fresh
archetype screenshots against the reference. Codex is the workhorse; every
packet lands uncommitted for reviewer certification through the emulator.

## Defects (found by the hunt — fix first)

- **E1 · Arid river towns are waterless and landmarkless.** 7 counties
  (andrews-tx, brewster-tx, gaines-tx, …) classify `river_town` via the seed
  fallback, then aridity strips the water zone — and the river_boathouse
  landmark loses its water-edge host. A "river town" with no river and no
  focal point. Fix in the spine: river_town selection must respect aridity
  (arid → desert/prairie), and add the invariant water-archetype ⇒ water
  tiles > 0 ∧ landmark present. Regression-test the 7 slugs.
- **E9 · No structural gate at index scale.** The hunt that found E1 was a
  scratch script. Promote it: full-index compile + sanity assertions (no
  throw, buildings>0, places>0, landmark present, finite geometry, water
  invariant) into `verify-archetype-identity-sweep.mjs`.

## North-star gaps (concept-art-anchored, by visual leverage)

- **E2 · Tree/vegetation saturation.** The reference is DENSE with chunky
  voxel trees — street trees, park clusters, shelter rows. Generated boards
  have 3–8. Prop budget has room (~30/90 used; worst window 938/1600 —
  ~50 trees ≈ +100 Graphics, safe). Zone-aware placement: parks dense,
  residential street-tree rhythm, prairie shelter rows, desert sparse scrub.
  The single biggest "reads hand-built" lever.
- **E3 · Water must read as WATER.** Reference: deep blue bodies, beach
  transitions, dock + boats. Generated coastal/river: a teal ground tint.
  Deepen water tone, widen the body so it reads at overview, shore banding,
  ensure the river actually crosses the board (not a corner patch).
- **E4 · Terrain strata.** Reference mountains are stacked cliff courses with
  summit tones. Renderer already supports cliff courses (0.74F) — amplify
  per archetype: mountain multi-course relief, desert mesa rims, river banks.
  (Supersedes the rogue Axiom packet-0.76-4 draft — author fresh.)
- **E5 · No empty blocks.** Reference fills every non-building block: farm
  rows (prairie!), plaza paving, park greens. Generated has bare pads and
  blank parcels. Per-archetype block fills: prairie crop-row fields, metro
  plaza paving, desert dry-wash texture.
- **E6 · Generated buildings never reach curated material grammar.**
  `materialProfile`/`roofProfile` key off curated Eastvale ids
  (cityWorldCompiler.ts:1459,1533) — generated silently degrades to defaults.
  Route through authored grammar (facadeStyle/roofShape), not id matches.
- **E7 · Non-civic towers fall through to terracotta** (compiler:1505) — the
  prairie grain-elevator and desert mesa tower need tower roof grammar.
- **E8 · River-town clone pressure sits at the 0.30 ceiling** — add
  residential template variety before any density push.

- **E10 · Water-archetype opening frame should include the shoreline.** E3
  gave coastal a 297-tile sea band, but the overview camera (composition-
  scored on built mass) can open with the sea entirely off-frame. A blind
  focus bias toward the water zone failed review (landed in no-man's-land and
  broke the lower-frame occupancy floor 0.154 < 0.18). Correct fix: teach
  `generatedOverviewFocus`'s composition scorer to VALUE water presence for
  water archetypes, so it picks a frame with both mass and shoreline. Own
  packet; parity floors are the gate.

## Packet queue (Codex workhorse, reviewer-certified per packet)

| # | Packet | Scope | Gate it must add/hold |
|--:|---|---|---|
| 1 | E1+E9 spine fix + structural gate | cityWorldCountyParameters + sweep script | water invariant + 7-slug regression; sweep stays green |
| 2 | E2 vegetation saturation | generator prop placement | prop ≤90, Graphics ≤1600 (reviewer), parity green |
| 3 | E3 water read + E4 terrain strata | archetype layouts + renderer water/cliff treatment | parity + perf; screenshot judgment |
| 4 | E5 block fills | generator lot/terrain treatments | composition floors rise, no clutter regression |
| 5 | E6+E7 grammar routing | compiler | curated Riverside byte-identical; parity green |

Anti-scope per AGENTS.md unchanged: no new deps, no new prop kinds beyond the
existing vocabulary, forbidden {parked_car, cloud} stays (reference cars are
deliberately NOT reproduced), honesty invariants stop-ship.
