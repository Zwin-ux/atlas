# Atlas Engineering Route

## The tame build

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
  ↓
MCP ToolRegistry
  ↓
Core Services
  ↓
CountyPackService + MockGeoDataAdapter
  ↓
ScoutDropService
  ↓
CampaignEngineService
  ↓
VoxelSceneCompiler
  ↓
PixiJS Widget Renderer
```

## Phases

### Phase A — Product rails

Docs, prompts, issue templates, asset prompts.

### Phase B — Skeleton

TypeScript monorepo, pnpm, Vite/React widget, server package, core package.

### Phase C — County packs

Riverside Alpha pack and schema.

### Phase D — Voxel renderer

PixiJS scene that renders VoxelScene. No Google Maps.

### Phase E — MCP tools

select_county, render_voxel_county, preview_scout_drop, preview_campaign, get_upgrade_options.

### Phase F — Google Maps adapter

Geocoding, Places Nearby, Places Aggregate through GeoDataAdapter. Mock remains default in tests.

### Phase G — Hosted Clawd

Auth, DB persistence, subscription, saved campaigns, evidence, XP.

## Rule

Each phase must produce one visible, demonstrable result.
