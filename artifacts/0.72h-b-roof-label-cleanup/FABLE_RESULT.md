# 0.72H-b Fable Roof / No-Label Cleanup Gate

Date: 2026-07-06
Worktree: `C:\Users\mzwin\Documents\atlas-53e-fable`
Branch: `fable/0.58e-prop-cleanup`

## Status

Review candidate, not merged.

Claude/Fable was launched as background agent `664103ff` with the bounded
roof/label prompt, but stayed in analysis without producing a patch. Codex
stopped it to avoid two agents writing the same renderer/generator files, then
implemented the deterministic cleanup and verifier gates.

## What Changed

- Generated preview now passes `suppressPlaceLabels` into `CityWorldRenderer`.
- `CityWorldRenderer` exposes `data-qa-place-labels` so browser proof can assert
  generated labels are suppressed.
- Generated residential templates no longer include the tiny/tall hip cottage.
- Home dimension jitter is lower than non-home jitter so generated roofs stay
  in safer silhouette buckets.
- Generated gable/hip roof linework is simpler than authored Riverside linework:
  generated gables keep a ridge plus side eaves; generated hips keep an inset
  roof diamond.
- Generated home roof-course strokes are restrained to avoid hatchy diagonal
  clutter.
- Generated parity now reports residential roof metrics and fails an injected
  unsafe roof case.
- Generated widget verifier now fails if generated map labels are not
  suppressed.

## Files Touched

- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `scripts/verify-generated-district-parity.mjs`
- `scripts/verify-generated-district-widget.mjs`
- `web/src/CityWorldRenderer.tsx`
- `web/src/CityWorldView.tsx`
- `artifacts/0.72h-b-roof-label-cleanup/FABLE_RESULT.md`
- `artifacts/0.72h-b-roof-label-cleanup/generated-district-parity.json`
- `artifacts/0.72h-b-roof-label-cleanup/generated-district-widget.json`
- `artifacts/0.72h-b-roof-label-cleanup/screens/generated-district-desktop-1280x720.png`
- `artifacts/0.72h-b-roof-label-cleanup/screens/generated-district-mobile-390x844.png`

## Verification

- `pnpm --dir packages/core build` - pass
- `pnpm --dir packages/core test -- city-world-parametric-parity.test.ts` - pass, 20 files / 95 tests
- `node scripts\verify-generated-district-parity.mjs --json-only` - pass
- `pnpm typecheck:starter` - pass
- `pnpm build:starter` - pass
- `node scripts\verify-generated-district-widget.mjs --url http://127.0.0.1:8793/preview --screenshots artifacts\0.72h-b-roof-label-cleanup\screens --json-only` - pass

Key generated parity values:

- `emptyPadCount`: 0
- `roofOverhangCount`: 0
- `apartmentColumnUnsafeCount`: 0
- `toyCommerceCount`: 0
- `residentialRoofMetrics.unsafeRoofCount`: 0
- `residentialRoofMetrics.pitchedHomeCount`: 20
- `residentialRoofMetrics.flatRowhomeCount`: 9
- `desktop lower-frame occupancy`: 0.201
- `mobile lower-frame occupancy`: 0.138

Browser verifier result:

- generated mode active
- honesty banner present
- one canvas
- no horizontal overflow
- generated place labels suppressed on desktop and mobile

## Screenshot Proof

- Desktop: `artifacts/0.72h-b-roof-label-cleanup/screens/generated-district-desktop-1280x720.png`
- Mobile: `artifacts/0.72h-b-roof-label-cleanup/screens/generated-district-mobile-390x844.png`

## Visual Read

This clears the specific 0.72H-b blockers: visible generated-place labels are
gone, and the worst roof-generator failure, the tiny/tall hip cottage, is no
longer present. Roofs read calmer because generated roof strokes are simpler and
home dimensions jitter less.

This is still not final art quality. The generated-preview banner still covers
part of the top-left scene, and some house/detail strokes still read procedural
at close inspection. The next visual slice should focus on an authored
residential object kit or closer generated residential camera proof rather than
adding more district-wide clutter.

## Merge Guidance

Do not merge blindly. Review the five source files file-by-file. This candidate
stays within visual-engine scope and does not touch backend, Railway, DB/Auth,
Stripe, provider geometry, MCP tools, public paid claims, cars, humans,
dashboard UI, or public playable promotion.
