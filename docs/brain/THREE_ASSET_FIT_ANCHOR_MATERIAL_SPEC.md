# Three-Asset Fit, Anchor, And Material Integration Spec

Owner: Lumen - Art Captain Specialist / Voxel-Engine Captain

Status: parked until F2 is green or Axiom explicitly reopens visual
implementation.

## Objective

Make the accepted standalone lab assets feel like one coherent modular voxel
tile system instead of three separate SVGs placed on a board.

This is the first allowed visual-engine slice after F2 because it fixes the
shared weakness in the accepted asset lane before Atlas adds more modules or
ports anything to the production renderer.

## Target Assets

Only these three accepted keys are in scope:

- `building.house.rowhome.flat_parapet.v1`
- `building.store.strip.three_bay.v1`
- `road.corner.two_lane.v1`

Accepted source assets:

- `experiments/voxel-pastel-lab/assets/building-house-rowhome-flat_parapet.v1.svg`
- `experiments/voxel-pastel-lab/assets/building-store-strip-three_bay.v1.svg`
- `experiments/voxel-pastel-lab/assets/road-corner-two_lane.v1.svg`

## Problem To Solve

The current lane proves that authored assets can beat component cuboids, but
the world still reads too much like a generated board:

- building bases feel slightly oversized or floaty;
- large pale roof and top planes look under-authored;
- road corner is coherent but too quiet and not fully tied into lots/sidewalks;
- asset scale and anchors do not yet feel governed by one tile grammar.

## Allowed Files When Reopened

Default allowed files:

- `experiments/voxel-pastel-lab/authored-modules.js`
- the three SVG source files listed above
- `experiments/voxel-pastel-lab/README.md` only if usage notes change
- this spec, if acceptance language needs tightening
- `docs/BUILD_LOG.md` and `docs/NEXT_QUESTS.md` for concise handoff notes

Do not touch production renderer files unless Axiom explicitly changes the
slice into a production intake spike.

## Anti-Scope

- No new module keys.
- No new buildings.
- No cars, humans, trees, water, decorative props, glows, labels, panels, or
  product UI as compensation.
- No production renderer port.
- No backend, MCP/submission, persistence, Stripe, XP, evidence, OAuth,
  automation, reports, exports, staging, or deploy.

## Required Improvements

### 1. Anchor And Footprint Fit

- Asset bottom/front footprint edges align with the visible tile or pad edge.
- Asset draw offsets are documented in `authored-modules.js`.
- No asset should feel like it floats above its parcel.
- The road corner should sit under building/sidewalk language, not over it.

### 2. Base And Contact Integration

- Each building has a restrained contact shadow that grounds it without making
  a dirty halo.
- Foundation or pad thickness should read as part of the tile system.
- Building assets should not require oversized pale slabs to feel stable.

### 3. Roof And Top-Plane Material

- Large roof/top planes need deliberate block-built material changes, not noise.
- Material detail should reward inspection but remain quiet on `390x844`.
- Pastel softness is allowed; washed-out blank planes are not.

### 4. Road-Corner Material Integration

- Curbs must read as continuous outer edges with intentional inner breaks.
- Lane/crossing marks stay embedded and low contrast.
- Asphalt has slab thickness and material variation without becoming a dark
  icon decal.

## Screenshot Acceptance

Required artifacts:

- desktop `1280x720` screenshot of the dense lab after interaction;
- mobile `390x844` screenshot of the dense lab after interaction;
- if production intake is later approved, matching production renderer desktop
  and mobile screenshots.

Pass conditions:

- First 3-second read is a dense toy-map world, not an asset collage.
- Rowhome, strip store, and road corner each pass the mobile crop test.
- The three assets feel governed by the same `2:1 isometric` tile grammar.
- Slop flags are reduced: less pasted-on, less blank top plane, less
  generated-board feel.
- No new props or panels are used to hide weak art.

Fail conditions:

- Any asset looks less integrated than the E7.38 accepted state.
- Mobile read gets worse.
- The slice adds objects instead of fixing fit/material.
- Screenshots still make the accepted assets look like stickers on the board.

## Visual Rating Bar

Current state: roughly `6-7/10` against the references.

This slice should reach a real `7/10` Alpha visual pass:

- showable internally without apology;
- not production art-final;
- strong enough that the assets look authored, grounded, and compatible;
- still honest that Atlas needs more art work before Beta-quality public
  screenshots.

Beta-quality remains higher: a screenshot people could see publicly and say
the world itself looks good, not just functional.

## Handoff Requirements

Every reopened implementation handoff must include:

- objective;
- files changed;
- screenshots;
- browser proof: clean console, no horizontal overflow, nonblank canvas;
- `node --check` for lab JS files;
- `git diff --check` over changed visual files/docs;
- visual rating against both reference images;
- weak spots;
- anti-scope honored;
- next recommendation.
