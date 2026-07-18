# Atlas Full Product Recon

Date: 2026-07-13  
Branch: `codex/integrate-hosted-clawd-fable-058e`  
Current gate: `0.78-1V Census County Board Product + Certification Gate`

## Product interpretation

Atlas is a spatial decision companion inside ChatGPT. Chat is the command
surface; the voxel county is the shared visual context. Its distinctive loop is:

`Explore -> Ask -> Drop Clawd -> Scout -> Campaign`

Eastvale is the current playable proof cell. Census boards and generated
districts are the USA-scale engine underneath that loop, not separate products.
Hosted Clawd is a gated continuity layer, not the center of the public V1.

The product is strongest when a tool call changes, focuses, or annotates the
world. It weakens when the map becomes wallpaper behind report sheets, engine
controls, or future save/billing UI.

## Current truth

- Riverside/Eastvale is the only public playable district.
- Census boards are honest, flag-gated boundary-and-water products awaiting
  owner screenshot review, a separate deploy decision, and real ChatGPT G8.
- Scout and Campaign are useful session-only previews; they do not execute or
  persist work.
- The public tool surface remains exactly seven tools.
- Local 0.78-1V work is not the production revision yet.

## Vertical order

### P0 - close the current release gate

1. Owner reviews the 12 certified Census-board screenshots with an explicit
   map-dominance, framing, honesty, occlusion, and light/dark rubric.
2. Add a release-identity preflight before any deploy: require the intended SHA,
   require the clean deploy worktree at that SHA, version the widget resource,
   and distinguish automated G7 from human real-host G8.
3. Deploy only after the packet is committed and the owner explicitly approves
   the deploy gate.

### P1 - deepen the spatial product after the gate

1. `0.78-2 Real Town Anchors` is the only authorized geography continuation.
2. Make Scout the obvious next move from a selected place; do not lead with an
   internal "Generate a district" action.
3. Make Scout route rows and campaign days focus or mark their map locations so
   the intelligence lives in the world instead of a report sheet.
4. On mobile, collapse competing controls and trays so the map keeps the first
   visual and interaction priority.
5. Keep save/Hosted Clawd secondary until the public gate actually opens.

### P2 - reduce structural risk after release

1. Extract pure MCP presenters, then tool registration, then HTTP routing from
   `server/src/index.ts`; keep it as the composition root.
2. Extract renderer projection/camera/color helpers, then terrain, roads, lots,
   props, labels, and building grammar in that order.
3. Make `apps/web`, `apps/widget`, and `packages/mcp` truthful thin adapters or
   retire the placeholder surfaces.

## Implemented in this recon

`0.78-1V-Q Public Tool Truth Pass`:

- Save/checkout capability state now fails closed and is absent from the public
  V1 payload when the save surface is off or unset.
- Eastvale playable-loop questions win over overlapping generic source words.
- Hotel-family provider types outrank mixed spa/fitness amenities in lookup-only
  normalization.

This pass adds no tools, geometry, persistence, checkout execution, public
claims, deployment, or town detail.
