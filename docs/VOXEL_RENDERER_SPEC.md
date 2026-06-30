# Voxel Renderer Spec

## Renderer decision

PixiJS is the default Alpha map-stage renderer.

The original React SVG renderer remains in the codebase as the fallback. The data contract stays the same: both renderers consume `VoxelScene`, and renderer-only detail is optional.

## Renderer input

The renderer consumes only `VoxelScene`.

```ts
type VoxelScene = {
  county: { name: string; state: string; slug: string };
  theme: "light_county";
  tiles: VoxelTile[];
  nodes: AtlasNode[];
  edges: AtlasEdge[];
  markers: AtlasMarker[];
  objects?: VoxelObject[];
  camera?: VoxelCamera;
  layers?: VoxelLayer[];
  world?: VoxelWorld;
  clawd: ClawdRenderState;
  panel: ScoutReportPanel | CampaignPreviewPanel | UpgradePanel;
};
```

## Visual tone

- lighter map, not muddy dark
- bright county board
- light place inspector around the map
- readable nodes and markers
- polished cute city/world map feel
- no generic SaaS

## Required Alpha visuals

- county tile board
- Riverside county hub
- Eastvale playable district
- known place dots and labels
- session-only sticker badges
- session-only note editor
- subtle residents/traffic/activity
- right-side place inspector
- bottom collection rail

## Current E6.6 behavior

- Pixi owns only the map stage; React still owns the report panel and flow rail.
- SVG fallback renders if Pixi cannot mount or scene validation fails.
- Desktop uses district/place labels and visual objects without object-label clutter.
- Compact/mobile maps keep the selected place readable and avoid horizontal overflow.
- Apps SDK tools return compact summaries in `structuredContent` and pass full `VoxelScene` payloads through `_meta`.
