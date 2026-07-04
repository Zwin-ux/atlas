# Pastel Voxel Reference Notes

These notes are for engine direction, not source art copying.

## Sources Checked

- `https://ephtracy.github.io/`: MagicaVoxel is positioned as a lightweight
  voxel art editor plus interactive path-tracing renderer. The relevant lesson
  for Atlas is that simple voxel forms become premium through lighting, face
  separation, AO, and render discipline.
- `https://lospec.com/pixel-art-tutorials/tags/isometric`: Lospec collects
  isometric pixel-art tutorials and emphasizes color, shading, composition, and
  perspective as core art skills. The relevant lesson is that Atlas needs a
  disciplined palette and construction system, not random detail.
- `https://lospec.com/palette-list`: Lospec describes its palette list as a
  database of palettes made for pixel art and old hardware constraints. The
  relevant lesson is to work from a tight palette ramp per material.
- `https://kenney.nl/assets/category:2D?search=voxel`: Kenney's asset catalog
  shows voxel packs as asset kits, not one-off illustrations. The relevant
  lesson is modular consistency.
- `https://www.voxelmade.com/magicavoxel/`: Voxelmade describes MagicaVoxel as
  a lightweight voxel editor with an integrated renderer. The relevant lesson is
  that Atlas should eventually have an authored object kit workflow, not endless
  procedural decoration.

## Practical Engine Rules

- Pastel does not mean low contrast. Top, left, and right faces need separate
  ramps.
- Houses should be collectible objects first and map tiles second.
- Every visible detail must be structural: roof ridge, eave, foundation, porch,
  recessed windows, door depth, trim band.
- Grass and terrain are supporting stage material in this pass.
- Do not add cars, people, trees, water, or roads until the house module itself
  passes.
- Responsive camera is part of the art. Desktop should show a deliberate
  diorama cluster; mobile should show object quality, not UI chrome.
