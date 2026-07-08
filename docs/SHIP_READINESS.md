# Atlas — Ship Readiness (0.75C merged build)

Date: 2026-07-07 · Build: canonical `codex/integrate-hosted-clawd-fable-058e`
(merge `854ce0f` + fixes `7d81233`/`62699e6`) · Verdict author: Fable (reviewer)
· Legal: **approved by owner 2026-07-07** (privacy/terms as screenshotted in
`artifacts/ship-prep/{privacy,terms}-2026-07-07.png`).

## Verdict

**READY TO DEPLOY.** Every gate that guards the Alpha submission (G1–G6) is
green on one coherent committed build, verified with one exit code per gate.
The only remaining steps are the human ones: push-triggered Railway deploy and
the directory submission (G7), then the two prod-targeting verifiers flip the
last reds.

## Ship gates — all green (verified this build, exit 0 each)

| Gate | Proof |
|---|---|
| G1 build | typecheck (tsc), `test:core` 109/109, `build:web` clean |
| G2 MCP contract | `verify-submission` (7 tools, schema, live sweep), `verify-mcp-flow`, `verify-tool-result-shape` |
| G3 widget quality | `verify-alpha-product-loop`, `verify-scout-campaign-panel`, `verify-shell-county-widget`, `verify-county-switcher`, `verify-generated-district-widget` — desktop + 390×844, no console errors |
| G4 reliability | `verify-mcp-flow` end-to-end live; `verify-preview-http` |
| G5 honesty | `verify-provider-boundaries`, `verify-world-lookup-boundary`, `verify-chatgpt-entry-surface`, drift checker (0.45E freeze restored), strict split guard (clean-tree) |
| G6 manifest | real icon (`assets/brand/atlas-icon-512.png`), legal URLs live-routed, `verify-submission` green, legal sign-off recorded above |
| Engine quality | parity, material-texture grammar, widget-performance (hover 0 rebuilds, idle parks, 844 Graphics vs 1,600 ceiling), web-bundle budget |

Full sweep: 82 verifiers; 60 green as-swept, and every non-green is classified
below — none guards this submission.

## Non-green classification (none blocks G7)

- **Prod-targeting (flip after deploy):** `verify-alpha-public-sanity`,
  `verify-engine-beta-coverage` — they test the LIVE Railway URL, which still
  runs the stale pre-0.72B build. Re-run both after deploy as prod validation.
- **Hosted-clawd track (pre-existing, feature not live):** 10 gates red at
  pre-merge `244fa2a` identically (verified in a detached worktree), including
  the scaffold guard contradicting the track's own `pg` dependency. Hosted
  Clawd ships as `planned_beta`; these are that track's WIP contracts.
- **Scene-packet contracts (pre-existing):** red at `244fa2a` identically.
- **Parked owner-gate track:** `verify-anaheim-draft-scene` (pre-existing),
  `verify-second-district-*` ×3 (ceremony tools that require `--district`
  args; not sweep gates).
- **Environmental:** `verify-alpha-rc-split` strict mode and
  `verify-atlas-loop-readiness` flag ONLY the sibling 0.75R session's
  uncommitted files (`docs/0.75R_HANDOFF.md`, `docs/design/clay-board/`) —
  green on a clean tree once that session commits its Stage-2 work.
  `verify-external-voxel-reference-adapter` flags an UNTRACKED local
  `.reference/` study folder (not part of the build or the repo).

## What this build contains

0.72B hosted-clawd production stack (Redis scene-packet cache, Railway ops,
mobile hardening) + 0.73F/0.74F engine superpasses + today's 0.75C series
(depth interleave, dense residential fabric, close-zoom material texture,
NS-3 presentation pass), G6 ship assets, and three merge-hardening fixes:
Pixi destroy-before-init crash (widget died on county switch), zone-erasure
generator fallback (Cook County apartment court restored), and verifier
reconciliation (async-canvas waits + copy assertions aligned to current
product copy).

## Deploy runbook (human steps)

1. **Push** (done by reviewer): `codex/integrate-hosted-clawd-fable-058e` and
   `fable/0.58e-prop-cleanup` to origin.
2. **Railway deploy** the canonical branch to the existing service
   (`atlas-backend-production-e6fc.up.railway.app`). Check service env:
   `ADMIN_PASSWORD`, `REDIS_URL` (0.72B stack; memory fallback exists for
   local only), optional `ATLAS_CONTACT_EMAIL`.
3. **Prod validation:** `node scripts/verify-alpha-public-sanity.mjs` and
   `node scripts/verify-engine-beta-coverage.mjs` against prod; open
   `/privacy`, `/terms`, `/preview` by hand once.
4. **Directory submission:** `chatgpt-app-submission.json` +
   `assets/brand/atlas-icon-512.png` through the OpenAI Apps submission flow.
   The manifest's legal URLs point at the prod routes deployed in step 2.
