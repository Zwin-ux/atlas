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
