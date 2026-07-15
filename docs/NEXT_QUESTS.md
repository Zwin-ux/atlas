# Next Quests

## Next quest rule

The next quest is not chosen by vibes. It must come from
`artifacts/current-update.json`, this file, the latest selector output, or a new
verifier/selector result created during the current slice. If the human says
"continue," continue only the named next quest. If that quest conflicts with
permanent gates, stop and report the conflict.

## Current 0.78-1V Census county board gate (2026-07-15)

Current packet:
`0.78-1V Census County Board Product + Certification Gate` is production-green
and owner-approved. Exact SHA `70167356abfe746d0b2257b4211bc9c8d2ff1de3`
is deployed; post-deploy real-host proof is not complete.

Decision:
`CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE`.

Proof:
- `artifacts/council/CODEX_RESULT_0781V.md`
- `artifacts/council/OWNER_APPROVAL_0781V_2026-07-13.md`
- `artifacts/emulator/audit/0.78-1v/report.json`
- `artifacts/emulator/audit/0.78-1v/REPORT.md`
- 12 desktop/mobile light/dark PNGs in `artifacts/emulator/audit/0.78-1v/`
- Recertified after the framing repair: 138 pass, 0 warn, 0 fail, with the
  complete projected county terrain/water footprint inside all 12 first frames.
- Source-of-truth drift is green with 0 blockers; loop readiness is
  `L2_ASSISTED` against the exact staged 46-file release packet.
- `0.78-1V-Q Public Tool Truth Pass` is locally green: save capabilities fail
  closed, overlapping playable-question intent stays on the product loop, and
  mixed hotel/amenity lookup types no longer present the hotel as fitness.
- Railway deployment `232c69ee-63de-47d0-bb7c-257d9ca0c422` passed 14/14
  release gates and 3/3 public sanity checks. A direct production proof keeps
  ordinary Eastvale data/provider questions on `source_limits` and the
  explicit playable overlap on `eastvale_first_slice`.

Current gates:
- PASSED: owner approved the 12 feature-on screenshots.
- PASSED: production deploy from certified SHA `7016735`.
- PENDING: post-deploy G8 proof in real ChatGPT.

Next READY packet after real-host G8:
`0.78-2 Real Town Anchors`.

Parallel queue:
- QUEUED: `0.80-2` graphics work in its existing fenced packet.

Anti-scope remains:
The Census board stays dark behind `?atlasGeoBoard=1`. No default-on flag,
roads, town detail, national 3,222-pack bake, persistence,
new MCP tools, provider geometry, public paid claim, or public
Anaheim/Ontario promotion belongs in 0.78-1V.

## Previous 0.76 USA-region quality track (2026-07-08)

Current packet:
`0.76-3 Massing & zone variants` is local-green and waiting for reviewer-run
web/Chrome proof.

Decision:
`GENERATED_MASSING_LAYOUTS_READ_COUNTY_PARAMETERS`.

Proof:
- `packages/core/src/voxel/cityWorldParametricGenerator.ts`
- `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts`
- `packages/core/src/voxel/index.ts`
- `packages/core/src/index.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `scripts/verify-archetype-identity-sweep.mjs`
- `artifacts/0.76-3-massing/CODEX_RESULT.md`

Next READY packet:
`0.76-4 Terrain features`.

Queue:
- READY: `0.76-4 Terrain features`
- QUEUED: `0.76-5 Gate promotion + batch sweep`

Anti-scope remains:
No new dependencies, Three.js, provider geometry, persistence, money, new MCP
tools, public Anaheim/Ontario promotion, generated public-playable claims, or
renderer seam changes from the parameter-spine or landmark packets.

Verifier state:
The strict `national-generation-contract` split guard now recognizes the
current 0.75S ship-pass evidence, clay reference-board inputs, and 0.76 packet
handoff files as selected-RC review artifacts. This keeps the release-safety
sentinel focused on real unknowns without changing the next implementation
slice: `0.76-4 Terrain features`.

## Active product track (human-directed 2026-07-03)

The live track is the product/app-quality path to a **submittable ChatGPT app**, specified in
`docs/PRODUCT_SPEC_AND_GATES.md` (gates G1–G7). Named product slices: `0.46P` in-widget scout/
campaign result surface (done + proven), `0.47P` widget polish, `0.48P` design ultra-pass (Fable
supermove) **done + proven on branch `fable/0.48p-design-ultra-pass` (BUILD_LOG Entry 080)**, `0.49P`
reliability sweep, `0.50P` submission packet.

The owner-gate / second-district ceremony below is **parked** but kept honest: `0.46E Owner Gate
Review Packet` remains the recorded next quest for that parked ladder, its selector artifacts
remain anchored at `0.45E`, and Anaheim/Ontario stay hidden and non-public. The active manifest
is now the 0.72B Redis Scene Packet Cache / Job Spine proof, using the 0.71H
Scene Packet Service Boundary proof as its input update. Re-open the
owner-gate ladder only on human request.

## Current backend production slice (2026-07-06, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.72B Redis Scene Packet Cache / Job Spine`.

Player-facing promise:
Atlas can prepare generated draft scene packets without making map pan/zoom
depend on Railway or pretending shell counties are public playable worlds.

Engineering promise:
Move generated draft packet work onto a memory-or-Redis cache spine with compile
locks, a Redis-backed job queue path, safe readiness/status output, request IDs,
structured logs, `/ready`, and first-pass backend rate limits.

Decision:
`REDIS_PACKET_SPINE_NOT_RENDER_LOOP`.

Selected axis:
`backend_production_spine`.

Contract:
- Local/dev defaults to memory when Redis is not configured.
- Railway production requires Redis for generated draft packet cache/job
  readiness.
- `ScenePacketCacheStore`, `ScenePacketCompileLock`, and
  `ScenePacketJobQueue` are internal service contracts, not new public tools.
- Redis compile locks use `SET NX EX` semantics to prevent duplicate generated
  draft compiles across Railway instances.
- If another instance holds the compile lock, Atlas waits briefly for cache,
  then returns `_meta.generatedDraftPacket` marked `queued` with no scene
  payload.
- A separate worker entrypoint can claim generated draft jobs, compile
  deterministic `CityWorldScene` packets, and write them to Redis with TTL.
- Cache keys include county slug, generated district slug, camera/window
  profile, scene schema version, and generator update id.
- Generated draft delivery remains `_meta.generatedDraftScene` /
  `_meta.generatedDraftPacket`; `structuredContent` stays a concise county
  coverage summary.
- `/api/engine/scene-packets/status` may expose `cacheBackend`, `entryCount`,
  `hitRate`, `queueDepth`, and `oldestQueuedMs`, but never payloads, terrain,
  roads, buildings, places, provider data, or generated district bodies.
- `/ready` exposes safe booleans and counts only.
- Browser Pixi pan/zoom remains retained and local after the packet arrives.
- Public MCP tool surface remains the seven Alpha tools.
- No DB persistence for scene packets, public renderer route, browser HTTP
  generated-scene route, public paid launch, provider geometry, evidence, XP,
  reports, exports, automation, all-US playable claim, or public
  Anaheim/Ontario.

Proof:
- `server/src/scenePacketMemoryAdapter.ts`
- `server/src/scenePacketWorker.ts`
- `server/src/index.ts`
- `.env.example`
- `package.json`
- `scripts/verify-production-backend-spine.mjs`
- `scripts/verify-generated-draft-scene-packet.mjs`
- `docs/REDIS_SCENE_PACKET_BACKEND_0.72B.md`
- `artifacts/national-generation/0.72b/production-backend-spine.json`
- `artifacts/national-generation/0.71h/generated-draft-scene-packet.json`

Metric:
- Dev/local memory fallback is accepted.
- Production Redis config without `ATLAS_REDIS_URL` is blocked.
- Generated draft cache miss compiles once; repeat request hits cache.
- Lock contention returns queued-safe metadata and enqueues one job.
- Scene packet status route does not leak payload, scene geometry, or provider
  data.
- Railway production proof is green for Redis, Postgres reachability, Stripe
  test config, private scene packet worker presence, `/ready`, and scene packet
  status safety.
- Hosted Clawd Auth/OIDC is not configured yet; it remains the public paid
  launch switch before any owner-gated test can become public access.
- Production proof artifact:
  `artifacts/ops/production-railway-stack.json`.
- New public MCP tools: `0`.
- Browser HTTP generated-scene routes: `0`.
- Railway runtime dependency for pan/zoom: `false`.

Next quest:
`0.72H Fable Generated Draft Visual Quality Gate`.

0.72H should use the packet path to inspect generated draft visuals and add
measurable quality gates for silhouettes, object grammar, density, material
discipline, contact shadows, and desktop/mobile proof. Do not reopen service
routing, persistence, money, provider geometry, or public promotion.

Parallel Fable note:
`C:\Users\mzwin\Documents\atlas-53e-fable` now contains a stronger 0.72H-b
review candidate at
`artifacts/0.72h-b-roof-label-cleanup/FABLE_RESULT.md`. The candidate passed
core build, generated-district parity, starter typecheck/build, and
desktop/mobile generated-widget screenshot proof. Generated place labels are
now suppressed and gated in the browser verifier. It is still not merge-ready
until Codex reviews the five source files file-by-file; the remaining visual
weakness is procedural residential detail plus the generated-preview banner
covering part of the top-left scene. Next visual-engine move:
`0.72H-c Residential Object-Kit Authorship Pass`.

Parallel production axis:
`0.73P Auth/OIDC Owner Gate Smoke` after the current proof ladder stays green.
Use Auth0-compatible OIDC by default. Configure
`ATLAS_OIDC_ISSUER`, `ATLAS_OIDC_AUDIENCE`,
`ATLAS_OIDC_JWKS_URL`, and optional `ATLAS_OIDC_RESOURCE`; keep
`ATLAS_HOSTED_CLAWD_PUBLIC_CLAIM_ENABLED=false` until ChatGPT OAuth,
webhook-confirmed subscription state, and browser proof all pass.

## Completed scene packet service-boundary slice (2026-07-06, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.71H Scene Packet Service Boundary / Railway Cache Plan`.

Decision:
`GENERATED_DRAFT_PACKETS_META_ONLY_NO_FRAME_LOOP`.

Proof:
- `packages/core/src/world/scenePacketCache.ts`
- `packages/core/test/scene-packet-cache.test.ts`
- `server/src/scenePacketMemoryAdapter.ts`
- `server/src/index.ts`
- `web/src/App.tsx`
- `scripts/verify-generated-draft-scene-packet.mjs`
- `docs/SCENE_PACKET_SERVICE_BOUNDARY_0.71H.md`
- `artifacts/national-generation/0.71h/generated-draft-scene-packet.json`

Result:
Generated draft packets are delivered through `_meta` only, never
`structuredContent`, and remain non-playable, non-public, provider-free, and
safe for retained local browser pan/zoom.

## Completed generated district slice (2026-07-06, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.70H Deterministic Generated District Specs`.

Decision:
`DETERMINISTIC_DISTRICT_SPECS_BEFORE_LOCAL_PROMOTION`.

Proof:
- `packages/core/src/voxel/cityWorldGeneratedDistrict.ts`
- `packages/core/src/voxel/cityWorldGeneratedDistrictTypes.ts`
- `packages/core/src/voxel/cityWorldGeneratedDistrictSeed.ts`
- `packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts`
- `packages/core/src/voxel/cityWorldSceneWindow.ts`
- `packages/core/test/city-world-generated-district.test.ts`
- `packages/core/test/national-generation-production.test.ts`
- `scripts/verify-deterministic-generated-district-specs.mjs`
- `docs/VOXEL_ENGINE_DELIVERY_ARCHITECTURE_0.70H.md`
- `artifacts/national-generation/0.70h/generated-district-specs.json`

Result:
Cook IL, Miami-Dade FL, Maricopa AZ, and Riverside CA compile deterministic
generated district specs from Census identity only. Generated scenes remain
`L1_COUNTY_SHELL`, non-playable, provider-free, promotion-blocked, and bounded
by the generated draft window budget.

## Completed national shell slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.69H US County Index Import / Nationwide Shells`.

Decision:
`CENSUS_INDEXED_SHELLS_NO_PLAYABLE_CLAIM`.

Proof:
- `artifacts/national-generation/0.69h/nationwide-shells.json`
- `artifacts/national-generation/0.69h/production-contract.json`

Result:
US county identity is national: 52 state/territory codes, 3,222 county/equivalent
rows, 3,221 browse-only shells, and one public playable county: `riverside-ca`.

## Completed national generation production contract slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.68H National Generation Production Contract`.

Player-facing promise:
Atlas stops hand-waving "anywhere in the US" and states the real production
engine contract: which counties exist, which render shells, which generate
districts, and which are actually public-quality playable.

Engineering promise:
Add a source-tiered national generation readiness contract and verifier that
prove the current California fixture is not a production US engine, then name
the next build slice for national county identity and honest shells.

Decision:
`NATIONWIDE_GENERATION_REQUIRES_SOURCE_TIERS`.

Selected axis:
`national_generation_production_contract`.

Contract:
- Atlas stays a ChatGPT App and high-quality voxel engine first.
- Atlas cannot be called production-ready for anywhere in the US until sourced
  county identity, honest shells, deterministic generated districts,
  provider-normalized anchors, and public-quality promotion gates all exist.
- The current fixture is California-only: 1 indexed state, 58 indexed counties,
  and 1 playable county.
- Provider lookup remains normalized read-only data, not scene geometry.
- Shell counties cannot borrow Riverside/Eastvale places, Scout context, pins,
  notes, or campaign data.
- Public MCP tool surface remains the seven Alpha tools.
- No DB/Auth/Stripe expansion, public paid claims, dashboard shell, new
  renderer geography, provider geometry, evidence, XP, reports, exports,
  automation, or public Anaheim/Ontario.

Proof:
- `packages/core/src/world/nationalGenerationProduction.ts`
- `packages/core/test/national-generation-production.test.ts`
- `docs/NATIONAL_ENGINE_PRODUCTION_CONTRACT.md`
- `scripts/verify-national-generation-production-contract.mjs`
- `artifacts/national-generation/0.68h/production-contract.json`

Metric:
- Current production readiness is `false`.
- Current stage is `P0_US_COUNTY_IDENTITY`.
- Current indexed state count is `1`; current indexed county count is `58`.
- Production ladder has 5 stages.
- Public playable claim for all US counties is `false`.

Next quest:
`0.69H US County Index Import / Nationwide Shells`.

0.69H should import or generate a Census-backed national county index and prove
that every indexed non-Riverside county returns an honest browse-only shell
without borrowing Riverside data.

## Completed product feel cleanup slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.67H Product Feel Cleanup`.

Decision:
`GRAPHICS_CHROME_DEMOTED_OBJECTS_FIRST`.

Selected axis:
`product_feel_cleanup`.

Proof:
- `web/src/CityWorldRenderer.tsx`
- `scripts/verify-city-world-graphics-cleanup.mjs`
- `artifacts/product-quality-audit/0.67h/graphics-cleanup.json`
- `artifacts/product-quality-audit/0.67h/screens/graphics-cleanup-desktop-1280x720.png`
- `artifacts/product-quality-audit/0.67h/screens/graphics-cleanup-mobile-390x844.png`

## Completed mobile hardening slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.66H Mobile Interaction Hardening`.

Decision:
`RETAINED_GRAPH_BOTTOM_SHEET_SPLIT_PAYLOAD`.

Selected axis:
`mobile_interaction_hardening`.

Proof:
- `web/src/PixiVoxelSceneView.tsx`
- `web/src/CityWorldRenderer.tsx`
- `web/src/CityWorldView.tsx`
- `web/src/HostedClawdTray.tsx`
- `web/src/styles.css`
- `scripts/build-web.mjs`
- `server/src/index.ts`
- `scripts/verify-mobile-interaction-hardening.mjs`
- `scripts/verify-web-bundle-budget.mjs`
- `scripts/verify-preview-http.mjs`
- `artifacts/product-quality-audit/0.66h/mobile-interaction-hardening.json`
- `artifacts/product-quality-audit/0.66h/metrics.json`
- `artifacts/product-quality-audit/0.66h/screens/mobile-hardening-desktop-1280x720.png`
- `artifacts/product-quality-audit/0.66h/screens/mobile-hardening-mobile-390x844.png`

## Completed browser proof slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.65H Hosted Clawd Browser Proof`.

Player-facing promise:
Atlas remains a ChatGPT App with the voxel map as the product surface. When the
widget has no account-linked bearer token, the Hosted Clawd tray blocks saved
reads honestly, keeps the user on the map, and uses simple touch-friendly copy.

Engineering promise:
Prove the saved-state browser path on desktop and `390x844` mobile. Missing
bearer reads return a `401 OAuth resource challenge` with read scope, no saved
shelf renders, no widget token is exposed, and the tray remains touch-accessible.

Decision:
`BROWSER_PROVES_ACCOUNT_LINK_REQUIRED_NO_WIDGET_TOKEN`.

Selected axis:
`hosted_clawd_browser_proof`.

Contract:
- Atlas stays a ChatGPT App and high-quality voxel engine first.
- Saved Hosted Clawd state remains an HTTP-only widget read surface, not a new
  public MCP tool.
- Browser proof must show the ChatGPT account linking boundary when the widget
  has no bearer token.
- The auth-required tray must render as a dialog, announce async status, avoid
  internal owner/webhook/write copy, and keep `44px touch targets`.
- No saved shelf renders before account linking.
- No widget bearer token is exposed to the page.
- No dashboard, pricing page, table, report, export, evidence, XP, automation,
  renderer geometry, provider geometry, or public Anaheim/Ontario.

Proof:
- `web/src/HostedClawdTray.tsx`
- `web/src/App.tsx`
- `web/src/styles.css`
- `server/src/index.ts`
- `server/src/hostedClawd/service.ts`
- `server/src/hostedClawd/billing.ts`
- `packages/core/src/scout/ScoutDropService.ts`
- `packages/core/src/scout/CampaignPreviewService.ts`
- `web/src/CityWorldView.tsx`
- `web/src/CountyCoverageView.tsx`
- `web/src/CountySwitcher.tsx`
- `web/src/PreviewPanel.tsx`
- `scripts/verify-hosted-clawd-browser-proof.mjs`
- `artifacts/hosted-clawd/postalpha-0.65h-browser-proof.json`
- `artifacts/hosted-clawd/postalpha-0.65h-browser-proof/hosted-clawd-auth-required-desktop-1280x720.png`
- `artifacts/hosted-clawd/postalpha-0.65h-browser-proof/hosted-clawd-auth-required-mobile-390x844.png`

Next quest:
`0.66H Mobile Interaction Hardening`.

0.66H should harden the existing map/tray surfaces for touch, keyboard,
reduced-motion, and screen-reader parity. It should not add commerce, new tools,
new backend scope, renderer geometry, or dashboard screens.

Support plan:
`docs/ATLAS_FRONTEND_BACKEND_SCREEN_PLAN.md` now organizes the Atlas UI as one
map-first ChatGPT app with stateful screens. Use it as the Scrum board for
frontend/backend pairing: every screen needs a backend owner, data contract,
completion tier, safety boundary, verifier, and desktop/mobile proof.

Fable audit input:
`docs/design/fable-prompts/PRODUCT_QUALITY_PROFESSOR_AUDIT_0.66H.md` captures
the human D+ grade on the running preview. Use it before 0.66H implementation
to inspect the live app neutrally, measure lag/felt quality, and convert the
critique into executable mobile/performance slices. Passing verifiers from
0.65H are not enough evidence that the app feels product-ready.

## Completed saved read surface slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.64H Saved Hosted Clawd Read Surface`.

Decision:
`SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS`.

Selected axis:
`hosted_clawd_saved_read_surface`.

Proof:
- `server/src/hostedClawd/auth.ts`
- `server/src/hostedClawd/service.ts`
- `server/src/hostedClawd/repository.ts`
- `server/src/hostedClawd/postgres.ts`
- `server/src/hostedClawd/types.ts`
- `server/src/index.ts`
- `web/src/App.tsx`
- `web/src/HostedClawdTray.tsx`
- `web/src/styles.css`
- `server/test/hosted-clawd-saved-read-surface.test.ts`
- `scripts/verify-hosted-clawd-saved-read-surface.mjs`
- `scripts/verify-hosted-clawd-saved-read-browser.mjs`
- `artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface.json`
- `artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface/HUMAN_REVIEW_PACKET.md`
- `artifacts/hosted-clawd/postalpha-0.64h-saved-read-surface/inventory.json`
- `docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md`

## Parallel visual-engine research queue (human-directed 2026-07-05)

This queue does not replace `0.65H Hosted Clawd Browser Proof`. It prepares the
next Fable visual lane so the model can execute without rediscovery when rate
limits clear.

Next visual lane:
`0.58E Generated District Parity + Asset Intake Plan`.

Packet:
`docs/design/fable-prompts/VOXEL_GRAPHICAL_LEAP_RESEARCH_0.58E.md`.

Promise:
Generated districts should stop reading as procedural placeholders. The jump
must come from compiler grammar, object-kit metadata, owned sprite/asset intake,
depth/contact shadows, material grammar, and camera composition, not decorative
UI or clutter props.

Verifier requirement:
The slice should add a generated-district parity verifier with numeric gates for
parcel/building fill ratio, facade element bounds, roof/eave footprint
registration, and lower-frame density. Screenshots still matter, but they should
not be the only pass/fail signal.

Anti-scope:
No runtime 3D, new renderer dependency, cars, humans, labels as camouflage,
glows, dashboard UI, public Anaheim/Ontario, provider geometry, persistence,
Stripe, reports, exports, XP, evidence, automation, or new MCP tools.

Human review preference:
Future visual proof packets should be emailed to `mzwin3545@gmail.com` with
desktop and 390x844 mobile screenshots plus the exact blocker list.

## Completed protected tool gate slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.63H Protected Hosted Clawd Tool Gate`.

Player-facing promise:
Atlas remains a ChatGPT App with the voxel map as the surface. After an owner
creates Hosted Clawd and completes test billing, saved Scout and Campaign
writes open only when Stripe webhook state is stored as an active subscription.

Engineering promise:
Gate protected Hosted Clawd writes on repository-backed webhook-confirmed
subscription state. Keep create-or-attach and Checkout setup available, reject
client-supplied `subscriptionStatus`, and keep the public MCP tool surface
stable.

Decision:
`PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION`.

Selected axis:
`hosted_clawd_protected_tool_gate`.

Contract:
- Atlas stays a ChatGPT App and high-quality voxel engine first.
- Hosted Clawd / Clawdbot is the paid neighborhood operator layer, but 0.63H
  only opens the protected paid-write gate.
- Public MCP tool surface remains the seven Alpha tools.
- `create_or_attach_clawd` stays open to authenticated owners so Checkout can
  start from an owned Clawd.
- `promote_session` and `save_campaign_artifact` require stored active
  subscription state from the repository.
- Client-supplied `subscriptionStatus` and Stripe return URLs grant nothing.
- Public paid claims remain closed.

Proof:
- `server/src/hostedClawd/service.ts`
- `server/src/hostedClawd/repository.ts`
- `server/src/hostedClawd/types.ts`
- `server/test/hosted-clawd-protected-tool-gate.test.ts`
- `scripts/verify-hosted-clawd-protected-tool-gate.mjs`
- `artifacts/hosted-clawd/postalpha-0.63h-protected-tool-gate.json`

Next quest:
`0.64H Saved Hosted Clawd Read Surface`.

## Completed Stripe test billing slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Completed quest:
`0.62H Stripe Test Billing`.

Decision:
`STRIPE_TEST_BILLING_WEBHOOK_GATED`.

Proof:
- `server/src/hostedClawd/billing.ts`
- `migrations/hosted-clawd/002_stripe_test_billing.sql`
- `server/test/hosted-clawd-stripe-test-billing.test.ts`
- `scripts/verify-hosted-clawd-stripe-billing.mjs`
- `assets/generated/placeholders/svg/hosted-clawd-clay-bg.svg`
- `web/src/HostedClawdTray.tsx`
- `web/src/styles.css`
- `artifacts/hosted-clawd/postalpha-0.62h-stripe-test-billing.json`

## Completed save UX slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Completed quest:
`0.61H Invite Beta Save UX`.

Decision:
`MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED`.

Proof:
- `scripts/verify-hosted-clawd-save-ux.mjs`
- `scripts/verify-hosted-clawd-save-ux-browser.mjs`
- `artifacts/hosted-clawd/postalpha-0.61h-save-ux.json`

## Completed persistence foundation slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.60H Persistence Foundation`.

Player-facing promise:
Atlas now has the owner-protected memory needed for a map/chat app where users
can see their local world, keep local business context, and later deploy
Clawdbot as a paid neighborhood operator without leaving the voxel map surface.

Engineering promise:
Implement the first DB/Auth persistence foundation: Railway Postgres, SQL
migration, OAuth/OIDC bearer verification, protected write routing, owned
Hosted Clawd rows, business profile rows, Scout Drop saves, campaign draft
saves, usage events, and idempotency. Stripe stays closed.

Decision:
`PERSISTENCE_FOUNDATION_LOCAL_GREEN_STRIPE_CLOSED`.

Selected axis:
`hosted_clawd_persistence_foundation`.

Proof:
- `migrations/hosted-clawd/001_persistence_foundation.sql`
- `server/test/hosted-clawd-persistence-foundation.test.ts`
- `server/test/hosted-clawd-postgres-smoke.ts`
- `scripts/verify-hosted-clawd-persistence-foundation.mjs`
- `artifacts/hosted-clawd/postalpha-0.60h-persistence-foundation.json`

Next quest:
`0.61H Invite Beta Save UX`.

## Completed DB/Auth prep slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.59H Hosted Clawd Storage/Auth Decision Packet`.

Player-facing promise:
Atlas is preparing to make Hosted Clawd durable: one owner, one business, one
saved Scout Drop, and one saved campaign draft, while the map remains the
product surface.

Engineering promise:
Choose the production DB/auth foundation and verifier envelope before
implementing persistence: Railway Postgres, OAuth/OIDC account linking for
protected MCP Hosted Clawd actions, SQL migrations, owner checks,
idempotency, and Stripe later.

Decision:
`DB_AUTH_PREP_APPROVED_STRIPE_STAYS_CLOSED`.

Selected axis:
`hosted_clawd_storage_auth`.

Contract:
- Persistence implementation is reopened only for the next named slice,
  `0.60H Persistence Foundation`.
- Auth must work for protected MCP Hosted Clawd actions through OAuth/OIDC
  account linking. ChatGPT model text and iframe-only cookies are not identity.
- Public MCP tool surface remains the seven Alpha tools until a separate
  protected Hosted Clawd tool slice is approved.
- Fable save-state UX must stay as a compact tray/status strip over the map,
  not a dashboard, pricing page, or geometry change.
- Stripe/money remains closed until 0.60H ownership, idempotency, usage, and
  reload-safe persistence pass.

Proof:
- `docs/HOSTED_CLAWD_STORAGE_AUTH_DECISION_PACKET.md`
- `artifacts/hosted-clawd/postalpha-0.59h-storage-auth-decision.json`
- `scripts/verify-hosted-clawd-db-auth-prep.mjs`

Next quest:
`0.60H Persistence Foundation`.

## Branch-local NS-3 presentation gate (2026-07-08, `fable/0.58e-prop-cleanup`)

Current quest:
`0.75C-4 NS-3 Presentation Fixes`.

Player-facing promise:
Atlas reads more like a first-party ChatGPT map surface: quieter coverage copy,
lighter dark-mode map treatment, native dark cards, mobile chrome that gives the
map back, and one button grammar.

Engineering promise:
Apply the Fable presentation audit findings F1-F6 in `web/src` presentation code
only, preserving generated-scene honesty and avoiding renderer scene graph,
compiler, generator, dependency, provider, persistence, paid, or MCP tool
changes.

Contract:
- Dark map veil is softened to `brightness(0.94) saturate(1)` in explicit dark
  theme and prefers-color-scheme fallback.
- "Generate a district" uses dark-native card styling while preserving
  `generated · session-only`.
- Coverage explainer is exactly: `Riverside is fully explorable. Other counties
  preview as outlines. Nothing saves between chats.`
- The visible `LOOKUP not saved` chip is removed.
- Generated-scene honesty banner remains untouched.
- Mobile `<=480px` coverage switcher collapses to a one-line chip by default
  and expands/collapses on tap.
- Bottom sticker toolbar buttons match the zoom stack rounded-square grammar.
- The selected-place activity dot stays only because it maps to curated place
  activity data, now with plain accessible labeling.

Metric / verifier:
- `pnpm typecheck:starter`
- `pnpm test:core`
- `node scripts\verify-tool-result-shape.mjs`
- `node scripts\verify-provider-boundaries.mjs`
- Copy grep over `scripts/verify-*.mjs` and changed widget files.
- `git diff --check`
- Attempt strict `engine-beta-data` split guard.
- Reviewer-run, per packet: `pnpm build:web`,
  `node scripts\verify-generated-district-widget.mjs`,
  `node scripts\verify-widget-performance.mjs`, plus both-theme screenshots.

Proof:
`artifacts/0.75c-presentation-audit/CODEX_RESULT.md`.

Current status:
Implemented locally with non-browser verifiers green. The strict split guard was
attempted and is blocked by this worktree's `.git` index permission issue: Git
status reports unchanged `web/src/VoxelSceneView.tsx` as modified even though it
hashes to the HEAD blob. Browser bundle/widget/performance replay and
both-theme screenshots remain reviewer-run by packet instruction.

Anti-scope:
No renderer scene-graph changes, generator/compiler changes, new dependencies,
MCP tool changes, provider geometry, Hosted Clawd, DB/Auth, Stripe,
public Anaheim/Ontario promotion, dashboard drift, or generic SaaS/product
drift.

Next visual-engine move:
`0.75C-4 Browser Bundle / QA Replay`: reviewer runs `pnpm build:web`, then
`verify-generated-district-widget`, `verify-widget-performance`, and both-theme
desktop/mobile screenshots against the fresh bundle.

## Branch-local close-zoom material gate (2026-07-08, `fable/0.58e-prop-cleanup`)

Completed quest:
`0.75C-3 Close-Zoom Material Texture`.

Player-facing promise:
At close zoom, Atlas buildings read as built from coarse wall and roof material
instead of flat color planes.

Engineering promise:
The renderer adds deterministic wall and roof texture grammar inside the
existing vector building path, zoom-gated so overview cameras emit no new
material texture commands.

Proof:
`artifacts/0.75c-material-texture/CODEX_RESULT.md`.

Current status:
Implemented locally with non-browser verifiers green. Material verifier proves
below-threshold planned texture commands are `0`, above-threshold sample
commands are deterministic, `desktop`/`mobile` stay below `1.55`, and
`residential_detail`/`commerce_detail` cross the threshold. Browser
bundle/widget/performance replay remains reviewer-run by packet instruction.

## Branch-local generated fabric gate (2026-07-08, `fable/0.58e-prop-cleanup`)

Completed quest:
`0.75C-2 Denser Residential Fabric`.

Player-facing promise:
Generated neighborhoods read as tighter small-house town fabric: more varied
cottages/ranches/rowhomes along the street grid, fewer empty-looking gaps.

Engineering promise:
Residential parcel packing is denser through generator parameters and a safer
small-home template pool, without changing renderer/compiler contracts,
authored Riverside, curated props, forbidden prop policy, or `maxPropCommands`.

Contract:
- Residential zones use a tighter cell and a higher density floor.
- Home templates stay roof-safe and varied enough to keep clone pressure under
  `0.30`.
- Apartments may tighten slightly, but apartment facade bounds stay safe.
- Corner-store module code remains unchanged.
- Generated buildings still render through existing `CityWorldScene` and
  object-kit metadata only.

Metric / verifier:
- `pnpm typecheck:starter`
- `pnpm test:core`
- `node scripts\verify-generated-district-parity.mjs`
- Relevant node-side scene grammar verifiers.
- Reviewer-run: `pnpm build:web`,
  `node scripts\verify-generated-district-widget.mjs`,
  `node scripts\verify-widget-performance.mjs`.

Proof:
`artifacts/0.75c-residential-fabric/CODEX_RESULT.md`.

Current status:
Implemented locally with non-browser verifiers green. Generated sample homes
increased from 20 to 38; clone pressure remains below the `0.30` gate. Browser
bundle/widget/performance replay remains reviewer-run because this sandbox
blocks the required esbuild path.

Anti-scope:
No authored Riverside scene changes, curated prop changes, new dependencies,
Three.js, scene compiler contract changes, forbidden prop-kind changes,
`maxPropCommands` changes, MCP tool changes, provider geometry, Hosted Clawd,
DB/Auth, Stripe, public Anaheim/Ontario promotion, cars, humans, labels, panels,
glows, dashboard UI, or generic SaaS/product drift.

Next visual-engine move:
Superseded by the human-directed `0.75C-3 Close-Zoom Material Texture` packet
above. Browser bundle/widget/performance replay is now tracked as `0.75C-4`.

## Branch-local renderer depth gate (2026-07-08, `fable/0.58e-prop-cleanup`)

Current quest:
`0.75C-1 Prop / Building Depth Interleave`.

Player-facing promise:
At detail zoom, plaza props, trees, benches, signs, and other allowed props
respect the city massing: props behind buildings tuck behind them, and props in
front remain visible.

Engineering promise:
Buildings and props render as one shared Pixi painter-order stack keyed by the
existing iso depth helpers. The old QA labels `buildingLayer` and `propLayer`
remain discoverable and independently hide their matching grouped objects.

Contract:
- Building visual groups and prop visual groups parent into
  `buildingPropDepthLayer`.
- Building depth key is `x + y + max(width, depth) * 0.001`.
- Prop depth key is anchor `x + y`.
- Equal-depth ties draw buildings before props.
- QA can still find `buildingLayer` and `propLayer` in
  `window.__ATLAS_QA__.world.children`.
- Hover and selection stay overlay-only; no scene rebuild on focus changes.

Metric / verifier:
- `pnpm typecheck:starter`
- `pnpm test:core`
- `pnpm build:web`
- `node scripts\verify-generated-district-parity.mjs`
- `node scripts\verify-generated-district-widget.mjs`
- `node scripts\verify-widget-performance.mjs`
- `node scripts\verify-render-command-layer-budget.mjs`
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only`

Proof:
`artifacts/0.75c-depth-interleave/CODEX_RESULT.md`.

Current status:
Implementation and non-browser verifiers are green. `pnpm build:web` is blocked
in the current sandbox by esbuild access denial while resolving the web entry,
so the generated-widget and widget-performance browser gates still need replay
in an environment where the web bundle can be produced.

Anti-scope:
No new dependencies, Three.js, generator/compiler contract changes, forbidden
prop-kind changes, `maxPropCommands` cap changes, MCP tool changes, provider
geometry, Hosted Clawd, DB/Auth, Stripe, public Anaheim/Ontario promotion,
dashboard UI, cars, humans, labels, panels, or decorative clutter.

Next visual-engine move:
`0.75C-2 Browser Bundle / QA Replay`: rerun `pnpm build:web`, then
`verify-generated-district-widget` and `verify-widget-performance` against the
fresh bundle. If the build passes, continue to the next named renderer quality
slice from the latest selector or human packet.

## Branch-local generated visual gate (2026-07-06, `fable/0.58e-prop-cleanup`)

Current quest:
`0.72H-b Fable Roof / No-Label Cleanup Gate`.

Player-facing promise:
Generated district previews stop leaning on visible place labels and house roofs
read cleaner at desktop and 390x844 mobile scale.

Engineering promise:
Generated preview labels are suppressed through an explicit renderer prop,
residential generation avoids roof-unsafe tiny/tall home specs, and generated
parity/browser verifiers fail if labels or unsafe residential roofs return.

Contract:
- Generated mode passes `suppressPlaceLabels` to `CityWorldRenderer`.
- Public Riverside label behavior is unchanged.
- Generated homes stay non-playable, synthetic, provider-free, and
  session-only.
- Residential roof safety is checked numerically at the generated-scene seam.
- Browser proof must show `data-qa-place-labels="suppressed"` in generated mode.

Metric / verifier:
- `node scripts\verify-generated-district-parity.mjs --json-only`
- `node scripts\verify-generated-district-widget.mjs --url http://127.0.0.1:8793/preview --screenshots artifacts\0.72h-b-roof-label-cleanup\screens --json-only`

Proof:
`artifacts/0.72h-b-roof-label-cleanup/FABLE_RESULT.md`.

Anti-scope:
No backend, Railway, DB/Auth, Stripe, MCP tool surface, provider geometry,
public paid claims, cars, humans, dashboards, broad UI, public Anaheim/Ontario,
or public playable county promotion.

Next visual-engine move:
`0.72H-c Residential Object-Kit Authorship Pass`: replace the remaining
procedural house-detail feel with a smaller set of authored cottage/ranch/
rowhome modules and closer no-label desktop/mobile crops before broadening the
district again.

## Engine track note (2026-07-04, `fable/0.52e-diorama-engine`)

The 0.52E Diorama Engine super-pass ran (BUILD_LOG Entry 082). Atlas has ONE
engine base: canonical render-command pipeline with a compiler-authored typed
ground contact grammar. `codex/e6-apps-sdk-readiness` (module-atlas renderer) and
`codex/g5-road-lot-terrain-contact` are formally superseded as engine bases —
history only, do not reopen. The next visual-engine decision (per the 2B spec's
"next decision" clause + the Entry 082 plateau finding): a **grade/contrast tuning
pass with design sign-off** — the golden-hour wash, not the ground, now caps the
north-star score. Human review of `artifacts/0.52e-diorama/` screenshots gates any
merge/deploy of this branch.

## Current local-green setup UI slice (2026-07-05, `codex/integrate-hosted-clawd-fable-058e`)

Current quest:
`0.58J Hosted Clawd Setup UI Port`.

Player-facing promise:
Atlas keeps the sharper Fable map and makes the Hosted Clawd tray feel like a
purpose-built setup console instead of a generic upgrade card, while Alpha
remains visibly session-only.

Engineering promise:
Port the Superior grey setup console / setup rail grammar into the Atlas Hosted
Clawd tray without changing MCP contracts, context fields, server state, or any
persisted/money/auth boundary.

Input update:
`0.58I Integration Canonicalization / Release Decision Packet` at base commit
`920cf8a`.

Decision:
`SETUP_CONSOLE_PORTED_GATES_STAY_CLOSED`.

Selected axis:
`hosted_clawd_setup_ui`.

Contract:
- Branch `codex/integrate-hosted-clawd-fable-058e` is the local canonical
  candidate, not automatically deployed.
- Public MCP tool surface remains the seven Alpha tools.
- Hosted Clawd setup UI may change, but no new context fields, server state, or
  public tool contracts may appear.
- Hosted Clawd persistence, money, auth/OAuth, DB, public pricing/saved-state
  claims, reports, evidence, XP, exports, and automation remain closed.
- The Fable visual chain stays explicit integration input, not hidden inside the
  setup UI port.
- Anaheim/Ontario remain hidden and non-public.

Metric / verifier:
- Focused UI proof for the Hosted Clawd tray on desktop and 390x844 mobile.
- `node scripts\verify-hosted-clawd-scaffold.mjs`
- `node scripts\verify-atlas-source-of-truth-drift.mjs --json-only`
- `node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode hosted-clawd-fable-integration --json-only`

Proof:
0.58J is local-green as a UI/context slice. The next gate must inspect the
integrated desktop and 390x844 mobile proof before deploy.

Anti-scope:
No deploy, DB, auth, OAuth, Stripe/money, persistence, server state, new context
fields, XP, evidence, reports, exports, automation, provider geometry, public
Anaheim/Ontario, dashboard shell, generic SaaS page, public pricing/saved-state
claim, or new public MCP tool.

Gate shorthand:
No deploy, DB, auth, Stripe, persistence.

Stop condition:
Stop after the Superior grey setup console grammar is ported, docs and verifiers
keep every Hosted Clawd implementation gate closed, and deploy remains blocked
on human visual approval.

Next quest:
`0.58K Human Visual Gate / Deploy Readiness Decision`.

CTO full-stack expansion:
`docs/ATLAS_FULL_STACK_PRODUCT_SPEC.md` now defines the broader completion map:
live reviewability first, then storage/auth decision, then first Hosted Clawd
persistence, then Stripe billing only after persistence is boring. This document
does not reopen persistence, money, evidence, XP, reports, exports, automation,
or public Anaheim/Ontario.

## Branch-local Fable pass (2026-07-05, `fable/0.58e-prop-cleanup`)

Current quest:
`0.58E Fable Prop Cleanup / Shell Building Firming`.

Player-facing promise:
The map reads more like a serious voxel county engine and less like a scene
covered by a cute mascot or placeholder props.

Engineering promise:
Suppress Clawd actor drawing in the map renderer, remove unused Clawd sprite
helpers from voxel preview copies, and give shell/not-indexed terrain, roads,
lots, and buildings a firmer muted grammar without making them public/playable.

Contract:
- `CityWorldRenderer` may skip `actor.kind === "clawd"` at draw time.
- Shell grammar may add low-noise material cues and color discipline.
- Shell grammar may not add fake public places, people, cars, labels, provider
  geometry, or public readiness claims.

Metric / verifier:
`node scripts\verify-fable-prop-cleanup.mjs`.

Proof:
Renderer source has no animated Clawd target path or Eastvale mascot offset;
legacy `drawClawd` helpers are gone from the web/widget voxel preview copies;
shell terrain/road/lot/building grammar has explicit functions and palettes.

Anti-scope:
No MCP tool changes, Hosted Clawd, Stripe, DB, OAuth, persistence, XP, evidence,
automation, reports, exports, provider geometry, dashboard shell, public
Anaheim/Ontario promotion, or new decorative clutter.

Stop condition:
Stop after focused verifier, typecheck, core tests, web build, and desktop/mobile
preview proof pass. Do not merge this branch into the Hosted Clawd scaffold
branch without an explicit integration decision.

Source-of-truth note:
This Fable pass is now one explicit input to the 0.58I integrated canonical
candidate. It is not a promotion of Anaheim/Ontario and not a replacement for
the parked owner-gate ladder.

## Completed Hosted Clawd scaffold input (2026-07-05)

The human explicitly reopened Hosted Clawd for the ChatGPT app rental path. This
does not reopen live Paid Beta by itself. The completed scaffold input is:

`0.58H Hosted Clawd Rental Scaffold`.

Goal:
Make the map-first app show the real Hosted Clawd path: host Clawd for this
business, preview what would be saved, and keep the Alpha boundary visible.

Allowed:
- PRD/spec consolidation.
- Server-side Hosted Clawd service interfaces and guarded HTTP routes.
- Widget-only Hosted Clawd context on existing tool results.
- Compact map-first Hosted Clawd tray.
- OFF-by-default flags for persistence, money, and public claims.

Still blocked:
- live Stripe Checkout, Billing Portal, webhooks, auth provider, DB client,
  migrations, persisted writes, OAuth, XP, evidence, reports, exports, public
  pricing claims, deploy, or new public MCP tools.

Verifier:
`node scripts\verify-hosted-clawd-scaffold.mjs`.

Split mode:
`node scripts\verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode hosted-clawd-scaffold --json-only`.

Next Hosted Clawd implementation slice after the 0.58K visual/deploy gate:
`0.59H Hosted Clawd Storage/Auth Decision Packet`. It should choose the storage
provider, migration strategy, auth/account ownership model, idempotency tests,
and first persisted object. Do not implement DB or Stripe until those choices
are explicit.

## Branch-local Fable pass (2026-07-05, `fable/0.58e-prop-cleanup`, second slice)

`0.58E Generated District Parity + Numeric Proof` is locally green (BUILD_LOG
Entry 088). Generated-district quality is now gated numerically, not by
screenshot vibes: `node scripts\verify-generated-district-parity.mjs
--json-only` runs 9 gates (pad honesty, footprint fill, roof/eave
registration, apartment facade bounds, commerce strip routing/massing,
desktop+mobile lower-frame density) plus a built-in detection proof that
re-introduces each known 0.57E failure mode into a degraded scene and asserts
its gate fires. Core seam API: `analyzeGeneratedDistrictParity` in
`packages/core/src/voxel/cityWorldParametricGenerator.ts` (tests in
`packages/core/test/city-world-parametric-parity.test.ts`). Evidence:
`artifacts/0.58e-generated-parity-plus/`.

Next visual-engine blocker (named by the curated reference readout): the
generated commercial zones still paint bare plaza-apron terrain much larger
than their strip rows (curated pad-fill mean 0.993 vs generated 0.719), and
the generated palette leans on saturated rooftop units where curated
Riverside reads calmer. A future slice should shrink commercial-zone apron
terrain to hug the strip rows — and gate the apron-to-strip terrain ratio at
the generator seam so it cannot regress.

## Current phase
Fable takeover status:
- The Fable product-submission lane is now locally controlled by Axiom/Codex,
  with Claude stopped and the Fable commit preserved as
  `codex/fable-product-submission-experiment`.
- Local cleanup made the preview HTTP smoke and strict Engine Beta split guard
  understand the new in-widget preview/submission artifacts.
- `0.49P` reliability sweep and Railway rollout are complete. Public proof is
  green for `/preview`, `/mcp`, submission, generated-district preview,
  Scout/Campaign panel, and Engine Beta coverage.
- Next product-track move: `0.50P Submission Asset/Directory Finalization`.
  Host privacy/terms, produce any required PNG icon assets, and assemble the
  final Apps directory packet. Do not add new tools, DB, persistence, paid
  scope, OAuth, XP, evidence, automation, reports, or exports.
- Next art-quality move after submission chores: `0.51E Generated District
  Object Variety / Clone-Pressure Reduction`. The public generated district is
  useful and honest, but still visually around 6.5/10 and has
  `HIGH_HOME_CLONE_PRESSURE`.

Alpha Path B is accepted. Atlas is now in Engine Beta, not Paid Beta. Hosted
Clawd contracts and Stripe planning remain parked until the voxel county engine
is visually credible and the human explicitly reopens persistence or money.

Public Alpha is deployed and proven at
`https://atlas-backend-production-e6fc.up.railway.app`. Treat 0.21A as the
handoff lock: Riverside/Eastvale is the only public playable district,
California shell coverage is honest, Scout/Campaign remain session-only Alpha
previews, and Anaheim/Ontario stay hidden/non-public.

The real consumer-app route is now recorded in
`docs/ATLAS_REAL_CONSUMER_APP_ROADMAP.md`. July 4 release work must prioritize a
credible public Alpha / Engine Beta proof over full paid/backend/national scope:
`0.23E` is deployed and publicly proven. `0.24E` and `0.25E` are complete
locally: the second-district readiness aggregator reports all current evidence
inputs, and the owner-gate cutline blocks Anaheim promotion with named
owner-gate blockers.
Continue the Engine Beta spine through consumer entry quality, engine quality,
second playable district, consumer save layer, and Hosted Clawd Beta.

Current quest:

`0.45E Owner Gate Cutline / Next Axis Selection` is locally green.

Goal:

Select the next second-district axis from the 0.44E hidden proof packet without
starting a public Anaheim spike.

0.45E local result:

- Added `scripts/select-second-district-owner-gate-next-axis.mjs`.
- The selector reads the 0.44E readiness aggregate, owner cutline, visual
  review, and product proof.
- Selected axis: `owner_gate_review`.
- Decision: `REQUEST_OWNER_REVIEW`.
- Recommended next quest: `0.46E Owner Gate Review Packet`.
- Blocked controlled public Anaheim spike because readiness is not promotion
  ready and owner cutline remains `BLOCK_PROMOTION`.

Next move:

Run `0.46E Owner Gate Review Packet`. It should package the exact Lumen, Mira,
Forge, and Axiom review asks against the repo-local hidden proof. It must not
implement public Anaheim. It must not start another hidden art pass unless an
owner names one exact blocker.

Canonical next quest:
`0.46E Owner Gate Review Packet`.

0.45E selector artifact:

`artifacts/second-district-readiness/latest/anaheim-candidate/postalpha-0.45e-owner-gate-next-axis.json`

0.44E proof artifacts:

- `artifacts/second-district-visual-packets/postalpha-0.44e-anaheim-hidden-proof`
- `artifacts/second-district-readiness/latest/anaheim-candidate/readiness-aggregate.json`
- `artifacts/second-district-readiness/latest/anaheim-candidate/owner-gate-cutline.json`

0.43E selector artifact:

`artifacts/engine-quality-axis/postalpha-0.43e-next-target-selection.json`

Completed local slice:

`0.38F App Drift / Source-of-Truth Reconciliation` is locally green. It repaired
the 0.38E selector artifact, aligned AGENTS/README/NEXT_QUESTS/current-update,
added `scripts/verify-atlas-source-of-truth-drift.mjs`, and confirmed the
active public MCP tool surface remains the seven Alpha tools.

Completed local slice:

`0.33E DB Scene Packet Persistence Plan` is locally green and remains
planning-only. It defines future scene packet DB schema, TTL behavior, review
gates, data boundaries, and rollback path without implementing DB persistence.
No package/env drift, migrations, DB clients, server DB reads/writes, Hosted
Clawd, live providers, paid scope, or public Anaheim/Ontario exposure is
allowed from that gate.

Completed local slice:

`0.32E Runtime Scene Packet Memory Adapter` is locally green. It wires the
scene packet contract into server runtime memory, attaches `_meta.scenePacket`
metadata for playable tools, returns status-only packet metadata for shell and
unsupported counties, and exposes a safe diagnostic route without DB
persistence.

Completed local slice:

`0.31E Server Scene Packet Cache Contract` is locally green. It defines
deterministic packet keys, runtime-only cache policies, readiness-specific
packet boundaries, blocked future generation modes, and safety checks that
0.32E now consumes.

Completed local slice:

`0.30E Dynamic Window Refresh / Pan-Safe Scene Streaming` is locally green. It
makes the window-aware renderer safe under pan and zoom: the active scene
window is derived from the current camera center, kept bounded by preset-sized
frames, and refreshed only when pan leaves the buffered active frame.

Completed local slice:

`0.29E Window-Aware Renderer Consumption` is locally green. It moved
`CityWorldRenderer` onto `sceneWindow.visibleCommands` and blocked direct
full-scene command-buffer drawing in the renderer.

Completed local slice:

`0.28E Tile Chunk / Scene Window Compiler` is locally green. It added the core
chunk index and camera-specific scene-window compiler that 0.29E now consumes.

Completed local slice:

`0.24E Second-District Promotion Readiness Aggregator` is locally green. Latest
artifact:

`artifacts/second-district-readiness/latest/anaheim-candidate`.

Current 0.24E result:
- `readyForPlayablePromotion: false`.
- Evidence states: source verifier passed, visual packet passed, product proof
  passed, split guard passed.
- Data blockers: none.
- Visual blockers: not promotion-ready, not public-playable, Lumen acceptance
  missing.
- Product blockers: not promotion-ready, not public-playable, Mira acceptance
  missing.
- Release blockers: Forge acceptance missing and promotion packet not ready.

0.25E execution rule:

`0.25E Owner Gate Closure / Public Promotion Cutline` is locally green. Latest
artifact:

`artifacts/second-district-readiness/latest/anaheim-candidate/owner-gate-cutline.json`.

Current 0.25E result:
- Outcome: `BLOCK_PROMOTION`.
- Lumen gate: blocked by `visual_packet_not_promotion_ready`.
- Mira gate: blocked by `product_proof_not_promotion_ready`.
- Forge gate: blocked by `forge_split_guard_acceptance_missing`.
- Axiom gate: blocked because the readiness aggregate is not promotion-ready.

No controlled Anaheim public playable spike until the cutline changes from
`BLOCK_PROMOTION` to `APPROVE_CONTROLLED_PUBLIC_SPIKE`. Do not flip metadata or
expose Anaheim publicly to make the schedule look better.

Completed deployed slice:

`0.23E Hidden Venue Authorship Pass` is deployed on Railway and publicly proven.
Anaheim now has hidden no-label proof for Convention Center and ARTIC / Angel
Stadium area, but the visual packet outcome remains `HIDDEN_DRAFT_ONLY`,
`promotionReady: false`, and `publicPlayable: false`.

Public proof roots:
- Coverage:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\coverage`.
- Hidden Anaheim no-label draft:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\anaheim-draft-no-label`.
- Visual packet:
  `C:\Users\mzwin\AppData\Local\Temp\atlas-postalpha-023e-hidden-venue-authorship-public\visual-packet`.

Accepted baseline:

`0.22E Public Product Entry Compression` is the public Alpha baseline. Keep the
three-second model intact: play Riverside now, browse California shells, lookup
places without saving, and keep Scout/Campaign session-only.

Forge has added `docs/ATLAS_ENGINE_BACKEND_OPERATING_BRIEF.md` as the current
Axiom organization brief for treating Atlas as a county-to-scene engine. Use it
when choosing between visual, backend, and product proof slices: every engine
slice should name the engine axis, typed contract, metric, verifier,
screenshot/product proof, public claim that stays blocked, and forbidden files.
The recommended Forge-forward ladder is 0.13E mobile occlusion budget, 0.14E
source-to-cell assignment contract, 0.15E scene budget preflight, 0.16E object
face grammar/no-label proof, and 0.17E provider promotion preflight.

Recommended priority chain:
The External Voxel Reference Adapter is now the accepted way to use
`https://github.com/kunifujiwara/VoxCity`,
`https://github.com/s-macke/voxelspace`, and
`https://github.com/s-du/Pixels2Voxels`: reference only, no vendoring, no
Python/Open3D/terrain-renderer dependency, no live Earth Engine/provider
ingestion, no public Anaheim/Ontario promotion, and no image-to-voxel runtime
gimmick. Use `docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md` plus
`node scripts\verify-external-voxel-reference-adapter.mjs` before applying
their concepts. The useful pressure is: VoxCity-style source/grid/voxel-layer
discipline, VoxelSpace-style terrain height/color diagnostics, and
Pixels2Voxels-style offline channel/contrast art QA.

The GameBlocks Atlas Adapter is now the accepted way to use
`https://github.com/xt4d/GameBlocks`: reference only, no vendoring, no
Three/Rapier dependency, no actor/vehicle/combat systems, and no product UI
drift. Use `docs/GAMEBLOCKS_ATLAS_ADAPTER.md` plus
`node scripts\verify-gameblocks-atlas-adapter.mjs` before applying any reference
concepts. Pre-Alpha 0.9E is now complete locally: Atlas owns the runtime
`WorldBasis` / `TerrainSampler` contract in `@atlas/core/voxel`, and diagnostics
plus the Pixi renderer consume those helpers instead of private duplicate math.

Pre-Alpha 0.10E Terrain / World-Edge Measured Correction is complete locally as
a public Riverside terrain metric pass. It adds viewport-level
`chunkEdgeReadabilityScore` and moves the public terrain axis:
`terrainMassingCoverageRatio: 0.796`, `emptyBoardRatio: 0.151`,
`firstViewportCompositionScore: 0.754`, and
`chunkEdgeReadabilityFloorScore: 0.668`.

Pre-Alpha 0.11E Public Object Authorship is complete locally. It uses existing
`CityWorldScene` object-family grammar to strengthen Eastvale Core, residential
homes, rowhomes, strip-store/commerce, apartments, and service/gym blocks while
keeping terrain floors green. The object verifier reports
`terrainMassingCoverageRatio: 0.796`, `emptyBoardRatio: 0.151`,
`firstViewportCompositionScore: 0.754`, `homeClonePressure: 0.2`,
`homeVariantCount: 12`, desktop object families `4`, mobile object families
`5`, and residential-detail object families `1`.

Pre-Alpha 0.12E Derived Terrain Map Engine Proof is complete locally. Atlas now
derives height/color maps and mobile occlusion/readability reports directly
from `CityWorldScene` in `@atlas/core`. This adapts the useful VoxelSpace idea
without adopting a terrain-only renderer. The current verifier reports public
Riverside `heightRange: 3.05`, `nonFlatCellRatio: 0.83`,
`occupiedCellRatio: 0.437`, `colorKeyCount: 26`, and `waterEdgeCutRatio:
0.608`; Orange shell has zero object occupancy; Anaheim/Ontario hidden drafts
remain non-playable and provider-free.

Pre-Alpha 0.13E Mobile LOD / Occlusion Budget Enforcement is complete locally.
Atlas now has named mobile budgets in `@atlas/core`:
`playable_mobile`, `residential_detail_probe`, `shell_mobile_empty_state`, and
`hidden_draft_mobile_probe`. The mobile occlusion verifier now reports budget
profile, pass/fail, grouped blockers, counts, and metrics. Riverside normal
mobile passes `playable_mobile` with `mobileOcclusionRiskScore: 0.245`,
`mobileReadabilityScore: 0.755`, `traySafeBandPressureRatio: 0.276`,
`interactiveMarkerPressureRatio: 0.313`, and `verticalStackPressureRatio:
0.075`. Residential detail is treated as a dense proof crop, Orange shell stays
empty, and Anaheim/Ontario hidden drafts stay non-playable.

Pre-Alpha 0.14E `Face Orientation / Source-Art Contrast Gate` is complete
locally as a diagnostic gate, not a visual-art claim. `CityWorldScene`
diagnostics now measure face orientation, roof/body separation, facade
contrast, object signature coverage, weakest public object family, hidden
anchor contrast, and weakest hidden anchor. Current metrics: Riverside
`faceOrientationCoverageRatio: 1.0`, `roofSideSeparationRatio: 1.0`,
`facadeContrastCoverageRatio: 1.0`, `objectSignatureCoverageRatio: 1.0`,
`weakestObjectFamily: civic_landmark`; Anaheim hidden draft
`hiddenAnchorContrastScore: 0.851`, `weakestHiddenAnchor: angel-stadium`.

Pre-Alpha 0.15E `Civic / Venue Object-Kit Contract` is complete locally as a
reusable object-kit contract, not a location-specific polish pass. Diagnostics
now score two stress cells with the same silhouette, hierarchy, mobile, and
no-label readiness contract: public `eastvale-core-civic-landmark` and hidden
`angel-stadium-venue-anchor`. Current metrics: Eastvale Core
`objectKitScore: 0.955`; Angel Stadium `objectKitScore: 0.970`; Ontario remains
a hidden control with no civic/venue stress-cell classification.

Pre-Alpha 0.16E `Public Civic Landmark Authorship Pass` is complete locally as
a renderer implementation slice. `CityWorldRenderer` now applies a reusable
public civic landmark object-kit pass: base hierarchy, roof hierarchy, facade
rhythm, and an Eastvale Core stress-cell signature. The focused verifier is
`node scripts\verify-public-civic-landmark-authorship.mjs --json-only`.

Pre-Alpha 0.17E `Scout Drop Alpha Loop Boundary` is complete locally as a
product/tool contract slice. `preview_scout_drop` and
`preview_campaign_engine` now return typed `alphaBoundary` data that makes the
loop explicit: session-only Alpha, no saves, no action execution, no XP, Hosted
Clawd required for saved state, and a clear next tool. The focused verifier is
`node scripts\verify-scout-campaign-alpha-loop.mjs --json-only`; MCP and
submission verifiers now assert the same boundary.

Default next quest:
0.21A Alpha Handoff and Post-Alpha Slice Decision. The Railway deploy and public
Alpha proof are green at `https://atlas-backend-production-e6fc.up.railway.app`.
Public preview, MCP, submission, and Engine Beta coverage screenshots passed.
Before starting new build work, package the public Alpha handoff: URL, local and
public verifier results, screenshot roots, parked scope, and the next slice.

Next build slice after handoff should be chosen by the weakest remaining public
Alpha blocker: `Public Product Entry Compression` if mobile still feels dense,
or `Hidden Venue Authorship Pass` if Axiom wants to return to second-district
readiness. Do not run a broad art pass without a named metric and screenshot
proof.

Do not run another broad art pass unless it names the metric it intends to move
and includes screenshot proof. Do not import GameBlocks, Three, Rapier, actor
systems, vehicles, provider geometry, public Anaheim/Ontario promotion, or
dashboard UI.

Pre-Alpha 0.8E No-Label Anchor Recognition remains complete locally as a
hidden-draft gate, not a public promotion. Anaheim remains non-public and
non-playable, but the two target anchors now have a verified visual packet:
`Anaheim Convention Center` and `ARTIC / Angel Stadium area`. The packet outcome
is `HIDDEN_DRAFT_ONLY`, with `promotionReady: false` and `publicPlayable:
false`.

Pre-Alpha 0.6F Engine Diagnostics / Theory Harness is active locally. It adds
`analyzeCityWorldScene` as a core diagnostics API, `scripts/debug-city-world-engine.mjs`
as the repeatable report command, and a dev-only Pixi overlay behind
`?atlasDebug=engine`. This becomes the decision gate before more terrain or
object art work. The first diagnostic run had zero hard blockers and reported
Riverside terrain massing coverage around 33.4%, empty-board ratio around
33.5%, first-viewport composition floor around 57.2%, building/lot contact at
100%, lot/road contact around 80.5%, home clone pressure around 20%, and
`terrain_massing` as the weakest playable axis. Future
visual-engine slices must name the metric they intend to move. Verify with
`node scripts\debug-city-world-engine.mjs --json-only`, core/type/build, the
0.1E-0.6E verifier stack, strict `engine-beta-data`, and normal plus
`atlasDebug=engine` browser proof. Block if the report hard-fails fake
playability, provider leakage, public hidden drafts, cars/walkers, decorative
props, or debug overlay leakage.

Pre-Alpha 0.6E Terrain Chunk Massing / World-Edge Composition is superseded by
the 0.6F diagnostics gate before more terrain tuning. It adds `terrainChunkMassing` to `CityWorldScene` visual grammar and
uses renderer under-tile side faces, rim lines, shadows, and strata to make
Eastvale Core, Neighborhood Blocks, park basin edges, waterfront cuts, and the
outer world edge read as larger terrain chunks. Verify with
`node scripts/verify-terrain-chunk-massing-grammar.mjs`, the full 0.1E-0.5E
verifier stack, core/type/build, strict `engine-beta-data`, and Engine Beta
coverage screenshots. Pass only if desktop, `390x844` mobile, and
residential-detail screenshots show a visible first-3-second terrain massing
improvement. Block if this still reads as subtle strokes, noisy stripes, or
requires props/labels/panels to feel better.

Pre-Alpha 0.5E Terrain Elevation / Chunk Edge Language is local. The public
Riverside/Eastvale scene now has a shallow voxel-depth layer on top of 0.4E
terrain/parcel composition: `CityWorldScene` visual grammar carries
`terrainElevation`, `parcelElevation`, and `chunkEdge`; public Riverside gets
raised parcel shelves, civic plinth shelves, commercial slab fields, park basin
shelves, water-edge cuts, raised home shelves, commercial slab lips, apartment
court lips, civic plinth stacks, waterfront bank cuts, world edges,
parcel-cluster edges, waterfront bank edges, and park-basin edges. Shell
counties stay visually honest with `shell_flat`, and hidden Anaheim/Ontario
drafts use hidden-draft shelves and boundaries without public promotion. Verify
with `node scripts/verify-terrain-elevation-chunk-grammar.mjs`, the 0.4E
terrain/parcel verifier, the 0.3E object-authorship verifier, the 0.2E
roads/roofs verifier, core/type/build, strict `engine-beta-data`, and Engine
Beta coverage screenshots. Pass only if desktop, `390x844` mobile, and
residential-detail screenshots show clearer chunk/parcel depth without noisy
stripes, props, labels-as-crutches, or mobile regression. If this still reads
too subtle, the next visual-engine move must be larger than another small
surface-stroke pass. Default next gate: Pre-Alpha 0.6E Terrain Chunk Massing /
World-Edge Composition, unless Axiom chooses a no-label object/anchor
recognition pass. Acceptance must be first-3-second screenshot improvement,
not only typed grammar/verifier green.

Pre-Alpha 0.4E Terrain / Parcel World Composition is local. The public
Riverside/Eastvale scene now has an integrated compiler and renderer pass for
terrain and parcel composition on top of 0.2E roads/roofs and 0.3E object
authorship. `CityWorldScene` visual grammar carries `terrainComposition` and
`parcelComposition`; public Riverside gets neighborhood yard fabric, civic
focus fields, commercial apron fields, park basins, waterfront strata, home
yard grids, civic plinths, apartment courts, and commercial aprons. Shell
counties keep shell-boundary terrain only, and hidden Anaheim/Ontario drafts
keep hidden-draft field/anchor-pad composition without public exposure. Verify
with `node scripts/verify-terrain-parcel-composition.mjs`, the 0.3E object
authorship verifier, the 0.2E roads/roofs verifier, the 0.1E provider-boundary
verifier set, core/type/build, strict `engine-beta-data`, and Engine Beta
coverage screenshots. Pass only if desktop, `390x844` mobile, and
residential-detail screenshots show a calmer, more authored map base without
cars, humans, decorative props, panels, labels-as-crutches, or mobile
regression. If this still reads too empty, the next visual-engine move should
be a broader 0.5E composition/object-kit system or a true no-label anchor
recognition pass, not another tiny road micro-polish pass.

Pre-Alpha 0.3E Object Authorship is local. The public Riverside/Eastvale scene
now has an integrated compiler and renderer object-authorship pass on top of
0.2E roads/roofs. `CityWorldScene` visual grammar carries `objectFamily`,
`clusterRole`, and `noLabelPriority`; the compiler assigns public Riverside
families for civic, residential, commerce, service, and lowrise buildings while
hidden Anaheim/Ontario draft anchors get internal venue/transit/lowrise
no-label priority without public exposure. The renderer consumes those profiles
for stronger Eastvale Core civic hierarchy, sprite-backed rowhome/strip-store
base grounding, residential window/entry rhythm, and more readable
gym/apartment/service forms. Verify it with
`node scripts/verify-object-authorship-scene-grammar.mjs`, the 0.2E
roads/roofs verifier, the 0.1E provider-boundary verifier set, core/type/build,
strict `engine-beta-data`, and Engine Beta coverage screenshots. Screenshot
root:
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-03e-object-authorship-coverage`.
Pass only if desktop, `390x844` mobile, and residential-detail screenshots show
better object-family read without clutter or mobile regression. If this still
feels generic, the next visual-engine move should be `0.4E No-Label Anchor
Recognition` for candidate-district anchors or a broader object-kit/material
system, not more tiny Riverside sanding.

Pre-Alpha 0.2E Roads & Roofs / Scene Compiler is local. The public
Riverside/Eastvale scene now has both compiler-level visual grammar and a
renderer material pass. `CityWorldScene` objects carry typed terrain, road, lot,
building material, roof, and contact profiles; the renderer adds restrained
asphalt wear, curb lift, road-joint blockwork, lot edge grounding, and SoCal
roof course/parapet/eave material. Use
`node scripts/verify-roads-roofs-scene-grammar.mjs` with the 0.1E provider
boundary verifiers as the update gate. Screenshots live under
`C:\Users\mzwin\AppData\Local\Temp\atlas-prealpha-02e-roads-roofs-local`.
Ship this only if Mira/Axiom agree the added material reads authored rather
than noisy on desktop, `390x844` mobile, and residential-detail views. The next
visual-engine slice should not be more Riverside sanding unless it fixes the
remaining broad green-board/object-authorship blocker or generalizes to the
second-district promotion bar.

Pre-Alpha 0.1E Provider Boundary Update is the architecture floor for 0.2E.
Use `docs/architecture/ENGINEERING_OVERVIEW.md`,
`docs/architecture/PROVIDER_BOUNDARIES.md`,
`docs/architecture/GOOGLE_USAGE_POLICY.md`,
`docs/updates/ATLAS_RELEASE_LADDER.md`, and
`artifacts/current-update.json` as the update contract. The concrete checks are
`node scripts/verify-no-google-in-renderer.mjs`, `node
scripts/verify-provider-boundaries.mjs`, and `node
scripts/verify-tool-result-shape.mjs`. This update keeps Google/provider lookup
behind `@atlas/geo` and prevents provider results from becoming voxel geometry
or readiness proof.

Mira E15.6 Golden Prompt Product Proof is local. Use
`node scripts/verify-chatgpt-entry-surface.mjs --district anaheim-candidate --json-out <temp-or-artifact>\anaheim-product-proof.json`
to generate the machine-readable product proof. It covers direct Riverside
play, Orange shell browsing, unknown county recovery, lookup without
saves/readiness claims, and a negative Anaheim-playability prompt. The proof
sets `proofStatus: "passed"` but keeps `promotionReady: false`,
`publicPlayable: false`, and `miraAcceptance: false` until human/product review
and the visual/release gates exist. Feed the JSON into
`scripts/verify-second-district-readiness.mjs --product-proof <path>` when
checking second-district readiness; the expected current result is still
`readyForPlayablePromotion: false`.

Forge E15.4 Readiness Artifact Writer is local. Use
`node scripts/export-second-district-readiness-artifact.mjs --district anaheim-candidate --out <artifact-root> --json-only`
or the Ontario equivalent to write review-ready JSON files:
`readiness-aggregate.json`, `promotion-packet.json`,
`source-to-scene-trace.json`, and `release-status.json`. The export is
read-only, records Railway identity from Axiom's handoff, and does not mutate
Railway, git, server routes, UI, persistence, or paid scope.

Latest Axiom export:
`artifacts/second-district-readiness/latest/anaheim-candidate`. Current result:
data and bounded compiler proof are present, split guard passes, and
`readyForPlayablePromotion` remains `false` because visual packet, product
proof, Lumen acceptance, Mira acceptance, and Forge acceptance are still
missing.

Use `docs/AXIOM_ENGINE_REFERENCE_STACK.md` as Axiom's GM reference packet. The
third-party ChatGPT app skill is useful as a checklist for app/tool/widget
quality, but it is not installed as an Atlas dependency. Lumen should use the
voxel/isometric references in that packet to push hidden draft grammar toward
crisp face separation, no-label anchor recognition, stronger road/lot grounding,
and restrained SoCal material choices.

Use `docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md` for the E15 expanded artifact cycle.
The next work is larger than gate notes: Forge owns readiness aggregation,
Lumen owns hidden draft voxel grammar, Mira owns ChatGPT entry language proof,
and Axiom owns integration verification through
`scripts/verify-big4-artifact-packets.mjs`.

Axiom wakeups now run against `C:\Users\mzwin\Documents\Atlas-alpha-path-b-rc`
and must read the real Forge/Lumen/Mira threads before making a captain call.
Use `docs/AXIOM_BIG4_WAKEUP_PROTOCOL.md` and
`scripts/verify-big4-wakeup-protocol.mjs` to keep the light/full-power
automations from drifting back to stale summaries or local role clones.
If the Codex app does not expose thread read/send tools, Axiom must record that
as a blocker, refresh only local integration artifacts, and leave worker
assignments unsent rather than fabricating worker reports.

Mira E15.3 remains the entry-surface language foundation. The public entry rail
says: Play Riverside, Browse CA shells, Lookup temp. Keep this as the product
language source of truth: Riverside/Eastvale is playable now, shell counties
are browse-only, lookup is not saved and not coverage proof, and public tools
must not leak compiler, GEOID, packet, verifier, persistence, XP, evidence,
automation, or paid claims.

Lumen E15.2 Hidden Draft Voxel Grammar System + Two-Anchor Native Pass is
local, and E15.5 No-Label Crop Packet is local. Anaheim hidden draft grammar now has stronger native convention hall,
ARTIC transit hub, and stadium-area massing plus renderer-level grammar
families for large venue halls, transit hubs, stadium bowls, mixed-use edges,
commercial edges, airport/logistics edges, civic cores, and residential
variety. `scripts/verify-second-district-draft-scene.mjs` reports
`grammarFamilies` and still marks visual readiness as screenshot-review-only:
no public promotion can proceed until no-label desktop, `390x844` mobile, and
detail screenshots prove two anchors read before labels. Use
`docs/SECOND_DISTRICT_VOXEL_GRAMMAR_PACKET.md` as Lumen's current packet: it
records the grammar decisions, E15.2 screenshot evidence paths, E15.5 no-label
packet paths, and the blunt `VISUAL_READINESS_FALSE` verdict. The canonical
E15.5 packet is
`C:\Users\mzwin\AppData\Local\Temp\atlas-e155-anaheim-no-label-packet`; it
validates mechanically, but the crop read fails. Convention Center is only a
partial no-label read, and ARTIC / Angel Stadium still reads as a generic
venue cluster on mobile/detail. Keep Anaheim hidden and `promotionReady: false`.

Forge E15.1 Candidate Readiness Aggregator is local. Use
`node scripts/verify-second-district-readiness.mjs --district anaheim-candidate --json-only`
or the Ontario equivalent for the one-command backend/readiness readout. The
command reports data, visual, product, and release blockers plus a
source-to-scene trace; missing visual packet, product proof, or split acceptance
keeps `readyForPlayablePromotion: false`.

Next Big 4 artifact cycle:
Lumen E15.2 is the current visual-engine artifact. Use it to produce hidden
draft screenshots and visual packets, not to public-promote Anaheim or Ontario.
Forge E14.1/E15.1 promotion and readiness packets remain the public-promotion
handoff. Mira E15.6 supplies product proof without granting promotion
readiness. Axiom integrates only clean, verified artifacts.

Current Axiom/Forge data artifact:
E13.4 Ontario Source-Noted Anchor Pack is local. Ontario now has a
candidate-only contract and a source-noted, non-renderable anchor pack covering
city identity, inland residential variety, Ontario Mills, Ontario International
Airport, civic center core, and downtown service core. It remains
non-playable, non-renderable, scene-ineligible, and L1 shell only. The next
Forge data artifact should be an Ontario draft-only curated pack only if it
maps back to these source anchors without public-place claims; no hidden scene,
UI, or public claim should be added by metadata flip.

Current Lumen promotion artifact:
Use `docs/SECOND_DISTRICT_VISUAL_ACCEPTANCE_BAR.md` before any Anaheim or
Ontario public promotion review. The first-pair anchors must read before labels
on desktop, `390x844` mobile, and detail camera: Anaheim Convention Center plus
ARTIC for Anaheim; airport/logistics edge plus commerce/civic core for Ontario.
If a candidate still depends on labels after one bounded visual pass, keep it
hidden draft or stop the visual tunnel.
Use `atlasNoLabels=1` with `scripts/verify-anaheim-draft-scene.mjs
--no-label-crops` when producing Anaheim proof packets. This suppresses map
labels before crops are captured; do not crop labeled screenshots and call them
no-label evidence.
Use `scripts/verify-second-district-visual-packet.mjs` to enforce screenshot
packet completeness and structured Lumen/Mira review fields before any
promotion packet can be treated as ready. This verifier does not judge pixels;
it prevents missing desktop/mobile/detail/no-label evidence and missing
visual-verdict fields from being approved by vibes.
Use `docs/SECOND_DISTRICT_VISUAL_PACKET_TEMPLATE.md` and the verifier's
`--print-template` mode to create conservative `visual-review.json` files that
default to hidden-draft-only until no-label anchor recognition is proven.
Use `scripts/prepare-second-district-visual-packet.mjs` to normalize screenshots
from draft, Riverside baseline, shell-state, and no-label crop roots into the
required packet filenames before running the verifier.
Use `scripts/verify-second-district-draft-scene.mjs` before screenshot packet
assembly. It verifies Anaheim/Ontario hidden draft scenes remain `L1` and
non-playable while exposing the object/road grammar markers reviewers should
judge in screenshots.

Current Forge/Axiom second-district lane:
Use `docs/SECOND_DISTRICT_PROMOTION_GATE.md` as the promotion cutline before
any Anaheim or Ontario public switcher exposure. E13.1 adds
`scripts/verify-california-district-pipeline.mjs`, a generalized verifier that
reports Anaheim and Ontario candidate state, satisfied/missing gates,
Riverside-only playable coverage, and failures for fake playable claims. This
is the productive expansion path: source notes, curated anchors,
provider-readiness boundaries, compiler proof, screenshots, Mira/Lumen
acceptance, and Forge split guard before public playability. Do not add UI
expansion, public Anaheim switcher state, playable claims, DB/persistence,
Hosted Clawd, package/lock/env drift, provider promotion, reports, exports,
automation, or paid scope.

Mira public product-surface lane:
E13.10 turns the compact public product-path rail under the county switcher
into real actions: Play restores Riverside, Browse opens an Orange shell proof
state, and Lookup asks ChatGPT for lookup-only Eastvale places without saving
or implying county coverage. Keep the surface map-native and direct: users
should understand that Riverside is playable now, California shells are
browse-only, and lookup places are not saved or playable-county evidence. Do
not turn this into a dashboard, county directory, fake switcher expansion,
public Anaheim state, or paid/persistence feature.

Current Axiom/Lumen residential material artifact:
E12.21 Riverside Residential Material Palette Pass is local. The public
Riverside residential kit now uses a quieter SoCal-inspired palette and adds
subtle stucco/trim/sill/eave material bands to primitive cottages, ranch homes,
and rowhomes. Keep only if desktop, mobile, and residential-detail screenshots
show less default-color plastic read without adding noise or hurting the
product loop. If the pass reads busy on mobile, narrow renderer details rather
than reintroducing props, cars, humans, or labels.

Current Axiom/Lumen landmark artifact:
E12.20 Eastvale Core Landmark Identity is local. The public Riverside
`building-civic` now receives a targeted structural identity pass: stronger
glass entry, civic entry frame, roof lantern, wing bay rhythm, and subtle front
geometry. Keep only if screenshots show Eastvale Core reads more authored
without cluttering the selected marker/tray or mobile view.

Current Axiom/Lumen public visual artifact:
E12.19 Riverside Public Visual Trust - Civic/Parcel Grounding is local. The
production renderer now adds stronger Eastvale Core lot composition and subtler
residential parcel seams so the public Riverside map reads less like floating
buildings on a flat board. This is the right visual direction only if desktop,
mobile, and residential-detail screenshots improve or hold the product read.
If screenshots show clutter or mobile tray interference, revert or narrow the
renderer patch instead of adding props or panels.

Current Axiom/Forge/Mira public-tool artifacts:
E12.17 Public Lookup Readiness Copy and E12.18 County Tool Copy De-jargon are
local. `lookup_world_places` now says lookup-only, normalized Atlas categories,
not saved, and not county-playability evidence. `select_county` and
`render_voxel_county` now avoid internal release/compiler language and explain
Riverside/Eastvale as the playable county world, shell counties as coverage
status only, and the recovery path back to Riverside/Eastvale. Keep the
seven-tool list stable and keep provider promotion, scene eligibility, and
public-quality claims hard false unless a later data readiness gate explicitly
promotes a county.

Current Axiom/Lumen visual cutline:
E12.16 Lumen Convention Center Native Recognizability Cutline is local and
verified. The duplicate ARTIC follow-up was stopped and reverted after Axiom's
correction; the accepted E12.15 ARTIC native state remains intact. Lumen then
made one bounded Convention Center native-geometry attempt: stronger long
hall/campus slab, wider curtain-wall frontage, hall side-face and contact,
roof-field breaks, skylight strips, mullion rhythm, and forecourt grounding.
The result is better, but still does not clear the public-quality no-label bar:
the label and shell card remain too important, especially on mobile. Do not
promote Anaheim and do not start another hidden Anaheim art pass. Shift the next
Lumen-owned work back to visible Riverside/public product-loop trust unless the
human explicitly reopens a tighter venue-authoring lane with a new bar. No
props, public UI, provider claims, persistence, paid scope, or automation.

Mira research cutline:
Use `docs/ANAHEIM_VENUE_OBJECT_GRAMMAR_RESEARCH.md` before E12.15
implementation. The first target pair should be Anaheim Convention Center plus
ARTIC because they have the strongest real architectural silhouettes:
Convention Center as a long glass convention hall/campus and ARTIC as a
parabolic transit hall with diagrid/ETFE language. Angel Stadium and Platinum
Triangle remain secondary until those two read before labels.

Mira product-surface artifact:
E12.16 Anaheim Hidden Draft Mobile Comprehension Tightening is implemented
locally. The hidden Anaheim shell/draft tray is denser on mobile, and
`scripts/verify-anaheim-draft-scene.mjs` now proves the recovery CTA, boundary
copy, and source note remain visible in the first `390x844` viewport. This
improves the hidden draft state without adding public Anaheim playability, fake
tools, backend changes, or renderer changes. The next Mira-owned artifact
should shift back to visible public product quality unless a new shell/draft
mobile regression appears.

Parallel Forge backend/product lane:
E12.15 Product Backend Boundary DTO Guard separates public coverage, hidden
draft evidence, and future Hosted Clawd DTOs in core. Public playable tools may
appear only when `coverageTier === L2_CURATED_DISTRICT` and
`playableDistrictCount > 0`; shell counties, unsupported counties, and Anaheim
draft evidence must expose empty playable-tool lists. Mira can tighten shell
and draft UI comprehension against this contract without opening persistence.

Mira/backend taste cutline:
Use `docs/ATLAS_PRODUCT_BACKEND_UML_SPEC.md` and
`docs/ATLAS_BACKEND_PRODUCT_TASTE_RESEARCH.md` to keep backend truth, widget
state, hidden draft evidence, and future persistence separate. The next backend
or UI work should improve typed boundaries or map-native shell comprehension,
not add databases or paid state.

Backend/service operating map:
Use `docs/ATLAS_BACKEND_SERVICE_MAP.md` as the current service map for Railway,
server routes, MCP tools, world contracts, provider boundaries, and backend
verification. E12.16 adds `scripts/verify-world-lookup-boundary.mjs`, which
proves REST `/api/world/lookup` and MCP `lookup_world_places` keep normalized
categories, source notes, runtime cache metadata, repeat-call cache behavior,
no raw provider place fields, and no county-readiness promotion. It now also
adds typed `providerReadiness` metadata to lookup responses: lookup-only status,
sources, mode, cache key/TTL, normalized category status/confidence, and hard
false promotion flags for coverage, scene eligibility, and public quality. The
next Forge-owned backend artifact should be E12.17 Provider Promotion Gate
Inputs: define the source, confidence, failure, and QA evidence fields that
would be required before any future county can move from read-only provider
lookup toward `L3_PROVIDER_NORMALIZED`. No DB, Hosted Clawd, persistence,
Stripe, XP/evidence, OAuth, automation, reports, exports, package/lock/env
drift, or public Anaheim promotion.

1. Treat Engine Beta 2A as the deployed visual/function baseline. Public
   verification passed on Railway, and E10.1 now adds the first California
   coverage contract without reopening paid, persistence, or visual-lab scope.
   E10.1-E10.6 are now deployed to Railway production as deployment
   `40fa1630-a819-4929-b20f-70d27ebbb6a3`.
2. Use `docs/USA_PUBLIC_RELEASE_ENGINE_PLAN.md` as the public-release scale
   contract: Eastvale is the proof cell, California is the next coverage layer,
   and USA release requires county readiness tiers rather than a giant canvas or
   fake full coverage.
3. E10.3 now gives shell counties their own widget surface. Indexed L1 counties
   such as `orange-ca` render a coverage shell and explicit readiness boundary
   instead of silently falling back to the Riverside playable tray.
4. E10.4 now verifies both shell and unsupported county widget states:
   `orange-ca` renders as `L1_COUNTY_SHELL`, while `made-up-ca` renders as
   `L0_UNSUPPORTED`, and neither path exposes place, sticker, or note tools.
5. E10.5 now adds one recovery action from shell/unsupported coverage states
   back to `Open Riverside/Eastvale playable Alpha`.
6. E10.6 now adds `scripts/verify-engine-beta-coverage.mjs` as the focused
   release gate for California coverage: 58 counties, Riverside L2, Orange L1,
   unknown L0, preview/MCP/submission, Riverside product loop, shell widget,
   unsupported widget, and recovery action.
7. Public deploy verification is green. `scripts/verify-engine-beta-coverage.mjs`
   passed against `https://atlas-backend-production-e6fc.up.railway.app` with
   public screenshots for Riverside playable, Orange shell, and unsupported
   states.
8. E10.6.1 fixed Mira's mobile recovery blocker. The shell verifier now asserts
   the recovery action is visible in the first `390x844` viewport, and public
   Orange/unsupported mobile screenshots show `Open Riverside/Eastvale playable
   Alpha` without hunting.
9. E10.7 adds a compact county switcher and coverage directory. Public users
   can move between Riverside playable, Orange shell, and unsupported state
   inside the map surface. Public matrix verifies the switcher on desktop and
   `390x844` mobile.
10. E10.8 polishes the first-run county choice surface without expanding scope:
   the fallback county now reads as `Unknown / L0`, and the switcher carries a
   tiny coverage truth line: `CA coverage: 1 playable, 57 indexed shells`.
   The county-switcher verifier now protects that first-read copy.
11. Engine Beta 2B tightens road/lot/terrain contact grammar in the production
   renderer. Roads now have clearer contact/side-face layers, lots have subtle
   lower lips and grounding shadows, and grass tiles are quieter so buildings
   and roads carry the first read. This is renderer-only: no props, cars,
   humans, labels, water expansion, or new product panels.
12. Engine Beta 2C strengthens Eastvale Core as the first selected landmark.
   The civic building now has clearer roof tiers, entry block, columns, side
   windows, and steps in the production renderer. This is a bounded landmark
   readability pass, not a new place, prop, UI, or product state.
13. E10.9 makes the Census source verifier repeatable. The county source gate
   now reports cached vs downloaded source files, supports offline verification,
   and fails clearly when the cache is missing. Raw Census files stay temp-only
   unless explicitly approved as checked fixtures; no fake counties or provider-
   readiness claims.
14. E11.1 road module geometry is deployed. The renderer now draws
   road slabs, edge bevels, crosswalk pavers, and inferred isometric junction
   plates from the existing road segments. Railway deployment
   `59a5eecc-8b8a-45f1-a920-c62626f8de26` passed the public Engine Beta
   coverage matrix.
15. E11.2 residential variety is deployed as Railway deployment
   `3a8de436-9da0-45bf-80a2-f3bf7e916500`. The production renderer now gives
   existing cottage, ranch, and rowhome families clearer front-gable, low-ranch,
   porch/stoop, window, eave, and unit-rhythm details without adding props or
   product scope. Public Engine Beta coverage matrix passed after deploy.
16. E11.3 camera and visual density is deployed as Railway deployment
   `461b8adf-59e3-4e95-bae2-00d536464259`. The city-world scene now has
   `desktop`, `mobile`, and `residential_detail` camera presets; the production
   desktop camera is tighter, and the Engine Beta verifier captures
   residential-detail QA screenshots without adding a user-facing camera mode.
   Public `node scripts\verify-engine-beta-coverage.mjs` passed against
   `https://atlas-backend-production-e6fc.up.railway.app`.
17. E11.4 terrain and parcel density is deployed as Railway deployment
   `ff24270d-5e9f-4689-83db-140b991ab581`. Grass grid noise is quieter, lots
   have stronger contact, and home/commercial/apartment pads read more
   grounded. Public `node scripts\verify-engine-beta-coverage.mjs` passed
   against `https://atlas-backend-production-e6fc.up.railway.app`.
18. E11.5 landmark/parcel read and product-surface tightening are deployed as
   Railway deployment `e083338f-b916-4d22-872b-897fe3426c59`. The public app now
   has shorter Shell/L0 coverage-tray copy, stronger Eastvale Core grounding,
   clearer Neighborhood Blocks lot boundaries, and less flat green around the
   playable core. Public `node scripts\verify-engine-beta-coverage.mjs` passed
   against `https://atlas-backend-production-e6fc.up.railway.app`.
19. Forge parallel E11.6 data-readiness prep is active: Anaheim in Orange
   County and Ontario in San Bernardino County are candidate-only district
   contracts. They are Census-anchored and non-playable. They must stay at
   `L1_COUNTY_SHELL` with zero places until a curated district pack, source
   notes, compiler proof, desktop/mobile product-loop screenshots, Lumen visual
   acceptance, Mira readiness proof, and Forge split guard all pass.
20. E11.7 residential object art upgrade is deployed as Railway deployment
   `61c04438-1cdd-455e-b444-7137b08d56b5`. Primitive
   cottage, ranch, and lowrise apartment drawing now has stronger
   foundation/contact, roof massing, porch/stoop, window, entry, and face-depth
   grammar; the existing rowhome SVG source has subtler roof/base material
   facets. Public `node scripts\verify-engine-beta-coverage.mjs` passed after
   deploy.
21. E11.8 commerce/landmark object polish is deployed as Railway deployment
   `19dd4f59-ca7a-4321-b681-945713f88680`. It improves the existing Plaza Row
   strip-store asset, Gym, Apartments, and Eastvale Core object details. Public
   `node scripts\verify-engine-beta-coverage.mjs` passed against
   `https://atlas-backend-production-e6fc.up.railway.app` with Riverside
   desktop/mobile, residential-detail, Orange shell, unsupported, and
   county-switcher screenshots. No new places, props, cars, humans, product
   panels, paid scope, persistence, XP/evidence, OAuth, reports, exports, or
   automation were added.
22. E11.9 selected-landmark marker/Clawd stacking cleanup is deployed as Railway
   deployment `5cf3aca4-ac5c-46e3-8836-fe1abb0f3ce9`. Clawd now reads in front
   of Eastvale Core, marker/pin affordances remain visible, and public
   `node scripts\verify-engine-beta-coverage.mjs` passed against production.
   No new UI, props, product state, backend scope, or broad renderer rewrite was
   added.
23. E12.1 California District Candidate Pack is deployed as Railway deployment
   `2ee2403a-630f-4328-9716-943ecdaec588`. Anaheim in Orange County is the
   priority-1 second-playable-district candidate; Ontario in San Bernardino
   County is the priority-2 follow-up. Both remain `playableNow: false`, stay
   at `L1_COUNTY_SHELL`, and require curated district packs, source notes,
   compiler proof, desktop/mobile screenshots, Lumen visual acceptance, Mira
   readiness acceptance, and Forge split guard before any L2 promotion. Public
   `node scripts\verify-engine-beta-coverage.mjs` passed against
   `https://atlas-backend-production-e6fc.up.railway.app`.
24. E12.2 Anaheim Curated District Candidate Pack Contract is deployed as
   Railway deployment `76094157-a95b-4486-b104-9b622ab1f098`. The Anaheim
   fixture lives at `data/district_candidate_packs/anaheim-candidate.json` and
   validates through `parseDistrictCandidatePack`. It is a readiness contract
   only: all anchors are `renderableNow: false`, Anaheim remains
   `playableNow: false`, and Riverside remains the only public playable county.
   Public `node scripts\verify-engine-beta-coverage.mjs` passed against
   `https://atlas-backend-production-e6fc.up.railway.app`.
25. E12.3 Anaheim Source-Noted Place Anchor Pack should be next if E12.2
   deploys. Add the first real source-noted place anchors for Anaheim, still
   non-renderable and non-playable, then prove they are sufficient for a bounded
   compiler spike.
26. E12.3 Anaheim Source-Noted Place Anchor Pack is deployed as Railway
   deployment `f6cb4114-cd6e-4f14-97d8-01bf749ad858`. The Anaheim anchor fixture
   lives at `data/district_place_anchor_packs/anaheim-anchors.json` and
   validates through `parseDistrictPlaceAnchorPack`. It names Anaheim city
   identity, Platinum Triangle, Anaheim Convention Center, ARTIC, Angel Stadium,
   and Downtown Anaheim Community Center as source-noted anchors, but all remain
   `providerNormalized: false`, `renderableNow: false`, and `sceneEligible:
   false`. Public `node scripts\verify-engine-beta-coverage.mjs` passed against
   `https://atlas-backend-production-e6fc.up.railway.app`.
27. E12.4 Anaheim Bounded Scene Compiler Spike should be next if E12.3 deploys.
   Build a compiler proof that can consume non-renderable anchors into a bounded
   draft scene behind a non-public gate, then screenshot it before any public
   county switcher or playable claim.
28. E12.4 Anaheim Bounded Scene Compiler Spike is deployed as Railway
   deployment `17f4fe23-8330-4685-92e8-e022fe157ca4`. The hidden compiler
   function `compileDistrictPlaceAnchorDraftCityWorldScene` consumes the
   Anaheim anchor pack and returns a bounded `CityWorldScene` draft with
   `coverageTier: L1_COUNTY_SHELL`, `playable: false`, no actors, no pins, and
   no selected-place state. Public `node scripts\verify-engine-beta-coverage.mjs`
   passed against `https://atlas-backend-production-e6fc.up.railway.app`.
29. E12.5 Anaheim Draft Screenshot Harness should be next: capture the
   non-public draft scene through deterministic desktop/mobile/residential-detail
   proof without exposing it as a public playable county.
30. E12.5 Anaheim Draft Screenshot Harness is deployed as Railway deployment
   `744f4821-eedd-4649-9df2-526b737a4ba8`. It adds
   `scripts/verify-anaheim-draft-scene.mjs`, proves the hidden Anaheim draft as
   `L1_COUNTY_SHELL` with zero playable districts and zero public places, and
   captures desktop, mobile, and residential-detail screenshots without public
   Anaheim UI.
31. E12.6 Anaheim Draft Composition Pass should be next: keep the draft
   non-public, but make the hidden scene distinguish mixed-use, convention,
   transit, stadium, and downtown anchors better before any public playable
   claim.
32. E12.6 Anaheim Draft Composition Pass is deployed as Railway deployment
   `400dde38-5f75-4c2e-ac2c-31408854669c`. It keeps Anaheim non-public and
   improves the hidden draft with a mixed-use cluster and more varied primitive
   building families, while public Engine Beta coverage and the Anaheim draft
   harness both pass against production.
33. E12.7 Anaheim Anchor-Specific Object Grammar should be next if the team
   keeps pushing the second-district lane: still non-public, improve convention
   center, ARTIC, stadium, and downtown shapes so the draft stops leaning on
   repeated storefront/civic primitives. Do not expose Anaheim as playable.
34. E12.7 Anaheim Anchor-Specific Object Grammar is deployed as Railway
   deployment `08e51f37-1db1-4f66-89ad-a5be2ec7e758`. It keeps Anaheim
   non-public and replaces repeated civic/storefront draft blocks with
   anchor-specific compiler profiles for the convention center, ARTIC, Angel
   Stadium, Downtown Community Center, and Platinum Triangle. Public Engine Beta
   coverage and the hidden Anaheim draft harness both pass against production.
35. E12.8 Draft Venue/Transit Primitive Detail Support is deployed as Railway
   deployment `5d057007-96d6-4e71-a85f-81b7bcfeb28c`. It adds draft-ID-gated
   renderer detail for hidden convention, transit, stadium, and downtown
   objects, tightens civic support masses, and makes the Anaheim draft harness
   assert the requested coverage-shell camera preset. Public Engine Beta
   coverage and the hidden Anaheim draft harness both pass against production.
36. E12.9 Anaheim Draft Promotion Readiness Verifier is implemented locally.
   It adds `scripts/verify-anaheim-promotion-readiness.mjs`, which passes only
   when the no-fake-playability boundary holds. Before E12.10, its expected
   output was `promotionReady: false`, Riverside as the only public playable
   county, two satisfied gates, five missing promotion gates, and zero boundary
   failures.
37. E12.10 Anaheim Curated District Pack Contract is deployed as Railway
   deployment `fd563d83-dde2-4431-b917-89a5ce0a61c7`. It adds a typed
   draft-only curated pack for the six Anaheim anchors and updates the
   promotion-readiness verifier so the curated-pack gate is satisfied while
   Anaheim remains `promotionReady: false`.
38. E12.11 Anaheim Visual Triage Pass is deployed as Railway deployment
   `d2c6eb14-6a1b-41ca-abf4-674e39c21caa`. It calms the hidden Anaheim palette,
   improves draft labels and facade/material marks, and removes the worst
   internal evidence-copy wording while keeping Anaheim non-public and
   `promotionReady: false`. Public Engine Beta coverage and the hidden Anaheim
   draft harness both pass against production.
39. E12.12 SoCal Voxel Material System is deployed as Railway deployment
   `92dc0aae-b1ea-41f1-a8ad-4f979bd3f3bf`. It adds draft-only material rules
   for Anaheim terrain, roads, lots, and buildings: warmer pads, darker asphalt
   side faces, tan curbs, roof/facade material marks, and stronger foundation
   contact. Anaheim remains non-public and `promotionReady: false`; public
   Engine Beta coverage and the hidden Anaheim draft harness both pass against
   production.
40. E12.13 Anaheim Venue Silhouette Pass should follow E12.12 if screenshots
   still show primitive-placeholder weakness. Improve the hidden draft
   Convention Center, ARTIC, Stadium, and Platinum Triangle object silhouettes
   through compiler/renderer geometry only. No public Anaheim UI, cars, humans,
   decorative props, fake playable state, provider claims, persistence, paid
   scope, or automation.
41. E8.7 app review/public QA polish only if the deployed app drifts.
42. E9.3 persistence implementation only after Engine Beta is visually credible
   and `HUMAN_APPROVAL_BEFORE_PERSISTENCE` is explicitly reopened.
43. E9.4 Stripe implementation only after persistence exists and
   `HUMAN_APPROVAL_BEFORE_MONEY` is approved.

Parallel execution posture:
Use at most two code-writing Codex worktrees plus one integration/QA thread. For
Engine Beta, the safe split is one production renderer/compiler worktree, one
visual-engine worktree owned by Lumen only when a scoped asset/camera slice is
opened, and one Mira/Forge QA/split lane. Do not stage or deploy from the dirty
mixed workspace.

Integration support:
Use `docs/INTEGRATION_QA_PLAYBOOK.md` as the captain checklist for worker
handoffs, merge gates, local/public verification, browser QA, and rejection
rules.

Big 4 artifact operating model:
Use `docs/BIG4_ARTIFACT_OPERATING_MODEL.md` as the current worker contract.
Mira, Lumen, and Forge should build bounded artifacts in their owned lanes
before sending gate-only reports. Axiom integrates and deploys only after
artifact verification is attached.

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

### Quest E9.1: Hosted Clawd Approval And Storage Choice

Prepared the human approval packet for moving Hosted Clawd from session-only
Alpha planning into persisted Beta implementation.

Issue:
`docs/issues/E9.1-hosted-clawd-approval-and-storage-choice.md`

Spec:
`docs/HOSTED_CLAWD_APPROVAL_PACKET.md`

Acceptance:

- Storage provider options and recommended default are documented. Done locally.
- Auth/account ownership model is specified. Done locally.
- First persisted capability is recommended as business profile plus saved
  campaign preview. Done locally.
- Required ownership, unauthenticated-denial, idempotency, and usage-limit tests
  are listed before implementation. Done locally.
- Stripe remains downstream of persistence unless the money gate is explicitly
  approved. Done locally.
- Evidence and XP remain out of the first persistence implementation. Done
  locally.

### Quest E9.2: Hosted Clawd Onboarding Spec

Defined the map-first Hosted Clawd upgrade/onboarding flow without implementing
auth, persistence, checkout, evidence, XP, or automation.

Issue:
`docs/issues/E9.2-hosted-clawd-onboarding-spec.md`

Spec:
`docs/HOSTED_CLAWD_ONBOARDING_SPEC.md`

Acceptance:

- Upgrade entry points are defined for map tray, Scout Drop preview, Campaign
  Preview, and upgrade tool responses. Done locally.
- Session-only Alpha, invite Beta, and paid Beta states are distinct. Done
  locally.
- First saved artifact is chosen. Done locally.
- Onboarding steps preserve map-first context. Done locally.
- Copy rules avoid hype, payment claims, saved-state claims, and automation
  claims before gates. Done locally.
- Checkout appears after business/persistence context, not as a standalone
  generic pricing screen. Done locally.

### Operating slice: Integration QA Playbook

Added the captain playbook for parallel worker support.

Spec:
`docs/INTEGRATION_QA_PLAYBOOK.md`

Acceptance:

- Worker handoff format is explicit. Done locally.
- Rejection rules cover persistence, Stripe, XP/evidence, automation, provider
  payloads, MCP drift, and map regressions. Done locally.
- Verification matrix covers docs-only, server/tool, UI/preview, and deploy
  slices. Done locally.
- Active E7.5 and E9.3 worker lane boundaries are documented. Done locally.

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

### Quest E10.1: California County Coverage Contract

Make California coverage explicit before broader provider ingestion.

Acceptance:

- Coverage tiers exist for `L0_UNSUPPORTED`, `L1_COUNTY_SHELL`,
  `L2_CURATED_DISTRICT`, `L3_PROVIDER_NORMALIZED`, and `L4_PUBLIC_QUALITY`.
  Done.
- Census-derived California county index includes all 58 counties. Done.
- Riverside County uses GEOID `06065` and is marked `L2_CURATED_DISTRICT`.
  Done.
- Eastvale district identity keeps GEOID `0621230`. Done.
- Los Angeles and Orange are indexed as `L1_COUNTY_SHELL` with zero playable
  districts. Done.
- Unknown counties return explicit `L0_UNSUPPORTED` coverage instead of fake
  Riverside data. Done.
- `select_county` and `render_voxel_county` return a scene only for
  `riverside-ca`; shell counties return `countyCoverageSummary` and no
  `_meta.scene`. Done.
- `lookup_world_places` remains provider-backed lookup and is not treated as
  county readiness. Done.
- Strict `engine-beta-data` split guard passes with no Hosted Clawd, package,
  lockfile, env, visual-lab, Stripe, XP, evidence, OAuth, automation, report, or
  export drift. Done.

### Quest E10.2: Generic County Shell Compiler Contract

Create a safe shell scene contract for indexed counties that are not playable
yet.

Acceptance:

- `compileCountyShellCityWorldScene` returns a bounded `CityWorldScene` with
  coverage metadata and deterministic desktop/mobile cameras. Done.
- Shell scenes contain terrain only and no fake places, buildings, lots, roads,
  pins, actors, or local activity. Done.
- `select_county` and `render_voxel_county` attach shell scenes as
  `_meta.coverageShellScene` for L1 counties. Done.
- Shell county tool responses still omit `_meta.scene`, preserving the boundary
  that only playable county scenes use that payload. Done.
- MCP verification proves `orange-ca` has shell metadata, no fake scene, no fake
  places, and no actors. Done.
- No widget UI change, provider ingestion, persistence, Hosted Clawd, Stripe,
  XP, evidence, OAuth, automation, report, export, or visual-lab work enters
  this slice. Done.

### Quest E9.3: Hosted Clawd Persistence Foundation

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

Implementation starts from:
- `docs/HOSTED_CLAWD_APPROVAL_PACKET.md`
- `docs/HOSTED_CLAWD_ONBOARDING_SPEC.md`
- `docs/DATABASE_SCHEMA_BETA.md`

First implementation target after approval:
- authenticated user context
- persistent Clawd row
- business profile row
- saved campaign preview from an existing Scout Drop
- ownership and idempotency tests first
