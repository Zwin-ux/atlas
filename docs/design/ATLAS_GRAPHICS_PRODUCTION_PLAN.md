# Atlas Graphics Production Plan

Date: 2026-07-04

Status: concept-art and production-intake scope lock.

Target screenshot:
`C:\Users\mzwin\AppData\Local\Temp\codex-clipboard-83a8c0a4-d7e6-4a7e-8a13-6d7f3dd65f4e.png`

Fresh current baseline captured by local subagent:
`C:\Users\mzwin\AppData\Local\Temp\atlas-map-quality-research-current`

Supporting references:
- `docs/design/atlas-explore-hud-imagegen-v2.png`
- `assets/reference/atlas-voxel-town-north-star.png`
- `assets/reference/atlas-voxel-map-tile-marker-kit.png`
- `docs/brain/VOXEL_VISUAL_BAR.md`
- `docs/brain/VOXEL_VISUAL_VOCABULARY.md`
- `docs/brain/ROAD_LOT_TERRAIN_CONTACT_GRAMMAR_SPEC.md`
- `docs/brain/THREE_ASSET_PRODUCTION_INTAKE_SPEC.md`

Paste-ready prompt files:
- `docs/design/fable-prompts/ground-module-atlas.txt`
- `docs/design/fable-prompts/rowhome-production-candidate.txt`
- `docs/design/fable-prompts/eastvale-no-hud-map-target.txt`

## Current Quest

G0 - turn the target concept screenshot into a production graphics lane.

Goal:
Get Atlas from "working Pixi city map with HUD polish" toward the target concept:
a dense, readable, playful, 2:1 isometric county-world map with dark tactical HUD
overlays, source-backed selected-place detail, and no fake facts.

Local subagent read:
The current preview is functionally healthy and passed desktop/mobile product-loop
verification with one canvas, no horizontal overflow, no console errors, sticker
drop, and note save. Against the target screenshot, the map quality is still about
5.5/10. The remaining gap is mostly world art and engine grammar, not React HUD.

Hard truth:
The target screenshot is not won by more panels. The HUD silhouette is now close
enough to judge. The map still needs ground contact, road/lot grammar, building
family identity, material lighting, camera density, marker attachment, and a real
asset-intake rhythm.

## Production Strategy

1. Prompt for reusable module sheets first, not one-off hero screenshots.
2. Use full-scene concept art only to judge density, camera, lighting, and
   atmosphere.
3. Keep every production asset compatible with the existing 2:1 isometric map,
   `CityWorldScene`, the city-world atlas manifest, anchors, and primitive fallback.
4. Improve procedural road/lot/terrain contact before broad sprite expansion.
5. Intake sprite assets one family at a time, with before and after screenshots.
6. Do not paint a generated image behind the map. Atlas must stay interactive,
   selectable, zoomable, typed, and source-backed.

## Missing Visual Systems

- Parcel grammar: lots need pads, curb cuts, paths, parking/apron logic, and
  contact shadows as one parcel composition, not independent translucent slabs.
- Road/lot/terrain contact: roads should feel embedded with sidewalks, curbs,
  lane marks, crosswalks, driveway joins, terrain edges, and pad shadows.
- Building family identity: homes, rowhomes, strip retail, civic/community center,
  apartment, office, gym/warehouse, and plaza modules need distinct silhouettes.
- Asset density: the manifest/resolver path exists, but the actual durable atlas
  is still too small for the target's neighborhood richness.
- Lighting/material language: faces need a consistent ramp, stronger contact
  shadows, and less pale generated-terrain wash.
- Camera/framing: the target is closer, denser, and higher contrast while still
  readable on mobile.
- World-space feedback: selected tile glow, corner brackets, label plaques,
  route/time tags, and pin markers need to attach to the world.

## Procedural Versus Sprite

Procedural first:
- Road beds, curb thickness, sidewalk/driveway joins, parcel pad shadows, terrain
  strata, water edge contact, camera defaults, label density, and mobile crop.
- This matches `docs/brain/ROAD_LOT_TERRAIN_CONTACT_GRAMMAR_SPEC.md`, which says
  the next visual-engine pass should improve physical contact before new object
  sprawl.

Sprite/atlas:
- Repeated building families, rowhomes, strip stores, civic/gym/store modules,
  trees, Clawd, packed road modules, shoreline modules, and overlay shapes.
- This must enter through `spriteKey`, `paletteKey`, manifest frames, resolver
  loading, anchors, and primitive fallback.

## Fable Prompt 1 - Ground Module Atlas

Use this first. It targets the highest-leverage visual weakness: roads, lots, and
terrain contact.

```text
Create a transparent PNG sprite sheet for Atlas city-world ground contact. Size
1024x256. 2:1 isometric voxel projection, orthographic camera, warm California
daylight, crisp material faces, subtle ambient occlusion, no HUD, no labels, no
cars, no people, no trees, no signs, no UI glow.

Keep exactly five frames:
- road.module.straight at x0 y0 w336 h172
- road.module.cross at x352 y0 w284 h224
- terrain.module.shoreline at x656 y0 w192 h60
- terrain.module.raised_edge at x656 y68 w176 h60
- terrain.module.parcel_shadow at x848 y0 w156 h88

Roads must feel embedded with curb bevels, quiet lane marks, and contact depth.
Shoreline must be block-stepped, not a thin blue line. Parcel shadow must be a
subtle grounding shape, not dirt, grime, or a decorative blob.

Negative constraints:
No photoreal aerial map, no smooth low-poly render, no perspective camera, no
generic SimCity UI, no dashboard, no landing page, no SaaS cards, no humans,
no cars, no fake brands, no readable text, no copied game assets.
```

## Fable Prompt 2 - Rowhome-Only Production Intake Candidate

Use this second. This is the first safe building sprite because the production
intake spec already points to rowhome-first.

```text
Create one transparent 2:1 isometric voxel sprite:
building.house.rowhome.flat_parapet.v1.

Frame:
420x300. No tile background, no labels, no people, no cars, no trees, no UI
effects.

Object:
Three joined rowhome units with slight variation, flat parapet with visible top
lip and side thickness, recessed doors, stoops, grouped windows with sill depth,
side-face party-wall seams, restrained contact shadow inside the footprint.

Projection:
Orthographic 2:1 isometric. Warm California daylight. Crisp readable silhouette.
Anchor should visually land at front/bottom center. It must read on a 390x844
mobile crop and must not look like a sticker pasted on a board.

Negative constraints:
No photorealism, no perspective camera, no floating base, no heavy outlines, no
fake signage, no generic low-poly block, no copied game asset.
```

## Fable Prompt 3 - No-HUD Map Target

Use this third. It is an art-direction reference, not a runtime asset.

```text
Create a map-only Atlas Eastvale visual target, 1280x720, no HUD, no panels,
no labels, no readable text.

Scene:
Full-screen 2:1 isometric voxel county slice with dense parcel rhythm:
embedded roads, curb cuts, sidewalks, residential clusters, one civic/community
building, strip-store plaza, park, water edge, freeway corridor, tree clusters
as scale cues, warm daylight, strong contact shadows, readable block-built
silhouettes.

Camera:
Orthographic 2:1 isometric. The map should fill the frame edge to edge. Similar
density and crop to a tactical map game. No empty green plane. No cinematic blur.

Goal:
This is the screenshot north star for density, lighting, and material grammar.
It is not a production background.

Negative constraints:
No photoreal satellite imagery, no generic dashboard, no marketing hero page,
no fake factual copy, no 3D perspective camera, no dark cyberpunk palette, no
cluttered labels, no copied game UI.
```

## Fable Prompt 4 - Marker And Selection Overlay Kit

Use this after ground and rowhome. It gives the interactive map its attached
screenshot-proof states.

```text
Create an Atlas overlay asset kit for a 2:1 isometric voxel county-world map.

Style:
Dark tactical HUD meets friendly arcade map. Pixel-informed, crisp, simple, and
readable at mobile size. Match a warm green California voxel map with black HUD
panels and yellow accent actions.

Assets:
- selected-place corner brackets for an isometric footprint
- selected-place tile glow
- hover tile glow
- active Clawd scout marker, original character silhouette, not a copied mascot
- pin marker for favorite
- pin marker for home
- pin marker for shop
- pin marker for park
- pin marker for idea/question
- compact black map label plaque
- compact yellow selected-place label plaque
- route/time tag plaque
- source-backed status strip icon set: source, updated, confidence

Output:
Separate overlay assets on a transparent or neutral background. No full app UI.
No fake addresses, no fake business names, no source domains, no readable long
copy. Keep labels as blank plaque shapes or generic one-word examples only.

Quality bar:
Every overlay must remain readable when scaled down. The selected-place brackets
must feel attached to the world, not pasted over a screenshot. The pin icons
should be distinct by silhouette first, color second.
```

## Reject Generated Art If

- The camera is not orthographic 2:1 isometric.
- Assets do not share one scale, light direction, and palette.
- Buildings lack clear isometric footprints or anchors.
- Roads look like decals pasted on grass.
- Lot pads look like cream UI cards.
- The image depends on fake readable text, fake addresses, or fake sources.
- The scene looks like a static background instead of an interactive map.
- The style only works on desktop and collapses on `390x844`.
- Selection state is UI-only and does not attach to the selected tile or building.
- The palette drifts into generic dark-blue SaaS, cyberpunk, or beige map art.

## Implementation Ladder

G0 - Prompt and selection:
Generate the ground module sheet, rowhome candidate, no-HUD map target, and
overlay kit. Pick one graphics direction. Do not write renderer code in this step.

G1 - Road/lot/terrain contact grammar:
Use `docs/brain/ROAD_LOT_TERRAIN_CONTACT_GRAMMAR_SPEC.md`. Improve roads,
sidewalks, parcel pads, driveway cuts, curbs, terrain edges, shoreline, and
contact shadows. No cars, humans, new panels, broad prop pass, or renderer port.

G2 - Rowhome-only production intake:
Use `docs/brain/THREE_ASSET_PRODUCTION_INTAKE_SPEC.md`. Import one rowhome module
through the city-world atlas manifest with primitive fallback, anchor proof, and
desktop/mobile baseline versus after screenshots. Apply it to one known building
first, not every home.

G3 - Parcel profile metadata only if needed:
If road/lot grammar needs typed support, add one optional field for pad/contact
style with compiler tests. Do not broaden `CityWorldScene`.

G4 - Civic/community center hero module:
After G2 proves intake, add one selected-place civic module that can carry the
target screenshot's community-center moment. Keep copy and facts repo-backed.

G5 - Building family expansion:
Add cottage/ranch, strip retail, apartment, office, gym/warehouse, tree cluster,
river edge, and freeway modules one family at a time. Each family needs fallback,
anchors, and screenshot proof.

G6 - World-space labels and selection:
Add attached label plaques, selected tile glow, corner brackets, route/time tags,
and marker states. Keep React HUD unchanged unless a real overlap bug appears.

G7 - Density and camera pass:
Tune parcel distribution, tree density, zoom defaults, and mobile framing so the
map reads closer to the target screenshot without breaking interaction.

## Screenshot Gates

Each production graphics slice must include:

- Before and after desktop screenshot at `1280x720`.
- Before and after mobile screenshot at `390x844`.
- Proof that the preview still has one canvas and no horizontal overflow.
- Proof that place select, pan/zoom, sticker drop, and note save still work.
- No hidden note input and no HUD overlap with map controls.
- No copied fake facts from generated art.
- No provider payloads, Google calls, or raw external data in renderer code.

## Anti-Scope

Do not:

- Use generated art as a static map background.
- Port the renderer to Three.js.
- Add live Google ingestion.
- Add persistence, Stripe, XP, evidence, quests, campaign generation, reports,
  exports, automated posting, DMs, or paid scout UI.
- Add cars, humans, props, and broad module families before the contact grammar
  and rowhome intake paths prove the production method.
- Copy generated addresses, source names, hours, public-property tags, source
  domains, or business labels.
