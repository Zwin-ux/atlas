# Atlas Reference / Asset Packet

Status: G4 reference and lab-source intake. This packet collects the visual
references and accepted lab assets needed for the next view/graphics-engine
work without changing the production renderer.

## Current Quest

Focus the next visual-engine work on reliable references and source assets.
The F2 UI stays frozen and G3 provider/world identity hardening stays staged.
This lane prepares the next renderer-quality pass; it does not port assets into
runtime production code.

## What Was Collected

Reference images:

- `assets/reference/atlas-voxel-map-tile-marker-kit.png`
- `assets/reference/atlas-voxel-town-north-star.png`
- `assets/reference/a_dark_sleek_infographic_design_document_image.png`
- `assets/reference/a_wide_colorful_concept_art_ui_mockup_poster_fo.png`
- `docs/design/atlas-explore-hud-imagegen-v1.png`
- `docs/design/atlas-explore-hud-imagegen-v2.png`

Accepted lab assets:

- `experiments/voxel-pastel-lab/assets/building-house-rowhome-flat_parapet.v1.svg`
- `experiments/voxel-pastel-lab/assets/building-store-strip-three_bay.v1.svg`
- `experiments/voxel-pastel-lab/assets/road-corner-two_lane.v1.svg`

Prompt artifacts:

- `docs/design/fable-prompts/ground-module-atlas.txt`
- `docs/design/fable-prompts/rowhome-production-candidate.txt`
- `docs/design/fable-prompts/eastvale-no-hud-map-target.txt`

Source specs:

- `docs/design/ATLAS_GRAPHICS_PRODUCTION_PLAN.md`
- `docs/brain/ROAD_LOT_TERRAIN_CONTACT_GRAMMAR_SPEC.md`
- `docs/brain/SPRITE_ATLAS_READINESS.md`
- `docs/brain/THREE_ASSET_FIT_ANCHOR_MATERIAL_SPEC.md`
- `docs/brain/THREE_ASSET_PRODUCTION_INTAKE_SPEC.md`
- `docs/brain/VOXEL_VISUAL_BAR.md`
- `docs/brain/VOXEL_VISUAL_VOCABULARY.md`
- `experiments/voxel-pastel-lab/OBJECT_KIT_SPEC.md`
- `experiments/voxel-pastel-lab/HOUSE_ENGINE_QUESTIONS.md`
- `experiments/voxel-pastel-lab/REFERENCE_NOTES.md`
- `experiments/voxel-pastel-lab/REFERENCE_BAR_DECISION.md`
- `experiments/voxel-pastel-lab/ACTUAL_ASSET_AUTHORING_HANDOFF.md`

Machine-readable index:

- `docs/design/atlas-reference-asset-manifest.json`

## How To Use The References

Use `atlas-voxel-town-north-star.png` for:

- road/lot/terrain contact shadows;
- terrain thickness and shoreline edges;
- roof and facade material separation;
- authored object density.

Do not use it for:

- cars, people, labels, boats, signs, or generated place facts;
- runtime backgrounds;
- product copy.

Use `atlas-voxel-map-tile-marker-kit.png` for:

- module framing;
- tile-kit consistency;
- overlay separation from physical objects;
- palette discipline.

Do not use it for:

- copying icons, labels, object silhouettes, or exact tile art;
- widening the runtime UI.

Use the HUD imagegen files only for:

- Explore HUD silhouette and control rhythm comparison.

Do not use them for:

- fake addresses, hours, source domains, tags, labels, XP, quests, or campaign
  claims.

## Production Intake Order

1. Road/lot/terrain contact grammar.
2. Rowhome acceptance or one narrow rowhome polish pass.
3. Strip-store intake only after rowhome/contact grammar pass.
4. Road-corner intake only after the ground system is accepted.

Do not expand into civic/community-center, trees, cars, humans, broad props, or
full building families until the shared ground/contact system has fresh
desktop and mobile proof.

## Anti-Scope

- No production renderer port in this packet.
- No atlas manifest or resolver edits.
- No backend, MCP, Apps SDK contract, Hosted Clawd, database, package/lock/env,
  Stripe, XP, evidence, reports, exports, OAuth, automation, deploy, or public
  persistence claims.
- No copying generated art or third-party style verbatim.
- No static generated screenshot background.

## Next Worker Prompt

Quest:
Road/lot/terrain contact grammar production pass.

Read:

- `docs/design/ATLAS_REFERENCE_ASSET_PACKET.md`
- `docs/design/atlas-reference-asset-manifest.json`
- `docs/brain/ROAD_LOT_TERRAIN_CONTACT_GRAMMAR_SPEC.md`
- `experiments/voxel-pastel-lab/OBJECT_KIT_SPEC.md`

Task:
Improve the physical contact grammar of the existing production map without
adding new asset families. Roads should sit in terrain, lots and pads should
support buildings, and curb cuts/aprons should read as physical joins.

Anti-scope:
No new objects, cars, humans, trees, civic assets, broad rowhome expansion,
backend, persistence, package/lock/env, MCP contract, deploy, or UI redesign.

Acceptance:

- desktop `1280x720` screenshot;
- mobile `390x844` screenshot;
- one canvas, clean console, no horizontal overflow;
- place select, pan/zoom, sticker drop, note save still work;
- shell counties remain visually honest;
- contact work improves the first 3-second read without making mobile noisy.
