# Next Quests

## Current phase

Quest E8.6 County Question Slice is deployed on Railway. E9.0 Hosted Clawd Beta
contracts are complete locally as docs only. Stripe is connected for planning,
but the next planned lane still requires human approval before any persistence,
checkout, billing webhooks, evidence, or XP implementation.

Parallel execution posture:
Use at most two code-writing Codex worktrees plus one integration/QA thread. The
current safe split is E8.6 County Question Slice plus a separate integration/QA
captain. Add E8.5 as the second code-writing worktree only if app review or
local verification exposes a real tool-surface blocker. Do not create worker
branches from a dirty active renderer slice; finish or park that slice first so
new worktrees do not start from stale code.

Production evolution posture:
Use `docs/PRODUCTION_EVOLUTION_GATES.md` for every substantial slice. Each quest
must name the current maturity level, target maturity level, human approval
gate, what becomes more real, and what remains mock, curated, temporary, or
session-only.

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

### Quest E7.0: Replace map UI with CityWorldRenderer

Hard-reset the visible map around a full-screen Pixi city-world renderer. The old card/panel voxel UI is parked as a reference and is not the default `/preview` surface.

Issue:
`docs/issues/E7.0-city-world-renderer.md`

Required brain:
`docs/VOXEL_WORLD_BRAIN.md`

Acceptance:

- Opening `/preview` shows only a full-screen voxel city map. Done.
- The map feels like a toy city, not a dashboard. Done for Alpha baseline.
- User can drag and zoom. Done.
- User can click Eastvale places. Done.
- The selected-place tray appears as a small overlay, not a card page. Done.
- No old campaign/report labels are visible. Done.
- No visible rejected naming from the previous map pass remains in the default UI. Done.
- Typecheck passes. Done.
- Browser screenshot shows a dense city, not blank slabs. Done for Alpha baseline.

### Quest E7.1: Visual Quality Loop

Improved the accepted full-screen city map without changing the product shape. Pixi still owns the world, React stays as small HUD overlays, and stickers/notes remain session-only.

Issue:
`docs/issues/E7.1-visual-quality-loop.md`

Acceptance:

- `CityWorldScene` stays the renderer contract and gains atlas-ready metadata for future sprite replacement. Done.
- Buildings render by category instead of as one generic slab style. Done.
- Roads have curbs, lane details, crosswalks, intersections, and driveway cuts. Done.
- Terrain has grass variation, park paths, plaza paving, water edges, and grounded shadows. Done.
- Props include tree clusters, benches, parked cars, shop signs, streetlights, shrubs, and water details. Done.
- Ambient cars and walkers read as tiny world objects, not dots. Done.
- Drag, wheel zoom, pinch zoom, hover, place click, sticker drop, and note save still work. Done.
- No campaign/report/sidebar/card UI returns to the default map. Done.

### Quest E7.2: Sprite Atlas Readiness

Moved the full-screen city map from hard-coded drawing colors toward a manifest-driven art lane while preserving primitive fallback.

Issue:
`docs/issues/E7.2-sprite-atlas-readiness.md`

Brain:
`docs/brain/SPRITE_ATLAS_READINESS.md`

Acceptance:

- Defined and exported the `CityWorldAtlasManifest` contract. Done locally.
- Added validation for current `CityWorldScene` `spriteKey` and `paletteKey` values. Done locally.
- Added `packages/assets/city-world/atlas.manifest.json` with stable keys, palettes, anchors, tags, and fallback kinds. Done locally.
- Added a renderer atlas resolver with primitive fallback. Done locally.
- Routed buildings, props, actors, and pins through the resolver. Done locally.
- Included visible primitive-path quality improvements for pins, shop signs, trees, cars, and note markers. Done locally.
- Kept code-generated primitives as fallback. Done locally.
- Browser QA proved the full-screen map, desktop/mobile canvas, no overflow, no old visible language, sticker drop, and note save. Done locally.

### Quest E7.3: Browser QA And Interaction Hardening

Verified the post-resolver city map in local Chrome and fixed the note tray interaction discovered during QA.

Issue:
`docs/issues/E7.3-browser-qa-and-interaction-hardening.md`

Acceptance:

- Desktop preview loads one full-screen Pixi canvas. Done locally.
- Mobile `390x844` loads one full-screen Pixi canvas with no horizontal overflow. Done locally.
- No visible old language appears: `campaign`, `report`, `signal`, `risk`, `tactical`, `dashboard`, `board`. Done locally.
- Console is clean. Done locally.
- Sticker drop keeps sticker counts separate from note pins. Done locally.
- Note save increments note count and shows the saved note text in the tray. Done locally.
- Temporary browser QA server was stopped and temp logs were removed. Done locally.

### Quest E7.4: Real Sprite Proof

Added the first real texture-backed sprite through the city-world atlas resolver.

Issue:
`docs/issues/E7.4-real-sprite-proof.md`

Acceptance:

- Added `packages/assets/city-world/textures/pin-sticker-favorite.svg`. Done locally.
- Added manifest frame and anchor data for `pin.sticker.favorite`. Done locally.
- Resolver can return sprite mode for the favorite sticker pin after Pixi loads the texture. Done locally.
- Primitive fallback remains active for every missing texture and while the sprite loads. Done locally.
- Preview remains map-first and nonblank. Done locally.
- Build verification passes for web and widget surfaces. Done locally.

### Quest E8.6: County Question Slice

Added the smallest read-only county-question capability for the Riverside/Eastvale demo.

Issue:
`docs/issues/E8.6-county-question-slice.md`

Acceptance:

- Tool is read-only, non-destructive, and closed-world. Done locally.
- Answers use curated Riverside pack facts and source notes only. Done locally.
- It can explain why Eastvale is the first slice. Done locally.
- It can explain which curated signals support mobile detailing. Done locally.
- It narrows or refuses unsupported county/business claims. Done locally.
- It does not save state or claim live market truth. Done locally.
- Verification covers one supported and one unsupported question. Done locally.

### Operating slice: Production Evolution Gates

Added the operating spec for promoting Atlas work from mock to curated Alpha to
verified live read-only to persisted Beta to production release.

Spec:
`docs/PRODUCTION_EVOLUTION_GATES.md`

Acceptance:

- Every substantial future quest must name maturity level, target maturity level,
  human approval gate, what becomes more real, and what remains mock, curated,
  temporary, or session-only. Done locally.
- Human approval gates are explicit for public claims, live-provider expansion,
  persistence, money, and automation. Done locally.
- Project loop and worker prompts point to the gate spec. Done locally.

### Quest E8.6 Public Integration And Deploy

Deployed the seven-tool E8.6 surface to Railway and verified public MCP,
submission, preview, and browser behavior.

Acceptance:

- Railway deploy succeeds. Done.
- Public MCP lists `ask_county_question` plus the existing Alpha tools. Done.
- Public MCP verifies supported and unsupported county questions. Done.
- Public submission verifier passes. Done.
- Public preview HTTP verifier passes. Done.
- Public browser QA shows Riverside/Eastvale map controls, clean console, and
  sticker interaction. Done.

### Quest E9.0: Hosted Clawd Beta Contracts

Defined Hosted Clawd Beta persistence and pricing contracts without implementing
storage, auth, Stripe, evidence, XP, or automation.

Issue:
`docs/issues/E9.0-hosted-clawd-beta-contracts.md`

Acceptance:

- Minimum persisted entities are defined. Done locally.
- Future Hosted Clawd tool access checks are documented. Done locally.
- Required ownership, usage-limit, idempotency, county-pack, and map-state tests
  are specified before implementation. Done locally.
- Alpha copy says payment and persistence are not live. Done locally.
- Human approval gates are named before persistence or money work starts. Done
  locally.

### Quest E9.0A: Stripe Billing Plan

Added Stripe Billing planning to the Hosted Clawd Beta contract without creating
Stripe products, prices, checkout sessions, Customer Portal sessions, webhooks,
or paid access code.

Acceptance:

- Connected Stripe account is documented for planning only. Done locally.
- Hosted Clawd billing shape uses Stripe Billing, hosted Checkout Sessions,
  recurring Prices, Customer Portal, and webhook-synced access. Done locally.
- Database contract includes Stripe subscription and webhook idempotency fields.
  Done locally.
- Future tool contracts include checkout and billing portal boundaries. Done
  locally.
- `HUMAN_APPROVAL_BEFORE_MONEY` and `HUMAN_APPROVAL_BEFORE_PERSISTENCE` remain
  blocking gates before implementation. Done locally.

## Next

### Quest E6.5: Quest Preview slice parked

Quest Preview was started, then deliberately parked so the map could become the primary product surface first.

Acceptance:

- `preview_campaign_quests` is not exposed in the active MCP tool surface.
- Quest Preview service/types/routes are not part of the current implementation.
- Future quest work must sit behind a stronger map-first interaction model.

### Quest E6.6: Voxel City World Map

Make the map itself the product surface: a geo-grounded, polished city/world map with playable districts, known places, stickers, notes, ambient life, pan/zoom, and SVG fallback.

Acceptance:

- App opens into the Riverside/Eastvale map view instead of Scout Drop or campaign mode.
- `VoxelScene` supports `VoxelWorld`, districts, places, stickers, notes, and ambient state.
- User can select a district, inspect a place, add a session-only sticker, and save a session-only note.
- Pixi renders places, ambient resident/traffic hints, stickers, pan, zoom, and hover/select affordances.
- SVG fallback renders a readable simplified place map.
- Model-visible MCP output remains concise; full scene state stays in `_meta`.
- No auth, Stripe, persistence, live traffic, automated posting, DMs, or full USA rendering.

### Quest E8.5: ChatGPT Tool Surface Hardening

Use only if app review feedback or local verification finds a review-facing blocker after `select_county`.

Issue:
`docs/issues/E8.5-chatgpt-tool-surface-hardening.md`

Acceptance:

- Server, docs, submission JSON, and verifiers list the same active tools.
- Every tool has accurate annotations and output schema.
- `select_county` keeps full scene data in `_meta.scene`.
- `lookup_world_places` returns normalized Atlas data only.
- Negative cases cover payments, DMs, scraping, saving provider data, and mass outreach.
- `pnpm verify:mcp` or `pnpm verify:submission` passes against a local server.

### Quest E8.1: Provider Category Map + County Lookup Adapter

Connect the USA-scale world API foundation to real provider normalization without changing the visible map UI.

Issue:
`docs/issues/E8.1-provider-category-map-and-county-lookup.md`

Brain:
`docs/brain/USA_ENGINE_THINKING.md`

Acceptance:

- Core world types can represent provider-independent place categories. Done.
- Google Places API place types normalize into Atlas categories behind adapters. Done.
- County/city/district lookup contracts are typed and documented. Done.
- Existing E8.0 world API routes keep working. Done locally and on Railway.
- No raw Google payload reaches Pixi, React, `VoxelScene`, or `CityWorldScene`. Done.
- No new dashboard UI, auth, persistence, Stripe, or national canvas is added. Done.
- Railway deploy and public smoke checks. Done.

### Quest E8.2: Apps SDK World Lookup Tool

Expose the E8.1 normalized provider lookup through the ChatGPT app tool surface.

Acceptance:

- `lookup_world_places` is exposed as a read-only MCP tool. Done.
- Tool is marked `openWorldHint: true` because it can call Google Maps Platform. Done.
- Tool returns normalized Atlas categories and source notes only. Done.
- Tool does not expose raw Google `primaryType`, `types`, or `placeId` fields. Done.
- MCP verifier lists and calls the tool locally. Done.
- Submission JSON and tool docs include the new tool. Done.
- Railway deploy and public MCP smoke checks. Done.

### Quest E8.3: World Lookup Cache + Query Policy

Harden the live lookup tool so repeated ChatGPT calls do not waste provider quota or feel slow.

Acceptance:

- Successful world lookup responses are cached in memory by normalized query, radius, and adapter mode. Done.
- Cache is bounded and expires using the lookup response TTL. Done.
- Lookup response exposes runtime cache status without exposing secrets or provider payloads. Done.
- MCP verifier proves the second identical lookup hits cache. Done locally and on Railway.
- No persistence, database, auth, or renderer changes are added. Done.

### Quest E8.4: ChatGPT App Review Polish + QA Harness

Make Atlas submission-ready as a ChatGPT app by tightening the submission artifact, MCP verification, public preview checks, and review documentation.

Issue:
`docs/issues/E8.4-chatgpt-app-review-polish.md`

Acceptance:

- Submission copy clearly states map-first product shape and Alpha limits. Done.
- Submission includes a live lookup negative case for scraping, saving provider data, and mass outreach. Done.
- `verify:submission` validates submission JSON, MCP tool annotations, output schemas, provider boundaries, `_meta.scene`, and manual Alpha guardrails. Done locally.
- `verify:preview:http` validates preview delivery and catches old dashboard/report shell copy in served HTML. Done locally.
- Browser QA verifies `/preview` renders a full-screen city map on desktop and mobile. Done locally and on Railway.
- Railway deploy succeeds and public MCP/submission/preview checks pass. Done.

### User-directed slice: first real ChatGPT county selection

Acceptance:

- `select_county` exists in the active MCP tool surface. Done locally.
- Riverside selection compiles a typed `VoxelScene` from `data/county_packs/riverside-ca.json`. Done locally.
- Eastvale is the selected/highlighted node for the first demo slice. Done locally.
- Full widget render data stays in `_meta.scene`; model-visible `structuredContent` stays concise. Done locally.
- Raw Google/provider payloads do not reach the renderer. Done locally.
- No live ingestion, Three.js, auth, Stripe, persistence, or broad e2e stack is added. Done locally.

## Later

### Quest E8: Expand Google Maps adapter

Add more production policies, quota controls, and place attribution once the live Railway path is stable.

### Quest E8.0: USA Engine API Foundation

Make Atlas ready for the V1 USA-scale engine without rendering the whole country at once.

Issue:
`docs/issues/E8.0-usa-engine-api-foundation.md`

Architecture brain:
`docs/USA_ENGINE_ARCHITECTURE.md`

Acceptance:

- Normalize country/state/county/district/place identity. Done for curated Riverside scaffold.
- Document county/district/world API response contracts before implementation. Done.
- Keep Google and future providers behind backend adapters. Done.
- Add cache key, TTL, source-note, and attribution policy for provider-derived signals. Done for curated source notes.
- Keep `CityWorldScene` as the renderer contract for one playable district/city slice. Done.
- Keep Railway as the assumed live backend lane. Done.
- Do not add a national canvas, persistence, auth, Stripe, or new dashboard UI in this slice. Done.

Implemented routes:

- `GET /api/world/us/states`
- `GET /api/world/us/states/CA/counties`
- `GET /api/world/counties/riverside-ca`
- `GET /api/world/counties/riverside-ca/districts/eastvale-city-slice`

### Quest E9.1: Hosted Clawd Approval And Storage Choice

Human approval gate before code:
`HUMAN_APPROVAL_BEFORE_PERSISTENCE`.

Human approval gate before checkout or Stripe mutations:
`HUMAN_APPROVAL_BEFORE_MONEY`.

Decision needed:
- Storage provider and migration strategy.
- Auth/account ownership model.
- Whether pricing remains $20/month before Stripe work starts.
- Whether to create the Hosted Clawd Stripe Product and recurring Price in test
  mode first, then copy to live only after launch approval.

Anti-scope until approved:
- No database migrations.
- No OAuth/account linking.
- No Stripe Products, Prices, Checkout Sessions, Customer Portal Sessions, or
  webhook endpoints.
- No evidence uploads.
- No XP grants.
