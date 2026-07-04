# Atlas Voxel Object Kit Spec

Quest:
E7.25 Common Voxel Object Kit Direction.

Purpose:
Define the repeatable visual system for the Atlas map before more renderer
work. This is the spec future workers should use when building houses, regular
buildings, stores, roads, lots, and supporting terrain modules. It exists
because Atlas cannot scale into counties if the most common objects feel like
generic cuboids.

Status:
Visual-engine spec only. This does not replace the production renderer, change
MCP tools, touch backend code, add persistence, add Stripe, add XP/evidence,
deploy, or expand product loops.

## Product Read

Atlas needs a map that feels like a collectible county board. Most of what the
user sees will not be landmarks. It will be repeated houses, small buildings,
stores, roads, pads, lots, and terrain. If those common modules are weak, the
whole app feels cheap even if the tool surface works.

The visual bar is not "lots of objects." The bar is:

- simple enough to read at a glance;
- rich enough to reward zooming in;
- consistent enough to scale across counties;
- distinct enough that Atlas does not look like a generic map skin.

## Scope Order

1. Houses.
2. Row buildings and small apartments.
3. Stores and storefront strips.
4. Regular commercial buildings.
5. Civic/landmark buildings.
6. Roads, sidewalks, crosswalks, lots, and driveways.
7. Terrain support modules.
8. Markers and overlays.

Roads are important, but they are less likely to define Atlas taste than houses
and common buildings. A clean road kit can be built from a small set of slabs.
Buildings need stronger authorship.

## Non-Negotiable Style Rules

- Use 2:1 isometric projection.
- Use object-first composition: each building should read as a small toy-like
  module before it reads as a data marker.
- Keep pastel color, but preserve face contrast. Pastel does not mean washed
  out.
- Every module needs separate top, left, and right face ramps.
- Details must be structural: roof ridge, eave, foundation, porch, recessed
  window, door depth, awning, sign mount, trim, stair, loading bay, parapet.
- Avoid decorative speckles, random props, and noise pretending to be detail.
- No humans, cars, traffic, pets, or decorative street props until the core
  buildings pass.
- No big pasted labels as primary object identity. Signs can exist, but the
  building silhouette must read without text.
- No product panels, dashboards, reports, feature cards, or campaign UI as
  visual compensation.

## Scale System

Base tile:

- One map tile is a 2:1 isometric diamond.
- One common building module occupies 1x1, 1x1.5, 1.5x1.5, 2x1.5, or 2x2
  tiles.
- Road modules can occupy 1x1, 2x1, or 2x2 modules, but they should align to
  the same grid.

Human-scale proxy:

- A single-story house wall is 0.55 to 0.8 tile-height units.
- Roof height is 0.22 to 0.42 tile-height units.
- Storefronts and row buildings are 0.65 to 1.05 wall units.
- Small apartments/offices are 1.2 to 2.4 wall units, but must use stepped
  massing so they do not become plain towers.

Screenshot scale:

- Desktop lab screenshots should show 4-8 buildings, not a distant empty board.
- Mobile lab screenshots should show 2-5 buildings and prioritize object read.
- A module passes only if its silhouette reads in a 390x844 screenshot.

## Depth And Draw Order

Every module must have deterministic depth ordering before it can enter the
production renderer.

Draw order within one module:

1. Contact shadow.
2. Lot/pad/foundation shadow.
3. Foundation or base slab.
4. Main wall faces.
5. Secondary wall volumes.
6. Roof or parapet.
7. Structural details attached to faces.
8. Small roof details.
9. Overlay marker or glow, if present.

Scene draw order:

- Sort by `x + y`, then elevation, then object height.
- Tall objects may need explicit layer groups.
- Overlay markers stay separate from physical objects.
- Roads and lots sit under buildings, never above building faces.

## Palette Rules

Each material uses a ramp, not one color.

Recommended ramp shape:

- top face: light and warm;
- left face: 16-28 percent darker or cooler;
- right face: 8-20 percent darker;
- shadow/occlusion: low-opacity blue-green or warm brown depending on material;
- line/stroke: transparent, not black.

Core ramps:

- Grass: soft yellow-green top, deeper green sides, low-contrast grid lines.
- House walls: cream, peach, mint, powder blue, light brick.
- Roofs: terracotta red, warm gold, muted blue, soft green, charcoal for
  occasional commercial/civic modules.
- Concrete/sidewalk: warm off-white, beige side faces, restrained edges.
- Asphalt: cool gray-green, not black, with physical curb thickness.
- Store awnings: one accent color per store, with shaded underside.
- Glass: pale blue top/highlight, muted blue side, never neon.
- Wood/door: warm brown with one dark side and one small highlight.

Reject:

- one-hue maps where everything is a variation of green;
- low-contrast pastel that flattens into a sticker;
- harsh black outlines;
- random saturated roofs that break the system;
- material noise that reads like dirt instead of authored voxel surface.

## House Families

Houses are the first identity layer. They must become the strongest common
module before stores, roads, or landmarks expand.

### H1 Cottage

Purpose:
Readable single-family house, common neighborhood filler, small-town charm.

Footprints:

- 1.1x1.0
- 1.3x1.1
- 1.4x1.2

Required variants:

- front-gable cottage;
- side-gable cottage;
- L-footprint cottage.

Required structural details:

- raised foundation slab;
- roof ridge;
- eave shadow;
- recessed front door;
- two small side windows;
- one porch or stoop;
- optional chimney only when detail level allows it.

Reject:

- roof as a flat cap;
- walls as one cuboid with dots;
- porch floating as a pasted rectangle;
- identical clone repeated more than twice in one cluster.

### H2 Ranch / Low House

Purpose:
Suburban spread, lower roof line, broader footprint.

Footprints:

- 1.6x1.0
- 1.8x1.1
- 2.0x1.2

Roof forms:

- low side gable;
- hip roof;
- carport-like side wing only as building geometry, not a car prop.

Details:

- long eave;
- shallow foundation;
- offset entrance;
- window rhythm on long face;
- optional garage door as face detail, no visible car.

### H3 Rowhome / Townhouse

Purpose:
Urban or dense neighborhood module that still feels residential.

Footprints:

- single unit: 0.85x1.1;
- joined strip: 2.5x1.1 to 4.0x1.1.

Roof forms:

- shared gable row;
- flat parapet;
- stepped row roof.

Details:

- repeated entrances with slight palette shifts;
- shared foundation;
- party-wall seams;
- small stoops;
- window rhythm.

Reject:

- one long box with repeated dots;
- too many colors;
- signs or labels to explain residential use.

### H4 Small Apartment

Purpose:
Common low-rise multi-family module.

Footprints:

- 1.5x1.3;
- 2.0x1.5;
- 2.3x1.6.

Massing:

- 2-3 stepped levels;
- roof patio or simple rooftop cap;
- visible entry face.

Details:

- stacked window rhythm;
- balcony blocks only if they read structurally;
- roof mechanical box only if small and restrained;
- side-face shadow strong enough to avoid flatness.

Reject:

- tall plain cuboid;
- glass-office look;
- rooftop clutter.

## Commercial Families

Commercial buildings need to read from silhouette and entrance shape, not text.

### C1 Corner Store

Purpose:
Small local business, common destination, everyday map texture.

Footprints:

- 1.2x1.1;
- 1.5x1.2.

Massing:

- low rectangular volume;
- flat roof or shallow parapet;
- strong front entrance.

Details:

- awning with shaded underside;
- glass door/window recess;
- small sign band without relying on text;
- sidewalk pad.

Reject:

- giant floating sign;
- box with a colored stripe only;
- dark storefront that kills pastel tone.

### C2 Strip Store / Plaza Row

Purpose:
Common suburban retail module.

Footprints:

- 2.5x1.3;
- 3.5x1.4;
- 4.0x1.5.

Massing:

- one shared base;
- 3-5 storefront bays;
- slight roof/parapet variation across bays.

Details:

- awning rhythm;
- glass panels as recessed faces;
- sign bands as small colored blocks;
- walkway slab;
- optional parking lot as a separate ground module later.

Reject:

- single giant mall cuboid;
- readable text as the only identity;
- too many neon colors.

### C3 Restaurant / Cafe

Purpose:
Small local stop with warmer entrance language.

Footprints:

- 1.2x1.1;
- 1.6x1.2.

Details:

- warm awning;
- front window group;
- side wall depth;
- small patio slab only if the building already works.

No tables, people, cars, or patio clutter until the building passes alone.

### C4 Gym / Service Building

Purpose:
Larger local business module, common in strip areas.

Footprints:

- 2.0x1.5;
- 2.6x1.6.

Massing:

- low warehouse-like volume;
- higher entry block;
- roof edge/parapet.

Details:

- large front glass/door recess;
- side wall panels;
- sign block as geometry, not text dependency;
- roof mechanical cap, optional.

### C5 Grocery / Pharmacy

Purpose:
Common anchor store without becoming a giant mall.

Footprints:

- 2.2x1.6;
- 3.0x1.8.

Massing:

- broad low volume;
- slightly taller entry block;
- parapet with one or two color bands.

Details:

- glass entrance recess;
- sign band as geometry, not label dependency;
- sidewalk apron;
- small side service door.

Reject:

- huge flat retail box;
- bright brand-like colors;
- parking lot carrying the visual instead of the building.

### C6 Gas / Convenience Stop

Purpose:
Recognizable roadside retail module when Atlas needs common suburban corridors.

Footprints:

- store: 1.3x1.1 to 1.7x1.2;
- canopy: 1.8x1.2 to 2.3x1.4.

Massing:

- small store block;
- separate canopy slab with thick supports;
- concrete lot pad.

Details:

- canopy side faces;
- two or three pump blocks only as simple structural cuboids;
- storefront glass recess.

Reject:

- cars;
- brand imitation;
- thin floating canopy;
- pumps as tiny noisy props before the store/canopy read.

## Regular Building Families

### B1 Small Office

Purpose:
Professional services, clinics, admin buildings.

Footprints:

- 1.5x1.3;
- 2.0x1.5.

Massing:

- two stacked volumes;
- flat roof or shallow roof cap;
- repeated glass rhythm.

Details:

- entrance canopy;
- base plinth;
- side-face glass columns;
- roof trim.

Reject:

- blue glass cube;
- skyscraper proportions;
- corporate SaaS look.

### B2 Civic / Public Building

Purpose:
Library, city hall, school, public services.

Footprints:

- 2.0x1.6;
- 2.6x2.0.

Massing:

- symmetrical base;
- central entrance;
- small tower/dome/cap only if kept chunky and simple.

Details:

- steps as voxel slabs;
- column hints as cuboid ribs;
- roof cap;
- plaza pad.

Reject:

- ornate realism;
- thin columns;
- landmark over-detail before common buildings pass.

### B3 Warehouse / Industrial

Purpose:
Edges of town, logistics, light industry.

Footprints:

- 2.0x1.5;
- 3.0x2.0;
- 4.0x2.0.

Massing:

- broad low volume;
- loading bay face;
- roof ribs or skylight strips.

Details:

- loading doors as recessed panels;
- side wall rhythm;
- concrete pad.

No trucks or forklifts in the core pass.

### B4 School / Community Building

Purpose:
Common public/community module without overbuilding a landmark.

Footprints:

- 2.0x1.5;
- 2.8x1.8.

Massing:

- low institutional base;
- central entry;
- gym/classroom wing as stepped side volume.

Details:

- warm brick or cream wall ramp;
- entrance canopy;
- window rhythm;
- flag/monument signs are out of scope until the building reads alone.

### B5 Motel / Small Hotel

Purpose:
Common road-corridor module and compact lodging shape.

Footprints:

- 2.5x1.2;
- 3.5x1.3.

Massing:

- long two-story strip;
- balcony/walkway as a structural band;
- stair block at one side.

Details:

- repeated door/window rhythm;
- side stair volume;
- simple roof cap.

Reject:

- too many tiny doors that shimmer at mobile scale;
- neon sign as identity crutch.

## Road And Lot Families

Roads are a system of physical slabs and curbs. They should support building
read, not dominate it.

### R1 Road Straight

Required:

- asphalt bed with visible thickness;
- left/right curb side faces;
- subtle lane mark only when scale supports it;
- contact shadow where it meets lots.

Reject:

- painted line over grass;
- black asphalt;
- high-contrast lane markings that look schematic.

### R2 Road Corner

Required:

- continuous curb geometry;
- road bed turns as a built module;
- no diagonal smear.

### R3 Road T / Cross

Required:

- intersection reads as one authored tile;
- curb breaks are intentional;
- markings are restrained.

### R4 Crosswalk

Required:

- warm painted bars or pavers that follow the isometric road surface;
- lower contrast than UI marks;
- aligned to curb cuts and sidewalks.

Reject:

- zebra bars floating above road geometry;
- stark white graphic overlay.

### R5 Driveway / Lot Join

Required:

- driveway should connect lot pad to road;
- curb cut has side faces;
- no car prop needed.

### R6 Sidewalk / Walkway

Required:

- warm concrete slab;
- slight height above grass;
- joins to doors and storefronts.

### R7 Parking Lot

Required:

- asphalt or concrete pad as one physical module;
- curb edge or sidewalk edge;
- parking stripes only as low-contrast ground marks;
- no cars.

Reject:

- large blank gray slab;
- bright schematic striping;
- letting the lot dominate the building.

### L1 Residential Lot Pad

Purpose:
Frame houses without becoming a parking lot.

Required:

- foundation slab;
- tiny porch/stoop;
- optional driveway after the house works.

### L2 Commercial Lot Pad

Purpose:
Frame stores/offices.

Required:

- sidewalk band;
- concrete apron;
- optional parking stripes as ground marks only after store massing passes.

Reject:

- parking lot first, building second;
- vehicles as quality crutch.

## Terrain Support Families

Terrain supports the object kit. It should not be the first art flex in this
phase.

Required modules later:

- grass flat tile;
- raised grass edge;
- parcel contact shadow;
- shoreline step;
- sand/water transition;
- district edge chunk.

Rules:

- terrain must be quieter than buildings in house/store lab passes;
- world edges need visible thickness;
- raised chunks need strata, not random cracks;
- terrain should frame buildings and roads with clear negative space.

## Marker And Overlay Rules

Markers are not buildings.

Physical map objects:

- houses;
- stores;
- offices;
- roads;
- lots;
- terrain.

Overlay objects:

- scout pin;
- selected place ring;
- status glow;
- note/sticker badge.

Rules:

- overlays live in a separate layer;
- overlays can glow, buildings should not randomly glow;
- markers should never compensate for weak object silhouettes.

## Module Key Naming

Use stable keys so art, manifest, renderer, and tests can talk about the same
thing.

Recommended shape:

```text
building.house.cottage.front_gable.v1
building.house.cottage.side_gable.v1
building.house.ranch.low_gable.v1
building.house.rowhome.flat_parapet.v1
building.apartment.lowrise.stepped.v1
building.store.corner.awning.v1
building.store.strip.three_bay.v1
building.office.lowrise.glass_band.v1
building.civic.library.stepped_entry.v1
building.school.community.entry_wing.v1
building.warehouse.loading_bay.v1
building.motel.two_story_walkway.v1
road.straight.two_lane.v1
road.corner.two_lane.v1
road.cross.two_lane.v1
road.crosswalk.painted.v1
lot.residential.pad.v1
lot.commercial.apron.v1
lot.commercial.parking_small.v1
terrain.grass.flat.v1
terrain.edge.raised.v1
```

Avoid vague keys:

```text
building1
house_good
sprite_new
store_big
cool_landmark
```

## Data Contract Sketch

This is not implementation yet, but future renderer data should be able to
express modules like this:

```ts
type AtlasVoxelModuleKind =
  | "house"
  | "store"
  | "regular_building"
  | "civic"
  | "road"
  | "lot"
  | "terrain"
  | "overlay";

type AtlasVoxelModuleSpec = {
  key: string;
  kind: AtlasVoxelModuleKind;
  family: string;
  footprint: { width: number; depth: number };
  height: number;
  anchor: { x: 0.5; y: 0.5 };
  paletteRamp: {
    top: string;
    left: string;
    right: string;
    shadow: string;
  };
  structuralDetails: string[];
  requiredAtDetailLevel: 0 | 1 | 2;
  rejectIfMissing: string[];
};
```

## Quality Gates

Every object family must pass these before production renderer port.

### Thumbnail Test

Shrink the screenshot mentally to sidebar size. The module family should still
read: house, store, office, warehouse, civic.

### Silhouette Test

Turn off tiny details. The module should still read from massing and roof/form.

### Face Separation Test

Top, left, and right faces should be visible without black outlines.

### Prop Removal Test

Remove cars, humans, signs, pins, trees, and glows. The object should still be
good.

### Clone Test

Place the module three times with palette/roof variation. It should feel like a
kit, not copy-paste.

### Mobile Crop Test

At 390x844, the object must read without the control panel explaining it.

### Empty Field Test

If the object sits alone on a quiet grass board, it must still feel intentional.

## Rejection Checklist

Reject a module if any are true:

- It needs a text label to identify itself.
- It becomes a flat sticker at mobile scale.
- It uses cars, people, or props to seem finished.
- It has roof color but no roof geometry.
- It has windows as random dots instead of face-attached details.
- It uses one wall color for every face.
- It creates a noisy board when repeated.
- It looks like a generic SaaS illustration asset.
- It cannot be expressed as a stable module key.
- It breaks 2:1 isometric alignment.

## Build Sequence

### E7.25: One Excellent Cottage Family

Deliver:

- front-gable cottage;
- side-gable cottage;
- L-footprint cottage;
- three palette variations;
- desktop/mobile screenshots;
- no roads, cars, humans, trees, water, civic objects, or stores.

Acceptance:

- strongest house is at least 7.5/10 against the current lab;
- no repeated cap-roof cuboids;
- porch/foundation/window/door details are structural.

### E7.26: Residential Variety

Deliver:

- ranch;
- rowhome strip;
- small apartment;
- clone test screenshot.

Acceptance:

- forms are distinguishable without labels;
- repeated neighborhood cluster does not look cloned.

### E7.27: Storefront Kit

Deliver:

- corner store;
- three-bay strip store;
- cafe/restaurant;
- gym/service building.

Acceptance:

- awnings, glass, entrance, sign bands, and pads read structurally;
- no reliance on large text.

### E7.28: Roads And Lots Integration

Deliver:

- straight road;
- corner;
- T/cross;
- driveway join;
- sidewalk;
- residential and commercial lot pads.

Acceptance:

- roads sit under buildings and connect to pads;
- no schematic overlay look;
- no vehicles.

### E7.29: Production Renderer Port Candidate

Deliver:

- one dense 8x8 or 10x10 module cluster;
- deterministic depth sort;
- desktop/mobile screenshots;
- comparison against current production renderer.

Acceptance:

- common modules beat current renderer on taste;
- renderer path remains map-first;
- no backend/product scope changes.

## Worker Prompt Template

```md
Quest: E7.25 One Excellent Cottage Family.

Read:
- experiments/voxel-pastel-lab/OBJECT_KIT_SPEC.md
- experiments/voxel-pastel-lab/HOUSE_ENGINE_QUESTIONS.md
- experiments/voxel-pastel-lab/REFERENCE_NOTES.md
- docs/NEXT_QUESTS.md

Task:
Improve the standalone pastel voxel lab only. Build one excellent cottage
family: front-gable, side-gable, and L-footprint cottages with three palette
variations. Keep the lab file:// runnable.

Anti-scope:
No production renderer replacement, no backend, no MCP/submission JSON, no
persistence, no Stripe, no XP, no evidence, no OAuth, no automation, no deploy,
no cars, no humans, no roads, no trees, no water, no stores, no civic buildings,
no product panels.

Acceptance:
- desktop and 390x844 screenshots;
- nonblank canvas;
- no horizontal overflow;
- clean browser console;
- house forms pass the silhouette, face separation, prop removal, clone, mobile
  crop, and empty-field tests;
- update BUILD_LOG and NEXT_QUESTS precisely.
```
