# 0.75C-2 Denser Residential Fabric

## Slice

Player-facing promise:
Generated neighborhoods read as tighter small-house town fabric: more varied
cottages, compact ranches, and rowhomes along the street grid with fewer empty
lot gaps.

Engineering promise:
Increase residential density at the generator seam without changing
`CityWorldScene`, the scene compiler contract, authored Riverside, curated
props, forbidden prop kinds, `maxPropCommands`, or renderer dependencies.

## Levers Chosen

- Residential parcel cell: `2.4` -> `1.95`.
- Residential density floor: old explicit/default values around `0.78-0.82`
  now floor at `0.90`.
- Apartment cell: `2.9` -> `2.75`, with the existing facade-bound verifier
  still passing.
- Residential templates: replaced larger average homes with smaller cottages,
  compact ranches, and narrower rowhomes; added palette/roof color choices so
  more homes do not collapse into one clone group.

Why:
The sparse read was a frontage problem, not a renderer problem. Tighter parcels
and smaller footprints produce more continuous rows without touching scene
contracts. Template variation protects the clone-pressure gate while the
existing roof-safety verifier guards the smaller forms.

Corner-store note:
The corner-store module code and threshold were not changed. Because parcel
counts increased, one additional large residential block qualifies under the
existing rule in the representative sample.

## Representative Generated District

Scene: `city-world-parametric-sample-district`.

Residential zone area: `188` tile-area units.

| Metric | Before | After |
| --- | ---: | ---: |
| Homes | 20 | 38 |
| Homes / residential area | 0.106 | 0.202 |
| Lots | 33 | 53 |
| Buildings | 31 | 51 |
| Shops | 6 | 8 |
| Apartments | 3 | 3 |
| Total render commands, no labels | 1315 | 1355 |
| Residential-detail visible commands | 113 | 131 |

## Parity Tails

After `node scripts\verify-generated-district-parity.mjs --json-only`:

| Gate metric | After |
| --- | ---: |
| First-viewport composition | 0.688 |
| Empty-board ratio | 0 |
| Home clone pressure | 0.1052631579 |
| Building/lot contact ratio | 1 |
| Unsafe home roofs | 0 |
| Pad fill floor | 0.492 |
| Pad fill mean | 0.716 |
| Desktop lower-frame occupancy | 0.208 |
| Mobile lower-frame occupancy | 0.102 |
| Apartment clearance floor | 1.292 |

All parity gates passed, including composition >= `0.60`, empty-board <=
`0.10`, clone pressure <= `0.30`, building/lot contact >= `0.95`, and roof
safety.

## Graphics Cost Estimate

The browser performance gate is reviewer-run in this sandbox, but the core
command delta is bounded:

- Added homes: `+18`.
- Added lots/buildings overall: `+20` lots and `+20` buildings.
- Core render-command delta: `+40` total commands (`1315` -> `1355`).
- Worst sampled scene-window command delta from core:
  - mobile: `+2` visible commands (`462` -> `464`)
  - residential_detail: `+18` visible commands (`113` -> `131`)

The prior reviewer packet reported deterministic world Graphics worst window
around `844`. Even under a conservative `10-14` Graphics per newly visible home
group, the residential-detail delta estimates roughly `+90` to `+126` Graphics,
for about `934-970`, comfortably below the `1,600` ceiling and below the
requested `1,400` target. The reviewer should still replay
`verify-widget-performance.mjs` against a fresh bundle.

Streaming rebuild risk:
Core scene-window visible command counts remain small (`131` in
`residential_detail`, `464` mobile), so the expected rebuild path stays close
to the previous 10-25ms range. Browser timing is reviewer-run.

## Files Touched

- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/test/city-world-parametric-parity.test.ts`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `artifacts/current-update.json`
- `artifacts/0.75c-residential-fabric/CODEX_RESULT.md`

## Verification Evidence

Run:

- `pnpm --dir packages/core test -- city-world-parametric-parity.test.ts`
  - Passed: 20 files, 99 tests. Vitest ran the full core suite despite the
    filename filter.
- `pnpm typecheck:starter`
  - Passed.
- `pnpm test:core`
  - Passed: 20 files, 99 tests.
- `node scripts\verify-generated-district-parity.mjs --json-only`
  - Passed.
- `node scripts\verify-generated-district-parity.mjs`
  - Passed.
- `node scripts\verify-render-command-layer-budget.mjs`
  - Passed.
- `node scripts\verify-scene-window-compiler.mjs`
  - Passed.
- `node scripts\verify-dynamic-window-refresh.mjs`
  - Passed.
- `node scripts\verify-fable-prop-cleanup.mjs`
  - Passed.
- `node scripts\verify-cityworld-mobile-occlusion.mjs`
  - Passed.
- `node scripts\verify-provider-boundaries.mjs`
  - Passed.
- `node scripts\verify-tool-result-shape.mjs`
  - Passed.
- `node scripts\verify-no-google-in-renderer.mjs`
  - Passed.
- `node scripts\verify-object-kit-renderer-consumption.mjs`
  - Passed.
- `node scripts\verify-object-authorship-scene-grammar.mjs`
  - Passed.
- `node scripts\verify-public-object-kit-prefab-palette.mjs`
  - Passed.
- `node scripts\verify-roads-roofs-scene-grammar.mjs`
  - Passed.
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`
  - Passed.

Reviewer-run because this sandbox blocks the required esbuild/browser path:

- `pnpm build:web`
- `node scripts\verify-generated-district-widget.mjs`
- `node scripts\verify-widget-performance.mjs`

## Known Risks

- Browser Graphics count is estimated from core command deltas, not replayed
  here.
- The denser sample naturally qualifies one more residential block for the
  existing corner-market rule; review the visual read if only one corner market
  is desired in this synthetic sample.
- The generated district is denser, but still procedural. Further art quality
  should come from authored object-kit modules, not labels, props, or panels.
