# Voxel County View Spec

## Goal

Create a beautiful isometric voxel county interface that feels like a local intelligence game board.

## Alpha implementation

Do not build a full 3D engine.

Use:
- React
- SVG or Canvas
- Isometric tile layout
- Map nodes and edges from county pack
- Clawd sprite/icon
- Right-side insight panel
- Bottom workflow rail

Avoid:
- Three.js in Alpha
- Real 1:1 map geometry
- Complex camera controls
- Heavy animation

## Visual grammar

Green = high opportunity  
Yellow = medium opportunity  
Red = risk/competition  
Blue = scouted  
Purple = paid/advanced insight  
White path = Clawd route  
Orange pin = selected drop location

## Objects

- Homes: residential demand
- Plazas: foot traffic / partnerships
- Warehouses: B2B outreach
- Roads/freeways: route access
- Clipboard: campaign quest
- Paw icon: Clawd scout point
- XP crate: evidence/progress reward

## Widget states

1. County Explorer
2. Scout Drop
3. Scout Report
4. Campaign Preview
5. Host Clawd Upgrade
