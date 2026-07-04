# Road / Lot / Terrain Contact Grammar Spec

Owner: Lumen - Art Captain / Voxel-Engine Captain

Status: next visual-engine code slice spec. This does not approve new props,
new modules, a broad renderer port, or a visual lab tunnel.

## Decision

Run Engine Beta 2B as a production renderer cohesion pass focused on the ground
system under the existing county world.

The E10.6.1 and E10.7 screenshots are deployable, but the main visual weakness
is now the contact grammar between roads, lots, pads, terrain, and buildings.
Buildings and markers have improved enough that the painted-on ground layers
are the first thing making the map feel less authored.

Do not solve this with cars, humans, trees, fountains, signs, decorative props,
extra labels, or new panels. The pass should make the existing world feel more
physical.

## Objective

Make the Eastvale production map read as one tactile isometric county diorama:

- roads sit in the terrain instead of floating as dark ribbons;
- sidewalks, aprons, and lot pads feel like physical slabs under buildings;
- parcel pads support buildings without oversized pale boards;
- road-to-lot joins have curb cuts and contact shadows;
- terrain variation supports the focal area without becoming noisy;
- shell counties stay honest and do not look like fake playable towns.

## Allowed Scope

Likely files:

- `packages/core/src/voxel/cityWorldCompiler.ts`
- `packages/core/src/voxel/cityWorldTypes.ts` only if a small typed metadata
  field is needed
- `packages/core/test/city-world-compiler.test.ts`
- `web/src/CityWorldRenderer.tsx`
- `packages/assets/city-world/atlas.manifest.json` only for existing
  road/terrain material metadata or fallback tuning
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`

The first implementation should avoid new image assets unless a current atlas
entry is already meant for this purpose. Prefer renderer/material grammar and
compiler metadata over expanding the module set.

## Anti-Scope

- No cars, humans, walkers, clouds, benches, streetlights, fountains, signs, or
  decorative filler props.
- No trees, water expansion, civic modules, new building families, or new
  product objects.
- No dashboard panels, product cards, campaign loops, onboarding, reports, or
  exports.
- No backend, MCP/submission JSON, persistence, Stripe, XP, evidence, OAuth,
  automation, staging, or deploy changes.
- No broad production renderer rewrite.
- No standalone lab reopening unless Axiom explicitly asks for a separate lab
  proof.

## Visual Pass Criteria

### Riverside / Eastvale

Pass when desktop and `390x844` screenshots show:

- roads have visible curb thickness or edge treatment that fits the `2:1`
  isometric grid;
- intersections and driveway joins read as embedded road modules, not painted
  lines crossing a green board;
- commercial aprons and residential pads sit under buildings with restrained
  contact shadows;
- the Eastvale Core, rowhome, strip-store, cottage, and ranch modules feel
  planted on their parcels;
- road markings are quieter than building silhouettes and do not dominate
  mobile;
- terrain tiles have enough face/material variation to avoid the empty-field
  problem without becoming noisy;
- selected-place marker, labels, pins, notes, and the county switcher remain
  readable.

Fail when:

- roads look like dark ribbons pasted above the terrain;
- lot pads look like oversized cream cards;
- added texture makes mobile muddy;
- road/lot work competes with buildings as the main subject;
- the pass needs props or new objects to look acceptable;
- interactions or shell county states regress.

### Shell Counties

Pass when Orange shell and unsupported shell remain visually honest:

- Orange can show a quiet bounded isometric shell because it is indexed but not
  playable;
- unsupported can remain flatter, but it must look intentional rather than
  broken;
- neither shell should show fake buildings, fake roads, fake districts, fake
  markers, or local scene detail;
- the county switcher and shell card stay readable on mobile.

Fail when a shell county looks complete, playable, or provider-backed when it
is not.

## Implementation Shape

Recommended order:

1. Audit current production road, lot, terrain, and building contact drawing in
   `CityWorldRenderer`.
2. Identify the smallest shared contact primitives: curb edge, pad shadow,
   apron edge, driveway join, and terrain seam.
3. Apply them to existing roads/lots/buildings without changing the scene
   contract if possible.
4. If typed metadata is required, add one narrow optional field and compiler
   tests that prove older scenes still render.
5. Capture before/after screenshots using the same county states as E10.7:
   Riverside desktop, Riverside mobile, Orange shell mobile, unsupported
   mobile.

## Screenshot Requirements

Required before and after:

- Riverside desktop `1280x720`
- Riverside mobile `390x844`
- Orange shell mobile `390x844`
- Unsupported shell mobile `390x844`

Optional if time allows:

- Orange shell desktop `1280x720`
- Unsupported shell desktop `1280x720`

The handoff must answer:

- Does the first 3-second read improve?
- Do buildings feel more planted?
- Do roads and lots feel less painted-on?
- Did mobile get cleaner or noisier?
- Did shell counties remain truthful?

## Verification Commands

```powershell
pnpm test:core
pnpm typecheck:starter
pnpm build:starter
pnpm verify:preview:http
node scripts/verify-alpha-product-loop.mjs --url http://127.0.0.1:8787/preview --screenshots <artifact-dir>
git diff --check -- packages\core\src\voxel packages\core\test web\src packages\assets\city-world docs\BUILD_LOG.md docs\NEXT_QUESTS.md
```

Use the public product-loop verifier after deploy only if Axiom decides to
ship the slice.

## Rejection Rules

Reject the slice if:

- it adds decorative objects instead of improving ground contact;
- it makes shell counties look playable;
- it worsens mobile readability;
- it requires broad renderer restructuring;
- it touches backend, persistence, money, evidence, automation, deploy, or
  other gated product scope;
- it makes the county switcher or tray harder to use.

## Next Decision

If 2B passes, the next visual-engine decision should be either:

1. Shell County Diorama Honesty Pass, if coverage states are the public focus;
   or
2. Building Repetition / Roof-Material Pass, if Riverside remains the public
   hero screenshot.

Do not start either until 2B has screenshot evidence.
