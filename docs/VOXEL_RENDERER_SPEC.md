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
  clawd: ClawdRenderState;
  panel: ScoutReportPanel | CampaignPreviewPanel | UpgradePanel;
};
```

## Visual tone

- lighter map, not muddy dark
- bright county board
- dark UI panels around the map
- readable nodes and markers
- playful but useful
- no generic SaaS

## Required Alpha visuals

- county tile board
- Eastvale marker
- Clawd sprite placeholder
- scout route line
- green opportunity marker
- orange risk marker
- blue scouted marker
- right-side Scout Report panel
- bottom flow rail

## Current E4.5 behavior

- Pixi owns only the map stage; React still owns the report panel and flow rail.
- SVG fallback renders if Pixi cannot mount or scene validation fails.
- Desktop uses full node labels and visual objects without object-label clutter.
- Compact/mobile maps keep the focused node readable and avoid horizontal overflow.
- Apps SDK tools return compact summaries in `structuredContent` and pass full `VoxelScene` payloads through `_meta`.
