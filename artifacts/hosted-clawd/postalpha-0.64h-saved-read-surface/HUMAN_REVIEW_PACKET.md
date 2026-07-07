# Hosted Clawd Human Review Packet - 0.64H to 0.65H

Date: 2026-07-05
Branch: `codex/integrate-hosted-clawd-fable-058e`
Current update: `postalpha-0.64h-hosted-clawd-saved-read-surface`
Next named quest: `0.65H Hosted Clawd Browser Proof`

## Review Summary

Atlas now has the local-green Hosted Clawd stack needed for owner-protected
memory: DB/Auth foundation, test-mode Stripe billing, webhook-confirmed paid
write gates, and a compact saved-state read shelf inside the map tray.

This is still not a public paid launch. It is a ChatGPT App candidate surface
that keeps the voxel map primary and keeps the public MCP surface at seven
tools.

## What Is Ready For Review

- 0.62H: Stripe test billing, Checkout/Portal server routes, webhook replay,
  no return-url access grant, no live-mode keys.
- 0.63H: protected paid writes require stored active subscription state from
  the repository; client `subscriptionStatus` is ignored.
- 0.64H: saved reads use GET `/api/hosted-clawd/saved`, require verified read
  or write scope, create no rows, and do not require active subscription.
- Tray UI: the grey setup console / dark maroon clay tray now shows owned
  memory first, with desktop and `390x844` mobile screenshot proof.
- Stub audit: `docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md` records fixed stubs,
  queued work, and intentional scaffold language.

## Human Decisions Needed

### 1. Accept 0.64H As The Local Canonical Candidate

Recommended answer: approve.

Why:
- Tests and verifiers passed.
- No public MCP tools were added.
- No dashboard, pricing page, public paid claim, evidence, XP, reports,
  exports, automation, provider geometry, renderer geometry, or public
  Anaheim/Ontario exposure was introduced.
- Browser proof caught and fixed the initial saved-shelf hierarchy problem.

What approval means:
The 0.62H-0.64H stack becomes the candidate branch for the next proof slice.
It does not mean public paid Beta is live.

### 2. Choose The 0.65H Saved-Read Auth Path

Recommended answer: run 0.65H as an auth-path proof slice, not a new feature
expansion.

Preferred path:
1. Prove the current unauthenticated widget fetch produces a clear account-link
   / auth-required state.
2. Verify whether the ChatGPT App host can provide a bearer to widget HTTP
   fetches for `/api/hosted-clawd/saved`.
3. If host bearer passthrough exists, wire `Authorization: Bearer ...` into the
   saved-read fetch and prove owner-scoped read success in browser.
4. If host bearer passthrough does not exist, stop and bring back a narrower
   architecture choice. Do not invent a custom token bridge without review.

Rejected for 0.65H unless explicitly approved:
- Adding an eighth public MCP tool.
- Putting secrets, bearer tokens, or durable saved data into
  `structuredContent`.
- Minting long-lived widget tokens.
- Claiming public paid access.

### 3. Decide Whether To Clean Copy During 0.65H

Recommended answer: allow small copy cleanup only when it reduces false
promises.

Good 0.65H copy cleanup:
- Change "Join Hosted Clawd waitlist" if no real waitlist capture is built.
- Change "demo XP" to "notes" while XP remains parked.
- Rename "Open saved campaign" to "Open saved state" if action naming can move
  without widening the typed action contract.

Do not use 0.65H for:
- Campaign reports.
- Evidence.
- XP.
- Exports.
- Automation.
- Pricing pages.
- Public marketing.

## Inventory

Modified tracked files: 25.

Primary changed areas:
- Hosted Clawd server auth/service/repository/Postgres/types.
- HTTP routes in `server/src/index.ts`.
- Map tray UI in `web/src/App.tsx`, `web/src/HostedClawdTray.tsx`,
  `web/src/styles.css`, and `web/src/types.ts`.
- Verifiers and docs/source-of-truth files.

Untracked proof/code artifacts:
- 0.62H billing artifact and screenshots.
- 0.63H protected gate artifact.
- 0.64H saved-read artifact and screenshots.
- Stripe billing migration.
- Hosted Clawd billing module.
- Focused Hosted Clawd tests and verifiers.
- Clay background generated asset.
- Stub audit.

## Evidence To Inspect

- `artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface.json`
- `artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface/hosted-clawd-saved-read-desktop-1280x720.png`
- `artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface/hosted-clawd-saved-read-mobile-390x844.png`
- `docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md`
- `docs/NEXT_QUESTS.md`
- `docs/TOOL_CONTRACTS.md`

## Last Green Verification

- `pnpm test:hosted-clawd-saved-read-surface`
- `pnpm test:hosted-clawd-protected-tool-gate`
- `pnpm test:hosted-clawd-billing`
- `pnpm test:hosted-clawd`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `node scripts/verify-hosted-clawd-saved-read-surface.mjs`
- `node scripts/verify-hosted-clawd-saved-read-browser.mjs --screenshots artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface`
- `node scripts/verify-atlas-source-of-truth-drift.mjs --json-only`
- `node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode hosted-clawd-saved-read-surface --json-only`
- `node scripts/verify-provider-boundaries.mjs --json-only`
- `node scripts/verify-tool-result-shape.mjs --json-only`
- `node scripts/verify-mcp-flow.mjs` against a temporary local MCP server
- `git diff --check`

## Recommended 0.65H Acceptance Criteria

- Desktop and `390x844` mobile browser proof covers the auth-required state.
- If a bearer path is available, browser proof covers a real authorized saved
  read.
- No new public MCP tools.
- Saved reads still create no rows.
- Saved history remains readable without active subscription.
- Public paid claims remain closed.
- The tray remains map-first and does not become a dashboard.
