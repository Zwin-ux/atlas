# Atlas Backend Service Brief

Status: E12 backend/service owner map.

Owner: Forge for API, data, split safety, and service readiness. Axiom owns
final release/deploy authority.

## 1. Railway and Service Surface

Production service:

- Railway project/app: `atlas-chatgpt-app`
- Railway environment: `production`
- Railway service: `atlas-backend`
- Public URL: `https://atlas-backend-production-e6fc.up.railway.app`

Runtime command shape:

- Build: `pnpm build:starter`
- Start: `node server/dist/index.js`
- Local dev: `pnpm dev`
- MCP path: `MCP_PATH=/mcp`
- Port: Railway provides `PORT`; local default is `8787`.

Current proof commands:

- `pnpm test:core`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `pnpm verify:preview:http`
- `pnpm verify:mcp`
- `pnpm verify:submission`
- `node scripts\verify-engine-beta-coverage.mjs`
- `node scripts\verify-anaheim-draft-scene.mjs --url <preview-url> --screenshots <artifact-dir>`
- `node scripts\verify-anaheim-promotion-readiness.mjs --json-only`
- `node scripts\verify-anaheim-object-source-quality.mjs --json-only`
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

Do not mutate without Axiom or human approval:

- Railway variables, domains, environments, or deploy target.
- `GOOGLE_MAPS_API_KEY` or any secret.
- `package.json`, `pnpm-lock.yaml`, `.env*`.
- DB, migrations, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth,
  automation, reports, exports.

## 2. Runtime Route Map

Base and health:

- `GET /` returns a text pointer to MCP and preview.
- `GET /health` returns `{ ok: true, version }`.
- `GET /preview` serves the built widget HTML from `web/dist`.
- `GET /favicon.ico` returns 204.

MCP:

- `POST|GET|DELETE|OPTIONS /mcp` via `StreamableHTTPServerTransport`.
- Registered tools:
  - `lookup_world_places`
  - `select_county`
  - `ask_county_question`
  - `render_voxel_county`
  - `preview_scout_drop`
  - `preview_campaign_engine`
  - `get_upgrade_options`
- Apps SDK rule: `structuredContent` carries concise truth; `_meta` carries
  scenes and widget-heavy payloads.

World routes:

- `GET /api/world/us/coverage`
- `GET /api/world/us/states`
- `GET /api/world/us/states/:stateCode/counties`
- `GET /api/world/counties/:countySlug`
- `GET /api/world/counties/:countySlug/districts/:districtSlug`
- `GET /api/world/lookup?query=<text>&radiusMeters=<100-50000>`

Geo routes:

- `GET /api/geo/status`
- `GET /api/geo/geocode?query=<text>`

Preview-only convenience routes:

- `GET /api/scout/drop`
- `GET /api/campaign/preview`

Draft/internal surfaces:

- Hidden Anaheim draft scenes are not public routes.
- Draft proof enters preview only through verifier-injected `_meta.coverageShellScene`.
- Anaheim must not enter the county switcher as playable until promotion gates
  pass.

## 3. Core Service Map

`NationalWorldService` owns:

- country/state/county/district coverage summaries;
- California coverage directory;
- Riverside/Eastvale as the only playable `L2_CURATED_DISTRICT`;
- shell counties as `L1_COUNTY_SHELL`;
- unknown counties as `L0_UNSUPPORTED`;
- source/cache policy for world responses;
- normalized `WorldPlaceLookupResponse` from provider signals.

Data contracts:

- `CountyPackService` and `CountyQuestionService` handle curated Riverside
  closed-world packs and questions.
- `californiaCountyIndex.ts` holds the checked California county identity layer.
- `districtCandidatePack.ts`, `districtPlaceAnchorPack.ts`, and
  `districtCuratedPack.ts` hold the Anaheim candidate/anchor/draft contracts.
- `productBackendBoundary.ts` separates:
  - `public_coverage`;
  - `hidden_draft_evidence`;
  - `future_hosted_clawd`.

Compiler/renderer contracts:

- Public playable scene: Riverside/Eastvale only.
- County shell scene: `compileCountyShellCityWorldScene` for indexed L1 shells.
- Hidden Anaheim draft scene:
  `compileDistrictPlaceAnchorDraftCityWorldScene`, still `L1_COUNTY_SHELL` and
  `playable: false`.

Verifier stack:

- `verify-engine-beta-coverage.mjs` is the public production matrix.
- `verify-county-index-source.mjs` checks Census source identity and offline
  cache behavior.
- `verify-anaheim-draft-scene.mjs` proves hidden draft rendering without public
  tools.
- `verify-anaheim-promotion-readiness.mjs` keeps Anaheim
  `promotionReady: false` until gates are real.
- `verify-anaheim-object-source-quality.mjs` tracks source-art and naming risk.
- `verify-alpha-rc-split.mjs` prevents mixed-scope release staging.

## 4. Provider Boundary

Google Maps is allowed only through `packages/geo` and server lookup routes:

- `readGeoAdapterConfig(process.env)` chooses `mock` or `google`.
- `createGeoDataAdapter` returns `MockGeoDataAdapter` or `GoogleMapsAdapter`.
- `GEO_DATA_ADAPTER=google` requires `GOOGLE_MAPS_API_KEY`.
- `/api/geo/status` may report whether live calls are enabled.
- `/api/geo/geocode` may call the adapter directly.
- `/api/world/lookup` may geocode and nearby-search, then normalizes provider
  places into Atlas `WorldPlaceLookupResponse`.

Provider data must not leak:

- No raw `primaryType`, `types`, or provider `placeId` in public world lookup
  structured output.
- Provider lookup does not make a county playable, provider-normalized, or
  public-quality.
- Google data must not become renderer identity, county readiness, or
  persistence state.
- Routes API is not enabled in `GoogleMapsAdapter.route`; route hints remain
  unavailable for Google until explicitly opened.

Cache/source gaps to watch:

- `worldLookupCache` is in-memory only and capped at 100 entries.
- Lookup TTL is inherited from normalized provider/mock signals.
- Cache dies on process restart.
- No durable provider cache, no request audit table, and no provider confidence
  ledger exist yet.

## 5. Next Backend Artifact

Recommended next Forge slice after E12.15:

E12.16 World Lookup Provider Boundary Verifier.

Goal:
Prove `lookup_world_places` and `/api/world/lookup` keep provider data useful
without leaking raw provider fields or implying county readiness.

Files:

- `scripts/verify-world-lookup-boundary.mjs`
- `scripts/verify-alpha-rc-split.mjs`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- optional focused tests in `packages/core/test/national-world-service.test.ts`
  only if the normalized DTO needs a tighter assertion.

Acceptance:

- Verifier runs against a local or public base URL.
- Calls `/api/world/lookup?query=Eastvale%2C%20CA&radiusMeters=3500`.
- Calls MCP `lookup_world_places` through `/mcp`.
- Asserts normalized categories and source notes exist.
- Asserts raw provider fields do not appear in structured output.
- Asserts repeat lookup reports cache metadata and repeat cache behavior.
- Asserts coverage directory remains Riverside-only playable and has zero
  provider-normalized/public-quality counties.

Anti-scope:

- No package/lock/env drift.
- No new provider dependency.
- No DB, migrations, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth,
  automation, reports, exports.
- No public Anaheim promotion.

Verification:

- `node --check scripts\verify-world-lookup-boundary.mjs`
- `node scripts\verify-world-lookup-boundary.mjs --url http://127.0.0.1:8787`
- `pnpm test:core`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- strict `engine-beta-data` split guard
- focused `git diff --check`
