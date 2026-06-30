# Atlas Engineering Route

## The Tame Build

The dangerous version is a full 3D voxel simulator connected to live Google Maps. Do not build that first.

The buildable version is:

- curated county JSON
- deterministic mock geo adapter
- PixiJS 2.5D voxel scene
- MCP tools
- one geo-grounded playable county slice
- Google Maps integration later behind an adapter
- USA-scale world indexing through contracts before broad rendering

## Architecture

```txt
Apps SDK / ChatGPT
  ->
MCP ToolRegistry
  ->
Core Services
  ->
CountyPackService + GeoDataAdapter
  ->
NationalGeoIndex + CountyWorldBuilder
  ->
ScoutDropService + CampaignEngineService
  ->
VoxelScene + VoxelWorld contracts
  ->
PixiJS City World Renderer
```

## Phases

### Phase A: Product Rails

Docs, prompts, issue templates, asset prompts.

### Phase B: Skeleton

TypeScript monorepo, pnpm, Vite/React widget, server package, core package.

### Phase C: County Packs

Riverside Alpha pack and schema.

### Phase D: Voxel Renderer

PixiJS scene that renders `VoxelScene`. No Google Maps.

### Phase E: MCP Tools

Current exposed Alpha surface:

- `select_county`
- `ask_county_question`
- `render_voxel_county`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

Future tools such as county Q&A, saved campaign generation, evidence, and XP require their service layers first.

### Phase E6.6: Voxel City World Map

The primary UI opens as a map-first county hub, not a campaign report. The renderer supports a scalable world model, playable districts, known places, session-only stickers, session-only notes, ambient activity, pan/zoom, and SVG fallback.

### Phase F: Google Maps Adapter

Geocoding, Places Nearby, and Places Aggregate through `GeoDataAdapter`. Mock remains default in tests.

### Phase F2: USA Engine API Foundation

Normalize country, state, county, district, and place identity so future backend APIs can add more US geography without changing the renderer contract. The renderer should compile one playable district/city slice at a time; the backend owns world lookup, provider data, cache policy, source notes, and TTL.

### Phase G: Hosted Clawd

Auth, DB persistence, subscription, saved campaigns, evidence, XP.

## Rule

Each phase must produce one visible, demonstrable result.
