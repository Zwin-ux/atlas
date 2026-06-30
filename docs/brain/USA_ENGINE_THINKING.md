# USA Engine Thinking

## Current Read

Atlas is now two connected engines:

- The visible product is a full-screen Pixi city map with tiny React HUD overlays.
- The service foundation is a USA-scale world API that progressively loads country, state, county, district, and place contracts.

The Riverside/Eastvale map is the first playable proof. It should not become a dead-end hand-authored demo. Every renderer and backend decision should make the next county easier, not harder.

## Non-Negotiables

- Do not render the whole USA as one giant canvas.
- Do not send raw Google/provider payloads to Pixi or React.
- Do not bring back the dashboard, campaign report wall, side panel, or card-shell map.
- Do not install extra MCP servers or dependencies until a concrete bottleneck requires them.
- Keep Railway as the live backend lane.
- Keep session stickers and notes local until Hosted Clawd storage is the active quest.

## Product Direction

The first user experience should be:

1. Open Atlas.
2. Land directly inside a lively city map.
3. Move around, zoom, hover, and click recognizable places.
4. Drop a pin or sticker and write a short note.
5. Feel like this city can expand to their real county, then to more of the country.

The map should feel collected, explorable, and personal. It should not feel like a marketing dashboard, tactical command center, CRM, or campaign generator.

## Engine Direction

The durable pipeline is:

```txt
Provider APIs / curated packs
  -> GeoDataAdapter
  -> normalized world identity
  -> county and district world services
  -> VoxelScene
  -> CityWorldScene
  -> Pixi CityWorldRenderer
```

The backend owns provider credentials, quota, field masks, attribution, source notes, cache keys, TTLs, and normalized geography. The frontend owns camera feel, rendering, local session interactions, and lightweight HUD state.

## Current State

E7.0 and E7.1 proved the map-first product surface:

- full-screen Pixi canvas
- drag, wheel zoom, pinch zoom
- hover, place click, sticker drop, note save
- dense Eastvale city slice
- no visible campaign/report/dashboard framing

E8.0 added the first USA engine API scaffold:

- `GET /api/world/us/states`
- `GET /api/world/us/states/:stateCode/counties`
- `GET /api/world/counties/:countySlug`
- `GET /api/world/counties/:countySlug/districts/:districtSlug`

The E8.0 implementation is curated-data backed. That is correct for the scaffold. The next backend move is provider normalization, not a visual rewrite.

## Next Best Move

Prioritize E8.1 next: Provider Category Map + County Lookup Adapter.

Reason: the product already has an accepted Alpha city map. The biggest V1 risk is whether the backend can turn real locations into normalized world data without leaking provider shape into the renderer. E8.1 attacks that risk while preserving the current map-first UI.

E7.2 Sprite Atlas Readiness remains valuable, but it is the parallel visual lane. Do it after E8.1 or when the next goal is explicitly visual quality.

## E8.1 Shape

E8.1 should add:

- provider-independent `WorldPlaceCategory` values
- Google Places type to Atlas category mapping
- county/city/district lookup contracts behind `GeoDataAdapter`
- source-note and TTL behavior for provider-derived place summaries
- tests proving provider data normalizes before reaching world contracts

It should not add:

- persistence
- auth
- Stripe
- a national canvas
- new dashboard UI
- renderer dependency on Google response shapes

## QA Gates

Minimum checks for E8.1:

- `pnpm test:core`
- `pnpm --dir packages/geo typecheck`
- `pnpm --dir packages/core typecheck`
- `pnpm typecheck:starter`
- `pnpm build:server`
- Local route smoke for the existing world API routes
- Google adapter smoke only when the key is present in ignored env or Railway, never committed
