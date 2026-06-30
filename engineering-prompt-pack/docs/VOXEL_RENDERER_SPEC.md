# Voxel Renderer Spec

## Renderer decision

Use PixiJS in Alpha if Codex can set it up cleanly.

If PixiJS integration gets messy, build a React Canvas/SVG fallback. The data contract must stay the same.

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
