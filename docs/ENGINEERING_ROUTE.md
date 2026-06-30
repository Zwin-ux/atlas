# Atlas Engineering Route

## The Tame Build

The dangerous version is a full 3D voxel simulator connected to live Google Maps. Do not build that first.

The buildable version is:

- curated county JSON
- deterministic mock geo adapter
- PixiJS 2.5D voxel scene
- MCP tools
- one demo business use case
- Google Maps integration later behind an adapter

## Architecture

```txt
Apps SDK / ChatGPT
  ->
MCP ToolRegistry
  ->
Core Services
  ->
CountyPackService + MockGeoDataAdapter
  ->
ScoutDropService
  ->
CampaignEngineService
  ->
VoxelSceneCompiler
  ->
PixiJS Widget Renderer
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

- `render_voxel_county`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

Future tools such as county Q&A, saved campaign generation, evidence, and XP require their service layers first.

### Phase F: Google Maps Adapter

Geocoding, Places Nearby, and Places Aggregate through `GeoDataAdapter`. Mock remains default in tests.

### Phase G: Hosted Clawd

Auth, DB persistence, subscription, saved campaigns, evidence, XP.

## Rule

Each phase must produce one visible, demonstrable result.
