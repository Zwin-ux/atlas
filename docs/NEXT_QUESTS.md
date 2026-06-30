# Next Quests

## Current phase

Quest E6 Apps SDK/MCP hardening is complete locally. Railway/Google backend is live.

## Completed

### Quest E0: Install prompt pack

Created or updated docs, prompts, plugin skills, issue template, CI placeholder, Riverside demo county data, asset prompts, and placeholders.

### Quest E1: Bootstrap TypeScript monorepo

Created the intended workspace shape:

- `apps/widget`
- `apps/web`
- `packages/core`
- `packages/mcp`
- `packages/geo`
- `packages/config`
- `packages/assets`

Acceptance status:

- pnpm workspace shape is explicit.
- Placeholder packages compile.
- Placeholder widget builds with Vite + React.
- No real product logic added.
- Existing root Apps SDK starter is documented as temporary in `docs/STARTER_SANDBOX.md`.

### Quest E2: Build county pack schema

Created the curated county data foundation:

- Zod schema for county packs.
- Typed Riverside demo pack loader.
- Minimal package-level invariant test.
- No live ingestion.

Acceptance status:

- `data/county_packs/riverside-ca.json` validates.
- Loader returns typed county data.
- Invalid county pack shape fails with `CountyPackValidationError`.
- Focused verification command passes.

### User-directed infrastructure: Railway + Google geo

Status:

- Google Maps adapter scaffold is wired before Quest E3.
- Mock remains a fallback, not the desired Railway mode.
- Railway backend runs with `GEO_DATA_ADAPTER=google`.
- Public backend: `https://atlas-backend-production-e6fc.up.railway.app`

Acceptance:

- API key lives only in ignored local env or Railway variables.
- `/api/geo/status` reports live Google mode when env is set. Done.
- `/api/geo/geocode?query=Eastvale%2C%20CA` returns a Google-derived location. Done.

### Quest E3: Build VoxelScene renderer

Render a light county board from a `VoxelScene` contract.

Acceptance:

- `VoxelScene` contract exists before renderer details. Done.
- Renderer consumes only `VoxelScene`, not raw county packs. Done.
- Eastvale can appear as a node in a placeholder scene. Done.
- Route can display. Done.
- Do not consume raw Google payloads directly in the renderer. Done.

Anti-scope:

- Do not add live geocoding.
- Do not build full 3D.
- Do not add Scout Drop logic yet.
- Do not add campaign generation yet.

### Quest E4: Implement Scout Drop mock flow

Eastvale/mobile detailing returns a strong Scout Drop report from curated Riverside signals.

Acceptance:

- Scout Drop tool chooses Eastvale as the target node. Done.
- Widget state moves from County to Scout Drop to Scout Report. Done.
- Report uses the existing `VoxelScene` panel shape. Done.
- Expected signals appear: Residential Demand, Fast Route Access, QR Flyer Opportunity, Property Manager Outreach, Partnership Target. Done.
- Map state includes scout route and highlighted nodes. Done.
- No full campaign generation, posting, DMs, persistence, or live market claims. Done.

### Quest E4.5: Improve voxel visualization/UI

Make the Scout Drop board feel like a real tactical product surface instead of a static mock.

Acceptance:

- PixiJS is the default renderer for the map stage. Done.
- SVG renderer remains as a fallback if Pixi cannot mount. Done.
- `VoxelScene` supports optional render objects, camera, layers, and Clawd mood/pulse fields. Done.
- Desktop and mobile previews render a canvas, preserve the report panel, and avoid horizontal overflow. Done.
- Apps SDK tools keep full render data in `_meta` instead of bloating model-visible `structuredContent`. Done.

### Quest E5: Implement Campaign Engine preview

Build the manual campaign preview from an existing `ScoutPreviewState`.

Acceptance:

- Input is an existing Scout Drop preview, not a fresh live search. Done.
- Output includes a 7-day plan, manual QR/local group/property manager steps, route-aware priorities, and asset placeholders. Done.
- Widget can move from Scout Report to Campaign Preview without claiming automation. Done.
- No posting, DMs, paid ad execution, Stripe, auth, or persistence. Done.

### Quest E6: Wire Apps SDK/MCP tools

Harden the Apps SDK tool surface and prepare the app for review.

Acceptance:

- Every exposed MCP tool has explicit `readOnlyHint`, `openWorldHint`, and `destructiveHint`.
- Every tool has an `outputSchema`.
- Widget CSP is narrow and matches actual runtime needs.
- Submission/test copy is truthful about Alpha limits.
- MCP Inspector can call the main flow: Scout Drop to Campaign Preview.

Acceptance status:

- Exposed tool surface is narrowed to `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`. Done.
- Starter-era `draft_atlas_brief` and `render_atlas_brief` tools were removed from the MCP surface. Done.
- Every exposed tool has explicit `readOnlyHint`, `openWorldHint`, and `destructiveHint`. Done.
- Every exposed tool has an `outputSchema`. Done.
- Widget CSP is narrow: no connect or resource domains are requested by the inline bundle. Done.
- MCP flow verifier can call the main flow from Scout Drop to Campaign Preview. Done.
- `chatgpt-app-submission.json` exists for review/upload. Done.

## Next

### Quest E6.5: Add Quest Preview slice

Turn the Campaign Preview into a small manual quest preview without persistence.

Acceptance:

- Campaign preview can produce 3-5 manual quests with proof prompts.
- Quest preview stays temporary and does not grant XP.
- Widget can show the quest preview without crowding the map/report layout.
- Upgrade copy explains that Hosted Clawd is required for saved quests, evidence, and XP.
- No auth, Stripe, persistence, automated posting, DMs, or ad execution.

## Later

### Quest E7: Expand Google Maps adapter

Add more production policies, quota controls, and place attribution once the live Railway path is stable.

### Quest E8: Hosted Clawd Beta

Auth, DB, persistence, Stripe checkout.
