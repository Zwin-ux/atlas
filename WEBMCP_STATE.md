# Atlas WebMCP Challenge State

## Identity

- Branch: `webmcp-challenge`
- Baseline branch: `main`
- Baseline SHA: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`
- Last green content commit: `08a5b84a7d58e6f4e77b8ce4b39e552cb7b14700`
- Deadline: September 3, 2026 at 1:00 PM Pacific

## Current Slice

- Slice: `15 — Product-design pass for human-agent session legibility`
- Status: `GREEN — OWNER GATE`
- Player-visible promise: `A judge can tell that the map is ready, recognize the active research stop, and edit the shared session comfortably without the trail rail or fallback state feeling like test UI.`
- Smallest complete boundary: `Refine readiness language, research-trail hierarchy, active-stop semantics, edit target sizes, and mobile information priority while preserving the full-screen map, exact-five tools, shared controller, and existing renderer.`
- Likely files: `web/src/atlas/AtlasApp.tsx`, `web/src/atlas/AtlasPlaceFinder.tsx`, `web/src/atlas/atlas.css`, focused verifier/docs, current audit artifacts, and the sanitized release projection.`
- Acceptance checks: `Current-run desktop/mobile audit evidence; calm normal-browser fallback; explicit session-only trail metadata and non-color active-stop label; at least 32px desktop and 44px mobile trail edit targets; no 390x844 overflow; exact-five verifier, typecheck, build, normal-browser flow, Chrome WebMCP smoke, review, clean-clone release proof.`
- Anti-scope: `No sixth tool, renderer rewrite, new dashboard/panel system, auth, persistence, public posting, marketing page, deployment, publication, or Devpost action.`

## Acceptance Checks

- [x] Exactly five descriptors register from top-level `/` and `/explore` only.
- [x] Registration is all-or-none and one shared abort signal removes partial success.
- [x] Normal browsers keep full manual map behavior with an honest unavailable status.
- [x] Activity rail shows availability, sequence, timestamp, tool, state, and concise effect.
- [x] `add_map_note` resolves first, enforces 240 characters, renders text safely, and waits for visibility.
- [x] `create_map_trail` resolves all 2–5 stops before one mutation and shows the completed numbered trail on the national map.
- [x] Ambiguous or canceled trail resolution leaves the complete prior snapshot unchanged.
- [x] Humans can edit/remove note text, trail title, prompts, and stops without delete tools.
- [x] All tool outputs stay below 1,500 serialized characters in maximum-text tests.
- [x] `pnpm verify:webmcp`, full typecheck, and full build pass.
- [x] Keyboard/touch users can open resolved places or choose an ambiguity candidate through the shared controller.
- [x] A newer or canceled transition cannot inherit a later visible success.
- [x] The place finder has a persistent visible label, specific error recovery, and native keyboard controls.
- [x] The 390x844 view has no horizontal overflow or undersized visible form/button controls.
- [x] Root README describes only the focused WebMCP candidate and its honest evidence boundary.
- [x] Submission copy, an under-three-minute video script, and an owner-gated release packet exist.
- [x] Documentation verification enforces the exact five tools, owner placeholders, time budget, and retired-scope exclusion.
- [x] Normal-browser fallback begins with a calm `Map ready` state while disclosing whether site tools were detected.
- [x] The research rail exposes stop count and session-only scope, echoes map marker numbers, and labels the active stop with text plus `aria-current="step"`.
- [x] Trail title, place, prompt, and remove controls measure at least 32px on desktop and 44px on mobile.
- [x] Current-run light, dark, keyboard-focus, ambiguity, and `390x844` evidence is captured in the product-design audit.

## Work Log

### Files changed

- `server/src/index.ts` — serves the existing Atlas map bundle at top-level `/` and `/explore` with WebMCP-compatible origin headers.
- `web/src/atlas/atlas.css` — gives the judge route a full-viewport, mobile-safe map canvas without changing the map renderer.
- `scripts/verify-preview-http.mjs` — verifies `/`, `/explore`, and `/preview`, including challenge anti-scope and response headers.
- `WEBMCP_STATE.md` — records orientation, evidence, and Slice 1 status.
- `CHALLENGE_DELTA.md` — initializes the honest pre-existing/challenge-period capability ledger.
- `artifacts/webmcp-proof/slice-1-desktop.png` — desktop no-login route proof.
- `artifacts/webmcp-proof/slice-1-mobile-390x844.png` — 390x844 no-login route proof.
- `web/src/atlas/AtlasMapController.ts` — owns navigation, revisions, subscriptions, and visible-transition promises.
- `web/src/atlas/AtlasApp.tsx` — renders controller state, aborts superseded plate requests, and acknowledges ready revisions.
- `web/src/main.tsx` — fences the legacy Apps SDK subscription away from `/` and `/explore`.
- `web/test/atlas-map-controller.test.ts` — covers visible acknowledgment, breadcrumbs, failures, supersession, and invalid depth.
- `package.json` — adds the focused controller test command.
- `server/src/atlasPlaceSearch.ts` — exposes a bounded public projection of Census-backed place results.
- `server/src/index.ts` — adds same-origin `/api/atlas/search` and `/api/atlas/resolve` routes.
- `server/test/atlas-place-search.test.ts` — covers bounded search, ambiguity, unknown places, and query validation.
- `web/src/atlas/webmcpTools.ts` — defines the first three imperative WebMCP descriptors without registering a partial set.
- `web/src/atlas/AtlasMapController.ts` — adds validated search/open operations and visible selected-place state.
- `web/src/atlas/AtlasApp.tsx` and `web/src/atlas/atlas.css` — render a restrained selected-place HUD.
- `web/test/webmcp-tools.test.ts` — verifies names, annotations, schemas, state reads, signal propagation, and invalid inputs.
- `web/test/atlas-map-controller.test.ts` — adds resolved, ambiguous, and malformed-payload mutation tests.
- `package.json` and `pnpm-lock.yaml` — pin `webmcp-types@0.1.5` and add focused commands.
- `web/src/atlas/webmcpRegistry.ts` — feature-detects and registers the exact five top-level tools with rollback.
- `web/src/atlas/webmcpTools.ts` — completes note and atomic-trail descriptors, execution activity, and bounded outputs.
- `web/src/atlas/AtlasMapController.ts` — adds session notes, atomic trails, human edits/removals, activity, and cancellation-safe transitions.
- `web/src/atlas/AtlasApp.tsx` and `web/src/atlas/atlas.css` — add the restrained activity and editable research rails with mobile touch targets.
- `web/src/main.tsx` — mounts one challenge controller and registry while preserving the legacy preview fence.
- `web/test/webmcp-registry.test.ts` — proves exact-five lifecycle and partial-registration rollback.
- `scripts/verify-webmcp.mjs` — verifies the exact cut, schema guards, registration path, route fence, and origin headers.
- `artifacts/webmcp-proof/five-tool-fallback-mobile.png` and `five-tool-fallback-desktop.png` — normal-browser fallback proof.
- `web/src/atlas/AtlasPlaceFinder.tsx` — adds one restrained keyboard/touch place finder with ambiguity-safe recovery.
- `web/src/atlas/AtlasMapController.ts` — routes candidate selection through the shared controller and rejects canceled or superseded visible claims.
- `web/src/atlas/atlas.css` — adds map-first desktop/mobile finder layout, persistent labels, focus treatment, and 44px mobile targets.
- `web/test/atlas-map-controller.test.ts` — covers candidate opening, cancellation, and successful/failed supersession.
- `artifacts/webmcp-proof/judge-path-ambiguous-desktop.png` and `judge-path-ambiguous-mobile-390x844.png` — responsive ambiguity and fallback proof.
- `README.md` — replaces the retired product story with the no-login shared county-canvas candidate, exact tools, run/verify commands, and explicit gates.
- `docs/webmcp/SUBMISSION.md` — provides challenge-period copy, evidence mapping, and owner placeholders without unverified claims.
- `docs/webmcp/VIDEO_SCRIPT.md` — provides a 2:45 real-browser demo script with an explicit no-simulation rule.
- `docs/webmcp/RELEASE_PACKET.md` — records the publication-safety audit, sanitized-repository boundary, owner gates, evidence, and rollback.
- `scripts/verify-webmcp-docs.mjs` — guards the exact tool story, required placeholders, video budget, links, and challenge anti-scope.
- `artifacts/webmcp-proof/judge-path-final-desktop.png` and `judge-path-final-mobile-390x844.png` — final masthead/44px design proof.
- `web/src/atlas/plateGeometry.ts` — projects internal county-center coordinates from existing nation geometry without exposing them through WebMCP.
- `web/src/atlas/AtlasPlate.tsx` — renders the national trail route and numbered, keyboard-operable stop markers above the map.
- `web/src/atlas/AtlasMapController.ts` and `web/src/atlas/AtlasApp.tsx` — commit complete trails atomically to the nation overview, wait for visible overlay completion, and share one marker/rail stop-opening path.
- `web/src/atlas/atlas.css` — adds restrained trail tokens, non-color active state, focus treatment, reduced-motion behavior, and mobile information-priority rules.
- `web/test/plate-geometry.test.ts`, controller tests, tool tests, and `scripts/verify-webmcp.mjs` — verify projected centers, nation-first creation, synchronized stop editing, internal-coordinate boundaries, and updated tool guidance.
- `artifacts/webmcp-proof/trail-overview-desktop.png` and `trail-overview-mobile-390x844.png` — national overlay proof at desktop and 390x844.
- `web/src/atlas/webmcpEvalSchema.ts` and `scripts/write-webmcp-eval-tools.ts` — derive the static evaluation schema from the five runtime descriptors and write it only to ignored `.evals/` output.
- `evals/atlas-webmcp.evals.json` — covers direct selection, Springfield ambiguity, state/search/open chains, note-versus-trail choice, ordered civic trails, no-tool requests, and failure-followed-by-state-read behavior.
- `evals/atlas-webmcp.smoke.json`, `scripts/run-webmcp-evals.mjs`, and `scripts/verify-webmcp-browser-smoke.mjs` — provide official static/browser/smoke commands, enforce the three-run/90% floor, start a built local route, and assert visible/atomic state through Chrome WebMCP.
- `web/src/atlas/webmcpTools.ts` — accepts Chrome's one-argument imperative invocation while retaining optional execution cancellation when a client supplies context.
- `package.json`, `pnpm-lock.yaml`, and `pnpm-workspace.yaml` — pin `webmcp-evals@0.0.4` and explicitly deny its two unneeded transitive build scripts while retaining the existing esbuild approval.
- `web/test/webmcp-eval-schema.test.ts`, `web/test/webmcp-tools.test.ts`, and `scripts/verify-webmcp.mjs` — prevent descriptor drift, callback regression, tool-cut widening, and release-threshold weakening.
- `docs/webmcp/EVALS.md`, README/submission/release copy, and `CHALLENGE_DELTA.md` — document deterministic proof, credential/model requirements, thresholds, and the unclaimed model-score boundary.
- `artifacts/webmcp-proof/webmcp-browser-smoke.json` — bounded Chrome 152 exact-five tool transcript with successful and mutation-safe journeys.
- `scripts/assemble-webmcp-release.mjs` and `release/webmcp/` — assemble the challenge-only repository from an explicit allowlist with a standalone server/client, exact-five tools, tests, data, Apache-2.0 license, attribution, audit, and deployment contract.
- `docs/webmcp/RELEASE_PACKET.md`, `CHALLENGE_DELTA.md`, README, and submission docs — record the exact sanitized SHA, local proof, publication boundaries, and owner-gated sequence.
- `web/src/atlas/AtlasApp.tsx`, `AtlasPlaceFinder.tsx`, `AtlasPlate.tsx`, and `atlas.css` — clarify tool readiness, research-session hierarchy, non-color current-stop semantics, target sizes, mobile density, and trail-over-map priority without adding product surface.
- `scripts/verify-webmcp.mjs` and `scripts/verify-webmcp-browser-smoke.mjs` — guard the exact research-control size rules and save the visibly completed WebMCP trail as smoke evidence.
- `docs/webmcp/PRODUCT_DESIGN_AUDIT.md` and `artifacts/product-design-audit/` — record before/after desktop, mobile, dark-mode, keyboard, ambiguity, and real-WebMCP evidence.
- `C:\Users\mzwin\Documents\Atlas-WebMCP-Release` — local sanitized Git repository; exact candidate `ad0d5ab6a1c61ec44254a67308777dcb6a2ca37c`.
- `C:\Users\mzwin\Documents\Atlas-WebMCP-Release-Clean-ad0d5ab` — clean no-local clone used for final reproduction proof.

### Commands and results

| Command | Result | Evidence |
|---|---|---|
| `git status --short --branch` | PASS | `webmcp-challenge`; baseline `HEAD`, local `main`, and `origin/main` are all `b6f2f821`. |
| `git log -5 --oneline` | PASS | Baseline head is `b6f2f821`; latest five commits recorded during orientation. |
| `git worktree list --porcelain` | PASS | Clean sibling worktree is `C:/Users/mzwin/Documents/Atlas-WebMCP`; dirty source checkout was not touched. |
| `node --version` | PASS | `v24.18.0` |
| `pnpm --version` | PASS | `11.7.0` |
| Official WebMCP and challenge browser audit | PASS | OpenAI Site Tools, Chrome Imperative API, WebMCP draft dated 2026-08-26, Devpost overview, and official rules checked 2026-08-30. |
| `pnpm install --frozen-lockfile` | PASS | 292 packages installed; lockfile unchanged. |
| `pnpm test:core` | PASS | 36 test files, 325 tests. |
| `pnpm exec tsx --test server/test/atlas-plates.test.ts` | PASS | 9 tests. |
| `pnpm typecheck` | PASS | Core, geo, server, and web TypeScript checks passed. |
| `pnpm build` | PASS | Production build completed; only pre-existing bundler and manifest-skip warnings. |
| `pnpm typecheck:starter` | PASS | Starter server and web contracts passed after route changes. |
| `pnpm build:web` | PASS | `component.js` and `component.css` rebuilt successfully. |
| Rebuilt-bundle heading check | PASS | The compiled bundle contains `Atlas shared U.S. map`; gstack `/browse` reports one level-one heading on `/explore`. |
| `ATLAS_PREVIEW_URL=http://127.0.0.1:8797/preview pnpm verify:preview:http` | PASS | `/`, `/explore`, and `/preview` returned 200; judge routes exposed the required origin headers. |
| `git diff --check` | PASS | No whitespace errors. |
| `pnpm test:atlas-controller` | PASS | 5 tests; visible acknowledgment, navigation, failure, supersession, and invalid depth. |
| `pnpm typecheck:starter` | PASS | Controller and React integration typecheck cleanly. |
| `pnpm build:web` | PASS | Controller-backed browser bundle built successfully. |
| `pnpm test:atlas-place-search` | PASS | 4 server search/resolution contract tests. |
| `pnpm test:webmcp-core` | PASS | 4 descriptor and execution tests. |
| `pnpm test:atlas-controller` | PASS | 8 tests including resolved, ambiguous, and malformed place responses. |
| Live `/api/atlas/search?query=Riverside, CA` | PASS | Returned Riverside city and county candidates without geometry. |
| Live `/api/atlas/resolve?query=Riverside, CA` | PASS | Resolved to Riverside in Riverside County, California. |
| Live `/api/atlas/resolve?query=Springfield` | PASS | Returned eight candidates; no guessed mutation. |
| Live `/api/atlas/resolve?query=Atlantis-by-the-Pacific` | PASS | Returned honest `unresolved` with no candidates. |
| `pnpm verify:webmcp` | PASS | 24 focused tests plus static exact-five and route/registration checks. |
| `pnpm typecheck` | PASS | Starter and workspace TypeScript checks passed. |
| `pnpm build` | PASS | Starter, atlas plates, and workspace production builds completed; only pre-existing Radix and two skipped-manifest warnings. |
| gstack `/browse` normal-browser fallback | PASS | `/explore` rendered at 1280x720 and 390x844 with manual zoom controls and no application errors. |
| gstack accessibility tree | PASS | One main landmark, Atlas page heading, location navigation, map image label, attribution, and named 44px map controls. |
| Shared human place-finder flow | PASS | Riverside resolved visibly; Springfield returned eight labeled candidates; choosing Greene County opened the Missouri county plate through the controller. |
| 390x844 overflow and target audit | PASS | `scrollWidth=clientWidth=390`; no visible `button` or `input` measured below 44px in either dimension. |
| `pnpm verify:webmcp` | PASS | 26 focused tests plus exact-five, shared-controller, lifecycle, route, and header checks. |
| `pnpm typecheck` | PASS | Starter and workspace TypeScript checks passed after the finder and cancellation changes. |
| `pnpm build` | PASS | Full starter, plate, and workspace production build completed with only the recorded pre-existing warnings. |
| `/design-review` | PASS | Two medium findings fixed in `3a7dbf7a` and `b90182b6`; final trunk test 6/6, zero 390px overflow/undersized controls. |
| Publication-safety inventory | PASS as audit, BLOCKED as release | 37,266 tracked files, 440.85 MiB pack, 410 Markdown files, no root license, historical local/session material; existing repo must remain private. |
| `pnpm audit:webmcp:release` | PASS as audit | Verdict `DO_NOT_PUBLISH_CURRENT_REPOSITORY`; 201 tracked historical-risk paths, no license, and explicit limited-scan coverage. |
| `pnpm verify:webmcp` with docs guard | PASS | 26 focused tests, exact-five runtime/static checks, four owner placeholders, 2:45 script budget, and no retired-scope pattern in judge story files. |
| Detached `4ba01042` `pnpm install --frozen-lockfile` | PASS | All eight workspace projects installed from the locked dependency graph. |
| Detached `4ba01042` verifier before build | EXPECTED FAIL, resolved by required order | Fresh install had not generated `packages/core/dist`; no source mutation. The documented typecheck/build gates generated workspace outputs before verification. |
| Detached `4ba01042` `pnpm typecheck` | PASS | Starter and all workspace TypeScript checks passed from the detached worktree. |
| Detached `4ba01042` `pnpm build` | PASS | Full starter, plates, and workspace build passed; only the recorded Radix and manifest-skip warnings. |
| Detached `4ba01042` `pnpm verify:webmcp` | PASS | 26/26 tests plus runtime/static and judge-copy guards passed after the required build gate. |
| Detached `4ba01042` `pnpm audit:webmcp:release` | PASS as audit | Confirmed the expected `DO_NOT_PUBLISH_CURRENT_REPOSITORY` boundary against the committed candidate. |
| `pnpm test:webmcp-geometry` | PASS | 1/1 projected-county-center contract test. |
| `pnpm test:atlas-controller` | PASS | 15/15 controller tests, including national trail creation, marker/rail shared navigation, atomic failure, and active-stop renumbering. |
| `pnpm test:webmcp-core` | PASS | 6/6 descriptor/execution tests, including the national-overlay side-effect description. |
| `pnpm verify:webmcp` | PASS | 28/28 focused tests plus exact-five, shared-controller, route, coordinate-boundary, and documentation guards. |
| `pnpm typecheck` | PASS | Starter and all workspace TypeScript contracts passed after the trail-overlay changes. |
| `pnpm build` | PASS | Full starter, Atlas plate, and workspace production builds passed; only the recorded pre-existing Radix and two manifest-skip warnings. |
| `git diff --check` | PASS | No whitespace errors. |
| `/review` | PASS | Two informational gaps were auto-fixed: stale first-stop documentation and missing active-stop renumber coverage. No unresolved critical or informational findings. |
| Official `webmcp-evals@0.0.4` documentation audit via gstack `/browse` | PASS | Verified published `local`, `browser`, and `smoke` modes, schema shape, Chrome feature flag, and no-key smoke semantics from official Chrome sources. |
| `pnpm install --frozen-lockfile` | PASS | Locked eval dependency graph installs with `@google/genai` and `protobufjs` build scripts explicitly denied; no approval policy was widened. |
| `pnpm test:webmcp-eval-schema` | PASS | 1/1 descriptor-projection drift test. |
| `pnpm verify:webmcp` | PASS | 30/30 focused tests plus exact-five, optional-context, eval coverage, threshold-floor, route, and documentation guards. |
| `pnpm typecheck` | PASS | Starter and every workspace TypeScript contract passed with the eval projection and Chrome callback fix. |
| `pnpm build` | PASS | Full starter, plate, and workspace production builds passed with only the recorded pre-existing Radix and two manifest-skip warnings. |
| `pnpm eval:webmcp:smoke` | PASS | Official Chrome WebMCP smoke passed 9/9 steps across six fresh-page cases; Atlas assertions passed 13 tool executions, visible overlay, keyboard shared state, ambiguity/atomicity, refresh/route registration, and zero console errors. |
| `ATLAS_WEBMCP_EVAL_MODEL=ollama:gemma4:e2b pnpm eval:webmcp:static` | BLOCKED, not passed | Existing GPU service failed CUDA PTX compilation; an isolated CPU-only service reached the model through `/v1` but failed startup on a 369,827,840-byte allocation. No cloud provider key is present and no model score is claimed. |
| Eval-slice `/review` | PASS | Chrome callback compatibility and threshold-floor findings plus visible-revision and Node-floor gaps were auto-fixed; no unresolved findings. |
| Product Design index audit via gstack `/browse` | PASS | Compared current-run desktop/mobile before and after states, dark mode, visible keyboard focus, ambiguity density, and real Chrome WebMCP trail output. |
| Product-design `pnpm verify:webmcp` | PASS | 30/30 focused tests plus exact-five, readiness-copy, session-context, active-state, map-priority, and target-floor guards. |
| Product-design `pnpm typecheck` and `pnpm build` | PASS | Full private TypeScript and production gates passed; only the recorded historical Radix/manifest warnings remained. |
| Product-design `pnpm eval:webmcp:smoke` | PASS | Chrome `152.0.7977.64`; exactly five tools, 9/9 official steps, 13 protocol executions, and a completed-trail screenshot. |
| Product-design `/review` | PASS | One informational proof gap was auto-fixed so target-size checks inspect the actual desktop/mobile research-control CSS blocks; zero unresolved findings. |
| Release assembler exact-match check | PASS | 3,329 expected files, 3,329 generated files, zero missing, zero extra, and zero SHA-256 mismatches. |
| Sanitized `pnpm install --frozen-lockfile` | PASS | Exact candidate `ad0d5ab`; locked standalone dependency graph installed without mutation. |
| Initial parallel clean-clone gates | FAILED, resolved | Concurrent package linking hit Windows `EPERM`/`EBUSY`; no source changed, and every gate was rerun sequentially from a fresh exact clone. |
| Sanitized `pnpm typecheck` | PASS | Standalone React and Node server TypeScript contracts passed. |
| Sanitized `pnpm build` | PASS | Standalone challenge client and server built from the clean clone. |
| Sanitized `pnpm verify:webmcp` | PASS | 30/30 focused tests plus exact-five runtime and challenge-document guards. |
| Sanitized `pnpm eval:webmcp:smoke` | PASS | Chrome `152.0.7977.64`; 9/9 official smoke steps and 13 deeper protocol executions. |
| Sanitized `pnpm audit:release` | PASS | 3,329 files, 88,114,588 bytes, 3,222 county packs, 52 state plates, eight commits, clean Git state, zero audit failures. |
| Sanitized `git diff --check` and SHA check | PASS | No whitespace errors; exact candidate `ad0d5ab6a1c61ec44254a67308777dcb6a2ca37c`. |
| Sanitized-release `/review` | PASS | Seven issues were auto-fixed: tracked forbidden-path coverage, internal build-report leakage, public evidence links, target-boundary safety, docs guards, deterministic import rewriting, and formatting-gate enforcement. No unresolved findings. |

### Browser proof

- Desktop: `artifacts/webmcp-proof/slice-1-desktop.png`.
- Mobile 390x844: `artifacts/webmcp-proof/slice-1-mobile-390x844.png`.
- Browser network isolation showed only same-origin map assets and `/api/atlas/nation`, all HTTP 200.
- Manual county drill-in changed the visible map from the U.S. to Abbeville County and exposed a working U.S. breadcrumb.
- Controller regression proof changed the map to Abbeville County and the shared breadcrumb returned it to the nationwide map.
- Five-tool fallback desktop: `artifacts/webmcp-proof/five-tool-fallback-desktop.png`.
- Five-tool fallback mobile 390x844: `artifacts/webmcp-proof/five-tool-fallback-mobile.png`.
- Ambiguity-safe judge path desktop: `artifacts/webmcp-proof/judge-path-ambiguous-desktop.png`.
- Ambiguity-safe judge path mobile 390x844: `artifacts/webmcp-proof/judge-path-ambiguous-mobile-390x844.png`.
- Final design proof desktop: `artifacts/webmcp-proof/judge-path-final-desktop.png`.
- Final design proof mobile 390x844: `artifacts/webmcp-proof/judge-path-final-mobile-390x844.png`.
- National trail overview desktop: `artifacts/webmcp-proof/trail-overview-desktop.png`.
- National trail overview mobile 390x844: `artifacts/webmcp-proof/trail-overview-mobile-390x844.png`.
- A three-stop Riverside / Miami-Dade / Travis trail rendered one route and three numbered markers before the visible revision resolved.
- All three marker targets measured 44x44 CSS pixels at desktop and 390x844; the mobile page remained at `scrollWidth=clientWidth=390`.
- The accessibility tree named the trail image and every stop; Enter on stop 2 opened Miami-Dade through `openTrailStop`.
- Removing a stop before the active stop renumbered both rail and overlay state without divergence.
- Chrome `152.0.7977.64` discovered exactly five top-level tools and executed every tool through the actual WebMCP protocol.
- The official deterministic suite passed 9/9 steps; the deeper harness completed 13 tool executions and wrote `artifacts/webmcp-proof/webmcp-browser-smoke.json`.
- `create_map_trail` returned only after the national route and three markers existed; keyboard Enter on stop 2 changed the same state read by `get_map_state`.
- Springfield ambiguity and an unresolved trail stop preserved revision, visible revision, selected place, note summary, current map, and trail.
- Refresh, `/`, and `/explore` each exposed exactly five tools; the WebMCP journey logged zero console/page errors.
- Normal-browser fallback produced no application error. Chrome logged only the expected warning that the experimental `tools` feature was not enabled in this browser.
- The refined fallback reads `Map ready · Site tools not detected`; supported Chrome reads `Map ready · Site tools on` and shows the run number, time, tool, and visible effect.
- Desktop trail title, place, prompt, and remove controls measure at least 32px; mobile research and map controls remain 44px with `scrollWidth=clientWidth=390`.
- Current-run screenshots cover the start, Springfield ambiguity, three-stop trail, dark mode, keyboard focus, and real WebMCP execution under `artifacts/product-design-audit/`.
- The exact sanitized candidate `ad0d5ab` repeated the Chrome 152 proof from a fresh clone: exactly five top-level tools, 9/9 official smoke steps, 13 deeper executions, visible national trail completion, saved screenshot, and a clean browser report.

### Review

- Reviewer: `/review` checklist plus independent WebMCP specification and release-safety reviews.
- High findings: `0` in the exact-five implementation.
- Medium findings: `0` after adding editable note text/title controls, timestamp visibility, 44px mobile removal targets, bounded state output, and an accessible page heading.
- Design findings: `0` remaining after raising the desktop finder to 44px and adding the restrained `ATLAS / location` masthead.
- Trail-overview findings: `0` remaining after fixing the overlay stacking order, stale first-stop copy, and active-stop renumber test coverage.
- Eval-slice findings: `0` remaining after fixing Chrome's missing execution-context invocation, clamping the minimum model runs/threshold, comparing visible revisions, and raising the documented Node floor.
- Sanitized-release findings: `0` remaining after fixing tracked-path scanning, internal report exclusion, public evidence links, target-boundary safety, docs guards, deterministic generation, and whitespace enforcement.
- Product-design findings: `0` remaining after fixing negative fallback language, undersized desktop edit targets, color-dependent active state, missing session/count context, clipped mobile candidates, map-label competition, missing smoke screenshot output, semantic section headings, and verifier specificity.
- Disposition: `CLEAN` for local code, sanitized clean-clone reproduction, and Chrome 152 WebMCP execution. Repository publication, deployed-URL repetition, model score, and ChatGPT discovery remain external acceptance gates.

## Risks and Blockers

- Private remote creation/push, public visibility, deployment, and Devpost submission remain owner gates. Apache-2.0 is already selected and present only in the sanitized challenge edition.
- Real ChatGPT built-in-browser acceptance cannot be claimed from local browser proof alone.
- Chrome 152 WebMCP acceptance is now proven locally without API injection; ChatGPT built-in-browser acceptance and deployed-URL repetition remain external gates.
- The three-run model-evaluation threshold is not met or claimed: no cloud provider credential is available, the installed Ollama GPU path crashes during PTX compilation, and the isolated CPU path cannot allocate the model buffer.
- The historical repository and history remain unfit for publication. The sanitized eight-commit repository is locally green, but `gitleaks` is unavailable; require GitHub secret scanning or an owner-approved entropy scan before public visibility.
- Three disposable assembler-check directories remain under `C:\Users\mzwin\AppData\Local\Temp` because recursive cleanup was blocked twice by the command safety policy. They are outside both Git repositories and do not affect the candidate.

## Exact Next Action

Owner decision: approve creating a new private GitHub repository named `Zwin-ux/atlas-webmcp-challenge` and pushing sanitized candidate `ad0d5ab6a1c61ec44254a67308777dcb6a2ca37c` as its initial `main` history. Do not publish it or create a Railway service in this gate.

## Slice Queue

1. No-login challenge route and baseline — GREEN (`370ec495`)
2. Shared AtlasMapController — GREEN (`491a7ddb`)
3. Read/search/open WebMCP tools — GREEN (`7e2d2d8f` contracts)
4. AgentActivityRail — GREEN (`f9f98a18`)
5. Session note tool — GREEN (`f9f98a18`)
6. Atomic research trail — GREEN (`f9f98a18`)
7. WebMCP verifier and negative cases — GREEN (`f9f98a18`)
8. Judge-path UX and browser proof — GREEN (`dda677d7`, design fixes `3a7dbf7a`, `b90182b6`)
9. README/submission/video materials — GREEN (`4ba01042`)
10. Clean-clone and public-release audit — LOCALLY GREEN; existing repo blocked, owner-gated sanitized path ready
11. National research-trail overview — GREEN (`f9a2614c`)
12. WebMCP evaluation and deterministic browser smoke — DETERMINISTIC GREEN / MODEL ENVIRONMENT BLOCKED (`c574bee4`)
13. Real Chrome and normal-browser acceptance — LOCALLY GREEN; deployed URL and ChatGPT built-in browser remain external
14. Sanitized release repository and clean-clone proof — GREEN (`74a1672b`; sanitized candidate superseded by `ad0d5ab`)
15. Product-design pass for human-agent session legibility — GREEN (`08a5b84a`; sanitized candidate `ad0d5ab`)
16. Private remote creation and initial push — OWNER GATE

