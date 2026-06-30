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

## Decision 014: Map-first city world before Quest Preview

E6.6 parks the partial Quest Preview slice and makes the visible Alpha experience a geo-grounded city/world map. `VoxelScene` now carries optional `VoxelWorld` data for country/state/county/district/place hierarchy, known places, ambient activity, session-only stickers, and session-only notes. Campaign and Scout tools remain available, but the default UI opens on the map.

## Decision 015: Full-screen CityWorldRenderer is the next map target

The current card/panel voxel UI should not be iterated further. E7.0 will replace the visible map UI with a full-screen Pixi `CityWorldRenderer` driven by typed `CityWorldScene` data. React is limited to tiny HUD overlays. Lottie is limited to optional UI-only animation, Rive is deferred for future Clawd state-machine animation, and Three.js remains out of scope.

## Decision 016: Hybrid voxel art before real atlases

E7.1 improves the city map through code-generated Pixi art while adding atlas-ready metadata to `CityWorldScene`. This keeps the Alpha shippable without new dependencies, but gives each building, prop, actor, and terrain object stable keys for future tile and sprite atlas replacement. Pixi remains responsible for map objects and animation; Lottie stays UI-only, Rive stays deferred for Clawd, and no dashboard/card shell returns.

## Decision 017: USA-scale engine through backend world contracts

Atlas V1 should target the entire United States, but not by rendering a giant national canvas. The backend owns national indexing, provider adapters, cache/TTL/source policy, and normalized country/state/county/district/place identity. The renderer consumes bounded `CityWorldScene` slices for the selected county or district. Additional MCP servers or connectors should be added only when they solve a concrete deploy, provider, database, or submission-review bottleneck.

## Decision 018: ChatGPT county selection compiles from curated packs

The first real ChatGPT demo slice starts with `select_county` for Riverside. The server loads the curated Riverside county pack, compiles a typed `VoxelScene`, highlights Eastvale, and sends the full scene to the widget through `_meta.scene`. Renderers consume Atlas scene contracts only; raw Google/provider payloads stay behind backend adapters.

## Decision 019: First real sprite ships as bundled data URL

E7.4 proves the atlas resolver sprite path with `pin-sticker-favorite.svg`. The web build inlines SVG textures as data URLs, and Pixi loads them through `Assets.load` before the resolver returns sprite mode. This keeps the ChatGPT widget self-contained with no broader resource domain while preserving primitive fallback during load failure or missing textures.

## Decision 020: County questions stay closed-world in Alpha

E8.6 adds `ask_county_question` as a read-only curated-data tool, not a broad Q&A engine. It answers Riverside/Eastvale questions from the county pack and source notes only, refuses unsupported counties or business claims, and does not call Google, save state, grant XP, or claim live market truth.

## Decision 021: Production promotion requires explicit gates

Atlas work progresses through named maturity levels: mock scaffold, curated Alpha, verified live read-only, persisted Beta, and production release. Any slice that promotes mocks, curated claims, live provider scope, persistence, money, or automation must name the human approval gate before it crosses that boundary.

## Decision 022: Hosted Clawd contracts precede persistence

E9.0 defines Hosted Clawd Beta entities, tool gates, pricing boundaries, and required tests before any auth, database, Stripe, evidence, or XP code. The next implementation step must first clear `HUMAN_APPROVAL_BEFORE_PERSISTENCE`; checkout or pricing work also requires `HUMAN_APPROVAL_BEFORE_MONEY`.

## Decision 023: Hosted Clawd uses Stripe Billing hosted subscription flow

Hosted Clawd Beta should use Stripe Billing with Stripe-hosted Checkout Sessions in `subscription` mode, recurring Prices, webhook-synced subscription state, and Stripe Customer Portal for billing management. Atlas should not use raw PaymentIntents, success-page redirects, or client-trusted prices to grant Hosted Clawd access. No Stripe mutations or billing code start before `HUMAN_APPROVAL_BEFORE_MONEY` and persistence approval.
