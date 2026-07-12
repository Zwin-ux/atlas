# CODEX RESULT 0.77-2 - Regional Truth Visuals

## Scope

Generated paths only. Curated Riverside byte identity stayed under the core test gate; no `web`, `server`, `scout`, `county`, `world`, docs, package, git add, commit, or push work was performed.

## Per-Fix Design

1. Coastal first-frame sea
   - Moved generated coastal-grid land fabric shoreward and extended the sea band inward to x34-44 with a shore-bank buffer at x32-34.
   - Added a water-bonus metro layout for tropical/coastal metro counties so Miami/Honolulu keep buildable fabric near the sea edge instead of moving the camera into empty no-mans-land.
   - Removed the extra coastal metro centerline that erased parcels after road clearance; Miami now keeps the existing 0.77-1 density floor while showing sea.

2. Tropical climate truth
   - Added derived `climate.tropicalHumid` from state plus latitude band: HI/PR tropical or subtropical, and south Florida subtropical below 27.6 latitude.
   - Tropical-humid counties force humid aridity, coastal proximity, higher water affinity, higher vegetation density, lush green land terrain, palm-dominant trees, and no dry-wash fills.

3. Mountain relief at overview
   - Raised mountain-valley relief amplitude and expanded ridge scree deeper into the default overview window.
   - Biased mountain overview camera selection toward ridge/village fabric using relief-aware composition scoring so the first frame shows cliff-course drops while keeping buildings in view.

## Water Visibility

Desktop opening-window water tile floor: 18.

- `miami-dade-fl`: 60 water tiles, 38 buildings
- `honolulu-hi`: 112 water tiles, 41 buildings
- `kalawao-hi`: 105 water tiles, 7 buildings

## Band Changes

- `VEGETATION_EXPECTATIONS.coastal_grid.trees`: 27 -> 28
- `VEGETATION_EXPECTATIONS.coastal_grid.bushes`: 2 -> 1
- `VEGETATION_BANDS.coastal_grid.minBushes`: 2 -> 1
- `VEGETATION_BANDS.coastal_grid.maxBushes`: 5 -> 4

## Gate Tails

- `pnpm typecheck:starter`: pass
- `pnpm test:core`: pass, 22 files / 142 tests
- `node scripts/verify-deterministic-generated-district-specs.mjs`: pass, `ok: true`, 3222 indexed counties, blockerCount 0
- `node scripts/verify-archetype-identity-sweep.mjs`: pass, ALL GATES PASS
  - `coastal_opening_water_visibility`: pass `[miami-dade-fl:60, honolulu-hi:112, kalawao-hi:105]`
  - `tropical_humid_visual_truth`: pass, palm rate 1 for Miami-Dade, Honolulu, Kalawao, San Juan Municipio
  - `mountain_opening_relief_visibility`: pass, `summit-co` drops 57

## Risks / Skipped

- Browser certification is reviewer-run per packet instruction; no browser screenshots were captured here.
- Coastal metro water-bonus layout intentionally reduces one road centerline to preserve parcel density after shoreward bias. Current sweep still passes massing/layout distinctness and urban-core anchor floors.
