# Pre-Alpha 0.6E - Terrain Chunk Massing / World-Edge Composition

## Goal

Make Riverside/Eastvale read less like subtle tile decoration and more like a
physical voxel terrain board. This update strengthens visible terrain chunk
massing on top of 0.5E terrain elevation and chunk-edge grammar.

## Scope

- Public Riverside terrain chunk massing:
  - outer world-edge mass;
  - civic plinth mass;
  - residential shelf mass;
  - commercial slab mass;
  - park basin cut mass;
  - waterfront bank cut mass.
- Shell counties use shell boundary mass only.
- Hidden Anaheim/Ontario drafts use hidden draft mass only and remain
  non-public/non-playable.
- Renderer uses under-tile side faces, rim lines, shadows, and strata to make
  massing read before labels or UI help.

## Anti-Scope

- No cars, humans, signs, streetlights, benches, fountain, clouds, dashboard
  panels, glows, labels-as-crutches, or filler props.
- No provider or Google-derived geometry.
- No public Anaheim/Ontario promotion.
- No DB, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth, automation,
  reports, exports, staging, commit, or deploy.

## Proof

Run:

```powershell
node scripts\verify-terrain-chunk-massing-grammar.mjs --json-only
node scripts\verify-terrain-elevation-chunk-grammar.mjs --json-only
node scripts\verify-terrain-parcel-composition.mjs --json-only
node scripts\verify-object-authorship-scene-grammar.mjs --json-only
node scripts\verify-roads-roofs-scene-grammar.mjs --json-only
pnpm test:core
pnpm typecheck:starter
pnpm build:starter
pnpm verify:preview:http
node scripts\verify-engine-beta-coverage.mjs
node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only
```

Browser proof must include Riverside desktop, Riverside `390x844` mobile,
residential-detail desktop/mobile, Orange shell mobile, and Unknown/L0 mobile.

Pass only if the screenshots show stronger physical terrain massing within
three seconds. Block if the work reads like another subtle stroke pass, noisy
stripes, or product/UI compensation.
