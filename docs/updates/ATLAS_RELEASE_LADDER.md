# Atlas Release Ladder

Atlas updates are named, gated slices. No worker should claim they are
"improving Atlas" without a player-facing promise, engineering promise, and
proof packet.

## Current Update

### Post-Alpha 0.38E - Engine Quality Axis Review / Next Target Selection

Player-facing promise: Atlas stops repeating commerce polish and chooses the
next public engine-quality target from measured evidence.

Engineering promise: `scripts/select-engine-quality-axis.mjs` reads the 0.37E
manifest, structural diagnostics, object-kit metrics, mobile LOD budget,
screenshot evidence, and Anaheim readiness blockers, then emits one next quest
with blocked alternatives.

Spec:
Use `scripts/select-engine-quality-axis.mjs`,
`artifacts/current-update.json`, and
`artifacts/engine-quality-axis/postalpha-0.38e-next-target-selection.json` as
the 0.38E gate.

Status:
Local green. Selector recommends `0.39E Public Object Identity / Civic-Service
Read Pass`. DB persistence remains planning-only from 0.33E and is not approved
for implementation.

## Next Updates

### Post-Alpha 0.39E - Public Object Identity / Civic-Service Read Pass

Implement the selected public object-identity target. Focus on Eastvale Core
civic landmark and service/gym readability. Use object-kit metadata and
renderer/compiler grammar to make the public map read less generic without
cars, humans, props, labels, panels, or public Anaheim/Ontario exposure.

### Post-Alpha 0.40E - Provider Normalization Preflight

Define the smallest source-normalization gate that lets provider lookup enrich
source context without creating geometry, readiness, or playable claims.

### Post-Alpha 0.41E - Controlled Anaheim Public Playable Spike

Only run if the owner-gate cutline reports `APPROVE_CONTROLLED_PUBLIC_SPIKE`.
Anaheim is the default candidate; Ontario remains a hidden control. Keep the
seven-tool MCP surface stable and do not expose a public Anaheim switcher state
until desktop, mobile, visual, product, split, and provider gates pass.

### Post-Alpha 0.42E - Public Entry And County State Compression

Compress the public map/switcher/tray entry surface if mobile or app-review
screenshots show the Alpha loop still reads too dense.

### Post-Alpha 0.43E - Shell Honesty Update

Make shells, hidden drafts, unsupported states, and playable counties impossible
to confuse.

### Post-Alpha 0.44E - Riverside Quality Correction

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
