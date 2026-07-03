# Pre-Alpha 0.2E - Roads & Roofs / Scene Compiler

## Promise

Riverside/Eastvale should read more like a physical voxel county world and less
like placeholder blocks.

## What Changed

- `CityWorldScene` objects now carry typed visual grammar metadata for terrain,
  roads, lots, building material, roof material, and contact shadows.
- The compiler assigns shared profiles such as `embedded_asphalt_slab`,
  `home_parcel_pad`, `terracotta_barrel_tile`, `flat_parapet_cap`, and
  `parcel_pad_shadow`.
- The production Riverside palette removes the remaining loud gym and strip
  store roof colors from compiler output.
- The renderer pass adds restrained public-road wear, curb lift, lot edge
  grounding, eave/parapet strokes, and roof course material without adding cars,
  people, filler props, panels, or provider data.
- `scripts/verify-roads-roofs-scene-grammar.mjs` protects the contract.

## What Stays Parked

- Public Anaheim/Ontario playability.
- Google/provider-derived scene geometry.
- DB/persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation,
  reports, and exports.
- Cars, humans, decorative prop clutter, dashboard panels, and broad UI sprawl.

## Big 4 Packets

- Axiom: scene compiler contract, verifier, update manifest, release gates.
- Lumen: renderer material pass and screenshot evidence.
- Forge: split and 0.1E provider-boundary guard.
- Mira: product/mobile proof after the integrated slice.

## Verification

- `node scripts/verify-roads-roofs-scene-grammar.mjs`
- `node scripts/verify-no-google-in-renderer.mjs`
- `node scripts/verify-provider-boundaries.mjs`
- `node scripts/verify-tool-result-shape.mjs`
- `pnpm test:core`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `pnpm verify:preview:http`
- `node scripts/verify-engine-beta-coverage.mjs`
