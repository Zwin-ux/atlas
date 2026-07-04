# Post-Alpha 0.42E - Provider Lookup Runtime Boundary Proof

## Status

Local green. Executed against `http://127.0.0.1:8787`.

## Scope Decision

Do not increase scope.

0.42E proves the 0.41E provider boundary through local runtime calls. It did
not add live provider normalization, provider-created geometry, DB, public
Anaheim/Ontario, new MCP tools, renderer/UI work, or paid scope.

## Goal

Start the local server and prove that REST and MCP lookup paths both preserve
the sanitized provider boundary:

- `lookup_world_places` returns Atlas-normalized `structuredContent`.
- visible place ids are Atlas-owned `lookup-*` ids.
- no provider `placeId`, `primaryType`, raw `types`, photos, phone, website,
  rating, reviews, price level, opening hours, or raw payload appear in
  `structuredContent`.
- provider readiness keeps coverage promotion, scene eligibility, scene
  geometry, public quality, and raw payload exposure false.
- Orange remains an L1 shell after lookup.
- coverage totals do not change.
- repeated lookup proves runtime cache behavior without persistence claims.

## Primary Runtime Verifier

`scripts/verify-world-lookup-boundary.mjs`

This verifier already exercises:

- REST `/api/world/lookup`;
- MCP `lookup_world_places`;
- REST and MCP cache hit behavior;
- Orange shell after lookup;
- before/after coverage totals.

## Prepared Artifact

`artifacts/provider-runtime-boundary/postalpha-0.42e-runtime-proof-plan.json`

## Runtime Evidence

- Local server: `http://127.0.0.1:8787`.
- `pnpm build:starter` passed.
- `pnpm verify:preview:http` passed for `/preview`.
- `node scripts\verify-world-lookup-boundary.mjs` passed.
- REST lookup returned 5 mock Atlas-normalized places.
- REST lookup proved cache miss then hit with
  `lookup:eastvale-ca:3390:mock`.
- MCP `lookup_world_places` passed the same sanitized boundary and proved a
  cached repeat lookup.
- Orange remained `L1_COUNTY_SHELL` after lookup.
- Coverage totals remained 1 playable county, 0 provider-normalized counties,
  and 0 public-quality counties.
- `pnpm verify:mcp` passed with the seven Alpha tools unchanged.
- `pnpm verify:submission` passed.
- `node scripts\verify-provider-normalization-preflight.mjs --json-only`
  passed.
- `node scripts\verify-provider-boundaries.mjs --json-only` passed.
- `node scripts\verify-tool-result-shape.mjs --json-only` passed.
- `node scripts\verify-no-google-in-renderer.mjs --json-only` passed.
- `node scripts\verify-atlas-source-of-truth-drift.mjs --json-only` passed.
- Strict `engine-beta-data` split guard passed with 0 blockers and 0 unknowns.

## Anti-Scope

- No provider-created geometry.
- No public Anaheim/Ontario exposure.
- No DB persistence or migrations.
- No new MCP tools.
- No paid, Stripe, OAuth, or Hosted Clawd.
- No renderer/UI changes.
- No readiness promotion from lookup.
- No `CityWorldScene` geometry from provider lookup.
