# Atlas Voxel Graphical Leap Research - 0.58E+

Date: 2026-07-05. Owner: acting CTO. Status: research and Fable launch packet,
not an implementation slice.

## Current quest context

Active product quest stays `0.65H Hosted Clawd Browser Proof`. This packet does
not reopen renderer work inside the Hosted Clawd browser slice. It prepares the
next Fable-class visual move so Claude/Fable can run in an isolated worktree
without rediscovering the visual truth.

Player-facing promise:
Atlas should feel like a map-first ChatGPT App that opens directly onto a
county-scale clay voxel world. Generated districts must stop looking like
placeholder procedural output.

Engineering promise:
The next big visual jump comes from compiler grammar, object-kit metadata, and
owned sprite/asset intake. Do not patch weakness with overlays, dashboard UI,
cars, humans, panels, glows, labels, or random props.

Anti-scope:
No runtime 3D engine, PBR, normal maps, new renderer dependency, public
Anaheim/Ontario, provider-to-geometry path, persistence, Stripe, dashboard,
pricing page, reports, XP, evidence, automation, or new MCP tools.

## Inspected visual truth

Local proof inspected:

- `artifacts/0.57e-parity/generated-district-1.png`
- `artifacts/0.57e-parity/riverside-with-fit.png`
- `assets/reference/atlas-voxel-town-north-star.png`

What is working:

- Curated Riverside/Eastvale now has a recognizable map-first silhouette.
- Labels are mostly lifted off architecture after 0.56E.
- Contact shadows, parcel shape, and the calm green/cream/road palette give the
  surface a real Atlas identity.
- Hosted Clawd UI can sit above the map without turning the app into a SaaS
  dashboard.

What still blocks the big graphical leap:

- Generated districts still read as procedural toy layouts beside curated
  Riverside.
- The lower frame in generated captures has too much empty field and pad space.
- Commercial rows are flat slabs with repeated awnings, not authored strip
  grammar.
- Apartment windows and facade columns drift off wall edges.
- Some lots show foundations/rings without enough building mass.
- Roof planes and eaves still misregister on red-roof service buildings.
- The north-star reference gets its power from dense block rhythm, material
  separation, parcel packing, and camera composition. Atlas should borrow those
  lessons without copying its cars, humans, waterfront set dressing, or signage
  clutter.

## Ranked leap candidates

### 1. Generated District Parity Compiler Pass

This is the highest-value visual pass.
It should include the camera/scene-window composition fix from candidate 5
instead of treating composition as a later polish pass; curated Riverside wins
partly because the first frame is packed and balanced.

Target files:

- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- shared CityWorld object-kit grammar under `packages/core/src/voxel/`
- renderer paths in `web/src/CityWorldRenderer.tsx` only where the compiler needs
  an existing grammar hook exposed

Execution:

- Route parametric commercial rows through the same `commerce_strip` grammar that
  makes Plaza Row read as authored.
- Replace empty lot rings with one of three honest states: built parcel, open
  terrain parcel, or explicitly under-construction shell. Do not draw fake
  foundations as interest.
- Raise parcel fill ratio inside the captured scene window, especially the lower
  half of the generated frame.
- Fix roof/eave registration by deriving roof bounds from the same footprint used
  for wall mass, not a parallel hand offset.
- Bind apartment facade beats to wall extents so columns and windows cannot float
  beyond corners.

Acceptance:

- A generated California district screenshot can sit beside
  `riverside-with-fit.png` without obviously being the weaker path.
- No empty pads, no floating apartment columns, no toy-box strip mall slabs.
- Desktop 1280x720 and mobile 390x844 both retain density and readable
  silhouette.
- Add a numeric parity verifier before calling this done:
  parcel/building fill ratio inside the captured scene window, zero facade
  elements outside wall extents, zero roof/eave footprint mismatches, and a
  lower-frame density floor. Name the first thresholds in the verifier and tune
  from screenshots; do not rely only on agent self-rating.

### 2. Owned Sprite/Asset Intake Lane

Use external assets as research and optional raw source, not as pasted generic
look. Atlas needs an owned 2D isometric sprite/object kit with metadata.

Target files:

- `packages/assets/city-world/`
- CityWorld atlas/manifest contracts
- renderer atlas resolver
- asset verifier scripts

Execution:

- Define a small typed manifest for object families:
  `residential_row`, `commerce_strip`, `civic_landmark`, `apartment_court`,
  `service_gym`, `terrain_tile`, `roof_material`.
- Store source/license/provenance per asset even when the license is CC0.
- Convert or trace into Atlas-owned clay/isometric sprites before runtime use.
- Keep renderer consumption data-driven; do not hardcode new one-off images.

Acceptance:

- One real object-family sprite proves the manifest path end to end.
- Asset manifest verifier fails missing license/source/family/camera metadata.
- Renderer can consume a manifest asset without breaking the vector fallback.

### 3. Depth, Occlusion, And Contact Shadow Pass

This is the second fidelity jump after compiler parity.

Execution:

- Strengthen height ordering for grouped buildings so tall masses occlude lower
  frontage correctly.
- Make family-level cast shadows directional and contact-heavy, not blurry glows.
- Keep contact shadows tied to footprint and height metadata.

Acceptance:

- Buildings read anchored to the ground at first glance.
- Multi-mass civic/commerce/apartment groups do not look transparent or stacked
  randomly.
- Mobile stays clean; no heavy dark mud.

### 4. Roof And Material Atlas

Execution:

- Create a restrained material vocabulary: stucco, glass, clay tile, flat
  membrane, metal awning, asphalt road, packed grass.
- Drive roof face color from family/material metadata instead of local tint
  guesses.
- Add only the strokes and planes needed for legibility.

Acceptance:

- Roof type and facade family are readable without labels.
- Commercial, civic, residential, apartment, and service buildings separate at
  screenshot scale.

### 5. Camera And Scene-Window Composition

Execution:

- Tune generated capture bounds so the bottom half of the first frame is not an
  empty field.
- Bias the default preview toward one readable civic/commercial/residential
  triangle instead of showing every road.
- Keep the map usable, not poster-only.

Acceptance:

- First frame reads as a dense place in three seconds.
- No UI overlap or label collision on 390x844.

## Asset research notes

Use these sources as license-safe reference candidates, not as a reason to turn
Atlas into a stock asset collage.

- PixiJS Assets supports loading textures and spritesheet JSON, which fits an
  Atlas-owned manifest path:
  https://pixijs.com/8.x/guides/components/assets
- PixiJS RenderGroups can help when static world layers and HUD layers need
  separate GPU-friendly scene graphs:
  https://pixijs.com/8.x/guides/concepts/render-groups
- Kenney Voxel Pack is CC0 and includes a small voxel object set. Useful for
  studying simple shape language or as raw reference for Atlas-owned sprites:
  https://www.kenney.nl/assets/voxel-pack
- Quaternius publishes CC0 low-poly assets. Useful as offline reference or raw
  source for rendered isometric sprite studies, not as runtime 3D:
  https://quaternius.com/

Asset policy:

- Prefer CC0 or fully owned generated assets.
- Track provenance even when attribution is not legally required.
- Treat "Atlas-owned" as a production claim, not a vibes claim: the manifest
  must record original source, license, transformation method, authoring tool,
  and whether the runtime sprite is copied, traced, rendered, or hand-authored.
- Do not import copyrighted city-specific models, Google imagery, brand marks,
  or unlicensed map data.
- Do not add runtime 3D dependencies for this lane.

## Claude/Fable launch prompt

Use this when Claude/Fable rate limits clear and the Fable model is available.

```
You are working in Atlas, a map-first ChatGPT App and county-scale voxel engine.
Use Fable for one hard visual-engine pass only.

Current quest:
0.58E Generated District Parity + Asset Intake Plan.

Read first:
- AGENTS.md
- docs/PRODUCT_NORTH_STAR.md
- docs/ENGINEERING_ROUTE.md
- docs/PHASE_PLAN.md
- docs/TOOL_CONTRACTS.md
- docs/NEXT_QUESTS.md
- artifacts/current-update.json
- docs/design/fable-prompts/VOXEL_GRAPHICAL_LEAP_RESEARCH_0.58E.md
- docs/design/fable-prompts/DECAL_DISCIPLINE_SUPERPASS.md tail notes

Goal:
Make generated districts stop reading as procedural placeholders. Close the gap
between artifacts/0.57e-parity/generated-district-1.png and
artifacts/0.57e-parity/riverside-with-fit.png through compiler grammar and
owned asset-intake scaffolding, not decorative overlays.

Likely files:
- packages/core/src/voxel/cityWorldParametricGenerator.ts
- packages/core/src/voxel/*
- packages/assets/city-world/*
- web/src/CityWorldRenderer.tsx
- web/src/cityWorldAtlasResolver.ts
- scripts/verify-*.mjs only if a verifier is needed

Required improvements:
1. Commercial rows route through an authored commerce_strip grammar.
2. Empty lot rings/foundation pads are removed or made honest.
3. Generated scene-window density is raised, especially in the lower frame.
4. Roof/eave registration comes from shared footprint bounds.
5. Apartment facade columns/windows clamp to wall extents.
6. If asset intake is touched, it is CC0/owned, manifest-backed, and keeps
   vector fallback.

Hard anti-scope:
No runtime 3D, PBR, normal maps, new renderer dependency, cars, humans, clutter
props, glows, public Anaheim/Ontario, provider-to-geometry, persistence, Stripe,
dashboard UI, reports, exports, XP, evidence, automation, or new MCP tools.

Proof:
- desktop 1280x720 and mobile 390x844 screenshots
- before/after comparison against 0.57E generated parity and Riverside
- pnpm test:core
- pnpm typecheck:starter
- pnpm build:web
- node scripts/verify-alpha-product-loop.mjs with screenshot output
- node scripts/verify-generated-district-parity.mjs --json-only
  (add this verifier in the slice; it should check parcel/building fill ratio,
  facade element bounds, roof/eave footprint registration, and lower-frame
  density)
- node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc
  --rc-mode hosted-clawd-fable-integration --json-only
- git diff --check

Stop condition:
If generated districts are still visibly weaker, name the plateau and leave the
next exact blocker. Do not hide it with UI.
```

## Human review asks

- Approve the next visual-engine work as a parallel Fable lane after the
  current Hosted Clawd 0.65H browser proof is not at risk.
- Approve the CC0/owned-only asset policy above.
- Treat email as the default review path for future visual packets:
  `mzwin3545@gmail.com`.
- For visual proofs, send desktop and 390x844 mobile screenshots plus a short
  blocker list, not a long status essay.
