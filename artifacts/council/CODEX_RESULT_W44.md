# CODEX RESULT W4.4 - Organic Layouts

## Outcome

Shipped W4.4 organic road-seed grammar for all generated archetypes. No archetype was reverted to grid. Curated Riverside byte-identity remained covered by the core generated-district test.

## Layout Grammar

| Archetype | Pattern | Shipped grammar | Sweep proof |
| --- | --- | --- | --- |
| `river_town` | `river_follow` | Curved bank roads, two bridge roads, two bridge crosswalks, landing towpath. | roads 9, axis 1, nonAxis 6, bridges 2/2 |
| `coastal_grid` | `shore_stepback` | Shore-parallel segmented main street, perpendicular lanes, back-step lane. | roads 8, shore 2, nonAxis 6 |
| `mountain_valley` | `valley_switchback` | Valley spine, contour roads, switchback and terrace branches. | roads 9, axis 5, nonAxis 3 |
| `desert_basin` | `highway_offsets` | Single two-segment highway spine plus sparse offsets. | roads 7, highway 2, nonAxis 5 |
| `metro_grid` | `metro_grid_diagonal` | Grid preserved; urban core adds deterministic diagonal avenue. | roads 9, axis 7, nonAxis 1 |
| `prairie_town` | `section_creek_curve` | Section-line grid plus two-segment creek/rail curve. | roads 8, axis 5, curve 2 |

## Bands And Exact Counts

No sweep bands were widened. The existing vegetation, water, relief, urbanization, composition, attachment, and full-index structural bands still pass.

Deliberate exact representative-count updates in `city-world-generated-district.test.ts`:

| Archetype | Old | New | Why |
| --- | --- | --- | --- |
| `coastal_grid` | trees 28, bushes 1 | trees 25, bushes 2 | Shore-main road moved seaward and road clearance rejected unsafe tree placements; still inside 24-30 trees, 1-4 bushes, 26-34 vegetation. |
| `desert_basin` | bushes 6 | bushes 7 | Highway/offset road grammar changed deterministic scrub acceptance; still inside 5-8 bushes. |
| `mountain_valley` | trees 32 | trees 30 | Switchback/contour geometry changed safe tree placements; still inside 24-34 trees. |
| `prairie_town` | trees 32 | trees 38 | Creek/rail curve and section-grid frontage increased safe tree rhythm; still inside 28-40 trees. |
| `river_town` | bushes 6 | bushes 5 | Bank/bridge grammar shifted bank vegetation; river trees restored to 23 and total vegetation remains 28 inside 26-34. |

## Window Budget Delta

Baseline recorded before W4.4: max visible budget weight 915, max road command count 7.

Final full-index scan:

- Max visible budget weight: 908 at `gurabo-municipio-pr` mobile `metro_grid` (`-7`).
- Max road command count: 9 at `mobile-al` mobile `river_town` (`+2`).
- Road delta comes from river towns carrying bank roads, two bridge roads, two bridge crosswalks, and a landing towpath. Scene-window gates still pass.

## Gate Tails

- `pnpm typecheck:starter`: pass.
- `pnpm test:core`: pass, 22 files / 143 tests.
- `node scripts/verify-deterministic-generated-district-specs.mjs`: pass, `ok: true`, blockerCount 0.
- `node scripts/verify-archetype-identity-sweep.mjs`: pass, 3,222 counties, structural mean 18.98ms/county, perf probe 11.77ms/county, 0 budget failures, all gates pass.

## Risks

The browser crop test is reviewer-run. The closest massing/layout pair is `desert_basin ~ river_town = 0.15`, exactly at the existing floor, so future road-count or river-frontage edits should watch that pair first.
