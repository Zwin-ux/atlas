# Pre-Alpha 0.1E - Provider Boundary Update

## Promise

Atlas can use provider lookup without confusing it with the voxel world.

## What Changed

- `@atlas/geo` lookup results now carry provider usage policy flags and source
  confidence.
- Google lookup defaults to non-renderable, non-cacheable, and non-readiness.
- Mock lookup remains cacheable for local smoke checks, but still not readiness.
- Verifiers check renderer/provider isolation, provider defaults, and MCP tool
  result shape.
- Architecture docs define the provider boundary and the update ladder.

## What Stays Parked

- Public Anaheim/Ontario playability.
- Google-derived scene geometry.
- DB/persistence, Hosted Clawd, Stripe, XP, evidence, OAuth, automation,
  reports, and exports.

## Big 4 Packets

- Axiom: integrate 0.1E and keep the update ladder honest.
- Forge: harden provider policy and readiness-safe source verification.
- Lumen: move next to 0.2E Roads & Roofs object-kit/compiler work.
- Mira: keep lookup/shell/playable tool language human and non-internal.

## Verification

- `node scripts/verify-no-google-in-renderer.mjs`
- `node scripts/verify-provider-boundaries.mjs`
- `node scripts/verify-tool-result-shape.mjs`
- `pnpm test:core`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `pnpm verify:preview:http`
