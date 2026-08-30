# Atlas WebMCP Challenge State

## Identity

- Branch: `webmcp-challenge`
- Baseline branch: `main`
- Baseline SHA: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`
- Last green commit: `491a7ddbbc7bd77987716dd141621df956d034d9`
- Deadline: September 3, 2026 at 1:00 PM Pacific

## Current Slice

- Slice: `3 — Census search/resolution and core WebMCP contracts`
- Status: `GREEN — awaiting commit`
- Player-visible promise: `An agent can read the current map, search Census-backed places, and open one unambiguous place on the visible map.`
- Anti-scope: `No Scout, campaign, Hosted Clawd, Commons, billing, road expansion, or renderer rewrite.`

## Acceptance Checks

- [x] Same-origin search and resolution reuse the production Census gazetteer.
- [x] Search returns at most eight public candidates without coordinates or raw geometry.
- [x] Ambiguous and unknown names return structured results without mutation.
- [x] Resolved places mutate once and wait for visible controller acknowledgment.
- [x] Browser API payloads are runtime-validated before mutation.
- [x] `get_map_state`, `search_places`, and `open_place` descriptors have narrow schemas and exact annotations.
- [x] Execution cancellation reaches fetch and is checked before mutation.
- [x] Official `webmcp-types` is pinned at `0.1.5`.
- [x] Partial registration is withheld until all five descriptors exist.
- [x] Focused tests and typecheck pass.

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

### Browser proof

- Desktop: `artifacts/webmcp-proof/slice-1-desktop.png`.
- Mobile 390x844: `artifacts/webmcp-proof/slice-1-mobile-390x844.png`.
- Browser network isolation showed only same-origin map assets and `/api/atlas/nation`, all HTTP 200.
- Manual county drill-in changed the visible map from the U.S. to Abbeville County and exposed a working U.S. breadcrumb.
- Controller regression proof changed the map to Abbeville County and the shared breadcrumb returned it to the nationwide map.
- Normal-browser fallback produced no application error. Chrome logged only the expected warning that the experimental `tools` feature was not enabled in this browser.

### Review

- Reviewer: `/review` checklist plus independent WebMCP specification review.
- High findings: `0` in Slice 3.
- Medium findings: `0` after adding runtime validation for browser API payloads before mutation.
- Disposition: `CLEAN`. Registration remains intentionally withheld until the exact five-tool set exists.

## Risks and Blockers

- Public visibility, license selection, deployment, and Devpost submission remain owner gates.
- Real ChatGPT built-in-browser acceptance cannot be claimed from local browser proof alone.
- The normal local browser does not expose `document.modelContext`; WebMCP-enabled Chrome and ChatGPT acceptance remain unproven until the five tools exist.
- The existing repository and history are not publication-safe: old transcripts, challenge-scope leakage, missing license/provenance, and a roughly 414 MB tracked tree require a sanitized release boundary.

## Exact Next Action

Commit the core tool contract slice, then add the visible site-tool activity rail and session-only note mutation.

## Slice Queue

1. No-login challenge route and baseline — GREEN (`370ec495`)
2. Shared AtlasMapController — GREEN (`491a7ddb`)
3. Read/search/open WebMCP tools — GREEN, awaiting commit; registration held for exact-five cut
4. AgentActivityRail — NEXT
5. Session note tool — QUEUED
6. Atomic research trail — QUEUED
7. WebMCP verifier and negative cases — QUEUED
8. Judge-path UX and browser proof — QUEUED
9. README/submission/video materials — QUEUED
10. Clean-clone and public-release audit — AUDITED; remediation queued

