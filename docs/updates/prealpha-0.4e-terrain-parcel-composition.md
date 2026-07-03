# Pre-Alpha 0.4E - Terrain / Parcel World Composition

## Goal

Make Riverside/Eastvale read less like buildings on an empty green board and
more like a coherent voxel county surface. This update strengthens the terrain
and parcel layer under the existing 0.2E road/roof grammar and 0.3E object
authorship pass.

## Scope

- Public Riverside terrain composition:
  - quiet fields;
  - neighborhood yard fabric;
  - civic focus fields;
  - commercial apron fields;
  - park basins;
  - waterfront edge strata.
- Public Riverside parcel composition:
  - home yard grids;
  - commercial aprons;
  - civic landmark plinths;
  - apartment court grids;
  - park path basins;
  - waterfront banks.
- Shell counties keep shell-boundary terrain only.
- Hidden Anaheim/Ontario drafts keep hidden-draft field and anchor-pad grammar
  without public switcher exposure or playable claims.

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
node scripts\verify-terrain-parcel-composition.mjs --json-only
pnpm test:core
pnpm typecheck:starter
pnpm build:starter
pnpm verify:preview:http
node scripts\verify-engine-beta-coverage.mjs
node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only
```

Browser proof must include Riverside desktop, Riverside `390x844` mobile,
residential-detail, Orange shell mobile, and Unknown/L0 mobile.
