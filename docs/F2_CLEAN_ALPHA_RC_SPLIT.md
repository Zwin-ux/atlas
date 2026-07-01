# F2 Clean Functional Alpha RC Split

Owner: Axiom - Atlas GM / Principal Systems Architect
2IC gate: Mira - Main Product Software Engineer / Human Experience 2IC
Support: Forge - Glue Engineer / Backend Apprentice
Visual stance: Lumen - Art Captain Specialist / voxel-engine captain

Status: blocked for release/deploy until this split is challenged and verified.
The Big 4 may edit owned lane docs/specs while blocked; what is blocked is
mixed staging, deploy, and cross-lane product changes.

## Objective

Produce a clean Production Alpha release candidate for the ChatGPT Atlas app.
The candidate must prove the current functional app loop without quietly
shipping parked visual experiments, Hosted Clawd persistence, money systems, XP,
evidence, OAuth, automation, reports, exports, or broad product scope.

Alpha approval is not art-final approval. Current visual quality can be used as
functional map evidence only.

## Axiom Decision

The current worktree is a mixed tree and is not releasable as-is.

The first Functional Alpha RC should be cut from a clean baseline that already
matches the green public app loop, plus only explicitly reviewed operating docs.
No current uncommitted product code enters the functional RC unless Axiom
explicitly reclassifies it after Forge's split report and Mira's challenge.

## RC Lanes

| Lane | Default decision | Reason |
| --- | --- | --- |
| Functional Alpha RC | Use clean committed/public-green app surface; stage only reviewed F2 operating docs unless a file is reclassified. | F1 public function proof is green. Dirty tree is the blocker, not a known functional bug. |
| Visual E7/lab/art | Park from RC edits; keep Lumen active as voxel-engine critic. | Lumen says visual is 6-7/10 and not art approval. The lab and asset proofs are useful, but not release dependencies. |
| Hosted Clawd/backend persistence | Park. | Public Alpha state stays session-only. DB-backed Hosted Clawd is invite-gated and not part of the functional Alpha claim. |
| Shared docs | Hunk-review only. | `BUILD_LOG`, `NEXT_QUESTS`, `DECISIONS`, and brain docs contain mixed lane history. Do not stage whole files blindly. |

## Forge Mechanical Split Map

Snapshot: 2026-07-01. Source: `git status --short`, `git diff --name-status`,
and focused `git diff --unified=0` checks. Forge did not stage, deploy, mutate
Railway, touch secrets, or edit product/runtime files while producing this map.

### Functional RC Candidate

Default F2 stance: do not stage dirty product code for the first clean
Functional Alpha RC. If Axiom reclassifies the current map/renderer work into a
separate renderer RC, these files must move together because the compiler,
schema, atlas validation, renderer, and tests are coupled:

- `packages/core/src/index.ts`
- `packages/core/src/voxel/cityWorldAtlas.ts`
- `packages/core/src/voxel/cityWorldCompiler.ts`
- `packages/core/src/voxel/cityWorldTypes.ts`
- `packages/core/test/city-world-atlas.test.ts`
- `packages/core/test/city-world-compiler.test.ts`
- `web/src/CityWorldRenderer.tsx`
- `web/src/CityWorldView.tsx`
- `web/src/styles.css`

Ownership note: this is not a safe partial pick unless the exact schema
contract is reviewed. The current diff adds `roadModules`, terrain edge fields,
module atlas validation, renderer behavior, and updated interaction/UI styling.

### Visual Parked Lane

Keep these out of Functional Alpha RC unless Axiom explicitly reopens the
visual/module-atlas lane:

- `assets/reference/atlas-voxel-map-tile-marker-kit.png`
- `assets/reference/atlas-voxel-town-north-star.png`
- `experiments/**`
- `packages/assets/city-world/README.md`
- `packages/assets/city-world/atlas.manifest.json`
- `packages/assets/city-world/module-atlas-artist-handoff.md`
- `packages/assets/city-world/module-atlas-workflow.json`
- `packages/assets/city-world/textures/**`
- `scripts/build-web.mjs`
- `scripts/verify-city-world-module-atlas.mjs`
- `web/src/assets.d.ts`
- `web/src/cityWorldAtlasResolver.ts`
- `web/src/cityWorldModuleAtlas.ts`

Specific hunk ownership:

- `packages/assets/city-world/atlas.manifest.json` adds `textureUrl`, changes
  tile size from `44x24` to `56x32`, adds apartment/shop variants, adds
  road/terrain module frames, and changes building/prop/actor anchors and
  scales. Classification: visual parked, mixed renderer contract risk.
- `web/src/cityWorldAtlasResolver.ts` imports multiple SVG/PNG textures,
  generated module sources, `Rectangle`, and `Texture`; it changes texture load
  behavior from a single favorite pin to all module sources plus bitmap atlas
  slicing. Classification: visual parked.
- `web/src/assets.d.ts` adds `*.png` module support. Classification: visual
  parked unless bitmap module atlas is accepted into an approved renderer RC.
- `scripts/build-web.mjs` adds the esbuild `.png` dataurl loader.
  Classification: visual parked unless bitmap module atlas is accepted.

### Hosted Clawd / Backend Parked Lane

Keep these out of Functional Alpha RC:

- `.env.example`
- `package.json`
- `pnpm-lock.yaml`
- `server/src/index.ts` Hosted Clawd hunks only
- `server/src/hostedClawd/**`
- `migrations/**`
- `scripts/verify-hosted-clawd-persistence.ts`
- `scripts/smoke-hosted-clawd-db.ts`
- `scripts/smoke-hosted-clawd-http.mjs`
- `docs/HOSTED_CLAWD_ONBOARDING_SPEC.md`

Specific hunk ownership:

- `.env.example` adds `DATABASE_URL`, `TEST_DATABASE_URL`, and
  `HOSTED_CLAWD_INVITE_TOKEN`. Classification: backend parked.
- `package.json` adds `migrate:hosted-clawd`,
  `migrate:hosted-clawd:test`, `verify:hosted-clawd`,
  `smoke:hosted-clawd:db`, `smoke:hosted-clawd:http`, `node-pg-migrate`,
  `pg`, and `@types/pg`. Classification: backend parked as a whole for F2.
- `pnpm-lock.yaml` adds DB/migration dependencies and transitive packages for
  `node-pg-migrate`, `pg`, and `@types/pg`. Classification: backend parked as
  a whole for F2.
- `server/src/index.ts` has two backend-only hunks: the
  `handleHostedClawdRoute` import near the top of the file and the early HTTP
  route hook before `/preview` and MCP request handling. Classification:
  mixed-risk file; existing server routes are RC-safe, but these Hosted Clawd
  hunks must be excluded unless backend persistence is explicitly resumed.

### Shared Docs Requiring Hunk Review

Do not stage these as whole files:

- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`
- `docs/brain/README.md`
- `docs/COMMUNICATIONS/**`
- `docs/COMMUNICATIONS_HUB.md`
- `docs/agent-prompts/ATLAS_WORKER_ROLE_CONTRACTS.md`
- `docs/brain/ALPHA_BETA_UPDATE_CADENCE.md`
- `docs/brain/COMMS_MATRIX.md`
- `docs/brain/VOXEL_VISUAL_BAR.md`
- `docs/brain/VOXEL_VISUAL_VOCABULARY.md`
- `docs/brain/WORKER_OPERATING_BRAIN.md`

Doc hunk ownership:

- `docs/BUILD_LOG.md` contains mixed F2 split entries, visual E7 history,
  Hosted Clawd DB/Railway history, deployment notes, and worker-comms history.
  Classification: hunk-review only.
- `docs/NEXT_QUESTS.md` contains current F2 priority and session-only Alpha
  boundaries, but also visual history and Hosted Clawd database status.
  Classification: hunk-review only.
- `docs/DECISIONS.md` contains backend persistence decisions, visual-lab
  decisions, and one broadly RC-relevant scope decision: voxel-engine focus
  beats feature sprawl. Classification: hunk-review only.

### Must-Not-Stage Risks

- Do not stage `package.json` or `pnpm-lock.yaml` into Functional Alpha RC.
- Do not stage `.env.example` DB/invite-token placeholders into Functional
  Alpha RC.
- Do not stage `server/src/index.ts` as a whole; exclude the Hosted Clawd
  import and route hook unless backend is reopened.
- Do not stage renderer/core/map files piecemeal; their current schema,
  compiler, renderer, manifest, and tests are coupled.
- Do not stage `packages/assets/city-world/atlas.manifest.json` without the
  renderer/atlas decision.
- Do not stage whole shared docs without hunk review.
- Do not stage any visual lab/reference/proof asset as functional evidence.

### Exact Clean RC Workflow

1. Cut the Functional Alpha RC from clean committed/public-green app surface.
2. Add only hunk-reviewed F2 operating docs first.
3. Keep Hosted Clawd, DB env, migrations, package/lock changes, DB smoke
   scripts, and Hosted Clawd route hooks parked.
4. Keep visual lab, module atlas, texture assets, bitmap loader, atlas resolver,
   and renderer/schema changes parked unless Axiom explicitly opens a renderer
   RC.
5. Produce an exact staged list and parked list before asking Mira for release
   packet review.
6. Run the required local clean-RC verifiers before any deploy/submission talk:
   `pnpm typecheck:starter`, `pnpm build:starter`, `pnpm verify:mcp`,
   `pnpm verify:submission`, and `pnpm verify:preview:http`.

### Guard Tooling

Run the split guard before any Functional Alpha RC staging claim:

```bash
node scripts/verify-alpha-rc-split.mjs
```

Default mode inspects staged files with `git diff --cached --name-only`.
It prints a JSON summary plus human-readable blockers and fails if staged files
belong to parked visual, Hosted Clawd/backend, renderer, shared-doc-review, or
unknown lanes.

For machine-readable output without the human-readable blocker list:

```bash
node scripts/verify-alpha-rc-split.mjs --json-only
```

The JSON includes `safeToStageForFunctionalRc`, `filesByClassification`,
`blockers`, `counts`, and `unknown` count. A zero-blocker staged result means
the staged set is mechanically clean by path. Shared docs still require
hunk-review before they can be treated as release-safe.

For scouting the current dirty tree:

```bash
node scripts/verify-alpha-rc-split.mjs --working-tree
```

`--working-tree` inspects `git status --short` and should block while the mixed
tree still contains parked visual, Hosted Clawd/backend, renderer, shared-doc,
or unknown files. This mode is diagnostic; it does not stage or mutate files.

For Axiom/Mira release packets, run both:

```bash
node scripts/verify-alpha-rc-split.mjs --working-tree --json-only
node scripts/verify-alpha-rc-split.mjs --json-only
```

The first command prints the exact dirty-tree parked/shared lanes. The second
command proves the staged candidate is clean or names the staged blockers.

For Path B, the named Mira tray-hardening product-code RC mode is:

```bash
node scripts/verify-alpha-rc-split.mjs --rc-mode mira-tray-hardening --json-only
node scripts/verify-alpha-rc-split.mjs --rc-mode mira-tray-hardening --working-tree --json-only
node scripts/verify-alpha-rc-split.mjs --rc-mode mira-tray-hardening --strict-selected-rc --json-only
```

This mode only reclassifies `web/src/CityWorldView.tsx` and
`web/src/styles.css` as `product-code-rc-candidate`. Default mode still parks
those files. Path B must still exclude visual lab/module-atlas files, Hosted
Clawd/backend persistence, package/lock/env changes, migrations, and mixed
shared docs.

Use `--strict-selected-rc` after staging a candidate. It fails if any staged
path is outside the exact selected-RC allowlist: functional RC support
docs/scripts plus `web/src/CityWorldView.tsx` and `web/src/styles.css` for Path
B.

Path B mechanical plan:

1. Start from a clean branch or clean worktree at the public-green baseline.
2. Apply only the current hunks from `web/src/CityWorldView.tsx` and
   `web/src/styles.css`.
3. Do not apply `CityWorldRenderer`, core voxel schema/compiler/test,
   `cityWorldAtlasResolver`, asset manifest, texture, package/lock, env,
   migration, Hosted Clawd, or mixed doc hunks.
4. Run `node scripts/verify-alpha-rc-split.mjs --rc-mode mira-tray-hardening --strict-selected-rc`
   before any deploy or release packet claim.
5. Run the functional proof commands from the evidence packet after the clean
   candidate is isolated.

## Candidate Staged Files

For Path B, the clean RC candidate is exactly:

- `web/src/CityWorldView.tsx`
- `web/src/styles.css`
- `docs/ALPHA_COMMAND_CENTER.md`
- `docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md`
- `docs/F2_CLEAN_ALPHA_RC_SPLIT.md`
- `scripts/verify-alpha-product-loop.mjs`
- `scripts/verify-alpha-public-sanity.mjs`
- `scripts/verify-alpha-rc-split.mjs`

Before staging or deploy, run:

```bash
node scripts/verify-alpha-rc-split.mjs --rc-mode mira-tray-hardening --strict-selected-rc --json-only
```

That command must report zero blockers and zero unknowns. Do not stage older
communications docs, broad brain docs, `BUILD_LOG`, `NEXT_QUESTS`, visual lab
files, Hosted Clawd files, package/lock/env files, or renderer/core files into
this Path B candidate.

## Parked Visual Files

Do not include these in the Functional Alpha RC:

- `experiments/voxel-pastel-lab/**`
- `assets/reference/atlas-voxel-town-north-star.png`
- `assets/reference/atlas-voxel-map-tile-marker-kit.png`
- `docs/brain/VOXEL_VISUAL_BAR.md`
- `docs/brain/VOXEL_VISUAL_VOCABULARY.md`
- `packages/assets/city-world/README.md`
- `packages/assets/city-world/atlas.manifest.json`
- `packages/assets/city-world/module-atlas-artist-handoff.md`
- `packages/assets/city-world/module-atlas-workflow.json`
- `packages/assets/city-world/textures/actor-clawd.svg`
- `packages/assets/city-world/textures/building-civic-tower.svg`
- `packages/assets/city-world/textures/building-gym.svg`
- `packages/assets/city-world/textures/building-home-gable.svg`
- `packages/assets/city-world/textures/building-shop-plaza.svg`
- `packages/assets/city-world/textures/module-atlas-proof.png`
- `packages/assets/city-world/textures/prop-tree-block.svg`
- `web/src/cityWorldModuleAtlas.ts`
- `scripts/verify-city-world-module-atlas.mjs`

## Parked Renderer/Product-Code Files

Do not include these in the Functional Alpha RC unless a separate renderer RC is
approved:

- `packages/core/src/index.ts`
- `packages/core/src/voxel/cityWorldAtlas.ts`
- `packages/core/src/voxel/cityWorldCompiler.ts`
- `packages/core/src/voxel/cityWorldTypes.ts`
- `packages/core/test/city-world-atlas.test.ts`
- `packages/core/test/city-world-compiler.test.ts`
- `web/src/CityWorldRenderer.tsx`
- `web/src/CityWorldView.tsx`
- `web/src/assets.d.ts`
- `web/src/cityWorldAtlasResolver.ts`
- `web/src/styles.css`
- `scripts/build-web.mjs`

These files contain real visual/renderer work. They may become valuable later,
but they are not part of a clean function-readiness RC by default.

## Parked Hosted Clawd / Persistence Files

Do not include these in the Functional Alpha RC:

- `.env.example`
- `package.json`
- `pnpm-lock.yaml`
- `server/src/index.ts`
- `server/src/hostedClawd/**`
- `migrations/**`
- `scripts/verify-hosted-clawd-persistence.ts`
- `scripts/smoke-hosted-clawd-db.ts`
- `scripts/smoke-hosted-clawd-http.mjs`
- `docs/HOSTED_CLAWD_ONBOARDING_SPEC.md`
- `docs/DECISIONS.md` unless hunk-reviewed for non-persistence decisions only

Reason: this lane adds database dependencies, routes, migrations, env variables,
and invite-gated persistence behavior. It must not leak into Alpha as a saved
state claim.

## Must-Not-Stage Rules

- Do not stage `package.json` or `pnpm-lock.yaml` for Functional Alpha RC.
- Do not stage `server/src/index.ts` unless the Hosted Clawd route hunk is
  explicitly excluded or a backend lane is separately approved.
- Do not stage whole shared docs without hunk review.
- Do not stage visual lab, reference, or atlas proof assets as functional work.
- Do not deploy or submit from the current mixed tree.
- Do not claim durable saved notes, payment, XP, evidence, automation, reports,
  exports, or Hosted Clawd access in public Alpha.

## Required Proof Packet

Before Axiom can ask the human for Alpha approval, Mira must receive:

1. Exact staged file list.
2. Exact parked file list.
3. Desktop screenshot after real interaction: selected tray, sticker/pin, saved
   note.
4. Mobile `390x844` screenshot after the same interaction class.
5. Browser proof table: preview load, place tray, zoom, pan/zoom gesture,
   sticker/pin visible increment, note save visible increment/display, console.
6. Local clean-RC results:
   - `pnpm typecheck:starter`
   - `pnpm build:starter`
   - `pnpm verify:mcp`
   - `pnpm verify:submission`
   - `pnpm verify:preview:http`
7. Public sanity results:
   - public `pnpm verify:mcp`
   - public `pnpm verify:submission`
   - public `pnpm verify:preview:http`
8. Alpha boundary proof: notes/markers are session-only; no public saved-state,
   payment, XP, evidence, automation, reports, or exports claim.
9. Weak-spots note: what is still visually/functionally weak and why it is
   backlog rather than an Alpha blocker.

## Worker Assignments

- Mira challenges this split and owns product-software readiness. Mira may edit
  product-surface code, QA helpers, readiness-owned docs, and evidence packet
  artifacts when the slice is declared and scoped. Lens and Proof stay inside
  Mira's thread.
- Forge validates the mechanical split and identifies any mixed hunks that
  require surgical exclusion. Forge may edit split-map docs and backend/env
  route maps. Rivet stays inside Forge's thread.
- Lumen remains parked from implementation and RC staging, but active as the
  voxel-engine/art-system captain. Lumen may edit visual-engine specs and
  approved lab docs. Chisel may support screenshot critique only if Mira or
  Axiom asks for a visual confidence note.
- Echo stays local to Axiom as communications relay only.

## Next Decision

Forge's split map decides whether the Functional Alpha RC can be a clean
baseline plus docs, or whether a small code hunk must be separated into its own
branch. Until then, the deploy/submission conversation remains blocked.
