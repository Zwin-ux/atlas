# Voxel World Brain

Date: 2026-06-30

Status: planning spec only. Do not implement from this file until Quest E7.0 starts.

## Target

Atlas should open directly into a full-screen, high-quality, colorful isometric
voxel city map. It should feel like a playable town/world map, not a dashboard.

React should only provide tiny HUD overlays. Pixi should own the map experience:
camera, layers, hit testing, hover states, place selection, pins, and ambient life.

Do not use the old rejected name for the experience. Use:

- voxel city map
- city world
- town map
- Eastvale city slice
- playable local map

## Reference Image Read

The uploaded Eastvale reference works because the first read is all map:

- Dense isometric town coverage fills the viewport.
- Roads create readable movement lines and intersections.
- Buildings vary by category and scale: houses, civic landmark, gym, apartments.
- Parks, trees, fountain/water, tiny cars, and walkers make the map feel alive.
- UI is small and map-native: location tag, zoom stack, sticker tools, place tray.
- Labels float near important places only; they do not become a report wall.
- The selected-place tray is compact and anchored to the map, not a page panel.

The current Atlas renderer misses the feeling when it shows sparse slabs, side
panels, flow rails, tactical labels, or campaign/report framing.

## 1. Full-Screen Canvas Architecture

The ChatGPT iframe should mount one full-viewport Pixi canvas.

Architecture:

- `CityWorldView` is the React host.
- `CityWorldRenderer` owns the Pixi app and scene graph.
- React renders only HUD controls over the canvas.
- Pixi renders the world and all map objects.
- The canvas should use `position: fixed` or full-parent absolute layout inside
  the widget root.
- No outer shell width, no centered max-width, no card border, no side panel.

Viewport rules:

- Desktop first frame: map fills 100 percent of width and height.
- Mobile first frame: map remains the background; HUD compresses, it does not
  convert into a stacked page.
- Camera presets live in data, not CSS.
- A resize observer updates Pixi renderer size and camera projection.

## 2. CityWorldRenderer Replacement

Replace the visible `VoxelSceneView` dashboard/card model with a renderer-first
component.

Proposed modules:

- `packages/core/src/voxel/cityWorldTypes.ts`
- `packages/core/src/voxel/eastvaleCityWorldScene.ts`
- `packages/core/src/voxel/cityWorldCompiler.ts`
- `web/src/CityWorldView.tsx`
- `web/src/CityWorldRenderer.tsx`
- mirrored widget files under `apps/widget/src/`

`VoxelScene` can remain for MCP compatibility, but the visible renderer should
consume a typed `CityWorldScene`.

`CityWorldScene` should include:

- `id`
- `label`
- `region`
- `cameraPresets`
- `terrainTiles`
- `roadSegments`
- `lots`
- `buildings`
- `props`
- `places`
- `pins`
- `actors`
- `ambient`
- `hudDefaults`

The renderer should not know about campaign previews, Scout reports, or model
tool flow. Those can exist behind the scenes, but not in the visible city map.

## 3. Tile Atlas And Sprite Atlas Requirements

Alpha can start with placeholder sprite primitives, but the architecture should
be atlas-ready.

The implementation brain for the next atlas pass lives in
`docs/brain/SPRITE_ATLAS_READINESS.md`. Treat this section as the product-level
direction and that file as the execution spec for E7.2.

Tile atlas:

- grass tile variants
- park grass variants
- sidewalk/paved plaza tiles
- road straight, curve, T, four-way, driveway, lane markings
- water edge and water fill
- shadow blobs for object grounding

Sprite atlas:

- small homes with 4-6 roof colors
- shop/storefront variants
- gym building
- apartment building
- civic landmark/city-hall-like building
- trees, bushes, benches, streetlights, signs
- cars in 4-6 colors and orientations
- tiny walkers
- place pin base, selected ring, hover glow, sticker badges
- Clawd idle placeholder

Atlas rules:

- Start code-generated placeholders, but make each object correspond to a future
  sprite key.
- Use Pixi `Spritesheet`/texture atlas when art lands.
- Avoid unique Graphics redraws for thousands of repeated objects once sprites
  exist.
- Keep anchor points consistent, usually bottom-center for buildings/props.
- Validate `CityWorldScene` `spriteKey` and `paletteKey` values against a typed
  manifest before future art work scales.
- Missing art must fall back to the current Pixi primitives; missing art must
  never blank the city.

## 4. Map Layers

Use a layered scene graph. This is required, not optional.

Layer order:

1. `terrainLayer`
2. `roadLayer`
3. `lotLayer`
4. `buildingLayer`
5. `propLayer`
6. `actorLayer`
7. `labelLayer`
8. `markerLayer`
9. `hudBridgeLayer`

Layer responsibilities:

- `terrainLayer`: grass, water, base grid, subtle terrain variation.
- `roadLayer`: road ribbons, intersections, lane marks, crosswalks.
- `lotLayer`: parcel footprints, plaza paving, park paths, civic plazas.
- `buildingLayer`: homes, shops, gym, apartments, civic building.
- `propLayer`: trees, benches, fountains, signs, streetlights.
- `actorLayer`: cars, walkers, Clawd if Clawd is physically in the world.
- `labelLayer`: sparse place labels, never report text.
- `markerLayer`: pins, selected rings, hover glow, stickers/drop pins.
- `hudBridgeLayer`: Pixi-side effects that align with React HUD state.

Sorting:

- Sort world objects by projected `y` each frame only when necessary.
- Static layers should be sorted once at build time.
- Dynamic actors can live in a small dynamic container.

## 5. Interaction

Required interactions:

- Drag/pan the city.
- Wheel zoom on desktop.
- Pinch zoom on mobile when feasible.
- Click/tap place.
- Hover place glow on pointer devices.
- Drop pin/sticker on selected place.

Interaction model:

- Place hit areas should be generous and invisible.
- Hover glow belongs in Pixi, not React.
- Click selection updates React HUD state.
- React HUD can call renderer methods through a small bridge.
- The selected-place tray appears as a small overlay, not a side panel.

First win:

1. User opens `/preview`.
2. User sees Eastvale as a dense city map.
3. User drags and zooms.
4. User clicks Eastvale Core, Gym, Park, or Apartments.
5. User drops a pin/sticker.
6. User sees it on the map.

## 6. Ambient Life

Ambient life should be subtle and map-native.

Cars:

- Pixi sprites or placeholder Graphics.
- Move along road splines.
- Pause/slow at intersections.
- 4-8 active cars in Alpha, not traffic simulation.

Tiny walkers:

- Pixi sprites or placeholder dots.
- Short loops around parks, plaza, gym, and civic building.
- Low speed and low count.

Water shimmer:

- Pixi sprite/mesh/filter later, simple animated alpha strips now.
- Keep it in Pixi; do not use Lottie for water.

Clouds:

- Optional slow parallax overlay in Pixi.
- Must not obscure the playable city.

Building animation:

- Subtle window shimmer, shop sign blink, selected building pulse.
- Use Pixi tweens/ticker math.
- Do not animate every building all the time.

## 7. Pixi Sprites And Tweens

Use Pixi for all map/world objects.

Pixi sprites:

- terrain atlas tiles
- road tiles or road segment sprites
- buildings
- props
- cars
- walkers
- pins/stickers
- Clawd placeholder until Rive is ready

Pixi tweens/ticker:

- camera easing
- hover glow pulse
- selected place ring
- car movement
- walker loops
- water shimmer
- cloud drift
- small building idle effects

Do not use React state for frame-by-frame animation.

## 8. Lottie Scope

Lottie is allowed only for UI-only animations.

Allowed:

- optional loading overlay
- tiny success/check animation in selected-place tray
- transition flourish for saved note or dropped pin, if it sits in HUD

Not allowed:

- cars
- water
- buildings
- walkers
- terrain
- place pins inside the map
- Clawd world animation

Map objects should be Pixi sprites/tweens so they participate in camera transforms,
hit testing, layering, and performance tuning.

## 9. Rive Scope

Rive is a later option only for Clawd state-machine animation.

Possible future Clawd states:

- idle
- walking
- inspecting
- excited
- blocked
- hosted mode

Do not introduce Rive in E7.0 unless the renderer is already solid. For now, Clawd
can be a Pixi placeholder sprite or simple animated marker.

## 10. Delete Or Park From Old UI

Delete or park from the visible default surface:

- `voxel-stage`
- `voxel-map-frame`
- `voxel-topbar`
- `voxel-world-rail`
- `voxel-report`
- `voxel-inspector`
- `voxel-flow`
- report panels as map UI
- campaign preview panel as default UI
- Scout Drop visible flow labels
- tactical/signal/risk map labels
- any visible rejected naming from the previous map pass

Keep behind contracts or non-default tools:

- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`
- concise Apps SDK `structuredContent`
- `_meta.scene` for renderer payloads

Park or adapt:

- SVG fallback can stay, but it should render a simplified city map, not a report
  layout.
- `VoxelSceneView` can become a compatibility adapter, but the default visible
  path should be `CityWorldView`.

## E7.0 Implementation Shape

Title: Replace map UI with `CityWorldRenderer`.

Requirements:

- Full-viewport Pixi canvas.
- No card shell, no topbar, no side panel, no report panel.
- React HUD only: small location tag, zoom controls, selected-place tray,
  sticker/drop button.
- Dense Eastvale city slice using placeholder sprite primitives.
- Render roads, houses, shops, park, gym, apartments, civic building, trees,
  cars, water, and labels.
- Support drag/pan, wheel/pinch zoom, click place, hover highlight.
- Use the required layered scene graph.
- Keep all data in typed `CityWorldScene`.
- No campaign flow.
- No Lottie except optional loading overlay.
- No persistence.
- No Three.js.

Acceptance:

1. Opening `/preview` shows only a full-screen voxel city map.
2. The map feels like a toy city, not a dashboard.
3. User can drag and zoom.
4. User can click Eastvale places.
5. The selected-place tray appears as a small overlay, not a card page.
6. No old campaign/report labels are visible.
7. Typecheck passes.
8. Browser screenshot shows a dense city, not blank slabs.
