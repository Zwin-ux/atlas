# Atlas Loop State

Last run: 2026-07-05 - 0.58I integration canonicalization packet
Loop level: L2 assisted
Kill switch: active only if `loop-constraints.md` says `pause: true`

## Current Repository Harness

Local canonical candidate:
`C:/Users/mzwin/Documents/Atlas` on `codex/integrate-hosted-clawd-fable-058e`
at merge commit `9b8a5fb`.

This branch combines:
- `7804ed0` - gated Hosted Clawd rental scaffold.
- `0c4c350` - Fable 0.58E map-mascot removal and shell grammar cleanup.
- The Fable 0.53E-0.57E visual chain and proof artifacts.

Extra local worktree:
- `C:/Users/mzwin/Documents/atlas-53e-fable` on `fable/0.58e-prop-cleanup`.

Deploy status:
Not deployed and not pushed by default. The next gate is
`0.58J Human Visual Gate / Deploy Readiness Decision`.

## Current Slice

`0.58I Integration Canonicalization / Release Decision Packet` is local green.

Decision:
`HUMAN_VISUAL_GATE_FIRST`.

Next quest:
`0.58J Human Visual Gate / Deploy Readiness Decision`.

After 0.58J, Hosted Clawd implementation can proceed only as
`0.59H Hosted Clawd Storage/Auth Decision Packet`; no DB/auth/Stripe/persistence
implementation starts before that decision.

## Branch Map

- `codex/integrate-hosted-clawd-fable-058e` - local canonical candidate.
- `codex/hosted-clawd-service` - Hosted Clawd scaffold source branch.
- `fable/0.58e-prop-cleanup` - Fable cleanup source branch and secondary worktree.
- `fable/0.57e-generated-parity`, `fable/0.56e-label-layout`,
  `fable/0.55e-decal-discipline`, `fable/0.54e-grade-contrast` - Fable visual
  chain ancestors.
- Earlier Codex and Fable branches are history. Do not reopen them unless a
  verifier names an exact blocker.

## Gates

- Keep seven public MCP tools.
- Keep Hosted Clawd persistence, money, and public-claim flags closed.
- Keep Anaheim/Ontario hidden and non-public.
- No provider-created geometry.
- No deploy without human visual/deploy approval.
- Use `hosted-clawd-fable-integration` for strict split checks on this branch.

## Watch List

- Mobile `390x844` product comprehension.
- Hosted Clawd tray weight against the richer Fable map; 0.58J should accept it
  or name the exact styling blocker.
- Dirty tree size: strict split guard must stay `0 blockers / 0 unknowns`.
- Public URL baseline: `https://atlas-backend-production-e6fc.up.railway.app/preview`.

## Recent Proof

- Integration desktop screenshot:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-integration-desktop.png`
- Integration mobile screenshot:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-integration-mobile.png`
- Local preview when the server is running:
  `http://127.0.0.1:8787/preview`
