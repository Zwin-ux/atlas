# Codex Packet — 0.78-R Lane A continuation (handoff 2026-07-18)

You are taking over the zoom-band LOD program mid-flight. Everything below is
current as of certified head `d6f29ef8` (branch
`codex/integrate-hosted-clawd-fable-058e`, fully pushed). Read this whole
packet before touching anything.

## Program of record (read in this order)
1. `.gstack/plan-zoom-band-lod.md` — ratified program, 64-decision audit trail
   (repo-local, gitignored; if absent, Linear project "Atlas — Real Geography
   at Scale" mirrors it).
2. `.gstack/plan-078R-execution.md` — lane plan (A/C/D/F + go/no-go).
3. `docs/0.78R_WIRE_CONTRACT.md`, `docs/0.78R_ROAD_ART_CONTRACT.md`,
   `docs/0.78R_MOBILE_UX_A11Y.md`, `docs/0.78R_PRODUCT_METRICS.md` — normative.
4. `docs/BUILD_LOG.md` entries 107–108.

## What is DONE and verified (do not rebuild)
- Backend: `/road-catalog/<slug>/current` + `/road-chunks/...` routes,
  RoadChunkStore (CDN-swappable), `road_chunks` rate bucket, ops metrics.
  Server suite 61/61 (`npx tsx --test server/test/*.test.ts`).
- Data: all six adversarial counties baked under `data/road-chunks/`
  (miami-dade-fl, loving-tx, apache-az, orleans-parish-la, sedgwick-ks,
  suffolk-ma). Zero ceiling violations. National bake is OWNER-GATED — do
  not run it.
- Core: roadchunk/1 codec, band controller (+ branchless fast path),
  transition-trace harness, county road-scene compiler (featureId stitching
  + hash-join + per-piece corridor styles), windowFor band filtering.
  Core suite 270/270 (`pnpm test:core`).
- Web: `web/src/countyRoadBand.ts` (prefetch at mount, cache-hit commit with
  trace, epoch always pinned), renderer ribbon pass + bandOptions threading,
  band-aware banner + road status line + County view label + 44px anchor
  hit floor. **R3 ACCEPTANCE PASS**: intent→swap 259.5ms, stall 13.1ms,
  residency 40/1600 — artifacts in `artifacts/emulator/audit/0.78R-a2/`.
- Battery evidence so far: miami (`0.78R-a1/`), loving + suffolk (`0.78R-a3/`).
- Live design review: A−/A; regression pass fixed F-003/F-007/F-008.
  Baseline: `.gstack/design-reports/design-baseline.json`.

## HARD CONSTRAINTS (violating any of these is a failed session)
- Flag-dark: everything rides `?atlasGeoBoard=1`. Never change default
  surfaces. Curated Riverside must stay byte-identical.
- Do NOT touch: widget CSP `connectDomains` (server/src/index.ts ~2992),
  `_meta.countyGeoPack` delivery, the seven public MCP tools, anything
  submission-facing. These are owner-gated HELD lanes.
- Do NOT run the national road bake or modify `data/geo-packs/`.
- Commit style: bisected conventional commits, each with trailer
  `Co-Authored-By: <your model> <noreply@openai.com>`. After each envelope:
  `node scripts/certify-release-range.mjs` → commit
  `artifacts/current-update.json` + `scripts/verify-atlas-source-of-truth-drift.mjs`
  (+ `scripts/verify-alpha-rc-split.mjs` if you extended the allowlist) as
  `release: certify <name> range` → push. New files must be added to the
  strict allowlist in `scripts/verify-alpha-rc-split.mjs` (NATIONAL_
  GENERATION_CONTRACT_FILES / _PREFIXES) or certify fails — add them
  proactively with a dated comment.
- Verification gates before ANY commit: `pnpm test:core` (270+),
  `npx tsx --test server/test/*.test.ts` (61+), `npx tsc -p web/tsconfig.json
  --noEmit`, and for renderer/web changes: the browser loop below.

## Browser-loop recipe (proven; deviations waste hours)
1. Rebuild + restart (server INLINES the web bundle at startup — stale-bundle
   trap): `pnpm build:web`, kill the tsx server process, then detached:
   `Start-Process cmd '/c npx tsx server/src/index.ts > .gstack\a1-server.log 2>&1' -WindowStyle Hidden`,
   wait for `http://127.0.0.1:8787/ready` = 200.
2. Drive with the browse daemon `~/.claude/skills/browse/dist/browse.exe`
   (NOT under skills/gstack/). Screenshots need ABSOLUTE paths.
3. `goto http://127.0.0.1:8787/emulator?county=<slug>&draft=1&atlasGeoBoard=1`
   then **POLL `__ATLAS_QA__.scene.id` for "county-geo" before any zoom**
   (seed takes 13–18s; fixed sleeps race and your clicks hit the draft scene).
4. NEAR threshold needs ~11 clicks on the widget's "Zoom in" button (reach it
   via `iframe.contentDocument`, aria-label). Roads commit from prefetch
   cache; check `__ATLAS_BAND_TRACE__.verdict`.
5. Browse `js` commands time out ~15s — poll with short calls, never one
   long promise.

## NEXT WORK, in order

### 1. Dash forensics (open mystery — start here, ~30 min)
Long corridors (US-1 south, US-27) render as dashes: 90 fragmented avenue
chains with multi-tile voids between them in the COMMITTED scene. DISPROVEN
already (do not re-investigate): cell-boundary de-dup gaps; missing
pass-through cells (pieces chain contiguously c-8..c-12 with exact shared
boundary vertices — probe recipes in commits `53f52f7a`/`0a3fd9e0` messages).
FIRST STEP: read `CITY_WORLD_TILE_BASIS` actual values in
`packages/core/src/voxel/cityWorldBasis.ts` — the previous in-page
localization used GUESSED tile constants (64/32), so the "nothing within
500m" bake probe may have probed empty Everglades. Re-localize a void with
correct constants, then check the bake's classes at the TRUE coordinates.
Likely candidates after that: emit-stage drops, or genuinely parallel
carriageway/class geometry. Fix in
`packages/core/src/voxel/countyRoadScene.ts` with tests.

### 2. S3 battery completion (~45 min)
Browser loop for apache-az, orleans-parish-la, sedgwick-ks + miami re-run on
final code; 390×844 mobile cells for miami + suffolk. Save screenshots to
`artifacts/emulator/audit/0.78R-a3/`, record trace verdicts + apache buildMs
(26k features exercises compile cost). Commit as
`chore(audit): S3 battery completion`.

### 3. S4 remainder (small)
- S4c scale legend: quiet DOM text near zoom controls; miles-per-tile =
  69.05 / scene.geoProjection.boardScale, camera-zoom aware.
- S4d rim county name at FAR (renderer, geo scenes only).
- F-005 compact mobile banner variant (CityWorldView census-boundary block).
- F-001 ghost stage-frame alpha reduction on geo boards.

### 4. F-002 dark parity (design HIGH — bigger, do only if time)
Land/water/road palette pairs for dark theme (base board currently ships
light values on the dark backdrop). Acceptance: 12-cell audit matrix both
themes + design-review regression (baseline json exists).

### 5. L1b ribbon refinement (flagged by design review)
`drawCountyRoadRibbon` (web/src/CityWorldRenderer.tsx): the width+2 underlay
reads as a map CASING the Road Art Contract bans — drop it or re-tone as
ground shadow (offset-y only, lower alpha). Eyes-on screenshot required.

## Known perf items (Lane C, measure don't guess)
- FAR-direction shed: ~72ms one-frame teardown hitch (trace committed in
  0.78R-a2/) — over 16ms frame budget, under transition ceiling.
- Prefetch compile ~486ms main-thread at board idle (S1b stepper deferred;
  acceptable pre-gesture).

## Owner-gated (NEVER start these)
National bake + volume seed at scale; CSP flip + real-host acceptance;
`_meta.countyGeoPack` removal; flag default-on; Devpost/submission actions;
the 6-county identity/product VERDICTS (human eyes only).

## Session end protocol
Update `docs/BUILD_LOG.md` (next entry number), certify + push everything,
and append a dated progress note to this packet.
