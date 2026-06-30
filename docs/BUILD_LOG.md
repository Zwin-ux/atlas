# Build Log

## Entry 001

Quest:
Remapped Atlas prompt pack to actual engineering route.

What changed:
Created engineering docs, service stack, Google Maps adapter spec, voxel renderer spec, project loop, Codex prompts, plugin skills, issue templates, workflow placeholder, and Riverside demo county data.

Verification:
Prompt pack generated.

Next:
Run prompts/00_ENGINEERING_SETUP.md in Codex.

## Entry 002

Quest:
Run `prompts/00_ENGINEERING_SETUP.md` inside the Atlas workspace.

What changed:
Copied the engineering prompt pack into `engineering-prompt-pack/`, synced active docs, prompts, assets, data, plugin skills, GitHub issue template, and CI placeholder into the repo, and merged the engineering route into root `AGENTS.md`.

Verification:
Read `AGENTS.md`, `docs/ENGINEERING_ROUTE.md`, and verified required setup files exist with `Test-Path`.

Next:
Start Quest E1: bootstrap the TypeScript monorepo shape without product logic.

## Entry 003

Quest:
Quest E1: Bootstrap TypeScript monorepo.

What changed:
Created explicit pnpm workspace packages under `apps/` and `packages/`, added a Vite + React placeholder widget shell, added placeholder web/core/config/geo/mcp/assets packages, updated root scripts to typecheck/build the workspace skeleton, and documented the existing root `server/` and `web/` Apps SDK starter as a temporary sandbox.

Verification:
`pnpm build:workspaces` passed.

Next:
Start Quest E2: county pack schema and Riverside demo loader.

## Entry 004

Quest:
Quest E2: Build county pack schema.

What changed:
Added `packages/core/src/county` with Zod schemas, inferred types, `CountyPackService`, clear validation errors, and a package-level invariant test that validates the Riverside demo pack and confirms invalid shapes fail clearly.

Verification:
`pnpm --dir packages/core typecheck`, `pnpm test:core`, and `pnpm build:workspaces` passed.

Next:
Start Quest E3: define `VoxelScene` and build the first renderer shell.

## Entry 005

Quest:
User-directed Railway and Google Maps backend hookup.

What changed:
Added a real `@atlas/geo` adapter interface with mock and Google implementations, wired Geocoding API, Places API (New) nearby search, and Places Aggregate API compute insights, added backend geo probe endpoints, added Railway config-as-code, and documented secret handling.

Verification:
`pnpm --dir packages/geo typecheck`, `pnpm build:server`, and `pnpm build:starter` passed. A local Google-mode probe returned Eastvale geocoding, 3 nearby restaurant results, and an aggregate restaurant count. Railway deployment succeeded at `https://atlas-backend-production-e6fc.up.railway.app`; `/health`, `/api/geo/status`, `/api/geo/geocode?query=Eastvale%2C%20CA`, and `/preview` passed.

Next:
Use the Railway backend URL for ChatGPT Apps SDK testing, then continue Quest E3 renderer work.

## Entry 006

Quest:
Quest E3: Build the first VoxelScene renderer shell.

What changed:
Added the browser-safe `@atlas/core/voxel` contract and Riverside demo `VoxelScene`, built an SVG isometric county board renderer in `apps/widget`, mirrored it into the temporary root `web` Apps SDK preview, added Eastvale highlighting, route line, Clawd placeholder sprite, right scout report panel, and bottom flow rail.

Verification:
`pnpm --dir packages/core typecheck`, `pnpm --dir apps/widget typecheck`, `pnpm exec tsc -p web/tsconfig.json --noEmit`, `pnpm build:starter`, and `pnpm build:workspaces` passed. Browser verification loaded `http://localhost:8787/preview`, found no console errors, captured desktop/tablet/mobile screenshots, and confirmed selecting Gym / Plaza updates the report panel. Railway deployment `c1470133-62c0-46d0-b8f6-94680df96b5c` succeeded; public `/preview`, `/health`, `/api/geo/status`, and Eastvale geocode passed.

Next:
Start Quest E4: Scout Drop mock flow.

## Entry 007

Quest:
Quest E4: Implement Scout Drop mock flow.

What changed:
Added `@atlas/core/scout` with `ScoutDropService`, deterministic Eastvale/mobile-detailing signal scoring from the Riverside `VoxelScene`, a six-stop scout route, risks, channels, next actions, and Hosted Clawd upgrade copy. Wired `preview_scout_drop` into the Apps SDK server with concise model-visible `structuredContent` and widget-only `VoxelScene` data in `_meta`, added `/api/scout/drop` for local/Railway smoke checks, and made the widget default to the Eastvale Scout Drop flow in local preview. The `VoxelScene` report panel now renders best offer, scored signals, route stops, watch items, channels, next actions, and the manual campaign CTA.

Apps SDK notes:
The Scout Drop tool is read-only, non-destructive, uses the versioned `ui://widget/atlas-board-v2.html` resource/template, keeps API keys server-side, stores only widget-local selection state, sends host messages via request semantics, and does not claim persistence, posting, DMs, or live market research.

Verification:
`pnpm --dir packages/core typecheck`, `pnpm --dir apps/widget typecheck`, `pnpm exec tsc -p web/tsconfig.json --noEmit`, `pnpm typecheck:starter`, `pnpm build:starter`, and `pnpm --dir apps/widget build` passed. Compiled local API smoke returned `scout-riverside-ca-eastvale-mobile-detailing` with flow `done,done,active,next` and expected signals: Residential Demand 88, Fast Route Access 80, QR Flyer Opportunity 82, Property Manager Outreach 76, Partnership Target 72. The Scout Drop full widget preview is about 17.8 KB, while the model-visible structured output is about 3.7 KB after moving scene data to `_meta`. Browser verification loaded `/preview`, found no console errors, and captured desktop/tablet/mobile screenshots.

Next:
Deploy E4 to Railway, then start Quest E5: Campaign Engine preview.

## Entry 008

Quest:
E4.5: Upgrade the voxel board from SVG-only to PixiJS tactical visualization.

What changed:
Added PixiJS to the root Apps SDK preview and standalone widget, extended the `VoxelScene` contract with optional render objects, layers, camera, and Clawd mood/pulse fields, enriched the Riverside/Eastvale scene with tactical objects, and made Pixi the default map renderer with the existing SVG renderer preserved as fallback. The Apps SDK tools still keep model-visible `structuredContent` concise and place renderer-heavy scene data in `_meta`.

Verification:
`pnpm build:starter` and `pnpm build:workspaces` passed. Browser QA loaded `http://127.0.0.1:8796/preview`, verified one Pixi canvas, the Scout Drop report panel, no horizontal overflow on `390x844`, no console errors after a fresh reload, and captured desktop/mobile screenshots.

Next:
Deploy the E4.5 renderer to Railway, then start Quest E5: Campaign Engine preview.

## Entry 009

Quest:
Quest E5: Implement Campaign Engine preview.

What changed:
Added `CampaignPreviewService` in `@atlas/core` to create a manual 7-day campaign preview from an existing `ScoutPreviewState`. The preview includes route-aware priorities, QR/local group/property manager/partner/profile steps, asset placeholders, guardrails, and a campaign `VoxelScene` panel. Added the Apps SDK `preview_campaign_engine` tool plus `/api/campaign/preview`, kept full scene data in `_meta`, and made local `/preview` CTA transition from Scout Report to Campaign Preview without needing a ChatGPT host.

Apps SDK notes:
The campaign tool is read-only, non-destructive, closed-world, and requires the `scoutPreviewId` returned by `preview_scout_drop`. It does not post, DM, buy ads, persist state, or perform live campaign execution.

Verification:
`pnpm --dir packages/core typecheck`, `pnpm test:core`, `pnpm typecheck:starter`, `pnpm build:starter`, and `pnpm build:workspaces` passed. Local API smoke returned `campaign-riverside-ca-eastvale-mobile-detailing` with 7 days, 6 route priorities, 5 asset placeholders, and manual guardrails. Browser verification loaded `/preview`, clicked `Draft manual campaign`, confirmed the Campaign Preview panel, Pixi canvas, no console errors, and no mobile overflow at `390x844`.

Next:
Deploy E5 to Railway, then start Quest E6: Apps SDK/MCP tool hardening and submission readiness.

## Entry 010

Quest:
Quest E6: Apps SDK/MCP tool hardening and submission readiness.

What changed:
Removed the starter-era `draft_atlas_brief` and `render_atlas_brief` tools from the exposed MCP server, added the read-only `get_upgrade_options` tool for Hosted Clawd Alpha/Beta boundaries, aligned the tool contract docs with the actual review-facing tool surface, added `scripts/verify-mcp-flow.mjs`, wired `pnpm verify:mcp`, and generated `chatgpt-app-submission.json`.

Apps SDK notes:
The exposed Alpha tools are now `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`. Every exposed tool has explicit `readOnlyHint`, `openWorldHint`, and `destructiveHint`, plus an `outputSchema`. Widget CSP remains narrow with no connect/resource domains because the bundle is inline and does not fetch external resources.

Verification:
`pnpm typecheck:starter` passed. `pnpm build:starter` passed. `pnpm build:workspaces` passed. `pnpm verify:mcp` passed against a temporary built server on `http://127.0.0.1:8790/mcp`, listing the four expected tools and calling `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`. Railway deployment succeeded, and `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed after the public service rolled to the E6 build.

Next:
Review/upload `chatgpt-app-submission.json`, then start Quest E6.5: add a temporary Quest Preview slice without persistence or XP grants.

## Entry 011

Quest:
Quest E6.6: Voxel City World Map.

What changed:
Parked the partial Quest Preview slice from the active tool/app surface, added a scalable `VoxelWorld` model to `VoxelScene`, added session-only sticker and note helpers, expanded the Riverside demo into a county hub with an Eastvale playable district and known places, and changed the root/widget previews to open as a map-first city/world map instead of a Scout Drop report. Pixi now renders known places, sticker badges, ambient resident/traffic hints, pan/zoom, and hover/select place affordances; the SVG fallback renders a simplified place map.

Apps SDK notes:
The exposed Alpha tool surface remains `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`. `render_voxel_county` keeps model-visible output concise with map summary counts while the full `VoxelScene` stays in `_meta`. Stickers and notes are widget-local session state only.

Verification:
`pnpm test:core`, `pnpm typecheck:starter`, and `pnpm --dir apps/widget typecheck` passed before browser QA.

Next:
Run browser QA for desktop/mobile canvas rendering, district/place selection, sticker placement, note saving, and no horizontal overflow.

## Entry 012

Quest:
E7.0 planning reset: Replace map UI with CityWorldRenderer.

What changed:
Created `docs/VOXEL_WORLD_BRAIN.md` as the authoritative renderer reset plan for a full-screen Eastvale voxel city map, created `docs/issues/E7.0-city-world-renderer.md`, and updated quest/decision docs so the next implementation pass replaces the card/panel map UI instead of polishing it.

Product notes:
The new target language is city/world map, town map, or Eastvale city slice. Do not use the rejected earlier naming. React should only provide tiny HUD overlays; Pixi owns the city world, interaction, layers, pins, labels, and ambient life.

Verification:
Docs-only pass. Verified the new brain and E7.0 issue exist and searched for remaining new-plan wording before handoff.

Next:
Implement E7.0 from `docs/VOXEL_WORLD_BRAIN.md`: full-viewport Pixi canvas, typed `CityWorldScene`, layered city renderer, small HUD overlays, and no old dashboard/card/report UI.

## Entry 013

Quest:
Quest E7.0: Replace map UI with CityWorldRenderer.

What changed:
Added the typed `CityWorldScene` contract and compiler, switched the root preview and widget to `CityWorldView`, built the full-viewport Pixi `CityWorldRenderer`, and parked the old card/panel renderer path as fallback/reference only. The default app now opens into an Eastvale city map with small HUD overlays, local stickers, local notes, drag, wheel zoom, pinch zoom, hover, place click, labels, pins, cars, walkers, water, and Clawd.

Apps SDK notes:
The MCP tool surface remains compatible. `render_voxel_county` still keeps model-visible `structuredContent` concise and sends the full `VoxelScene` in `_meta`. The widget resource URI is versioned for the city world surface, prefers no border, and requests fullscreen display mode when available.

Verification:
`pnpm test:core`, `pnpm typecheck:starter`, `pnpm --dir apps/widget typecheck`, `pnpm build:web`, `pnpm --dir apps/widget build`, and `pnpm build:server` passed. Browser QA on `http://localhost:8787/preview` verified one full-screen canvas, nonblank desktop and mobile screenshots, no old report/flow/card UI classes mounted, no visible campaign/report/signal/risk/tactical/board language, drag camera movement, wheel and pinch zoom, clicks on Eastvale Core, Gym, Community Park, and Apartments, sticker drop, and no mobile horizontal overflow.

Next:
Start Quest E7.1: visual quality loop. Keep the full-screen map shape, improve code-generated voxel art, and add atlas-ready metadata without adding a new UI shell or dependencies.

## Entry 014

Quest:
Quest E7.1: Visual Quality Loop.

What changed:
Added atlas-ready metadata to `CityWorldScene` render objects, including terrain, roads, lots, buildings, props, actors, and pins. Enriched the Eastvale authored scene with denser props, shrubs, benches, parked cars, extra water shimmer, additional streetlights, and more cars/walkers. Reworked the Pixi renderer with stronger terrain variation, road curbs/lane details/crosswalks, lot details, category-specific building art, richer props, clearer cars/walkers, sorted prop/actor depth, and proper destruction of old Pixi children during redraw. Kept the default UI as a full-screen city map with only small React HUD overlays.

Apps SDK notes:
The MCP tool surface and payload boundary stayed compatible. `render_voxel_county` still returns concise `structuredContent` and full scene data in `_meta`; no raw Google payload reaches the renderer. No persistence, auth, Stripe, campaign flow, Three.js, Lottie map objects, or new dependencies were added.

Verification:
`pnpm test:core`, `pnpm typecheck:starter`, `pnpm --dir apps/widget typecheck`, `pnpm build:web`, `pnpm --dir apps/widget build`, and `pnpm build:server` passed. Browser QA loaded `http://localhost:8787/preview`, verified one full-screen Pixi canvas, no old report/flow/stage/map-frame/legend UI mounted, no visible campaign/report/signal/risk/tactical/board/dashboard language, clean console after adding the favicon route, desktop and mobile no horizontal overflow, nonblank dense city screenshots, drag movement, wheel zoom, synthetic pinch zoom, Gym/Park/Apartments place clicks, sticker drop, and note save.

Next:
Start Quest E7.2: sprite atlas readiness. Keep the current map-first experience and introduce real atlas manifest validation plus a small production-art slice with code-generated fallback.

## Entry 015

Quest:
USA-scale engine direction lock.

What changed:
Added `docs/USA_ENGINE_ARCHITECTURE.md` to make the V1 national engine target explicit, created `docs/issues/E8.0-usa-engine-api-foundation.md`, and updated product, engineering, service stack, Google adapter, next quest, and decision docs. The durable direction is that Atlas should scale through backend world contracts and provider adapters, while the renderer consumes bounded `CityWorldScene` slices for the current playable county or district.

Tooling notes:
The current required MCP server remains the Atlas Apps SDK MCP server. Additional MCP servers/connectors should be added only when there is a concrete bottleneck: OpenAI Developers for submission/API-key flows, Railway deploy/log/env tooling if available, database MCP once Hosted Clawd storage is selected, and GitHub MCP when remote issue/PR workflow becomes useful.

Verification:
Docs-only pass. Read the active product/engineering/service docs before editing.

Next:
After E7.2 sprite atlas readiness, start E8.0 USA Engine API Foundation: normalized world identity, API contracts, provider-independent place categories, cache/TTL/source policy, and Google adapter expansion behind `GeoDataAdapter`.

## Entry 016

Quest:
E8.0 USA Engine API Foundation scaffold.

What changed:
Added `@atlas/core/world` contracts for US country, state, county, district, and place identity, plus cache/source-note policy. Added `NationalWorldService` backed by the current curated Riverside `VoxelScene`. Exposed read-only server routes for `/api/world/us/states`, `/api/world/us/states/:stateCode/counties`, `/api/world/counties/:countySlug`, and `/api/world/counties/:countySlug/districts/:districtSlug`.

Product notes:
This does not render the USA, add a dashboard, or call new provider APIs. It gives the server a clean contract for progressively loading US geography while the frontend continues consuming bounded `CityWorldScene` slices.

Verification:
`pnpm test:core`, `pnpm --dir packages/core typecheck`, `pnpm typecheck:starter`, and `pnpm build:server` passed before route smoke checks.

Next:
Smoke the new world API routes locally, then expand E8.0 later with provider-independent category mapping and Google-backed county/district lookup behind `GeoDataAdapter`.

## Entry 017

Quest:
Atlas brain refresh after E8.0.

What changed:
Added `docs/brain/USA_ENGINE_THINKING.md` and updated the brain index so future map/engine passes start from the combined product and service direction. Created `docs/issues/E8.1-provider-category-map-and-county-lookup.md` as the next backend-scale issue, and updated the USA architecture and next-quest docs to treat E8.0 as complete locally rather than upcoming.

Product notes:
The next best move is E8.1 if the priority is V1 USA coverage and backend scale. E7.2 remains the visual-quality lane when the next priority is sprite/atlas fidelity. Neither path should bring back the old dashboard/card/campaign framing.

Verification:
`git diff --check` passed for the updated brain, issue, architecture, next-quest, and build-log docs. `pnpm test:core` passed with 5 test files and 14 tests.

Next:
Implement E8.1 when the next execution loop starts.

## Entry 018

Quest:
E8.1 Provider Category Map + County Lookup Adapter.

What changed:
Added provider-independent world place categories, lookup-safe world response types, and `NationalWorldService.lookupPlaces`. Added geo-side provider type normalization so Google/mock nearby place data becomes Atlas-owned categories before reaching world contracts. Added the read-only `GET /api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500` route, which returns a resolved location summary, normalized place summaries, cache policy, and source notes.

Product notes:
This is a backend scale slice only. It does not compile live provider places into a city scene, change the full-screen Pixi map, add persistence, or expose provider payloads to React/Pixi.

Verification:
`pnpm test:core`, `pnpm --dir packages/geo typecheck`, `pnpm --dir packages/core typecheck`, `pnpm typecheck:starter`, `pnpm build:server`, and `pnpm --dir packages/core exec vitest run --root ../.. packages/geo/test/place-category-normalizer.test.ts` passed. Local smoke on port 8791 passed for `/api/world/us/states`, `/api/world/us/states/CA/counties`, `/api/world/counties/riverside-ca`, `/api/world/counties/riverside-ca/districts/eastvale-city-slice`, and `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500`. The lookup route ran in Google mode, returned 20 normalized place summaries, and exposed no raw `primaryType`, `types`, or `placeId` fields in place summaries.

Railway:
Deployment `60d657f2-9117-4c46-9473-884497dd2245` succeeded. Public smoke passed for `/health`, `/api/geo/status`, `/api/geo/geocode?query=Eastvale%2C%20CA`, the E8.0 world routes, and `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500`. Railway reported Google mode configured/live. Public lookup returned 20 normalized place summaries with categories fitness, food/drink, landmark, park, school, service, and shop, with no raw provider fields in place summaries.

Next:
Start E8.2 world lookup caching and provider query policy, or return to E7.2 sprite atlas readiness if the next priority is visual quality.

## Entry 019

Quest:
E8.2 Apps SDK World Lookup Tool.

What changed:
Exposed the E8.1 lookup flow as the `lookup_world_places` MCP tool. The tool resolves a location, calls the same normalized world lookup helper as `/api/world/lookup`, and returns `worldPlaceLookup` structured content. It is read-only, destructive false, and correctly marked `openWorldHint: true` because it can call Google Maps Platform. Updated MCP instructions, tool docs, the verifier, and `chatgpt-app-submission.json`.

Product notes:
This makes the live provider-normalized place lookup available inside ChatGPT without changing the map UI or compiling live places into a city scene. The tool returns normalized Atlas categories and source notes, not raw provider fields.

Verification:
`chatgpt-app-submission.json` parsed successfully. `pnpm build:server` and `pnpm typecheck:starter` passed. Local `ATLAS_MCP_URL=http://127.0.0.1:8792/mcp pnpm verify:mcp` passed with tools `get_upgrade_options`, `lookup_world_places`, `preview_campaign_engine`, `preview_scout_drop`, and `render_voxel_county`; the lookup call returned 20 places. Local HTTP smoke for `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500` still returned Google mode, 20 normalized places, and no raw provider fields.

Railway:
Deployment `e082c53d-7d7c-42ac-ba52-28dfaa2fa1dc` succeeded. Public `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed with all five tools, including `lookup_world_places`, and the lookup call returned 20 places. Public HTTP lookup still returned Google mode, 20 normalized places, categories fitness, food/drink, landmark, park, school, service, and shop, with no raw provider fields.

Next:
Start E8.3 provider query policy/caching or return to E7.2 sprite atlas readiness if the next priority is visual quality.

## Entry 020

Quest:
E8.3 World Lookup Cache + Query Policy.

What changed:
Added a bounded in-memory cache for successful world lookup responses, keyed by normalized query, radius, and adapter mode. Lookup responses now include runtime cache metadata: `cacheHit`, `cachedAt`, and `expiresAt`. The MCP verifier now calls `lookup_world_places` twice and expects the second identical call to hit cache.

Product notes:
This is a quality and quota-safety pass for the ChatGPT app tool. The cache is per server process and not user persistence. It does not alter the map renderer, save places, or expose provider payloads.

Verification:
`pnpm test:core`, `pnpm build:server`, and `pnpm typecheck:starter` passed. Local `ATLAS_MCP_URL=http://127.0.0.1:8793/mcp pnpm verify:mcp` passed with `cachedLookup: true`, proving the second identical `lookup_world_places` call hit cache. Local HTTP `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500` exposed runtime cache metadata.

Railway:
Deployment `0838e7a3-797f-45f5-a223-3858c978d880` succeeded. Public `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed with `cachedLookup: true`. Public HTTP `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500` returned Google mode, 20 places, and runtime cache metadata.

Next:
Continue with either E8.4 app submission polish or E7.2 sprite atlas readiness.

## Entry 021

Quest:
E8.4 ChatGPT App Review Polish + QA Harness.

What changed:
Added `verify:submission` for review-facing MCP/submission validation and `verify:preview:http` for served preview delivery checks. Refreshed `chatgpt-app-submission.json` to state the map-first product shape, session-only state, live lookup boundaries, and no scraping/saving/outreach limits. Added `docs/REVIEW_READINESS.md` and `docs/issues/E8.4-chatgpt-app-review-polish.md`.

Product notes:
This is a review readiness pass. It does not add tools, persistence, account creation, campaign execution, or renderer redesign.

Verification:
Local checks passed: submission JSON parse, `pnpm test:core`, `pnpm --dir packages/geo typecheck`, `pnpm --dir packages/core typecheck`, `pnpm typecheck:starter`, `pnpm build:server`, `pnpm build:web`, and `pnpm --dir apps/widget typecheck`. Local server on port 8795 passed `pnpm verify:mcp`, `pnpm verify:submission`, and `pnpm verify:preview:http`.

Browser QA:
In-app browser QA loaded `http://127.0.0.1:8795/preview`. Desktop showed one full-screen Pixi canvas, no framework overlay, no console warnings/errors, no visible banned old language, and a dense city map. Interaction checks passed for drag, wheel zoom, place click, sticker drop, and note save. Mobile viewport `390x844` showed one canvas, no horizontal overflow, no banned old language, no console warnings/errors, and a nonblank city map screenshot.

Railway:
Deployment `4f1a9c0f-1af6-4d71-9bfd-b0a926799142` succeeded. Public `/health` returned ok, `/api/geo/status` reported Google mode configured/live, `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed, `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:submission` passed, and `ATLAS_PREVIEW_URL=https://atlas-backend-production-e6fc.up.railway.app/preview pnpm verify:preview:http` passed.

Public browser QA:
In-app browser QA loaded `https://atlas-backend-production-e6fc.up.railway.app/preview`. Desktop showed one full-screen Pixi canvas, no framework overlay, no console warnings/errors, no visible banned old language, and a dense city map. Public interactions passed for drag, wheel zoom, place selection, sticker drop, and note save. Mobile viewport `390x844` showed one canvas, no horizontal overflow, no banned old language, no console warnings/errors, and a nonblank city map screenshot.

Next:
E8.4 is review-ready. Continue with E7.2 sprite atlas readiness if the next priority is visual quality, or E8.5 only if app review feedback identifies another submission blocker.

## Entry 022

Quest:
E7.2 Sprite Atlas Readiness planning and brain expansion.

What changed:
Added `docs/brain/SPRITE_ATLAS_READINESS.md` and `docs/issues/E7.2-sprite-atlas-readiness.md`. Updated the project brain index, voxel world brain, and next quest list so the next visual implementation loop is exact instead of vague.

Product notes:
The next map-quality pass should keep the same full-screen ChatGPT app experience: Pixi owns the city map, React stays as tiny HUD, and old dashboard/report/campaign framing stays out. E7.2 should not chase a new UI shell. It should make the current city map ready for real art by introducing a typed atlas manifest, validation, a renderer resolver, and primitive fallback.

Implementation target:
Add `CityWorldAtlasManifest`, validation helpers, `packages/assets/city-world/atlas.manifest.json`, a web/widget atlas resolver, and renderer adoption for buildings, props, actors, and markers. Include at least one visible quality improvement while keeping missing textures from blanking the map.

Next:
Implement E7.2 in the order documented in `docs/issues/E7.2-sprite-atlas-readiness.md`.

## Entry 023

Quest:
First real Atlas ChatGPT demo slice.

What changed:
Added a typed `VoxelScene` compiler that turns the curated Riverside county pack into a widget-ready scene and highlights Eastvale. Added the `select_county` MCP tool as the ChatGPT county entrypoint, kept the full scene in `_meta.scene`, and moved `render_voxel_county` onto the same compiler path. Updated submission and MCP verifiers so `select_county` is required and proves the compiled scene includes Eastvale from the curated pack.

Product notes:
This replaces the old brief-sandbox entry shape with a real county-selection slice. It does not call Google Maps, ingest live counties, save state, add auth, add Stripe, build Three.js, or expose raw provider payloads to the widget.

Verification:
`pnpm --dir packages/core test`, `pnpm --dir packages/core typecheck`, `pnpm build:server`, local `pnpm verify:mcp` against a temporary server on port 8797, `pnpm exec tsc -p packages/mcp/tsconfig.json --noEmit`, and `node -e "JSON.parse(require('fs').readFileSync('chatgpt-app-submission.json','utf8')); console.log('submission json ok')"` passed.

Next:
Run the focused MCP verification command against a local server, then continue with the next map-quality or ChatGPT-review slice.

## Entry 024

Quest:
E7.2 Sprite Atlas Readiness implementation and E7.3 browser QA hardening.

What changed:
Saved durable continuation prompts in `docs/agent-prompts/ATLAS_EXECUTION_PROMPTS.md` and created follow-up issue lanes for E7.3 browser QA, E7.4 real sprite proof, E8.5 tool-surface hardening, and E8.6 county questions. Verified the existing E7.2 atlas resolver implementation: core manifest types and validators, city-world asset manifest, asset README, scene key validation tests, web/widget resolver exports, and renderer adoption for buildings, props, actors, and pins. Fixed the city-world tray so sticker counts stay separate from note pins and saved note text is visible after note save.

Product notes:
The visible app remains the full-screen Riverside/Eastvale city map. React stays as HUD only, Pixi owns map rendering, and provider payloads still do not reach Pixi, React, `VoxelScene`, or `CityWorldScene`.

Verification:
`pnpm --dir packages/core test`, `pnpm typecheck:starter`, `pnpm --dir apps/widget typecheck`, `pnpm build:web`, `pnpm --dir apps/widget build`, `pnpm build:server`, and `pnpm verify:preview:http` against `http://127.0.0.1:8799/preview` passed. Browser QA with local Chrome against `http://127.0.0.1:8800/preview` passed: desktop and mobile each had one full-screen canvas, no horizontal overflow, no visible banned old language, and clean console. Interaction QA passed after the tray fix: sticker drop changed `1 stickers` to `2 stickers`, note save changed `0 notes` to `1 notes`, and the latest note showed `QA note`. Temporary QA server was stopped and temp files were removed.

Next:
Start E7.4 Real Sprite Proof if the next priority is visual fidelity, or E8.5 ChatGPT Tool Surface Hardening only if review feedback creates a blocker.

## Entry 026

Quest:
E7.4 Real Sprite Proof.

What changed:
Added the first real city-world texture asset at `packages/assets/city-world/textures/pin-sticker-favorite.svg`. Added frame, anchor, and scale metadata for `pin.sticker.favorite` in the atlas manifest. Updated the web build to inline SVG files as data URLs, added a typed SVG module declaration, and extended the city-world resolver with `loadCityWorldAtlasTextures`. The renderer now loads the favorite sticker pin through Pixi `Assets.load`, passes loaded textures into the atlas resolver, and renders sprite mode for the favorite pin while preserving primitive fallback for every missing texture and during loading.

Product notes:
This is intentionally a one-sprite proof. It does not create a full art pipeline, replace the whole map, add a new resource domain, or change the map-first product shape.

Verification:
`pnpm --dir packages/core test`, `pnpm typecheck:starter`, `pnpm build:web`, `pnpm --dir apps/widget typecheck`, `pnpm --dir apps/widget build`, `pnpm build:server`, and `pnpm verify:preview:http` against `http://127.0.0.1:8801/preview` passed. Browser QA with local Chrome against `http://127.0.0.1:8801/preview` passed: one full-screen canvas, no horizontal overflow, no visible banned old language, favorite SVG bundled in the served widget, sticker drop worked, and console was clean after moving texture loading to `Assets.load`. Temporary server was stopped and temp files were removed.

Next:
Start E8.6 County Question Slice unless app review feedback creates an E8.5 tool-surface blocker first.

## Entry 025

Quest:
Parallel Codex execution setup.

What changed:
Added a reusable Parallel Codex Operating Model to `docs/agent-prompts/ATLAS_EXECUTION_PROMPTS.md`. It defines the maximum useful split as two code-writing worktrees plus one integration/QA thread, with clear ownership for the visual lane, tool/backend lane, and integration captain. Updated `docs/NEXT_QUESTS.md` so future agents see the recommended split before starting new work.

Product notes:
The speedup path is not more generic parallel work. Atlas should move through small, owned slices: E8.6 as the primary county-question/tool lane, E8.5 only if review hardening is blocked, and a separate integration/QA pass. E7.4 is already complete locally, so the visual lane should stay idle until a fresh visual issue exists. No app code, renderer behavior, MCP contracts, provider access, auth, Stripe, persistence, or UI shell changes were made.

Verification:
Docs-only pass. Focused verification command passed after edits:
`pnpm --dir packages/core test` with 7 test files and 21 tests passing.

Next:
Finish or intentionally park any active dirty renderer slice, then create worker worktrees only from the clean integration state.

## Entry 027

Quest:
E8.6 County Question Slice plus production evolution gates.

What changed:
Added `CountyQuestionService` in `@atlas/core` and exposed `ask_county_question` through the Apps SDK MCP server. The tool answers closed-world Riverside/Eastvale questions from curated Alpha pack facts only, including why Eastvale is the first slice and which curated signals support mobile detailing. Unsupported counties and unsupported business claims are narrowed or refused. Updated MCP/submission verifiers, package status, review docs, tool contracts, submission JSON, and active tool lists for the new seven-tool surface.

Production gates:
Added `docs/PRODUCTION_EVOLUTION_GATES.md` and linked it from the project loop, brain index, execution prompts, next quests, and decisions. Future substantial slices must name current maturity level, target maturity level, human approval gate, what becomes more real, and what remains mock, curated, temporary, or session-only. Human approval gates are explicit for public claims, live-provider expansion, persistence, money, and automation.

Maturity:
E8.6 promotes basic county/business questions from missing product capability to M1 Curated Alpha. It does not promote to live market truth, persistence, paid behavior, or automation.

Verification:
`pnpm --dir packages/core test` passed with 8 test files and 24 tests. `pnpm --dir packages/core typecheck`, `pnpm exec tsc -p packages/mcp/tsconfig.json --noEmit`, `node -e "JSON.parse(require('fs').readFileSync('chatgpt-app-submission.json','utf8')); console.log('submission json ok')"`, and `pnpm build:server` passed. Local `ATLAS_MCP_URL=http://127.0.0.1:8802/mcp pnpm verify:mcp` passed with `ask_county_question`, `countyQuestionTopic: "business_signals"`, and `unsupportedCountyQuestion: false`. Local `ATLAS_MCP_URL=http://127.0.0.1:8802/mcp pnpm verify:submission` passed with the same seven-tool surface. Temporary server on port 8802 was stopped and temp files were removed.

Next:
Run integration/public QA for the E8.6 tool surface and deploy when ready. After that, start E9 Hosted Clawd Beta contracts only; do not implement persistence, Stripe, evidence, or XP before the approval gate.

## Entry 028

Quest:
E8.6 integration/public QA, Railway deploy, and E9 Hosted Clawd contracts.

What changed:
Ignored local `.codex/` QA screenshots so they do not keep polluting `git status`. Expanded Hosted Clawd Beta contracts in `docs/DATABASE_SCHEMA_BETA.md`, rewrote `docs/PRICING_MODEL.md` with Alpha/Beta payment boundaries, added `docs/issues/E9.0-hosted-clawd-beta-contracts.md`, and tightened future Hosted Clawd tool contracts in `docs/TOOL_CONTRACTS.md`. No persistence, auth, Stripe, evidence, XP, or automation code was added.

Local integration:
`pnpm typecheck:starter` passed. `pnpm build:starter` passed. Local server on port 8803 passed `pnpm verify:mcp`, `pnpm verify:submission`, and `pnpm verify:preview:http`. Local gstack browser QA loaded `http://127.0.0.1:8803/preview`, showed the Riverside/Eastvale map controls and selected-place tray, and `/preview` returned 200.

Railway:
`railway up --detach --service atlas-backend --environment production --message "E8.6 county question tool and E9 contracts"` succeeded. Deployment log id: `a16b8118-579d-495d-94e3-68530cae1214`.

Public verification:
Public `ATLAS_MCP_URL=https://atlas-backend-production-e6fc.up.railway.app/mcp pnpm verify:mcp` passed after rollout attempt 3 with the seven-tool surface: `ask_county_question`, `get_upgrade_options`, `lookup_world_places`, `preview_campaign_engine`, `preview_scout_drop`, `render_voxel_county`, and `select_county`. Public `pnpm verify:submission` passed with `countyQuestionTopic: "business_signals"` and `unsupportedCountyQuestion: false`. Public `pnpm verify:preview:http` passed for `https://atlas-backend-production-e6fc.up.railway.app/preview` with 806196 bytes and city-world markup.

Public browser QA:
gstack browser loaded the public preview with HTTP 200, showed the Riverside/Eastvale map controls and selected-place tray, had no console errors after a fresh console clear/reload, and sticker interaction changed the tray from `1 stickers` to `2 stickers`.

Maturity:
E8.6 is deployed as M1 Curated Alpha. E9.0 is contracts-only and remains behind `HUMAN_APPROVAL_BEFORE_PERSISTENCE` and `HUMAN_APPROVAL_BEFORE_MONEY`.

Next:
Human approval is required before implementing Hosted Clawd persistence, Stripe, evidence, or XP. The next safe code lane is either a small review polish fix if app review finds one, or a docs/design pass for Hosted Clawd onboarding copy without checkout.

## Entry 029

Quest:
E9.0A Stripe Billing Plan for Hosted Clawd.

What changed:
Added `docs/STRIPE_BILLING_PLAN.md` and updated pricing, Beta schema, tool
contracts, E9 issue docs, next quests, and decisions so Stripe is part of the
Hosted Clawd execution plan. The plan uses Stripe Billing, Stripe-hosted
Checkout Sessions in subscription mode, recurring Prices, Customer Portal, and
webhook-synced access.

Stripe:
Verified the connected Stripe account for planning as `acct_1RTDWJKHzChTixtj`
with display name `ColdCopy`. No Stripe Products, Prices, Checkout Sessions,
Customer Portal Sessions, customers, webhooks, or payment flows were created.

Maturity:
Docs-only M1/M3 planning. `HUMAN_APPROVAL_BEFORE_MONEY` and
`HUMAN_APPROVAL_BEFORE_PERSISTENCE` still block implementation.

Verification:
`pnpm --dir packages/core test` passed with 8 test files and 24 tests.
`git diff --check` passed with only Windows LF-to-CRLF warnings.

Next:
Keep E9.1 blocked until the human gates approve storage, auth, and Stripe
implementation.

## Entry 030

Quest:
E9.1 Hosted Clawd approval prep and E9.2 onboarding spec.

What changed:
Added `docs/HOSTED_CLAWD_APPROVAL_PACKET.md` and
`docs/HOSTED_CLAWD_ONBOARDING_SPEC.md`, plus issue docs for E9.1 and E9.2.
Updated `docs/NEXT_QUESTS.md` with the priority chain from approval prep to
onboarding, public QA, visual polish, persistence, and then Stripe. Added a
durable decision that persistence comes before paid checkout. Added future
Hosted Clawd failure shapes to `docs/TOOL_CONTRACTS.md` for unauthenticated,
persistence-disabled, inactive subscription, wrong-owner, limit-exceeded, and
idempotency-conflict cases.

Product notes:
The recommended first persisted capability is a confirmed business profile plus
a saved campaign preview from an existing Scout Drop. Checkout, evidence, XP,
weekly reports, exports, and automation remain out of scope. The onboarding spec
keeps Atlas map-first and avoids a generic SaaS pricing page. Session promotion
requires explicit user confirmation; demo XP never merges into the real XP
ledger.

Maturity:
Docs-only M1 planning toward M3 Persisted Beta. No code crossed
`HUMAN_APPROVAL_BEFORE_PERSISTENCE` or `HUMAN_APPROVAL_BEFORE_MONEY`.

Verification:
`pnpm --dir packages/core test` passed with 8 test files and 24 tests.
`git diff --check` passed with only Windows LF-to-CRLF warnings.

Next:
Review the approval packet with the human. If approved, start E9.3 persistence
foundation with ownership and idempotency tests first.

## Entry 031

Quest:
Integration/QA captain support playbook.

What changed:
Added `docs/INTEGRATION_QA_PLAYBOOK.md` so parallel Atlas threads have a
standard handoff format, rejection rules, verification matrix, and merge order.
Updated `docs/NEXT_QUESTS.md` to point worker and captain lanes at the playbook.

Product notes:
This is an operating-support slice only. It does not change the app, renderer,
MCP tools, submission JSON, persistence plan, Stripe plan, XP, evidence, or
deployment state.

Verification:
`pnpm --dir packages/core test` passed with 8 test files and 24 tests.
`git diff --check -- docs/INTEGRATION_QA_PLAYBOOK.md docs/NEXT_QUESTS.md docs/BUILD_LOG.md`
passed with only Windows LF-to-CRLF warnings.

Next:
Use the playbook when the E7.5 visual thread or E9.3 persistence-gate thread
lands changes.
