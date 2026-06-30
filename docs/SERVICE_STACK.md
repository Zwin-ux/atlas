# Atlas Service Stack

## Product surface

- ChatGPT Apps SDK / MCP server
- React widget rendered in ChatGPT
- Web dashboard later

## V1 backend direction

- USA-scale world index
- state/county/district/place lookup APIs
- provider adapters behind server-only credentials
- derived-signal cache with TTL/source notes
- `VoxelScene` and `CityWorldScene` compilers as the renderer boundary

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

Google is a data provider, not the rendered Atlas map. The server converts Google responses into normalized world/place signals before the renderer sees anything.

## Non-Google fallback later

- MapLibre or Leaflet for open map previews
- OpenStreetMap-based county/reference maps
- deck.gl for heavy data visualization overlays later
