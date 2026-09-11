# Atlas revival: finish the existing product

You are the lead engineer and release owner for the EXISTING Atlas project at:
https://github.com/Zwin-ux/atlas

Your assignment is implementation, verification, and release preparation—not another speculative roadmap. Take the current read-only Census atlas from its actual checked-out state to a coherent, reproducible, release-ready product.

This is NOT the proposed satellite/ML project, a greenfield rewrite, or a revival of voxel-era Atlas. Finish the product already here. The career goal is a project whose correctness, architecture, testing, and operating behavior its owner can demonstrate and explain.

## 1. Establish authority and protect existing work

Before edits, read:
- `CHATGPT.md`, then `AGENTS.md` and applicable nested agent instructions.
- `docs/STATUS.md` and `docs/brain/PROJECT_PLAN.md`.
- `llm-wiki/CLAUDE.md` and `llm-wiki/wiki/index.md`.
- `GITHUB.md`, `DESIGN.md`, and `scripts/lib/atlas-document-policy.mjs`.
- `package.json`, the lockfile, and `.github/workflows/ci.yml`.

Inspect the actual repository root, remotes, branch, HEAD, worktrees, working-tree changes, and relevant recent commits. Do not assume `origin` points to the current repository. Do not overwrite, reset, stash, or commit someone else's uncommitted work without understanding and preserving it. Create an isolated working branch/worktree where practical; do not force-push or rewrite shared history.

Run the existing local knowledge verification and query commands. Use the repository's pinned tools and an appropriate shell. On Windows, respect the documented PowerShell/pnpm setup instead of assuming Git Bash behaves identically.

Resolve authority conflicts before implementation. In particular:
- The old root README, retired status packets, and voxel-era roadmaps are not current product requirements.
- The WebMCP challenge snapshot is a separate surface. Do not merge it wholesale, alter the frozen candidate, or restart challenge development to finish this app.
- An old challenge checklist is not automatically a blocker for this release. Reconcile the existing project plan with this assignment while preserving historical decisions.
- Executable contracts own tool names, counts, schemas, and derived facts. Link to or generate those facts; do not maintain parallel hand-written copies.
- Commands provide implementation evidence, not permission to violate hard stops. A stale verifier must be corrected with justification, not appeased by restoring a retired product.

Keep `docs/STATUS.md` as the only mutable status document, within its existing line cap. Use the existing plan for priorities. Do not create a competing roadmap, agent constitution, memory framework, or status dashboard.

## 2. Freeze the release scope

Finish a map-first, read-only US Census atlas that works in ChatGPT and whose preview accurately exercises the same product code.

The complete core journey is: request a supported place; resolve it correctly or present a structured refusal/candidate choice; render the correct geographic plate and supported facts; explore with the existing human controls; accept another tool result without losing correctness or human control; recover from a failed request.

Retain the public server tool surface governed by `scripts/lib/atlas-tool-surface.mjs`. Do not add tools to solve implementation bugs. Keep any browser-local WebMCP contracts separate from the server surface, and do not introduce the challenge layer into this release.

Do not add accounts, public notes, persistent user saves, billing, commerce, lead generation, Scout/Clawd/campaign features, Google Maps/Places, third-party geodata providers, voxel rendering, satellite imagery, ML training, or generic gamification. Existing Atlas-owned asset delivery is not permission to add external geographic providers.

Finish supported behavior, not every historical TODO. Every proposed change must either close an acceptance failure, meet an existing product requirement, remove a release/security risk, or improve a measured bottleneck. Defer the rest without growing the release.

## 3. Establish a fresh baseline, then implement

Read the relevant source—not just summaries. Trace a request through:
`server/src/atlasTools.ts`, the Census index and gazetteer, `server/src/atlasPlates.ts`, server resource/HTTP registration, widget delivery, `web/src/atlas/useToolPlate.ts`, `AtlasApp.tsx`, `AtlasPlate.tsx`, and the geometry layer.

Inspect build/startup scripts before executing anything with deployment, migration, worker, or external side effects. Audit aggregate ship scripts for retired checks before trusting them.

Run the applicable baseline from the current checkout, using scripts as actually defined:
- Frozen-lockfile install; typecheck; build; core tests.
- Location Truth, tool-surface drift, document-registry, and public-HTTP gates.
- The production dependency audit already required by CI.
- Live MCP/submission/public-HTTP checks against an explicitly started local server, using each verifier's actual configuration contract.

Separate existing failures, environment blockers, stale checks, and new regressions. A skipped or unavailable check is not a pass. A historical successful deployment is not evidence for this checkout.

Record a short prioritized blocker list in the existing status/plan, with reproduction, affected journey, acceptance test, and owner. Then immediately implement the highest-priority reproducible blocker. Do not end the first pass with an audit alone when safe implementation is possible.

## 4. First investigations: confirm these source-level concerns

Re-read these files before changing them; they may have changed since this prompt was written.

A. `web/src/atlas/AtlasApp.tsx`: the reviewed version renders a diagnostic sidebar unconditionally and replaces the map during loading/errors. Reconcile this with `DESIGN.md`: production diagnostics must be off by default, and the last good map must remain visible during subsequent requests. First load needs a useful intentional loading state; later failures need a real retry and preserved context. Never retain an old map while labelling it as a newly opened place.

B. `web/src/atlas/useToolPlate.ts`: investigate whether structured `ambiguous`/`unresolved` results can be interpreted as successful national-plate references because the adapter reads `level` without discriminating on result status. Write a failing regression test before claiming this is a confirmed runtime defect. Refusal must not masquerade as successful navigation or silently reset the map. Stale metadata from an earlier successful result must not override a newer refusal.

C. `server/src/atlasTools.ts`: verify bare state names, explicit geographic levels, titles, and returned plate references. Test that state requests do not become county views and an explicit nation request is not silently ignored. The model-readable answer, structured result, and rendered geography must agree.

D. Host delivery: reproduce the complete current widget path, rather than treating old CSP/MIME/template workarounds as permanent truths. Confirm the actual rendered bundle is the one being tested.

E. Documentation: reconcile the old working-tree/release descriptions with current Git history. Rewrite the stale public README around the current product without copying stale coverage counts or claiming an unverified deployment.

Prioritize functional truth and widget rendering before cosmetic work or broad dead-code cleanup.

## 5. Close the product and integration gaps

### Geographic and data correctness

Preserve the zero-confidently-wrong-answer Location Truth gate. Do not make it green by weakening expectations, shrinking the sample, or refusing every valid request. Retain positive coverage tests alongside refusal tests.

Test supported counties/cities, bare states, explicit levels, casing, punctuation, accents, near matches, duplicate names, unknown names, and explicitly out-of-country requests. Build expected identities from independently checked Census fixtures, not by calling the same resolver under test.

Validate identifiers and geographic coordinates before use; preserve the missing-coordinate regression. Test missing/malformed plates and representative difficult geometry within claimed coverage. Keep data vintage, units, and coverage honest. Do not invent roads, addresses, populations, or details absent from the actual data.

### ChatGPT integration

Use current official OpenAI documentation for MCP resources, UI metadata, host lifecycle, CSP, testing, and submission. In Codex, use the installed build-chatgpt-app skill and official documentation tools when available. Do not scaffold a replacement application.

Official entry points; follow redirects and verify compatibility with installed versions:
- https://developers.openai.com/apps-sdk/build/mcp-server
- https://developers.openai.com/apps-sdk/build/chatgpt-ui
- https://developers.openai.com/apps-sdk/deploy/testing
- https://developers.openai.com/apps-sdk/deploy/submission

Check resource registration, template references, content types, bundled asset loading, exact origin allowlists, API-base injection, supported result delivery, and resource-cache refresh/versioning together. Preserve justified compatibility; do not broaden CSP to hide a bug or perform a speculative SDK migration.

Test initial hydration, delayed host data, follow-up tool results, repeated calls, absent host APIs in preview, and supported iframe sizes. Keep bulk geometry out of model-facing payloads. Validate incoming data at the boundary rather than relying solely on TypeScript casts.

Separate correct tool output, correct widget rendering, and correct tool selection. Include realistic positive prompts, follow-ups, and unsupported requests.

### Interaction reliability

Use explicit states for ready, loading, ambiguous, unresolved, retryable error, and focus. Keep the displayed plate, requested destination, pending/error state, and model result consistent.

Test rapid A→B navigation, deliberately reordered responses, unmount/remount, retry after failure, and another focus request in the same county. Ignore or cancel stale work and clean up listeners. Never let an old response overwrite a newer selection or a refusal.

Preserve current human navigation and breadcrumbs. Agent actions should be legible without taking away pointer, touch, or keyboard control. Share existing business logic rather than creating a second hidden map implementation.

### Product quality

Implement the existing analog-field-atlas direction in `DESIGN.md`, not another visual concept. The map remains dominant. No dashboard shell, hero page, feature grid, decorative map pins, or oversized panels.

Prove desktop and 390×844 phone behavior, including loading, ambiguity, failure, focus, reduced viewport, and reduced motion. Verify readable labels, usable touch targets, keyboard navigation, focus return, meaningful accessible names, and restrained announcements.

Treat concept art as composition reference, never source geography or a substitute for screenshots of the product. Keep raw host globals, internal URLs, and stack traces out of normal UI.

## 6. Use a small, accountable agent team

You remain the integrator. Delegate only bounded, independent work. Use up to three specialists when the environment actually supports them:
- Data/MCP correctness.
- Widget/UI reliability and accessibility.
- Independent QA, security, and release verification.

Give each assignment exact scope, allowed files, forbidden changes, expected tests, and a deliverable. Use isolated worktrees or explicit file ownership. Only the integrator edits shared status/plan files and resolves shared configuration/lockfile changes.

Review each patch and rerun relevant checks after integration. Prefer an independent final reviewer who did not implement the change. No recursive agent spawning, duplicate full-repository audits, invented approvals, or claims that unavailable agents ran.

Without subagents, perform the same roles sequentially. The process must still work.

## 7. Work in verified slices

For every slice:
1. Reproduce and state a falsifiable cause.
2. Add or strengthen a regression test when practical.
3. Make the smallest maintainable fix.
4. Run focused checks and inspect actual behavior.
5. Obtain independent review where available.
6. Record evidence and make a reviewable commit containing only intended work.

After unsuccessful attempts, revisit the hypothesis and isolate the failing layer; do not cycle through arbitrary bridge/CSP changes. Do not silence errors, loosen types, delete meaningful tests, or add fallback success responses to manufacture green results.

Use the repository's approved browser tooling. Follow its gstack `/browse` instructions when available; do not use explicitly prohibited browser integrations. Missing optional tooling must not block unrelated work. Local browser automation is useful but must be labelled separately from real ChatGPT-host testing.

Keep updates short: fixed, verified, blocked, next. Do not ask the owner to choose routine implementation details. Reserve requests for genuine permission, credentials, spending, irreversible changes, or an unresolved product conflict.

When context is running low, checkpoint in the existing status document: completed slice, evidence references, unfinished change, exact next command, and external blockers. The next session resumes there; it does not restart discovery.

## 8. Security, cleanup, and reproducibility

After the core journey works, remove proven unreachable retired code and unused runtime dependencies in bounded patches. Trace references and startup behavior first. Do not delete historical provenance or break a current path merely because a dependency looks old.

Verify retired endpoints remain unavailable as the current contract requires. Inspect startup for retired services or migrations. Check input limits, file/path handling, error disclosure, diagnostic endpoints, and actual logging behavior. Keep privacy statements consistent with what is collected and retained.

Scan the intended public diff, tracked files, and available history for secrets without printing secret values. Report necessary revocations through the appropriate secure human process. Removing a variable or file is not evidence of credential revocation. Do not upload private material to external scanners.

A clean checkout must build without local-only generated files, a personal database, or credentials for retired services. Census/asset packaging and any existing object-storage dependency must be documented and reproducible. Do not commit huge generated national datasets or create new paid infrastructure to make the build pass.

Measure representative cold/warm map loading, errors, bundle size, and server memory using a stated environment. Enforce existing applicable budgets; propose modest justified budgets where absent. Report measurements, not invented performance scores. Do not load-test production without permission.

## 9. Make release readiness observable

Use these acceptance gates as a finite checklist, not a new framework:

G1 — Reproducible build: frozen install, typechecks, build, and applicable CI gates succeed from a clean checkout.

G2 — Geographic truth: existing Location Truth and positive/negative contract tests pass without weakened acceptance rules.

G3 — Complete local product: actual MCP calls drive the correct widget through the core journeys, refusal states, navigation, and error recovery.

G4 — Visual/accessibility proof: inspected desktop and phone screenshots plus interaction tests demonstrate the existing design requirements; production diagnostics are disabled.

G5 — Actual host proof: a refreshed connection and fresh ChatGPT conversation render and operate the intended widget, including a follow-up and a refusal. A preview, screenshot fixture, or successful HTTP response cannot substitute for this gate.

G6 — Release hygiene: public README, setup instructions, policy pages, dependency/security findings, submission record, and current status match the implemented product.

G7 — Deployment traceability: an authorized deployment can be tied to the tested clean revision/build artifact, with smoke checks and a known rollback target.

For each gate report PASS, FAIL, or BLOCKED, with command/exit code or manual procedure and evidence. Record the tested revision and environment in generated evidence rather than copying changing identifiers into multiple prose files. Store new evidence using the repository's document-policy classification; retired artifacts do not become current authority simply because they exist.

Do not claim full completion with a failed or untested required gate. Do not claim universal correctness or zero bugs from a passing suite.

## 10. Finish the handoff and respect release permissions

Rewrite the README with the real product, actual screenshots, reproducible setup, supported behavior, limitations, data attribution, and links to canonical architecture/contracts. Include a concise explanation of key engineering decisions that the owner can study and defend. Do not describe this release as a trained ML system.

Update the existing submission artifact against current official requirements and observed behavior. Prepare genuine positive/negative reviewer cases and a short demo of a successful flow, ambiguity, and recovery. Preserve existing licensing and attribution; flag unresolved ownership/licensing decisions rather than inventing permission.

Keep code changes, local verification, preview deployment, production deployment, portal verification, submission, and external approval distinct.

This assignment authorizes implementation and local verification. Use an existing preview target only where workspace permission explicitly permits it. Production deployment, public release/tagging, secret rotation, paid resources, and portal submission require the applicable owner authorization. Prepare everything possible without them.

The repository records a portal challenge-token step. Verify whether it is still required, test configured/unconfigured route behavior safely, and provide the exact smallest owner action. Never invent a token, expose it in reports, or call the portal gate complete without evidence. An external gate must not prevent completion of independent engineering work.

After document/executable-authority changes, rebuild and verify the existing registry and commit generated updates with their sources. Run the wiki's existing checks when relevant. Do not spend the release rebuilding the knowledge system.

Your final report must contain:
- What the user can now do, and what changed.
- Required gates with evidence and honest status.
- Remaining defects and explicit external blockers.
- Reviewed revision/PR or local change references, with deployment status separate.
- The smallest next owner action, only when actually needed.

Start now: establish the current baseline, identify the first reproducible core-journey failure, add its regression test, and fix it. Continue through verified slices. A plan is the beginning of this assignment, not its deliverable.
