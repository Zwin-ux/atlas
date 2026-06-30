# Atlas USA Engine Architecture

## North Star

Atlas V1 should render and reason over the United States as a map engine, not as one hand-authored demo county.

The first playable proof is Riverside/Eastvale. The product should be built so every supported US county can eventually become a beautiful, explorable city map.

## Product Shape

Atlas should scale through nested map scopes:

- country: United States
- state
- county
- city or district
- place
- lot or building, where available

The app should never expose raw provider payloads to the renderer. Providers feed backend adapters. Backend adapters produce normalized signals. Core services compile those signals into `VoxelScene` and `CityWorldScene`.

## Engine Pipeline

```txt
Provider APIs / curated packs
  ->
GeoDataAdapter
  ->
NationalGeoIndex
  ->
CountyWorldBuilder
  ->
DistrictSceneCompiler
  ->
CityWorldScene
  ->
Pixi CityWorldRenderer
```

## Backend Responsibilities

The backend should own:

- provider credentials
- provider quota/rate limiting
- provider field masks
- place attribution and source notes
- cache and TTL policy
- normalized county/state/place identifiers
- world graph generation
- derived signals
- persistence when Hosted Clawd starts

The frontend should own:

- Pixi rendering
- camera and pointer interaction
- local session stickers and notes in Alpha
- small HUD overlays
- model-context updates when the selected map state matters

## API Boundary

The durable backend API should be contract-first:

- `GET /api/geo/status`
- `GET /api/geo/geocode?query=...`
- `GET /api/world/us/states`
- `GET /api/world/us/states/:stateCode/counties`
- `GET /api/world/counties/:countySlug`
- `GET /api/world/counties/:countySlug/districts/:districtSlug`
- `POST /api/world/compile-city-scene`
- `POST /api/scout/drop`
- `POST /api/campaign/preview`

Alpha can keep most of this unimplemented, but the route shape should guide service boundaries.

## Core Packages To Add Later

- `packages/world`: normalized US/state/county/district/place graph contracts.
- `packages/providers`: provider-specific adapters after `packages/geo` becomes too crowded.
- `packages/cache`: TTL/cache key policy for provider-derived data.
- `packages/persistence`: Hosted Clawd storage contracts once DB choice is locked.

Do not add these packages until there is a real slice that needs them.

## Provider Strategy

Google Maps Platform is the first real provider lane:

- Geocoding API for resolving addresses, cities, counties, and coordinates.
- Places API (New) for known places and categories.
- Places Aggregate API for counts and density signals.

Later candidates:

- Census data for demographic and boundary context.
- OpenStreetMap-derived sources for roads, parks, waterways, and civic geometry.
- County/city open data portals for parcels, zoning, permits, or civic assets.

All providers must stay behind adapters. Atlas renders its own world.

## MCP / Tooling Strategy

Current required MCP server:

- Atlas Apps SDK MCP server in `server/src/index.ts`.

Useful MCP/tooling lanes when the project reaches them:

- OpenAI Developers plugin for Apps SDK submission and API-key flows.
- Railway CLI or Railway MCP if available for deploy/log/env verification.
- Database MCP only after Hosted Clawd storage is selected.
- GitHub MCP for issues/PRs once repo workflow needs remote coordination.

Do not install random MCP servers just because they exist. Add tools only when they remove a real bottleneck in deploy, provider setup, database inspection, or submission review.

## Scaling Rules

- Renderer consumes `CityWorldScene`, never raw provider data.
- `CityWorldScene` should stay bounded to the current playable district/city slice.
- USA-scale support is a world index and API concern first, not a giant rendered canvas.
- Cache provider-derived data by normalized location and provider query intent.
- Store source notes and TTL with every derived signal.
- Keep privacy and safety public/business-oriented; do not build individual-level targeting.
- Prefer progressive loading: country -> state -> county -> district -> place.

## Near-Term Work

E8.0 has started the USA engine API foundation with curated Riverside-backed world routes and normalized country/state/county/district/place contracts.

The next backend pass is E8.1 Provider Category Map + County Lookup Adapter:

- provider-independent place categories
- Google Places type mapping behind adapters
- county/city/district lookup contracts
- cache key, TTL, attribution, and source-note behavior for provider-derived data
- Railway smoke checks for status/geocode/world routes

E7.2 should keep improving the renderer asset pipeline when the active priority returns to visual quality.
