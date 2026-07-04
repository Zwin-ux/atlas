# Atlas Voxel Visual Bar

This is the visual bar for E7.6 and later map-quality work. The current flat
prototype is useful for interactions, but it is not the target look.

Primary references:

- `assets/reference/atlas-voxel-town-north-star.png`
- `assets/reference/atlas-voxel-map-tile-marker-kit.png`

## Target Feel

Atlas should look like a dense, inspectable voxel town, not a soft low-poly
board. The user should want to zoom, pan, click buildings, and drop Clawd
because the world itself feels alive.

The closest target language:

- Minecraft-like block construction.
- Isometric 2:1 tile readability.
- Warm daylight, strong shadows, high color clarity.
- Detailed town modules: houses, apartments, plaza, office, warehouse, gym,
  freeway, downtown cluster, park, civic building.
- Clear map overlays for scout drops, local events, saved notes, community
  places, and Clawd finds.
- Clear map markers: scout drop, event nearby, saved note, favorite place,
  community stop, quest available, and Clawd find.

## What Is Wrong With The Current Prototype

- Too much empty green plane.
- Buildings are too small and too primitive.
- Terrain reads flat instead of block-stacked.
- Water, roads, parks, and lots do not have enough edge detail.
- Clawd reads as a marker, not a companion.
- Pins and notes work, but they do not yet feel like a polished map-marker
  system.

## E7.6 Implementation Rules

- Keep the app map-first. Do not add a dashboard shell, landing page, or feature
  card UI.
- Preserve the current interactions: pan, zoom, place select, sticker drop,
  note save.
- Use the existing renderer contract. If new fields are needed, keep them
  authored and bounded inside `CityWorldScene`.
- Prefer a dense authored demo slice over broad procedural filler.
- Make every tile category visually distinct at glance distance.
- Use small block details instead of smooth gradients or generic rectangles.
- Use marker colors consistently:
  - green: parks, homes, and community places
  - blue: scout drops, roads, water, and active map movement
  - coral: events and active local moments
  - purple: saved notes and favorite finds
  - gold: Clawd focus, selected places, and special local stops
- React overlays should stay small. The world carries the product.

## Acceptance

The E7.6 handoff must include:

- Desktop screenshot.
- Mobile 390x844 screenshot.
- The reference image path used for comparison.
- A blunt self-rating out of 10 against the reference.
- A list of what still looks weak.
- Browser QA proof for nonblank canvas, no horizontal overflow, place select,
  sticker drop, and note save.

Do not call a visual pass accepted just because typecheck passes. If it does not
look materially closer to the references, it is not done.
