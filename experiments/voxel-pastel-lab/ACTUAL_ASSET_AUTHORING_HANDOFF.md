# E7.34 Actual Asset Authoring Handoff

Decision:
External/manual asset authoring is required before these modules can justify a
production renderer port. A quick in-repo SVG proof was tested and rejected
because it read as pasted-on icon art instead of integrated 2:1 voxel modules.

Scope:
Same standalone lab only. Same three keys only:

- `building.house.rowhome.flat_parapet.v1`
- `building.store.strip.three_bay.v1`
- `road.corner.two_lane.v1`

Do not add modules, props, cars, humans, trees, water, civic buildings, product
panels, backend work, persistence, Stripe, XP, evidence, OAuth, automation,
deploy, or production renderer changes.

## Required Output

Preferred deliverable:
A small transparent PNG or SVG source set with one asset per key. Keep source
files inspectable and editable. Do not flatten everything into an opaque
one-off export without source notes.

Suggested source paths:

- `experiments/voxel-pastel-lab/assets/building-house-rowhome-flat_parapet.v1.svg`
- `experiments/voxel-pastel-lab/assets/building-store-strip-three_bay.v1.svg`
- `experiments/voxel-pastel-lab/assets/road-corner-two_lane.v1.svg`

If PNG is chosen instead, use the same basename with `.png` plus a small
source note describing the source file or manual process.

## Frame And Anchor Contract

Each frame should be transparent and include its own contact shadow, but not a
full tile background that hides the lab road/lot grid.

Recommended frame sizes:

- Rowhome: 420x300 px.
- Strip store: 470x320 px.
- Road corner: 330x250 px.

Footprints to preserve:

- Rowhome: width `2.46`, depth `1.08`.
- Strip store: width `2.94`, depth `1.28`.
- Road corner: width `2.2`, depth `2.2`.

Anchor rule:
The source art must visually sit on the same 2:1 isometric footprint as the
existing component modules. The bottom/front footprint edge should align with
the current foundation, sidewalk, or road slab edge. If the asset needs custom
draw offsets, document `widthTiles`, `heightTiles`, `offsetXTiles`, and
`offsetYTiles` next to the asset.

## Visual Requirements

Rowhome:

- Three joined units with deliberate variation, not three identical clones.
- Flat parapet with visible top, front lip, and side thickness.
- Door recesses and stoops must read at 390x844 mobile crop.
- Windows need grouped rhythm, sill/trim depth, and slight asymmetry.
- Side face cannot be blank; include party-wall seams or material blocks.

Strip store:

- Three storefront bays should read from geometry, not text.
- Parapet/roof edge needs tactile material and side thickness.
- Awnings need underside shadow and attachment depth.
- Glass should be recessed into the facade.
- Side face needs block-built material rhythm.

Road corner:

- Must read as one built corner tile, not overlapped rectangles.
- Curbs need continuous outer edges and intentional inner breaks.
- Lane/crossing marks must stay low contrast and embedded.
- Asphalt should have slab thickness and restrained material variation.

## Reject Rules

Reject the asset if any are true:

- It needs labels or signs to identify the module.
- It hides weak geometry with props, cars, humans, trees, glows, or UI panels.
- It reads as a flat sticker pasted over the lab board.
- It breaks 2:1 isometric alignment or the current footprint.
- It loses face separation at mobile size.
- It is less integrated than the E7.33 component modules.

## Intake Verification

After a candidate asset is supplied:

1. Wire only these same three keys into the standalone lab.
2. Preserve component fallback.
3. Run:
   - `node --check experiments\voxel-pastel-lab\authored-modules.js`
   - `node --check experiments\voxel-pastel-lab\pastel-voxel-lab.js`
   - scoped forbidden-scope grep over lab runtime files
   - `git diff --check -- experiments\voxel-pastel-lab docs\BUILD_LOG.md docs\NEXT_QUESTS.md`
4. Capture desktop 1280x720 and mobile 390x844 screenshots.
5. Compare against E7.33 and the two reference images.

Return to production-port discussion only if the dense lab clears at least
7/10 against both references without adding props or new modules.
