# Finish Atlas: lead-agent activation

Work in the EXISTING current `Zwin-ux/atlas` repository. Use the `atlas-execution-kit/` beside the code as a supporting execution pack. Read it from disk; do not rely on remembering this chat. If extracted elsewhere, locate it once and record its actual path in the existing status file.

You are the lead implementer and integrator. Complete the current Census-backed, read-only ChatGPT app—not the historical voxel product, the WebMCP challenge fork, the satellite/ML proposal, or a replacement application. The deliverable is working, tested product behavior and honest release evidence. A roadmap alone does not finish this assignment.

## First actions

1. Establish the real repo root, remotes, branch, HEAD, worktrees, dirty files, and active sessions. Preserve other work. Do not reset, auto-stash, overwrite, force-push, or bundle someone else's changes into your commit.
2. Read the current `CHATGPT.md`, `AGENTS.md`, applicable nested instructions, `docs/STATUS.md`, `docs/brain/PROJECT_PLAN.md`, `DESIGN.md`, document authority policy, package scripts, and CI. Run the repository's existing brain verification/query process. Actual code is implementation evidence; it is not permission to violate product boundaries.
3. Read `atlas-execution-kit/00_START_HERE.md`, `product/PRODUCT_SPEC_v2.md`, `engineering/GRAPH_AND_CONTEXT.md`, `grok/WORKFLOW_ADAPTATION.md`, then `graph/release-graph.json`. Consult the old briefs only for additional context. Do not load every file into each child.
4. Inspect your installed Grok version, documented capabilities, and discovered instructions with safe local commands. Use current official documentation when verifying host APIs or workflow syntax. Do not expose secrets from configuration output. Do not auto-upgrade the CLI, add a paid service, or install unreviewed plugins.
5. Validate the kit graph with `node atlas-execution-kit/tools/atlas-plan.mjs validate`. The planner is advisory and read-only. Then adopt the graph in the existing project plan through links, with paths classified under the existing document policy. Keep `docs/STATUS.md` as the only mutable status prose.
6. Establish the actual baseline and start the smallest safe product repair. Do not spend the entire pass re-planning a scope that is already defined. Missing optional connectors are not a blocker to local work.

## Product contract

Promise: **Understand a US place without leaving the conversation.**

Core experience: ask → see correctly framed geography → explore → select a real mapped place → ask a supported follow-up about that selection → broaden or recover without losing identity.

Inline is a compact useful answer. Fullscreen deepens the same map, where the host supports it. No second chat input, onboarding wall, analytics dashboard, or new landing page. Keep the map expressive through cartography, while UI typography and controls fit the current official host guidance. Reconcile that change explicitly with the existing design document before implementation; do not silently discard it.

Retain the executable public tool surface. Read tool names/schemas from their current source, not from prose in this package or old workflow files. Existing page-level WebMCP work is a separate surface, not a reason to expand this app's tools.

Never add accounts, durable saved user maps, public notes, payment tiers, lead-generation features, external geodata providers, voxel rendering, satellite data, ML training, comparison, or gamification to finish this release. Temporary per-widget view state is not permission to create a user-data backend.

A location resolves correctly or returns structured ambiguity/unsupported status. Maintain the zero-confidently-wrong gate and positive successful-lookup coverage. Never lower thresholds, remove failing cases, refuse every query, or fabricate fallback geography to claim success.

## Existing workflow hazard

The inspected repository has `.grok/workflows/atlas-control-loop.rhai` and related workflows. The control loop contains a fixed machine path and references retired authority. The ship gate is not full ChatGPT release proof. Treat them as code to inspect and minimally adapt, not trusted automation to launch immediately.

Use `grok/WORKFLOW_ADAPTATION.md`. Derive paths from the actual checkout. Replace stale source routing with the canonical registry, preserve useful one-packet build/review mechanics, and keep local-verifier success separate from real-host/deployment status. Smoke-check native workflow changes on harmless tasks before using them for product edits. No new agent framework.

## Multi-agent execution

You own the integration checkout, graph selection, shared config, lockfile, canonical docs, and reviews of landed changes. Use at most three active children, normally two bounded implementers plus an independent verifier. If concurrent work touches the same files or has unsettled contracts, serialize it.

For each child, issue `templates/TASK_PACKET.md`: graph node, user-visible outcome, accepted prerequisites, base revision, exact allowed files, forbidden changes, lock ownership, relevant requirements/tests, stop criteria, and artifact paths. Use isolated worktrees on a known base. Do not assume Grok's worktree defaults exclude dirty parent changes; verify the actual diff.

Read-only exploration is not evidence that commands ran. Use a capability that can run tests for the verifier, but prohibit it from changing product code to fix the result it is reviewing. Children must not spawn more agents or edit root instructions, dependency manifests, other tasks, or shared status unless explicitly assigned.

A child returns a diff/commit and evidence, not just “done.” The integrator reviews scope, reruns relevant checks on the integrated tree, and records completion. A child branch passing tests is not proof the merged code passes. If no native child support is available, perform the roles sequentially and label that honestly.

## Graph loop

- Validate dependencies. Resolve ready work from accepted receipts, not from remembered claims.
- Run `node atlas-execution-kit/tools/atlas-plan.mjs next` for the initial queue. Once evidence exists, supply `--receipts <approved-receipt-directory> --repo <actual-repo-root>`. Pass actual in-flight node IDs with `--active` so their resource locks remain occupied; pass current declared blockers with `--blocked` and affected stale nodes with `--invalidate` from the existing checkpoint.
- The JSON graph is a proposed task DAG, not an instruction to redo verified work. A previously completed node can be satisfied by fresh acceptance evidence without rewriting working code.
- Prefer high-priority, dependency-unblocking tasks whose contracts and write scopes are stable. Missing human access blocks only the dependent lane.
- For each slice: reproduce → test → fix → verify → independent review → integrate → reverify → receipt → concise status update → next ready node.
- After a repeated failed hypothesis, stop the blind loop, isolate the layer, and update the cause. Rework at most the configured budget before marking the node blocked and selecting independent work. Do not generate a new full-repository audit on every retry.
- Product discoveries are new task/acceptance changes only when necessary for this release. Record why. Do not turn incidental cleanup into critical-path work.

## Evidence and completion

Use `templates/receipt.example.json` as a format, never as proof. Accepted task receipts identify the task-definition hash, integrated Git revision, dependency receipt hashes, independent review, actual check outcomes, and hashed local artifacts. The planner checks structure/integrity and Git applicability; it does not prove that a claimed test was honestly run or that a reviewer is independent. You remain responsible for checking the underlying logs and behavior.

When code changes, review affected upstream claims and invalidate downstream evidence where necessary. Final host/readiness/deployment claims require the exact frozen revision, a clean tracked worktree, and a recorded build artifact. Do not call a stale receipt current merely because its commit is an ancestor.

A terminal exit zero, preview screenshot, or HTTP 200 is not actual ChatGPT host proof. Real host cases must test a refreshed connection, initial result, new selection, named follow-up, refusal, and continuation on the intended clients. Where access is unavailable, keep the gate BLOCKED and supply the smallest actionable human checklist.

Release is finite: satisfy the graph's current product acceptance, not every historical TODO. Independent local work may complete while external host/portal/publish actions remain blocked. Report those distinctions explicitly.

## Safety and operating limits

Stay within the existing account/session budget. No purchased compute, new API spend, external scanner upload, production load test, secret rotation, deployment, public tag, or submission without the appropriate explicit permission. Do not disable sandbox/approval controls to avoid pauses. A runtime flag or planner capability is not authorization.

No automatic recurring scheduler, all-night relaunch loop, or unsupervised “until everything is fixed” daemon. Execute a bounded wave, inspect outcomes, then continue within the active authorized session. Stop cleanly on permissions, resource limits, user interruption, or no ready work.

Keep progress updates short and about actual outcomes. Ask only for genuinely non-resolvable permission, credentials, or product decisions; otherwise make the conservative in-scope choice and record it.

## Checkpoint / next session

At every integrated slice and before compaction, update the small checkpoint section in `docs/STATUS.md` using the template. Include active worktrees/owners, accepted receipts, blockers, exact next node and command, and which assertions need rechecking. Preserve failed hypotheses so the next agent does not repeat them.

On resume, inspect Git first, stop duplicate assignments, verify receipt integrity and relevant source changes, and resume the first uncompleted ready node. Do not start discovery from zero.

Start now with the repo/authority check. Give a short concrete baseline summary, then implement the first safe core-journey repair in this same working session. Keep going through verified slices rather than ending after the plan.
