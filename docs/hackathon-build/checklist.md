# Build Checklist

## Build Preferences

- **Plan ownership:** Codex owns sequencing and execution details; the participant reviews only true gates or blockers.
- **Build mode:** Autonomous speed run. This locks when `$build-project` begins.
- **Comprehension checks:** N/A for autonomous mode; explain consequential choices in the evidence ledger.
- **Git:** Preserve unrelated untracked work. Commit each coherent green implementation/documentation slice as a revert point. Never commit a knowingly failing state.
- **Verification:** Yes at every task boundary; no elective look-at-it pauses. Use focused checks first, then the proportional release gate.
- **Check-in cadence:** Speed-run. Send concise progress during long work and stop only for a material failure, missing credential that blocks its lane, or explicit owner gate.
- **Public actions:** Repository visibility, deployment changes, video publication, and Devpost submission require separate owner approval packets.
- **Tool cut:** Exactly five top-level WebMCP tools. No sixth tool, remote mutation service, iframe registration, persistence, routing expansion, or historical branch merge.
- **Wow moment:** ChatGPT creates a visible three-place national trail; the person selects or edits it; ChatGPT's next state read reflects that human change on the same map.
- **Timebox:** Eleven items, each targeted at 15–30 minutes. If an item exceeds its timebox, record the failed assumption, reduce scope, and preserve the last green commit.

## Checklist

- [x] **1. Freeze the working baseline and evidence inventory — 15 minutes**
  Spec ref: `spec.md > Build Checklist Handoff`
  What to build: Reconfirm `webmcp-challenge`, inspect the dirty tree without touching unrelated files, read the authority/state documents, verify the current live URL and recorded candidate SHA, inventory existing desktop/mobile/ChatGPT/model/release evidence, and mark every later item as required, already satisfied by current proof, optional, or externally gated. Do not rerun expensive gates before this inventory identifies what is stale.
  Acceptance: The exact-five candidate, current source commit, live candidate, preserved untracked files, missing proof, and owner gates are recorded in `WEBMCP_STATE.md`; no historical branch or unrelated system enters scope.
  Verify: `git status --short --branch`; `git log -5 --oneline`; read `WEBMCP_STATE.md`, `docs/webmcp/RELEASE_PACKET.md`, and current evidence manifests; check `https://atlas-webmcp-production.up.railway.app/ready` and `/explore` only with the existing non-mutating preflight.

- [x] **2. Run the fresh judge-path design and interaction audit — 25 minutes**
  Spec ref: `spec.md > Remaining Implementation Boundary > Current-state design audit`
  What to build: Launch the current committed source candidate and inspect first entry, county open, Springfield ambiguity, note creation/editing, three-stop trail, marker/rail handoff, dark theme, keyboard focus, reduced motion, and exact 390x844 mobile. Compare current screenshots against the PRD's map-first, field-atlas, plain-language, and touch-target criteria. Rank only observable P0/P1/P2 issues and choose zero or one implementation slice.
  Acceptance: The map remains the dominant object; the shared handoff is understandable without developer narration; no actionable issue is invented to justify decoration; any selected slice has one user-visible outcome, exact files, focused tests, and a rollback boundary.
  Verify: Run the existing local browser capture/QA path and visually inspect saved current-run PNGs; record viewport dimensions, overflow, map area, target sizes, focus, and reduced-motion results in the product-design audit and `WEBMCP_STATE.md`.

- [x] **3. Implement at most one winner-polish slice — 30 minutes**
  Spec ref: `spec.md > Remaining Implementation Boundary > One coherent visual/interaction slice`
  What to build: Only if item 2 identifies a real P1/P2 issue, make the smallest cohesive change in `AtlasApp.tsx`, `AtlasPlaceFinder.tsx`, `AtlasPlate.tsx`, and/or `atlas.css`. Preserve the warm paper-and-ink identity, map area, immediate base route/markers, 44px mobile controls, keyboard semantics, reduced-motion equivalence, and the shared controller. Add focused regression coverage. If the audit is clean, explicitly record “no product mutation selected” and move on.
  Acceptance: The chosen issue is visibly improved in the exact before/after state; exact-five descriptors and public schemas are unchanged; normal-browser use, active-state comprehension, and mobile map area do not regress; no permanent coaching, generic card, glow, or decorative panel is added.
  Verify: Run the narrowest affected test file first, then `pnpm verify:webmcp`; recapture the same desktop and 390x844 state; run `git diff --check`; perform a self-review for stale state, partial mutation, accessibility, and scope leakage; commit only when green.

- [x] **4. Close deterministic source and browser gates — 30 minutes**
  Spec ref: `spec.md > Risks And Verification > Required Verification Commands`
  What to build: From the committed source candidate, run the frozen contract/type/build/browser sequence and preserve machine-readable output. Treat any pre-existing failure separately from a regression; never bypass or weaken a guard to turn it green.
  Acceptance: Focused WebMCP verification passes completely; typecheck and build pass; Chrome discovers exactly five tools; official smoke and deeper executions pass; visible open/note/trail completion, ambiguous and failed mutation safety, refresh lifecycle, normal-browser fallback, 390x844 targets/map area, keyboard, and reduced motion are green.
  Verify: `pnpm verify:webmcp`; `pnpm typecheck`; `pnpm build`; `pnpm eval:webmcp:smoke`; `git diff --check`; inspect the smoke JSON and screenshots rather than trusting exit codes alone.

- [x] **5. Capture the current visual proof set — 20 minutes**
  Spec ref: `spec.md > Architecture > Verification, Sanitized Release, And Submission Evidence`
  What to build: Save one coherent current-run evidence set from the same source commit: quiet national entry, three-stop WebMCP trail, human-selected active stop, Springfield ambiguity with unchanged state, visible session note, 390x844 mobile trail, keyboard focus, reduced-motion trail, and normal-browser fallback. Use stable filenames and an evidence manifest that names commit, browser/version, viewport, route, and action.
  Acceptance: Each screenshot proves one claim, all screenshots match the same candidate, the national trail is the visual centerpiece, no private data or development chrome is visible, and the set contains enough evidence for README, video, and Devpost without contradictory older captures.
  Verify: Open every image at full size; confirm PNG signatures and dimensions; cross-check filenames and claims against the browser smoke JSON and `docs/webmcp/RELEASE_PRODUCT_DESIGN_AUDIT.md`.
  Status: Complete in `artifacts/webmcp-release-proof/39d1e141-20260902/`. Eight live-candidate PNGs, a sanitized Chrome report, and a SHA/dimension/action manifest pass the integrity check. The harness now saves a dedicated reduced-motion trail frame.

- [x] **6. Complete real ChatGPT shared-control acceptance — 30 minutes plus user sign-in if needed**
  Spec ref: `spec.md > Architecture > Verification, Sanitized Release, And Submission Evidence`
  What to build: Use the existing ignored `e2e:chatgpt:session` runbook in an authenticated user-controlled ChatGPT desktop session. Capture top-level discovery of exactly five tools, one real call per tool, visible three-stop trail completion, human marker/rail selection followed by `get_map_state`, a ChatGPT-created note followed by human edit/read-back, Springfield ambiguity with an independent unchanged-state read, and unresolved-trail atomicity with an independent state read. Do not access or export browser credentials.
  Acceptance: Every transcript step has a unique real call ID, observed timestamp, bounded arguments/results, corresponding visible evidence, and the expected shared-state or no-mutation outcome; the validator reports a captured real ChatGPT session rather than sample data.
  Verify: `pnpm e2e:chatgpt:session`; complete the generated runbook in ChatGPT; set `ATLAS_CHATGPT_TRANSCRIPT` to the captured transcript; run `pnpm e2e:chatgpt:transcript` and `pnpm e2e:chatgpt`. If sign-in is unavailable, mark only this lane blocked and continue independent items.
  Status: `BLOCKED_PENDING_AUTHENTICATED_CHATGPT_SESSION`. A new isolated runbook exists at `.evals/chatgpt-e2e/sessions/2026-09-03T04-13-21-091Z/`; this Codex task exposes retired Atlas plugins but not the deployed page's exact-five Site Tools. The untouched template was deliberately validated and rejected with `A release transcript must have status captured.` No acceptance claim was made.

- [x] **7. Run the three-run model trajectory gate if credentials exist — 20 minutes**
  Spec ref: `spec.md > AI Usage > Development And Evaluation`
  What to build: Generate evaluator tools from the live descriptors, confirm no schema drift, and run three trajectories per case against exact `xai:grok-4.6` only when `XAI_API_KEY` is already available. Cover every direct tool, search-before-open for ambiguous Springfield, read/search/open chains, note-versus-trail discrimination, ordered three-stop trail arguments, non-mutating prompts, and mid-chain failure. Never print or persist the credential.
  Acceptance: At least 90% correct tool/argument trajectories across three runs per case, with zero critical wrong-write, partial-mutation, or false-success failures. If the credential is absent, the report says “not run — credential unavailable”; deterministic proof remains separate and unchanged.
  Verify: `pnpm eval:webmcp:prepare`; `pnpm eval:webmcp:grok`; inspect the generated report's run count, threshold, critical-failure count, model identifier, and redaction behavior.
  Status: `not run — credential unavailable`. `pnpm eval:webmcp:prepare` wrote exactly five live descriptors with SHA-256 prefix `06318ac7ae0611d9`; `XAI_API_KEY_PRESENT=False`, so no remote request or model-score claim was made.

- [ ] **8. Assemble and prove one sanitized release candidate — 30 minutes**
  Spec ref: `spec.md > Architecture > Verification, Sanitized Release, And Submission Evidence`
  What to build: Assemble the challenge allowlist into a brand-new absolute sibling directory, review the generated diff, initialize/commit the sanitized repository if needed, and prove it from a separate `git clone --no-local`. Run tracked-path, secret, oversized-file, generated-artifact, license/attribution, challenge-scope, and full-history checks. Do not publish or overwrite the existing release directory.
  Acceptance: The sanitized tree contains only the exact-five runtime, required Census data/plates, tests/evals, Apache-2.0 license, attribution, deployment files, challenge docs, and assets; its frozen clean clone is green; one immutable candidate SHA and rollback source are recorded.
  Verify: `node scripts/assemble-webmcp-release.mjs --target <new-absolute-empty-directory>`; in the candidate and no-local clone run `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm build`, `pnpm verify:webmcp`, `pnpm eval:webmcp:smoke`, `pnpm audit:release`, `git diff --check`, and `git status --short --branch`; repeat the approved Gitleaks full-history scan.

- [ ] **9. Produce the under-three-minute narrated demo — 30 minutes**
  Spec ref: `spec.md > Demo And Submission Flow`
  What to build: Record short clips from the immutable candidate and edit them into the approved story: national trail immediately; human selects a stop; ChatGPT reads it; Springfield ambiguity; place note plus human edit; failed trail stays atomic; exact-five/fallback; audience, challenge delta, source, and live URL. Use the national trail as opening frame and thumbnail. Higgsfield may be used only if the previously defined one-shot study directly improves a transition or thumbnail and passes the map-truth review.
  Acceptance: Final runtime is under 3:00, includes clear narration/audio, contains no setup typing or dead air, shows the actual working product, identifies session-only behavior, and makes no routing, persistence, or generated-geography claim. Every visible product clip matches the release SHA.
  Verify: Watch the exported video from start to finish with sound; check duration, captions/title cards, legibility at normal playback, URL/source consistency, and the shot list in `docs/webmcp/VIDEO_SCRIPT.md`; have the participant approve before publication.

- [ ] **10. Reconcile the judge-facing release packet — 25 minutes**
  Spec ref: `spec.md > Demo And Submission Flow`
  What to build: Update the sanitized README, `CHALLENGE_DELTA.md`, verification guide, submission draft, release packet, AI-usage disclosure, limitations, screenshots, demo recipe, video link placeholder, public source placeholder, live URL, tested clients, license, and exact SHA so they tell one precise story. Separate pre-existing Atlas capability from challenge-period work and separate automated proof from real ChatGPT/model evidence.
  Acceptance: No placeholder is silently presented as complete; exact-five tool names/side effects are accurate; retired Atlas surfaces are absent; the audience and shared-canvas thesis lead; every claim links to reproducible evidence; all external actions remain visibly owner-gated.
  Verify: Run the documentation verifier and release audit; search for `TODO`, `TBD`, `[OWNER REQUIRED]`, stale SHAs/URLs, retired-scope names, and unsupported superlatives; compare README, video narration, screenshots, and Devpost draft line by line.

- [ ] **11. Prepare the Devpost handoff — 20 minutes**
  Spec ref: `prd.md > Submission Proof Points`
  What to build: Gather the final project story, public-repository gate packet, deployment gate packet if needed, video-publication packet, screenshots, exact tool list, demo instructions, tested-browser/ChatGPT evidence, Apache-2.0 attribution, AI-tool disclosure, limitations, challenge-period delta, immutable candidate SHA, rollback plan, and the learning documents required for submission preparation. Do not submit in this item.
  Acceptance: The participant has one consistent, evidence-backed packet sufficient to run `$prepare-submission`; unresolved external fields are named rather than guessed; repository publication, any deployment, video publication, and Devpost submission each retain a narrow explicit approval step.
  Verify: Review the handoff against the live official Devpost requirements during `$prepare-submission`; confirm the local next command is `$prepare-submission`; confirm nothing has been sent to Devpost.
