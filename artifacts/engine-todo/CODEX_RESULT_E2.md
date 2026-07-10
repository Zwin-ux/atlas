# E2 Vegetation Saturation Result

Status: local green, uncommitted.

Packet: E2 vegetation saturation for generated districts.

Scope touched:
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `scripts/verify-archetype-identity-sweep.mjs`
- `artifacts/engine-todo/CODEX_RESULT_E2.md`

Not touched:
- `packages/core/src/voxel/cityWorldCountyParameters.ts`
- `packages/core/src/voxel/riversideDemoScene.ts`
- renderer/web code
- curated Riverside props

## Placement Grammar

The generator now reads the existing `countyParameters.modulation.vegetationDensity`; no new county parameter knob was added.

Vegetation placement is deterministic but isolated from building RNG. E2 jitter uses a local hash-derived per-zone RNG, so extra trees do not perturb downstream building palette/massing choices.

Archetype grammar:
- `metro_grid`: residential street-tree rhythm along road frontages, plus yard bushes and existing civic/plaza furniture.
- `coastal_grid`: 5-tree park clusters on community greens, reduced coastal civic tree load for budget, residential street-tree rhythm, apartment edge tree, and shoreline clusters near but not on water.
- `desert_basin`: scrub-only dry grammar, 5-8 bushes across the index, zero trees.
- `mountain_valley`: residential street trees plus high-relief pine-ish clusters, with mountain park clusters capped at 5 trees for window budget.
- `prairie_town`: shelter rows along field/lot edges, prairie park/ag-grid rows, and scattered residential vegetation.
- `river_town`: residential street trees plus shoreline tree clusters near the river edge.

All generated vegetation candidates use point-level road-corridor clearance equivalent to the parcel road-clearance rule: road half-width plus `0.35` margin, crosswalks ignored.

## Representative Counts

Representative counties selected by the archetype sweep:

| Archetype | County | Trees | Bushes | Vegetation | Park vegetation |
|---|---:|---:|---:|---:|---:|
| metro_grid | autauga-al | 10 | 5 | 15 | 0 |
| coastal_grid | aleutians-east-borough-ak | 15 | 2 | 17 | 5 |
| desert_basin | apache-az | 0 | 5 | 5 | 0 |
| mountain_valley | adams-co | 13 | 4 | 17 | 0 |
| prairie_town | adair-ia | 17 | 4 | 21 | 6 |
| river_town | butler-al | 11 | 4 | 15 | 0 |

Sweep gate bands:
- metro_grid: trees 10-14, bushes 3-7, vegetation 10-18
- coastal_grid: trees 12-18, bushes 2-5, vegetation 14-22, park vegetation >=5 when a park zone exists
- desert_basin: trees 0, bushes 4-8, vegetation 4-8
- mountain_valley: trees 10-20, bushes 3-6, vegetation 13-26, park vegetation >=5 when a park zone exists
- prairie_town: trees 15-20, bushes 3-6, vegetation 18-22, park vegetation >=5 when a park zone exists
- river_town: trees 10-15, bushes 2-5, vegetation 10-18

Full-index vegetation ranges from the final 3,222-county scan:
- metro_grid: vegetation 10-16, trees 6-10, bushes 3-6
- coastal_grid: vegetation 15-19, trees 13-17, bushes 2
- desert_basin: vegetation 5-8, trees 0, bushes 5-8
- mountain_valley: vegetation 13-25, trees 10-20, bushes 3-5
- prairie_town: vegetation 17-21, trees 15-17, bushes 2-4
- river_town: vegetation 10-16, trees 8-12, bushes 2-4

## Prop And Window Budgets

Budget constants found:
- `public_playable_window.maxPropCommands = 90`
- `generated_draft_window.maxPropCommands = 20`
- `generated_draft_window.maxVisibleBudgetWeight = 1200`

Final full-index scan:
- checked 3,222 counties
- max total scene props: 40/90 (`walker-al`, `metro_grid`)
- worst desktop generated-draft window: 20/20 props, visible budget weight 498 (`de-soto-parish-la`, `coastal_grid`)
- worst mobile generated-draft window: 20/20 props, visible budget weight 715 (`dallas-al`, `metro_grid`)
- worst residential detail prop window: 7/20 (`adams-co`, `mountain_valley`)
- worst commerce detail prop window: 8/20 (`autauga-al`, `metro_grid`)

The cap is met but tight: desktop and mobile both have a worst cell at exactly 20 visible props. Any later visible prop additions need a retune or a window-budget decision first.

Forbidden prop kinds unchanged: no `parked_car`, no `cloud`.

## Graphics Estimate

Renderer inspection: each tree/bush is drawn as one `Graphics` object containing the voxel boxes/shadow for that prop. The TODO estimate says roughly 50 trees adds about 100 Graphics, or about 2 Graphics-equivalent cost per tree when accounting for renderer internals.

The prior reviewer-run generated worst was coastal-mobile at 938 Graphics. E2 keeps worst visible prop windows at 20 and only adds single-digit visible vegetation in the heaviest windows. Expected worst is roughly 950-980 Graphics, still comfortably below the 1600 ceiling. Reviewer perf remains required for the exact Pixi count.

## Verification

CAN-run commands:

`pnpm build:core`
- PASS
- tail: `tsc -p tsconfig.json`

`pnpm test:core`
- PASS
- tail: `Test Files 22 passed (22)`, `Tests 119 passed (119)`

`node scripts/verify-generated-district-parity.mjs`
- PASS
- tail: `Generated district parity: OK`
- relevant gates remained green: regional palette distinctness min 0.16, per-archetype home clone pressure max 0.3, no scene hard blockers.

`node scripts/verify-archetype-identity-sweep.mjs`
- PASS
- full-index structural pass: 3,222 counties, mean 10.08ms/county, 0 failures
- new gate: `PASS vegetation_presence - representative generated archetypes hit E2 vegetation bands`
- tail: `ALL GATES PASS`

Additional local scan:
- 3,222-county prop/window scan passed the 20 visible prop cap for desktop, mobile, residential_detail, and commerce_detail.

Reviewer-run still needed:
- `pnpm build:web`
- `pnpm verify:emulator:audit`
- `pnpm verify:emulator:perf`
- per-archetype desktop/mobile screenshots judged against `assets/reference/atlas-voxel-town-north-star.png`

## Risks

- Budget is exact at the worst desktop/mobile windows, not cushioned.
- The result reads greener and more placed, but it is still procedural tree grammar, not authored voxel object-kit art.
- Mountain/coastal park caps are intentionally held at 5 trees to protect the generated draft window cap.
- Prairie and mountain full-index ranges vary by bonus-zone shape; the representative gate is deterministic, but screenshot review should still judge the visual read.

## Before / After Read

Before E2, generated districts often read like sparse block-outs: several representative archetypes had only 4-9 trees, desert still inherited dry-incoherent trees, and parks did not consistently read like intentional green clusters.

After E2, non-desert representatives have 10+ trees, desert is scrub-only, prairie gets shelter rows, coastal/river get water-adjacent clusters, and park zones that exist in the representative sweep have >=5 vegetation props. It is a clear move toward the north-star town's saturated chunky-tree read, but it is not yet the final hand-built concept-art density; that still needs screenshot/perf review and likely object-kit visual quality work.
