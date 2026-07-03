# GameBlocks Atlas Adapter

Status: active reference adapter only.

Source:
`https://github.com/xt4d/GameBlocks`

Purpose:
GameBlocks is useful because it has concise building blocks for fragile game
engine problems: world basis, planar math, terrain sampling, world bounds,
camera rigs, and small UI state models. Atlas should adapt those ideas into
its own `@atlas/core`, `VoxelScene`, Pixi renderer, diagnostics, and verifier
stack. Atlas should not vendor GameBlocks or become a Three/Rapier browser game.

## Adapter Decision

Use GameBlocks as a pattern library, not as a runtime dependency.

Atlas already has the important boundaries:

- `@atlas/geo` owns provider lookup and usage policy.
- `@atlas/core` owns county state, readiness contracts, and `CityWorldScene`.
- The renderer consumes `VoxelScene` / `CityWorldScene` grammar.
- Product UI stays map-first and session-only.

Any GameBlocks-inspired code must enter through an Atlas-owned contract and a
focused verifier. Do not copy a whole module family because it looks close.

## Relevant GameBlocks Concepts

### `WorldBasis`

Adapt the idea, not the file.

Atlas needs one source of truth for board axes, isometric projection vocabulary,
planar direction, viewport framing, and diagnostic measurements. A future
Atlas-owned basis helper should live under `packages/core/src/voxel/` or the
renderer boundary only after Axiom/Lumen name the exact metric it improves.

Best first use:
Pre-Alpha 0.8E should stop inventing ad hoc coordinate language in each
renderer pass. Define Atlas board-space, screen-space, and map-space words once.

### `PlanarUtils`

Adapt as deterministic helpers for lot/road/building contact, chunk edge
membership, and rectangular/diamond bounds. This belongs in the scene compiler
or diagnostics layer, not in product UI.

Best first use:
Protect `buildingLotContactRatio`, `lotRoadContactRatio`, empty-board ratio,
and future no-label anchor bounding boxes from per-slice math drift.

### `TerrainSampler`

Adapt as a metrics and sampling pattern, not as a mesh generator. Atlas is a
2:1 Pixi voxel board, so terrain sampling should describe shelf height,
chunk-edge language, field density, and first-viewport composition rather than
Three.js mesh vertices.

Best first use:
Turn 0.7E terrain massing into reusable terrain diagnostics before another
visual slice starts.

### `BoardEnvironment`

Adapt for world bounds, valid board cells, spawn/safe zones for camera proof,
and debug harness constraints. This should help `atlasDebug=engine` explain the
board without leaking debug language into the normal ChatGPT app.

Best first use:
Keep normal Riverside, shell, and unsupported screens from depending on hidden
debug state or one-off viewport assumptions.

### `MinimapProjector2D`

Park for now. It can inform debug-only projection summaries later, but it must
not become a new dashboard, directory, or generic minimap panel in the public
app.

### Camera Rig Patterns

Use only as a reference for repeatable framing and browser proof. Atlas should
not add a 3D camera system. The near-term value is measured desktop/mobile
viewports, detail crops, and screenshot proof that map-first UI remains readable.

## Explicit Non-Adapters

Do not adapt these GameBlocks areas into Atlas Engine Beta:

- actor motion;
- vehicles, cars, walkers, combat, pickups, weapons, health, or AI;
- Rapier physics;
- Three.js mesh factories or material systems;
- cockpit/HUD/game-menu patterns;
- persistent local settings as product state;
- generic game UI panels that compete with the county map.

These would make Atlas feel like a prototype game kit instead of a ChatGPT app
that turns counties into voxel worlds.

## Atlas Adapter Rules

1. Start with an Atlas metric or product problem.
2. Read the relevant GameBlocks concept as a reference.
3. Write an Atlas-owned contract or helper under the existing package boundary.
4. Keep provider data behind `@atlas/geo`; provider lookup never becomes map
   geometry or readiness proof.
5. Keep large scene data out of model-visible tool text.
6. Add a verifier before claiming the adapter helped.
7. Prove desktop and `390x844` mobile if the adapter touches visible behavior.

## Recommended Next Slice

Pre-Alpha 0.8E should be `WorldBasis / TerrainSampler Adapter Discipline`:

- define Atlas board-space, screen-space, and viewport terms;
- use those terms in diagnostics and scene grammar comments;
- harden terrain/viewport metrics against one-off coordinate math;
- preserve the current Pixi renderer and `CityWorldScene` contract;
- produce no product UI change unless a screenshot proves a comprehension bug.

Pass condition:
The adapter reduces engine drift and makes the next visual slice easier to
measure. It is not a pass if it only adds theory docs or imports a new engine.
