import { execFileSync } from "node:child_process";

const CLASSIFICATIONS = [
  "functional-rc-docs",
  "product-code-rc-candidate",
  "visual-parked",
  "hosted-clawd-parked",
  "renderer-parked",
  "shared-doc-review",
  "unknown",
];

const RC_MODES = new Set([
  "functional-alpha",
  "mira-tray-hardening",
  "engine-beta-renderer",
  "engine-beta-data",
  "provider-boundary",
  "hosted-clawd-scaffold",
  "hosted-clawd-fable-integration",
  "hosted-clawd-persistence-foundation",
  "hosted-clawd-save-ux",
  "hosted-clawd-stripe-billing",
  "hosted-clawd-protected-tool-gate",
  "hosted-clawd-saved-read-surface",
  "hosted-clawd-browser-proof",
  "mobile-interaction-hardening",
  "product-feel-cleanup",
  "national-generation-contract",
]);

const SAFE_FUNCTIONAL_RC_DOCS = new Set([
  "docs/ALPHA_COMMAND_CENTER.md",
  "docs/ALPHA_FUNCTIONAL_EVIDENCE_PACKET.md",
  "docs/F2_CLEAN_ALPHA_RC_SPLIT.md",
  "scripts/verify-alpha-product-loop.mjs",
  "scripts/verify-alpha-public-sanity.mjs",
  "scripts/verify-alpha-rc-split.mjs",
]);

const MIRA_TRAY_HARDENING_FILES = new Set(["web/src/CityWorldView.tsx", "web/src/styles.css"]);

const ENGINE_BETA_RENDERER_FILES = new Set([
  "web/src/CityWorldRenderer.tsx",
  "web/src/cityWorldAtlasResolver.ts",
  "docs/BUILD_LOG.md",
  "docs/ANAHEIM_VENUE_OBJECT_GRAMMAR_RESEARCH.md",
  "docs/ANAHEIM_NATIVE_VENUE_OBJECT_GRAMMAR_SPEC.md",
  "docs/ATLAS_BACKEND_PRODUCT_TASTE_RESEARCH.md",
  "docs/ATLAS_BACKEND_SERVICE_MAP.md",
  "docs/ATLAS_BACKEND_SERVICE_BRIEF.md",
  "docs/AXIOM_BIG4_ARTIFACT_DISPATCH.md",
  "docs/AXIOM_ENGINE_REFERENCE_STACK.md",
  "docs/AXIOM_BIG4_WAKEUP_PROTOCOL.md",
  "docs/BIG4_ARTIFACT_OPERATING_MODEL.md",
  "docs/CHATGPT_ENTRY_SURFACE_PROOF.md",
  "docs/GAMEBLOCKS_ATLAS_ADAPTER.md",
  "docs/EXTERNAL_VOXEL_REFERENCE_ADAPTER.md",
  "docs/ATLAS_PRODUCT_BACKEND_UML_SPEC.md",
  "docs/ATLAS_REAL_CONSUMER_APP_ROADMAP.md",
  "docs/CHATGPT_ENTRY_SURFACE_PROOF.md",
  "docs/DECISIONS.md",
  "docs/NEXT_QUESTS.md",
  "docs/SECOND_DISTRICT_VISUAL_ACCEPTANCE_BAR.md",
  "docs/SECOND_DISTRICT_VOXEL_GRAMMAR_PACKET.md",
  "docs/SECOND_DISTRICT_VISUAL_PACKET_TEMPLATE.md",
  "docs/SECOND_DISTRICT_PROMOTION_GATE.md",
  "docs/USA_PUBLIC_RELEASE_ENGINE_PLAN.md",
]);

const ENGINE_BETA_RENDERER_PREFIXES = [
  "packages/core/src/voxel/",
  "packages/core/test/",
  "packages/assets/city-world/",
];

const ENGINE_BETA_DATA_FILES = new Set([
  "AGENTS.md",
  "README.md",
  "LOOP.md",
  "STATE.md",
  "loop-budget.md",
  "loop-run-log.md",
  "loop-constraints.md",
  "server/src/index.ts",
  "server/src/scenePacketMemoryAdapter.ts",
  "docs/SCENE_PACKET_DB_PERSISTENCE_PLAN.md",
  "docs/ATLAS_FULL_PROJECT_LOOP_SPEC.md",
  "docs/SUBMISSION_CHECKLIST.md",
  "scripts/create-second-district-promotion-packet.mjs",
  "scripts/export-second-district-readiness-artifact.mjs",
  "scripts/verify-atlas-loop-readiness.mjs",
  "scripts/debug-city-world-engine.mjs",
  "scripts/verify-california-district-pipeline.mjs",
  "scripts/verify-second-district-readiness.mjs",
  "scripts/verify-second-district-owner-gate-cutline.mjs",
  "scripts/prepare-second-district-visual-packet.mjs",
  "scripts/verify-second-district-draft-scene.mjs",
  "scripts/verify-second-district-visual-packet.mjs",
  "scripts/verify-county-switcher.mjs",
  "scripts/verify-county-index-source.mjs",
  "scripts/verify-anaheim-draft-scene.mjs",
  "scripts/verify-anaheim-object-source-quality.mjs",
  "scripts/verify-anaheim-promotion-readiness.mjs",
  "scripts/verify-engine-beta-coverage.mjs",
  "scripts/verify-generated-district-parity.mjs",
  "scripts/verify-generated-district-widget.mjs",
  "scripts/verify-widget-performance.mjs",
  "scripts/verify-preview-http.mjs",
  "scripts/verify-object-authorship-scene-grammar.mjs",
  "scripts/verify-roads-roofs-scene-grammar.mjs",
  "scripts/verify-material-texture-grammar.mjs",
  "scripts/verify-terrain-chunk-massing-grammar.mjs",
  "scripts/verify-terrain-elevation-chunk-grammar.mjs",
  "scripts/verify-terrain-parcel-composition.mjs",
  "scripts/verify-shell-county-widget.mjs",
  "scripts/verify-mcp-flow.mjs",
  "scripts/verify-submission.mjs",
  "scripts/verify-world-lookup-boundary.mjs",
  "scripts/verify-big4-artifact-packets.mjs",
  "scripts/verify-big4-wakeup-protocol.mjs",
  "scripts/verify-chatgpt-entry-surface.mjs",
  "scripts/verify-chatgpt-entry-surface.mjs",
  "scripts/verify-gameblocks-atlas-adapter.mjs",
  "scripts/verify-external-voxel-reference-adapter.mjs",
  "scripts/verify-no-google-in-renderer.mjs",
  "scripts/verify-provider-boundaries.mjs",
  "scripts/verify-provider-normalization-preflight.mjs",
  "scripts/verify-tool-result-shape.mjs",
  "scripts/verify-scout-campaign-alpha-loop.mjs",
  "scripts/verify-worldbasis-terrain-sampler.mjs",
  "scripts/verify-cityworld-derived-terrain-maps.mjs",
  "scripts/verify-cityworld-mobile-occlusion.mjs",
  "scripts/verify-face-orientation-source-contrast.mjs",
  "scripts/verify-civic-venue-object-kit-contract.mjs",
  "scripts/verify-public-civic-landmark-authorship.mjs",
  "scripts/verify-public-object-kit-prefab-palette.mjs",
  "scripts/verify-object-kit-renderer-consumption.mjs",
  "scripts/verify-commerce-strip-prefab-geometry.mjs",
  "scripts/verify-plaza-row-focused-capture.mjs",
  "scripts/verify-public-object-identity-civic-service.mjs",
  "scripts/select-engine-quality-axis.mjs",
  "scripts/select-second-district-owner-gate-next-axis.mjs",
  "scripts/verify-atlas-source-of-truth-drift.mjs",
  "scripts/verify-render-command-layer-budget.mjs",
  "scripts/verify-scene-window-compiler.mjs",
  "scripts/verify-window-aware-renderer.mjs",
  "scripts/verify-dynamic-window-refresh.mjs",
  "scripts/verify-scene-packet-cache-contract.mjs",
  "scripts/verify-scene-packet-memory-adapter.mjs",
  "scripts/verify-scene-packet-db-persistence-plan.mjs",
  "docs/ATLAS_ENGINE_BACKEND_OPERATING_BRIEF.md",
  "web/src/App.tsx",
  "web/src/bridge.ts",
  "web/src/CountyCoverageView.tsx",
  "web/src/CountySwitcher.tsx",
  "web/src/CityWorldView.tsx",
  "web/src/styles.css",
  "packages/core/src/scout/CampaignPreviewService.ts",
  "packages/core/src/scout/ScoutDropService.ts",
  "packages/core/src/scout/index.ts",
  "packages/core/src/scout/types.ts",
]);

const ENGINE_BETA_DATA_PREFIXES = [
  "artifacts/",
  "data/district_candidate_packs/",
  "data/district_curated_packs/",
  "data/district_place_anchor_packs/",
  "docs/architecture/",
  "docs/updates/",
  "packages/core/src/world/",
  "packages/geo/src/",
];

const PROVIDER_BOUNDARY_FILES = new Set([
  "artifacts/current-update.json",
  "artifacts/update-manifest.schema.json",
  "docs/BUILD_LOG.md",
  "docs/DECISIONS.md",
  "docs/NEXT_QUESTS.md",
  "docs/TOOL_CONTRACTS.md",
  "docs/architecture/ENGINEERING_OVERVIEW.md",
  "docs/architecture/GOOGLE_USAGE_POLICY.md",
  "docs/architecture/PROVIDER_BOUNDARIES.md",
  "docs/architecture/UML.md",
  "docs/updates/ATLAS_RELEASE_LADDER.md",
  "docs/updates/prealpha-0.1e-provider-boundary.md",
  "scripts/verify-alpha-rc-split.mjs",
  "scripts/verify-no-google-in-renderer.mjs",
  "scripts/verify-provider-boundaries.mjs",
  "scripts/verify-provider-normalization-preflight.mjs",
  "scripts/verify-tool-result-shape.mjs",
]);

const PROVIDER_BOUNDARY_PREFIXES = [
  "packages/geo/src/",
  "packages/geo/test/",
];

const HOSTED_CLAWD_SCAFFOLD_FILES = new Set([
  "artifacts/current-update.json",
  "AGENTS.md",
  "docs/ATLAS_FULL_STACK_PRODUCT_SPEC.md",
  "docs/BETA_HOSTED_CLAWD_SPEC.md",
  "docs/HOSTED_CLAWD_PRD.md",
  "docs/HOSTED_CLAWD_STORAGE_AUTH_DECISION_PACKET.md",
  "docs/BUILD_LOG.md",
  "docs/DECISIONS.md",
  "docs/NEXT_QUESTS.md",
  "docs/TOOL_CONTRACTS.md",
  "docs/updates/ATLAS_RELEASE_LADDER.md",
  "scripts/verify-alpha-rc-split.mjs",
  "scripts/verify-atlas-source-of-truth-drift.mjs",
  "scripts/verify-hosted-clawd-db-auth-prep.mjs",
  "scripts/verify-hosted-clawd-scaffold.mjs",
  "server/src/index.ts",
  "web/src/App.tsx",
  "web/src/CityWorldView.tsx",
  "web/src/HostedClawdTray.tsx",
  "web/src/styles.css",
  "web/src/types.ts",
]);

const HOSTED_CLAWD_SCAFFOLD_PREFIXES = [
  "artifacts/hosted-clawd/",
  "server/src/hostedClawd/",
];

const HOSTED_CLAWD_FABLE_INTEGRATION_FILES = new Set([
  "STATE.md",
  "apps/widget/src/PixiVoxelSceneView.tsx",
  "docs/PRODUCT_SPEC_AND_GATES.md",
  "docs/design/fable-prompts/BUILDING_FIDELITY_SUPERPASS.md",
  "docs/design/fable-prompts/DECAL_DISCIPLINE_SUPERPASS.md",
  "docs/design/fable-prompts/FABLE_LAUNCH_0.53E.md",
  "docs/design/fable-prompts/VOXEL_GRAPHICAL_LEAP_RESEARCH_0.58E.md",
  "packages/core/src/voxel/cityWorldParametricGenerator.ts",
  "scripts/verify-fable-prop-cleanup.mjs",
  "web/src/CityWorldRenderer.tsx",
  "web/src/PixiVoxelSceneView.tsx",
]);

const HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES = [
  "artifacts/0.53e-hero/",
  "artifacts/0.54e-grade/",
  "artifacts/0.55e-decal/",
  "artifacts/0.56e-labels/",
  "artifacts/0.57e-parity/",
  "artifacts/ship-prep/",
];

const HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES = new Set([
  ".env.example",
  "package.json",
  "pnpm-lock.yaml",
  "migrations/hosted-clawd/001_persistence_foundation.sql",
  "scripts/verify-hosted-clawd-persistence-foundation.mjs",
  "server/test/hosted-clawd-persistence-foundation.test.ts",
  "server/test/hosted-clawd-postgres-smoke.ts",
]);

const HOSTED_CLAWD_SAVE_UX_FILES = new Set([
  "scripts/verify-hosted-clawd-save-ux.mjs",
  "scripts/verify-hosted-clawd-save-ux-browser.mjs",
]);

const HOSTED_CLAWD_STRIPE_BILLING_FILES = new Set([
  "assets/generated/placeholders/svg/hosted-clawd-clay-bg.svg",
  "migrations/hosted-clawd/002_stripe_test_billing.sql",
  "scripts/verify-hosted-clawd-stripe-billing.mjs",
  "server/test/hosted-clawd-stripe-test-billing.test.ts",
]);

const HOSTED_CLAWD_PROTECTED_TOOL_GATE_FILES = new Set([
  "scripts/verify-hosted-clawd-protected-tool-gate.mjs",
  "server/test/hosted-clawd-protected-tool-gate.test.ts",
]);

const HOSTED_CLAWD_SAVED_READ_SURFACE_FILES = new Set([
  "docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md",
  "scripts/verify-hosted-clawd-saved-read-browser.mjs",
  "scripts/verify-hosted-clawd-saved-read-surface.mjs",
  "server/test/hosted-clawd-saved-read-surface.test.ts",
]);

const HOSTED_CLAWD_BROWSER_PROOF_FILES = new Set([
  "docs/ATLAS_FRONTEND_BACKEND_SCREEN_PLAN.md",
  "packages/core/src/scout/CampaignPreviewService.ts",
  "packages/core/src/scout/ScoutDropService.ts",
  "scripts/verify-hosted-clawd-browser-proof.mjs",
  "web/src/CountyCoverageView.tsx",
  "web/src/CountySwitcher.tsx",
  "web/src/PreviewPanel.tsx",
  "web/src/VoxelSceneView.tsx",
]);

const MOBILE_INTERACTION_HARDENING_FILES = new Set([
  "AGENTS.md",
  "STATE.md",
  "artifacts/current-update.json",
  "docs/BUILD_LOG.md",
  "docs/DECISIONS.md",
  "docs/NEXT_QUESTS.md",
  "docs/PRODUCT_SPEC_AND_GATES.md",
  "docs/design/fable-prompts/PRODUCT_QUALITY_PROFESSOR_AUDIT_0.66H.md",
  "package.json",
  "scripts/build-web.mjs",
  "scripts/verify-alpha-rc-split.mjs",
  "scripts/verify-atlas-source-of-truth-drift.mjs",
  "scripts/verify-mobile-interaction-hardening.mjs",
  "scripts/verify-preview-http.mjs",
  "scripts/verify-web-bundle-budget.mjs",
  "server/src/index.ts",
  "web/src/CityWorldRenderer.tsx",
  "web/src/CityWorldView.tsx",
  "web/src/HostedClawdTray.tsx",
  "web/src/PixiVoxelSceneView.tsx",
  "web/src/styles.css",
]);

const MOBILE_INTERACTION_HARDENING_PREFIXES = [
  "artifacts/product-quality-audit/0.66h/",
];

const PRODUCT_FEEL_CLEANUP_FILES = new Set([
  "artifacts/current-update.json",
  "AGENTS.md",
  "STATE.md",
  "docs/BUILD_LOG.md",
  "docs/DECISIONS.md",
  "docs/NEXT_QUESTS.md",
  "docs/PRODUCT_SPEC_AND_GATES.md",
  "docs/updates/ATLAS_RELEASE_LADDER.md",
  "package.json",
  "scripts/verify-alpha-rc-split.mjs",
  "scripts/verify-atlas-source-of-truth-drift.mjs",
  "scripts/verify-city-world-graphics-cleanup.mjs",
  "web/src/CityWorldRenderer.tsx",
]);

const PRODUCT_FEEL_CLEANUP_PREFIXES = [
  "artifacts/product-quality-audit/0.67h/",
];

const NATIONAL_GENERATION_CONTRACT_FILES = new Set([
  "chatgpt-app-submission.json",
  "artifacts/current-update.json",
  "artifacts/council/CODEX_RESULT_0781V.md",
  "artifacts/council/OWNER_APPROVAL_0781V_2026-07-13.md",
  "AGENTS.md",
  "STATE.md",
  "docs/0.78_WIRE_REAL_GEOGRAPHY.md",
  "docs/BUILD_LOG.md",
  "docs/DECISIONS.md",
  "docs/G8_REAL_CHATGPT_FINDINGS.md",
  "docs/NATIONAL_ENGINE_PRODUCTION_CONTRACT.md",
  "docs/NEXT_QUESTS.md",
  "docs/PRODUCTION_ROADMAP.md",
  "docs/PRODUCT_SPEC_AND_GATES.md",
  "docs/SUBMISSION_CHECKLIST.md",
  "docs/legal/PRIVACY.md",
  "docs/legal/SUPPORT.md",
  "docs/legal/TERMS.md",
  // 0.78-R: zoom-band LOD groundwork (program of record: Linear
  // "Atlas - Real Geography at Scale"; roadchunk codec + band controller
  // tests, D2-0 shared geo-pack helper + route test).
  "packages/core/test/road-chunk-codec.test.ts",
  "packages/core/test/city-world-band-controller.test.ts",
  "packages/core/src/voxel/roadChunkCodec.ts",
  "packages/core/src/voxel/cityWorldBandController.ts",
  "docs/0.78R_WIRE_CONTRACT.md",
  "docs/0.78R_ROAD_ART_CONTRACT.md",
  "docs/0.78R_MOBILE_UX_A11Y.md",
  "docs/0.78R_PRODUCT_METRICS.md",
  "server/src/countyGeoPack.ts",
  "server/test/geo-pack-route.test.ts",
  "server/src/roadChunkStore.ts",
  "server/test/road-chunk-store.test.ts",
  "scripts/build-county-road-chunks.mjs",
  "packages/core/test/city-world-scene-window-band.test.ts",
  "packages/core/src/voxel/cityWorldRenderCommands.ts",
  "packages/core/test/city-world-band-controller-fast.test.ts",
  // 0.75S/0.75R/Devpost residue packets (docs + evidence, committed at /ship
  // 2026-07-18 after deliberate review; no runtime changes).
  "docs/DEVPOST_BUILD_WEEK_SUBMISSION.md",
  "docs/0.75R_HANDOFF.md",
  "artifacts/council/CODEX_FULL_PRODUCT_RECON_2026-07-13.md",
  "artifacts/council/CODEX_RESULT_078R.md",
  "README.md",
  "docs/codex/packet-0.76-4-terrain.md",
  "scripts/capture-ship-pass-evidence.mjs",
  "docs/REDIS_SCENE_PACKET_BACKEND_0.72B.md",
  "docs/SCENE_PACKET_SERVICE_BOUNDARY_0.71H.md",
  "docs/TOOL_CONTRACTS.md",
  "docs/VOXEL_ENGINE_DELIVERY_ARCHITECTURE_0.70H.md",
  "docs/updates/ATLAS_RELEASE_LADDER.md",
  "loop-run-log.md",
  "package.json",
  "packages/assets/city-world/atlas.manifest.json",
  "packages/core/src/county/CountyQuestionService.ts",
  "packages/core/src/index.ts",
  "packages/core/src/voxel/cityWorldCountyGeoScene.ts",
  "packages/core/src/voxel/cityWorldGeneratedDistrict.ts",
  "packages/core/src/voxel/cityWorldGeneratedDistrictArchetypes.ts",
  "packages/core/src/voxel/cityWorldGeneratedDistrictSeed.ts",
  "packages/core/src/voxel/cityWorldGeneratedDistrictTypes.ts",
  "packages/core/src/voxel/cityWorldSceneWindow.ts",
  "packages/core/src/voxel/index.ts",
  "packages/core/src/world/NationalWorldService.ts",
  "packages/core/src/world/index.ts",
  "packages/core/src/world/nationalGenerationProduction.ts",
  "packages/core/src/world/scenePacketCache.ts",
  "packages/core/src/world/usCountyIndex.ts",
  "packages/core/test/city-world-generated-district.test.ts",
  "packages/core/test/city-world-county-geo-scene.test.ts",
  "packages/core/test/county-question.test.ts",
  "packages/core/test/national-generation-production.test.ts",
  "packages/core/test/national-world-service.test.ts",
  "packages/core/test/scene-packet-cache.test.ts",
  "server/src/index.ts",
  "server/src/scenePacketMemoryAdapter.ts",
  "server/src/scenePacketWorker.ts",
  "packages/geo/src/PlaceCategoryNormalizer.ts",
  "packages/geo/test/place-category-normalizer.test.ts",
  "scripts/release-deploy.ps1",
  "scripts/verify-deterministic-generated-district-specs.mjs",
  "scripts/verify-emulator-audit.mjs",
  "scripts/verify-generated-draft-scene-packet.mjs",
  "scripts/generate-us-county-index.mjs",
  "scripts/verify-alpha-rc-split.mjs",
  "scripts/verify-atlas-loop-readiness.mjs",
  "scripts/verify-atlas-source-of-truth-drift.mjs",
  "scripts/verify-chatgpt-entry-surface.mjs",
  "scripts/verify-mcp-flow.mjs",
  "scripts/verify-submission.mjs",
  "scripts/verify-national-generation-production-contract.mjs",
  "scripts/verify-national-shells.mjs",
  "scripts/verify-production-backend-spine.mjs",
  "scripts/verify-provider-boundaries.mjs",
  "scripts/verify-provider-normalization-preflight.mjs",
  "scripts/verify-release-prod.mjs",
  "scripts/verify-save-surface-flag.mjs",
  "scripts/verify-tool-result-shape.mjs",
  "scripts/verify-world-lookup-boundary.mjs",
  "scripts/railway-start.mjs",
  "scripts/run-hosted-clawd-migrations.mjs",
  "scripts/verify-railway-production-stack.mjs",
  "scripts/verify-scene-packet-memory-adapter.mjs",
  "web/src/App.tsx",
  "web/src/MapChrome.tsx",
  "web/src/emulator/main.ts",
  "web/src/emulator/mockHost.ts",
  "artifacts/ops/production-railway-stack.json",
  // 0.78-2A National Town Anchors envelope
  "artifacts/council/CODEX_RESULT_0782A.md",
  "docs/OWNER_FINISH_RUNBOOK_0782A.md",
  "artifacts/emulator/perf-report.json",
  "artifacts/visual-score/REPORT.md",
  "artifacts/visual-score/report.json",
  "data/census/gaz2024.zip",
  "data/census/us-county-town-anchors.json",
  "docs/0.78_REAL_GEOGRAPHY.md",
  "docs/NORTH_STARS.md",
  "packages/core/src/world/countyTownAnchors.ts",
  "packages/core/test/county-town-anchors.test.ts",
  "scripts/build-county-town-anchors.mjs",
  "scripts/verify-county-town-anchors.mjs",
  "server/src/countyTownAnchorIndex.ts",
  "server/test/county-town-anchor-index.test.ts",
  "server/test/lazy-redis-connector.test.ts",
  "server/test/scene-packet-worker-lifecycle.test.ts",
  // 0.78-D National LOD0 geography bake envelope
  "scripts/build-county-geo-packs.mjs",
  "scripts/verify-county-geo-packs.mjs",
  "scripts/certify-release-range.mjs",
  "packages/core/src/voxel/cityWorldTypes.ts",
  "web/src/CityWorldRenderer.tsx",
]);

const NATIONAL_GENERATION_CONTRACT_PREFIXES = [
  // Emulator audit report + screenshot evidence is canonical release proof
  // wherever the matrix runs (0.78-2A moved it to the audit root).
  "artifacts/emulator/audit/",
  // 0.78-D: baked national county geography packs (LOD0 boundary + water).
  "data/geo-packs/",
  // 0.78-R: baked road-chunk packs (roadchunk/1, per-county, chunk-addressed).
  "data/road-chunks/",
  // 0.75R stage-2 claymation reference board images.
  "docs/design/clay-board/",
  // 0.75S showcase captures (Discord set) + ship-pass evidence + Devpost.
  "artifacts/showcase/",
  "artifacts/0.75s-ship-passes/",
  "artifacts/devpost/",
  "artifacts/national-generation/0.68h/",
  "artifacts/national-generation/0.69h/",
  "artifacts/national-generation/0.70h/",
  "artifacts/national-generation/0.71h/",
  "artifacts/national-generation/0.72b/",
];

const EXACT_RULES = [
  ["hosted-clawd-parked", ".env.example", "DB and invite-token env placeholders are not part of public Alpha RC."],
  ["hosted-clawd-parked", "package.json", "Hosted Clawd DB scripts/dependencies must stay out of F2 Alpha RC."],
  ["hosted-clawd-parked", "pnpm-lock.yaml", "Hosted Clawd DB dependency lockfile changes must stay parked."],
  ["hosted-clawd-parked", "server/src/index.ts", "Path-level check cannot exclude Hosted Clawd route hunks from server entrypoint."],
  ["hosted-clawd-parked", "docs/HOSTED_CLAWD_ONBOARDING_SPEC.md", "Hosted Clawd onboarding is parked from public Alpha RC."],
  ["visual-parked", "scripts/build-web.mjs", "PNG loader is tied to the parked bitmap/module-atlas lane."],
  ["visual-parked", "scripts/verify-city-world-module-atlas.mjs", "Module atlas verification belongs to the parked visual lane."],
  ["visual-parked", "web/src/assets.d.ts", "PNG asset declaration is tied to parked bitmap/module-atlas work."],
  ["visual-parked", "web/src/cityWorldAtlasResolver.ts", "Atlas resolver changes are tied to parked visual/module-atlas work."],
  ["visual-parked", "web/src/cityWorldModuleAtlas.ts", "Generated module atlas sources are parked visual work."],
  ["renderer-parked", "packages/core/src/index.ts", "Core public exports are coupled to parked renderer/schema changes."],
  ["shared-doc-review", "docs/BUILD_LOG.md", "Build log contains mixed F2, visual, deploy, and Hosted Clawd history; hunk review required."],
  ["shared-doc-review", "docs/NEXT_QUESTS.md", "Next quests contains mixed F2, visual, and Hosted Clawd state; hunk review required."],
  ["shared-doc-review", "docs/DECISIONS.md", "Decisions doc mixes backend persistence, visual lab, and scope decisions; hunk review required."],
  ["shared-doc-review", "docs/MIRA_ALPHA_READINESS_PACKET.md", "Readiness packet is release evidence and requires review before RC staging."],
];

const PREFIX_RULES = [
  ["hosted-clawd-parked", "server/src/hostedClawd/", "Hosted Clawd server implementation is parked from Functional Alpha RC."],
  ["hosted-clawd-parked", "migrations/", "Database migrations are parked from Functional Alpha RC."],
  ["hosted-clawd-parked", "scripts/smoke-hosted-clawd-", "Hosted Clawd smoke scripts are parked from Functional Alpha RC."],
  ["hosted-clawd-parked", "scripts/verify-hosted-clawd-", "Hosted Clawd verification scripts are parked from Functional Alpha RC."],
  ["visual-parked", "assets/reference/", "Visual references are not functional RC files."],
  ["visual-parked", "experiments/", "Visual lab experiments are parked from Functional Alpha RC."],
  ["visual-parked", "packages/assets/city-world/", "City-world atlas assets and manifests are parked unless a renderer RC is opened."],
  ["visual-parked", "docs/brain/VOXEL_", "Voxel visual grammar docs are parked from Functional Alpha RC staging."],
  ["visual-parked", "docs/brain/THREE_ASSET_", "Visual-engine asset spec is parked from Functional Alpha RC staging."],
  ["renderer-parked", "packages/core/src/voxel/", "Voxel schema/compiler changes are parked unless a renderer RC is opened."],
  ["renderer-parked", "packages/core/test/city-world-", "City-world tests are coupled to parked renderer/schema changes."],
  ["renderer-parked", "web/src/CityWorld", "CityWorld renderer/view changes are parked unless a renderer RC is opened."],
  ["renderer-parked", "web/src/styles.css", "Preview style changes are parked unless a renderer RC is opened."],
  ["shared-doc-review", "docs/COMMUNICATIONS/", "Communications docs require release hunk review."],
  ["shared-doc-review", "docs/COMMUNICATIONS_HUB.md", "Communications hub requires release hunk review."],
  ["shared-doc-review", "docs/agent-prompts/", "Worker prompt docs require release hunk review."],
  ["shared-doc-review", "docs/brain/", "Brain docs require release hunk review unless explicitly classified visual parked."],
];

const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);

if (args.has("--help") || args.has("-h")) {
  console.log(`Usage: node scripts/verify-alpha-rc-split.mjs [--working-tree | --git-range <base..head>] [--json-only] [--strict-selected-rc] [--rc-mode <mode>]

Default mode inspects staged files with:
  git diff --cached --name-only

--working-tree inspects dirty working-tree paths with:
  git status --short --untracked-files=all

--git-range inspects committed paths with:
  git diff --name-only <base..head> --

--json-only suppresses human-readable blocker output and prints only the JSON
summary. The exit code still fails when blockers are present.

--strict-selected-rc requires every inspected path to be in the exact allowlist
for the selected RC mode. Use this before staging/deploy claims.

--rc-mode selects the release-candidate path policy. Supported modes:
  functional-alpha       Default conservative docs-only Functional Alpha policy.
  mira-tray-hardening    Allows only Mira tray-hardening product-code paths in
                         addition to functional RC support docs.
  engine-beta-renderer   Allows only the Engine Beta renderer/compiler/atlas
                         file envelope plus focused release docs.
  engine-beta-data       Allows the already-accepted Engine Beta renderer
                         envelope plus focused world coverage/data contract,
                         server tool guard, and verifier files.
  provider-boundary      Allows only Pre-Alpha 0.1E provider boundary docs,
                         geo package policy files, and focused verifiers.
  hosted-clawd-scaffold  Allows only the human-reopened Hosted Clawd scaffold
                         envelope. Persistence, money, and public claims must
                         still be OFF by default.
  hosted-clawd-fable-integration
                         Allows the Hosted Clawd scaffold plus the explicit
                         Fable 0.53E-0.58E visual chain.
  hosted-clawd-persistence-foundation
                         Allows the integrated Hosted Clawd branch plus the
                         narrow 0.60H DB/Auth persistence foundation envelope.
  hosted-clawd-save-ux
                         Allows 0.61H map-first Hosted Clawd save UX over the
                         integrated persistence foundation. Billing stays out.
  hosted-clawd-stripe-billing
                         Allows 0.62H Stripe test billing, webhook replay
                         state, and the compact clay billing rail only.
  hosted-clawd-protected-tool-gate
                         Allows 0.63H repository-backed protected paid-write
                         gating without adding public MCP tools.
  hosted-clawd-saved-read-surface
                         Allows 0.64H owner-scoped saved read surface and tray
                         shelf without adding public MCP tools.
  hosted-clawd-browser-proof
                         Allows 0.65H desktop/mobile browser proof for account
                         linking and no widget bearer token exposure.
  mobile-interaction-hardening
                         Allows 0.66H retained scene graph, bottom-sheet save
                         chrome, and split widget payload hardening.
  product-feel-cleanup
                         Allows 0.67H map graphics cleanup: label demotion,
                         quiet markers, off-facade pins, and visual proof.
  national-generation-contract
                         Allows 0.69H nationwide county identity and honest
                         shell files and proof artifacts.

The check is conservative. Parked runtime/backend/visual paths, shared docs
that require hunk review, and unknown paths block a Functional Alpha RC.`);
  process.exit(0);
}

const rcMode = getOptionValue(rawArgs, "--rc-mode") ?? "functional-alpha";
const gitRange = getOptionValue(rawArgs, "--git-range");

if (!RC_MODES.has(rcMode)) {
  throw new Error(`Unknown --rc-mode: ${rcMode}`);
}

for (let index = 0; index < rawArgs.length; index += 1) {
  const arg = rawArgs[index];
  if (arg === "--rc-mode" || arg === "--git-range") {
    index += 1;
    continue;
  }
  if (!["--working-tree", "--json-only", "--strict-selected-rc"].includes(arg)) {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

if (args.has("--working-tree") && gitRange) {
  throw new Error("--working-tree and --git-range are mutually exclusive.");
}

const mode = gitRange ? "git-range" : args.has("--working-tree") ? "working-tree" : "staged";
const jsonOnly = args.has("--json-only");
const strictSelectedRc = args.has("--strict-selected-rc");
const sourceCommand =
  mode === "working-tree"
    ? "git status --short --untracked-files=all"
    : mode === "git-range"
      ? `git diff --name-only ${gitRange} --`
      : "git diff --cached --name-only";
const selectedRcAllowedPaths = getSelectedRcAllowedPaths(rcMode);
const paths = mode === "working-tree" ? getWorkingTreePaths() : mode === "git-range" ? getGitRangePaths(gitRange) : getStagedPaths();
const results = paths.map((path) => ({ path, ...classifyPath(path) }));
const filesByClassification = Object.fromEntries(CLASSIFICATIONS.map((classification) => [classification, []]));

for (const result of results) {
  filesByClassification[result.classification].push(result.path);
}

const blockers = results
  .filter((result) => (strictSelectedRc ? !isSelectedRcAllowedPath(result.path) : !isAllowedClassification(result.classification)))
  .map((result) => ({
    path: result.path,
    classification: result.classification,
    reason: strictSelectedRc && !isSelectedRcAllowedPath(result.path) ? "Path is not in the strict selected-RC allowlist." : result.reason,
  }));

const summary = {
  ok: blockers.length === 0,
  mode,
  rcMode,
  strictSelectedRc,
  sourceCommand,
  fileCount: paths.length,
  blockerCount: blockers.length,
  counts: Object.fromEntries(CLASSIFICATIONS.map((classification) => [classification, filesByClassification[classification].length])),
  safeToStageForFunctionalRc: filesByClassification["functional-rc-docs"],
  safeToStageForSelectedRc: results.filter((result) => isSelectedRcAllowedPath(result.path)).map((result) => result.path),
  strictSelectedRcAllowlist: getSelectedRcAllowlistSummary(rcMode),
  strictUnexpectedPaths: blockers.map((blocker) => blocker.path),
  filesByClassification,
  blockers,
};

console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  if (!jsonOnly) {
    console.error("");
    console.error(
      strictSelectedRc
        ? `Alpha RC strict selected-candidate check blocked ${blockers.length} file(s):`
        : `Alpha RC split check blocked ${blockers.length} file(s):`,
    );
    for (const blocker of blockers) {
      console.error(`- ${blocker.path} [${blocker.classification}]: ${blocker.reason}`);
    }
  }
  process.exitCode = 1;
} else if (!jsonOnly) {
  console.log("");
  console.log(`Alpha RC split check passed in ${mode} mode.`);
}

function getStagedPaths() {
  return runGit(["diff", "--cached", "--name-only"])
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
}

function getGitRangePaths(range) {
  return runGit(["diff", "--name-only", range, "--"])
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(normalizePath);
}

function getWorkingTreePaths() {
  return runGit(["status", "--short", "--untracked-files=all"])
    .split(/\r?\n/)
    .map(parseStatusPath)
    .filter(Boolean)
    .map(normalizePath);
}

function parseStatusPath(line) {
  if (!line.trim()) {
    return "";
  }
  const rawPath = line.slice(3).trim();
  if (rawPath.includes(" -> ")) {
    return rawPath.split(" -> ").at(-1).trim();
  }
  return rawPath;
}

function classifyPath(path) {
  if (SAFE_FUNCTIONAL_RC_DOCS.has(path)) {
    return { classification: "functional-rc-docs", reason: "Allowed F2 release-hygiene artifact." };
  }

  if (rcMode === "mira-tray-hardening" && MIRA_TRAY_HARDENING_FILES.has(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named Mira tray-hardening product-code RC mode.",
    };
  }

  if (rcMode === "engine-beta-renderer" && isEngineBetaRendererPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named Engine Beta renderer RC mode.",
    };
  }

  if (rcMode === "engine-beta-data" && isEngineBetaDataPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named Engine Beta data/coverage contract RC mode.",
    };
  }

  if (rcMode === "provider-boundary" && isProviderBoundaryPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named Pre-Alpha 0.1E provider-boundary RC mode.",
    };
  }

  if (rcMode === "hosted-clawd-scaffold" && isHostedClawdScaffoldPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named Hosted Clawd scaffold RC mode.",
    };
  }

  if (rcMode === "hosted-clawd-fable-integration" && isHostedClawdFableIntegrationPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named Hosted Clawd plus Fable integration RC mode.",
    };
  }

  if (rcMode === "hosted-clawd-persistence-foundation" && isHostedClawdPersistenceFoundationPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named 0.60H Hosted Clawd persistence foundation RC mode.",
    };
  }

  if (rcMode === "hosted-clawd-save-ux" && isHostedClawdSaveUxPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named 0.61H Hosted Clawd save UX RC mode.",
    };
  }

  if (rcMode === "hosted-clawd-stripe-billing" && isHostedClawdStripeBillingPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named 0.62H Hosted Clawd Stripe test billing RC mode.",
    };
  }

  if (rcMode === "hosted-clawd-protected-tool-gate" && isHostedClawdProtectedToolGatePath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named 0.63H Hosted Clawd protected tool gate RC mode.",
    };
  }

  if (rcMode === "hosted-clawd-saved-read-surface" && isHostedClawdSavedReadSurfacePath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named 0.64H Hosted Clawd saved read surface RC mode.",
    };
  }

  if (rcMode === "hosted-clawd-browser-proof" && isHostedClawdBrowserProofPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named 0.65H Hosted Clawd browser proof RC mode.",
    };
  }

  if (rcMode === "mobile-interaction-hardening" && isMobileInteractionHardeningPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named 0.66H mobile interaction hardening RC mode.",
    };
  }

  if (rcMode === "product-feel-cleanup" && isProductFeelCleanupPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named 0.67H product feel cleanup RC mode.",
    };
  }

  if (rcMode === "national-generation-contract" && isNationalGenerationContractPath(path)) {
    return {
      classification: "product-code-rc-candidate",
      reason: "Allowed only in the named 0.70H national generation contract RC mode.",
    };
  }

  for (const [classification, exactPath, reason] of EXACT_RULES) {
    if (path === exactPath) {
      return { classification, reason };
    }
  }

  for (const [classification, prefix, reason] of PREFIX_RULES) {
    if (path.startsWith(prefix)) {
      return { classification, reason };
    }
  }

  return {
    classification: "unknown",
    reason: "Path is not classified for the Functional Alpha RC split; review before staging.",
  };
}

function normalizePath(path) {
  return path.replaceAll("\\", "/").replace(/^"|"$/g, "");
}

function isAllowedClassification(classification) {
  return classification === "functional-rc-docs" || classification === "product-code-rc-candidate";
}

function getSelectedRcAllowedPaths(modeName) {
  const paths = new Set(SAFE_FUNCTIONAL_RC_DOCS);
  if (modeName === "mira-tray-hardening") {
    for (const path of MIRA_TRAY_HARDENING_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "engine-beta-renderer") {
    for (const path of ENGINE_BETA_RENDERER_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "engine-beta-data") {
    for (const path of ENGINE_BETA_RENDERER_FILES) {
      paths.add(path);
    }
    for (const path of ENGINE_BETA_DATA_FILES) {
      paths.add(path);
    }
    paths.add("packages/core/src/index.ts");
    paths.add("packages/core/test/national-world-service.test.ts");
  }
  if (modeName === "provider-boundary") {
    for (const path of PROVIDER_BOUNDARY_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "hosted-clawd-scaffold") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "hosted-clawd-fable-integration") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "hosted-clawd-persistence-foundation") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "hosted-clawd-save-ux") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVE_UX_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "hosted-clawd-stripe-billing") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVE_UX_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_STRIPE_BILLING_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "hosted-clawd-protected-tool-gate") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVE_UX_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_STRIPE_BILLING_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PROTECTED_TOOL_GATE_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "hosted-clawd-saved-read-surface") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVE_UX_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_STRIPE_BILLING_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PROTECTED_TOOL_GATE_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVED_READ_SURFACE_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "hosted-clawd-browser-proof") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVE_UX_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_STRIPE_BILLING_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PROTECTED_TOOL_GATE_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVED_READ_SURFACE_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_BROWSER_PROOF_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "mobile-interaction-hardening") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVE_UX_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_STRIPE_BILLING_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PROTECTED_TOOL_GATE_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVED_READ_SURFACE_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_BROWSER_PROOF_FILES) {
      paths.add(path);
    }
    for (const path of MOBILE_INTERACTION_HARDENING_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "product-feel-cleanup") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVE_UX_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_STRIPE_BILLING_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PROTECTED_TOOL_GATE_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVED_READ_SURFACE_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_BROWSER_PROOF_FILES) {
      paths.add(path);
    }
    for (const path of MOBILE_INTERACTION_HARDENING_FILES) {
      paths.add(path);
    }
    for (const path of PRODUCT_FEEL_CLEANUP_FILES) {
      paths.add(path);
    }
  }
  if (modeName === "national-generation-contract") {
    for (const path of HOSTED_CLAWD_SCAFFOLD_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_FABLE_INTEGRATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVE_UX_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_STRIPE_BILLING_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_PROTECTED_TOOL_GATE_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_SAVED_READ_SURFACE_FILES) {
      paths.add(path);
    }
    for (const path of HOSTED_CLAWD_BROWSER_PROOF_FILES) {
      paths.add(path);
    }
    for (const path of MOBILE_INTERACTION_HARDENING_FILES) {
      paths.add(path);
    }
    for (const path of PRODUCT_FEEL_CLEANUP_FILES) {
      paths.add(path);
    }
    for (const path of NATIONAL_GENERATION_CONTRACT_FILES) {
      paths.add(path);
    }
  }
  return paths;
}

function isSelectedRcAllowedPath(path) {
  if (selectedRcAllowedPaths.has(path)) {
    return true;
  }
  if (rcMode === "engine-beta-renderer") {
    return ENGINE_BETA_RENDERER_PREFIXES.some((prefix) => path.startsWith(prefix));
  }
  if (rcMode === "engine-beta-data") {
    return isEngineBetaDataPath(path);
  }
  if (rcMode === "provider-boundary") {
    return isProviderBoundaryPath(path);
  }
  if (rcMode === "hosted-clawd-scaffold") {
    return isHostedClawdScaffoldPath(path);
  }
  if (rcMode === "hosted-clawd-fable-integration") {
    return isHostedClawdFableIntegrationPath(path);
  }
  if (rcMode === "hosted-clawd-persistence-foundation") {
    return isHostedClawdPersistenceFoundationPath(path);
  }
  if (rcMode === "hosted-clawd-save-ux") {
    return isHostedClawdSaveUxPath(path);
  }
  if (rcMode === "hosted-clawd-stripe-billing") {
    return isHostedClawdStripeBillingPath(path);
  }
  if (rcMode === "hosted-clawd-protected-tool-gate") {
    return isHostedClawdProtectedToolGatePath(path);
  }
  if (rcMode === "hosted-clawd-saved-read-surface") {
    return isHostedClawdSavedReadSurfacePath(path);
  }
  if (rcMode === "hosted-clawd-browser-proof") {
    return isHostedClawdBrowserProofPath(path);
  }
  if (rcMode === "mobile-interaction-hardening") {
    return isMobileInteractionHardeningPath(path);
  }
  if (rcMode === "product-feel-cleanup") {
    return isProductFeelCleanupPath(path);
  }
  if (rcMode === "national-generation-contract") {
    return isNationalGenerationContractPath(path);
  }
  return false;
}

function isEngineBetaRendererPath(path) {
  return ENGINE_BETA_RENDERER_FILES.has(path) || ENGINE_BETA_RENDERER_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isEngineBetaDataPath(path) {
  return (
    isEngineBetaRendererPath(path) ||
    ENGINE_BETA_DATA_FILES.has(path) ||
    isProviderBoundaryPath(path) ||
    path === "packages/core/src/index.ts" ||
    path === "packages/core/test/national-world-service.test.ts" ||
    ENGINE_BETA_DATA_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function isProviderBoundaryPath(path) {
  return PROVIDER_BOUNDARY_FILES.has(path) || PROVIDER_BOUNDARY_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isHostedClawdScaffoldPath(path) {
  return HOSTED_CLAWD_SCAFFOLD_FILES.has(path) || HOSTED_CLAWD_SCAFFOLD_PREFIXES.some((prefix) => path.startsWith(prefix));
}

function isHostedClawdFableIntegrationPath(path) {
  return (
    isHostedClawdScaffoldPath(path) ||
    HOSTED_CLAWD_FABLE_INTEGRATION_FILES.has(path) ||
    HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function isHostedClawdPersistenceFoundationPath(path) {
  return (
    isHostedClawdFableIntegrationPath(path) ||
    HOSTED_CLAWD_PERSISTENCE_FOUNDATION_FILES.has(path)
  );
}

function isHostedClawdSaveUxPath(path) {
  return isHostedClawdPersistenceFoundationPath(path) || HOSTED_CLAWD_SAVE_UX_FILES.has(path);
}

function isHostedClawdStripeBillingPath(path) {
  return isHostedClawdSaveUxPath(path) || HOSTED_CLAWD_STRIPE_BILLING_FILES.has(path);
}

function isHostedClawdProtectedToolGatePath(path) {
  return isHostedClawdStripeBillingPath(path) || HOSTED_CLAWD_PROTECTED_TOOL_GATE_FILES.has(path);
}

function isHostedClawdSavedReadSurfacePath(path) {
  return isHostedClawdProtectedToolGatePath(path) || HOSTED_CLAWD_SAVED_READ_SURFACE_FILES.has(path);
}

function isHostedClawdBrowserProofPath(path) {
  return isHostedClawdSavedReadSurfacePath(path) || HOSTED_CLAWD_BROWSER_PROOF_FILES.has(path);
}

function isMobileInteractionHardeningPath(path) {
  return (
    isHostedClawdBrowserProofPath(path) ||
    MOBILE_INTERACTION_HARDENING_FILES.has(path) ||
    MOBILE_INTERACTION_HARDENING_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function isProductFeelCleanupPath(path) {
  return (
    isMobileInteractionHardeningPath(path) ||
    PRODUCT_FEEL_CLEANUP_FILES.has(path) ||
    PRODUCT_FEEL_CLEANUP_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function isNationalGenerationContractPath(path) {
  return (
    isProductFeelCleanupPath(path) ||
    NATIONAL_GENERATION_CONTRACT_FILES.has(path) ||
    NATIONAL_GENERATION_CONTRACT_PREFIXES.some((prefix) => path.startsWith(prefix))
  );
}

function getSelectedRcAllowlistSummary(modeName) {
  const exact = [...selectedRcAllowedPaths];
  if (modeName === "engine-beta-renderer") {
    return [...exact, ...ENGINE_BETA_RENDERER_PREFIXES.map((prefix) => `${prefix}*`)];
  }
  if (modeName === "engine-beta-data") {
    return [
      ...exact,
      ...ENGINE_BETA_RENDERER_PREFIXES.map((prefix) => `${prefix}*`),
      ...ENGINE_BETA_DATA_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "provider-boundary") {
    return [...exact, ...PROVIDER_BOUNDARY_PREFIXES.map((prefix) => `${prefix}*`)];
  }
  if (modeName === "hosted-clawd-scaffold") {
    return [...exact, ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`)];
  }
  if (modeName === "hosted-clawd-fable-integration") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "hosted-clawd-persistence-foundation") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "hosted-clawd-save-ux") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "hosted-clawd-stripe-billing") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "hosted-clawd-protected-tool-gate") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "hosted-clawd-saved-read-surface") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "hosted-clawd-browser-proof") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "mobile-interaction-hardening") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
      ...MOBILE_INTERACTION_HARDENING_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "product-feel-cleanup") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
      ...MOBILE_INTERACTION_HARDENING_PREFIXES.map((prefix) => `${prefix}*`),
      ...PRODUCT_FEEL_CLEANUP_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  if (modeName === "national-generation-contract") {
    return [
      ...exact,
      ...HOSTED_CLAWD_SCAFFOLD_PREFIXES.map((prefix) => `${prefix}*`),
      ...HOSTED_CLAWD_FABLE_INTEGRATION_PREFIXES.map((prefix) => `${prefix}*`),
      ...MOBILE_INTERACTION_HARDENING_PREFIXES.map((prefix) => `${prefix}*`),
      ...PRODUCT_FEEL_CLEANUP_PREFIXES.map((prefix) => `${prefix}*`),
      ...NATIONAL_GENERATION_CONTRACT_PREFIXES.map((prefix) => `${prefix}*`),
    ];
  }
  return exact;
}

function getOptionValue(values, name) {
  const index = values.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  const value = values[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} requires a value.`);
  }
  return value;
}

function runGit(args) {
  return execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    // Data-heavy ranges (national geo packs, per-county road chunks) push
    // name-only diffs past the 1MB execFileSync default.
    maxBuffer: 128 * 1024 * 1024,
  });
}
