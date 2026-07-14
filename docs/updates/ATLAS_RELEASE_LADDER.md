# Atlas Release Ladder

Atlas updates are named, gated slices. No worker should claim they are
"improving Atlas" without a player-facing promise, engineering promise, and
proof packet.

## Current Update

### Post-Alpha 0.78-1V - Census County Board Product + Certification Gate

Player-facing promise: Atlas can show a county's real U.S. Census boundary and
water without implying that streets, places, buildings, or playable local
coverage are present.

Engineering promise: Certify the flag-gated Census board in a
production-fidelity browser matrix while keeping the default flag-off
experience unchanged.

Spec:
Compile the baked U.S. Census boundary-and-water pack only behind
`?atlasGeoBoard=1`. Identify the county and source, state that streets and
places are not mapped, hide controls that imply real anchors, and fit the full
projected terrain/water silhouette on desktop and mobile. Keep the seven-tool
MCP surface unchanged.

Status:
Local green; owner review passed and release preparation authorized on
2026-07-13. The coherent release commit, deploy execution, and post-deploy G8
remain pending. Branch
`codex/integrate-hosted-clawd-fable-058e` is the local canonical candidate.
Decision is `CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE`; selected axis
is `real_geography_promotion_readiness`. The 12-cell desktop/mobile,
light/dark matrix passes with full silhouette framing. Default enablement,
production deploy, town detail, national bake, provider geometry, public
playable promotion, new public MCP tools, and public paid claims remain closed.
Proof is captured in `artifacts/emulator/audit/0.78-1v/`; owner approval is
recorded in `artifacts/council/OWNER_APPROVAL_0781V_2026-07-13.md`.

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

### Post-Alpha 0.78-2 - Real Town Anchors

Next named quest: `0.78-2 Real Town Anchors`, only after owner screenshot
review and a separate production deploy decision.

Wire named town anchors to the certified board without turning provider lookup
into geometry or claiming nationwide playable coverage. Do not begin this
slice while any 0.78-1V owner gate is pending.

### Post-Alpha 0.72H - Fable Generated Draft Visual Quality Gate

Queued graphics gate. It does not expand the 0.78-1V packet or bypass its
owner review.

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
