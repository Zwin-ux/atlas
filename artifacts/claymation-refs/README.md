# Claymation reference board

Non-runtime taste references for Atlas map generation (plasticine diorama).
Renderer/generator changes should move toward this look: soft matte clay,
chunky silhouettes, clear ground contact, no people/cars as crutches.

- `suburban-clay.jpg` — residential / metro-soft SoCal clay block
- `desert-basin-clay.jpg` — arid basin clay town

## Implementation notes (map quality)

What we keep in-repo (no runtime dependency on third-party city kits):

1. **Regional clay palettes** — `cityWorldRegionalPalettes.ts` matte plasticine
   bodies/roofs per archetype (coastal cream, desert adobe, metro soft concrete).
2. **Roof/prop clay depth** — `CityWorldRenderer` clay tile courses, thicker ridge
   barrels, soft eave lips; prop outlines use the same warm clay stroke mix.
3. **Chunky massing** — `generatedMassingProfileFor` footprint/strip-fill scales
   (under window budget + clone parity floors).
4. **Note badges** — aggregated one-badge-per-place pins + marker sticky badges.

## External packages researched (do not bolt on blindly)

| Package / repo | Fit | Decision |
| --- | --- | --- |
| [victorqribeiro/isocity](https://github.com/victorqribeiro/isocity) | Tiny Kenney-tile isometric builder | Taste ref only — sprite kit not our procedural path |
| [amilich/isometric-city](https://github.com/amilich/isometric-city) | Canvas iso city + depth sort | Ideas for depth bands; we already interleave in Pixi |
| [zeropointnine/voxel-renderer-html](https://github.com/zeropointnine/voxel-renderer-html) | Voxel → Pixi iso | Interesting, but would replace our generator pipeline |
| [Kenney Isometric Tiles Buildings](https://kenney.nl/assets/isometric-tiles-buildings) | CC0 building tiles | Optional future sprite pack if we leave pure-procedural |
| [peepsquest pixi isometric height](https://github.com/peepsquest/tutorials) | Pixi height-sorted tiles | Already solved via `cityWorld` depth keys |

**Verdict for perfection:** stay procedural clay (current architecture). Steal
grammar (chunky mass, matte pigment, course lines) not engines. Only consider
Kenney CC0 if we later add a sprite LOD band; do not import full city-builder
frameworks into the ChatGPT widget.
