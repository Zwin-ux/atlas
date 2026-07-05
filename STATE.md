# Atlas Loop State

Last run: 2026-07-05 - 0.59H Hosted Clawd storage/auth decision
Loop level: L2 assisted
Kill switch: active only if `loop-constraints.md` says `pause: true`

## Current Repository Harness

Local canonical candidate:
`C:/Users/mzwin/Documents/Atlas` on `codex/integrate-hosted-clawd-fable-058e`.

Input update:
`0.58I Integration Canonicalization / Release Decision Packet` at base commit
`920cf8a`.

This branch combines:
- `7804ed0` - gated Hosted Clawd rental scaffold.
- `0c4c350` - Fable 0.58E map-mascot removal and shell grammar cleanup.
- The Fable 0.53E-0.57E visual chain and proof artifacts.

Extra local worktree:
- `C:/Users/mzwin/Documents/atlas-53e-fable` on `fable/0.58e-prop-cleanup`.

Deploy status:
Not deployed and not pushed by default. The integrated branch still needs live
deploy proof before public promotion, but the human has explicitly reopened
DB/Auth preparation for Hosted Clawd.

## Current Slice

`0.59H Hosted Clawd Storage/Auth Decision Packet` is local green.

Decision:
`DB_AUTH_PREP_APPROVED_STRIPE_STAYS_CLOSED`.

Selected axis:
`hosted_clawd_storage_auth`.

Scope:
Chooses the DB/Auth implementation path for Hosted Clawd: Railway Postgres,
committed SQL migrations plus a small Node runner, OAuth/OIDC account linking
for protected MCP Hosted Clawd actions, owner checks, idempotency, and Stripe
later. This is docs/verifier prep only: no package dependency, migration,
persisted write, auth provider mutation, Stripe call, public price claim, or
new MCP tool was added.

Next quest:
`0.60H Persistence Foundation`.

0.60H may implement DB/Auth persistence only inside the named slice. Stripe
remains closed until 0.60H ownership, idempotency, usage, and reload-safe
persistence pass.

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
- Keep money and public-claim flags closed.
- DB/Auth implementation is reopened only for 0.60H owner-protected
  persistence.
- Keep Anaheim/Ontario hidden and non-public.
- No provider-created geometry.
- No public deploy/promotion without live proof and human visual/deploy
  approval.
- Use `hosted-clawd-fable-integration` for strict split checks on this branch.

## Watch List

- Mobile `390x844` product comprehension.
- Hosted Clawd save-state UX must stay as a compact tray/status strip over the
  Fable map; no dashboard, pricing page, or geometry change.
- Dirty tree size: strict split guard must stay `0 blockers / 0 unknowns`.
- Public URL baseline: `https://atlas-backend-production-e6fc.up.railway.app/preview`.

## Recent Proof

- 0.58J desktop setup-console screenshot:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-058j-setup-desktop.png`
- 0.58J mobile setup-console screenshot:
  `C:/Users/mzwin/AppData/Local/Temp/atlas-058j-setup-mobile.png`
- Browser metrics:
  desktop `1280x800` and mobile `390x844` both had setupConsole=`grey`,
  active step=`Target`, duplicate step list=`false`, no horizontal overflow, and
  no console errors.
- Fable final design QA:
  `PASS` for 0.58K human visual gate, with only non-blocking nits.
- 0.59H DB/Auth decision packet:
  `docs/HOSTED_CLAWD_STORAGE_AUTH_DECISION_PACKET.md`
- Local preview when the server is running:
  `http://127.0.0.1:8787/preview`
