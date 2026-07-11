# Tail Packet Result - E8, E10, Prairie Contrast

Status: uncommitted implementation. Scope stayed inside the requested file envelope.

## E8 - River-Town Clone Pressure

Mechanism:
- Added two low-weight river-town-only residential templates.
- Widened river-town home footprint jitter only; density is unchanged.
- Non-river archetypes still use the original residential pool and jitter.

Hunks:
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`: river template pool at lines 1445-1448; river-only jitter at 1509-1512; river-only pool merge at 1587-1593.
- `packages/core/test/city-world-generated-district.test.ts`: E8 regression at lines 465-480.

Representative parity clone pressure, before -> after:
- `metro_grid`: 0.280 -> 0.280
- `coastal_grid`: 0.208 -> 0.208
- `desert_basin`: 0.200 -> 0.200
- `mountain_valley`: 0.182 -> 0.182
- `prairie_town`: 0.188 -> 0.188
- `river_town`: 0.235 -> 0.176

Honest note: the live baseline I measured from the current branch was `river_town=0.235`, not the reviewed 0.300, so this landed as added headroom rather than a rescue from an exact-threshold local value.

Full-index diagnostic max clone pressure after:
- `metro_grid`: 0.474 (`montgomery-in`)
- `coastal_grid`: 0.421 (`washington-ri`)
- `desert_basin`: 0.400 (`gila-az`)
- `mountain_valley`: 0.571 (`morgan-co`)
- `prairie_town`: 0.462 (`bremer-ia`)
- `river_town`: 0.417 (`ionia-mi`)

The enforced parity gate is representative per-archetype; the full-index clone diagnostic is still not a gate and remains noisy for counties with very low home counts.

## E10 - Water-Aware Opening Frame

Mechanism:
- Added a water-presence bonus only for `coastal_grid` and `river_town`.
- Bonus requires at least 18 water tiles, at least one building, and lower-frame occupancy already clearing the parity floor: desktop 0.18, mobile 0.10.
- Bonus weight is 0.08, with prefiltered water tiles to avoid a second full terrain scan.

Hunks:
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`: camera scenery water-tile threading at lines 287-293; water scorer constants/helpers at 2371-2452; water-aware desktop/mobile scorer selection at 2514-2542; water archetype guard at 2582-2584.
- `packages/core/test/city-world-generated-district.test.ts`: E10 regression at lines 482-495.

Water frame before -> after:
- `river_town` desktop zero-water frames: 60/227 -> 31/227.
- `river_town` mobile zero-water frames: 0/227 -> 0/227.
- `butler-al` opening frame after: desktop 46 water tiles, lower occupancy 0.240; mobile 108 water tiles, lower occupancy 0.197.
- `coastal_grid` desktop/mobile remain 703/703 zero-water frames. Conservative gating did not force the sea into frame because representative coastal water candidates with visible shoreline were below the desktop lower-frame floor; closest sampled representative water candidates were around 0.111 lower occupancy vs the 0.18 floor.

Parity tails after:
- `verify-generated-district-parity`: desktop lower-frame occupancy 0.208; mobile lower-frame occupancy 0.102; first viewport composition 0.688.
- Full water-index lower-occupancy tails remain low in some counties: `river_town` desktop min 0.000 (`pulaski-ar`), mobile min 0.042 (`hale-tx`); these are existing full-index diagnostics, not the parity gate.

Risk:
- This improves river-town opening frames without breaking floors, but it intentionally does not force coastal shoreline visibility. A future coastal layout/candidate packet may be needed if reviewer requires sea in the first frame while maintaining occupancy floors.

## Prairie Crop-Row Contrast

Mechanism:
- Changed farm-field row variants from `1/4` to `0/4`.
- No palette or hue changes; this stays inside `terrain.region.prairie_town`.

Hunks:
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`: farm-field variant hunk at line 494.
- `packages/core/test/city-world-generated-district.test.ts`: prairie contrast regression at lines 497-507 and helpers at 661-673.

Tone values:
- Before variants: `1/4`; renderer grass tone offsets `-1.2 / +2.4`; delta 3.6.
- After variants: `0/4`; renderer grass tone offsets `-2.4 / +2.4`; delta 4.8.
- Palette unchanged: base `#9fa94d`, shade `#747d39`, highlight `#d8df88`, accent `#8c6f4c`.

## Verification

- `pnpm build:core`: pass.
- `pnpm test:core`: pass, 22 files / 125 tests.
- `node scripts/verify-generated-district-parity.mjs --json-only`: pass, `ok: true`; archetype max representative clone pressure 0.280; `river_town` 0.176; desktop/mobile lower-frame occupancy 0.208/0.102.
- `node scripts/verify-archetype-identity-sweep.mjs`: pass, `ALL GATES PASS`; structural full-index compile 3,222 counties, 0 failures, mean 20.07ms/county; perf sample mean 19.31ms/county, 0 budget failures.
- Full-index generated-draft window scan: worst visible budget weight 782/1200, 623 visible commands, `lake-mn`, `metro_grid`, mobile.

## Files Changed

- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `artifacts/engine-todo/CODEX_RESULT_TAIL.md`

`packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts` and `scripts/verify-archetype-identity-sweep.mjs` were not changed; existing layout and sweep bands held.
