# Three-Asset Production Intake Spec

Owner: Lumen - Art Captain Specialist / Voxel-Engine Captain

Status: intake spec only. This does not approve a production renderer port.

## Decision

Choose Option A: production-intake spec.

Do not run a production renderer spike yet. The standalone lab pass proves the
three authored assets are useful, but the production renderer still has a
different contract, scale, layer stack, atlas resolver, and interaction surface.
Pasting one lab SVG into the map now would test image loading more than it
would prove art quality.

The next code slice, if Axiom explicitly opens it, should be a one-asset intake
spike for the rowhome only. The spike must be reversible, fallback-backed, and
accepted or rejected by screenshots.

## Source Assets

Only these accepted standalone lab assets are candidates:

- `building.house.rowhome.flat_parapet.v1`
- `building.store.strip.three_bay.v1`
- `road.corner.two_lane.v1`

Lab source files:

- `experiments/voxel-pastel-lab/assets/building-house-rowhome-flat_parapet.v1.svg`
- `experiments/voxel-pastel-lab/assets/building-store-strip-three_bay.v1.svg`
- `experiments/voxel-pastel-lab/assets/road-corner-two_lane.v1.svg`

Current production atlas keys are different. A spike must not silently overload
generic keys such as `building.home.gable.0` unless the before/after screenshot
shows the replacement is better in the real Eastvale map.

## Production Constraints To Map

### Renderer Contract

The production renderer consumes `CityWorldScene` through:

- `CityWorldBuilding.spriteKey`
- `CityWorldBuilding.paletteKey`
- `CityWorldRoadModule.spriteKey`
- `CityWorldRoadModule.paletteKey`
- manifest entries in `packages/assets/city-world/atlas.manifest.json`
- resolver loading in `web/src/cityWorldAtlasResolver.ts`
- fallback drawing in `web/src/CityWorldRenderer.tsx`

No lab-only object shape can enter production unless it is expressible through
that contract or through one deliberately scoped contract addition.

### Footprint And Scale

The production tile size is `56x32` in a `2:1 isometric` grid.

Candidate production footprints:

| Lab key | Production candidate | Footprint expectation | First allowed spike |
| --- | --- | --- | --- |
| `building.house.rowhome.flat_parapet.v1` | new manifest key, not generic home overwrite | about `3.0 x 1.1` tiles; anchor at front/bottom center | yes |
| `building.store.strip.three_bay.v1` | new manifest key after rowhome proves | about `3.5 x 1.4` tiles; anchor at storefront apron edge | no |
| `road.corner.two_lane.v1` | map to `road.module.corner` only after building fit is stable | 1 corner tile; anchor at road-module center | no |

The first spike should not change compiler generation broadly. It may target a
single known Eastvale rowhome/home-cluster instance or one narrow scene
metadata override so screenshots can compare asset fit without rewriting the
map system.

### Anchor Rules

Building assets:

- anchor is the front/bottom center of the physical footprint;
- sprite origin must land on the same projected point as the primitive
  building bottom;
- contact shadow remains inside the parcel footprint;
- no large transparent pad should extend beyond the lot enough to look floaty;
- selected/hover rings must remain visible without cutting through the asset.

Road asset:

- anchor is the module center, not a corner;
- sprite must sit in `roadLayer`, below lots/buildings/markers;
- rotation and scale must preserve the apparent curb thickness;
- low-contrast marks must remain embedded in the road surface.

### Layer Order

Production draw order must remain:

1. terrain
2. road modules or road segments
3. lots
4. buildings
5. props and actors
6. labels
7. markers, stickers, notes, and selected-place affordances

The three lab assets are physical map objects. They must not move into marker,
label, HUD, or overlay layers.

### Fallback Behavior

Every production spike must preserve:

- manifest validation for sprite and palette keys;
- resolver fallback to primitive mode if texture load fails;
- current interaction behavior: place select, pan/zoom, sticker drop, note save;
- no crash when the asset file is missing, moved, or rejected.

If the asset cannot load, the existing primitive production map must render
nonblank and remain interactive.

## One-Asset Spike Plan

Only if Axiom opens code implementation:

1. Add one rowhome production asset entry and loader path.
2. Apply it to one controlled Eastvale building instance or narrow metadata
   override.
3. Keep primitive fallback active.
4. Capture before and after screenshots on desktop and `390x844`.
5. Accept only if the real map improves without hurting interactions.

Likely allowed code files for that future spike:

- `packages/assets/city-world/atlas.manifest.json`
- one asset under `packages/assets/city-world/textures/`
- `web/src/cityWorldAtlasResolver.ts`
- the smallest needed metadata assignment in `packages/core/src/voxel/cityWorldCompiler.ts`
- `web/src/CityWorldRenderer.tsx` only if anchor/scale requires a tiny
  reversible adjustment

Do not include the strip store or road corner in the first spike.

## Post-Alpha Worker Packet

Quest:
Rowhome-only production renderer intake spike.

Timing:
Run only after Functional Alpha RC is deployed or Axiom explicitly reopens
visual-engine code. Do not run during RC cutting.

Objective:
Prove or reject one accepted lab asset in the real production map without
turning it into a broad renderer port.

Source asset and key:

- source key: `building.house.rowhome.flat_parapet.v1`
- source asset:
  `experiments/voxel-pastel-lab/assets/building-house-rowhome-flat_parapet.v1.svg`
- production candidate key:
  `building.house.rowhome.flat_parapet.v1`
- first target: one controlled Eastvale residential/rowhome-like building
  instance only, or one narrow metadata override that produces exactly one
  visible rowhome test object.

Likely production files:

- `packages/assets/city-world/atlas.manifest.json`
- `packages/assets/city-world/textures/building-house-rowhome-flat_parapet.v1.svg`
- `web/src/cityWorldAtlasResolver.ts`
- `packages/core/src/voxel/cityWorldCompiler.ts`
- `web/src/CityWorldRenderer.tsx` only for a tiny anchor/scale guard if the
  manifest values alone cannot align the sprite
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md` only if the quest state changes

Required fallback:

- If the new texture fails to load, `createCityWorldAtlasResolver` must return
  primitive mode for that building.
- The production map must remain nonblank and interactive with the primitive
  building.
- Existing place selection, pan/zoom, sticker drop, note save, labels, markers,
  and selected-place affordances must remain usable.

Implementation shape:

1. Copy the accepted rowhome SVG into the production city-world texture folder
   without modifying the lab source.
2. Add one manifest sprite entry with explicit `frame`, `anchor`, `scale`,
   `fallback: "building"`, and tags including `building:home` and
   `building:rowhome`.
3. Add the import/texture source for that one key in the atlas resolver.
4. Apply the sprite key to one controlled production building only. Do not
   change broad home generation.
5. If the first anchor/scale reads pasted-on, try at most two manifest-only
   anchor/scale adjustments before rejecting the spike.
6. If renderer code is needed, limit it to a tiny, reversible building sprite
   alignment guard. Do not refactor the renderer.

Baseline screenshots before code changes:

- desktop `1280x720` production preview
- mobile `390x844` production preview
- both must show the target residential area before the rowhome asset is
  applied

After screenshots:

- desktop `1280x720` production preview with the rowhome candidate active
- mobile `390x844` production preview with the rowhome candidate active
- use the same camera/interaction path as the baseline as closely as possible

Browser QA:

- page identity remains Atlas city map / preview
- one nonblank full-screen Pixi canvas
- no horizontal overflow
- clean console
- place selection works
- pan/zoom smoke works
- sticker drop works
- note save works

Visual pass criteria:

- Rowhome reads as a deliberate residential module in the first 3 seconds.
- Asset bottom/front edge sits on the parcel instead of floating above it.
- Contact shadow and foundation stay inside the apparent footprint.
- The sprite improves silhouette, parapet mass, grouped windows, and mobile
  read over the current primitive/procedural building in that area.
- Selected-place rings, labels, sticker pins, and note pins remain readable.
- The map still feels like one coherent toy county world, not a screenshot with
  one pasted asset.

Visual fail criteria:

- Asset looks like a sticker or pasted UI icon.
- Asset is too large or too detailed compared with nearby production modules.
- Transparent/foundation area makes the building float.
- The production map becomes harder to read on `390x844`.
- The spike needs props, labels, cars, humans, trees, water, or extra modules
  to make the rowhome look acceptable.
- The spike requires broad renderer rewrites or changes to backend/product
  behavior.

Stop condition:
If the rowhome still looks pasted-on after at most two manifest-only
anchor/scale adjustments, disable the runtime sprite use, keep primitive
fallback, and report rejection. Do not move on to strip store or road corner.

Verification commands:

```powershell
pnpm test:core
pnpm typecheck:starter
pnpm build:starter
pnpm verify:preview:http
git diff --check -- packages\assets\city-world web\src packages\core\src\voxel docs\BUILD_LOG.md docs\NEXT_QUESTS.md
```

Handoff must include:

- changed files;
- baseline screenshot paths;
- after screenshot paths;
- browser QA results for desktop and `390x844`;
- whether primitive fallback was preserved;
- blunt accept/reject verdict against this spec;
- visual rating against the two reference images;
- explicit recommendation: continue to strip store, revise rowhome art, or stop
  the production intake lane.

## Screenshot Gates

Required evidence for any production spike:

- baseline production desktop screenshot before the asset change;
- candidate production desktop screenshot after the asset change;
- baseline production `390x844` screenshot before the asset change;
- candidate production `390x844` screenshot after the asset change;
- standalone lab reference screenshot from the accepted pass;
- console clean in both desktop and mobile;
- no horizontal overflow;
- one nonblank full-screen Pixi canvas;
- place select, pan/zoom, sticker drop, and note save smoke still pass.

The screenshot comparison must answer:

- Does the first 3-second read improve?
- Does the asset sit in the world or look pasted on?
- Does mobile read improve without relying on a label?
- Does the primitive fallback still look acceptable if the asset fails?

## Rejection Rules

Reject the spike and keep fallback if any are true:

- the asset looks like a sticker on the map;
- the asset scale is larger than surrounding production modules in a way that
  breaks the county diorama;
- the foundation/contact shadow floats above the parcel;
- selected-place markers, sticker pins, or note pins become harder to use;
- mobile crop gets noisier or less readable;
- the change requires adding props, labels, panels, or extra modules to look
  good;
- the change touches backend, MCP/submission, persistence, Stripe, XP, evidence,
  OAuth, automation, staging, or deploy;
- the production renderer must be broadly refactored to make one asset work.

## Pass Bar

An accepted one-asset production intake spike must be at least a visible
`+0.5` improvement over the current production screenshot for that object area.

It does not need to make the whole map beta-quality. It must prove that the
lab-authored asset lane can enter the real map without degrading renderer
cohesion or product interactions.

If the rowhome fails, do not test the strip store or road corner. Return to
asset authoring or manual art direction.
