# Atlas Backend Service Map

Status: E12.15A service understanding and production-readiness brief.

Owner:
Axiom owns architecture and release calls. Forge owns backend/data/service
contracts and Railway safety. Mira owns product comprehension. Lumen owns
visual-engine quality. This brief is the current shared backend map for the Big
4.

## Current Railway Service

Railway project:
`atlas-chatgpt-app`

Environment:
`production`

Service:
`atlas-backend`

Current active deployment observed locally:
`3c549552-4f22-4f9b-a2df-d9c4ae222ea6`

Public base URL:
`https://atlas-backend-production-e6fc.up.railway.app`

Rules:

- Railway is the live Apps SDK backend lane.
- Do not mutate Railway variables, domains, service settings, or deployments
  from a visual or data-contract slice unless Axiom explicitly calls deploy.
- Do not print secrets. Google Maps keys live in ignored local env or Railway
  variables only.
- The production service is one Node process today, not a distributed service
  mesh. Service boundaries are code boundaries until Hosted Clawd reopens.

## Runtime Route Map

`server/src/index.ts` owns the public runtime surface.

Core health and preview:

- `GET /` returns a plain server pointer.
- `GET /health` returns `{ ok: true, version }`.
- `GET /preview` serves the built ChatGPT app widget.
- `MCP_PATH`, default `/mcp`, handles Apps SDK MCP traffic.

World coverage routes:

- `GET /api/world/us/coverage`
- `GET /api/world/us/states`
- `GET /api/world/us/states/:stateCode/counties`
- `GET /api/world/counties/:countySlug`
- `GET /api/world/counties/:countySlug/districts/:districtSlug`

Geo/provider routes:

- `GET /api/geo/status`
- `GET /api/geo/geocode?query=...`
- `GET /api/world/lookup?query=...&radiusMeters=...`

Alpha preview routes:

- `GET /api/scout/drop`
- `GET /api/campaign/preview`

Hidden proof surfaces:

- Anaheim draft proof is not a public route. It is produced by verifier scripts
  that compile a hidden `CityWorldScene` and inject it into preview test state.

## MCP Tool Surface

The public seven-tool list stays stable:

- `select_county`
- `ask_county_question`
- `render_voxel_county`
- `lookup_world_places`
- `preview_scout_drop`
- `preview_campaign_engine`
- `get_upgrade_options`

Rules:

- `structuredContent` carries concise truth: coverage tier, county readiness,
  counts, limitations, and next safe action.
- `_meta` carries widget-rich state: playable `scene`, shell
  `coverageShellScene`, Scout/Campaign widget state.
- Shell counties and unsupported counties must not receive `_meta.scene`.
- The widget must not infer playability from scene presence. Playability comes
  from the backend coverage boundary.

## Core Service Map

`NationalWorldService`

- Owns country, state, county, district, coverage directory, unsupported county,
  and normalized place lookup response shapes.
- Uses Census-derived county identity for California coverage.
- Treats Riverside as the only public playable county in the current Engine
  Beta.
- Treats Anaheim/Ontario as candidate metadata only unless promoted through
  gates.

`californiaCountyIndex`

- Holds all 58 California counties.
- Marks Riverside `06065` as `L2_CURATED_DISTRICT`.
- Marks other California counties as `L1_COUNTY_SHELL`.
- Carries candidate-only district metadata for Anaheim and Ontario.

District pack contracts:

- `DistrictCandidatePack` describes candidate intent, not playability.
- `DistrictPlaceAnchorPack` describes source-noted anchor evidence, not public
  renderability.
- `DistrictCuratedPack` can describe draft-only curated anchors, but does not
  make a district public by itself.

`productBackendBoundary`

- Separates `public_coverage`, `hidden_draft_evidence`, and
  `future_hosted_clawd`.
- Enables selected-place tray, stickers, notes, Scout Drop, and Campaign
  Preview only when `coverageTier === "L2_CURATED_DISTRICT"` and
  `playableDistrictCount > 0`.
- Keeps Hosted Clawd as a future explicit DTO, not an accidental DB or payment
  implementation.

## Provider Boundary

`@atlas/geo` owns provider access behind `GeoDataAdapter`.

Current adapters:

- `MockGeoDataAdapter`
- `GoogleMapsAdapter`

Google Maps is allowed today for:

- geocoding through `GeoDataAdapter.geocode`;
- nearby place lookup through `GeoDataAdapter.nearbySearch`;
- normalized read-only `lookup_world_places` responses.

Google Maps is not allowed today for:

- promoting county readiness;
- compiling public playable scenes directly;
- leaking raw provider fields to the renderer or widget;
- persistence or saved business memory;
- automated outreach, reports, XP, or evidence.

Current cache policy:

- `lookup_world_places` uses an in-memory bounded server cache.
- Cache is runtime-only and not user persistence.
- Source notes and TTLs must stay visible in normalized responses.

Known backend gap:

- Provider lookup is still a read-only place lookup tool, not a scene compiler.
  Before any provider-normalized district, Forge must define adapter output
  contracts, category confidence, cache TTL, source notes, and failure behavior.

## Railway Verification Map

Local verification before deploy discussion:

- `pnpm test:core`
- `pnpm typecheck:starter`
- `pnpm build:starter`
- `pnpm verify:preview:http`
- `node scripts/verify-engine-beta-coverage.mjs`
- `node scripts/verify-anaheim-promotion-readiness.mjs --json-only`
- `node scripts/verify-anaheim-object-source-quality.mjs --json-only`
- `node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

Public verification after deploy:

- `ATLAS_BASE_URL=https://atlas-backend-production-e6fc.up.railway.app node scripts/verify-engine-beta-coverage.mjs`
- public hidden Anaheim draft harness only when the slice touches Anaheim draft
  compiler/renderer behavior;
- public MCP and submission verifiers through the Engine Beta matrix.

Railway CLI checks:

- `railway status`
- `railway whoami`
- `railway deployment list`

Do not use Railway variable reads in normal handoffs because they may expose
secret values.

## Current Backend Artifact

E12.16 World Lookup Provider Boundary Verifier, not persistence.

Goal:
Prove that the existing Google/provider lookup lane stays normalized, cache
aware, read-only, and unable to promote county readiness.

Files:

- `scripts/verify-world-lookup-boundary.mjs`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`

Artifact:

- A verifier that calls REST `/api/world/lookup` and MCP
  `lookup_world_places`.
- It must prove normalized categories, source notes, runtime cache metadata,
  repeat-call cache behavior, and no raw provider field leakage in place
  summaries.
- Lookup responses expose `providerReadiness` with lookup-only status, sources,
  mode, cache key/TTL, normalized category status, normalized category
  confidence, and hard false `coveragePromotion`, `sceneEligible`, and
  `publicQuality` flags.
- It must prove provider lookup does not change coverage: Riverside stays the
  only playable county, and provider-normalized/public-quality counts remain
  zero.

Anti-scope:

- No DB, Hosted Clawd, persistence, Stripe, XP/evidence, OAuth, automation,
  reports, exports, paid claims, public Anaheim UI, or new playable counties.

Why this is next:

Atlas already has a real Google-backed lookup lane, but the USA engine cannot
scale from lookup to scenes until provider boundaries are mechanically
protected. This moves the backend toward production without faking coverage or
opening paid infrastructure.

## Next Backend Artifact Recommendation

E12.17 Provider Promotion Gate Inputs, still not persistence.

Goal:
Define the source, confidence, failure, and QA evidence fields that a future
provider-normalized district would need before any county or district can move
beyond read-only lookup.

Likely files:

- `packages/core/src/world/*`
- `packages/core/test/*`
- `scripts/verify-provider-promotion-gate.mjs`
- `docs/BUILD_LOG.md`
- `docs/NEXT_QUESTS.md`
- `docs/DECISIONS.md`

Artifact:

- A gate that can describe promotion inputs without making a county playable,
  scene-eligible, public-quality, or provider-normalized by default.
- A verifier that proves any candidate promotion has bounded categories, source
  notes, cache TTL, confidence/status, QA evidence placeholders, and no raw
  provider field leakage.
- A negative proof that Riverside remains the only playable county and Anaheim
  remains hidden/non-public unless a separate promotion slice passes.

Anti-scope:

- No DB, Hosted Clawd, persistence, package/lock/env drift, Stripe,
  XP/evidence, OAuth, automation, reports, exports, public Anaheim UI, or new
  playable counties.

## Manager Cutline

Visual work can continue through hidden proof scenes, but the backend must stay
honest:

- Candidate is not playable.
- Draft evidence is not product.
- Provider lookup is not county readiness.
- Session pins/notes are not saved state.
- Source art is not public-quality proof.
- Railway deploy green is not product approval by itself.
