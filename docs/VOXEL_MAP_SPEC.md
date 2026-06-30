# Voxel County View Spec

## Goal

Create a polished, cute, geo-grounded voxel county interface that feels like a playable local city/world map.

## Alpha implementation

Do not build a full 3D engine.

Use:
- React
- PixiJS with SVG fallback
- Isometric tile layout
- `country -> state -> county -> district -> place` world model
- known places from curated county data
- session-only stickers and notes
- compact place inspector
- bottom map collection rail

Avoid:
- Three.js in Alpha
- Real 1:1 map geometry
- full USA rendering in the first slice
- Heavy animation
- tactical/campaign-first visible UI

## Visual grammar

Green = homes and parks
Blue = shops and plazas
Yellow = paths, favorites, and collected stickers
Warm cream = landmarks and homes
Dark outlines = readable toy-map silhouettes

## Objects

- Homes: known residential place areas
- Plazas/shops: known errand and shop places
- Parks: soft activity pockets
- Roads/freeways: county movement hints
- Stickers: session-only map collection marks
- Notes: session-only place annotations

## Widget states

1. County hub
2. District select
3. Place inspect
4. Sticker palette
5. Note edit
6. Ambient loop
