# House Engine Questions

This lab exists because the current Atlas map can improve technically and still
miss the visual bar. The first production-grade question is not "can we render a
town?" It is "can one Atlas house look simple, high quality, and worth zooming
into?"

## Current Brutal Read

- The current production map is not ready as a public visual signature. It has
  pipeline progress, but the visual result still reads procedural and uneven.
- The first pastel lab pass was too broad: roads, water, trees, civic massing,
  and controls hid the fact that the houses were under-authored.
- The house-only pass is cleaner, but still reads like a good blockout, not a
  finished tile-kit module.
- The reference images work because they keep simple voxel shapes while giving
  every object crisp material separation, confident camera framing, and enough
  hand-authored surface detail to reward inspection.

## Questions The Engine Must Answer

1. Does a single house read as a toy-like object before the viewer understands
   the board?
2. Can the roof silhouette be identified from the screenshot thumbnail?
3. Are top, left, and right faces separated enough without becoming harsh?
4. Does the house have authored depth, or is it just a wall cuboid with a roof
   cap?
5. Are windows, doors, eaves, and foundation details placed on the house form
   rather than pasted on top of the scene?
6. Does the camera make the house feel collectible and inspectable on desktop?
7. Does mobile show the house quality without the lab panel blocking the core
   read?
8. Is the grass only a quiet stage, or is it competing with the house?
9. Would adding cars, humans, or props hide weaknesses instead of fixing them?
10. Can the same house grammar scale into a county board without every tile
    looking cloned?

## Acceptance Rules Before Porting

- No cars, humans, roads, civic objects, water, trees, marketing panels, or
  product-loop props in the house-quality pass.
- Keep the lab standalone until screenshots clearly beat the current renderer.
- Target three house families only: cottage, rowhome, and larger massing.
- Each house family needs a distinct roof profile, foundation, entrance, and
  wall/roof palette.
- Details must be structural: eaves, ridge line, trim, foundation, porch, window
  recess, door depth. Avoid decorative speckles.
- Desktop screenshot should show fewer houses at larger scale, not a distant
  board trying to prove density.
- Mobile screenshot should prioritize the object read; the control panel is lab
  chrome and must not be mistaken for production UI.

## Next Visual Bet

Improve the house renderer before touching terrain or map systems:

- make roof profiles more dimensional;
- add foundation/porch depth that follows isometric faces;
- reduce board contrast so house forms own the image;
- make mobile a close inspection frame;
- keep the object count low enough that every weakness is obvious.
