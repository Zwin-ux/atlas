# Atlas WebMCP Challenge State

## Identity

- Branch: `webmcp-challenge`
- Baseline branch: `main`
- Baseline SHA: `TBD`
- Last green commit: `TBD`
- Deadline: September 3, 2026 at 1:00 PM Pacific

## Current Slice

- Slice: `1 — No-login challenge route and baseline`
- Status: `READY`
- Player-visible promise: `A judge can open Atlas immediately without Auth0 or setup.`
- Anti-scope: `No Scout, campaign, Hosted Clawd, Commons, billing, road expansion, or renderer rewrite.`

## Acceptance Checks

- [ ] Repository/worktree state recorded.
- [ ] Challenge route is top-level and no-login.
- [ ] Existing human map interaction still works.
- [ ] Normal browser renders without WebMCP.
- [ ] Targeted tests pass.
- [ ] Typecheck/build pass if affected.
- [ ] Desktop proof captured.
- [ ] 390x844 proof captured.

## Work Log

### Files changed

- None yet.

### Commands and results

| Command | Result | Evidence |
|---|---|---|
| `git status --short --branch` | TBD | |
| `git log -5 --oneline` | TBD | |

### Browser proof

- None yet.

### Review

- Reviewer: `TBD`
- High findings: `TBD`
- Medium findings: `TBD`
- Disposition: `TBD`

## Risks and Blockers

- None recorded.

## Exact Next Action

Read the challenge authority files, record the baseline SHA, and define the smallest no-login top-level route implementation.

## Slice Queue

1. No-login challenge route and baseline — READY
2. Shared AtlasMapController — QUEUED
3. Read/search/open WebMCP tools — QUEUED
4. AgentActivityRail — QUEUED
5. Session note tool — QUEUED
6. Atomic research trail — QUEUED
7. WebMCP verifier and negative cases — QUEUED
8. Judge-path UX and browser proof — QUEUED
9. README/submission/video materials — QUEUED
10. Clean-clone and public-release audit — QUEUED
