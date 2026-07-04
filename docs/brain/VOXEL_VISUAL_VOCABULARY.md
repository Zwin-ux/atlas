# Atlas Voxel Visual Vocabulary

Use these words when directing, reviewing, or rejecting Atlas visual work. The
goal is precise language so agents know what to build and what to fix.

## Core Style Name

Atlas is a:

- isometric voxel diorama
- modular voxel tile map
- playable county miniature
- block-built town scene
- map-first toy world

Avoid calling it low-poly, generic isometric, flat board, dashboard map, or
SaaS preview. Those terms pull the work in the wrong direction.

## Projection And Camera

- `2:1 isometric`: classic diamond projection where width reads about twice
  the vertical tile height.
- `three-quarter isometric`: camera shows top plus two sides of objects.
- `diorama camera`: close, angled, inspectable view of a miniature world.
- `tilt-shift feel`: miniature-world depth and focus, without heavy blur.
- `horizon backdrop`: distant mountains, sky, sun, clouds, or water beyond the
  playable tile area.
- `readable silhouette`: each building or marker is recognizable before detail.

## Tile And World Terms

- `tile`: one isometric ground unit.
- `chunk`: a grouped set of tiles loaded/rendered together.
- `tile module`: a reusable authored scene block, such as gym, plaza, road, or
  residential house.
- `footprint`: the ground area a building occupies.
- `parcel`: a lot with one building, yard, parking, trees, signs, and paths.
- `terrain strata`: visible stacked layers on world edges.
- `voxel steps`: blocky elevation changes instead of smooth slopes.
- `shoreline steps`: sand/water blocks along the edge of water.
- `cliff face`: exposed side blocks that make height legible.
- `world edge`: visible cutaway side of the map, not an infinite flat plane.

## Asset Types

Required tile categories:

- residential house
- apartment cluster
- shopping plaza
- office
- warehouse
- gym
- freeway or road
- downtown cluster
- park or open space
- civic or public building

Supporting props:

- trees
- shrubs
- fences
- benches
- lamps
- signs
- cars
- vans
- trucks
- crosswalks
- sidewalks
- parking stripes
- fountains
- water towers
- roof HVAC boxes

Tiny props matter because they sell scale.

## Building Language

- `block-built`: made from visible cube/rectangular voxel parts.
- `extruded massing`: building height is visibly pulled up from the tile.
- `stepped roof`: roof shape uses block steps, not a flat rectangle only.
- `facade rhythm`: windows, signs, doors, trim, and awnings repeat cleanly.
- `landmark read`: a gym, plaza, office, or civic tile is instantly identifiable.
- `detail density`: enough small forms exist that the map rewards inspection.

## Roads And Lots

- `embedded roads`: roads feel carved into the town grid, not pasted on top.
- `curbs`: small edge strips that separate road from sidewalk or grass.
- `crosswalks`: readable white stripe clusters at intersections.
- `lane marks`: simple road markings that show scale and direction.
- `driveways`: small cuts from road into parcels.
- `parking lots`: asphalt tiles with parking stripes, cars, and storefront flow.
- `freeway tile`: raised or wider road module with barriers, pillars, ramps, or
  clear scale difference.

## Lighting And Color

- `warm daylight`: sunny, readable, optimistic lighting.
- `contact shadow`: shadow directly under objects grounding them.
- `cast shadow`: directional shadow that gives height.
- `ambient occlusion`: darker creases where blocks meet.
- `rim highlight`: bright edge on selected or important objects.
- `palette discipline`: clear block colors, not muddy gradients.
- `status glow`: colored map overlay that communicates scout, event, note, or
  Clawd state.

Marker colors:

- green: parks, homes, and community places
- blue: scout drops, roads, water, and active map movement
- coral: events and active local moments
- purple: saved notes and favorite finds
- gold: Clawd focus, selected places, and special local stops

## Marker And Overlay Terms

- `map pin`: floating marker anchored to a tile.
- `tile glow`: colored outline or light under a tile module.
- `status beam`: vertical light beam rising from a marker.
- `selection outline`: current selected tile edge.
- `hover lift`: subtle movement or glow when a tile is hoverable.
- `map state marker`: semantic marker that tells the user what kind of place,
  event, note, or Clawd state exists.
- `billboard label`: small readable place label sitting in world space.

Atlas markers:

- scout drop
- event nearby
- saved note
- favorite place
- community stop
- quest available
- Clawd find

## Renderer Terms

- `depth sorting`: drawing objects in back-to-front order so overlap looks right.
- `layer stack`: terrain, roads, lots, buildings, props, actors, markers, UI.
- `sprite atlas`: packed bitmap/sprite sheet used for map assets.
- `primitive fallback`: code-drawn temporary asset when a sprite is missing.
- `anchor point`: point where a sprite attaches to the map tile.
- `occlusion`: near objects partially cover far objects correctly.
- `pixel snapping`: keeping sprite edges crisp instead of blurry.

## Review Language

Use these review phrases:

- "This lacks terrain strata."
- "The world edge is too flat."
- "The tile modules are not distinct enough."
- "The gym/plaza/office landmark read is weak."
- "The roads feel pasted on, not embedded."
- "The detail density is too low."
- "The marker color language is not consistent."
- "The selection state is UI-only; it needs tile glow."
- "The map has empty field problem."
- "The camera is too distant for diorama feel."
- "The buildings need block-built massing, not flat primitives."

## Quality Bar

The target is not photorealism. The target is a dense, readable, block-built
miniature town where every tile has a job and every marker has meaning.
