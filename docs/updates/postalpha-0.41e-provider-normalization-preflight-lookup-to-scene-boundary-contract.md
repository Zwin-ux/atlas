# Post-Alpha 0.41E - Provider Normalization Preflight / Lookup-to-Scene Boundary Contract

## Status

Local green.

## Purpose

Provider lookup is useful source context, but it must not become scene geometry,
coverage readiness, public playable claims, persistence, or paid scope. 0.41E
turns that boundary into typed code and verifiers.

## What Changed

- Added `packages/geo/src/ProviderNormalization.ts`.
- Centralized the Google Nearby Search field mask in `@atlas/geo`.
- Blocked wildcard Google field masks and broad fields such as photos, phone,
  website, rating, reviews, price level, and opening hours.
- Removed provider place IDs from `lookup_world_places` model-visible
  `structuredContent`.
- Added Atlas-owned `lookup-*` IDs for lookup place summaries.
- Extended provider readiness with hard-false geometry/readiness/public-quality
  flags and `structuredContentPolicy: "atlas_normalized_only"`.
- Added `scripts/verify-provider-normalization-preflight.mjs`.

## Boundary

Provider lookup may normalize place categories and source notes. It may not:

- create `CityWorldScene` geometry;
- promote a county or district readiness tier;
- expose raw Google/provider fields in `structuredContent`;
- create public Anaheim/Ontario exposure;
- add persistence, DB, paid scope, or new MCP tools.

## Next

`0.42E Provider Lookup Runtime Boundary Proof`.
