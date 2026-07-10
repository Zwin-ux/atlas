# Generated-Scene Emulator Perf Gate

## Files Touched

- `scripts/lib/cdp.mjs`
- `scripts/verify-emulator-perf.mjs`
- `package.json`
- `artifacts/emulator/CODEX_RESULT_PERF.md`

## County Matrix

`scripts/verify-emulator-perf.mjs` resolves generated counties at runtime by scanning `US_COUNTY_INDEX` from `packages/core/dist/index.js` and calling `createDeterministicGeneratedDistrictSpec({ county })` until it finds the first county for each generated archetype.

Resolved in this checkout:

- `metro_grid`: `autauga-al`
- `coastal_grid`: `aleutians-east-borough-ak`
- `desert_basin`: `apache-az`
- `mountain_valley`: `adams-co`
- `prairie_town`: `adair-ia`
- `river_town`: `butler-al`
- Curated baseline: `riverside-ca` with `draft=0`

`--county <slug>` is repeatable and resolves requested generated counties through the same deterministic spec function. `riverside-ca` is always included as the curated baseline unless already requested.

## Gate Semantics

- Preflights `GET <base>/emulator` before launching Chrome.
- Launches Chrome once, then opens one CDP target per county and viewport.
- Waits for parent `window.__ATLAS_EMULATOR__.state === "delivered"` and fails on emulator `error`.
- Reads inner widget QA through `window.__ATLAS_EMULATOR__.qa()`.
- Drives two 10-step big pans on the inner iframe canvas using the inner window's `PointerEvent`.
- Fails a cell when `graphicsCount() > 1600`.
- Fails rebuild latency only when a pan actually triggers a rebuild and `min(lastRebuildMs samples) > 350`.
- Records `rebuildMs: null` when no rebuild fires.
- Runs the hover-does-not-rebuild parity check once on `riverside-ca` desktop.
- Reports, but does not fail, generated draft payloads above `900000` chars.
- Writes JSON to `artifacts/emulator/perf-report.json` when executed.

## Uncertainty

Full runtime behavior depends on the live `/emulator` server, real MCP tool responses, and Chrome availability. I did not run the full gate in this sandbox.

## Verification Run Here

- `node --check scripts/lib/cdp.mjs`
- `node --check scripts/verify-emulator-perf.mjs`
- Runtime matrix smoke via `packages/core/dist/index.js`

## Reviewer-Run

- Start the live Atlas server on `127.0.0.1:8787`.
- Run `node scripts/verify-emulator-perf.mjs --url http://127.0.0.1:8787 --json-only`.
- Or run `pnpm verify:emulator:perf -- --url http://127.0.0.1:8787 --json-only`.
