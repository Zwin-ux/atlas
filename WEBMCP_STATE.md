# Atlas WebMCP Challenge State

## Identity

- Branch: `webmcp-challenge`
- Baseline branch: `main`
- Baseline SHA: `b6f2f8213a9acef3629a2c5f9f84cebab32fea56`
- Last green commit: `pending Slice 1 commit`
- Deadline: September 3, 2026 at 1:00 PM Pacific

## Current Slice

- Slice: `1 — No-login challenge route and baseline`
- Status: `GREEN — awaiting commit`
- Player-visible promise: `A judge can open Atlas immediately without Auth0 or setup.`
- Anti-scope: `No Scout, campaign, Hosted Clawd, Commons, billing, road expansion, or renderer rewrite.`

## Acceptance Checks

- [x] Repository/worktree state recorded.
- [x] Challenge route is top-level and no-login.
- [x] Existing human map interaction still works.
- [x] Normal browser renders without WebMCP.
- [x] Targeted tests pass.
- [x] Typecheck/build pass if affected.
- [x] Desktop proof captured.
- [x] 390x844 proof captured.

## Work Log

### Files changed

- `server/src/index.ts` — serves the existing Atlas map bundle at top-level `/` and `/explore` with WebMCP-compatible origin headers.
- `web/src/atlas/atlas.css` — gives the judge route a full-viewport, mobile-safe map canvas without changing the map renderer.
- `scripts/verify-preview-http.mjs` — verifies `/`, `/explore`, and `/preview`, including challenge anti-scope and response headers.
- `WEBMCP_STATE.md` — records orientation, evidence, and Slice 1 status.
- `CHALLENGE_DELTA.md` — initializes the honest pre-existing/challenge-period capability ledger.
- `artifacts/webmcp-proof/slice-1-desktop.png` — desktop no-login route proof.
- `artifacts/webmcp-proof/slice-1-mobile-390x844.png` — 390x844 no-login route proof.

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

### Browser proof

- Desktop: `artifacts/webmcp-proof/slice-1-desktop.png`.
- Mobile 390x844: `artifacts/webmcp-proof/slice-1-mobile-390x844.png`.
- Browser network isolation showed only same-origin map assets and `/api/atlas/nation`, all HTTP 200.
- Manual county drill-in changed the visible map from the U.S. to Abbeville County and exposed a working U.S. breadcrumb.
- Normal-browser fallback produced no application error. Chrome logged only the expected warning that the experimental `tools` feature was not enabled in this browser.

### Review

- Reviewer: `/review` checklist plus independent WebMCP specification review.
- High findings: `0` in Slice 1.
- Medium findings: `0` in Slice 1.
- Disposition: `CLEAN`. Accessibility depth and real WebMCP-enabled browser acceptance remain explicit later-slice gates, not claims of this route slice.

## Risks and Blockers

- Public visibility, license selection, deployment, and Devpost submission remain owner gates.
- Real ChatGPT built-in-browser acceptance cannot be claimed from local browser proof alone.
- The normal local browser does not expose `document.modelContext`; WebMCP-enabled Chrome and ChatGPT acceptance remain unproven until the five tools exist.
- The existing repository and history are not publication-safe: old transcripts, challenge-scope leakage, missing license/provenance, and a roughly 414 MB tracked tree require a sanitized release boundary.

## Exact Next Action

Commit the green no-login route slice, then introduce one shared live map controller with render acknowledgment for human and future tool mutations.

## Slice Queue

1. No-login challenge route and baseline — GREEN, awaiting commit
2. Shared AtlasMapController — NEXT
3. Read/search/open WebMCP tools — QUEUED
4. AgentActivityRail — QUEUED
5. Session note tool — QUEUED
6. Atomic research trail — QUEUED
7. WebMCP verifier and negative cases — QUEUED
8. Judge-path UX and browser proof — QUEUED
9. README/submission/video materials — QUEUED
10. Clean-clone and public-release audit — AUDITED; remediation queued

