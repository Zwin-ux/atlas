# Atlas Service Stack

## Product surface

- ChatGPT Apps SDK / MCP server
- React widget rendered in ChatGPT
- Web dashboard later

## Renderer

Recommended Alpha renderer: **PixiJS**.

Reason:
PixiJS is a fast 2D renderer that gives us sprite layers, glows, map panning, and Clawd movement without the complexity of full Three.js.

Fallback:
SVG/Canvas renderer if PixiJS feels heavy.

Do not use Three.js in Alpha.

## App stack

- TypeScript
- pnpm workspaces
- Vite for widget
- React
- PixiJS for map scene
- Zod for tool/data schemas
- Node MCP server
- Drizzle or Prisma later for DB
- Vitest for core invariant tests only

## Google Maps Platform later

- Geocoding API: resolve addresses/cities
- Places Nearby Search: nearby businesses by type
- Places Aggregate API: counts/competition/location scoring
- Maps Datasets API: custom GeoJSON/CSV/KML layers later
- WebGLOverlayView + Three.js: future experimental georeferenced 3D overlay

## Non-Google fallback later

- MapLibre or Leaflet for open map previews
- OpenStreetMap-based county/reference maps
- deck.gl for heavy data visualization overlays later
