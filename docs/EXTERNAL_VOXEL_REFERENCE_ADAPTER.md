# External Voxel Reference Adapter

Status: active research adapter only.

Purpose:
Atlas should learn from serious voxel and terrain references without importing
their runtime assumptions. This packet adapts VoxCity, VoxelSpace, and
Pixels2Voxels into Atlas-owned engine questions, verifier pressure, and next
slice criteria.

Sources inspected:

- VoxCity: `https://github.com/kunifujiwara/VoxCity`, local shallow clone
  `C:\Users\mzwin\AppData\Local\Temp\atlas-reference-repos\VoxCity`, commit
  `7788fda`.
- VoxelSpace: `https://github.com/s-macke/voxelspace`, local shallow clone
  `C:\Users\mzwin\AppData\Local\Temp\atlas-reference-repos\voxelspace`,
  commit `60d7ae1`.
- Pixels2Voxels: `https://github.com/s-du/Pixels2Voxels`, local shallow clone
  `C:\Users\mzwin\AppData\Local\Temp\atlas-reference-repos\Pixels2Voxels`,
  commit `e43ed97`.

Decision:
These repositories are reference, not dependencies. Atlas keeps Pixi,
`CityWorldScene`, `@atlas/core`, and `@atlas/geo` as its runtime contract. No
Python pipeline, Open3D viewer, terrain-only renderer, provider ingestion, or
external engine package should enter the public app from this research.

## VoxCity Adapter

VoxCity is the strongest source for data-to-voxel pipeline discipline. Its
useful ideas are not the live download stack; they are the contracts around
grid geometry, projection, source coverage, cell assignment, voxel layers,
surface metadata, and export/debug proof.

Useful concepts to adapt:

- Grid geometry basis. `compute_grid_geometry` turns a rotated rectangle and
  mesh size into origin, side vectors, unit basis vectors, grid size, and
  adjusted mesh size. Atlas should keep its `CityWorldBasis` as the single
  place where board axes, projected tile space, and viewport frames are
  defined.
- Projection invariant. VoxCity's `GridProjector` states the hard mapping
  between voxel index and scene position: grid index divided by mesh size is
  the scene coordinate. Atlas should preserve an equivalent invariant:
  compiled `CityWorldScene` board coordinates must be stable across compiler,
  diagnostics, and renderer.
- Orientation at boundaries only. VoxCity treats orientation conversion as
  import/export plumbing. Atlas should keep board axes canonical inside
  `CityWorldScene`; any coordinate flip belongs at source ingest, debug export,
  or adapter boundaries, not scattered through renderer code.
- Mesh-size sanity. VoxCity validates mesh size and warns on suspicious units.
  Atlas should similarly reject candidate packs or hidden draft compilers that
  imply tiny or massive coordinate scales without an explicit basis.
- Footprint-to-cell assignment. VoxCity uses overlap thresholds, precise
  polygon intersection when density requires it, repaired invalid geometry,
  feature IDs, min/max heights, and highest-building assignment. Atlas should
  not copy this now, but second-district promotion should eventually require a
  source-to-cell assignment policy before provider or anchor geometry becomes
  renderable.
- Source coverage maps. VoxCity records which building, land-cover, canopy,
  and elevation sources are valid for which regions, including selected source
  and effective fallback behavior. This supports the Atlas 0.1E provider rule:
  lookup data cannot become readiness or geometry without typed source coverage
  status. Atlas should make `selectedSource`, `effectiveSource`,
  `coverageKnown`, `fallbackReason`, `confidence`, and `renderEligible`
  explicit fields rather than burying them in prose.
- Voxelizer layer separation. VoxCity voxelizes ground, land cover, tree canopy,
  building segments, and DEM as separate components before combining them.
  Atlas should keep terrain, road, lot, building, object-family, and debug
  metrics separable instead of letting the renderer infer everything from
  pixels.
- Memory caps. VoxCity estimates voxel-grid RAM before allocation. Atlas should
  treat full-county or second-district scenes as bounded slices with explicit
  cell/object/payload budgets before public promotion. Adapt the preflight
  contract, not VoxCity's exact control flow: allocation failures must remain
  visible blockers, never swallowed warnings.
- Water/elevation cleanup. VoxCity flattens water DEM regions by connected
  component. Atlas adapts the idea as explicit water-edge separation:
  water should read as deliberate cut/basin terrain instead of noisy height
  flicker or decorative blue fill.
- Material and window grammar. VoxCity uses material IDs and modulo patterns to
  vary window rhythm while avoiding glass on roofs. Atlas should turn this into
  object-family facade grammar: roof is roof, wall is wall, window rhythm is
  face-aware, glass snaps to exterior hull surfaces, and category read should
  not rely on labels. No floating windows, no metadata-only identity, and no
  roof glass unless a future object grammar explicitly approves it.
- Surface metadata. VoxCity classifies surface kind from normals, derives wall
  orientation, builds stable surface face keys, and supports roof/wall/window
  masks. Atlas should add face-orientation metadata before asking Lumen to
  prove no-label object recognition at scale.
- Offline export proof. VoxCity's MagicaVoxel and OBJ export paths show how to
  create review artifacts through palette mapping, chunking, and greedy face
  meshing. Atlas should keep any export as offline proof, not public runtime.
- Surface-aware downsampling. VoxCity preserves visible non-empty surface cells
  for preview instead of averaging away identity. Atlas should apply the same
  principle to debug/mobile proof: simplify far-field content, but preserve the
  top visible category cues and selected-object face read.
- Debug payload caps. VoxCity's backend proof surfaces suggest a hard Atlas
  rule: debug geometry should carry bbox, basis, source attrs, pick metadata,
  and chunked payload limits, with explicit failure when payloads are too large.

Rejected VoxCity imports:

- No Earth Engine or live source download lane in this slice.
- No Python runtime dependency in the ChatGPT app.
- No tree/canopy rendering as a shortcut to visual richness.
- No solar/view-index simulation in public Alpha.
- No OBJ or MagicaVoxel export in runtime.
- No MeshLib-style importer path or brittle slow mesh dependency.
- No provider-derived geometry promotion without a separate readiness gate.

Atlas questions from VoxCity:

1. Should `CityWorldBasis` explicitly document the invariant
   `scene[i,j,k] == board-space coordinate`, and should every compiler test use
   it?
2. Should every candidate district carry a source coverage policy separate from
   provider lookup success before it can be considered renderable?
3. Should hidden-draft anchor packs require footprint overlap policy and
   min/max height intent before the compiler can place venue geometry?
4. Should object-family grammar include face metadata: roof, wall, orientation,
   window zone, and facade rhythm?
5. Should terrain diagnostics include water/basin flattening and edge-stability
   checks?
6. Should debug exports have max cells, max layers, max objects, max payload
   bytes, axis metadata, source attrs, and reproducible provenance?

## VoxelSpace Adapter

VoxelSpace is useful because it is brutally simple: a height map plus a color
map can render terrain fast with a per-column occlusion buffer and distance
level-of-detail. It is not a city-object renderer and should not replace
Atlas' isometric voxel board.

Useful concepts to adapt:

- Height map and color map split. Atlas can derive debug-only terrain height
  and terrain color maps from `CityWorldScene` to measure terrain composition
  without trusting screenshot vibes.
- Column occlusion buffer. VoxelSpace's `hiddeny` idea is a compact lesson:
  measure what is already visually occupied before drawing more. Atlas can
  adapt that into mobile clutter and first-viewport occlusion diagnostics.
- Distance LOD. VoxelSpace increases sampling step with distance. Atlas can use
  the principle for mobile density and far-edge simplification, while keeping
  object identity near the selected place sharp.
- Horizon and camera parameters. The simple camera model is useful as a
  mental check: terrain massing, horizon, and world edges should be legible
  before object detail is added.
- Bounded density budgets. VoxelSpace gets speed by accepting one height value
  per map sample. Atlas should not adopt that simplification literally, but it
  should define per-viewport budgets for high-detail buildings, terrain strata,
  pins, labels, and HUD overlap so denser art does not crowd mobile.

Rejected VoxelSpace imports:

- No terrain-only renderer as the main product surface.
- No copying VoxelSpace's Comanche-era maps, palettes, or demo assets. Only the
  generated-map pattern is relevant to Atlas.
- No periodic height-map world as a fake county.
- No public camera controls or debug horizon UI.
- No replacement of Pixi `CityWorldRenderer`.

Atlas questions from VoxelSpace:

1. Should diagnostics expose `terrainHeightMap` and `terrainColorMap` arrays
   derived from the current compiled scene?
2. Should mobile pass/fail include an occlusion or vertical occupancy metric
   so denser art cannot crowd the tray, switcher, or selected-place loop?
3. Should far-field terrain use lower-detail chunk silhouettes while near
   buildings retain face/detail grammar?
4. Should `cameraPresets` fail when the focal object family, road access, or
   terrain edge structure falls outside the first mobile viewport?

## Pixels2Voxels Adapter

Pixels2Voxels is not an Atlas runtime reference. Its value is as a reminder
that image and source-art quality can be inspected channel-by-channel before
anyone claims a sprite or reference image will improve the voxel world.

Useful concepts to adapt:

- Channel inspection. Splitting RGB into visible intensity volumes is a good
  mental model for checking whether source art has enough silhouette and
  contrast to survive small mobile views.
- Filtering and voxel size. The filtering workflow suggests an offline art QA
  pass: inspect luminance ranges, edge density, and noisy color clusters before
  turning source art into Atlas assets.
- Background and shader toggles. Diagnostic modes should help Lumen see shape,
  not decorate weak object art.

Rejected Pixels2Voxels imports:

- No Open3D runtime.
- No image-to-voxel gimmick as a production renderer path.
- No asset promotion based only on colorful source images.

Atlas questions from Pixels2Voxels:

1. Should no-label visual packets include grayscale/high-contrast thumbnails
   for each object family?
2. Should source SVG/PNG intake require a simple contrast and silhouette score
   before runtime wiring?
3. Should Lumen's next object-art proof include channel/luminance review in
   addition to desktop/mobile screenshots?

## Candidate Verifier Ladder

These should be treated as future Atlas-owned verifier ideas, not new
dependencies:

1. `verify-cityworld-derived-terrain-maps.mjs`: implemented for public
   Riverside, Orange shell, Anaheim hidden draft, and Ontario hidden draft.
   It compiles each scene into derived height/color arrays from
   `CityWorldScene`, proves stable dimensions, non-flat terrain where expected,
   water-edge cut signal, shell zero object occupancy, hidden draft
   non-playability, and no provider payload leakage.
2. `verify-cityworld-mobile-occlusion.mjs`: project terrain, buildings, pins,
   and tray-safe bands into the `390x844` frame. Pass only if selected-place
   tray, county switcher, entry rail, and recovery CTA remain visually
   un-crowded.
3. `verify-cityworld-lod-budget.mjs`: count high/medium/low detail objects per
   camera frame. Pass only if far-field detail simplifies before near anchors
   lose category cues.
4. `verify-cityworld-camera-framing.mjs`: assert each camera preset keeps focal
   object families, road access, and chunk edges inside the first viewport.
5. `verify-cityworld-source-art-contrast.mjs`: inspect SVG/PNG assets for
   luminance spread, alpha bounds, edge density, and thumbnail silhouette before
   runtime wiring.
6. `verify-cityworld-debug-payload-budget.mjs`: assert debug/export payloads
   include basis/source/provenance metadata, stay chunked and bounded, and fail
   loudly instead of silently dropping geometry.

## Atlas Update Pressure

This research should affect the next engine ladder as follows:

1. 0.12E should not be another screenshot-only art pass. It should either use
   the existing `CityWorldBasis`/`TerrainSampler` to add source-grid and
   face-orientation proof, or it should explicitly explain why object
   authorship is the stronger immediate metric.
2. Forge should own provider/source readiness rules inspired by VoxCity's
   source coverage maps: lookup success, source coverage, render eligibility,
   cache policy, and public-quality readiness remain separate fields.
3. Lumen should own face-aware object grammar: roof/wall/orientation/window
   rhythm, no-label grayscale thumbnails, and mobile silhouette crops.
4. Mira should reject product surfaces that expose any of this as user-facing
   jargon. Normal users should still see: play Riverside, browse shells,
   lookup places without saving.
5. Axiom should require the external reference verifier before claiming a
   reference-backed engine update.

## Hard Rejections

- Do not vendor VoxCity, VoxelSpace, or Pixels2Voxels.
- Do not add Python, Open3D, Three, Rapier, or external terrain renderer
  dependencies from this research.
- Do not copy VoxelSpace demo maps or palettes.
- Do not copy VoxCity's Python/FastAPI/Three/R3F app shape, MeshLib importer,
  or simulation stack.
- Do not turn provider data into public geometry.
- Do not promote Anaheim/Ontario because a reference repo has a stronger
  pipeline.
- Do not replace the map-first Pixi surface with a dashboard, terrain demo, or
  image-processing toy.
- Do not use cars, humans, trees, decorative props, labels, panels, glows, or
  public debug UI to hide weak voxel object art.
