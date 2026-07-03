# Axiom Engine Reference Stack

Status: active GM reference packet.

Purpose:
Atlas needs stronger references than internal iteration loops. This document
turns outside references into Atlas-specific engineering standards for the Big
4. It is not a dependency list and does not approve package installs.

## ChatGPT App Skill Adoption

Source:
`https://github.com/BayramAnnakov/chatgpt-app-skill`

Decision:
Use the skill as a checklist and prompt-shaping reference only. Do not install
it into Atlas automatically. Atlas already has a mature app surface and stricter
project law: map-first, seven-tool stability, session-only state, and no paid or
persistence scope right now.

Adopted ideas:

- Fit model: Atlas is strongest on Show, because the voxel map communicates
  county state better than text. It also has Know through curated/source-noted
  county data and limited Do through session-only pins/notes.
- Tool discipline: one job per tool, concise model-visible content, structured
  content for follow-up reasoning, large scene data in `_meta`.
- Widget discipline: mobile support, clear loading/empty states, compact state,
  no raw provider payloads in the widget.
- Testing discipline: direct, indirect, and negative golden prompts for app
  triggering and refusal behavior.
- Submission discipline: accurate annotations, no misleading metadata, mobile
  widget proof, privacy/terms/domain readiness later.

Rejected or parked ideas:

- OAuth, database token storage, checkout, external deployment templates, broad
  mutation receipts, and production auth are not active during Engine Beta.
- Generic list/card widget templates should not replace Atlas' full-screen map
  surface.

## Official Apps SDK Guardrail

Atlas should continue to treat ChatGPT as the host and the widget as a compact
map-first app surface. The server owns tool contracts and data boundaries. The
widget renders state and keeps local session interactions small. Public tool
responses must stay direct and non-internal.

Big 4 impact:

- Mira owns golden prompts, product language, mobile comprehension, and widget
  surface proof.
- Forge owns tool response shape, `_meta` boundaries, source notes, and no raw
  provider leakage.
- Lumen owns map rendering quality but cannot create product truth.

## Voxel And Isometric Engine References

These are inspiration and architecture checks, not dependencies.

### GameBlocks

Source:
`https://github.com/xt4d/GameBlocks`

Use as a reference adapter for engine discipline, not a runtime dependency.
Atlas should inspect concepts such as `WorldBasis`, `PlanarUtils`,
`TerrainSampler`, `BoardEnvironment`, debug projection, and camera-framing
patterns before inventing new coordinate or terrain math.

Atlas rule:
Adapt the useful concepts into Atlas-owned `@atlas/core`, `CityWorldScene`,
diagnostics, and Pixi renderer contracts. Do not vendor GameBlocks, add
Three/Rapier dependencies, import actor/vehicle/combat systems, or turn the
public app into a game-kit UI. The working adapter is
`docs/GAMEBLOCKS_ATLAS_ADAPTER.md`, guarded by
`scripts/verify-gameblocks-atlas-adapter.mjs`.

### VoxCity / VoxelSpace / Pixels2Voxels

Sources:
`https://github.com/kunifujiwara/VoxCity`,
`https://github.com/s-macke/voxelspace`, and
`https://github.com/s-du/Pixels2Voxels`.

Use these through the External Voxel Reference Adapter, not as dependencies.
VoxCity is the strongest reference for grid geometry, source coverage policy,
footprint-to-cell assignment, voxel layers, memory caps, material/window
grammar, and surface metadata. VoxelSpace is a terrain/composition reference
for height maps, color maps, occlusion buffers, and distance LOD. Pixels2Voxels
is useful only as an offline source-art contrast/channel inspection reference.

Atlas rule:
Adapt these into Atlas-owned `CityWorldBasis`, `CityWorldScene`,
diagnostics, source-readiness contracts, object face metadata, and screenshot
proof. Do not vendor the repositories, add Python/Open3D dependencies, replace
the Pixi map with a terrain-only renderer, or let provider/source imagery become
public map geometry. The adapter is
`docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md`, guarded by
`scripts/verify-external-voxel-reference-adapter.mjs`.

### Obelisk.js

Use as a reminder that clean isometric voxels rely on crisp face separation and
consistent primitive dimensions. Atlas should borrow the discipline, not the
library.

Atlas rule:
Every building family must pass top/left/right face separation and silhouette
tests before labels.

### Pixi Tilemap Family

Use as a performance and batching reference. Atlas already uses Pixi, so the
important lesson is to keep repeated ground/road modules structured and
batchable instead of hand-painting every pixel from the renderer.

Atlas rule:
Road, lot, terrain, and residential modules should move toward declarative
module metadata and deterministic renderer primitives, with sprite fallback only
when it improves the read.

### Isomer-Style Primitive Grammar

Use as a geometry clarity reference: prisms, extrusions, and clear coordinate
space beat random cuboids.

Atlas rule:
Hidden draft districts need an object-kit grammar for venues, transit halls,
commercial strips, apartments, residential blocks, roads, lots, and terrain
edges. A second district should not be a renamed clone of Anaheim or Riverside.

## Atlas-Specific Engine Standards

Lumen standards:

- Object category reads before labels.
- Two anchors per candidate must pass no-label recognition before promotion.
- No cars, humans, trees, decorative props, glows, or panels as compensation.
- SoCal palette means restrained stucco, terracotta, sage, glass blue, asphalt,
  concrete, and shadow ramps, not rainbow default blocks.
- Draft scenes must prove venue/transit/commercial grammar, road/lot grounding,
  and mobile-read scale.

Forge standards:

- Every playable promotion needs source-to-scene trace: Census/source identity,
  anchor pack, curated/draft pack, compiler proof, visual packet, product proof,
  split guard.
- Provider lookup does not equal scene readiness.
- Candidate readiness must be machine-readable and blocker-grouped.

Mira standards:

- Public copy says what users can do now.
- Tool output must not leak compiler, promotion, GEOID, or internal verifier
  language.
- Shell and unsupported states need a visible path back to Riverside/Eastvale.
- Golden prompt proof should cover: play Riverside, browse CA shells, lookup
  places, ask local question, and reject saved/live/paid claims.

Axiom standards:

- Integrate only packet-bearing work.
- Reject visual changes that improve screenshots by adding clutter.
- Reject data changes that make hidden drafts look public.
- Run the Big 4 packet sentinel before deploy discussion.

## Near-Term Reference-Backed Artifact Ladder

1. Forge E15.1: candidate readiness aggregator.
2. Lumen E15.2: hidden draft voxel grammar and two-anchor native pass.
3. Mira E15.3: ChatGPT entry surface and golden prompt proof.
4. Axiom E15.4: integrated reference-backed release packet.
5. E16: decide Anaheim versus Ontario from readiness evidence, not vibes.
