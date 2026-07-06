# Atlas Release Ladder

Atlas updates are named, gated slices. No worker should claim they are
"improving Atlas" without a player-facing promise, engineering promise, and
proof packet.

## Current Update

### Post-Alpha 0.61H - Invite Beta Save UX

Player-facing promise: Atlas keeps the voxel map as the product surface while
making owned local state understandable: business/location, local notes, Scout
Drop, and campaign draft show as the memory Clawdbot could read later.

Engineering promise: Keep the Superior grey setup console, add compact
claymation save slots inside the Hosted Clawd tray, and prove the result on
desktop and 390x844 mobile. Stripe, public paid claims, new MCP tools,
dashboards, and renderer geometry stay closed.

Spec:
Use `postalpha-0.60h-hosted-clawd-persistence-foundation` as the input update.
Keep `scripts/verify-hosted-clawd-save-ux.mjs`,
`scripts/verify-hosted-clawd-save-ux-browser.mjs`,
`scripts/verify-atlas-source-of-truth-drift.mjs`, and strict
`hosted-clawd-save-ux` split mode as the 0.61H guard.

Status:
Local green. Branch `codex/integrate-hosted-clawd-fable-058e` is the local
canonical candidate. Decision is
`MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED`; selected axis is
`hosted_clawd_invite_beta_save_ux`. The memory layer from 0.60H stays
owner-protected, and the 0.61H tray makes that future Clawdbot memory legible
without leaving the map. Stripe, public paid claims, evidence, XP, reports,
exports, automation, public Anaheim/Ontario, renderer geometry, and new public
MCP tools remain closed. The public MCP tool surface remains the seven existing
tools.

## Parked Owner-Gate Ladder

### Post-Alpha 0.45E - Owner Gate Cutline / Next Axis Selection

The owner-gate ladder remains parked but valid. The selector chose
`owner_gate_review`, decision `REQUEST_OWNER_REVIEW`, and recommended
`0.46E Owner Gate Review Packet`. Controlled public Anaheim remains blocked
until the cutline changes to `APPROVE_CONTROLLED_PUBLIC_SPIKE`.

## Active Product Submission Track

Human-directed (2026-07-03). The product/app-quality path to a submittable
ChatGPT app is recorded in `docs/PRODUCT_SPEC_AND_GATES.md` (gates G1-G7).
Slices: `0.46P` in-widget result surface (done + proven), `0.47P` widget polish,
`0.48P` design ultra-pass (Fable supermove), `0.49P` reliability sweep,
`0.50P` submission packet. The owner-gate updates are parked and kept honest;
Anaheim/Ontario stay hidden.

## Next Updates

### Post-Alpha 0.62H - Stripe Test Billing

Next named quest: `0.62H Stripe Test Billing`.

Attach Stripe only after 0.60H ownership and idempotency pass: test Checkout,
Customer Portal, webhook replay protection, active subscription writes,
inactive read-only state, and proof that the success URL grants nothing by
itself.

### Post-Alpha 0.46E - Owner Gate Review Packet

Package exact Lumen, Mira, Forge, and Axiom review asks against the repo-local
0.44E hidden proof. This is an owner review packet, not public Anaheim
implementation.

### Post-Alpha 0.47E - Controlled Anaheim Public Playable Spike

Only run if the owner-gate cutline reports `APPROVE_CONTROLLED_PUBLIC_SPIKE`.
Anaheim is the default candidate; Ontario remains a hidden control. Keep the
seven-tool MCP surface stable and do not expose a public Anaheim switcher state
until desktop, mobile, visual, product, split, and provider gates pass.

### Post-Alpha 0.48E - Public Entry And County State Compression

Compress the public map/switcher/tray entry surface if mobile or app-review
screenshots show the Alpha loop still reads too dense.

### Post-Alpha 0.49E - Shell Honesty Update

Make shells, hidden drafts, unsupported states, and playable counties impossible
to confuse.

### Post-Alpha 0.50E - Riverside Quality Correction

Only run if the 0.7E/0.8E diagnostics or screenshot packet names a new measured
Riverside blocker.

## Permanent Gates

- Build/typecheck/test gate.
- ChatGPT app gate: concise `structuredContent`, large scenes in `_meta`.
- Map-first gate: no dashboard shell.
- Honesty gate: no fake playable counties.
- Provider boundary gate: no provider leakage into renderer.
- Visual grammar gate: no props or labels hiding weak art.
- Mobile gate: 390x844 proof for product-surface changes.
- Scope gate: no live paid, persistence, XP, evidence, OAuth, automation,
  reports, or exports unless reopened with a named slice and explicit gates.
