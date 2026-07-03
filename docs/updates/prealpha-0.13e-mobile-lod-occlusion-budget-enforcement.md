# Pre-Alpha 0.13E - Mobile LOD / Occlusion Budget Enforcement

## Decision

0.13E enforces mobile readability budgets before any more voxel density,
object art, or hidden district polish. The 0.12E reports were measurement; this
slice turns those measurements into a budget system that can block risky visual
changes.

This is the right next slice for a ChatGPT app because Atlas lives inside a
conversation. The map can be rich, but the normal mobile frame must keep the
county switcher, coverage line, selected-place tray, pin/note loop, and
recovery actions readable without becoming a dashboard.

## Product Promise

Atlas can keep getting denser without making the 390x844 ChatGPT app surface
feel crowded, blocked, or hard to recover from.

## Engineering Promise

`CityWorldScene` mobile occlusion reports become enforceable budgets:

- normal mobile playable view has strict readability floors;
- residential-detail crop can be dense, but must be classified as a proof crop;
- shell and unsupported states stay visually empty enough to avoid fake
  playability;
- hidden drafts can be inspected without pins, actors, public tools, or
  playable claims.

## ChatGPT App Alignment

0.13E must follow these app rules:

- Use the existing MCP Apps bridge and widget contract. Do not add a standalone
  app shell, dashboard, generic panel, or custom ChatGPT chrome.
- Keep `structuredContent` concise and keep large scene/debug details in
  `_meta` or local verifier output.
- Do not change the seven-tool list.
- Do not expose internal budget names, terrain metrics, hidden draft names, or
  LOD jargon in public UI.
- Do not make the widget re-render from noisy debug state during normal use.
- Keep the normal mobile surface readable before optimizing proof cameras.

## Scope

Likely files:

- `packages/core/src/voxel/cityWorldDerivedTerrainMap.ts`
- `packages/core/test/city-world-derived-terrain-map.test.ts`
- `scripts/verify-cityworld-mobile-occlusion.mjs`
- `scripts/verify-engine-beta-coverage.mjs` only if browser proof should assert
  the budget output
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `artifacts/current-update.json` only after implementation passes

Avoid changing renderer/UI unless the existing reports cannot be debugged
without an opt-in overlay. If an overlay is needed, it must stay behind
`?atlasDebug=engine` and never appear in normal `/preview`.

## Implementation Plan

### 1. Core budget contract

Added a small budget layer near `deriveCityWorldMobileOcclusion`:

- `CityWorldMobileLodBudgetProfileId`
- `CityWorldMobileLodBudget`
- `CityWorldMobileLodBudgetResult`
- `CITY_WORLD_MOBILE_LOD_BUDGETS`
- `evaluateCityWorldMobileLodBudget(report, budgetOrProfileId, scene?)`

Do not add a broad scene schema unless the budget cannot be expressed with the
current report.

### 2. Budget profiles

Use separate profiles instead of one generic threshold:

`playable_mobile`
- Target: public Riverside normal mobile.
- Purpose: protect real ChatGPT app use.
- Initial floors:
  - `mobileOcclusionRiskScore <= 0.34`
  - `mobileReadabilityScore >= 0.70`
  - `traySafeBandPressureRatio <= 0.36`
  - `interactiveMarkerPressureRatio <= 0.42`
  - `verticalStackPressureRatio <= 0.14`
  - visible buildings `>= 8`
  - Clawd actor remains visible

`residential_detail_probe`
- Target: proof crop, not the normal product path.
- Purpose: allow dense inspection while still measuring risk.
- Initial floors:
  - `mobileOcclusionRiskScore <= 0.62`
  - `mobileReadabilityScore >= 0.38`
  - `traySafeBandPressureRatio <= 1`
  - visible buildings `>= 6`

`shell_mobile_empty_state`
- Target: Orange shell and other L1 shells.
- Purpose: stop shells from looking playable.
- Initial floors:
  - `mobileOcclusionRiskScore <= 0.02`
  - `mobileReadabilityScore >= 0.98`
  - `buildings === 0`
  - `pins === 0`
  - `actors === 0`

`hidden_draft_mobile_probe`
- Target: Anaheim/Ontario internal drafts.
- Purpose: allow visual inspection without public playability.
- Initial floors:
  - `mobileOcclusionRiskScore <= 0.58`
  - `mobileReadabilityScore >= 0.42`
  - `pins === 0`
  - `actors === 0`
  - `playable === false`

### 3. Verifier upgrade

Upgraded `scripts/verify-cityworld-mobile-occlusion.mjs` so it reports:

- scenario;
- assigned budget profile;
- current counts;
- current metrics;
- budget pass/fail;
- blocker list grouped by product, shell, hidden draft, and provider boundary.

The verifier should fail only on hard budget violations, not on subjective art
judgment.

### 4. Tests

Extended `packages/core/test/city-world-derived-terrain-map.test.ts` to prove:

- budget evaluation passes current Riverside mobile;
- residential-detail uses the proof-crop budget, not the normal product budget;
- shell mobile cannot contain buildings, pins, or actors;
- hidden drafts remain non-playable and actor/pin-free;
- budget output contains no provider tokens or public promotion markers.

### 5. Optional debug support

Skipped:

- no debug overlay was added because the JSON budget output is enough for this
  slice;
- no renderer or public UI code changed.

## Big 4 Ownership

### Axiom

- Own budget thresholds and pass/block decision.
- Keep scope narrow: enforcement, not visual polish.
- Update current update manifest only after implementation passes.

### Lumen

- Use budget results to decide the next visual-engine target.
- Do not start an art pass during 0.13E unless the budget verifier names the
  exact family or viewport creating risk.
- After 0.13E, likely target is face-orientation/source-art contrast if mobile
  budgets are green.

### Mira

- Confirm this protects the ChatGPT app surface: switcher, tray, pins, notes,
  shell recovery, unsupported recovery.
- Reject public UI that exposes metrics, LOD jargon, hidden draft names, or
  internal budget labels.
- Keep product language human: play Riverside now, browse shells, lookup places
  without saving.

### Forge

- Guard split and provider boundaries.
- Confirm no server/provider/package/env/persistence/paid drift.
- Keep future engine plan aligned with source-to-scene contracts and budget
  preflight.

## Verification

Passed:

- `pnpm --dir packages/core test`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `node scripts\verify-cityworld-mobile-occlusion.mjs --json-only`
- `node scripts\verify-cityworld-derived-terrain-maps.mjs --json-only`
- `node scripts\verify-no-google-in-renderer.mjs --json-only`
- `node scripts\verify-provider-boundaries.mjs --json-only`
- `node scripts\verify-tool-result-shape.mjs --json-only`
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

Run browser proof only if renderer or UI changes:

- Riverside mobile product loop;
- Orange shell mobile;
- Unknown/L0 mobile;
- optional `?atlasDebug=engine` screenshot if a debug overlay is added.

## Acceptance

PASS if:

- current mobile occlusion reports are enforced by named budgets;
- Riverside normal mobile remains safely readable;
- residential-detail is explicitly treated as a dense proof crop;
- shells remain non-playable and visually empty;
- hidden drafts remain hidden and non-playable;
- provider/tool boundaries remain green;
- no public UI clutter or dashboard behavior is added.

BLOCK if:

- the implementation only renames existing thresholds without reusable budget
  logic;
- normal mobile gets judged by screenshot taste instead of budget;
- residential-detail pressure leaks into public mobile assumptions;
- shell or hidden draft scenes gain fake playable geometry;
- public UI shows metrics, LOD jargon, hidden draft state, or debug overlays;
- any paid, persistence, provider-geometry, or public promotion scope enters.

## Linear Note

A Linear issue would be useful for tracking 0.13E, but the current Linear
workspace is at its free issue limit. Keep this repo document as the source of
truth until Linear capacity is available.
