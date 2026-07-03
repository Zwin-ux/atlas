# Atlas Engine / Backend Operating Brief

Status: active Forge brief for Axiom.

Purpose:
Organize Atlas as a purpose-built county-to-scene engine, not as a generic game
engine, map clone, or dashboard. This brief turns engine-building references
into Atlas-specific backend, compiler, renderer, and release-safety rules.

## Product Thesis

Atlas is a ChatGPT app that turns a bounded geography into a playable voxel
world.

The engine is not "draw prettier blocks." The engine is the pipeline that turns
truthful source state into a bounded `CityWorldScene`, verifies that scene, and
only then lets the renderer display it.

The production shape is:

```txt
identity/source data
  -> provider and source policy
  -> candidate/readiness contracts
  -> scene compiler
  -> engine basis and diagnostics
  -> Pixi renderer
  -> Apps SDK tool output
  -> release guard and public proof
```

If any layer is missing, the result is either a mock, a hidden draft, or a
session-only surface. It is not a public playable county.

## Reference Lessons

These are study references, not dependencies.

- `Game Engine Architecture` by Jason Gregory: use subsystem boundaries, tool
  pipelines, asset/runtime separation, and debug instrumentation. Do not copy a
  AAA engine shape into a ChatGPT app.
- `Game Programming Patterns` by Robert Nystrom: use explicit update/data
  flow, component boundaries, spatial partitioning, and decoupling. Avoid
  renderer code becoming product truth.
- `Data-Oriented Design` by Richard Fabian: model the data first, then measure
  it. Atlas scenes should be arrays of typed terrain, roads, lots, buildings,
  pins, and diagnostics, not ad hoc UI state.
- `Real-Time Rendering`: protect visibility, level-of-detail, material
  classification, frame readability, and mobile constraints. Atlas should win
  by bounded composition and face clarity, not by piling on effects.
- VoxCity, VoxelSpace, Pixels2Voxels, and GameBlocks remain adapter references.
  They should pressure Atlas toward grid/source discipline, height/color
  diagnostics, mobile occlusion budgets, world-basis helpers, and source-art
  contrast checks without vendoring their runtimes.

## Current Atlas Engine Stack

### 1. Runtime Service Surface

Owner: Axiom final authority, Forge guard ownership.

Files:

- `server/src/index.ts`
- `docs/TOOL_CONTRACTS.md`
- `docs/ATLAS_BACKEND_SERVICE_MAP.md`

Rules:

- Seven public MCP tools stay stable unless Axiom explicitly opens tool-list
  work.
- `structuredContent` carries concise truth.
- `_meta` carries widget-rich scene state.
- Shell and unsupported counties must not receive playable `_meta.scene`.
- Tool copy must not imply lookup data, hidden drafts, or source packs unlock a
  playable map.

### 2. World Identity And Coverage

Owner: Forge.

Files:

- `packages/core/src/world/NationalWorldService.ts`
- `packages/core/src/world/types.ts`
- `packages/core/src/world/californiaCountyIndex.ts`

Rules:

- Country, state, county, district, and place identity are backend-owned.
- Riverside is currently the only public playable county.
- Shell counties are coverage state, not playable state.
- Anaheim and Ontario are candidate/draft lanes until the promotion packet
  says otherwise.
- Provider-normalized and public-quality counts must stay zero until a separate
  gate changes them.

### 3. Provider Boundary

Owner: Forge.

Files:

- `packages/geo/src/GeoDataAdapter.ts`
- `packages/geo/src/ProviderUsagePolicy.ts`
- `packages/core/src/world/NationalWorldService.ts`
- `scripts/verify-provider-boundaries.mjs`
- `scripts/verify-no-google-in-renderer.mjs`
- `scripts/verify-world-lookup-boundary.mjs`

Rules:

- Google/provider calls are allowed only behind `GeoDataAdapter`.
- Provider lookup is read-only discovery.
- Provider lookup never becomes scene geometry or coverage promotion by
  default.
- Every provider result must carry source, TTL/cache, normalized category
  status, and hard-false promotion/readiness fields.
- Renderer, widget, and public tool text must not expose raw provider payloads.

### 4. Candidate-To-Playable Pipeline

Owner: Forge, with Mira and Lumen gates before public promotion.

Files:

- `data/district_candidate_packs/*`
- `data/district_place_anchor_packs/*`
- `data/district_curated_packs/*`
- `packages/core/src/world/districtPromotionPacket.ts`
- `packages/core/src/world/districtReadinessAggregator.ts`
- `scripts/verify-california-district-pipeline.mjs`
- `scripts/verify-second-district-readiness.mjs`
- `scripts/export-second-district-readiness-artifact.mjs`

Rules:

- Candidate pack means intent.
- Anchor pack means source-noted evidence.
- Curated pack means draft structure.
- Hidden compiler proof means internal evidence.
- Visual packet means screenshot review material.
- Product proof means Mira can show the user-facing path.
- Split guard means release mechanics are clean.
- Only the combined packet can move a district toward public playability.

### 5. Scene Compiler

Owner: Axiom/Lumen for visual behavior, Forge for contract and guard pressure.

Files:

- `packages/core/src/voxel/cityWorldCompiler.ts`
- `packages/core/src/voxel/cityWorldTypes.ts`
- `packages/core/src/voxel/index.ts`
- `packages/core/test/city-world-compiler.test.ts`

Rules:

- The compiler owns what exists in the world.
- The renderer must not invent product truth.
- Shell scenes emit terrain only.
- Hidden drafts stay non-playable and non-public.
- Public Riverside scene can contain places, pins, notes, and selected-place
  state because it is the curated playable loop.
- Cars, walkers, decorative props, labels-as-crutches, and provider geometry are
  forbidden in this engine-beta lane.

### 6. Engine Basis And Diagnostics

Owner: Forge/Axiom shared.

Files:

- `packages/core/src/voxel/cityWorldBasis.ts`
- `packages/core/src/voxel/cityWorldTerrainSampler.ts`
- `packages/core/src/voxel/cityWorldDiagnostics.ts`
- `packages/core/src/voxel/cityWorldDerivedTerrainMap.ts`
- `scripts/debug-city-world-engine.mjs`
- `scripts/verify-cityworld-derived-terrain-maps.mjs`
- `scripts/verify-cityworld-mobile-occlusion.mjs`

Rules:

- `CityWorldBasis` is the single place for board/projected/viewport math.
- Diagnostics are the engine truth before screenshots.
- Screenshot review still matters, but it must be attached to named metrics.
- Debug overlay stays behind `?atlasDebug=engine`.
- Mobile proof is a first-class engine constraint, not a late UI check.

### 7. Renderer

Owner: Lumen/Axiom, Forge guard.

Files:

- `web/src/CityWorldRenderer.tsx`
- `web/src/CityWorldView.tsx`
- `web/src/CountyCoverageView.tsx`
- `web/src/CountySwitcher.tsx`

Rules:

- Renderer consumes `CityWorldScene`; it does not decide coverage.
- Visual improvements must move a named metric or object-read goal.
- Normal UI must not show engine debug jargon.
- 390x844 mobile must remain readable: tray, switcher, entry rail, pins, notes,
  shell recovery, and unsupported recovery.

### 8. Release Guard

Owner: Forge.

Files:

- `scripts/verify-alpha-rc-split.mjs`
- focused verifier scripts
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`

Rules:

- Every new verifier script needs split-guard awareness.
- Strict `engine-beta-data` must stay at zero blockers and zero unknowns before
  deploy discussion.
- Existing provider/server files may remain in the accepted RC envelope only
  because provider boundary checks exist; new slices must still name and reject
  drift.
- No package/lock/env/DB/Hosted Clawd/persistence/Stripe/XP/evidence/OAuth/
  automation/reports/exports without explicit reopening.

## Axiom Operating Model

Axiom should run Atlas like an engine director, not like a visual-polish queue.

Each engine slice must answer:

1. Which engine axis changes?
2. Which typed contract changes?
3. Which metric should move?
4. Which verifier proves it?
5. Which screenshot packet proves the user can see it?
6. Which public claim stays blocked?
7. Which files are forbidden?

If a slice cannot answer those questions, it is not ready to implement.

## Forge Backend Manager Responsibilities

Forge should stop being only a final SAFE/BLOCK voice. The active lane is:

- keep the source-to-scene trace current;
- make provider policy machine-readable;
- turn candidate readiness into review packets;
- keep world identity, coverage tiers, provider lookup, and scene eligibility
  separate;
- own strict split guard rules;
- add verifiers before Axiom/Lumen make another visual push;
- surface the next backend artifact when visual work stalls.

Forge should push back when:

- a renderer hunk creates product truth;
- lookup data is treated as readiness;
- shell counties gain fake places;
- hidden drafts gain selected-place tools, pins, actors, or public state;
- public copy implies Anaheim/Ontario is playable;
- a deploy is proposed without strict split and provider checks.

## Near-Term Engine Ladder

### 0.13E Mobile LOD / Occlusion Budget Enforcement

Goal:
Turn mobile readability into an engine budget, not a Mira-only taste review.

Likely files:

- `packages/core/src/voxel/cityWorldDerivedTerrainMap.ts`
- `packages/core/src/voxel/cityWorldDiagnostics.ts`
- `packages/core/test/city-world-compiler.test.ts`
- `scripts/verify-cityworld-mobile-occlusion.mjs`
- `web/src/CityWorldRenderer.tsx` only if debug overlay display is needed
- focused docs/artifacts

Acceptance:

- Riverside mobile `390x844` reports tray-safe-band pressure and marker
  pressure.
- Debug overlay can show budget zones only behind `atlasDebug=engine`.
- Normal product UI stays unchanged.
- Shell and hidden draft scenes remain non-playable.

### 0.14E Source-To-Cell Assignment Contract

Goal:
Prepare for provider-normalized districts without using provider data as public
geometry.

Likely files:

- `packages/core/src/world/*`
- `packages/core/src/voxel/*`
- `packages/core/test/*`
- `scripts/verify-source-to-cell-assignment.mjs`
- focused docs

Acceptance:

- Candidate/draft anchors can describe assignment policy: source, coverage,
  confidence, bounds status, cell policy, and render eligibility.
- Default render eligibility is false.
- No Google payload reaches scene or renderer.
- Anaheim/Ontario stay hidden and non-playable.

### 0.15E Scene Budget / Payload Preflight

Goal:
Prevent full-county or second-district growth from silently creating slow or
unreviewable scene payloads.

Likely files:

- `packages/core/src/voxel/*`
- `packages/core/test/*`
- `scripts/verify-cityworld-scene-budget.mjs`
- focused docs

Acceptance:

- Each scene reports bounds, terrain cells, roads, lots, buildings, pins,
  actors, payload size, camera count, debug payload size, and max detail
  density.
- Hidden draft and shell budgets are lower than public playable budgets.
- Failure is explicit, not a warning buried in logs.

### 0.16E Object Face Grammar / No-Label Proof

Goal:
Give Lumen enough engine data to prove object recognition before labels.

Likely files:

- `packages/core/src/voxel/*`
- `packages/core/test/*`
- renderer only if face metadata needs display
- visual packet verifier docs/scripts

Acceptance:

- Object families expose face-role metadata: roof, wall, frontage, entry,
  service edge, and anchor role.
- No-label packet can test category recognition without relying on visible
  text.
- Hidden Anaheim/Ontario remain non-public.

### 0.17E Provider Promotion Preflight

Goal:
Define exactly what must be true before a county can leave lookup-only status.

Likely files:

- `packages/core/src/world/*`
- `packages/geo/src/*`
- `packages/core/test/*`
- `scripts/verify-provider-promotion-preflight.mjs`
- focused docs

Acceptance:

- A provider-normalized district requires bounded categories, source coverage,
  cache/TTL policy, failure behavior, source-to-cell assignment, human review
  fields, screenshot proof pointers, and release guard status.
- The verifier proves Riverside remains the only playable public county until a
  separate promotion slice passes.

## Hard Rules For Axiom

- Do not build a national canvas. Build bounded scenes.
- Do not let renderer code become coverage truth.
- Do not promote a district because it has a draft scene.
- Do not promote lookup results into scene geometry.
- Do not solve visual weakness with props, labels, panels, cars, walkers, or
  debug UI.
- Do not open Hosted Clawd, DB, Stripe, XP, evidence, OAuth, automation,
  reports, or exports from an engine slice.
- Do not deploy from a mixed tree without strict split guard and provider
  verifier proof.

## Axiom Daily Command Set

Use this set when deciding whether the engine is moving or just getting busier:

```powershell
pnpm --dir packages/core test
pnpm typecheck:starter
pnpm build:starter
node scripts\debug-city-world-engine.mjs --json-only
node scripts\verify-cityworld-derived-terrain-maps.mjs --json-only
node scripts\verify-cityworld-mobile-occlusion.mjs --json-only
node scripts\verify-no-google-in-renderer.mjs --json-only
node scripts\verify-provider-boundaries.mjs --json-only
node scripts\verify-tool-result-shape.mjs --json-only
node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only
```

If one command is missing because the slice has not built it yet, that is the
next Forge artifact candidate.
