# Voxel Environment Course

Date: 2026-06-30

Purpose: reset Atlas map work around a high-quality full-screen voxel city map,
not a web app frame with a map card inside it.

## North Star

The user opens the ChatGPT app and immediately sees a polished voxel map of their
city. The map is the product. It should invite dragging, zooming, clicking places,
collecting stickers, and writing small notes.

The experience should feel closer to a cozy life-sim city toy than a campaign
console. React should not dominate the screen. React may host minimal HUD controls,
but Pixi should own the map experience.

## References Studied

Technical:

- PixiJS Performance Tips: https://pixijs.com/8.x/guides/concepts/performance-tips
- PixiJS Container: https://pixijs.com/8.x/guides/components/scene-objects/container
- PixiJS Render Groups: https://pixijs.com/8.x/guides/concepts/render-groups
- Pixi Tilemap: https://github.com/pixijs-userland/tilemap
- Tiled Layers: https://doc.mapeditor.org/en/stable/manual/layers/
- Tiled Objects: https://doc.mapeditor.org/en/stable/manual/objects/
- Tiled Templates: https://doc.mapeditor.org/en/stable/manual/using-templates/
- MagicaVoxel home: https://ephtracy.github.io/

Product feel:

- Pokemon Pokopia Nintendo listing: https://www.nintendo.com/us/store/products/pokemon-pokopia-switch-2/
- The Sims 4 home and Build Mode framing: https://www.ea.com/games/the-sims/the-sims-4
- The Sims 4 Neighborhood Stories: https://www.ea.com/games/the-sims/the-sims-4/news/neighborhood-stories-system
- Animal Crossing Happy Home Paradise: https://animalcrossing.nintendo.com/new-horizons/happy-home-paradise/

Repo-local:

- `docs/VOXEL_MAP_SPEC.md`
- `docs/VOXEL_RENDERER_SPEC.md`
- `assets/prompts/RENDERER_STYLE.md`
- `assets/prompts/VOXEL_TILE_PROMPTS.md`
- `plugins/atlas-daemon/skills/atlas-voxel-map/SKILL.md`
- `plugins/atlas-daemon/skills/atlas-voxel-renderer/SKILL.md`
- `plugins/atlas-daemon/skills/atlas-deslop/SKILL.md`

## What I Got Wrong

- I treated "map first" as a layout hierarchy: header, map frame, side inspector,
  flow rail. That still reads as a web template.
- I tried to improve a sparse board instead of designing a real city composition.
- I let old Scout/campaign concepts leak into visible map language and labels.
- I used React panels for interactions that should feel like map-native controls.
- I optimized around contracts before making the first visual impression strong.

## Course Notes

### 1. Camera And Surface

The map must fill the iframe. No outer card, no app shell, no bordered map frame.

Camera rules:

- Start centered on the playable local district, not on an abstract county board.
- Default zoom should show a dense, interesting city slice immediately.
- Dragging should feel like moving across a toy city.
- Zoom controls are HUD overlays, not layout elements.
- Selection should adjust camera subtly, never snap violently.

Acceptance:

- At 1280x900, the first screen is mostly city, not blank terrain.
- At mobile width, the selected district remains centered and interactive.
- No topbar, side inspector, bottom flow rail, or report wall is visible.

### 2. City Composition

The map needs authored city grammar before it needs more UI.

Minimum visible ingredients:

- Roads with intersections and visual continuity.
- Dense blocks of homes with roof variation.
- Shops/plazas with storefront silhouettes.
- A park pocket with trees, paths, and a soft activity cluster.
- One landmark that anchors the district.
- Tiny cars and residents for life.
- Place pins integrated into the world, not floating business labels everywhere.
- Stickers that read as collectibles placed on real places.

Composition rules:

- Use contrast in block sizes: small homes, medium shops, larger landmark.
- Keep roads as readable gray ribbons through the city.
- Use trees and parks to break the grid.
- Keep labels sparse. Label selected/hovered/important places, not every object.
- Make the silhouette charming before adding data.

### 3. Rendering Architecture

Pixi should be organized like a small scene engine:

- `cameraLayer`: owns pan/zoom transform.
- `terrainLayer`: tile or chunk background.
- `roadLayer`: roads, intersections, lane marks, small vehicles.
- `buildingLayer`: homes, shops, landmarks, props.
- `ambientLayer`: residents, car movement, time-of-day hints.
- `placeLayer`: hit targets, hover/select rings, sparse labels.
- `stickerLayer`: user session collectibles.
- `hudLayer`: optional if HUD is rendered in Pixi; otherwise React overlays.

PixiJS notes:

- Use spritesheets/texture atlases when assets stabilize.
- Use Graphics for early authored primitives, but cache static chunks or convert
  repeated pieces to textures.
- Keep text changes out of the frame loop.
- Use hit areas for place interactions.
- Disable interaction crawling on noninteractive layers.
- Use render groups sparingly for world and HUD separation.

Tiled notes:

- Think in layers: tile layers for repeated ground, object layers for places and
  authored props.
- Use object templates as the mental model for repeatable place/building props.
- Store places as freely positioned object data with custom properties, not as
  hardcoded label math.

### 4. Data Model Shift

`VoxelScene` is still the contract, but it needs a richer visual compiler behind it.

Needed concepts:

- `VoxelCityBlock`: authored block region with zoning, density, palette.
- `VoxelRoadSegment`: connected roads/intersections before tile art.
- `VoxelBuildingInstance`: sprite or primitive building with footprint, height,
  roof, color, category, and linked place id when relevant.
- `VoxelPropInstance`: tree, bench, fountain, sign, car, resident.
- `VoxelPlaceAnchor`: clickable semantic place with screen label rules.
- `VoxelCameraPreset`: desktop and mobile first-view framing.

Do not feed raw Google data directly into the renderer. Google/Places data should
compile into these city objects.

### 5. Interaction Feel

First win:

1. Open app.
2. See the city.
3. Drag around.
4. Click a known place.
5. Drop a sticker.
6. Write a note.
7. See the sticker/note attached to the place.

Interaction rules:

- Hover should highlight the place in-world.
- Click should open a compact map-native tray, not a side report.
- Sticker strip should be tiny and collectible-feeling.
- Notes should be one-line or compact, not a form panel.
- Controls should be discoverable but visually subordinate to the city.

### 6. Visual Style Rules

Keep:

- Cute, readable, polished, cozy.
- Crisp outlines.
- Warm daylight.
- High density of little authored details.
- Premium toy city silhouette.
- Minimal HUD.

Cut:

- Campaign labels.
- Tactical labels.
- Signal/risk language on the map.
- Report panels.
- Flow rails.
- Generic dashboard/card layout.
- Sparse abstract board tiles.

Palette direction:

- Grass/open land: varied greens, not cream slabs.
- Roads: warm gray, with lane accents.
- Homes: cream bodies with varied green, blue, red, and yellow roofs.
- Shops: slightly larger bodies with awnings/sign-like shapes.
- Parks: richer greens, trees, paths, small activity dots.
- Landmarks: larger and more dimensional, acting as visual anchor.

### 7. Implementation Order

Do not continue polishing the current frame. Rebuild in this order:

1. Freeze the current flawed UI as reference only.
2. Introduce a map-only component boundary:
   - `VoxelSceneView` becomes a full-viewport host.
   - `PixiVoxelSceneView` owns the world.
3. Add a `VoxelCityCompiler` that turns the Riverside/Eastvale scene into dense
   render instances.
4. Build Pixi layers and camera:
   - pan/zoom
   - desktop and mobile camera presets
   - hit testing for places
5. Render city primitives:
   - roads
   - homes
   - shops
   - parks
   - landmark
   - trees/cars/residents
6. Add map-native HUD:
   - location chip
   - zoom buttons
   - sticker dock
   - selected-place tray
7. Restore sticker/note interaction on top of the new city.
8. Only then re-check Apps SDK structuredContent and docs.

### 8. Quality Gates

Before calling it done:

- Desktop screenshot reads as a city toy in the first second.
- Mobile screenshot still reads as a city, not cropped UI.
- Canvas is nonblank.
- User can drag map.
- User can zoom.
- User can click at least three places.
- User can drop sticker.
- User can save note.
- No old Scout/campaign/tactical text visible in the default map UI.
- No outer card, report panel, flow rail, or generic dashboard shell.
- SVG fallback remains readable but can be simpler than Pixi.

## Next Spec Prompt For Implementation

Implement a hard reset of the Atlas voxel map around a full-screen Pixi city map.
Do not add a page layout around it. Build the city first, then HUD.

Primary files:

- `web/src/VoxelSceneView.tsx`
- `web/src/PixiVoxelSceneView.tsx`
- `web/src/styles.css`
- `apps/widget/src/VoxelSceneView.tsx`
- `apps/widget/src/PixiVoxelSceneView.tsx`
- `apps/widget/src/styles.css`
- `packages/core/src/voxel/types.ts`
- `packages/core/src/voxel/riversideDemoScene.ts`
- new `packages/core/src/voxel/cityCompiler.ts` if needed

Anti-scope:

- No Three.js.
- No full USA map.
- No persistence/auth/Stripe.
- No live traffic.
- No tactical/campaign visible UI.
- No generic web app shell.

Verification:

- `pnpm test:core`
- `pnpm typecheck:starter`
- `pnpm --dir apps/widget typecheck`
- browser desktop/mobile screenshots with `view_image`
- direct interaction QA for drag, zoom, place select, sticker, note
