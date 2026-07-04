# E7.31 Reference-Bar Building Kit Decision

Decision:
Manual object/sprite art workflow is required before production renderer port.
Do not keep polishing the current procedural building helpers as the primary
path to the north-star look.

## Why

E7.30 improved the right surfaces: roof lips, storefront bays, entries, window
recesses, stoops, and side-face depth. The dense candidate now proves the
layout grammar, but it still reads like procedural code art at close inspection.

Against `assets/reference/atlas-voxel-town-north-star.png`, the gap is not more
objects. The gap is tactile authored detail: roof materials, facade breaks,
chunky but varied silhouettes, small structural rhythms, and richer tile-level
surface choices.

Against `assets/reference/atlas-voxel-map-tile-marker-kit.png`, the strongest
tiles read as complete authored objects. The current lab modules read as
reusable geometry recipes. One more code pass can improve edges, but it is
unlikely to add the material richness and visual specificity needed to cross
the 7/10 production-port bar.

## Current Rating

- Standalone dense-lab target: 7.6/10.
- `atlas-voxel-town-north-star.png`: 6.7/10.
- `atlas-voxel-map-tile-marker-kit.png`: 6.5/10.

Production port recommendation:
Do not port yet.

## Strongest Current Families

- Rowhome strip: best rhythm and kit repeatability.
- Three-bay strip store: clearest commercial module.
- Apartment cluster: strongest vertical read.

## Weakest Current Families

- Gym/service building: still too broad and cuboid.
- Generic roof surfaces: lips help, but material is still smooth.
- Stoop/window language: improved, but repeated helper shapes are visible.
- Road corner support modules: still assembled from rectangles.

## Manual Art Workflow Requirement

Before production renderer port, create manually authored object art or
sprite-backed modules for the same dense-scene families. The next work should
produce source art, not more procedural helper stacking.

Required first authored set:

- `building.house.cottage.front_gable.v1`
- `building.house.ranch.low_gable.v1`
- `building.house.rowhome.flat_parapet.v1`
- `building.apartment.lowrise.stepped.v1`
- `building.store.strip.three_bay.v1`
- `building.store.corner.awning.v1`
- `building.store.cafe.awning.v1`
- `building.service.gym.entry_block.v1`
- `road.corner.two_lane.v1`

Each object must preserve:

- 2:1 isometric camera.
- Visible top, left, and right face ramps.
- Anchor and footprint compatible with the lab board.
- No cars, humans, trees, water, labels-as-identity, glows, product panels, or
  marker compensation.
- Readable mobile crop at 390x844.

## Reject Rules

Reject an authored module if:

- It needs text to identify the building type.
- It hides weak geometry with props.
- It loses face separation at mobile size.
- It uses a flat roof cap with no edge depth.
- It repeats identical windows/stoops without authored variation.
- It cannot sit on the current dense candidate without changing product scope.

## Acceptance Bar For Returning To Port

Return to production-renderer port discussion only when the dense lab candidate:

- Scores at least 7/10 against both reference images.
- Shows manually authored roof, entry, window, and side-face detail in the
  desktop screenshot.
- Keeps the mobile screenshot readable without relying on the control panel.
- Still has no forbidden props or product-scope expansion.
