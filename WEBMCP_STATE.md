# Atlas WebMCP Challenge State

## Identity

- Branch: `webmcp-challenge`
- Baseline branch: `main`
- Baseline SHA: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`
- Last green commit: `b90182b64fa27b78a8d07738360c1cb842b833b4`
- Deadline: September 3, 2026 at 1:00 PM Pacific

## Current Slice

- Slice: `9–10 — Challenge documentation and owner-gated release packet`
- Status: `GREEN — awaiting commit`
- Player-visible promise: `A judge or release owner can understand, run, verify, record, and safely release the focused Atlas WebMCP candidate without inheriting the retired Atlas story.`
- Anti-scope: `No Scout, campaign, Hosted Clawd, Commons, billing, road expansion, or renderer rewrite.`

## Acceptance Checks

- [x] Exactly five descriptors register from top-level `/` and `/explore` only.
- [x] Registration is all-or-none and one shared abort signal removes partial success.
- [x] Normal browsers keep full manual map behavior with an honest unavailable status.
- [x] Activity rail shows availability, sequence, timestamp, tool, state, and concise effect.
- [x] `add_map_note` resolves first, enforces 240 characters, renders text safely, and waits for visibility.
- [x] `create_map_trail` resolves all 2–5 stops before one mutation and opens the first stop.
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
| Publication-safety inventory | PASS as audit, BLOCKED as release | 37,259 tracked files, 440.85 MiB pack, 410 Markdown files, no root license, historical local/session material; existing repo must remain private. |
| `pnpm audit:webmcp:release` | PASS as audit | Verdict `DO_NOT_PUBLISH_CURRENT_REPOSITORY`; 201 tracked historical-risk paths, no license, and explicit limited-scan coverage. |
| `pnpm verify:webmcp` with docs guard | PASS | 26 focused tests, exact-five runtime/static checks, four owner placeholders, 2:45 script budget, and no retired-scope pattern in judge story files. |

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
- Normal-browser fallback produced no application error. Chrome logged only the expected warning that the experimental `tools` feature was not enabled in this browser.

### Review

- Reviewer: `/review` checklist plus independent WebMCP specification and release-safety reviews.
- High findings: `0` in the exact-five implementation.
- Medium findings: `0` after adding editable note text/title controls, timestamp visibility, 44px mobile removal targets, bounded state output, and an accessible page heading.
- Design findings: `0` remaining after raising the desktop finder to 44px and adding the restrained `ATLAS / location` masthead.
- Disposition: `CLEAN` for local code. Real WebMCP-enabled Chrome and ChatGPT discovery remain external acceptance gates.

## Risks and Blockers

- Public visibility, license selection, deployment, and Devpost submission remain owner gates.
- Real ChatGPT built-in-browser acceptance cannot be claimed from local browser proof alone.
- The normal local browser does not expose `document.modelContext`; WebMCP-enabled Chrome and ChatGPT acceptance remain unproven until the five tools exist.
- The normal local browser still does not expose `document.modelContext`; an attempted browser-CLI injection hit a Windows argument-parser limit, while executable registry mocks pass. Do not claim real built-in-browser acceptance.
- The existing repository and history are not publication-safe: old transcripts, challenge-scope leakage, missing license/provenance, and a roughly 414 MB tracked tree require a sanitized release boundary.

## Exact Next Action

Run the final documentation/code review, commit Slice 9-10, then verify the exact committed candidate from a clean detached worktree and record the final candidate SHA.

## Slice Queue

1. No-login challenge route and baseline — GREEN (`370ec495`)
2. Shared AtlasMapController — GREEN (`491a7ddb`)
3. Read/search/open WebMCP tools — GREEN (`7e2d2d8f` contracts)
4. AgentActivityRail — GREEN (`f9f98a18`)
5. Session note tool — GREEN (`f9f98a18`)
6. Atomic research trail — GREEN (`f9f98a18`)
7. WebMCP verifier and negative cases — GREEN (`f9f98a18`)
8. Judge-path UX and browser proof — GREEN (`dda677d7`, design fixes `3a7dbf7a`, `b90182b6`)
9. README/submission/video materials — GREEN, awaiting commit
10. Clean-clone and public-release audit — AUDITED; existing repo blocked, owner-gated sanitized path ready

