# 0.78-2A National Town Anchors + Submission Candidate Result

Date: 2026-07-15
Status: LOCAL GREEN — NOT DEPLOYED

## Product outcome

Atlas County Scout now has a real named anchor in every supported county.
The committed-data candidate covers 3,222/3,222 counties with 13,797 U.S.
Census anchors. County previews include those anchors by default. A question
such as “Where is Homestead?” returns a map target and Census source note while
stating that surrounding streets and buildings are generated, not verified
local geography.

The first submission remains focused and session-only: seven read-only tools,
no auth, no saved-account work, no billing, and no Hosted Clawd entitlement.

## Implementation envelope

- Deterministic Census 2024 town-anchor generator and validated national index.
- Shared anchor types/parser exported through `@atlas/core`.
- Generated-district and exact county-board compilers render town anchors.
- County questions resolve Census anchors without inventing streets,
  businesses, addresses, or local claims.
- Server and scene-packet worker load the same index; cache keys advance to the
  town-anchor update when anchors are present.
- Preview county tools attach generated town-anchor specs by default.
- Redis worker hardening covers `maxclients`, fresh reconnects, singleton
  adapter reuse, transient poll recovery, and readiness health.
- Release preflight blocks national-anchor or worker-regression drift.
- Submission copy/test case and canonical product docs match the focused scope.

## Certification

- `pnpm typecheck` — green.
- `pnpm test:core` — 25 files, 165 tests green.
- `pnpm build` — green.
- Server town-anchor + Redis/worker tests — 4/4 green.
- `verify:county-town-anchors` — 3,222/3,222 counties, 13,797 anchors,
  maximum generated spec 8,616/10,000 characters.
- Generated draft, deterministic district, national shell, production backend,
  server hardening, provider boundary, save-surface, and tool-shape gates — green.
- Local seven-tool MCP flow — green, including Miami-Dade/Homestead.
- Local submission verifier — green; privacy/terms/support 200 and unconfigured
  domain challenge 404.
- Source-of-truth drift and loop readiness — green.
- Widget budget — 226,368 eager JS bytes, 69,409 eager Brotli bytes, 1,191,284
  total lazy-inclusive JS bytes; all within the explicit rebaselined ceilings.

## Honest remaining gates

- Isolate and commit only the release envelope; the worktree contains unrelated
  user artifacts and must not be bulk-staged.
- Configure the Railway worker healthcheck and deploy the clean candidate.
- Obtain the portal domain token, publish it, scan tools/CSP, and confirm
  publisher identity, permissions, global residency, and US availability.
- Run the positive/negative battery plus representative county anchors in real
  ChatGPT web and mobile (G8).
- Human submits the plugin.

County-seat styling, national exact boundary/road packs, town drill-down,
auth, persistence, and billing are later Atlas work and are not submission
claims.
