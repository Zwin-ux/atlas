# CODEX RESULT E5 - No Empty Blocks

## Scope

- Implemented compiler-authored open-block ground fills only.
- No new buildings, props, lots, dependencies, renderer branches, gestures, camera work, or QA/browser changes.
- `web/src/CityWorldRenderer.tsx` was not changed; existing terrain tone hashing and batched ground draw paths carry the fills.

## Fill Grammar

- `prairie_town`: four authored `farm_field` block zones with alternating crop-row terrain variants.
- `metro_grid`: broad `plaza_paving` backplate, pocket plaza paving, and a quieter `civic_forecourt` paved tone.
- `desert_basin`: `dry_wash` sand variance bands with sparse darker wash tones.
- `mountain_valley`: `meadow` ground patches with `scree` along higher-course bands.
- `coastal_grid`: `shore_bank` widening near water plus `green_common` open-block commons.
- `river_town`: widened `shore_bank` bands near the river crossing plus `green_common` open blocks.

## Coverage Metric

Metric: for each representative archetype board, count ground tiles that are outside road corridors and not won by a non-fill zone. Coverage is the share of those open-block tiles whose winning zone is one of the E5 fill kinds.

| Archetype | Representative | Filled / Open | Coverage | Fill Kinds |
| --- | --- | ---: | ---: | --- |
| metro_grid | autauga-al | 576 / 576 | 1.000 | civic_forecourt, plaza_paving |
| coastal_grid | aleutians-east-borough-ak | 434 / 434 | 1.000 | green_common, shore_bank |
| desert_basin | apache-az | 642 / 642 | 1.000 | dry_wash |
| mountain_valley | adams-co | 723 / 723 | 1.000 | meadow, scree |
| prairie_town | adair-ia | 427 / 434 | 0.984 | farm_field |
| river_town | butler-al | 485 / 485 | 1.000 | green_common, shore_bank |

Sweep floor: >= 0.600 per representative archetype. Result: pass.

## Composition Before / After

| Archetype | Before | After | Read |
| --- | ---: | ---: | --- |
| metro_grid | 0.701 | 0.720 | rose |
| coastal_grid | 0.775 | 0.775 | held |
| desert_basin | 0.736 | 0.736 | held |
| mountain_valley | 0.678 | 0.633 | declined but remains above floor |
| prairie_town | 0.631 | 0.631 | held |
| river_town | 0.637 | 0.637 | held |

Composition floor held at 0.631. The mountain representative lost some per-scene composition score because broad meadow/scree replaces a few previous open-ground grammar reads, but the archetype remains above the parity floor and sweep gates stay green.

## Graphics / Window Scan

- Window scan: pass.
- Worst visible budget: `metro_grid` mobile, `737 / 1200`.
- Failures: none.
- Estimated Graphics delta: ~0. The fills compile into existing terrain tiles and tone variants; terrain remains batched into ground/depth bands, with no renderer branch or extra prop/building command budget.

## CAN-Run Gates

- `pnpm build:core`: pass.
- `pnpm test:core`: pass, 22 files / 121 tests.
- `node scripts\verify-generated-district-parity.mjs --json-only`: pass.
- `node scripts\verify-archetype-identity-sweep.mjs --json-only`: pass, failed 0, structural checked 3222, closest massing pair 0.20.
- Inline generated-draft desktop/mobile window scan: pass, worst visible budget 737 / 1200.

## Risks / Honest Read vs Reference

E5 closes the large bare-block read with terrain-authored block fills. Prairie now has the strongest reference-aligned signal through crop-row field blocks; metro reads as paved civic/plaza ground; desert stays dry; mountain gains meadow/scree; coastal and river boards widen banks and add green commons.

This is still terrain grammar, not hand-authored north-star illustration detail. It intentionally avoids buildings, cars, props, labels, and decorative clutter. Reviewer still owns esbuild/browser/screenshots per packet instructions.
