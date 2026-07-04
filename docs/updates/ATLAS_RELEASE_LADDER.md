# Atlas Release Ladder

Atlas updates are named, gated slices. No worker should claim they are
"improving Atlas" without a player-facing promise, engineering promise, and
proof packet.

## Current Update

### Post-Alpha 0.45E - Owner Gate Cutline / Next Axis Selection

Player-facing promise: Atlas turns hidden Anaheim evidence into a clear owner
review decision without exposing Anaheim publicly.

Engineering promise: The selector reads the 0.44E visual packet, product proof,
readiness aggregate, and owner cutline, then chooses one next axis with blocked
alternatives.

Spec:
Use `scripts/select-second-district-owner-gate-next-axis.mjs` and
`artifacts/second-district-readiness/latest/anaheim-candidate/postalpha-0.45e-owner-gate-next-axis.json`
as the 0.45E gate.

Status:
Local green. The selector chose `owner_gate_review`, decision
`REQUEST_OWNER_REVIEW`, and recommended `0.46E Owner Gate Review Packet`.
Controlled public Anaheim remains blocked.

## Active Product Submission Track

Human-directed (2026-07-03). The live track is the product/app-quality path to a submittable
ChatGPT app — see `docs/PRODUCT_SPEC_AND_GATES.md` (gates G1–G7). Slices: `0.46P` in-widget result
surface (done + proven), `0.47P` widget polish, `0.48P` design ultra-pass (Fable supermove),
`0.49P` reliability sweep, `0.50P` submission packet. The owner-gate updates below are parked and
kept honest (`artifacts/current-update.json` stays `0.45E`; Anaheim/Ontario stay hidden).

## Next Updates

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
- Scope gate: no paid, persistence, XP, evidence, OAuth, automation, reports, or exports unless reopened.
