# 0.78-1V Census County Board Product + Certification Gate

Status: `LOCAL_GREEN_OWNER_APPROVED_RELEASE_AUTHORIZED`

Decision: `CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE`

## Player Promise

When the opt-in board is open, Atlas shows the county's real U.S. Census
boundary and water without implying that streets, places, buildings, or
playable local coverage are present.

## What Changed

- Census boards identify the county and use direct honesty copy.
- Place, pin, note, and save controls stay hidden until real town anchors
  exist.
- County land uses a dedicated palette so the silhouette reads against both
  light and dark surrounds without adding renderer passes.
- The emulator can exercise `atlasGeoBoard=1` inside its `srcdoc` iframe and
  writes feature evidence to `artifacts/emulator/audit/0.78-1v/`.
- The browser audit captures the settled first frame before gesture checks and
  recovers deterministically when SwiftShader drops the first display-mode
  touch.

## Proof

- `pnpm test:core`: 160 passed.
- `node scripts/verify-save-surface-flag.mjs`: 3 passed.
- Geo place-category normalizer: 6 passed.
- `pnpm typecheck:starter`: passed.
- `node scripts/verify-tool-result-shape.mjs --json-only`: passed.
- `node scripts/verify-provider-boundaries.mjs --json-only`: passed.
- Strict staged `national-generation-contract` split guard: 46 selected files,
  0 blockers, 0 unknowns.
- Standard flag-off browser audit: 162 passed, 0 warnings, 0 failures.
- Feature-on browser audit: 138 passed, 0 warnings, 0 failures across
  Miami-Dade FL, Loving TX, and Kalawao HI at desktop/mobile and light/dark.
- All 12 Census-board cells keep the full projected terrain/water footprint
  inside the initial viewport; camera fit is measured from rendered isometric
  bounds rather than tile-axis span.
- Feature-on max Graphics: 40 / 1600.
- Feature-on max rebuild: 6.2ms / 350ms.
- Feature screenshots: 12 clean first-frame PNGs in
  `artifacts/emulator/audit/0.78-1v/`.
- Owner approval: `artifacts/council/OWNER_APPROVAL_0781V_2026-07-13.md`.

The shared working tree still contains pre-existing audit and showcase output
outside this packet. The release guard was run against the exact staged
envelope; those unrelated files were not staged or allowlisted.

## Anti-Scope

No default-on flag, deploy, roads, towns, national 3,222-pack bake,
persistence, new MCP tools, provider geometry, public Anaheim/Ontario,
0.78-R, or 0.80-2.

## Stop Condition

The board remains opt-in behind `?atlasGeoBoard=1`. Release preparation is
authorized, but deploy and real-host G8 must complete before the next code
slice, `0.78-2 Real Town Anchors`, begins.
