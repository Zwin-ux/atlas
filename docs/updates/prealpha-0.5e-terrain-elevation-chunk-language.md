# Pre-Alpha 0.5E - Terrain Elevation / Chunk Edge Language

## Goal

Make Riverside/Eastvale read less like a painted flat board and more like a
shallow voxel county surface. This update adds physical terrain/parcel depth on
top of 0.4E terrain/parcel composition.

## Scope

- Public Riverside terrain elevation:
  - flat fields;
  - raised parcel shelves;
  - civic plinth shelves;
  - commercial slab fields;
  - park basin shelves;
  - water-edge cuts.
- Public Riverside chunk edges:
  - world edges;
  - parcel-cluster edges;
  - waterfront bank edges;
  - park-basin edges.
- Public Riverside parcel elevation:
  - thin pad lips;
  - raised home shelves;
  - commercial slab lips;
  - civic plinth stacks;
  - apartment court lips;
  - park basin lips;
  - waterfront bank cuts.
- Shell counties stay `shell_flat`.
- Hidden Anaheim/Ontario drafts use hidden-draft shelves and boundaries without
  public switcher exposure or playable claims.

## Anti-Scope

- No cars, humans, benches, streetlights, signs, fountain, clouds, dashboard
  panels, glows, labels-as-crutches, or filler props.
- No provider or Google-derived geometry.
- No public Anaheim/Ontario promotion.
- No DB, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth, automation,
  reports, exports, staging, commit, or deploy.

## Proof

Run:

```powershell
node scripts\verify-terrain-elevation-chunk-grammar.mjs --json-only
node scripts\verify-terrain-parcel-composition.mjs --json-only
pnpm test:core
pnpm typecheck:starter
pnpm build:starter
pnpm verify:preview:http
node scripts\verify-engine-beta-coverage.mjs
node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only
```

Browser proof must include Riverside desktop, Riverside `390x844` mobile,
residential-detail, Orange shell mobile, and Unknown/L0 mobile. The visual pass
must improve physical terrain depth without adding noise or weakening the
product loop.

## Gate Result

0.5E passed the local Axiom gate, Lumen visual gate, Mira product/mobile gate,
and Forge split/provider gate. The improvement is real but subtle: Atlas now
has compiler-owned terrain elevation, parcel elevation, and chunk-edge language,
but the next voxel-engine slice must produce a stronger first-3-second visual
read. Do not follow this with another tiny side-face/stroke pass unless it
materially improves screenshots.

Default next candidate:
Pre-Alpha 0.6E Terrain Chunk Massing / World-Edge Composition.

Alternate if the team chooses object quality over terrain massing:
Pre-Alpha 0.6E No-Label Object / Anchor Recognition.
