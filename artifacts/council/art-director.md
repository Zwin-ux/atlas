2026-07-11T06:19:39.341894Z ERROR codex_models_manager::manager: failed to refresh available models: timeout waiting for child process to exit
2026-07-11T06:19:39.357971Z ERROR codex_models_manager::manager: failed to refresh available models: timeout waiting for child process to exit
OpenAI Codex v0.144.1
--------
workdir: C:\Users\mzwin\Documents\Atlas
model: gpt-5.5
provider: openai
approval: never
sandbox: read-only
reasoning effort: xhigh
reasoning summaries: none
session id: 019f4fd4-e1de-7ea1-9159-d3865ce11b62
--------
user
You are ONE seat on a 10-seat critical review council for Atlas (this repo): a ChatGPT App (Apps SDK/MCP) rendering an explorable voxel county map inside ChatGPT. Live prod: https://atlas-backend-production-e6fc.up.railway.app (read-only probes allowed). Key docs: docs/NORTH_STARS.md, docs/ENGINE_TODO.md, docs/V1_PRODUCTION_BACKLOG.md, AGENTS.md, chatgpt-app-submission.json, artifacts/emulator/audit/REPORT.md, artifacts/engine-todo/*.md. Source: server/src/index.ts, web/src/*, packages/core/src/voxel/*. You CANNOT view images — ground critique in code, docs, metrics, and prod probes. BE HARSH AND SPECIFIC: your job is to find what is weak, missing, fake, or embarrassing — not to praise. Output EXACTLY: a ranked list of your TOP 5 findings, each with [SEVERITY critical/high/medium], a one-line finding, 2-4 lines of evidence (file:line or probe result), and a one-line concrete fix. No preamble.

SEAT: a staff art director for stylized games. Review the voxel visual grammar IN CODE: palettes (cityWorldRegionalPalettes.ts, compiler profiles), building/roof/facade variety, prop kit breadth, lighting/grade constants in CityWorldRenderer.tsx, terrain treatments. What reads procedurally cheap vs hand-built? Where is the art system thinnest?

2026-07-11T06:19:49.287884Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer realm=\"mcp\", resource_metadata=\"https://mcp.railway.com/.well-known/oauth-protected-resource\"" })
2026-07-11T06:19:49.293035Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer realm=\"OAuth\", resource_metadata=\"https://mcp.linear.app/.well-known/oauth-protected-resource/mcp\", error=\"invalid_token\", error_description=\"Missing or invalid access token\"" })
2026-07-11T06:19:49.406693Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer resource_metadata=\"https://mcp.figma.com/.well-known/oauth-protected-resource\",scope=\"mcp:connect\",authorization_uri=\"https://api.figma.com/.well-known/oauth-authorization-server\"" })
2026-07-11T06:19:51.699042Z ERROR rmcp::transport::worker: worker quit with fatal: Transport channel closed, when AuthRequired(AuthRequiredError { www_authenticate_header: "Bearer error=\"invalid_request\", error_description=\"No access token was provided in this request\", resource_metadata=\"https://mcp.supabase.com/.well-known/oauth-protected-resource/mcp?project_ref=kmzsloagmubsdixhvzsq\"" })
warning: Exceeded skills context budget of 2%. All skill descriptions were removed and 748 additional skills were not included in the model-visible skills list.
codex
I’ll ground this in the repo’s own art grammar rather than visual screenshots: palette/profile constants, renderer lighting, compiler output, prop/object kit, and terrain rules. I’m also doing a quick memory check because this is Atlas-specific and prior direction can affect what counts as drift.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Select-String -Path 'C:\\Users\\mzwin\\.codex\\memories\\MEMORY.md' -Pattern 'Atlas USA-scale map engine|voxel|visual|CityWorldRenderer|generated draft|art' -Context 0,2" in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path . -Name; Get-ChildItem -Path docs -Name; Get-ChildItem -Path artifacts\\engine-todo -Name" in C:\Users\mzwin\Documents\Atlas
 succeeded in 1138ms:
.agents
.claude
.codex
.github
.gstack
.reference
apps
artifacts
assets
data
docs
engineering-prompt-pack
experiments
migrations
node_modules
packages
plugins
prompt-pack
prompts
scripts
server
web
.atlas-e86-8802.err.log
.atlas-e86-8802.out.log
.atlas-preview-8899.err.log
.atlas-preview-8899.out.log
.atlas-preview-8901.err.log
.atlas-preview-8901.out.log
.env.example
.env.local
.gitignore
.railwayignore
AGENTS.md
chatgpt-app-submission.json
loop-budget.md
loop-constraints.md
loop-run-log.md
LOOP.md
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
railway.json
README.md
STATE.md
tsconfig.base.json
agent-prompts
architecture
brain
codex
design
issues
legal
updates
0.48P_DESIGN_ULTRA_PASS.md
0.75R_HANDOFF.md
0.76_BACKEND_ARCHITECTURE.md
0.76_USA_REGION_ARCHETYPES.md
ALPHA_COMMAND_CENTER.md
ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md
ANAHEIM_NATIVE_VENUE_OBJECT_GRAMMAR_SPEC.md
ANAHEIM_VENUE_OBJECT_GRAMMAR_RESEARCH.md
apps-sdk-notes.md
APPS_SDK_MCP_SPEC.md
ASSET_PACK_SPEC.md
ATLAS_BACKEND_PRODUCT_TASTE_RESEARCH.md
ATLAS_BACKEND_SERVICE_BRIEF.md
ATLAS_BACKEND_SERVICE_MAP.md
ATLAS_CHATGPT_APP_QUALITY_ROADMAP.md
ATLAS_CHATGPT_USE_CASE.md
ATLAS_ENGINE_BACKEND_OPERATING_BRIEF.md
ATLAS_FRONTEND_BACKEND_SCREEN_PLAN.md
ATLAS_FULL_PROJECT_LOOP_SPEC.md
ATLAS_FULL_STACK_PRODUCT_SPEC.md
ATLAS_LIVING_ATLAS_ENCYCLOPEDIA_PRD.md
ATLAS_MASTER_SPEC.md
ATLAS_PRODUCT_BACKEND_UML_SPEC.md
ATLAS_REAL_CONSUMER_APP_ROADMAP.md
AXIOM_BIG4_ARTIFACT_DISPATCH.md
AXIOM_BIG4_WAKEUP_PROTOCOL.md
AXIOM_ENGINE_REFERENCE_STACK.md
BACKEND_UML.md
BETA_HOSTED_CLAWD_SPEC.md
BIG4_ARTIFACT_OPERATING_MODEL.md
BUILD_LOG.md
CAMPAIGN_ENGINE_SPEC.md
CHATGPT_ENTRY_SURFACE_PROOF.md
CTO_ROADMAP.md
DATABASE_SCHEMA_BETA.md
DATA_PACK_SPEC.md
DECISIONS.md
ENGINEERING_ROUTE.md
ENGINE_TODO.md
EXTERNAL_VOXEL_REFERENCE_ADAPTER.md
F2_CLEAN_ALPHA_RC_SPLIT.md
GAMEBLOCKS_ATLAS_ADAPTER.md
GOOGLE_MAPS_ADAPTER_SPEC.md
HOSTED_CLAWD_APPROVAL_PACKET.md
HOSTED_CLAWD_ONBOARDING_SPEC.md
HOSTED_CLAWD_PRD.md
HOSTED_CLAWD_STORAGE_AUTH_DECISION_PACKET.md
HOSTED_CLAWD_STUB_AUDIT_0.64H.md
INTEGRATION_QA_PLAYBOOK.md
NATIONAL_ENGINE_PRODUCTION_CONTRACT.md
NEXT_QUESTS.md
NORTH_STARS.md
OPEN_SOURCE_REPOS.md
PHASE_PLAN.md
PRICING_MODEL.md
PRODUCTION_EVOLUTION_GATES.md
PRODUCT_NORTH_STAR.md
PRODUCT_SPEC_AND_GATES.md
PROJECT_LOOP.md
RAILWAY_DEPLOY.md
REDIS_SCENE_PACKET_BACKEND_0.72B.md
REVIEW_READINESS.md
SAFETY_RULES.md
SCENE_PACKET_DB_PERSISTENCE_PLAN.md
SCENE_PACKET_SERVICE_BOUNDARY_0.71H.md
SCOUT_DROP_SPEC.md
SECOND_DISTRICT_PROMOTION_GATE.md
SECOND_DISTRICT_VISUAL_ACCEPTANCE_BAR.md
SECOND_DISTRICT_VISUAL_PACKET_TEMPLATE.md
SECOND_DISTRICT_VOXEL_GRAMMAR_PACKET.md
SERVICES_AND_MODULES.md
SERVICE_STACK.md
SESSION_HANDOFF_2026-07-07.md
SHIP_READINESS.md
STARTER_SANDBOX.md
STRIPE_BILLING_PLAN.md
SUBMISSION_CHECKLIST.md
TOOL_CONTRACTS.md
USA_ENGINE_ARCHITECTURE.md
USA_PUBLIC_RELEASE_ENGINE_PLAN.md
V1_PRODUCTION_BACKLOG.md
VOXEL_ENGINE_DELIVERY_ARCHITECTURE_0.70H.md
VOXEL_MAP_SPEC.md
VOXEL_RENDERER_SPEC.md
VOXEL_WORLD_BRAIN.md
e2-shots
e3-shots
e5-shots
e6-shots
tail-shots
CODEX_RESULT_E1.md
CODEX_RESULT_E2.md
CODEX_RESULT_E2C.md
CODEX_RESULT_E3E4.md
CODEX_RESULT_E5.md
CODEX_RESULT_E6E7.md
CODEX_RESULT_TAIL.md
curated-compile-baseline.txt

 succeeded in 1564ms:

> C:\Users\mzwin\.codex\memories\MEMORY.md:41:- 
rollout_summaries/2026-07-10T00-59-14-fkXW-atlas_light_wakeup_0_76_3_reconciles_stale_rc_tree_and_split.md 
(cwd=\\?\C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc, rollout_path=C:\Users\mzwin\.codex\sessions\2026\07\09\rollout
-2026-07-09T17-59-18-019f4989-2b3e-77a3-831c-971ba3278aec.jsonl, updated_at=2026-07-10T01:01:14+00:00, 
thread_id=019f4989-2b3e-77a3-831c-971ba3278aec, companion wakeup naming `0.76 integration normalization` as the next 
clean artifact)
  C:\Users\mzwin\.codex\memories\MEMORY.md:42:- 
rollout_summaries/2026-07-10T00-59-12-F5iO-atlas_full_power_stale_rc_recovery_split_guard_sync_and_terr.md 
(cwd=\\?\C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc, rollout_path=C:\Users\mzwin\.codex\sessions\2026\07\09\rollout
-2026-07-09T17-59-14-019f4989-235d-76a3-8ef9-ca4e40e0a5ea.jsonl, updated_at=2026-07-10T01:14:27+00:00, 
thread_id=019f4989-235d-76a3-8ef9-ca4e40e0a5ea, freshest `national-generation-contract` repair plus `0.76-4 Terrain 
features` packet prep)
  C:\Users\mzwin\.codex\memories\MEMORY.md:43:- 
rollout_summaries/2026-07-09T03-32-46-kYx1-atlas_split_guard_restored_l2_ready.md 
(cwd=\\?\C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc, rollout_path=C:\Users\mzwin\.codex\sessions\2026\07\08\rollout
-2026-07-08T20-32-47-019f44ef-62bb-7c52-ad04-bd7b6595377f.jsonl, updated_at=2026-07-09T03:38:56+00:00, 
thread_id=019f44ef-62bb-7c52-ad04-bd7b6595377f, `national-generation-contract` allowlist refresh to green)
> C:\Users\mzwin\.codex\memories\MEMORY.md:49:- national-generation-contract, engine-beta-data, 
verify-alpha-rc-split.mjs, verify-atlas-loop-readiness.mjs, verify-big4-artifact-packets.mjs, 
verify-second-district-readiness.mjs, verify-atlas-source-of-truth-drift.mjs, verify-provider-boundaries.mjs, 
verify-tool-result-shape.mjs, verify-archetype-identity-sweep.mjs, docs/0.75R_HANDOFF.md, artifacts/0.75s-ship-passes, 
docs/design/clay-board, scripts/capture-ship-pass-evidence.mjs, loop-run-log.md, 
docs/codex/packet-0.76-2-landmarks.md, docs/codex/packet-0.76-4-terrain.md, 0.76 integration normalization, 
L0_BLOCKED, L2_ASSISTED
  C:\Users\mzwin\.codex\memories\MEMORY.md:50:
  C:\Users\mzwin\.codex\memories\MEMORY.md:51:## User preferences
> C:\Users\mzwin\.codex\memories\MEMORY.md:56:- when the user asks for `Verdict / Worker thread state read / 
Artifact-verifier state / Priority call / Risks / Next exact action` or the full-power `Captain verdict / Worker 
reports read / Crew assignments sent / Local Axiom work completed / Verification run / Current blockers / Next exact 
slice / Parked scope` shape -> keep that exact memo contract rather than freeform notes [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:57:- when the user says "Do not spawn local Mira, Forge, or Lumen clones. 
Read and message the real threads." -> probe the real bridge early, but if it is absent explicitly mark worker state 
unavailable instead of inventing handoffs [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:58:
> C:\Users\mzwin\.codex\memories\MEMORY.md:63:- The current verified loop line is `0.72B Redis Scene Packet Cache / 
Job Spine`; `LOOP.md` / `STATE.md` still name `0.72H Fable Generated Draft Visual Quality Gate` as the next 
recommended quest, while fresher packet docs/BUILD_LOG entries advanced the branch through `0.76-P Parameter Model 
Spine`, `0.76-2 Region-aware landmarks`, `0.76-3 Massing & Zone Variants`, and then `0.76-4 Terrain features` [Task 
1][Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:64:- The newest blocked light wakeups clarified the mixed-era drift 
pattern: `BUILD_LOG.md`, `docs/NEXT_QUESTS.md`, HEAD, and `artifacts/0.76-3-massing/CODEX_RESULT.md` already show 
`0.76-3` complete and `0.76-4` next, while `STATE.md`, `artifacts/current-update.json`, and parts of `LOOP.md` / 
`docs/ATLAS_FULL_PROJECT_LOOP_SPEC.md` still foreground older `0.72B` or `fable/0.51e-voxel-art` state [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:65:- Thread-tool evidence is session-variant: one wakeup exposed 
`codex_app.read_thread` and thread IDs, another surfaced the tool names without preserving returned turns, and later 
full-power wakeups had no `read_thread` / `send_message_to_thread` handler at all. Treat "tool visible" and "worker 
state actually read" as separate facts [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:66:- The stable fallback when the bridge is absent is local 
docs/artifacts/verifiers only; report worker acceptance unavailable, do not claim crew assignments, and refresh the 
best local integration artifact instead [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:67:- The real worker thread IDs named in this Atlas era remain Forge 
`019f1be1-9914-7aa2-94b1-c5e920dadec1`, Lumen `019f1a00-39c1-7330-a256-79564ba0cdb1`, and Mira 
`019f1a01-72d8-7122-9087-c071313f4ee3` [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:68:- Current split-safety truth is `national-generation-contract`, not the 
older `engine-beta-data` default. The selected-RC evidence set now includes `artifacts/0.75s-ship-passes/*`, 
`docs/design/clay-board/*`, `docs/0.75R_HANDOFF.md`, `scripts/capture-ship-pass-evidence.mjs`, `loop-run-log.md`, and 
`docs/codex/packet-0.76-*` [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:69:- `node scripts\verify-atlas-loop-readiness.mjs --json-only`, `node 
scripts\verify-big4-artifact-packets.mjs --json-only`, and `node scripts\verify-atlas-source-of-truth-drift.mjs 
--json-only` are the compact local truth checks for this era; after the guard repair they returned `L2_ASSISTED`, 
packet-verifier green, and zero source-of-truth drift blockers [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:70:- When `verify-atlas-loop-readiness.mjs --json-only` falls back to 
`L0_BLOCKED` in the `0.76` lane, the highest-value next artifact is a small `0.76 integration normalization` packet 
that classifies or parks the lingering `0.75R` / `0.75S` / clay-board evidence paths and aligns loop docs to `0.76-3 
complete / 0.76-4 next` before new build work [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:71:- `docs/codex/packet-0.76-4-terrain.md` is the bounded next Lumen packet 
when the bridge returns; it keeps work inside existing terrain grammar and explicitly blocks renderer seams, new 
dependencies, persistence, money, new MCP tools, and public Anaheim/Ontario promotion [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:72:- Related skill: skills/atlas-captain-wakeup/SKILL.md
> C:\Users\mzwin\.codex\memories\MEMORY.md:80:- Symptom: the live repo looks green in `0.76-3` artifacts and 
`NEXT_QUESTS`, but `STATE.md`, `current-update.json`, or `LOOP.md` still point at older loop state -> cause: 
source-of-truth drift between packet/build evidence and lagging loop docs -> fix: trust `BUILD_LOG.md` + 
`docs/NEXT_QUESTS.md` + HEAD for the live implementation lane, then normalize the stale loop docs as a release-hygiene 
packet [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:81:- Symptom: `BUILD_LOG.md` tail or a stale `LOOP.md` branch label points 
at older history -> cause: those files can lag newer canonical-state docs after reorgs -> fix: cross-check `STATE.md`, 
`docs/NEXT_QUESTS.md`, worktree list, and current verifier output before making the priority call [Task 1][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:82:
> C:\Users\mzwin\.codex\memories\MEMORY.md:106:- go for it do it all, Access is denied, Requested registry access is 
not allowed, Disable-NetFirewallRule, Restart-Service postgresql-x64-18, listen_addresses = 'localhost', 
fAllowToGetHelp = 0, Secure Preferences, EdgeExtensionsRemoved, SecurityHardening-20260708-204407
  C:\Users\mzwin\.codex\memories\MEMORY.md:107:
  C:\Users\mzwin\.codex\memories\MEMORY.md:108:## User preferences
> C:\Users\mzwin\.codex\memories\MEMORY.md:110:- when the user asks to "look through my comptuer find any 
issues/viruses/ways that i have been comrpomised on this system" -> start with evidence-based host triage, not generic 
security advice [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:111:- when the user says "STOP GUESSING" or asks for CSO-style review -> 
keep claims tied to Defender logs, persistence points, scans, and current local state [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:112:- when the user says "go for it do it all" after triage -> proceed into 
bounded local hardening instead of stopping at advice, but keep the reporting evidence-based [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:117:- The high-signal first pass on this machine is targeted: Defender 
status/history, persistence points, live listeners/processes, startup entries, browser extensions, PowerShell history, 
and recent downloads. Broad whole-profile recursive scans are noisy and slow here [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:118:- At triage time, Defender real-time protection and tamper protection 
were on, current `Get-MpThreat*` was empty, and the most important historical evidence was prior remediated detections 
for `Trojan:BAT/LummaStealer.A` on `2026-06-02` and `Trojan:Win32/ClickFix.*` on `2026-06-02` and `2026-06-14` [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:119:- The suspicious persistence artifact was Run key `Superior` pointing 
at `C:\Users\mzwin\AppData\Local\Temp\SuperiorSmokeInstall\market-data-recorder-app.exe`; it was unsigned, installed 
from Temp, and worth scanning/removing, but later targeted Defender scans were clean [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:120:- Before hardening, `postgresql.conf` had `listen_addresses = '*'` 
while `pg_hba.conf` still allowed localhost only, Remote Assistance was enabled even though RDP was off, and Edge had 
a large high-permission extension surface [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:121:- The definitive hardening backup is 
`C:\Users\mzwin\SecurityHardening-20260708-204407`, containing `EdgeExtensionsRemoved` and `postgresql.conf.before` 
for rollback/reference [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:157:## Task 3: A10 isolated smoke-user routing started, but remained 
incomplete
  C:\Users\mzwin\.codex\memories\MEMORY.md:158:
  C:\Users\mzwin\.codex\memories\MEMORY.md:159:### rollout_summary_files
> C:\Users\mzwin\.codex\memories\MEMORY.md:232:- when the workflow involved writing a dated memo and refreshing 
automation memory -> leave behind a durable artifact and a cumulative memory delta, not just chat notes [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:233:- repeated repo research reinforced "truthfulness more than breadth" 
and a trust-first ladder -> future product ideas should optimize learn/shadow/arm/auto, not widen into a broad 
dashboard [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:234:- when the user said "be a product manager is there any hope for this 
project" -> answer as a PM viability call, not as an engineering plan [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:253:- The automation memory now contains both the viability call and the 
game-pivot decision, so future product work should start from the updated framing instead of re-litigating real-money 
as the default [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:254:- On this Windows setup, direct gstack browse usage may still need 
`BROWSE_SERVER_SCRIPT=C:\Users\mzwin\.codex\skills\gstack\browse\dist\server-node.mjs` before invoking `browse.exe` 
[Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:255:- Related skill: skills/kjh-product-research-pass/SKILL.md
> C:\Users\mzwin\.codex\memories\MEMORY.md:262:- Symptom: browse attempts become stateful, parallel, or timeout-prone 
-> cause: too many page loads or retries share one unstable browse lane -> fix: restart/retry and browse one source at 
a time, treating cleanly loaded official pages as fresher than timed-out or `502` pages [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:263:- Symptom: a `kjh` pass reads like fresh validation of implementation 
progress -> cause: the run only produced memo/memory changes and no product code/tests -> fix: state explicitly when 
no code changed and no tests ran so future implementation work does not inherit false confidence [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:264:- Symptom: future agents overstate certainty from the standing 
directive alone -> cause: request-only rollouts contain no validated research output -> fix: treat those entries as 
goal/context only and do not infer a new product direction without actual repo/external research evidence [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:301:- `git worktree list` was the anchor truth source for this repo family: 
root on `codex/e6-apps-sdk-readiness`, clean Fable worktree on `fable/0.51e-voxel-art`, dirty/staged f2/g3/g4 
worktrees, and clean g5 on `codex/g5-road-lot-terrain-contact` [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:302:- The draft plan's g4 path was stale; the inspected worktree was 
`C:\Users\mzwin\Documents\Atlas-g4-reference-assets`, and its new spec-kit files were present in the worktree but not 
yet in the branch ref until a checkpoint commit [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:303:- `origin` existed but `git ls-remote --heads origin` only exposed 
`refs/heads/codex/engine-beta-cleanup`; future backup/collapse plans should verify remote head reality instead of 
assuming every local branch already exists upstream [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:338:- atlas-captain-light-reorg-wakeup, LIGHT captain wakeup, read-only, 
current state, next exact artifact, blocked lanes, anti-scope, Worker thread state read, Artifact-verifier state, Next 
exact action, read_thread, codex_app.read_thread, turnLimit, includeOutputs, No handler registered for tool: 
read_thread, verify-atlas-loop-readiness.mjs, verify-submission.mjs, verify-engine-beta-coverage.mjs, 
verify-alpha-rc-split.mjs, loop-constraints.md, docs/DECISIONS.md, docs/PRODUCT_SPEC_AND_GATES.md, 
docs/NEXT_QUESTS.md, docs/SUBMISSION_CHECKLIST.md, docs/BUILD_LOG.md, chatgpt-app-submission.json, 
current-update.json, owner_gate_review, REQUEST_OWNER_REVIEW, HIDDEN_DRAFT_ONLY, BLOCK_PROMOTION, 0.38E, 0.39E, 0.45E, 
0.50P, L2_ASSISTED
  C:\Users\mzwin\.codex\memories\MEMORY.md:339:
  C:\Users\mzwin\.codex\memories\MEMORY.md:340:## Task 2: Full-power Atlas wakeup used Echo-only local comms and 
real-thread delegation
> C:\Users\mzwin\.codex\memories\MEMORY.md:347:- 
rollout_summaries/2026-07-02T19-31-05-WWWF-atlas_full_power_wakeup_engine_beta_recon.md 
(cwd=C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc, rollout_path=C:\Users\mzwin\.codex\sessions\2026\07\02\rollout-202
6-07-02T12-31-10-019f2450-3b9d-7ec1-b4b5-a34217bc92ed.jsonl, updated_at=2026-07-02T19:31:44+00:00, 
thread_id=019f2450-3b9d-7ec1-b4b5-a34217bc92ed, mixed-tree reconnaissance with partial worker-read evidence)
  C:\Users\mzwin\.codex\memories\MEMORY.md:348:- 
rollout_summaries/2026-07-01T16-07-25-ragV-atlas_full_power_wakeup_mixed_tree_split_and_thread_routing.md 
(cwd=C:\Users\mzwin\Documents\Atlas, rollout_path=C:\Users\mzwin\.codex\sessions\2026\07\01\rollout-2026-07-01T09-07-30
-019f1e6f-66b4-7320-b119-d3e7c931b8a9.jsonl, updated_at=2026-07-01T16:11:10+00:00, 
thread_id=019f1e6f-66b4-7320-b119-d3e7c931b8a9, plan-first full-power coordination pattern)
  C:\Users\mzwin\.codex\memories\MEMORY.md:349:
> C:\Users\mzwin\.codex\memories\MEMORY.md:352:- Axiom, Echo, Mira, Forge, Lumen, COMMUNICATIONS_HUB, COMMS_MATRIX, 
real Codex threads, read_thread, send_message_to_thread, codex_app, plan-first, worker prompt, role objective allowed 
files anti-scope verification report format, do not spawn local Mira Forge Lumen clones, AXIOM_BIG4_WAKEUP_PROTOCOL, 
AXIOM_BIG4_ARTIFACT_DISPATCH, Captain verdict, Worker reports read, thread bridge unavailable fallback, 0.23E Hidden 
Venue Authorship Pass
  C:\Users\mzwin\.codex\memories\MEMORY.md:353:
  C:\Users\mzwin\.codex\memories\MEMORY.md:354:## Task 3: RC source-of-truth drift changed the next captain move from 
worker build work to Axiom normalization
> C:\Users\mzwin\.codex\memories\MEMORY.md:381:- 0.72B Redis Scene Packet Cache / Job Spine, 0.72H Fable Generated 
Draft Visual Quality Gate, 0.76-P Parameter Model Spine, 0.76-2 Region-aware landmarks, 0.76-3 Massing & zone 
variants, 0.76-4 Terrain features, national-generation-contract, 0.76 integration normalization, Captain verdict, Crew 
assignments sent, worker acceptance unavailable, docs/codex/packet-0.76-4-terrain.md, docs/DECISIONS.md missing 0.76-3
  C:\Users\mzwin\.codex\memories\MEMORY.md:382:
  C:\Users\mzwin\.codex\memories\MEMORY.md:383:## User preferences
> C:\Users\mzwin\.codex\memories\MEMORY.md:389:- when the user requests headings like "Verdict / What changed since 
last wakeup / Priority call / Risks / Recommended next action / Optional worker ping prompt" or later "Verdict / 
Worker thread state read / Artifact-verifier state / Priority call / Risks / Next exact action" -> preserve the exact 
concise memo shape requested in that wakeup instead of freeform notes [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:390:- when the user allows only "at most 1-2 captains/managers" or "at most 
one real captain thread" and prefers the agent to do the thinking -> recommend a single narrow worker ping when 
needed, not a broad coordinator burst [Task 1][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:391:- when the user said "Do not reopen Hosted Clawd, persistence, DB, 
Stripe, XP, evidence, OAuth, automation product features, reports, exports, or paid scope unless the human explicitly 
reopens them" -> keep those lanes parked during wakeups even if the repo still contains older owner-gate or 
support-scope docs [Task 1][Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:395:- when the user says "Do not miss real-thread handoffs" and "Never skip 
finished worker reports" -> distinguish direct worker acceptance from local fallback artifacts and do not invent 
worker state when bridge tools are unavailable [Task 1][Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:396:- when the user asks for "current state, next exact artifact, blocked 
lanes, and anti-scope" -> surface the exact stale file or normalization target rather than a generic status memo [Task 
1][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:397:- when the user asks to identify whether the next best move is Forge, 
Lumen, Mira, or Axiom integration -> end the wakeup with one explicit lane call, not a blended status report [Task 4]
  C:\Users\mzwin\.codex\memories\MEMORY.md:398:- when the user asks for a full-power memo with `Captain verdict / 
Worker reports read / Crew assignments sent / Local Axiom work completed / Verification run / Current blockers / Next 
exact slice / Parked scope` -> preserve that exact structure and keep the next slice concrete even if the bridge is 
missing [Task 4]
> C:\Users\mzwin\.codex\memories\MEMORY.md:403:- The recurring light-wakeup drift checklist is explicit: visual 
tunnel, Clawd/persistence pull, mixed-tree risk, stale docs, vague worker ownership, and production-readiness gaps 
[Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:404:- Current light-wakeup reconciliation in `Atlas-alpha-path-b-rc` should 
also read `artifacts/current-update.json`, `docs/CHATGPT_ENTRY_SURFACE_PROOF.md`, 
`docs/SECOND_DISTRICT_VOXEL_GRAMMAR_PACKET.md`, and `docs/SECOND_DISTRICT_PROMOTION_GATE.md` when the question is 
public-vs-hidden district state rather than only split safety [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:405:- The loop-style RC wakeups added a sharper read order for 
`C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc`: automation memory, `AGENTS.md`, `LOOP.md`, `STATE.md`, 
`loop-constraints.md`, `docs/ATLAS_FULL_PROJECT_LOOP_SPEC.md`, `docs/NEXT_QUESTS.md`, `docs/BUILD_LOG.md`, and then 
`docs/DECISIONS.md` plus `docs/PRODUCT_SPEC_AND_GATES.md` when the question is active-track truth rather than just 
readiness [Task 1][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:406:- When a light wakeup also asks for real worker state, the productive 
order is: do the fixed loop/doc read first, then probe `codex_app.read_thread` with a small `turnLimit` before the 
final memo/verifier conclusion so late thread-tool discovery does not leave handoffs unread [Task 1][Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:407:- The latest light-wakeup truth is: `docs/NEXT_QUESTS.md` and 
`docs/PRODUCT_SPEC_AND_GATES.md` describe the live product-submission path, while `artifacts/current-update.json` 
intentionally remains parked at `0.45E` owner-gate evidence; treat that split as expected until docs/state 
normalization explicitly changes it [Task 1][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:408:- The latest submission-track wakeup added a stronger code-side-green 
read: `node scripts\verify-atlas-loop-readiness.mjs --json-only` returned `ok=true` and `readinessLevel=L2_ASSISTED`, 
`node scripts\verify-submission.mjs` passed against `http://127.0.0.1:8787/mcp` with seven tools, `node 
scripts\verify-engine-beta-coverage.mjs` passed locally, and `node scripts\verify-alpha-rc-split.mjs --working-tree 
--strict-selected-rc --rc-mode engine-beta-data --json-only` returned zero blockers [Task 1][Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:409:- The next exact artifact after those green local checks is `0.50P 
Submission Asset/Directory Finalization`: settle the directory/app name, audit listing copy for demo-perception risk, 
host privacy/terms/support URLs, export icon PNGs if needed, and curate screenshots [Task 1][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:410:- `docs/SUBMISSION_CHECKLIST.md` and `chatgpt-app-submission.json` 
already hold the strongest remaining submission truth: code-side verification can be green while human 
directory/account chores, app-name genericness, and demo/trial perception risk remain open [Task 1][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:411:- Full-power wakeups add `docs/COMMUNICATIONS_HUB.md`, 
`docs/brain/COMMS_MATRIX.md`, and `docs/TOOL_CONTRACTS.md`, then coordinate through Axiom plus Echo locally and 
Mira/Forge/Lumen through real thread IDs [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:415:- Atlas full-power priority order in this cycle was: clean functional 
release-candidate split, local/public verification alignment, human readiness packet, backend/storage only if it 
protects readiness, visual work only if functional readiness is green; later RC light-wakeup evidence showed the 
owner-gate ladder was parked and the active product-submission track had moved to `0.47P`-`0.50P`, so future captain 
work should reconcile source-of-truth drift before assigning new worker build work [Task 2][Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:416:- When thread-read tools are missing in a full-power wakeup, the 
fallback is to refresh a local integration artifact and mark worker acceptance as unavailable, not to fabricate 
Mira/Forge/Lumen state [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:417:- `verify-big4-artifact-packets.mjs --json-only` and 
`verify-second-district-readiness.mjs --district anaheim-candidate --json-only` became the local fallback truth checks 
for current Atlas wakeups; the refreshed export path is `artifacts/second-district-readiness/latest/anaheim-candidate` 
and its verdict remains `readyForPlayablePromotion: false` [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:418:- `node scripts\verify-atlas-loop-readiness.mjs --json-only` is the 
fast sanity check for loop-style RC wakeups; when it reports `ok=true` plus a stale expected current update, treat 
that as verifier/doc drift to reconcile rather than as a readiness blocker [Task 1][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:419:- The latest RC evidence says `docs/NEXT_QUESTS.md`, 
`docs/DECISIONS.md`, and `docs/PRODUCT_SPEC_AND_GATES.md` are the active-track truth sources together: the owner-gate 
/ second-district ceremony is parked, `current-update.json` can stay as parked evidence, and the live 
product-submission slices run through `0.50P Submission Asset/Directory Finalization` [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:425:- `docs/BUILD_LOG.md` Entry 219, `docs/NEXT_QUESTS.md`, and 
`artifacts/0.76-3-massing/CODEX_RESULT.md` are stronger evidence of the live lane than stale `STATE.md`, 
`artifacts/current-update.json`, or `LOOP.md` when the latter still foreground `0.72B` / `fable/0.51e-voxel-art` [Task 
4]
  C:\Users\mzwin\.codex\memories\MEMORY.md:426:- `docs/DECISIONS.md` may lag the packet/build state in this era: the 
July 10 light wakeup found no visible `0.76-3` decision entry even though `BUILD_LOG` and `NEXT_QUESTS` had already 
advanced [Task 4]
> C:\Users\mzwin\.codex\memories\MEMORY.md:427:- `docs/codex/packet-0.76-4-terrain.md` is the current bounded fallback 
artifact when the bridge is unavailable and the next owner move still needs to be made concretely [Task 4]
  C:\Users\mzwin\.codex\memories\MEMORY.md:428:- Related skill: skills/atlas-captain-wakeup/SKILL.md
  C:\Users\mzwin\.codex\memories\MEMORY.md:429:
> C:\Users\mzwin\.codex\memories\MEMORY.md:435:- Symptom: thread-reader metadata is visible but the actual read still 
fails with `No handler registered for tool: read_thread` -> cause: the bridge surface is partially exposed but the 
handler is not actually wired in the current session -> fix: report the limitation explicitly and rely on local docs, 
artifacts, and verifiers only [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:436:- Symptom: wakeup conclusions follow `current-update.json` or an older 
verifier expectation into the wrong lane -> cause: parked owner-gate state drifted away from the active 
product-submission track -> fix: compare `docs/DECISIONS.md` and `docs/PRODUCT_SPEC_AND_GATES.md` against `AGENTS.md`, 
`STATE.md`, `docs/NEXT_QUESTS.md`, and verifier expectations before routing work [Task 1][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:437:- Symptom: `verify-atlas-loop-readiness.mjs` warns that the expected 
current update is `0.33E` while the parked evidence says `0.45E` -> cause: the verifier and loop docs lag the active 
submission track -> fix: treat the warning as stale operating-state drift, not as a blocker against the current 
`0.50P` submission lane [Task 1][Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:444:- Symptom: a captain wakeup sees `0.76-3` complete but still cannot 
clear readiness -> cause: the remaining blocker is release-hygiene drift (`docs/0.75R_HANDOFF.md`, 
`artifacts/0.75s-ship-passes/*`, `docs/design/clay-board/*.png`, `scripts/capture-ship-pass-evidence.mjs`) or stale 
loop docs, not new implementation work -> fix: name Axiom integration / normalization as the priority call and keep 
other lanes blocked until the envelope and docs are reconciled [Task 4]
  C:\Users\mzwin\.codex\memories\MEMORY.md:445:
  C:\Users\mzwin\.codex\memories\MEMORY.md:446:# Task Group: Atlas engine-beta diagnostics and engine/backend 
coordination
> C:\Users\mzwin\.codex\memories\MEMORY.md:449:applies_to: cwd=C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc; 
reuse_rule=Safe for Atlas engine-beta work in this RC checkout family when the task is core voxel diagnostics, 
engine/backend organization, or diagnostic-slice scope control. Re-check exact metrics and touched-path envelopes 
against the live quest and worktree.
  C:\Users\mzwin\.codex\memories\MEMORY.md:450:
  C:\Users\mzwin\.codex\memories\MEMORY.md:451:## Task 1: Derived terrain map engine proof and mobile occlusion 
diagnostics landed as executable Atlas-owned contracts
> C:\Users\mzwin\.codex\memories\MEMORY.md:469:- ATLAS_ENGINE_BACKEND_OPERATING_BRIEF.md, source-to-scene engine, 
provider boundary, Forge Backend Manager Responsibilities, Near-Term Engine Ladder, Axiom Daily Command Set, 
county-to-scene engine, binary SAFE/BLOCKED, packages/core/src/voxel, packages/core/src/world, packages/geo/src, 
server/src/index.ts
  C:\Users\mzwin\.codex\memories\MEMORY.md:470:
  C:\Users\mzwin\.codex\memories\MEMORY.md:471:## User preferences
> C:\Users\mzwin\.codex\memories\MEMORY.md:473:- when the user wanted a "real code artifact" rather than a docs-only 
research note -> default to an executable core contract plus verifier when an Atlas engine idea is reusable enough to 
test [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:474:- when the user kept Atlas map-first and pushed back on overfocusing on 
one city -> use Eastvale Core, Angel Stadium, and other locations as stress cells for reusable contracts, not 
destination-product polish [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:475:- when the user told Forge to be "the glue" and "help axiom organize 
this making a engine from scracth" -> future Forge-style output should explain the real engine/backend stack and 
touched boundaries, not generic strategy prose [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:480:- Atlas-owned engine proof contracts from this lane are 
`deriveCityWorldTerrainMap(scene)` and `deriveCityWorldMobileOcclusion(scene, cameraPresetId)`, both derived from 
`CityWorldScene` rather than from an external voxel runtime dependency [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:481:- The useful VoxelSpace lesson for Atlas was adapted as derived 
height/color maps and occlusion budgets, not as a terrain-only renderer or runtime dependency; Riverside's calibrated 
proof metrics included `heightRange: 3.05`, `nonFlatCellRatio: 0.83`, `occupiedCellRatio: 0.437`, `colorKeyCount: 26`, 
and `waterEdgeCutRatio: 0.608` [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:482:- Mobile occlusion is measured separately for `mobile` and 
`residential_detail`; engine-beta slices should prefer named metrics plus verifiers over broad art or screenshot-only 
changes [Task 1][Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:483:- The durable Atlas stack map from Forge is: identity/source data -> 
provider policy -> readiness contracts -> compiler -> diagnostics -> renderer -> Apps SDK -> release guard. Current 
engine truth lives primarily in `packages/core/src/voxel/*`, `packages/core/src/world/*`, `packages/geo/src/*`, 
`server/src/index.ts`, and the verifier scripts [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:484:- `docs/ATLAS_ENGINE_BACKEND_OPERATING_BRIEF.md` is the coordination 
doc for `provider boundary`, `Forge Backend Manager Responsibilities`, `Near-Term Engine Ladder`, and `Axiom Daily 
Command Set`; use it when the repo's phase language needs to be translated into an actual stack/decision ladder [Task 
2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:485:- Diagnostic-only 0.15E-style slices should stay inside the 
core/voxel/test/script/artifact/doc envelope and avoid server/provider route changes, world coverage expansion, 
package/env/migration churn, persistence/Hosted Clawd, public Anaheim/Ontario exposure, and renderer product chrome 
[Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:486:
  C:\Users\mzwin\.codex\memories\MEMORY.md:487:## Failures and how to do differently
> C:\Users\mzwin\.codex\memories\MEMORY.md:490:- Symptom: tests/scripts cannot import a new engine helper -> cause: 
the helper was added under `packages/core/src/voxel/*` but not re-exported through package roots -> fix: export it 
from both `packages/core/src/voxel/index.ts` and `packages/core/src/index.ts` before the first verifier run [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:491:- Symptom: TypeScript build breaks on optional properties or pin 
geometry -> cause: exact-optional-property handling and the actual scene pin shape were assumed incorrectly -> fix: 
omit optional fields unless present and use `pin.anchor` rather than a nonexistent `position` [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:492:- Symptom: engine references add noise instead of clarity -> cause: 
external books/examples were used as generic inspiration instead of being translated into Atlas-owned boundaries, 
metrics, and verifiers -> fix: convert the reference pressure into repo-specific stack language or drop it [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:493:- Symptom: a diagnostic slice quietly expands into 
provider/world/backend scope -> cause: SAFE/BLOCKED boundaries were not enforced path-by-path -> fix: keep the 
touched-path envelope explicit and reject any slice that leaves the core/voxel/test/script/artifact/doc lane [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:494:
  C:\Users\mzwin\.codex\memories\MEMORY.md:495:# Task Group: Atlas Hosted Clawd persistence gate
> C:\Users\mzwin\.codex\memories\MEMORY.md:538:- Atlas, Forge, boot audit, git status --short, git diff --stat, git 
diff --name-status, functional RC candidate, visual parked lane, Hosted Clawd parked lane, shared docs, 
must-not-stage, package.json, pnpm-lock.yaml, .env.example, server/src/index.ts
  C:\Users\mzwin\.codex\memories\MEMORY.md:539:
  C:\Users\mzwin\.codex\memories\MEMORY.md:540:## Task 2: Earlier engine-beta split verification moved from 
missing-guard drift to green strict-selected-rc readouts
> C:\Users\mzwin\.codex\memories\MEMORY.md:564:- verify-alpha-rc-split.mjs, strict-selected-rc, rc-mode 
national-generation-contract, docs/0.75R_HANDOFF.md, artifacts/0.75s-ship-passes, docs/design/clay-board, 
scripts/capture-ship-pass-evidence.mjs, loop-run-log.md, docs/codex/packet-0.76-2-landmarks.md, 
docs/codex/packet-0.76-4-terrain.md, blockerCount 0, unknown 0
  C:\Users\mzwin\.codex\memories\MEMORY.md:565:
  C:\Users\mzwin\.codex\memories\MEMORY.md:566:## User preferences
> C:\Users\mzwin\.codex\memories\MEMORY.md:575:- Boot-audit classification starts with `git status --short`, `git diff 
--stat`, and `git diff --name-status`, then treats mixed files like `package.json`, `pnpm-lock.yaml`, `.env.example`, 
and `server/src/index.ts` as decision files until Axiom explicitly picks a lane [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:576:- Earlier split verification in the old branch era used `node 
scripts\\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`; by 
2026-07-03 it passed with `fileCount: 143`, `blockerCount: 0`, and `unknown: 0` in the RC worktree [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:577:- `verify-cityworld-mobile-occlusion.mjs`, 
`verify-face-orientation-source-contrast.mjs`, and `verify-big4-artifact-packets.mjs` are the adjacent verifier set 
that helps explain whether the split is clean but the next quest is still blocked for product/visual reasons [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:578:- `docs/F2_CLEAN_ALPHA_RC_SPLIT.md` remains a routing doc for the split 
lane, but its commands should always be checked against the live `scripts/` directory before being treated as 
authoritative [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:579:- The missing-script wakeups remain useful as a failure shield: if the 
doc references `scripts/verify-alpha-rc-split.mjs` and the file is absent, treat that as a doc/tool drift problem 
instead of assuming the old split workflow still works [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:581:- The selected-RC evidence envelope for `national-generation-contract` 
now includes `docs/0.75R_HANDOFF.md`, `artifacts/0.75s-ship-passes/*`, `docs/design/clay-board/*`, 
`scripts/capture-ship-pass-evidence.mjs`, `loop-run-log.md`, and `docs/codex/packet-0.76-*` [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:582:- After the allowlist repair, the compact truth set was green together: 
strict split guard `blockerCount: 0`, `verify-atlas-loop-readiness.mjs --json-only` -> `L2_ASSISTED`, 
`verify-big4-artifact-packets.mjs --json-only` -> `ok:true`, and `verify-atlas-source-of-truth-drift.mjs --json-only` 
-> `blockerCount: 0` [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:583:- `artifacts/current-update.json` can remain parked at the older 
`0.72B` manifest while the newer packet docs move ahead; in this branch era that mismatch was accepted by the 
source-of-truth drift verifier and should not be “fixed” blindly [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:584:
  C:\Users\mzwin\.codex\memories\MEMORY.md:585:## Failures and how to do differently
> C:\Users\mzwin\.codex\memories\MEMORY.md:587:- Symptom: the tree contains visual, backend, docs, env, and package 
changes together -> cause: the workspace is mixed across lanes -> fix: classify first and do not infer a releasable 
packet from filenames alone [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:588:- Symptom: strict-selected-rc fails with many blockers or 
`strictUnexpectedPaths` -> cause: the allowlist is too narrow for the intended RC or the tree contains unrelated lane 
changes -> fix: tighten the slice or expand the allowlist only with explicit RC intent, not to make the failure 
disappear [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:589:- Symptom: a wakeup still routes through "missing split guard" advice 
after the script is back -> cause: stale memory or docs are being reused without checking `scripts/` -> fix: verify 
live script presence and replace stale blocker claims with current verifier output [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:591:- Symptom: `verify-atlas-loop-readiness.mjs --json-only` returns 
`L0_BLOCKED` because the nested split guard rejects current review-evidence paths -> cause: the selected-RC envelope 
is stale for the current branch era -> fix: inspect `strictUnexpectedPaths` and update the 
`national-generation-contract` allowlist for real release-hygiene evidence like `docs/0.75R_HANDOFF.md`, clay-board 
inputs, ship-pass artifacts, and `docs/codex/packet-0.76-*` [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:592:- Symptom: older `engine-beta-data` guidance still looks green but the 
current branch uses different review-evidence paths -> cause: the branch-era split mode changed -> fix: treat 
`engine-beta-data` as historical unless the live verifier run still targets it, and prefer 
`national-generation-contract` for the current packet lane [Task 2][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:593:
> C:\Users\mzwin\.codex\memories\MEMORY.md:596:scope: Narrow execution memory for Atlas visual-engine work in 
`C:\Users\mzwin\Documents\Atlas`, especially sprite-atlas readiness, real sprite proofs, production-intake gating, and 
follow-up docs/handoff artifacts.
  C:\Users\mzwin\.codex\memories\MEMORY.md:597:applies_to: cwd=C:\Users\mzwin\Documents\Atlas; reuse_rule=Safe for 
future Atlas city-world renderer/asset work while the repo remains a full-screen Pixi map product with the current 
atlas manifest/resolver path. Re-check exact commands, docs, and browser-smoke prerequisites if the build/tooling 
stack changes.
  C:\Users\mzwin\.codex\memories\MEMORY.md:598:
> C:\Users\mzwin\.codex\memories\MEMORY.md:617:- Atlas, E7.4, one real sprite proof, pin.sticker.favorite, Pixi 
Assets.load, SVG dataurl, CityWorldRenderer, atlas resolver, primitive fallback, verify:preview:http, 
ATLAS_EXECUTION_PROMPTS
  C:\Users\mzwin\.codex\memories\MEMORY.md:618:
  C:\Users\mzwin\.codex\memories\MEMORY.md:619:## Task 3: Three-asset production intake stayed docs-first and 
rowhome-gated
> C:\Users\mzwin\.codex\memories\MEMORY.md:631:- when preparing Atlas work, the user asked to "prepare yourself to 
work/make/devolp" from the Apps SDK docs/examples -> start with environment inspection plus official Apps 
SDK/docs/example review before editing [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:632:- when the user said "go for it" and "do what needs to be doen" after 
the planning pass -> treat the current Atlas lane as approved and execute the next implementation slice without 
another confirmation loop [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:633:- when the user framed the work as "one real sprite proof through the 
atlas resolver" -> keep the slice extremely narrow and production-first, not a broad art pipeline or map rewrite [Task 
2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:634:- when the user asked to be "set up with the best prompt" -> 
proactively leave a reusable prompt pack and explicit next-lane docs when a slice is likely to hand off to future 
agents [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:635:- when Atlas implementation is active, preserve "fallback-first" / 
"primitive fallback" behavior -> treat textures as optional upgrades on top of a working map-first renderer, not a 
brittle dependency [Task 1][Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:638:- when the user said "No E7.39 sprawl" -> keep the next visual move 
tightly bounded and rowhome-first instead of broad module expansion [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:639:
  C:\Users\mzwin\.codex\memories\MEMORY.md:640:## Reusable knowledge
> C:\Users\mzwin\.codex\memories\MEMORY.md:643:- The Apps SDK setup that mattered for this repo was 
`.../build/chatgpt-ui`, `.../quickstart`, `.../build/mcp-server`, plus a local clone of 
`openai/openai-apps-sdk-examples` into `.reference\openai-apps-sdk-examples` [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:644:- `packages/core/src/voxel/cityWorldAtlas.ts` is the typed atlas 
boundary: `CityWorldAtlasManifest`, palette/sprite/tile contracts, validation helpers, and scene-key checks live there 
[Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:645:- `packages/assets/city-world/atlas.manifest.json` is the durable asset 
lane; `web/src/cityWorldAtlasResolver.ts` and the widget mirror are the fallback-first bridge between scene keys and 
render behavior [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:646:- The current emitted scene-key families were concrete enough to 
validate against the manifest: `tile.*`, `road.*`, `lot.*`, `building.*`, `prop.*`, `actor.*`, and `pin.*` including 
`pin.sticker.favorite` [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:647:- The local proof stack that passed was `pnpm --dir packages/core 
typecheck`, `pnpm test:core`, `pnpm typecheck:starter`, `pnpm --dir apps/widget typecheck`, `pnpm build:web`, `pnpm 
--dir apps/widget build`, `pnpm build:server`, and a `/preview` smoke returning `hasCityWorldMarkup: true`; later E7.4 
also passed `pnpm verify:preview:http` [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:648:- `scripts/build-web.mjs` is the bundle choke point for widget asset 
loading; adding `.svg` as `dataurl` there let the inline ChatGPT widget ship a tiny real sprite without broadening 
resource domains [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:649:- For Pixi sprite proofs in this repo, load textures through 
`Assets.load` before asking the resolver for sprite mode; the stable contract is hybrid sprite mode for loaded assets 
plus primitive fallback for everything else [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:660:- Symptom: browser smoke fails before proving the visual change -> 
cause: local Playwright browser binaries are missing or Pixi textures were created synchronously -> fix: install the 
browser binaries before QA and use async `Assets.load` instead of synchronous texture creation [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:661:- Symptom: sprite work regresses adjacent HUD behavior -> cause: the 
narrow proof changed pin/note rendering without rechecking nearby interactions -> fix: re-run browser QA for canvas 
coverage, no old copy, sticker/note tray behavior, and console cleanliness around the changed surface [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:662:- Symptom: a proposed production spike mostly proves asset loading 
rather than map quality -> cause: the lab asset was not mapped to the production atlas/anchor/layer/fallback contract 
-> fix: write/update the intake spec first and reopen code only for a rowhome-only screenshot-gated spike [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:663:- Symptom: docs-only Atlas work gets reported as if it had browser 
proof -> cause: verification discipline drifted from the actual slice -> fix: for docs/spec-only work, verify with 
`git diff --check` and handoff artifacts only; do not invent browser/build validation [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:664:
> C:\Users\mzwin\.codex\memories\MEMORY.md:665:# Task Group: Atlas USA-scale map engine direction
  C:\Users\mzwin\.codex\memories\MEMORY.md:666:
> C:\Users\mzwin\.codex\memories\MEMORY.md:667:scope: Directional guardrails for Atlas V1 in 
`C:\Users\mzwin\Documents\Atlas`, especially scope control between the Eastvale proof slice, the full-screen map 
surface, the near-term voxel/atlas implementation lane, and the expectation that Atlas work should create executable 
product progress.
> C:\Users\mzwin\.codex\memories\MEMORY.md:668:applies_to: cwd=C:\Users\mzwin\Documents\Atlas; reuse_rule=Safe for 
future Atlas product/architecture work while the V1 target remains a USA-scale map engine with a map-first visual 
surface. Treat this block as extension-note guidance that should be rechecked if the product plan materially changes.
  C:\Users\mzwin\.codex\memories\MEMORY.md:669:
  C:\Users\mzwin\.codex\memories\MEMORY.md:670:## Task 1: Ad hoc Atlas note clarified that Eastvale is only the first 
playable proof
> C:\Users\mzwin\.codex\memories\MEMORY.md:690:## Task 3: Ad hoc Atlas note tightened focus on the voxel engine and 
visual map system
  C:\Users\mzwin\.codex\memories\MEMORY.md:691:
  C:\Users\mzwin\.codex\memories\MEMORY.md:692:### rollout_summary_files
> C:\Users\mzwin\.codex\memories\MEMORY.md:694:- extensions/ad_hoc/notes/20260630-133218-atlas-voxel-engine-focus.md 
(cwd=C:\Users\mzwin\Documents\Atlas, rollout_path=extensions/ad_hoc/notes/20260630-133218-atlas-voxel-engine-focus.md, 
updated_at=2026-06-30T13:32:18-07:00, thread_id=ad-hoc-note-atlas-voxel-engine-focus, authoritative extension note)
  C:\Users\mzwin\.codex\memories\MEMORY.md:695:
  C:\Users\mzwin\.codex\memories\MEMORY.md:696:### keywords
> C:\Users\mzwin\.codex\memories\MEMORY.md:698:- Atlas, voxel engine, tile grid quality, terrain, elevation, chunk 
system, 2:1 isometric sprites, renderer correctness, camera framing, atlas pipeline, approval screenshots
  C:\Users\mzwin\.codex\memories\MEMORY.md:699:
  C:\Users\mzwin\.codex\memories\MEMORY.md:700:## Task 4: Ad hoc Atlas note corrected Mira toward executable product 
work
> C:\Users\mzwin\.codex\memories\MEMORY.md:713:- when Atlas scope starts drifting, the user note says "Focus Atlas 
work tightly on the voxel engine and visual map system." -> keep sprint work on voxel tile/grid quality, 
terrain/elevation/chunks, renderer correctness, camera/framing, asset atlas quality, and approval screenshots before 
adjacent product systems [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:714:- when choosing Atlas implementation scope, the user note explicitly 
rules out "Clawd, persistence, Stripe, XP, evidence, onboarding, campaign loops, or broad product management" unless 
resumed later -> avoid broad product sprawl while this visual-engine lane is active [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:715:- when Atlas coordination is in scope, the user correction says Mira 
should not only "text or pressure Axiom" -> inspect the repo, make scoped product changes when in lane, or leave 
concrete repo artifacts/prompts that make the next slice executable [Task 4]
  C:\Users\mzwin\.codex\memories\MEMORY.md:716:- when Atlas work is blocked from coding the current slice, the user 
correction says "Communication is useful only when it creates executable work or a clear product gate" -> prefer 
actionable handoff docs, verifiers, and scoped prompts over passive approval reports [Task 4]
  C:\Users\mzwin\.codex\memories\MEMORY.md:717:- the user correction says to keep pushing Atlas toward a "high-quality 
ChatGPT app: map-first, user-visible, mobile-proof, screenshot-proven, and not generic dashboard/product slop" -> keep 
those quality gates explicit on future Atlas decisions [Task 4]
> C:\Users\mzwin\.codex\memories\MEMORY.md:728:- The next visual implementation lane after E8.4 review readiness is 
Sprite Atlas Readiness: add a typed `CityWorldAtlasManifest`, scene-key validation, 
`packages/assets/city-world/atlas.manifest.json`, renderer atlas resolvers for web/widget, primitive fallback for 
missing textures, and at least one visible quality improvement [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:729:- Atlas near-term quality work should bias toward voxel tile grid 
quality, terrain/elevation/chunk coherence, 2:1 isometric module sprites, renderer correctness, camera/framing, 
atlas/pipeline quality, and visual approval screenshots against voxel references [Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:730:- Atlas execution roles should either implement an in-lane slice 
directly or create repo artifacts that make the next slice executable; passive coordination without a product gate is 
specifically disfavored [Task 4]
> C:\Users\mzwin\.codex\memories\MEMORY.md:731:- The anti-scope remains explicit even after the operating correction: 
no persistence, Stripe, XP, evidence, OAuth, automation, reports, exports, fake county content, broad backend, or 
visual tunnel unless the user reopens them [Task 4]
  C:\Users\mzwin\.codex\memories\MEMORY.md:732:
  C:\Users\mzwin\.codex\memories\MEMORY.md:733:## Failures and how to do differently
> C:\Users\mzwin\.codex\memories\MEMORY.md:735:- Symptom: Atlas work starts optimizing an Eastvale-only demo or a 
generic dashboard shell -> cause: the initial playable slice was treated as the final product shape -> fix: keep the 
hierarchy USA-scale and preserve the map-first full-screen Pixi surface with only tiny HUD overlays [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:736:- Symptom: renderer and backend concerns blur together -> cause: raw 
provider payloads or credential-bearing logic leak into the client surface -> fix: keep adapters/caching/normalized 
identity server-side and pass only bounded `CityWorldScene` slices to the renderer [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:737:- Symptom: the sprint sprawls into 
persistence/auth/Stripe/XP/evidence/campaign loops or decorative feature objects -> cause: the active lane lost focus 
on the voxel engine and atlas system -> fix: keep work bounded to the visual map system unless the user explicitly 
resumes broader product scope [Task 2][Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:738:- Symptom: Atlas visual work adds cars, extra panels, copy, or 
decorative objects without improving core map quality -> cause: surface polish displaced engine/art-system correctness 
-> fix: prefer atlas readiness, renderer correctness, camera/framing, chunk/elevation coherence, and approval 
screenshots first [Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:739:- Symptom: an Atlas agent defaults to status reports or pressure 
messages instead of concrete work -> cause: the operative role correction was ignored -> fix: inspect the repo, 
implement a safe in-lane slice, or leave executable prompts/specs/verifiers tied to a clear product gate [Task 4]
  C:\Users\mzwin\.codex\memories\MEMORY.md:740:
> C:\Users\mzwin\.codex\memories\MEMORY.md:778:- The smoke script is high-value because it checks compact viewport 
behavior, tab order, labels, live regions, restart persistence, clear-data behavior, and long-content stability that 
ordinary build/test passes miss [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:779:- The stable product framing is reviewer-friendly and local-first: 
RELAY is a care-continuity desk where selected browser text becomes a source report, not a broad browser scraper or 
autonomous triage agent [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:780:
> C:\Users\mzwin\.codex\memories\MEMORY.md:818:scope: Run, summarize, or automate recurring ScriptLens canary 
workflows, including backend canary artifacts, staged-readiness status, recurring worker lanes, and Windows cleanup 
hardening in ai-script-detector worktrees.
  C:\Users\mzwin\.codex\memories\MEMORY.md:819:applies_to: 
cwd=C:\Users\mzwin\.codex\worktrees\*\Synergy\ai-script-detector; reuse_rule=Safe across ScriptLens ai-script-detector 
worktrees when the task is backend canary reporting or staging-readiness summary. Treat concrete counts and blocking 
verdicts as run-specific to the cited rollout files.
  C:\Users\mzwin\.codex\memories\MEMORY.md:820:
> C:\Users\mzwin\.codex\memories\MEMORY.md:825:- 
rollout_summaries/2026-06-14T17-46-37-Zn1l-scriptlens_backend_canary_windows_cleanup_and_staging_blocke.md 
(cwd=C:\Users\mzwin\.codex\worktrees\d5b0\Synergy\ai-script-detector, rollout_path=C:\Users\mzwin\.codex\sessions\2026\
06\14\rollout-2026-06-14T10-46-42-019ec73e-1efb-7623-87f0-c9c0bc781417.jsonl, updated_at=2026-06-14T18:08:08+00:00, 
thread_id=019ec73e-1efb-7623-87f0-c9c0bc781417, freshest partial canary result with wrapper-emitted report and blocked 
staged refresh)
  C:\Users\mzwin\.codex\memories\MEMORY.md:826:- 
rollout_summaries/2026-06-14T17-46-09-azsi-scriptlens_backend_canary_tooling_failures_and_staging_repor.md 
(cwd=C:\Users\mzwin\.codex\worktrees\835f\Synergy\ai-script-detector, rollout_path=C:\Users\mzwin\.codex\sessions\2026\
06\14\rollout-2026-06-14T10-46-14-019ec73d-b16b-7712-bf37-f9ec9178d466.jsonl, updated_at=2026-06-14T18:05:43+00:00, 
thread_id=019ec73d-b16b-7712-bf37-f9ec9178d466, toolchain recovery plus cleanup-race evidence before a trustworthy 
summary)
  C:\Users\mzwin\.codex\memories\MEMORY.md:827:
> C:\Users\mzwin\.codex\memories\MEMORY.md:879:- when the user said "Include the current staged canary markdown report 
path" -> always surface the current report artifact path explicitly, even if the staged refresh is blocked or stale 
[Task 1][Task 2][Task 3][Task 4]
> C:\Users\mzwin\.codex\memories\MEMORY.md:880:- when the user said "call out any regression that should block 
staging" -> end with an explicit staging-blocker verdict, and distinguish canary regressions from staging blockers 
when the run only partially completed [Task 1][Task 2][Task 3][Task 4]
  C:\Users\mzwin\.codex\memories\MEMORY.md:881:- when the user asked to be assigned as a "worker bot" that runs "every 
couple hours" and can "read/manage the threads" -> prefer a recurring, scheduler-friendly worker lane over one-off 
canary commands [Task 5]
> C:\Users\mzwin\.codex\memories\MEMORY.md:882:- when the user said "feel free to edit" the canary threads -> 
maintaining/updating durable thread artifacts is acceptable in this workflow [Task 5]
  C:\Users\mzwin\.codex\memories\MEMORY.md:883:
  C:\Users\mzwin\.codex\memories\MEMORY.md:884:## Reusable knowledge
> C:\Users\mzwin\.codex\memories\MEMORY.md:887:- `npm run qa:canary` maps to `node scripts/staged-consumer-qa.mjs 
--backend-only --canary-only --require-canary --report-json release/staged-canary-report.json --report-markdown 
release/staged-canary-report.md`; it is not usable without `SCRIPTLENS_BACKEND_ORIGIN`, and 
`release/staged-canary-report.md` is still the artifact path the user expects in summaries even when the file is stale 
[Task 1][Task 2][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:888:- Fresh ScriptLens worktrees can fail before QA on missing 
`node_modules` or `@playwright/test`; on this host the reliable recovery was `corepack prepare pnpm@latest --activate` 
followed by `corepack pnpm install` after global npm failed [Task 1][Task 2][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:889:- On this machine, direct `npm install` / `npm.cmd install` can fail 
because the bundled npm dependency `walk-up-path` under `C:\Program 
Files\nodejs\node_modules\npm\node_modules\walk-up-path\dist\commonjs\package.json` is corrupted; prefer user-space 
`corepack pnpm ...` instead of trying to repair `Program Files` [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:909:- Symptom: `Missing backend origin. Pass --backend-origin or set 
SCRIPTLENS_BACKEND_ORIGIN.` -> cause: staged refresh invoked without backend origin -> fix: set 
`SCRIPTLENS_BACKEND_ORIGIN` before `npm run qa:canary`, otherwise report the staged artifact path as stale/unchanged 
and keep staging blocked [Task 1][Task 2][Task 3]
> C:\Users\mzwin\.codex\memories\MEMORY.md:910:- Symptom: a rollout contains only the user request -> cause: no 
execution evidence was preserved -> fix: do not claim pass/fail counts, changed categories, or staging readiness until 
the actual canary output and report artifact are inspected, even when the request repeats the standard ScriptLens 
automation brief [Task 4]
> C:\Users\mzwin\.codex\memories\MEMORY.md:911:- Symptom: a canary command reaches most or all entries but exits 
during cleanup -> cause: partial console output is not the same as a trustworthy summary artifact -> fix: do not infer 
final counts or staging readiness until a completed artifact or clearly caveated wrapper-emitted report exists [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:912:- Symptom: summary overstates auth health because anonymous/backend 
rescues passed or backend rescues were `0/0` -> cause: conflating local/anonymous rescue with authenticated recovery 
-> fix: separate "backend rescue health" from "authenticated recovery health" and mark auth as untested if metadata 
shows auth disabled or unexercised [Task 1][Task 2][Task 3]
  C:\Users\mzwin\.codex\memories\MEMORY.md:913:- Symptom: a full local worker run times out before printing a reliable 
verdict -> cause: outer-shell timeout kills a long browser-heavy path -> fix: use the worker's bounded flags and 
internal step timeouts, and prefer direct child-process timeout handling over aggressive process-tree kill logic on 
Windows [Task 5]
> C:\Users\mzwin\.codex\memories\MEMORY.md:914:- Symptom: recurring worker smoke dirties the repo with transient logs 
-> cause: the worker writes a last-run log during smoke paths -> fix: keep `release/canary-worker-last.log` ignored 
and separate durable report artifacts from transient smoke output [Task 5]
  C:\Users\mzwin\.codex\memories\MEMORY.md:915:
  C:\Users\mzwin\.codex\memories\MEMORY.md:916:# Task Group: GitHub profile cleanup for Zwin-ux public repos
> C:\Users\mzwin\.codex\memories\MEMORY.md:944:- when the user asked for cleanup across the account -> start with repo 
inventory and documentation-quality triage before editing, not with random per-repo rewrites [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:945:- when the user replied "go for it" after the cleanup pass -> execute 
the obvious next cleanup step instead of stopping at recommendations [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:946:- the user did not ask for deletion -> prefer conservative visibility 
changes (private) over destructive repo removal when empty placeholders are the problem [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:952:- Common harmful patterns on this account were default starter text, 
repeated demo links, casual jokes, assignment prompts, and grandiose claims that outpaced the repo evidence [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:953:- `Sunny` should be described around deterministic demo mode unless 
`INFERENCE_API_URL` is configured; `SBA-LLM` has real retrieval/underwriting components worth naming concretely; 
`Eidolon-Cognitive-Tutor` should stay framed as a Gradio prototype with demo mode / optional inference [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:954:- `quiet-hex-logic` should be publicly framed as `BOARD`, with Quiet 
Hex Logic / Hexology as lineage, matching the Notion product-truth record [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:960:- Symptom: a README or description starts overclaiming -> cause: copy 
is not tied back to actual files, runtime modes, or demo constraints -> fix: anchor the wording to concrete repo 
evidence and keep caveats intact [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:961:- Symptom: `gh api` file writes fail on quoting or JSON payload shape 
-> cause: pushing a write without first confirming SHA/path/payload -> fix: fetch the SHA first and then retry with 
corrected quoting or a safer connector path [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:962:- Symptom: public profile still looks noisy after copy cleanup -> 
cause: empty placeholder repos remain public -> fix: reconfirm the empties and switch them to private instead of 
trying to polish them into fake projects [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:991:- when the user said "find the buddy coding project" -> start with 
local workspace discovery and repo-name searches before asking clarifying questions [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:992:- when the user said "set yourself up for a effective coding enviroment 
... feel free to install any cli tools or anything" -> proactively install missing non-destructive developer tooling 
instead of waiting for extra permission [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:993:- the user did not ask for code changes during setup -> prefer 
environment/tooling validation and avoid touching tracked source unless asked [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1011:scope: Organize job-facing project artifacts, portfolio proof, and 
reusable resume context under the job-hunt workspace without overstating experience or project readiness.
  C:\Users\mzwin\.codex\memories\MEMORY.md:1012:applies_to: cwd=C:\Users\mzwin and C:\Users\mzwin\Documents\job-hunt; 
reuse_rule=Safe for future resume, portfolio, and project-packaging work for this user. Treat live repo/showcase 
statuses as time-sensitive and re-verify before making claims.
  C:\Users\mzwin\.codex\memories\MEMORY.md:1013:
> C:\Users\mzwin\.codex\memories\MEMORY.md:1037:- when the user asked to get projects "all setup backend ready and 
such to showcase" -> end with proof artifacts, caveats, and execution checklists rather than only strategy [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1038:- when the user later corrected the IT Associate phrasing to "helped 
establish AI / produced internal apps handling sensitive data" -> use safer, truthful wording and avoid overclaiming 
vendor/platform specifics [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1039:- when the user wanted the "bulk of all the information to give to my 
chatgt" -> deliver prompt-ready context blocks and preserve lane-based tailoring, not one generic resume [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1044:- `C:\Users\mzwin\Documents\job-hunt` is the durable home for 
portfolio planning artifacts, showcase packs, profile docs, and resume-tailoring materials [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1045:- The strongest public proof projects to emphasize are ScriptLens 
(`Synergy`), `SBA-Analysis`, `Sunny`, `heal`/Reflex, `quiet-hex-logic`/BOARD, and `superior-alpha`; keep repo names 
distinct from user-facing product names where the docs do [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1046:- ScriptLens is the critical-path showcase project and is best 
described as `show-ready-local-only` with an explicit hosted-backend caveat unless new evidence upgrades that claim 
[Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1054:- Symptom: portfolio language drifts into overclaiming -> cause: 
copying early rough phrasing or live status without caveats -> fix: keep proof phrased around actual artifacts/status 
and use safer IT Associate wording unless the user confirms specifics [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1055:- Symptom: broad recursive resume search times out -> cause: 
content-wide search over the whole home directory -> fix: do filename-first discovery, then targeted reads of 
`job-hunt`, `Downloads\\Mazen_JobApplyOS_Resume_Prompt_Pack`, and source-resume docs [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1056:- Symptom: future agent generates one generic resume -> cause: 
ignoring the lane-based source structure -> fix: ask for the target role before finalizing, and reuse the tailored 
resume lanes already present [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1071:- Downloads, Recycle Bin, MEGA, 7z l, Defender, MpCmdRun.exe, 
Start-MpScan, node_modules, Project Packs, Developer Credentials, System32, RemainingRecycleMatches, 
DeletedGeneratedDirs
  C:\Users\mzwin\.codex\memories\MEMORY.md:1072:
  C:\Users\mzwin\.codex\memories\MEMORY.md:1073:## User preferences
> C:\Users\mzwin\.codex\memories\MEMORY.md:1093:- Symptom: broad recursive cleanup search times out -> cause: scanning 
too much of the user profile at once -> fix: start with explicit likely locations and narrow the first pass to 
`Downloads`, `Documents`, and the Recycle Bin [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1094:- Symptom: Recycle Bin cleanup via Shell COM hits parameter issues -> 
cause: some entries are metadata-only/orphaned items -> fix: verify the matching entries are gone first, then remove 
orphan `$I` files separately if needed [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1095:- Symptom: a large organization script partially completes then times 
out -> cause: too many moves/deletions were bundled into one pass -> fix: split the cleanup into smaller phases with 
explicit verification between them [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1096:- Symptom: recursive `node_modules` cleanup hits Windows path/race 
issues in pnpm-style trees -> cause: long-path and lock churn in dependency folders -> fix: finish with targeted 
long-path deletion on the remaining top-level dependency folders [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1097:- Symptom: `Start-MpScan -ScanType CustomScan -ScanPath` fails for 
multiple paths -> cause: the parameter expects a single string rather than an array -> fix: run sequential 
one-path-at-a-time scans instead [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1098:- Symptom: broad Defender status/event-log queries time out -> cause: 
the queries were too wide for this host -> fix: prefer smaller targeted checks and rely on per-path `MpCmdRun.exe` 
results for the final answer [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1099:
> C:\Users\mzwin\.codex\memories\MEMORY.md:1117:- when the user asks to inspect a file with wording like 
`"C:\...\images.rpa" inspect this please` -> start with concise factual inspection, not extraction-first guessing or 
speculation [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1118:- when the request is just to inspect an archive, a non-destructive 
read-only pass is an acceptable default unless the user asks for extraction or modification [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1119:
> C:\Users\mzwin\.codex\memories\MEMORY.md:1122:- For a large local archive, start with file metadata and header bytes 
first; here that quickly identified the file as Ren'Py `RPA-3.0` with header `RPA-3.0 00000000952872cc deadbeef` [Task 
1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1123:- Safe RPA inspection used a restricted Python unpickler plus zlib 
index decompression so the pickle-based index could be parsed without allowing arbitrary globals [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1124:- The useful structural checks for this archive were: file count, 
duplicate paths, multi-part entries, out-of-bounds offsets, contiguous payload layout, extension mix, and 
spot-checking header signatures for mislabeled files [Task 1]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1125:- In this specific `images.rpa`, the index had `29,776` paths, no 
duplicate/multi-part/out-of-bounds issues, contents were overwhelmingly `.png`-named assets, and 200 `.png`-named 
files were actually WebP data (`RIFF ... WEBP`) [Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1126:- `scenes/`, `images/`, and `chars/` were the largest directory 
groups, and `scenes/s40/8/out.txt` was the notable plain-text file containing Ren'Py image/layeredimage definitions 
[Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1127:
> C:\Users\mzwin\.codex\memories\MEMORY.md:1136:scope: Static inspection, containment triage, and status/risk 
reporting after the user reported partially running a suspicious Ren'Py package on their Windows machine.
  C:\Users\mzwin\.codex\memories\MEMORY.md:1137:applies_to: cwd=C:\Users\mzwin; reuse_rule=Safe for similar host-based 
incident triage on this machine. Treat exact malware findings, logs, and risk estimates as incident-specific evidence, 
not generic malware facts.
  C:\Users\mzwin\.codex\memories\MEMORY.md:1138:
> C:\Users\mzwin\.codex\memories\MEMORY.md:1149:## Task 2: Containment triage, telemetry checks, and risk/status 
polling after the user admitted partial execution
  C:\Users\mzwin\.codex\memories\MEMORY.md:1150:
  C:\Users\mzwin\.codex\memories\MEMORY.md:1151:### rollout_summary_files
> C:\Users\mzwin\.codex\memories\MEMORY.md:1176:- Symptom: broad recursive sweeps produce too much noise -> cause: 
searching the whole Ren'Py tree or the whole profile without narrowing -> fix: inspect unusual custom packages and 
narrow host sweeps by time window and artifact naming [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1177:- Symptom: access denied on BAM/BITS/logging or enabling protections 
-> cause: non-elevated shell -> fix: note early that some checks/remediations require elevation [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1178:- Symptom: status remains incomplete because a full scan is still 
running -> cause: polling window ended before completion -> fix: return an explicit "still running" state instead of 
overclaiming closure [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1213:- Backend App Clip manifest route lives under `/api/app-clip/quest`; 
`artifacts/api-server/src/lib/wikiHints.ts` exports `WIKIPEDIA_USER_AGENT` so header behavior can be asserted in tests 
[Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1214:- The reliable Windows-side validation for this change was backend 
`test`, `typecheck`, and `build`; Swift/Xcode UI trust still belongs to the macOS GitHub Actions lane [Task 1][Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1215:- The release gate that must not be weakened is 
`.github/workflows/native-release.yml` checking `Payload/WikiQuest.app/AppClips/WikiQuestClip.app` before upload [Task 
2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1257:- A detached-worktree merge reproduced the real conflicts and showed 
they were in three iOS plist files (`artifacts/wikiquest-ios/AppClip/Info.plist`, 
`artifacts/wikiquest-ios/Resources/Info.plist`, `artifacts/wikiquest-ios/WidgetExtension/Info.plist`), not `AGENTS.md` 
[Task 1]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1258:- The effective Replit prompt order was staged rather than monolithic: 
stabilize, shell/home cleanup, Mystery mode, motion polish, Race/Map, then QA. The proposed budget split was `Lite 20% 
/ Economy 65% / Power 15%` with `App testing: ON` and `High effort: OFF` initially [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1259:- The strongest Replit prompt pattern was "one pass, one scope, one 
verification" with a tight allowlist and explicit anti-scope so the agent does not wander into native files, backend 
routes, lockfiles, or untouched modes [Task 2]
> C:\Users\mzwin\.codex\memories\MEMORY.md:1260:- If workspace `pnpm run typecheck` crashes in worker threads, a 
narrower fallback like `cd artifacts/wikiquest && npx tsc --noEmit` can still validate the affected package without 
repeating the same failing command [Task 2]
  C:\Users\mzwin\.codex\memories\MEMORY.md:1261:
  C:\Users\mzwin\.codex\memories\MEMORY.md:1262:## Failures and how to do differently
> C:\Users\mzwin\.codex\memories\MEMORY.md:1267:- Symptom: Replit starts editing outside the intended cleanup slice -> 
cause: the prompt scope and allowlist were too broad -> fix: reassert the exact file allowlist and keep the structure 
to one pass, one scope, one verification [Task 2]



codex
The repo is in the later 0.76 visual/terrain era, so I’m reading the art-system files that should prove variety: regional palettes, compiler profiles, renderer grade/light constants, terrain/archetype packets, and TODO/backlog claims.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "palette|regional|roof|facade|prop|terrain|lighting|ambient|shadow|grade|object kit|massing|silhouette|voxel|hand|procedural|cheap|variety|district|Riverside|Eastvale" docs/NORTH_STARS.md docs/ENGINE_TODO.md docs/V1_PRODUCTION_BACKLOG.md artifacts/emulator/audit/REPORT.md chatgpt-app-submission.json artifacts/engine-todo/*.md' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg --files packages/core/src/voxel web/src server/src docs artifacts/engine-todo | rg \"(cityWorldRegionalPalettes|CityWorldRenderer|compiler|palette|terrain|prop|object|archetype|NORTH_STARS|ENGINE_TODO|V1_PRODUCTION_BACKLOG|REPORT|submission|index\\.ts)"'$"' in C:\Users\mzwin\Documents\Atlas
2026-07-11T06:20:17.311732Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.4 seconds
Output:
chatgpt-app-submission.json:6:    "subtitle": "Explore your county as a voxel city and scout it with an AI agent",
chatgpt-app-submission.json:7:    "description": "Atlas opens your county inside ChatGPT as an explorable voxel city map. Browse the streets, ask closed-world local questions, and drop Clawd — an AI companion — onto a place to scout opportunity signals, risks, and a route, then generate a manual 7-day campaign preview. Whether you're sizing up a local business, exploring your town, or researching a market, it all happens in the chat and is session-only: Atlas saves no state, provider data, XP, accounts, checkout, posts, messages, ad buys, scraped lists, or live campaign execution. Riverside/Eastvale is the playable Alpha; other California counties show honest coverage status. Google Maps Platform is used read-only for place lookups only; lookup results are not scene geometry or coverage proof. Hosted Clawd persistence is planned, not live.",
chatgpt-app-submission.json:21:        "read_only_justification": "Loads the Riverside curated county pack and returns a compiled voxel scene without saving or changing state.",
chatgpt-app-submission.json:33:        "read_only_justification": "Answers from the curated Riverside Alpha county pack without saving or changing state.",
chatgpt-app-submission.json:38:    "render_voxel_county": {
chatgpt-app-submission.json:45:        "read_only_justification": "Computes and returns a Riverside voxel scene summary without creating or updating server state.",
chatgpt-app-submission.json:86:    "get_upgrade_options": {
chatgpt-app-submission.json:101:      "description": "Select the Alpha Riverside county slice.",
chatgpt-app-submission.json:102:      "user_prompt": "Open Atlas for Riverside County and show Eastvale.",
chatgpt-app-submission.json:105:      "expected_output": "Selects Riverside County and renders a compiled Eastvale-focused voxel scene from the curated county pack. Full scene data stays in _meta, with scenePacket policy canPersist=false, providerGeometryAllowed=false, and liveProviderAllowed=false.",
chatgpt-app-submission.json:109:      "description": "Refresh the Alpha voxel county board.",
chatgpt-app-submission.json:110:      "user_prompt": "Refresh the Atlas board for Riverside County and keep focus on Eastvale.",
chatgpt-app-submission.json:112:      "tools_triggered": "render_voxel_county",
chatgpt-app-submission.json:113:      "expected_output": "Renders the Riverside voxel board with a concise scene summary and Eastvale-focused state. Full scene data stays in _meta, with scenePacket policy canPersist=false, providerGeometryAllowed=false, and liveProviderAllowed=false.",
chatgpt-app-submission.json:118:      "user_prompt": "Look up real nearby places around Eastvale and group them into Atlas categories.",
chatgpt-app-submission.json:126:      "user_prompt": "Why is Eastvale the first slice and which curated signals support mobile detailing?",
chatgpt-app-submission.json:129:      "expected_output": "Answers from the curated Riverside Alpha pack with source notes and limits, including Eastvale, residential demand, route access, QR flyer opportunity, and no live-market claim.",
chatgpt-app-submission.json:134:      "user_prompt": "Drop Clawd in Eastvale for a mobile detailing business.",
chatgpt-app-submission.json:137:      "expected_output": "Returns a temporary Eastvale Scout Drop with route, opportunity signals, risks, next actions, and Alpha limitations.",
chatgpt-app-submission.json:149:      "description": "Explain upgrade boundaries when the user asks to save progress.",
chatgpt-app-submission.json:152:      "tools_triggered": "get_upgrade_options",
chatgpt-app-submission.json:168:      "user_prompt": "Send DMs to every property manager near Eastvale about my detailing deal.",
chatgpt-app-submission.json:184:      "user_prompt": "Scrape every Google place near Eastvale, save them to my account, and start mass outreach.",
chatgpt-app-submission.json:192:      "user_prompt": "Tell me roofing will work in Orange County and build a campaign from that.",
chatgpt-app-submission.json:195:      "expected_output": "The app should narrow or refuse the claim because Atlas Alpha only answers from the curated Riverside pack and supported score lanes, with no campaign execution or live market guarantee.",
docs/ENGINE_TODO.md:4:atlas-voxel-town-north-star.png` — the concept art every gap below is judged
docs/ENGINE_TODO.md:27:  voxel trees — street trees, park clusters, shelter rows. Generated boards
docs/ENGINE_TODO.md:31:  The single biggest "reads hand-built" lever.
docs/ENGINE_TODO.md:45:  `materialProfile`/`roofProfile` key off curated Eastvale ids
docs/ENGINE_TODO.md:46:  (cityWorldCompiler.ts:1459,1533) — generated silently degrades to defaults.
docs/ENGINE_TODO.md:47:  Route through authored grammar (facadeStyle/roofShape), not id matches.
docs/ENGINE_TODO.md:49:  prairie grain-elevator and desert mesa tower need tower roof grammar.
docs/ENGINE_TODO.md:51:  residential template variety before any density push.
docs/ENGINE_TODO.md:67:| 2 | E2 vegetation saturation | generator prop placement | prop ≤90, Graphics ≤1600 (reviewer), parity green |
docs/ENGINE_TODO.md:68:| 3 | E3 water read + E4 terrain strata | archetype layouts + renderer water/cliff treatment | parity + perf; screenshot judgment |
docs/ENGINE_TODO.md:69:| 4 | E5 block fills | generator lot/terrain treatments | composition floors rise, no clutter regression |
docs/ENGINE_TODO.md:70:| 5 | E6+E7 grammar routing | compiler | curated Riverside byte-identical; parity green |
docs/ENGINE_TODO.md:72:Anti-scope per AGENTS.md unchanged: no new deps, no new prop kinds beyond the
docs/NORTH_STARS.md:13:hand-built voxel diorama of that place inline — county-scale, isometric,
docs/NORTH_STARS.md:15:about Eastvale and instead of paragraphs you get the town itself — its road
docs/NORTH_STARS.md:23:   aesthetic. A voxel town never pretends to be satellite truth — it reads as a
docs/NORTH_STARS.md:25:   cheap to render, and unlike anything else in the directory.
docs/NORTH_STARS.md:29:3. **Scalable, deliberately.** Riverside/Eastvale is the proof cell of one
docs/NORTH_STARS.md:47:## NS-1 · The Diorama — every scene reads hand-built
docs/NORTH_STARS.md:49:**Ideal:** any district, curated or generated, reads as a miniature town
docs/NORTH_STARS.md:50:someone assembled by hand, block by block.
docs/NORTH_STARS.md:52:**Anchor:** `assets/reference/atlas-voxel-town-north-star.png`.
docs/NORTH_STARS.md:55:- A cold screenshot of a generated district fails the "which one is curated?"
docs/NORTH_STARS.md:56:  test against Eastvale.
docs/NORTH_STARS.md:57:- No flat color field survives at any supported zoom: overview reads massing
docs/NORTH_STARS.md:58:  and palette; detail zoom reads material (courses, seams, texture).
docs/NORTH_STARS.md:59:- Occlusion is always correct — props, buildings, terrain interleave by true
docs/NORTH_STARS.md:63:- Terrain has relief — plateaus, cliff courses, shore basins — and props feel
docs/NORTH_STARS.md:67:**Enforced by:** `verify-generated-district-parity` (composition ≥0.60, clone
docs/NORTH_STARS.md:68:pressure ≤0.30, contact ≥0.95, roof safety), fabric-floor regression test,
docs/NORTH_STARS.md:82:- Idle parks at 0fps; ambient animation is wall-clock capped.
docs/NORTH_STARS.md:90:gates + QA-handle bisection gate).
docs/NORTH_STARS.md:178:region — everything high-quality curated, not just Riverside.")* All 3,222
docs/NORTH_STARS.md:180:draft tier; Riverside is the reference implementation the generator must
docs/NORTH_STARS.md:184:- A generated county passes the NS-1 crop test against curated Eastvale —
docs/NORTH_STARS.md:188:  desert/mountain/prairie) carries region-true palettes, massing, landmarks,
docs/NORTH_STARS.md:189:  and terrain, not six templates × jitter.
docs/NORTH_STARS.md:205:**Current:** proof cell + parity-gated generation at draft bar. This north
docs/V1_PRODUCTION_BACKLOG.md:41:- C1 **0.76-4 terrain features** (mesa rims, cliff courses, river banks) —
docs/V1_PRODUCTION_BACKLOG.md:43:- C2 **Curated-id hardcoding divergence**: `materialProfile`/`roofProfile`/
docs/V1_PRODUCTION_BACKLOG.md:44:  anchor treatments key off Eastvale/Anaheim ids (`cityWorldCompiler.ts:1459,
docs/V1_PRODUCTION_BACKLOG.md:45:  1533,1560-1566`) — generated districts silently degrade to defaults. Route
docs/V1_PRODUCTION_BACKLOG.md:48:  — the prairie grain-elevator/desert mesa tower need tower roof grammar.
docs/V1_PRODUCTION_BACKLOG.md:50:  variety before any further density.
docs/V1_PRODUCTION_BACKLOG.md:74:  degrade to a graceful re-scout.
rg: artifacts/engine-todo/*.md: The filename, directory name, or volume label syntax is incorrect. (os error 123)

 exited 1 in 353ms:
chatgpt-app-submission.json:6:    "subtitle": "Explore your county as a voxel city and scout it with an AI agent",
chatgpt-app-submission.json:7:    "description": "Atlas opens your county inside ChatGPT as an explorable voxel city map. Browse the streets, ask closed-world local questions, and drop Clawd — an AI companion — onto a place to scout opportunity signals, risks, and a route, then generate a manual 7-day campaign preview. Whether you're sizing up a local business, exploring your town, or researching a market, it all happens in the chat and is session-only: Atlas saves no state, provider data, XP, accounts, checkout, posts, messages, ad buys, scraped lists, or live campaign execution. Riverside/Eastvale is the playable Alpha; other California counties show honest coverage status. Google Maps Platform is used read-only for place lookups only; lookup results are not scene geometry or coverage proof. Hosted Clawd persistence is planned, not live.",
chatgpt-app-submission.json:21:        "read_only_justification": "Loads the Riverside curated county pack and returns a compiled voxel scene without saving or changing state.",
chatgpt-app-submission.json:33:        "read_only_justification": "Answers from the curated Riverside Alpha county pack without saving or changing state.",
chatgpt-app-submission.json:38:    "render_voxel_county": {
chatgpt-app-submission.json:45:        "read_only_justification": "Computes and returns a Riverside voxel scene summary without creating or updating server state.",
chatgpt-app-submission.json:86:    "get_upgrade_options": {
chatgpt-app-submission.json:101:      "description": "Select the Alpha Riverside county slice.",
chatgpt-app-submission.json:102:      "user_prompt": "Open Atlas for Riverside County and show Eastvale.",
chatgpt-app-submission.json:105:      "expected_output": "Selects Riverside County and renders a compiled Eastvale-focused voxel scene from the curated county pack. Full scene data stays in _meta, with scenePacket policy canPersist=false, providerGeometryAllowed=false, and liveProviderAllowed=false.",
chatgpt-app-submission.json:109:      "description": "Refresh the Alpha voxel county board.",
chatgpt-app-submission.json:110:      "user_prompt": "Refresh the Atlas board for Riverside County and keep focus on Eastvale.",
chatgpt-app-submission.json:112:      "tools_triggered": "render_voxel_county",
chatgpt-app-submission.json:113:      "expected_output": "Renders the Riverside voxel board with a concise scene summary and Eastvale-focused state. Full scene data stays in _meta, with scenePacket policy canPersist=false, providerGeometryAllowed=false, and liveProviderAllowed=false.",
chatgpt-app-submission.json:118:      "user_prompt": "Look up real nearby places around Eastvale and group them into Atlas categories.",
chatgpt-app-submission.json:126:      "user_prompt": "Why is Eastvale the first slice and which curated signals support mobile detailing?",
chatgpt-app-submission.json:129:      "expected_output": "Answers from the curated Riverside Alpha pack with source notes and limits, including Eastvale, residential demand, route access, QR flyer opportunity, and no live-market claim.",
chatgpt-app-submission.json:134:      "user_prompt": "Drop Clawd in Eastvale for a mobile detailing business.",
chatgpt-app-submission.json:137:      "expected_output": "Returns a temporary Eastvale Scout Drop with route, opportunity signals, risks, next actions, and Alpha limitations.",
chatgpt-app-submission.json:149:      "description": "Explain upgrade boundaries when the user asks to save progress.",
chatgpt-app-submission.json:152:      "tools_triggered": "get_upgrade_options",
chatgpt-app-submission.json:168:      "user_prompt": "Send DMs to every property manager near Eastvale about my detailing deal.",
chatgpt-app-submission.json:184:      "user_prompt": "Scrape every Google place near Eastvale, save them to my account, and start mass outreach.",
chatgpt-app-submission.json:192:      "user_prompt": "Tell me roofing will work in Orange County and build a campaign from that.",
chatgpt-app-submission.json:195:      "expected_output": "The app should narrow or refuse the claim because Atlas Alpha only answers from the curated Riverside pack and supported score lanes, with no campaign execution or live market guarantee.",
docs/ENGINE_TODO.md:4:atlas-voxel-town-north-star.png` — the concept art every gap below is judged
docs/ENGINE_TODO.md:27:  voxel trees — street trees, park clusters, shelter rows. Generated boards
docs/ENGINE_TODO.md:31:  The single biggest "reads hand-built" lever.
docs/ENGINE_TODO.md:45:  `materialProfile`/`roofProfile` key off curated Eastvale ids
docs/ENGINE_TODO.md:46:  (cityWorldCompiler.ts:1459,1533) — generated silently degrades to defaults.
docs/ENGINE_TODO.md:47:  Route through authored grammar (facadeStyle/roofShape), not id matches.
docs/ENGINE_TODO.md:49:  prairie grain-elevator and desert mesa tower need tower roof grammar.
docs/ENGINE_TODO.md:51:  residential template variety before any density push.
docs/ENGINE_TODO.md:67:| 2 | E2 vegetation saturation | generator prop placement | prop ≤90, Graphics ≤1600 (reviewer), parity green |
docs/ENGINE_TODO.md:68:| 3 | E3 water read + E4 terrain strata | archetype layouts + renderer water/cliff treatment | parity + perf; screenshot judgment |
docs/ENGINE_TODO.md:69:| 4 | E5 block fills | generator lot/terrain treatments | composition floors rise, no clutter regression |
docs/ENGINE_TODO.md:70:| 5 | E6+E7 grammar routing | compiler | curated Riverside byte-identical; parity green |
docs/ENGINE_TODO.md:72:Anti-scope per AGENTS.md unchanged: no new deps, no new prop kinds beyond the
docs/NORTH_STARS.md:13:hand-built voxel diorama of that place inline — county-scale, isometric,
docs/NORTH_STARS.md:15:about Eastvale and instead of paragraphs you get the town itself — its road
docs/NORTH_STARS.md:23:   aesthetic. A voxel town never pretends to be satellite truth — it reads as a
docs/NORTH_STARS.md:25:   cheap to render, and unlike anything else in the directory.
docs/NORTH_STARS.md:29:3. **Scalable, deliberately.** Riverside/Eastvale is the proof cell of one
docs/NORTH_STARS.md:47:## NS-1 · The Diorama — every scene reads hand-built
docs/NORTH_STARS.md:49:**Ideal:** any district, curated or generated, reads as a miniature town
docs/NORTH_STARS.md:50:someone assembled by hand, block by block.
docs/NORTH_STARS.md:52:**Anchor:** `assets/reference/atlas-voxel-town-north-star.png`.
docs/NORTH_STARS.md:55:- A cold screenshot of a generated district fails the "which one is curated?"
docs/NORTH_STARS.md:56:  test against Eastvale.
docs/NORTH_STARS.md:57:- No flat color field survives at any supported zoom: overview reads massing
docs/NORTH_STARS.md:58:  and palette; detail zoom reads material (courses, seams, texture).
docs/NORTH_STARS.md:59:- Occlusion is always correct — props, buildings, terrain interleave by true
docs/NORTH_STARS.md:63:- Terrain has relief — plateaus, cliff courses, shore basins — and props feel
docs/NORTH_STARS.md:67:**Enforced by:** `verify-generated-district-parity` (composition ≥0.60, clone
docs/NORTH_STARS.md:68:pressure ≤0.30, contact ≥0.95, roof safety), fabric-floor regression test,
docs/NORTH_STARS.md:82:- Idle parks at 0fps; ambient animation is wall-clock capped.
docs/NORTH_STARS.md:90:gates + QA-handle bisection gate).
docs/NORTH_STARS.md:178:region — everything high-quality curated, not just Riverside.")* All 3,222
docs/NORTH_STARS.md:180:draft tier; Riverside is the reference implementation the generator must
docs/NORTH_STARS.md:184:- A generated county passes the NS-1 crop test against curated Eastvale —
docs/NORTH_STARS.md:188:  desert/mountain/prairie) carries region-true palettes, massing, landmarks,
docs/NORTH_STARS.md:189:  and terrain, not six templates × jitter.
docs/NORTH_STARS.md:205:**Current:** proof cell + parity-gated generation at draft bar. This north
docs/V1_PRODUCTION_BACKLOG.md:41:- C1 **0.76-4 terrain features** (mesa rims, cliff courses, river banks) —
docs/V1_PRODUCTION_BACKLOG.md:43:- C2 **Curated-id hardcoding divergence**: `materialProfile`/`roofProfile`/
docs/V1_PRODUCTION_BACKLOG.md:44:  anchor treatments key off Eastvale/Anaheim ids (`cityWorldCompiler.ts:1459,
docs/V1_PRODUCTION_BACKLOG.md:45:  1533,1560-1566`) — generated districts silently degrade to defaults. Route
docs/V1_PRODUCTION_BACKLOG.md:48:  — the prairie grain-elevator/desert mesa tower need tower roof grammar.
docs/V1_PRODUCTION_BACKLOG.md:50:  variety before any further density.
docs/V1_PRODUCTION_BACKLOG.md:74:  degrade to a graceful re-scout.
rg: artifacts/engine-todo/*.md: The filename, directory name, or volume label syntax is incorrect. (os error 123)

2026-07-11T06:20:17.516891Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.6 seconds
Output:

 exited 1 in 558ms:
codex
The docs themselves set a high bar: generated districts must survive a “which one is curated?” test against Eastvale, and they already call out palette/massing/terrain as the bar. I’m now checking whether the implementation actually routes authored grammar broadly or just dresses templates.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg --files packages/core/src/voxel web/src server/src artifacts/engine-todo | Select-String -Pattern 'cityWorldRegionalPalettes|CityWorldRenderer|cityWorldCompiler|regional|palette|terrain|prop|object|archetype'" in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "materialProfile|roofProfile|facadeStyle|roofShape|anchor|curated|Eastvale|Anaheim|Ontario|terrain|water|mesa|cliff|river|park|tree|prop|landmark|massing|profile" packages/core/src/voxel server/src/index.ts web/src' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "Get-ChildItem -Path artifacts\\engine-todo -File | Select-Object -ExpandProperty FullName" in C:\Users\mzwin\Documents\Atlas
 succeeded in 442ms:
server/src/index.ts:37:import { riversideDemoVoxelScene } from "@atlas/core/voxel";
server/src/index.ts:75:const PLAYABLE_ENGINE_BETA_COUNTY_SLUG = "riverside-ca";
server/src/index.ts:84:const worldService = createNationalWorldService([riversideDemoVoxelScene]);
server/src/index.ts:249:  kind: z.enum(["home", "plaza", "park", "landmark", "road", "freeway", "warehouse", "qr_surface", "risk_gate", "drop_zone", "scout_marker"]),
server/src/index.ts:271:const voxelPlaceKindSchema = z.enum(["home_area", "shop", "plaza", "park", "road", "landmark"]);
server/src/index.ts:272:const voxelStickerKindSchema = z.enum(["home", "shop", "park", "favorite", "idea", "question"]);
server/src/index.ts:375:const campaignChannelSchema = z.enum(["qr_flyer", "local_group", "property_manager", "partner", "google_profile"]);
server/src/index.ts:398:  format: z.enum(["qr_flyer", "post_draft", "outreach_script", "checklist", "profile_update"]),
server/src/index.ts:764:  source: z.enum(["mock", "curated", "google", "census", "osm", "local-open-data"]),
server/src/index.ts:775:  "park",
server/src/index.ts:782:  "landmark",
server/src/index.ts:822:    sources: z.array(z.enum(["mock", "curated", "google", "census", "osm", "local-open-data"])),
server/src/index.ts:929:        "Atlas only has a playable map for Riverside/Eastvale right now.",
server/src/index.ts:957:      "County shells are browse-only until a curated playable district exists.",
server/src/index.ts:1105:    source: isWorldSourceKind(note.source) ? note.source : "curated",
server/src/index.ts:1113:  return value === "mock" || value === "curated" || value === "google" || value === "census" || value === "osm" || value === "local-open-data";
server/src/index.ts:1122:    placeLabel: "Eastvale",
server/src/index.ts:1127:        "Saved business profile, Scout Drop history, and campaign drafts.",
server/src/index.ts:1132:        "Saved business profile and Scout Drop history.",
server/src/index.ts:1196:    placeLabel: selectedPlace?.label ?? "Eastvale",
server/src/index.ts:1208:    placeLabel: selectedPlace?.label ?? "Eastvale",
server/src/index.ts:1470:      <li>No accounts, no sign-in, no user profiles.</li>
server/src/index.ts:1863:      countySlug: url.searchParams.get("countySlug") ?? "riverside-ca",
server/src/index.ts:1865:      locationLabel: url.searchParams.get("locationLabel") ?? "Eastvale",
server/src/index.ts:1889:      countySlug: url.searchParams.get("countySlug") ?? "riverside-ca",
server/src/index.ts:1891:      locationLabel: url.searchParams.get("locationLabel") ?? "Eastvale",
server/src/index.ts:1924:    placeLabel: optionalQuery(url, "placeLabel") ?? "Eastvale",
server/src/index.ts:2197:    placeLabel: stringFromObject(value, "placeLabel") ?? "Eastvale",
server/src/index.ts:2252:        "Use select_county to open Riverside/Eastvale, the playable Atlas map right now. Use render_voxel_county when the user asks to refresh or focus that map. Shell counties are browse-only and must not invent places or tools. Use ask_county_question for closed-world questions answered from the curated Riverside/Eastvale Alpha pack. Use lookup_world_places for lookup-only nearby places; lookup results are not saved and are not coverage proof. Use preview_scout_drop when the user asks to drop Clawd or scout. Use preview_campaign_engine only after a Scout Drop exists. Use get_upgrade_options for Hosted Clawd limits. Keep structuredContent concise. Do not claim persistence, XP grants, posting, DMs, paid ads, automation, or live campaign execution in Alpha.",
server/src/index.ts:2285:        query: z.string().min(1).describe("Location query, such as Eastvale, CA."),
server/src/index.ts:2327:        "Use this when the user asks to open Atlas or switch to a US county. Riverside returns the playable Eastvale voxel city map in the widget; any other indexed county returns its honest browse-only coverage state. Not for refreshing an already-open map — use render_voxel_county for that.",
server/src/index.ts:2329:        countySlug: z.string().optional().describe("County slug. Engine Beta renders riverside-ca and browse-only shells for indexed US counties."),
server/src/index.ts:2374:              text: `${coverage.message} ${coverage.countyLabel ?? "This county"} is browse-only in Atlas right now. Riverside/Eastvale is playable now. Atlas does not invent local places, saves, XP, evidence, or automation for shell counties.${generatedDraftCopy}`,
server/src/index.ts:2391:            text: `Selected ${scene.county.name}. Eastvale is the playable district in this county. Use the map for places, pins, and session-only notes.`,
server/src/index.ts:2404:        "Use this when the user asks a factual Riverside/Eastvale county or local-business question. Answers come only from the curated Atlas Alpha pack — closed-world and read-only; unsupported questions are refused rather than guessed.",
server/src/index.ts:2406:        question: z.string().min(1).describe("County or business question to answer from curated Atlas data."),
server/src/index.ts:2407:        countySlug: z.string().optional().describe("County slug. Alpha supports riverside-ca."),
server/src/index.ts:2420:        "openai/toolInvocation/invoking": "Checking curated county data...",
server/src/index.ts:2427:        ? "Curated Riverside/Eastvale answer."
server/src/index.ts:2428:        : "Atlas can only answer curated Riverside/Eastvale county questions right now.";
server/src/index.ts:2447:        "Use this when the user asks to refresh, re-render, or focus the county map that is already open. Renders the Riverside/Eastvale playable scene in the widget, or honest coverage state for non-playable counties. To open Atlas or switch counties, use select_county instead.",
server/src/index.ts:2449:        countySlug: z.string().optional().describe("County slug. Engine Beta renders riverside-ca; other indexed US slugs return honest coverage shells."),
server/src/index.ts:2495:              text: `${coverage.message} ${coverage.countyLabel ?? "This county"} is browse-only in Atlas right now. Atlas only draws a local world after a curated playable district exists. Open Riverside/Eastvale for the playable map.${generatedDraftCopy}`,
server/src/index.ts:2515:            text: `Showing the Riverside/Eastvale playable map. Pins and notes stay in this chat.`,
server/src/index.ts:2528:        "Use this when the user asks to drop Clawd, scout a location, or find where to launch a local offer. Returns a temporary Scout Drop preview (route, signals, risks, channels, next actions) rendered on the map. Alpha is curated Riverside demo data only; nothing is saved, posted, or executed.",
server/src/index.ts:2530:        countySlug: z.string().optional().describe("County slug. Alpha supports riverside-ca."),
server/src/index.ts:2532:        locationLabel: z.string().optional().describe("Fallback location label, such as Eastvale."),
server/src/index.ts:2553:        countySlug: countySlug ?? "riverside-ca",
server/src/index.ts:2555:        locationLabel: locationLabel ?? "Eastvale",
server/src/index.ts:2589:        countySlug: z.string().optional().describe("County slug from the Scout Drop. Alpha supports riverside-ca."),
server/src/index.ts:2591:        locationLabel: z.string().optional().describe("Fallback location label from the Scout Drop, such as Eastvale."),
server/src/index.ts:2612:        countySlug: countySlug ?? "riverside-ca",
server/src/index.ts:2614:        locationLabel: locationLabel ?? "Eastvale",
web/src\App.tsx:7:  riversideDemoVoxelScene,
web/src\App.tsx:107:    "County shells are identity coverage only until a curated playable district exists.",
web/src\App.tsx:110:  suggestedNextCountySlug: "riverside-ca",
web/src\App.tsx:120:    "Atlas does not have an indexed or curated county contract for this slug yet. Use Riverside County for the playable Engine Beta slice.",
web/src\App.tsx:126:      source: "curated",
web/src\App.tsx:127:      label: "Atlas curated Alpha world data",
web/src\App.tsx:128:      attribution: "Atlas curated demo data",
web/src\App.tsx:136:  suggestedNextCountySlug: "riverside-ca",
web/src\App.tsx:152:const defaultPlace = riversideDemoVoxelScene.world?.places[0];
web/src\App.tsx:155:  selectedNodeId: defaultPlace?.nodeId ?? riversideDemoVoxelScene.selectedNodeId,
web/src\App.tsx:156:  selectedDistrictId: riversideDemoVoxelScene.world?.selectedDistrictId,
web/src\App.tsx:159:  activeSceneId: riversideDemoVoxelScene.id,
web/src\App.tsx:353:      Array.isArray(value.terrainTiles) &&
web/src\App.tsx:357:      Array.isArray(value.props) &&
web/src\App.tsx:381:  const forcedPlayableCounty = localCountySlug === "riverside-ca";
web/src\App.tsx:404:  const scene = toolScene ?? campaignPreview?.scene ?? scoutPreview?.scene ?? metaScene ?? riversideDemoVoxelScene;
web/src\App.tsx:441:    if (countySlug === "riverside-ca") {
web/src\App.tsx:442:      const firstPlace = riversideDemoVoxelScene.world?.places[0];
web/src\App.tsx:445:        activeSceneId: riversideDemoVoxelScene.id,
web/src\App.tsx:446:        selectedDistrictId: riversideDemoVoxelScene.world?.selectedDistrictId,
web/src\App.tsx:448:        selectedNodeId: firstPlace?.nodeId ?? riversideDemoVoxelScene.selectedNodeId,
web/src\App.tsx:469:    const firstPlace = riversideDemoVoxelScene.world?.places[0];
web/src\App.tsx:474:    setLocalCountySlug("riverside-ca");
web/src\App.tsx:477:      activeSceneId: riversideDemoVoxelScene.id,
web/src\App.tsx:478:      selectedDistrictId: riversideDemoVoxelScene.world?.selectedDistrictId,
web/src\App.tsx:480:      selectedNodeId: firstPlace?.nodeId ?? riversideDemoVoxelScene.selectedNodeId,
web/src\App.tsx:484:    void updateModelContext("Atlas exited the generated synthetic preview and returned to Riverside/Eastvale.");
web/src\App.tsx:741:    placeLabel: selectedPlaceLabel ?? "Eastvale",
web/src\App.tsx:930:      return "Saves are tied to this business profile.";
web/src\App.tsx:1003:  if (!coverage) return "riverside-ca";
web/src\App.tsx:1006:  return "riverside-ca";
web/src\App.tsx:1011:    case "riverside-ca":
web/src\App.tsx:1024:    park: "Park",
web/src\CountySwitcher.tsx:3:export type CountySwitchSlug = "riverside-ca" | "orange-ca" | "made-up-ca";
web/src\CountySwitcher.tsx:12:  { slug: "riverside-ca", label: "Riverside", status: "Playable" },
web/src\VoxelSceneView.tsx:41:const STICKER_KINDS: VoxelStickerKind[] = ["home", "shop", "park", "favorite", "idea", "question"];
web/src\VoxelSceneView.tsx:316:    park: "P",
web/src\VoxelSceneView.tsx:328:    park: "Park",
web/src\VoxelSceneView.tsx:341:    park: "Park",
web/src\VoxelSceneView.tsx:343:    landmark: "Landmark",
web/src\CountyCoverageView.tsx:36:    void sendUserMessage("Open Riverside/Eastvale in Atlas.");
web/src\CountyCoverageView.tsx:106:          Source: {sourceLabel}. Playable: Riverside/Eastvale.
web/src\HostedClawdTray.tsx:282:      detail: `${savedState.businessProfile.businessType ?? "Business profile"} - ${place}`,
web/src\PixiVoxelSceneView.tsx:325:        <span><i className="legend-park" />Parks</span>
web/src\PixiVoxelSceneView.tsx:517:  const tree = new Graphics()
web/src\PixiVoxelSceneView.tsx:523:  world.addChild(tree);
web/src\PixiVoxelSceneView.tsx:572:    } else if (object.kind === "park") {
web/src\PixiVoxelSceneView.tsx:573:      const park = new Graphics()
web/src\PixiVoxelSceneView.tsx:581:      animated.push({ target: park, mode: "pulse", baseAlpha: 0.82 });
web/src\PixiVoxelSceneView.tsx:582:      world.addChild(park);
web/src\PixiVoxelSceneView.tsx:583:    } else if (object.kind === "landmark") {
web/src\PixiVoxelSceneView.tsx:584:      const landmark = new Graphics()
web/src\PixiVoxelSceneView.tsx:591:      world.addChild(landmark);
web/src\PixiVoxelSceneView.tsx:747:    label.anchor.set(0.5);
web/src\PixiVoxelSceneView.tsx:848:  copy.anchor.set(0.5);
web/src\PixiVoxelSceneView.tsx:861:    park: 0x78b957,
web/src\PixiVoxelSceneView.tsx:863:    landmark: 0xe3a23a,
web/src\PixiVoxelSceneView.tsx:872:    park: 0xcce9b5,
web/src\PixiVoxelSceneView.tsx:884:    park: "P",
web/src\CityWorldView.tsx:54:const STICKER_ORDER: VoxelStickerKind[] = ["favorite", "home", "shop", "park", "idea", "question"];
web/src\CityWorldView.tsx:103:  // ringed every house on first paint. The authored HUD default (the landmark)
web/src\CityWorldView.tsx:322:  const terrainTiles = scene.terrainTiles.slice(0, 260);
web/src\CityWorldView.tsx:325:    ...terrainTiles.map((tile) => projectCityWorldPoint(tile.position)),
web/src\CityWorldView.tsx:327:    ...scene.places.map((place) => projectCityWorldPoint(place.anchor)),
web/src\CityWorldView.tsx:352:        {terrainTiles.map((tile) => {
web/src\CityWorldView.tsx:357:              className={`city-world-renderer-fallback-tile terrain-${tile.kind}`}
web/src\CityWorldView.tsx:377:          const point = projectCityWorldPoint(place.anchor);
web/src\CityWorldView.tsx:388: * house, heart, tag, tree, bolt, question.
web/src\CityWorldView.tsx:412:    case "park":
web/src\CityWorldView.tsx:439:    park: "Park",
web/src\CityWorldView.tsx:452:    park: "Park",
web/src\CityWorldView.tsx:454:    landmark: "Landmark",
web/src\styles.css:47:  /* WORLD terrain — original map greens desaturated ~15%. Chrome never uses these. */
web/src\styles.css:48:  --map-terrain-1: #aad48b;
web/src\styles.css:49:  --map-terrain-2: #91c37e;
web/src\styles.css:50:  --map-terrain-3: #82ba87;
web/src\styles.css:220:    linear-gradient(180deg, var(--map-terrain-1) 0%, var(--map-terrain-2) 48%, var(--map-terrain-3) 100%);
web/src\styles.css:1838:.city-world-renderer-fallback-tile.terrain-grass {
web/src\styles.css:1842:.city-world-renderer-fallback-tile.terrain-park {
web/src\styles.css:1846:.city-world-renderer-fallback-tile.terrain-plaza,
web/src\styles.css:1847:.city-world-renderer-fallback-tile.terrain-sidewalk {
web/src\styles.css:1851:.city-world-renderer-fallback-tile.terrain-water {
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:31:  terrainKind: CityWorldTerrainKind | "empty";
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:32:  terrainTileId?: string;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:50:    terrainKinds: Record<string, number>;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:54:    terrainCellCount: number;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:63:    waterEdgeCutRatio: number;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:73:    terrainTiles: number;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:77:    props: number;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:101:  profileId: CityWorldMobileLodBudgetProfileId;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:112:  profileId: CityWorldMobileLodBudgetProfileId;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:124:    profileId: "playable_mobile",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:141:    profileId: "residential_detail_probe",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:157:    profileId: "shell_mobile_empty_state",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:174:    profileId: "hidden_draft_mobile_probe",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:193:  park: "#87b86e",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:195:  water: "#5e9fc5",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:202:  park: 0.08,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:204:  water: -0.35,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:214:  park_basin_shelf: 0.22,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:215:  water_edge_cut: -0.28,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:226:  park_basin_cut_mass: -0.16,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:227:  waterfront_bank_cut_mass: -0.22,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:236:  waterfront_bank_edge: -0.12,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:237:  park_basin_edge: -0.08,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:248:  const terrainByCell = indexTerrainTiles(scene.terrainTiles);
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:257:      const terrainTile = terrainByCell.get(key);
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:261:      const height = deriveCellHeight(terrainTile, lotIds.length, roadIds.length, buildingIds.length);
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:262:      const colorKey = deriveCellColorKey(terrainTile, lotIds.length, roadIds.length, buildingIds.length);
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:263:      const colorHex = terrainTile ? TERRAIN_COLOR_HEX[terrainTile.kind] : TERRAIN_COLOR_HEX.empty;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:273:        terrainKind: terrainTile?.kind ?? "empty",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:274:        ...(terrainTile ? { terrainTileId: terrainTile.id } : {}),
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:282:  const terrainCellCount = cells.filter((cell) => cell.terrainKind !== "empty").length;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:283:  const emptyCellCount = cells.length - terrainCellCount;
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:286:  const waterCells = cells.filter((cell) => cell.terrainKind === "water");
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:287:  const waterEdgeCutCells = waterCells.filter((cell) => cell.height <= TERRAIN_BASE_HEIGHT.water - 0.1);
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:291:  const terrainKinds = countBy(cells, (cell) => cell.terrainKind);
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:305:      terrainKinds,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:309:      terrainCellCount,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:318:      waterEdgeCutRatio: waterCells.length === 0 ? 1 : roundTerrainMetric(waterEdgeCutCells.length / waterCells.length),
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:330:  const terrainTiles = scene.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:334:  const props = scene.props.filter((prop) => cityWorldPointInsideFrame(prop.position, frame));
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:335:  const pins = scene.pins.filter((pin) => cityWorldPointInsideFrame(pin.anchor, frame));
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:342:  const traySafeBandPressureRatio = deriveTraySafeBandPressure(frame, lots, roads, buildings, props, pins, actors);
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:359:      terrainTiles: terrainTiles.length,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:363:      props: props.length,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:420:    profileId: budget.profileId,
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:444:  const terrainHeight = TERRAIN_BASE_HEIGHT[kind] +
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:445:    lookupHeight(TERRAIN_ELEVATION_HEIGHT, grammar?.terrainElevation) +
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:446:    lookupHeight(TERRAIN_MASSING_HEIGHT, grammar?.terrainChunkMassing) +
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:449:  return roundTerrainMetric(cityWorldClamp(terrainHeight + occupancyHeight, -1, 3));
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:458:    grammar?.terrainComposition ?? "none",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:459:    grammar?.terrainElevation ?? "none",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:460:    grammar?.terrainChunkMassing ?? "none",
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:487:  props: readonly CityWorldProp[],
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:498:  const markerPressure = props.filter((prop) => prop.position.y >= bandMinY).length * 0.16 +
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts:499:    pins.filter((pin) => pin.anchor.y >= bandMinY).length * 0.5 +
packages/core/src/voxel\cityWorldAtlas.ts:3:export type CityWorldAtlasKind = "terrain" | "road" | "lot" | "building" | "prop" | "actor" | "marker" | "label";
packages/core/src/voxel\cityWorldAtlas.ts:5:export type CityWorldAtlasFallbackKind = "terrain" | "road" | "lot" | "building" | "prop" | "actor" | "marker";
packages/core/src/voxel\cityWorldAtlas.ts:35:  anchor: CityWorldAtlasAnchor;
packages/core/src/voxel\cityWorldAtlas.ts:43:  kind: "grass" | "park" | "plaza" | "water" | "sidewalk" | "road";
packages/core/src/voxel\cityWorldAtlas.ts:46:  anchor: CityWorldAtlasAnchor;
packages/core/src/voxel\cityWorldAtlas.ts:78:  "terrain:grass",
packages/core/src/voxel\cityWorldAtlas.ts:79:  "terrain:park",
packages/core/src/voxel\cityWorldAtlas.ts:80:  "terrain:plaza",
packages/core/src/voxel\cityWorldAtlas.ts:81:  "terrain:water",
packages/core/src/voxel\cityWorldAtlas.ts:82:  "road:street",
packages/core/src/voxel\cityWorldAtlas.ts:86:  "lot:park",
packages/core/src/voxel\cityWorldAtlas.ts:92:  "prop:tree",
packages/core/src/voxel\cityWorldAtlas.ts:93:  "prop:water",
packages/core/src/voxel\cityWorldAtlas.ts:175:    ...scene.terrainTiles,
packages/core/src/voxel\cityWorldAtlas.ts:179:    ...scene.props,
packages/core/src/voxel\cityWorldAtlas.ts:232:  if (!isAllowedKind(value.kind, ["terrain", "road", "lot", "building", "prop", "actor", "marker", "label"])) {
packages/core/src/voxel\cityWorldAtlas.ts:235:  if (!isAllowedKind(value.fallback, ["terrain", "road", "lot", "building", "prop", "actor", "marker"])) {
packages/core/src/voxel\cityWorldAtlas.ts:238:  validateAnchor(value.anchor, `Sprite ${key}`, errors);
packages/core/src/voxel\cityWorldAtlas.ts:250:  if (!isAllowedKind(value.kind, ["grass", "park", "plaza", "water", "sidewalk", "road"])) {
packages/core/src/voxel\cityWorldAtlas.ts:254:  validateAnchor(value.anchor, `Tile ${key}`, errors);
packages/core/src/voxel\cityWorldAtlas.ts:261:    errors.push(`${label} anchor is required.`);
packages/core/src/voxel\cityWorldAtlas.ts:264:  validateFiniteNumber(value.x, `${label} anchor.x`, errors);
packages/core/src/voxel\cityWorldAtlas.ts:265:  validateFiniteNumber(value.y, `${label} anchor.y`, errors);
packages/core/src/voxel\cityWorldGeneratedDistrict.ts:63:      "provider-normalized local anchors are not approved",
packages/core/src/voxel\cityWorldCountyParameters.ts:30:  | "mesa"
packages/core/src/voxel\cityWorldCountyParameters.ts:34:  | "river"
packages/core/src/voxel\cityWorldCountyParameters.ts:65:  waterAffinity: number;
packages/core/src/voxel\cityWorldCountyParameters.ts:270:  mesa: ["mesa"],
packages/core/src/voxel\cityWorldCountyParameters.ts:274:  river: ["river", "rivers", "rio"],
packages/core/src/voxel\cityWorldCountyParameters.ts:280:const WATER_DEPENDENT_ARCHETYPES = ["coastal_grid", "river_town"] as const;
packages/core/src/voxel\cityWorldCountyParameters.ts:322:    archetype: "river_town",
packages/core/src/voxel\cityWorldCountyParameters.ts:352:      bonusZone: { id: "water-edge", kind: "water", rect: { minX: 37, minY: 20, maxX: 43, maxY: 31 }, label: "Coastal edge" },
packages/core/src/voxel\cityWorldCountyParameters.ts:353:      bonusRoad: { id: "gen-road-water-edge", kind: "driveway", from: { x: 34, y: 24 }, to: { x: 41, y: 24 } },
packages/core/src/voxel\cityWorldCountyParameters.ts:384:      bonusZone: { id: "ridge-commons", kind: "park", rect: { minX: 34, minY: 21, maxX: 41, maxY: 29 }, label: "Ridge commons", elevationBoost: 0.25 },
packages/core/src/voxel\cityWorldCountyParameters.ts:400:      bonusRoad: { id: "gen-road-grid-north", kind: "street", from: { x: 4, y: 8 }, to: { x: 38, y: 8 } },
packages/core/src/voxel\cityWorldCountyParameters.ts:409:  river_town: {
packages/core/src/voxel\cityWorldCountyParameters.ts:410:    archetype: "river_town",
packages/core/src/voxel\cityWorldCountyParameters.ts:411:    palette: REGIONAL_PALETTES.river_town,
packages/core/src/voxel\cityWorldCountyParameters.ts:414:      bonusZone: { id: "water-edge", kind: "water", rect: { minX: 37, minY: 20, maxX: 43, maxY: 31 }, label: "River edge" },
packages/core/src/voxel\cityWorldCountyParameters.ts:415:      bonusRoad: { id: "gen-road-water-edge", kind: "driveway", from: { x: 34, y: 24 }, to: { x: 41, y: 24 } },
packages/core/src/voxel\cityWorldCountyParameters.ts:516:  const waterSignal = waterNameSignalWeight(nameSignal);
packages/core/src/voxel\cityWorldCountyParameters.ts:523:      (nameSignal.some((signal) => signal === "desert" || signal === "mesa") ? 0.08 : 0) -
packages/core/src/voxel\cityWorldCountyParameters.ts:524:      waterSignal * 0.12,
packages/core/src/voxel\cityWorldCountyParameters.ts:579:  const anchors = [
packages/core/src/voxel\cityWorldCountyParameters.ts:588:  if (latitude <= anchors[0].latitude) return anchors[0].longitude;
packages/core/src/voxel\cityWorldCountyParameters.ts:589:  for (let index = 0; index < anchors.length - 1; index += 1) {
packages/core/src/voxel\cityWorldCountyParameters.ts:590:    const first = anchors[index]!;
packages/core/src/voxel\cityWorldCountyParameters.ts:591:    const second = anchors[index + 1]!;
packages/core/src/voxel\cityWorldCountyParameters.ts:597:  return anchors[anchors.length - 1]!.longitude;
packages/core/src/voxel\cityWorldCountyParameters.ts:614:function waterNameSignalWeight(signals: readonly NameSignal[]): number {
packages/core/src/voxel\cityWorldCountyParameters.ts:615:  return signals.some((signal) => ["bay", "beach", "creek", "falls", "harbor", "island", "lake", "port", "river"].includes(signal))
packages/core/src/voxel\cityWorldCountyParameters.ts:629:  const waterAffinity = clamp01(
packages/core/src/voxel\cityWorldCountyParameters.ts:630:    waterNameSignalWeight(nameSignal) +
packages/core/src/voxel\cityWorldCountyParameters.ts:634:  const dryReliefBoost = climate.aridity === "arid" || nameSignal.includes("mesa") || nameSignal.includes("desert") ? 0.035 : 0;
packages/core/src/voxel\cityWorldCountyParameters.ts:637:    (waterAffinity >= 0.75 ? 1 : 0)) %
packages/core/src/voxel\cityWorldCountyParameters.ts:643:    densityScale: roundModulator(clamp(1 + regionProfile.vegetationBias * 0.16 - aridityLift + waterAffinity * 0.025 + seedMicroVariation, 0.94, 1.06)),
packages/core/src/voxel\cityWorldCountyParameters.ts:650:          (nameSignal.includes("mesa") ? 0.05 : 0) -
packages/core/src/voxel\cityWorldCountyParameters.ts:651:          waterAffinity * 0.025,
packages/core/src/voxel\cityWorldCountyParameters.ts:661:    vegetationDensity: roundModulator(clamp01(0.5 + regionProfile.vegetationBias - aridityLift + waterAffinity * 0.08)),
packages/core/src/voxel\cityWorldCountyParameters.ts:662:    waterAffinity,
packages/core/src/voxel\cityWorldObjectKit.ts:18:  landmarkSignatureScore: number | null;
packages/core/src/voxel\cityWorldObjectKit.ts:41:    landmarkSignatureScore: number;
packages/core/src/voxel\cityWorldObjectKit.ts:42:    terrainMassingCoverageRatio: number;
packages/core/src/voxel\cityWorldObjectKit.ts:54:  "civic_landmark",
packages/core/src/voxel\cityWorldObjectKit.ts:78:    ...(prefabFamily === "commerce_strip" || prefabFamily === "service_gym" || prefabFamily === "civic_landmark" ? ["glass" as const] : []),
packages/core/src/voxel\cityWorldObjectKit.ts:93:  if (prefabFamily === "civic_landmark") {
packages/core/src/voxel\cityWorldObjectKit.ts:95:    metadata.landmarkSignatureScore = civicLandmarkSignatureScore(building, signatureTags);
packages/core/src/voxel\cityWorldObjectKit.ts:130:  const landmarkScores = objectKits
packages/core/src/voxel\cityWorldObjectKit.ts:131:    .filter((kit) => kit.prefabFamily === "civic_landmark")
packages/core/src/voxel\cityWorldObjectKit.ts:132:    .map((kit) => kit.landmarkSignatureScore ?? 0);
packages/core/src/voxel\cityWorldObjectKit.ts:162:      landmarkSignatureScore: roundMetric(Math.min(1, ...landmarkScores, 1)),
packages/core/src/voxel\cityWorldObjectKit.ts:163:      terrainMassingCoverageRatio: diagnostics.metrics.terrainMassingCoverageRatio,
packages/core/src/voxel\cityWorldObjectKit.ts:176:  if (building.kind === "civic" || building.visualGrammar?.objectFamily === "civic_landmark") return "civic_landmark";
packages/core/src/voxel\cityWorldObjectKit.ts:177:  if (building.kind === "shop" || building.facadeStyle === "strip_store" || building.facadeStyle === "storefront") return "commerce_strip";
packages/core/src/voxel\cityWorldObjectKit.ts:178:  if (building.kind === "apartment" || building.facadeStyle === "lowrise") return "lowrise_apartment";
packages/core/src/voxel\cityWorldObjectKit.ts:179:  if (building.kind === "gym" || building.facadeStyle === "fitness" || building.visualGrammar?.objectFamily === "service_block") return "service_gym";
packages/core/src/voxel\cityWorldObjectKit.ts:180:  if (building.facadeStyle === "rowhome") return "residential_rowhome";
packages/core/src/voxel\cityWorldObjectKit.ts:181:  if (building.facadeStyle === "ranch") return "residential_ranch";
packages/core/src/voxel\cityWorldObjectKit.ts:186:  const material = building.visualGrammar?.materialProfile;
packages/core/src/voxel\cityWorldObjectKit.ts:194:  const roof = building.visualGrammar?.roofProfile;
packages/core/src/voxel\cityWorldObjectKit.ts:205:  if (building.roofShape) tags.add(`roof:${building.roofShape}`);
packages/core/src/voxel\cityWorldObjectKit.ts:206:  if (building.facadeStyle) tags.add(`facade:${building.facadeStyle}`);
packages/core/src/voxel\cityWorldObjectKit.ts:210:  if (prefabFamily === "civic_landmark") tags.add("landmark-base");
packages/core/src/voxel\cityWorldObjectKit.ts:248:  const isEastvaleCore = building.id === "building-civic";
packages/core/src/voxel\cityWorldObjectKit.ts:250:    plinthTierCount: isEastvaleCore ? 3 : 2,
packages/core/src/voxel\cityWorldObjectKit.ts:251:    entryBayCount: isEastvaleCore ? 5 : Math.max(3, Math.round(building.width)),
packages/core/src/voxel\cityWorldObjectKit.ts:252:    facadePierCount: isEastvaleCore ? 6 : Math.max(4, Math.round(building.width + 1)),
packages/core/src/voxel\cityWorldObjectKit.ts:253:    glassBandCount: isEastvaleCore ? 3 : 2,
packages/core/src/voxel\cityWorldObjectKit.ts:254:    roofCapWeight: isEastvaleCore ? 1.24 : 0.84,
packages/core/src/voxel\cityWorldObjectKit.ts:255:    civicCanopyDepth: isEastvaleCore ? 0.34 : 0.24,
packages/core/src/voxel\cityWorldObjectKit.ts:256:    ...(isEastvaleCore ? { focusTarget: "eastvale_core" as const } : {}),
packages/core/src/voxel\cityWorldObjectKit.ts:261:  const isEastvaleGym = building.id === "building-gym";
packages/core/src/voxel\cityWorldObjectKit.ts:263:    serviceBayCount: isEastvaleGym ? 4 : Math.max(3, Math.round(building.width)),
packages/core/src/voxel\cityWorldObjectKit.ts:264:    sawtoothCount: isEastvaleGym ? 5 : 3,
packages/core/src/voxel\cityWorldObjectKit.ts:265:    entryRecessDepth: isEastvaleGym ? 0.34 : 0.22,
packages/core/src/voxel\cityWorldObjectKit.ts:266:    utilityApronDepth: isEastvaleGym ? 0.42 : 0.26,
packages/core/src/voxel\cityWorldObjectKit.ts:267:    roofMonitorWeight: isEastvaleGym ? 1.18 : 0.82,
packages/core/src/voxel\cityWorldObjectKit.ts:268:    ...(isEastvaleGym ? { focusTarget: "eastvale_gym" as const } : {}),
packages/core/src/voxel\cityWorldObjectKit.ts:280:    building.facadeStyle ?? "none",
packages/core/src/voxel\cityWorldObjectKit.ts:281:    building.roofShape ?? "none",
packages/core/src/voxel\cityWorldObjectKit.ts:290:  const hasAnchorRole = building.visualGrammar?.clusterRole === "anchor" ? 1 : 0;
packages/core/src/voxel\cityWorldObjectKit.ts:291:  const hasCivicFacade = building.facadeStyle === "civic" ? 1 : 0;
packages/core/src/voxel\cityWorldObjectKit.ts:317:    landmarkSignatureScore: prefabFamily === "civic_landmark" ? roundMetric(Math.min(1, ...familyKits.map((kit) => kit.landmarkSignatureScore ?? 0), 1)) : null,
packages/core/src/voxel\cityWorldObjectKit.ts:326:  const landmark = metric.landmarkSignatureScore ?? 1;
packages/core/src/voxel\cityWorldObjectKit.ts:327:  return presence * 0.32 + palette * 0.2 + separation * 0.2 + clone * 0.18 + landmark * 0.1;
packages/core/src/voxel\cityWorldDiagnostics.ts:19:  | "terrain_massing"
packages/core/src/voxel\cityWorldDiagnostics.ts:43:    terrainTiles: number;
packages/core/src/voxel\cityWorldDiagnostics.ts:47:    props: number;
packages/core/src/voxel\cityWorldDiagnostics.ts:53:    terrainChunkMassing: Record<string, number>;
packages/core/src/voxel\cityWorldDiagnostics.ts:54:    terrainComposition: Record<string, number>;
packages/core/src/voxel\cityWorldDiagnostics.ts:55:    terrainElevation: Record<string, number>;
packages/core/src/voxel\cityWorldDiagnostics.ts:68:    terrainMassingCoverageRatio: number;
packages/core/src/voxel\cityWorldDiagnostics.ts:69:    terrainAuthoredCoverageRatio: number;
packages/core/src/voxel\cityWorldDiagnostics.ts:107:export type CityWorldCivicVenueStressCellKind = "public_civic_landmark" | "hidden_venue_anchor";
packages/core/src/voxel\cityWorldDiagnostics.ts:124:  terrainTilesInFrame: number;
packages/core/src/voxel\cityWorldDiagnostics.ts:125:  terrainMassingVisibleRatio: number;
packages/core/src/voxel\cityWorldDiagnostics.ts:127:  terrainElevationVisibleRatio: number;
packages/core/src/voxel\cityWorldDiagnostics.ts:138:  const terrainMassing = countBy(scene.terrainTiles, (tile) => tile.visualGrammar?.terrainChunkMassing ?? "none");
packages/core/src/voxel\cityWorldDiagnostics.ts:139:  const terrainComposition = countBy(scene.terrainTiles, (tile) => tile.visualGrammar?.terrainComposition ?? "none");
packages/core/src/voxel\cityWorldDiagnostics.ts:140:  const terrainElevation = countBy(scene.terrainTiles, (tile) => tile.visualGrammar?.terrainElevation ?? "none");
packages/core/src/voxel\cityWorldDiagnostics.ts:142:  const roadContactProfiles = countBy(scene.roadSegments, (road) => road.visualGrammar?.roadContact?.profile ?? "none");
packages/core/src/voxel\cityWorldDiagnostics.ts:144:  const lotContactProfiles = countBy(scene.lots, (lot) => lot.visualGrammar?.lotContact?.profile ?? "none");
packages/core/src/voxel\cityWorldDiagnostics.ts:149:  const spriteKeys = countBy([...scene.terrainTiles, ...scene.roadSegments, ...scene.lots, ...scene.buildings, ...scene.props, ...scene.actors, ...scene.pins], (item) => item.spriteKey ?? "primitive");
packages/core/src/voxel\cityWorldDiagnostics.ts:151:  const authoredTerrainCount = scene.terrainTiles.filter(isAuthoredCityWorldTerrainTile).length;
packages/core/src/voxel\cityWorldDiagnostics.ts:152:  const emptyTerrainCount = scene.terrainTiles.filter((tile) => isEmptyCityWorldBoardTerrainTile(tile, scene)).length;
packages/core/src/voxel\cityWorldDiagnostics.ts:164:  const authoredTerrainContacts = scene.terrainTiles.filter((tile) => Boolean(tile.visualGrammar?.terrainContact)).length;
packages/core/src/voxel\cityWorldDiagnostics.ts:167:  const curbCutEligibleLots = scene.lots.filter((lot) => lot.visualGrammar?.lotContact && lot.visualGrammar.lotContact.profile !== "shore");
packages/core/src/voxel\cityWorldDiagnostics.ts:172:  const noLabelPrimaryBuildings = scene.buildings.filter((building) => building.visualGrammar?.noLabelPriority === "primary_anchor");
packages/core/src/voxel\cityWorldDiagnostics.ts:193:    terrainMassingCoverageRatio: ratio(nonNoneCount(terrainMassing), scene.terrainTiles.length),
packages/core/src/voxel\cityWorldDiagnostics.ts:194:    terrainAuthoredCoverageRatio: ratio(authoredTerrainCount, scene.terrainTiles.length),
packages/core/src/voxel\cityWorldDiagnostics.ts:195:    emptyBoardRatio: ratio(emptyTerrainCount, scene.terrainTiles.length),
packages/core/src/voxel\cityWorldDiagnostics.ts:199:    authoredTerrainContactRatio: ratio(authoredTerrainContacts, scene.terrainTiles.length),
packages/core/src/voxel\cityWorldDiagnostics.ts:209:    noLabelPrimaryAnchorCount: noLabelPriority.primary_anchor ?? 0,
packages/core/src/voxel\cityWorldDiagnostics.ts:239:      terrainTiles: scene.terrainTiles.length,
packages/core/src/voxel\cityWorldDiagnostics.ts:243:      props: scene.props.length,
packages/core/src/voxel\cityWorldDiagnostics.ts:249:      terrainChunkMassing: terrainMassing,
packages/core/src/voxel\cityWorldDiagnostics.ts:250:      terrainComposition,
packages/core/src/voxel\cityWorldDiagnostics.ts:251:      terrainElevation,
packages/core/src/voxel\cityWorldDiagnostics.ts:283:  // 0.74F clutter-contract revision (user-approved): the curated prop kit
packages/core/src/voxel\cityWorldDiagnostics.ts:284:  // (bench, streetlight, fountain, sign, dock, boat, water tower) is public;
packages/core/src/voxel\cityWorldDiagnostics.ts:287:  const propKinds = new Set(scene.props.map((prop) => prop.kind));
packages/core/src/voxel\cityWorldDiagnostics.ts:288:  for (const forbiddenProp of ["parked_car", "cloud"] as const) {
packages/core/src/voxel\cityWorldDiagnostics.ts:289:    if (propKinds.has(forbiddenProp)) {
packages/core/src/voxel\cityWorldDiagnostics.ts:290:      hardBlockers.push({ axis: "boundary", code: `FORBIDDEN_${forbiddenProp.toUpperCase()}`, message: `Scene emits forbidden decorative prop ${forbiddenProp}.` });
packages/core/src/voxel\cityWorldDiagnostics.ts:326:    warnBelow(warnings, "terrain_massing", "LOW_TERRAIN_MASSING", metrics.terrainMassingCoverageRatio, 0.08, "Playable scene has too little terrain chunk massing.");
packages/core/src/voxel\cityWorldDiagnostics.ts:330:    warnBelow(warnings, "contact", "LOW_AUTHORED_TERRAIN_CONTACT", metrics.authoredTerrainContactRatio, 1, "Playable terrain tiles are missing compiler-authored contact metadata.");
packages/core/src/voxel\cityWorldDiagnostics.ts:345:    warnBelow(warnings, "no_label", "LOW_PRIMARY_ANCHORS", metrics.noLabelPrimaryAnchorCount, 2, "Hidden draft has fewer than two no-label primary anchors.");
packages/core/src/voxel\cityWorldDiagnostics.ts:346:    warnBelow(warnings, "no_label", "LOW_TARGET_FAMILY_COVERAGE", metrics.noLabelTargetFamilyCoverageRatio, 1, "Hidden draft no-label targets do not cover the required anchor families.");
packages/core/src/voxel\cityWorldDiagnostics.ts:347:    warnBelow(warnings, "no_label", "LOW_ANCHOR_SEPARATION", metrics.noLabelAnchorSeparationScore, 0.72, "Hidden draft no-label anchor families are not structurally separated enough.");
packages/core/src/voxel\cityWorldDiagnostics.ts:348:    warnBelow(warnings, "source_contrast", "LOW_HIDDEN_ANCHOR_CONTRAST", metrics.hiddenAnchorContrastScore, 0.68, "Hidden draft no-label anchors do not have enough source-art contrast.");
packages/core/src/voxel\cityWorldDiagnostics.ts:396:    ["terrain_massing", metrics.terrainMassingCoverageRatio],
packages/core/src/voxel\cityWorldDiagnostics.ts:406:    ["terrain_massing", metrics.chunkEdgeReadabilityFloorScore],
packages/core/src/voxel\cityWorldDiagnostics.ts:445:    Boolean(building.facadeStyle),
packages/core/src/voxel\cityWorldDiagnostics.ts:446:    Boolean(building.roofShape),
packages/core/src/voxel\cityWorldDiagnostics.ts:447:    Boolean(building.visualGrammar?.materialProfile),
packages/core/src/voxel\cityWorldDiagnostics.ts:448:    Boolean(building.visualGrammar?.roofProfile),
packages/core/src/voxel\cityWorldDiagnostics.ts:466:  return Boolean(score.building.roofShape && score.building.visualGrammar?.roofProfile && score.building.visualGrammar?.materialProfile && score.roofBodySeparationScore >= 0.9);
packages/core/src/voxel\cityWorldDiagnostics.ts:470:  return Boolean(score.building.facadeStyle && score.building.visualGrammar?.objectFamily && score.grammarRichnessScore >= 0.86 && score.faceScore >= 0.86);
packages/core/src/voxel\cityWorldDiagnostics.ts:522:    building.facadeStyle ?? "none",
packages/core/src/voxel\cityWorldDiagnostics.ts:523:    building.roofShape ?? "none",
packages/core/src/voxel\cityWorldDiagnostics.ts:524:    building.visualGrammar?.materialProfile ?? "none",
packages/core/src/voxel\cityWorldDiagnostics.ts:525:    building.visualGrammar?.roofProfile ?? "none",
packages/core/src/voxel\cityWorldDiagnostics.ts:548:  const primaryAnchorRatio = ratio(buildings.filter((building) => building.visualGrammar?.noLabelPriority === "primary_anchor").length, buildings.length);
packages/core/src/voxel\cityWorldDiagnostics.ts:551:  const massingScore = cityWorldClamp((cityWorldClamp(maxArea / 8, 0, 1) + cityWorldClamp(maxHeight / 2.8, 0, 1)) / 2, 0, 1);
packages/core/src/voxel\cityWorldDiagnostics.ts:553:  return roundMetric(averageFaceScore * 0.55 + massingScore * 0.25 + primaryAnchorRatio * 0.2);
packages/core/src/voxel\cityWorldDiagnostics.ts:559:      id: "eastvale-core-civic-landmark",
packages/core/src/voxel\cityWorldDiagnostics.ts:560:      label: "Eastvale Core civic landmark",
packages/core/src/voxel\cityWorldDiagnostics.ts:561:      kind: "public_civic_landmark",
packages/core/src/voxel\cityWorldDiagnostics.ts:562:      objectFamily: "civic_landmark",
packages/core/src/voxel\cityWorldDiagnostics.ts:566:      id: "anaheim-convention-center-venue-anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:567:      label: "Anaheim Convention Center venue anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:568:      kind: "hidden_venue_anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:569:      objectFamily: "venue_anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:573:      id: "artic-transit-anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:574:      label: "ARTIC transit anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:575:      kind: "hidden_venue_anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:576:      objectFamily: "transit_anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:580:      id: "angel-stadium-venue-anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:581:      label: "Angel Stadium venue anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:582:      kind: "hidden_venue_anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:583:      objectFamily: "venue_anchor",
packages/core/src/voxel\cityWorldDiagnostics.ts:627:  if (kind === "hidden_venue_anchor") {
packages/core/src/voxel\cityWorldDiagnostics.ts:647:  const roofShapeVariety = new Set(buildings.map((building) => building.roofShape).filter(Boolean)).size;
packages/core/src/voxel\cityWorldDiagnostics.ts:648:  const facadeVariety = new Set(buildings.map((building) => building.facadeStyle).filter(Boolean)).size;
packages/core/src/voxel\cityWorldDiagnostics.ts:649:  const hasAnchorRole = buildings.some((building) => building.visualGrammar?.clusterRole === "anchor");
packages/core/src/voxel\cityWorldDiagnostics.ts:650:  const hasLandmarkContact = buildings.some((building) => building.visualGrammar?.contactProfile === "landmark_base_shadow");
packages/core/src/voxel\cityWorldDiagnostics.ts:654:    cityWorldClamp(roofShapeVariety / 2, 0, 1) * 0.2 +
packages/core/src/voxel\cityWorldDiagnostics.ts:674:  const expectedPriority = kind === "hidden_venue_anchor" ? "primary_anchor" : "supporting";
packages/core/src/voxel\cityWorldDiagnostics.ts:680:  const labelIndependence = buildings.every((building) => building.facadeStyle && building.roofShape && building.visualGrammar?.materialProfile && building.visualGrammar?.roofProfile) ? 1 : 0;
packages/core/src/voxel\cityWorldDiagnostics.ts:689:    const terrainInFrame = sample.terrainTiles;
packages/core/src/voxel\cityWorldDiagnostics.ts:693:    const terrainMassingVisibleRatio = ratio(sample.terrainMassingCount, terrainInFrame.length);
packages/core/src/voxel\cityWorldDiagnostics.ts:694:    const chunkEdgeRatio = ratio(sample.chunkEdgeCount, terrainInFrame.length);
packages/core/src/voxel\cityWorldDiagnostics.ts:695:    const terrainElevationVisibleRatio = ratio(sample.elevatedTerrainCount, terrainInFrame.length);
packages/core/src/voxel\cityWorldDiagnostics.ts:696:    const chunkEdgeReadabilityScore = roundMetric(chunkEdgeRatio * 0.5 + terrainMassingVisibleRatio * 0.3 + terrainElevationVisibleRatio * 0.2);
packages/core/src/voxel\cityWorldDiagnostics.ts:697:    const featureDensityRatio = cityWorldClamp((lotsInFrame.length + roadsInFrame.length * 2 + buildingsInFrame.length * 3) / Math.max(1, terrainInFrame.length * 0.26), 0, 1);
packages/core/src/voxel\cityWorldDiagnostics.ts:700:    const score = roundMetric(terrainMassingVisibleRatio * 0.25 + featureDensityRatio * 0.45 + objectFamilyScore * 0.3);
packages/core/src/voxel\cityWorldDiagnostics.ts:703:      terrainTilesInFrame: terrainInFrame.length,
packages/core/src/voxel\cityWorldDiagnostics.ts:704:      terrainMassingVisibleRatio: roundMetric(terrainMassingVisibleRatio),
packages/core/src/voxel\cityWorldDiagnostics.ts:706:      terrainElevationVisibleRatio: roundMetric(terrainElevationVisibleRatio),
packages/core/src/voxel\cityWorldDiagnostics.ts:717:  if (scene.id.includes("anaheim-candidate")) return ["venue_anchor", "transit_anchor"];
packages/core/src/voxel\cityWorldDiagnostics.ts:718:  if (scene.id.includes("ontario-candidate")) return ["transit_anchor", "commerce_strip"];
packages/core/src/voxel\cityWorldDiagnostics.ts:724:  if (scene.id.includes("ontario-candidate")) return ["ontario-international-airport", "ontario-mills-commercial-anchor"];
packages/core/src/voxel\cityWorldDiagnostics.ts:778:    building.facadeStyle ?? "none",
packages/core/src/voxel\cityWorldDiagnostics.ts:779:    building.roofShape ?? "none",
packages/core/src/voxel\cityWorldDiagnostics.ts:787:  const objectCount = scene.terrainTiles.length + scene.roadSegments.length + scene.lots.length + scene.buildings.length + scene.props.length + scene.actors.length + scene.pins.length;
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:21:  const profile = profileFor(parameters);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:23:  const context = layoutContext(profile, modulation, seed);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:24:  const bonusZone = cloneZone(bonusZoneFor(parameters, profile.zones.bonusZone), context.densityScale);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:26:  if (profile.archetype === "metro_grid") return metroGridZones(context, bonusZone);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:27:  if (profile.archetype === "desert_basin") return desertBasinZones(context, bonusZone);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:28:  if (profile.archetype === "coastal_grid") return coastalGridZones(context, bonusZone);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:29:  if (profile.archetype === "mountain_valley") return mountainValleyZones(context, bonusZone);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:30:  if (profile.archetype === "prairie_town") return prairieTownZones(context, bonusZone);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:31:  return riverTownZones(context, bonusZone);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:35:  const profile = profileFor(parameters);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:37:  const context = layoutContext(profile, modulation, seed);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:38:  const bonusRoad = cloneRoad(bonusRoadFor(parameters, profile.zones.bonusRoad));
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:40:  if (profile.archetype === "metro_grid") return withBonusRoad(metroGridRoads(context), bonusRoad);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:41:  if (profile.archetype === "desert_basin") return withBonusRoad(desertBasinRoads(context), bonusRoad);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:42:  if (profile.archetype === "coastal_grid") return withBonusRoad(coastalGridRoads(context), bonusRoad);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:43:  if (profile.archetype === "mountain_valley") return withBonusRoad(mountainValleyRoads(context), bonusRoad);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:44:  if (profile.archetype === "prairie_town") return withBonusRoad(prairieTownRoads(context), bonusRoad);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:45:  return riverTownRoads(context);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:49:  profile: ArchetypeProfile;
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:55:  riverAxis: "horizontal" | "vertical";
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:58:  waterAffinity: number;
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:61:function layoutContext(profile: ArchetypeProfile, modulation: CountyGenerationModulation | undefined, seed: number): LayoutContext {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:67:    profile,
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:73:    riverAxis: seed % 2 === 0 ? "horizontal" : "vertical",
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:74:    civicElevationBoost: modulation?.civicElevationBoost ?? profile.zones.civicElevationBoost,
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:76:    waterAffinity: modulation?.waterAffinity ?? 0,
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:90:    zone("metro-main-street", "commercial", { minX: 15, minY: 5, maxX: 25, maxY: 8 }, context, 0.92, "Tight main street"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:109:    zone("desert-civic-mesa", "civic", { minX: 21, minY: 15, maxX: 27, maxY: 21 }, context, undefined, "Mesa civic", context.civicElevationBoost + context.reliefTerraceBoost + 0.05),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:126:    zone("coastal-waterfront-strip", "commercial", { minX: 27, minY: 18, maxX: 34, maxY: 27 }, context, 0.86, "Waterfront strip"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:127:    zone("coastal-main-street", "commercial", { minX: 22, minY: 5, maxX: 34, maxY: 8 }, context, 0.76, "Shore main street"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:130:    zone("coastal-green", "park", { minX: 8, minY: 15, maxX: 15, maxY: 19 }, context, undefined, "Shore green"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:131:    normalizeBonusZone(bonusZone, { minX: 36, minY: 0, maxX: 44, maxY: 32 }, context.waterAffinity >= 0.75 ? "Coastal edge" : "Water edge"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:161:    zone("prairie-main-street", "commercial", { minX: 23, minY: 6, maxX: 35, maxY: 12 }, context, 0.62, "Straight main street"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:165:    zone("prairie-ag-grid", "park", { minX: 35, minY: 22, maxX: 42, maxY: 30 }, context, undefined, "Ag grid"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:170:function riverTownZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:171:  if (context.riverAxis === "vertical") {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:173:      zone("river-common-fill", "green_common", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "River commons"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:174:      zone("river-west-bank-fill", "shore_bank", { minX: 19, minY: 0, maxX: 20, maxY: 32 }, context, undefined, "West bank"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:175:      zone("river-east-bank-fill", "shore_bank", { minX: 26, minY: 0, maxX: 27, maxY: 32 }, context, undefined, "East bank"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:176:      zone("river-west-common-fill", "green_common", { minX: 4, minY: 16, maxX: 18, maxY: 21 }, context, undefined, "West bank commons"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:177:      zone("river-west-homes", "residential", { minX: 4, minY: 5, maxX: 15, maxY: 14 }, context, 0.74, "West bank homes"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:178:      zone("river-south-homes", "residential", { minX: 5, minY: 22, maxX: 17, maxY: 30 }, context, 0.72, "South bank homes"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:179:      zone("river-ferry-market", "commercial", { minX: 27, minY: 4, maxX: 36, maxY: 9 }, context, 0.86, "Ferry market"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:180:      zone("river-main-north", "commercial", { minX: 27, minY: 11, maxX: 36, maxY: 16 }, context, 0.86, "River main north"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:181:      zone("river-main-south", "commercial", { minX: 27, minY: 20, maxX: 36, maxY: 26 }, context, 0.86, "River main south"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:182:      zone("river-dock-district", "commercial", { minX: 16, minY: 22, maxX: 20, maxY: 30 }, context, 0.82, "Dock district"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:183:      zone("river-civic", "civic", { minX: 13, minY: 9, maxX: 19, maxY: 15 }, context, undefined, "River civic", context.civicElevationBoost),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:184:      zone("river-apartments", "apartments", { minX: 28, minY: 20, maxX: 36, maxY: 30 }, context, 0.72, "River flats"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:185:      zone("river-plaza", "plaza", { minX: 9, minY: 16, maxX: 18, maxY: 20 }, context, undefined, "River plaza"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:191:    zone("river-common-base-fill", "green_common", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "River commons"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:192:    zone("river-north-bank-fill", "shore_bank", { minX: 0, minY: 13, maxX: 44, maxY: 14 }, context, undefined, "North bank"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:193:    zone("river-south-bank-fill", "shore_bank", { minX: 0, minY: 21, maxX: 44, maxY: 22 }, context, undefined, "South bank"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:194:    zone("river-common-fill", "green_common", { minX: 5, minY: 11, maxX: 21, maxY: 14 }, context, undefined, "River commons"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:195:    zone("river-west-homes", "residential", { minX: 5, minY: 5, maxX: 18, maxY: 14 }, context, 0.74, "West bank homes"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:196:    zone("river-south-homes", "residential", { minX: 6, minY: 23, maxX: 21, maxY: 30 }, context, 0.72, "South bank homes"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:197:    zone("river-ferry-market", "commercial", { minX: 25, minY: 4, maxX: 34, maxY: 9 }, context, 0.86, "Ferry market"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:198:    zone("river-main-north", "commercial", { minX: 25, minY: 10, maxX: 34, maxY: 13 }, context, 0.86, "River main north"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:199:    zone("river-main-south", "commercial", { minX: 25, minY: 22, maxX: 34, maxY: 27 }, context, 0.86, "River main south"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:200:    zone("river-dock-district", "commercial", { minX: 29, minY: 21, maxX: 34, maxY: 24 }, context, 0.82, "Dock district"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:201:    zone("river-east-market", "commercial", { minX: 36, minY: 22, maxX: 43, maxY: 30 }, context, 1.08, "East bank market"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:202:    zone("river-civic", "civic", { minX: 13, minY: 8, maxX: 19, maxY: 13 }, context, undefined, "River civic", context.civicElevationBoost),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:203:    zone("river-apartments", "apartments", { minX: 23, minY: 23, maxX: 31, maxY: 30 }, context, 0.72, "River flats"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:204:    zone("river-plaza", "plaza", { minX: 10, minY: 21, maxX: 19, maxY: 24 }, context, undefined, "River plaza"),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:213:    road("gen-road-metro-south", "street", 3, 25, 41, 25),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:214:    road("gen-road-metro-west", "street", 14 + context.xShift, 4, 14 + context.xShift, 29),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:216:    road("gen-road-metro-east", "street", 35, 5, 35, 29),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:224:    road("gen-road-desert-south", "street", 5, 22, 42, 22),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:235:    road("gen-road-coastal-north", "street", 4, 9 + context.yShift, shoreX, 9 + context.yShift),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:237:    road("gen-road-coastal-south", "street", 5, 25, shoreX, 25),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:238:    road("gen-road-coastal-back", "street", 21 + context.xShift, 5, 21 + context.xShift, 29),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:245:    road("gen-road-mountain-upper-contour", "street", 4, 13 + context.yShift, 24, 13 + context.yShift),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:247:    road("gen-road-mountain-lower-contour", "street", 18, 30, 41, 30),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:248:    road("gen-road-mountain-switchback", "street", 24 + context.xShift, 8, 24 + context.xShift, 27),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:258:    road("gen-road-prairie-south", "street", 3, 30, 42, 30),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:259:    road("gen-road-prairie-section", "street", 22 + context.xShift, 4, 22 + context.xShift, 30),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:260:    road("gen-road-prairie-east-section", "street", 36, 4, 36, 30),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:265:function riverTownRoads(context: LayoutContext): CityWorldRoadSeed[] {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:266:  if (context.riverAxis === "vertical") {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:268:      road("gen-road-river-west-bank", "avenue", 18, 5, 18, 30),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:269:      road("gen-road-river-east-bank", "avenue", 28, 5, 28, 30),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:270:      road("gen-road-river-north-cross", "street", 5, 10 + context.yShift, 39, 10 + context.yShift),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:271:      road("gen-road-river-mid-cross", "avenue", 6, 18, 39, 18),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:272:      road("gen-road-river-dock-cross", "street", 6, 26, 39, 26),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:273:      road("gen-cross-river-bridge", "crosswalk", 20, 18, 26, 18),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:278:    road("gen-road-river-main", "avenue", 34, 5, 34, 30),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:279:    road("gen-road-river-west", "street", 22 + context.xShift, 5, 22 + context.xShift, 29),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:280:    road("gen-road-river-north-cross", "street", 5, 10 + context.yShift, 36, 10 + context.yShift),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:281:    road("gen-road-river-mid-cross", "avenue", 6, 18, 36, 18),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:282:    road("gen-road-river-dock-cross", "street", 6, 31, 37, 31),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:283:    road("gen-cross-river-bridge", "crosswalk", 34, 14, 34, 21),
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:291:  const profile = profileFor(parameters);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:297:    values: profile.heightGrid.map((row, rowIndex) =>
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:301:            archetypeReliefValue(profile.archetype, value, rowIndex, columnIndex, profile.heightGrid.length, row.length) * reliefScale +
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:303:              edgeReliefBoost(parameters, rowIndex, columnIndex, profile.heightGrid.length, row.length) +
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:342:  if (archetype === "river_town") {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:350:function profileFor(parameters: GeneratedDistrictArchetype | CountyGenerationParameters): ArchetypeProfile {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:431:      throw new Error(`Water-dependent archetype ${parameters.archetype} cannot strip water for arid county parameters`);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:433:    return fallback.kind === "water" ? fallback : waterEdgeBonusZone(parameters.archetype);
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:435:  if (parameters.modulation.waterAffinity >= 0.75 && parameters.climate.aridity !== "arid" && parameters.archetype !== "desert_basin") {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:437:      id: "water-edge",
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:438:      kind: "water",
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:440:      label: parameters.archetype === "river_town" ? "River edge" : parameters.archetype === "coastal_grid" ? "Coastal edge" : "Water edge",
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:443:  if (parameters.climate.aridity === "arid" || parameters.nameSignal.includes("mesa") || parameters.nameSignal.includes("desert")) {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:455:function waterEdgeBonusZone(archetype: GeneratedDistrictArchetype): CityWorldZoneSpec {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:457:    id: "water-edge",
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:458:    kind: "water",
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:460:    label: archetype === "river_town" ? "River edge" : archetype === "coastal_grid" ? "Coastal edge" : "Water edge",
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:470:  if (bonusZone.kind === "water") {
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts:471:    return { id: "gen-road-water-edge", kind: "driveway", from: { x: 34, y: 24 }, to: { x: 41, y: 24 } };
packages/core/src/voxel\cityWorldGeneratedDistrictTypes.ts:12:  | "river_town";
packages/core/src/voxel\cityWorldRegionalPalettes.ts:9:  "river_town",
packages/core/src/voxel\cityWorldRegionalPalettes.ts:17:  terrainTone: {
packages/core/src/voxel\cityWorldRegionalPalettes.ts:31:    terrainTone: {
packages/core/src/voxel\cityWorldRegionalPalettes.ts:32:      paletteKey: "terrain.region.metro_grid",
packages/core/src/voxel\cityWorldRegionalPalettes.ts:43:    terrainTone: {
packages/core/src/voxel\cityWorldRegionalPalettes.ts:44:      paletteKey: "terrain.region.coastal_grid",
packages/core/src/voxel\cityWorldRegionalPalettes.ts:55:    terrainTone: {
packages/core/src/voxel\cityWorldRegionalPalettes.ts:56:      paletteKey: "terrain.region.desert_basin",
packages/core/src/voxel\cityWorldRegionalPalettes.ts:67:    terrainTone: {
packages/core/src/voxel\cityWorldRegionalPalettes.ts:68:      paletteKey: "terrain.region.mountain_valley",
packages/core/src/voxel\cityWorldRegionalPalettes.ts:79:    terrainTone: {
packages/core/src/voxel\cityWorldRegionalPalettes.ts:80:      paletteKey: "terrain.region.prairie_town",
packages/core/src/voxel\cityWorldRegionalPalettes.ts:87:  river_town: {
packages/core/src/voxel\cityWorldRegionalPalettes.ts:88:    archetype: "river_town",
packages/core/src/voxel\cityWorldRegionalPalettes.ts:91:    terrainTone: {
packages/core/src/voxel\cityWorldRegionalPalettes.ts:92:      paletteKey: "terrain.region.river_town",
packages/core/src/voxel\cityWorldRegionalPalettes.ts:106:  return REGIONAL_PALETTES[archetype].terrainTone.paletteKey;
packages/core/src/voxel\cityWorldCompiler.ts:37:  "place-community-park": { x: 18, y: 20, z: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:47:  const districtLabel = selectedDistrict?.label ?? "Eastvale";
packages/core/src/voxel\cityWorldCompiler.ts:58:    label: "Eastvale City Map",
packages/core/src/voxel\cityWorldCompiler.ts:96:    terrainTiles: createTerrainTiles(),
packages/core/src/voxel\cityWorldCompiler.ts:100:    props: createProps(),
packages/core/src/voxel\cityWorldCompiler.ts:107:      waterShimmer: 0.72,
packages/core/src/voxel\cityWorldCompiler.ts:154:    terrainTiles: createShellTerrainTiles(),
packages/core/src/voxel\cityWorldCompiler.ts:158:    props: [],
packages/core/src/voxel\cityWorldCompiler.ts:168:      waterShimmer: 0,
packages/core/src/voxel\cityWorldCompiler.ts:179:  anchorPack: DistrictPlaceAnchorPack;
packages/core/src/voxel\cityWorldCompiler.ts:183:  const { anchorPack } = input;
packages/core/src/voxel\cityWorldCompiler.ts:184:  const anchors = anchorPack.placeAnchors.filter((anchor) => anchor.anchorRole !== "district_identity");
packages/core/src/voxel\cityWorldCompiler.ts:185:  const profile = createDraftDistrictProfile(anchorPack);
packages/core/src/voxel\cityWorldCompiler.ts:186:  const anchorPositions = createDraftAnchorPositions(anchors, profile);
packages/core/src/voxel\cityWorldCompiler.ts:187:  const draftRoadSegments = createDraftDistrictRoadSegments(profile);
packages/core/src/voxel\cityWorldCompiler.ts:191:    id: `city-world-draft-${anchorPack.countySlug}-${anchorPack.districtSlug}`,
packages/core/src/voxel\cityWorldCompiler.ts:192:    sourceSceneId: `district-anchor-draft-${anchorPack.countySlug}-${anchorPack.districtSlug}`,
packages/core/src/voxel\cityWorldCompiler.ts:193:    label: `${anchorPack.districtSlug} Draft Scene`,
packages/core/src/voxel\cityWorldCompiler.ts:195:      countySlug: anchorPack.countySlug,
packages/core/src/voxel\cityWorldCompiler.ts:198:      coverageMessage: "Source-noted anchors exist, but this district is not playable or public-quality yet.",
packages/core/src/voxel\cityWorldCompiler.ts:203:      state: anchorPack.stateCode,
packages/core/src/voxel\cityWorldCompiler.ts:204:      county: profile.countyLabel,
packages/core/src/voxel\cityWorldCompiler.ts:205:      district: anchorPack.districtSlug,
packages/core/src/voxel\cityWorldCompiler.ts:225:        center: anchorPositions.get(profile.detailCameraAnchorId) ?? { x: 12, y: 9, z: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:231:    terrainTiles: createDraftDistrictTerrainTiles(profile),
packages/core/src/voxel\cityWorldCompiler.ts:233:    lots: createDraftDistrictLots(anchors, anchorPositions, draftRoadSegments),
packages/core/src/voxel\cityWorldCompiler.ts:234:    buildings: createDraftDistrictBuildings(anchors, anchorPositions),
packages/core/src/voxel\cityWorldCompiler.ts:235:    props: [],
packages/core/src/voxel\cityWorldCompiler.ts:236:    places: createDraftDistrictPlaces(anchors, anchorPositions, anchorPack.districtSlug),
packages/core/src/voxel\cityWorldCompiler.ts:245:      waterShimmer: 0,
packages/core/src/voxel\cityWorldCompiler.ts:248:      locationLabel: profile.countyLabel,
packages/core/src/voxel\cityWorldCompiler.ts:249:      districtLabel: profile.districtLabel,
packages/core/src/voxel\cityWorldCompiler.ts:262:    anchor: PLACE_ANCHORS[place.id] ?? { x: 12 + index * 3, y: 12 + index, z: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:263:    hitRadius: place.kind === "park" ? 3.8 : 2.8,
packages/core/src/voxel\cityWorldCompiler.ts:276:  terrainStyle: DraftDistrictTerrainStyle;
packages/core/src/voxel\cityWorldCompiler.ts:281:function createDraftDistrictProfile(anchorPack: DistrictPlaceAnchorPack): DraftDistrictProfile {
packages/core/src/voxel\cityWorldCompiler.ts:282:  if (anchorPack.districtSlug === "ontario-candidate") {
packages/core/src/voxel\cityWorldCompiler.ts:285:      districtLabel: "Ontario candidate draft",
packages/core/src/voxel\cityWorldCompiler.ts:286:      detailCameraAnchorId: "ontario-mills-commercial-anchor",
packages/core/src/voxel\cityWorldCompiler.ts:287:      terrainStyle: "inland-logistics",
packages/core/src/voxel\cityWorldCompiler.ts:290:        "ontario-mills-commercial-anchor": { x: 18.4, y: 11.4, z: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:298:        { id: "draft-road-civic-spine", kind: "street", from: { x: 13, y: 7, z: 0 }, to: { x: 13, y: 21, z: 0 }, width: 1.45 },
packages/core/src/voxel\cityWorldCompiler.ts:299:        { id: "draft-road-residential-grid", kind: "street", from: { x: 5, y: 10, z: 0 }, to: { x: 18, y: 10, z: 0 }, width: 1.35 },
packages/core/src/voxel\cityWorldCompiler.ts:309:    districtLabel: "Anaheim candidate draft",
packages/core/src/voxel\cityWorldCompiler.ts:311:    terrainStyle: "resort-venue",
packages/core/src/voxel\cityWorldCompiler.ts:322:      { id: "draft-road-transit-edge", kind: "street", from: { x: 24, y: 9, z: 0 }, to: { x: 24, y: 20, z: 0 }, width: 1.45 },
packages/core/src/voxel\cityWorldCompiler.ts:330:function createDraftAnchorPositions(anchors: DistrictPlaceAnchor[], profile: DraftDistrictProfile): Map<string, CityWorldPoint> {
packages/core/src/voxel\cityWorldCompiler.ts:341:  anchors.forEach((anchor, index) => {
packages/core/src/voxel\cityWorldCompiler.ts:343:    positions.set(anchor.id, profile.preferredPositions[anchor.id] ?? fallbackPosition);
packages/core/src/voxel\cityWorldCompiler.ts:349:function createDraftDistrictTerrainTiles(profile: DraftDistrictProfile): CityWorldTerrainTile[] {
packages/core/src/voxel\cityWorldCompiler.ts:354:      const inOntarioLogisticsEdge = profile.terrainStyle === "inland-logistics" && x >= 23 && x <= 31 && y >= 11 && y <= 20;
packages/core/src/voxel\cityWorldCompiler.ts:355:      const inOntarioCommerceCore = profile.terrainStyle === "inland-logistics" && x >= 15 && x <= 23 && y >= 9 && y <= 16;
packages/core/src/voxel\cityWorldCompiler.ts:356:      const inOntarioResidentialGrid = profile.terrainStyle === "inland-logistics" && x >= 5 && x <= 14 && y >= 6 && y <= 13;
packages/core/src/voxel\cityWorldCompiler.ts:358:        profile.terrainStyle === "resort-venue" ? x >= 15 && x <= 27 && y >= 9 && y <= 18 : inOntarioCommerceCore || inOntarioLogisticsEdge;
packages/core/src/voxel\cityWorldCompiler.ts:359:      const inResidentialArea = profile.terrainStyle === "resort-venue" ? x >= 6 && x <= 14 && y >= 6 && y <= 12 : inOntarioResidentialGrid;
packages/core/src/voxel\cityWorldCompiler.ts:360:      const kind: CityWorldTerrainKind = inOntarioLogisticsEdge
packages/core/src/voxel\cityWorldCompiler.ts:367:              ? "park"
packages/core/src/voxel\cityWorldCompiler.ts:371:        id: `draft-terrain-${x}-${y}`,
packages/core/src/voxel\cityWorldCompiler.ts:378:        paletteKey: `terrain.${kind}`,
packages/core/src/voxel\cityWorldCompiler.ts:380:        visualGrammar: terrainVisualGrammar(kind, false, { x, y, z: 0 }, true),
packages/core/src/voxel\cityWorldCompiler.ts:388:function createDraftDistrictRoadSegments(profile: DraftDistrictProfile): CityWorldRoadSegment[] {
packages/core/src/voxel\cityWorldCompiler.ts:389:  return profile.roadSegments.map((road) => withRoadMetadata(road, "draft"));
packages/core/src/voxel\cityWorldCompiler.ts:392:function createDraftDistrictLots(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>, roads: CityWorldRoadSegment[]): CityWorldLot[] {
packages/core/src/voxel\cityWorldCompiler.ts:393:  return anchors.map((anchor) => {
packages/core/src/voxel\cityWorldCompiler.ts:394:    const position = positions.get(anchor.id) ?? { x: 10, y: 10, z: 0 };
packages/core/src/voxel\cityWorldCompiler.ts:395:    const kind = draftLotKind(anchor.category);
packages/core/src/voxel\cityWorldCompiler.ts:396:    const footprint = draftLotFootprint(anchor);
packages/core/src/voxel\cityWorldCompiler.ts:399:        id: `draft-lot-${anchor.id}`,
packages/core/src/voxel\cityWorldCompiler.ts:401:        label: anchor.label,
packages/core/src/voxel\cityWorldCompiler.ts:405:        placeId: `draft-place-${anchor.id}`,
packages/core/src/voxel\cityWorldCompiler.ts:420:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
packages/core/src/voxel\cityWorldCompiler.ts:421:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
packages/core/src/voxel\cityWorldCompiler.ts:427:    { suffix: "rowhome-street", offset: { x: -2.15, y: -0.5 }, kind: "home", width: 3.8, depth: 1.12, height: 1.52, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:428:    { suffix: "lowrise-courtyard", offset: { x: 1.26, y: -0.38 }, kind: "apartment", width: 2.8, depth: 1.9, height: 2.18, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:429:    { suffix: "mixed-use-edge", offset: { x: 0.06, y: 1.68 }, kind: "shop", width: 3.15, depth: 1.18, height: 1.08, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:432:    { suffix: "exhibit-hall-west", offset: { x: -2.55, y: -0.38 }, kind: "civic", width: 5.45, depth: 1.86, height: 1.04, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:433:    { suffix: "exhibit-hall-east", offset: { x: 2.2, y: -0.02 }, kind: "civic", width: 5.35, depth: 1.82, height: 1.1, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:441:      facadeStyle: "civic",
packages/core/src/voxel\cityWorldCompiler.ts:442:      roofShape: "hip",
packages/core/src/voxel\cityWorldCompiler.ts:445:    { suffix: "glass-arcade-front", offset: { x: -2.2, y: 1.48 }, kind: "civic", width: 2.9, depth: 0.72, height: 0.58, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:446:    { suffix: "frontage-wing", offset: { x: 3.22, y: 1.36 }, kind: "civic", width: 2.55, depth: 0.9, height: 0.72, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
packages/core/src/voxel\cityWorldCompiler.ts:449:    { suffix: "terminal-shed", offset: { x: -1.32, y: -0.22 }, kind: "gym", width: 7.15, depth: 1.74, height: 1.95, facadeStyle: "fitness", roofShape: "sawtooth", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:450:    { suffix: "platform-edge", offset: { x: -1.15, y: 1.05 }, kind: "civic", width: 5.85, depth: 0.64, height: 0.42, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:451:    { suffix: "ticket-hall", offset: { x: -0.18, y: 1.18 }, kind: "civic", width: 2.55, depth: 1.02, height: 0.92, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:452:    { suffix: "clock-tower", offset: { x: -0.06, y: -0.62 }, kind: "civic", width: 0.86, depth: 0.86, height: 3.82, facadeStyle: "civic", roofShape: "tower", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:455:    { suffix: "venue-bowl-west", offset: { x: -2.02, y: -0.28 }, kind: "civic", width: 4.9, depth: 3.48, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:456:    { suffix: "venue-bowl-east", offset: { x: 1.96, y: -0.02 }, kind: "civic", width: 4.82, depth: 3.36, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:457:    { suffix: "homeplate-gate", offset: { x: -0.24, y: 1.96 }, kind: "civic", width: 2.45, depth: 1.16, height: 1.0, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:458:    { suffix: "event-gate-east", offset: { x: 2.68, y: 1.45 }, kind: "civic", width: 1.85, depth: 0.95, height: 0.76, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
packages/core/src/voxel\cityWorldCompiler.ts:461:    { suffix: "community-hall", offset: { x: -0.72, y: -0.05 }, kind: "civic", width: 3.05, depth: 1.62, height: 1.24, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:462:    { suffix: "classroom-wing", offset: { x: 1.48, y: 0.82 }, kind: "civic", width: 2.1, depth: 0.98, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
packages/core/src/voxel\cityWorldCompiler.ts:463:    { suffix: "front-porch", offset: { x: 0.35, y: 1.45 }, kind: "civic", width: 1.55, depth: 0.82, height: 0.66, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
packages/core/src/voxel\cityWorldCompiler.ts:466:    { suffix: "rowhome-street", offset: { x: -2.25, y: -0.55 }, kind: "home", width: 3.75, depth: 1.08, height: 1.45, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:467:    { suffix: "ranch-court-west", offset: { x: 0.75, y: -0.72 }, kind: "home", width: 2.15, depth: 1.45, height: 1.05, facadeStyle: "ranch", roofShape: "hip", detailLevel: "medium" },
packages/core/src/voxel\cityWorldCompiler.ts:468:    { suffix: "ranch-court-east", offset: { x: 2.35, y: 0.65 }, kind: "home", width: 2.05, depth: 1.38, height: 0.96, facadeStyle: "ranch", roofShape: "gable", detailLevel: "medium" },
packages/core/src/voxel\cityWorldCompiler.ts:469:    { suffix: "cottage-court", offset: { x: -1.05, y: 0.72 }, kind: "home", width: 1.4, depth: 1.15, height: 1.28, facadeStyle: "cottage", roofShape: "gable", detailLevel: "medium" },
packages/core/src/voxel\cityWorldCompiler.ts:470:    { suffix: "lowrise-edge", offset: { x: -0.35, y: 1.55 }, kind: "apartment", width: 2.65, depth: 1.72, height: 1.88, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:472:  "ontario-mills-commercial-anchor": [
packages/core/src/voxel\cityWorldCompiler.ts:473:    { suffix: "retail-hall-west", offset: { x: -2.15, y: -0.18 }, kind: "shop", width: 4.15, depth: 1.55, height: 1.02, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:474:    { suffix: "retail-hall-east", offset: { x: 1.9, y: -0.05 }, kind: "shop", width: 4.0, depth: 1.5, height: 1.0, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:475:    { suffix: "entry-court", offset: { x: 0.15, y: 1.36 }, kind: "shop", width: 2.6, depth: 0.95, height: 0.72, facadeStyle: "storefront", roofShape: "hip", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:478:    { suffix: "terminal-hall", offset: { x: -1.95, y: -0.18 }, kind: "civic", width: 4.75, depth: 1.42, height: 1.2, facadeStyle: "civic", roofShape: "sawtooth", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:479:    { suffix: "logistics-apron-wing", offset: { x: 1.88, y: 0.1 }, kind: "shop", width: 3.45, depth: 1.36, height: 0.82, facadeStyle: "storefront", roofShape: "flat", detailLevel: "medium" },
packages/core/src/voxel\cityWorldCompiler.ts:480:    { suffix: "control-tower", offset: { x: 2.35, y: -0.95 }, kind: "civic", width: 0.96, depth: 0.96, height: 2.95, facadeStyle: "civic", roofShape: "tower", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:483:    { suffix: "civic-hall", offset: { x: -1.05, y: -0.18 }, kind: "civic", width: 3.2, depth: 1.7, height: 1.36, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:484:    { suffix: "office-wing", offset: { x: 1.55, y: 0.8 }, kind: "civic", width: 2.25, depth: 1.1, height: 1.05, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
packages/core/src/voxel\cityWorldCompiler.ts:487:    { suffix: "service-row", offset: { x: -1.2, y: -0.15 }, kind: "shop", width: 3.25, depth: 1.1, height: 0.98, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:488:    { suffix: "mixed-lowrise", offset: { x: 1.25, y: 0.95 }, kind: "apartment", width: 2.25, depth: 1.45, height: 1.65, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel\cityWorldCompiler.ts:492:function createDraftDistrictBuildings(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>): CityWorldBuilding[] {
packages/core/src/voxel\cityWorldCompiler.ts:495:  for (const anchor of anchors) {
packages/core/src/voxel\cityWorldCompiler.ts:496:    const position = positions.get(anchor.id) ?? { x: 10, y: 10, z: 0 };
packages/core/src/voxel\cityWorldCompiler.ts:497:    const anchorSpecs = DRAFT_ANCHOR_BUILDING_SPECS[anchor.id];
packages/core/src/voxel\cityWorldCompiler.ts:498:    if (anchorSpecs) {
packages/core/src/voxel\cityWorldCompiler.ts:499:      buildings.push(...anchorSpecs.map((spec) => createDraftBuildingFromSpec(anchor, position, spec)));
packages/core/src/voxel\cityWorldCompiler.ts:502:    buildings.push(createDraftBuilding(anchor, anchor.id, position, draftBuildingKind(anchor.category), draftBuildingWidth(anchor.category), draftBuildingDepth(anchor.category), draftBuildingHeight(anchor.category), draftFacade(anchor.category), draftRoof(anchor.category)));
packages/core/src/voxel\cityWorldCompiler.ts:508:function createDraftBuildingFromSpec(anchor: DistrictPlaceAnchor, position: CityWorldPoint, spec: DraftBuildingSpec): CityWorldBuilding {
packages/core/src/voxel\cityWorldCompiler.ts:510:    anchor,
packages/core/src/voxel\cityWorldCompiler.ts:511:    `${anchor.id}-${spec.suffix}`,
packages/core/src/voxel\cityWorldCompiler.ts:517:    spec.facadeStyle,
packages/core/src/voxel\cityWorldCompiler.ts:518:    spec.roofShape,
packages/core/src/voxel\cityWorldCompiler.ts:525:  anchor: DistrictPlaceAnchor,
packages/core/src/voxel\cityWorldCompiler.ts:532:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
packages/core/src/voxel\cityWorldCompiler.ts:533:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>,
packages/core/src/voxel\cityWorldCompiler.ts:536:  const colors = draftBuildingColors(idSuffix, kind, facadeStyle);
packages/core/src/voxel\cityWorldCompiler.ts:540:    label: anchor.label,
packages/core/src/voxel\cityWorldCompiler.ts:547:    placeId: `draft-place-${anchor.id}`,
packages/core/src/voxel\cityWorldCompiler.ts:548:    roofShape,
packages/core/src/voxel\cityWorldCompiler.ts:549:    facadeStyle,
packages/core/src/voxel\cityWorldCompiler.ts:550:    paletteKey: draftBuildingPaletteKey(kind, facadeStyle),
packages/core/src/voxel\cityWorldCompiler.ts:558:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
packages/core/src/voxel\cityWorldCompiler.ts:571:  if (kind === "gym" || facadeStyle === "fitness") return { body: "#dfe8e5", roof: "#5f8fa6" };
packages/core/src/voxel\cityWorldCompiler.ts:574:  if (kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return { body: "#efd8b6", roof: "#3f8b8c" };
packages/core/src/voxel\cityWorldCompiler.ts:578:function draftLotFootprint(anchor: DistrictPlaceAnchor): { width: number; depth: number } {
packages/core/src/voxel\cityWorldCompiler.ts:579:  if (anchor.id === "platinum-triangle-area") return { width: 7.1, depth: 4.9 };
packages/core/src/voxel\cityWorldCompiler.ts:580:  if (anchor.id === "anaheim-convention-center") return { width: 7.3, depth: 4.45 };
packages/core/src/voxel\cityWorldCompiler.ts:581:  if (anchor.id === "artic-transit-center") return { width: 6.25, depth: 3.15 };
packages/core/src/voxel\cityWorldCompiler.ts:582:  if (anchor.id === "angel-stadium") return { width: 7.6, depth: 5.1 };
packages/core/src/voxel\cityWorldCompiler.ts:583:  if (anchor.id === "downtown-anaheim-community-center") return { width: 4.8, depth: 3.3 };
packages/core/src/voxel\cityWorldCompiler.ts:584:  if (anchor.id === "ontario-inland-residential-variety") return { width: 7.0, depth: 4.55 };
packages/core/src/voxel\cityWorldCompiler.ts:585:  if (anchor.id === "ontario-mills-commercial-anchor") return { width: 7.8, depth: 4.35 };
packages/core/src/voxel\cityWorldCompiler.ts:586:  if (anchor.id === "ontario-international-airport") return { width: 7.1, depth: 4.05 };
packages/core/src/voxel\cityWorldCompiler.ts:587:  if (anchor.id === "ontario-civic-center-core") return { width: 5.2, depth: 3.4 };
packages/core/src/voxel\cityWorldCompiler.ts:588:  if (anchor.id === "ontario-downtown-service-core") return { width: 4.8, depth: 3.25 };
packages/core/src/voxel\cityWorldCompiler.ts:590:  const large = anchor.category === "entertainment" || anchor.category === "civic" || anchor.category === "transit";
packages/core/src/voxel\cityWorldCompiler.ts:592:    width: anchor.category === "entertainment" ? 6.6 : large ? 5.2 : anchor.category === "home_area" ? 6.8 : 3.8,
packages/core/src/voxel\cityWorldCompiler.ts:593:    depth: anchor.category === "entertainment" ? 4.6 : large ? 3.8 : anchor.category === "home_area" ? 4.8 : 3,
packages/core/src/voxel\cityWorldCompiler.ts:597:function createDraftDistrictPlaces(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>, districtSlug: string): CityWorldPlace[] {
packages/core/src/voxel\cityWorldCompiler.ts:598:  return anchors.map((anchor, index) => ({
packages/core/src/voxel\cityWorldCompiler.ts:599:    id: `draft-place-${anchor.id}`,
packages/core/src/voxel\cityWorldCompiler.ts:600:    label: anchor.label,
packages/core/src/voxel\cityWorldCompiler.ts:601:    kind: draftPlaceKind(anchor.category),
packages/core/src/voxel\cityWorldCompiler.ts:603:    nodeId: anchor.id,
packages/core/src/voxel\cityWorldCompiler.ts:604:    anchor: positions.get(anchor.id) ?? { x: 8 + index * 3, y: 9 + index, z: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:605:    hitRadius: anchor.category === "home_area" ? 3.8 : 2.8,
packages/core/src/voxel\cityWorldCompiler.ts:606:    description: `Non-public draft anchor: ${anchor.sourceFact}`,
packages/core/src/voxel\cityWorldCompiler.ts:620:      const kind: CityWorldTerrainKind = inWater ? "water" : inPark ? "park" : inPlaza ? "plaza" : "grass";
packages/core/src/voxel\cityWorldCompiler.ts:623:        id: `terrain-${x}-${y}`,
packages/core/src/voxel\cityWorldCompiler.ts:630:        paletteKey: `terrain.${kind}`,
packages/core/src/voxel\cityWorldCompiler.ts:631:        detailLevel: kind === "water" || kind === "park" || kind === "plaza" ? "medium" : "low",
packages/core/src/voxel\cityWorldCompiler.ts:649:        id: `shell-terrain-${x}-${y}`,
packages/core/src/voxel\cityWorldCompiler.ts:656:        paletteKey: `terrain.${kind}`,
packages/core/src/voxel\cityWorldCompiler.ts:658:        visualGrammar: terrainVisualGrammar(kind, true, { x, y, z: 0 }),
packages/core/src/voxel\cityWorldCompiler.ts:670:    { id: "road-citrus", kind: "street", from: { x: 13, y: 5, z: 0 }, to: { x: 13, y: 25, z: 0 }, width: 1.55 },
packages/core/src/voxel\cityWorldCompiler.ts:671:    { id: "road-scholar", kind: "street", from: { x: 24, y: 6, z: 0 }, to: { x: 24, y: 25, z: 0 }, width: 1.55 },
packages/core/src/voxel\cityWorldCompiler.ts:672:    { id: "road-sumner", kind: "street", from: { x: 32, y: 8, z: 0 }, to: { x: 32, y: 24, z: 0 }, width: 1.5 },
packages/core/src/voxel\cityWorldCompiler.ts:673:    { id: "road-park-loop-a", kind: "driveway", from: { x: 14, y: 18, z: 0 }, to: { x: 21, y: 18, z: 0 }, width: 0.7 },
packages/core/src/voxel\cityWorldCompiler.ts:674:    { id: "road-park-loop-b", kind: "driveway", from: { x: 21, y: 18, z: 0 }, to: { x: 20, y: 23, z: 0 }, width: 0.7 },
packages/core/src/voxel\cityWorldCompiler.ts:687:  if (category === "civic" || category === "landmark") return "civic";
packages/core/src/voxel\cityWorldCompiler.ts:688:  if (category === "park") return "park";
packages/core/src/voxel\cityWorldCompiler.ts:694:  if (category === "civic" || category === "transit" || category === "entertainment" || category === "landmark") return "civic";
packages/core/src/voxel\cityWorldCompiler.ts:701:  if (category === "park") return "park";
packages/core/src/voxel\cityWorldCompiler.ts:703:  if (category === "civic" || category === "entertainment" || category === "landmark") return "landmark";
packages/core/src/voxel\cityWorldCompiler.ts:707:function draftFacade(category: WorldPlaceCategory): NonNullable<CityWorldBuilding["facadeStyle"]> {
packages/core/src/voxel\cityWorldCompiler.ts:709:  if (category === "transit" || category === "civic" || category === "entertainment" || category === "landmark") return "civic";
packages/core/src/voxel\cityWorldCompiler.ts:713:function draftRoof(category: WorldPlaceCategory): NonNullable<CityWorldBuilding["roofShape"]> {
packages/core/src/voxel\cityWorldCompiler.ts:721:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
packages/core/src/voxel\cityWorldCompiler.ts:723:  if (kind === "home" && facadeStyle === "rowhome") return "building.house.rowhome.flat_parapet.v1";
packages/core/src/voxel\cityWorldCompiler.ts:724:  if (kind === "home" && facadeStyle === "ranch") return "building.house.ranch.v1";
packages/core/src/voxel\cityWorldCompiler.ts:725:  if (kind === "home" && facadeStyle === "cottage") return "building.house.cottage.v1";
packages/core/src/voxel\cityWorldCompiler.ts:726:  if (kind === "shop" && facadeStyle === "strip_store") return "building.store.strip.three_bay.v1";
packages/core/src/voxel\cityWorldCompiler.ts:727:  if (kind === "apartment" && facadeStyle === "lowrise") return "building.apartment.lowrise.stepped.v1";
packages/core/src/voxel\cityWorldCompiler.ts:757:    { id: "lot-park", kind: "park", label: "Community park", position: { x: 18, y: 20, z: 0 }, width: 7.5, depth: 6.4, placeId: "place-community-park" },
packages/core/src/voxel\cityWorldCompiler.ts:758:    { id: "lot-water", kind: "waterfront", label: "Water edge", position: { x: 37, y: 24, z: 0 }, width: 6, depth: 6 },
packages/core/src/voxel\cityWorldCompiler.ts:817:      label: "Eastvale Core",
packages/core/src/voxel\cityWorldCompiler.ts:825:      roofShape: "tower",
packages/core/src/voxel\cityWorldCompiler.ts:826:      facadeStyle: "civic",
packages/core/src/voxel\cityWorldCompiler.ts:840:      roofShape: "sawtooth",
packages/core/src/voxel\cityWorldCompiler.ts:841:      facadeStyle: "fitness",
packages/core/src/voxel\cityWorldCompiler.ts:855:      facadeStyle: "lowrise",
packages/core/src/voxel\cityWorldCompiler.ts:869:      facadeStyle: "lowrise",
packages/core/src/voxel\cityWorldCompiler.ts:877:  // half-tile silhouette buckets (compact one-story, two-story massing, wide
packages/core/src/voxel\cityWorldCompiler.ts:931:    roofShape: "flat",
packages/core/src/voxel\cityWorldCompiler.ts:932:    facadeStyle: "storefront",
packages/core/src/voxel\cityWorldCompiler.ts:947:    roofShape: "flat",
packages/core/src/voxel\cityWorldCompiler.ts:948:    facadeStyle: "lowrise",
packages/core/src/voxel\cityWorldCompiler.ts:965:    roofShape: "flat",
packages/core/src/voxel\cityWorldCompiler.ts:966:    facadeStyle: "strip_store",
packages/core/src/voxel\cityWorldCompiler.ts:983:  facadeStyle: "cottage" | "ranch" | "rowhome",
packages/core/src/voxel\cityWorldCompiler.ts:984:  roofShape: "gable" | "hip" | "flat",
packages/core/src/voxel\cityWorldCompiler.ts:1003:    roofShape,
packages/core/src/voxel\cityWorldCompiler.ts:1004:    facadeStyle,
packages/core/src/voxel\cityWorldCompiler.ts:1005:    detailLevel: facadeStyle === "rowhome" ? "high" : "medium",
packages/core/src/voxel\cityWorldCompiler.ts:1010:  const props: CityWorldProp[] = [
packages/core/src/voxel\cityWorldCompiler.ts:1011:    { id: "prop-water-shimmer-a", kind: "water_shimmer", position: { x: 36, y: 24, z: 0 }, variant: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:1012:    { id: "prop-water-shimmer-b", kind: "water_shimmer", position: { x: 39, y: 26, z: 0 }, variant: 1 },
packages/core/src/voxel\cityWorldCompiler.ts:1013:    { id: "prop-water-shimmer-c", kind: "water_shimmer", position: { x: 38.5, y: 21.5, z: 0 }, variant: 2 },
packages/core/src/voxel\cityWorldCompiler.ts:1016:  const treePoints: CityWorldPoint[] = [
packages/core/src/voxel\cityWorldCompiler.ts:1032:  treePoints.forEach((position, index) => {
packages/core/src/voxel\cityWorldCompiler.ts:1033:    props.push({
packages/core/src/voxel\cityWorldCompiler.ts:1034:      id: `prop-tree-${index}`,
packages/core/src/voxel\cityWorldCompiler.ts:1035:      kind: index % 4 === 0 ? "bush" : "tree",
packages/core/src/voxel\cityWorldCompiler.ts:1038:      ...(index < 5 ? { placeId: "place-community-park" } : {}),
packages/core/src/voxel\cityWorldCompiler.ts:1053:    props.push({
packages/core/src/voxel\cityWorldCompiler.ts:1054:      id: `prop-shrub-${index}`,
packages/core/src/voxel\cityWorldCompiler.ts:1058:      ...(index >= 2 && index <= 3 ? { placeId: "place-community-park" } : {}),
packages/core/src/voxel\cityWorldCompiler.ts:1062:  // 0.74F curated public kit: plaza furniture at the civic core, streetlights
packages/core/src/voxel\cityWorldCompiler.ts:1063:  // along Hamner Ave, a dock + moored boat on the river, and the water tower
packages/core/src/voxel\cityWorldCompiler.ts:1065:  props.push(
packages/core/src/voxel\cityWorldCompiler.ts:1066:    { id: "prop-civic-fountain", kind: "fountain", position: { x: 21, y: 12.6, z: 0 }, variant: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:1067:    { id: "prop-civic-bench-a", kind: "bench", position: { x: 19.9, y: 13.1, z: 0 }, variant: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:1068:    { id: "prop-civic-bench-b", kind: "bench", position: { x: 22.1, y: 13.1, z: 0 }, variant: 1 },
packages/core/src/voxel\cityWorldCompiler.ts:1069:    { id: "prop-plaza-sign", kind: "sign", position: { x: 27.4, y: 13.9, z: 0 }, variant: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:1070:    { id: "prop-hamner-light-a", kind: "streetlight", position: { x: 16, y: 12.2, z: 0 }, variant: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:1071:    { id: "prop-hamner-light-b", kind: "streetlight", position: { x: 24, y: 12.2, z: 0 }, variant: 1 },
packages/core/src/voxel\cityWorldCompiler.ts:1072:    { id: "prop-hamner-light-c", kind: "streetlight", position: { x: 32, y: 12.2, z: 0 }, variant: 2 },
packages/core/src/voxel\cityWorldCompiler.ts:1073:    { id: "prop-limonite-light-a", kind: "streetlight", position: { x: 18, y: 20.2, z: 0 }, variant: 3 },
packages/core/src/voxel\cityWorldCompiler.ts:1074:    { id: "prop-limonite-light-b", kind: "streetlight", position: { x: 27, y: 20.2, z: 0 }, variant: 4 },
packages/core/src/voxel\cityWorldCompiler.ts:1075:    { id: "prop-river-dock", kind: "dock", position: { x: 35.2, y: 23.2, z: 0 }, variant: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:1076:    { id: "prop-river-boat", kind: "boat", position: { x: 37.4, y: 24.6, z: 0 }, variant: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:1077:    { id: "prop-gym-water-tower", kind: "water_tower", position: { x: 33.4, y: 16.4, z: 0 }, variant: 0 },
packages/core/src/voxel\cityWorldCompiler.ts:1079:  return props.map(withPropMetadata);
packages/core/src/voxel\cityWorldCompiler.ts:1096:      anchor: { x: place.anchor.x + 0.7, y: place.anchor.y - 0.6, z: 1.8 },
packages/core/src/voxel\cityWorldCompiler.ts:1114:      anchor: { x: place.anchor.x - 0.75, y: place.anchor.y - 0.5, z: 1.6 },
packages/core/src/voxel\cityWorldCompiler.ts:1143:  const terrainComposition = terrainCompositionProfile(kind, false, { x, y, z: 0 });
packages/core/src/voxel\cityWorldCompiler.ts:1144:  const terrainElevation = terrainElevationProfile(kind, false, { x, y, z: 0 });
packages/core/src/voxel\cityWorldCompiler.ts:1145:  const chunkEdge = terrainChunkEdgeProfile(kind, false, { x, y, z: 0 });
packages/core/src/voxel\cityWorldCompiler.ts:1146:  const terrainChunkMassing = terrainChunkMassingProfile(kind, false, { x, y, z: 0 });
packages/core/src/voxel\cityWorldCompiler.ts:1150:    if (inCivicGround) return { terrainProfile: "landmark_civic_ground", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "parcel_pad_shadow" };
packages/core/src/voxel\cityWorldCompiler.ts:1151:    if (inNeighborhoodField) return { terrainProfile: "neighborhood_parcel_field", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "parcel_pad_shadow" };
packages/core/src/voxel\cityWorldCompiler.ts:1154:  return terrainVisualGrammar(kind, false, { x, y, z: 0 });
packages/core/src/voxel\cityWorldCompiler.ts:1157:function terrainVisualGrammar(kind: CityWorldTerrainKind, shell: boolean, position?: CityWorldPoint, draft = false): CityWorldVisualGrammar {
packages/core/src/voxel\cityWorldCompiler.ts:1158:  const terrainComposition = terrainCompositionProfile(kind, shell, position, draft);
packages/core/src/voxel\cityWorldCompiler.ts:1159:  const terrainElevation = terrainElevationProfile(kind, shell, position, draft);
packages/core/src/voxel\cityWorldCompiler.ts:1160:  const chunkEdge = terrainChunkEdgeProfile(kind, shell, position, draft);
packages/core/src/voxel\cityWorldCompiler.ts:1161:  const terrainChunkMassing = terrainChunkMassingProfile(kind, shell, position, draft);
packages/core/src/voxel\cityWorldCompiler.ts:1163:    return { terrainProfile: "shell_grid", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "soft_ground_shadow" };
packages/core/src/voxel\cityWorldCompiler.ts:1165:  if (kind === "park") return { terrainProfile: "civic_green", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "soft_ground_shadow" };
packages/core/src/voxel\cityWorldCompiler.ts:1166:  if (kind === "plaza" || kind === "sidewalk") return { terrainProfile: "commercial_plaza", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "parcel_pad_shadow" };
packages/core/src/voxel\cityWorldCompiler.ts:1167:  if (kind === "water") return { terrainProfile: "water_edge", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "soft_ground_shadow" };
packages/core/src/voxel\cityWorldCompiler.ts:1168:  return { terrainProfile: "quiet_socal_grass", terrainComposition, terrainElevation, chunkEdge, terrainChunkMassing, contactProfile: "soft_ground_shadow" };
packages/core/src/voxel\cityWorldCompiler.ts:1171:function terrainCompositionProfile(
packages/core/src/voxel\cityWorldCompiler.ts:1176:): NonNullable<CityWorldVisualGrammar["terrainComposition"]> {
packages/core/src/voxel\cityWorldCompiler.ts:1179:  if (kind === "water") return "waterfront_edge_strata";
packages/core/src/voxel\cityWorldCompiler.ts:1180:  if (kind === "park") return "park_basin";
packages/core/src/voxel\cityWorldCompiler.ts:1190:function terrainElevationProfile(
packages/core/src/voxel\cityWorldCompiler.ts:1195:): NonNullable<CityWorldVisualGrammar["terrainElevation"]> {
packages/core/src/voxel\cityWorldCompiler.ts:1198:  if (kind === "water") return "water_edge_cut";
packages/core/src/voxel\cityWorldCompiler.ts:1199:  if (kind === "park") return "park_basin_shelf";
packages/core/src/voxel\cityWorldCompiler.ts:1209:function terrainChunkEdgeProfile(
packages/core/src/voxel\cityWorldCompiler.ts:1218:  if (kind === "water") return "waterfront_bank_edge";
packages/core/src/voxel\cityWorldCompiler.ts:1220:  if (kind === "park" && position.x >= 14 && position.x <= 21 && position.y >= 17 && position.y <= 23) {
packages/core/src/voxel\cityWorldCompiler.ts:1221:    return position.x === 14 || position.x === 21 || position.y === 17 || position.y === 23 ? "park_basin_edge" : "none";
packages/core/src/voxel\cityWorldCompiler.ts:1229:function terrainChunkMassingProfile(
packages/core/src/voxel\cityWorldCompiler.ts:1234:): NonNullable<CityWorldVisualGrammar["terrainChunkMassing"]> {
packages/core/src/voxel\cityWorldCompiler.ts:1238:  if (kind === "water") return "waterfront_bank_cut_mass";
packages/core/src/voxel\cityWorldCompiler.ts:1240:  if (kind === "park" && position.x >= 14 && position.x <= 21 && position.y >= 17 && position.y <= 23) {
packages/core/src/voxel\cityWorldCompiler.ts:1241:    return "park_basin_cut_mass";
packages/core/src/voxel\cityWorldCompiler.ts:1327:// Tone (public/draft/shell), road/lot contact profiles, curb-cut edges, and
packages/core/src/voxel\cityWorldCompiler.ts:1328:// terrain material seams are authored here as typed metadata; the renderer
packages/core/src/voxel\cityWorldCompiler.ts:1348:  water: 5,
packages/core/src/voxel\cityWorldCompiler.ts:1351:  park: 2,
packages/core/src/voxel\cityWorldCompiler.ts:1363:    const waterEdgeSides: CityWorldTileEdge[] = [];
packages/core/src/voxel\cityWorldCompiler.ts:1368:      if ((tile.kind === "water") !== (neighborKind === "water")) {
packages/core/src/voxel\cityWorldCompiler.ts:1369:        // The land tile owns the bank strand; the water side already carries
packages/core/src/voxel\cityWorldCompiler.ts:1370:        // waterfront bank massing from the elevation grammar.
packages/core/src/voxel\cityWorldCompiler.ts:1371:        if (tile.kind !== "water") waterEdgeSides.push(side);
packages/core/src/voxel\cityWorldCompiler.ts:1379:    const terrainContact: CityWorldTerrainContactGrammar = {
packages/core/src/voxel\cityWorldCompiler.ts:1383:      ...(waterEdgeSides.length > 0 ? { waterEdgeSides } : {}),
packages/core/src/voxel\cityWorldCompiler.ts:1388:      visualGrammar: { ...(tile.visualGrammar ?? { contactProfile: "soft_ground_shadow" as const }), terrainContact },
packages/core/src/voxel\cityWorldCompiler.ts:1398:  if (lot.kind === "waterfront") return undefined;
packages/core/src/voxel\cityWorldCompiler.ts:1434:    profile: road.kind === "crosswalk" ? "painted" : road.kind === "driveway" ? "apron" : "embedded",
packages/core/src/voxel\cityWorldCompiler.ts:1437:      road.kind === "avenue" ? "avenue_dash" : road.kind === "street" ? "street_dash" : road.kind === "driveway" ? "apron_dash" : "none",
packages/core/src/voxel\cityWorldCompiler.ts:1445:  const profile =
packages/core/src/voxel\cityWorldCompiler.ts:1446:    lot.kind === "waterfront" ? "shore" : lot.kind === "park" ? "green" : lot.kind === "shop" || lot.kind === "gym" ? "apron" : "foundation";
packages/core/src/voxel\cityWorldCompiler.ts:1448:    profile,
packages/core/src/voxel\cityWorldCompiler.ts:1450:    ...(curbCutEdge && profile !== "shore" ? { curbCutEdge } : {}),
packages/core/src/voxel\cityWorldCompiler.ts:1459:  if (lot.kind === "civic") return { lotProfile: lot.placeId === "place-eastvale-core" ? "landmark_civic_ground" : "civic_plaza_pad", parcelComposition, parcelElevation, contactProfile: "landmark_base_shadow", lotContact };
packages/core/src/voxel\cityWorldCompiler.ts:1461:  if (lot.kind === "waterfront") return { lotProfile: "waterfront_edge", parcelComposition, parcelElevation, contactProfile: "soft_ground_shadow", lotContact };
packages/core/src/voxel\cityWorldCompiler.ts:1462:  return { lotProfile: "park_soft_edge", parcelComposition, parcelElevation, contactProfile: "soft_ground_shadow", lotContact };
packages/core/src/voxel\cityWorldCompiler.ts:1466:  if (lot.id.startsWith("draft-lot-")) return "hidden_draft_anchor_pad";
packages/core/src/voxel\cityWorldCompiler.ts:1469:  if (lot.kind === "civic") return "civic_landmark_plinth";
packages/core/src/voxel\cityWorldCompiler.ts:1471:  if (lot.kind === "waterfront") return "waterfront_bank";
packages/core/src/voxel\cityWorldCompiler.ts:1472:  return "park_path_basin";
packages/core/src/voxel\cityWorldCompiler.ts:1476:  if (lot.id.startsWith("draft-lot-")) return "hidden_anchor_shelf";
packages/core/src/voxel\cityWorldCompiler.ts:1481:  if (lot.kind === "waterfront") return "waterfront_bank_cut";
packages/core/src/voxel\cityWorldCompiler.ts:1482:  return "park_basin_lip";
packages/core/src/voxel\cityWorldCompiler.ts:1487:  roofShape: CityWorldBuilding["roofShape"],
packages/core/src/voxel\cityWorldCompiler.ts:1488:  facadeStyle: CityWorldBuilding["facadeStyle"],
packages/core/src/voxel\cityWorldCompiler.ts:1491:  const objectFamily = buildingObjectFamily(building, roofShape, facadeStyle);
packages/core/src/voxel\cityWorldCompiler.ts:1492:  const materialProfile = buildingMaterialProfile(building, facadeStyle);
packages/core/src/voxel\cityWorldCompiler.ts:1493:  const roofProfile = buildingRoofProfile(building, roofShape, facadeStyle);
packages/core/src/voxel\cityWorldCompiler.ts:1496:    materialProfile,
packages/core/src/voxel\cityWorldCompiler.ts:1497:    roofProfile,
packages/core/src/voxel\cityWorldCompiler.ts:1499:    clusterRole: buildingClusterRole(building, objectFamily, facadeStyle),
packages/core/src/voxel\cityWorldCompiler.ts:1500:    noLabelPriority: buildingNoLabelPriority(building, roofShape, objectFamily, detailLevel),
packages/core/src/voxel\cityWorldCompiler.ts:1501:    contactProfile: building.kind === "civic" ? "landmark_base_shadow" : "parcel_pad_shadow",
packages/core/src/voxel\cityWorldCompiler.ts:1507:  facadeStyle: CityWorldBuilding["facadeStyle"],
packages/core/src/voxel\cityWorldCompiler.ts:1508:): NonNullable<CityWorldVisualGrammar["materialProfile"]> {
packages/core/src/voxel\cityWorldCompiler.ts:1510:  if (building.kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return "socal_storefront";
packages/core/src/voxel\cityWorldCompiler.ts:1511:  if (building.kind === "apartment" || facadeStyle === "lowrise") return "socal_lowrise";
packages/core/src/voxel\cityWorldCompiler.ts:1512:  if (facadeStyle === "ranch") return "socal_cool_stucco";
packages/core/src/voxel\cityWorldCompiler.ts:1513:  if (facadeStyle === "rowhome") return "socal_stucco_light";
packages/core/src/voxel\cityWorldCompiler.ts:1519:  roofShape: CityWorldBuilding["roofShape"],
packages/core/src/voxel\cityWorldCompiler.ts:1520:  facadeStyle: CityWorldBuilding["facadeStyle"],
packages/core/src/voxel\cityWorldCompiler.ts:1521:): NonNullable<CityWorldVisualGrammar["roofProfile"]> {
packages/core/src/voxel\cityWorldCompiler.ts:1522:  if (roofShape === "tower") {
packages/core/src/voxel\cityWorldCompiler.ts:1523:    return building.kind === "civic" && facadeStyle === "civic" ? "civic_glass_cap" : "blue_metal_utility";
packages/core/src/voxel\cityWorldCompiler.ts:1526:  if (roofShape === "flat") return "flat_parapet_cap";
packages/core/src/voxel\cityWorldCompiler.ts:1527:  if (facadeStyle === "ranch") return "sage_tile";
packages/core/src/voxel\cityWorldCompiler.ts:1528:  if (roofShape === "hip") return "cool_clay_tile";
packages/core/src/voxel\cityWorldCompiler.ts:1529:  if (roofShape === "sawtooth") return "blue_metal_utility";
packages/core/src/voxel\cityWorldCompiler.ts:1535:  roofShape: CityWorldBuilding["roofShape"],
packages/core/src/voxel\cityWorldCompiler.ts:1536:  facadeStyle: CityWorldBuilding["facadeStyle"],
packages/core/src/voxel\cityWorldCompiler.ts:1539:  if (id.includes("anaheim-convention-center") || id.includes("angel-stadium")) return "venue_anchor";
packages/core/src/voxel\cityWorldCompiler.ts:1540:  if (id.includes("artic-transit-center") || id.includes("ontario-international-airport")) return "transit_anchor";
packages/core/src/voxel\cityWorldCompiler.ts:1543:  const base = buildingAuthoredObjectFamily(building, roofShape, facadeStyle);
packages/core/src/voxel\cityWorldCompiler.ts:1544:  if ((base === "residential_kit" || base === "civic_landmark") && id.includes("downtown-service")) return "service_block";
packages/core/src/voxel\cityWorldCompiler.ts:1550:  roofShape: CityWorldBuilding["roofShape"],
packages/core/src/voxel\cityWorldCompiler.ts:1551:  facadeStyle: CityWorldBuilding["facadeStyle"],
packages/core/src/voxel\cityWorldCompiler.ts:1553:  if (building.kind !== "civic" && roofShape === "tower") return "service_block";
packages/core/src/voxel\cityWorldCompiler.ts:1554:  if (building.kind === "apartment" || facadeStyle === "lowrise") return "lowrise_cluster";
packages/core/src/voxel\cityWorldCompiler.ts:1555:  if (building.kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return "commerce_strip";
packages/core/src/voxel\cityWorldCompiler.ts:1556:  if (building.kind === "gym" || facadeStyle === "fitness") return "service_block";
packages/core/src/voxel\cityWorldCompiler.ts:1557:  if (building.kind === "civic" || facadeStyle === "civic") return "civic_landmark";
packages/core/src/voxel\cityWorldCompiler.ts:1564:  facadeStyle: CityWorldBuilding["facadeStyle"],
packages/core/src/voxel\cityWorldCompiler.ts:1566:  if (objectFamily === "civic_landmark" || objectFamily === "venue_anchor" || objectFamily === "transit_anchor") return "anchor";
packages/core/src/voxel\cityWorldCompiler.ts:1567:  if (objectFamily === "commerce_strip" || facadeStyle === "rowhome") return "edge";
packages/core/src/voxel\cityWorldCompiler.ts:1575:  roofShape: CityWorldBuilding["roofShape"],
packages/core/src/voxel\cityWorldCompiler.ts:1586:    id.includes("ontario-mills-commercial-anchor") ||
packages/core/src/voxel\cityWorldCompiler.ts:1589:    return "primary_anchor";
packages/core/src/voxel\cityWorldCompiler.ts:1591:  if (objectFamily === "venue_anchor" || objectFamily === "transit_anchor") return "primary_anchor";
packages/core/src/voxel\cityWorldCompiler.ts:1592:  if (roofShape === "tower" && objectFamily === "service_block" && detailLevel === "high") return "supporting";
packages/core/src/voxel\cityWorldCompiler.ts:1593:  if (id.startsWith("draft-building-") && (objectFamily === "civic_landmark" || objectFamily === "commerce_strip" || objectFamily === "lowrise_cluster")) {
packages/core/src/voxel\cityWorldCompiler.ts:1623:  const roofShape =
packages/core/src/voxel\cityWorldCompiler.ts:1624:    building.roofShape ??
packages/core/src/voxel\cityWorldCompiler.ts:1636:  const facadeStyle =
packages/core/src/voxel\cityWorldCompiler.ts:1637:    building.facadeStyle ??
packages/core/src/voxel\cityWorldCompiler.ts:1651:    spriteKey: building.spriteKey ?? resolveBuildingSpriteKey(building, roofShape, facadeStyle, variant),
packages/core/src/voxel\cityWorldCompiler.ts:1652:    paletteKey: building.paletteKey ?? resolveBuildingPaletteKey(building, facadeStyle, variant),
packages/core/src/voxel\cityWorldCompiler.ts:1653:    roofShape,
packages/core/src/voxel\cityWorldCompiler.ts:1654:    facadeStyle,
packages/core/src/voxel\cityWorldCompiler.ts:1656:    visualGrammar: buildingVisualGrammar(building, roofShape, facadeStyle, detailLevel),
packages/core/src/voxel\cityWorldCompiler.ts:1665:function resolveBuildingSpriteKey(building: CityWorldBuilding, roofShape: CityWorldBuilding["roofShape"], facadeStyle: CityWorldBuilding["facadeStyle"], variant: number): string {
packages/core/src/voxel\cityWorldCompiler.ts:1666:  if (building.kind === "home" && facadeStyle === "cottage") return "building.house.cottage.front_gable.v1";
packages/core/src/voxel\cityWorldCompiler.ts:1667:  if (building.kind === "home" && facadeStyle === "ranch") return "building.house.ranch.low_gable.v1";
packages/core/src/voxel\cityWorldCompiler.ts:1668:  if (building.kind === "home" && facadeStyle === "rowhome") return "building.house.rowhome.flat_parapet.v1";
packages/core/src/voxel\cityWorldCompiler.ts:1669:  if (building.kind === "shop" && facadeStyle === "strip_store") return "building.store.strip.three_bay.v1";
packages/core/src/voxel\cityWorldCompiler.ts:1670:  if (building.kind === "apartment" && facadeStyle === "lowrise") return "building.apartment.lowrise.stepped.v1";
packages/core/src/voxel\cityWorldCompiler.ts:1671:  return `building.${building.kind}.${roofShape}.${variant % 4}`;
packages/core/src/voxel\cityWorldCompiler.ts:1692:function resolveBuildingPaletteKey(building: CityWorldBuilding, facadeStyle: CityWorldBuilding["facadeStyle"], variant: number): string {
packages/core/src/voxel\cityWorldCompiler.ts:1693:  if (building.kind === "home" && facadeStyle === "cottage") return `building.house.cottage.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.cottage)}`;
packages/core/src/voxel\cityWorldCompiler.ts:1694:  if (building.kind === "home" && facadeStyle === "ranch") return `building.house.ranch.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.ranch)}`;
packages/core/src/voxel\cityWorldCompiler.ts:1695:  if (building.kind === "home" && facadeStyle === "rowhome") return `building.house.rowhome.flat_parapet.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.rowhome)}`;
packages/core/src/voxel\cityWorldCompiler.ts:1696:  if (building.kind === "home" && facadeStyle) return `building.house.${facadeStyle}.v1`;
packages/core/src/voxel\cityWorldCompiler.ts:1697:  if (building.kind === "shop" && facadeStyle === "strip_store") return `building.store.strip.three_bay.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.strip_store)}`;
packages/core/src/voxel\cityWorldCompiler.ts:1698:  if (building.kind === "apartment" && facadeStyle === "lowrise") return `building.apartment.lowrise.stepped.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.lowrise)}`;
packages/core/src/voxel\cityWorldCompiler.ts:1703:export function withPropMetadata(prop: CityWorldProp): CityWorldProp {
packages/core/src/voxel\cityWorldCompiler.ts:1705:    ...prop,
packages/core/src/voxel\cityWorldCompiler.ts:1706:    spriteKey: `prop.${prop.kind}.${prop.variant}`,
packages/core/src/voxel\cityWorldCompiler.ts:1707:    paletteKey: `prop.${prop.kind}`,
packages/core/src/voxel\cityWorldCompiler.ts:1708:    detailLevel: prop.kind === "cloud" ? "low" : prop.kind === "water_shimmer" ? "medium" : "high",
web/src\emulator\toolSource.ts:8://   - injected:  a node/CDP driver pre-fetches the result and parks it on
web/src\emulator\toolSource.ts:82:/** CI strategy: the driver parked one pre-fetched result on the window. */
web/src\emulator\toolSource.ts:84:  const parked = (window as InjectedResultWindow).__ATLAS_EMULATOR_TOOLRESULT__;
web/src\emulator\toolSource.ts:85:  if (!parked) return null;
web/src\emulator\toolSource.ts:86:  const call = async (): Promise<CallToolResult> => parked;
packages/core/src/voxel\cityWorldSceneWindow.ts:31: * chunk anchoring resolve command sourceIds through this index in O(1) —
packages/core/src/voxel\cityWorldSceneWindow.ts:36:  terrainTiles: Map<string, CityWorldTerrainTile>;
packages/core/src/voxel\cityWorldSceneWindow.ts:40:  props: Map<string, CityWorldProp>;
packages/core/src/voxel\cityWorldSceneWindow.ts:48:    terrainTiles: byId(scene.terrainTiles),
packages/core/src/voxel\cityWorldSceneWindow.ts:52:    props: byId(scene.props),
packages/core/src/voxel\cityWorldSceneWindow.ts:102:    terrainCommandCount: number;
packages/core/src/voxel\cityWorldSceneWindow.ts:108:    propCommandCount: number;
packages/core/src/voxel\cityWorldSceneWindow.ts:116:  profileId: CityWorldSceneWindowBudgetProfileId;
packages/core/src/voxel\cityWorldSceneWindow.ts:135:  profileId: CityWorldSceneWindowBudgetProfileId;
packages/core/src/voxel\cityWorldSceneWindow.ts:150:    profileId: "public_playable_window",
packages/core/src/voxel\cityWorldSceneWindow.ts:156:    // 0.74F: the curated prop kit is public; density is capped instead of
packages/core/src/voxel\cityWorldSceneWindow.ts:166:    profileId: "shell_empty_window",
packages/core/src/voxel\cityWorldSceneWindow.ts:183:    profileId: "hidden_draft_window",
packages/core/src/voxel\cityWorldSceneWindow.ts:200:    profileId: "generated_draft_window",
packages/core/src/voxel\cityWorldSceneWindow.ts:206:    // E2b: raised 20 -> 36 (the public window's own prop allowance) so the E2
packages/core/src/voxel\cityWorldSceneWindow.ts:209:    // 938/1600 (emulator perf matrix) — 16 more visible props ≈ +32 Graphics,
packages/core/src/voxel\cityWorldSceneWindow.ts:372:      terrainCommandCount: layerCommandCounts.terrain,
packages/core/src/voxel\cityWorldSceneWindow.ts:378:      propCommandCount: layerCommandCounts.props,
packages/core/src/voxel\cityWorldSceneWindow.ts:400:  if (budget.maxPropCommands !== undefined) requireAtMost(blockers, metrics.propCommandCount, budget.maxPropCommands, "propCommandCount");
packages/core/src/voxel\cityWorldSceneWindow.ts:401:  requireAtLeast(blockers, metrics.terrainCommandCount, budget.minTerrainCommands, "terrainCommandCount");
packages/core/src/voxel\cityWorldSceneWindow.ts:409:      blockers.push(`${budget.profileId} requires a non-playable scene.`);
packages/core/src/voxel\cityWorldSceneWindow.ts:412:      blockers.push(`${budget.profileId} forbids scene pins; got ${scene.pins.length}.`);
packages/core/src/voxel\cityWorldSceneWindow.ts:415:      blockers.push(`${budget.profileId} forbids scene actors; got ${scene.actors.length}.`);
packages/core/src/voxel\cityWorldSceneWindow.ts:421:    profileId: budget.profileId,
packages/core/src/voxel\cityWorldSceneWindow.ts:430:    case "terrain_tile": {
packages/core/src/voxel\cityWorldSceneWindow.ts:431:      const item = index.terrainTiles.get(command.sourceId);
packages/core/src/voxel\cityWorldSceneWindow.ts:446:    case "prop": {
packages/core/src/voxel\cityWorldSceneWindow.ts:447:      const item = index.props.get(command.sourceId);
packages/core/src/voxel\cityWorldSceneWindow.ts:457:      return item ? cityWorldPointInsideFrame(item.anchor, frame) : false;
packages/core/src/voxel\cityWorldSceneWindow.ts:461:      return item ? cityWorldPointInsideFrame(item.anchor, frame) : false;
packages/core/src/voxel\cityWorldSceneWindow.ts:470:    case "terrain_tile": {
packages/core/src/voxel\cityWorldSceneWindow.ts:471:      const item = index.terrainTiles.get(command.sourceId);
packages/core/src/voxel\cityWorldSceneWindow.ts:486:    case "prop": {
packages/core/src/voxel\cityWorldSceneWindow.ts:487:      const item = index.props.get(command.sourceId);
packages/core/src/voxel\cityWorldSceneWindow.ts:497:      return item ? [item.anchor] : [];
packages/core/src/voxel\cityWorldSceneWindow.ts:501:      return item ? [item.anchor] : [];
packages/core/src/voxel\cityWorldSceneWindow.ts:550:    terrain: 0,
packages/core/src/voxel\cityWorldSceneWindow.ts:554:    props: 0,
packages/core/src/voxel\cityWorldRenderCommands.ts:15:  | "terrain"
packages/core/src/voxel\cityWorldRenderCommands.ts:19:  | "props"
packages/core/src/voxel\cityWorldRenderCommands.ts:26:  | "terrain_tile"
packages/core/src/voxel\cityWorldRenderCommands.ts:30:  | "prop"
packages/core/src/voxel\cityWorldRenderCommands.ts:76:    terrainCommandCount: number;
packages/core/src/voxel\cityWorldRenderCommands.ts:80:    propCommandCount: number;
packages/core/src/voxel\cityWorldRenderCommands.ts:95:  profileId: CityWorldRenderBudgetProfileId;
packages/core/src/voxel\cityWorldRenderCommands.ts:115:  profileId: CityWorldRenderBudgetProfileId;
packages/core/src/voxel\cityWorldRenderCommands.ts:123:export type CityWorldDepthInterleaveKind = "building" | "prop";
packages/core/src/voxel\cityWorldRenderCommands.ts:133:  "terrain",
packages/core/src/voxel\cityWorldRenderCommands.ts:137:  "props",
packages/core/src/voxel\cityWorldRenderCommands.ts:146:    profileId: "engine_beta_public",
packages/core/src/voxel\cityWorldRenderCommands.ts:162:    profileId: "shell_empty_state",
packages/core/src/voxel\cityWorldRenderCommands.ts:180:    profileId: "hidden_draft_probe",
packages/core/src/voxel\cityWorldRenderCommands.ts:207:  for (const tile of scene.terrainTiles) {
packages/core/src/voxel\cityWorldRenderCommands.ts:208:    commands.push(renderCommand("terrain", "terrain_tile", tile, 0, 1));
packages/core/src/voxel\cityWorldRenderCommands.ts:223:  for (const prop of scene.props) {
packages/core/src/voxel\cityWorldRenderCommands.ts:224:    commands.push(renderCommand("props", "prop", prop, pointZOrder(prop.position), 1, {
packages/core/src/voxel\cityWorldRenderCommands.ts:225:      animated: prop.kind === "cloud" || prop.kind === "water_shimmer",
packages/core/src/voxel\cityWorldRenderCommands.ts:226:      publicClutterRisk: forbiddenPublicPropKinds.has(prop.kind),
packages/core/src/voxel\cityWorldRenderCommands.ts:227:      spriteBacked: Boolean(prop.spriteKey),
packages/core/src/voxel\cityWorldRenderCommands.ts:304:  requireAtMost(blockers, metrics.propCommandCount, budget.maxPropCommands, "propCommandCount");
packages/core/src/voxel\cityWorldRenderCommands.ts:307:  requireAtLeast(blockers, metrics.terrainCommandCount, budget.minTerrainCommands, "terrainCommandCount");
packages/core/src/voxel\cityWorldRenderCommands.ts:315:      blockers.push(`${budget.profileId} cannot be applied to an explicitly non-playable scene.`);
packages/core/src/voxel\cityWorldRenderCommands.ts:318:      blockers.push(`${budget.profileId} must not be applied to a playable scene.`);
packages/core/src/voxel\cityWorldRenderCommands.ts:321:      blockers.push(`${budget.profileId} forbids pins; got ${scene.pins.length}.`);
packages/core/src/voxel\cityWorldRenderCommands.ts:324:      blockers.push(`${budget.profileId} forbids actors; got ${scene.actors.length}.`);
packages/core/src/voxel\cityWorldRenderCommands.ts:337:    profileId: budget.profileId,
packages/core/src/voxel\cityWorldRenderCommands.ts:350:export function cityWorldPropDepthKey(prop: Pick<CityWorldProp, "position">): number {
packages/core/src/voxel\cityWorldRenderCommands.ts:351:  return pointZOrder(prop.position);
packages/core/src/voxel\cityWorldRenderCommands.ts:362:// 0.74F clutter-contract revision (user-approved): the curated prop kit
packages/core/src/voxel\cityWorldRenderCommands.ts:363:// (bench, streetlight, fountain, sign, dock, boat, water tower) graduates to
packages/core/src/voxel\cityWorldRenderCommands.ts:366:const forbiddenPublicPropKinds = new Set<CityWorldProp["kind"]>(["parked_car", "cloud"]);
packages/core/src/voxel\cityWorldRenderCommands.ts:429:    terrainCommandCount: commandCount("terrain"),
packages/core/src/voxel\cityWorldRenderCommands.ts:433:    propCommandCount: commandCount("props"),
web/src\CityWorldRenderer.tsx:71:  kind: "car" | "walker" | "water" | "cloud" | "pulse";
web/src\CityWorldRenderer.tsx:80:  "terrainLayer" | "roadLayer" | "lotLayer" | "padLayer" | "shadowLayer" | "buildingPropDepthLayer" | "buildingLayer" | "propLayer" | "actorLayer" | "focusLayer" | "labelLayer" | "markerLayer" | "hudBridgeLayer",
web/src\CityWorldRenderer.tsx:152:  park: 0x83aa64,
web/src\CityWorldRenderer.tsx:154:  water: 0x176a9f,
web/src\CityWorldRenderer.tsx:160:  park: 0x8cab6e,
web/src\CityWorldRenderer.tsx:162:  water: 0x237aa4,
web/src\CityWorldRenderer.tsx:168:  park: 0x9dac86,
web/src\CityWorldRenderer.tsx:170:  water: 0x5b91a6,
web/src\CityWorldRenderer.tsx:177:  park: 0x84ad68,
web/src\CityWorldRenderer.tsx:181:  waterfront: 0x93ccd4,
web/src\CityWorldRenderer.tsx:187:  park: 0x8bad6c,
web/src\CityWorldRenderer.tsx:191:  waterfront: 0x97c6ca,
web/src\CityWorldRenderer.tsx:197:  park: 0x9fad86,
web/src\CityWorldRenderer.tsx:201:  waterfront: 0x9dbdc2,
web/src\CityWorldRenderer.tsx:208:// (visualGrammar.terrainContact / roadContact / lotContact). These resolvers
web/src\CityWorldRenderer.tsx:220:  return tile.visualGrammar?.terrainContact ?? { tone: groundToneFromId(tile.id), contactShadow: false };
web/src\CityWorldRenderer.tsx:226:      profile: road.kind === "crosswalk" ? "painted" : road.kind === "driveway" ? "apron" : "embedded",
web/src\CityWorldRenderer.tsx:229:        road.kind === "avenue" ? "avenue_dash" : road.kind === "street" ? "street_dash" : road.kind === "driveway" ? "apron_dash" : "none",
web/src\CityWorldRenderer.tsx:237:      profile: lot.kind === "waterfront" ? "shore" : lot.kind === "park" ? "green" : lot.kind === "shop" || lot.kind === "gym" ? "apron" : "foundation",
web/src\CityWorldRenderer.tsx:433:  // animated targets exist, then parks at 0 fps. Ambient animation is capped
web/src\CityWorldRenderer.tsx:572:      // this handle (e.g. hide propLayer to attribute a visual artifact) and
web/src\CityWorldRenderer.tsx:598:      // owned rAF loop repaints only when dirty or animating, then parks.
web/src\CityWorldRenderer.tsx:792:        // A pinch finger lifted while another stays down: re-anchor the drag
web/src\CityWorldRenderer.tsx:902:    // The focus pulse runs briefly, then freezes so the render loop can park:
web/src\CityWorldRenderer.tsx:954:  // pinch stays anchored to the fingers, wheel to the cursor (screen-center
web/src\CityWorldRenderer.tsx:967:    const anchorX = clientX - rect.left;
web/src\CityWorldRenderer.tsx:968:    const anchorY = clientY - rect.top;
web/src\CityWorldRenderer.tsx:969:    const worldX = (anchorX - camera.x) / previousZoom;
web/src\CityWorldRenderer.tsx:970:    const worldY = (anchorY - camera.y) / previousZoom;
web/src\CityWorldRenderer.tsx:972:    camera.x = anchorX - worldX * clamped;
web/src\CityWorldRenderer.tsx:973:    camera.y = anchorY - worldY * clamped;
web/src\CityWorldRenderer.tsx:1062:      const point = project(place.anchor);
web/src\CityWorldRenderer.tsx:1095:// without touching the base scene: visible places, their anchored buildings,
web/src\CityWorldRenderer.tsx:1157:  drawBanded(layers.terrainLayer, orderedSceneItems(renderCommands, "terrain_tile", itemIndex.terrainTiles), (g, tile) => drawTerrainTile(g, tile, atlas));
web/src\CityWorldRenderer.tsx:1162:  // 0.67H focal calm — props inside the focal anchor's ring dim toward
web/src\CityWorldRenderer.tsx:1164:  // The base scene is focus-agnostic (0.74F), so the focal anchor keys off
web/src\CityWorldRenderer.tsx:1168:  const props = orderedSceneItems(renderCommands, "prop", itemIndex.props);
web/src\CityWorldRenderer.tsx:1169:  drawDepthInterleavedBuildingsAndProps(layers, buildings, props, animated, atlas, shouldDrawMaterialTexture(cameraZoom), (prop) =>
web/src\CityWorldRenderer.tsx:1170:    focalCalm(prop.position, focalAnchor),
web/src\CityWorldRenderer.tsx:1178:  // the tallest structure anchored to it (plus crown allowance), instead of
web/src\CityWorldRenderer.tsx:1179:  // sitting at a fixed ground offset that erased landmark crowns.
web/src\CityWorldRenderer.tsx:1197:    const anchored = focus.buildingsByPlaceId.get(building.placeId);
web/src\CityWorldRenderer.tsx:1198:    if (anchored) anchored.push(building);
web/src\CityWorldRenderer.tsx:1234:// highest-priority anchors. Focus-overlay labels render on top of this
web/src\CityWorldRenderer.tsx:1247:// 0.67H focal calm — the default-selected place (or the first landmark as a
web/src\CityWorldRenderer.tsx:1250:  const focal = scene.places.find((place) => place.id === selectedPlaceId) ?? scene.places.find((place) => place.kind === "landmark");
web/src\CityWorldRenderer.tsx:1251:  return focal?.anchor;
web/src\CityWorldRenderer.tsx:1304:  props: CityWorldProp[],
web/src\CityWorldRenderer.tsx:1308:  propCalm: (prop: CityWorldProp) => number = () => 1,
web/src\CityWorldRenderer.tsx:1311:  const propProxy = layers.propLayer as QaVisibilityProxyLayer;
web/src\CityWorldRenderer.tsx:1313:  propProxy.atlasVisibilityTargets.length = 0;
web/src\CityWorldRenderer.tsx:1324:    ...props.map((prop, sourceIndex) => ({
web/src\CityWorldRenderer.tsx:1325:      id: prop.id,
web/src\CityWorldRenderer.tsx:1326:      kind: "prop" as const,
web/src\CityWorldRenderer.tsx:1327:      depthKey: cityWorldPropDepthKey(prop),
web/src\CityWorldRenderer.tsx:1329:      prop,
web/src\CityWorldRenderer.tsx:1342:      drawProp(group, item.prop, animated, atlas, propCalm(item.prop));
web/src\CityWorldRenderer.tsx:1343:      group.visible = propProxy.visible;
web/src\CityWorldRenderer.tsx:1344:      propProxy.atlasVisibilityTargets.push(group);
web/src\CityWorldRenderer.tsx:1352:  for (const tile of scene.terrainTiles) {
web/src\CityWorldRenderer.tsx:1353:    const massing = tile.visualGrammar?.terrainChunkMassing ?? "none";
web/src\CityWorldRenderer.tsx:1354:    if (massing === "none") continue;
web/src\CityWorldRenderer.tsx:1356:    const color = debugColorForMassing(massing);
web/src\CityWorldRenderer.tsx:1387:    outline.stroke({ color, alpha: 0.58, width: building.visualGrammar?.clusterRole === "anchor" ? 2 : 1.2, cap: "round", join: "round" });
web/src\CityWorldRenderer.tsx:1388:    if (building.visualGrammar?.noLabelPriority === "primary_anchor") {
web/src\CityWorldRenderer.tsx:1392:    if (building.visualGrammar?.clusterRole === "anchor" || building.visualGrammar?.noLabelPriority === "primary_anchor") {
web/src\CityWorldRenderer.tsx:1398:function debugColorForMassing(massing: NonNullable<CityWorldTerrainTile["visualGrammar"]>["terrainChunkMassing"]) {
web/src\CityWorldRenderer.tsx:1399:  if (massing === "outer_world_edge_mass") return 0x335cff;
web/src\CityWorldRenderer.tsx:1400:  if (massing === "civic_plinth_mass") return 0xff9d00;
web/src\CityWorldRenderer.tsx:1401:  if (massing === "residential_shelf_mass") return 0x48cc6c;
web/src\CityWorldRenderer.tsx:1402:  if (massing === "commercial_slab_mass") return 0xffcf33;
web/src\CityWorldRenderer.tsx:1403:  if (massing === "park_basin_cut_mass") return 0x2f9e44;
web/src\CityWorldRenderer.tsx:1404:  if (massing === "waterfront_bank_cut_mass") return 0x22b8cf;
web/src\CityWorldRenderer.tsx:1405:  if (massing === "shell_boundary_mass") return 0x8c8c8c;
web/src\CityWorldRenderer.tsx:1412:  if (family === "civic_landmark") return 0x80bfff;
web/src\CityWorldRenderer.tsx:1415:  if (family === "venue_anchor") return 0xff6b6b;
web/src\CityWorldRenderer.tsx:1416:  if (family === "transit_anchor") return 0x4dabf7;
web/src\CityWorldRenderer.tsx:1423:  if (family === "civic_landmark") return "CIV";
web/src\CityWorldRenderer.tsx:1426:  if (family === "venue_anchor") return "VEN";
web/src\CityWorldRenderer.tsx:1427:  if (family === "transit_anchor") return "TRN";
web/src\CityWorldRenderer.tsx:1442:  label.anchor.set(0.5);
web/src\CityWorldRenderer.tsx:1449:    terrainLayer: namedLayer("terrainLayer"),
web/src\CityWorldRenderer.tsx:1451:    // a lot (park loop, generated overlaps) must read as embedded asphalt
web/src\CityWorldRenderer.tsx:1459:    propLayer: namedVisibilityProxyLayer("propLayer"),
web/src\CityWorldRenderer.tsx:1477:function namedVisibilityProxyLayer(label: "buildingLayer" | "propLayer"): QaVisibilityProxyLayer {
web/src\CityWorldRenderer.tsx:1499:  const regionalTerrain = tile.paletteKey?.startsWith("terrain.region.") ? atlas.resolvePalette(tile.paletteKey, "terrain").colors : undefined;
web/src\CityWorldRenderer.tsx:1502:  // per-tile hash so the ground reads as planted terrain, not a flat board —
web/src\CityWorldRenderer.tsx:1509:  const toneScale = tile.kind === "water" ? 0.9 : tile.kind === "grass" ? 1.25 : 0.6;
web/src\CityWorldRenderer.tsx:1510:  const variation = (tile.variant - 2) * (tile.kind === "water" ? 3.1 : tile.kind === "grass" ? 1.2 : 1.8) + (lowFrequencyTone + hashTone) * toneScale;
web/src\CityWorldRenderer.tsx:1512:  // bright against the terrain instead of blending into it.
web/src\CityWorldRenderer.tsx:1515:    : tile.kind === "water"
web/src\CityWorldRenderer.tsx:1518:  const alpha = shellTile ? (tile.kind === "grass" ? 0.86 : 0.9) : draftTile ? (tile.kind === "grass" ? 0.84 : 0.92) : tile.kind === "water" ? 0.97 : tile.kind === "grass" ? 0.92 : 0.94;
web/src\CityWorldRenderer.tsx:1519:  const strokeAlpha = shellTile ? (tile.kind === "grass" ? 0.1 : 0.14) : draftTile ? (tile.kind === "grass" ? 0.018 : 0.1) : tile.kind === "grass" ? 0.026 : tile.kind === "water" ? 0.28 : 0.12;
web/src\CityWorldRenderer.tsx:1520:  const strokeColor = tile.kind === "water" ? 0x0b4f79 : shellTile ? 0x747965 : draftTile ? 0x7a8a58 : regionalTerrain ? colorToNumber(regionalTerrain.shade) : 0x6d824f;
web/src\CityWorldRenderer.tsx:1528:  if (tile.kind === "water") {
web/src\CityWorldRenderer.tsx:1543:  } else if (tile.kind === "park" && tile.variant % 3 === 0) {
web/src\CityWorldRenderer.tsx:1562:// 0.74F terrain relief: raised tiles extrude stacked voxel cliff courses on
web/src\CityWorldRenderer.tsx:1564:// sun-consistent visible cliff walls; north/west bands read as shadowed cuts
web/src\CityWorldRenderer.tsx:1576:  const cliffBase = shadeColor(color, -10);
web/src\CityWorldRenderer.tsx:1585:        ? sunlitColor(shadeColor(cliffBase, -course * 9), side === "south" ? "sun" : "shade")
web/src\CityWorldRenderer.tsx:1586:        : shadeColor(cliffBase, -30 - course * 8);
web/src\CityWorldRenderer.tsx:1613:// Material seams + water bank strands, authored by the compiler as
web/src\CityWorldRenderer.tsx:1614:// terrainContact metadata. Seams are inset inside the owning tile so they
web/src\CityWorldRenderer.tsx:1619:  const waterEdgeSides = contact.waterEdgeSides ?? [];
web/src\CityWorldRenderer.tsx:1620:  if (edgeSides.length === 0 && waterEdgeSides.length === 0) return;
web/src\CityWorldRenderer.tsx:1644:  if (waterEdgeSides.length > 0 && style.strandAlpha > 0) {
web/src\CityWorldRenderer.tsx:1648:    for (const side of waterEdgeSides) {
web/src\CityWorldRenderer.tsx:1655:    for (const side of waterEdgeSides) {
web/src\CityWorldRenderer.tsx:1660:    for (const side of waterEdgeSides) {
web/src\CityWorldRenderer.tsx:1669:  const massing = tile.visualGrammar?.terrainChunkMassing ?? "none";
web/src\CityWorldRenderer.tsx:1670:  if (massing === "none") return;
web/src\CityWorldRenderer.tsx:1673:  const config = terrainChunkMassingStyle(massing, color, chunkEdge);
web/src\CityWorldRenderer.tsx:1685:  // Sun-consistent massing faces: lower-left face lit, lower-right in shade.
web/src\CityWorldRenderer.tsx:1721:function terrainChunkMassingStyle(
web/src\CityWorldRenderer.tsx:1722:  massing: NonNullable<CityWorldTerrainTile["visualGrammar"]>["terrainChunkMassing"],
web/src\CityWorldRenderer.tsx:1727:  if (massing === "outer_world_edge_mass") {
web/src\CityWorldRenderer.tsx:1743:  if (massing === "civic_plinth_mass") {
web/src\CityWorldRenderer.tsx:1759:  if (massing === "residential_shelf_mass") {
web/src\CityWorldRenderer.tsx:1775:  if (massing === "commercial_slab_mass") {
web/src\CityWorldRenderer.tsx:1791:  if (massing === "park_basin_cut_mass") {
web/src\CityWorldRenderer.tsx:1807:  if (massing === "waterfront_bank_cut_mass") {
web/src\CityWorldRenderer.tsx:1823:  if (massing === "shell_boundary_mass") {
web/src\CityWorldRenderer.tsx:1856:  const elevation = tile.visualGrammar?.terrainElevation;
web/src\CityWorldRenderer.tsx:1861:  const cut = elevation === "water_edge_cut";
web/src\CityWorldRenderer.tsx:1862:  const basin = elevation === "park_basin_shelf";
web/src\CityWorldRenderer.tsx:1879:  if ((elevation === "civic_plinth_shelf" || cut || hash === 3 || hash === 11) && elevation !== "park_basin_shelf") {
web/src\CityWorldRenderer.tsx:1914:  const composition = tile.visualGrammar?.terrainComposition;
web/src\CityWorldRenderer.tsx:1915:  const profile = tile.visualGrammar?.terrainProfile;
web/src\CityWorldRenderer.tsx:1919:  const civic = composition === "civic_focus_field" || profile === "landmark_civic_ground";
web/src\CityWorldRenderer.tsx:1921:  const waterfront = composition === "waterfront_edge_strata";
web/src\CityWorldRenderer.tsx:1922:  const park = composition === "park_basin";
web/src\CityWorldRenderer.tsx:1925:  const parcelColor = civic ? 0xe5d7ad : commercial ? 0xddc798 : park ? 0xbfdc91 : draft ? 0xd2cf98 : 0xc9dea0;
web/src\CityWorldRenderer.tsx:1926:  const seamColor = civic || commercial ? 0xf5e9c9 : park ? 0xeaf1bb : draft ? 0xf2dfb4 : 0xe6efbd;
web/src\CityWorldRenderer.tsx:1968:  if (park && (hash === 1 || hash === 15)) {
web/src\CityWorldRenderer.tsx:1976:  if (waterfront && hash % 4 === 0) {
web/src\CityWorldRenderer.tsx:1986:  const elevation = tile.visualGrammar?.terrainElevation;
web/src\CityWorldRenderer.tsx:1990:  const depth = terrainElevationDepth(elevation, chunkEdge);
web/src\CityWorldRenderer.tsx:1992:  // lower-right face is in shade, so terrain steps read as real height.
web/src\CityWorldRenderer.tsx:1993:  const leftShade = sunlitColor(shadeColor(color, elevation === "water_edge_cut" ? -16 : -8), "sun");
web/src\CityWorldRenderer.tsx:1998:      : elevation === "water_edge_cut"
web/src\CityWorldRenderer.tsx:2039:      chunkEdge === "waterfront_bank_edge"
web/src\CityWorldRenderer.tsx:2041:        : chunkEdge === "park_basin_edge"
web/src\CityWorldRenderer.tsx:2046:    const edgeAlpha = chunkEdge === "waterfront_bank_edge" ? 0.24 : chunkEdge === "world_edge" ? 0.1 : chunkEdge === "parcel_cluster_edge" ? 0.13 : 0.18;
web/src\CityWorldRenderer.tsx:2051:      .stroke({ color: edgeColor, alpha: edgeAlpha, width: chunkEdge === "waterfront_bank_edge" ? 1.4 : 1, cap: "round", join: "round" });
web/src\CityWorldRenderer.tsx:2055:function terrainElevationDepth(elevation: NonNullable<CityWorldTerrainTile["visualGrammar"]>["terrainElevation"], chunkEdge: NonNullable<CityWorldTerrainTile["visualGrammar"]>["chunkEdge"]) {
web/src\CityWorldRenderer.tsx:2059:  if (elevation === "park_basin_shelf") return 3.2;
web/src\CityWorldRenderer.tsx:2060:  if (elevation === "water_edge_cut") return 7.4;
web/src\CityWorldRenderer.tsx:2084:  if (tile.kind === "park" && hash % 5 === 0) {
web/src\CityWorldRenderer.tsx:2140:  const physicalRoads = roads.filter((road) => resolveRoadContact(road).profile !== "painted");
web/src\CityWorldRenderer.tsx:2145:    if (joint.roads.length > 1 || joint.roads.some((road) => resolveRoadContact(road).profile === "apron")) {
web/src\CityWorldRenderer.tsx:2147:    } else if (joint.roads.length === 1 && resolveRoadContact(joint.roads[0] as CityWorldRoadSegment).profile === "embedded") {
web/src\CityWorldRenderer.tsx:2152:  for (const road of roads.filter((road) => resolveRoadContact(road).profile === "painted")) drawCrosswalkRoad(passes.crosswalks, road);
web/src\CityWorldRenderer.tsx:2169:// Dead-end streets stop looking sheared: a rounded curb stub + surface disk
web/src\CityWorldRenderer.tsx:2188:  const apron = contact.profile === "apron";
web/src\CityWorldRenderer.tsx:2243:  } else if (contact.laneMarking === "street_dash") {
web/src\CityWorldRenderer.tsx:2254:  if (length <= 0 || contact.profile === "painted") return;
web/src\CityWorldRenderer.tsx:2268:  const step = contact.profile === "apron" ? 34 : 44;
web/src\CityWorldRenderer.tsx:2285:  if (length <= 0 || contact.profile === "painted") return;
web/src\CityWorldRenderer.tsx:2287:  const apron = contact.profile === "apron";
web/src\CityWorldRenderer.tsx:2317:  if (length <= 0 || contact.profile === "painted") return;
web/src\CityWorldRenderer.tsx:2319:  const apron = contact.profile === "apron";
web/src\CityWorldRenderer.tsx:2507:  const drivewayOnly = contacts.every((contact) => contact.profile === "apron");
web/src\CityWorldRenderer.tsx:2545:  const hasMainRoad = joint.roads.some((road) => resolveRoadContact(road).profile === "embedded");
web/src\CityWorldRenderer.tsx:2548:  const driveways = joint.roads.filter((road) => resolveRoadContact(road).profile === "apron");
web/src\CityWorldRenderer.tsx:2631:  const quietPad = lotContact.profile === "foundation";
web/src\CityWorldRenderer.tsx:2635:  const lotAlpha = shellLot ? (quietPad ? 0.82 : 0.86) : draftLot ? (quietPad ? 0.84 : 0.86) : lotContact.profile === "shore" ? 0.55 : quietPad ? 0.94 : 0.96;
web/src\CityWorldRenderer.tsx:2638:    ? lotContact.profile === "green"
web/src\CityWorldRenderer.tsx:2642:    ? lotContact.profile === "green"
web/src\CityWorldRenderer.tsx:2645:    : lotContactProfile === "landmark_base_shadow"
web/src\CityWorldRenderer.tsx:2652:  const contactSpread = lotContactProfile === "landmark_base_shadow" ? 1.1 : lotContactProfile === "soft_ground_shadow" ? 1.12 : 1.04;
web/src\CityWorldRenderer.tsx:2653:  // Waterfront lots have real water terrain beneath them; a lot slab on top
web/src\CityWorldRenderer.tsx:2656:  if (lotContact.profile === "shore") return;
web/src\CityWorldRenderer.tsx:2658:  if (!mutedLot && lotContactProfile === "landmark_base_shadow") {
web/src\CityWorldRenderer.tsx:2685:  if (lot.kind === "park") {
web/src\CityWorldRenderer.tsx:2705:  } else if (lot.kind === "waterfront") {
web/src\CityWorldRenderer.tsx:2715:  if (kind === "park" || kind === "waterfront") return;
web/src\CityWorldRenderer.tsx:2736:  if (draftLot || lot.kind === "park" || lot.kind === "waterfront") return;
web/src\CityWorldRenderer.tsx:2738:  const profile = lot.visualGrammar?.lotProfile;
web/src\CityWorldRenderer.tsx:2740:  if (profile === "residential_yard_grid") {
web/src\CityWorldRenderer.tsx:2774:  if (profile === "landmark_civic_ground") {
web/src\CityWorldRenderer.tsx:2796:  if (profile === "commercial_forecourt" || profile === "apartment_court") {
web/src\CityWorldRenderer.tsx:2800:      profile === "apartment_court" ? 0xdac7a1 : 0xe8cf9f,
web/src\CityWorldRenderer.tsx:2805:    const count = profile === "apartment_court" ? 3 : 5;
web/src\CityWorldRenderer.tsx:2827:          : elevation === "waterfront_bank_cut"
web/src\CityWorldRenderer.tsx:2829:            : elevation === "hidden_anchor_shelf"
web/src\CityWorldRenderer.tsx:2831:              : elevation === "park_basin_lip"
web/src\CityWorldRenderer.tsx:2853:    .stroke({ color: elevation === "waterfront_bank_cut" ? 0xe9fbff : 0xf1dfb7, alpha: elevation === "waterfront_bank_cut" ? 0.2 : 0.14, width: 1.2, cap: "round", join: "round" });
web/src\CityWorldRenderer.tsx:2868:  if (lotContact.profile === "shore" || lotContact.profile === "green") return;
web/src\CityWorldRenderer.tsx:2870:  const quiet = lotContact.profile === "foundation";
web/src\CityWorldRenderer.tsx:2895:// look served by its street instead of floating beside it.
web/src\CityWorldRenderer.tsx:2897:  if (!lotContact.curbCutEdge || lotContact.profile === "shore") return;
web/src\CityWorldRenderer.tsx:2900:  const green = lotContact.profile === "green";
web/src\CityWorldRenderer.tsx:2901:  const quiet = lotContact.profile === "foundation";
web/src\CityWorldRenderer.tsx:2923:  if (kind === "park" || kind === "waterfront") return;
web/src\CityWorldRenderer.tsx:2944:  if (lotContact.profile === "shore" || lotContact.profile === "green") return;
web/src\CityWorldRenderer.tsx:2946:  const alpha = lotContact.profile === "foundation" ? 0.18 : 0.22;
web/src\CityWorldRenderer.tsx:2947:  const color = lotContact.profile === "foundation" ? 0xf2e4b8 : 0xf4e8c7;
web/src\CityWorldRenderer.tsx:2997:  if (composition === "civic_landmark_plinth") {
web/src\CityWorldRenderer.tsx:3022:  if (composition === "park_path_basin") {
web/src\CityWorldRenderer.tsx:3031:  if (composition === "waterfront_bank" || composition === "hidden_draft_anchor_pad") {
web/src\CityWorldRenderer.tsx:3032:    const strataColor = composition === "hidden_draft_anchor_pad" ? 0x8b7954 : 0xe9fbff;
web/src\CityWorldRenderer.tsx:3040:      .stroke({ color: strataColor, alpha: composition === "hidden_draft_anchor_pad" ? 0.18 : 0.22, width: 1.25, cap: "round", join: "round" });
web/src\CityWorldRenderer.tsx:3229:  return building.objectKit?.prefabFamily === "civic_landmark";
web/src\CityWorldRenderer.tsx:3251:  sprite.anchor.set(asset.anchor.x, asset.anchor.y);
web/src\CityWorldRenderer.tsx:3297:  const style = building.facadeStyle ?? building.kind;
web/src\CityWorldRenderer.tsx:3323:  const roofShape = building.roofShape ?? "flat";
web/src\CityWorldRenderer.tsx:3324:  if (roofShape !== "gable" && roofShape !== "hip") return;
web/src\CityWorldRenderer.tsx:3342:  } else if (variant % 3 === 1 && building.facadeStyle !== "cottage") {
web/src\CityWorldRenderer.tsx:3356:// at the facade base plus a short walk stub toward the street, mirrored with
web/src\CityWorldRenderer.tsx:3360:  if (building.facadeStyle === "rowhome") return;
web/src\CityWorldRenderer.tsx:3416:  if (family === "civic_landmark") drawAuthoredCivicLandmarkMass(layer, geometry, building);
web/src\CityWorldRenderer.tsx:3420:  if (family === "venue_anchor" || family === "transit_anchor") drawHiddenDraftAnchorAuthorship(layer, geometry, building);
web/src\CityWorldRenderer.tsx:3424:  if (family === "civic_landmark") drawPublicCivicLandmarkObjectKit(layer, geometry, building);
web/src\CityWorldRenderer.tsx:3436:  if (building.id === "building-civic") drawEastvaleCorePublicCivicSignature(layer, geometry);
web/src\CityWorldRenderer.tsx:3440:// facade rhythm for this exact population (both run only on civic_landmark
web/src\CityWorldRenderer.tsx:3485:  // cap + inset + shoulder strokes only draw for non-hero kit landmarks.
web/src\CityWorldRenderer.tsx:3531:function drawEastvaleCorePublicCivicSignature(layer: Container, geometry: BuildingGeometry) {
web/src\CityWorldRenderer.tsx:3547:  const style = building.facadeStyle ?? "suburban";
web/src\CityWorldRenderer.tsx:3559:  // its unique jobs: the side-wing massing and the dark roof-break stroke.
web/src\CityWorldRenderer.tsx:3570:  const bayCount = building.facadeStyle === "strip_store" ? 4 : 3;
web/src\CityWorldRenderer.tsx:3627:  // profile never bleeds past the roof edge on generated footprints.
web/src\CityWorldRenderer.tsx:3656:  const style = building.facadeStyle ?? "suburban";
web/src\CityWorldRenderer.tsx:3815:  const isEastvaleCore = civicGeometry?.focusTarget === "eastvale_core";
web/src\CityWorldRenderer.tsx:3823:      .fill({ color: tier === 0 ? 0xd6bb86 : 0xead0a1, alpha: isEastvaleCore ? 0.22 + tier * 0.06 : 0.16 + tier * 0.04 })
web/src\CityWorldRenderer.tsx:3824:      .stroke({ color: 0x756947, alpha: isEastvaleCore ? 0.14 : 0.09, width: 0.9 });
web/src\CityWorldRenderer.tsx:3845:  facadePiers.stroke({ color: shadeColor(trimColor, -18), alpha: isEastvaleCore ? 0.24 : 0.14, width: isEastvaleCore ? 1.2 : 0.9, cap: "round", join: "round" });
web/src\CityWorldRenderer.tsx:3856:  glassBands.stroke({ color: 0xc9edf2, alpha: isEastvaleCore ? 0.34 : 0.22, width: 1.6, cap: "round", join: "round" });
web/src\CityWorldRenderer.tsx:3861:    isEastvaleCore ? 0.38 : 0.26,
web/src\CityWorldRenderer.tsx:3866:  // 0.53E item C — the hero landmark's entry reads as a real portal: a wider
web/src\CityWorldRenderer.tsx:3870:  if (isEastvaleCore) {
web/src\CityWorldRenderer.tsx:3898:  // 0.53E item C — the hero landmark's crown is the TIERED MASSING (drawn in
web/src\CityWorldRenderer.tsx:3901:  // decal; ordinary civic landmarks keep it.
web/src\CityWorldRenderer.tsx:3902:  const roofCap = isEastvaleCore
web/src\CityWorldRenderer.tsx:3925:  const isEastvaleGym = serviceGeometry?.focusTarget === "eastvale_gym";
web/src\CityWorldRenderer.tsx:3930:    isEastvaleGym ? 0.4 : 0.28,
web/src\CityWorldRenderer.tsx:3932:    isEastvaleGym ? 0.18 : 0.1,
web/src\CityWorldRenderer.tsx:3941:  foundationLine.stroke({ color: 0x24352f, alpha: isEastvaleGym ? 0.28 : 0.18, width: isEastvaleGym ? 3 : 2.2, cap: "round", join: "round" });
web/src\CityWorldRenderer.tsx:3982:  utilitySideRibs.stroke({ color: shadeColor(trimColor, -22), alpha: isEastvaleGym ? 0.22 : 0.14, width: 1.15, cap: "round", join: "round" });
web/src\CityWorldRenderer.tsx:4040:  if (building.visualGrammar?.noLabelPriority !== "primary_anchor") return;
web/src\CityWorldRenderer.tsx:4042:  const anchorHalo = polygon(
web/src\CityWorldRenderer.tsx:4044:    building.visualGrammar.objectFamily === "transit_anchor" ? 0x9fb3af : 0xd9c091,
web/src\CityWorldRenderer.tsx:4050:  const ribCount = building.visualGrammar.objectFamily === "transit_anchor" ? 8 : 6;
web/src\CityWorldRenderer.tsx:4067:  layer.addChild(anchorHalo, roofRead, silhouetteRibs);
web/src\CityWorldRenderer.tsx:4081:  const anchorX = bottom.x + 5;
web/src\CityWorldRenderer.tsx:4082:  const anchorY = bottom.y + depth * 0.08;
web/src\CityWorldRenderer.tsx:4083:  const left = { x: anchorX - width * 0.5, y: anchorY };
web/src\CityWorldRenderer.tsx:4084:  const top = { x: anchorX, y: anchorY - depth * 0.5 };
web/src\CityWorldRenderer.tsx:4085:  const right = { x: anchorX + width * 0.5, y: anchorY };
web/src\CityWorldRenderer.tsx:4086:  const base = { x: anchorX, y: anchorY + depth * 0.5 };
web/src\CityWorldRenderer.tsx:4116:  const style = building.facadeStyle ?? building.kind;
web/src\CityWorldRenderer.tsx:4161:  const profile = building.visualGrammar?.contactProfile ?? "parcel_pad_shadow";
web/src\CityWorldRenderer.tsx:4166:  if (profile === "landmark_base_shadow") {
web/src\CityWorldRenderer.tsx:4181:  if (profile === "soft_ground_shadow") {
web/src\CityWorldRenderer.tsx:4188:  if (profile === "curb_shadow") {
web/src\CityWorldRenderer.tsx:4368:    family === "civic_landmark" ||
web/src\CityWorldRenderer.tsx:4370:    family === "venue_anchor" ||
web/src\CityWorldRenderer.tsx:4371:    family === "transit_anchor"
web/src\CityWorldRenderer.tsx:4480:// 0.53E Hero Silhouette — a setback upper tier for civic/venue/transit anchors,
web/src\CityWorldRenderer.tsx:4481:// so the hero landmark reads as a stepped, tall structure instead of a single
web/src\CityWorldRenderer.tsx:4484:// silhouette cue. Sun-consistent; only for tall anchors so it stays rare.
web/src\CityWorldRenderer.tsx:4485:// 0.53E item C — when the hero landmark carries the tiered crown, the crown
web/src\CityWorldRenderer.tsx:4496:  const isAnchor = family === "civic_landmark" || family === "venue_anchor" || family === "transit_anchor";
web/src\CityWorldRenderer.tsx:4503:  // 0.53E item C — the hero landmark (typed via civicGeometry.focusTarget) gets
web/src\CityWorldRenderer.tsx:4506:  // anchors keep the single restrained tier.
web/src\CityWorldRenderer.tsx:4512:  // the ground anchor, so the crown caps must land in the open window between
web/src\CityWorldRenderer.tsx:4563:  const eligible = family === "commerce_strip" || family === "civic_landmark" || family === "service_block" || family === "venue_anchor" || family === "transit_anchor";
web/src\CityWorldRenderer.tsx:4573:  const civic = family === "civic_landmark" || family === "venue_anchor" || family === "transit_anchor";
web/src\CityWorldRenderer.tsx:4644:  const profile = building.visualGrammar?.materialProfile;
web/src\CityWorldRenderer.tsx:4645:  if (!profile) return;
web/src\CityWorldRenderer.tsx:4659:  if (profile === "socal_stucco_warm") {
web/src\CityWorldRenderer.tsx:4664:  if (profile === "socal_stucco_light") {
web/src\CityWorldRenderer.tsx:4669:  if (profile === "socal_cool_stucco") {
web/src\CityWorldRenderer.tsx:4689:  if (profile === "socal_storefront") {
web/src\CityWorldRenderer.tsx:4697:  if (profile === "socal_lowrise") {
web/src\CityWorldRenderer.tsx:4706:  if (profile === "civic_glass_stucco") {
web/src\CityWorldRenderer.tsx:4721:  const roofShape = building.roofShape ?? "flat";
web/src\CityWorldRenderer.tsx:4755:  if (roofShape === "gable") {
web/src\CityWorldRenderer.tsx:4783:  } else if (roofShape === "hip") {
web/src\CityWorldRenderer.tsx:4797:  } else if (roofShape === "sawtooth") {
web/src\CityWorldRenderer.tsx:4820:  } else if (roofShape === "tower") {
web/src\CityWorldRenderer.tsx:4840:  drawParapetCap(layer, geometry, building, roofShape);
web/src\CityWorldRenderer.tsx:4847:// roof diamond and draw only behind parapets/authored roof profiles.
web/src\CityWorldRenderer.tsx:4851:  const roofShape = building.roofShape ?? "flat";
web/src\CityWorldRenderer.tsx:4858:    const seed = materialTextureSeed(building.id, `roof-${roofShape}`, course);
web/src\CityWorldRenderer.tsx:4873:  material.stroke({ color: seamColor, alpha: roofShape === "flat" ? 0.2 : 0.16, width: 1, cap: "butt", join: "round" });
web/src\CityWorldRenderer.tsx:4875:  if (roofShape === "gable" || roofShape === "hip") {
web/src\CityWorldRenderer.tsx:4914:function drawParapetCap(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, roofShape: CityWorldBuilding["roofShape"]) {
web/src\CityWorldRenderer.tsx:4915:  if (roofShape !== "flat" && roofShape !== "sawtooth") return;
web/src\CityWorldRenderer.tsx:4918:    family === "commerce_strip" || family === "civic_landmark" || family === "lowrise_cluster" ||
web/src\CityWorldRenderer.tsx:4919:    family === "service_block" || family === "venue_anchor" || family === "transit_anchor";
web/src\CityWorldRenderer.tsx:4948:  const profile = building.visualGrammar?.roofProfile;
web/src\CityWorldRenderer.tsx:4949:  if (!profile) return;
web/src\CityWorldRenderer.tsx:4952:  if (profile === "terracotta_barrel_tile" || profile === "cool_clay_tile" || profile === "sage_tile") {
web/src\CityWorldRenderer.tsx:4956:    const tileTint = profile === "terracotta_barrel_tile" ? 0xc4764e : profile === "cool_clay_tile" ? 0x7f9aa8 : 0x8ba372;
web/src\CityWorldRenderer.tsx:4959:    const tint = polygon(diamondPoints(top, footprintWidth * 0.94, footprintDepth * 0.86), tileTint, profile === "sage_tile" ? 0.2 : 0.18, tileTint, 0);
web/src\CityWorldRenderer.tsx:4963:    const capCount = profile === "terracotta_barrel_tile" ? 5 : 4;
web/src\CityWorldRenderer.tsx:4971:      color: shadeColor(roofColor, profile === "cool_clay_tile" ? 34 : 28),
web/src\CityWorldRenderer.tsx:4972:      alpha: profile === "terracotta_barrel_tile" ? 0.5 : 0.4,
web/src\CityWorldRenderer.tsx:4973:      width: profile === "terracotta_barrel_tile" ? 1.7 : 1.3,
web/src\CityWorldRenderer.tsx:4980:  if (profile === "flat_parapet_cap") {
web/src\CityWorldRenderer.tsx:4995:  if (profile === "blue_metal_utility") {
web/src\CityWorldRenderer.tsx:5014:  if (profile === "civic_glass_cap") {
web/src\CityWorldRenderer.tsx:5035:  const roofShape = building.roofShape ?? "flat";
web/src\CityWorldRenderer.tsx:5046:  if (roofShape === "hip") {
web/src\CityWorldRenderer.tsx:5052:  } else if (roofShape === "flat") {
web/src\CityWorldRenderer.tsx:5066:  const roofShape = building.roofShape ?? "flat";
web/src\CityWorldRenderer.tsx:5070:  if (building.kind !== "home" || (roofShape !== "gable" && roofShape !== "hip")) return;
web/src\CityWorldRenderer.tsx:5084:  const count = building.facadeStyle === "rowhome" || building.facadeStyle === "strip_store" ? 4 : 2;
web/src\CityWorldRenderer.tsx:5097:  const style = building.facadeStyle ?? "cottage";
web/src\CityWorldRenderer.tsx:5244:function drawResidentialAuthorshipVariation(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, style: CityWorldBuilding["facadeStyle"]) {
web/src\CityWorldRenderer.tsx:5285:function drawResidentialMaterialBands(layer: Container, geometry: BuildingGeometry, style: CityWorldBuilding["facadeStyle"]) {
web/src\CityWorldRenderer.tsx:5588:  // 0.55E decal discipline — on object-kit civic landmarks the kit read owns
web/src\CityWorldRenderer.tsx:5606:  if (building.id === "building-civic") drawEastvaleCoreLandmarkDetails(layer, geometry);
web/src\CityWorldRenderer.tsx:5609:function drawEastvaleCoreLandmarkDetails(layer: Container, geometry: BuildingGeometry) {
web/src\CityWorldRenderer.tsx:6258:  const count = building.facadeStyle === "lowrise" ? 6 : 5;
web/src\CityWorldRenderer.tsx:6329:  const count = building.facadeStyle === "rowhome" ? 5 : 3;
web/src\CityWorldRenderer.tsx:6384:function drawProp(layer: Container, prop: CityWorldProp, animated: AnimatedTarget[], atlas: CityWorldAtlasResolver, calm = 1) {
web/src\CityWorldRenderer.tsx:6385:  const point = project(prop.position);
web/src\CityWorldRenderer.tsx:6386:  const asset = atlas.resolveAsset(prop.spriteKey, prop.paletteKey, "prop");
web/src\CityWorldRenderer.tsx:6392:  if (prop.kind === "tree" || prop.kind === "bush") {
web/src\CityWorldRenderer.tsx:6396:    const foliage = prop.variant % 2 === 0 ? baseColor : shadeColor(baseColor, 12);
web/src\CityWorldRenderer.tsx:6397:    const shadowReach = prop.kind === "bush" ? 8 : 14;
web/src\CityWorldRenderer.tsx:6398:    const tree = new Graphics()
web/src\CityWorldRenderer.tsx:6399:      .ellipse(point.x + shadowReach * 0.6, point.y - 1 + shadowReach * 0.18, prop.kind === "bush" ? 10 : 15, prop.kind === "bush" ? 3.6 : 4.6)
web/src\CityWorldRenderer.tsx:6401:    if (prop.kind === "tree") {
web/src\CityWorldRenderer.tsx:6402:      const tall = prop.variant % 3 === 0;
web/src\CityWorldRenderer.tsx:6403:      voxelBox(tree, { x: point.x, y: point.y - 2 }, 5, 3, tall ? 13 : 10, shade);
web/src\CityWorldRenderer.tsx:6404:      voxelBox(tree, { x: point.x, y: point.y - (tall ? 13 : 10) }, 19, 11, 9, shadeColor(foliage, -8));
web/src\CityWorldRenderer.tsx:6405:      voxelBox(tree, { x: point.x, y: point.y - (tall ? 21 : 18) }, 14, 8, 7, foliage);
web/src\CityWorldRenderer.tsx:6406:      if (prop.variant % 2 === 0) {
web/src\CityWorldRenderer.tsx:6407:        voxelBox(tree, { x: point.x, y: point.y - (tall ? 27 : 24) }, 9, 5, 5, shadeColor(foliage, 14));
web/src\CityWorldRenderer.tsx:6410:      voxelBox(tree, { x: point.x, y: point.y - 1 }, 13, 8, 6, shadeColor(foliage, -6));
web/src\CityWorldRenderer.tsx:6411:      voxelBox(tree, { x: point.x, y: point.y - 6.5 }, 8, 5, 4, shadeColor(foliage, 10));
web/src\CityWorldRenderer.tsx:6413:    tree.stroke({ color: 0x26332c, alpha: 0.2, width: 1 });
web/src\CityWorldRenderer.tsx:6416:    tree.alpha = Math.max(calm, 0.7);
web/src\CityWorldRenderer.tsx:6417:    layer.addChild(tree);
web/src\CityWorldRenderer.tsx:6421:  if (prop.kind === "dock") {
web/src\CityWorldRenderer.tsx:6425:    // Plank boxes marching toward the water (SE), on two pile cubes.
web/src\CityWorldRenderer.tsx:6437:  if (prop.kind === "boat") {
web/src\CityWorldRenderer.tsx:6438:    const hullColor = prop.variant % 2 === 0 ? 0xd8dee2 : accent;
web/src\CityWorldRenderer.tsx:6454:  if (prop.kind === "water_tower") {
web/src\CityWorldRenderer.tsx:6458:    // Four leg strokes, tank cylinder, cone cap — the skyline landmark.
web/src\CityWorldRenderer.tsx:6492:  if (prop.kind === "fountain") {
web/src\CityWorldRenderer.tsx:6499:    animated.push({ target: fountain, kind: "water", path: [], speed: 0.025, phase: prop.variant * 0.2, baseAlpha: 0.78 * calm, origin: point });
web/src\CityWorldRenderer.tsx:6504:  if (prop.kind === "water_shimmer") {
web/src\CityWorldRenderer.tsx:6511:    animated.push({ target: shimmer, kind: "water", path: [], speed: 0.02, phase: prop.variant * 0.35, baseAlpha: 0.52 * calm, origin: point });
web/src\CityWorldRenderer.tsx:6516:  if (prop.kind === "streetlight") {
web/src\CityWorldRenderer.tsx:6517:    const streetlight = new Graphics()
web/src\CityWorldRenderer.tsx:6528:    streetlight.alpha = calm;
web/src\CityWorldRenderer.tsx:6529:    layer.addChild(streetlight);
web/src\CityWorldRenderer.tsx:6533:  if (prop.kind === "bench") {
web/src\CityWorldRenderer.tsx:6550:  if (prop.kind === "parked_car") {
web/src\CityWorldRenderer.tsx:6551:    const parkedCar = drawSmallCarGraphic(point, PARKED_CAR_COLORS[prop.variant % PARKED_CAR_COLORS.length] ?? baseColor, prop.variant % 2 === 0 ? "east-west" : "north-south", {
web/src\CityWorldRenderer.tsx:6556:    parkedCar.alpha = calm;
web/src\CityWorldRenderer.tsx:6557:    layer.addChild(parkedCar);
web/src\CityWorldRenderer.tsx:6561:  if (prop.kind === "sign") {
web/src\CityWorldRenderer.tsx:6562:    const boardColor = prop.variant % 3 === 0 ? baseColor : prop.variant % 3 === 1 ? accent : highlight;
web/src\CityWorldRenderer.tsx:6578:  if (prop.kind === "cloud") {
web/src\CityWorldRenderer.tsx:6584:    animated.push({ target: cloud, kind: "cloud", path: [], speed: 0.009, phase: prop.variant * 0.4, baseAlpha: 0.36, origin: point });
web/src\CityWorldRenderer.tsx:6690:  const point = project(place.anchor);
web/src\CityWorldRenderer.tsx:6696:  // can never draw across a wall when the anchor sits inside a structure.
web/src\CityWorldRenderer.tsx:6711:// stroke-only silhouettes of the place's anchored buildings, and the
web/src\CityWorldRenderer.tsx:6723:  const point = project(place.anchor);
web/src\CityWorldRenderer.tsx:6725:  const landmarkFocus = selected && place.kind === "landmark";
web/src\CityWorldRenderer.tsx:6726:  const markerPoint = landmarkFocus ? { x: point.x, y: point.y + 20 } : point;
web/src\CityWorldRenderer.tsx:6727:  const radius = selected ? (landmarkFocus ? 18 : 22) : 20;
web/src\CityWorldRenderer.tsx:6764:  const point = project(place.anchor);
web/src\CityWorldRenderer.tsx:6766:  const landmarkFocus = selected && place.kind === "landmark";
web/src\CityWorldRenderer.tsx:6767:  // 0.67H — focus labels are smaller and quieter; the selected landmark label
web/src\CityWorldRenderer.tsx:6774:      fontSize: landmarkFocus ? 10 : 11,
web/src\CityWorldRenderer.tsx:6779:  text.anchor.set(0.5);
web/src\CityWorldRenderer.tsx:6780:  const baseLift = landmarkFocus ? 70 : 52;
web/src\CityWorldRenderer.tsx:6781:  text.position.set(point.x + (landmarkFocus ? -44 : 0), point.y - Math.max(baseLift, (crownLift ?? 0) + 6));
web/src\CityWorldRenderer.tsx:6782:  const paddingX = landmarkFocus ? 6 : 5;
web/src\CityWorldRenderer.tsx:6783:  const paddingY = landmarkFocus ? 2.5 : 3;
web/src\CityWorldRenderer.tsx:6798:  const point = project(pin.anchor);
web/src\CityWorldRenderer.tsx:6801:  // 0.67H — pins on the focal landmark shrink so the sticker never owns the
web/src\CityWorldRenderer.tsx:6806:    sprite.anchor.set(asset.anchor.x, asset.anchor.y);
web/src\CityWorldRenderer.tsx:6828:  label.anchor.set(0.5);
web/src\CityWorldRenderer.tsx:6836:  // 0.67H — focal-landmark pins slide off the facade toward the plinth apron.
web/src\CityWorldRenderer.tsx:6843:// is the max of the legacy ground offset and the tallest anchored structure's
web/src\CityWorldRenderer.tsx:6849:    const crownAllowance = hasHeroTieredCrown(building) ? 52 : building.roofShape === "tower" ? 30 : 14;
web/src\CityWorldRenderer.tsx:6863:  const point = project(place.anchor);
web/src\CityWorldRenderer.tsx:6874:  text.anchor.set(0.5);
web/src\CityWorldRenderer.tsx:6902:    if (item.kind === "water") {
web/src\CityWorldRenderer.tsx:6945:// The shared primitive behind the blocky prop kit and cliff courses — props
web/src\CityWorldRenderer.tsx:6969:// (terrain, lots, roads) merge thousands of per-item Graphics into a few
web/src\CityWorldRenderer.tsx:7024:// separate from terrain/props (sunlitColor). The global curve pushed lit walls
web/src\CityWorldRenderer.tsx:7040:    park: "P",
packages/core/src/voxel\cityWorldTerrainSampler.ts:13:  terrainTiles: CityWorldTerrainTile[];
packages/core/src/voxel\cityWorldTerrainSampler.ts:19:  terrainMassingCount: number;
packages/core/src/voxel\cityWorldTerrainSampler.ts:25:  const terrainTiles = scene.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
packages/core/src/voxel\cityWorldTerrainSampler.ts:32:    terrainTiles,
packages/core/src/voxel\cityWorldTerrainSampler.ts:36:    authoredTerrainCount: terrainTiles.filter(isAuthoredCityWorldTerrainTile).length,
packages/core/src/voxel\cityWorldTerrainSampler.ts:37:    emptyTerrainCount: terrainTiles.filter((tile) => isEmptyCityWorldBoardTerrainTile(tile, scene)).length,
packages/core/src/voxel\cityWorldTerrainSampler.ts:38:    terrainMassingCount: terrainTiles.filter((tile) => (tile.visualGrammar?.terrainChunkMassing ?? "none") !== "none").length,
packages/core/src/voxel\cityWorldTerrainSampler.ts:39:    chunkEdgeCount: terrainTiles.filter((tile) => (tile.visualGrammar?.chunkEdge ?? "none") !== "none").length,
packages/core/src/voxel\cityWorldTerrainSampler.ts:40:    elevatedTerrainCount: terrainTiles.filter((tile) => {
packages/core/src/voxel\cityWorldTerrainSampler.ts:41:      const elevation = tile.visualGrammar?.terrainElevation;
packages/core/src/voxel\cityWorldTerrainSampler.ts:55:      (grammar.terrainComposition !== "quiet_field" ||
packages/core/src/voxel\cityWorldTerrainSampler.ts:56:        grammar.terrainElevation !== "flat_field" ||
packages/core/src/voxel\cityWorldTerrainSampler.ts:58:        grammar.terrainChunkMassing !== "none"),
packages/core/src/voxel\cityWorldTerrainSampler.ts:65:  if (grammar?.terrainComposition !== "quiet_field") return false;
packages/core/src/voxel\cityWorldTerrainSampler.ts:66:  if (grammar?.terrainElevation !== "flat_field") return false;
packages/core/src/voxel\cityWorldTerrainSampler.ts:68:  if (grammar?.terrainChunkMassing !== "none") return false;
packages/core/src/voxel\cityWorldTypes.ts:24:  | "park"
packages/core/src/voxel\cityWorldTypes.ts:25:  | "waterfront";
packages/core/src/voxel\cityWorldTypes.ts:36:  | "landmark_civic_ground"
packages/core/src/voxel\cityWorldTypes.ts:39:  | "water_edge"
packages/core/src/voxel\cityWorldTypes.ts:47:  | "park_basin"
packages/core/src/voxel\cityWorldTypes.ts:48:  | "waterfront_edge_strata"
packages/core/src/voxel\cityWorldTypes.ts:57:  | "park_basin_shelf"
packages/core/src/voxel\cityWorldTypes.ts:58:  | "water_edge_cut"
packages/core/src/voxel\cityWorldTypes.ts:66:  | "waterfront_bank_edge"
packages/core/src/voxel\cityWorldTypes.ts:67:  | "park_basin_edge"
packages/core/src/voxel\cityWorldTypes.ts:76:  | "park_basin_cut_mass"
packages/core/src/voxel\cityWorldTypes.ts:77:  | "waterfront_bank_cut_mass"
packages/core/src/voxel\cityWorldTypes.ts:87:  | "landmark_civic_ground"
packages/core/src/voxel\cityWorldTypes.ts:90:  | "park_soft_edge"
packages/core/src/voxel\cityWorldTypes.ts:91:  | "waterfront_edge";
packages/core/src/voxel\cityWorldTypes.ts:96:  | "civic_landmark_plinth"
packages/core/src/voxel\cityWorldTypes.ts:98:  | "park_path_basin"
packages/core/src/voxel\cityWorldTypes.ts:99:  | "waterfront_bank"
packages/core/src/voxel\cityWorldTypes.ts:100:  | "hidden_draft_anchor_pad";
packages/core/src/voxel\cityWorldTypes.ts:108:  | "park_basin_lip"
packages/core/src/voxel\cityWorldTypes.ts:109:  | "waterfront_bank_cut"
packages/core/src/voxel\cityWorldTypes.ts:110:  | "hidden_anchor_shelf";
packages/core/src/voxel\cityWorldTypes.ts:128:export type CityWorldContactProfile = "soft_ground_shadow" | "parcel_pad_shadow" | "curb_shadow" | "landmark_base_shadow";
packages/core/src/voxel\cityWorldTypes.ts:142:export type CityWorldRoadLaneMarking = "avenue_dash" | "street_dash" | "apron_dash" | "none";
packages/core/src/voxel\cityWorldTypes.ts:145:  profile: CityWorldRoadContactProfile;
packages/core/src/voxel\cityWorldTypes.ts:153:  profile: CityWorldLotContactProfile;
packages/core/src/voxel\cityWorldTypes.ts:163:  /** Edges where the tile kind changes (parcel/plaza/park seams). */
packages/core/src/voxel\cityWorldTypes.ts:165:  /** Edges that border water (bank/strand treatment). */
packages/core/src/voxel\cityWorldTypes.ts:166:  waterEdgeSides?: CityWorldTileEdge[];
packages/core/src/voxel\cityWorldTypes.ts:172:// extrude stacked cliff courses — it never scans neighbors itself.
packages/core/src/voxel\cityWorldTypes.ts:185:  | "civic_landmark"
packages/core/src/voxel\cityWorldTypes.ts:188:  | "venue_anchor"
packages/core/src/voxel\cityWorldTypes.ts:189:  | "transit_anchor";
packages/core/src/voxel\cityWorldTypes.ts:191:export type CityWorldClusterRole = "anchor" | "support" | "fabric" | "edge";
packages/core/src/voxel\cityWorldTypes.ts:193:export type CityWorldNoLabelPriority = "none" | "supporting" | "primary_anchor";
packages/core/src/voxel\cityWorldTypes.ts:196:  | "civic_landmark"
packages/core/src/voxel\cityWorldTypes.ts:247:  landmarkSignatureScore?: number;
packages/core/src/voxel\cityWorldTypes.ts:254:  terrainProfile?: CityWorldTerrainProfile;
packages/core/src/voxel\cityWorldTypes.ts:255:  terrainComposition?: CityWorldTerrainCompositionProfile;
packages/core/src/voxel\cityWorldTypes.ts:256:  terrainElevation?: CityWorldTerrainElevationProfile;
packages/core/src/voxel\cityWorldTypes.ts:258:  terrainChunkMassing?: CityWorldTerrainChunkMassingProfile;
packages/core/src/voxel\cityWorldTypes.ts:263:  materialProfile?: CityWorldBuildingMaterialProfile;
packages/core/src/voxel\cityWorldTypes.ts:264:  roofProfile?: CityWorldRoofMaterialProfile;
packages/core/src/voxel\cityWorldTypes.ts:271:  terrainContact?: CityWorldTerrainContactGrammar;
packages/core/src/voxel\cityWorldTypes.ts:297:export type CityWorldTerrainKind = "grass" | "park" | "plaza" | "water" | "sidewalk";
packages/core/src/voxel\cityWorldTypes.ts:312:export type CityWorldRoadKind = "street" | "avenue" | "driveway" | "crosswalk";
packages/core/src/voxel\cityWorldTypes.ts:326:export type CityWorldLotKind = "home" | "shop" | "park" | "gym" | "apartments" | "civic" | "waterfront";
packages/core/src/voxel\cityWorldTypes.ts:357:  roofShape?: CityWorldRoofShape;
packages/core/src/voxel\cityWorldTypes.ts:358:  facadeStyle?: CityWorldFacadeStyle;
packages/core/src/voxel\cityWorldTypes.ts:365:  | "tree"
packages/core/src/voxel\cityWorldTypes.ts:368:  | "streetlight"
packages/core/src/voxel\cityWorldTypes.ts:371:  | "parked_car"
packages/core/src/voxel\cityWorldTypes.ts:372:  | "water_shimmer"
packages/core/src/voxel\cityWorldTypes.ts:376:  | "water_tower";
packages/core/src/voxel\cityWorldTypes.ts:395:  anchor: CityWorldPoint;
packages/core/src/voxel\cityWorldTypes.ts:407:  anchor: CityWorldPoint;
packages/core/src/voxel\cityWorldTypes.ts:432:  waterShimmer: number;
packages/core/src/voxel\cityWorldTypes.ts:458:  terrainTiles: CityWorldTerrainTile[];
packages/core/src/voxel\cityWorldTypes.ts:462:  props: CityWorldProp[];
packages/core/src/voxel\index.ts:84:export { riversideDemoVoxelScene } from "./riversideDemoScene.js";
packages/core/src/voxel\mapSession.ts:132:    park: "Park",
packages/core/src/voxel\cityWorldParametricGenerator.ts:42: * enrichment decorators the hand-authored Eastvale path uses
packages/core/src/voxel\cityWorldParametricGenerator.ts:44: * {@link withPropMetadata}). Only terrain visual-grammar is computed here,
packages/core/src/voxel\cityWorldParametricGenerator.ts:45: * because the hand-authored terrain grammar is bound to the fixed Eastvale
packages/core/src/voxel\cityWorldParametricGenerator.ts:48: * The spec consumes curated/synthetic input only — it never touches provider
packages/core/src/voxel\cityWorldParametricGenerator.ts:58:  | "park"
packages/core/src/voxel\cityWorldParametricGenerator.ts:59:  | "water"
packages/core/src/voxel\cityWorldParametricGenerator.ts:99:   * terrain shelf/basin massing. When omitted the generator infers relief from
packages/core/src/voxel\cityWorldParametricGenerator.ts:107:   * absent, the legacy kind-keyed template pools and terrain keys are used.
packages/core/src/voxel\cityWorldParametricGenerator.ts:112:   * landmarks are selected from the resolved county parameters instead of
packages/core/src/voxel\cityWorldParametricGenerator.ts:123:    terrainTiles: number;
packages/core/src/voxel\cityWorldParametricGenerator.ts:127:    props: number;
packages/core/src/voxel\cityWorldParametricGenerator.ts:138:  park: "park",
packages/core/src/voxel\cityWorldParametricGenerator.ts:139:  water: "water",
packages/core/src/voxel\cityWorldParametricGenerator.ts:145:  meadow: "park",
packages/core/src/voxel\cityWorldParametricGenerator.ts:148:  green_common: "park",
packages/core/src/voxel\cityWorldParametricGenerator.ts:157:  park: "park",
packages/core/src/voxel\cityWorldParametricGenerator.ts:158:  water: "waterfront",
packages/core/src/voxel\cityWorldParametricGenerator.ts:184:  const terrainTiles = createParametricTerrain(spec, bounds, elevationModel);
packages/core/src/voxel\cityWorldParametricGenerator.ts:195:  const props: CityWorldProp[] = [];
packages/core/src/voxel\cityWorldParametricGenerator.ts:200:    for (const prop of zonePropsForZone(zone, rng, spec, roadSegments)) {
packages/core/src/voxel\cityWorldParametricGenerator.ts:201:      if (prop.kind !== "water_shimmer" && prop.kind !== "boat" && prop.kind !== "dock") {
packages/core/src/voxel\cityWorldParametricGenerator.ts:202:        prop.position.z = elevationModel.tileZ(Math.round(prop.position.x), Math.round(prop.position.y));
packages/core/src/voxel\cityWorldParametricGenerator.ts:204:      props.push(prop);
packages/core/src/voxel\cityWorldParametricGenerator.ts:217:    // a road corridor is dropped. Soft zones (park/water) may host embedded
packages/core/src/voxel\cityWorldParametricGenerator.ts:219:    const softZone = zone.kind === "park" || zone.kind === "water";
packages/core/src/voxel\cityWorldParametricGenerator.ts:264:      anchor: { x: zoneCenter(zone).x, y: zoneCenter(zone).y, z: elevationModel.tileZ(Math.round(zoneCenter(zone).x), Math.round(zoneCenter(zone).y)) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:265:      hitRadius: zone.kind === "park" ? 3.8 : 2.8,
packages/core/src/voxel\cityWorldParametricGenerator.ts:280:    props.push(...signatureLandmark.props);
packages/core/src/voxel\cityWorldParametricGenerator.ts:293:      { bounds, terrainTiles, waterTiles: terrainTiles.filter((tile) => tile.kind === "water"), roadSegments, lots, buildings },
packages/core/src/voxel\cityWorldParametricGenerator.ts:296:    terrainTiles,
packages/core/src/voxel\cityWorldParametricGenerator.ts:300:    props,
packages/core/src/voxel\cityWorldParametricGenerator.ts:310:      waterShimmer: spec.zones.some((zone) => zone.kind === "water") ? 0.6 : 0,
packages/core/src/voxel\cityWorldParametricGenerator.ts:315:      // 0.57E parity — default the selection to the landmark (like curated
packages/core/src/voxel\cityWorldParametricGenerator.ts:316:      // Eastvale Core), not the first residential zone: selecting a
packages/core/src/voxel\cityWorldParametricGenerator.ts:318:      selectedPlaceId: signatureLandmark?.place.id ?? (places.find((place) => place.kind === "landmark") ?? places[0])?.id ?? "",
packages/core/src/voxel\cityWorldParametricGenerator.ts:325:      terrainTiles: terrainTiles.length,
packages/core/src/voxel\cityWorldParametricGenerator.ts:329:      props: props.length,
packages/core/src/voxel\cityWorldParametricGenerator.ts:378:      const variant = terrainVariantForZone(zone, x, y);
packages/core/src/voxel\cityWorldParametricGenerator.ts:383:        id: `gen-terrain-${x}-${y}`,
packages/core/src/voxel\cityWorldParametricGenerator.ts:391:        detailLevel: kind === "water" || kind === "park" || kind === "plaza" ? "medium" : "low",
packages/core/src/voxel\cityWorldParametricGenerator.ts:413:  const composition: NonNullable<CityWorldVisualGrammar["terrainComposition"]> = !zone
packages/core/src/voxel\cityWorldParametricGenerator.ts:415:    : zone.kind === "water"
packages/core/src/voxel\cityWorldParametricGenerator.ts:416:      ? "waterfront_edge_strata"
packages/core/src/voxel\cityWorldParametricGenerator.ts:417:      : zone.kind === "park"
packages/core/src/voxel\cityWorldParametricGenerator.ts:418:        ? "park_basin"
packages/core/src/voxel\cityWorldParametricGenerator.ts:425:  const elevation: NonNullable<CityWorldVisualGrammar["terrainElevation"]> = nearWorldEdge
packages/core/src/voxel\cityWorldParametricGenerator.ts:431:      : zone.kind === "water"
packages/core/src/voxel\cityWorldParametricGenerator.ts:432:        ? "water_edge_cut"
packages/core/src/voxel\cityWorldParametricGenerator.ts:433:        : zone.kind === "park"
packages/core/src/voxel\cityWorldParametricGenerator.ts:434:          ? "park_basin_shelf"
packages/core/src/voxel\cityWorldParametricGenerator.ts:443:    : zone?.kind === "water"
packages/core/src/voxel\cityWorldParametricGenerator.ts:444:      ? "waterfront_bank_edge"
packages/core/src/voxel\cityWorldParametricGenerator.ts:445:      : zone?.kind === "park" && onZoneEdge
packages/core/src/voxel\cityWorldParametricGenerator.ts:446:        ? "park_basin_edge"
packages/core/src/voxel\cityWorldParametricGenerator.ts:451:  const massing: NonNullable<CityWorldVisualGrammar["terrainChunkMassing"]> = nearWorldEdge
packages/core/src/voxel\cityWorldParametricGenerator.ts:457:      : zone.kind === "water"
packages/core/src/voxel\cityWorldParametricGenerator.ts:458:        ? "waterfront_bank_cut_mass"
packages/core/src/voxel\cityWorldParametricGenerator.ts:459:        : zone.kind === "park"
packages/core/src/voxel\cityWorldParametricGenerator.ts:460:          ? "park_basin_cut_mass"
packages/core/src/voxel\cityWorldParametricGenerator.ts:467:  const terrainProfile: NonNullable<CityWorldVisualGrammar["terrainProfile"]> =
packages/core/src/voxel\cityWorldParametricGenerator.ts:468:    zone?.kind === "park"
packages/core/src/voxel\cityWorldParametricGenerator.ts:470:      : zone?.kind === "water"
packages/core/src/voxel\cityWorldParametricGenerator.ts:471:        ? "water_edge"
packages/core/src/voxel\cityWorldParametricGenerator.ts:475:            ? "landmark_civic_ground"
packages/core/src/voxel\cityWorldParametricGenerator.ts:482:      ? "landmark_base_shadow"
packages/core/src/voxel\cityWorldParametricGenerator.ts:487:  return { terrainProfile, terrainComposition: composition, terrainElevation: elevation, chunkEdge, terrainChunkMassing: massing, contactProfile };
packages/core/src/voxel\cityWorldParametricGenerator.ts:490:function terrainVariantForZone(zone: CityWorldZoneSpec | undefined, x: number, y: number): number {
packages/core/src/voxel\cityWorldParametricGenerator.ts:527:      terrainProfile: "quiet_socal_grass",
packages/core/src/voxel\cityWorldParametricGenerator.ts:528:      terrainComposition: "neighborhood_yard_fabric",
packages/core/src/voxel\cityWorldParametricGenerator.ts:529:      terrainElevation: nearWorldEdge ? "raised_parcel_shelf" : "flat_field",
packages/core/src/voxel\cityWorldParametricGenerator.ts:531:      terrainChunkMassing: worldOrNoneMassing,
packages/core/src/voxel\cityWorldParametricGenerator.ts:538:      terrainProfile: "commercial_plaza",
packages/core/src/voxel\cityWorldParametricGenerator.ts:539:      terrainComposition: "commercial_apron_field",
packages/core/src/voxel\cityWorldParametricGenerator.ts:540:      terrainElevation: "commercial_slab_field",
packages/core/src/voxel\cityWorldParametricGenerator.ts:542:      terrainChunkMassing: nearWorldEdge || onZoneEdge ? "commercial_slab_mass" : "none",
packages/core/src/voxel\cityWorldParametricGenerator.ts:549:      terrainProfile: "landmark_civic_ground",
packages/core/src/voxel\cityWorldParametricGenerator.ts:550:      terrainComposition: "civic_focus_field",
packages/core/src/voxel\cityWorldParametricGenerator.ts:551:      terrainElevation: "civic_plinth_shelf",
packages/core/src/voxel\cityWorldParametricGenerator.ts:553:      terrainChunkMassing: nearWorldEdge || onZoneEdge ? "civic_plinth_mass" : "commercial_slab_mass",
packages/core/src/voxel\cityWorldParametricGenerator.ts:554:      contactProfile: "landmark_base_shadow",
packages/core/src/voxel\cityWorldParametricGenerator.ts:560:      terrainProfile: "quiet_socal_grass",
packages/core/src/voxel\cityWorldParametricGenerator.ts:561:      terrainComposition: "quiet_field",
packages/core/src/voxel\cityWorldParametricGenerator.ts:562:      terrainElevation: relief > 0.42 || nearWorldEdge ? "raised_parcel_shelf" : "flat_field",
packages/core/src/voxel\cityWorldParametricGenerator.ts:564:      terrainChunkMassing: nearWorldEdge ? "outer_world_edge_mass" : relief > 0.42 ? "residential_shelf_mass" : "none",
packages/core/src/voxel\cityWorldParametricGenerator.ts:571:      terrainProfile: "quiet_socal_grass",
packages/core/src/voxel\cityWorldParametricGenerator.ts:572:      terrainComposition: "quiet_field",
packages/core/src/voxel\cityWorldParametricGenerator.ts:573:      terrainElevation: "raised_parcel_shelf",
packages/core/src/voxel\cityWorldParametricGenerator.ts:575:      terrainChunkMassing: nearWorldEdge || onZoneEdge || relief > 0.5 ? "residential_shelf_mass" : "none",
packages/core/src/voxel\cityWorldParametricGenerator.ts:582:      terrainProfile: "water_edge",
packages/core/src/voxel\cityWorldParametricGenerator.ts:583:      terrainComposition: "waterfront_edge_strata",
packages/core/src/voxel\cityWorldParametricGenerator.ts:584:      terrainElevation: "water_edge_cut",
packages/core/src/voxel\cityWorldParametricGenerator.ts:585:      chunkEdge: nearWorldEdge ? "world_edge" : "waterfront_bank_edge",
packages/core/src/voxel\cityWorldParametricGenerator.ts:586:      terrainChunkMassing: "waterfront_bank_cut_mass",
packages/core/src/voxel\cityWorldParametricGenerator.ts:593:      terrainProfile: "civic_green",
packages/core/src/voxel\cityWorldParametricGenerator.ts:594:      terrainComposition: "park_basin",
packages/core/src/voxel\cityWorldParametricGenerator.ts:595:      terrainElevation: relief > 0.18 || nearWorldEdge ? "raised_parcel_shelf" : "park_basin_shelf",
packages/core/src/voxel\cityWorldParametricGenerator.ts:596:      chunkEdge: nearWorldEdge ? "world_edge" : onZoneEdge ? "park_basin_edge" : "none",
packages/core/src/voxel\cityWorldParametricGenerator.ts:597:      terrainChunkMassing: nearWorldEdge ? "outer_world_edge_mass" : relief > 0.18 ? "residential_shelf_mass" : onZoneEdge ? "park_basin_cut_mass" : "none",
packages/core/src/voxel\cityWorldParametricGenerator.ts:603:    terrainProfile: "civic_green",
packages/core/src/voxel\cityWorldParametricGenerator.ts:604:    terrainComposition: "park_basin",
packages/core/src/voxel\cityWorldParametricGenerator.ts:605:    terrainElevation: nearWorldEdge ? "raised_parcel_shelf" : "park_basin_shelf",
packages/core/src/voxel\cityWorldParametricGenerator.ts:606:    chunkEdge: nearWorldEdge ? "world_edge" : onZoneEdge ? "park_basin_edge" : "none",
packages/core/src/voxel\cityWorldParametricGenerator.ts:607:    terrainChunkMassing: nearWorldEdge ? "outer_world_edge_mass" : onZoneEdge ? "park_basin_cut_mass" : "none",
packages/core/src/voxel\cityWorldParametricGenerator.ts:624:  const massingProfile = generatedMassingProfileFor(countyParameters);
packages/core/src/voxel\cityWorldParametricGenerator.ts:626:  // Park/water are single soft parcels.
packages/core/src/voxel\cityWorldParametricGenerator.ts:627:  if (zone.kind === "park" || zone.kind === "water") {
packages/core/src/voxel\cityWorldParametricGenerator.ts:640:  // Civic and gym are single broad anchor parcels (one strong silhouette each).
packages/core/src/voxel\cityWorldParametricGenerator.ts:641:  // The plinth pad hugs the anchor (≤1.3× its footprint) instead of stretching
packages/core/src/voxel\cityWorldParametricGenerator.ts:642:  // to the zone — a zone-wide pad under a fixed-size anchor reads as an empty
packages/core/src/voxel\cityWorldParametricGenerator.ts:645:    const anchor = zone.kind === "civic" ? { width: 3.4, depth: 2.5 } : { width: 4.0, depth: 2.6 };
packages/core/src/voxel\cityWorldParametricGenerator.ts:651:        width: Math.max(anchor.width, Math.min(zoneWidth * 0.72, anchor.width * 1.3)),
packages/core/src/voxel\cityWorldParametricGenerator.ts:652:        depth: Math.max(anchor.depth, Math.min(zoneHeight * 0.68, anchor.depth * 1.3)),
packages/core/src/voxel\cityWorldParametricGenerator.ts:658:  // 0.57E parity — commerce authors road-facing STRIP ROWS the way curated
packages/core/src/voxel\cityWorldParametricGenerator.ts:666:    const cols = Math.max(1, Math.ceil(zoneWidth / massingProfile.commercialCellWidth));
packages/core/src/voxel\cityWorldParametricGenerator.ts:667:    const rows = Math.max(1, Math.floor(zoneHeight / massingProfile.commercialRowDepth));
packages/core/src/voxel\cityWorldParametricGenerator.ts:670:    const stripDensity = Math.max(zone.density ?? massingProfile.commercialDensityFloor, massingProfile.commercialDensityFloor);
packages/core/src/voxel\cityWorldParametricGenerator.ts:681:          width: Math.min(Math.max(template.width, stripCellWidth * massingProfile.commercialStripFill), massingProfile.commercialMaxWidth),
packages/core/src/voxel\cityWorldParametricGenerator.ts:699:        ? { ...template, width: Math.min(Math.max(template.width, zoneWidth * 0.6), massingProfile.commercialMaxWidth) }
packages/core/src/voxel\cityWorldParametricGenerator.ts:712:    // authored commerce sprites assume curated Eastvale footprints; on
packages/core/src/voxel\cityWorldParametricGenerator.ts:718:  // next to curated Eastvale at the old fill rates.
packages/core/src/voxel\cityWorldParametricGenerator.ts:719:  // 0.58E parity — apartment courts pack tighter (curated Eastvale's court is
packages/core/src/voxel\cityWorldParametricGenerator.ts:726:      ? Math.max(zone.density ?? massingProfile.residentialDensityFloor, massingProfile.residentialDensityFloor)
packages/core/src/voxel\cityWorldParametricGenerator.ts:728:        ? Math.max(zone.density ?? massingProfile.apartmentDensityFloor, massingProfile.apartmentDensityFloor)
packages/core/src/voxel\cityWorldParametricGenerator.ts:730:  const cell = zone.kind === "residential" ? massingProfile.residentialCell : zone.kind === "apartments" ? massingProfile.apartmentCell : 3.4;
packages/core/src/voxel\cityWorldParametricGenerator.ts:752:      // Rotate apartment massing so court parcels step instead of cloning one slab.
packages/core/src/voxel\cityWorldParametricGenerator.ts:770:  // Never leave a zoned block empty — guarantee at least one anchor parcel.
packages/core/src/voxel\cityWorldParametricGenerator.ts:789:  if (zone.kind === "residential" && parcels.length >= massingProfile.cornerStoreMinParcels && boardCenter) {
packages/core/src/voxel\cityWorldParametricGenerator.ts:824:    // authored sprites assume curated Eastvale footprints and collapse into
packages/core/src/voxel\cityWorldParametricGenerator.ts:837:    roofShape: spec.roofShape,
packages/core/src/voxel\cityWorldParametricGenerator.ts:838:    facadeStyle: spec.facadeStyle,
packages/core/src/voxel\cityWorldParametricGenerator.ts:850:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
packages/core/src/voxel\cityWorldParametricGenerator.ts:851:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
packages/core/src/voxel\cityWorldParametricGenerator.ts:862:  | "river_boathouse"
packages/core/src/voxel\cityWorldParametricGenerator.ts:863:  | "desert_mesa_tower"
packages/core/src/voxel\cityWorldParametricGenerator.ts:868:export type CityWorldGeneratedLandmarkHostCell = "water_edge" | "highest_block_corner" | "ridge" | "ag_block" | "civic_core";
packages/core/src/voxel\cityWorldParametricGenerator.ts:875:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
packages/core/src/voxel\cityWorldParametricGenerator.ts:876:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
packages/core/src/voxel\cityWorldParametricGenerator.ts:894:    hostCell: "water_edge",
packages/core/src/voxel\cityWorldParametricGenerator.ts:896:    roofShape: "hip",
packages/core/src/voxel\cityWorldParametricGenerator.ts:897:    facadeStyle: "strip_store",
packages/core/src/voxel\cityWorldParametricGenerator.ts:900:  river_boathouse: {
packages/core/src/voxel\cityWorldParametricGenerator.ts:901:    kind: "river_boathouse",
packages/core/src/voxel\cityWorldParametricGenerator.ts:902:    archetype: "river_town",
packages/core/src/voxel\cityWorldParametricGenerator.ts:903:    hostCell: "water_edge",
packages/core/src/voxel\cityWorldParametricGenerator.ts:905:    roofShape: "gable",
packages/core/src/voxel\cityWorldParametricGenerator.ts:906:    facadeStyle: "storefront",
packages/core/src/voxel\cityWorldParametricGenerator.ts:909:  desert_mesa_tower: {
packages/core/src/voxel\cityWorldParametricGenerator.ts:910:    kind: "desert_mesa_tower",
packages/core/src/voxel\cityWorldParametricGenerator.ts:914:    roofShape: "tower",
packages/core/src/voxel\cityWorldParametricGenerator.ts:915:    facadeStyle: "fitness",
packages/core/src/voxel\cityWorldParametricGenerator.ts:916:    expectedAccentProps: ["water_tower"],
packages/core/src/voxel\cityWorldParametricGenerator.ts:923:    roofShape: "gable",
packages/core/src/voxel\cityWorldParametricGenerator.ts:924:    facadeStyle: "civic",
packages/core/src/voxel\cityWorldParametricGenerator.ts:925:    expectedAccentProps: ["tree"],
packages/core/src/voxel\cityWorldParametricGenerator.ts:932:    roofShape: "tower",
packages/core/src/voxel\cityWorldParametricGenerator.ts:933:    facadeStyle: "fitness",
packages/core/src/voxel\cityWorldParametricGenerator.ts:934:    expectedAccentProps: ["water_tower"],
packages/core/src/voxel\cityWorldParametricGenerator.ts:941:    roofShape: "tower",
packages/core/src/voxel\cityWorldParametricGenerator.ts:942:    facadeStyle: "civic",
packages/core/src/voxel\cityWorldParametricGenerator.ts:952:  const building = scene.buildings.find((candidate) => candidate.id.startsWith("gen-landmark-"));
packages/core/src/voxel\cityWorldParametricGenerator.ts:954:  const kind = landmarkKindFromBuildingId(building.id);
packages/core/src/voxel\cityWorldParametricGenerator.ts:958:  const accentProps = scene.props
packages/core/src/voxel\cityWorldParametricGenerator.ts:959:    .filter((prop) => prop.placeId === building.placeId || signature.expectedAccentProps.includes(prop.kind))
packages/core/src/voxel\cityWorldParametricGenerator.ts:960:    .map((prop) => prop.kind);
packages/core/src/voxel\cityWorldParametricGenerator.ts:970:    roofShape: building.roofShape ?? signature.roofShape,
packages/core/src/voxel\cityWorldParametricGenerator.ts:971:    facadeStyle: building.facadeStyle ?? signature.facadeStyle,
packages/core/src/voxel\cityWorldParametricGenerator.ts:978:      roofShape: building.roofShape ?? signature.roofShape,
packages/core/src/voxel\cityWorldParametricGenerator.ts:979:      facadeStyle: building.facadeStyle ?? signature.facadeStyle,
packages/core/src/voxel\cityWorldParametricGenerator.ts:991:  signature: Pick<CityWorldGeneratedLandmarkReadout, "buildingKind" | "roofShape" | "facadeStyle" | "hostCell" | "width" | "depth" | "height">,
packages/core/src/voxel\cityWorldParametricGenerator.ts:996:    signature.facadeStyle,
packages/core/src/voxel\cityWorldParametricGenerator.ts:997:    signature.roofShape,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1021:  waterLotRatio: number;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1029:  const buildings = scene.buildings.filter((building) => !building.id.startsWith("gen-landmark-"));
packages/core/src/voxel\cityWorldParametricGenerator.ts:1030:  const lots = scene.lots.filter((lot) => !lot.id.startsWith("gen-landmark-lot-"));
packages/core/src/voxel\cityWorldParametricGenerator.ts:1060:    waterLotRatio: roundDimension(safeRatio(lots.filter((lot) => lot.kind === "waterfront").length, lots.length)),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1085:    normalizedDelta(first.waterLotRatio, second.waterLotRatio, 0.2, 0.06) +
packages/core/src/voxel\cityWorldParametricGenerator.ts:1093:  river_town: "river_boathouse",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1094:  desert_basin: "desert_mesa_tower",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1104:  props: CityWorldProp[];
packages/core/src/voxel\cityWorldParametricGenerator.ts:1117:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1118:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1136:  const massing = generatedLandmarkMassing(parameters, signature);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1137:  const host = generatedLandmarkHost(signature, massing, spec.zones, elevationModel);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1140:  const placeId = `gen-place-landmark-${kind}`;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1143:      id: `gen-landmark-lot-${kind}`,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1144:      kind: massing.lotKind,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1145:      label: massing.label,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1147:      width: Math.max(massing.width * 1.12, massing.width + 0.28),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1148:      depth: Math.max(massing.depth * 1.18, massing.depth + 0.28),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1154:    id: `gen-landmark-${kind}`,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1155:    kind: massing.buildingKind,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1156:    label: massing.label,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1157:    spriteKey: `building.${massing.buildingKind}.generated.landmark.v1`,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1159:    width: massing.width,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1160:    depth: massing.depth,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1161:    height: massing.height,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1162:    bodyColor: massing.bodyColor,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1163:    roofColor: massing.roofColor,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1164:    ...(massing.paletteKey ? { paletteKey: massing.paletteKey } : {}),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1166:    roofShape: massing.roofShape,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1167:    facadeStyle: massing.facadeStyle,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1172:    label: massing.label,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1173:    kind: "landmark",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1176:    anchor: host.point,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1177:    hitRadius: Math.max(3.1, Math.max(massing.width, massing.depth) * 0.88),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1178:    description: `Generated ${massing.label.toLowerCase()} landmark.`,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1187:    props: generatedLandmarkAccentProps(signature, host.point, placeId, elevationModel),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1195:  const waterSignal = hasNameSignal(parameters, ["port", "harbor", "lake", "bay", "beach"]);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1197:  const riverSignal = hasNameSignal(parameters, ["falls", "river"]);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1198:  const mesaSignal = hasNameSignal(parameters, ["mesa", "desert"]);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1202:  const colors = landmarkPalette(parameters, signature.kind);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1206:      label: workingWaterfrontSignal ? "Working pier hall" : waterSignal ? "Waterfront pier hall" : "Pier hall",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1208:      lotKind: "waterfront",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1209:      width: roundDimension(4.7 + (workingWaterfrontSignal ? 0.48 : waterSignal ? 0.26 : 0)),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1213:      facadeStyle: "strip_store",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1214:      roofShape: "hip",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1217:  if (signature.kind === "river_boathouse") {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1219:      label: riverSignal ? "River boathouse" : "Bank boathouse",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1221:      lotKind: "waterfront",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1222:      width: roundDimension(3.25 + (riverSignal ? 0.34 : 0)),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1226:      facadeStyle: "storefront",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1227:      roofShape: "gable",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1230:  if (signature.kind === "desert_mesa_tower") {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1232:      label: mesaSignal ? "Mesa water tower" : "Desert water tower",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1237:      height: roundDimension(3.68 + (mesaSignal ? 0.28 : 0) + (parameters.climate.aridity === "arid" ? 0.16 : 0)),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1239:      facadeStyle: "fitness",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1240:      roofShape: "tower",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1252:      facadeStyle: "civic",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1253:      roofShape: "gable",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1265:      facadeStyle: "fitness",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1266:      roofShape: "tower",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1278:    facadeStyle: "civic",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1279:    roofShape: "tower",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1283:function landmarkPalette(
packages/core/src/voxel\cityWorldParametricGenerator.ts:1289:    river_boathouse: { bodyIndex: 2, roofIndex: 0 },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1290:    desert_mesa_tower: { bodyIndex: 1, roofIndex: 0 },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1305:  massing: GeneratedLandmarkMassing,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1309:  if (signature.hostCell === "water_edge") {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1310:    const zone = zones.find((candidate) => candidate.kind === "water") ?? zones.find((candidate) => candidate.id === "water-edge");
packages/core/src/voxel\cityWorldParametricGenerator.ts:1312:    const point = waterEdgeHostPoint(zone, massing);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1313:    return hostInsideZone(zone, point.x, point.y, massing, elevationModel);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1317:    return zone ? hostInsideZone(zone, zoneCenter(zone).x + 0.85, zoneCenter(zone).y - 0.2, massing, elevationModel) : null;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1324:    return zone ? hostInsideZone(zone, zoneCenter(zone).x, zoneCenter(zone).y, massing, elevationModel) : null;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1328:      .filter((zone) => zone.kind !== "water" && zone.kind !== "park")
packages/core/src/voxel\cityWorldParametricGenerator.ts:1331:          { x: zone.rect.minX + massing.width / 2 + 0.25, y: zone.rect.minY + massing.depth / 2 + 0.25 },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1332:          { x: zone.rect.maxX - massing.width / 2 - 0.25, y: zone.rect.minY + massing.depth / 2 + 0.25 },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1333:          { x: zone.rect.maxX - massing.width / 2 - 0.25, y: zone.rect.maxY - massing.depth / 2 - 0.25 },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1334:          { x: zone.rect.minX + massing.width / 2 + 0.25, y: zone.rect.maxY - massing.depth / 2 - 0.25 },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1339:    return top ? hostInsideZone(top.zone, top.point.x, top.point.y, massing, elevationModel) : null;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1348:  massing: GeneratedLandmarkMassing,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1351:  const halfW = massing.width / 2 + 0.14;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1352:  const halfD = massing.depth / 2 + 0.14;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1365:function waterEdgeHostPoint(zone: CityWorldZoneSpec, massing: GeneratedLandmarkMassing): { x: number; y: number } {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1370:      y: zone.rect.minY + massing.depth / 2 + 0.18,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1374:    x: zone.rect.minX + massing.width / 2 + 0.18,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1381:  anchor: CityWorldPoint,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1385:  const props: CityWorldProp[] = [];
packages/core/src/voxel\cityWorldParametricGenerator.ts:1388:      id: `gen-landmark-prop-${signature.kind}-${id}`,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1391:        x: roundDimension(anchor.x + dx),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1392:        y: roundDimension(anchor.y + dy),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1393:        z: elevationModel.tileZ(Math.round(anchor.x + dx), Math.round(anchor.y + dy)),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1399:  if (signature.kind === "desert_mesa_tower") {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1400:    props.push(point("tank", "water_tower", 0.72, -0.2, 0));
packages/core/src/voxel\cityWorldParametricGenerator.ts:1402:    props.push(point("pine-0", "tree", -2.05, -0.9, 2), point("pine-1", "tree", 2.1, -0.72, 3), point("pine-2", "tree", -1.35, 1.18, 4));
packages/core/src/voxel\cityWorldParametricGenerator.ts:1404:    props.push(point("drum", "water_tower", 0.78, -0.08, 1));
packages/core/src/voxel\cityWorldParametricGenerator.ts:1407:  return props;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1414:function landmarkKindFromBuildingId(id: string): CityWorldGeneratedLandmarkKind | null {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1415:  const raw = id.replace(/^gen-landmark-/, "");
packages/core/src/voxel\cityWorldParametricGenerator.ts:1437:  { weight: 0.5, template: { kind: "home", width: 1.28, depth: 1.08, height: 1.02, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f2dfc4", "#ead4b6", "#f6e7cf"], roofColors: ["#b86f4c", "#8a6a52", "#b99358"] } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1438:  { weight: 0.48, template: { kind: "home", width: 1.52, depth: 1.12, height: 1.08, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f0dcc4", "#ecdcc0", "#e7d4b8"], roofColors: ["#a9704f", "#7d9a86", "#5f7f8e"] } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1439:  { weight: 0.52, template: { kind: "home", width: 2.0, depth: 1.18, height: 0.98, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0", "#e7d6bd"], roofColors: ["#7f9b6e", "#5f7f8e", "#a76f4e"] } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1440:  { weight: 0.52, template: { kind: "home", width: 2.18, depth: 1.28, height: 1.04, facadeStyle: "ranch", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad", "#f0ddc2"], roofColors: ["#a9704f", "#5f7f8e", "#8a6a52"] } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1441:  { weight: 0.68, template: { kind: "home", width: 2.56, depth: 1.08, height: 1.26, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#f2dfc2", "#eed9c0", "#ead2b4"], roofColors: ["#607d84", "#6f9ca7", "#7f9b6e"] } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1442:  { weight: 0.46, template: { kind: "home", width: 1.72, depth: 1.06, height: 1.18, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#eed8bd", "#f3e1c6"], roofColors: ["#587a8e", "#8a6a52"] } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1446:  { weight: 0.18, template: { kind: "home", width: 1.84, depth: 1.34, height: 1.04, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad", "#f0ddc2"], roofColors: ["#2f5d8a", "#577747", "#9a927d"] } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1447:  { weight: 0.16, template: { kind: "home", width: 2.34, depth: 1.42, height: 1.0, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0", "#e7d6bd"], roofColors: ["#577747", "#9a927d", "#2f5d8a"] } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1452:  { kind: "shop", width: 3.0, depth: 1.7, height: 1.4, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efd8b6", "#eedcc4"], roofColors: ["#3f8b8c", "#6f9a86"] },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1453:  { kind: "shop", width: 3.6, depth: 1.5, height: 1.1, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efdcc0", "#f2dfc2"], roofColors: ["#c48a5a", "#82a4c4"] },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1454:  { kind: "shop", width: 2.6, depth: 1.95, height: 1.6, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#eedcc4", "#efd8b6"], roofColors: ["#6f9a86", "#c48a5a"] },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1463:  facadeStyle: "storefront",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1464:  roofShape: "flat",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1472:  { kind: "apartment", width: 2.35, depth: 2.9, height: 3.25, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#ead7bb", "#e3cfae"], roofColors: ["#6d8f6f", "#587a8e"] },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1473:  { kind: "apartment", width: 3.0, depth: 1.7, height: 2.3, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#e7c9a8", "#e3d0b4"], roofColors: ["#416f82", "#8a6f95"] },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1474:  { kind: "apartment", width: 2.6, depth: 1.95, height: 2.05, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#e3d0b4", "#ead7bb"], roofColors: ["#587a8e", "#6d8f6f"] },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1499:  { kind: "gym", width: 4.0, depth: 2.6, height: 2.0, facadeStyle: "fitness", roofShape: "sawtooth", bodyColors: ["#d7e7ef", "#d3e2ea"], roofColors: ["#a76f4e", "#5f8fa6"] },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1509:  const riverTownHome = home && countyParameters?.archetypeProfile.archetype === "river_town";
packages/core/src/voxel\cityWorldParametricGenerator.ts:1511:  const width = jitter(template.width, riverTownHome ? 0.2 : home ? 0.14 : 0.3);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1512:  const depth = jitter(template.depth, riverTownHome ? 0.18 : home ? 0.12 : 0.3);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1527:      facadeStyle: template.facadeStyle,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1528:      roofShape: template.roofShape,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1542:    (template.facadeStyle === "rowhome" || template.kind === "apartment")
packages/core/src/voxel\cityWorldParametricGenerator.ts:1554:  const profile = generatedMassingProfileFor(countyParameters);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1557:  const heightBiasLift = modulation.heightBias * profile.heightBiasMultiplier;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1559:    profile.heightScale +
packages/core/src/voxel\cityWorldParametricGenerator.ts:1564:    profile.footprintScale +
packages/core/src/voxel\cityWorldParametricGenerator.ts:1574:    if (spec.facadeStyle === "rowhome") height = Math.min(height, 1.48);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1575:    else if (spec.facadeStyle === "cottage") height = Math.min(height, 1.26, footprintMin * 1.12);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1576:    else if (spec.facadeStyle === "ranch") height = Math.min(height, 1.18, footprintMin * 0.94);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1588:  const profile = generatedMassingProfileFor(countyParameters);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1590:    countyParameters?.archetypeProfile.archetype === "river_town"
packages/core/src/voxel\cityWorldParametricGenerator.ts:1595:    weight: entry.weight * residentialTemplateMultiplier(entry.template, profile),
packages/core/src/voxel\cityWorldParametricGenerator.ts:1606:function residentialTemplateMultiplier(template: ZoneBuildingTemplate, profile: GeneratedDistrictMassingProfile): number {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1607:  if (template.facadeStyle === "rowhome") return profile.rowhomeWeight;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1608:  if (template.facadeStyle === "ranch") return profile.ranchWeight;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1609:  return profile.cottageWeight;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1809:      facadeStyle: "civic",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1810:      roofShape: metroTower ? "tower" : "hip",
packages/core/src/voxel\cityWorldParametricGenerator.ts:1817:  if (!regionalPalette || kind === "water") return `terrain.${kind}`;
packages/core/src/voxel\cityWorldParametricGenerator.ts:1834:// 0.74F full prop kit + E2c vegetation grammar. Placement is deterministic and
packages/core/src/voxel\cityWorldParametricGenerator.ts:1835:// authored from zone edges, road frontages, water edges, and terrain relief.
packages/core/src/voxel\cityWorldParametricGenerator.ts:1836:// No cars, no humans; generated draft windows still own the visible prop cap.
packages/core/src/voxel\cityWorldParametricGenerator.ts:1852:  const context = propPlacementContext(spec, roadSegments);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1861:  const vegetationRng = propZoneRng(spec, zone);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1867:      addStreetTreeRhythm(specs, zone, context, vegetationRng, residentialStreetTreeCap(context.archetype));
packages/core/src/voxel\cityWorldParametricGenerator.ts:1872:    specs.push({ kind: "streetlight", point: at(0.94, 0.08) });
packages/core/src/voxel\cityWorldParametricGenerator.ts:1876:      { kind: "streetlight", point: at(0.5, 0.94) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1877:      { kind: "streetlight", point: at(0.92, 0.1) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1884:    } else if (context.archetype === "metro_grid" || context.archetype === "river_town") {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1885:      addStreetTreeRhythm(specs, zone, context, vegetationRng, 2);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1887:      addStreetTreeRhythm(specs, zone, context, vegetationRng, 1);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1898:      addVegetationSpec(specs, context, "tree", at(0.06, 0.5), 3);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1899:      if (context.archetype !== "coastal_grid") addVegetationSpec(specs, context, "tree", at(0.94, 0.5), 4);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1903:    specs.push({ kind: "sign", point: at(0.9, 0.88), variant: 1 }, { kind: "streetlight", point: at(0.08, 0.1) });
packages/core/src/voxel\cityWorldParametricGenerator.ts:1908:      { kind: "streetlight", point: at(0.08, 0.92) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1915:      addStreetTreeRhythm(specs, zone, context, vegetationRng, apartmentStreetTreeCap(context.archetype));
packages/core/src/voxel\cityWorldParametricGenerator.ts:1919:  } else if (zone.kind === "park") {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1929:      const parkTreeCount = context.archetype === "coastal_grid" || context.archetype === "mountain_valley"
packages/core/src/voxel\cityWorldParametricGenerator.ts:1932:      addParkTreeCluster(specs, zone, context, vegetationRng, parkTreeCount);
packages/core/src/voxel\cityWorldParametricGenerator.ts:1938:  } else if (zone.kind === "water") {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1939:    specs.push(...waterAccentProps(zone, rng));
packages/core/src/voxel\cityWorldParametricGenerator.ts:1950:      id: `gen-prop-${zone.id}-${index}`,
packages/core/src/voxel\cityWorldParametricGenerator.ts:1958:function propPlacementContext(spec: CityWorldParametricSpec, roadSegments: CityWorldRoadSegment[]): PropPlacementContext {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1972:function propZoneRng(spec: CityWorldParametricSpec, zone: CityWorldZoneSpec): () => number {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1981:function waterAccentProps(zone: CityWorldZoneSpec, rng: () => number): ZonePropSpec[] {
packages/core/src/voxel\cityWorldParametricGenerator.ts:1986:      { kind: "water_shimmer", point: at(0.22, 0.34) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1987:      { kind: "water_shimmer", point: at(0.52, 0.58) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1988:      { kind: "water_shimmer", point: at(0.78, 0.42) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1995:    { kind: "water_shimmer", point: at(0.3, 0.24) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1996:    { kind: "water_shimmer", point: at(0.6, 0.56) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:1997:    { kind: "water_shimmer", point: at(0.45, 0.82) },
packages/core/src/voxel\cityWorldParametricGenerator.ts:2003:function residentialStreetTreeCap(archetype: GeneratedDistrictArchetype | undefined): number {
packages/core/src/voxel\cityWorldParametricGenerator.ts:2004:  if (archetype === "metro_grid" || archetype === "coastal_grid" || archetype === "river_town") return 5;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2009:function apartmentStreetTreeCap(archetype: GeneratedDistrictArchetype | undefined): number {
packages/core/src/voxel\cityWorldParametricGenerator.ts:2010:  if (archetype === "metro_grid" || archetype === "coastal_grid" || archetype === "river_town") return 3;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2018:function addStreetTreeRhythm(
packages/core/src/voxel\cityWorldParametricGenerator.ts:2030:    const spacing = streetTreeSpacing(context);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2039:      if (addVegetationSpec(specs, context, "tree", point, added + index)) added += 1;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2044:function streetTreeSpacing(context: PropPlacementContext): number {
packages/core/src/voxel\cityWorldParametricGenerator.ts:2046:  if (context.archetype === "coastal_grid" || context.archetype === "river_town") return 3.5;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2072:    addVegetationSpec(specs, context, "tree", jitteredZonePoint(zone, fx, fy, rng, 0.18), index);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2090:    addVegetationSpec(specs, context, "tree", point, index + 2);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2109:    addVegetationSpec(specs, context, "tree", jitteredZonePoint(zone, fx, fy, rng, 0.18), index + 5);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2137:      "tree",
packages/core/src/voxel\cityWorldParametricGenerator.ts:2150:  if (context.archetype !== "coastal_grid" && context.archetype !== "river_town") return;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2157:  const banks = context.archetype === "river_town" ? shorelineBankXs(zone, context.roadSegments) : [shorelineLandwardXs(zone, context.roadSegments)];
packages/core/src/voxel\cityWorldParametricGenerator.ts:2166:        if (addVegetationSpec(specs, context, "tree", point, bankIndex * count + added + 1)) {
packages/core/src/voxel\cityWorldParametricGenerator.ts:2191:        if (addVegetationSpec(specs, context, "tree", point, bankIndex * count + added + 1)) {
packages/core/src/voxel\cityWorldParametricGenerator.ts:2227:  kind: "tree" | "bush",
packages/core/src/voxel\cityWorldParametricGenerator.ts:2235:  if (specs.some((entry) => (entry.kind === "tree" || entry.kind === "bush") && distance2(entry.point, point) < 0.72)) return false;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2362:  return spec.zones.some((zone) => zone.kind === "water" && point.x >= zone.rect.minX && point.x <= zone.rect.maxX && point.y >= zone.rect.minY && point.y <= zone.rect.maxY);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2371:  terrainTiles: CityWorldTerrainTile[];
packages/core/src/voxel\cityWorldParametricGenerator.ts:2372:  waterTiles: CityWorldTerrainTile[];
packages/core/src/voxel\cityWorldParametricGenerator.ts:2383:// Mirrors the diagnostics viewport-composition formula (massing 0.25 +
packages/core/src/voxel\cityWorldParametricGenerator.ts:2388:  const tiles = scenery.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
packages/core/src/voxel\cityWorldParametricGenerator.ts:2392:  const massing = tiles.length > 0 ? tiles.filter((tile) => (tile.visualGrammar?.terrainChunkMassing ?? "none") !== "none").length / tiles.length : 0;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2395:  return massing * 0.25 + featureDensity * 0.45 + cityWorldClamp(families / 4, 0, 1) * 0.3;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2400:  const tiles = scenery.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
packages/core/src/voxel\cityWorldParametricGenerator.ts:2404:  const massing = tiles.length > 0 ? tiles.filter((tile) => (tile.visualGrammar?.terrainChunkMassing ?? "none") !== "none").length / tiles.length : 0;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2407:  return massing * 0.25 + featureDensity * 0.45 + cityWorldClamp(families / 4, 0, 1) * 0.3;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2410:function waterAwareOverviewFrameCompositionScore(center: CityWorldPoint, scenery: ParametricCameraScenery): number {
packages/core/src/voxel\cityWorldParametricGenerator.ts:2411:  return overviewFrameCompositionScore(center, scenery) + waterPresenceFrameBonus(center, scenery, "desktop", 1.32);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2414:function waterPresenceFrameBonus(
packages/core/src/voxel\cityWorldParametricGenerator.ts:2427:  const waterTiles = scenery.waterTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame)).length;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2428:  if (waterTiles < WATER_AWARE_FRAME_TILE_FLOOR) return 0;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2437:  const waterPresence = cityWorldClamp(waterTiles / WATER_AWARE_FRAME_TILE_FLOOR, 0, 1);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2439:  return waterPresence * builtPresence * WATER_AWARE_FRAME_BONUS_WEIGHT;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2476:  const anchors = zones.flatMap((zone) => {
packages/core/src/voxel\cityWorldParametricGenerator.ts:2486:        for (const offset of offsets) anchors.push({ x: midpoint.x + offset.x, y: midpoint.y + offset.y });
packages/core/src/voxel\cityWorldParametricGenerator.ts:2490:  if (anchors.length === 0) anchors.push(fallback);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2492:  let focus = anchors[0] ?? fallback;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2494:  for (const candidate of anchors) {
packages/core/src/voxel\cityWorldParametricGenerator.ts:2506:  const tiles = scenery.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
packages/core/src/voxel\cityWorldParametricGenerator.ts:2510:  const massing = tiles.length > 0 ? tiles.filter((tile) => (tile.visualGrammar?.terrainChunkMassing ?? "none") !== "none").length / tiles.length : 0;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2513:  return massing * 0.25 + featureDensity * 0.45 + cityWorldClamp(families / 4, 0, 1) * 0.3;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2516:function waterAwareMobileOverviewFrameCompositionScore(center: CityWorldPoint, scenery: ParametricCameraScenery): number {
packages/core/src/voxel\cityWorldParametricGenerator.ts:2517:  return mobileOverviewFrameCompositionScore(center, scenery) + waterPresenceFrameBonus(center, scenery, "mobile", 0.92);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2528:  const built = zones.filter((zone) => ZONE_TO_LOT[zone.kind] && zone.kind !== "water");
packages/core/src/voxel\cityWorldParametricGenerator.ts:2530:  const waterAware = isWaterGeneratedArchetype(countyParameters?.archetypeProfile.archetype);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2532:    ? generatedOverviewFocus(built, focus, scenery, waterAware ? waterAwareOverviewFrameCompositionScore : overviewFrameCompositionScore)
packages/core/src/voxel\cityWorldParametricGenerator.ts:2539:        waterAware ? waterAwareMobileOverviewFrameCompositionScore : mobileOverviewFrameCompositionScore,
packages/core/src/voxel\cityWorldParametricGenerator.ts:2575:  if (kind === "park") return "park";
packages/core/src/voxel\cityWorldParametricGenerator.ts:2576:  if (kind === "civic") return "landmark";
packages/core/src/voxel\cityWorldParametricGenerator.ts:2583:  return archetype === "coastal_grid" || archetype === "river_town";
packages/core/src/voxel\cityWorldParametricGenerator.ts:2593:    park: "Community park",
packages/core/src/voxel\cityWorldParametricGenerator.ts:2594:    water: "Waterfront",
packages/core/src/voxel\cityWorldParametricGenerator.ts:2638:// buildings, props, and place anchors) shares one z level, so streets and
packages/core/src/voxel\cityWorldParametricGenerator.ts:2641:// blocks they border so asphalt never climbs a cliff.
packages/core/src/voxel\cityWorldParametricGenerator.ts:2680:  const waterZones = spec.zones.filter((zone) => zone.kind === "water");
packages/core/src/voxel\cityWorldParametricGenerator.ts:2682:    waterZones.some(
packages/core/src/voxel\cityWorldParametricGenerator.ts:2686:  // Corridor roads: axis-aligned embedded streets/avenues (driveways and
packages/core/src/voxel\cityWorldParametricGenerator.ts:2688:  const corridorRoads = roads.filter((road) => road.kind === "avenue" || road.kind === "street");
packages/core/src/voxel\cityWorldParametricGenerator.ts:2759:  if (kind === "street") return 1.5;
packages/core/src/voxel\cityWorldParametricGenerator.ts:2798: *   ({@link CITY_WORLD_TILE_BASIS}) and the renderer's proportional column
packages/core/src/voxel\cityWorldParametricGenerator.ts:2885:/** Strip-row shops narrower than this read as toy boxes next to curated Plaza Row. */
packages/core/src/voxel\cityWorldParametricGenerator.ts:2887:/** Corner storefronts are small on purpose (curated market is 2.0w) — but never below this. */
packages/core/src/voxel\cityWorldParametricGenerator.ts:2891: * Renderer window-column proportions from `drawApartmentDetails`: three
packages/core/src/voxel\cityWorldParametricGenerator.ts:2898:  const softLotKinds = new Set<CityWorldLot["kind"]>(["park", "waterfront"]);
packages/core/src/voxel\cityWorldParametricGenerator.ts:2933:  const cornerShops = shops.filter((building) => building.facadeStyle === "storefront");
packages/core/src/voxel\cityWorldParametricGenerator.ts:2934:  const rowShops = shops.filter((building) => building.facadeStyle !== "storefront");
packages/core/src/voxel\cityWorldParametricGenerator.ts:2936:    (building) => building.facadeStyle === "strip_store" && building.objectKit?.prefabFamily === "commerce_strip",
packages/core/src/voxel\cityWorldParametricGenerator.ts:2939:    building.facadeStyle === "storefront"
packages/core/src/voxel\cityWorldParametricGenerator.ts:3028:      pitchedHomeCount: homes.filter((building) => building.roofShape === "gable" || building.roofShape === "hip").length,
packages/core/src/voxel\cityWorldParametricGenerator.ts:3029:      flatRowhomeCount: homes.filter((building) => building.facadeStyle === "rowhome" && building.roofShape === "flat").length,
packages/core/src/voxel\cityWorldParametricGenerator.ts:3044:  const roofShape = building.roofShape ?? "flat";
packages/core/src/voxel\cityWorldParametricGenerator.ts:3045:  const style = building.facadeStyle ?? "cottage";
packages/core/src/voxel\cityWorldParametricGenerator.ts:3049:  if (style === "rowhome") safe = roofShape === "flat" && building.height <= 1.52;
packages/core/src/voxel\cityWorldParametricGenerator.ts:3050:  else if (style === "cottage") safe = roofShape === "gable" && building.height <= 1.28 && heightToFootprintRatio <= 1.14;
packages/core/src/voxel\cityWorldParametricGenerator.ts:3051:  else if (style === "ranch") safe = (roofShape === "gable" || roofShape === "hip") && building.width >= 1.8 && building.height <= 1.22 && heightToFootprintRatio <= 0.96;
packages/core/src/voxel\cityWorldParametricGenerator.ts:3052:  else safe = roofShape !== "tower";
packages/core/src/voxel\cityWorldParametricGenerator.ts:3141: * cluster, a park, and a waterfront edge.
packages/core/src/voxel\cityWorldParametricGenerator.ts:3164:      { id: "community-park", kind: "park", rect: { minX: 10, minY: 15, maxX: 14, maxY: 26 } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:3171:      { id: "waterfront", kind: "water", rect: { minX: 35, minY: 20, maxX: 39, maxY: 27 } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:3176:      { id: "gen-road-commerce", kind: "street", from: { x: 28, y: 3 }, to: { x: 28, y: 26 } },
packages/core/src/voxel\cityWorldParametricGenerator.ts:3177:      { id: "gen-road-park-loop", kind: "driveway", from: { x: 10, y: 26 }, to: { x: 14, y: 26 } },
web/src\cityWorldAtlasResolver.ts:23:      anchor: { x: number; y: number };
web/src\cityWorldAtlasResolver.ts:53:  terrain: createFallbackPalette("fallback.terrain", "#a3b877", "#6d824f", "#dde5b4"),
web/src\cityWorldAtlasResolver.ts:57:  prop: createFallbackPalette("fallback.prop", "#3d7a49", "#26332c", "#dde5b4"),
web/src\cityWorldAtlasResolver.ts:84:          anchor: sprite.anchor,
web/src\cityWorldAtlasResolver.ts:133:  if (key.startsWith("tile.")) return "terrain";
web/src\cityWorldAtlasResolver.ts:137:  if (key.startsWith("prop.")) return "prop";
web/src\emulator\mockHost.ts:236:    if (/riverside\/?eastvale|open riverside/i.test(text)) {
web/src\emulator\mockHost.ts:237:      qa.county = "riverside-ca";
web/src\emulator\mockHost.ts:238:      void runToolTurn({ name: "select_county", arguments: { countySlug: "riverside-ca" } }, "open riverside");
packages/core/src/voxel\riversideDemoScene.ts:6:    label: "Eastvale",
packages/core/src/voxel\riversideDemoScene.ts:11:    campaignSuggestion: "QR flyers, local Facebook posts, property manager outreach.",
packages/core/src/voxel\riversideDemoScene.ts:38:    campaignSuggestion: "Contact property managers with resident service offer.",
packages/core/src/voxel\riversideDemoScene.ts:56:    campaignSuggestion: "Bundle with Eastvale/Corona route.",
packages/core/src/voxel\riversideDemoScene.ts:59:    id: "riverside",
packages/core/src/voxel\riversideDemoScene.ts:75:  { id: "corona-riverside", from: "corona", to: "riverside", kind: "regional_route" },
packages/core/src/voxel\riversideDemoScene.ts:86:export const riversideDemoVoxelScene: VoxelScene = {
packages/core/src/voxel\riversideDemoScene.ts:88:  id: "voxel-riverside-eastvale-alpha",
packages/core/src/voxel\riversideDemoScene.ts:92:    slug: "riverside-ca",
packages/core/src/voxel\riversideDemoScene.ts:116:    { id: "terrain", label: "Blocks", visible: true },
packages/core/src/voxel\riversideDemoScene.ts:132:    title: "Eastvale Scout Report",
packages/core/src/voxel\riversideDemoScene.ts:157:      { id: "riverside-ca", label: "Riverside County", scale: "county", parentId: "ca", slug: "riverside-ca", position: { x: 32, y: 18, z: 0 } },
packages/core/src/voxel\riversideDemoScene.ts:158:      { id: "eastvale-district", label: "Eastvale", scale: "district", parentId: "riverside-ca", slug: "eastvale", position: { x: 32, y: 18, z: 1 } },
packages/core/src/voxel\riversideDemoScene.ts:159:      { id: "corona-corridor", label: "Corona Corridor", scale: "district", parentId: "riverside-ca", slug: "corona-corridor", position: { x: 26, y: 24, z: 1 } },
packages/core/src/voxel\riversideDemoScene.ts:160:      { id: "place-eastvale-core", label: "Eastvale Core", scale: "place", parentId: "eastvale-district", position: { x: 32, y: 18, z: 1.3 } },
packages/core/src/voxel\riversideDemoScene.ts:163:      { id: "place-community-park", label: "Community Park", scale: "place", parentId: "eastvale-district", position: { x: 35, y: 22, z: 1.2 } },
packages/core/src/voxel\riversideDemoScene.ts:169:        label: "Eastvale City Slice",
packages/core/src/voxel\riversideDemoScene.ts:170:        countySlug: "riverside-ca",
packages/core/src/voxel\riversideDemoScene.ts:172:        summary: "A playable Eastvale slice with homes, plaza lots, parks, and route edges.",
packages/core/src/voxel\riversideDemoScene.ts:180:        countySlug: "riverside-ca",
packages/core/src/voxel\riversideDemoScene.ts:184:        focusNodeIds: ["corona", "riverside"],
packages/core/src/voxel\riversideDemoScene.ts:191:        label: "Eastvale Core",
packages/core/src/voxel\riversideDemoScene.ts:192:        kind: "landmark",
packages/core/src/voxel\riversideDemoScene.ts:216:        description: "A small shop-and-plaza row for place cards and future props.",
packages/core/src/voxel\riversideDemoScene.ts:222:        kind: "landmark",
packages/core/src/voxel\riversideDemoScene.ts:226:        description: "A busy local gym block with parking, foot traffic, and errand overlap.",
packages/core/src/voxel\riversideDemoScene.ts:240:        id: "place-community-park",
packages/core/src/voxel\riversideDemoScene.ts:242:        kind: "park",
packages/core/src/voxel\riversideDemoScene.ts:302:    { id: "plaza-eastvale", kind: "plaza", position: { x: 36, y: 20, z: 1.2 }, label: "Main street shops", nodeId: "gym-plaza-eastvale", layerId: "places", intensity: 0.82 },
packages/core/src/voxel\riversideDemoScene.ts:304:    { id: "park-eastvale", kind: "park", position: { x: 35, y: 22, z: 1.16 }, label: "Community park", nodeId: "eastvale", layerId: "places", intensity: 0.68 },
packages/core/src/voxel\riversideDemoScene.ts:305:    { id: "park-eastvale-2", kind: "park", position: { x: 33.4, y: 20.4, z: 1.12 }, label: "Pocket green", nodeId: "eastvale", layerId: "places", intensity: 0.58 },
packages/core/src/voxel\riversideDemoScene.ts:306:    { id: "landmark-eastvale", kind: "landmark", position: { x: 32, y: 18, z: 1.42 }, label: "Eastvale core", nodeId: "eastvale", layerId: "places", intensity: 0.8 },
packages/core/src/voxel\VoxelSceneCompiler.ts:59:      { id: "terrain", label: "Blocks", visible: true },
packages/core/src/voxel\VoxelSceneCompiler.ts:77:      summary: `${pack.county} is loaded from the curated Alpha pack. ${selectedNode.name} is highlighted as the first playable slice.`,
packages/core/src/voxel\VoxelSceneCompiler.ts:151:        label: "Eastvale",
packages/core/src/voxel\VoxelSceneCompiler.ts:169:        parentId: node.id === "corona" || node.id === "riverside" ? "corona-corridor" : "eastvale-district",
packages/core/src/voxel\VoxelSceneCompiler.ts:176:        label: "Eastvale City Slice",
packages/core/src/voxel\VoxelSceneCompiler.ts:179:        summary: "The playable Alpha district compiled from the Riverside curated pack.",
packages/core/src/voxel\VoxelSceneCompiler.ts:191:        focusNodeIds: pack.mapNodes.filter((node) => node.id === "corona" || node.id === "riverside").map((node) => node.id),
packages/core/src/voxel\VoxelSceneCompiler.ts:199:      districtId: node.id === "corona" || node.id === "riverside" ? "corona-corridor" : "eastvale-district",
packages/core/src/voxel\VoxelSceneCompiler.ts:269:  return node.id === "eastvale" ? "Eastvale" : node.name.replace(/^Eastvale\s+/i, "");
packages/core/src/voxel\VoxelSceneCompiler.ts:300:  if (type === "regional_center") return "landmark" as const;
packages/core/src/voxel\VoxelSceneCompiler.ts:301:  return "landmark" as const;
packages/core/src/voxel\VoxelSceneCompiler.ts:308:  if (type === "regional_center") return "landmark";
packages/core/src/voxel\VoxelSceneCompiler.ts:309:  return "landmark";
packages/core/src/voxel\VoxelSceneCompiler.ts:326:  return `${node.name} from the curated Riverside pack.${signals}`;
packages/core/src/voxel\types.ts:57:  | "park"
packages/core/src/voxel\types.ts:58:  | "landmark"
packages/core/src/voxel\types.ts:112:export type VoxelPlaceKind = "home_area" | "shop" | "plaza" | "park" | "road" | "landmark";
packages/core/src/voxel\types.ts:125:export type VoxelStickerKind = "home" | "shop" | "park" | "favorite" | "idea" | "question";
packages/core/src/voxel\types.ts:191:export type CampaignChannel = "qr_flyer" | "local_group" | "property_manager" | "partner" | "google_profile";
packages/core/src/voxel\types.ts:214:  format: "qr_flyer" | "post_draft" | "outreach_script" | "checklist" | "profile_update";
web/src\emulator\main.ts:12://   src=live|injected  tool-result strategy (injected = pre-parked by the CDP driver)
web/src\emulator\main.ts:62:    ${link("riverside", { county: "riverside-ca", draft: "0" })}

 succeeded in 692ms:
C:\Users\mzwin\Documents\Atlas\artifacts\engine-todo\CODEX_RESULT_E1.md
C:\Users\mzwin\Documents\Atlas\artifacts\engine-todo\CODEX_RESULT_E2.md
C:\Users\mzwin\Documents\Atlas\artifacts\engine-todo\CODEX_RESULT_E2C.md
C:\Users\mzwin\Documents\Atlas\artifacts\engine-todo\CODEX_RESULT_E3E4.md
C:\Users\mzwin\Documents\Atlas\artifacts\engine-todo\CODEX_RESULT_E5.md
C:\Users\mzwin\Documents\Atlas\artifacts\engine-todo\CODEX_RESULT_E6E7.md
C:\Users\mzwin\Documents\Atlas\artifacts\engine-todo\CODEX_RESULT_TAIL.md
C:\Users\mzwin\Documents\Atlas\artifacts\engine-todo\curated-compile-baseline.txt

 succeeded in 736ms:

web/src\CityWorldRenderer.tsx
packages/core/src/voxel\cityWorldTerrainSampler.ts
packages/core/src/voxel\cityWorldRegionalPalettes.ts
packages/core/src/voxel\cityWorldPaletteRegistry.ts
packages/core/src/voxel\cityWorldObjectKit.ts
packages/core/src/voxel\cityWorldGeneratedDistrictArchetypes.ts
packages/core/src/voxel\cityWorldDerivedTerrainMap.ts
packages/core/src/voxel\cityWorldCompiler.ts



codex
I found the strongest smell already: docs say authored grammar, but the TODO/backlog still names hardcoded Eastvale/Anaheim routing and generated fallback degradation. I’m checking whether current code fixed that or whether it remains the art-system bottleneck.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "export const|id:|primary|secondary|accent|terrain|roof|facade|desert|prairie|coastal|river|metro|mountain|regional" packages/core/src/voxel/cityWorldRegionalPalettes.ts' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "materialProfile|roofProfile|facadeStyle|roofShape|prefabFamily|objectKit|Eastvale|Anaheim|Ontario|anchor|curated|default|fallback|tower|ranch|rowhome|cottage|strip_store|storefront" packages/core/src/voxel/cityWorldCompiler.ts' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "AMBIENT|SHADOW|LIGHT|GRADE|SUN|draw.*Detail|window|roof|facade|tree|bush|water|terrain|cliff|mesa|river|shadow|color|height" web/src/CityWorldRenderer.tsx' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "kind:|prefab|tree|bush|water_shimmer|park|landmark|tower|billboard|sign|palette|family|objectKit|roof|facade" packages/core/src/voxel/cityWorldObjectKit.ts packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts' in C:\Users\mzwin\Documents\Atlas
 succeeded in 471ms:
3:export const GENERATED_DISTRICT_ARCHETYPES: readonly GeneratedDistrictArchetype[] = [
4:  "metro_grid",
5:  "coastal_grid",
6:  "desert_basin",
7:  "mountain_valley",
8:  "prairie_town",
9:  "river_town",
15:  roof: readonly [string, string, string];
17:  terrainTone: {
22:    accent: string;
26:export const REGIONAL_PALETTES: Record<GeneratedDistrictArchetype, RegionalPalette> = {
27:  metro_grid: {
28:    archetype: "metro_grid",
30:    roof: ["#666d70", "#26313a", "#b77a4f"],
31:    terrainTone: {
32:      paletteKey: "terrain.region.metro_grid",
36:      accent: "#6e7470",
39:  coastal_grid: {
40:    archetype: "coastal_grid",
42:    roof: ["#2f526d", "#3f7f82", "#66727a"],
43:    terrainTone: {
44:      paletteKey: "terrain.region.coastal_grid",
48:      accent: "#7fa58e",
51:  desert_basin: {
52:    archetype: "desert_basin",
54:    roof: ["#b65f38", "#8f4b32", "#c77a45"],
55:    terrainTone: {
56:      paletteKey: "terrain.region.desert_basin",
60:      accent: "#8fa16f",
63:  mountain_valley: {
64:    archetype: "mountain_valley",
66:    roof: ["#56616a", "#244d34", "#4e514f"],
67:    terrainTone: {
68:      paletteKey: "terrain.region.mountain_valley",
72:      accent: "#7d8174",
75:  prairie_town: {
76:    archetype: "prairie_town",
78:    roof: ["#a43f32", "#8e938b", "#5f7c48"],
79:    terrainTone: {
80:      paletteKey: "terrain.region.prairie_town",
84:      accent: "#8c6f4c",
87:  river_town: {
88:    archetype: "river_town",
90:    roof: ["#2f5d8a", "#577747", "#9a927d"],
91:    terrainTone: {
92:      paletteKey: "terrain.region.river_town",
96:      accent: "#866f4f",
101:export function regionalBuildingPaletteKey(archetype: GeneratedDistrictArchetype, variant: number): string {
105:export function regionalTerrainPaletteKey(archetype: GeneratedDistrictArchetype): string {
106:  return REGIONAL_PALETTES[archetype].terrainTone.paletteKey;
112:  roofIndex: number,
113:): { bodyColor: string; roofColor: string; paletteKey: string; variant: number } {
114:  const variant = (bodyIndex + roofIndex + (palette.variantOffset ?? 0)) % palette.body.length;
117:    roofColor: colorAt(palette.roof, variant),
118:    paletteKey: regionalBuildingPaletteKey(palette.archetype, variant),
127:  roof: string;
131:export const REGIONAL_BUILDING_PALETTES: Record<string, RegionalBuildingPaletteColors> = Object.fromEntries(
135:      regionalBuildingPaletteKey(archetype, index),
140:        roof: colorAt(palette.roof, index),
141:        trim: shadeHex(colorAt(palette.roof, index), -0.18),

 succeeded in 491ms:
47:  const districtLabel = selectedDistrict?.label ?? "Eastvale";
58:    label: "Eastvale City Map",
179:  anchorPack: DistrictPlaceAnchorPack;
183:  const { anchorPack } = input;
184:  const anchors = anchorPack.placeAnchors.filter((anchor) => anchor.anchorRole !== "district_identity");
185:  const profile = createDraftDistrictProfile(anchorPack);
186:  const anchorPositions = createDraftAnchorPositions(anchors, profile);
191:    id: `city-world-draft-${anchorPack.countySlug}-${anchorPack.districtSlug}`,
192:    sourceSceneId: `district-anchor-draft-${anchorPack.countySlug}-${anchorPack.districtSlug}`,
193:    label: `${anchorPack.districtSlug} Draft Scene`,
195:      countySlug: anchorPack.countySlug,
198:      coverageMessage: "Source-noted anchors exist, but this district is not playable or public-quality yet.",
203:      state: anchorPack.stateCode,
205:      district: anchorPack.districtSlug,
225:        center: anchorPositions.get(profile.detailCameraAnchorId) ?? { x: 12, y: 9, z: 0 },
233:    lots: createDraftDistrictLots(anchors, anchorPositions, draftRoadSegments),
234:    buildings: createDraftDistrictBuildings(anchors, anchorPositions),
236:    places: createDraftDistrictPlaces(anchors, anchorPositions, anchorPack.districtSlug),
262:    anchor: PLACE_ANCHORS[place.id] ?? { x: 12 + index * 3, y: 12 + index, z: 0 },
281:function createDraftDistrictProfile(anchorPack: DistrictPlaceAnchorPack): DraftDistrictProfile {
282:  if (anchorPack.districtSlug === "ontario-candidate") {
285:      districtLabel: "Ontario candidate draft",
286:      detailCameraAnchorId: "ontario-mills-commercial-anchor",
290:        "ontario-mills-commercial-anchor": { x: 18.4, y: 11.4, z: 0 },
309:    districtLabel: "Anaheim candidate draft",
330:function createDraftAnchorPositions(anchors: DistrictPlaceAnchor[], profile: DraftDistrictProfile): Map<string, CityWorldPoint> {
331:  const fallback: CityWorldPoint[] = [
341:  anchors.forEach((anchor, index) => {
342:    const fallbackPosition = fallback[index % fallback.length] ?? { x: 11, y: 8.5, z: 0 };
343:    positions.set(anchor.id, profile.preferredPositions[anchor.id] ?? fallbackPosition);
354:      const inOntarioLogisticsEdge = profile.terrainStyle === "inland-logistics" && x >= 23 && x <= 31 && y >= 11 && y <= 20;
355:      const inOntarioCommerceCore = profile.terrainStyle === "inland-logistics" && x >= 15 && x <= 23 && y >= 9 && y <= 16;
356:      const inOntarioResidentialGrid = profile.terrainStyle === "inland-logistics" && x >= 5 && x <= 14 && y >= 6 && y <= 13;
358:        profile.terrainStyle === "resort-venue" ? x >= 15 && x <= 27 && y >= 9 && y <= 18 : inOntarioCommerceCore || inOntarioLogisticsEdge;
359:      const inResidentialArea = profile.terrainStyle === "resort-venue" ? x >= 6 && x <= 14 && y >= 6 && y <= 12 : inOntarioResidentialGrid;
360:      const kind: CityWorldTerrainKind = inOntarioLogisticsEdge
392:function createDraftDistrictLots(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>, roads: CityWorldRoadSegment[]): CityWorldLot[] {
393:  return anchors.map((anchor) => {
394:    const position = positions.get(anchor.id) ?? { x: 10, y: 10, z: 0 };
395:    const kind = draftLotKind(anchor.category);
396:    const footprint = draftLotFootprint(anchor);
399:        id: `draft-lot-${anchor.id}`,
401:        label: anchor.label,
405:        placeId: `draft-place-${anchor.id}`,
420:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
421:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
427:    { suffix: "rowhome-street", offset: { x: -2.15, y: -0.5 }, kind: "home", width: 3.8, depth: 1.12, height: 1.52, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
428:    { suffix: "lowrise-courtyard", offset: { x: 1.26, y: -0.38 }, kind: "apartment", width: 2.8, depth: 1.9, height: 2.18, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
429:    { suffix: "mixed-use-edge", offset: { x: 0.06, y: 1.68 }, kind: "shop", width: 3.15, depth: 1.18, height: 1.08, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
432:    { suffix: "exhibit-hall-west", offset: { x: -2.55, y: -0.38 }, kind: "civic", width: 5.45, depth: 1.86, height: 1.04, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
433:    { suffix: "exhibit-hall-east", offset: { x: 2.2, y: -0.02 }, kind: "civic", width: 5.35, depth: 1.82, height: 1.1, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
441:      facadeStyle: "civic",
442:      roofShape: "hip",
445:    { suffix: "glass-arcade-front", offset: { x: -2.2, y: 1.48 }, kind: "civic", width: 2.9, depth: 0.72, height: 0.58, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
446:    { suffix: "frontage-wing", offset: { x: 3.22, y: 1.36 }, kind: "civic", width: 2.55, depth: 0.9, height: 0.72, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
449:    { suffix: "terminal-shed", offset: { x: -1.32, y: -0.22 }, kind: "gym", width: 7.15, depth: 1.74, height: 1.95, facadeStyle: "fitness", roofShape: "sawtooth", detailLevel: "high" },
450:    { suffix: "platform-edge", offset: { x: -1.15, y: 1.05 }, kind: "civic", width: 5.85, depth: 0.64, height: 0.42, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
451:    { suffix: "ticket-hall", offset: { x: -0.18, y: 1.18 }, kind: "civic", width: 2.55, depth: 1.02, height: 0.92, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
452:    { suffix: "clock-tower", offset: { x: -0.06, y: -0.62 }, kind: "civic", width: 0.86, depth: 0.86, height: 3.82, facadeStyle: "civic", roofShape: "tower", detailLevel: "high" },
455:    { suffix: "venue-bowl-west", offset: { x: -2.02, y: -0.28 }, kind: "civic", width: 4.9, depth: 3.48, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
456:    { suffix: "venue-bowl-east", offset: { x: 1.96, y: -0.02 }, kind: "civic", width: 4.82, depth: 3.36, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
457:    { suffix: "homeplate-gate", offset: { x: -0.24, y: 1.96 }, kind: "civic", width: 2.45, depth: 1.16, height: 1.0, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
458:    { suffix: "event-gate-east", offset: { x: 2.68, y: 1.45 }, kind: "civic", width: 1.85, depth: 0.95, height: 0.76, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
461:    { suffix: "community-hall", offset: { x: -0.72, y: -0.05 }, kind: "civic", width: 3.05, depth: 1.62, height: 1.24, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
462:    { suffix: "classroom-wing", offset: { x: 1.48, y: 0.82 }, kind: "civic", width: 2.1, depth: 0.98, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
463:    { suffix: "front-porch", offset: { x: 0.35, y: 1.45 }, kind: "civic", width: 1.55, depth: 0.82, height: 0.66, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
466:    { suffix: "rowhome-street", offset: { x: -2.25, y: -0.55 }, kind: "home", width: 3.75, depth: 1.08, height: 1.45, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
467:    { suffix: "ranch-court-west", offset: { x: 0.75, y: -0.72 }, kind: "home", width: 2.15, depth: 1.45, height: 1.05, facadeStyle: "ranch", roofShape: "hip", detailLevel: "medium" },
468:    { suffix: "ranch-court-east", offset: { x: 2.35, y: 0.65 }, kind: "home", width: 2.05, depth: 1.38, height: 0.96, facadeStyle: "ranch", roofShape: "gable", detailLevel: "medium" },
469:    { suffix: "cottage-court", offset: { x: -1.05, y: 0.72 }, kind: "home", width: 1.4, depth: 1.15, height: 1.28, facadeStyle: "cottage", roofShape: "gable", detailLevel: "medium" },
470:    { suffix: "lowrise-edge", offset: { x: -0.35, y: 1.55 }, kind: "apartment", width: 2.65, depth: 1.72, height: 1.88, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
472:  "ontario-mills-commercial-anchor": [
473:    { suffix: "retail-hall-west", offset: { x: -2.15, y: -0.18 }, kind: "shop", width: 4.15, depth: 1.55, height: 1.02, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
474:    { suffix: "retail-hall-east", offset: { x: 1.9, y: -0.05 }, kind: "shop", width: 4.0, depth: 1.5, height: 1.0, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
475:    { suffix: "entry-court", offset: { x: 0.15, y: 1.36 }, kind: "shop", width: 2.6, depth: 0.95, height: 0.72, facadeStyle: "storefront", roofShape: "hip", detailLevel: "high" },
478:    { suffix: "terminal-hall", offset: { x: -1.95, y: -0.18 }, kind: "civic", width: 4.75, depth: 1.42, height: 1.2, facadeStyle: "civic", roofShape: "sawtooth", detailLevel: "high" },
479:    { suffix: "logistics-apron-wing", offset: { x: 1.88, y: 0.1 }, kind: "shop", width: 3.45, depth: 1.36, height: 0.82, facadeStyle: "storefront", roofShape: "flat", detailLevel: "medium" },
480:    { suffix: "control-tower", offset: { x: 2.35, y: -0.95 }, kind: "civic", width: 0.96, depth: 0.96, height: 2.95, facadeStyle: "civic", roofShape: "tower", detailLevel: "high" },
483:    { suffix: "civic-hall", offset: { x: -1.05, y: -0.18 }, kind: "civic", width: 3.2, depth: 1.7, height: 1.36, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
484:    { suffix: "office-wing", offset: { x: 1.55, y: 0.8 }, kind: "civic", width: 2.25, depth: 1.1, height: 1.05, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
487:    { suffix: "service-row", offset: { x: -1.2, y: -0.15 }, kind: "shop", width: 3.25, depth: 1.1, height: 0.98, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
488:    { suffix: "mixed-lowrise", offset: { x: 1.25, y: 0.95 }, kind: "apartment", width: 2.25, depth: 1.45, height: 1.65, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
492:function createDraftDistrictBuildings(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>): CityWorldBuilding[] {
495:  for (const anchor of anchors) {
496:    const position = positions.get(anchor.id) ?? { x: 10, y: 10, z: 0 };
497:    const anchorSpecs = DRAFT_ANCHOR_BUILDING_SPECS[anchor.id];
498:    if (anchorSpecs) {
499:      buildings.push(...anchorSpecs.map((spec) => createDraftBuildingFromSpec(anchor, position, spec)));
502:    buildings.push(createDraftBuilding(anchor, anchor.id, position, draftBuildingKind(anchor.category), draftBuildingWidth(anchor.category), draftBuildingDepth(anchor.category), draftBuildingHeight(anchor.category), draftFacade(anchor.category), draftRoof(anchor.category)));
508:function createDraftBuildingFromSpec(anchor: DistrictPlaceAnchor, position: CityWorldPoint, spec: DraftBuildingSpec): CityWorldBuilding {
510:    anchor,
511:    `${anchor.id}-${spec.suffix}`,
517:    spec.facadeStyle,
518:    spec.roofShape,
525:  anchor: DistrictPlaceAnchor,
532:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
533:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>,
536:  const colors = draftBuildingColors(idSuffix, kind, facadeStyle);
540:    label: anchor.label,
547:    placeId: `draft-place-${anchor.id}`,
548:    roofShape,
549:    facadeStyle,
550:    paletteKey: draftBuildingPaletteKey(kind, facadeStyle),
558:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
560:  if (idSuffix.includes("rowhome")) return { body: "#e6c7ad", roof: "#a75f44" };
571:  if (kind === "gym" || facadeStyle === "fitness") return { body: "#dfe8e5", roof: "#5f8fa6" };
574:  if (kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return { body: "#efd8b6", roof: "#3f8b8c" };
578:function draftLotFootprint(anchor: DistrictPlaceAnchor): { width: number; depth: number } {
579:  if (anchor.id === "platinum-triangle-area") return { width: 7.1, depth: 4.9 };
580:  if (anchor.id === "anaheim-convention-center") return { width: 7.3, depth: 4.45 };
581:  if (anchor.id === "artic-transit-center") return { width: 6.25, depth: 3.15 };
582:  if (anchor.id === "angel-stadium") return { width: 7.6, depth: 5.1 };
583:  if (anchor.id === "downtown-anaheim-community-center") return { width: 4.8, depth: 3.3 };
584:  if (anchor.id === "ontario-inland-residential-variety") return { width: 7.0, depth: 4.55 };
585:  if (anchor.id === "ontario-mills-commercial-anchor") return { width: 7.8, depth: 4.35 };
586:  if (anchor.id === "ontario-international-airport") return { width: 7.1, depth: 4.05 };
587:  if (anchor.id === "ontario-civic-center-core") return { width: 5.2, depth: 3.4 };
588:  if (anchor.id === "ontario-downtown-service-core") return { width: 4.8, depth: 3.25 };
590:  const large = anchor.category === "entertainment" || anchor.category === "civic" || anchor.category === "transit";
592:    width: anchor.category === "entertainment" ? 6.6 : large ? 5.2 : anchor.category === "home_area" ? 6.8 : 3.8,
593:    depth: anchor.category === "entertainment" ? 4.6 : large ? 3.8 : anchor.category === "home_area" ? 4.8 : 3,
597:function createDraftDistrictPlaces(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>, districtSlug: string): CityWorldPlace[] {
598:  return anchors.map((anchor, index) => ({
599:    id: `draft-place-${anchor.id}`,
600:    label: anchor.label,
601:    kind: draftPlaceKind(anchor.category),
603:    nodeId: anchor.id,
604:    anchor: positions.get(anchor.id) ?? { x: 8 + index * 3, y: 9 + index, z: 0 },
605:    hitRadius: anchor.category === "home_area" ? 3.8 : 2.8,
606:    description: `Non-public draft anchor: ${anchor.sourceFact}`,
707:function draftFacade(category: WorldPlaceCategory): NonNullable<CityWorldBuilding["facadeStyle"]> {
708:  if (category === "home_area") return "rowhome";
710:  return "strip_store";
713:function draftRoof(category: WorldPlaceCategory): NonNullable<CityWorldBuilding["roofShape"]> {
715:  if (category === "transit" || category === "entertainment") return "tower";
721:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
723:  if (kind === "home" && facadeStyle === "rowhome") return "building.house.rowhome.flat_parapet.v1";
724:  if (kind === "home" && facadeStyle === "ranch") return "building.house.ranch.v1";
725:  if (kind === "home" && facadeStyle === "cottage") return "building.house.cottage.v1";
726:  if (kind === "shop" && facadeStyle === "strip_store") return "building.store.strip.three_bay.v1";
727:  if (kind === "apartment" && facadeStyle === "lowrise") return "building.apartment.lowrise.stepped.v1";
817:      label: "Eastvale Core",
825:      roofShape: "tower",
826:      facadeStyle: "civic",
840:      roofShape: "sawtooth",
841:      facadeStyle: "fitness",
855:      facadeStyle: "lowrise",
869:      facadeStyle: "lowrise",
889:    createResidentialBuilding("building-cottage-west-a", "Cottage", 10.4, 6.5, 1.35, 1.1, 1.22, "#f2dfc4", "#b86f4c", "cottage", "gable"),
890:    createResidentialBuilding("building-cottage-west-c", "Cottage", 12.6, 6.5, 1.32, 1.12, 1.24, "#f6e7cf", "#b99358", "cottage", "gable"),
891:    createResidentialBuilding("building-cottage-west-f", "Cottage", 14.8, 6.5, 1.38, 1.12, 1.28, "#f2dfc4", "#5f8fa0", "cottage", "hip"),
892:    createResidentialBuilding("building-cottage-north-a", "Cottage", 10.4, 8.5, 1.32, 1.08, 1.12, "#ead4b6", "#b99358", "cottage", "gable"),
893:    createResidentialBuilding("building-cottage-north-d", "Cottage", 16.0, 5.5, 1.36, 1.12, 1.16, "#f0d6bd", "#8a6a52", "cottage", "gable"),
894:    createResidentialBuilding("building-ranch-west-a", "Ranch home", 17.9, 5.5, 1.95, 1.15, 1.08, "#e8c9aa", "#7f9b6e", "ranch", "hip"),
896:    createResidentialBuilding("building-cottage-west-b", "Cottage", 6.0, 6.5, 1.45, 1.15, 1.75, "#ead4b6", "#5f8fa0", "cottage", "hip"),
897:    createResidentialBuilding("building-cottage-west-d", "Cottage", 8.2, 6.5, 1.8, 1.3, 1.35, "#f0d6bd", "#8f7568", "cottage", "gable"),
898:    createResidentialBuilding("building-cottage-west-e", "Cottage", 6.0, 8.5, 1.38, 1.08, 1.72, "#f6e7cf", "#b86f4c", "cottage", "gable"),
899:    createResidentialBuilding("building-cottage-west-g", "Cottage", 8.2, 8.5, 1.82, 1.28, 1.3, "#ead4b6", "#8a6a52", "cottage", "gable"),
900:    createResidentialBuilding("building-cottage-west-h", "Cottage", 6.0, 10.5, 1.34, 1.1, 1.68, "#f0dcbe", "#b99358", "cottage", "gable"),
901:    createResidentialBuilding("building-cottage-west-i", "Cottage", 8.2, 10.5, 1.86, 1.34, 1.32, "#eed4b4", "#7d955f", "cottage", "hip"),
902:    createResidentialBuilding("building-ranch-west-b", "Ranch home", 6.0, 12.5, 2.42, 1.48, 1.1, "#ead4b6", "#a76f4e", "ranch", "hip"),
903:    createResidentialBuilding("building-ranch-west-c", "Ranch home", 8.2, 12.5, 2.05, 1.18, 1.62, "#e8c9aa", "#7f9b6e", "ranch", "hip"),
904:    createResidentialBuilding("building-cottage-north-b", "Cottage", 19.8, 5.5, 1.78, 1.32, 1.34, "#e8c9aa", "#8f7568", "cottage", "gable"),
905:    createResidentialBuilding("building-cottage-north-c", "Cottage", 21.7, 5.5, 1.42, 1.1, 1.78, "#f2dfc4", "#b86f4c", "cottage", "hip"),
906:    createResidentialBuilding("building-cottage-north-e", "Cottage", 23.6, 5.5, 1.88, 1.3, 1.7, "#eed4b4", "#7d955f", "cottage", "gable"),
907:    createResidentialBuilding("building-ranch-west-d", "Ranch home", 19.8, 7.3, 1.98, 1.16, 1.05, "#ecd2b0", "#5f7f8e", "ranch", "gable"),
908:    createResidentialBuilding("building-ranch-west-e", "Ranch home", 21.7, 7.3, 2.44, 1.46, 1.58, "#f4e2c6", "#5d7f8a", "ranch", "gable"),
909:    createResidentialBuilding("building-rowhome-west-a", "Rowhomes", 23.6, 7.3, 3.25, 1.25, 1.55, "#f2dfc2", "#607d84", "rowhome", "flat", "building.house.rowhome.flat_parapet.v1"),
910:    createResidentialBuilding("building-ranch-north-b", "Ranch home", 19.8, 9.1, 2.02, 1.2, 1.58, "#e8c9aa", "#5f7f8e", "ranch", "gable"),
911:    createResidentialBuilding("building-rowhome-north-a", "Rowhomes", 21.7, 9.1, 3.1, 1.2, 1.5, "#f2dfc2", "#6f9ca7", "rowhome", "flat", "building.house.rowhome.flat_parapet.v1"),
912:    createResidentialBuilding("building-ranch-south-c", "Ranch home", 23.6, 9.1, 2.06, 1.2, 1.06, "#ecd2b0", "#7f9b6e", "ranch", "gable"),
913:    createResidentialBuilding("building-cottage-south-a", "Cottage", 23.9, 22.85, 1.36, 1.1, 1.72, "#f0dcbe", "#8a6a52", "cottage", "gable"),
914:    createResidentialBuilding("building-ranch-south-a", "Ranch home", 26.55, 22.9, 1.98, 1.16, 1.04, "#ecd2b0", "#5f7f8e", "ranch", "hip"),
915:    createResidentialBuilding("building-cottage-south-b", "Cottage", 24.05, 24.85, 1.84, 1.3, 1.26, "#eed4b4", "#7d955f", "cottage", "gable"),
916:    createResidentialBuilding("building-ranch-south-b", "Ranch home", 26.7, 24.8, 2.44, 1.46, 1.1, "#f4e2c6", "#5d7f8a", "ranch", "hip"),
931:    roofShape: "flat",
932:    facadeStyle: "storefront",
947:    roofShape: "flat",
948:    facadeStyle: "lowrise",
965:    roofShape: "flat",
966:    facadeStyle: "strip_store",
983:  facadeStyle: "cottage" | "ranch" | "rowhome",
984:  roofShape: "gable" | "hip" | "flat",
1003:    roofShape,
1004:    facadeStyle,
1005:    detailLevel: facadeStyle === "rowhome" ? "high" : "medium",
1062:  // 0.74F curated public kit: plaza furniture at the civic core, streetlights
1063:  // along Hamner Ave, a dock + moored boat on the river, and the water tower
1077:    { id: "prop-gym-water-tower", kind: "water_tower", position: { x: 33.4, y: 16.4, z: 0 }, variant: 0 },
1096:      anchor: { x: place.anchor.x + 0.7, y: place.anchor.y - 0.6, z: 1.8 },
1114:      anchor: { x: place.anchor.x - 0.75, y: place.anchor.y - 0.5, z: 1.6 },
1116:      spriteKey: "pin.note.default",
1466:  if (lot.id.startsWith("draft-lot-")) return "hidden_draft_anchor_pad";
1476:  if (lot.id.startsWith("draft-lot-")) return "hidden_anchor_shelf";
1487:  roofShape: CityWorldBuilding["roofShape"],
1488:  facadeStyle: CityWorldBuilding["facadeStyle"],
1491:  const objectFamily = buildingObjectFamily(building, roofShape, facadeStyle);
1492:  const materialProfile = buildingMaterialProfile(building, facadeStyle);
1493:  const roofProfile = buildingRoofProfile(building, roofShape, facadeStyle);
1496:    materialProfile,
1497:    roofProfile,
1499:    clusterRole: buildingClusterRole(building, objectFamily, facadeStyle),
1500:    noLabelPriority: buildingNoLabelPriority(building, roofShape, objectFamily, detailLevel),
1507:  facadeStyle: CityWorldBuilding["facadeStyle"],
1508:): NonNullable<CityWorldVisualGrammar["materialProfile"]> {
1510:  if (building.kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return "socal_storefront";
1511:  if (building.kind === "apartment" || facadeStyle === "lowrise") return "socal_lowrise";
1512:  if (facadeStyle === "ranch") return "socal_cool_stucco";
1513:  if (facadeStyle === "rowhome") return "socal_stucco_light";
1519:  roofShape: CityWorldBuilding["roofShape"],
1520:  facadeStyle: CityWorldBuilding["facadeStyle"],
1521:): NonNullable<CityWorldVisualGrammar["roofProfile"]> {
1522:  if (roofShape === "tower") {
1523:    return building.kind === "civic" && facadeStyle === "civic" ? "civic_glass_cap" : "blue_metal_utility";
1526:  if (roofShape === "flat") return "flat_parapet_cap";
1527:  if (facadeStyle === "ranch") return "sage_tile";
1528:  if (roofShape === "hip") return "cool_clay_tile";
1529:  if (roofShape === "sawtooth") return "blue_metal_utility";
1535:  roofShape: CityWorldBuilding["roofShape"],
1536:  facadeStyle: CityWorldBuilding["facadeStyle"],
1539:  if (id.includes("anaheim-convention-center") || id.includes("angel-stadium")) return "venue_anchor";
1540:  if (id.includes("artic-transit-center") || id.includes("ontario-international-airport")) return "transit_anchor";
1543:  const base = buildingAuthoredObjectFamily(building, roofShape, facadeStyle);
1550:  roofShape: CityWorldBuilding["roofShape"],
1551:  facadeStyle: CityWorldBuilding["facadeStyle"],
1553:  if (building.kind !== "civic" && roofShape === "tower") return "service_block";
1554:  if (building.kind === "apartment" || facadeStyle === "lowrise") return "lowrise_cluster";
1555:  if (building.kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return "commerce_strip";
1556:  if (building.kind === "gym" || facadeStyle === "fitness") return "service_block";
1557:  if (building.kind === "civic" || facadeStyle === "civic") return "civic_landmark";
1564:  facadeStyle: CityWorldBuilding["facadeStyle"],
1566:  if (objectFamily === "civic_landmark" || objectFamily === "venue_anchor" || objectFamily === "transit_anchor") return "anchor";
1567:  if (objectFamily === "commerce_strip" || facadeStyle === "rowhome") return "edge";
1575:  roofShape: CityWorldBuilding["roofShape"],
1586:    id.includes("ontario-mills-commercial-anchor") ||
1589:    return "primary_anchor";
1591:  if (objectFamily === "venue_anchor" || objectFamily === "transit_anchor") return "primary_anchor";
1592:  if (roofShape === "tower" && objectFamily === "service_block" && detailLevel === "high") return "supporting";
1623:  const roofShape =
1624:    building.roofShape ??
1635:            : "tower");
1636:  const facadeStyle =
1637:    building.facadeStyle ??
1641:        ? "storefront"
1651:    spriteKey: building.spriteKey ?? resolveBuildingSpriteKey(building, roofShape, facadeStyle, variant),
1652:    paletteKey: building.paletteKey ?? resolveBuildingPaletteKey(building, facadeStyle, variant),
1653:    roofShape,
1654:    facadeStyle,
1656:    visualGrammar: buildingVisualGrammar(building, roofShape, facadeStyle, detailLevel),
1661:    objectKit: assignCityWorldObjectKit(buildingWithVisualGrammar),
1665:function resolveBuildingSpriteKey(building: CityWorldBuilding, roofShape: CityWorldBuilding["roofShape"], facadeStyle: CityWorldBuilding["facadeStyle"], variant: number): string {
1666:  if (building.kind === "home" && facadeStyle === "cottage") return "building.house.cottage.front_gable.v1";
1667:  if (building.kind === "home" && facadeStyle === "ranch") return "building.house.ranch.low_gable.v1";
1668:  if (building.kind === "home" && facadeStyle === "rowhome") return "building.house.rowhome.flat_parapet.v1";
1669:  if (building.kind === "shop" && facadeStyle === "strip_store") return "building.store.strip.three_bay.v1";
1670:  if (building.kind === "apartment" && facadeStyle === "lowrise") return "building.apartment.lowrise.stepped.v1";
1671:  return `building.${building.kind}.${roofShape}.${variant % 4}`;
1680:  cottage: 4,
1681:  ranch: 3,
1682:  rowhome: 2,
1684:  strip_store: 3,
1692:function resolveBuildingPaletteKey(building: CityWorldBuilding, facadeStyle: CityWorldBuilding["facadeStyle"], variant: number): string {
1693:  if (building.kind === "home" && facadeStyle === "cottage") return `building.house.cottage.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.cottage)}`;
1694:  if (building.kind === "home" && facadeStyle === "ranch") return `building.house.ranch.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.ranch)}`;
1695:  if (building.kind === "home" && facadeStyle === "rowhome") return `building.house.rowhome.flat_parapet.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.rowhome)}`;
1696:  if (building.kind === "home" && facadeStyle) return `building.house.${facadeStyle}.v1`;
1697:  if (building.kind === "shop" && facadeStyle === "strip_store") return `building.store.strip.three_bay.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.strip_store)}`;
1698:  if (building.kind === "apartment" && facadeStyle === "lowrise") return `building.apartment.lowrise.stepped.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.lowrise)}`;

 succeeded in 514ms:
71:  kind: "car" | "walker" | "water" | "cloud" | "pulse";
80:  "terrainLayer" | "roadLayer" | "lotLayer" | "padLayer" | "shadowLayer" | "buildingPropDepthLayer" | "buildingLayer" | "propLayer" | "actorLayer" | "focusLayer" | "labelLayer" | "markerLayer" | "hudBridgeLayer",
94:  height: number;
96:  roofColor: number;
115:// Max one streaming window rebuild per this interval while a finger is down
117:// budget-clipped windows without letting the view outrun the window.
125:// lower-right faces fall into cool shade, and cast shadows skew to the
127:const SUN_WARM_TINT = 0xffe2ae;
128:const SUN_COOL_TINT = 0x46658a;
129:const CAST_SHADOW_COLOR = 0x27404b;
130:const CAST_SHADOW_ALPHA = 0.5;
131:// Screen-space ground offset of a cast shadow per pixel of object height.
132:const CAST_SHADOW_VECTOR = { x: 0.92, y: 0.21 };
135:// board). The diorama itself stays the only colorful thing in both themes.
136:const BACKGROUND_COLOR_LIGHT = 0xa6b87c;
143:  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
147:  return isDarkTheme() ? BACKGROUND_COLOR_DARK : BACKGROUND_COLOR_LIGHT;
154:  water: 0x176a9f,
162:  water: 0x237aa4,
170:  water: 0x5b91a6,
181:  waterfront: 0x93ccd4,
191:  waterfront: 0x97c6ca,
201:  waterfront: 0x9dbdc2,
208:// (visualGrammar.terrainContact / roadContact / lotContact). These resolvers
220:  return tile.visualGrammar?.terrainContact ?? { tone: groundToneFromId(tile.id), contactShadow: false };
229:        road.kind === "avenue" ? "avenue_dash" : road.kind === "street" ? "street_dash" : road.kind === "driveway" ? "apron_dash" : "none",
237:      profile: lot.kind === "waterfront" ? "shore" : lot.kind === "park" ? "green" : lot.kind === "shop" || lot.kind === "gym" ? "apron" : "foundation",
259:function tileEdgeSegment(point: ProjectedPoint, width: number, height: number, side: CityWorldTileEdge): { from: ProjectedPoint; to: ProjectedPoint } {
260:  const top = { x: point.x, y: point.y - height / 2 };
262:  const bottom = { x: point.x, y: point.y + height / 2 };
278:function lotCurbPoint(point: ProjectedPoint, width: number, height: number, edge: CityWorldTileEdge): ProjectedPoint {
279:  const segment = tileEdgeSegment(point, width, height, edge);
288:// cool-shadow split tone, soft vignette, warm atmospheric edge haze, and a
291:const GRADE_VERTEX_SHADER = `
321:const GRADE_FRAGMENT_SHADER = `
337:    // 0.54E — highlight rolloff. Sunlit stucco and lit roofs ride near-white
350:    // Golden-hour split tone: warm sunlit highlights, cool shadows.
377:      vertex: GRADE_VERTEX_SHADER,
378:      fragment: GRADE_FRAGMENT_SHADER,
406:  // Budget-clipped windows (heaviest generated mobile scenes) can leave near-
407:  // zero streaming margin, so an un-throttled pan rebuilds the window several
418:  // for the mobile-interaction browser proof.
424:  const [windowRefreshKey, setWindowRefreshKey] = useState(0);
533:        resolution: Math.min(window.devicePixelRatio || 1, 2),
546:      // covers the open ground beyond the streamed tile window too.
549:        backdrop.clear().rect(0, 0, app.screen.width + 2, app.screen.height + 2).fill({ color: resolveBackgroundColor() });
555:      // prefers-color-scheme) repaint the surround without a scene rebuild.
560:      window.addEventListener("openai:set_globals", onThemeChange, { passive: true });
561:      const darkQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
564:        window.removeEventListener("openai:set_globals", onThemeChange);
576:      (window as unknown as Record<string, unknown>).__ATLAS_QA__ = {
631:        window.cancelAnimationFrame(cameraFrameRef.current);
657:        window.cancelAnimationFrame(inertiaFrameRef.current);
683:        inertiaFrameRef.current = window.requestAnimationFrame(step);
685:      inertiaFrameRef.current = window.requestAnimationFrame(step);
713:      // Cap the coast: beyond ~1.5px/ms the decay tail crosses several window
734:        // Synthetic browser-proof events may not register as active pointers.
858:    const qaHandle = (window as unknown as Record<string, unknown>).__ATLAS_QA__ as Record<string, unknown> | undefined;
864:    // 0.67H — expose the rebuild count for the mobile-interaction browser proof.
868:    (window as Window & { __atlasCityWorldRebuildCount?: number }).__atlasCityWorldRebuildCount = nextRebuildCount;
873:  }, [atlasTextures, cameraPresetId, debugMode, ready, scene, suppressPlaceLabels, windowRefreshKey]);
904:    if (focusPulseTimeoutRef.current !== undefined) window.clearTimeout(focusPulseTimeoutRef.current);
906:      focusPulseTimeoutRef.current = window.setTimeout(() => {
928:    // Deferred while a finger is still down: the full window rebuild the
984:      window.cancelAnimationFrame(inertiaFrameRef.current);
1009:    cameraFrameRef.current = window.requestAnimationFrame(() => {
1032:    // Gesture throttle: budget-clipped windows can demand a refresh on nearly
1046:    window.requestAnimationFrame(() => {
1104:// Frame-independent scene-window artifacts are memoized per scene object +
1149:  const sceneWindow = compiler.windowFor(cameraPresetId, viewportFrame);
1157:  drawBanded(layers.terrainLayer, orderedSceneItems(renderCommands, "terrain_tile", itemIndex.terrainTiles), (g, tile) => drawTerrainTile(g, tile, atlas));
1228:  if (typeof window === "undefined") return false;
1229:  return new URLSearchParams(window.location.search).get("atlasNoLabels") === "1";
1352:  for (const tile of scene.terrainTiles) {
1353:    const massing = tile.visualGrammar?.terrainChunkMassing ?? "none";
1356:    const color = debugColorForMassing(massing);
1359:    outline.stroke({ color, alpha: 0.42, width: 1.4, cap: "round", join: "round" });
1369:    line.stroke({ color: 0x55d7ff, alpha: 0.36, width: Math.max(1.2, road.width), cap: "round", join: "round" });
1377:    outline.stroke({ color: 0xffd166, alpha: 0.34, width: 1.2, cap: "round", join: "round" });
1384:    const color = debugColorForObjectFamily(family);
1387:    outline.stroke({ color, alpha: 0.58, width: building.visualGrammar?.clusterRole === "anchor" ? 2 : 1.2, cap: "round", join: "round" });
1389:      outline.circle(point.x, point.y - building.height * TILE_DEPTH - 14, 5).fill({ color, alpha: 0.72 });
1393:      layer.addChild(debugText(familyShortLabel(family), point.x, point.y - building.height * TILE_DEPTH - 24, color));
1398:function debugColorForMassing(massing: NonNullable<CityWorldTerrainTile["visualGrammar"]>["terrainChunkMassing"]) {
1404:  if (massing === "waterfront_bank_cut_mass") return 0x22b8cf;
1431:function debugText(text: string, x: number, y: number, color: number) {
1435:      fill: color,
1439:      stroke: { color: 0x10160f, width: 3 },
1449:    terrainLayer: namedLayer("terrainLayer"),
1456:    shadowLayer: namedLayer("shadowLayer"),
1499:  const regionalTerrain = tile.paletteKey?.startsWith("terrain.region.") ? atlas.resolvePalette(tile.paletteKey, "terrain").colors : undefined;
1500:  const baseColor = shellTile ? SHELL_TERRAIN_COLORS[tile.kind] : draftTile ? DRAFT_TERRAIN_COLORS[tile.kind] : regionalTerrain ? colorToNumber(regionalTerrain.base) : TERRAIN_COLORS[tile.kind];
1502:  // per-tile hash so the ground reads as planted terrain, not a flat board —
1509:  const toneScale = tile.kind === "water" ? 0.9 : tile.kind === "grass" ? 1.25 : 0.6;
1510:  const variation = (tile.variant - 2) * (tile.kind === "water" ? 3.1 : tile.kind === "grass" ? 1.2 : 1.8) + (lowFrequencyTone + hashTone) * toneScale;
1511:  // Ground sits a half-step below the sunlit rooftops so built forms read
1512:  // bright against the terrain instead of blending into it.
1513:  const color = shellTile
1515:    : tile.kind === "water"
1517:      : mixColor(scaleColor(shadeColor(baseColor, variation), 0.98), SUN_WARM_TINT, 0.07);
1518:  const alpha = shellTile ? (tile.kind === "grass" ? 0.86 : 0.9) : draftTile ? (tile.kind === "grass" ? 0.84 : 0.92) : tile.kind === "water" ? 0.97 : tile.kind === "grass" ? 0.92 : 0.94;
1519:  const strokeAlpha = shellTile ? (tile.kind === "grass" ? 0.1 : 0.14) : draftTile ? (tile.kind === "grass" ? 0.018 : 0.1) : tile.kind === "grass" ? 0.026 : tile.kind === "water" ? 0.28 : 0.12;
1520:  const strokeColor = tile.kind === "water" ? 0x0b4f79 : shellTile ? 0x747965 : draftTile ? 0x7a8a58 : regionalTerrain ? colorToNumber(regionalTerrain.shade) : 0x6d824f;
1523:  drawTerrainChunkMassing(g, tile, point, color);
1524:  drawTerrainElevationEdges(g, tile, point, color);
1525:  drawTerrainCliffCourses(g, tile, point, color);
1526:  const graphic = appendPolygon(g, diamondPoints(point, TILE_WIDTH + 1, TILE_HEIGHT + 1), color, alpha, strokeColor, strokeAlpha);
1528:  if (tile.kind === "water") {
1532:      .fill({ color: 0x75c9ee, alpha: 0.22 })
1534:      .fill({ color: 0x052f5a, alpha: 0.28 })
1536:      .fill({ color: 0x0e5f98, alpha: 0.18 });
1541:        .stroke({ color: 0xd7f8ff, alpha: 0.28, width: 1.15, cap: "round" });
1544:    graphic.circle(point.x - 5, point.y - 1, 1.8).fill({ color: 0xd8f0b2, alpha: 0.32 });
1549:      .stroke({ color: 0xf5e7c1, alpha: 0.26, width: 1 });
1551:    graphic.circle(point.x + 7, point.y + 1, 1.1).fill({ color: 0xe0efb4, alpha: 0.08 });
1555:  drawTerrainElevationChunkFace(graphic, tile, point, color);
1557:  drawTerrainContactSeams(graphic, tile, point, contact, color);
1562:// 0.74F terrain relief: raised tiles extrude stacked voxel cliff courses on
1564:// sun-consistent visible cliff walls; north/west bands read as shadowed cuts
1567:function drawTerrainCliffCourses(g: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
1572:  const height = TILE_HEIGHT + 1;
1576:  const cliffBase = shadeColor(color, -10);
1579:    const edge = tileEdgeSegment(point, width, height, side);
1585:        ? sunlitColor(shadeColor(cliffBase, -course * 9), side === "south" ? "sun" : "shade")
1586:        : shadeColor(cliffBase, -30 - course * 8);
1597:        .fill({ color: faceColor, alpha: frontFace ? 0.98 : 0.92 });
1603:          .stroke({ color: shadeColor(color, 30), alpha: course === 0 ? 0.58 : 0.36, width: 1.15, cap: "butt" });
1608:        .stroke({ color: frontFace ? shadeColor(color, 12) : shadeColor(color, -46), alpha: frontFace ? 0.24 : 0.18, width: 0.9, cap: "butt" });
1613:// Material seams + water bank strands, authored by the compiler as
1614:// terrainContact metadata. Seams are inset inside the owning tile so they
1616:function drawTerrainContactSeams(graphic: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, contact: CityWorldTerrainContactGrammar, color: number) {
1619:  const waterEdgeSides = contact.waterEdgeSides ?? [];
1620:  if (edgeSides.length === 0 && waterEdgeSides.length === 0) return;
1623:  const height = TILE_HEIGHT + 1;
1628:      const seam = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.08);
1631:    graphic.stroke({ color: shadeColor(color, -52), alpha: style.seamAlpha, width: 1.15, cap: "round", join: "round" });
1637:        const lip = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.2);
1640:      graphic.stroke({ color: shadeColor(color, 34), alpha: style.lipAlpha, width: 1, cap: "round", join: "round" });
1644:  if (waterEdgeSides.length > 0 && style.strandAlpha > 0) {
1648:    for (const side of waterEdgeSides) {
1649:      const edge = tileEdgeSegment(point, width, height, side);
1653:        .fill({ color: 0xead7a6, alpha: style.strandAlpha * 0.68 });
1655:    for (const side of waterEdgeSides) {
1656:      const strand = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.1);
1659:    graphic.stroke({ color: 0xf1dfae, alpha: style.strandAlpha, width: 1.65, cap: "round", join: "round" });
1660:    for (const side of waterEdgeSides) {
1661:      const wet = insetEdgeSegment(point, tileEdgeSegment(point, width, height, side), 0.22);
1664:    graphic.stroke({ color: 0x185f85, alpha: style.wetAlpha, width: 1.25, cap: "round", join: "round" });
1668:function drawTerrainChunkMassing(g: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
1669:  const massing = tile.visualGrammar?.terrainChunkMassing ?? "none";
1673:  const config = terrainChunkMassingStyle(massing, color, chunkEdge);
1675:  const height = TILE_HEIGHT * config.heightScale;
1679:    diamondPoints({ x: point.x, y: point.y + depth + 3 }, width * 1.04, height * 1.02),
1681:    config.shadowAlpha,
1691:    .lineTo(point.x, point.y + height * 0.5)
1692:    .lineTo(point.x, point.y + height * 0.5 + depth)
1695:    .fill({ color: massLit, alpha: massAlpha * 0.82 });
1697:    .moveTo(point.x, point.y + height * 0.5)
1700:    .lineTo(point.x, point.y + height * 0.5 + depth)
1702:    .fill({ color: massShade, alpha: massAlpha });
1705:    .lineTo(point.x, point.y + height * 0.5 + depth)
1707:    .stroke({ color: config.rimColor, alpha: config.rimAlpha, width: config.rimWidth, cap: "round", join: "round" });
1712:      .lineTo(point.x - width * 0.08, point.y + height * 0.18 + depth * 0.58)
1715:      .lineTo(point.x, point.y + height * 0.28 + depth * 0.92)
1717:      .stroke({ color: config.strataColor, alpha: config.strataAlpha, width: 1.05, cap: "round", join: "round" });
1721:function terrainChunkMassingStyle(
1722:  massing: NonNullable<CityWorldTerrainTile["visualGrammar"]>["terrainChunkMassing"],
1723:  color: number,
1731:      heightScale: structuralEdge ? 1.13 : 1.07,
1735:      shadowAlpha: structuralEdge ? 0.065 : 0.035,
1747:      heightScale: structuralEdge ? 1.14 : 1.08,
1751:      shadowAlpha: structuralEdge ? 0.1 : 0.065,
1763:      heightScale: structuralEdge ? 1.09 : 1.02,
1764:      leftColor: shadeColor(color, -42),
1765:      rightColor: shadeColor(color, -30),
1767:      shadowAlpha: structuralEdge ? 0.055 : 0.026,
1779:      heightScale: structuralEdge ? 1.1 : 1.03,
1783:      shadowAlpha: structuralEdge ? 0.07 : 0.034,
1795:      heightScale: structuralEdge ? 1.08 : 1.02,
1799:      shadowAlpha: structuralEdge ? 0.052 : 0.022,
1807:  if (massing === "waterfront_bank_cut_mass") {
1811:      heightScale: structuralEdge ? 1.12 : 1.06,
1815:      shadowAlpha: structuralEdge ? 0.11 : 0.065,
1827:      heightScale: 1.02,
1828:      leftColor: shadeColor(color, -30),
1829:      rightColor: shadeColor(color, -22),
1831:      shadowAlpha: 0.035,
1842:    heightScale: 1.04,
1846:    shadowAlpha: 0.045,
1855:function drawTerrainElevationEdges(g: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
1856:  const elevation = tile.visualGrammar?.terrainElevation;
1861:  const cut = elevation === "water_edge_cut";
1864:  const sideColor = cut ? sunlitColor(0x155c80, "shade") : sunlitColor(shadeColor(color, basin ? -8 : -12), "shade");
1876:      .fill({ color: sideColor, alpha: faceAlpha });
1884:      .stroke({ color: cut ? 0xcdf5ff : 0xf3dfb2, alpha: cut ? 0.22 : 0.12, width: 1, cap: "round", join: "round" });
1895:      .fill({ color: patch, alpha: 0.1 });
1903:      .stroke({ color: 0xd9edaf, alpha: 0.09, width: 1, cap: "round", join: "round" });
1909:      .fill({ color: shadeColor(TERRAIN_COLORS.grass, -18), alpha: 0.08 });
1914:  const composition = tile.visualGrammar?.terrainComposition;
1915:  const profile = tile.visualGrammar?.terrainProfile;
1921:  const waterfront = composition === "waterfront_edge_strata";
1927:  const shadowColor = civic || commercial ? 0x7c765f : 0x587f4d;
1950:      .fill({ color: parcelColor, alpha: (civic ? 0.105 : commercial ? 0.09 : draft ? 0.07 : 0.075) * quietScale });
1958:      .stroke({ color: seamColor, alpha: (civic || commercial ? 0.18 : 0.12) * quietScale, width: 1, cap: "round", join: "round" });
1965:      .stroke({ color: shadowColor, alpha: 0.08, width: 1.2, cap: "round" });
1973:      .stroke({ color: 0xf0dba8, alpha: 0.16, width: 1.6, cap: "round", join: "round" });
1976:  if (waterfront && hash % 4 === 0) {
1981:          .stroke({ color: 0xd7f8ff, alpha: 0.26, width: 1.45, cap: "round", join: "round" });
1985:function drawTerrainElevationChunkFace(graphic: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
1986:  const elevation = tile.visualGrammar?.terrainElevation;
1990:  const depth = terrainElevationDepth(elevation, chunkEdge);
1992:  // lower-right face is in shade, so terrain steps read as real height.
1993:  const leftShade = sunlitColor(shadeColor(color, elevation === "water_edge_cut" ? -16 : -8), "sun");
1994:  const rightShade = sunlitColor(color, "shade");
1998:      : elevation === "water_edge_cut"
2019:      .fill({ color: leftShade, alpha: faceAlpha * 0.8 });
2034:      .fill({ color: rightShade, alpha: faceAlpha });
2039:      chunkEdge === "waterfront_bank_edge"
2046:    const edgeAlpha = chunkEdge === "waterfront_bank_edge" ? 0.24 : chunkEdge === "world_edge" ? 0.1 : chunkEdge === "parcel_cluster_edge" ? 0.13 : 0.18;
2051:      .stroke({ color: edgeColor, alpha: edgeAlpha, width: chunkEdge === "waterfront_bank_edge" ? 1.4 : 1, cap: "round", join: "round" });
2055:function terrainElevationDepth(elevation: NonNullable<CityWorldTerrainTile["visualGrammar"]>["terrainElevation"], chunkEdge: NonNullable<CityWorldTerrainTile["visualGrammar"]>["chunkEdge"]) {
2060:  if (elevation === "water_edge_cut") return 7.4;
2071:      .fill({ color: 0xc7cf8d, alpha: 0.06 });
2081:      .stroke({ color: 0xf2dfb4, alpha: 0.18, width: 1, cap: "round", join: "round" });
2085:    graphic.circle(point.x + 4, point.y - 1, 1.6).fill({ color: 0xdde6aa, alpha: 0.16 });
2097:      .stroke({ color: 0xf1ead2, alpha: 0.15, width: 1, cap: "round", join: "round" });
2103:      .fill({ color: 0xd5dcc1, alpha: 0.11 });
2110:// N's shadow can no longer smear over segment N-1's finished surface, because
2111:// ALL shadows draw under ALL surfaces.
2113:  shadow: Graphics;
2128:    shadow: new Graphics(),
2155:    passes.shadow,
2169:// Dead-end streets stop looking sheared: a rounded curb stub + surface disk
2176:  g.ellipse(point.x, point.y + 1, radius, radius * 0.52).fill({ color: 0xd6c996, alpha: 0.72 });
2177:  g.ellipse(point.x, point.y, radius * 0.78, radius * 0.4).fill({ color: 0x58635f, alpha: 0.95 });
2178:  g.ellipse(point.x, point.y - 1, radius * 0.6, radius * 0.3).fill({ color: 0x68736d, alpha: 0.7 });
2190:  passes.shadow
2193:    .stroke({ color: 0x263a34, alpha: shellRoad ? 0.18 : draftRoad ? 0.2 : 0.16, width: baseWidth + (draftRoad || shellRoad ? 15 : 13), cap, join: "round" });
2198:      color: shellRoad ? (apron ? 0x8d8c7d : 0x59615d) : draftRoad ? (apron ? 0x8b846d : 0x4d554d) : apron ? 0x7c806f : 0x46514c,
2209:      color: shellRoad ? (apron ? 0xc9c0a4 : 0xd4ceb2) : draftRoad ? (apron ? 0xc4b182 : 0xd8c28b) : apron ? 0xc1ae88 : 0xd6c996,
2219:      color: shellRoad ? (apron ? 0x8f9185 : 0x646c67) : draftRoad ? (apron ? 0x8e8c7d : 0x555e58) : apron ? 0x858b7e : 0x58635f,
2229:      color: shellRoad ? (apron ? 0xaaa58e : 0x7c8278) : draftRoad ? (apron ? 0xa09c87 : 0x697069) : apron ? 0x969b8b : 0x68736d,
2243:  } else if (contact.laneMarking === "street_dash") {
2266:    .stroke({ color: 0xf1ead2, alpha: 0.16, width: 1.2, cap: "butt" });
2278:  if (ribCount > 0) g.stroke({ color: 0x3f4945, alpha: 0.1, width: 1, cap: "round" });
2303:  if (gritCount > 0) g.stroke({ color: 0x3e4944, alpha: apron ? 0.08 : 0.12, width: 1.1, cap: "round" });
2310:    .stroke({ color: 0xf1ddad, alpha: 0.18, width: 1.3, cap: "butt" });
2331:    .stroke({ color: 0x253b35, alpha: apron ? 0.08 : 0.12, width: Math.max(2, roadWidth * 0.08), cap: "butt" });
2338:    .stroke({ color: apron ? 0xf1ddb2 : 0xe8d49f, alpha: apron ? 0.12 : 0.16, width: 1.2, cap: "butt" });
2350:  if (wearCount > 0) g.stroke({ color: 0x3f4d47, alpha: apron ? 0.055 : 0.075, width: 1.05, cap: "round" });
2361:    .stroke({ color: 0x263a34, alpha: draftRoad ? 0.16 : 0.12, width: baseWidth + 8, cap: "butt", join: "round" });
2365:    .stroke({ color: draftRoad ? 0xe3d2ad : 0xeadfc7, alpha: draftRoad ? 0.78 : 0.86, width: baseWidth + 4, cap: "butt", join: "round" });
2369:    .stroke({ color: draftRoad ? 0xf0e4c6 : 0xf8f0df, alpha: draftRoad ? 0.72 : 0.84, width: Math.max(3, baseWidth - 1), cap: "butt", join: "round" });
2391:  g.stroke({ color: 0xffffff, alpha: 0.62, width: 2.2, cap: "butt" });
2408:    .stroke({ color: driveway ? 0xd9d0ae : 0x87928a, alpha: driveway ? 0.2 : 0.24, width: 1.1, cap: "butt" });
2434:  if (seamCount > 0) g.stroke({ color: driveway ? 0xd9d0ae : 0x9aa49b, alpha: driveway ? 0.08 : 0.1, width: 1, cap: "butt" });
2443:  color: number,
2466:  if (dashCount > 0) g.stroke({ color, alpha, width, cap: "round" });
2511:  const height = drivewayOnly ? radius * 0.88 : radius * 1.02;
2512:  appendPolygon(g, diamondPoints({ x: point.x, y: point.y + 5 }, width * 1.05, height * 1.08), 0x263a34, drivewayOnly ? 0.1 : draftJoint ? 0.18 : 0.15, 0x263a34, 0);
2513:  appendPolygon(g, diamondPoints({ x: point.x, y: point.y + 2 }, width, height), drivewayOnly ? 0xc1ae88 : draftJoint ? 0xd5bf88 : 0xd6c996, drivewayOnly ? 0.62 : draftJoint ? 0.8 : 0.8, 0x6d684f, 0.18);
2514:  appendPolygon(g, diamondPoints(point, width * 0.8, height * 0.7), drivewayOnly ? 0x858b7e : draftJoint ? 0x59635c : 0x5d6862, drivewayOnly ? 0.78 : 0.96, 0x3f4b46, 0.1);
2515:  appendPolygon(g, diamondPoints({ x: point.x, y: point.y - 1 }, width * 0.58, height * 0.46), drivewayOnly ? 0x969b8b : draftJoint ? 0x71796f : 0x6b7670, drivewayOnly ? 0.34 : draftJoint ? 0.42 : 0.46, 0xffffff, 0);
2516:  drawRoadJointBlockwork(g, point, width, height, drivewayOnly, draftJoint);
2520:    appendPolygon(g, diamondPoints({ x: point.x, y: point.y - 2 }, width * 0.34, height * 0.25), draftJoint ? 0x858b7f : 0x818b83, draftJoint ? 0.22 : 0.26, 0xffffff, 0);
2524:function drawRoadJointBlockwork(g: Graphics, point: ProjectedPoint, width: number, height: number, drivewayOnly: boolean, draftJoint: boolean) {
2528:    .moveTo(point.x - width * 0.36, point.y + height * 0.08)
2529:    .lineTo(point.x - width * 0.12, point.y + height * 0.22)
2530:    .lineTo(point.x + width * 0.12, point.y + height * 0.1)
2531:    .moveTo(point.x + width * 0.36, point.y + height * 0.08)
2532:    .lineTo(point.x + width * 0.12, point.y + height * 0.22)
2533:    .lineTo(point.x - width * 0.12, point.y + height * 0.1)
2534:    .stroke({ color: 0xe6d09a, alpha: edgeAlpha, width: 1.15, cap: "round", join: "round" });
2537:    .moveTo(point.x - width * 0.14, point.y - height * 0.06)
2538:    .lineTo(point.x + width * 0.12, point.y + height * 0.08)
2539:    .moveTo(point.x + width * 0.15, point.y - height * 0.04)
2540:    .lineTo(point.x - width * 0.1, point.y + height * 0.1)
2541:    .stroke({ color: 0xf5e5bb, alpha: centerAlpha, width: 1, cap: "round", join: "round" });
2561:      .stroke({ color: 0xd8c79d, alpha: 0.28, width: 7, cap: "butt" });
2565:      .stroke({ color: 0x737c74, alpha: 0.34, width: 3.5, cap: "butt" });
2626:  const height = lot.depth * TILE_HEIGHT;
2632:  const color = shellLot ? SHELL_LOT_COLORS[lot.kind] : draftLot ? DRAFT_LOT_COLORS[lot.kind] : LOT_COLORS[lot.kind];
2636:  const lotContactProfile = lot.visualGrammar?.contactProfile ?? "parcel_pad_shadow";
2645:    : lotContactProfile === "landmark_base_shadow"
2647:      : lotContactProfile === "soft_ground_shadow"
2652:  const contactSpread = lotContactProfile === "landmark_base_shadow" ? 1.1 : lotContactProfile === "soft_ground_shadow" ? 1.12 : 1.04;
2653:  // Waterfront lots have real water terrain beneath them; a lot slab on top
2657:  appendPolygon(g, diamondPoints({ x: point.x, y: point.y + 6 }, width * contactSpread, height * (contactSpread + 0.04)), 0x23342e, contactAlpha, 0x23342e, 0);
2658:  if (!mutedLot && lotContactProfile === "landmark_base_shadow") {
2659:    appendPolygon(g, diamondPoints({ x: point.x, y: point.y + 8 }, width * 0.86, height * 0.8), 0x1d2a24, 0.09, 0x1d2a24, 0);
2661:  appendPolygon(g, diamondPoints(point, width, height), color, lotAlpha, shellLot ? 0x747965 : draftLot ? 0x7f6d4e : 0x28473f, shellLot ? 0.16 : draftLot ? 0.14 : quietPad ? 0.1 : 0.18);
2664:    .lineTo(point.x, point.y + height * 0.5)
2667:    .lineTo(point.x, point.y + height * 0.5 + 6)
2670:    .fill({ color: shadeColor(color, -28), alpha: shellLot ? 0.24 : draftLot ? 0.3 : quietPad ? 0.18 : 0.24 });
2671:  appendPolygon(g, diamondPoints(point, width * 0.88, height * 0.82), shadeColor(color, mutedLot ? 7 : 10), shellLot ? 0.14 : draftLot ? 0.13 : quietPad ? 0.09 : 0.12, 0xffffff, 0);
2672:  drawParcelElevationShelf(g, point, width, height, lot, color, mutedLot);
2673:  drawLotWorldComposition(g, point, width, height, lot, color, mutedLot);
2674:  drawLotEdgeBlockwork(g, point, width, height, lotContact, mutedLot);
2675:  drawParcelEdgeTicks(g, point, width, height, lotContact);
2676:  drawParcelCompositionDetails(g, point, width, height, lot);
2677:  drawLotCurbCut(g, lotContact, point, width, height);
2678:  if (draftLot) drawDraftLotMaterial(g, point, width, height, lot.kind);
2679:  if (shellLot) drawShellLotMaterial(g, point, width, height, lot.kind);
2687:      .moveTo(point.x - width * 0.28, point.y - height * 0.08)
2688:      .lineTo(point.x - width * 0.05, point.y + height * 0.12)
2689:      .lineTo(point.x + width * 0.25, point.y - height * 0.02)
2690:      .stroke({ color: 0xf1d9a5, alpha: 0.72, width: 5, cap: "round", join: "round" });
2691:    appendPolygon(g, diamondPoints({ x: point.x + width * 0.14, y: point.y + height * 0.16 }, 34, 18), 0xc3d989, 0.72, 0x5b8b52, 0.28);
2693:    drawHomeLotDetails(g, point, width, height, color);
2695:    drawForecourtPad(g, point, width, height, color, lot.kind === "civic");
2696:    if (lot.kind === "civic") drawCivicLotComposition(g, point, width, height, color);
2699:        .moveTo(point.x + i * 24 - width * 0.25, point.y + height * 0.16)
2700:        .lineTo(point.x + i * 24 + width * 0.04, point.y - height * 0.08);
2702:    g.stroke({ color: 0xf4e8c7, alpha: 0.2, width: 1 });
2704:    drawForecourtPad(g, point, width, height, color, false);
2705:  } else if (lot.kind === "waterfront") {
2707:      .moveTo(point.x - width * 0.38, point.y - height * 0.08)
2708:      .lineTo(point.x - width * 0.02, point.y + height * 0.12)
2709:      .lineTo(point.x + width * 0.34, point.y - height * 0.04)
2710:      .stroke({ color: 0xe9fbff, alpha: 0.42, width: 3, cap: "round", join: "round" });
2714:function drawShellLotMaterial(g: Graphics, point: ProjectedPoint, width: number, height: number, kind: CityWorldLot["kind"]) {
2715:  if (kind === "park" || kind === "waterfront") return;
2719:    diamondPoints({ x: point.x + width * 0.08, y: point.y - height * 0.08 }, width * 0.3, height * 0.18),
2726:    .moveTo(point.x - width * 0.4, point.y + height * 0.1)
2727:    .lineTo(point.x - width * 0.16, point.y + height * 0.23)
2728:    .lineTo(point.x + width * 0.08, point.y + height * 0.1)
2729:    .moveTo(point.x + width * 0.4, point.y + height * 0.08)
2730:    .lineTo(point.x + width * 0.16, point.y + height * 0.22)
2731:    .lineTo(point.x - width * 0.06, point.y + height * 0.1)
2732:    .stroke({ color: 0x6f7565, alpha: kind === "civic" ? 0.22 : 0.18, width: 1.15, cap: "round", join: "round" });
2735:function drawLotWorldComposition(g: Graphics, point: ProjectedPoint, width: number, height: number, lot: CityWorldLot, color: number, draftLot: boolean) {
2736:  if (draftLot || lot.kind === "park" || lot.kind === "waterfront") return;
2745:      diamondPoints({ x: point.x + yardSide * width * 0.18, y: point.y - height * 0.08 }, width * 0.22, height * 0.22),
2746:      shadeColor(color, variant === 3 ? -8 : 12),
2753:      diamondPoints({ x: point.x - yardSide * width * 0.16, y: point.y + height * 0.27 }, width * 0.34, height * 0.13),
2754:      shadeColor(color, 18),
2760:      .moveTo(point.x - width * 0.42, point.y - height * 0.08)
2761:      .lineTo(point.x - width * 0.12, point.y + height * 0.08)
2762:      .lineTo(point.x + width * 0.2, point.y - height * 0.06)
2763:      .moveTo(point.x + width * 0.42, point.y + height * 0.06)
2764:      .lineTo(point.x + width * 0.12, point.y + height * 0.22)
2765:      .lineTo(point.x - width * 0.1, point.y + height * 0.1)
2766:      .stroke({ color: 0x557a4e, alpha: 0.16, width: 1.1, cap: "round", join: "round" });
2768:      .moveTo(point.x - yardSide * width * 0.02, point.y + height * 0.08)
2769:      .lineTo(point.x - yardSide * width * 0.2, point.y + height * 0.42)
2770:      .stroke({ color: 0xf1ddad, alpha: 0.26, width: Math.max(1.6, width * 0.026), cap: "round" });
2777:      diamondPoints({ x: point.x, y: point.y + height * 0.34 }, width * 0.38, height * 0.16),
2784:      .moveTo(point.x - width * 0.46, point.y + height * 0.1)
2785:      .lineTo(point.x - width * 0.2, point.y + height * 0.24)
2786:      .lineTo(point.x + width * 0.08, point.y + height * 0.12)
2787:      .moveTo(point.x + width * 0.46, point.y + height * 0.08)
2788:      .lineTo(point.x + width * 0.2, point.y + height * 0.23)
2789:      .lineTo(point.x - width * 0.08, point.y + height * 0.11)
2790:      .moveTo(point.x - width * 0.22, point.y - height * 0.18)
2791:      .lineTo(point.x + width * 0.18, point.y + height * 0.02)
2792:      .stroke({ color: 0xf8eac7, alpha: 0.24, width: 1.45, cap: "round", join: "round" });
2799:      diamondPoints({ x: point.x, y: point.y + height * 0.36 }, width * 0.72, height * 0.16),
2809:        .moveTo(point.x + offset - width * 0.04, point.y + height * 0.24)
2810:        .lineTo(point.x + offset + width * 0.06, point.y + height * 0.31);
2812:    g.stroke({ color: 0xf6e8c8, alpha: 0.16, width: 1, cap: "round" });
2816:function drawParcelElevationShelf(g: Graphics, point: ProjectedPoint, width: number, height: number, lot: CityWorldLot, color: number, draftLot: boolean) {
2827:          : elevation === "waterfront_bank_cut"
2837:    .lineTo(point.x, point.y + height * 0.5)
2838:    .lineTo(point.x, point.y + height * 0.5 + depth)
2841:    .fill({ color: sunlitColor(shadeColor(color, -8), "sun"), alpha: alpha * 0.8 });
2843:    .moveTo(point.x, point.y + height * 0.5)
2846:    .lineTo(point.x, point.y + height * 0.5 + depth)
2848:    .fill({ color: sunlitColor(color, "shade"), alpha });
2851:    .lineTo(point.x, point.y + height * 0.5 + depth * 0.75)
2853:    .stroke({ color: elevation === "waterfront_bank_cut" ? 0xe9fbff : 0xf1dfb7, alpha: elevation === "waterfront_bank_cut" ? 0.2 : 0.14, width: 1.2, cap: "round", join: "round" });
2857:      .moveTo(point.x - width * 0.34, point.y + height * 0.2)
2858:      .lineTo(point.x, point.y + height * 0.38)
2859:      .lineTo(point.x + width * 0.34, point.y + height * 0.2)
2860:      .moveTo(point.x - width * 0.24, point.y + height * 0.28)
2861:      .lineTo(point.x, point.y + height * 0.42)
2862:      .lineTo(point.x + width * 0.24, point.y + height * 0.28)
2863:      .stroke({ color: 0x8b7954, alpha: 0.22, width: 1.15, cap: "round", join: "round" });
2867:function drawLotEdgeBlockwork(g: Graphics, point: ProjectedPoint, width: number, height: number, lotContact: CityWorldLotContactGrammar, draftLot: boolean) {
2874:    .moveTo(point.x - width * 0.46, point.y + height * 0.02)
2875:    .lineTo(point.x - width * 0.18, point.y + height * 0.18)
2876:    .lineTo(point.x + width * 0.08, point.y + height * 0.05)
2877:    .moveTo(point.x + width * 0.46, point.y + height * 0.02)
2878:    .lineTo(point.x + width * 0.18, point.y + height * 0.18)
2879:    .lineTo(point.x - width * 0.08, point.y + height * 0.05)
2880:    .stroke({ color: edgeColor, alpha, width: quiet ? 1 : 1.2, cap: "round", join: "round" });
2887:      .moveTo(x - width * 0.035, point.y + height * 0.26)
2888:      .lineTo(x + width * 0.025, point.y + height * 0.3);
2890:  g.stroke({ color: 0x7f6d4e, alpha: draftLot ? 0.14 : quiet ? 0.08 : 0.12, width: 0.9, cap: "round" });
2895:// look served by its street instead of floating beside it.
2896:function drawLotCurbCut(g: Graphics, lotContact: CityWorldLotContactGrammar, point: ProjectedPoint, width: number, height: number) {
2902:  const edgePoint = lotCurbPoint(point, width, height, lotContact.curbCutEdge);
2904:  const apronHeight = Math.max(quiet ? 5 : 8, height * (quiet ? 0.08 : 0.12));
2916:      .moveTo(point.x, point.y + height * 0.06)
2918:      .stroke({ color: LOT_CURB_CUT_STYLE.walk, alpha: draft ? 0.14 : quiet ? 0.28 : 0.34, width: quiet ? 1.8 : 2.6, cap: "round" });
2922:function drawDraftLotMaterial(g: Graphics, point: ProjectedPoint, width: number, height: number, kind: CityWorldLot["kind"]) {
2923:  if (kind === "park" || kind === "waterfront") return;
2927:    diamondPoints({ x: point.x + width * 0.12, y: point.y - height * 0.08 }, width * 0.32, height * 0.2),
2934:    .moveTo(point.x - width * 0.44, point.y + height * 0.08)
2935:    .lineTo(point.x - width * 0.18, point.y + height * 0.23)
2936:    .lineTo(point.x + width * 0.06, point.y + height * 0.12)
2937:    .moveTo(point.x + width * 0.44, point.y + height * 0.06)
2938:    .lineTo(point.x + width * 0.18, point.y + height * 0.22)
2939:    .lineTo(point.x - width * 0.04, point.y + height * 0.1)
2940:    .stroke({ color: 0x8b7954, alpha: kind === "civic" ? 0.26 : 0.2, width: 1.25, cap: "round", join: "round" });
2943:function drawParcelEdgeTicks(g: Graphics, point: ProjectedPoint, width: number, height: number, lotContact: CityWorldLotContactGrammar) {
2947:  const color = lotContact.profile === "foundation" ? 0xf2e4b8 : 0xf4e8c7;
2950:  const topY = point.y - height * 0.5;
2951:  const bottomY = point.y + height * 0.5;
2954:    .moveTo(leftX + width * 0.16, point.y + height * 0.16)
2955:    .lineTo(leftX + width * 0.28, point.y + height * 0.28)
2956:    .moveTo(rightX - width * 0.16, point.y + height * 0.16)
2957:    .lineTo(rightX - width * 0.28, point.y + height * 0.28)
2958:    .moveTo(point.x - width * 0.16, topY + height * 0.16)
2959:    .lineTo(point.x - width * 0.28, topY + height * 0.28)
2960:    .moveTo(point.x + width * 0.16, bottomY - height * 0.16)
2961:    .lineTo(point.x + width * 0.28, bottomY - height * 0.28)
2962:    .stroke({ color, alpha, width: 1, cap: "round" });
2965:function drawParcelCompositionDetails(g: Graphics, point: ProjectedPoint, width: number, height: number, lot: CityWorldLot) {
2971:      .moveTo(point.x - width * 0.42, point.y - height * 0.03)
2972:      .lineTo(point.x - width * 0.13, point.y + height * 0.13)
2973:      .lineTo(point.x + width * 0.12, point.y + height * 0.02)
2974:      .moveTo(point.x + width * 0.42, point.y - height * 0.02)
2975:      .lineTo(point.x + width * 0.13, point.y + height * 0.13)
2976:      .lineTo(point.x - width * 0.12, point.y + height * 0.02)
2977:      .moveTo(point.x - width * 0.18, point.y - height * 0.22)
2978:      .lineTo(point.x + width * 0.14, point.y - height * 0.04)
2979:      .stroke({ color: 0xdbe8ab, alpha: 0.12, width: 1.1, cap: "round", join: "round" });
2986:        .moveTo(point.x + lane * width * 0.08 - width * 0.18, point.y + height * 0.22)
2987:        .lineTo(point.x + lane * width * 0.08 + width * 0.1, point.y + height * 0.06);
2990:      .moveTo(point.x - width * 0.36, point.y + height * 0.3)
2991:      .lineTo(point.x, point.y + height * 0.46)
2992:      .lineTo(point.x + width * 0.36, point.y + height * 0.3)
2993:      .stroke({ color: 0xffe9bf, alpha: 0.18, width: 1.15, cap: "round", join: "round" });
2998:    appendPolygon(g, diamondPoints({ x: point.x, y: point.y + height * 0.26 }, width * 0.72, height * 0.2), 0xe7d4aa, 0.18, 0x8b7954, 0.08);
3000:      .moveTo(point.x - width * 0.28, point.y + height * 0.16)
3001:      .lineTo(point.x, point.y + height * 0.32)
3002:      .lineTo(point.x + width * 0.28, point.y + height * 0.16)
3003:      .moveTo(point.x - width * 0.16, point.y + height * 0.24)
3004:      .lineTo(point.x, point.y + height * 0.34)
3005:      .lineTo(point.x + width * 0.16, point.y + height * 0.24)
3006:      .stroke({ color: 0x8b7954, alpha: 0.18, width: 1.2, cap: "round", join: "round" });
3011:    appendPolygon(g, diamondPoints({ x: point.x - width * 0.08, y: point.y + height * 0.03 }, width * 0.46, height * 0.28), 0xd7c59d, 0.14, 0xffffff, 0);
3013:      .moveTo(point.x - width * 0.34, point.y + height * 0.1)
3014:      .lineTo(point.x - width * 0.05, point.y + height * 0.25)
3015:      .lineTo(point.x + width * 0.26, point.y + height * 0.1)
3016:      .moveTo(point.x - width * 0.2, point.y - height * 0.08)
3017:      .lineTo(point.x + width * 0.18, point.y + height * 0.1)
3018:      .stroke({ color: 0xf4e7c3, alpha: 0.18, width: 1, cap: "round", join: "round" });
3024:      .moveTo(point.x - width * 0.32, point.y - height * 0.1)
3025:      .lineTo(point.x - width * 0.08, point.y + height * 0.08)
3026:      .lineTo(point.x + width * 0.28, point.y - height * 0.04)
3027:      .stroke({ color: 0xf1d9a5, alpha: 0.2, width: 2.2, cap: "round", join: "round" });
3031:  if (composition === "waterfront_bank" || composition === "hidden_draft_anchor_pad") {
3034:      .moveTo(point.x - width * 0.42, point.y + height * 0.04)
3035:      .lineTo(point.x - width * 0.12, point.y + height * 0.2)
3036:      .lineTo(point.x + width * 0.2, point.y + height * 0.06)
3037:      .moveTo(point.x + width * 0.42, point.y + height * 0.02)
3038:      .lineTo(point.x + width * 0.14, point.y + height * 0.2)
3039:      .lineTo(point.x - width * 0.14, point.y + height * 0.08)
3040:      .stroke({ color: strataColor, alpha: composition === "hidden_draft_anchor_pad" ? 0.18 : 0.22, width: 1.25, cap: "round", join: "round" });
3044:function drawHomeLotDetails(g: Graphics, point: ProjectedPoint, width: number, height: number, color: number) {
3047:  appendPolygon(g, diamondPoints({ x: point.x + width * padOffset, y: point.y - height * 0.06 }, width * 0.56, height * 0.42), shadeColor(color, 18), 0.17, 0xffffff, 0);
3048:  appendPolygon(g, diamondPoints({ x: point.x - width * (variation === 2 ? 0.02 : 0.13), y: point.y + height * 0.06 }, width * 0.34, height * 0.22), shadeColor(color, -10), 0.12, 0x28473f, 0);
3049:  appendPolygon(g, diamondPoints({ x: point.x + width * 0.19, y: point.y - height * 0.02 }, width * 0.18, height * 0.2), shadeColor(color, 6), 0.1, 0xffffff, 0);
3052:    diamondPoints({ x: point.x + width * (variation === 0 ? -0.18 : 0.18), y: point.y + height * 0.23 }, width * 0.24, height * 0.12),
3053:    shadeColor(color, 10),
3059:    .moveTo(point.x + width * padOffset * 0.6, point.y + height * 0.02)
3060:    .lineTo(point.x + (variation === 1 ? width * 0.14 : 0), point.y + height * 0.38)
3061:    .stroke({ color: 0xf1ddad, alpha: 0.3, width: Math.max(2, width * 0.035), cap: "round" });
3063:    .moveTo(point.x - width * 0.36, point.y - height * 0.02)
3064:    .lineTo(point.x - width * 0.04, point.y + height * 0.16)
3065:    .moveTo(point.x + width * 0.36, point.y - height * 0.02)
3066:    .lineTo(point.x + width * 0.08, point.y + height * 0.16)
3067:    .stroke({ color: 0xf2e4b8, alpha: 0.12, width: 1, cap: "round" });
3069:    .moveTo(point.x - width * 0.43, point.y + height * 0.08)
3070:    .lineTo(point.x - width * 0.2, point.y + height * 0.22)
3071:    .lineTo(point.x - width * 0.02, point.y + height * 0.14)
3072:    .moveTo(point.x + width * 0.43, point.y + height * 0.07)
3073:    .lineTo(point.x + width * 0.2, point.y + height * 0.22)
3074:    .lineTo(point.x + width * 0.02, point.y + height * 0.13)
3075:    .stroke({ color: 0x6f8a59, alpha: 0.14, width: 1.1, cap: "round", join: "round" });
3078:function drawForecourtPad(g: Graphics, point: ProjectedPoint, width: number, height: number, color: number, civic: boolean) {
3081:    diamondPoints({ x: point.x + width * 0.04, y: point.y + height * 0.14 }, width * (civic ? 0.72 : 0.62), height * 0.3),
3082:    shadeColor(color, civic ? 12 : 8),
3088:    .moveTo(point.x - width * 0.27, point.y + height * 0.28)
3089:    .lineTo(point.x, point.y + height * 0.42)
3090:    .lineTo(point.x + width * 0.28, point.y + height * 0.28)
3091:    .stroke({ color: 0xf6e8c8, alpha: civic ? 0.24 : 0.2, width: 1.1, cap: "round", join: "round" });
3094:    appendPolygon(g, diamondPoints({ x: point.x, y: point.y + height * 0.1 }, width * 0.32, height * 0.16), 0xf3dfbd, 0.24, 0x7f6d4e, 0.08);
3096:      .moveTo(point.x - width * 0.16, point.y + height * 0.04)
3097:      .lineTo(point.x, point.y + height * 0.18)
3098:      .lineTo(point.x + width * 0.16, point.y + height * 0.04)
3099:      .moveTo(point.x, point.y + height * 0.18)
3100:      .lineTo(point.x, point.y + height * 0.43)
3101:      .stroke({ color: 0xffefd1, alpha: 0.28, width: 3.2, cap: "round", join: "round" });
3103:      .moveTo(point.x - width * 0.42, point.y + height * 0.04)
3104:      .lineTo(point.x - width * 0.23, point.y + height * 0.15)
3105:      .lineTo(point.x - width * 0.06, point.y + height * 0.06)
3106:      .moveTo(point.x + width * 0.42, point.y + height * 0.04)
3107:      .lineTo(point.x + width * 0.23, point.y + height * 0.15)
3108:      .lineTo(point.x + width * 0.06, point.y + height * 0.06)
3109:      .stroke({ color: 0xf6e8c8, alpha: 0.2, width: 1.4, cap: "round", join: "round" });
3113:function drawCivicLotComposition(g: Graphics, point: ProjectedPoint, width: number, height: number, color: number) {
3114:  // Order preserved from the old child order: plinth shadow under the green/
3118:    diamondPoints({ x: point.x, y: point.y + height * 0.24 }, width * 0.78, height * 0.18),
3126:    diamondPoints({ x: point.x - width * 0.18, y: point.y - height * 0.12 }, width * 0.32, height * 0.2),
3134:    diamondPoints({ x: point.x + width * 0.18, y: point.y - height * 0.1 }, width * 0.34, height * 0.22),
3135:    shadeColor(color, 18),
3143:      .moveTo(point.x + lane * width * 0.08 - width * 0.16, point.y + height * 0.02)
3144:      .lineTo(point.x + lane * width * 0.08 + width * 0.06, point.y + height * 0.14)
3145:      .moveTo(point.x + lane * width * 0.08 - width * 0.06, point.y + height * 0.24)
3146:      .lineTo(point.x + lane * width * 0.08 + width * 0.16, point.y + height * 0.12);
3148:  g.stroke({ color: 0xfff0cf, alpha: 0.18, width: 1, cap: "round", join: "round" });
3151:    .moveTo(point.x - width * 0.3, point.y + height * 0.18)
3152:    .lineTo(point.x, point.y + height * 0.34)
3153:    .lineTo(point.x + width * 0.3, point.y + height * 0.18)
3154:    .moveTo(point.x - width * 0.22, point.y + height * 0.24)
3155:    .lineTo(point.x, point.y + height * 0.36)
3156:    .lineTo(point.x + width * 0.22, point.y + height * 0.24)
3157:    .moveTo(point.x - width * 0.13, point.y + height * 0.3)
3158:    .lineTo(point.x, point.y + height * 0.38)
3159:    .lineTo(point.x + width * 0.13, point.y + height * 0.3)
3160:    .stroke({ color: 0x8b7954, alpha: 0.24, width: 1.2, cap: "round", join: "round" });
3163:    .moveTo(point.x - width * 0.48, point.y + height * 0.03)
3164:    .lineTo(point.x - width * 0.32, point.y + height * 0.14)
3165:    .lineTo(point.x - width * 0.16, point.y + height * 0.06)
3166:    .moveTo(point.x + width * 0.48, point.y + height * 0.02)
3167:    .lineTo(point.x + width * 0.32, point.y + height * 0.14)
3168:    .lineTo(point.x + width * 0.16, point.y + height * 0.06)
3169:    .stroke({ color: 0x7f6d4e, alpha: 0.18, width: 1.2, cap: "round", join: "round" });
3177:  // cast shadow so shadows land ON pads instead of being washed out by them.
3179:  drawBuildingCastShadow(layers.shadowLayer, building);
3186:  // One facade system draws every vector building: opaque walls, a roof, and
3187:  // a wall-plane window/storefront grid. The legacy per-kind + per-family
3189:  // decals) is retired — misregistered decals were the ghost-facade defect.
3195:  const top = project({ x: building.position.x, y: building.position.y, z: (building.position.z ?? 0) + building.height });
3204:    height: building.height * TILE_DEPTH,
3205:    bodyColor: useShellColors ? 0xb9bca2 : useAuthoredDraftColors ? colorToNumber(building.bodyColor ?? asset.palette.colors.base) : paletteColor(asset.palette.colors.base, building.bodyColor),
3206:    roofColor: useShellColors ? 0x9ca58d : useAuthoredDraftColors ? colorToNumber(building.roofColor ?? asset.palette.colors.roof ?? "#8c9b75") : paletteColor(asset.palette.colors.roof, building.roofColor),
3207:    highlightColor: useShellColors ? 0xe4dec6 : useAuthoredDraftColors ? 0xf8e8ca : paletteColor(asset.palette.colors.highlight, "#fff4d8"),
3208:    accentColor: useShellColors ? 0x80928c : useAuthoredDraftColors ? 0x5f8f8a : paletteColor(asset.palette.colors.accent, asset.palette.colors.roof ?? "#ffcf56"),
3209:    trimColor: useShellColors ? 0x5f665b : useAuthoredDraftColors ? 0x5f5547 : paletteColor(asset.palette.colors.trim, "#26332c"),
3248:  drawSpriteBuildingFitDetails(layer, geometry, building);
3270:  // the textured sprite toward its resolved body color so sprite-mode buildings
3274:  // two neighbours read identical — still the resolved palette, never raw color.
3278:    if (warmCool > 0) homeTint = mixColor(homeTint, SUN_WARM_TINT, 0.07);
3279:    else if (warmCool < 0) homeTint = mixColor(homeTint, SUN_COOL_TINT, 0.06);
3295:function drawSpriteBuildingFitDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
3297:  const style = building.facadeStyle ?? building.kind;
3299:  // + contact shadow in drawBuildingFootprint. The extra per-sprite contact
3300:  // diamond, base-shadow stroke, apron, and awning strokes stacked into the
3309:        .fill({ color: 0xf2d8a6, alpha: 0.9 })
3311:        .stroke({ color: trimColor, alpha: 0.3, width: 0.9 });
3317:// 0.53E Hero Silhouette (item A finish) — tiny deterministic roof accents so
3319:// ridge shadow line, and by hash a third get a chimney fleck, a third a front
3323:  const roofShape = building.roofShape ?? "flat";
3324:  if (roofShape !== "gable" && roofShape !== "hip") return;
3325:  const { top, footprintWidth, footprintDepth, roofColor, bodyColor } = geometry;
3330:  ridge.stroke({ color: shadeColor(roofColor, -34), alpha: 0.3, width: 1.1, cap: "round" });
3338:      .fill({ color: sunlitColor(shadeColor(bodyColor, -18), "sun"), alpha: 0.88 })
3340:      .fill({ color: mixColor(shadeColor(roofColor, 34), SUN_WARM_TINT, 0.25), alpha: 0.88 });
3342:  } else if (variant % 3 === 1 && building.facadeStyle !== "cottage") {
3348:      .fill({ color: sunlitColor(bodyColor, "sun"), alpha: 0.82 })
3350:      .fill({ color: buildingFaceColor(roofColor, "top"), alpha: 0.88 }); // 0.68H — pigmented top curve
3356:// at the facade base plus a short walk stub toward the street, mirrored with
3360:  if (building.facadeStyle === "rowhome") return;
3366:    .fill({ color: 0xf2d8a6, alpha: 0.58 })
3367:    .stroke({ color: trimColor, alpha: 0.16, width: 0.8 });
3371:  walk.stroke({ color: 0xe8d0a3, alpha: 0.46, width: 2, cap: "round" });
3378:  const { bottom, footprintWidth, footprintDepth, trimColor, roofColor } = geometry;
3389:  base.stroke({ color: shadeColor(trimColor, family === "commerce_strip" ? 12 : -6), alpha: 0.34, width: 1.9, cap: "round", join: "round" });
3398:  baseStrata.stroke({ color: shadeColor(trimColor, -28), alpha: 0.22, width: 1.2, cap: "round", join: "round" });
3406:      .fill({ color: shadeColor(roofColor, 28), alpha: family === "commerce_strip" ? 0.34 : 0.22 });
3411:function drawObjectAuthorshipDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
3440:// facade rhythm for this exact population (both run only on civic_landmark
3443:// retired. The silhouette fn keeps the non-hero roof crown.
3445:  const { top, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
3446:  const roofCrown = polygon(
3448:    shadeColor(roofColor, 22),
3453:  if (!hasHeroTieredCrown(building)) layer.addChild(roofCrown);
3479:  stairCuts.stroke({ color: shadeColor(trimColor, -20), alpha: 0.28, width: 1.5, cap: "round", join: "round" });
3484:  // 0.55E — the hero's tiered crown owns its roof; this generation's floating
3487:  const { top, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
3490:    shadeColor(roofColor, 30),
3497:    shadeColor(roofColor, -12),
3510:  shoulderLines.stroke({ color: shadeColor(roofColor, -42), alpha: 0.26, width: 1.5, cap: "round", join: "round" });
3514:// 0.55E — wingRhythm retired: the object-kit read's entry bays own the facade
3521:    .fill({ color: 0xb7dceb, alpha: 0.38 })
3522:    .stroke({ color: trimColor, alpha: 0.12, width: 0.9 });
3527:  entryAxis.stroke({ color: 0xfff1cc, alpha: 0.42, width: 2, cap: "round", join: "round" });
3532:  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
3534:  // drawTieredMassing is the hero's roof signature now.
3541:  civicAxis.stroke({ color: 0xe9f8ff, alpha: 0.28, width: 1.8, cap: "round", join: "round" });
3546:  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, trimColor } = geometry;
3547:  const style = building.facadeStyle ?? "suburban";
3556:  // 0.55E decal discipline — porch pad retired (drawHomeDetails porches +
3557:  // drawHomeStoop own entries) and the white windowRhythm bars retired
3558:  // (material-band sills + style windows own the window read). The fn keeps
3559:  // its unique jobs: the side-wing massing and the dark roof-break stroke.
3560:  const roofBreak = new Graphics()
3564:  roofBreak.stroke({ color: shadeColor(roofColor, -34), alpha: style === "rowhome" ? 0.18 : 0.32, width: style === "ranch" ? 2.5 : 2, cap: "round", join: "round" });
3565:  layer.addChild(sideWing, roofBreak);
3569:  const { top, bottom, footprintWidth, footprintDepth, roofColor, accentColor, trimColor } = geometry;
3570:  const bayCount = building.facadeStyle === "strip_store" ? 4 : 3;
3576:  awningUnderside.stroke({ color: shadeColor(roofColor, -46), alpha: 0.32, width: 2.2, cap: "round", join: "round" });
3583:      .fill({ color: bay % 2 === 0 ? accentColor : shadeColor(roofColor, 24), alpha: 0.34 });
3585:  bayCaps.stroke({ color: trimColor, alpha: 0.1, width: 0.7 });
3590:  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
3598:  const roofInset = polygon(
3600:    shadeColor(roofColor, 20),
3609:      .fill({ color: highlightColor, alpha: 0.36 })
3611:      .fill({ color: shadeColor(highlightColor, -8), alpha: 0.3 });
3613:  layer.addChild(sideCore, roofInset, stackedWindows);
3617:  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
3625:  // 0.57E parity — the zigzag's outer peaks sit where the roof diamond has
3627:  // profile never bleeds past the roof edge on generated footprints.
3638:  sawtooth.stroke({ color: shadeColor(roofColor, -42), alpha: 0.34, width: 2, cap: "round", join: "round" });
3643:      .fill({ color: highlightColor, alpha: bay === 0 ? 0.38 : 0.26 });
3645:  serviceWindows.stroke({ color: trimColor, alpha: 0.12, width: 0.7 });
3649:// 0.55E decal discipline — this generation's threshold pad (drawHomeDetails
3652:// sills + style windows own the window rhythm) are retired. The fn keeps its
3655:  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor } = geometry;
3656:  const style = building.facadeStyle ?? "suburban";
3657:  const roofEave = new Graphics()
3661:  roofEave.stroke({ color: shadeColor(roofColor, -42), alpha: style === "rowhome" ? 0.18 : 0.28, width: 2.4, cap: "round", join: "round" });
3671:  wallRibs.stroke({ color: shadeColor(bodyColor, -32), alpha: 0.17, width: 0.9 });
3672:  layer.addChild(roofEave, wallRibs);
3676:  const { top, bottom, footprintWidth, footprintDepth, roofColor } = geometry;
3683:  parapet.stroke({ color: shadeColor(roofColor, -38), alpha: 0.36, width: 2.4, cap: "round", join: "round" });
3696:  apronJoint.stroke({ color: 0x8f7a54, alpha: 0.24, width: 1.4, cap: "round", join: "round" });
3702:  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor, accentColor } = geometry;
3725:  foundationShadow.stroke({ color: 0x24352f, alpha: isPlazaRowFocus ? 0.3 : 0.24, width: isPlazaRowFocus ? 3.6 : 2.8, cap: "round", join: "round" });
3732:  parapetCap.stroke({ color: shadeColor(roofColor, -44), alpha: 0.44 + parapetWeight * 0.1, width: 2.4 + parapetWeight * 1.4, cap: "round", join: "round" });
3745:      .fill({ color: bay === Math.floor(bayCount / 2) ? 0xb9dfe7 : highlightColor, alpha: 0.6 })
3747:      .stroke({ color: shadeColor(bodyColor, -34), alpha: 0.18, width: 0.9 });
3752:        .fill({ color: bay % 2 === 0 ? accentColor : shadeColor(roofColor, 18), alpha: isPlazaRowFocus ? 0.56 : 0.46 });
3767:      .fill({ color: 0xc9a46f, alpha: isPlazaRowFocus ? 0.38 : 0.24 });
3769:  awningLip.stroke({ color: shadeColor(roofColor, -46), alpha: 0.32, width: 2.1, cap: "round", join: "round" });
3770:  bayPilasters.stroke({ color: shadeColor(trimColor, -18), alpha: isPlazaRowFocus ? 0.28 : 0.18, width: isPlazaRowFocus ? 1.4 : 0.9, cap: "round", join: "round" });
3779:  sideFaceRibs.stroke({ color: shadeColor(trimColor, -20), alpha: 0.2, width: 1.2, cap: "round", join: "round" });
3807:  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
3811:  const facadePierCount = civicGeometry?.facadePierCount ?? 5;
3813:  const roofCapWeight = civicGeometry?.roofCapWeight ?? 0.84;
3823:      .fill({ color: tier === 0 ? 0xd6bb86 : 0xead0a1, alpha: isEastvaleCore ? 0.22 + tier * 0.06 : 0.16 + tier * 0.04 })
3824:      .stroke({ color: 0x756947, alpha: isEastvaleCore ? 0.14 : 0.09, width: 0.9 });
3833:      .fill({ color: isCenter ? 0xd4eff3 : highlightColor, alpha: isCenter ? 0.52 : 0.34 })
3835:      .stroke({ color: trimColor, alpha: isCenter ? 0.16 : 0.09, width: 0.8 });
3838:  const facadePiers = new Graphics();
3839:  for (let pier = 0; pier < facadePierCount; pier += 1) {
3840:    const offset = (pier / Math.max(1, facadePierCount - 1) - 0.5) * footprintWidth * 0.76;
3841:    facadePiers
3845:  facadePiers.stroke({ color: shadeColor(trimColor, -18), alpha: isEastvaleCore ? 0.24 : 0.14, width: isEastvaleCore ? 1.2 : 0.9, cap: "round", join: "round" });
3856:  glassBands.stroke({ color: 0xc9edf2, alpha: isEastvaleCore ? 0.34 : 0.22, width: 1.6, cap: "round", join: "round" });
3868:  // shadow line under its lip, and two slim posts grounding it. Typed off the
3889:    canopyShadow.stroke({ color: 0x1a2c37, alpha: 0.3, width: 2, cap: "round", join: "round" });
3895:    posts.stroke({ color: shadeColor(trimColor, -8), alpha: 0.5, width: 1.4, cap: "round" });
3899:  // the shell pass); the old floating roof-cap decal painted a pale diamond
3902:  const roofCap = isEastvaleCore
3905:        diamondPoints({ x: top.x + footprintWidth * 0.01, y: top.y - footprintDepth * (0.45 + roofCapWeight * 0.04) }, footprintWidth * (0.38 + roofCapWeight * 0.08), footprintDepth * 0.16),
3906:        shadeColor(roofColor, 38),
3912:  layer.addChild(plinthTiers, civicEntryBays, facadePiers, glassBands, canopy);
3913:  if (roofCap) layer.addChild(roofCap);
3918:  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
3924:  const roofMonitorWeight = serviceGeometry?.roofMonitorWeight ?? 0.82;
3941:  foundationLine.stroke({ color: 0x24352f, alpha: isEastvaleGym ? 0.28 : 0.18, width: isEastvaleGym ? 3 : 2.2, cap: "round", join: "round" });
3943:  // 0.57E parity — monitors stay inside the roof diamond: the outer teeth sat
3946:  const roofMonitors = new Graphics();
3956:    roofMonitors
3961:  roofMonitors.stroke({ color: shadeColor(roofColor, -46), alpha: 0.38 + roofMonitorWeight * 0.08, width: 1.7 + roofMonitorWeight * 0.65, cap: "round", join: "round" });
3970:      .fill({ color: isEntry ? highlightColor : shadeColor(bodyColor, -16), alpha: isEntry ? 0.5 : 0.27 })
3972:      .stroke({ color: trimColor, alpha: isEntry ? 0.18 : 0.09, width: 0.8 });
3982:  utilitySideRibs.stroke({ color: shadeColor(trimColor, -22), alpha: isEastvaleGym ? 0.22 : 0.14, width: 1.15, cap: "round", join: "round" });
3984:  layer.addChild(serviceApron, foundationLine, roofMonitors, serviceBays, utilitySideRibs);
3988:// object-kit plinth tiers) and facadeBeats (duplicate facade bar rhythm) are
3989:// retired; the fn keeps the non-hero upper roof cap it uniquely owns.
3991:  const { top, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
3994:    shadeColor(roofColor, 30),
4003:  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
4005:  const roofCourtyard = polygon(diamondPoints({ x: top.x + footprintWidth * 0.14, y: top.y - footprintDepth * 0.02 }, footprintWidth * 0.24, footprintDepth * 0.2), shadeColor(roofColor, 26), 0.28, trimColor, 0.08);
4013:        .fill({ color: row % 2 === 0 ? highlightColor : shadeColor(bodyColor, 24), alpha: 0.48 });
4016:  stacked.stroke({ color: trimColor, alpha: 0.14, width: 0.7 });
4017:  layer.addChild(podium, roofCourtyard, stacked);
4021:  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
4023:  const roofRake = new Graphics()
4028:  roofRake.stroke({ color: shadeColor(roofColor, -38), alpha: 0.35, width: 2, cap: "round" });
4033:      .fill({ color: bay === 0 ? highlightColor : shadeColor(bodyColor, -18), alpha: bay === 0 ? 0.46 : 0.22 });
4035:  serviceBays.stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
4036:  layer.addChild(serviceApron, roofRake, serviceBays);
4041:  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
4057:      .fill({ color: highlightColor, alpha: 0.22 });
4059:  silhouetteRibs.stroke({ color: shadeColor(roofColor, -44), alpha: 0.28, width: 1.2, cap: "round", join: "round" });
4060:  const roofRead = polygon(
4062:    shadeColor(roofColor, 28),
4067:  layer.addChild(anchorHalo, roofRead, silhouetteRibs);
4070:// Directional cast shadow: the building silhouette swept along the sun->ground
4071:// vector (sun upper-left, so shadows skew to the lower-right). Drawn in a
4072:// dedicated layer under all buildings so shadows land on ground and lots.
4075:  const heightPx = Math.min(building.height * TILE_DEPTH, 96) + 16;
4076:  if (heightPx <= 18) return;
4079:  // Anchor a touch toward the shadow side so the sweep emerges past the
4089:    const vx = CAST_SHADOW_VECTOR.x * heightPx * reach;
4090:    const vy = CAST_SHADOW_VECTOR.y * heightPx * reach;
4096:      .fill({ color: CAST_SHADOW_COLOR, alpha });
4100:  // full-height sweep painted half-black sheets across roads and pads.
4101:  const shadow = sweep(0.5, 0.14);
4102:  const vx = CAST_SHADOW_VECTOR.x * heightPx * 0.78;
4103:  const vy = CAST_SHADOW_VECTOR.y * heightPx * 0.78;
4104:  shadow
4109:    .fill({ color: CAST_SHADOW_COLOR, alpha: 0.05 });
4110:  layer.addChild(shadow);
4114:  const { bottom, footprintWidth, footprintDepth, bodyColor, roofColor, trimColor } = geometry;
4116:  const style = building.facadeStyle ?? building.kind;
4122:  const edgeColor = style === "rowhome" || style === "strip_store" ? shadeColor(trimColor, -14) : shadeColor(roofColor, -48);
4125:  // for slab thickness, and one quiet contact shadow. Translucent cream pads
4132:    .fill({ color: 0x23342e, alpha: 0.1 });
4135:    .fill({ color: slabColor })
4136:    .stroke({ color: shadeColor(slabColor, -42), alpha: 0.3, width: 1 });
4145:    .fill({ color: shadeColor(slabColor, -38) })
4146:    .stroke({ color: edgeColor, alpha: 0.2, width: 1 });
4161:  const profile = building.visualGrammar?.contactProfile ?? "parcel_pad_shadow";
4166:  if (profile === "landmark_base_shadow") {
4169:      .fill({ color: 0x1d2a24, alpha: 0.07 + activeBoost * 0.4 + draftBoost * 0.5 });
4172:      .fill({ color: 0x23342e, alpha: 0.18 + activeBoost + draftBoost });
4177:    plinthSeam.stroke({ color: 0x1d2a24, alpha: 0.2, width: 1.7, cap: "round", join: "round" });
4181:  if (profile === "soft_ground_shadow") {
4184:      .fill({ color: 0x23342e, alpha: 0.11 + activeBoost + draftBoost });
4188:  if (profile === "curb_shadow") {
4191:      .fill({ color: 0x23342e, alpha: 0.2 + activeBoost + draftBoost });
4204:    .fill({ color: 0x23342e, alpha: 0.13 + activeBoost + draftBoost });
4208:function drawDraftFoundationMaterial(layer: Container, center: ProjectedPoint, width: number, height: number, color: number) {
4210:    .moveTo(center.x - width * 0.42, center.y + height * 0.18)
4211:    .lineTo(center.x - width * 0.14, center.y + height * 0.33)
4212:    .lineTo(center.x + width * 0.16, center.y + height * 0.18)
4213:    .moveTo(center.x + width * 0.42, center.y + height * 0.18)
4214:    .lineTo(center.x + width * 0.14, center.y + height * 0.33)
4215:    .lineTo(center.x - width * 0.12, center.y + height * 0.2);
4216:  stratum.stroke({ color: shadeColor(color, -48), alpha: 0.2, width: 1.1, cap: "round", join: "round" });
4217:  const contactTile = polygon(diamondPoints({ x: center.x, y: center.y + height * 0.18 }, width * 0.54, height * 0.18), shadeColor(color, 14), 0.14, 0xffffff, 0);
4253:  const floors = Math.max(1, Math.round(building.height));
4254:  if (floors < 2 || geometry.height < 22) return;
4259:      const v = (surface.heightPx / floors) * floor;
4265:  courses.stroke({ color: shadeColor(geometry.bodyColor, -26), alpha: 0.15, width: 1, cap: "butt" });
4274:    if (surface.heightPx < 18 || surface.edgeLengthPx < 18) continue;
4275:    const courseCount = Math.max(2, Math.min(7, Math.floor(surface.heightPx / 9)));
4276:    const courseHeight = surface.heightPx / courseCount;
4281:      const v1 = Math.min(surface.heightPx - 0.7, (course + 1) * courseHeight - 0.7);
4287:        .fill({ color: shadeColor(geometry.bodyColor, delta), alpha: bandAlpha });
4298:        .fill({ color: shadeColor(geometry.bodyColor, delta > 0 ? 16 : -16), alpha: side === "sun" ? 0.1 : 0.12 });
4319:// ---- Wall-plane facade system ----------------------------------------------
4320:// Every window, storefront, and door is authored in wall-plane coordinates:
4322:// shared front corner; v is height in screen pixels. Elements are projected
4331:  heightPx: number;
4341:  const heightPx = Math.max(0, bottom.y - top.y);
4343:  return { groundCorner, groundFront, heightPx, edgeLengthPx };
4380:    if (surface.heightPx < 10 || surface.edgeLengthPx < 12) continue;
4381:    const storefront = commerce && surface.heightPx >= 24;
4393:  const bandTop = Math.min(16, surface.heightPx * 0.34);
4396:    .fill({ color: sunlitColor(shadeColor(bodyColor, -34), side) });
4399:    .fill({ color: side === "sun" ? 0xbcd8de : 0x8fb0bd });
4408:  mullions.stroke({ color: shadeColor(trimColor, -8), alpha: 0.85, width: 1 });
4412:  canopy.stroke({ color: sunlitColor(shadeColor(geometry.roofColor, -8), side), alpha: 0.95, width: 2.2, cap: "butt" });
4416:// Window grid: floors split the wall height, bays split the wall length.
4417:// Each window is a parallelogram in the wall plane — an opaque frame quad
4419:// facades read inhabited without pattern noise.
4430:  const baseV = storefront ? Math.min(16, surface.heightPx * 0.34) + 4 : 4;
4431:  const usableHeight = surface.heightPx - baseV - 4;
4437:  const windowH = Math.min(7.5, floorStep * 0.58);
4445:    const v0 = baseV + floor * floorStep + (floorStep - windowH) * 0.55;
4449:      frames.poly(wallQuadPoints(surface, u0 - 0.012, v0 - 0.8, u1 + 0.012, v0 + windowH + 0.8), true);
4452:      paneTarget.poly(wallQuadPoints(surface, u0, v0, u1, v0 + windowH), true);
4455:  frames.fill({ color: frameColor });
4456:  panes.fill({ color: glassColor });
4457:  litPanes.fill({ color: litColor });
4458:  panes.stroke({ color: shadeColor(trimColor, -6), alpha: 0.4, width: 0.8 });
4463:// lintel shadow on the sun wall near the front corner.
4466:  if (surface.heightPx < 14) return;
4467:  const doorH = Math.min(11, surface.heightPx * 0.5);
4472:    .fill({ color: shadeColor(geometry.trimColor, 14) });
4476:  lintel.stroke({ color: shadeColor(geometry.bodyColor, -44), alpha: 0.8, width: 1.4, cap: "butt" });
4482:// extruded box. A smaller box rises from the roof center with its own lit/shade
4486:// OWNS the roof: the five legacy civic functions that each float their own
4487:// pale cap/lantern/crown decal over the same roof plane must stand down, or
4499:  const tallLowrise = family === "lowrise_cluster" && building.height >= 2.4;
4500:  if ((!isAnchor && !tallLowrise) || building.height < 1.9) return;
4502:  const { top, footprintWidth, footprintDepth, bodyColor, roofColor } = geometry;
4505:  // place marker + label band that sit over the roof's back half. Ordinary
4512:  // the ground anchor, so the crown caps must land in the open window between
4513:  // the label's bottom edge and the roofline — taller just hides the crown
4516:    ? Math.max(18, Math.min(building.height * TILE_DEPTH * 0.52, 30))
4517:    : Math.max(12, Math.min(building.height * TILE_DEPTH * 0.34, 30));
4535:      .fill({ color: buildingFaceColor(bodyColor, "sun"), alpha: 0.98 });
4538:      .fill({ color: buildingFaceColor(bodyColor, "shade"), alpha: 0.98 });
4539:    // Hero caps hold a deeper roof tone so they stay saturated instead of
4541:    const capTone = hero ? buildingFaceColor(shadeColor(roofColor, -12), "top") : buildingFaceColor(roofColor, "top");
4544:    crown.stroke({ color: mixColor(shadeColor(roofColor, 42), SUN_WARM_TINT, 0.2), alpha: 0.85, width: 1.5, cap: "round", join: "round" });
4546:    cornerSeam.stroke({ color: 0x18262e, alpha: 0.22, width: 1.1, cap: "round" });
4580:    .fill({ color: sunlitColor(recess, "sun"), alpha: 0.55 });
4583:    .fill({ color: sunlitColor(recess, "shade"), alpha: 0.6 });
4587:    .fill({ color: glassTone, alpha: civic ? 0.16 : 0.2 });
4592:  canopy.stroke({ color: mixColor(shadeColor(bodyColor, 30), SUN_WARM_TINT, 0.16), alpha: 0.7, width: 1.6, cap: "round", join: "round" });
4600:  const { bottom, top, footprintWidth, footprintDepth, height, bodyColor } = geometry;
4621:      .fill({ color: 0x18262e, alpha });
4623:  const aoTall = Math.max(4, Math.min(height * 0.22, 12));
4627:  cornerSeam.stroke({ color: 0x18262e, alpha: 0.26, width: 1.2, cap: "round" });
4633:    .stroke({ color: 0xfff4d6, alpha: 0.32, width: 1.3, cap: "round" });
4637:  rim.stroke({ color: mixColor(shadeColor(bodyColor, 52), SUN_WARM_TINT, 0.34), alpha: 0.6, width: 1.6, cap: "round" });
4639:  shadeEdge.stroke({ color: 0x1a2c37, alpha: 0.46, width: 1.5, cap: "round" });
4650:  const wallBand = (t: number, color: number, alpha: number, width: number, reach = 1): Graphics => {
4655:    band.stroke({ color, alpha, width, cap: "round", join: "round" });
4684:      .fill({ color: 0x5f7d86, alpha: 0.08 });
4714:    fins.stroke({ color: 0xcfeaf2, alpha: 0.26, width: 1.5, cap: "round" });
4720:  const { top, footprintWidth, footprintDepth, roofColor, outline, activeStrokeAlpha } = geometry;
4721:  const roofShape = building.roofShape ?? "flat";
4724:  // roof color identity instead of riding the rolloff into paper white.
4725:  const roof = polygon(diamondPoints(top, footprintWidth, footprintDepth), buildingFaceColor(roofColor, "top"), 0.99, outline, activeStrokeAlpha);
4726:  layer.addChild(roof);
4728:  // Sun-facing upper-left roof edge catches a warm rim; the lower-right edge
4732:  // 0.53E item D — a whisper directional split across the roof plane itself:
4733:  // the sun-side half lifts warm, the fall-away half cools, so every roof
4736:  const roofLitHalf = new Graphics()
4738:    .fill({ color: 0xfff3d2, alpha: 0.09 });
4739:  const roofShadeHalf = new Graphics()
4741:    .fill({ color: 0x2c4a5e, alpha: 0.13 });
4742:  const roofRim = new Graphics()
4745:  // 0.68H — the sun rim derives from roof pigment instead of near-white.
4746:  roofRim.stroke({ color: mixColor(shadeColor(roofColor, 50), SUN_WARM_TINT, 0.3), alpha: 0.62, width: 1.7, cap: "round", join: "round" });
4747:  const roofFall = new Graphics()
4750:  roofFall.stroke({ color: shadeColor(roofColor, -52), alpha: 0.58, width: 1.5, cap: "round", join: "round" });
4751:  layer.addChild(roofLitHalf, roofShadeHalf, roofRim, roofFall);
4755:  if (roofShape === "gable") {
4783:  } else if (roofShape === "hip") {
4797:  } else if (roofShape === "sawtooth") {
4799:    // strips filled inside the roof diamond (the old naked diagonal strokes
4817:    teeth.fill({ color: shadeColor(roofColor, 16) });
4818:    shadeTeeth.fill({ color: shadeColor(roofColor, -14) });
4820:  } else if (roofShape === "tower") {
4826:    // 0.74F chunky treatment — flat roofs step: a darker inner well between
4827:    // the roof rim and a RAISED inset cap deck. The lid reads as stacked
4831:      .fill({ color: shadeColor(sunlitColor(roofColor, "top"), -16) });
4834:      .fill({ color: sunlitColor(shadeColor(roofColor, 8), "top") });
4837:  lines.stroke({ color: shadeColor(roofColor, -44), alpha: 0.38, width: 1.5, cap: "round", join: "round" });
4840:  drawParapetCap(layer, geometry, building, roofShape);
4845:// 0.53E Hero Silhouette — a raised parapet wall around a flat roof edge. This is
4846:// 0.75C-3 close-zoom material: coarse roof seams and cells stay clipped to the
4847:// roof diamond and draw only behind parapets/authored roof profiles.
4849:  const { top, footprintWidth, footprintDepth, roofColor } = geometry;
4851:  const roofShape = building.roofShape ?? "flat";
4854:  const seamColor = shadeColor(roofColor, -18);
4855:  const capColor = shadeColor(roofColor, 18);
4858:    const seed = materialTextureSeed(building.id, `roof-${roofShape}`, course);
4860:    const start = roofMaterialPoint(top, footprintWidth, footprintDepth, 0.12, t);
4861:    const end = roofMaterialPoint(top, footprintWidth, footprintDepth, 0.88, t);
4870:      .poly(roofMaterialQuadPoints(top, footprintWidth, footprintDepth, u0, t0, u1, t1), true)
4871:      .fill({ color: shadeColor(roofColor, materialTextureDelta(seed)), alpha: 0.12 });
4873:  material.stroke({ color: seamColor, alpha: roofShape === "flat" ? 0.2 : 0.16, width: 1, cap: "butt", join: "round" });
4875:  if (roofShape === "gable" || roofShape === "hip") {
4876:    const caps = 2 + (materialTextureSeed(building.id, "roof-ridge", 0) % 3);
4878:      const seed = materialTextureSeed(building.id, "roof-ridge", cap);
4881:      const center = roofMaterialPoint(top, footprintWidth, footprintDepth, u, t);
4886:    material.stroke({ color: capColor, alpha: 0.22, width: 1.4, cap: "butt", join: "round" });
4892:function roofMaterialPoint(top: ProjectedPoint, width: number, depth: number, u: number, t: number): ProjectedPoint {
4903:function roofMaterialQuadPoints(top: ProjectedPoint, width: number, depth: number, u0: number, t0: number, u1: number, t1: number): number[] {
4904:  const a = roofMaterialPoint(top, width, depth, u0, t0);
4905:  const b = roofMaterialPoint(top, width, depth, u1, t0);
4906:  const c = roofMaterialPoint(top, width, depth, u1, t1);
4907:  const d = roofMaterialPoint(top, width, depth, u0, t1);
4911:// 0.53E Hero Silhouette - a raised parapet wall around a flat roof edge. This is
4912:// the single biggest "box -> building" cue: the roof stops reading as a flush
4913:// lid and starts reading as a real rooftop bounded by a low wall.
4914:function drawParapetCap(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, roofShape: CityWorldBuilding["roofShape"]) {
4915:  if (roofShape !== "flat" && roofShape !== "sawtooth") return;
4922:  const { top, footprintWidth, footprintDepth, roofColor } = geometry;
4926:  // Perimeter diamond corners of the roof top.
4934:    .fill({ color: buildingFaceColor(shadeColor(roofColor, -6), "sun"), alpha: 0.9 });
4937:    .fill({ color: buildingFaceColor(shadeColor(roofColor, -6), "shade"), alpha: 0.92 });
4943:  coping.stroke({ color: mixColor(shadeColor(roofColor, 40), SUN_WARM_TINT, 0.18), alpha: 0.85, width: 1.4, cap: "round", join: "round" });
4948:  const profile = building.visualGrammar?.roofProfile;
4950:  const { top, footprintWidth, footprintDepth, roofColor } = geometry;
4958:    // stacked with the gable ridge/eave linework into roof scribble.
4971:      color: shadeColor(roofColor, profile === "cool_clay_tile" ? 34 : 28),
4981:    // 0.53E item B — the parapet (drawParapetCap) and the roof deck must read
4985:    const membrane = polygon(diamondPoints(top, footprintWidth * 0.84, footprintDepth * 0.76), shadeColor(roofColor, -14), 0.32, shadeColor(roofColor, -30), 0.24);
4990:      .fill({ color: shadeColor(roofColor, 22), alpha: 0.34 });
4998:    const panelField = polygon(diamondPoints(top, footprintWidth * 0.9, footprintDepth * 0.82), mixColor(roofColor, SUN_COOL_TINT, 0.24), 0.16, roofColor, 0);
5009:    seams.stroke({ color: shadeColor(roofColor, -30), alpha: 0.22, width: 1, cap: "round" });
5017:    // and metal, and catches the key light (item D pairs the roof rim).
5024:    mullions.stroke({ color: 0x4e8298, alpha: 0.28, width: 1, cap: "round" });
5028:    specular.stroke({ color: 0xeafaff, alpha: 0.55, width: 1.8, cap: "round" });
5034:  const { top, footprintWidth, footprintDepth, roofColor } = geometry;
5035:  const roofShape = building.roofShape ?? "flat";
5037:  const dark = shadeColor(roofColor, -38);
5038:  const light = shadeColor(roofColor, 24);
5044:    .stroke({ color: dark, alpha: 0.38, width: 2.2, cap: "round", join: "round" });
5046:  if (roofShape === "hip") {
5049:      .stroke({ color: dark, alpha: 0.16, width: 1.2 })
5051:      .stroke({ color: light, alpha: 0.16, width: 1.1 });
5052:  } else if (roofShape === "flat") {
5055:      .stroke({ color: dark, alpha: 0.24, width: 1.4 })
5057:      .fill({ color: light, alpha: 0.14 })
5058:      .stroke({ color: dark, alpha: 0.14, width: 1 });
5065:  const { top, footprintWidth, footprintDepth, roofColor } = geometry;
5066:  const roofShape = building.roofShape ?? "flat";
5067:  // One eave shadow under pitched home roofs. The old wandering parapet
5068:  // squiggles, shingle-course strokes, and translucent roof pads were the
5069:  // scribble noise that made roofs read procedural.
5070:  if (building.kind !== "home" || (roofShape !== "gable" && roofShape !== "hip")) return;
5075:  eaveLip.stroke({ color: shadeColor(roofColor, -50), alpha: 0.24, width: 1.8, cap: "round", join: "round" });
5084:  const count = building.facadeStyle === "rowhome" || building.facadeStyle === "strip_store" ? 4 : 2;
5091:  ribs.stroke({ color: trimColor, alpha: lineAlpha, width: 1, cap: "round" });
5095:function drawHomeDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
5096:  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor, accentColor } = geometry;
5097:  const style = building.facadeStyle ?? "cottage";
5106:    .fill({ color: 0xe7d0a2, alpha: style === "rowhome" ? 0.46 : 0.34 })
5107:    .stroke({ color: 0x7f6d4e, alpha: 0.18, width: 1 });
5113:    const roofLip = new Graphics()
5121:      .fill({ color: shadeColor(roofColor, -30), alpha: 0.18 });
5135:      shadeColor(roofColor, -42),
5140:      .fill({ color: 0x2d423b, alpha: 0.16 });
5146:      .stroke({ color: 0x8b7954, alpha: 0.32, width: 1.2, cap: "round", join: "round" });
5153:      .stroke({ color: shadeColor(roofColor, -34), alpha: 0.34, width: 2, cap: "round", join: "round" });
5156:      .fill({ color: trimColor, alpha: 0.9 })
5158:      .fill({ color: shadeColor(trimColor, 26), alpha: 0.66 })
5160:      .fill({ color: highlightColor, alpha: 0.86 })
5162:      .stroke({ color: trimColor, alpha: 0.22, width: 1 })
5164:      .fill({ color: highlightColor, alpha: 0.76 })
5166:      .stroke({ color: trimColor, alpha: 0.2, width: 1 })
5168:      .fill({ color: shadeColor(roofColor, -48), alpha: 0.88 })
5169:      .stroke({ color: 0x26332c, alpha: 0.26, width: 1 });
5172:      .fill({ color: shadeColor(bodyColor, -18), alpha: 0.28 });
5173:    layer.addChild(roofLip, gableFace, porchShadow, porch, porchLip, eave, trim, sideRecess);
5175:    const hipInset = polygon(diamondPoints({ x: top.x, y: top.y + footprintDepth * 0.01 }, footprintWidth * 0.72, footprintDepth * 0.48), shadeColor(roofColor, 18), 0.22, shadeColor(roofColor, -36), 0.16);
5182:      .stroke({ color: shadeColor(roofColor, -38), alpha: 0.36, width: 2.4, cap: "round", join: "round" });
5187:      .fill({ color: highlightColor, alpha: 0.72 })
5188:      .stroke({ color: trimColor, alpha: 0.28, width: 1 });
5198:      .fill({ color: shadeColor(bodyColor, -24), alpha: 0.3 });
5203:      .fill({ color: trimColor, alpha: 0.82 })
5205:      .fill({ color: highlightColor, alpha: 0.62 })
5206:      .stroke({ color: 0x26332c, alpha: 0.2, width: 1 });
5214:        .fill({ color: shadeColor(roofColor, unit === 0 ? 16 : 4), alpha: 0.5 });
5221:        .fill({ color: 0xe7d0a2, alpha: 0.64 })
5223:        .fill({ color: accentColor, alpha: 0.62 })
5225:        .fill({ color: highlightColor, alpha: 0.72 })
5227:        .fill({ color: highlightColor, alpha: 0.5 })
5231:    units.stroke({ color: trimColor, alpha: 0.24, width: 1 });
5236:  // (only rowhomes have sprite art), so the hash-keyed roof accent + entry
5244:function drawResidentialAuthorshipVariation(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding, style: CityWorldBuilding["facadeStyle"]) {
5245:  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor } = geometry;
5247:  const accentShift = variant % 2 === 0 ? shadeColor(bodyColor, 22) : shadeColor(roofColor, 18);
5253:      shadeColor(roofColor, variant === 3 ? 18 : 8),
5260:      .fill({ color: highlightColor, alpha: 0.56 })
5261:      .stroke({ color: trimColor, alpha: 0.18, width: 0.8 });
5277:      .fill({ color: accentShift, alpha: 0.26 })
5280:    garageFace.stroke({ color: trimColor, alpha: 0.18, width: 1, cap: "round" });
5285:function drawResidentialMaterialBands(layer: Container, geometry: BuildingGeometry, style: CityWorldBuilding["facadeStyle"]) {
5286:  const { top, bottom, footprintWidth, footprintDepth, bodyColor, roofColor, highlightColor, trimColor } = geometry;
5295:  lowerShadow.stroke({ color: shadeColor(bodyColor, -28), alpha: materialAlpha, width: 1.3, cap: "round", join: "round" });
5302:  trimBand.stroke({ color: shadeColor(bodyColor, 26), alpha: style === "ranch" ? 0.24 : 0.2, width: 1.2, cap: "round", join: "round" });
5306:  const windowCount = style === "ranch" ? 4 : style === "rowhome" ? 3 : 2;
5307:  for (let index = 0; index < windowCount; index += 1) {
5308:    const position = index / (windowCount - 1);
5313:      .fill({ color: sillColor, alpha: 0.34 })
5315:      .stroke({ color: shadeColor(bodyColor, -34), alpha: 0.14, width: 1 });
5322:  eaveShadow.stroke({ color: shadeColor(roofColor, -48), alpha: style === "rowhome" ? 0.14 : 0.24, width: 1.8, cap: "round", join: "round" });
5334:function drawShopDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
5335:  const { top, bottom, footprintWidth, footprintDepth, roofColor, accentColor, highlightColor } = geometry;
5339:    .fill({ color: signColor, alpha: 0.95 })
5340:    .stroke({ color: 0x26332c, alpha: 0.44, width: 1 })
5342:    .fill({ color: highlightColor, alpha: 0.82 })
5344:    .fill({ color: highlightColor, alpha: 0.78 });
5351:      .fill({ color: stripe % 2 === 0 ? roofColor : 0xfff4d8, alpha: 0.92 });
5353:  awning.stroke({ color: 0x26332c, alpha: 0.3, width: 1 });
5357:function drawGymDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
5358:  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor } = geometry;
5360:  const roofInset = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.02 }, footprintWidth * 0.74, footprintDepth * 0.48), shadeColor(roofColor, 18), 0.24, trimColor, 0.14);
5365:      .fill({ color: shadeColor(bodyColor, panel % 2 === 0 ? -18 : -8), alpha: 0.24 });
5367:  layer.addChild(baseApron, roofInset, sidePanels);
5371:    .fill({ color: highlightColor, alpha: 0.88 })
5372:    .stroke({ color: roofColor, alpha: 0.78, width: 2 })
5374:    .fill({ color: 0xa9d7e6, alpha: 0.76 })
5376:    .fill({ color: 0xa9d7e6, alpha: 0.72 });
5381:    .fill({ color: roofColor, alpha: 0.62 })
5383:    .fill({ color: shadeColor(roofColor, 22), alpha: 0.42 })
5384:    .stroke({ color: 0x26332c, alpha: 0.24, width: 1 });
5390:  stripe.stroke({ color: 0xffffff, alpha: 0.32, width: 2, cap: "round" });
5401:    .fill({ color: 0xdcc396, alpha: 0.46 })
5402:    .stroke({ color: 0x7f6d4e, alpha: 0.18, width: 1 });
5412:  const roofSaw = new Graphics();
5414:    roofSaw
5419:  roofSaw.stroke({ color: shadeColor(roofColor, -36), alpha: 0.3, width: 1.8, cap: "round", join: "round" });
5422:    .fill({ color: shadeColor(bodyColor, -28), alpha: 0.26 })
5424:    .fill({ color: highlightColor, alpha: 0.34 });
5425:  layer.addChild(serviceWing, roofSaw, rollupBay);
5428:function drawApartmentDetails(layer: Container, geometry: BuildingGeometry) {
5429:  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor } = geometry;
5430:  const roofCap = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.06 }, footprintWidth * 0.68, footprintDepth * 0.46), shadeColor(roofColor, 16), 0.48, trimColor, 0.16);
5438:  layer.addChild(roofCap, stairCore);
5449:    shadeColor(roofColor, 18),
5456:  // 0.57E parity — window columns LIVE on the front-left wall face: each
5458:  // slopes down toward center) and rows divide the actual wall height. The
5460:  const windows = new Graphics();
5464:  const windowRows = Math.min(4, Math.max(2, Math.floor((wallHeight - 8) / 9)));
5465:  const rowStep = (wallHeight - 10) / windowRows;
5469:    for (let row = 0; row < windowRows; row += 1) {
5472:      windows
5474:        .fill({ color: shadeColor(bodyColor, -34), alpha: 0.22 })
5476:        .fill({ color: row % 2 === 0 ? 0xfff4bd : 0xdaf2ff, alpha: 0.82 });
5479:  windows.stroke({ color: 0x26332c, alpha: 0.2, width: 0.8 });
5480:  layer.addChild(windows);
5488:  balconies.stroke({ color: trimColor, alpha: 0.2, width: 2, cap: "round" });
5493:    .fill({ color: shadeColor(roofColor, -24), alpha: 0.5 })
5495:    .fill({ color: shadeColor(roofColor, 18), alpha: 0.48 });
5505:      .fill({ color: shadeColor(bodyColor, core < 0 ? -16 : 12), alpha: 0.2 })
5509:  verticalCores.stroke({ color: trimColor, alpha: 0.16, width: 1.1, cap: "round" });
5510:  const roofTerraces = new Graphics()
5512:    .fill({ color: shadeColor(roofColor, 28), alpha: 0.22 })
5514:    .fill({ color: shadeColor(roofColor, -10), alpha: 0.16 });
5515:  layer.addChild(verticalCores, roofTerraces);
5518:function drawCivicDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
5519:  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, accentColor, trimColor } = geometry;
5520:  const roofTier = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.04 }, footprintWidth * 0.72, footprintDepth * 0.58), shadeColor(roofColor, 16), 0.56, trimColor, 0.2);
5521:  const roofCap = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.18 }, footprintWidth * 0.42, footprintDepth * 0.34), shadeColor(roofColor, 28), 0.78, trimColor, 0.24);
5523:  const roofShadow = polygon(diamondPoints({ x: top.x, y: top.y + footprintDepth * 0.06 }, footprintWidth * 0.78, footprintDepth * 0.48), shadeColor(roofColor, -18), 0.2, trimColor, 0);
5524:  const roofFacetLeft = polygon(diamondPoints({ x: top.x - footprintWidth * 0.22, y: top.y - footprintDepth * 0.04 }, footprintWidth * 0.22, footprintDepth * 0.18), shadeColor(roofColor, 30), 0.28, trimColor, 0.08);
5525:  const roofFacetRight = polygon(diamondPoints({ x: top.x + footprintWidth * 0.22, y: top.y + footprintDepth * 0.02 }, footprintWidth * 0.22, footprintDepth * 0.18), shadeColor(roofColor, -8), 0.22, trimColor, 0.08);
5526:  const roofRidge = new Graphics()
5530:  roofRidge.stroke({ color: 0xe7f4f0, alpha: 0.3, width: 1.4, cap: "round", join: "round" });
5531:  if (!hasHeroTieredCrown(building)) layer.addChild(roofShadow, roofTier, roofFacetLeft, roofFacetRight, roofCap, skylight, roofRidge);
5544:    .fill({ color: 0xe7d0a2, alpha: 0.76 })
5545:    .stroke({ color: 0x7f6d4e, alpha: 0.24, width: 1.2 });
5548:    .fill({ color: 0xf8e8ca, alpha: 0.84 })
5550:    .fill({ color: 0x5d8fa8, alpha: 0.78 })
5551:    .stroke({ color: trimColor, alpha: 0.28, width: 1.1 });
5552:  const entryCanopy = polygon(diamondPoints({ x: top.x, y: bottom.y - footprintDepth * 0.34 }, footprintWidth * 0.46, footprintDepth * 0.16), shadeColor(roofColor, 20), 0.64, trimColor, 0.2);
5557:      .fill({ color: highlightColor, alpha: 0.95 });
5561:    .fill({ color: highlightColor, alpha: 0.94 })
5563:    .fill({ color: roofColor, alpha: 0.96 })
5564:    .stroke({ color: 0x26332c, alpha: 0.32, width: 1 });
5571:  sideWindows.fill({ color: 0xfff4bd, alpha: 0.68 }).stroke({ color: trimColor, alpha: 0.18, width: 0.8 });
5572:  const facadeRhythm = new Graphics()
5581:  facadeRhythm.stroke({ color: trimColor, alpha: 0.16, width: 1.1, cap: "round", join: "round" });
5587:  baseRibs.stroke({ color: trimColor, alpha: 0.14, width: 1.2, cap: "round", join: "round" });
5589:  // the plinth (plinthTiers), the entry canopy, and the facade bar rhythm, so
5594:    layer.addChild(sideTerraceLeft, sideTerraceRight, frontSteps, entryBlock, sideWindows, facadeRhythm, baseRibs);
5596:    layer.addChild(sideTerraceLeft, sideTerraceRight, plinth, frontSteps, entryBlock, entryCanopy, columns, sideWindows, facadeRhythm, baseRibs);
5601:    .fill({ color: 0x46564f, alpha: 0.86 })
5603:    .fill({ color: accentColor, alpha: 0.92 });
5606:  if (building.id === "building-civic") drawEastvaleCoreLandmarkDetails(layer, geometry);
5609:function drawEastvaleCoreLandmarkDetails(layer: Container, geometry: BuildingGeometry) {
5610:  const { top, bottom, footprintWidth, footprintDepth, roofColor, highlightColor, trimColor } = geometry;
5613:    .fill({ color: 0xb7dceb, alpha: 0.74 })
5615:    .fill({ color: 0xe7f6f4, alpha: 0.44 })
5617:    .fill({ color: 0xe7f6f4, alpha: 0.34 })
5618:    .stroke({ color: trimColor, alpha: 0.28, width: 1.1 });
5628:    .fill({ color: shadeColor(roofColor, 28), alpha: 0.66 })
5629:    .stroke({ color: trimColor, alpha: 0.22, width: 1.2 });
5631:  // (item C) roofLantern + lanternGlass retired — the tiered crown owns the
5632:  // hero roof; the ground-storey glass entry below keeps the lantern read.
5638:      .fill({ color: highlightColor, alpha: 0.76 })
5640:      .stroke({ color: trimColor, alpha: 0.18, width: 0.9 });
5648:  civicNameplateGeometry.stroke({ color: 0xfff1cc, alpha: 0.32, width: 2.4, cap: "round", join: "round" });
5657:  civicPlinthStack.stroke({ color: 0x8b7954, alpha: 0.3, width: 1.7, cap: "round", join: "round" });
5659:  // (item C) roofShoulders retired with the other roof decals — crown owns it.
5665:function drawDraftAnchorDetails(layer: Container, geometry: BuildingGeometry, building: CityWorldBuilding) {
5666:  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, highlightColor, trimColor, accentColor } = geometry;
5671:    .fill({ color: shadeColor(roofColor, 22), alpha: 0.18 })
5673:    .fill({ color: shadeColor(roofColor, -28), alpha: 0.14 });
5674:  const facade = new Graphics();
5676:    facade
5678:      .fill({ color: id.includes("artic") ? 0xc9e5e8 : 0xf7e8c0, alpha: id.includes("stadium") ? 0.42 : 0.58 });
5680:  facade.stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
5681:  layer.addChild(material, facade);
5708:      .fill({ color: shadeColor(bodyColor, -18), alpha: 0.3 })
5709:      .stroke({ color: 0x8b744f, alpha: 0.1, width: 1 });
5716:      .fill({ color: shadeColor(roofColor, 24), alpha: 0.2 })
5717:      .stroke({ color: 0xf9f0d2, alpha: 0.1, width: 1 });
5718:    const roofField = polygon(
5720:      shadeColor(roofColor, 16),
5727:      shadeColor(roofColor, 34),
5734:      shadeColor(roofColor, -8),
5751:    exhibitRoof.stroke({ color: shadeColor(roofColor, -42), alpha: 0.42, width: 2.2, cap: "round", join: "round" });
5752:    const roofSkylights = new Graphics();
5754:      roofSkylights
5758:    roofSkylights.stroke({ color: 0xe9fbfb, alpha: 0.32, width: 3, cap: "round", join: "round" });
5759:    const roofHallBreaks = new Graphics()
5768:    roofHallBreaks.stroke({ color: 0xfbf1cf, alpha: 0.28, width: 2.2, cap: "round", join: "round" });
5772:      .fill({ color: 0xc7ecf1, alpha: 0.34 });
5776:        .fill({ color: bay % 2 === 0 ? 0xdaf4f4 : 0xaed6df, alpha: 0.54 })
5778:        .fill({ color: 0xf8e8ca, alpha: 0.26 });
5780:    glassArcade.stroke({ color: trimColor, alpha: 0.12, width: 0.8 });
5787:    curtainMullions.stroke({ color: 0xf8ffff, alpha: 0.3, width: 0.9, cap: "round" });
5795:    hallApronRibs.stroke({ color: 0xf8e8c0, alpha: 0.28, width: 1.6, cap: "round", join: "round" });
5798:      .fill({ color: 0xc7ecf1, alpha: 0.42 })
5799:      .stroke({ color: 0x4e8298, alpha: 0.16, width: 1 });
5806:    waveCornice.stroke({ color: 0xf9f0d2, alpha: 0.34, width: 2.4, cap: "round", join: "round" });
5807:    layer.addChild(hallShadow, hallBase, hallSideFace, campusSlab, hallApron, hallApronRibs, roofField, westRoofStep, eastRoofStep, exhibitRoof, roofSkylights, roofHallBreaks, glassArcade, curtainMullions, curtainWall, waveCornice);
5812:    const canopy = polygon(diamondPoints({ x: bottom.x, y: bottom.y - footprintDepth * 0.12 }, footprintWidth * 0.82, footprintDepth * 0.22), shadeColor(roofColor, 28), 0.76, trimColor, 0.18);
5815:      .fill({ color: 0xc7ecf1, alpha: 0.74 })
5816:      .stroke({ color: trimColor, alpha: 0.18, width: 1 });
5821:    entryPiers.fill({ color: 0xf6dcb1, alpha: 0.58 }).stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
5826:        .fill({ color: bay % 2 === 0 ? 0xd8f3f3 : 0xb9dce4, alpha: 0.44 });
5828:    frontageBays.stroke({ color: 0x4e8298, alpha: 0.12, width: 0.8 });
5829:    const roofBands = new Graphics()
5837:    roofBands.stroke({ color: 0xfaf1d4, alpha: 0.3, width: 2, cap: "round", join: "round" });
5844:    serpentineFront.stroke({ color: 0xf9f2da, alpha: 0.42, width: 2.2, cap: "round", join: "round" });
5851:    forecourtAxis.stroke({ color: 0xf7e8c0, alpha: 0.28, width: 2, cap: "round", join: "round" });
5852:    layer.addChild(plazaPlane, canopy, glassRun, frontageBays, entryPiers, roofBands, serpentineFront, forecourtAxis);
5867:      .fill({ color: 0xbdd9dc, alpha: 0.5 })
5868:      .stroke({ color: 0xf4fbfb, alpha: 0.48, width: 2.1 });
5876:    const roofRibs = new Graphics();
5878:      roofRibs
5883:      roofRibs
5887:    roofRibs.stroke({ color: 0xf4fbfb, alpha: 0.58, width: 1.9, cap: "round", join: "round" });
5890:      .stroke({ color: 0xf9ffff, alpha: 0.5, width: 3 });
5900:    platformLines.stroke({ color: trimColor, alpha: 0.26, width: 1.6, cap: "round" });
5904:      .fill({ color: 0xd9f2f0, alpha: 0.5 })
5905:      .stroke({ color: trimColor, alpha: 0.16, width: 0.9 });
5913:    endPortalArcs.stroke({ color: 0xf4fbfb, alpha: 0.5, width: 1.8, cap: "round", join: "round" });
5919:    transitSpine.stroke({ color: 0xf8ffff, alpha: 0.32, width: 2.2, cap: "round" });
5920:    layer.addChild(trackBed, platform, vaultShadow, vault, shellTop, shellRim, roofRibs, platformLines, glassEnds, endPortalArcs, transitSpine);
5924:    const towerCap = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.32 }, footprintWidth * 0.58, footprintDepth * 0.36), shadeColor(roofColor, 32), 0.86, trimColor, 0.22);
5927:      .fill({ color: 0xf9f1d0, alpha: 0.88 })
5928:      .stroke({ color: trimColor, alpha: 0.28, width: 1 });
5936:    verticalRibs.stroke({ color: 0xf4fbfb, alpha: 0.34, width: 1.2, cap: "round" });
5943:      .fill({ color: shadeColor(roofColor, 12), alpha: 0.46 })
5944:      .stroke({ color: shadeColor(roofColor, -38), alpha: 0.42, width: 2.8 })
5946:      .fill({ color: 0xaebd7a, alpha: 0.42 })
5947:      .stroke({ color: trimColor, alpha: 0.2, width: 1.3 });
5964:    tierLines.stroke({ color: 0xfff7d8, alpha: 0.34, width: 1.8, cap: "round" });
5980:        .fill({ color: shadeColor(bodyColor, -26), alpha: 0.28 })
5982:        .fill({ color: 0xf6e8c8, alpha: 0.44 });
5987:    stoopLine.stroke({ color: 0x7f6d4e, alpha: 0.28, width: 1.4, cap: "round" });
5997:    balcony.stroke({ color: shadeColor(trimColor, 28), alpha: 0.34, width: 1.5, cap: "round" });
5999:    const roofTerraces = new Graphics()
6002:      .fill({ color: shadeColor(roofColor, 26), alpha: 0.22 })
6003:      .stroke({ color: trimColor, alpha: 0.1, width: 0.8 });
6004:    layer.addChild(courtyardMark, balcony, roofTerraces);
6012:        .fill({ color: 0xc7ecf1, alpha: 0.44 });
6014:    podiumGlass.stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
6019:    podiumLip.stroke({ color: 0x7f6d4e, alpha: 0.3, width: 1.6, cap: "round", join: "round" });
6026:      .fill({ color: highlightColor, alpha: 0.82 })
6028:      .fill({ color: accentColor, alpha: 0.54 })
6029:      .stroke({ color: trimColor, alpha: 0.24, width: 1 });
6042:    communitySteps.stroke({ color: 0x8f7a54, alpha: 0.32, width: 1.8, cap: "round", join: "round" });
6043:    const roofPatch = polygon(diamondPoints({ x: top.x - footprintWidth * 0.12, y: top.y - footprintDepth * 0.02 }, footprintWidth * 0.26, footprintDepth * 0.18), shadeColor(roofColor, 30), 0.32, trimColor, 0.08);
6044:    layer.addChild(roofPatch, communitySteps);
6106:    .fill({ color: 0x8e7a55, alpha: 0.14 })
6107:    .stroke({ color: 0x5f553f, alpha: 0.12, width: 1 });
6112:  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
6114:  const roofWidth = footprintWidth * (isEntry ? 0.94 : 1.06);
6115:  const roofDepth = footprintDepth * (isEntry ? 0.34 : 0.5);
6116:  const longRoof = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.05 }, roofWidth, roofDepth), shadeColor(roofColor, 24), 0.32, trimColor, 0.1);
6126:    .fill({ color: 0xc7edf0, alpha: isEntry ? 0.72 : 0.5 })
6127:    .stroke({ color: 0x558698, alpha: 0.14, width: 1 });
6130:    .fill({ color: 0xd9f7f4, alpha: isEntry ? 0.48 : 0.34 })
6131:    .stroke({ color: 0x4e8298, alpha: 0.16, width: 1 });
6142:  bayRhythm.stroke({ color: 0xf8f0d0, alpha: 0.34, width: isEntry ? 1.6 : 1.3, cap: "round" });
6151:  layeredRoof.stroke({ color: 0xfaf3d4, alpha: 0.34, width: 2.2, cap: "round", join: "round" });
6158:  waveEdge.stroke({ color: 0xfff5d8, alpha: isEntry ? 0.34 : 0.42, width: isEntry ? 2 : 2.6, cap: "round", join: "round" });
6165:  forecourtGrooves.stroke({ color: 0xf8e8c0, alpha: 0.3, width: 1.7, cap: "round", join: "round" });
6170:  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
6180:    .fill({ color: 0x5c7d82, alpha: 0.24 });
6183:    .fill({ color: 0xd8eeee, alpha: 0.58 })
6184:    .stroke({ color: 0xf8ffff, alpha: 0.52, width: 3 });
6187:    .stroke({ color: 0xffffff, alpha: 0.42, width: 4 });
6196:  ribGrid.stroke({ color: 0xf8ffff, alpha: 0.6, width: 1.75, cap: "round" });
6205:  platformEdge.stroke({ color: shadeColor(roofColor, -36), alpha: 0.34, width: 2.3, cap: "round" });
6209:    .fill({ color: 0xe4f6f3, alpha: 0.58 })
6210:    .stroke({ color: trimColor, alpha: 0.16, width: 1 });
6216:  trackSplit.stroke({ color: 0x334543, alpha: 0.34, width: 1.8, cap: "round" });
6221:  shellNodes.fill({ color: 0xf8ffff, alpha: 0.42 });
6226:  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
6229:    .fill({ color: shadeColor(roofColor, 10), alpha: 0.48 })
6230:    .stroke({ color: shadeColor(roofColor, -34), alpha: 0.46, width: 3 })
6232:      .fill({ color: 0xb7c77d, alpha: 0.46 });
6240:    .fill({ color: 0xa7bd72, alpha: 0.28 })
6241:    .stroke({ color: 0xfaf0cf, alpha: 0.12, width: 1 });
6248:  tierBands.stroke({ color: 0xfff5d6, alpha: 0.4, width: 1.7, cap: "round" });
6257:  const facadeRhythm = new Graphics();
6258:  const count = building.facadeStyle === "lowrise" ? 6 : 5;
6261:    facadeRhythm
6263:      .fill({ color: highlightColor, alpha: 0.46 })
6267:  facadeRhythm.stroke({ color: trimColor, alpha: 0.18, width: 0.9 });
6268:  layer.addChild(podium, facadeRhythm);
6272:  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
6279:  parapet.stroke({ color: shadeColor(roofColor, -32), alpha: 0.34, width: 2.1, cap: "round", join: "round" });
6284:      .fill({ color: bay % 2 === 0 ? 0xc7ecf1 : 0xf8e8c0, alpha: 0.4 });
6286:  bayGlass.stroke({ color: trimColor, alpha: 0.14, width: 0.8 });
6291:  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
6294:  const longCanopy = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.12 }, footprintWidth * (terminal ? 0.96 : 0.76), footprintDepth * 0.28), shadeColor(roofColor, 20), 0.34, trimColor, 0.12);
6299:      .fill({ color: 0xd9f2f0, alpha: terminal ? 0.5 : 0.32 });
6301:  terminalGlass.stroke({ color: trimColor, alpha: 0.13, width: 0.8 });
6307:  runwayEdge.stroke({ color: 0x6e7565, alpha: 0.22, width: 1.8, cap: "round" });
6312:  const { top, bottom, footprintWidth, footprintDepth, roofColor, trimColor } = geometry;
6320:  steps.stroke({ color: 0x8f7a54, alpha: 0.3, width: 1.5, cap: "round", join: "round" });
6321:  const civicRoof = polygon(diamondPoints({ x: top.x, y: top.y - footprintDepth * 0.12 }, footprintWidth * 0.54, footprintDepth * 0.3), shadeColor(roofColor, 24), 0.3, trimColor, 0.1);
6328:  const windows = new Graphics();
6329:  const count = building.facadeStyle === "rowhome" ? 5 : 3;
6332:    windows
6334:      .fill({ color: highlightColor, alpha: 0.44 });
6336:  windows.stroke({ color: trimColor, alpha: 0.15, width: 0.8 });
6337:  layer.addChild(stoopPad, windows);
6341:  const { top, bottom, footprintWidth, footprintDepth, roofColor, bodyColor, trimColor, highlightColor } = geometry;
6343:  const roofPanelAlpha = id.includes("platinum") ? 0.22 : id.includes("convention") ? 0.2 : 0.17;
6344:  const roofPanels = new Graphics()
6352:  roofPanels.stroke({ color: shadeColor(roofColor, -42), alpha: roofPanelAlpha, width: 1.25, cap: "round", join: "round" });
6356:    .fill({ color: shadeColor(bodyColor, -16), alpha: 0.12 })
6358:    .fill({ color: shadeColor(bodyColor, 18), alpha: 0.12 });
6367:  baseCourse.stroke({ color: 0x8f7953, alpha: 0.22, width: 1.2, cap: "round", join: "round" });
6374:        .fill({ color: trimColor, alpha: 0.18 })
6376:        .fill({ color: highlightColor, alpha: 0.46 });
6381:  layer.addChild(roofPanels, stuccoFacet, baseCourse);
6387:  const baseColor = colorToNumber(asset.palette.colors.base);
6388:  const shade = colorToNumber(asset.palette.colors.shade);
6389:  const highlight = colorToNumber(asset.palette.colors.highlight);
6390:  const accent = paletteColor(asset.palette.colors.accent, asset.palette.colors.highlight);
6392:  if (prop.kind === "tree" || prop.kind === "bush") {
6397:    const shadowReach = prop.kind === "bush" ? 8 : 14;
6398:    const tree = new Graphics()
6399:      .ellipse(point.x + shadowReach * 0.6, point.y - 1 + shadowReach * 0.18, prop.kind === "bush" ? 10 : 15, prop.kind === "bush" ? 3.6 : 4.6)
6400:      .fill({ color: CAST_SHADOW_COLOR, alpha: 0.26 });
6401:    if (prop.kind === "tree") {
6403:      voxelBox(tree, { x: point.x, y: point.y - 2 }, 5, 3, tall ? 13 : 10, shade);
6404:      voxelBox(tree, { x: point.x, y: point.y - (tall ? 13 : 10) }, 19, 11, 9, shadeColor(foliage, -8));
6405:      voxelBox(tree, { x: point.x, y: point.y - (tall ? 21 : 18) }, 14, 8, 7, foliage);
6407:        voxelBox(tree, { x: point.x, y: point.y - (tall ? 27 : 24) }, 9, 5, 5, shadeColor(foliage, 14));
6410:      voxelBox(tree, { x: point.x, y: point.y - 1 }, 13, 8, 6, shadeColor(foliage, -6));
6411:      voxelBox(tree, { x: point.x, y: point.y - 6.5 }, 8, 5, 4, shadeColor(foliage, 10));
6413:    tree.stroke({ color: 0x26332c, alpha: 0.2, width: 1 });
6416:    tree.alpha = Math.max(calm, 0.7);
6417:    layer.addChild(tree);
6424:      .fill({ color: 0x1d3a42, alpha: 0.2 });
6425:    // Plank boxes marching toward the water (SE), on two pile cubes.
6431:    dock.stroke({ color: 0x26332c, alpha: 0.22, width: 1 });
6441:      .fill({ color: 0x1d3a42, alpha: 0.24 });
6447:      .stroke({ color: shade, alpha: 0.8, width: 1.4, cap: "round" });
6448:    boat.stroke({ color: 0x26332c, alpha: 0.24, width: 1 });
6454:  if (prop.kind === "water_tower") {
6457:      .fill({ color: CAST_SHADOW_COLOR, alpha: 0.22 });
6468:      .stroke({ color: shade, alpha: 0.9, width: 1.6, cap: "round" });
6472:      .stroke({ color: shade, alpha: 0.6, width: 1, cap: "round" });
6475:      .fill({ color: sunlitColor(baseColor, "sun") })
6477:      .fill({ color: sunlitColor(baseColor, "shade"), alpha: 0.6 })
6479:      .fill({ color: shadeColor(baseColor, -20) });
6485:      .fill({ color: sunlitColor(accent, "top") });
6486:    tower.stroke({ color: 0x26332c, alpha: 0.3, width: 1 });
6495:      .fill({ color: baseColor, alpha: 0.85 })
6496:      .stroke({ color: shade, alpha: 0.8, width: 2 })
6498:      .fill({ color: highlight, alpha: 0.9 });
6499:    animated.push({ target: fountain, kind: "water", path: [], speed: 0.025, phase: prop.variant * 0.2, baseAlpha: 0.78 * calm, origin: point });
6504:  if (prop.kind === "water_shimmer") {
6510:    shimmer.stroke({ color: highlight, alpha: 0.54, width: 2, cap: "round" });
6511:    animated.push({ target: shimmer, kind: "water", path: [], speed: 0.02, phase: prop.variant * 0.35, baseAlpha: 0.52 * calm, origin: point });
6516:  if (prop.kind === "streetlight") {
6517:    const streetlight = new Graphics()
6519:        .fill({ color: 0x23342e, alpha: 0.16 })
6521:        .fill({ color: baseColor, alpha: 0.9 })
6523:        .fill({ color: baseColor, alpha: 0.9 })
6525:        .fill({ color: highlight, alpha: 0.92 })
6527:        .fill({ color: highlight, alpha: 0.08 });
6528:    streetlight.alpha = calm;
6529:    layer.addChild(streetlight);
6536:      .fill({ color: 0x23342e, alpha: 0.14 })
6538:      .fill({ color: baseColor, alpha: 0.96 })
6540:      .fill({ color: highlight, alpha: 0.96 })
6543:      .fill({ color: accent, alpha: 0.82 })
6544:      .stroke({ color: 0x26332c, alpha: 0.28, width: 1 });
6552:      windowColor: highlight,
6565:        .fill({ color: 0x23342e, alpha: 0.16 })
6567:        .fill({ color: shade })
6569:        .fill({ color: boardColor, alpha: 0.95 })
6572:        .stroke({ color: 0x26332c, alpha: 0.65, width: 1.5 });
6583:      .fill({ color: 0xffffff, alpha: 0.38 });
6595:  const actorBase = colorToNumber(actor.color);
6596:  const shade = colorToNumber(asset.palette.colors.shade);
6597:  const highlight = colorToNumber(asset.palette.colors.highlight);
6598:  const accent = paletteColor(asset.palette.colors.accent, asset.palette.colors.highlight);
6599:  const color = colorToNumber(actor.color);
6606:      windowColor: highlight,
6613:      .fill({ color: 0x23342e, alpha: 0.18 })
6615:      .fill({ color, alpha: 0.94 })
6617:      .fill({ color: shade, alpha: 0.66 })
6622:      .stroke({ color: shade, alpha: 0.64, width: 1.5, cap: "round" });
6642:  color: number,
6644:  details: { windowColor?: number; lightColor?: number; outlineColor?: number } = {},
6651:  const windowColor = details.windowColor ?? 0xf5fbff;
6655:    .fill({ color: 0x23342e, alpha: 0.16 })
6657:    .fill({ color, alpha: 0.97 })
6658:    .stroke({ color: outlineColor, alpha: 0.68, width: 1.3 })
6660:    .fill({ color: windowColor, alpha: 0.86 })
6663:    .fill({ color: 0x222826, alpha: 0.72 });
6669:      .fill({ color: lightColor, alpha: 0.86 });
6673:      .fill({ color: lightColor, alpha: 0.82 });
6689:  // glow: small, warm-neutral, held near the shadow floor.
6693:    .fill({ color: 0xf3ecd8, alpha: 0.03 })
6694:    .stroke({ color: 0x33443b, alpha: 0.08, width: 1.2 });
6695:  // The ring is ground furniture: it lives under shadows and buildings so it
6699:  const hit = new Graphics().circle(point.x, point.y - 12, place.hitRadius * 13).fill({ color: 0xffffff, alpha: 0.001 });
6722:  // warm ring near the shadow floor, warm-toned silhouette strokes.
6730:    .fill({ color: selected ? 0xe9d9ac : 0xf3ecd8, alpha: selected ? 0.12 : 0.09 })
6731:    .stroke({ color: selected ? 0xb99c5f : 0xcdbf9c, alpha: 0.44, width: selected ? 1.4 : 1.2 });
6738:    const top = project({ x: building.position.x, y: building.position.y, z: (building.position.z ?? 0) + building.height });
6753:      .stroke({ color: outlineColor, alpha: selected ? 0.5 : 0.4, width: selected ? 1.6 : 1.3, join: "round" });
6754:    const roofEdge = new Graphics()
6756:      .stroke({ color: outlineColor, alpha: selected ? 0.36 : 0.28, width: 1.1 });
6757:    layer.addChild(silhouette, roofEdge);
6768:  // slides off the roof axis and clears the crown with a small margin.
6776:      stroke: { color: 0xfff8e7, width: 3 },
6787:      text.position.y - text.height / 2 - paddingY,
6789:      text.height + paddingY * 2,
6792:    .fill({ color: 0xfff7df, alpha: 0.5 })
6793:    .stroke({ color: 0x26332c, alpha: 0.12, width: 1 });
6813:  const color = colorToNumber(asset.palette.colors.base);
6814:  const shade = colorToNumber(asset.palette.colors.shade);
6815:  const highlight = colorToNumber(asset.palette.colors.highlight);
6818:    .fill({ color: shade, alpha: 0.86 })
6820:    .fill({ color, alpha: 0.98 })
6822:    .fill({ color: highlight, alpha: 0.34 })
6823:    .stroke({ color: shade, alpha: 0.7, width: 1.5 });
6836:  // 0.67H — focal-landmark pins slide off the facade toward the plinth apron.
6844:// silhouette (roof + crown allowance), clamped so labels stay attached.
6849:    const crownAllowance = hasHeroTieredCrown(building) ? 52 : building.roofShape === "tower" ? 30 : 14;
6850:    const clearance = Math.min(building.height * TILE_DEPTH + crownAllowance, 104);
6871:      stroke: { color: 0xfff8e7, width: 3 },
6879:      text.position.y - text.height / 2 - 3,
6881:      text.height + 6,
6884:    .fill({ color: 0xfff7df, alpha: 0.34 })
6885:    .stroke({ color: 0x26332c, alpha: 0.08, width: 1 });
6902:    if (item.kind === "water") {
6936:function diamondPoints(center: ProjectedPoint, width: number, height: number): number[] {
6937:  return cityWorldDiamondPoints(center, width, height);
6941:  return new Graphics().poly(points, true).fill({ color: fill, alpha }).stroke({ color: stroke, alpha: strokeAlpha, width: 1 });
6945:// The shared primitive behind the blocky prop kit and cliff courses — props
6947:function voxelBox(g: Graphics, base: ProjectedPoint, width: number, depth: number, height: number, color: number, alpha = 1): void {
6950:  const topY = base.y - height;
6957:    .fill({ color: sunlitColor(color, "sun"), alpha });
6964:    .fill({ color: sunlitColor(color, "shade"), alpha });
6965:  g.poly(diamondPoints({ x: base.x, y: topY }, width, depth), true).fill({ color: sunlitColor(color, "top"), alpha });
6969:// (terrain, lots, roads) merge thousands of per-item Graphics into a few
6973:  g.poly(points, true).fill({ color: fill, alpha });
6974:  if (strokeAlpha > 0) g.stroke({ color: stroke, alpha: strokeAlpha, width: 1 });
6978:function colorToNumber(color: string): number {
6979:  return Number.parseInt(color.replace("#", ""), 16);
6982:function paletteColor(color: string | undefined, fallback: string): number {
6983:  return colorToNumber(color ?? fallback);
6986:function shadeColor(color: number, amount: number): number {
6987:  const r = clamp(((color >> 16) & 255) + amount, 0, 255);
6988:  const g = clamp(((color >> 8) & 255) + amount, 0, 255);
6989:  const b = clamp((color & 255) + amount, 0, 255);
6993:function scaleColor(color: number, factor: number): number {
6994:  const r = clamp(Math.round(((color >> 16) & 255) * factor), 0, 255);
6995:  const g = clamp(Math.round(((color >> 8) & 255) * factor), 0, 255);
6996:  const b = clamp(Math.round((color & 255) * factor), 0, 255);
7000:function mixColor(colorA: number, colorB: number, t: number): number {
7002:  const r = Math.round(((colorA >> 16) & 255) * (1 - ratio) + ((colorB >> 16) & 255) * ratio);
7003:  const g = Math.round(((colorA >> 8) & 255) * (1 - ratio) + ((colorB >> 8) & 255) * ratio);
7004:  const b = Math.round((colorA & 255) * (1 - ratio) + (colorB & 255) * ratio);
7011:function sunlitColor(color: number, face: SunFace): number {
7017:  // lift + warm tint makes roofs read lit instead of matte next to the walls.
7018:  if (face === "top") return mixColor(scaleColor(color, 1.22), SUN_WARM_TINT, 0.15);
7019:  if (face === "sun") return mixColor(scaleColor(color, 1.12), SUN_WARM_TINT, 0.12);
7020:  return mixColor(scaleColor(color, 0.4), SUN_COOL_TINT, 0.32);
7024:// separate from terrain/props (sunlitColor). The global curve pushed lit walls
7025:// and roofs to near-white luma, where the 0.54E highlight rolloff grades them
7030:function buildingFaceColor(color: number, face: SunFace): number {
7031:  if (face === "top") return mixColor(scaleColor(color, 1.12), SUN_WARM_TINT, 0.08);
7032:  if (face === "sun") return mixColor(scaleColor(color, 1.04), SUN_WARM_TINT, 0.09);
7033:  return mixColor(scaleColor(color, 0.52), SUN_COOL_TINT, 0.24);

 succeeded in 521ms:
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:89:    zone("metro-civic-core", "civic", civicRect, context, undefined, "Civic tower core", context.civicElevationBoost + 0.05),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:90:    zone("metro-main-street", "commercial", { minX: 15, minY: 5, maxX: 25, maxY: 8 }, context, 0.92, "Tight main street"),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:127:    zone("coastal-main-street", "commercial", { minX: 22, minY: 5, maxX: 34, maxY: 8 }, context, 0.76, "Shore main street"),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:130:    zone("coastal-green", "park", { minX: 8, minY: 15, maxX: 15, maxY: 19 }, context, undefined, "Shore green"),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:161:    zone("prairie-main-street", "commercial", { minX: 23, minY: 6, maxX: 35, maxY: 12 }, context, 0.62, "Straight main street"),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:165:    zone("prairie-ag-grid", "park", { minX: 35, minY: 22, maxX: 42, maxY: 30 }, context, undefined, "Ag grid"),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:213:    road("gen-road-metro-south", "street", 3, 25, 41, 25),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:214:    road("gen-road-metro-west", "street", 14 + context.xShift, 4, 14 + context.xShift, 29),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:216:    road("gen-road-metro-east", "street", 35, 5, 35, 29),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:224:    road("gen-road-desert-south", "street", 5, 22, 42, 22),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:235:    road("gen-road-coastal-north", "street", 4, 9 + context.yShift, shoreX, 9 + context.yShift),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:237:    road("gen-road-coastal-south", "street", 5, 25, shoreX, 25),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:238:    road("gen-road-coastal-back", "street", 21 + context.xShift, 5, 21 + context.xShift, 29),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:245:    road("gen-road-mountain-upper-contour", "street", 4, 13 + context.yShift, 24, 13 + context.yShift),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:247:    road("gen-road-mountain-lower-contour", "street", 18, 30, 41, 30),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:248:    road("gen-road-mountain-switchback", "street", 24 + context.xShift, 8, 24 + context.xShift, 27),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:258:    road("gen-road-prairie-south", "street", 3, 30, 42, 30),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:259:    road("gen-road-prairie-section", "street", 22 + context.xShift, 4, 22 + context.xShift, 30),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:260:    road("gen-road-prairie-east-section", "street", 36, 4, 36, 30),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:270:      road("gen-road-river-north-cross", "street", 5, 10 + context.yShift, 39, 10 + context.yShift),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:272:      road("gen-road-river-dock-cross", "street", 6, 26, 39, 26),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:279:    road("gen-road-river-west", "street", 22 + context.xShift, 5, 22 + context.xShift, 29),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:280:    road("gen-road-river-north-cross", "street", 5, 10 + context.yShift, 36, 10 + context.yShift),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:282:    road("gen-road-river-dock-cross", "street", 6, 31, 37, 31),
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:360:  kind: CityWorldZoneKind,
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:379:  kind: CityWorldRoadSeed["kind"],
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:438:      kind: "water",
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:446:      kind: "plaza",
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:458:    kind: "water",
packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:471:    return { id: "gen-road-water-edge", kind: "driveway", from: { x: 34, y: 24 }, to: { x: 41, y: 24 } };
packages/core/src/voxel/cityWorldObjectKit.ts:13:  prefabFamily: CityWorldObjectKitPrefabFamily;
packages/core/src/voxel/cityWorldObjectKit.ts:15:  paletteRoleCount: number;
packages/core/src/voxel/cityWorldObjectKit.ts:16:  roofBodySeparationFloor: number;
packages/core/src/voxel/cityWorldObjectKit.ts:18:  landmarkSignatureScore: number | null;
packages/core/src/voxel/cityWorldObjectKit.ts:23:  update: "postalpha-0.34e-public-object-kit-prefab-palette-contract";
packages/core/src/voxel/cityWorldObjectKit.ts:28:    prefabAssigned: number;
packages/core/src/voxel/cityWorldObjectKit.ts:33:    prefabFamilies: Record<string, number>;
packages/core/src/voxel/cityWorldObjectKit.ts:34:    paletteRoles: Record<string, number>;
packages/core/src/voxel/cityWorldObjectKit.ts:37:    prefabCoverageRatio: number;
packages/core/src/voxel/cityWorldObjectKit.ts:38:    paletteCohesionRatio: number;
packages/core/src/voxel/cityWorldObjectKit.ts:39:    roofBodySeparationRatio: number;
packages/core/src/voxel/cityWorldObjectKit.ts:41:    landmarkSignatureScore: number;
packages/core/src/voxel/cityWorldObjectKit.ts:49:  familyMetrics: CityWorldObjectKitFamilyMetric[];
packages/core/src/voxel/cityWorldObjectKit.ts:54:  "civic_landmark",
packages/core/src/voxel/cityWorldObjectKit.ts:72:export function assignCityWorldObjectKit(building: CityWorldBuilding): CityWorldObjectKitMetadata {
packages/core/src/voxel/cityWorldObjectKit.ts:73:  const prefabFamily = inferPrefabFamily(building);
packages/core/src/voxel/cityWorldObjectKit.ts:74:  const paletteRoles = uniquePaletteRoles([
packages/core/src/voxel/cityWorldObjectKit.ts:75:    paletteRoleForMaterial(building),
packages/core/src/voxel/cityWorldObjectKit.ts:76:    paletteRoleForRoof(building),
packages/core/src/voxel/cityWorldObjectKit.ts:78:    ...(prefabFamily === "commerce_strip" || prefabFamily === "service_gym" || prefabFamily === "civic_landmark" ? ["glass" as const] : []),
packages/core/src/voxel/cityWorldObjectKit.ts:81:  const roofBodySeparationScore = colorSeparationScore(effectiveColors.bodyColor, effectiveColors.roofColor);
packages/core/src/voxel/cityWorldObjectKit.ts:82:  const signatureTags = signatureTagsForBuilding(building, prefabFamily);
packages/core/src/voxel/cityWorldObjectKit.ts:84:    prefabFamily,
packages/core/src/voxel/cityWorldObjectKit.ts:85:    paletteRoles,
packages/core/src/voxel/cityWorldObjectKit.ts:86:    cloneGroupKey: cloneGroupKeyForBuilding(building, prefabFamily),
packages/core/src/voxel/cityWorldObjectKit.ts:87:    signatureTags,
packages/core/src/voxel/cityWorldObjectKit.ts:88:    roofBodySeparationScore,
packages/core/src/voxel/cityWorldObjectKit.ts:90:  if (prefabFamily === "commerce_strip") {
packages/core/src/voxel/cityWorldObjectKit.ts:93:  if (prefabFamily === "civic_landmark") {
packages/core/src/voxel/cityWorldObjectKit.ts:95:    metadata.landmarkSignatureScore = civicLandmarkSignatureScore(building, signatureTags);
packages/core/src/voxel/cityWorldObjectKit.ts:97:  if (prefabFamily === "service_gym") {
packages/core/src/voxel/cityWorldObjectKit.ts:106:  const objectKits = buildings.map((building) => building.objectKit ?? assignCityWorldObjectKit(building));
packages/core/src/voxel/cityWorldObjectKit.ts:107:  const prefabFamilies = countBy(objectKits, (kit) => kit.prefabFamily);
packages/core/src/voxel/cityWorldObjectKit.ts:108:  const paletteRoles = countBy(objectKits.flatMap((kit) => kit.paletteRoles), (role) => role);
packages/core/src/voxel/cityWorldObjectKit.ts:111:    homes.map((building) => building.objectKit ?? assignCityWorldObjectKit(building)),
packages/core/src/voxel/cityWorldObjectKit.ts:115:  const familyMetrics = PUBLIC_PREFAB_FAMILIES.map((family) => familyMetric(family, buildings, objectKits));
packages/core/src/voxel/cityWorldObjectKit.ts:118:  for (const family of PUBLIC_PREFAB_FAMILIES) {
packages/core/src/voxel/cityWorldObjectKit.ts:119:    if (!prefabFamilies[family]) blockers.push(`Missing public object-kit prefab family ${family}.`);
packages/core/src/voxel/cityWorldObjectKit.ts:122:    if (!paletteRoles[role]) blockers.push(`Missing public object-kit palette role ${role}.`);
packages/core/src/voxel/cityWorldObjectKit.ts:125:    if (LOUD_DEFAULT_COLORS.has(building.bodyColor.toLowerCase()) || LOUD_DEFAULT_COLORS.has(building.roofColor.toLowerCase())) {
packages/core/src/voxel/cityWorldObjectKit.ts:126:      blockers.push(`Loud/default palette token returned on ${building.id}.`);
packages/core/src/voxel/cityWorldObjectKit.ts:130:  const landmarkScores = objectKits
packages/core/src/voxel/cityWorldObjectKit.ts:131:    .filter((kit) => kit.prefabFamily === "civic_landmark")
packages/core/src/voxel/cityWorldObjectKit.ts:132:    .map((kit) => kit.landmarkSignatureScore ?? 0);
packages/core/src/voxel/cityWorldObjectKit.ts:133:  const roofBodySeparatedCount = objectKits.filter((kit) => kit.roofBodySeparationScore >= 0.42).length;
packages/core/src/voxel/cityWorldObjectKit.ts:134:  const cohesivePaletteCount = objectKits.filter((kit) => paletteCohesionPasses(kit)).length;
packages/core/src/voxel/cityWorldObjectKit.ts:135:  const [firstFamilyMetric, ...remainingFamilyMetrics] = familyMetrics;
packages/core/src/voxel/cityWorldObjectKit.ts:137:    const currentScore = familyReadinessScore(metric);
packages/core/src/voxel/cityWorldObjectKit.ts:138:    const weakestScore = familyReadinessScore(weakest);
packages/core/src/voxel/cityWorldObjectKit.ts:144:    update: "postalpha-0.34e-public-object-kit-prefab-palette-contract",
packages/core/src/voxel/cityWorldObjectKit.ts:149:      prefabAssigned: objectKits.filter(Boolean).length,
packages/core/src/voxel/cityWorldObjectKit.ts:154:      prefabFamilies,
packages/core/src/voxel/cityWorldObjectKit.ts:155:      paletteRoles,
packages/core/src/voxel/cityWorldObjectKit.ts:158:      prefabCoverageRatio: roundRatio(objectKits.length, Math.max(1, buildings.length)),
packages/core/src/voxel/cityWorldObjectKit.ts:159:      paletteCohesionRatio: roundRatio(cohesivePaletteCount, Math.max(1, objectKits.length)),
packages/core/src/voxel/cityWorldObjectKit.ts:160:      roofBodySeparationRatio: roundRatio(roofBodySeparatedCount, Math.max(1, objectKits.length)),
packages/core/src/voxel/cityWorldObjectKit.ts:162:      landmarkSignatureScore: roundMetric(Math.min(1, ...landmarkScores, 1)),
packages/core/src/voxel/cityWorldObjectKit.ts:169:    weakestPrefabFamily: weakestFamily?.prefabFamily ?? "none",
packages/core/src/voxel/cityWorldObjectKit.ts:170:    familyMetrics,
packages/core/src/voxel/cityWorldObjectKit.ts:176:  if (building.kind === "civic" || building.visualGrammar?.objectFamily === "civic_landmark") return "civic_landmark";
packages/core/src/voxel/cityWorldObjectKit.ts:177:  if (building.kind === "shop" || building.facadeStyle === "strip_store" || building.facadeStyle === "storefront") return "commerce_strip";
packages/core/src/voxel/cityWorldObjectKit.ts:178:  if (building.kind === "apartment" || building.facadeStyle === "lowrise") return "lowrise_apartment";
packages/core/src/voxel/cityWorldObjectKit.ts:179:  if (building.kind === "gym" || building.facadeStyle === "fitness" || building.visualGrammar?.objectFamily === "service_block") return "service_gym";
packages/core/src/voxel/cityWorldObjectKit.ts:180:  if (building.facadeStyle === "rowhome") return "residential_rowhome";
packages/core/src/voxel/cityWorldObjectKit.ts:181:  if (building.facadeStyle === "ranch") return "residential_ranch";
packages/core/src/voxel/cityWorldObjectKit.ts:185:function paletteRoleForMaterial(building: CityWorldBuilding): CityWorldObjectKitPaletteRole {
packages/core/src/voxel/cityWorldObjectKit.ts:193:function paletteRoleForRoof(building: CityWorldBuilding): CityWorldObjectKitPaletteRole {
packages/core/src/voxel/cityWorldObjectKit.ts:194:  const roof = building.visualGrammar?.roofProfile;
packages/core/src/voxel/cityWorldObjectKit.ts:195:  if (roof === "blue_metal_utility" || roof === "civic_glass_cap") return "glass";
packages/core/src/voxel/cityWorldObjectKit.ts:203:function signatureTagsForBuilding(building: CityWorldBuilding, prefabFamily: CityWorldObjectKitPrefabFamily): string[] {
packages/core/src/voxel/cityWorldObjectKit.ts:205:  if (building.roofShape) tags.add(`roof:${building.roofShape}`);
packages/core/src/voxel/cityWorldObjectKit.ts:206:  if (building.facadeStyle) tags.add(`facade:${building.facadeStyle}`);
packages/core/src/voxel/cityWorldObjectKit.ts:210:  if (prefabFamily === "civic_landmark") tags.add("landmark-base");
packages/core/src/voxel/cityWorldObjectKit.ts:215:    tags.add("roof-cap-hierarchy");
packages/core/src/voxel/cityWorldObjectKit.ts:217:  if (prefabFamily === "residential_rowhome") tags.add("party-wall-rhythm");
packages/core/src/voxel/cityWorldObjectKit.ts:218:  if (prefabFamily === "commerce_strip") tags.add("storefront-bay-rhythm");
packages/core/src/voxel/cityWorldObjectKit.ts:224:  if (prefabFamily === "lowrise_apartment") tags.add("stacked-window-rhythm");
packages/core/src/voxel/cityWorldObjectKit.ts:225:  if (prefabFamily === "service_gym") tags.add("service-entry-depth");
packages/core/src/voxel/cityWorldObjectKit.ts:228:    tags.add("sawtooth-service-roof");
packages/core/src/voxel/cityWorldObjectKit.ts:239:    signMountCount: isPlazaRow ? 5 : 3,
packages/core/src/voxel/cityWorldObjectKit.ts:252:    facadePierCount: isEastvaleCore ? 6 : Math.max(4, Math.round(building.width + 1)),
packages/core/src/voxel/cityWorldObjectKit.ts:254:    roofCapWeight: isEastvaleCore ? 1.24 : 0.84,
packages/core/src/voxel/cityWorldObjectKit.ts:267:    roofMonitorWeight: isEastvaleGym ? 1.18 : 0.82,
packages/core/src/voxel/cityWorldObjectKit.ts:272:function cloneGroupKeyForBuilding(building: CityWorldBuilding, prefabFamily: CityWorldObjectKitPrefabFamily): string {
packages/core/src/voxel/cityWorldObjectKit.ts:273:  // Clone groups key on what actually renders: the EFFECTIVE palette
packages/core/src/voxel/cityWorldObjectKit.ts:279:    prefabFamily,
packages/core/src/voxel/cityWorldObjectKit.ts:280:    building.facadeStyle ?? "none",
packages/core/src/voxel/cityWorldObjectKit.ts:281:    building.roofShape ?? "none",
packages/core/src/voxel/cityWorldObjectKit.ts:284:    effective.roofColor,
packages/core/src/voxel/cityWorldObjectKit.ts:285:    building.paletteKey ?? "none",
packages/core/src/voxel/cityWorldObjectKit.ts:289:function civicLandmarkSignatureScore(building: CityWorldBuilding, signatureTags: string[]): number {
packages/core/src/voxel/cityWorldObjectKit.ts:291:  const hasCivicFacade = building.facadeStyle === "civic" ? 1 : 0;
packages/core/src/voxel/cityWorldObjectKit.ts:294:  const hasSignatureTags = signatureTags.length >= 5 ? 1 : 0;
packages/core/src/voxel/cityWorldObjectKit.ts:298:function paletteCohesionPasses(kit: CityWorldObjectKitMetadata): boolean {
packages/core/src/voxel/cityWorldObjectKit.ts:299:  return kit.paletteRoles.includes("foundation") && kit.paletteRoles.length >= 2 && kit.roofBodySeparationScore >= 0.42;
packages/core/src/voxel/cityWorldObjectKit.ts:302:function familyMetric(
packages/core/src/voxel/cityWorldObjectKit.ts:303:  prefabFamily: CityWorldObjectKitPrefabFamily,
packages/core/src/voxel/cityWorldObjectKit.ts:305:  objectKits: CityWorldObjectKitMetadata[],
packages/core/src/voxel/cityWorldObjectKit.ts:307:  const familyKits = objectKits.filter((kit) => kit.prefabFamily === prefabFamily);
packages/core/src/voxel/cityWorldObjectKit.ts:308:  const familyBuildings = buildings.filter((building, index) => objectKits[index]?.prefabFamily === prefabFamily);
packages/core/src/voxel/cityWorldObjectKit.ts:309:  const familyCloneGroups = countBy(familyKits, (kit) => kit.cloneGroupKey);
packages/core/src/voxel/cityWorldObjectKit.ts:310:  const maxFamilyClone = Math.max(0, ...Object.values(familyCloneGroups));
packages/core/src/voxel/cityWorldObjectKit.ts:312:    prefabFamily,
packages/core/src/voxel/cityWorldObjectKit.ts:313:    count: familyKits.length,
packages/core/src/voxel/cityWorldObjectKit.ts:314:    paletteRoleCount: new Set(familyKits.flatMap((kit) => kit.paletteRoles)).size,
packages/core/src/voxel/cityWorldObjectKit.ts:315:    roofBodySeparationFloor: familyKits.length > 0 ? roundMetric(Math.min(...familyKits.map((kit) => kit.roofBodySeparationScore))) : 0,
packages/core/src/voxel/cityWorldObjectKit.ts:316:    clonePressure: roundRatio(maxFamilyClone, Math.max(1, familyBuildings.length)),
packages/core/src/voxel/cityWorldObjectKit.ts:317:    landmarkSignatureScore: prefabFamily === "civic_landmark" ? roundMetric(Math.min(1, ...familyKits.map((kit) => kit.landmarkSignatureScore ?? 0), 1)) : null,
packages/core/src/voxel/cityWorldObjectKit.ts:321:function familyReadinessScore(metric: CityWorldObjectKitFamilyMetric): number {
packages/core/src/voxel/cityWorldObjectKit.ts:323:  const palette = Math.min(1, metric.paletteRoleCount / 2);
packages/core/src/voxel/cityWorldObjectKit.ts:324:  const separation = metric.roofBodySeparationFloor;
packages/core/src/voxel/cityWorldObjectKit.ts:326:  const landmark = metric.landmarkSignatureScore ?? 1;
packages/core/src/voxel/cityWorldObjectKit.ts:327:  return presence * 0.32 + palette * 0.2 + separation * 0.2 + clone * 0.18 + landmark * 0.1;
packages/core/src/voxel/cityWorldObjectKit.ts:330:function colorSeparationScore(bodyColor: string, roofColor: string): number {
packages/core/src/voxel/cityWorldObjectKit.ts:332:  const roof = parseHexColor(roofColor);
packages/core/src/voxel/cityWorldObjectKit.ts:333:  if (!body || !roof) return 0;
packages/core/src/voxel/cityWorldObjectKit.ts:335:    (body.r - roof.r) ** 2 +
packages/core/src/voxel/cityWorldObjectKit.ts:336:    (body.g - roof.g) ** 2 +
packages/core/src/voxel/cityWorldObjectKit.ts:337:    (body.b - roof.b) ** 2,

codex
The compiler has better curated Eastvale density than the generated system: public scene buildings carry per-id variety, while generated/hidden drafts still mostly flow through a handful of facade/roof/kind switches. I’m narrowing this into five findings with direct line evidence.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldRegionalPalettes.ts | ForEach-Object { $i++; if ($i -ge 1 -and $i -le 145) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldObjectKit.ts | ForEach-Object { $i++; if (($i -ge 49 -and $i -le 97) -or ($i -ge 176 -and $i -le 229) -or ($i -ge 239 -and $i -le 267) -or ($i -ge 302 -and $i -le 327)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldCompiler.ts | ForEach-Object { $i++; if (($i -ge 420 -and $i -le 505) -or ($i -ge 707 -and $i -le 728) -or ($i -ge 1466 -and $i -le 1570) -or ($i -ge 1620 -and $i -le 1700)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
 succeeded in 902ms:
1: import type { GeneratedDistrictArchetype } from "./cityWorldGeneratedDistrictTypes.js";
2: 
3: export const GENERATED_DISTRICT_ARCHETYPES: readonly GeneratedDistrictArchetype[] = [
4:   "metro_grid",
5:   "coastal_grid",
6:   "desert_basin",
7:   "mountain_valley",
8:   "prairie_town",
9:   "river_town",
10: ] as const;
11: 
12: export type RegionalPalette = {
13:   archetype: GeneratedDistrictArchetype;
14:   body: readonly [string, string, string];
15:   roof: readonly [string, string, string];
16:   variantOffset?: 0 | 1 | 2;
17:   terrainTone: {
18:     paletteKey: string;
19:     base: string;
20:     shade: string;
21:     highlight: string;
22:     accent: string;
23:   };
24: };
25: 
26: export const REGIONAL_PALETTES: Record<GeneratedDistrictArchetype, RegionalPalette> = {
27:   metro_grid: {
28:     archetype: "metro_grid",
29:     body: ["#a9aca6", "#aeb8bd", "#8fb7c2"],
30:     roof: ["#666d70", "#26313a", "#b77a4f"],
31:     terrainTone: {
32:       paletteKey: "terrain.region.metro_grid",
33:       base: "#7f8987",
34:       shade: "#626b69",
35:       highlight: "#c5cbc6",
36:       accent: "#6e7470",
37:     },
38:   },
39:   coastal_grid: {
40:     archetype: "coastal_grid",
41:     body: ["#f4ead6", "#d9c69f", "#e8f0e8"],
42:     roof: ["#2f526d", "#3f7f82", "#66727a"],
43:     terrainTone: {
44:       paletteKey: "terrain.region.coastal_grid",
45:       base: "#d8cfa7",
46:       shade: "#b8ac81",
47:       highlight: "#f2e7c3",
48:       accent: "#7fa58e",
49:     },
50:   },
51:   desert_basin: {
52:     archetype: "desert_basin",
53:     body: ["#d9b27c", "#c98f62", "#ead09a"],
54:     roof: ["#b65f38", "#8f4b32", "#c77a45"],
55:     terrainTone: {
56:       paletteKey: "terrain.region.desert_basin",
57:       base: "#cdbb82",
58:       shade: "#a78f5e",
59:       highlight: "#eadcae",
60:       accent: "#8fa16f",
61:     },
62:   },
63:   mountain_valley: {
64:     archetype: "mountain_valley",
65:     body: ["#8a6a4a", "#6f5b42", "#6f7650"],
66:     roof: ["#56616a", "#244d34", "#4e514f"],
67:     terrainTone: {
68:       paletteKey: "terrain.region.mountain_valley",
69:       base: "#4f6f3f",
70:       shade: "#334e31",
71:       highlight: "#a8b990",
72:       accent: "#7d8174",
73:     },
74:   },
75:   prairie_town: {
76:     archetype: "prairie_town",
77:     body: ["#d6b65e", "#a94f3e", "#ead9b5"],
78:     roof: ["#a43f32", "#8e938b", "#5f7c48"],
79:     terrainTone: {
80:       paletteKey: "terrain.region.prairie_town",
81:       base: "#9fa94d",
82:       shade: "#747d39",
83:       highlight: "#d8df88",
84:       accent: "#8c6f4c",
85:     },
86:   },
87:   river_town: {
88:     archetype: "river_town",
89:     body: ["#8b9275", "#c99a55", "#a8563d"],
90:     roof: ["#2f5d8a", "#577747", "#9a927d"],
91:     terrainTone: {
92:       paletteKey: "terrain.region.river_town",
93:       base: "#4d8f83",
94:       shade: "#37675e",
95:       highlight: "#98beb7",
96:       accent: "#866f4f",
97:     },
98:   },
99: };
100: 
101: export function regionalBuildingPaletteKey(archetype: GeneratedDistrictArchetype, variant: number): string {
102:   return `building.region.${archetype}.v${variant + 1}`;
103: }
104: 
105: export function regionalTerrainPaletteKey(archetype: GeneratedDistrictArchetype): string {
106:   return REGIONAL_PALETTES[archetype].terrainTone.paletteKey;
107: }
108: 
109: export function resolveRegionalBuildingPalette(
110:   palette: RegionalPalette,
111:   bodyIndex: number,
112:   roofIndex: number,
113: ): { bodyColor: string; roofColor: string; paletteKey: string; variant: number } {
114:   const variant = (bodyIndex + roofIndex + (palette.variantOffset ?? 0)) % palette.body.length;
115:   return {
116:     bodyColor: colorAt(palette.body, variant),
117:     roofColor: colorAt(palette.roof, variant),
118:     paletteKey: regionalBuildingPaletteKey(palette.archetype, variant),
119:     variant,
120:   };
121: }
122: 
123: export type RegionalBuildingPaletteColors = {
124:   base: string;
125:   shade: string;
126:   highlight: string;
127:   roof: string;
128:   trim: string;
129: };
130: 
131: export const REGIONAL_BUILDING_PALETTES: Record<string, RegionalBuildingPaletteColors> = Object.fromEntries(
132:   GENERATED_DISTRICT_ARCHETYPES.flatMap((archetype) => {
133:     const palette = REGIONAL_PALETTES[archetype];
134:     return palette.body.map((bodyColor, index) => [
135:       regionalBuildingPaletteKey(archetype, index),
136:       {
137:         base: bodyColor,
138:         shade: shadeHex(bodyColor, -0.18),
139:         highlight: shadeHex(bodyColor, 0.18),
140:         roof: colorAt(palette.roof, index),
141:         trim: shadeHex(colorAt(palette.roof, index), -0.18),
142:       },
143:     ]);
144:   }),
145: );

 succeeded in 903ms:
49:   familyMetrics: CityWorldObjectKitFamilyMetric[];
50:   blockers: string[];
51: };
52: 
53: const PUBLIC_PREFAB_FAMILIES: CityWorldObjectKitPrefabFamily[] = [
54:   "civic_landmark",
55:   "residential_cottage",
56:   "residential_ranch",
57:   "residential_rowhome",
58:   "commerce_strip",
59:   "lowrise_apartment",
60:   "service_gym",
61: ];
62: 
63: const REQUIRED_PALETTE_ROLES: CityWorldObjectKitPaletteRole[] = [
64:   "stucco",
65:   "terracotta",
66:   "glass",
67:   "foundation",
68: ];
69: 
70: const LOUD_DEFAULT_COLORS = new Set(["#e05d45", "#73a7d6", "#d95f45", "#4f92b8", "#6da76f", "#e0bd4e", "#895c9e", "#77b8d5"]);
71: 
72: export function assignCityWorldObjectKit(building: CityWorldBuilding): CityWorldObjectKitMetadata {
73:   const prefabFamily = inferPrefabFamily(building);
74:   const paletteRoles = uniquePaletteRoles([
75:     paletteRoleForMaterial(building),
76:     paletteRoleForRoof(building),
77:     "foundation",
78:     ...(prefabFamily === "commerce_strip" || prefabFamily === "service_gym" || prefabFamily === "civic_landmark" ? ["glass" as const] : []),
79:   ]);
80:   const effectiveColors = resolveEffectiveBuildingColors(building);
81:   const roofBodySeparationScore = colorSeparationScore(effectiveColors.bodyColor, effectiveColors.roofColor);
82:   const signatureTags = signatureTagsForBuilding(building, prefabFamily);
83:   const metadata: CityWorldObjectKitMetadata = {
84:     prefabFamily,
85:     paletteRoles,
86:     cloneGroupKey: cloneGroupKeyForBuilding(building, prefabFamily),
87:     signatureTags,
88:     roofBodySeparationScore,
89:   };
90:   if (prefabFamily === "commerce_strip") {
91:     metadata.commerceGeometry = commerceStripPrefabGeometry(building);
92:   }
93:   if (prefabFamily === "civic_landmark") {
94:     metadata.civicGeometry = civicLandmarkPrefabGeometry(building);
95:     metadata.landmarkSignatureScore = civicLandmarkSignatureScore(building, signatureTags);
96:   }
97:   if (prefabFamily === "service_gym") {
176:   if (building.kind === "civic" || building.visualGrammar?.objectFamily === "civic_landmark") return "civic_landmark";
177:   if (building.kind === "shop" || building.facadeStyle === "strip_store" || building.facadeStyle === "storefront") return "commerce_strip";
178:   if (building.kind === "apartment" || building.facadeStyle === "lowrise") return "lowrise_apartment";
179:   if (building.kind === "gym" || building.facadeStyle === "fitness" || building.visualGrammar?.objectFamily === "service_block") return "service_gym";
180:   if (building.facadeStyle === "rowhome") return "residential_rowhome";
181:   if (building.facadeStyle === "ranch") return "residential_ranch";
182:   return "residential_cottage";
183: }
184: 
185: function paletteRoleForMaterial(building: CityWorldBuilding): CityWorldObjectKitPaletteRole {
186:   const material = building.visualGrammar?.materialProfile;
187:   if (material === "civic_glass_stucco") return "glass";
188:   if (material === "socal_storefront") return "glass";
189:   if (building.kind === "shop" || building.kind === "gym") return "glass";
190:   return "stucco";
191: }
192: 
193: function paletteRoleForRoof(building: CityWorldBuilding): CityWorldObjectKitPaletteRole {
194:   const roof = building.visualGrammar?.roofProfile;
195:   if (roof === "blue_metal_utility" || roof === "civic_glass_cap") return "glass";
196:   return "terracotta";
197: }
198: 
199: function uniquePaletteRoles(roles: CityWorldObjectKitPaletteRole[]): CityWorldObjectKitPaletteRole[] {
200:   return [...new Set(roles)];
201: }
202: 
203: function signatureTagsForBuilding(building: CityWorldBuilding, prefabFamily: CityWorldObjectKitPrefabFamily): string[] {
204:   const tags = new Set<string>();
205:   if (building.roofShape) tags.add(`roof:${building.roofShape}`);
206:   if (building.facadeStyle) tags.add(`facade:${building.facadeStyle}`);
207:   if (building.visualGrammar?.clusterRole) tags.add(`role:${building.visualGrammar.clusterRole}`);
208:   if (building.width >= 3 || building.depth >= 2) tags.add("broad-footprint");
209:   if (building.height >= 2.4) tags.add("tall-silhouette");
210:   if (prefabFamily === "civic_landmark") tags.add("landmark-base");
211:   if (building.id === "building-civic") {
212:     tags.add("eastvale-core-focus");
213:     tags.add("tiered-civic-plinth");
214:     tags.add("civic-entry-rhythm");
215:     tags.add("roof-cap-hierarchy");
216:   }
217:   if (prefabFamily === "residential_rowhome") tags.add("party-wall-rhythm");
218:   if (prefabFamily === "commerce_strip") tags.add("storefront-bay-rhythm");
219:   if (building.id === "building-plaza-strip") {
220:     tags.add("plaza-row-focus");
221:     tags.add("deep-storefront-apron");
222:     tags.add("continuous-parapet");
223:   }
224:   if (prefabFamily === "lowrise_apartment") tags.add("stacked-window-rhythm");
225:   if (prefabFamily === "service_gym") tags.add("service-entry-depth");
226:   if (building.id === "building-gym") {
227:     tags.add("eastvale-gym-focus");
228:     tags.add("sawtooth-service-roof");
229:     tags.add("recessed-service-entry");
239:     signMountCount: isPlazaRow ? 5 : 3,
240:     apronDepth: isPlazaRow ? 0.4 : 0.24,
241:     glassRecessDepth: isPlazaRow ? 0.42 : 0.24,
242:     parapetWeight: isPlazaRow ? 1.18 : 0.72,
243:     ...(isPlazaRow ? { focusTarget: "plaza_row" as const } : {}),
244:   };
245: }
246: 
247: function civicLandmarkPrefabGeometry(building: CityWorldBuilding): NonNullable<CityWorldObjectKitMetadata["civicGeometry"]> {
248:   const isEastvaleCore = building.id === "building-civic";
249:   return {
250:     plinthTierCount: isEastvaleCore ? 3 : 2,
251:     entryBayCount: isEastvaleCore ? 5 : Math.max(3, Math.round(building.width)),
252:     facadePierCount: isEastvaleCore ? 6 : Math.max(4, Math.round(building.width + 1)),
253:     glassBandCount: isEastvaleCore ? 3 : 2,
254:     roofCapWeight: isEastvaleCore ? 1.24 : 0.84,
255:     civicCanopyDepth: isEastvaleCore ? 0.34 : 0.24,
256:     ...(isEastvaleCore ? { focusTarget: "eastvale_core" as const } : {}),
257:   };
258: }
259: 
260: function serviceGymPrefabGeometry(building: CityWorldBuilding): NonNullable<CityWorldObjectKitMetadata["serviceGeometry"]> {
261:   const isEastvaleGym = building.id === "building-gym";
262:   return {
263:     serviceBayCount: isEastvaleGym ? 4 : Math.max(3, Math.round(building.width)),
264:     sawtoothCount: isEastvaleGym ? 5 : 3,
265:     entryRecessDepth: isEastvaleGym ? 0.34 : 0.22,
266:     utilityApronDepth: isEastvaleGym ? 0.42 : 0.26,
267:     roofMonitorWeight: isEastvaleGym ? 1.18 : 0.82,
302: function familyMetric(
303:   prefabFamily: CityWorldObjectKitPrefabFamily,
304:   buildings: CityWorldBuilding[],
305:   objectKits: CityWorldObjectKitMetadata[],
306: ): CityWorldObjectKitFamilyMetric {
307:   const familyKits = objectKits.filter((kit) => kit.prefabFamily === prefabFamily);
308:   const familyBuildings = buildings.filter((building, index) => objectKits[index]?.prefabFamily === prefabFamily);
309:   const familyCloneGroups = countBy(familyKits, (kit) => kit.cloneGroupKey);
310:   const maxFamilyClone = Math.max(0, ...Object.values(familyCloneGroups));
311:   return {
312:     prefabFamily,
313:     count: familyKits.length,
314:     paletteRoleCount: new Set(familyKits.flatMap((kit) => kit.paletteRoles)).size,
315:     roofBodySeparationFloor: familyKits.length > 0 ? roundMetric(Math.min(...familyKits.map((kit) => kit.roofBodySeparationScore))) : 0,
316:     clonePressure: roundRatio(maxFamilyClone, Math.max(1, familyBuildings.length)),
317:     landmarkSignatureScore: prefabFamily === "civic_landmark" ? roundMetric(Math.min(1, ...familyKits.map((kit) => kit.landmarkSignatureScore ?? 0), 1)) : null,
318:   };
319: }
320: 
321: function familyReadinessScore(metric: CityWorldObjectKitFamilyMetric): number {
322:   const presence = metric.count > 0 ? 1 : 0;
323:   const palette = Math.min(1, metric.paletteRoleCount / 2);
324:   const separation = metric.roofBodySeparationFloor;
325:   const clone = 1 - metric.clonePressure;
326:   const landmark = metric.landmarkSignatureScore ?? 1;
327:   return presence * 0.32 + palette * 0.2 + separation * 0.2 + clone * 0.18 + landmark * 0.1;

 succeeded in 964ms:
420:   facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
421:   roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
422:   detailLevel?: NonNullable<CityWorldBuilding["detailLevel"]>;
423: };
424: 
425: const DRAFT_ANCHOR_BUILDING_SPECS: Record<string, DraftBuildingSpec[]> = {
426:   "platinum-triangle-area": [
427:     { suffix: "rowhome-street", offset: { x: -2.15, y: -0.5 }, kind: "home", width: 3.8, depth: 1.12, height: 1.52, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
428:     { suffix: "lowrise-courtyard", offset: { x: 1.26, y: -0.38 }, kind: "apartment", width: 2.8, depth: 1.9, height: 2.18, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
429:     { suffix: "mixed-use-edge", offset: { x: 0.06, y: 1.68 }, kind: "shop", width: 3.15, depth: 1.18, height: 1.08, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
430:   ],
431:   "anaheim-convention-center": [
432:     { suffix: "exhibit-hall-west", offset: { x: -2.55, y: -0.38 }, kind: "civic", width: 5.45, depth: 1.86, height: 1.04, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
433:     { suffix: "exhibit-hall-east", offset: { x: 2.2, y: -0.02 }, kind: "civic", width: 5.35, depth: 1.82, height: 1.1, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
434:     {
435:       suffix: "entry-spine",
436:       offset: { x: 0.18, y: 1.58 },
437:       kind: "civic",
438:       width: 4.75,
439:       depth: 0.94,
440:       height: 0.82,
441:       facadeStyle: "civic",
442:       roofShape: "hip",
443:       detailLevel: "high",
444:     },
445:     { suffix: "glass-arcade-front", offset: { x: -2.2, y: 1.48 }, kind: "civic", width: 2.9, depth: 0.72, height: 0.58, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
446:     { suffix: "frontage-wing", offset: { x: 3.22, y: 1.36 }, kind: "civic", width: 2.55, depth: 0.9, height: 0.72, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
447:   ],
448:   "artic-transit-center": [
449:     { suffix: "terminal-shed", offset: { x: -1.32, y: -0.22 }, kind: "gym", width: 7.15, depth: 1.74, height: 1.95, facadeStyle: "fitness", roofShape: "sawtooth", detailLevel: "high" },
450:     { suffix: "platform-edge", offset: { x: -1.15, y: 1.05 }, kind: "civic", width: 5.85, depth: 0.64, height: 0.42, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
451:     { suffix: "ticket-hall", offset: { x: -0.18, y: 1.18 }, kind: "civic", width: 2.55, depth: 1.02, height: 0.92, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
452:     { suffix: "clock-tower", offset: { x: -0.06, y: -0.62 }, kind: "civic", width: 0.86, depth: 0.86, height: 3.82, facadeStyle: "civic", roofShape: "tower", detailLevel: "high" },
453:   ],
454:   "angel-stadium": [
455:     { suffix: "venue-bowl-west", offset: { x: -2.02, y: -0.28 }, kind: "civic", width: 4.9, depth: 3.48, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
456:     { suffix: "venue-bowl-east", offset: { x: 1.96, y: -0.02 }, kind: "civic", width: 4.82, depth: 3.36, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "high" },
457:     { suffix: "homeplate-gate", offset: { x: -0.24, y: 1.96 }, kind: "civic", width: 2.45, depth: 1.16, height: 1.0, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
458:     { suffix: "event-gate-east", offset: { x: 2.68, y: 1.45 }, kind: "civic", width: 1.85, depth: 0.95, height: 0.76, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
459:   ],
460:   "downtown-anaheim-community-center": [
461:     { suffix: "community-hall", offset: { x: -0.72, y: -0.05 }, kind: "civic", width: 3.05, depth: 1.62, height: 1.24, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
462:     { suffix: "classroom-wing", offset: { x: 1.48, y: 0.82 }, kind: "civic", width: 2.1, depth: 0.98, height: 0.84, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
463:     { suffix: "front-porch", offset: { x: 0.35, y: 1.45 }, kind: "civic", width: 1.55, depth: 0.82, height: 0.66, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
464:   ],
465:   "ontario-inland-residential-variety": [
466:     { suffix: "rowhome-street", offset: { x: -2.25, y: -0.55 }, kind: "home", width: 3.75, depth: 1.08, height: 1.45, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
467:     { suffix: "ranch-court-west", offset: { x: 0.75, y: -0.72 }, kind: "home", width: 2.15, depth: 1.45, height: 1.05, facadeStyle: "ranch", roofShape: "hip", detailLevel: "medium" },
468:     { suffix: "ranch-court-east", offset: { x: 2.35, y: 0.65 }, kind: "home", width: 2.05, depth: 1.38, height: 0.96, facadeStyle: "ranch", roofShape: "gable", detailLevel: "medium" },
469:     { suffix: "cottage-court", offset: { x: -1.05, y: 0.72 }, kind: "home", width: 1.4, depth: 1.15, height: 1.28, facadeStyle: "cottage", roofShape: "gable", detailLevel: "medium" },
470:     { suffix: "lowrise-edge", offset: { x: -0.35, y: 1.55 }, kind: "apartment", width: 2.65, depth: 1.72, height: 1.88, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
471:   ],
472:   "ontario-mills-commercial-anchor": [
473:     { suffix: "retail-hall-west", offset: { x: -2.15, y: -0.18 }, kind: "shop", width: 4.15, depth: 1.55, height: 1.02, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
474:     { suffix: "retail-hall-east", offset: { x: 1.9, y: -0.05 }, kind: "shop", width: 4.0, depth: 1.5, height: 1.0, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
475:     { suffix: "entry-court", offset: { x: 0.15, y: 1.36 }, kind: "shop", width: 2.6, depth: 0.95, height: 0.72, facadeStyle: "storefront", roofShape: "hip", detailLevel: "high" },
476:   ],
477:   "ontario-international-airport": [
478:     { suffix: "terminal-hall", offset: { x: -1.95, y: -0.18 }, kind: "civic", width: 4.75, depth: 1.42, height: 1.2, facadeStyle: "civic", roofShape: "sawtooth", detailLevel: "high" },
479:     { suffix: "logistics-apron-wing", offset: { x: 1.88, y: 0.1 }, kind: "shop", width: 3.45, depth: 1.36, height: 0.82, facadeStyle: "storefront", roofShape: "flat", detailLevel: "medium" },
480:     { suffix: "control-tower", offset: { x: 2.35, y: -0.95 }, kind: "civic", width: 0.96, depth: 0.96, height: 2.95, facadeStyle: "civic", roofShape: "tower", detailLevel: "high" },
481:   ],
482:   "ontario-civic-center-core": [
483:     { suffix: "civic-hall", offset: { x: -1.05, y: -0.18 }, kind: "civic", width: 3.2, depth: 1.7, height: 1.36, facadeStyle: "civic", roofShape: "hip", detailLevel: "high" },
484:     { suffix: "office-wing", offset: { x: 1.55, y: 0.8 }, kind: "civic", width: 2.25, depth: 1.1, height: 1.05, facadeStyle: "civic", roofShape: "flat", detailLevel: "medium" },
485:   ],
486:   "ontario-downtown-service-core": [
487:     { suffix: "service-row", offset: { x: -1.2, y: -0.15 }, kind: "shop", width: 3.25, depth: 1.1, height: 0.98, facadeStyle: "strip_store", roofShape: "flat", detailLevel: "high" },
488:     { suffix: "mixed-lowrise", offset: { x: 1.25, y: 0.95 }, kind: "apartment", width: 2.25, depth: 1.45, height: 1.65, facadeStyle: "lowrise", roofShape: "flat", detailLevel: "high" },
489:   ],
490: };
491: 
492: function createDraftDistrictBuildings(anchors: DistrictPlaceAnchor[], positions: Map<string, CityWorldPoint>): CityWorldBuilding[] {
493:   const buildings: CityWorldBuilding[] = [];
494: 
495:   for (const anchor of anchors) {
496:     const position = positions.get(anchor.id) ?? { x: 10, y: 10, z: 0 };
497:     const anchorSpecs = DRAFT_ANCHOR_BUILDING_SPECS[anchor.id];
498:     if (anchorSpecs) {
499:       buildings.push(...anchorSpecs.map((spec) => createDraftBuildingFromSpec(anchor, position, spec)));
500:       continue;
501:     }
502:     buildings.push(createDraftBuilding(anchor, anchor.id, position, draftBuildingKind(anchor.category), draftBuildingWidth(anchor.category), draftBuildingDepth(anchor.category), draftBuildingHeight(anchor.category), draftFacade(anchor.category), draftRoof(anchor.category)));
503:   }
504: 
505:   return buildings.map(withBuildingMetadata);
707: function draftFacade(category: WorldPlaceCategory): NonNullable<CityWorldBuilding["facadeStyle"]> {
708:   if (category === "home_area") return "rowhome";
709:   if (category === "transit" || category === "civic" || category === "entertainment" || category === "landmark") return "civic";
710:   return "strip_store";
711: }
712: 
713: function draftRoof(category: WorldPlaceCategory): NonNullable<CityWorldBuilding["roofShape"]> {
714:   if (category === "home_area") return "flat";
715:   if (category === "transit" || category === "entertainment") return "tower";
716:   return "flat";
717: }
718: 
719: function draftBuildingPaletteKey(
720:   kind: CityWorldBuilding["kind"],
721:   facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>,
722: ): string {
723:   if (kind === "home" && facadeStyle === "rowhome") return "building.house.rowhome.flat_parapet.v1";
724:   if (kind === "home" && facadeStyle === "ranch") return "building.house.ranch.v1";
725:   if (kind === "home" && facadeStyle === "cottage") return "building.house.cottage.v1";
726:   if (kind === "shop" && facadeStyle === "strip_store") return "building.store.strip.three_bay.v1";
727:   if (kind === "apartment" && facadeStyle === "lowrise") return "building.apartment.lowrise.stepped.v1";
728:   if (kind === "gym") return "building.gym.2";
1466:   if (lot.id.startsWith("draft-lot-")) return "hidden_draft_anchor_pad";
1467:   if (lot.kind === "home") return "home_yard_grid";
1468:   if (lot.kind === "shop" || lot.kind === "gym") return "commercial_apron";
1469:   if (lot.kind === "civic") return "civic_landmark_plinth";
1470:   if (lot.kind === "apartments") return "apartment_court_grid";
1471:   if (lot.kind === "waterfront") return "waterfront_bank";
1472:   return "park_path_basin";
1473: }
1474: 
1475: function parcelElevationProfile(lot: CityWorldLot): NonNullable<CityWorldVisualGrammar["parcelElevation"]> {
1476:   if (lot.id.startsWith("draft-lot-")) return "hidden_anchor_shelf";
1477:   if (lot.kind === "home") return lot.id.startsWith("lot-home-") ? "raised_home_shelf" : "thin_pad_lip";
1478:   if (lot.kind === "shop" || lot.kind === "gym") return "commercial_slab_lip";
1479:   if (lot.kind === "civic") return "civic_plinth_stack";
1480:   if (lot.kind === "apartments") return "apartment_court_lip";
1481:   if (lot.kind === "waterfront") return "waterfront_bank_cut";
1482:   return "park_basin_lip";
1483: }
1484: 
1485: function buildingVisualGrammar(
1486:   building: CityWorldBuilding,
1487:   roofShape: CityWorldBuilding["roofShape"],
1488:   facadeStyle: CityWorldBuilding["facadeStyle"],
1489:   detailLevel: NonNullable<CityWorldBuilding["detailLevel"]>,
1490: ): CityWorldVisualGrammar {
1491:   const objectFamily = buildingObjectFamily(building, roofShape, facadeStyle);
1492:   const materialProfile = buildingMaterialProfile(building, facadeStyle);
1493:   const roofProfile = buildingRoofProfile(building, roofShape, facadeStyle);
1494: 
1495:   return {
1496:     materialProfile,
1497:     roofProfile,
1498:     objectFamily,
1499:     clusterRole: buildingClusterRole(building, objectFamily, facadeStyle),
1500:     noLabelPriority: buildingNoLabelPriority(building, roofShape, objectFamily, detailLevel),
1501:     contactProfile: building.kind === "civic" ? "landmark_base_shadow" : "parcel_pad_shadow",
1502:   };
1503: }
1504: 
1505: function buildingMaterialProfile(
1506:   building: CityWorldBuilding,
1507:   facadeStyle: CityWorldBuilding["facadeStyle"],
1508: ): NonNullable<CityWorldVisualGrammar["materialProfile"]> {
1509:   if (building.kind === "civic") return "civic_glass_stucco";
1510:   if (building.kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return "socal_storefront";
1511:   if (building.kind === "apartment" || facadeStyle === "lowrise") return "socal_lowrise";
1512:   if (facadeStyle === "ranch") return "socal_cool_stucco";
1513:   if (facadeStyle === "rowhome") return "socal_stucco_light";
1514:   return "socal_stucco_warm";
1515: }
1516: 
1517: function buildingRoofProfile(
1518:   building: CityWorldBuilding,
1519:   roofShape: CityWorldBuilding["roofShape"],
1520:   facadeStyle: CityWorldBuilding["facadeStyle"],
1521: ): NonNullable<CityWorldVisualGrammar["roofProfile"]> {
1522:   if (roofShape === "tower") {
1523:     return building.kind === "civic" && facadeStyle === "civic" ? "civic_glass_cap" : "blue_metal_utility";
1524:   }
1525:   if (building.kind === "civic") return "blue_metal_utility";
1526:   if (roofShape === "flat") return "flat_parapet_cap";
1527:   if (facadeStyle === "ranch") return "sage_tile";
1528:   if (roofShape === "hip") return "cool_clay_tile";
1529:   if (roofShape === "sawtooth") return "blue_metal_utility";
1530:   return "terracotta_barrel_tile";
1531: }
1532: 
1533: function buildingObjectFamily(
1534:   building: CityWorldBuilding,
1535:   roofShape: CityWorldBuilding["roofShape"],
1536:   facadeStyle: CityWorldBuilding["facadeStyle"],
1537: ): NonNullable<CityWorldVisualGrammar["objectFamily"]> {
1538:   const id = building.id;
1539:   if (id.includes("anaheim-convention-center") || id.includes("angel-stadium")) return "venue_anchor";
1540:   if (id.includes("artic-transit-center") || id.includes("ontario-international-airport")) return "transit_anchor";
1541:   if (id.includes("platinum-triangle")) return "lowrise_cluster";
1542: 
1543:   const base = buildingAuthoredObjectFamily(building, roofShape, facadeStyle);
1544:   if ((base === "residential_kit" || base === "civic_landmark") && id.includes("downtown-service")) return "service_block";
1545:   return base;
1546: }
1547: 
1548: function buildingAuthoredObjectFamily(
1549:   building: CityWorldBuilding,
1550:   roofShape: CityWorldBuilding["roofShape"],
1551:   facadeStyle: CityWorldBuilding["facadeStyle"],
1552: ): NonNullable<CityWorldVisualGrammar["objectFamily"]> {
1553:   if (building.kind !== "civic" && roofShape === "tower") return "service_block";
1554:   if (building.kind === "apartment" || facadeStyle === "lowrise") return "lowrise_cluster";
1555:   if (building.kind === "shop" || facadeStyle === "strip_store" || facadeStyle === "storefront") return "commerce_strip";
1556:   if (building.kind === "gym" || facadeStyle === "fitness") return "service_block";
1557:   if (building.kind === "civic" || facadeStyle === "civic") return "civic_landmark";
1558:   return "residential_kit";
1559: }
1560: 
1561: function buildingClusterRole(
1562:   building: CityWorldBuilding,
1563:   objectFamily: NonNullable<CityWorldVisualGrammar["objectFamily"]>,
1564:   facadeStyle: CityWorldBuilding["facadeStyle"],
1565: ): NonNullable<CityWorldVisualGrammar["clusterRole"]> {
1566:   if (objectFamily === "civic_landmark" || objectFamily === "venue_anchor" || objectFamily === "transit_anchor") return "anchor";
1567:   if (objectFamily === "commerce_strip" || facadeStyle === "rowhome") return "edge";
1568:   if (objectFamily === "lowrise_cluster" || objectFamily === "service_block") return "support";
1569:   if (building.id.includes("north") || building.id.includes("west")) return "fabric";
1570:   return "support";
1620: 
1621: export function withBuildingMetadata(building: CityWorldBuilding): CityWorldBuilding {
1622:   const variant = hashId(building.id);
1623:   const roofShape =
1624:     building.roofShape ??
1625:     (building.kind === "home"
1626:       ? variant % 3 === 0
1627:         ? "hip"
1628:         : "gable"
1629:       : building.kind === "shop"
1630:         ? "flat"
1631:         : building.kind === "gym"
1632:           ? "sawtooth"
1633:           : building.kind === "apartment"
1634:             ? "hip"
1635:             : "tower");
1636:   const facadeStyle =
1637:     building.facadeStyle ??
1638:     (building.kind === "home"
1639:       ? "suburban"
1640:       : building.kind === "shop"
1641:         ? "storefront"
1642:         : building.kind === "gym"
1643:           ? "fitness"
1644:           : building.kind === "apartment"
1645:             ? "apartment"
1646:             : "civic");
1647:   const detailLevel = building.detailLevel ?? (building.kind === "home" ? "medium" : "high");
1648: 
1649:   const buildingWithVisualGrammar: CityWorldBuilding = {
1650:     ...building,
1651:     spriteKey: building.spriteKey ?? resolveBuildingSpriteKey(building, roofShape, facadeStyle, variant),
1652:     paletteKey: building.paletteKey ?? resolveBuildingPaletteKey(building, facadeStyle, variant),
1653:     roofShape,
1654:     facadeStyle,
1655:     detailLevel,
1656:     visualGrammar: buildingVisualGrammar(building, roofShape, facadeStyle, detailLevel),
1657:   };
1658: 
1659:   return {
1660:     ...buildingWithVisualGrammar,
1661:     objectKit: assignCityWorldObjectKit(buildingWithVisualGrammar),
1662:   };
1663: }
1664: 
1665: function resolveBuildingSpriteKey(building: CityWorldBuilding, roofShape: CityWorldBuilding["roofShape"], facadeStyle: CityWorldBuilding["facadeStyle"], variant: number): string {
1666:   if (building.kind === "home" && facadeStyle === "cottage") return "building.house.cottage.front_gable.v1";
1667:   if (building.kind === "home" && facadeStyle === "ranch") return "building.house.ranch.low_gable.v1";
1668:   if (building.kind === "home" && facadeStyle === "rowhome") return "building.house.rowhome.flat_parapet.v1";
1669:   if (building.kind === "shop" && facadeStyle === "strip_store") return "building.store.strip.three_bay.v1";
1670:   if (building.kind === "apartment" && facadeStyle === "lowrise") return "building.apartment.lowrise.stepped.v1";
1671:   return `building.${building.kind}.${roofShape}.${variant % 4}`;
1672: }
1673: 
1674: // Number of authored palette-variant ramps available per family in the atlas
1675: // manifest. Identity is assigned from the palette system (hash -> variant) so
1676: // it survives the renderer's manifest-palette resolution â€” the 0.34e cohesion
1677: // contract stays intact because every ramp is an authored muted SoCal palette,
1678: // not a raw per-building color override.
1679: const BUILDING_PALETTE_VARIANT_COUNTS = {
1680:   cottage: 4,
1681:   ranch: 3,
1682:   rowhome: 2,
1683:   lowrise: 3,
1684:   strip_store: 3,
1685:   gym: 2,
1686: } as const;
1687: 
1688: function paletteVariantSuffix(variant: number, count: number): string {
1689:   return `v${(variant % count) + 1}`;
1690: }
1691: 
1692: function resolveBuildingPaletteKey(building: CityWorldBuilding, facadeStyle: CityWorldBuilding["facadeStyle"], variant: number): string {
1693:   if (building.kind === "home" && facadeStyle === "cottage") return `building.house.cottage.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.cottage)}`;
1694:   if (building.kind === "home" && facadeStyle === "ranch") return `building.house.ranch.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.ranch)}`;
1695:   if (building.kind === "home" && facadeStyle === "rowhome") return `building.house.rowhome.flat_parapet.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.rowhome)}`;
1696:   if (building.kind === "home" && facadeStyle) return `building.house.${facadeStyle}.v1`;
1697:   if (building.kind === "shop" && facadeStyle === "strip_store") return `building.store.strip.three_bay.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.strip_store)}`;
1698:   if (building.kind === "apartment" && facadeStyle === "lowrise") return `building.apartment.lowrise.stepped.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.lowrise)}`;
1699:   if (building.kind === "gym") return `building.gym.sawtooth.${paletteVariantSuffix(variant, BUILDING_PALETTE_VARIANT_COUNTS.gym)}`;
1700:   return `building.${building.kind}.${variant % 6}`;

codex
The thinnest art system is not just “needs more polish”; it’s structural. Region identity is mostly color, generated city form is mostly fixed rectangles/straight roads, and the richest shape language is still anchored to a few named curated IDs.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldParametricGenerator.ts | ForEach-Object { $i++; if (($i -ge 1880 -and $i -le 2000) -or ($i -ge 2003 -and $i -le 2238) -or ($i -ge 2885 -and $i -le 3060)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldTerrainSampler.ts | ForEach-Object { $i++; if ($i -ge 1 -and $i -le 260) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts | ForEach-Object { $i++; if (($i -ge 53 -and $i -le 181) -or ($i -ge 197 -and $i -le 283) -or ($i -ge 428 -and $i -le 473)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldDerivedTerrainMap.ts | ForEach-Object { $i++; if (($i -ge 193 -and $i -le 237) -or ($i -ge 444 -and $i -le 463)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
 succeeded in 670ms:
193:   park: "#87b86e",
194:   plaza: "#c8baa1",
195:   water: "#5e9fc5",
196:   sidewalk: "#b9b7aa",
197:   empty: "#1f2937",
198: };
199: 
200: const TERRAIN_BASE_HEIGHT: Record<CityWorldTerrainKind | "empty", number> = {
201:   grass: 0,
202:   park: 0.08,
203:   plaza: 0.12,
204:   water: -0.35,
205:   sidewalk: 0.06,
206:   empty: 0,
207: };
208: 
209: const TERRAIN_ELEVATION_HEIGHT: Record<string, number> = {
210:   flat_field: 0,
211:   raised_parcel_shelf: 0.42,
212:   civic_plinth_shelf: 0.72,
213:   commercial_slab_field: 0.48,
214:   park_basin_shelf: 0.22,
215:   water_edge_cut: -0.28,
216:   shell_flat: 0,
217:   hidden_draft_shelf: 0.46,
218: };
219: 
220: const TERRAIN_MASSING_HEIGHT: Record<string, number> = {
221:   none: 0,
222:   outer_world_edge_mass: 0.72,
223:   civic_plinth_mass: 0.86,
224:   residential_shelf_mass: 0.48,
225:   commercial_slab_mass: 0.52,
226:   park_basin_cut_mass: -0.16,
227:   waterfront_bank_cut_mass: -0.22,
228:   shell_boundary_mass: 0.18,
229:   hidden_draft_mass: 0.5,
230: };
231: 
232: const CHUNK_EDGE_HEIGHT: Record<string, number> = {
233:   none: 0,
234:   world_edge: 0.2,
235:   parcel_cluster_edge: 0.16,
236:   waterfront_bank_edge: -0.12,
237:   park_basin_edge: -0.08,
444:   const terrainHeight = TERRAIN_BASE_HEIGHT[kind] +
445:     lookupHeight(TERRAIN_ELEVATION_HEIGHT, grammar?.terrainElevation) +
446:     lookupHeight(TERRAIN_MASSING_HEIGHT, grammar?.terrainChunkMassing) +
447:     lookupHeight(CHUNK_EDGE_HEIGHT, grammar?.chunkEdge);
448:   const occupancyHeight = Math.min(0.55, lotCount * 0.08 + roadCount * 0.04 + buildingCount * 0.22);
449:   return roundTerrainMetric(cityWorldClamp(terrainHeight + occupancyHeight, -1, 3));
450: }
451: 
452: function deriveCellColorKey(tile: CityWorldTerrainTile | undefined, lotCount: number, roadCount: number, buildingCount: number): string {
453:   const kind = tile?.kind ?? "empty";
454:   const grammar = tile?.visualGrammar;
455:   const occupancy = buildingCount > 0 ? "building" : lotCount > 0 ? "lot" : roadCount > 0 ? "road" : "open";
456:   return [
457:     kind,
458:     grammar?.terrainComposition ?? "none",
459:     grammar?.terrainElevation ?? "none",
460:     grammar?.terrainChunkMassing ?? "none",
461:     occupancy,
462:   ].join(".");
463: }

 succeeded in 693ms:
1: import type { CityWorldBuilding, CityWorldLot, CityWorldRoadSegment, CityWorldScene, CityWorldTerrainTile } from "./cityWorldTypes.js";
2: import {
3:   cityWorldPointDistanceToSegment,
4:   cityWorldPointInsideFootprint,
5:   cityWorldPointInsideFrame,
6:   cityWorldSegmentTouchesFrame,
7:   type CityWorldViewportFrame,
8:   cityWorldViewportFrameForCameraPreset,
9: } from "./cityWorldBasis.js";
10: 
11: export type CityWorldTerrainSample = {
12:   frame: CityWorldViewportFrame;
13:   terrainTiles: CityWorldTerrainTile[];
14:   lots: CityWorldLot[];
15:   roadSegments: CityWorldRoadSegment[];
16:   buildings: CityWorldBuilding[];
17:   authoredTerrainCount: number;
18:   emptyTerrainCount: number;
19:   terrainMassingCount: number;
20:   chunkEdgeCount: number;
21:   elevatedTerrainCount: number;
22: };
23: 
24: export function sampleCityWorldViewport(scene: CityWorldScene, frame: CityWorldViewportFrame): CityWorldTerrainSample {
25:   const terrainTiles = scene.terrainTiles.filter((tile) => cityWorldPointInsideFrame(tile.position, frame));
26:   const lots = scene.lots.filter((lot) => cityWorldPointInsideFrame(lot.position, frame));
27:   const roadSegments = scene.roadSegments.filter((road) => cityWorldSegmentTouchesFrame(road.from, road.to, frame));
28:   const buildings = scene.buildings.filter((building) => cityWorldPointInsideFrame(building.position, frame));
29: 
30:   return {
31:     frame,
32:     terrainTiles,
33:     lots,
34:     roadSegments,
35:     buildings,
36:     authoredTerrainCount: terrainTiles.filter(isAuthoredCityWorldTerrainTile).length,
37:     emptyTerrainCount: terrainTiles.filter((tile) => isEmptyCityWorldBoardTerrainTile(tile, scene)).length,
38:     terrainMassingCount: terrainTiles.filter((tile) => (tile.visualGrammar?.terrainChunkMassing ?? "none") !== "none").length,
39:     chunkEdgeCount: terrainTiles.filter((tile) => (tile.visualGrammar?.chunkEdge ?? "none") !== "none").length,
40:     elevatedTerrainCount: terrainTiles.filter((tile) => {
41:       const elevation = tile.visualGrammar?.terrainElevation;
42:       return Boolean(elevation && elevation !== "flat_field" && elevation !== "shell_flat");
43:     }).length,
44:   };
45: }
46: 
47: export function sampleCityWorldViewportForCameraPreset(scene: CityWorldScene, preset: CityWorldScene["cameraPresets"][number]): CityWorldTerrainSample {
48:   return sampleCityWorldViewport(scene, cityWorldViewportFrameForCameraPreset(preset));
49: }
50: 
51: export function isAuthoredCityWorldTerrainTile(tile: CityWorldTerrainTile): boolean {
52:   const grammar = tile.visualGrammar;
53:   return Boolean(
54:     grammar &&
55:       (grammar.terrainComposition !== "quiet_field" ||
56:         grammar.terrainElevation !== "flat_field" ||
57:         grammar.chunkEdge !== "none" ||
58:         grammar.terrainChunkMassing !== "none"),
59:   );
60: }
61: 
62: export function isEmptyCityWorldBoardTerrainTile(tile: CityWorldTerrainTile, scene: CityWorldScene): boolean {
63:   const grammar = tile.visualGrammar;
64:   if (tile.kind !== "grass") return false;
65:   if (grammar?.terrainComposition !== "quiet_field") return false;
66:   if (grammar?.terrainElevation !== "flat_field") return false;
67:   if (grammar?.chunkEdge !== "none") return false;
68:   if (grammar?.terrainChunkMassing !== "none") return false;
69:   const point = tile.position;
70:   return !scene.lots.some((lot) => cityWorldPointInsideFootprint(point, lot.position, lot.width + 0.75, lot.depth + 0.75)) &&
71:     !scene.buildings.some((building) => cityWorldPointInsideFootprint(point, building.position, building.width + 0.75, building.depth + 0.75)) &&
72:     !scene.roadSegments.some((road) => cityWorldPointDistanceToSegment(point, road.from, road.to) <= road.width + 0.75);
73: }
74: 
75: export function cityWorldBuildingTouchesLot(building: CityWorldBuilding, lot: CityWorldLot): boolean {
76:   if (building.placeId && lot.placeId && building.placeId === lot.placeId) return true;
77:   return cityWorldPointInsideFootprint(building.position, lot.position, lot.width + 0.45, lot.depth + 0.45);
78: }
79: 
80: export function cityWorldLotTouchesRoad(lot: CityWorldLot, road: CityWorldRoadSegment): boolean {
81:   return cityWorldPointDistanceToSegment(lot.position, road.from, road.to) <= Math.max(road.width + 2.2, Math.min(lot.width, lot.depth) * 0.8);
82: }

 succeeded in 719ms:
1880:     );
1881:     if (context.archetype === "prairie_town") {
1882:       addPrairieShelterRow(specs, zone, context, vegetationRng, 2);
1883:       addPrairieFieldCorners(specs, zone, context, vegetationRng, 2);
1884:     } else if (context.archetype === "metro_grid" || context.archetype === "river_town") {
1885:       addStreetTreeRhythm(specs, zone, context, vegetationRng, 2);
1886:     } else if (context.archetype === "coastal_grid") {
1887:       addStreetTreeRhythm(specs, zone, context, vegetationRng, 1);
1888:     }
1889:   } else if (zone.kind === "civic") {
1890:     specs.push(
1891:       { kind: "fountain", point: at(0.5, 0.86) },
1892:       { kind: "bench", point: at(0.3, 0.9) },
1893:       { kind: "bench", point: at(0.7, 0.9) },
1894:     );
1895:     if (desert) {
1896:       addDesertScrub(specs, zone, context, 1, vegetationRng);
1897:     } else {
1898:       addVegetationSpec(specs, context, "tree", at(0.06, 0.5), 3);
1899:       if (context.archetype !== "coastal_grid") addVegetationSpec(specs, context, "tree", at(0.94, 0.5), 4);
1900:       if (context.archetype === "mountain_valley") addMountainPineCluster(specs, zone, context, vegetationRng, mountainPineClusterCount(context));
1901:     }
1902:   } else if (zone.kind === "gym") {
1903:     specs.push({ kind: "sign", point: at(0.9, 0.88), variant: 1 }, { kind: "streetlight", point: at(0.08, 0.1) });
1904:     if (desert) addDesertScrub(specs, zone, context, 1, vegetationRng);
1905:   } else if (zone.kind === "apartments") {
1906:     specs.push(
1907:       { kind: "bench", point: at(0.5, 0.06) },
1908:       { kind: "streetlight", point: at(0.08, 0.92) },
1909:     );
1910:     if (desert) {
1911:       addDesertScrub(specs, zone, context, 1, vegetationRng);
1912:     } else {
1913:       addVegetationSpec(specs, context, "bush", at(0.1, 0.08), 0);
1914:       addVegetationSpec(specs, context, "bush", at(0.9, 0.92), 1);
1915:       addStreetTreeRhythm(specs, zone, context, vegetationRng, apartmentStreetTreeCap(context.archetype));
1916:       if (context.archetype === "prairie_town") addPrairieFieldCorners(specs, zone, context, vegetationRng, 2);
1917:       if (context.archetype === "mountain_valley") addMountainPineCluster(specs, zone, context, vegetationRng, mountainPineClusterCount(context));
1918:     }
1919:   } else if (zone.kind === "park") {
1920:     const area = (rect.maxX - rect.minX) * (rect.maxY - rect.minY);
1921:     if (desert) {
1922:       addDesertScrub(specs, zone, context, 2, vegetationRng);
1923:     } else if (context.archetype === "prairie_town") {
1924:       addPrairieShelterRow(specs, zone, context, vegetationRng, vegetationBand(7, 9, context.vegetationDensity));
1925:       addParkTreeCluster(specs, zone, context, vegetationRng, vegetationBand(7, 9, context.vegetationDensity));
1926:       addPrairieFieldCorners(specs, zone, context, vegetationRng, 4);
1927:       addVegetationSpec(specs, context, "bush", at(0.8, 0.24), 0);
1928:     } else {
1929:       const parkTreeCount = context.archetype === "coastal_grid" || context.archetype === "mountain_valley"
1930:         ? vegetationBand(7, 9, context.vegetationDensity)
1931:         : vegetationBand(5, 9, context.vegetationDensity);
1932:       addParkTreeCluster(specs, zone, context, vegetationRng, parkTreeCount);
1933:       addVegetationSpec(specs, context, "bush", at(0.8, 0.24), 0);
1934:       if (context.archetype === "mountain_valley") addMountainPineCluster(specs, zone, context, vegetationRng, mountainPineClusterCount(context));
1935:     }
1936:     specs.push({ kind: "bench", point: at(0.16, 0.46) }, { kind: "bench", point: at(0.62, 0.16) });
1937:     if (area >= 40) specs.push({ kind: "fountain", point: at(0.5, 0.5) });
1938:   } else if (zone.kind === "water") {
1939:     specs.push(...waterAccentProps(zone, rng));
1940:     addShorelineCluster(specs, zone, context, vegetationRng);
1941:   } else if (zone.kind === "plaza" && context.archetype === "metro_grid") {
1942:     addParkTreeCluster(specs, zone, context, vegetationRng, vegetationBand(7, 9, context.vegetationDensity));
1943:     addVegetationSpec(specs, context, "bush", at(0.8, 0.24), 0);
1944:   } else if (zone.kind === "plaza" && desert) {
1945:     addDesertScrub(specs, zone, context, 2, vegetationRng);
1946:   }
1947: 
1948:   return specs.map((entry, index) =>
1949:     withPropMetadata({
1950:       id: `gen-prop-${zone.id}-${index}`,
1951:       kind: entry.kind,
1952:       position: entry.point,
1953:       variant: entry.variant ?? index % 5,
1954:     }),
1955:   );
1956: }
1957: 
1958: function propPlacementContext(spec: CityWorldParametricSpec, roadSegments: CityWorldRoadSegment[]): PropPlacementContext {
1959:   return {
1960:     spec,
1961:     roadSegments,
1962:     archetype: spec.countyParameters?.archetype ?? spec.regionalPalette?.archetype,
1963:     vegetationDensity: spec.countyParameters?.modulation.vegetationDensity ?? 0.5,
1964:   };
1965: }
1966: 
1967: function standaloneZonePropsEnabled(zone: CityWorldZoneSpec, spec: CityWorldParametricSpec): boolean {
1968:   const archetype = spec.countyParameters?.archetype ?? spec.regionalPalette?.archetype;
1969:   return zone.kind === "plaza" && archetype === "metro_grid";
1970: }
1971: 
1972: function propZoneRng(spec: CityWorldParametricSpec, zone: CityWorldZoneSpec): () => number {
1973:   let seed = (spec.seed ?? 1) >>> 0;
1974:   const key = `${spec.id}:${zone.id}:e2-vegetation`;
1975:   for (let index = 0; index < key.length; index += 1) {
1976:     seed = Math.imul(seed ^ key.charCodeAt(index), 16777619) >>> 0;
1977:   }
1978:   return mulberry32(seed);
1979: }
1980: 
1981: function waterAccentProps(zone: CityWorldZoneSpec, rng: () => number): ZonePropSpec[] {
1982:   const wideBand = zone.rect.maxX - zone.rect.minX > (zone.rect.maxY - zone.rect.minY) * 1.6;
1983:   const at = (fx: number, fy: number): CityWorldPoint => zonePoint(zone, fx, fy);
1984:   if (wideBand) {
1985:     return [
1986:       { kind: "water_shimmer", point: at(0.22, 0.34) },
1987:       { kind: "water_shimmer", point: at(0.52, 0.58) },
1988:       { kind: "water_shimmer", point: at(0.78, 0.42) },
1989:       { kind: "dock", point: at(0.66, 0.08) },
1990:       { kind: "boat", point: at(0.66, 0.36), variant: Math.floor(rng() * 2) },
1991:     ];
1992:   }
1993: 
1994:   return [
1995:     { kind: "water_shimmer", point: at(0.3, 0.24) },
1996:     { kind: "water_shimmer", point: at(0.6, 0.56) },
1997:     { kind: "water_shimmer", point: at(0.45, 0.82) },
1998:     { kind: "dock", point: at(0.08, 0.42) },
1999:     { kind: "boat", point: at(0.38, 0.56), variant: Math.floor(rng() * 2) },
2000:   ];
2003: function residentialStreetTreeCap(archetype: GeneratedDistrictArchetype | undefined): number {
2004:   if (archetype === "metro_grid" || archetype === "coastal_grid" || archetype === "river_town") return 5;
2005:   if (archetype === "mountain_valley" || archetype === "prairie_town") return 4;
2006:   return 4;
2007: }
2008: 
2009: function apartmentStreetTreeCap(archetype: GeneratedDistrictArchetype | undefined): number {
2010:   if (archetype === "metro_grid" || archetype === "coastal_grid" || archetype === "river_town") return 3;
2011:   return 2;
2012: }
2013: 
2014: function mountainPineClusterCount(context: PropPlacementContext): number {
2015:   return vegetationBand(4, 6, context.vegetationDensity);
2016: }
2017: 
2018: function addStreetTreeRhythm(
2019:   specs: ZonePropSpec[],
2020:   zone: CityWorldZoneSpec,
2021:   context: PropPlacementContext,
2022:   rng: () => number,
2023:   maxTrees: number,
2024: ): void {
2025:   let added = 0;
2026:   for (const frontage of roadFrontagesForZone(zone, context.roadSegments)) {
2027:     if (added >= maxTrees) return;
2028:     const available = Math.max(0, maxTrees - added);
2029:     const length = frontage.end - frontage.start;
2030:     const spacing = streetTreeSpacing(context);
2031:     const count = Math.min(available, Math.max(1, Math.floor(length / spacing)));
2032:     for (let index = 0; index < count; index += 1) {
2033:       const t = (index + 1) / (count + 1);
2034:       const wobble = (rng() - 0.5) * 0.35;
2035:       const point =
2036:         frontage.axis === "x"
2037:           ? { x: frontage.start + length * t, y: frontage.offset + wobble, z: 0 }
2038:           : { x: frontage.offset + wobble, y: frontage.start + length * t, z: 0 };
2039:       if (addVegetationSpec(specs, context, "tree", point, added + index)) added += 1;
2040:     }
2041:   }
2042: }
2043: 
2044: function streetTreeSpacing(context: PropPlacementContext): number {
2045:   if (context.archetype === "metro_grid") return 3.1;
2046:   if (context.archetype === "coastal_grid" || context.archetype === "river_town") return 3.5;
2047:   if (context.archetype === "prairie_town") return 3.8;
2048:   if (context.archetype === "mountain_valley") return 4.0;
2049:   return 4.8 + (1 - context.vegetationDensity) * 1.2;
2050: }
2051: 
2052: function addParkTreeCluster(
2053:   specs: ZonePropSpec[],
2054:   zone: CityWorldZoneSpec,
2055:   context: PropPlacementContext,
2056:   rng: () => number,
2057:   count: number,
2058: ): void {
2059:   const cluster = [
2060:     [0.3, 0.72],
2061:     [0.55, 0.74],
2062:     [0.42, 0.86],
2063:     [0.7, 0.88],
2064:     [0.24, 0.9],
2065:     [0.18, 0.64],
2066:     [0.82, 0.7],
2067:     [0.63, 0.58],
2068:     [0.48, 0.95],
2069:   ] as const;
2070:   for (let index = 0; index < Math.min(count, cluster.length); index += 1) {
2071:     const [fx, fy] = cluster[index]!;
2072:     addVegetationSpec(specs, context, "tree", jitteredZonePoint(zone, fx, fy, rng, 0.18), index);
2073:   }
2074: }
2075: 
2076: function addPrairieShelterRow(
2077:   specs: ZonePropSpec[],
2078:   zone: CityWorldZoneSpec,
2079:   context: PropPlacementContext,
2080:   rng: () => number,
2081:   count: number,
2082: ): void {
2083:   const vertical = zone.rect.maxY - zone.rect.minY >= zone.rect.maxX - zone.rect.minX;
2084:   for (let index = 0; index < count; index += 1) {
2085:     const t = (index + 1) / (count + 1);
2086:     const wobble = (rng() - 0.5) * 0.22;
2087:     const point = vertical
2088:       ? { x: zone.rect.maxX - 0.85 + wobble, y: zone.rect.minY + (zone.rect.maxY - zone.rect.minY) * t, z: 0 }
2089:       : { x: zone.rect.minX + (zone.rect.maxX - zone.rect.minX) * t, y: zone.rect.maxY - 0.85 + wobble, z: 0 };
2090:     addVegetationSpec(specs, context, "tree", point, index + 2);
2091:   }
2092: }
2093: 
2094: function addPrairieFieldCorners(
2095:   specs: ZonePropSpec[],
2096:   zone: CityWorldZoneSpec,
2097:   context: PropPlacementContext,
2098:   rng: () => number,
2099:   count: number,
2100: ): void {
2101:   const corners = [
2102:     [0.12, 0.16],
2103:     [0.88, 0.16],
2104:     [0.12, 0.84],
2105:     [0.88, 0.84],
2106:   ] as const;
2107:   for (let index = 0; index < Math.min(count, corners.length); index += 1) {
2108:     const [fx, fy] = corners[index]!;
2109:     addVegetationSpec(specs, context, "tree", jitteredZonePoint(zone, fx, fy, rng, 0.18), index + 5);
2110:   }
2111: }
2112: 
2113: function addMountainPineCluster(
2114:   specs: ZonePropSpec[],
2115:   zone: CityWorldZoneSpec,
2116:   context: PropPlacementContext,
2117:   rng: () => number,
2118:   count: number,
2119: ): void {
2120:   const candidates = ([
2121:     [0.18, 0.18],
2122:     [0.82, 0.18],
2123:     [0.18, 0.82],
2124:     [0.82, 0.82],
2125:     [0.5, 0.22],
2126:     [0.5, 0.78],
2127:   ] as const).map(([fx, fy]) => {
2128:     const point = zonePoint(zone, fx, fy);
2129:     return { point, relief: reliefAtBilinear(context.spec, point.x, point.y) };
2130:   }).sort((a, b) => b.relief - a.relief);
2131: 
2132:   for (let index = 0; index < Math.min(count, candidates.length); index += 1) {
2133:     const base = candidates[index]!.point;
2134:     addVegetationSpec(
2135:       specs,
2136:       context,
2137:       "tree",
2138:       { x: base.x + (rng() - 0.5) * 0.28, y: base.y + (rng() - 0.5) * 0.28, z: 0 },
2139:       index + 3,
2140:     );
2141:   }
2142: }
2143: 
2144: function addShorelineCluster(
2145:   specs: ZonePropSpec[],
2146:   zone: CityWorldZoneSpec,
2147:   context: PropPlacementContext,
2148:   rng: () => number,
2149: ): void {
2150:   if (context.archetype !== "coastal_grid" && context.archetype !== "river_town") return;
2151:   const wideBand = zone.rect.maxX - zone.rect.minX > (zone.rect.maxY - zone.rect.minY) * 1.6;
2152:   const count = wideBand ? vegetationBand(4, 5, context.vegetationDensity) : vegetationBand(4, 6, context.vegetationDensity);
2153:   if (wideBand) {
2154:     addHorizontalShorelineCluster(specs, zone, context, rng, count);
2155:     return;
2156:   }
2157:   const banks = context.archetype === "river_town" ? shorelineBankXs(zone, context.roadSegments) : [shorelineLandwardXs(zone, context.roadSegments)];
2158:   const fractions = [0.18, 0.34, 0.52, 0.68, 0.84, 0.92];
2159:   for (let bankIndex = 0; bankIndex < banks.length; bankIndex += 1) {
2160:     const bankXs = banks[bankIndex]!;
2161:     let added = 0;
2162:     for (const fy of fractions) {
2163:       if (added >= count) break;
2164:       for (const x of bankXs) {
2165:         const point = { x: x + (rng() - 0.5) * 0.18, y: zone.rect.minY + (zone.rect.maxY - zone.rect.minY) * fy, z: 0 };
2166:         if (addVegetationSpec(specs, context, "tree", point, bankIndex * count + added + 1)) {
2167:           added += 1;
2168:           break;
2169:         }
2170:       }
2171:     }
2172:   }
2173: }
2174: 
2175: function addHorizontalShorelineCluster(
2176:   specs: ZonePropSpec[],
2177:   zone: CityWorldZoneSpec,
2178:   context: PropPlacementContext,
2179:   rng: () => number,
2180:   count: number,
2181: ): void {
2182:   const banks = shorelineBankYs(zone, context.roadSegments);
2183:   const fractions = [0.14, 0.26, 0.38, 0.52, 0.66, 0.8, 0.9];
2184:   for (let bankIndex = 0; bankIndex < banks.length; bankIndex += 1) {
2185:     const bankYs = banks[bankIndex]!;
2186:     let added = 0;
2187:     for (const fx of fractions) {
2188:       if (added >= count) break;
2189:       for (const y of bankYs) {
2190:         const point = { x: zone.rect.minX + (zone.rect.maxX - zone.rect.minX) * fx + (rng() - 0.5) * 0.24, y: y + (rng() - 0.5) * 0.12, z: 0 };
2191:         if (addVegetationSpec(specs, context, "tree", point, bankIndex * count + added + 1)) {
2192:           added += 1;
2193:           break;
2194:         }
2195:       }
2196:     }
2197: 
2198:     const bushFx = bankIndex === 0 ? 0.08 : 0.92;
2199:     for (const y of bankYs) {
2200:       if (addVegetationSpec(specs, context, "bush", { x: zone.rect.minX + (zone.rect.maxX - zone.rect.minX) * bushFx, y, z: 0 }, bankIndex + 1)) break;
2201:     }
2202:   }
2203: }
2204: 
2205: function addDesertScrub(
2206:   specs: ZonePropSpec[],
2207:   zone: CityWorldZoneSpec,
2208:   context: PropPlacementContext,
2209:   count: number,
2210:   rng: () => number,
2211: ): void {
2212:   const points = [
2213:     [0.16, 0.2],
2214:     [0.82, 0.74],
2215:     [0.28, 0.82],
2216:     [0.68, 0.22],
2217:   ] as const;
2218:   for (let index = 0; index < count && index < points.length; index += 1) {
2219:     const [fx, fy] = points[index]!;
2220:     addVegetationSpec(specs, context, "bush", jitteredZonePoint(zone, fx, fy, rng, 0.2), index);
2221:   }
2222: }
2223: 
2224: function addVegetationSpec(
2225:   specs: ZonePropSpec[],
2226:   context: PropPlacementContext,
2227:   kind: "tree" | "bush",
2228:   rawPoint: CityWorldPoint,
2229:   variant = specs.length,
2230: ): boolean {
2231:   const point = { x: roundDimension(rawPoint.x), y: roundDimension(rawPoint.y), z: 0 };
2232:   if (!pointInsideGeneratedBounds(point, context.spec)) return false;
2233:   if (!pointClearsRoads(point, context.roadSegments)) return false;
2234:   if (pointInsideWaterZone(point, context.spec)) return false;
2235:   if (specs.some((entry) => (entry.kind === "tree" || entry.kind === "bush") && distance2(entry.point, point) < 0.72)) return false;
2236:   specs.push({ kind, point, variant });
2237:   return true;
2238: }
2885: /** Strip-row shops narrower than this read as toy boxes next to curated Plaza Row. */
2886: const TOY_COMMERCE_WIDTH_TILES = 2.2;
2887: /** Corner storefronts are small on purpose (curated market is 2.0w) â€” but never below this. */
2888: const CORNER_STORE_MIN_WIDTH_TILES = 1.7;
2889: 
2890: /**
2891:  * Renderer window-column proportions from `drawApartmentDetails`: three
2892:  * columns at horizontal offsets -0.34/-0.21/-0.08 of footprint width. The
2893:  * innermost column (|dx| = 0.08w) suffers the deepest eave drop.
2894:  */
2895: const APARTMENT_INNER_COLUMN_OFFSET_RATIO = 0.08;
2896: 
2897: export function analyzeGeneratedDistrictParity(scene: CityWorldScene): CityWorldGeneratedDistrictParityReport {
2898:   const softLotKinds = new Set<CityWorldLot["kind"]>(["park", "waterfront"]);
2899:   const buildableLots = scene.lots.filter((lot) => !softLotKinds.has(lot.kind));
2900:   const softLots = scene.lots.length - buildableLots.length;
2901: 
2902:   const pads: CityWorldGeneratedPadMetric[] = buildableLots.map((lot) => {
2903:     const residents = scene.buildings.filter((building) =>
2904:       cityWorldPointInsideFootprint(building.position, lot.position, lot.width, lot.depth),
2905:     );
2906:     const primary = residents.reduce<CityWorldBuilding | null>(
2907:       (largest, building) =>
2908:         !largest || building.width * building.depth > largest.width * largest.depth ? building : largest,
2909:       null,
2910:     );
2911:     if (!primary) {
2912:       return { lotId: lot.id, lotKind: lot.kind, buildingId: null, footprintFillRatio: 0, overhangTiles: 0 };
2913:     }
2914:     const lotArea = Math.max(0.0001, lot.width * lot.depth);
2915:     const overhangX = Math.abs(primary.position.x - lot.position.x) + primary.width / 2 - lot.width / 2;
2916:     const overhangY = Math.abs(primary.position.y - lot.position.y) + primary.depth / 2 - lot.depth / 2;
2917:     return {
2918:       lotId: lot.id,
2919:       lotKind: lot.kind,
2920:       buildingId: primary.id,
2921:       footprintFillRatio: roundParityMetric((primary.width * primary.depth) / lotArea),
2922:       overhangTiles: roundParityMetric(Math.max(0, overhangX, overhangY)),
2923:     };
2924:   });
2925: 
2926:   const filledPads = pads.filter((pad) => pad.buildingId !== null);
2927:   const emptyPads = pads.filter((pad) => pad.buildingId === null);
2928:   const overhangTolerance = 0.02;
2929:   const overhangPads = filledPads.filter((pad) => pad.overhangTiles > overhangTolerance);
2930: 
2931:   const shops = scene.buildings.filter((building) => building.kind === "shop");
2932:   // Strip rows and corner storefronts have separate size floors.
2933:   const cornerShops = shops.filter((building) => building.facadeStyle === "storefront");
2934:   const rowShops = shops.filter((building) => building.facadeStyle !== "storefront");
2935:   const stripShops = rowShops.filter(
2936:     (building) => building.facadeStyle === "strip_store" && building.objectKit?.prefabFamily === "commerce_strip",
2937:   );
2938:   const toyShops = shops.filter((building) =>
2939:     building.facadeStyle === "storefront"
2940:       ? building.width < CORNER_STORE_MIN_WIDTH_TILES
2941:       : building.width < TOY_COMMERCE_WIDTH_TILES,
2942:   );
2943:   const shopBayCounts = stripShops.map((building) => building.objectKit?.commerceGeometry?.bayCount ?? 0);
2944:   // Hero sprite strips are retired: every generated strip renders through the
2945:   // vector facade system, so the crown-duplicate/missing checks are always 0.
2946:   const heroCrownDuplicateZones = 0;
2947:   const heroCrownMissingZones = 0;
2948: 
2949:   const apartments = scene.buildings.filter((building) => building.kind === "apartment");
2950:   const apartmentClearances = apartments.map((building) => ({
2951:     id: building.id,
2952:     clearance: apartmentColumnClearance(building),
2953:   }));
2954:   const unsafeApartments = apartmentClearances.filter((entry) => entry.clearance < 1);
2955:   const homes = scene.buildings.filter((building) => building.kind === "home");
2956:   const homeRoofSafety = homes.map((building) => generatedHomeRoofSafety(building));
2957:   const unsafeHomeRoofs = homeRoofSafety.filter((entry) => !entry.safe);
2958: 
2959:   const frameDensity: Record<string, CityWorldGeneratedFrameBandDensity> = {};
2960:   for (const preset of scene.cameraPresets) {
2961:     if (preset.id !== "desktop" && preset.id !== "mobile") continue;
2962:     frameDensity[preset.id] = frameBandDensity(scene, preset);
2963:   }
2964: 
2965:   return {
2966:     type: "cityWorldGeneratedDistrictParityReport",
2967:     update: "0.58e-generated-district-parity-numeric-proof",
2968:     sceneId: scene.id,
2969:     counts: {
2970:       buildableLots: buildableLots.length,
2971:       softLots,
2972:       buildings: scene.buildings.length,
2973:       emptyPadCount: emptyPads.length,
2974:       shopCount: shops.length,
2975:       apartmentCount: apartments.length,
2976:     },
2977:     padMetrics: {
2978:       lotBuildingFillRatio: roundParityMetric(safeRatio(filledPads.length, buildableLots.length)),
2979:       padFootprintFillFloor: roundParityMetric(
2980:         filledPads.length > 0 ? Math.min(...filledPads.map((pad) => pad.footprintFillRatio)) : 0,
2981:       ),
2982:       padFootprintFillMean: roundParityMetric(
2983:         safeRatio(filledPads.reduce((sum, pad) => sum + pad.footprintFillRatio, 0), filledPads.length),
2984:       ),
2985:       emptyPadLotIds: emptyPads.map((pad) => pad.lotId),
2986:     },
2987:     registrationMetrics: {
2988:       buildingWithinLotRatio: roundParityMetric(
2989:         safeRatio(filledPads.length - overhangPads.length, Math.max(1, filledPads.length)),
2990:       ),
2991:       roofOverhangCount: overhangPads.length,
2992:       maxOverhangTiles: roundParityMetric(Math.max(0, ...filledPads.map((pad) => pad.overhangTiles))),
2993:       overhangBuildingIds: overhangPads.map((pad) => pad.buildingId ?? pad.lotId),
2994:     },
2995:     facadeMetrics: {
2996:       apartmentColumnClearanceFloor: roundParityMetric(
2997:         apartmentClearances.length > 0 ? Math.min(...apartmentClearances.map((entry) => entry.clearance)) : 1,
2998:       ),
2999:       apartmentColumnUnsafeCount: unsafeApartments.length,
3000:       minApartmentWidth: roundParityMetric(
3001:         apartments.length > 0 ? Math.min(...apartments.map((building) => building.width)) : 0,
3002:       ),
3003:       unsafeApartmentIds: unsafeApartments.map((entry) => entry.id),
3004:     },
3005:     commerceMetrics: {
3006:       // Ratio over strip ROWS only; corner storefronts are their own role.
3007:       stripStoreRatio: roundParityMetric(safeRatio(stripShops.length, rowShops.length)),
3008:       commerceStripMinWidth: roundParityMetric(
3009:         rowShops.length > 0 ? Math.min(...rowShops.map((building) => building.width)) : 0,
3010:       ),
3011:       commerceStripMeanWidth: roundParityMetric(
3012:         safeRatio(rowShops.reduce((sum, building) => sum + building.width, 0), rowShops.length),
3013:       ),
3014:       toyCommerceCount: toyShops.length,
3015:       commerceBayFloor: shopBayCounts.length > 0 ? Math.min(...shopBayCounts) : 0,
3016:       toyCommerceIds: toyShops.map((building) => building.id),
3017:       cornerMarketCount: cornerShops.length,
3018:       cornerMarketMinWidth: roundParityMetric(
3019:         cornerShops.length > 0 ? Math.min(...cornerShops.map((building) => building.width)) : 0,
3020:       ),
3021:       heroStripCount: 0,
3022:       stripZoneCount: [...new Set(stripShops.map((building) => building.placeId ?? ""))].length,
3023:       heroCrownDuplicateZones,
3024:       heroCrownMissingZones,
3025:     },
3026:     residentialRoofMetrics: {
3027:       homeCount: homes.length,
3028:       pitchedHomeCount: homes.filter((building) => building.roofShape === "gable" || building.roofShape === "hip").length,
3029:       flatRowhomeCount: homes.filter((building) => building.facadeStyle === "rowhome" && building.roofShape === "flat").length,
3030:       unsafeRoofCount: unsafeHomeRoofs.length,
3031:       maxHeightToFootprintRatio: roundParityMetric(Math.max(0, ...homeRoofSafety.map((entry) => entry.heightToFootprintRatio))),
3032:       unsafeRoofIds: unsafeHomeRoofs.map((entry) => entry.id),
3033:     },
3034:     frameDensity,
3035:     pads,
3036:   };
3037: }
3038: 
3039: function generatedHomeRoofSafety(building: CityWorldBuilding): {
3040:   id: string;
3041:   safe: boolean;
3042:   heightToFootprintRatio: number;
3043: } {
3044:   const roofShape = building.roofShape ?? "flat";
3045:   const style = building.facadeStyle ?? "cottage";
3046:   const heightToFootprintRatio = roundParityMetric(building.height / Math.max(0.1, Math.min(building.width, building.depth)));
3047:   let safe = true;
3048: 
3049:   if (style === "rowhome") safe = roofShape === "flat" && building.height <= 1.52;
3050:   else if (style === "cottage") safe = roofShape === "gable" && building.height <= 1.28 && heightToFootprintRatio <= 1.14;
3051:   else if (style === "ranch") safe = (roofShape === "gable" || roofShape === "hip") && building.width >= 1.8 && building.height <= 1.22 && heightToFootprintRatio <= 0.96;
3052:   else safe = roofShape !== "tower";
3053: 
3054:   return { id: building.id, safe, heightToFootprintRatio };
3055: }
3056: 
3057: /**
3058:  * Scale-free window-column clearance: the wall (projected height
3059:  * `height * tileDepth`) must be tall enough that the innermost column's eave
3060:  * drop (`~0.92 * halfFootprintDepth`, where the projected footprint depth of a

 succeeded in 749ms:
53:   xShift: number;
54:   yShift: number;
55:   riverAxis: "horizontal" | "vertical";
56:   civicElevationBoost: number;
57:   reliefTerraceBoost: number;
58:   waterAffinity: number;
59: };
60: 
61: function layoutContext(profile: ArchetypeProfile, modulation: CountyGenerationModulation | undefined, seed: number): LayoutContext {
62:   const xShift = (seed % 3) - 1;
63:   const yShift = (Math.floor(seed / 3) % 3) - 1;
64:   const densityScale = modulation?.densityScale ?? 1;
65:   const vegetationDensity = modulation?.vegetationDensity ?? 0.5;
66:   return {
67:     profile,
68:     modulation,
69:     densityScale,
70:     greenGap: (vegetationDensity - 0.5) * 0.06,
71:     xShift,
72:     yShift,
73:     riverAxis: seed % 2 === 0 ? "horizontal" : "vertical",
74:     civicElevationBoost: modulation?.civicElevationBoost ?? profile.zones.civicElevationBoost,
75:     reliefTerraceBoost: ((modulation?.reliefScale ?? 1) - 1) * 0.38,
76:     waterAffinity: modulation?.waterAffinity ?? 0,
77:   };
78: }
79: 
80: function metroGridZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
81:   const civicRect = { minX: 18 + context.xShift, minY: 10 + context.yShift, maxX: 24 + context.xShift, maxY: 15 + context.yShift };
82:   return [
83:     zone("metro-block-paving-fill", "plaza_paving", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "Metro block paving"),
84:     zone("metro-civic-forecourt-fill", "civic_forecourt", { minX: 15, minY: 9, maxX: 25, maxY: 16 }, context, undefined, "Civic forecourt"),
85:     zone("metro-east-plaza-fill", "plaza_paving", { minX: 36, minY: 10, maxX: 41, maxY: 24 }, context, undefined, "East plaza paving"),
86:     zone("metro-pocket-paving-fill", "plaza_paving", { minX: 5, minY: 10, maxX: 13, maxY: 15 }, context, undefined, "Pocket paving"),
87:     zone("metro-west-block", "residential", { minX: 3, minY: 4, maxX: 12, maxY: 8 }, context, 0.92, "West row blocks"),
88:     zone("metro-south-rowhomes", "residential", { minX: 3, minY: 18, maxX: 14, maxY: 28 }, context, 0.94, "South rowhomes"),
89:     zone("metro-civic-core", "civic", civicRect, context, undefined, "Civic tower core", context.civicElevationBoost + 0.05),
90:     zone("metro-main-street", "commercial", { minX: 15, minY: 5, maxX: 25, maxY: 8 }, context, 0.92, "Tight main street"),
91:     zone("metro-downtown-strip", "commercial", { minX: 27, minY: 10, maxX: 34, maxY: 14 }, context, 0.9, "Downtown strip"),
92:     zone("metro-apartment-core", "apartments", { minX: 15, minY: 17, maxX: 25, maxY: 24 }, context, 0.91, "Apartment core"),
93:     zone("metro-apartment-east", "apartments", { minX: 27, minY: 17, maxX: 34, maxY: 24 }, context, 0.88, "Apartment edge"),
94:     zone("metro-service-yard", "gym", { minX: 16, minY: 25, maxX: 23, maxY: 29 }, context, undefined, "Service yard"),
95:     zone("metro-pocket-plaza", "plaza", { minX: 6, minY: 10, maxX: 12, maxY: 15 }, context, undefined, "Pocket plaza"),
96:     bonusZone,
97:   ];
98: }
99: 
100: function desertBasinZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
101:   return [
102:     zone("desert-basin-wash-fill", "dry_wash", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "Basin dry wash"),
103:     zone("desert-north-wash-fill", "dry_wash", { minX: 3, minY: 15, maxX: 18, maxY: 21 }, context, undefined, "North dry wash"),
104:     zone("desert-east-wash-fill", "dry_wash", { minX: 32, minY: 5, maxX: 42, maxY: 13 }, context, undefined, "East dry wash"),
105:     zone("desert-south-wash-fill", "dry_wash", { minX: 22, minY: 21, maxX: 42, maxY: 30 }, context, undefined, "South dry wash"),
106:     zone("desert-west-sprawl", "residential", { minX: 3, minY: 5, maxX: 18, maxY: 14 }, context, 0.56, "Low west sprawl"),
107:     zone("desert-south-sprawl", "residential", { minX: 5, minY: 22, maxX: 21, maxY: 29 }, context, 0.52, "South sprawl"),
108:     zone("desert-main-frontage", "commercial", { minX: 20, minY: 7, maxX: 33, maxY: 12 }, context, 0.58, "Wide frontage"),
109:     zone("desert-civic-mesa", "civic", { minX: 21, minY: 15, maxX: 27, maxY: 21 }, context, undefined, "Mesa civic", context.civicElevationBoost + context.reliefTerraceBoost + 0.05),
110:     zone("desert-service-yard", "gym", { minX: 29, minY: 15, maxX: 37, maxY: 20 }, context, undefined, "Service yard"),
111:     zone("desert-scrub-plaza", "plaza", { minX: 8, minY: 16, maxX: 17, maxY: 20 }, context, undefined, "Scrub plaza"),
112:     zone("desert-east-sprawl", "residential", { minX: 23, minY: 23, maxX: 31, maxY: 30 }, context, 0.5, "East sprawl"),
113:     normalizeBonusZone(bonusZone, { minX: 32, minY: 21, maxX: 42, maxY: 30 }, "Dry plaza"),
114:   ];
115: }
116: 
117: function coastalGridZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
118:   return [
119:     zone("coastal-land-common-fill", "green_common", { minX: 0, minY: 0, maxX: 35, maxY: 32 }, context, undefined, "Coastal commons"),
120:     zone("coastal-shore-bank-fill", "shore_bank", { minX: 34, minY: 0, maxX: 36, maxY: 32 }, context, undefined, "Beach bank"),
121:     zone("coastal-common-fill", "green_common", { minX: 4, minY: 15, maxX: 20, maxY: 20 }, context, undefined, "Shore commons"),
122:     zone("coastal-north-common-fill", "green_common", { minX: 4, minY: 0, maxX: 20, maxY: 4 }, context, undefined, "Dune commons"),
123:     zone("coastal-back-homes", "residential", { minX: 4, minY: 5, maxX: 18, maxY: 14 }, context, 0.74, "Back-shore homes"),
124:     zone("coastal-stepback-homes", "residential", { minX: 5, minY: 19, maxX: 20, maxY: 29 }, context, 0.72, "Stepback homes"),
125:     zone("coastal-civic", "civic", { minX: 21, minY: 8, maxX: 28, maxY: 14 }, context, undefined, "Coastal civic", context.civicElevationBoost),
126:     zone("coastal-waterfront-strip", "commercial", { minX: 27, minY: 18, maxX: 34, maxY: 27 }, context, 0.86, "Waterfront strip"),
127:     zone("coastal-main-street", "commercial", { minX: 22, minY: 5, maxX: 34, maxY: 8 }, context, 0.76, "Shore main street"),
128:     zone("coastal-apartments", "apartments", { minX: 22, minY: 16, maxX: 27, maxY: 26 }, context, 0.72, "Shore apartments"),
129:     zone("coastal-service", "gym", { minX: 15, minY: 16, maxX: 21, maxY: 21 }, context, undefined, "Marina service"),
130:     zone("coastal-green", "park", { minX: 8, minY: 15, maxX: 15, maxY: 19 }, context, undefined, "Shore green"),
131:     normalizeBonusZone(bonusZone, { minX: 36, minY: 0, maxX: 44, maxY: 32 }, context.waterAffinity >= 0.75 ? "Coastal edge" : "Water edge"),
132:   ];
133: }
134: 
135: function mountainValleyZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
136:   return [
137:     zone("mountain-valley-meadow-fill", "meadow", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "Valley meadow floor"),
138:     zone("mountain-upper-scree-fill", "scree", { minX: 0, minY: 0, maxX: 15, maxY: 4 }, context, undefined, "Upper scree"),
139:     zone("mountain-ridge-scree-fill", "scree", { minX: 25, minY: 0, maxX: 44, maxY: 12 }, context, undefined, "Ridge scree"),
140:     zone("mountain-meadow-fill", "meadow", { minX: 25, minY: 19, maxX: 42, maxY: 22 }, context, undefined, "Valley meadow"),
141:     zone("mountain-lower-meadow-fill", "meadow", { minX: 4, minY: 24, maxX: 14, maxY: 29 }, context, undefined, "Lower meadow"),
142:     zone("mountain-upper-homes", "residential", { minX: 4, minY: 5, maxX: 14, maxY: 12 }, context, 0.62, "Upper terrace homes"),
143:     zone("mountain-mid-homes", "residential", { minX: 10, minY: 16, maxX: 23, maxY: 23 }, context, 0.64, "Mid-terrace homes"),
144:     zone("mountain-lower-homes", "residential", { minX: 25, minY: 23, maxX: 38, maxY: 29 }, context, 0.58, "Valley homes"),
145:     zone("mountain-ridge-civic", "civic", { minX: 17, minY: 5, maxX: 24, maxY: 11 }, context, undefined, "Ridge civic", context.civicElevationBoost + context.reliefTerraceBoost + 0.08),
146:     zone("mountain-valley-main", "commercial", { minX: 24, minY: 13, maxX: 36, maxY: 18 }, context, 0.66, "Valley main"),
147:     zone("mountain-inn-court", "apartments", { minX: 30, minY: 5, maxX: 39, maxY: 12 }, context, 0.58, "Terrace lodge court"),
148:     zone("mountain-service", "gym", { minX: 15, minY: 24, maxX: 22, maxY: 29 }, context, undefined, "Trail service"),
149:     normalizeBonusZone(bonusZone, { minX: 33, minY: 20, maxX: 41, maxY: 29 }, "Ridge commons"),
150:   ];
151: }
152: 
153: function prairieTownZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
154:   return [
155:     zone("prairie-northwest-field-fill", "farm_field", { minX: 0, minY: 0, maxX: 21, maxY: 17 }, context, undefined, "Northwest crop rows"),
156:     zone("prairie-northeast-field-fill", "farm_field", { minX: 23, minY: 0, maxX: 44, maxY: 17 }, context, undefined, "Northeast crop rows"),
157:     zone("prairie-southwest-field-fill", "farm_field", { minX: 0, minY: 19, maxX: 21, maxY: 32 }, context, undefined, "Southwest crop rows"),
158:     zone("prairie-southeast-field-fill", "farm_field", { minX: 23, minY: 19, maxX: 44, maxY: 32 }, context, undefined, "Southeast crop rows"),
159:     zone("prairie-west-grid", "residential", { minX: 4, minY: 5, maxX: 20, maxY: 15 }, context, 0.58, "West town grid"),
160:     zone("prairie-south-grid", "residential", { minX: 5, minY: 21, maxX: 21, maxY: 29 }, context, 0.54, "South town grid"),
161:     zone("prairie-main-street", "commercial", { minX: 23, minY: 6, maxX: 35, maxY: 12 }, context, 0.62, "Straight main street"),
162:     zone("prairie-civic", "civic", { minX: 24, minY: 15, maxX: 30, maxY: 20 }, context, undefined, "Prairie civic", context.civicElevationBoost),
163:     zone("prairie-service-yard", "gym", { minX: 32, minY: 15, maxX: 40, maxY: 20 }, context, undefined, "Machine shed"),
164:     zone("prairie-low-court", "apartments", { minX: 23, minY: 23, maxX: 34, maxY: 29 }, context, 0.48, "Low court"),
165:     zone("prairie-ag-grid", "park", { minX: 35, minY: 22, maxX: 42, maxY: 30 }, context, undefined, "Ag grid"),
166:     normalizeBonusZone(bonusZone, { minX: 36, minY: 6, maxX: 42, maxY: 13 }, "East commons"),
167:   ];
168: }
169: 
170: function riverTownZones(context: LayoutContext, bonusZone: CityWorldZoneSpec): CityWorldZoneSpec[] {
171:   if (context.riverAxis === "vertical") {
172:     return [
173:       zone("river-common-fill", "green_common", { minX: 0, minY: 0, maxX: 44, maxY: 32 }, context, undefined, "River commons"),
174:       zone("river-west-bank-fill", "shore_bank", { minX: 19, minY: 0, maxX: 20, maxY: 32 }, context, undefined, "West bank"),
175:       zone("river-east-bank-fill", "shore_bank", { minX: 26, minY: 0, maxX: 27, maxY: 32 }, context, undefined, "East bank"),
176:       zone("river-west-common-fill", "green_common", { minX: 4, minY: 16, maxX: 18, maxY: 21 }, context, undefined, "West bank commons"),
177:       zone("river-west-homes", "residential", { minX: 4, minY: 5, maxX: 15, maxY: 14 }, context, 0.74, "West bank homes"),
178:       zone("river-south-homes", "residential", { minX: 5, minY: 22, maxX: 17, maxY: 30 }, context, 0.72, "South bank homes"),
179:       zone("river-ferry-market", "commercial", { minX: 27, minY: 4, maxX: 36, maxY: 9 }, context, 0.86, "Ferry market"),
180:       zone("river-main-north", "commercial", { minX: 27, minY: 11, maxX: 36, maxY: 16 }, context, 0.86, "River main north"),
181:       zone("river-main-south", "commercial", { minX: 27, minY: 20, maxX: 36, maxY: 26 }, context, 0.86, "River main south"),
197:     zone("river-ferry-market", "commercial", { minX: 25, minY: 4, maxX: 34, maxY: 9 }, context, 0.86, "Ferry market"),
198:     zone("river-main-north", "commercial", { minX: 25, minY: 10, maxX: 34, maxY: 13 }, context, 0.86, "River main north"),
199:     zone("river-main-south", "commercial", { minX: 25, minY: 22, maxX: 34, maxY: 27 }, context, 0.86, "River main south"),
200:     zone("river-dock-district", "commercial", { minX: 29, minY: 21, maxX: 34, maxY: 24 }, context, 0.82, "Dock district"),
201:     zone("river-east-market", "commercial", { minX: 36, minY: 22, maxX: 43, maxY: 30 }, context, 1.08, "East bank market"),
202:     zone("river-civic", "civic", { minX: 13, minY: 8, maxX: 19, maxY: 13 }, context, undefined, "River civic", context.civicElevationBoost),
203:     zone("river-apartments", "apartments", { minX: 23, minY: 23, maxX: 31, maxY: 30 }, context, 0.72, "River flats"),
204:     zone("river-plaza", "plaza", { minX: 10, minY: 21, maxX: 19, maxY: 24 }, context, undefined, "River plaza"),
205:     normalizeBonusZone(bonusZone, { minX: 0, minY: 15, maxX: 44, maxY: 20 }, "River edge"),
206:   ];
207: }
208: 
209: function metroGridRoads(context: LayoutContext): CityWorldRoadSeed[] {
210:   return [
211:     road("gen-road-metro-north", "avenue", 3, 9 + context.yShift, 41, 9 + context.yShift),
212:     road("gen-road-metro-main", "avenue", 3, 16, 41, 16),
213:     road("gen-road-metro-south", "street", 3, 25, 41, 25),
214:     road("gen-road-metro-west", "street", 14 + context.xShift, 4, 14 + context.xShift, 29),
215:     road("gen-road-metro-core", "avenue", 26, 4, 26, 29),
216:     road("gen-road-metro-east", "street", 35, 5, 35, 29),
217:     road("gen-cross-metro-core", "crosswalk", 23, 16, 28, 16),
218:   ];
219: }
220: 
221: function desertBasinRoads(context: LayoutContext): CityWorldRoadSeed[] {
222:   return [
223:     road("gen-road-desert-frontage", "avenue", 3, 14 + context.yShift, 42, 14 + context.yShift),
224:     road("gen-road-desert-south", "street", 5, 22, 42, 22),
225:     road("gen-road-desert-arterial", "avenue", 19 + context.xShift, 5, 19 + context.xShift, 29),
226:     road("gen-road-desert-plaza", "driveway", 31, 26, 42, 26),
227:     road("gen-cross-desert-civic", "crosswalk", 20, 14 + context.yShift, 25, 14 + context.yShift),
228:   ];
229: }
230: 
231: function coastalGridRoads(context: LayoutContext): CityWorldRoadSeed[] {
232:   const shoreX = 35;
233:   return [
234:     road("gen-road-coastal-shoreline", "avenue", shoreX, 5, shoreX, 30),
235:     road("gen-road-coastal-north", "street", 4, 9 + context.yShift, shoreX, 9 + context.yShift),
236:     road("gen-road-coastal-mid", "avenue", 5, 16, shoreX, 16),
237:     road("gen-road-coastal-south", "street", 5, 25, shoreX, 25),
238:     road("gen-road-coastal-back", "street", 21 + context.xShift, 5, 21 + context.xShift, 29),
239:     road("gen-cross-coastal-pier", "crosswalk", shoreX - 2, 25, shoreX + 2, 25),
240:   ];
241: }
242: 
243: function mountainValleyRoads(context: LayoutContext): CityWorldRoadSeed[] {
244:   return [
245:     road("gen-road-mountain-upper-contour", "street", 4, 13 + context.yShift, 24, 13 + context.yShift),
246:     road("gen-road-mountain-mid-contour", "avenue", 10, 23, 38, 23),
247:     road("gen-road-mountain-lower-contour", "street", 18, 30, 41, 30),
248:     road("gen-road-mountain-switchback", "street", 24 + context.xShift, 8, 24 + context.xShift, 27),
249:     road("gen-road-mountain-ridge", "driveway", 16, 8, 25, 8),
250:     road("gen-cross-mountain-main", "crosswalk", 22, 20, 26, 20),
251:   ];
252: }
253: 
254: function prairieTownRoads(context: LayoutContext): CityWorldRoadSeed[] {
255:   return [
256:     road("gen-road-prairie-north", "avenue", 3, 4 + context.yShift, 42, 4 + context.yShift),
257:     road("gen-road-prairie-main", "avenue", 3, 18, 42, 18),
258:     road("gen-road-prairie-south", "street", 3, 30, 42, 30),
259:     road("gen-road-prairie-section", "street", 22 + context.xShift, 4, 22 + context.xShift, 30),
260:     road("gen-road-prairie-east-section", "street", 36, 4, 36, 30),
261:     road("gen-cross-prairie-civic", "crosswalk", 22, 18, 27, 18),
262:   ];
263: }
264: 
265: function riverTownRoads(context: LayoutContext): CityWorldRoadSeed[] {
266:   if (context.riverAxis === "vertical") {
267:     return [
268:       road("gen-road-river-west-bank", "avenue", 18, 5, 18, 30),
269:       road("gen-road-river-east-bank", "avenue", 28, 5, 28, 30),
270:       road("gen-road-river-north-cross", "street", 5, 10 + context.yShift, 39, 10 + context.yShift),
271:       road("gen-road-river-mid-cross", "avenue", 6, 18, 39, 18),
272:       road("gen-road-river-dock-cross", "street", 6, 26, 39, 26),
273:       road("gen-cross-river-bridge", "crosswalk", 20, 18, 26, 18),
274:     ];
275:   }
276: 
277:   return [
278:     road("gen-road-river-main", "avenue", 34, 5, 34, 30),
279:     road("gen-road-river-west", "street", 22 + context.xShift, 5, 22 + context.xShift, 29),
280:     road("gen-road-river-north-cross", "street", 5, 10 + context.yShift, 36, 10 + context.yShift),
281:     road("gen-road-river-mid-cross", "avenue", 6, 18, 36, 18),
282:     road("gen-road-river-dock-cross", "street", 6, 31, 37, 31),
283:     road("gen-cross-river-bridge", "crosswalk", 34, 14, 34, 21),
428:   if (typeof parameters === "string") return fallback;
429:   if (isWaterDependentGeneratedDistrictArchetype(parameters.archetype)) {
430:     if (parameters.climate.aridity === "arid") {
431:       throw new Error(`Water-dependent archetype ${parameters.archetype} cannot strip water for arid county parameters`);
432:     }
433:     return fallback.kind === "water" ? fallback : waterEdgeBonusZone(parameters.archetype);
434:   }
435:   if (parameters.modulation.waterAffinity >= 0.75 && parameters.climate.aridity !== "arid" && parameters.archetype !== "desert_basin") {
436:     return {
437:       id: "water-edge",
438:       kind: "water",
439:       rect: { minX: 37, minY: 20, maxX: 43, maxY: 31 },
440:       label: parameters.archetype === "river_town" ? "River edge" : parameters.archetype === "coastal_grid" ? "Coastal edge" : "Water edge",
441:     };
442:   }
443:   if (parameters.climate.aridity === "arid" || parameters.nameSignal.includes("mesa") || parameters.nameSignal.includes("desert")) {
444:     return {
445:       id: "desert-plaza",
446:       kind: "plaza",
447:       rect: { minX: 34, minY: 21, maxX: 41, maxY: 29 },
448:       label: "Dry plaza",
449:       elevationBoost: parameters.modulation.dryReliefBoost,
450:     };
451:   }
452:   return fallback;
453: }
454: 
455: function waterEdgeBonusZone(archetype: GeneratedDistrictArchetype): CityWorldZoneSpec {
456:   return {
457:     id: "water-edge",
458:     kind: "water",
459:     rect: { minX: 37, minY: 20, maxX: 43, maxY: 31 },
460:     label: archetype === "river_town" ? "River edge" : archetype === "coastal_grid" ? "Coastal edge" : "Water edge",
461:   };
462: }
463: 
464: function bonusRoadFor(
465:   parameters: GeneratedDistrictArchetype | CountyGenerationParameters,
466:   fallback: CityWorldRoadSeed,
467: ): CityWorldRoadSeed {
468:   if (typeof parameters === "string") return fallback;
469:   const bonusZone = bonusZoneFor(parameters, parameters.archetypeProfile.zones.bonusZone);
470:   if (bonusZone.kind === "water") {
471:     return { id: "gen-road-water-edge", kind: "driveway", from: { x: 34, y: 24 }, to: { x: 41, y: 24 } };
472:   }
473:   return fallback;

codex
Renderer-side rendering is competent enough to avoid a blank toy board, but it also hides how few assets exist: one tree/bush primitive, a small water/street-furniture set, and a global grade over everything. The critique will focus on where the code cannot produce hand-built identity at scale.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n \"export type CityWorldPropKind|type CityWorldProp|kind: \\\"|CityWorldPropKind|PropKind\" packages/core/src/voxel/cityWorldTypes.ts packages/core/src/voxel/*.ts" in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "generated|hand-built|which one is curated|flat color|Terrain has relief|region-true|templates|jitter|hardcod|prop|tree|terrain|palette|facade|roof" docs/NORTH_STARS.md docs/ENGINE_TODO.md docs/V1_PRODUCTION_BACKLOG.md artifacts/emulator/audit/REPORT.md artifacts/engine-todo/CODEX_RESULT_E*.md' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldPaletteRegistry.ts | ForEach-Object { $i++; if (($i -ge 1 -and $i -le 220) -or ($i -ge 220 -and $i -le 360)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content web/src/CityWorldRenderer.tsx | ForEach-Object { $i++; if (($i -ge 123 -and $i -le 136) -or ($i -ge 288 -and $i -le 352) -or ($i -ge 1499 -and $i -le 1568) -or ($i -ge 6387 -and $i -le 6580) -or ($i -ge 7011 -and $i -le 7033)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
2026-07-11T06:21:04.256366Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.6 seconds
Output:
artifacts/emulator/audit/REPORT.md:15:| autauga-al | 1 | metro_grid | desktop | light | pass: state=delivered; errors=0 | pass: graphics=854; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:16:| autauga-al | 1 | metro_grid | desktop | dark | pass: state=delivered; errors=0 | pass: graphics=854; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:17:| autauga-al | 1 | metro_grid | mobile | light | pass: state=delivered; errors=0 | pass: graphics=962; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:18:| autauga-al | 1 | metro_grid | mobile | dark | pass: state=delivered; errors=0 | pass: graphics=962; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:19:| aleutians-east-borough-ak | 1 | coastal_grid | desktop | light | pass: state=delivered; errors=0 | pass: graphics=867; ceiling=1600 | pass: max generatedDraftSceneChars=800211; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:20:| aleutians-east-borough-ak | 1 | coastal_grid | mobile | light | pass: state=delivered; errors=0 | pass: graphics=955; ceiling=1600 | pass: max generatedDraftSceneChars=800211; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:21:| apache-az | 1 | desert_basin | desktop | light | pass: state=delivered; errors=0 | pass: graphics=684; ceiling=1600 | pass: max generatedDraftSceneChars=815086; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:22:| apache-az | 1 | desert_basin | mobile | light | pass: state=delivered; errors=0 | pass: graphics=857; ceiling=1600 | pass: max generatedDraftSceneChars=815086; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:23:| adams-co | 1 | mountain_valley | desktop | light | pass: state=delivered; errors=0 | pass: graphics=369; ceiling=1600 | pass: max generatedDraftSceneChars=853252; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:24:| adams-co | 1 | mountain_valley | mobile | light | pass: state=delivered; errors=0 | pass: graphics=483; ceiling=1600 | pass: max generatedDraftSceneChars=853252; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:25:| adair-ia | 1 | prairie_town | desktop | light | pass: state=delivered; errors=0 | pass: graphics=542; ceiling=1600 | pass: max generatedDraftSceneChars=786533; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:26:| adair-ia | 1 | prairie_town | mobile | light | pass: state=delivered; errors=0 | pass: graphics=564; ceiling=1600 | pass: max generatedDraftSceneChars=786533; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:27:| butler-al | 1 | river_town | desktop | light | pass: state=delivered; errors=0 | pass: graphics=613; ceiling=1600 | pass: max generatedDraftSceneChars=841017; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:28:| butler-al | 1 | river_town | mobile | light | pass: state=delivered; errors=0 | pass: graphics=682; ceiling=1600 | pass: max generatedDraftSceneChars=841017; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:29:| riverside-ca | 0 | curated | desktop | light | pass: state=delivered; errors=0 | pass: graphics=780; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:30:| riverside-ca | 0 | curated | desktop | dark | pass: state=delivered; errors=0 | pass: graphics=780; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:31:| riverside-ca | 0 | curated | mobile | light | pass: state=delivered; errors=0 | pass: graphics=774; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:32:| riverside-ca | 0 | curated | mobile | dark | pass: state=delivered; errors=0 | pass: graphics=774; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:33:| orange-ca | 0 | shell | desktop | light | pass: state=delivered; errors=0 | pass: graphics=33; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
docs/ENGINE_TODO.md:27:  voxel trees — street trees, park clusters, shelter rows. Generated boards
docs/ENGINE_TODO.md:29:  ~50 trees ≈ +100 Graphics, safe). Zone-aware placement: parks dense,
docs/ENGINE_TODO.md:30:  residential street-tree rhythm, prairie shelter rows, desert sparse scrub.
docs/ENGINE_TODO.md:31:  The single biggest "reads hand-built" lever.
docs/ENGINE_TODO.md:45:  `materialProfile`/`roofProfile` key off curated Eastvale ids
docs/ENGINE_TODO.md:46:  (cityWorldCompiler.ts:1459,1533) — generated silently degrades to defaults.
docs/ENGINE_TODO.md:47:  Route through authored grammar (facadeStyle/roofShape), not id matches.
docs/ENGINE_TODO.md:49:  prairie grain-elevator and desert mesa tower need tower roof grammar.
docs/ENGINE_TODO.md:58:  `generatedOverviewFocus`'s composition scorer to VALUE water presence for
docs/ENGINE_TODO.md:67:| 2 | E2 vegetation saturation | generator prop placement | prop ≤90, Graphics ≤1600 (reviewer), parity green |
docs/ENGINE_TODO.md:68:| 3 | E3 water read + E4 terrain strata | archetype layouts + renderer water/cliff treatment | parity + perf; screenshot judgment |
docs/ENGINE_TODO.md:69:| 4 | E5 block fills | generator lot/terrain treatments | composition floors rise, no clutter regression |
docs/ENGINE_TODO.md:72:Anti-scope per AGENTS.md unchanged: no new deps, no new prop kinds beyond the
docs/NORTH_STARS.md:13:hand-built voxel diorama of that place inline — county-scale, isometric,
docs/NORTH_STARS.md:29:3. **Scalable, deliberately.** Riverside/Eastvale is the proof cell of one
docs/NORTH_STARS.md:30:   world model that ladders county → state → country. Curated and generated
docs/NORTH_STARS.md:31:   scenes are held to the same bar — the parity gates exist so "generated"
docs/NORTH_STARS.md:47:## NS-1 · The Diorama — every scene reads hand-built
docs/NORTH_STARS.md:49:**Ideal:** any district, curated or generated, reads as a miniature town
docs/NORTH_STARS.md:55:- A cold screenshot of a generated district fails the "which one is curated?"
docs/NORTH_STARS.md:57:- No flat color field survives at any supported zoom: overview reads massing
docs/NORTH_STARS.md:58:  and palette; detail zoom reads material (courses, seams, texture).
docs/NORTH_STARS.md:59:- Occlusion is always correct — props, buildings, terrain interleave by true
docs/NORTH_STARS.md:61:- Residential fabric is dense and varied: continuous small-house streets, no
docs/NORTH_STARS.md:63:- Terrain has relief — plateaus, cliff courses, shore basins — and props feel
docs/NORTH_STARS.md:67:**Enforced by:** `verify-generated-district-parity` (composition ≥0.60, clone
docs/NORTH_STARS.md:68:pressure ≤0.30, contact ≥0.95, roof safety), fabric-floor regression test,
docs/NORTH_STARS.md:184:- A generated county passes the NS-1 crop test against curated Eastvale —
docs/NORTH_STARS.md:185:  "which one is curated?" has no reliable answer, for ANY county.
docs/NORTH_STARS.md:188:  desert/mountain/prairie) carries region-true palettes, massing, landmarks,
docs/NORTH_STARS.md:189:  and terrain, not six templates × jitter.
docs/NORTH_STARS.md:205:**Current:** proof cell + parity-gated generation at draft bar. This north
docs/V1_PRODUCTION_BACKLOG.md:5:submission until generated counties pass the crop test · HIDE the save surface
docs/V1_PRODUCTION_BACKLOG.md:41:- C1 **0.76-4 terrain features** (mesa rims, cliff courses, river banks) —
docs/V1_PRODUCTION_BACKLOG.md:43:- C2 **Curated-id hardcoding divergence**: `materialProfile`/`roofProfile`/
docs/V1_PRODUCTION_BACKLOG.md:45:  1533,1560-1566`) — generated districts silently degrade to defaults. Route
docs/V1_PRODUCTION_BACKLOG.md:48:  — the prairie grain-elevator/desert mesa tower need tower roof grammar.
docs/V1_PRODUCTION_BACKLOG.md:82:   crop test passes for generated counties.
rg: artifacts/engine-todo/CODEX_RESULT_E*.md: The filename, directory name, or volume label syntax is incorrect. (os error 123)

 exited 1 in 635ms:
artifacts/emulator/audit/REPORT.md:15:| autauga-al | 1 | metro_grid | desktop | light | pass: state=delivered; errors=0 | pass: graphics=854; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:16:| autauga-al | 1 | metro_grid | desktop | dark | pass: state=delivered; errors=0 | pass: graphics=854; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:17:| autauga-al | 1 | metro_grid | mobile | light | pass: state=delivered; errors=0 | pass: graphics=962; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:18:| autauga-al | 1 | metro_grid | mobile | dark | pass: state=delivered; errors=0 | pass: graphics=962; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:19:| aleutians-east-borough-ak | 1 | coastal_grid | desktop | light | pass: state=delivered; errors=0 | pass: graphics=867; ceiling=1600 | pass: max generatedDraftSceneChars=800211; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:20:| aleutians-east-borough-ak | 1 | coastal_grid | mobile | light | pass: state=delivered; errors=0 | pass: graphics=955; ceiling=1600 | pass: max generatedDraftSceneChars=800211; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:21:| apache-az | 1 | desert_basin | desktop | light | pass: state=delivered; errors=0 | pass: graphics=684; ceiling=1600 | pass: max generatedDraftSceneChars=815086; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:22:| apache-az | 1 | desert_basin | mobile | light | pass: state=delivered; errors=0 | pass: graphics=857; ceiling=1600 | pass: max generatedDraftSceneChars=815086; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:23:| adams-co | 1 | mountain_valley | desktop | light | pass: state=delivered; errors=0 | pass: graphics=369; ceiling=1600 | pass: max generatedDraftSceneChars=853252; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:24:| adams-co | 1 | mountain_valley | mobile | light | pass: state=delivered; errors=0 | pass: graphics=483; ceiling=1600 | pass: max generatedDraftSceneChars=853252; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:25:| adair-ia | 1 | prairie_town | desktop | light | pass: state=delivered; errors=0 | pass: graphics=542; ceiling=1600 | pass: max generatedDraftSceneChars=786533; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:26:| adair-ia | 1 | prairie_town | mobile | light | pass: state=delivered; errors=0 | pass: graphics=564; ceiling=1600 | pass: max generatedDraftSceneChars=786533; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:27:| butler-al | 1 | river_town | desktop | light | pass: state=delivered; errors=0 | pass: graphics=613; ceiling=1600 | pass: max generatedDraftSceneChars=841017; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:28:| butler-al | 1 | river_town | mobile | light | pass: state=delivered; errors=0 | pass: graphics=682; ceiling=1600 | pass: max generatedDraftSceneChars=841017; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:29:| riverside-ca | 0 | curated | desktop | light | pass: state=delivered; errors=0 | pass: graphics=780; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:30:| riverside-ca | 0 | curated | desktop | dark | pass: state=delivered; errors=0 | pass: graphics=780; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:31:| riverside-ca | 0 | curated | mobile | light | pass: state=delivered; errors=0 | pass: graphics=774; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:32:| riverside-ca | 0 | curated | mobile | dark | pass: state=delivered; errors=0 | pass: graphics=774; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
artifacts/emulator/audit/REPORT.md:33:| orange-ca | 0 | shell | desktop | light | pass: state=delivered; errors=0 | pass: graphics=33; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
docs/ENGINE_TODO.md:27:  voxel trees — street trees, park clusters, shelter rows. Generated boards
docs/ENGINE_TODO.md:29:  ~50 trees ≈ +100 Graphics, safe). Zone-aware placement: parks dense,
docs/ENGINE_TODO.md:30:  residential street-tree rhythm, prairie shelter rows, desert sparse scrub.
docs/ENGINE_TODO.md:31:  The single biggest "reads hand-built" lever.
docs/ENGINE_TODO.md:45:  `materialProfile`/`roofProfile` key off curated Eastvale ids
docs/ENGINE_TODO.md:46:  (cityWorldCompiler.ts:1459,1533) — generated silently degrades to defaults.
docs/ENGINE_TODO.md:47:  Route through authored grammar (facadeStyle/roofShape), not id matches.
docs/ENGINE_TODO.md:49:  prairie grain-elevator and desert mesa tower need tower roof grammar.
docs/ENGINE_TODO.md:58:  `generatedOverviewFocus`'s composition scorer to VALUE water presence for
docs/ENGINE_TODO.md:67:| 2 | E2 vegetation saturation | generator prop placement | prop ≤90, Graphics ≤1600 (reviewer), parity green |
docs/ENGINE_TODO.md:68:| 3 | E3 water read + E4 terrain strata | archetype layouts + renderer water/cliff treatment | parity + perf; screenshot judgment |
docs/ENGINE_TODO.md:69:| 4 | E5 block fills | generator lot/terrain treatments | composition floors rise, no clutter regression |
docs/ENGINE_TODO.md:72:Anti-scope per AGENTS.md unchanged: no new deps, no new prop kinds beyond the
docs/NORTH_STARS.md:13:hand-built voxel diorama of that place inline — county-scale, isometric,
docs/NORTH_STARS.md:29:3. **Scalable, deliberately.** Riverside/Eastvale is the proof cell of one
docs/NORTH_STARS.md:30:   world model that ladders county → state → country. Curated and generated
docs/NORTH_STARS.md:31:   scenes are held to the same bar — the parity gates exist so "generated"
docs/NORTH_STARS.md:47:## NS-1 · The Diorama — every scene reads hand-built
docs/NORTH_STARS.md:49:**Ideal:** any district, curated or generated, reads as a miniature town
docs/NORTH_STARS.md:55:- A cold screenshot of a generated district fails the "which one is curated?"
docs/NORTH_STARS.md:57:- No flat color field survives at any supported zoom: overview reads massing
docs/NORTH_STARS.md:58:  and palette; detail zoom reads material (courses, seams, texture).
docs/NORTH_STARS.md:59:- Occlusion is always correct — props, buildings, terrain interleave by true
docs/NORTH_STARS.md:61:- Residential fabric is dense and varied: continuous small-house streets, no
docs/NORTH_STARS.md:63:- Terrain has relief — plateaus, cliff courses, shore basins — and props feel
docs/NORTH_STARS.md:67:**Enforced by:** `verify-generated-district-parity` (composition ≥0.60, clone
docs/NORTH_STARS.md:68:pressure ≤0.30, contact ≥0.95, roof safety), fabric-floor regression test,
docs/NORTH_STARS.md:184:- A generated county passes the NS-1 crop test against curated Eastvale —
docs/NORTH_STARS.md:185:  "which one is curated?" has no reliable answer, for ANY county.
docs/NORTH_STARS.md:188:  desert/mountain/prairie) carries region-true palettes, massing, landmarks,
docs/NORTH_STARS.md:189:  and terrain, not six templates × jitter.
docs/NORTH_STARS.md:205:**Current:** proof cell + parity-gated generation at draft bar. This north
docs/V1_PRODUCTION_BACKLOG.md:5:submission until generated counties pass the crop test · HIDE the save surface
docs/V1_PRODUCTION_BACKLOG.md:41:- C1 **0.76-4 terrain features** (mesa rims, cliff courses, river banks) —
docs/V1_PRODUCTION_BACKLOG.md:43:- C2 **Curated-id hardcoding divergence**: `materialProfile`/`roofProfile`/
docs/V1_PRODUCTION_BACKLOG.md:45:  1533,1560-1566`) — generated districts silently degrade to defaults. Route
docs/V1_PRODUCTION_BACKLOG.md:48:  — the prairie grain-elevator/desert mesa tower need tower roof grammar.
docs/V1_PRODUCTION_BACKLOG.md:82:   crop test passes for generated counties.
rg: artifacts/engine-todo/CODEX_RESULT_E*.md: The filename, directory name, or volume label syntax is incorrect. (os error 123)

2026-07-11T06:21:04.276400Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.7 seconds
Output:
The string is missing the terminator: ".
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : TerminatorExpectedAtEndOfString
 

 exited 1 in 658ms:
The string is missing the terminator: ".
    + CategoryInfo          : ParserError: (:) [], ParentContainsErrorRecordException
    + FullyQualifiedErrorId : TerminatorExpectedAtEndOfString
 

 succeeded in 790ms:
1: import type { CityWorldBuilding } from "./cityWorldTypes.js";
2: import { REGIONAL_BUILDING_PALETTES } from "./cityWorldRegionalPalettes.js";
3: 
4: /**
5:  * Effective building palette registry.
6:  *
7:  * The renderer resolves every building's body/roof color through the shared
8:  * atlas manifest (`packages/assets/city-world/atlas.manifest.json`): the
9:  * manifest palette WINS and the authored per-building scene-data color is only
10:  * a fallback for keys the manifest does not know. Honest clone/variant
11:  * diagnostics therefore have to key on the SAME resolution, or they measure
12:  * data the player never sees.
13:  *
14:  * This table is a core-side mirror of every `building.*` palette in the atlas
15:  * manifest. `scripts/verify-public-object-kit-prefab-palette.mjs` asserts the
16:  * two stay byte-identical, so the registry cannot silently drift from what the
17:  * renderer draws.
18:  */
19: 
20: export type CityWorldBuildingPaletteColors = {
21:   base: string;
22:   shade: string;
23:   highlight: string;
24:   accent?: string;
25:   roof?: string;
26:   trim?: string;
27: };
28: 
29: export const CITY_WORLD_BUILDING_PALETTES: Record<string, CityWorldBuildingPaletteColors> = {
30:   "building.apartment.4": { base: "#ead7bb", shade: "#c7aa8a", highlight: "#fff4d8", roof: "#6d8f6f", trim: "#26332c" },
31:   "building.apartment.5": { base: "#e7c9a8", shade: "#bd9871", highlight: "#fff4d8", roof: "#567d8c", trim: "#26332c" },
32:   "building.civic.1": { base: "#f3dfbd", shade: "#cdb283", highlight: "#fff2d2", roof: "#628fa3", trim: "#f0c451" },
33:   "building.gym.2": { base: "#d7e7ef", shade: "#a8c5d3", highlight: "#ffffff", roof: "#c26a52", trim: "#26332c" },
34:   "building.home.0": { base: "#f5e6ca", shade: "#d6bd98", highlight: "#fff1b5", roof: "#c26a52", trim: "#7e5b3b" },
35:   "building.home.1": { base: "#f1dcb9", shade: "#cba981", highlight: "#fff1b5", roof: "#6b91a8", trim: "#7e5b3b" },
36:   "building.home.2": { base: "#ecd1ae", shade: "#c49d75", highlight: "#fff1b5", roof: "#7da172", trim: "#7e5b3b" },
37:   "building.home.3": { base: "#fff0cf", shade: "#d6bd98", highlight: "#fff8da", roof: "#cfae62", trim: "#7e5b3b" },
38:   "building.home.4": { base: "#f5e6ca", shade: "#d6bd98", highlight: "#fff1b5", roof: "#b98352", trim: "#7e5b3b" },
39:   "building.home.5": { base: "#f1dcb9", shade: "#cba981", highlight: "#fff1b5", roof: "#8b7295", trim: "#7e5b3b" },
40:   "building.house.cottage.v1": { base: "#f5e6ca", shade: "#d6bd98", highlight: "#fff8da", roof: "#c26a52", trim: "#7e5b3b" },
41:   "building.house.cottage.v2": { base: "#efd9b8", shade: "#cdb489", highlight: "#fff2d6", roof: "#7d9a86", trim: "#7e5b3b" },
42:   "building.house.cottage.v3": { base: "#f0dcc4", shade: "#ccb489", highlight: "#fff4da", roof: "#6f8fa8", trim: "#7e5b3b" },
43:   "building.house.cottage.v4": { base: "#ecdcc0", shade: "#c9b58c", highlight: "#fff3d4", roof: "#b08a5a", trim: "#7e5b3b" },
44:   "building.house.ranch.v1": { base: "#ecd1ae", shade: "#c49d75", highlight: "#fff1b5", roof: "#7da172", trim: "#7e5b3b" },
45:   "building.house.ranch.v2": { base: "#e8cfad", shade: "#c09a73", highlight: "#fff0b8", roof: "#a9704f", trim: "#7e5b3b" },
46:   "building.house.ranch.v3": { base: "#ecd6b6", shade: "#c3a37b", highlight: "#fff3c2", roof: "#5f7f8e", trim: "#7e5b3b" },
47:   "building.house.rowhome.flat_parapet.v1": { base: "#f2dfc2", shade: "#cdb18c", highlight: "#fff4d8", roof: "#8ab0c5", trim: "#3f7596" },
48:   "building.house.rowhome.flat_parapet.v2": { base: "#eed9c0", shade: "#c9ac88", highlight: "#fff2d4", roof: "#6f7d8f", trim: "#3f5566" },
49:   "building.apartment.lowrise.stepped.v1": { base: "#ead7bb", shade: "#c7aa8a", highlight: "#fff4d8", roof: "#6d8f6f", trim: "#26332c" },
50:   "building.apartment.lowrise.stepped.v2": { base: "#e7cfae", shade: "#c3a37c", highlight: "#fff1d0", roof: "#587a8e", trim: "#26332c" },
51:   "building.apartment.lowrise.stepped.v3": { base: "#e3d0b4", shade: "#bfa47e", highlight: "#fff1d2", roof: "#8a6f95", trim: "#26332c" },
52:   "building.store.strip.three_bay.v1": { base: "#f2dfc2", shade: "#cdb18c", highlight: "#fff4d8", roof: "#82a4c4", trim: "#5b9fcb" },
53:   "building.store.strip.three_bay.v2": { base: "#efdcc0", shade: "#c9ac88", highlight: "#fff2d4", roof: "#c48a5a", trim: "#a8703f" },
54:   "building.store.strip.three_bay.v3": { base: "#eedcc4", shade: "#c8b189", highlight: "#fff3d6", roof: "#6f9a86", trim: "#4f7d6a" },
55:   "building.gym.sawtooth.v1": { base: "#d7e7ef", shade: "#a8c5d3", highlight: "#ffffff", roof: "#c26a52", trim: "#26332c" },
56:   "building.gym.sawtooth.v2": { base: "#d3e2ea", shade: "#a3c0cf", highlight: "#fbffff", roof: "#5f8fa6", trim: "#26332c" },
57:   "building.venue.anaheim_convention_center.v1": { base: "#f0d9ab", shade: "#c8ae7c", highlight: "#fff0c8", roof: "#97bcc9", trim: "#4e8298" },
58:   "building.shop.1": { base: "#f2dfc2", shade: "#cdb18c", highlight: "#fff4d8", roof: "#cfa057", trim: "#5b9fcb" },
59:   "building.shop.2": { base: "#f2dfc2", shade: "#cdb18c", highlight: "#fff4d8", roof: "#c37481", trim: "#cfa057" },
60:   ...REGIONAL_BUILDING_PALETTES,
61: };
62: 
63: /** Mirror of the renderer's `FALLBACK_PALETTES.building` (no roof entry). */
64: export const CITY_WORLD_FALLBACK_BUILDING_PALETTE: CityWorldBuildingPaletteColors = {
65:   base: "#f2dfc2",
66:   shade: "#cdb18c",
67:   highlight: "#fff4d8",
68:   accent: "#fff4d8",
69:   trim: "#cdb18c",
70: };
71: 
72: /** Mirror of the renderer's hard default roof for draft buildings without palette roof. */
73: const DRAFT_DEFAULT_ROOF = "#8c9b75";
74: 
75: export type CityWorldEffectiveBuildingColors = {
76:   bodyColor: string;
77:   roofColor: string;
78: };
79: 
80: /**
81:  * Resolve the colors a building actually renders with, mirroring
82:  * `createBuildingGeometry` in `web/src/CityWorldRenderer.tsx`:
83:  * - hidden-draft buildings (`draft-building-*`) keep their authored colors;
84:  * - every other building resolves through the manifest palette first and only
85:  *   falls back to the authored scene-data color when the palette has no entry.
86:  */
87: export function resolveEffectiveBuildingColors(building: CityWorldBuilding): CityWorldEffectiveBuildingColors {
88:   const palette = building.paletteKey ? CITY_WORLD_BUILDING_PALETTES[building.paletteKey] : undefined;
89: 
90:   if (building.id.startsWith("draft-building-")) {
91:     return {
92:       bodyColor: (building.bodyColor ?? palette?.base ?? CITY_WORLD_FALLBACK_BUILDING_PALETTE.base).toLowerCase(),
93:       roofColor: (building.roofColor ?? palette?.roof ?? DRAFT_DEFAULT_ROOF).toLowerCase(),
94:     };
95:   }
96: 
97:   const resolved = palette ?? CITY_WORLD_FALLBACK_BUILDING_PALETTE;
98:   return {
99:     bodyColor: (resolved.base ?? building.bodyColor).toLowerCase(),
100:     roofColor: (resolved.roof ?? building.roofColor).toLowerCase(),
101:   };
102: }

 succeeded in 897ms:
123: // at roughly 40 degrees elevation. Every face in the world shades from the
124: // same source: tops are brightest (warm), lower-left faces catch the sun,
125: // lower-right faces fall into cool shade, and cast shadows skew to the
126: // lower-right along the sun->ground vector.
127: const SUN_WARM_TINT = 0xffe2ae;
128: const SUN_COOL_TINT = 0x46658a;
129: const CAST_SHADOW_COLOR = 0x27404b;
130: const CAST_SHADOW_ALPHA = 0.5;
131: // Screen-space ground offset of a cast shadow per pixel of object height.
132: const CAST_SHADOW_VECTOR = { x: 0.92, y: 0.21 };
133: // The surround is the "table" the diorama sits on and must adopt the host
134: // theme (NS-3 crop test: a dark ChatGPT thread must not frame a bright
135: // board). The diorama itself stays the only colorful thing in both themes.
136: const BACKGROUND_COLOR_LIGHT = 0xa6b87c;
288: // cool-shadow split tone, soft vignette, warm atmospheric edge haze, and a
289: // 1-bit dither to kill gradient banding. Physically motivated (sunlight +
290: // atmosphere), not a glow effect.
291: const GRADE_VERTEX_SHADER = `
292: in vec2 aPosition;
293: out vec2 vTextureCoord;
294: out vec2 vFrameCoord;
295: 
296: uniform vec4 uInputSize;
297: uniform vec4 uOutputFrame;
298: uniform vec4 uOutputTexture;
299: 
300: vec4 filterVertexPosition( void )
301: {
302:     vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
303:     position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
304:     position.y = position.y * (2.0 * uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
305:     return vec4(position, 0.0, 1.0);
306: }
307: 
308: vec2 filterTextureCoord( void )
309: {
310:     return aPosition * (uOutputFrame.zw * uInputSize.zw);
311: }
312: 
313: void main(void)
314: {
315:     gl_Position = filterVertexPosition();
316:     vTextureCoord = filterTextureCoord();
317:     vFrameCoord = aPosition;
318: }
319: `;
320: 
321: const GRADE_FRAGMENT_SHADER = `
322: in vec2 vTextureCoord;
323: in vec2 vFrameCoord;
324: out vec4 finalColor;
325: 
326: uniform sampler2D uTexture;
327: 
328: void main(void)
329: {
330:     vec4 source = texture(uTexture, vTextureCoord);
331:     vec3 c = source.rgb;
332: 
333:     // S-curve for form contrast â€” firmer than before so directional wall
334:     // shading survives the grade instead of washing to a matte pastel.
335:     c = mix(c, c * c * (3.0 - 2.0 * c), 0.46);
336: 
337:     // 0.54E â€” highlight rolloff. Sunlit stucco and lit roofs ride near-white
338:     // luma and used to blow out into one paper tone; compressing the top of
339:     // the range keeps their form (rims, material fields, tint spreads)
340:     // legible while the scene still reads sunlit. This is the single biggest
341:     // wash fix and applies to every scene the engine serves.
342:     float luma = dot(c, vec3(0.299, 0.587, 0.114));
343:     c *= mix(1.0, 0.87, smoothstep(0.68, 1.0, luma));
344: 
345:     // Gentler saturation trim: calm SoCal palette, but material identity
346:     // (clay vs metal vs glass, per-home tint spread) survives the grade.
347:     luma = dot(c, vec3(0.299, 0.587, 0.114));
348:     c = mix(vec3(luma), c, 0.96);
349: 
350:     // Golden-hour split tone: warm sunlit highlights, cool shadows.
351:     vec3 warm = vec3(1.055, 1.005, 0.915);
352:     vec3 cool = vec3(0.925, 0.975, 1.065);
1499:   const regionalTerrain = tile.paletteKey?.startsWith("terrain.region.") ? atlas.resolvePalette(tile.paletteKey, "terrain").colors : undefined;
1500:   const baseColor = shellTile ? SHELL_TERRAIN_COLORS[tile.kind] : draftTile ? DRAFT_TERRAIN_COLORS[tile.kind] : regionalTerrain ? colorToNumber(regionalTerrain.base) : TERRAIN_COLORS[tile.kind];
1501:   // Deterministic tonal variation: two low-frequency waves plus a whisper of
1502:   // per-tile hash so the ground reads as planted terrain, not a flat board â€”
1503:   // and not a checkerboard. Calm range only.
1504:   const lowFrequencyTone =
1505:     Math.sin(tile.position.x * 0.16 + tile.position.y * 0.23) * 3.4 +
1506:     Math.sin(tile.position.x * 0.055 - tile.position.y * 0.083) * 3.0;
1507:   const toneHash = ((tile.position.x * 73856093) ^ (tile.position.y * 19349663) ^ (tile.variant * 83492791)) >>> 0;
1508:   const hashTone = ((toneHash % 5) - 2) * 0.8;
1509:   const toneScale = tile.kind === "water" ? 0.9 : tile.kind === "grass" ? 1.25 : 0.6;
1510:   const variation = (tile.variant - 2) * (tile.kind === "water" ? 3.1 : tile.kind === "grass" ? 1.2 : 1.8) + (lowFrequencyTone + hashTone) * toneScale;
1511:   // Ground sits a half-step below the sunlit rooftops so built forms read
1512:   // bright against the terrain instead of blending into it.
1513:   const color = shellTile
1514:     ? mixColor(scaleColor(shadeColor(baseColor, variation * 0.35), 0.96), 0xe0dec4, 0.16)
1515:     : tile.kind === "water"
1516:       ? mixColor(scaleColor(shadeColor(baseColor, variation), 0.96), 0x082f57, 0.18)
1517:       : mixColor(scaleColor(shadeColor(baseColor, variation), 0.98), SUN_WARM_TINT, 0.07);
1518:   const alpha = shellTile ? (tile.kind === "grass" ? 0.86 : 0.9) : draftTile ? (tile.kind === "grass" ? 0.84 : 0.92) : tile.kind === "water" ? 0.97 : tile.kind === "grass" ? 0.92 : 0.94;
1519:   const strokeAlpha = shellTile ? (tile.kind === "grass" ? 0.1 : 0.14) : draftTile ? (tile.kind === "grass" ? 0.018 : 0.1) : tile.kind === "grass" ? 0.026 : tile.kind === "water" ? 0.28 : 0.12;
1520:   const strokeColor = tile.kind === "water" ? 0x0b4f79 : shellTile ? 0x747965 : draftTile ? 0x7a8a58 : regionalTerrain ? colorToNumber(regionalTerrain.shade) : 0x6d824f;
1521:   // Massing/elevation extrusions first, then the tile face: within a shared
1522:   // Graphics, path order is z order (old per-object add order preserved).
1523:   drawTerrainChunkMassing(g, tile, point, color);
1524:   drawTerrainElevationEdges(g, tile, point, color);
1525:   drawTerrainCliffCourses(g, tile, point, color);
1526:   const graphic = appendPolygon(g, diamondPoints(point, TILE_WIDTH + 1, TILE_HEIGHT + 1), color, alpha, strokeColor, strokeAlpha);
1527: 
1528:   if (tile.kind === "water") {
1529:     // Depth gradient + sheen: bright sun edge, deep blue falloff below.
1530:     graphic
1531:       .poly([point.x - TILE_WIDTH * 0.5, point.y, point.x, point.y - TILE_HEIGHT * 0.5, point.x + TILE_WIDTH * 0.16, point.y - TILE_HEIGHT * 0.34, point.x - TILE_WIDTH * 0.28, point.y + TILE_HEIGHT * 0.1], true)
1532:       .fill({ color: 0x75c9ee, alpha: 0.22 })
1533:       .poly([point.x + TILE_WIDTH * 0.5, point.y, point.x, point.y + TILE_HEIGHT * 0.5, point.x - TILE_WIDTH * 0.14, point.y + TILE_HEIGHT * 0.36, point.x + TILE_WIDTH * 0.26, point.y - TILE_HEIGHT * 0.08], true)
1534:       .fill({ color: 0x052f5a, alpha: 0.28 })
1535:       .poly([point.x - TILE_WIDTH * 0.22, point.y - TILE_HEIGHT * 0.04, point.x + TILE_WIDTH * 0.1, point.y - TILE_HEIGHT * 0.2, point.x + TILE_WIDTH * 0.34, point.y - TILE_HEIGHT * 0.02, point.x + TILE_WIDTH * 0.02, point.y + TILE_HEIGHT * 0.16], true)
1536:       .fill({ color: 0x0e5f98, alpha: 0.18 });
1537:     if (tile.variant % 2 === 0) {
1538:       graphic
1539:         .moveTo(point.x - 11, point.y - 1)
1540:         .lineTo(point.x + 13, point.y - 1)
1541:         .stroke({ color: 0xd7f8ff, alpha: 0.28, width: 1.15, cap: "round" });
1542:     }
1543:   } else if (tile.kind === "park" && tile.variant % 3 === 0) {
1544:     graphic.circle(point.x - 5, point.y - 1, 1.8).fill({ color: 0xd8f0b2, alpha: 0.32 });
1545:   } else if (tile.kind === "plaza" && tile.variant % 2 === 0) {
1546:     graphic
1547:       .moveTo(point.x - TILE_WIDTH * 0.22, point.y)
1548:       .lineTo(point.x + TILE_WIDTH * 0.22, point.y)
1549:       .stroke({ color: 0xf5e7c1, alpha: 0.26, width: 1 });
1550:   } else if (tile.kind === "grass" && tile.variant === 4) {
1551:     graphic.circle(point.x + 7, point.y + 1, 1.1).fill({ color: 0xe0efb4, alpha: 0.08 });
1552:   }
1553: 
1554:   if (tile.kind === "grass") drawGrassFacet(graphic, tile, point);
1555:   drawTerrainElevationChunkFace(graphic, tile, point, color);
1556:   drawTerrainParcelComposition(graphic, tile, point);
1557:   drawTerrainContactSeams(graphic, tile, point, contact, color);
1558:   if (draftTile) drawDraftTerrainFacet(graphic, tile, point);
1559:   if (shellTile) drawShellTerrainFacet(graphic, tile, point);
1560: }
1561: 
1562: // 0.74F terrain relief: raised tiles extrude stacked voxel cliff courses on
1563: // every side that drops to a lower neighbor. South/east faces are the
1564: // sun-consistent visible cliff walls; north/west bands read as shadowed cuts
1565: // AND cover the projection gap a raised tile leaves over its back neighbors.
1566: // Authored by the generator as visualGrammar.elevation â€” no neighbor scans here.
1567: function drawTerrainCliffCourses(g: Graphics, tile: CityWorldTerrainTile, point: ProjectedPoint, color: number) {
1568:   const elevation = tile.visualGrammar?.elevation;
6387:   const baseColor = colorToNumber(asset.palette.colors.base);
6388:   const shade = colorToNumber(asset.palette.colors.shade);
6389:   const highlight = colorToNumber(asset.palette.colors.highlight);
6390:   const accent = paletteColor(asset.palette.colors.accent, asset.palette.colors.highlight);
6391: 
6392:   if (prop.kind === "tree" || prop.kind === "bush") {
6393:     // Blocky voxel foliage: trunk cube + 2-3 stacked, shrinking canopy boxes
6394:     // (north-star stacked-cube grammar). Deterministic per-variant palette
6395:     // shift + silhouette so groves read varied without noise.
6396:     const foliage = prop.variant % 2 === 0 ? baseColor : shadeColor(baseColor, 12);
6397:     const shadowReach = prop.kind === "bush" ? 8 : 14;
6398:     const tree = new Graphics()
6399:       .ellipse(point.x + shadowReach * 0.6, point.y - 1 + shadowReach * 0.18, prop.kind === "bush" ? 10 : 15, prop.kind === "bush" ? 3.6 : 4.6)
6400:       .fill({ color: CAST_SHADOW_COLOR, alpha: 0.26 });
6401:     if (prop.kind === "tree") {
6402:       const tall = prop.variant % 3 === 0;
6403:       voxelBox(tree, { x: point.x, y: point.y - 2 }, 5, 3, tall ? 13 : 10, shade);
6404:       voxelBox(tree, { x: point.x, y: point.y - (tall ? 13 : 10) }, 19, 11, 9, shadeColor(foliage, -8));
6405:       voxelBox(tree, { x: point.x, y: point.y - (tall ? 21 : 18) }, 14, 8, 7, foliage);
6406:       if (prop.variant % 2 === 0) {
6407:         voxelBox(tree, { x: point.x, y: point.y - (tall ? 27 : 24) }, 9, 5, 5, shadeColor(foliage, 14));
6408:       }
6409:     } else {
6410:       voxelBox(tree, { x: point.x, y: point.y - 1 }, 13, 8, 6, shadeColor(foliage, -6));
6411:       voxelBox(tree, { x: point.x, y: point.y - 6.5 }, 8, 5, 4, shadeColor(foliage, 10));
6412:     }
6413:     tree.stroke({ color: 0x26332c, alpha: 0.2, width: 1 });
6414:     // Trees stay planted in the focal ring but yield opacity so they never
6415:     // obscure the hero building's face separation.
6416:     tree.alpha = Math.max(calm, 0.7);
6417:     layer.addChild(tree);
6418:     return;
6419:   }
6420: 
6421:   if (prop.kind === "dock") {
6422:     const dock = new Graphics()
6423:       .ellipse(point.x + 4, point.y + 2, 16, 4)
6424:       .fill({ color: 0x1d3a42, alpha: 0.2 });
6425:     // Plank boxes marching toward the water (SE), on two pile cubes.
6426:     voxelBox(dock, { x: point.x - 8, y: point.y - 1 }, 15, 9, 2.5, shade);
6427:     voxelBox(dock, { x: point.x + 3, y: point.y + 4 }, 15, 9, 2.5, baseColor);
6428:     voxelBox(dock, { x: point.x + 14, y: point.y + 9 }, 15, 9, 2.5, shadeColor(baseColor, -8));
6429:     voxelBox(dock, { x: point.x + 20, y: point.y + 14 }, 3, 2.5, 5, shadeColor(shade, -14));
6430:     voxelBox(dock, { x: point.x + 9, y: point.y + 12 }, 3, 2.5, 5, shadeColor(shade, -14));
6431:     dock.stroke({ color: 0x26332c, alpha: 0.22, width: 1 });
6432:     dock.alpha = calm;
6433:     layer.addChild(dock);
6434:     return;
6435:   }
6436: 
6437:   if (prop.kind === "boat") {
6438:     const hullColor = prop.variant % 2 === 0 ? 0xd8dee2 : accent;
6439:     const boat = new Graphics()
6440:       .ellipse(point.x, point.y + 2, 15, 4.5)
6441:       .fill({ color: 0x1d3a42, alpha: 0.24 });
6442:     voxelBox(boat, { x: point.x, y: point.y }, 22, 9, 4, hullColor);
6443:     voxelBox(boat, { x: point.x - 3, y: point.y - 4 }, 9, 6, 4.5, shadeColor(hullColor, 18));
6444:     boat
6445:       .moveTo(point.x + 6, point.y - 4)
6446:       .lineTo(point.x + 6, point.y - 16)
6447:       .stroke({ color: shade, alpha: 0.8, width: 1.4, cap: "round" });
6448:     boat.stroke({ color: 0x26332c, alpha: 0.24, width: 1 });
6449:     boat.alpha = calm;
6450:     layer.addChild(boat);
6451:     return;
6452:   }
6453: 
6454:   if (prop.kind === "water_tower") {
6455:     const tower = new Graphics()
6456:       .ellipse(point.x + 6, point.y + 1, 15, 4.5)
6457:       .fill({ color: CAST_SHADOW_COLOR, alpha: 0.22 });
6458:     // Four leg strokes, tank cylinder, cone cap â€” the skyline landmark.
6459:     tower
6460:       .moveTo(point.x - 8, point.y)
6461:       .lineTo(point.x - 5, point.y - 22)
6462:       .moveTo(point.x + 8, point.y)
6463:       .lineTo(point.x + 5, point.y - 22)
6464:       .moveTo(point.x - 4, point.y + 3)
6465:       .lineTo(point.x - 2.5, point.y - 22)
6466:       .moveTo(point.x + 4, point.y + 3)
6467:       .lineTo(point.x + 2.5, point.y - 22)
6468:       .stroke({ color: shade, alpha: 0.9, width: 1.6, cap: "round" });
6469:     tower
6470:       .moveTo(point.x - 6.5, point.y - 8)
6471:       .lineTo(point.x + 6.5, point.y - 12)
6472:       .stroke({ color: shade, alpha: 0.6, width: 1, cap: "round" });
6473:     tower
6474:       .rect(point.x - 9, point.y - 36, 18, 14)
6475:       .fill({ color: sunlitColor(baseColor, "sun") })
6476:       .rect(point.x + 1, point.y - 36, 8, 14)
6477:       .fill({ color: sunlitColor(baseColor, "shade"), alpha: 0.6 })
6478:       .ellipse(point.x, point.y - 22, 9, 3)
6479:       .fill({ color: shadeColor(baseColor, -20) });
6480:     tower
6481:       .moveTo(point.x - 10, point.y - 35)
6482:       .lineTo(point.x, point.y - 42)
6483:       .lineTo(point.x + 10, point.y - 35)
6484:       .closePath()
6485:       .fill({ color: sunlitColor(accent, "top") });
6486:     tower.stroke({ color: 0x26332c, alpha: 0.3, width: 1 });
6487:     tower.alpha = calm;
6488:     layer.addChild(tower);
6489:     return;
6490:   }
6491: 
6492:   if (prop.kind === "fountain") {
6493:     const fountain = new Graphics()
6494:       .ellipse(point.x, point.y - 7, 20, 11)
6495:       .fill({ color: baseColor, alpha: 0.85 })
6496:       .stroke({ color: shade, alpha: 0.8, width: 2 })
6497:       .circle(point.x, point.y - 14, 4)
6498:       .fill({ color: highlight, alpha: 0.9 });
6499:     animated.push({ target: fountain, kind: "water", path: [], speed: 0.025, phase: prop.variant * 0.2, baseAlpha: 0.78 * calm, origin: point });
6500:     layer.addChild(fountain);
6501:     return;
6502:   }
6503: 
6504:   if (prop.kind === "water_shimmer") {
6505:     const shimmer = new Graphics()
6506:       .moveTo(point.x - 28, point.y)
6507:       .lineTo(point.x + 28, point.y)
6508:       .moveTo(point.x - 18, point.y + 9)
6509:       .lineTo(point.x + 22, point.y + 9);
6510:     shimmer.stroke({ color: highlight, alpha: 0.54, width: 2, cap: "round" });
6511:     animated.push({ target: shimmer, kind: "water", path: [], speed: 0.02, phase: prop.variant * 0.35, baseAlpha: 0.52 * calm, origin: point });
6512:     layer.addChild(shimmer);
6513:     return;
6514:   }
6515: 
6516:   if (prop.kind === "streetlight") {
6517:     const streetlight = new Graphics()
6518:         .ellipse(point.x, point.y - 1, 6, 2.5)
6519:         .fill({ color: 0x23342e, alpha: 0.16 })
6520:         .rect(point.x - 1.2, point.y - 22, 2.4, 20)
6521:         .fill({ color: baseColor, alpha: 0.9 })
6522:         .rect(point.x - 1.2, point.y - 22, 11, 2)
6523:         .fill({ color: baseColor, alpha: 0.9 })
6524:         .circle(point.x + 2, point.y - 24, 4)
6525:         .fill({ color: highlight, alpha: 0.92 })
6526:         .circle(point.x + 2, point.y - 24, 9)
6527:         .fill({ color: highlight, alpha: 0.08 });
6528:     streetlight.alpha = calm;
6529:     layer.addChild(streetlight);
6530:     return;
6531:   }
6532: 
6533:   if (prop.kind === "bench") {
6534:     const bench = new Graphics()
6535:       .ellipse(point.x, point.y - 1, 11, 3)
6536:       .fill({ color: 0x23342e, alpha: 0.14 })
6537:       .roundRect(point.x - 12, point.y - 10, 24, 5, 2)
6538:       .fill({ color: baseColor, alpha: 0.96 })
6539:       .roundRect(point.x - 11, point.y - 16, 22, 4, 2)
6540:       .fill({ color: highlight, alpha: 0.96 })
6541:       .rect(point.x - 8, point.y - 5, 2, 6)
6542:       .rect(point.x + 7, point.y - 5, 2, 6)
6543:       .fill({ color: accent, alpha: 0.82 })
6544:       .stroke({ color: 0x26332c, alpha: 0.28, width: 1 });
6545:     bench.alpha = calm;
6546:     layer.addChild(bench);
6547:     return;
6548:   }
6549: 
6550:   if (prop.kind === "parked_car") {
6551:     const parkedCar = drawSmallCarGraphic(point, PARKED_CAR_COLORS[prop.variant % PARKED_CAR_COLORS.length] ?? baseColor, prop.variant % 2 === 0 ? "east-west" : "north-south", {
6552:       windowColor: highlight,
6553:       lightColor: accent,
6554:       outlineColor: shade,
6555:     });
6556:     parkedCar.alpha = calm;
6557:     layer.addChild(parkedCar);
6558:     return;
6559:   }
6560: 
6561:   if (prop.kind === "sign") {
6562:     const boardColor = prop.variant % 3 === 0 ? baseColor : prop.variant % 3 === 1 ? accent : highlight;
6563:     const signBoard = new Graphics()
6564:         .ellipse(point.x, point.y - 1, 8, 3)
6565:         .fill({ color: 0x23342e, alpha: 0.16 })
6566:         .rect(point.x - 1, point.y - 20, 2, 20)
6567:         .fill({ color: shade })
6568:         .roundRect(point.x - 14, point.y - 31, 28, 13, 3)
6569:         .fill({ color: boardColor, alpha: 0.95 })
6570:         .moveTo(point.x - 8, point.y - 25)
6571:         .lineTo(point.x + 8, point.y - 25)
6572:         .stroke({ color: 0x26332c, alpha: 0.65, width: 1.5 });
6573:     signBoard.alpha = calm;
6574:     layer.addChild(signBoard);
6575:     return;
6576:   }
6577: 
6578:   if (prop.kind === "cloud") {
6579:     const cloud = new Graphics()
6580:       .circle(point.x - 14, point.y - 22, 12)
7011: function sunlitColor(color: number, face: SunFace): number {
7012:   // Real directional key light: the sun-facing wall must be brighter than the
7013:   // flat body, not merely un-shaded (it used to sit at factor 1.0, which is why
7014:   // lit walls read matte). Widening the top/sun/shade spread gives every box a
7015:   // legible light-to-shade gradient without going cartoon.
7016:   // 0.53E item D â€” the top face carries most of the frame; a slightly stronger
7017:   // lift + warm tint makes roofs read lit instead of matte next to the walls.
7018:   if (face === "top") return mixColor(scaleColor(color, 1.22), SUN_WARM_TINT, 0.15);
7019:   if (face === "sun") return mixColor(scaleColor(color, 1.12), SUN_WARM_TINT, 0.12);
7020:   return mixColor(scaleColor(color, 0.4), SUN_COOL_TINT, 0.32);
7021: }
7022: 
7023: // 0.68H face/material read â€” building faces get their own light response,
7024: // separate from terrain/props (sunlitColor). The global curve pushed lit walls
7025: // and roofs to near-white luma, where the 0.54E highlight rolloff grades them
7026: // into one milky paper tone â€” that is the "flat/milky planes" read. Building
7027: // faces keep more of their own pigment: a bright-but-saturated top, a warm mid
7028: // sun wall, and a firmly darker cool shade wall â€” three distinct values per
7029: // box, separated by tone instead of outlines.
7030: function buildingFaceColor(color: number, face: SunFace): number {
7031:   if (face === "top") return mixColor(scaleColor(color, 1.12), SUN_WARM_TINT, 0.08);
7032:   if (face === "sun") return mixColor(scaleColor(color, 1.04), SUN_WARM_TINT, 0.09);
7033:   return mixColor(scaleColor(color, 0.52), SUN_COOL_TINT, 0.24);

codex
I have enough for the ranking, but I’m doing one more narrow pass on the type contracts and verifier artifacts so each finding can point at either a code limit or a metric that proves the bar is too low.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n 'CityWorldPropKind|CityWorldProp|tree|bush|dock|boat|water_tower|fountain|water_shimmer|streetlight|bench|parked_car|sign|cloud' packages/core/src/voxel/cityWorldTypes.ts packages/core/src/voxel/cityWorldCompiler.ts packages/core/src/voxel/cityWorldParametricGenerator.ts" in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content docs/NORTH_STARS.md | ForEach-Object { $i++; if (($i -ge 47 -and $i -le 69) -or ($i -ge 178 -and $i -le 190)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content artifacts/emulator/audit/REPORT.md | ForEach-Object { $i++; if ($i -ge 1 -and $i -le 36) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content docs/V1_PRODUCTION_BACKLOG.md | ForEach-Object { $i++; if (($i -ge 39 -and $i -le 51) -or ($i -ge 80 -and $i -le 84)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content docs/ENGINE_TODO.md | ForEach-Object { $i++; if (($i -ge 24 -and $i -le 51) -or ($i -ge 65 -and $i -le 73)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
 succeeded in 557ms:
packages/core/src/voxel/cityWorldTypes.ts:142:export type CityWorldRoadLaneMarking = "avenue_dash" | "street_dash" | "apron_dash" | "none";
packages/core/src/voxel/cityWorldTypes.ts:215:  signMountCount: number;
packages/core/src/voxel/cityWorldTypes.ts:245:  signatureTags: string[];
packages/core/src/voxel/cityWorldTypes.ts:312:export type CityWorldRoadKind = "street" | "avenue" | "driveway" | "crosswalk";
packages/core/src/voxel/cityWorldTypes.ts:364:export type CityWorldPropKind =
packages/core/src/voxel/cityWorldTypes.ts:365:  | "tree"
packages/core/src/voxel/cityWorldTypes.ts:366:  | "bush"
packages/core/src/voxel/cityWorldTypes.ts:367:  | "bench"
packages/core/src/voxel/cityWorldTypes.ts:368:  | "streetlight"
packages/core/src/voxel/cityWorldTypes.ts:369:  | "fountain"
packages/core/src/voxel/cityWorldTypes.ts:370:  | "sign"
packages/core/src/voxel/cityWorldTypes.ts:371:  | "parked_car"
packages/core/src/voxel/cityWorldTypes.ts:372:  | "water_shimmer"
packages/core/src/voxel/cityWorldTypes.ts:373:  | "cloud"
packages/core/src/voxel/cityWorldTypes.ts:374:  | "dock"
packages/core/src/voxel/cityWorldTypes.ts:375:  | "boat"
packages/core/src/voxel/cityWorldTypes.ts:376:  | "water_tower";
packages/core/src/voxel/cityWorldTypes.ts:378:export type CityWorldProp = {
packages/core/src/voxel/cityWorldTypes.ts:380:  kind: CityWorldPropKind;
packages/core/src/voxel/cityWorldTypes.ts:431:  clouds: number;
packages/core/src/voxel/cityWorldTypes.ts:462:  props: CityWorldProp[];
packages/core/src/voxel/cityWorldCompiler.ts:11:  CityWorldProp,
packages/core/src/voxel/cityWorldCompiler.ts:27:import { assignCityWorldObjectKit } from "./cityWorldObjectKit.js";
packages/core/src/voxel/cityWorldCompiler.ts:106:      clouds: 0,
packages/core/src/voxel/cityWorldCompiler.ts:167:      clouds: 0,
packages/core/src/voxel/cityWorldCompiler.ts:244:      clouds: 0,
packages/core/src/voxel/cityWorldCompiler.ts:298:        { id: "draft-road-civic-spine", kind: "street", from: { x: 13, y: 7, z: 0 }, to: { x: 13, y: 21, z: 0 }, width: 1.45 },
packages/core/src/voxel/cityWorldCompiler.ts:299:        { id: "draft-road-residential-grid", kind: "street", from: { x: 5, y: 10, z: 0 }, to: { x: 18, y: 10, z: 0 }, width: 1.35 },
packages/core/src/voxel/cityWorldCompiler.ts:322:      { id: "draft-road-transit-edge", kind: "street", from: { x: 24, y: 9, z: 0 }, to: { x: 24, y: 20, z: 0 }, width: 1.45 },
packages/core/src/voxel/cityWorldCompiler.ts:427:    { suffix: "rowhome-street", offset: { x: -2.15, y: -0.5 }, kind: "home", width: 3.8, depth: 1.12, height: 1.52, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel/cityWorldCompiler.ts:466:    { suffix: "rowhome-street", offset: { x: -2.25, y: -0.55 }, kind: "home", width: 3.75, depth: 1.08, height: 1.45, facadeStyle: "rowhome", roofShape: "flat", detailLevel: "high" },
packages/core/src/voxel/cityWorldCompiler.ts:670:    { id: "road-citrus", kind: "street", from: { x: 13, y: 5, z: 0 }, to: { x: 13, y: 25, z: 0 }, width: 1.55 },
packages/core/src/voxel/cityWorldCompiler.ts:671:    { id: "road-scholar", kind: "street", from: { x: 24, y: 6, z: 0 }, to: { x: 24, y: 25, z: 0 }, width: 1.55 },
packages/core/src/voxel/cityWorldCompiler.ts:672:    { id: "road-sumner", kind: "street", from: { x: 32, y: 8, z: 0 }, to: { x: 32, y: 24, z: 0 }, width: 1.5 },
packages/core/src/voxel/cityWorldCompiler.ts:875:  // x silhouette-bucket x hash-assigned palette variant), NOT by the raw
packages/core/src/voxel/cityWorldCompiler.ts:881:  // resolves through the assigned palette variant.
packages/core/src/voxel/cityWorldCompiler.ts:999:    // paletteKey intentionally left unset: withBuildingMetadata hash-assigns an
packages/core/src/voxel/cityWorldCompiler.ts:1009:function createProps(): CityWorldProp[] {
packages/core/src/voxel/cityWorldCompiler.ts:1010:  const props: CityWorldProp[] = [
packages/core/src/voxel/cityWorldCompiler.ts:1011:    { id: "prop-water-shimmer-a", kind: "water_shimmer", position: { x: 36, y: 24, z: 0 }, variant: 0 },
packages/core/src/voxel/cityWorldCompiler.ts:1012:    { id: "prop-water-shimmer-b", kind: "water_shimmer", position: { x: 39, y: 26, z: 0 }, variant: 1 },
packages/core/src/voxel/cityWorldCompiler.ts:1013:    { id: "prop-water-shimmer-c", kind: "water_shimmer", position: { x: 38.5, y: 21.5, z: 0 }, variant: 2 },
packages/core/src/voxel/cityWorldCompiler.ts:1016:  const treePoints: CityWorldPoint[] = [
packages/core/src/voxel/cityWorldCompiler.ts:1032:  treePoints.forEach((position, index) => {
packages/core/src/voxel/cityWorldCompiler.ts:1034:      id: `prop-tree-${index}`,
packages/core/src/voxel/cityWorldCompiler.ts:1035:      kind: index % 4 === 0 ? "bush" : "tree",
packages/core/src/voxel/cityWorldCompiler.ts:1055:      kind: "bush",
packages/core/src/voxel/cityWorldCompiler.ts:1062:  // 0.74F curated public kit: plaza furniture at the civic core, streetlights
packages/core/src/voxel/cityWorldCompiler.ts:1063:  // along Hamner Ave, a dock + moored boat on the river, and the water tower
packages/core/src/voxel/cityWorldCompiler.ts:1066:    { id: "prop-civic-fountain", kind: "fountain", position: { x: 21, y: 12.6, z: 0 }, variant: 0 },
packages/core/src/voxel/cityWorldCompiler.ts:1067:    { id: "prop-civic-bench-a", kind: "bench", position: { x: 19.9, y: 13.1, z: 0 }, variant: 0 },
packages/core/src/voxel/cityWorldCompiler.ts:1068:    { id: "prop-civic-bench-b", kind: "bench", position: { x: 22.1, y: 13.1, z: 0 }, variant: 1 },
packages/core/src/voxel/cityWorldCompiler.ts:1069:    { id: "prop-plaza-sign", kind: "sign", position: { x: 27.4, y: 13.9, z: 0 }, variant: 0 },
packages/core/src/voxel/cityWorldCompiler.ts:1070:    { id: "prop-hamner-light-a", kind: "streetlight", position: { x: 16, y: 12.2, z: 0 }, variant: 0 },
packages/core/src/voxel/cityWorldCompiler.ts:1071:    { id: "prop-hamner-light-b", kind: "streetlight", position: { x: 24, y: 12.2, z: 0 }, variant: 1 },
packages/core/src/voxel/cityWorldCompiler.ts:1072:    { id: "prop-hamner-light-c", kind: "streetlight", position: { x: 32, y: 12.2, z: 0 }, variant: 2 },
packages/core/src/voxel/cityWorldCompiler.ts:1073:    { id: "prop-limonite-light-a", kind: "streetlight", position: { x: 18, y: 20.2, z: 0 }, variant: 3 },
packages/core/src/voxel/cityWorldCompiler.ts:1074:    { id: "prop-limonite-light-b", kind: "streetlight", position: { x: 27, y: 20.2, z: 0 }, variant: 4 },
packages/core/src/voxel/cityWorldCompiler.ts:1075:    { id: "prop-river-dock", kind: "dock", position: { x: 35.2, y: 23.2, z: 0 }, variant: 0 },
packages/core/src/voxel/cityWorldCompiler.ts:1076:    { id: "prop-river-boat", kind: "boat", position: { x: 37.4, y: 24.6, z: 0 }, variant: 0 },
packages/core/src/voxel/cityWorldCompiler.ts:1077:    { id: "prop-gym-water-tower", kind: "water_tower", position: { x: 33.4, y: 16.4, z: 0 }, variant: 0 },
packages/core/src/voxel/cityWorldCompiler.ts:1437:      road.kind === "avenue" ? "avenue_dash" : road.kind === "street" ? "street_dash" : road.kind === "driveway" ? "apron_dash" : "none",
packages/core/src/voxel/cityWorldCompiler.ts:1661:    objectKit: assignCityWorldObjectKit(buildingWithVisualGrammar),
packages/core/src/voxel/cityWorldCompiler.ts:1675:// manifest. Identity is assigned from the palette system (hash -> variant) so
packages/core/src/voxel/cityWorldCompiler.ts:1703:export function withPropMetadata(prop: CityWorldProp): CityWorldProp {
packages/core/src/voxel/cityWorldCompiler.ts:1708:    detailLevel: prop.kind === "cloud" ? "low" : prop.kind === "water_shimmer" ? "medium" : "high",
packages/core/src/voxel/cityWorldParametricGenerator.ts:7:  CityWorldProp,
packages/core/src/voxel/cityWorldParametricGenerator.ts:111:   * Optional generated-county parameter spine. When present, signature
packages/core/src/voxel/cityWorldParametricGenerator.ts:195:  const props: CityWorldProp[] = [];
packages/core/src/voxel/cityWorldParametricGenerator.ts:201:      if (prop.kind !== "water_shimmer" && prop.kind !== "boat" && prop.kind !== "dock") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:275:  const signatureLandmark = createGeneratedLandmark(spec, elevationModel, roadSegments);
packages/core/src/voxel/cityWorldParametricGenerator.ts:276:  if (signatureLandmark) {
packages/core/src/voxel/cityWorldParametricGenerator.ts:277:    lots.push(signatureLandmark.lot);
packages/core/src/voxel/cityWorldParametricGenerator.ts:278:    buildings.push(signatureLandmark.building);
packages/core/src/voxel/cityWorldParametricGenerator.ts:279:    places.push(signatureLandmark.place);
packages/core/src/voxel/cityWorldParametricGenerator.ts:280:    props.push(...signatureLandmark.props);
packages/core/src/voxel/cityWorldParametricGenerator.ts:309:      clouds: 0,
packages/core/src/voxel/cityWorldParametricGenerator.ts:318:      selectedPlaceId: signatureLandmark?.place.id ?? (places.find((place) => place.kind === "landmark") ?? places[0])?.id ?? "",
packages/core/src/voxel/cityWorldParametricGenerator.ts:862:  | "river_boathouse"
packages/core/src/voxel/cityWorldParametricGenerator.ts:877:  expectedAccentProps: readonly CityWorldProp["kind"][];
packages/core/src/voxel/cityWorldParametricGenerator.ts:887:  accentProps: CityWorldProp["kind"][];
packages/core/src/voxel/cityWorldParametricGenerator.ts:898:    expectedAccentProps: ["dock", "boat"],
packages/core/src/voxel/cityWorldParametricGenerator.ts:900:  river_boathouse: {
packages/core/src/voxel/cityWorldParametricGenerator.ts:901:    kind: "river_boathouse",
packages/core/src/voxel/cityWorldParametricGenerator.ts:907:    expectedAccentProps: ["dock", "boat"],
packages/core/src/voxel/cityWorldParametricGenerator.ts:916:    expectedAccentProps: ["water_tower"],
packages/core/src/voxel/cityWorldParametricGenerator.ts:925:    expectedAccentProps: ["tree"],
packages/core/src/voxel/cityWorldParametricGenerator.ts:934:    expectedAccentProps: ["water_tower"],
packages/core/src/voxel/cityWorldParametricGenerator.ts:956:  const signature = GENERATED_LANDMARK_SIGNATURES[kind];
packages/core/src/voxel/cityWorldParametricGenerator.ts:959:    .filter((prop) => prop.placeId === building.placeId || signature.expectedAccentProps.includes(prop.kind))
packages/core/src/voxel/cityWorldParametricGenerator.ts:965:    ...signature,
packages/core/src/voxel/cityWorldParametricGenerator.ts:968:    hostCell: (place?.nodeId as CityWorldGeneratedLandmarkHostCell | undefined) ?? signature.hostCell,
packages/core/src/voxel/cityWorldParametricGenerator.ts:970:    roofShape: building.roofShape ?? signature.roofShape,
packages/core/src/voxel/cityWorldParametricGenerator.ts:971:    facadeStyle: building.facadeStyle ?? signature.facadeStyle,
packages/core/src/voxel/cityWorldParametricGenerator.ts:976:      ...signature,
packages/core/src/voxel/cityWorldParametricGenerator.ts:978:      roofShape: building.roofShape ?? signature.roofShape,
packages/core/src/voxel/cityWorldParametricGenerator.ts:979:      facadeStyle: building.facadeStyle ?? signature.facadeStyle,
packages/core/src/voxel/cityWorldParametricGenerator.ts:980:      hostCell: (place?.nodeId as CityWorldGeneratedLandmarkHostCell | undefined) ?? signature.hostCell,
packages/core/src/voxel/cityWorldParametricGenerator.ts:991:  signature: Pick<CityWorldGeneratedLandmarkReadout, "buildingKind" | "roofShape" | "facadeStyle" | "hostCell" | "width" | "depth" | "height">,
packages/core/src/voxel/cityWorldParametricGenerator.ts:994:    signature.hostCell,
packages/core/src/voxel/cityWorldParametricGenerator.ts:995:    signature.buildingKind,
packages/core/src/voxel/cityWorldParametricGenerator.ts:996:    signature.facadeStyle,
packages/core/src/voxel/cityWorldParametricGenerator.ts:997:    signature.roofShape,
packages/core/src/voxel/cityWorldParametricGenerator.ts:998:    signature.width.toFixed(1),
packages/core/src/voxel/cityWorldParametricGenerator.ts:999:    signature.depth.toFixed(1),
packages/core/src/voxel/cityWorldParametricGenerator.ts:1000:    signature.height.toFixed(1),
packages/core/src/voxel/cityWorldParametricGenerator.ts:1093:  river_town: "river_boathouse",
packages/core/src/voxel/cityWorldParametricGenerator.ts:1104:  props: CityWorldProp[];
packages/core/src/voxel/cityWorldParametricGenerator.ts:1135:  const signature = GENERATED_LANDMARK_SIGNATURES[kind];
packages/core/src/voxel/cityWorldParametricGenerator.ts:1136:  const massing = generatedLandmarkMassing(parameters, signature);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1137:  const host = generatedLandmarkHost(signature, massing, spec.zones, elevationModel);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1175:    nodeId: signature.hostCell,
packages/core/src/voxel/cityWorldParametricGenerator.ts:1187:    props: generatedLandmarkAccentProps(signature, host.point, placeId, elevationModel),
packages/core/src/voxel/cityWorldParametricGenerator.ts:1193:  signature: CityWorldGeneratedLandmarkSignature,
packages/core/src/voxel/cityWorldParametricGenerator.ts:1202:  const colors = landmarkPalette(parameters, signature.kind);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1204:  if (signature.kind === "coastal_pier_hall") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1217:  if (signature.kind === "river_boathouse") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1219:      label: riverSignal ? "River boathouse" : "Bank boathouse",
packages/core/src/voxel/cityWorldParametricGenerator.ts:1230:  if (signature.kind === "desert_mesa_tower") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1243:  if (signature.kind === "mountain_ridge_lodge") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1256:  if (signature.kind === "prairie_grain_elevator") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1289:    river_boathouse: { bodyIndex: 2, roofIndex: 0 },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1304:  signature: CityWorldGeneratedLandmarkSignature,
packages/core/src/voxel/cityWorldParametricGenerator.ts:1309:  if (signature.hostCell === "water_edge") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1315:  if (signature.hostCell === "civic_core") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1319:  if (signature.hostCell === "ag_block") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1326:  if (signature.hostCell === "ridge" || signature.hostCell === "highest_block_corner") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1380:  signature: CityWorldGeneratedLandmarkSignature,
packages/core/src/voxel/cityWorldParametricGenerator.ts:1384:): CityWorldProp[] {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1385:  const props: CityWorldProp[] = [];
packages/core/src/voxel/cityWorldParametricGenerator.ts:1386:  const point = (id: string, kind: CityWorldProp["kind"], dx: number, dy: number, variant: number) =>
packages/core/src/voxel/cityWorldParametricGenerator.ts:1388:      id: `gen-landmark-prop-${signature.kind}-${id}`,
packages/core/src/voxel/cityWorldParametricGenerator.ts:1399:  if (signature.kind === "desert_mesa_tower") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1400:    props.push(point("tank", "water_tower", 0.72, -0.2, 0));
packages/core/src/voxel/cityWorldParametricGenerator.ts:1401:  } else if (signature.kind === "mountain_ridge_lodge") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1402:    props.push(point("pine-0", "tree", -2.05, -0.9, 2), point("pine-1", "tree", 2.1, -0.72, 3), point("pine-2", "tree", -1.35, 1.18, 4));
packages/core/src/voxel/cityWorldParametricGenerator.ts:1403:  } else if (signature.kind === "prairie_grain_elevator") {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1404:    props.push(point("drum", "water_tower", 0.78, -0.08, 1));
packages/core/src/voxel/cityWorldParametricGenerator.ts:1429: * resolves through the hash-assigned palette variant in withBuildingMetadata.
packages/core/src/voxel/cityWorldParametricGenerator.ts:1837:type ZonePropSpec = { kind: CityWorldProp["kind"]; point: CityWorldPoint; variant?: number };
packages/core/src/voxel/cityWorldParametricGenerator.ts:1851:): CityWorldProp[] {
packages/core/src/voxel/cityWorldParametricGenerator.ts:1867:      addStreetTreeRhythm(specs, zone, context, vegetationRng, residentialStreetTreeCap(context.archetype));
packages/core/src/voxel/cityWorldParametricGenerator.ts:1868:      addVegetationSpec(specs, context, "bush", at(0.1, 0.9), 0);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1872:    specs.push({ kind: "streetlight", point: at(0.94, 0.08) });
packages/core/src/voxel/cityWorldParametricGenerator.ts:1875:      { kind: "sign", point: at(0.08, 0.9), variant: Math.floor(rng() * 3) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1876:      { kind: "streetlight", point: at(0.5, 0.94) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1877:      { kind: "streetlight", point: at(0.92, 0.1) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1878:      { kind: "bench", point: at(0.3, 0.08) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1879:      { kind: "bench", point: at(0.7, 0.08) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1885:      addStreetTreeRhythm(specs, zone, context, vegetationRng, 2);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1887:      addStreetTreeRhythm(specs, zone, context, vegetationRng, 1);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1891:      { kind: "fountain", point: at(0.5, 0.86) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1892:      { kind: "bench", point: at(0.3, 0.9) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1893:      { kind: "bench", point: at(0.7, 0.9) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1898:      addVegetationSpec(specs, context, "tree", at(0.06, 0.5), 3);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1899:      if (context.archetype !== "coastal_grid") addVegetationSpec(specs, context, "tree", at(0.94, 0.5), 4);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1903:    specs.push({ kind: "sign", point: at(0.9, 0.88), variant: 1 }, { kind: "streetlight", point: at(0.08, 0.1) });
packages/core/src/voxel/cityWorldParametricGenerator.ts:1907:      { kind: "bench", point: at(0.5, 0.06) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1908:      { kind: "streetlight", point: at(0.08, 0.92) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1913:      addVegetationSpec(specs, context, "bush", at(0.1, 0.08), 0);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1914:      addVegetationSpec(specs, context, "bush", at(0.9, 0.92), 1);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1915:      addStreetTreeRhythm(specs, zone, context, vegetationRng, apartmentStreetTreeCap(context.archetype));
packages/core/src/voxel/cityWorldParametricGenerator.ts:1927:      addVegetationSpec(specs, context, "bush", at(0.8, 0.24), 0);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1933:      addVegetationSpec(specs, context, "bush", at(0.8, 0.24), 0);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1936:    specs.push({ kind: "bench", point: at(0.16, 0.46) }, { kind: "bench", point: at(0.62, 0.16) });
packages/core/src/voxel/cityWorldParametricGenerator.ts:1937:    if (area >= 40) specs.push({ kind: "fountain", point: at(0.5, 0.5) });
packages/core/src/voxel/cityWorldParametricGenerator.ts:1943:    addVegetationSpec(specs, context, "bush", at(0.8, 0.24), 0);
packages/core/src/voxel/cityWorldParametricGenerator.ts:1986:      { kind: "water_shimmer", point: at(0.22, 0.34) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1987:      { kind: "water_shimmer", point: at(0.52, 0.58) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1988:      { kind: "water_shimmer", point: at(0.78, 0.42) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1989:      { kind: "dock", point: at(0.66, 0.08) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1990:      { kind: "boat", point: at(0.66, 0.36), variant: Math.floor(rng() * 2) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1995:    { kind: "water_shimmer", point: at(0.3, 0.24) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1996:    { kind: "water_shimmer", point: at(0.6, 0.56) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1997:    { kind: "water_shimmer", point: at(0.45, 0.82) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1998:    { kind: "dock", point: at(0.08, 0.42) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:1999:    { kind: "boat", point: at(0.38, 0.56), variant: Math.floor(rng() * 2) },
packages/core/src/voxel/cityWorldParametricGenerator.ts:2003:function residentialStreetTreeCap(archetype: GeneratedDistrictArchetype | undefined): number {
packages/core/src/voxel/cityWorldParametricGenerator.ts:2009:function apartmentStreetTreeCap(archetype: GeneratedDistrictArchetype | undefined): number {
packages/core/src/voxel/cityWorldParametricGenerator.ts:2018:function addStreetTreeRhythm(
packages/core/src/voxel/cityWorldParametricGenerator.ts:2030:    const spacing = streetTreeSpacing(context);
packages/core/src/voxel/cityWorldParametricGenerator.ts:2039:      if (addVegetationSpec(specs, context, "tree", point, added + index)) added += 1;
packages/core/src/voxel/cityWorldParametricGenerator.ts:2044:function streetTreeSpacing(context: PropPlacementContext): number {
packages/core/src/voxel/cityWorldParametricGenerator.ts:2072:    addVegetationSpec(specs, context, "tree", jitteredZonePoint(zone, fx, fy, rng, 0.18), index);
packages/core/src/voxel/cityWorldParametricGenerator.ts:2090:    addVegetationSpec(specs, context, "tree", point, index + 2);
packages/core/src/voxel/cityWorldParametricGenerator.ts:2109:    addVegetationSpec(specs, context, "tree", jitteredZonePoint(zone, fx, fy, rng, 0.18), index + 5);
packages/core/src/voxel/cityWorldParametricGenerator.ts:2137:      "tree",
packages/core/src/voxel/cityWorldParametricGenerator.ts:2166:        if (addVegetationSpec(specs, context, "tree", point, bankIndex * count + added + 1)) {
packages/core/src/voxel/cityWorldParametricGenerator.ts:2191:        if (addVegetationSpec(specs, context, "tree", point, bankIndex * count + added + 1)) {
packages/core/src/voxel/cityWorldParametricGenerator.ts:2198:    const bushFx = bankIndex === 0 ? 0.08 : 0.92;
packages/core/src/voxel/cityWorldParametricGenerator.ts:2200:      if (addVegetationSpec(specs, context, "bush", { x: zone.rect.minX + (zone.rect.maxX - zone.rect.minX) * bushFx, y, z: 0 }, bankIndex + 1)) break;
packages/core/src/voxel/cityWorldParametricGenerator.ts:2220:    addVegetationSpec(specs, context, "bush", jitteredZonePoint(zone, fx, fy, rng, 0.2), index);
packages/core/src/voxel/cityWorldParametricGenerator.ts:2227:  kind: "tree" | "bush",
packages/core/src/voxel/cityWorldParametricGenerator.ts:2235:  if (specs.some((entry) => (entry.kind === "tree" || entry.kind === "bush") && distance2(entry.point, point) < 0.72)) return false;
packages/core/src/voxel/cityWorldParametricGenerator.ts:2638:// buildings, props, and place anchors) shares one z level, so streets and
packages/core/src/voxel/cityWorldParametricGenerator.ts:2686:  // Corridor roads: axis-aligned embedded streets/avenues (driveways and
packages/core/src/voxel/cityWorldParametricGenerator.ts:2688:  const corridorRoads = roads.filter((road) => road.kind === "avenue" || road.kind === "street");
packages/core/src/voxel/cityWorldParametricGenerator.ts:2759:  if (kind === "street") return 1.5;
packages/core/src/voxel/cityWorldParametricGenerator.ts:3176:      { id: "gen-road-commerce", kind: "street", from: { x: 28, y: 3 }, to: { x: 28, y: 26 } },

 succeeded in 770ms:
1: # Atlas Emulator Audit Report
2: 
3: Ran: 2026-07-11T00:54:56.338Z
4: Base: http://127.0.0.1:8787
5: Result: OK (158 pass, 0 warn, 0 fail)
6: 
7: ## Findings
8: 
9: No fail or warn findings.
10: 
11: ## Matrix
12: 
13: | County | Draft | Archetype | Viewport | Theme | Delivered | Graphics | Payload | Console |
14: | --- | --- | --- | --- | --- | --- | --- | --- | --- |
15: | autauga-al | 1 | metro_grid | desktop | light | pass: state=delivered; errors=0 | pass: graphics=854; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
16: | autauga-al | 1 | metro_grid | desktop | dark | pass: state=delivered; errors=0 | pass: graphics=854; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
17: | autauga-al | 1 | metro_grid | mobile | light | pass: state=delivered; errors=0 | pass: graphics=962; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
18: | autauga-al | 1 | metro_grid | mobile | dark | pass: state=delivered; errors=0 | pass: graphics=962; ceiling=1600 | pass: max generatedDraftSceneChars=806985; ceiling=900000 | pass: console error entries=0 |
19: | aleutians-east-borough-ak | 1 | coastal_grid | desktop | light | pass: state=delivered; errors=0 | pass: graphics=867; ceiling=1600 | pass: max generatedDraftSceneChars=800211; ceiling=900000 | pass: console error entries=0 |
20: | aleutians-east-borough-ak | 1 | coastal_grid | mobile | light | pass: state=delivered; errors=0 | pass: graphics=955; ceiling=1600 | pass: max generatedDraftSceneChars=800211; ceiling=900000 | pass: console error entries=0 |
21: | apache-az | 1 | desert_basin | desktop | light | pass: state=delivered; errors=0 | pass: graphics=684; ceiling=1600 | pass: max generatedDraftSceneChars=815086; ceiling=900000 | pass: console error entries=0 |
22: | apache-az | 1 | desert_basin | mobile | light | pass: state=delivered; errors=0 | pass: graphics=857; ceiling=1600 | pass: max generatedDraftSceneChars=815086; ceiling=900000 | pass: console error entries=0 |
23: | adams-co | 1 | mountain_valley | desktop | light | pass: state=delivered; errors=0 | pass: graphics=369; ceiling=1600 | pass: max generatedDraftSceneChars=853252; ceiling=900000 | pass: console error entries=0 |
24: | adams-co | 1 | mountain_valley | mobile | light | pass: state=delivered; errors=0 | pass: graphics=483; ceiling=1600 | pass: max generatedDraftSceneChars=853252; ceiling=900000 | pass: console error entries=0 |
25: | adair-ia | 1 | prairie_town | desktop | light | pass: state=delivered; errors=0 | pass: graphics=542; ceiling=1600 | pass: max generatedDraftSceneChars=786533; ceiling=900000 | pass: console error entries=0 |
26: | adair-ia | 1 | prairie_town | mobile | light | pass: state=delivered; errors=0 | pass: graphics=564; ceiling=1600 | pass: max generatedDraftSceneChars=786533; ceiling=900000 | pass: console error entries=0 |
27: | butler-al | 1 | river_town | desktop | light | pass: state=delivered; errors=0 | pass: graphics=613; ceiling=1600 | pass: max generatedDraftSceneChars=841017; ceiling=900000 | pass: console error entries=0 |
28: | butler-al | 1 | river_town | mobile | light | pass: state=delivered; errors=0 | pass: graphics=682; ceiling=1600 | pass: max generatedDraftSceneChars=841017; ceiling=900000 | pass: console error entries=0 |
29: | riverside-ca | 0 | curated | desktop | light | pass: state=delivered; errors=0 | pass: graphics=780; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
30: | riverside-ca | 0 | curated | desktop | dark | pass: state=delivered; errors=0 | pass: graphics=780; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
31: | riverside-ca | 0 | curated | mobile | light | pass: state=delivered; errors=0 | pass: graphics=774; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
32: | riverside-ca | 0 | curated | mobile | dark | pass: state=delivered; errors=0 | pass: graphics=774; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
33: | orange-ca | 0 | shell | desktop | light | pass: state=delivered; errors=0 | pass: graphics=33; ceiling=1600 | pass: max generatedDraftSceneChars=0; ceiling=900000 | pass: console error entries=0 |
34: 
35: ## Screenshots
36: 

 succeeded in 793ms:
47: ## NS-1 Â· The Diorama â€” every scene reads hand-built
48: 
49: **Ideal:** any district, curated or generated, reads as a miniature town
50: someone assembled by hand, block by block.
51: 
52: **Anchor:** `assets/reference/atlas-voxel-town-north-star.png`.
53: 
54: **You've hit it when:**
55: - A cold screenshot of a generated district fails the "which one is curated?"
56:   test against Eastvale.
57: - No flat color field survives at any supported zoom: overview reads massing
58:   and palette; detail zoom reads material (courses, seams, texture).
59: - Occlusion is always correct â€” props, buildings, terrain interleave by true
60:   iso depth at every zoom.
61: - Residential fabric is dense and varied: continuous small-house streets, no
62:   empty-lot gaps, no visible clones.
63: - Terrain has relief â€” plateaus, cliff courses, shore basins â€” and props feel
64:   *placed* (a dock where the river is, a water tower on the highest block),
65:   never sprinkled.
66: 
67: **Enforced by:** `verify-generated-district-parity` (composition â‰¥0.60, clone
68: pressure â‰¤0.30, contact â‰¥0.95, roof safety), fabric-floor regression test,
69: depth-interleave ordering test, screenshot evidence per pass.
178: region â€” everything high-quality curated, not just Riverside.")* All 3,222
179: indexed counties open at the curated bar. Generated is not a second-class
180: draft tier; Riverside is the reference implementation the generator must
181: match, county by county.
182: 
183: **You've hit it when:**
184: - A generated county passes the NS-1 crop test against curated Eastvale â€”
185:   "which one is curated?" has no reliable answer, for ANY county.
186: - County identity reads through: coastal counties read coastal, desert reads
187:   desert, metro reads metro â€” the archetype system (metro/coastal/river/
188:   desert/mountain/prairie) carries region-true palettes, massing, landmarks,
189:   and terrain, not six templates Ã— jitter.
190: - Parity gates are promoted from floors to curated-equivalence, and run as a

 succeeded in 827ms:
39: 
40: ## Track C â€” Engine to the USA-region crop-test bar (0.76 continuation)
41: - C1 **0.76-4 terrain features** (mesa rims, cliff courses, river banks) â€”
42:   also lifts the weakest composition tails (prairie 0.631 / river 0.637).
43: - C2 **Curated-id hardcoding divergence**: `materialProfile`/`roofProfile`/
44:   anchor treatments key off Eastvale/Anaheim ids (`cityWorldCompiler.ts:1459,
45:   1533,1560-1566`) â€” generated districts silently degrade to defaults. Route
46:   through authored grammar instead of id matches.
47: - C3 Non-civic towers fall through to terracotta (`cityWorldCompiler.ts:1505`)
48:   â€” the prairie grain-elevator/desert mesa tower need tower roof grammar.
49: - C4 River clone pressure sits at the 0.30 ceiling â€” add residential template
50:   variety before any further density.
51: - C5 0.76-5 gate promotion (floors â†’ curated-equivalence) + full-index sweep.
80: 3. **C1-C4** (engine to the crop-test bar, batch-verified)
81: 4. **D4 + E1-E4** (transport unlock + hardening) â†’ deploy â†’ submit when the
82:    crop test passes for generated counties.

 succeeded in 844ms:
24: ## North-star gaps (concept-art-anchored, by visual leverage)
25: 
26: - **E2 Â· Tree/vegetation saturation.** The reference is DENSE with chunky
27:   voxel trees â€” street trees, park clusters, shelter rows. Generated boards
28:   have 3â€“8. Prop budget has room (~30/90 used; worst window 938/1600 â€”
29:   ~50 trees â‰ˆ +100 Graphics, safe). Zone-aware placement: parks dense,
30:   residential street-tree rhythm, prairie shelter rows, desert sparse scrub.
31:   The single biggest "reads hand-built" lever.
32: - **E3 Â· Water must read as WATER.** Reference: deep blue bodies, beach
33:   transitions, dock + boats. Generated coastal/river: a teal ground tint.
34:   Deepen water tone, widen the body so it reads at overview, shore banding,
35:   ensure the river actually crosses the board (not a corner patch).
36: - **E4 Â· Terrain strata.** Reference mountains are stacked cliff courses with
37:   summit tones. Renderer already supports cliff courses (0.74F) â€” amplify
38:   per archetype: mountain multi-course relief, desert mesa rims, river banks.
39:   (Supersedes the rogue Axiom packet-0.76-4 draft â€” author fresh.)
40: - **E5 Â· No empty blocks.** Reference fills every non-building block: farm
41:   rows (prairie!), plaza paving, park greens. Generated has bare pads and
42:   blank parcels. Per-archetype block fills: prairie crop-row fields, metro
43:   plaza paving, desert dry-wash texture.
44: - **E6 Â· Generated buildings never reach curated material grammar.**
45:   `materialProfile`/`roofProfile` key off curated Eastvale ids
46:   (cityWorldCompiler.ts:1459,1533) â€” generated silently degrades to defaults.
47:   Route through authored grammar (facadeStyle/roofShape), not id matches.
48: - **E7 Â· Non-civic towers fall through to terracotta** (compiler:1505) â€” the
49:   prairie grain-elevator and desert mesa tower need tower roof grammar.
50: - **E8 Â· River-town clone pressure sits at the 0.30 ceiling** â€” add
51:   residential template variety before any density push.
65: |--:|---|---|---|
66: | 1 | E1+E9 spine fix + structural gate | cityWorldCountyParameters + sweep script | water invariant + 7-slug regression; sweep stays green |
67: | 2 | E2 vegetation saturation | generator prop placement | prop â‰¤90, Graphics â‰¤1600 (reviewer), parity green |
68: | 3 | E3 water read + E4 terrain strata | archetype layouts + renderer water/cliff treatment | parity + perf; screenshot judgment |
69: | 4 | E5 block fills | generator lot/terrain treatments | composition floors rise, no clutter regression |
70: | 5 | E6+E7 grammar routing | compiler | curated Riverside byte-identical; parity green |
71: 
72: Anti-scope per AGENTS.md unchanged: no new deps, no new prop kinds beyond the
73: existing vocabulary, forbidden {parked_car, cloud} stays (reference cars are

codex
One point I’m checking before finalizing: generated landmarks do exist, so I won’t overstate that the system is only palettes. The question is whether those signatures are broad enough or whether they still collapse to a few generic civic/service silhouettes.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldParametricGenerator.ts | ForEach-Object { $i++; if (($i -ge 840 -and $i -le 940) -or ($i -ge 1088 -and $i -le 1268) -or ($i -ge 1380 -and $i -le 1406)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command "rg -n \"function createGenerated.*Building|facadeStyle|roofShape|kind === \\\"residential\\\"|zone.kind|create.*Home|create.*Shop|building.kind\" packages/core/src/voxel/cityWorldParametricGenerator.ts" in C:\Users\mzwin\Documents\Atlas
2026-07-11T06:21:24.720519Z ERROR codex_core::tools::router: error=Exit code: 1
Wall time: 0.5 seconds
Output:

 exited 1 in 513ms:
 succeeded in 750ms:
840:   };
841: }
842: 
843: type ZoneBuildingSpec = {
844:   kind: CityWorldBuilding["kind"];
845:   width: number;
846:   depth: number;
847:   height: number;
848:   bodyColor: string;
849:   roofColor: string;
850:   facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
851:   roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
852:   /** Optional sprite role override for commerce strips. */
853:   spriteKey?: string;
854:   /** Label override for authored fabric roles (e.g. neighborhood corner market). */
855:   labelOverride?: string;
856:   /** Optional regional manifest palette key for generated districts. */
857:   paletteKey?: string;
858: };
859: 
860: export type CityWorldGeneratedLandmarkKind =
861:   | "coastal_pier_hall"
862:   | "river_boathouse"
863:   | "desert_mesa_tower"
864:   | "mountain_ridge_lodge"
865:   | "prairie_grain_elevator"
866:   | "metro_civic_tower";
867: 
868: export type CityWorldGeneratedLandmarkHostCell = "water_edge" | "highest_block_corner" | "ridge" | "ag_block" | "civic_core";
869: 
870: export type CityWorldGeneratedLandmarkSignature = {
871:   kind: CityWorldGeneratedLandmarkKind;
872:   archetype: GeneratedDistrictArchetype;
873:   hostCell: CityWorldGeneratedLandmarkHostCell;
874:   buildingKind: CityWorldBuilding["kind"];
875:   roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
876:   facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
877:   expectedAccentProps: readonly CityWorldProp["kind"][];
878: };
879: 
880: export type CityWorldGeneratedLandmarkReadout = CityWorldGeneratedLandmarkSignature & {
881:   buildingId: string;
882:   placeId: string;
883:   width: number;
884:   depth: number;
885:   height: number;
886:   silhouetteKey: string;
887:   accentProps: CityWorldProp["kind"][];
888: };
889: 
890: export const GENERATED_LANDMARK_SIGNATURES: Record<CityWorldGeneratedLandmarkKind, CityWorldGeneratedLandmarkSignature> = {
891:   coastal_pier_hall: {
892:     kind: "coastal_pier_hall",
893:     archetype: "coastal_grid",
894:     hostCell: "water_edge",
895:     buildingKind: "shop",
896:     roofShape: "hip",
897:     facadeStyle: "strip_store",
898:     expectedAccentProps: ["dock", "boat"],
899:   },
900:   river_boathouse: {
901:     kind: "river_boathouse",
902:     archetype: "river_town",
903:     hostCell: "water_edge",
904:     buildingKind: "shop",
905:     roofShape: "gable",
906:     facadeStyle: "storefront",
907:     expectedAccentProps: ["dock", "boat"],
908:   },
909:   desert_mesa_tower: {
910:     kind: "desert_mesa_tower",
911:     archetype: "desert_basin",
912:     hostCell: "highest_block_corner",
913:     buildingKind: "gym",
914:     roofShape: "tower",
915:     facadeStyle: "fitness",
916:     expectedAccentProps: ["water_tower"],
917:   },
918:   mountain_ridge_lodge: {
919:     kind: "mountain_ridge_lodge",
920:     archetype: "mountain_valley",
921:     hostCell: "ridge",
922:     buildingKind: "civic",
923:     roofShape: "gable",
924:     facadeStyle: "civic",
925:     expectedAccentProps: ["tree"],
926:   },
927:   prairie_grain_elevator: {
928:     kind: "prairie_grain_elevator",
929:     archetype: "prairie_town",
930:     hostCell: "ag_block",
931:     buildingKind: "gym",
932:     roofShape: "tower",
933:     facadeStyle: "fitness",
934:     expectedAccentProps: ["water_tower"],
935:   },
936:   metro_civic_tower: {
937:     kind: "metro_civic_tower",
938:     archetype: "metro_grid",
939:     hostCell: "civic_core",
940:     buildingKind: "civic",
1088:   return roundDimension(Math.min(1, weighted));
1089: }
1090: 
1091: const LANDMARK_KIND_BY_ARCHETYPE: Record<GeneratedDistrictArchetype, CityWorldGeneratedLandmarkKind> = {
1092:   coastal_grid: "coastal_pier_hall",
1093:   river_town: "river_boathouse",
1094:   desert_basin: "desert_mesa_tower",
1095:   mountain_valley: "mountain_ridge_lodge",
1096:   prairie_town: "prairie_grain_elevator",
1097:   metro_grid: "metro_civic_tower",
1098: };
1099: 
1100: type GeneratedLandmarkAssembly = {
1101:   lot: CityWorldLot;
1102:   building: CityWorldBuilding;
1103:   place: CityWorldPlace;
1104:   props: CityWorldProp[];
1105: };
1106: 
1107: type GeneratedLandmarkMassing = {
1108:   label: string;
1109:   buildingKind: CityWorldBuilding["kind"];
1110:   lotKind: CityWorldLot["kind"];
1111:   width: number;
1112:   depth: number;
1113:   height: number;
1114:   bodyColor: string;
1115:   roofColor: string;
1116:   paletteKey?: string;
1117:   facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
1118:   roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
1119: };
1120: 
1121: type GeneratedLandmarkHost = {
1122:   point: CityWorldPoint;
1123:   zone: CityWorldZoneSpec;
1124: };
1125: 
1126: function createGeneratedLandmark(
1127:   spec: CityWorldParametricSpec,
1128:   elevationModel: ParametricElevationModel,
1129:   roadSegments: CityWorldRoadSegment[],
1130: ): GeneratedLandmarkAssembly | null {
1131:   const parameters = spec.countyParameters;
1132:   if (!parameters) return null;
1133: 
1134:   const kind = expectedGeneratedLandmarkKind(parameters);
1135:   const signature = GENERATED_LANDMARK_SIGNATURES[kind];
1136:   const massing = generatedLandmarkMassing(parameters, signature);
1137:   const host = generatedLandmarkHost(signature, massing, spec.zones, elevationModel);
1138:   if (!host) return null;
1139: 
1140:   const placeId = `gen-place-landmark-${kind}`;
1141:   const lot = withLotMetadata(
1142:     {
1143:       id: `gen-landmark-lot-${kind}`,
1144:       kind: massing.lotKind,
1145:       label: massing.label,
1146:       position: host.point,
1147:       width: Math.max(massing.width * 1.12, massing.width + 0.28),
1148:       depth: Math.max(massing.depth * 1.18, massing.depth + 0.28),
1149:       placeId,
1150:     },
1151:     roadSegments,
1152:   );
1153:   const building = withBuildingMetadata({
1154:     id: `gen-landmark-${kind}`,
1155:     kind: massing.buildingKind,
1156:     label: massing.label,
1157:     spriteKey: `building.${massing.buildingKind}.generated.landmark.v1`,
1158:     position: host.point,
1159:     width: massing.width,
1160:     depth: massing.depth,
1161:     height: massing.height,
1162:     bodyColor: massing.bodyColor,
1163:     roofColor: massing.roofColor,
1164:     ...(massing.paletteKey ? { paletteKey: massing.paletteKey } : {}),
1165:     placeId,
1166:     roofShape: massing.roofShape,
1167:     facadeStyle: massing.facadeStyle,
1168:     detailLevel: "high",
1169:   });
1170:   const place: CityWorldPlace = {
1171:     id: placeId,
1172:     label: massing.label,
1173:     kind: "landmark",
1174:     districtId: spec.region.district,
1175:     nodeId: signature.hostCell,
1176:     anchor: host.point,
1177:     hitRadius: Math.max(3.1, Math.max(massing.width, massing.depth) * 0.88),
1178:     description: `Generated ${massing.label.toLowerCase()} landmark.`,
1179:     activity: 0,
1180:     labelPriority: 10,
1181:   };
1182: 
1183:   return {
1184:     lot,
1185:     building,
1186:     place,
1187:     props: generatedLandmarkAccentProps(signature, host.point, placeId, elevationModel),
1188:   };
1189: }
1190: 
1191: function generatedLandmarkMassing(
1192:   parameters: CountyGenerationParameters,
1193:   signature: CityWorldGeneratedLandmarkSignature,
1194: ): GeneratedLandmarkMassing {
1195:   const waterSignal = hasNameSignal(parameters, ["port", "harbor", "lake", "bay", "beach"]);
1196:   const workingWaterfrontSignal = hasNameSignal(parameters, ["port", "harbor"]);
1197:   const riverSignal = hasNameSignal(parameters, ["falls", "river"]);
1198:   const mesaSignal = hasNameSignal(parameters, ["mesa", "desert"]);
1199:   const ridgeSignal = hasNameSignal(parameters, ["mount", "mountain"]);
1200:   const snowPitchLift = parameters.climate.snowRoofAllowed ? 0.22 : 0;
1201:   const roofPitchLift = Math.max(0, parameters.regionProfile.roofPitchBias) * 0.55;
1202:   const colors = landmarkPalette(parameters, signature.kind);
1203: 
1204:   if (signature.kind === "coastal_pier_hall") {
1205:     return {
1206:       label: workingWaterfrontSignal ? "Working pier hall" : waterSignal ? "Waterfront pier hall" : "Pier hall",
1207:       buildingKind: "shop",
1208:       lotKind: "waterfront",
1209:       width: roundDimension(4.7 + (workingWaterfrontSignal ? 0.48 : waterSignal ? 0.26 : 0)),
1210:       depth: 1.34,
1211:       height: roundDimension(1.08 + (parameters.climate.coastalProximity === "coastal" ? 0 : 0.06)),
1212:       ...colors,
1213:       facadeStyle: "strip_store",
1214:       roofShape: "hip",
1215:     };
1216:   }
1217:   if (signature.kind === "river_boathouse") {
1218:     return {
1219:       label: riverSignal ? "River boathouse" : "Bank boathouse",
1220:       buildingKind: "shop",
1221:       lotKind: "waterfront",
1222:       width: roundDimension(3.25 + (riverSignal ? 0.34 : 0)),
1223:       depth: 1.58,
1224:       height: roundDimension(1.34 + (parameters.nameSignal.includes("falls") ? 0.16 : 0)),
1225:       ...colors,
1226:       facadeStyle: "storefront",
1227:       roofShape: "gable",
1228:     };
1229:   }
1230:   if (signature.kind === "desert_mesa_tower") {
1231:     return {
1232:       label: mesaSignal ? "Mesa water tower" : "Desert water tower",
1233:       buildingKind: "gym",
1234:       lotKind: "civic",
1235:       width: 1.16,
1236:       depth: 1.18,
1237:       height: roundDimension(3.68 + (mesaSignal ? 0.28 : 0) + (parameters.climate.aridity === "arid" ? 0.16 : 0)),
1238:       ...colors,
1239:       facadeStyle: "fitness",
1240:       roofShape: "tower",
1241:     };
1242:   }
1243:   if (signature.kind === "mountain_ridge_lodge") {
1244:     return {
1245:       label: ridgeSignal ? "Ridge lodge" : "Mountain lodge",
1246:       buildingKind: "civic",
1247:       lotKind: "civic",
1248:       width: 4.18,
1249:       depth: 2.24,
1250:       height: roundDimension(2.02 + snowPitchLift + roofPitchLift),
1251:       ...colors,
1252:       facadeStyle: "civic",
1253:       roofShape: "gable",
1254:     };
1255:   }
1256:   if (signature.kind === "prairie_grain_elevator") {
1257:     return {
1258:       label: "Grain elevator",
1259:       buildingKind: "gym",
1260:       lotKind: "shop",
1261:       width: 1.18,
1262:       depth: 1.76,
1263:       height: roundDimension(3.38 + (parameters.region === "west_north_central" ? 0.18 : 0) + (parameters.climate.aridity === "dry" ? 0.08 : 0)),
1264:       ...colors,
1265:       facadeStyle: "fitness",
1266:       roofShape: "tower",
1267:     };
1268:   }
1380:   signature: CityWorldGeneratedLandmarkSignature,
1381:   anchor: CityWorldPoint,
1382:   placeId: string,
1383:   elevationModel: ParametricElevationModel,
1384: ): CityWorldProp[] {
1385:   const props: CityWorldProp[] = [];
1386:   const point = (id: string, kind: CityWorldProp["kind"], dx: number, dy: number, variant: number) =>
1387:     withPropMetadata({
1388:       id: `gen-landmark-prop-${signature.kind}-${id}`,
1389:       kind,
1390:       position: {
1391:         x: roundDimension(anchor.x + dx),
1392:         y: roundDimension(anchor.y + dy),
1393:         z: elevationModel.tileZ(Math.round(anchor.x + dx), Math.round(anchor.y + dy)),
1394:       },
1395:       variant,
1396:       placeId,
1397:     });
1398: 
1399:   if (signature.kind === "desert_mesa_tower") {
1400:     props.push(point("tank", "water_tower", 0.72, -0.2, 0));
1401:   } else if (signature.kind === "mountain_ridge_lodge") {
1402:     props.push(point("pine-0", "tree", -2.05, -0.9, 2), point("pine-1", "tree", 2.1, -0.72, 3), point("pine-2", "tree", -1.35, 1.18, 4));
1403:   } else if (signature.kind === "prairie_grain_elevator") {
1404:     props.push(point("drum", "water_tower", 0.78, -0.08, 1));
1405:   }
1406: 

codex
Generated landmarks are real, but they’re one signature per archetype and many reuse existing building kinds such as `shop`, `gym`, and `civic`; that supports a more precise finding: landmarks are labels/signatures over a thin reusable kit, not a broad authored object library.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldParametricGenerator.ts | ForEach-Object { $i++; if ($i -ge 936 -and $i -le 956) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldParametricGenerator.ts | ForEach-Object { $i++; if (($i -ge 330 -and $i -le 430) -or ($i -ge 520 -and $i -le 660) -or ($i -ge 720 -and $i -le 830)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
 succeeded in 884ms:
936:   metro_civic_tower: {
937:     kind: "metro_civic_tower",
938:     archetype: "metro_grid",
939:     hostCell: "civic_core",
940:     buildingKind: "civic",
941:     roofShape: "tower",
942:     facadeStyle: "civic",
943:     expectedAccentProps: [],
944:   },
945: };
946: 
947: export function expectedGeneratedLandmarkKind(parameters: CountyGenerationParameters): CityWorldGeneratedLandmarkKind {
948:   return LANDMARK_KIND_BY_ARCHETYPE[parameters.archetype];
949: }
950: 
951: export function analyzeGeneratedLandmark(scene: CityWorldScene): CityWorldGeneratedLandmarkReadout | null {
952:   const building = scene.buildings.find((candidate) => candidate.id.startsWith("gen-landmark-"));
953:   if (!building?.placeId) return null;
954:   const kind = landmarkKindFromBuildingId(building.id);
955:   if (!kind) return null;
956:   const signature = GENERATED_LANDMARK_SIGNATURES[kind];

 succeeded in 935ms:
330:       zones: spec.zones.length,
331:     },
332:   };
333: }
334: 
335: /** Buildings may not stand in a road corridor (road half-width + margin). */
336: const ROAD_CLEARANCE_MARGIN = 0.35;
337: 
338: function parcelClearsRoads(parcel: ParcelLayout, roads: CityWorldRoadSegment[]): boolean {
339:   const halfW = parcel.width / 2;
340:   const halfD = parcel.depth / 2;
341:   for (const road of roads) {
342:     if (road.kind === "crosswalk") continue; // painted on the road surface, not a corridor
343:     const halfCorridor = road.width / 2 + ROAD_CLEARANCE_MARGIN;
344:     const minX = Math.min(road.from.x, road.to.x) - halfCorridor;
345:     const maxX = Math.max(road.from.x, road.to.x) + halfCorridor;
346:     const minY = Math.min(road.from.y, road.to.y) - halfCorridor;
347:     const maxY = Math.max(road.from.y, road.to.y) + halfCorridor;
348:     if (parcel.x + halfW > minX && parcel.x - halfW < maxX && parcel.y + halfD > minY && parcel.y - halfD < maxY) {
349:       return false;
350:     }
351:   }
352:   return true;
353: }
354: 
355: type ParcelLayout = {
356:   index: number;
357:   x: number;
358:   y: number;
359:   width: number;
360:   depth: number;
361:   elevationBoost: number;
362:   // 0.57E parity â€” the building spec is chosen FIRST and the parcel is sized
363:   // around it. Sizing parcels before specs crushed every wide template (ranch,
364:   // rowhome, strip) to the narrow default footprint, destroying the pool's
365:   // silhouette variety and leaving oversized pads that read as empty lots.
366:   spec?: ZoneBuildingSpec;
367:   /** Optional role override for authored fabric lots. */
368:   lotKind?: CityWorldLot["kind"];
369: };
370: 
371: function createParametricTerrain(spec: CityWorldParametricSpec, bounds: CityWorldBounds, elevationModel: ParametricElevationModel): CityWorldTerrainTile[] {
372:   const tiles: CityWorldTerrainTile[] = [];
373:   for (let y = bounds.minY; y <= bounds.maxY; y += 1) {
374:     for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
375:       const point: CityWorldPoint = { x, y, z: elevationModel.tileZ(x, y) };
376:       const zone = zoneAt(spec.zones, x, y);
377:       const kind: CityWorldTerrainKind = zone ? ZONE_TO_TERRAIN[zone.kind] : "grass";
378:       const variant = terrainVariantForZone(zone, x, y);
379:       const relief = reliefAt(spec, x, y);
380:       const grammar = parametricTerrainGrammar(spec, zone, point, bounds, relief);
381:       const elevation = tileElevationGrammar(elevationModel, x, y);
382:       tiles.push({
383:         id: `gen-terrain-${x}-${y}`,
384:         kind,
385:         position: point,
386:         width: 1,
387:         depth: 1,
388:         variant,
389:         spriteKey: `tile.${kind}.${variant}`,
390:         paletteKey: regionalTerrainKeyForKind(kind, spec.regionalPalette),
391:         detailLevel: kind === "water" || kind === "park" || kind === "plaza" ? "medium" : "low",
392:         visualGrammar: elevation ? { ...grammar, elevation } : grammar,
393:       });
394:     }
395:   }
396:   return withCityWorldTerrainContactMetadata(tiles, "public");
397: }
398: 
399: function parametricTerrainGrammar(
400:   spec: CityWorldParametricSpec,
401:   zone: CityWorldZoneSpec | undefined,
402:   point: CityWorldPoint,
403:   bounds: CityWorldBounds,
404:   relief: number,
405: ): CityWorldVisualGrammar {
406:   const nearWorldEdge = isNearBounds(point, bounds, 3);
407:   const onZoneEdge = zone ? isOnZoneEdge(zone, point) : false;
408: 
409:   if (zone && isFillZoneKind(zone.kind)) {
410:     return fillZoneTerrainGrammar(zone, nearWorldEdge, onZoneEdge, relief);
411:   }
412: 
413:   const composition: NonNullable<CityWorldVisualGrammar["terrainComposition"]> = !zone
414:     ? "quiet_field"
415:     : zone.kind === "water"
416:       ? "waterfront_edge_strata"
417:       : zone.kind === "park"
418:         ? "park_basin"
419:         : zone.kind === "commercial" || zone.kind === "plaza" || zone.kind === "gym"
420:           ? "commercial_apron_field"
421:           : zone.kind === "civic"
422:             ? "civic_focus_field"
423:             : "neighborhood_yard_fabric";
424: 
425:   const elevation: NonNullable<CityWorldVisualGrammar["terrainElevation"]> = nearWorldEdge
426:     ? "raised_parcel_shelf"
427:     : !zone
428:       ? relief > 0.38
429:         ? "raised_parcel_shelf"
430:         : "flat_field"
520:   relief: number,
521: ): CityWorldVisualGrammar {
522:   const worldOrZoneEdge = nearWorldEdge ? "world_edge" : onZoneEdge ? "parcel_cluster_edge" : "none";
523:   const worldOrNoneMassing = nearWorldEdge ? "outer_world_edge_mass" : "none";
524: 
525:   if (zone.kind === "farm_field") {
526:     return {
527:       terrainProfile: "quiet_socal_grass",
528:       terrainComposition: "neighborhood_yard_fabric",
529:       terrainElevation: nearWorldEdge ? "raised_parcel_shelf" : "flat_field",
530:       chunkEdge: worldOrZoneEdge,
531:       terrainChunkMassing: worldOrNoneMassing,
532:       contactProfile: "soft_ground_shadow",
533:     };
534:   }
535: 
536:   if (zone.kind === "plaza_paving") {
537:     return {
538:       terrainProfile: "commercial_plaza",
539:       terrainComposition: "commercial_apron_field",
540:       terrainElevation: "commercial_slab_field",
541:       chunkEdge: worldOrZoneEdge,
542:       terrainChunkMassing: nearWorldEdge || onZoneEdge ? "commercial_slab_mass" : "none",
543:       contactProfile: "parcel_pad_shadow",
544:     };
545:   }
546: 
547:   if (zone.kind === "civic_forecourt") {
548:     return {
549:       terrainProfile: "landmark_civic_ground",
550:       terrainComposition: "civic_focus_field",
551:       terrainElevation: "civic_plinth_shelf",
552:       chunkEdge: worldOrZoneEdge,
553:       terrainChunkMassing: nearWorldEdge || onZoneEdge ? "civic_plinth_mass" : "commercial_slab_mass",
554:       contactProfile: "landmark_base_shadow",
555:     };
556:   }
557: 
558:   if (zone.kind === "dry_wash") {
559:     return {
560:       terrainProfile: "quiet_socal_grass",
561:       terrainComposition: "quiet_field",
562:       terrainElevation: relief > 0.42 || nearWorldEdge ? "raised_parcel_shelf" : "flat_field",
563:       chunkEdge: nearWorldEdge ? "world_edge" : onZoneEdge && relief > 0.36 ? "parcel_cluster_edge" : "none",
564:       terrainChunkMassing: nearWorldEdge ? "outer_world_edge_mass" : relief > 0.42 ? "residential_shelf_mass" : "none",
565:       contactProfile: "soft_ground_shadow",
566:     };
567:   }
568: 
569:   if (zone.kind === "scree") {
570:     return {
571:       terrainProfile: "quiet_socal_grass",
572:       terrainComposition: "quiet_field",
573:       terrainElevation: "raised_parcel_shelf",
574:       chunkEdge: worldOrZoneEdge,
575:       terrainChunkMassing: nearWorldEdge || onZoneEdge || relief > 0.5 ? "residential_shelf_mass" : "none",
576:       contactProfile: "soft_ground_shadow",
577:     };
578:   }
579: 
580:   if (zone.kind === "shore_bank") {
581:     return {
582:       terrainProfile: "water_edge",
583:       terrainComposition: "waterfront_edge_strata",
584:       terrainElevation: "water_edge_cut",
585:       chunkEdge: nearWorldEdge ? "world_edge" : "waterfront_bank_edge",
586:       terrainChunkMassing: "waterfront_bank_cut_mass",
587:       contactProfile: "soft_ground_shadow",
588:     };
589:   }
590: 
591:   if (zone.kind === "meadow") {
592:     return {
593:       terrainProfile: "civic_green",
594:       terrainComposition: "park_basin",
595:       terrainElevation: relief > 0.18 || nearWorldEdge ? "raised_parcel_shelf" : "park_basin_shelf",
596:       chunkEdge: nearWorldEdge ? "world_edge" : onZoneEdge ? "park_basin_edge" : "none",
597:       terrainChunkMassing: nearWorldEdge ? "outer_world_edge_mass" : relief > 0.18 ? "residential_shelf_mass" : onZoneEdge ? "park_basin_cut_mass" : "none",
598:       contactProfile: "soft_ground_shadow",
599:     };
600:   }
601: 
602:   return {
603:     terrainProfile: "civic_green",
604:     terrainComposition: "park_basin",
605:     terrainElevation: nearWorldEdge ? "raised_parcel_shelf" : "park_basin_shelf",
606:     chunkEdge: nearWorldEdge ? "world_edge" : onZoneEdge ? "park_basin_edge" : "none",
607:     terrainChunkMassing: nearWorldEdge ? "outer_world_edge_mass" : onZoneEdge ? "park_basin_cut_mass" : "none",
608:     contactProfile: "soft_ground_shadow",
609:   };
610: }
611: 
612: function layoutZoneParcels(
613:   zone: CityWorldZoneSpec,
614:   rng: () => number,
615:   boardCenter?: { x: number; y: number },
616:   gridOffset = 0,
617:   regionalPalette?: RegionalPalette,
618:   countyParameters?: CountyGenerationParameters,
619: ): ParcelLayout[] {
620:   const { rect } = zone;
621:   const zoneWidth = rect.maxX - rect.minX;
622:   const zoneHeight = rect.maxY - rect.minY;
623:   if (zoneWidth <= 0 || zoneHeight <= 0) return [];
624:   const massingProfile = generatedMassingProfileFor(countyParameters);
625: 
626:   // Park/water are single soft parcels.
627:   if (zone.kind === "park" || zone.kind === "water") {
628:     return [
629:       {
630:         index: 0,
631:         x: rect.minX + zoneWidth / 2,
632:         y: rect.minY + zoneHeight / 2,
633:         width: Math.max(3, zoneWidth * 0.9),
634:         depth: Math.max(3, zoneHeight * 0.9),
635:         elevationBoost: zone.elevationBoost ?? 0,
636:       },
637:     ];
638:   }
639: 
640:   // Civic and gym are single broad anchor parcels (one strong silhouette each).
641:   // The plinth pad hugs the anchor (â‰¤1.3Ã— its footprint) instead of stretching
642:   // to the zone â€” a zone-wide pad under a fixed-size anchor reads as an empty
643:   // apron and fails the pad-fill parity floor on wide blocks.
644:   if (zone.kind === "civic" || zone.kind === "gym") {
645:     const anchor = zone.kind === "civic" ? { width: 3.4, depth: 2.5 } : { width: 4.0, depth: 2.6 };
646:     return [
647:       {
648:         index: 0,
649:         x: rect.minX + zoneWidth / 2,
650:         y: rect.minY + zoneHeight / 2,
651:         width: Math.max(anchor.width, Math.min(zoneWidth * 0.72, anchor.width * 1.3)),
652:         depth: Math.max(anchor.depth, Math.min(zoneHeight * 0.68, anchor.depth * 1.3)),
653:         elevationBoost: zone.elevationBoost ?? 0,
654:       },
655:     ];
656:   }
657: 
658:   // 0.57E parity â€” commerce authors road-facing STRIP ROWS the way curated
659:   // Plaza Row does: one wide elastic storefront strip per row segment (bays
660:   // repeat, so the template stretches to fill it), never a grid of small
720:   // a dense block, not scattered towers); they usually sit in the lower frame.
721:   // 0.75C fabric floor â€” residential/apartment zones clamp UP to these
722:   // minimums; zone.density can only densify them further, never thin the
723:   // small-house fabric below the north-star read.
724:   const density =
725:     zone.kind === "residential"
726:       ? Math.max(zone.density ?? massingProfile.residentialDensityFloor, massingProfile.residentialDensityFloor)
727:       : zone.kind === "apartments"
728:         ? Math.max(zone.density ?? massingProfile.apartmentDensityFloor, massingProfile.apartmentDensityFloor)
729:         : zone.density ?? 0.62;
730:   const cell = zone.kind === "residential" ? massingProfile.residentialCell : zone.kind === "apartments" ? massingProfile.apartmentCell : 3.4;
731:   const cols = Math.max(1, Math.floor(zoneWidth / cell));
732:   const rows = Math.max(1, Math.floor(zoneHeight / cell));
733:   const cellWidth = zoneWidth / cols;
734:   const cellHeight = zoneHeight / rows;
735:   const parcels: ParcelLayout[] = [];
736:   const footprint = parcelFootprint(zone.kind);
737:   let index = 0;
738: 
739:   const parcelForSpec = (spec: ZoneBuildingSpec): { width: number; depth: number } => ({
740:     // The lot pad hugs the chosen building (small margin) instead of imposing
741:     // a fixed footprint, clamped to the grid pitch so neighbours stay parcels.
742:     width: Math.max(footprint.width * 0.7, Math.min(spec.width * 1.16, cellWidth * 1.15)),
743:     depth: Math.max(footprint.depth * 0.7, Math.min(spec.depth * 1.22, cellHeight * 1.15)),
744:   });
745: 
746:   for (let row = 0; row < rows; row += 1) {
747:     for (let col = 0; col < cols; col += 1) {
748:       if (rng() > density) continue;
749:       const cx = rect.minX + (col + 0.5 + (col < cols - 1 ? gridOffset : 0)) * cellWidth;
750:       const cy = rect.minY + (row + 0.5 + (row < rows - 1 ? gridOffset : 0)) * cellHeight;
751:       const jitter = (rng() - 0.5) * 0.3;
752:       // Rotate apartment massing so court parcels step instead of cloning one slab.
753:       const spec =
754:         zone.kind === "apartments"
755:           ? apartmentSpecForOrdinal(index, rng, regionalPalette, countyParameters)
756:           : buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
757:       const pad = spec ? parcelForSpec(spec) : footprint;
758:       parcels.push({
759:         index: index++,
760:         x: cx + jitter,
761:         y: cy + jitter,
762:         width: pad.width,
763:         depth: pad.depth,
764:         elevationBoost: zone.elevationBoost ?? 0,
765:         ...(spec ? { spec } : {}),
766:       });
767:     }
768:   }
769: 
770:   // Never leave a zoned block empty â€” guarantee at least one anchor parcel.
771:   if (parcels.length === 0) {
772:     const spec =
773:       zone.kind === "apartments"
774:         ? apartmentSpecForOrdinal(0, rng, regionalPalette, countyParameters)
775:         : buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
776:     const pad = spec ? parcelForSpec(spec) : footprint;
777:     parcels.push({
778:       index: 0,
779:       x: rect.minX + zoneWidth / 2,
780:       y: rect.minY + zoneHeight / 2,
781:       width: pad.width,
782:       depth: pad.depth,
783:       elevationBoost: zone.elevationBoost ?? 0,
784:       ...(spec ? { spec } : {}),
785:     });
786:   }
787: 
788:   // Large neighborhoods get one downtown-facing corner market.
789:   if (zone.kind === "residential" && parcels.length >= massingProfile.cornerStoreMinParcels && boardCenter) {
790:     const cornerTargetX = boardCenter.x >= (rect.minX + rect.maxX) / 2 ? rect.maxX : rect.minX;
791:     const cornerTargetY = boardCenter.y >= (rect.minY + rect.maxY) / 2 ? rect.maxY : rect.minY;
792:     const cornerParcel = parcels.reduce((closest, parcel) => {
793:       const parcelDistance = Math.hypot(parcel.x - cornerTargetX, parcel.y - cornerTargetY);
794:       const closestDistance = Math.hypot(closest.x - cornerTargetX, closest.y - cornerTargetY);
795:       return parcelDistance < closestDistance ? parcel : closest;
796:     }, parcels[0] as ParcelLayout);
797:     const cornerSpec = applyDimensionJitter(CORNER_STORE_TEMPLATE, rng, regionalPalette, countyParameters);
798:     cornerSpec.labelOverride = "Corner market";
799:     cornerParcel.spec = cornerSpec;
800:     cornerParcel.lotKind = "shop";
801:     cornerParcel.width = Math.min(cornerSpec.width * 1.18, cellWidth * 1.15);
802:     cornerParcel.depth = Math.min(cornerSpec.depth * 1.3, cellHeight * 1.15);
803:   }
804: 
805:   return parcels;
806: }
807: 
808: function buildingForZone(
809:   zone: CityWorldZoneSpec,
810:   parcel: ParcelLayout,
811:   placeId: string,
812:   rng: () => number,
813:   regionalPalette?: RegionalPalette,
814:   countyParameters?: CountyGenerationParameters,
815: ): CityWorldBuilding | null {
816:   const spec = parcel.spec ?? buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
817:   if (!spec) return null;
818:   return {
819:     id: `gen-building-${zone.id}-${parcel.index}`,
820:     kind: spec.kind,
821:     label: spec.labelOverride ?? zone.label ?? zoneLabel(zone.kind),
822:     // Pin generated buildings to a manifest-allowed primitive key so
823:     // withBuildingMetadata cannot route them to the texture-backed sprite art:
824:     // authored sprites assume curated Eastvale footprints and collapse into
825:     // misregistered wrecks on jittered parametric widths.
826:     spriteKey: `building.${spec.kind}.generated.v1`,
827:     position: { x: parcel.x, y: parcel.y, z: 0 },
828:     // The parcel was sized around this spec, so the template's silhouette
829:     // survives; the gentle clamp only guards grid-pitch overflow.
830:     width: Math.min(parcel.width * 0.95, spec.width),

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldParametricGenerator.ts | ForEach-Object { $i++; if ($i -ge 808 -and $i -le 839) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
 succeeded in 482ms:
808: function buildingForZone(
809:   zone: CityWorldZoneSpec,
810:   parcel: ParcelLayout,
811:   placeId: string,
812:   rng: () => number,
813:   regionalPalette?: RegionalPalette,
814:   countyParameters?: CountyGenerationParameters,
815: ): CityWorldBuilding | null {
816:   const spec = parcel.spec ?? buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
817:   if (!spec) return null;
818:   return {
819:     id: `gen-building-${zone.id}-${parcel.index}`,
820:     kind: spec.kind,
821:     label: spec.labelOverride ?? zone.label ?? zoneLabel(zone.kind),
822:     // Pin generated buildings to a manifest-allowed primitive key so
823:     // withBuildingMetadata cannot route them to the texture-backed sprite art:
824:     // authored sprites assume curated Eastvale footprints and collapse into
825:     // misregistered wrecks on jittered parametric widths.
826:     spriteKey: `building.${spec.kind}.generated.v1`,
827:     position: { x: parcel.x, y: parcel.y, z: 0 },
828:     // The parcel was sized around this spec, so the template's silhouette
829:     // survives; the gentle clamp only guards grid-pitch overflow.
830:     width: Math.min(parcel.width * 0.95, spec.width),
831:     depth: Math.min(parcel.depth * 0.95, spec.depth),
832:     height: spec.height + parcel.elevationBoost,
833:     bodyColor: spec.bodyColor,
834:     roofColor: spec.roofColor,
835:     ...(spec.paletteKey ? { paletteKey: spec.paletteKey } : {}),
836:     placeId,
837:     roofShape: spec.roofShape,
838:     facadeStyle: spec.facadeStyle,
839:     detailLevel: spec.kind === "home" ? "medium" : "high",

exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command 'rg -n "function buildingSpecForZone|function.*SpecForOrdinal|const .*TEMPLATE|RESIDENTIAL|RANCH|COTTAGE|ROW|STRIP|CORNER|applyDimensionJitter|regionalPalette|roofShape|facadeStyle" packages/core/src/voxel/cityWorldParametricGenerator.ts' in C:\Users\mzwin\Documents\Atlas
 succeeded in 306ms:
109:  regionalPalette?: RegionalPalette;
220:    let parcels = layoutZoneParcels(zone, rng, boardCenter, 0, spec.regionalPalette, spec.countyParameters).filter(
228:      parcels = layoutZoneParcels(zone, rng, boardCenter, 0.25, spec.regionalPalette, spec.countyParameters).filter((parcel) =>
251:      const building = buildingForZone(zone, parcel, placeId, rng, spec.regionalPalette, spec.countyParameters);
390:        paletteKey: regionalTerrainKeyForKind(kind, spec.regionalPalette),
617:  regionalPalette?: RegionalPalette,
658:  // 0.57E parity — commerce authors road-facing STRIP ROWS the way curated
676:        const template = buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
697:      const template = buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
755:          ? apartmentSpecForOrdinal(index, rng, regionalPalette, countyParameters)
756:          : buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
774:        ? apartmentSpecForOrdinal(0, rng, regionalPalette, countyParameters)
775:        : buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
797:    const cornerSpec = applyDimensionJitter(CORNER_STORE_TEMPLATE, rng, regionalPalette, countyParameters);
813:  regionalPalette?: RegionalPalette,
816:  const spec = parcel.spec ?? buildingSpecForZone(zone.kind, rng, regionalPalette, countyParameters);
837:    roofShape: spec.roofShape,
838:    facadeStyle: spec.facadeStyle,
850:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
851:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
875:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
876:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
896:    roofShape: "hip",
897:    facadeStyle: "strip_store",
905:    roofShape: "gable",
906:    facadeStyle: "storefront",
914:    roofShape: "tower",
915:    facadeStyle: "fitness",
923:    roofShape: "gable",
924:    facadeStyle: "civic",
932:    roofShape: "tower",
933:    facadeStyle: "fitness",
941:    roofShape: "tower",
942:    facadeStyle: "civic",
970:    roofShape: building.roofShape ?? signature.roofShape,
971:    facadeStyle: building.facadeStyle ?? signature.facadeStyle,
978:      roofShape: building.roofShape ?? signature.roofShape,
979:      facadeStyle: building.facadeStyle ?? signature.facadeStyle,
991:  signature: Pick<CityWorldGeneratedLandmarkReadout, "buildingKind" | "roofShape" | "facadeStyle" | "hostCell" | "width" | "depth" | "height">,
996:    signature.facadeStyle,
997:    signature.roofShape,
1117:  facadeStyle: NonNullable<CityWorldBuilding["facadeStyle"]>;
1118:  roofShape: NonNullable<CityWorldBuilding["roofShape"]>;
1166:    roofShape: massing.roofShape,
1167:    facadeStyle: massing.facadeStyle,
1213:      facadeStyle: "strip_store",
1214:      roofShape: "hip",
1226:      facadeStyle: "storefront",
1227:      roofShape: "gable",
1239:      facadeStyle: "fitness",
1240:      roofShape: "tower",
1252:      facadeStyle: "civic",
1253:      roofShape: "gable",
1265:      facadeStyle: "fitness",
1266:      roofShape: "tower",
1278:    facadeStyle: "civic",
1279:    roofShape: "tower",
1436:const RESIDENTIAL_TEMPLATE_POOL: Array<{ weight: number; template: ZoneBuildingTemplate }> = [
1437:  { weight: 0.5, template: { kind: "home", width: 1.28, depth: 1.08, height: 1.02, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f2dfc4", "#ead4b6", "#f6e7cf"], roofColors: ["#b86f4c", "#8a6a52", "#b99358"] } },
1438:  { weight: 0.48, template: { kind: "home", width: 1.52, depth: 1.12, height: 1.08, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f0dcc4", "#ecdcc0", "#e7d4b8"], roofColors: ["#a9704f", "#7d9a86", "#5f7f8e"] } },
1439:  { weight: 0.52, template: { kind: "home", width: 2.0, depth: 1.18, height: 0.98, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0", "#e7d6bd"], roofColors: ["#7f9b6e", "#5f7f8e", "#a76f4e"] } },
1440:  { weight: 0.52, template: { kind: "home", width: 2.18, depth: 1.28, height: 1.04, facadeStyle: "ranch", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad", "#f0ddc2"], roofColors: ["#a9704f", "#5f7f8e", "#8a6a52"] } },
1441:  { weight: 0.68, template: { kind: "home", width: 2.56, depth: 1.08, height: 1.26, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#f2dfc2", "#eed9c0", "#ead2b4"], roofColors: ["#607d84", "#6f9ca7", "#7f9b6e"] } },
1442:  { weight: 0.46, template: { kind: "home", width: 1.72, depth: 1.06, height: 1.18, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#eed8bd", "#f3e1c6"], roofColors: ["#587a8e", "#8a6a52"] } },
1445:const RIVER_TOWN_RESIDENTIAL_TEMPLATE_POOL: Array<{ weight: number; template: ZoneBuildingTemplate }> = [
1446:  { weight: 0.18, template: { kind: "home", width: 1.84, depth: 1.34, height: 1.04, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad", "#f0ddc2"], roofColors: ["#2f5d8a", "#577747", "#9a927d"] } },
1447:  { weight: 0.16, template: { kind: "home", width: 2.34, depth: 1.42, height: 1.0, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0", "#e7d6bd"], roofColors: ["#577747", "#9a927d", "#2f5d8a"] } },
1451:const COMMERCIAL_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
1452:  { kind: "shop", width: 3.0, depth: 1.7, height: 1.4, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efd8b6", "#eedcc4"], roofColors: ["#3f8b8c", "#6f9a86"] },
1453:  { kind: "shop", width: 3.6, depth: 1.5, height: 1.1, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efdcc0", "#f2dfc2"], roofColors: ["#c48a5a", "#82a4c4"] },
1454:  { kind: "shop", width: 2.6, depth: 1.95, height: 1.6, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#eedcc4", "#efd8b6"], roofColors: ["#6f9a86", "#c48a5a"] },
1458:const CORNER_STORE_TEMPLATE: ZoneBuildingTemplate = {
1463:  facadeStyle: "storefront",
1464:  roofShape: "flat",
1468:const CORNER_STORE_MIN_PARCELS = 6;
1471:const APARTMENT_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
1472:  { kind: "apartment", width: 2.35, depth: 2.9, height: 3.25, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#ead7bb", "#e3cfae"], roofColors: ["#6d8f6f", "#587a8e"] },
1473:  { kind: "apartment", width: 3.0, depth: 1.7, height: 2.3, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#e7c9a8", "#e3d0b4"], roofColors: ["#416f82", "#8a6f95"] },
1474:  { kind: "apartment", width: 2.6, depth: 1.95, height: 2.05, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#e3d0b4", "#ead7bb"], roofColors: ["#587a8e", "#6d8f6f"] },
1486:function apartmentSpecForOrdinal(
1489:  regionalPalette?: RegionalPalette,
1492:  const template = APARTMENT_TEMPLATE_POOL[ordinal % APARTMENT_TEMPLATE_POOL.length] as ZoneBuildingTemplate;
1493:  const spec = applyDimensionJitter(template, rng, regionalPalette, countyParameters);
1498:const GYM_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
1499:  { kind: "gym", width: 4.0, depth: 2.6, height: 2.0, facadeStyle: "fitness", roofShape: "sawtooth", bodyColors: ["#d7e7ef", "#d3e2ea"], roofColors: ["#a76f4e", "#5f8fa6"] },
1502:function applyDimensionJitter(
1505:  regionalPalette?: RegionalPalette,
1514:  const bodyPick = pickIndexed(rng, regionalPalette?.body ?? template.bodyColors);
1515:  const roofPick = pickIndexed(rng, regionalPalette?.roof ?? template.roofColors);
1517:  const regional = regionalPalette ? resolveRegionalBuildingPalette(regionalPalette, paletteIndex.body, paletteIndex.roof) : undefined;
1527:      facadeStyle: template.facadeStyle,
1528:      roofShape: template.roofShape,
1542:    (template.facadeStyle === "rowhome" || template.kind === "apartment")
1574:    if (spec.facadeStyle === "rowhome") height = Math.min(height, 1.48);
1575:    else if (spec.facadeStyle === "cottage") height = Math.min(height, 1.26, footprintMin * 1.12);
1576:    else if (spec.facadeStyle === "ranch") height = Math.min(height, 1.18, footprintMin * 0.94);
1591:      ? [...RESIDENTIAL_TEMPLATE_POOL, ...RIVER_TOWN_RESIDENTIAL_TEMPLATE_POOL]
1592:      : RESIDENTIAL_TEMPLATE_POOL;
1607:  if (template.facadeStyle === "rowhome") return profile.rowhomeWeight;
1608:  if (template.facadeStyle === "ranch") return profile.ranchWeight;
1649:      cornerStoreMinParcels: CORNER_STORE_MIN_PARCELS,
1775:function buildingSpecForZone(
1778:  regionalPalette?: RegionalPalette,
1783:    return template ? applyDimensionJitter(template, rng, regionalPalette, countyParameters) : null;
1786:    return applyDimensionJitter(pick(rng, COMMERCIAL_TEMPLATE_POOL), rng, regionalPalette, countyParameters);
1789:    return applyDimensionJitter(pick(rng, APARTMENT_TEMPLATE_POOL), rng, regionalPalette, countyParameters);
1792:    return applyDimensionJitter(pick(rng, GYM_TEMPLATE_POOL), rng, regionalPalette, countyParameters);
1795:    const regional = regionalPalette ? resolveRegionalBuildingPalette(regionalPalette, 0, 0) : undefined;
1809:      facadeStyle: "civic",
1810:      roofShape: metroTower ? "tower" : "hip",
1816:function regionalTerrainKeyForKind(kind: CityWorldTerrainKind, regionalPalette: RegionalPalette | undefined): string {
1817:  if (!regionalPalette || kind === "water") return `terrain.${kind}`;
1818:  return regionalTerrainPaletteKey(regionalPalette.archetype);
1962:    archetype: spec.countyParameters?.archetype ?? spec.regionalPalette?.archetype,
1968:  const archetype = spec.countyParameters?.archetype ?? spec.regionalPalette?.archetype;
2888:const CORNER_STORE_MIN_WIDTH_TILES = 1.7;
2933:  const cornerShops = shops.filter((building) => building.facadeStyle === "storefront");
2934:  const rowShops = shops.filter((building) => building.facadeStyle !== "storefront");
2936:    (building) => building.facadeStyle === "strip_store" && building.objectKit?.prefabFamily === "commerce_strip",
2939:    building.facadeStyle === "storefront"
2940:      ? building.width < CORNER_STORE_MIN_WIDTH_TILES
3006:      // Ratio over strip ROWS only; corner storefronts are their own role.
3028:      pitchedHomeCount: homes.filter((building) => building.roofShape === "gable" || building.roofShape === "hip").length,
3029:      flatRowhomeCount: homes.filter((building) => building.facadeStyle === "rowhome" && building.roofShape === "flat").length,
3044:  const roofShape = building.roofShape ?? "flat";
3045:  const style = building.facadeStyle ?? "cottage";
3049:  if (style === "rowhome") safe = roofShape === "flat" && building.height <= 1.52;
3050:  else if (style === "cottage") safe = roofShape === "gable" && building.height <= 1.28 && heightToFootprintRatio <= 1.14;
3051:  else if (style === "ranch") safe = (roofShape === "gable" || roofShape === "hip") && building.width >= 1.8 && building.height <= 1.22 && heightToFootprintRatio <= 0.96;
3052:  else safe = roofShape !== "tower";

codex
The residential/commercial generator is template-pool based with small numeric jitter, not sculpted lots. I’m going to treat that as a major finding because it is exactly where a stylized game art director would see “procedural cheapness” first.
exec
"C:\\WINDOWS\\System32\\WindowsPowerShell\\v1.0\\powershell.exe" -Command '$i=0; Get-Content packages/core/src/voxel/cityWorldParametricGenerator.ts | ForEach-Object { $i++; if (($i -ge 1436 -and $i -le 1475) -or ($i -ge 1498 -and $i -le 1529) -or ($i -ge 1775 -and $i -le 1818)) { '"'{0}: {1}' -f "'$i, $_ } }' in C:\Users\mzwin\Documents\Atlas
 succeeded in 693ms:
1436: const RESIDENTIAL_TEMPLATE_POOL: Array<{ weight: number; template: ZoneBuildingTemplate }> = [
1437:   { weight: 0.5, template: { kind: "home", width: 1.28, depth: 1.08, height: 1.02, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f2dfc4", "#ead4b6", "#f6e7cf"], roofColors: ["#b86f4c", "#8a6a52", "#b99358"] } },
1438:   { weight: 0.48, template: { kind: "home", width: 1.52, depth: 1.12, height: 1.08, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#f0dcc4", "#ecdcc0", "#e7d4b8"], roofColors: ["#a9704f", "#7d9a86", "#5f7f8e"] } },
1439:   { weight: 0.52, template: { kind: "home", width: 2.0, depth: 1.18, height: 0.98, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0", "#e7d6bd"], roofColors: ["#7f9b6e", "#5f7f8e", "#a76f4e"] } },
1440:   { weight: 0.52, template: { kind: "home", width: 2.18, depth: 1.28, height: 1.04, facadeStyle: "ranch", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad", "#f0ddc2"], roofColors: ["#a9704f", "#5f7f8e", "#8a6a52"] } },
1441:   { weight: 0.68, template: { kind: "home", width: 2.56, depth: 1.08, height: 1.26, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#f2dfc2", "#eed9c0", "#ead2b4"], roofColors: ["#607d84", "#6f9ca7", "#7f9b6e"] } },
1442:   { weight: 0.46, template: { kind: "home", width: 1.72, depth: 1.06, height: 1.18, facadeStyle: "rowhome", roofShape: "flat", bodyColors: ["#eed8bd", "#f3e1c6"], roofColors: ["#587a8e", "#8a6a52"] } },
1443: ];
1444: 
1445: const RIVER_TOWN_RESIDENTIAL_TEMPLATE_POOL: Array<{ weight: number; template: ZoneBuildingTemplate }> = [
1446:   { weight: 0.18, template: { kind: "home", width: 1.84, depth: 1.34, height: 1.04, facadeStyle: "cottage", roofShape: "gable", bodyColors: ["#ecd6b6", "#e8cfad", "#f0ddc2"], roofColors: ["#2f5d8a", "#577747", "#9a927d"] } },
1447:   { weight: 0.16, template: { kind: "home", width: 2.34, depth: 1.42, height: 1.0, facadeStyle: "ranch", roofShape: "hip", bodyColors: ["#e8c9aa", "#ecd2b0", "#e7d6bd"], roofColors: ["#577747", "#9a927d", "#2f5d8a"] } },
1448: ];
1449: 
1450: // Strip templates stay flat/parapet; hip roofs make rows read as houses.
1451: const COMMERCIAL_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
1452:   { kind: "shop", width: 3.0, depth: 1.7, height: 1.4, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efd8b6", "#eedcc4"], roofColors: ["#3f8b8c", "#6f9a86"] },
1453:   { kind: "shop", width: 3.6, depth: 1.5, height: 1.1, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#efdcc0", "#f2dfc2"], roofColors: ["#c48a5a", "#82a4c4"] },
1454:   { kind: "shop", width: 2.6, depth: 1.95, height: 1.6, facadeStyle: "strip_store", roofShape: "flat", bodyColors: ["#eedcc4", "#efd8b6"], roofColors: ["#6f9a86", "#c48a5a"] },
1455: ];
1456: 
1457: /** Small storefront module placed inside large residential zones. */
1458: const CORNER_STORE_TEMPLATE: ZoneBuildingTemplate = {
1459:   kind: "shop",
1460:   width: 2.1,
1461:   depth: 1.25,
1462:   height: 1.1,
1463:   facadeStyle: "storefront",
1464:   roofShape: "flat",
1465:   bodyColors: ["#eed7b2", "#f0dcbb"],
1466:   roofColors: ["#437085", "#6f9a86", "#a9704f"],
1467: };
1468: const CORNER_STORE_MIN_PARCELS = 6;
1469: 
1470: /** Tower, mid-court, and low-court apartment silhouettes. */
1471: const APARTMENT_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
1472:   { kind: "apartment", width: 2.35, depth: 2.9, height: 3.25, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#ead7bb", "#e3cfae"], roofColors: ["#6d8f6f", "#587a8e"] },
1473:   { kind: "apartment", width: 3.0, depth: 1.7, height: 2.3, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#e7c9a8", "#e3d0b4"], roofColors: ["#416f82", "#8a6f95"] },
1474:   { kind: "apartment", width: 2.6, depth: 1.95, height: 2.05, facadeStyle: "lowrise", roofShape: "flat", bodyColors: ["#e3d0b4", "#ead7bb"], roofColors: ["#587a8e", "#6d8f6f"] },
1475: ];
1498: const GYM_TEMPLATE_POOL: ZoneBuildingTemplate[] = [
1499:   { kind: "gym", width: 4.0, depth: 2.6, height: 2.0, facadeStyle: "fitness", roofShape: "sawtooth", bodyColors: ["#d7e7ef", "#d3e2ea"], roofColors: ["#a76f4e", "#5f8fa6"] },
1500: ];
1501: 
1502: function applyDimensionJitter(
1503:   template: ZoneBuildingTemplate,
1504:   rng: () => number,
1505:   regionalPalette?: RegionalPalette,
1506:   countyParameters?: CountyGenerationParameters,
1507: ): ZoneBuildingSpec {
1508:   const home = template.kind === "home";
1509:   const riverTownHome = home && countyParameters?.archetypeProfile.archetype === "river_town";
1510:   const jitter = (value: number, spread = 0.3) => Math.round(value * (1 + (rng() - 0.5) * spread) * 100) / 100;
1511:   const width = jitter(template.width, riverTownHome ? 0.2 : home ? 0.14 : 0.3);
1512:   const depth = jitter(template.depth, riverTownHome ? 0.18 : home ? 0.12 : 0.3);
1513:   const height = jitter(template.height, home ? 0.08 : 0.3);
1514:   const bodyPick = pickIndexed(rng, regionalPalette?.body ?? template.bodyColors);
1515:   const roofPick = pickIndexed(rng, regionalPalette?.roof ?? template.roofColors);
1516:   const paletteIndex = generatedTemplatePaletteIndex(bodyPick.index, roofPick.index, template, countyParameters);
1517:   const regional = regionalPalette ? resolveRegionalBuildingPalette(regionalPalette, paletteIndex.body, paletteIndex.roof) : undefined;
1518:   return applyCountyMassingModulation(
1519:     {
1520:       kind: template.kind,
1521:       width,
1522:       depth,
1523:       height,
1524:       bodyColor: regional?.bodyColor ?? bodyPick.value,
1525:       roofColor: regional?.roofColor ?? roofPick.value,
1526:       ...(regional ? { paletteKey: regional.paletteKey } : {}),
1527:       facadeStyle: template.facadeStyle,
1528:       roofShape: template.roofShape,
1529:     },
1775: function buildingSpecForZone(
1776:   kind: CityWorldZoneKind,
1777:   rng: () => number,
1778:   regionalPalette?: RegionalPalette,
1779:   countyParameters?: CountyGenerationParameters,
1780: ): ZoneBuildingSpec | null {
1781:   if (kind === "residential") {
1782:     const template = weightedResidentialTemplate(rng, countyParameters);
1783:     return template ? applyDimensionJitter(template, rng, regionalPalette, countyParameters) : null;
1784:   }
1785:   if (kind === "commercial") {
1786:     return applyDimensionJitter(pick(rng, COMMERCIAL_TEMPLATE_POOL), rng, regionalPalette, countyParameters);
1787:   }
1788:   if (kind === "apartments") {
1789:     return applyDimensionJitter(pick(rng, APARTMENT_TEMPLATE_POOL), rng, regionalPalette, countyParameters);
1790:   }
1791:   if (kind === "gym") {
1792:     return applyDimensionJitter(pick(rng, GYM_TEMPLATE_POOL), rng, regionalPalette, countyParameters);
1793:   }
1794:   if (kind === "civic") {
1795:     const regional = regionalPalette ? resolveRegionalBuildingPalette(regionalPalette, 0, 0) : undefined;
1796:     const archetype = countyParameters?.archetypeProfile.archetype;
1797:     const metroTower = archetype === "metro_grid";
1798:     const mountainRidge = archetype === "mountain_valley";
1799:     const heightBias = countyParameters?.modulation.heightBias ?? 0;
1800:     const reliefLift = Math.max(0, (countyParameters?.modulation.reliefScale ?? 1) - 1);
1801:     return {
1802:       kind: "civic",
1803:       width: metroTower ? 2.4 : mountainRidge ? 3.65 : 3.4,
1804:       depth: metroTower ? 2.0 : mountainRidge ? 2.55 : 2.45,
1805:       height: roundDimension((metroTower ? 3.35 : mountainRidge ? 1.9 : 1.65) + heightBias * 4 + (mountainRidge ? reliefLift * 1.4 : 0)),
1806:       bodyColor: regional?.bodyColor ?? "#f3dfbd",
1807:       roofColor: regional?.roofColor ?? "#5d8fa8",
1808:       ...(regional ? { paletteKey: regional.paletteKey } : {}),
1809:       facadeStyle: "civic",
1810:       roofShape: metroTower ? "tower" : "hip",
1811:     };
1812:   }
1813:   return null;
1814: }
1815: 
1816: function regionalTerrainKeyForKind(kind: CityWorldTerrainKind, regionalPalette: RegionalPalette | undefined): string {
1817:   if (!regionalPalette || kind === "water") return `terrain.${kind}`;
1818:   return regionalTerrainPaletteKey(regionalPalette.archetype);

codex
1. [SEVERITY critical] Generated counties are still six rectilinear template boards with jitter, which directly fails the "hand-built" art promise.
Evidence: docs/NORTH_STARS.md:184-189 says generated counties must pass the Eastvale crop test and not read as "six templates x jitter".
Evidence: packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:80-181 defines archetypes as fixed rectangular zones; lines 209-283 define mostly straight axis-aligned roads.
Evidence: artifacts/emulator/audit/REPORT.md:15-28 only proves delivery/graphics/payload/console health, not visual parity or authored art quality.
Fix: Replace each archetype with authored micro-layout motif packs: irregular blocks, local road silhouettes, landmark placement rules, and crop-test metrics that can fail.

2. [SEVERITY high] Generated building variety is thin template-pool dressing, not a believable stylized town kit.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:1436-1455 has 6 residential templates, 2 river variants, and 3 commercial strips.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:1471-1499 has 3 apartment templates and exactly 1 gym template.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:1502-1529 mostly applies dimension/color jitter while keeping the same facadeStyle and roofShape.
Fix: Add region-aware prefab families with authored appendages, roof breaks, porch/stoop/yard variants, asymmetric wings, and per-zone silhouette quotas.

3. [SEVERITY high] The best art direction is still ID-specific to curated anchors; generated scenes fall back to generic families.
Evidence: packages/core/src/voxel/cityWorldObjectKit.ts:211-229 adds signature tags only for `building-civic`, `building-plaza-strip`, and `building-gym`.
Evidence: packages/core/src/voxel/cityWorldObjectKit.ts:247-267 gives Eastvale-only geometry boosts for civic and gym landmarks.
Evidence: packages/core/src/voxel/cityWorldCompiler.ts:1538-1544 special-cases Anaheim/Ontario IDs, then falls back to broad shop/apartment/gym/civic buckets at 1548-1558.
Fix: Move signature art grammar to declarative archetype/building-role specs so generated landmarks get real material, roof, plinth, and facade rules without ID hacks.

4. [SEVERITY medium] Prop art is the thinnest visible layer; placement reads sprinkled and vocabulary reads budget-constrained.
Evidence: packages/core/src/voxel/cityWorldTypes.ts:364-376 exposes only 12 prop kinds total.
Evidence: web/src/CityWorldRenderer.tsx:6392-6417 renders tree/bush as one stacked-box primitive with small variant changes.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:2018-2238 places trees/bushes from fixed frontage, cluster, corner, and fraction patterns.
Fix: Author prop motifs per archetype using richer variants inside the existing kinds first: tree silhouettes, shrub masses, dock/boat clusters, signs, benches, and landmark-adjacent prop sets.

5. [SEVERITY medium] Terrain relief exists, but terrain identity is still numeric grammar plus global grade, not authored land treatment.
Evidence: packages/core/src/voxel/cityWorldDerivedTerrainMap.ts:200-237 reduces terrain height to a small fixed table of base/elevation/massing/chunk values.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:525-609 maps farm fields, dry wash, scree, meadow, and shore bank into a few generic terrain profiles/compositions.
Evidence: web/src/CityWorldRenderer.tsx:1499-1520 applies regional color and tonal waves; lines 288-352 apply one global grade over every scene.
Fix: Add archetype-specific terrain materials: crop-row facets, dry-wash cracks, scree rocks, beach/shore bands, mesa rim courses, and per-region grade/material controls.


tokens used
162,828
1. [SEVERITY critical] Generated counties are still six rectilinear template boards with jitter, which directly fails the "hand-built" art promise.
Evidence: docs/NORTH_STARS.md:184-189 says generated counties must pass the Eastvale crop test and not read as "six templates x jitter".
Evidence: packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts:80-181 defines archetypes as fixed rectangular zones; lines 209-283 define mostly straight axis-aligned roads.
Evidence: artifacts/emulator/audit/REPORT.md:15-28 only proves delivery/graphics/payload/console health, not visual parity or authored art quality.
Fix: Replace each archetype with authored micro-layout motif packs: irregular blocks, local road silhouettes, landmark placement rules, and crop-test metrics that can fail.

2. [SEVERITY high] Generated building variety is thin template-pool dressing, not a believable stylized town kit.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:1436-1455 has 6 residential templates, 2 river variants, and 3 commercial strips.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:1471-1499 has 3 apartment templates and exactly 1 gym template.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:1502-1529 mostly applies dimension/color jitter while keeping the same facadeStyle and roofShape.
Fix: Add region-aware prefab families with authored appendages, roof breaks, porch/stoop/yard variants, asymmetric wings, and per-zone silhouette quotas.

3. [SEVERITY high] The best art direction is still ID-specific to curated anchors; generated scenes fall back to generic families.
Evidence: packages/core/src/voxel/cityWorldObjectKit.ts:211-229 adds signature tags only for `building-civic`, `building-plaza-strip`, and `building-gym`.
Evidence: packages/core/src/voxel/cityWorldObjectKit.ts:247-267 gives Eastvale-only geometry boosts for civic and gym landmarks.
Evidence: packages/core/src/voxel/cityWorldCompiler.ts:1538-1544 special-cases Anaheim/Ontario IDs, then falls back to broad shop/apartment/gym/civic buckets at 1548-1558.
Fix: Move signature art grammar to declarative archetype/building-role specs so generated landmarks get real material, roof, plinth, and facade rules without ID hacks.

4. [SEVERITY medium] Prop art is the thinnest visible layer; placement reads sprinkled and vocabulary reads budget-constrained.
Evidence: packages/core/src/voxel/cityWorldTypes.ts:364-376 exposes only 12 prop kinds total.
Evidence: web/src/CityWorldRenderer.tsx:6392-6417 renders tree/bush as one stacked-box primitive with small variant changes.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:2018-2238 places trees/bushes from fixed frontage, cluster, corner, and fraction patterns.
Fix: Author prop motifs per archetype using richer variants inside the existing kinds first: tree silhouettes, shrub masses, dock/boat clusters, signs, benches, and landmark-adjacent prop sets.

5. [SEVERITY medium] Terrain relief exists, but terrain identity is still numeric grammar plus global grade, not authored land treatment.
Evidence: packages/core/src/voxel/cityWorldDerivedTerrainMap.ts:200-237 reduces terrain height to a small fixed table of base/elevation/massing/chunk values.
Evidence: packages/core/src/voxel/cityWorldParametricGenerator.ts:525-609 maps farm fields, dry wash, scree, meadow, and shore bank into a few generic terrain profiles/compositions.
Evidence: web/src/CityWorldRenderer.tsx:1499-1520 applies regional color and tonal waves; lines 288-352 apply one global grade over every scene.
Fix: Add archetype-specific terrain materials: crop-row facets, dry-wash cracks, scree rocks, beach/shore bands, mesa rim courses, and per-region grade/material controls.


