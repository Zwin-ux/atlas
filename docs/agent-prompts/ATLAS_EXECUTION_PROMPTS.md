# Atlas Execution Prompts

Use these prompts when handing Atlas work to another coding agent. Each prompt
starts with the same operating posture: read the current repo first, preserve
the map-first product shape, keep provider payloads out of renderers, and ship
one narrow slice with verification.

## Parallel Codex Operating Model

Use this when you want Atlas moving fast without turning the repo into a merge
fight. The maximum useful shape is two code-writing worktrees plus one
integration/QA thread. More threads will slow the project down because Atlas has
shared renderer, tool, and doc files.

### Roles

1. Integration/QA captain
   - Owns the main branch/worktree, merge order, final verification, browser QA,
     `docs/BUILD_LOG.md`, and `docs/NEXT_QUESTS.md`.
   - Does not start speculative product work.
   - Pulls in one worker lane at a time, resolves doc conflicts deliberately, and
     refuses merges that return old dashboard/report UI or leak provider payloads.

2. Visual lane
   - Owns the map feel, sprite lane, Pixi renderer, city-world asset manifest,
     and preview proof.
   - Default use: run only when a live visual issue exists. E7.4 is the archived
     example prompt once the real sprite proof is already complete locally.
   - Avoids MCP server behavior unless a renderer contract forces a typed change.

3. Tool/backend lane
   - Owns MCP tool contracts, server routes, Apps SDK review hardening, county
     question slices, verifiers, and submission copy.
   - Default next quests: E8.5 only if review/tool surface is blocked, otherwise
     E8.6 County Question Slice.
   - Avoids renderer redesign and visual polish files.

### Current Recommended Split

Run only these lanes until the Alpha app is reviewable:

- Thread A: E8.6 County Question Slice.
- Thread B: E8.5 ChatGPT Tool Surface Hardening only if app review/tool
  verification is currently failing.
- Thread C: Integration/QA captain.

If Thread B has no concrete blocker, leave it idle. A third thread is only fast
when it owns a real slice with non-overlapping files. If the visible map starts
changing again, finish and verify that renderer slice before branching new
workers from it.

### Worktree Setup Commands

Run these from a clean integration worktree after the current dirty slice is
committed or intentionally parked:

```powershell
git status --short
git worktree list

git worktree add -b codex/atlas-e8-county-question ..\Atlas-e8-county-question HEAD
git worktree add -b codex/atlas-e8-tool-surface ..\Atlas-e8-tool-surface HEAD
git worktree add -b codex/atlas-integration-qa ..\Atlas-integration-qa HEAD
```

Skip the E8.5 tool-surface worktree if there is no review or verifier blocker.
Do not create worker branches from a dirty worktree and expect uncommitted files
to come along; they will not.

### File Ownership Guardrails

- Visual lane: `packages/assets/city-world/**`, `web/src/CityWorld*`,
  `web/src/cityWorldAtlasResolver.ts`, `apps/widget/src/CityWorld*`,
  `apps/widget/src/cityWorldAtlasResolver.ts`, renderer specs, and E7 issues.
- Tool/backend lane: `server/src/**`, `packages/mcp/**`, `packages/core/src/world/**`,
  `packages/core/src/county/**`, `packages/geo/**`, MCP verifiers,
  `chatgpt-app-submission.json`, tool contracts, and E8 issues.
- Integration/QA lane: browser QA, served preview checks, release readiness,
  final doc reconciliation, and merge verification.

Shared docs such as `docs/BUILD_LOG.md`, `docs/NEXT_QUESTS.md`, and
`docs/DECISIONS.md` will conflict sometimes. That is acceptable; the integration
thread keeps every true entry and removes duplicates.

### Worker Thread Opening Prompt

Paste this at the top of every worker thread before the quest-specific prompt:

```md
You are one Atlas worker lane, not the integration owner.

Before editing:
- Read `AGENTS.md`.
- Read `docs/PRODUCT_NORTH_STAR.md`, `docs/ENGINEERING_ROUTE.md`,
  `docs/PHASE_PLAN.md`, `docs/TOOL_CONTRACTS.md`, and `docs/NEXT_QUESTS.md`.
- Read `docs/PRODUCTION_EVOLUTION_GATES.md`.
- Run `git status --short` and identify files already dirty in this worktree.
- State current quest, maturity level, target maturity level, likely files,
  anti-scope, and human approval gate.

Rules:
- Build one shippable slice only.
- Name what becomes more real and what remains mock, curated, temporary, or
  session-only.
- Preserve the map-first ChatGPT app shape.
- Do not bring back dashboard/report/card UI.
- Do not expose raw Google/provider payloads to Pixi, React, `VoxelScene`, or
  `CityWorldScene`.
- Do not add auth, Stripe, persistence, Three.js, live county ingestion, or broad
  e2e tests.
- Update `docs/BUILD_LOG.md` and `docs/NEXT_QUESTS.md`.
- Update `docs/DECISIONS.md` only for durable product or architecture choices.
- Run one focused verification command and report exact results.

Final response must include:
- Files changed.
- What works now.
- What was skipped.
- Verification command and result.
- Maturity level changed and human approval gate.
- Merge risks for the integration thread.
- The next quest.
```

### Integration Thread Prompt

```md
Current quest:
Act as Atlas integration/QA captain for the active worker lanes.

Task:
Inspect current branch and worker diffs before merging. Merge one lane at a
time. Resolve shared docs by keeping true entries from each lane. Run focused
verification after each merge and a final app-level check before declaring the
slice ready.

Acceptance criteria:
- `git status --short` is understood before merge work starts.
- Worker lane file ownership is respected.
- No old dashboard/report/campaign shell returns to `/preview`.
- Renderer still consumes Atlas scene contracts only.
- MCP tool docs, submission JSON, and server tools agree.
- `docs/BUILD_LOG.md` and `docs/NEXT_QUESTS.md` reflect the final state.
- Final answer names merged lanes, conflicts resolved, verification results,
  remaining blockers, and the next quest.
```

## Prompt 1: E7.2 Sprite Atlas Completion Audit

```md
Current quest:
Audit and finish Quest E7.2 Sprite Atlas Readiness for Atlas.

Likely files:
- packages/core/src/voxel/cityWorldAtlas.ts
- packages/core/test/city-world-atlas.test.ts
- packages/assets/city-world/atlas.manifest.json
- packages/assets/city-world/README.md
- web/src/cityWorldAtlasResolver.ts
- web/src/CityWorldRenderer.tsx
- apps/widget/src/cityWorldAtlasResolver.ts
- apps/widget/src/CityWorldRenderer.tsx
- docs/BUILD_LOG.md
- docs/NEXT_QUESTS.md
- docs/DECISIONS.md if a durable architecture choice is made

Anti-scope:
No new dashboard shell, no generic SaaS UI, no Three.js, no live Google rendering,
no auth, no Stripe, no persistence, no broad e2e stack, and no old report/card UI.

Task:
Inspect the existing E7.2 implementation before editing. Finish only the missing
pieces needed to make the sprite atlas lane production-ready while preserving the
current full-screen city map.

Acceptance criteria:
- `CityWorldAtlasManifest` and validators are exported from `@atlas/core`.
- `packages/assets/city-world/atlas.manifest.json` validates.
- Current Eastvale `CityWorldScene` sprite and palette keys validate.
- Web and widget renderers route buildings, props, actors, and pins through the
  atlas resolver.
- Missing textures fall back to code-generated primitives without blanking the map.
- At least one visible quality improvement remains in the primitive path.
- No raw Google/provider payload reaches Pixi, React, `VoxelScene`, or
  `CityWorldScene`.
- Update required docs.
- Run one focused verification command, preferably `pnpm --dir packages/core test`
  plus the smallest renderer/build check touched by the slice.
```

## Prompt 2: E7.3 Browser QA And Interaction Hardening

```md
Current quest:
Run browser-level QA for the Atlas city-world renderer after E7.2.

Likely files:
- web/src/CityWorldRenderer.tsx
- web/src/CityWorldView.tsx
- web/src/cityWorldAtlasResolver.ts
- apps/widget/src/CityWorldRenderer.tsx
- scripts/verify-preview-http.mjs
- docs/BUILD_LOG.md
- docs/NEXT_QUESTS.md
- docs/issues/E7.3-browser-qa-and-interaction-hardening.md

Anti-scope:
Do not redesign the UI. Do not add a broad e2e suite. Do not deploy. Do not add
auth, persistence, Stripe, live ingestion, Three.js, or dashboard/report surfaces.

Task:
Start a temporary local Atlas server on a free port, run focused browser QA
against `/preview`, then stop the server cleanly.

Acceptance criteria:
- Desktop preview loads one full-screen Pixi canvas.
- Canvas is dense and nonblank.
- No old visible language appears: `campaign`, `report`, `signal`, `risk`,
  `tactical`, `dashboard`, `board`.
- Mobile `390x844` has no horizontal overflow.
- Drag changes camera position.
- Wheel zoom changes scale.
- Place clicks work for Eastvale Core, Gym, Community Park, and Apartments.
- Sticker drop works.
- Note save works.
- Console has no resolver or renderer warnings/errors.
- Temporary server is stopped and no temp logs/processes remain.
- Update `docs/BUILD_LOG.md` with exact verification evidence.
```

## Prompt 3: E7.4 Real Sprite Proof

```md
Current quest:
Add the first tiny real sprite proof to the Atlas city-world atlas lane.

Likely files:
- packages/assets/city-world/atlas.manifest.json
- packages/assets/city-world/textures/*
- packages/assets/city-world/source/*
- web/src/cityWorldAtlasResolver.ts
- web/src/CityWorldRenderer.tsx
- apps/widget/src/cityWorldAtlasResolver.ts
- docs/ASSET_PACK_SPEC.md
- docs/VOXEL_RENDERER_SPEC.md
- docs/BUILD_LOG.md
- docs/NEXT_QUESTS.md

Anti-scope:
Do not create a full art pipeline. Do not replace the whole map. Do not add a
new dependency unless the existing Pixi/Vite/esbuild path cannot load the asset.
No generic stock art, dashboard UI, Three.js, auth, Stripe, or provider payloads.

Task:
Prove the sprite path with one small production-quality asset category, such as
sticker pins or shop signs, while keeping primitive fallback for everything else.

Acceptance criteria:
- One real texture asset is committed under the city-world asset lane.
- Manifest frame/anchor data points at the asset.
- Resolver can return `mode: "sprite"` for that asset when loaded.
- Missing sprite loads still fall back to primitives.
- The visible map still reads as the same Atlas city product.
- Run build and preview verification for the touched path.
```

## Prompt 4: E8.5 ChatGPT Tool Surface Hardening

```md
Current quest:
Harden the Atlas ChatGPT tool surface after `select_county`.

Likely files:
- server/src/index.ts
- scripts/verify-mcp-flow.mjs
- scripts/verify-submission.mjs
- chatgpt-app-submission.json
- docs/TOOL_CONTRACTS.md
- docs/APPS_SDK_MCP_SPEC.md
- docs/REVIEW_READINESS.md
- docs/BUILD_LOG.md
- docs/NEXT_QUESTS.md

Anti-scope:
No new product tools unless a concrete review or product blocker requires one.
No persistence, XP, evidence, checkout, account creation, automated posting, DMs,
provider scraping, or raw Google payloads in renderer/UI contracts.

Task:
Inspect the current MCP server and verifiers. Tighten schema, tool descriptions,
submission copy, and verification around the existing tool surface:
`select_county`, `render_voxel_county`, `lookup_world_places`,
`ask_county_question`, `preview_scout_drop`, `preview_campaign_engine`, and
`get_upgrade_options`.

Acceptance criteria:
- Tool list in docs, submission JSON, and verifiers matches the active server.
- Every tool has accurate annotations and output schema.
- `select_county` returns compact `structuredContent` and full scene in
  `_meta.scene`.
- Live lookup returns normalized Atlas data only and no raw provider fields.
- Negative cases remain explicit for payments, DMs, scraping, saving provider
  data, and mass outreach.
- Run `pnpm verify:mcp` or `pnpm verify:submission` against a local server.
```

## Prompt 5: E8.6 County Question Slice

```md
Current quest:
Add the smallest county-question slice for the Riverside/Eastvale Atlas demo.

Likely files:
- packages/core/src/county/*
- packages/core/src/world/*
- server/src/index.ts
- scripts/verify-mcp-flow.mjs
- docs/TOOL_CONTRACTS.md
- docs/ENGINEERING_ROUTE.md
- docs/BUILD_LOG.md
- docs/NEXT_QUESTS.md
- docs/issues/E8.6-county-question-slice.md

Anti-scope:
No live ingestion, no saved memory, no RAG stack, no new database, no broad Q&A
engine, no raw Google payloads, no campaign execution, and no new dashboard UI.

Task:
Add one read-only tool that answers a small set of county/business questions from
the curated Riverside pack and existing normalized world contracts. Keep answers
source-labeled and honest about curated Alpha limits.

Acceptance criteria:
- Tool is read-only, non-destructive, and closed-world.
- Answers use curated pack facts and source notes only.
- It can answer why Eastvale is the first slice and which curated signals support
  mobile detailing.
- It refuses or narrows unsupported counties/business claims.
- It does not save state or claim live market truth.
- Verification covers at least one supported and one unsupported question.
```

## Prompt 6: E9 Hosted Clawd Planning Only

```md
Current quest:
Plan Hosted Clawd Beta without implementing auth, payments, or persistence yet.

Likely files:
- docs/DATABASE_SCHEMA_BETA.md
- docs/PRICING_MODEL.md
- docs/TOOL_CONTRACTS.md
- docs/PHASE_PLAN.md
- docs/NEXT_QUESTS.md
- docs/issues/E9.0-hosted-clawd-beta-contracts.md

Anti-scope:
No Stripe, OAuth, database migrations, user accounts, evidence/XP grants, or
production infrastructure changes in this pass.

Task:
Turn Hosted Clawd into concrete Beta contracts and implementation order. Keep the
free Alpha behavior honest and temporary.

Acceptance criteria:
- Define the minimum persisted entities for business profile, Scout Drop,
  campaign, quest, evidence, and XP ledger.
- Define which future tools require Hosted Clawd.
- Define access-control and idempotency tests before implementation.
- Keep Alpha tool copy clear that nothing is saved yet.
- Update docs only unless the user explicitly asks for implementation.
```
