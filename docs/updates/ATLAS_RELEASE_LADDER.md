# Atlas Release Ladder

Atlas updates are named, gated slices. No worker should claim they are
"improving Atlas" without a player-facing promise, engineering promise, and
proof packet.

## Current Update

### Post-Alpha 0.72B - Redis Scene Packet Cache / Job Spine

Player-facing promise: Atlas can prepare generated draft scene packets for
indexed shell counties without making map pan/zoom depend on Railway or
claiming those drafts are public playable local truth.

Engineering promise: Move generated draft packet work onto a memory-or-Redis
cache spine with compile locks, queued-safe metadata, a worker entrypoint, safe
status/readiness output, request IDs, structured backend logs, and first-pass
rate limits.

Spec:
Use `postalpha-0.71h-scene-packet-service-boundary` as the input update. Keep
`server/src/scenePacketMemoryAdapter.ts`, `server/src/scenePacketWorker.ts`,
`server/src/index.ts`, `.env.example`, `package.json`,
`scripts/verify-production-backend-spine.mjs`,
`docs/REDIS_SCENE_PACKET_BACKEND_0.72B.md`,
`scripts/verify-generated-draft-scene-packet.mjs`,
`scripts/verify-atlas-source-of-truth-drift.mjs`, and strict
`national-generation-contract` split mode as the 0.72B guard.

Status:
Local green. Branch `codex/integrate-hosted-clawd-fable-058e` is the local
canonical candidate. Decision is `REDIS_PACKET_SPINE_NOT_RENDER_LOOP`;
selected axis is `backend_production_spine`. Local/dev falls back to memory.
Railway production requires Redis for generated draft packet cache/job
readiness. Lock contention returns queued-safe `_meta.generatedDraftPacket`
metadata with no scene payload. Existing MCP tools can explicitly request
`_meta.generatedDraftScene` / `_meta.generatedDraftPacket`;
`structuredContent` remains the coverage summary. The status and ready routes
expose safe summaries/booleans only. Railway/server may compile/cache packets,
but Railway is not in the frame loop. Live public paid launch, scene packet DB
persistence, evidence, XP, reports, exports, automation, public
Anaheim/Ontario, provider geometry, dashboard shells, all-US playable claims,
browser HTTP generated-scene routes, and new public MCP tools remain closed.
Proof is captured in
`artifacts/national-generation/0.72b/production-backend-spine.json`.

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

### Post-Alpha 0.72H - Fable Generated Draft Visual Quality Gate

Next named quest: `0.72H Fable Generated Draft Visual Quality Gate`.

Use the 0.72B packet path to judge generated draft visuals. Add measurable
quality gates for silhouettes, object grammar, density, material discipline,
contact shadows, and desktop/mobile proof. Do not add service routes,
persistence, money, provider geometry, public promotion, or new public MCP
tools.

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
