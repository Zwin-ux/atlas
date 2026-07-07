# 0.72H Fable Generated Draft Visual Quality Gate

Date: 2026-07-06
Worktree: `C:\Users\mzwin\Documents\atlas-53e-fable`
Branch: `fable/0.58e-prop-cleanup`

## Status

Review candidate, not merged.

Fable started the object-grammar pass, then hit an API connection drop. Codex
stopped the stale sessions, kept the Fable diff, fixed the compile race, trimmed
oversized comments, ran verification, and wrote this packet. Changes remain
uncommitted for file-by-file review.

## What Changed

- Commercial rows now assign one textured Plaza Row hero strip per commercial
  zone and route the rest through primitive storefront grammar.
- Residential zones with enough parcels now get one downtown-facing corner
  market instead of reading as uninterrupted houses.
- Apartment parcels rotate through tower, mid-court, and low-court silhouettes.
- Apartment heights are clamped against the projected eave/window clearance so
  facade details do not sink below the wall base.
- Generated parity metrics now separate strip rows from corner storefronts and
  track hero-strip duplication/missing counts.

## Files Touched

- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `artifacts/0.72h-fable-generated-draft-visual-quality/FABLE_RESULT.md`
- `artifacts/0.72h-fable-generated-draft-visual-quality/generated-district-parity.json`
- `artifacts/0.72h-fable-generated-draft-visual-quality/generated-district-widget.json`
- `artifacts/0.72h-fable-generated-draft-visual-quality/screens/generated-district-desktop-1280x720.png`
- `artifacts/0.72h-fable-generated-draft-visual-quality/screens/generated-district-mobile-390x844.png`

## Verification

- `pnpm --dir packages/core build` - pass
- `pnpm --dir packages/core test -- city-world-parametric-parity.test.ts` - pass, 20 files / 95 tests
- `node scripts\verify-generated-district-parity.mjs --json-only` - pass
- `node scripts\verify-generated-district-widget.mjs --url http://127.0.0.1:8792/preview --screenshots artifacts\0.72h-fable-generated-draft-visual-quality\screens --json-only` - pass

Key generated parity values:

- `emptyPadCount`: 0
- `padFootprintFillFloor`: 0.482
- `padFootprintFillMean`: 0.721
- `roofOverhangCount`: 0
- `apartmentColumnClearanceFloor`: 1.349
- `toyCommerceCount`: 0
- `cornerMarketCount`: 1
- `heroStripCount`: 2
- `stripZoneCount`: 2
- `heroCrownDuplicateZones`: 0
- `heroCrownMissingZones`: 0
- desktop lower-frame occupancy: 0.201
- mobile lower-frame occupancy: 0.138

## Screenshot Proof

- Desktop: `artifacts/0.72h-fable-generated-draft-visual-quality/screens/generated-district-desktop-1280x720.png`
- Mobile: `artifacts/0.72h-fable-generated-draft-visual-quality/screens/generated-district-mobile-390x844.png`

Browser verifier result:

- generated mode active
- honesty banner present
- one canvas
- no horizontal overflow
- no console failures reported by the verifier

## Remaining Weaknesses

- The screenshots still show generated-place labels. This pass improves
  geometry and object grammar, but it does not meet a strict no-label art bar.
- The top generated-preview banner still covers part of the scene. It is honest
  product copy, but it is not ideal for art inspection.
- The pass improves commercial/apartment/residential massing, but it is still a
  procedural district, not a final public playable county.

## Merge Guidance

Do not merge blindly. Review `cityWorldParametricGenerator.ts` first for:

- whether generated labels should be hidden or demoted in the next visual slice;
- whether the corner-market conversion should be deterministic per zone family;
- whether the hero strip count should be exactly one per commercial place in
  all generated county specs, not only the sample district;
- whether the added parity metrics should become a new 0.72H-named verifier
  instead of extending the 0.58E parity verifier.

Anti-scope honored: no backend, Railway, DB, Auth, Stripe, provider geometry,
public paid claims, cars, humans, dashboard UI, or public playable promotion.
