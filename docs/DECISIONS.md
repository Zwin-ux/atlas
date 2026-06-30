# Decisions

## Decision 001: Mock-first

Build against curated Riverside data and MockGeoDataAdapter before real Google APIs.

## Decision 002: PixiJS first renderer

Use PixiJS for Alpha if clean. Use SVG/Canvas fallback if it slows the build.

## Decision 003: Google Maps is signal input, not visual identity

Google data helps resolve places and counts. Atlas renders its own voxel world.

## Decision 004: Apps SDK tools stay focused

Free Alpha tools are only county, Clawd, Scout Drop, campaign preview, upgrade prompt.

## Decision 005: Hosted Clawd is Beta

Do not build payments/auth until the Eastvale demo works.

## Decision 006: Root Apps SDK starter is temporary

The existing root `server/` and `web/` directories remain as a working local Apps SDK sandbox. New Atlas architecture should land in `apps/` and `packages/` and later replace or absorb the starter deliberately.

## Decision 007: County pack validation lives in core

Curated county pack schemas, parsing, and file loading live in `@atlas/core` so MCP tools, renderers, and later services share the same typed source of truth.

## Decision 008: Google geo is opt-in but no longer deferred

The user explicitly wants to leave mock mode quickly. `MockGeoDataAdapter` remains the safe fallback, but Railway and local backend runs should use `GEO_DATA_ADAPTER=google` once `GOOGLE_MAPS_API_KEY` is set. The frontend never receives the API key.

## Decision 009: SVG renderer before PixiJS

Quest E3 uses a code-native SVG isometric renderer instead of adding PixiJS immediately. The renderer consumes `VoxelScene` only, keeps Alpha lean, and leaves PixiJS as an upgrade path if later animation/camera needs justify the dependency.

## Decision 010: Scout Drop Alpha is deterministic preview state

Quest E4 uses curated Riverside `VoxelScene` nodes to score and format the Eastvale mobile-detailing Scout Drop. Apps SDK tools keep model-visible `structuredContent` concise and put renderer-heavy `VoxelScene` data in widget-only `_meta`; they do not geocode live, persist state, post, DM, execute ads, or claim saved Hosted Clawd behavior.

## Decision 011: Pixi tactical renderer is default with SVG fallback

E4.5 promotes PixiJS to the default map-stage renderer for the Atlas board while keeping the existing SVG renderer as the fallback. The renderer still consumes only `VoxelScene`, and richer visual details stay optional so older scene payloads can continue to render.

## Decision 012: Campaign Engine is manual preview state

E5 creates a 7-day manual campaign preview from an existing `ScoutPreviewState`. It can draft planning structure, route priorities, and asset placeholders, but it must not post, DM, execute paid ads, persist state, or imply Hosted Clawd behavior before Beta.

## Decision 013: Submission surface is product-only

E6 removes starter-era brief tools from the exposed MCP surface and keeps the review-facing Alpha tools to `render_voxel_county`, `preview_scout_drop`, `preview_campaign_engine`, and `get_upgrade_options`. All exposed Alpha tools are read-only, non-destructive, closed-world, and return explicit output schemas.
