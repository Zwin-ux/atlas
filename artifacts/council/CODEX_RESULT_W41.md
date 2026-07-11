# W4.1 Codex Result - Building Attachments

## Scope

Implemented compiler-authored building attachments for generated districts only:

- homes: porch step/canopy, chimneys, occasional gable dormers
- shops/strip stores: storefront awnings, roof AC units
- apartments/lowrise: roof AC units, parapet vent blocks
- civic: entry canopies

Curated Riverside output is byte-identical to the baseline. No renderer, web, server, submission, or style files were touched.

## Mechanism Choice

Attachments are emitted as additional low-detail `CityWorldBuilding` sub-geometry from the generated city-world compiler path, with explicit `visualGrammar.buildingAttachment` metadata linking each attachment to its parent building. Parent buildings also receive `visualGrammar.buildingAttachments` as a compact kind list.

Renderer compatibility argument: the existing renderer already consumes compiled building commands, roof profiles, material profiles, palettes, and building shell geometry. By representing each attachment as a normal compiled building with low detail, inherited palette key, and attachment-specific roof/material profiles, the current building/roof draw paths can carry the added porches, awnings, chimneys, AC units, dormers, vents, and canopies without any renderer edits or new command kinds.

Curated safety route: the attachment pass only selects generated primary buildings with generated IDs and skips attachment IDs. Curated Riverside buildings are never eligible, so curated compile output remains unchanged.

## Attachment Presence Band

Band definition: eligible generated primary buildings per archetype must have attachment parent presence in `[0.40, 0.70]`.

| Archetype | County | Parents | Rate | Attachments | Kinds |
| --- | --- | ---: | ---: | ---: | --- |
| metro_grid | autauga-al | 17/31 | 0.548 | 24 | chimney:6, porch_step:4, porch_canopy:9, dormer:1, roof_ac:2, entry_canopy:2 |
| coastal_grid | aleutians-east-borough-ak | 17/30 | 0.567 | 33 | chimney:10, porch_step:6, porch_canopy:7, dormer:3, awning:4, roof_ac:3 |
| desert_basin | apache-az | 16/28 | 0.571 | 35 | chimney:12, porch_step:8, porch_canopy:5, dormer:6, awning:2, roof_ac:1, entry_canopy:1 |
| mountain_valley | adams-co | 10/17 | 0.588 | 15 | chimney:3, porch_step:5, awning:2, roof_ac:3, parapet_vent:1, entry_canopy:1 |
| prairie_town | adair-ia | 10/18 | 0.556 | 17 | chimney:6, porch_step:3, porch_canopy:5, awning:1, roof_ac:2 |
| river_town | butler-al | 17/31 | 0.548 | 27 | chimney:3, porch_step:2, porch_canopy:4, dormer:1, awning:8, roof_ac:7, parapet_vent:2 |

Sweep gate `building_attachment_presence`: PASS.

## Verification

- `pnpm build:core`: PASS
- `pnpm test:core`: PASS, 22 files / 127 tests
- `node scripts\verify-generated-district-parity.mjs`: PASS
- `node scripts\verify-archetype-identity-sweep.mjs`: PASS, all gates green
- Curated hash check: PASS
  - computed: `e4f59cff91620974e4fb8333ed260d088fdd1d545778a7292df612253878d516`
  - baseline: `e4f59cff91620974e4fb8333ed260d088fdd1d545778a7292df612253878d516`
  - identical: true
- Focused generated window scan: PASS
  - worst visible weight: 746
  - budget ceiling: 1200
  - worst visible attachment commands: 22
  - estimated Graphics delta: +132
  - estimated Graphics total vs 962 baseline: 1094, under target 1250

Existing parity, structural, vegetation, water/relief, open-block fill, routing, massing distinctness, and performance sweep gates are green.

## Files Changed

- `packages/core/src/voxel/cityWorldCompiler.ts`
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/src/voxel/cityWorldTypes.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `scripts/verify-archetype-identity-sweep.mjs`
- `artifacts/council/CODEX_RESULT_W41.md`

## Skipped

Browser gates and screenshots were not run; reviewer owns those per the W4.1 prompt.
