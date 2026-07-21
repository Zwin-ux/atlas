#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const OWNER_GATE_UPDATE = "postalpha-0.45e-owner-gate-cutline-next-axis-selection";
const HOSTED_CLAWD_UPDATE = "postalpha-0.58h-hosted-clawd-scaffold";
const INTEGRATION_UPDATE = "postalpha-0.58i-integration-canonicalization-release-decision";
const SETUP_UI_UPDATE = "postalpha-0.58j-hosted-clawd-setup-ui-port";
const STORAGE_AUTH_UPDATE = "postalpha-0.59h-hosted-clawd-storage-auth-decision";
const PERSISTENCE_FOUNDATION_UPDATE = "postalpha-0.60h-hosted-clawd-persistence-foundation";
const SAVE_UX_UPDATE = "postalpha-0.61h-hosted-clawd-invite-beta-save-ux";
const STRIPE_BILLING_UPDATE = "postalpha-0.62h-hosted-clawd-stripe-test-billing";
const PROTECTED_TOOL_GATE_UPDATE = "postalpha-0.63h-hosted-clawd-protected-tool-gate";
const SAVED_READ_SURFACE_UPDATE = "postalpha-0.64h-hosted-clawd-saved-read-surface";
const BROWSER_PROOF_UPDATE = "postalpha-0.65h-hosted-clawd-browser-proof";
const MOBILE_HARDENING_UPDATE = "postalpha-0.66h-mobile-interaction-hardening";
const PRODUCT_FEEL_UPDATE = "postalpha-0.67h-product-feel-cleanup";
const NATIONAL_GENERATION_UPDATE = "postalpha-0.70h-deterministic-generated-district-specs";
const SCENE_PACKET_UPDATE = "postalpha-0.71h-scene-packet-service-boundary";
const BACKEND_SPINE_UPDATE = "postalpha-0.72b-redis-scene-packet-cache-job-spine";
const CENSUS_BOARD_UPDATE = "postalpha-0.78-1v-census-county-board-certification";
const PLUGIN_SUBMISSION_UPDATE = "postalpha-0.78-1v-chatgpt-plugin-submission-rc";
const ATLAS_COMMONS_UPDATE = "postalpha-0.81d-atlas-commons-map-radar";
const OWNER_GATE_INPUT_UPDATE = "postalpha-0.44e-hidden-second-district-visual-product-proof-packet";
const HOSTED_CLAWD_INPUT_UPDATE = "human-reopened-hosted-clawd-2026-07-05";
const INTEGRATION_INPUT_UPDATE = "postalpha-0.58h-hosted-clawd-scaffold+postalpha-0.58e-fable-prop-cleanup";
const SETUP_UI_INPUT_UPDATE = "postalpha-0.58i-integration-canonicalization-release-decision";
const STORAGE_AUTH_INPUT_UPDATE = "postalpha-0.58j-hosted-clawd-setup-ui-port+human-reopened-db-auth-2026-07-05";
const PERSISTENCE_FOUNDATION_INPUT_UPDATE = "postalpha-0.59h-hosted-clawd-storage-auth-decision+claude-fable-5";
const SAVE_UX_INPUT_UPDATE = PERSISTENCE_FOUNDATION_UPDATE;
const STRIPE_BILLING_INPUT_UPDATE = SAVE_UX_UPDATE;
const PROTECTED_TOOL_GATE_INPUT_UPDATE = STRIPE_BILLING_UPDATE;
const SAVED_READ_SURFACE_INPUT_UPDATE = PROTECTED_TOOL_GATE_UPDATE;
const BROWSER_PROOF_INPUT_UPDATE = SAVED_READ_SURFACE_UPDATE;
const MOBILE_HARDENING_INPUT_UPDATE = BROWSER_PROOF_UPDATE;
const PRODUCT_FEEL_INPUT_UPDATE = MOBILE_HARDENING_UPDATE;
const NATIONAL_GENERATION_INPUT_UPDATE = "postalpha-0.69h-us-county-index-nationwide-shells";
const SCENE_PACKET_INPUT_UPDATE = NATIONAL_GENERATION_UPDATE;
const BACKEND_SPINE_INPUT_UPDATE = SCENE_PACKET_UPDATE;
const EXPECTED_SELECTOR_NEXT_QUEST = "0.44E Hidden Second-District Visual/Product Proof Packet";
const OWNER_GATE_NEXT_QUEST = "0.46E Owner Gate Review Packet";
const OWNER_GATE_SELECTED_AXIS = "owner_gate_review";
const HOSTED_CLAWD_NEXT_QUEST = "0.59H Hosted Clawd Storage/Auth Decision Packet";
const HOSTED_CLAWD_SELECTED_AXIS = "hosted_clawd_scaffold";
const INTEGRATION_NEXT_QUEST = "0.58J Human Visual Gate / Deploy Readiness Decision";
const INTEGRATION_SELECTED_AXIS = "integration_canonicalization";
const SETUP_UI_NEXT_QUEST = "0.58K Human Visual Gate / Deploy Readiness Decision";
const SETUP_UI_SELECTED_AXIS = "hosted_clawd_setup_ui";
const STORAGE_AUTH_NEXT_QUEST = "0.60H Persistence Foundation";
const STORAGE_AUTH_SELECTED_AXIS = "hosted_clawd_storage_auth";
const PERSISTENCE_FOUNDATION_NEXT_QUEST = "0.61H Invite Beta Save UX";
const PERSISTENCE_FOUNDATION_SELECTED_AXIS = "hosted_clawd_persistence_foundation";
const SAVE_UX_NEXT_QUEST = "0.62H Stripe Test Billing";
const SAVE_UX_SELECTED_AXIS = "hosted_clawd_invite_beta_save_ux";
const STRIPE_BILLING_NEXT_QUEST = "0.63H Protected Hosted Clawd Tool Gate";
const STRIPE_BILLING_SELECTED_AXIS = "hosted_clawd_stripe_test_billing";
const PROTECTED_TOOL_GATE_NEXT_QUEST = "0.64H Saved Hosted Clawd Read Surface";
const PROTECTED_TOOL_GATE_SELECTED_AXIS = "hosted_clawd_protected_tool_gate";
const SAVED_READ_SURFACE_NEXT_QUEST = "0.65H Hosted Clawd Browser Proof";
const SAVED_READ_SURFACE_SELECTED_AXIS = "hosted_clawd_saved_read_surface";
const BROWSER_PROOF_NEXT_QUEST = "0.66H Mobile Interaction Hardening";
const BROWSER_PROOF_SELECTED_AXIS = "hosted_clawd_browser_proof";
const MOBILE_HARDENING_NEXT_QUEST = "0.67H Product Feel Cleanup";
const MOBILE_HARDENING_SELECTED_AXIS = "mobile_interaction_hardening";
const PRODUCT_FEEL_NEXT_QUEST = "0.68H National Generation Production Contract";
const PRODUCT_FEEL_SELECTED_AXIS = "product_feel_cleanup";
const NATIONAL_GENERATION_NEXT_QUEST = "0.71H Scene Packet Service Boundary / Railway Cache Plan";
const NATIONAL_GENERATION_SELECTED_AXIS = "national_generation_generated_district_specs";
const SCENE_PACKET_NEXT_QUEST = "0.72H Fable Generated Draft Visual Quality Gate";
const SCENE_PACKET_SELECTED_AXIS = "scene_packet_service_boundary";
const BACKEND_SPINE_NEXT_QUEST = "0.72H Fable Generated Draft Visual Quality Gate";
const BACKEND_SPINE_SELECTED_AXIS = "backend_production_spine";
const CENSUS_BOARD_INPUT_UPDATE = "postalpha-0.78-1-real-county-board";
const CENSUS_BOARD_NEXT_QUEST = "0.78-2 Real Town Anchors after real-host G8";
const CENSUS_BOARD_DEPLOYED_SHA = "70167356abfe746d0b2257b4211bc9c8d2ff1de3";
const CENSUS_BOARD_RAILWAY_DEPLOYMENT = "232c69ee-63de-47d0-bb7c-257d9ca0c422";
const CENSUS_BOARD_NEXT_QUEST_TITLE = "0.78-2 Real Town Anchors";
const CENSUS_BOARD_SELECTED_AXIS = "real_geography_promotion_readiness";
const CENSUS_BOARD_APPROVAL_EVIDENCE = "artifacts/council/OWNER_APPROVAL_0781V_2026-07-13.md";
const PLUGIN_SUBMISSION_SELECTED_AXIS = "chatgpt_plugin_submission_readiness";
const PLUGIN_SUBMISSION_IMPLEMENTATION_SHA = "8bf5a4e139393d7ff208b058e32c6122dd70bb83";
const PLUGIN_SUBMISSION_RELEASE_SHA = "6320e577c648d367ffb46fe97c65d4bf84843fa1";
// 0.78-2A National Town Anchors release (deployed 2026-07-17): base = the
// prior plugin-submission head; head = the deployed release commit; the
// implementation head is the town-anchor envelope commit.
const TOWN_ANCHOR_RELEASE_BASE_SHA = "6320e577c648d367ffb46fe97c65d4bf84843fa1";
// Release candidate head: the certified envelope awaiting the next deploy
// (full flag-dark release range, including the active 0.78-R continuation).
const TOWN_ANCHOR_RELEASE_HEAD_SHA = "0101861c36dc275615a7da521e9efb6b4132d24d";
// Deployed head: what production actually runs until the next owner deploy.
const TOWN_ANCHOR_DEPLOYED_SHA = "b4eea1caef009a4886abbb659d74ada27d256315";
const TOWN_ANCHOR_IMPLEMENTATION_SHA = "331c8cf5f5290e135271b1984334f2f9e03701c1";
const TOWN_ANCHOR_RAILWAY_DEPLOYMENT = "2c7bb3a4-d5b2-4869-8bf1-6e1763a395f5";
const TOWN_ANCHOR_RELEASE_PATH_COUNT = 28549;
const PLUGIN_SUBMISSION_RAILWAY_DEPLOYMENT = "b4683672-40fb-40c0-aa5e-1b78e3ac8d23";
const EXPECTED_TOOLS = [
  "select_county",
  "ask_county_question",
  "render_voxel_county",
  "lookup_world_places",
  "preview_scout_drop",
  "preview_campaign_engine",
  "get_upgrade_options",
];

const args = new Set(process.argv.slice(2));
const jsonOnly = args.has("--json-only");
const blockers = [];
const warnings = [];
const checkedFiles = [];

const currentUpdate = readJson("artifacts/current-update.json", "current update manifest");
const priorSelectorArtifactPath = "artifacts/engine-quality-axis/postalpha-0.43e-next-target-selection.json";
const selector = readJson(priorSelectorArtifactPath, "0.43E engine-quality selector artifact");
const readinessAggregate = readJson(
  "artifacts/second-district-readiness/latest/anaheim-candidate/readiness-aggregate.json",
  "0.44E readiness aggregate",
);
const ownerCutline = readJson(
  "artifacts/second-district-readiness/latest/anaheim-candidate/owner-gate-cutline.json",
  "0.44E owner cutline",
);
const visualReview = readJson(
  "artifacts/second-district-visual-packets/postalpha-0.44e-anaheim-hidden-proof/visual-review.json",
  "0.44E visual review",
);
const ownerGateSelector = readJson(
  "artifacts/second-district-readiness/latest/anaheim-candidate/postalpha-0.45e-owner-gate-next-axis.json",
  "0.45E owner-gate selector artifact",
);
const agents = readText("AGENTS.md", "AGENTS instructions");
const state = readText("STATE.md", "loop state");
const readme = readText("README.md", "README");
const nextQuests = readText("docs/NEXT_QUESTS.md", "next quests");
const buildLog = readText("docs/BUILD_LOG.md", "build log");
const decisions = readText("docs/DECISIONS.md", "decisions");
const productSpec = readText("docs/PRODUCT_SPEC_AND_GATES.md", "product spec and gates");
const releaseLadder = readText("docs/updates/ATLAS_RELEASE_LADDER.md", "release ladder");
const toolContracts = readText("docs/TOOL_CONTRACTS.md", "tool contracts");
const northFace = readText("docs/NORTH_FACE.md", "North Face ship authority");
const commonsSpec = readText("docs/ATLAS_ALL_PUBLIC_NOTES_SPEC.md", "Atlas Commons spec");
const commonsRunbook = readText("docs/ATLAS_ALL_PUBLIC_NOTES_RUNBOOK.md", "Atlas Commons runbook");
const serverIndex = readText("server/src/index.ts", "server entrypoint");
const packageJson = readJson("package.json", "package manifest");
const envExample = existsSync(resolve(".env.example")) ? readText(".env.example", "env example") : "";

checkCurrentUpdate(currentUpdate);
if (currentUpdate?.id === ATLAS_COMMONS_UPDATE) {
  checkAtlasCommonsAuthority({ currentUpdate, northFace, nextQuests, buildLog, decisions, commonsSpec, commonsRunbook, serverIndex, packageJson, envExample });
} else {
  checkPriorSelectorArtifact(selector);
  checkHiddenProofArtifacts(readinessAggregate, ownerCutline, visualReview);
  checkOwnerGateSelector(ownerGateSelector);
  checkNextQuestAlignment(currentUpdate, nextQuests, releaseLadder);
  checkIntegrationReleaseDocs(currentUpdate, { state, nextQuests, buildLog, decisions, productSpec });
  checkAgentsDoctrine(agents);
  checkReadmeDrift(readme);
  checkToolSurface(toolContracts, serverIndex);
  checkPublicCandidateClaims({
    "artifacts/current-update.json": JSON.stringify(currentUpdate ?? {}, null, 2),
    "docs/NEXT_QUESTS.md": nextQuests,
    "AGENTS.md": agents,
    "README.md": readme,
    "server/src/index.ts": serverIndex,
  });
  checkDbDrift(packageJson, serverIndex, envExample);
}
checkRepairScope();

const result = {
  ok: blockers.length === 0,
  update:
    currentUpdate?.id === ATLAS_COMMONS_UPDATE
      ? "postalpha-0.81d-atlas-commons-source-of-truth-drift-check"
      : currentUpdate?.id === PLUGIN_SUBMISSION_UPDATE
      ? "postalpha-0.78-1v-chatgpt-plugin-submission-source-of-truth-drift-check"
      : currentUpdate?.id === CENSUS_BOARD_UPDATE
      ? "postalpha-0.78-1v-census-county-board-source-of-truth-drift-check"
      : currentUpdate?.id === SETUP_UI_UPDATE
      ? "postalpha-0.58j-setup-ui-source-of-truth-drift-check"
      : currentUpdate?.id === STORAGE_AUTH_UPDATE
      ? "postalpha-0.59h-storage-auth-source-of-truth-drift-check"
      : currentUpdate?.id === PERSISTENCE_FOUNDATION_UPDATE
      ? "postalpha-0.60h-persistence-foundation-source-of-truth-drift-check"
      : currentUpdate?.id === SAVE_UX_UPDATE
      ? "postalpha-0.61h-save-ux-source-of-truth-drift-check"
      : currentUpdate?.id === STRIPE_BILLING_UPDATE
      ? "postalpha-0.62h-stripe-test-billing-source-of-truth-drift-check"
      : currentUpdate?.id === PROTECTED_TOOL_GATE_UPDATE
      ? "postalpha-0.63h-protected-tool-gate-source-of-truth-drift-check"
      : currentUpdate?.id === SAVED_READ_SURFACE_UPDATE
      ? "postalpha-0.64h-saved-read-surface-source-of-truth-drift-check"
      : currentUpdate?.id === BROWSER_PROOF_UPDATE
      ? "postalpha-0.65h-browser-proof-source-of-truth-drift-check"
      : currentUpdate?.id === MOBILE_HARDENING_UPDATE
      ? "postalpha-0.66h-mobile-interaction-hardening-source-of-truth-drift-check"
      : currentUpdate?.id === PRODUCT_FEEL_UPDATE
      ? "postalpha-0.67h-product-feel-cleanup-source-of-truth-drift-check"
      : currentUpdate?.id === NATIONAL_GENERATION_UPDATE
      ? "postalpha-0.70h-generated-district-specs-source-of-truth-drift-check"
      : currentUpdate?.id === SCENE_PACKET_UPDATE
      ? "postalpha-0.71h-scene-packet-service-boundary-source-of-truth-drift-check"
      : currentUpdate?.id === BACKEND_SPINE_UPDATE
      ? "postalpha-0.72b-redis-scene-packet-backend-spine-source-of-truth-drift-check"
      : currentUpdate?.id === INTEGRATION_UPDATE
      ? "postalpha-0.58i-integration-source-of-truth-drift-check"
      : "postalpha-0.45e-source-of-truth-drift-check",
  blockerCount: blockers.length,
  blockers,
  warnings,
  checkedFiles,
  currentUpdateId: currentUpdate?.id ?? null,
  currentUpdateStatus: currentUpdate?.status ?? null,
  recommendedNextQuest: currentUpdate?.recommendedNextQuest ?? null,
  selectedAxis: currentUpdate?.selectedAxis ?? null,
  selectorOk: selector?.ok ?? null,
  selectorArtifactPath: priorSelectorArtifactPath,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function readText(path, label) {
  checkedFiles.push(path);
  const absolute = resolve(path);
  if (!existsSync(absolute)) {
    blockers.push(`Missing ${label}: ${path}.`);
    return "";
  }
  return readFileSync(absolute, "utf8");
}

function readJson(path, label) {
  const text = readText(path, label);
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    blockers.push(`Invalid ${label}: ${path}. ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function checkCurrentUpdate(update) {
  if (!update) return;
  if (update.id === ATLAS_COMMONS_UPDATE) {
    checkAtlasCommonsCurrentUpdate(update);
    return;
  }
  if (update.id === OWNER_GATE_UPDATE) {
    checkOwnerGateCurrentUpdate(update);
    return;
  }
  if (update.id === HOSTED_CLAWD_UPDATE) {
    checkHostedClawdCurrentUpdate(update);
    return;
  }
  if (update.id === INTEGRATION_UPDATE) {
    checkIntegrationCurrentUpdate(update);
    return;
  }
  if (update.id === SETUP_UI_UPDATE) {
    checkSetupUiCurrentUpdate(update);
    return;
  }
  if (update.id === STORAGE_AUTH_UPDATE) {
    checkStorageAuthCurrentUpdate(update);
    return;
  }
  if (update.id === PERSISTENCE_FOUNDATION_UPDATE) {
    checkPersistenceFoundationCurrentUpdate(update);
    return;
  }
  if (update.id === SAVE_UX_UPDATE) {
    checkSaveUxCurrentUpdate(update);
    return;
  }
  if (update.id === STRIPE_BILLING_UPDATE) {
    checkStripeBillingCurrentUpdate(update);
    return;
  }
  if (update.id === PROTECTED_TOOL_GATE_UPDATE) {
    checkProtectedToolGateCurrentUpdate(update);
    return;
  }
  if (update.id === SAVED_READ_SURFACE_UPDATE) {
    checkSavedReadSurfaceCurrentUpdate(update);
    return;
  }
  if (update.id === BROWSER_PROOF_UPDATE) {
    checkBrowserProofCurrentUpdate(update);
    return;
  }
  if (update.id === MOBILE_HARDENING_UPDATE) {
    checkMobileHardeningCurrentUpdate(update);
    return;
  }
  if (update.id === PRODUCT_FEEL_UPDATE) {
    checkProductFeelCurrentUpdate(update);
    return;
  }
  if (update.id === NATIONAL_GENERATION_UPDATE) {
    checkNationalGenerationCurrentUpdate(update);
    return;
  }
  if (update.id === SCENE_PACKET_UPDATE) {
    checkScenePacketCurrentUpdate(update);
    return;
  }
  if (update.id === BACKEND_SPINE_UPDATE) {
    checkBackendSpineCurrentUpdate(update);
    return;
  }
  if (update.id === CENSUS_BOARD_UPDATE) {
    checkCensusBoardCurrentUpdate(update);
    return;
  }
  if (update.id === PLUGIN_SUBMISSION_UPDATE) {
    checkPluginSubmissionCurrentUpdate(update);
    return;
  }
  blockers.push(`artifacts/current-update.json id is not a recognized gated update; got ${update.id ?? "missing"}.`);
}

function checkAtlasCommonsCurrentUpdate(update) {
  if (update.status !== "staging_accepted_production_locked_off") {
    blockers.push(`Atlas Commons current-update status is unexpected: ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== "map_native_public_notes") {
    blockers.push(`Atlas Commons selectedAxis must be map_native_public_notes; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== "E11 Atlas Commons staging acceptance") {
    blockers.push(`Atlas Commons next quest must be E11 Atlas Commons staging acceptance; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.decision !== "OWNER_AUTHORIZED_STAGING_ONLY_PRODUCTION_LOCKED_OFF") {
    blockers.push(`Atlas Commons decision must preserve the staging-only owner cutline; got ${update.decision ?? "missing"}.`);
  }
  if (update.widgetResourceUri !== "ui://widget/atlas-city-world-081d.html") {
    blockers.push(`Atlas Commons widget URI must be 081d; got ${update.widgetResourceUri ?? "missing"}.`);
  }
  if (update.releaseState?.productionCommonsEnabled !== false || update.releaseState?.productionToolCount !== 7 || update.releaseState?.productionMutationAuthorized !== false) {
    blockers.push("Atlas Commons current update must keep production off, seven-tool, and mutation-unauthorized.");
  }
}

function checkAtlasCommonsAuthority({ currentUpdate: update, northFace: face, nextQuests: quests, buildLog: log, decisions: decisionLog, commonsSpec: spec, commonsRunbook: runbook, serverIndex: server, packageJson: manifest, envExample: env }) {
  const requiredAuthority = [
    [face, "Owner-reopened staging exception", "NORTH_FACE staging exception"],
    [face, "original seven tools", "NORTH_FACE production lock"],
    [quests, "Quest E11: Atlas Commons staging acceptance", "E11 next quest"],
    [log, "0.81D ATLAS COMMONS MAP RADAR", "0.81D build log"],
    [decisionLog, "Decision 071: The owner reopens Commons in staging only", "staging-only decision"],
    [spec, ATLAS_COMMONS_UPDATE, "Commons spec slice id"],
    [runbook, "production locked off", "Commons runbook production boundary"],
    [server, "ui://widget/atlas-city-world-081d.html", "versioned Commons widget URI"],
    [server, '"list_atlas_notes"', "Commons read tool"],
    [server, '"write_atlas_note"', "Commons write tool"],
    [env, "ATLAS_COMMONS_ENABLED=false", "default-off Commons env"],
  ];
  for (const [source, token, label] of requiredAuthority) {
    if (!source.includes(token)) blockers.push(`Missing ${label}: ${token}.`);
  }
  if (manifest?.scripts?.["verify:atlas-commons:staging"] !== "node scripts/verify-atlas-commons-staging.mjs") {
    blockers.push("package.json must expose the Atlas Commons staging verifier.");
  }
  if (update?.releaseState?.stagingCommonsEnabled !== true || update?.releaseState?.stagingOidcConfigured !== true || update?.releaseState?.stagingConnectorToolCount !== 9) {
    blockers.push("Current Atlas Commons record must preserve the accepted enabled staging state with OIDC and nine connector tools.");
  }
  if (update?.metricResult?.stagingModerationLifecycle !== "pass" || JSON.stringify(update?.metricResult?.stagingRollbackToolCounts) !== JSON.stringify([9, 7, 9])) {
    blockers.push("Current Atlas Commons record must preserve the live moderation and 9 -> 7 -> 9 rollback proof.");
  }
}

function checkOwnerGateCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== OWNER_GATE_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${OWNER_GATE_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== OWNER_GATE_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${OWNER_GATE_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== OWNER_GATE_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${OWNER_GATE_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (!update.verification?.selectorJson || !update.verification?.selectorArtifact || !update.verification?.ownerCutline) {
    blockers.push("artifacts/current-update.json must record the 0.45E selector, selector artifact, and owner cutline verifier commands.");
  }
  if (update.decision !== "REQUEST_OWNER_REVIEW") {
    blockers.push(`artifacts/current-update.json decision must be REQUEST_OWNER_REVIEW; got ${update.decision ?? "missing"}.`);
  }
}

function checkHostedClawdCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== HOSTED_CLAWD_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${HOSTED_CLAWD_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== HOSTED_CLAWD_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${HOSTED_CLAWD_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== HOSTED_CLAWD_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${HOSTED_CLAWD_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "SCAFFOLD_ONLY_GATES_STAY_CLOSED") {
    blockers.push(`artifacts/current-update.json decision must be SCAFFOLD_ONLY_GATES_STAY_CLOSED; got ${update.decision ?? "missing"}.`);
  }
  if (!update.verification?.hostedClawdGuard || !update.verification?.splitGuard) {
    blockers.push("artifacts/current-update.json must record the Hosted Clawd scaffold verifier and split guard.");
  }
  const hosted = update.metricResult?.hostedClawdScaffold;
  const scope = update.metricResult?.scope;
  if (hosted?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("Hosted Clawd scaffold must record zero new MCP tools.");
  }
  if (hosted?.persistenceDefault !== false || hosted?.moneyDefault !== false || hosted?.publicClaimDefault !== false) {
    blockers.push("Hosted Clawd scaffold must keep persistence, money, and public-claim defaults false.");
  }
  if (scope?.dbMigrations !== 0 || scope?.liveCheckout !== false || scope?.persistedWrites !== false) {
    blockers.push("Hosted Clawd scaffold must record no DB migrations, no live checkout, and no persisted writes.");
  }
}

function checkIntegrationCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== INTEGRATION_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${INTEGRATION_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== INTEGRATION_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${INTEGRATION_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== INTEGRATION_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${INTEGRATION_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "HUMAN_VISUAL_GATE_FIRST") {
    blockers.push(`artifacts/current-update.json decision must be HUMAN_VISUAL_GATE_FIRST; got ${update.decision ?? "missing"}.`);
  }
  if (!update.verification?.hostedClawdGuard || !update.verification?.fablePropCleanupGuard || !update.verification?.integrationSplitGuard) {
    blockers.push("artifacts/current-update.json must record Hosted Clawd, Fable cleanup, and integration split guards.");
  }
  const integration = update.metricResult?.integrationCanonicalization;
  const hosted = update.metricResult?.hostedClawdScaffold;
  const scope = update.metricResult?.scope;
  if (integration?.branch !== "codex/integrate-hosted-clawd-fable-058e" || integration?.splitMode !== "hosted-clawd-fable-integration") {
    blockers.push("0.58I integration must record the integration branch and hosted-clawd-fable-integration split mode.");
  }
  if (integration?.suitableCanonicalCandidate !== true || integration?.humanVisualGateRequired !== true) {
    blockers.push("0.58I integration must be a canonical candidate with a required human visual gate.");
  }
  if (integration?.deployRecommendation !== "HUMAN_VISUAL_GATE_FIRST") {
    blockers.push(`0.58I deployRecommendation must be HUMAN_VISUAL_GATE_FIRST; got ${integration?.deployRecommendation ?? "missing"}.`);
  }
  if (integration?.publicToolCount !== 7 || integration?.newMcpTools !== 0 || hosted?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("0.58I integration must keep the seven-tool public MCP surface and zero new MCP tools.");
  }
  if (hosted?.persistenceDefault !== false || hosted?.moneyDefault !== false || hosted?.publicClaimDefault !== false) {
    blockers.push("0.58I integration must keep Hosted Clawd persistence, money, and public-claim defaults false.");
  }
  if (scope?.dbMigrations !== 0 || scope?.liveCheckout !== false || scope?.persistedWrites !== false || scope?.publicAnaheimPromotion !== false || scope?.providerGeometry !== false) {
    blockers.push("0.58I integration must record no DB migrations, no live checkout, no persisted writes, no public Anaheim promotion, and no provider geometry.");
  }
  if (scope?.rendererGeometryChanges !== true) {
    blockers.push("0.58I integration must explicitly acknowledge Fable renderer geometry changes.");
  }
}

function checkSetupUiCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== SETUP_UI_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${SETUP_UI_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== SETUP_UI_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${SETUP_UI_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== SETUP_UI_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${SETUP_UI_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "SETUP_CONSOLE_PORTED_GATES_STAY_CLOSED") {
    blockers.push(`artifacts/current-update.json decision must be SETUP_CONSOLE_PORTED_GATES_STAY_CLOSED; got ${update.decision ?? "missing"}.`);
  }
  const setup = update.metricResult?.hostedClawdSetupUi;
  const scope = update.metricResult?.scope;
  if (setup?.branch !== "codex/integrate-hosted-clawd-fable-058e" || setup?.baseCommit !== "920cf8a") {
    blockers.push("0.58J setup UI must record the integrated branch and 0.58I base commit.");
  }
  if (setup?.visualSource !== "Superior grey setup console") {
    blockers.push("0.58J setup UI must record the Superior grey setup console as visual source.");
  }
  if (setup?.setupConsoleQa !== "hosted-clawd-setup-rail" || setup?.contextOnly !== true || setup?.newContextFields !== 0) {
    blockers.push("0.58J setup UI must stay context-only with the stable hosted-clawd setup QA hook.");
  }
  if (setup?.publicToolCount !== 7 || setup?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("0.58J setup UI must keep the seven-tool public MCP surface and zero new MCP tools.");
  }
  if (setup?.persistenceDefault !== false || setup?.moneyDefault !== false || setup?.publicClaimDefault !== false) {
    blockers.push("0.58J setup UI must keep persistence, money, and public-claim defaults false.");
  }
  if (setup?.humanVisualGateRequired !== true || setup?.deployRecommendation !== "HUMAN_VISUAL_GATE_FIRST") {
    blockers.push("0.58J setup UI must keep human visual gate before deploy.");
  }
  if (scope?.dbMigrations !== 0 || scope?.liveCheckout !== false || scope?.persistedWrites !== false || scope?.publicAnaheimPromotion !== false || scope?.providerGeometry !== false) {
    blockers.push("0.58J setup UI must record no DB migrations, no live checkout, no persisted writes, no public Anaheim promotion, and no provider geometry.");
  }
  if (scope?.uiSurfaceChanges !== true || scope?.rendererGeometryChanges !== false) {
    blockers.push("0.58J setup UI must record UI surface changes without renderer geometry changes.");
  }
}

function checkStorageAuthCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== STORAGE_AUTH_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${STORAGE_AUTH_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== STORAGE_AUTH_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${STORAGE_AUTH_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== STORAGE_AUTH_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${STORAGE_AUTH_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "DB_AUTH_PREP_APPROVED_STRIPE_STAYS_CLOSED") {
    blockers.push(`artifacts/current-update.json decision must be DB_AUTH_PREP_APPROVED_STRIPE_STAYS_CLOSED; got ${update.decision ?? "missing"}.`);
  }
  if (!update.verification?.dbAuthPrepGuard || !update.verification?.sourceOfTruthDrift || !update.verification?.integrationSplitGuard) {
    blockers.push("artifacts/current-update.json must record the DB/Auth prep guard, source-of-truth drift guard, and split guard.");
  }
  const prep = update.metricResult?.hostedClawdStorageAuth;
  const scope = update.metricResult?.scope;
  if (prep?.storageProvider !== "Railway Postgres") {
    blockers.push("0.59H must record Railway Postgres as the production DB path.");
  }
  if (prep?.authModel !== "OAuth/OIDC account linking for protected MCP Hosted Clawd actions") {
    blockers.push("0.59H must record OAuth/OIDC account linking for protected MCP Hosted Clawd actions.");
  }
  if (prep?.appsSdkAuthBoundary !== "MCP auth challenge for protected writes; iframe cookies are not identity") {
    blockers.push("0.59H must record the Apps SDK auth boundary.");
  }
  if (prep?.stripeTiming !== "0.62H after 0.60H ownership and idempotency pass") {
    blockers.push("0.59H must keep Stripe after the 0.60H ownership/idempotency pass.");
  }
  if (prep?.publicToolCount !== 7 || prep?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("0.59H must keep the seven-tool public MCP surface and zero new MCP tools.");
  }
  if (scope?.docsOnly !== true || scope?.dbMigrations !== 0 || scope?.persistedWrites !== false || scope?.liveCheckout !== false) {
    blockers.push("0.59H must be docs/verifier prep only with no migrations, persisted writes, or live checkout.");
  }
  if (scope?.authProviderMutation !== false || scope?.packageDepsAdded !== 0 || scope?.publicAnaheimPromotion !== false || scope?.providerGeometry !== false) {
    blockers.push("0.59H must record no auth-provider mutation, package dependency, public Anaheim promotion, or provider geometry.");
  }
}

function checkPersistenceFoundationCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== PERSISTENCE_FOUNDATION_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${PERSISTENCE_FOUNDATION_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== PERSISTENCE_FOUNDATION_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${PERSISTENCE_FOUNDATION_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== PERSISTENCE_FOUNDATION_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${PERSISTENCE_FOUNDATION_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "PERSISTENCE_FOUNDATION_LOCAL_GREEN_STRIPE_CLOSED") {
    blockers.push(`artifacts/current-update.json decision must be PERSISTENCE_FOUNDATION_LOCAL_GREEN_STRIPE_CLOSED; got ${update.decision ?? "missing"}.`);
  }
  if (!update.verification?.persistenceFoundationGuard || !update.verification?.hostedClawdTests || !update.verification?.persistenceSplitGuard) {
    blockers.push("artifacts/current-update.json must record the 0.60H persistence guard, Hosted Clawd tests, and split guard.");
  }
  const foundation = update.metricResult?.hostedClawdPersistenceFoundation;
  const scope = update.metricResult?.scope;
  if (foundation?.storageProvider !== "Railway Postgres") {
    blockers.push("0.60H must record Railway Postgres as the production DB path.");
  }
  if (foundation?.authModel !== "OAuth/OIDC account linking for protected Hosted Clawd writes") {
    blockers.push("0.60H must record OAuth/OIDC account linking for protected Hosted Clawd writes.");
  }
  if (foundation?.publicToolCount !== 7 || foundation?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("0.60H must keep the seven-tool public MCP surface and zero new MCP tools.");
  }
  if (scope?.dbMigrations !== 1 || scope?.persistedWrites !== true || scope?.liveCheckout !== false) {
    blockers.push("0.60H must record one DB migration, protected persisted writes, and no live checkout.");
  }
  if (scope?.stripeDepsAdded !== 0 || scope?.stripeTablesAdded !== 0 || scope?.publicAnaheimPromotion !== false || scope?.providerGeometry !== false) {
    blockers.push("0.60H must record no Stripe deps/tables, no public Anaheim promotion, and no provider geometry.");
  }
}

function checkSaveUxCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== SAVE_UX_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${SAVE_UX_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== SAVE_UX_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${SAVE_UX_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== SAVE_UX_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${SAVE_UX_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED") {
    blockers.push(`artifacts/current-update.json decision must be MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED; got ${update.decision ?? "missing"}.`);
  }
  if (!update.verification?.saveUxGuard || !update.verification?.browserSaveUxGuard || !update.verification?.saveUxSplitGuard) {
    blockers.push("artifacts/current-update.json must record the 0.61H save UX guard, browser proof, and split guard.");
  }
  const saveUx = update.metricResult?.hostedClawdSaveUx;
  const scope = update.metricResult?.scope;
  if (saveUx?.visualSource !== "Superior grey setup console plus claymation save slots") {
    blockers.push("0.61H must record Superior grey setup console plus claymation save slots as the visual source.");
  }
  if (saveUx?.publicToolCount !== 7 || saveUx?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("0.61H must keep the seven-tool public MCP surface and zero new MCP tools.");
  }
  if (scope?.uiSurfaceChanges !== true || scope?.rendererGeometryChanges !== false || scope?.liveCheckout !== false) {
    blockers.push("0.61H must record a UI-only save UX change with no renderer geometry or live checkout.");
  }
  if (scope?.stripeDepsAdded !== 0 || scope?.stripeTablesAdded !== 0 || scope?.publicAnaheimPromotion !== false || scope?.providerGeometry !== false) {
    blockers.push("0.61H must record no Stripe deps/tables, no public Anaheim promotion, and no provider geometry.");
  }
}

function checkStripeBillingCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== STRIPE_BILLING_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${STRIPE_BILLING_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== STRIPE_BILLING_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${STRIPE_BILLING_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== STRIPE_BILLING_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${STRIPE_BILLING_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "STRIPE_TEST_BILLING_WEBHOOK_GATED") {
    blockers.push(`artifacts/current-update.json decision must be STRIPE_TEST_BILLING_WEBHOOK_GATED; got ${update.decision ?? "missing"}.`);
  }
  if (!update.verification?.stripeBillingGuard || !update.verification?.billingTests || !update.verification?.stripeBillingSplitGuard) {
    blockers.push("artifacts/current-update.json must record the 0.62H Stripe billing guard, billing tests, and split guard.");
  }
  const billing = update.metricResult?.hostedClawdStripeTestBilling;
  const scope = update.metricResult?.scope;
  if (billing?.confirmationSource !== "stripe_webhook" || billing?.returnUrlGrantsAccess !== false) {
    blockers.push("0.62H must record webhook-only confirmation and returnUrlGrantsAccess false.");
  }
  if (billing?.publicToolCount !== 7 || billing?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("0.62H must keep the seven-tool public MCP surface and zero new MCP tools.");
  }
  if (scope?.stripeDepsAdded !== 1 || scope?.stripeTablesAdded !== 2 || scope?.liveCheckout !== true || scope?.protectedWritesOnly !== true) {
    blockers.push("0.62H must record one Stripe dep, two Stripe tables, test Checkout enabled, and protected writes only.");
  }
  if (scope?.publicPaidClaim !== false || scope?.publicAnaheimPromotion !== false || scope?.providerGeometry !== false || scope?.rendererGeometryChanges !== false) {
    blockers.push("0.62H must record no public paid claim, no public Anaheim/Ontario, no provider geometry, and no renderer geometry.");
  }
}

function checkProtectedToolGateCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== PROTECTED_TOOL_GATE_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${PROTECTED_TOOL_GATE_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== PROTECTED_TOOL_GATE_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${PROTECTED_TOOL_GATE_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== PROTECTED_TOOL_GATE_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${PROTECTED_TOOL_GATE_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION") {
    blockers.push(`artifacts/current-update.json decision must be PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION; got ${update.decision ?? "missing"}.`);
  }
  if (
    !update.verification?.protectedToolGateGuard ||
    !update.verification?.protectedToolGateTests ||
    !update.verification?.protectedToolGateSplitGuard
  ) {
    blockers.push("artifacts/current-update.json must record the 0.63H protected tool gate guard, tests, and split guard.");
  }
  const gate = update.metricResult?.hostedClawdProtectedToolGate;
  const scope = update.metricResult?.scope;
  if (gate?.subscriptionTruth !== "repository_webhook_state" || gate?.clientSubscriptionStatusTrusted !== false) {
    blockers.push("0.63H must record repository webhook state as subscription truth and reject client subscription trust.");
  }
  if (gate?.publicToolCount !== 7 || gate?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("0.63H must keep the seven-tool public MCP surface and zero new MCP tools.");
  }
  if (
    scope?.paidWriteRequiresActiveSubscription !== true ||
    scope?.clientStatusTrusted !== false ||
    scope?.protectedWritesOnly !== true
  ) {
    blockers.push("0.63H must record active-subscription paid-write gate, client status untrusted, and protected writes only.");
  }
  if (
    scope?.publicPaidClaim !== false ||
    scope?.publicAnaheimPromotion !== false ||
    scope?.providerGeometry !== false ||
    scope?.rendererGeometryChanges !== false
  ) {
    blockers.push("0.63H must record no public paid claim, no public Anaheim/Ontario, no provider geometry, and no renderer geometry.");
  }
}

function checkSavedReadSurfaceCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== SAVED_READ_SURFACE_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${SAVED_READ_SURFACE_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== SAVED_READ_SURFACE_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${SAVED_READ_SURFACE_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== SAVED_READ_SURFACE_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${SAVED_READ_SURFACE_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS") {
    blockers.push(`artifacts/current-update.json decision must be SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS; got ${update.decision ?? "missing"}.`);
  }
  if (
    !update.verification?.savedReadSurfaceGuard ||
    !update.verification?.savedReadSurfaceBrowser ||
    !update.verification?.savedReadSurfaceTests ||
    !update.verification?.savedReadSurfaceSplitGuard
  ) {
    blockers.push("artifacts/current-update.json must record the 0.64H saved read surface guard, browser guard, tests, and split guard.");
  }
  const savedRead = update.metricResult?.hostedClawdSavedReadSurface;
  const scope = update.metricResult?.scope;
  if (
    savedRead?.ownerScopedReads !== true ||
    savedRead?.readRequiresAuth !== true ||
    savedRead?.refreshStatusReadOnly !== true ||
    savedRead?.readRequiresActiveSubscription !== false ||
    savedRead?.readsCreateRows !== false
  ) {
    blockers.push("0.64H must record owner-scoped auth reads, read-only refresh status, no active-subscription read requirement, and no row creation on read.");
  }
  if (savedRead?.stubAuditPath !== "docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md") {
    blockers.push("0.64H must record the Hosted Clawd stub audit path.");
  }
  if (savedRead?.publicToolCount !== 7 || savedRead?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("0.64H must keep the seven-tool public MCP surface and zero new MCP tools.");
  }
  if (
    scope?.readOnlySurface !== true ||
    scope?.persistedWritesAdded !== false ||
    scope?.readRequiresActiveSubscription !== false ||
    scope?.uiSurfaceChanges !== true
  ) {
    blockers.push("0.64H must record one read-only UI surface with no new persisted write expansion.");
  }
  if (
    scope?.publicPaidClaim !== false ||
    scope?.publicAnaheimPromotion !== false ||
    scope?.providerGeometry !== false ||
    scope?.rendererGeometryChanges !== false
  ) {
    blockers.push("0.64H must record no public paid claim, no public Anaheim/Ontario, no provider geometry, and no renderer geometry.");
  }
}

function checkBrowserProofCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== BROWSER_PROOF_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${BROWSER_PROOF_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== BROWSER_PROOF_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${BROWSER_PROOF_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== BROWSER_PROOF_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${BROWSER_PROOF_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "BROWSER_PROVES_ACCOUNT_LINK_REQUIRED_NO_WIDGET_TOKEN") {
    blockers.push(`artifacts/current-update.json decision must be BROWSER_PROVES_ACCOUNT_LINK_REQUIRED_NO_WIDGET_TOKEN; got ${update.decision ?? "missing"}.`);
  }
  if (!update.verification?.browserProofGuard || !update.verification?.browserProofSplitGuard || !update.verification?.starterTypecheck) {
    blockers.push("artifacts/current-update.json must record the 0.65H browser proof guard, split guard, and starter typecheck.");
  }
  const proof = update.metricResult?.hostedClawdBrowserProof;
  const scope = update.metricResult?.scope;
  if (
    proof?.browserAuthRequired !== true ||
    proof?.httpStatus !== 401 ||
    proof?.readScopeChallenge !== true ||
    proof?.resourceMetadataChallenge !== true ||
    proof?.savedShelfNotRendered !== true ||
    proof?.widgetBearerTokenExposed !== false
  ) {
    blockers.push("0.65H must record missing-bearer saved reads as a 401 read-scope challenge with no saved shelf and no widget bearer token.");
  }
  if (
    proof?.dialogSemantics !== true ||
    proof?.statusLiveRegion !== true ||
    proof?.primaryActionVisible !== true ||
    proof?.touchTargets44 !== true ||
    proof?.desktopNoOverflow !== true ||
    proof?.mobile390NoOverflow !== true
  ) {
    blockers.push("0.65H must record dialog/status semantics, visible primary action, 44px touch targets, and no desktop/mobile overflow.");
  }
  if (proof?.publicToolCount !== 7 || proof?.newMcpTools !== 0 || scope?.newMcpTools !== 0) {
    blockers.push("0.65H must keep the seven-tool public MCP surface and zero new MCP tools.");
  }
  if (
    scope?.readOnlySurface !== true ||
    scope?.persistedWritesAdded !== false ||
    scope?.uiSurfaceChanges !== true ||
    scope?.rendererGeometryChanges !== false
  ) {
    blockers.push("0.65H must record browser/UI proof only, with no persisted write or renderer geometry expansion.");
  }
  if (
    scope?.publicPaidClaim !== false ||
    scope?.publicAnaheimPromotion !== false ||
    scope?.providerGeometry !== false
  ) {
    blockers.push("0.65H must record no public paid claim, no public Anaheim/Ontario, and no provider geometry.");
  }
  for (const path of [proof?.artifactPath, proof?.desktopScreenshot, proof?.mobileScreenshot]) {
    if (!path || !existsSync(resolve(path))) {
      blockers.push(`0.65H proof path is missing: ${path ?? "missing"}.`);
    }
  }
}

function checkMobileHardeningCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== MOBILE_HARDENING_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${MOBILE_HARDENING_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== MOBILE_HARDENING_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${MOBILE_HARDENING_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== MOBILE_HARDENING_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${MOBILE_HARDENING_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "RETAINED_GRAPH_BOTTOM_SHEET_SPLIT_PAYLOAD") {
    blockers.push(`artifacts/current-update.json decision must be RETAINED_GRAPH_BOTTOM_SHEET_SPLIT_PAYLOAD; got ${update.decision ?? "missing"}.`);
  }
  if (
    !update.verification?.mobileInteractionHardening ||
    !update.verification?.webBundleBudget ||
    !update.verification?.previewHttp ||
    !update.verification?.starterTypecheck ||
    !update.verification?.mobileInteractionSplitGuard
  ) {
    blockers.push("artifacts/current-update.json must record the 0.66H mobile hardening guard, payload budget, preview HTTP guard, split guard, and starter typecheck.");
  }

  const proof = update.metricResult?.mobileInteractionHardening;
  const scope = update.metricResult?.scope;
  if (
    proof?.desktopPanRebuildDelta !== 0 ||
    proof?.mobilePanRebuildDelta !== 0 ||
    proof?.touchTargets44 !== true ||
    proof?.horizontalOverflow !== false ||
    typeof proof?.previewHtmlBytes !== "number" ||
    proof.previewHtmlBytes > 300_000 ||
    typeof proof?.eagerJsBytes !== "number" ||
    proof.eagerJsBytes > 400_000 ||
    typeof proof?.deferredChunkCount !== "number" ||
    proof.deferredChunkCount <= 0
  ) {
    blockers.push("0.66H must record zero pan rebuilds, 44px touch targets, no overflow, preview shell under 300KB, eager JS under 400KB, and at least one deferred chunk.");
  }
  if (
    proof?.collapsedSheetMaxHeightPx !== 96 ||
    typeof proof?.desktopCollapsedSheetHeightPx !== "number" ||
    proof.desktopCollapsedSheetHeightPx > 96 ||
    typeof proof?.mobileCollapsedSheetHeightPx !== "number" ||
    proof.mobileCollapsedSheetHeightPx > 96 ||
    proof?.expandedSheetMaxViewportShare !== 0.45
  ) {
    blockers.push("0.66H must record collapsed bottom sheet under 96px and expanded sheet capped at 45dvh.");
  }
  if (
    scope?.newMcpTools !== 0 ||
    scope?.retainedSceneGraph !== true ||
    scope?.bottomSheetSaveChrome !== true ||
    scope?.externalWidgetAssets !== true ||
    scope?.pixiDeferred !== true ||
    scope?.rendererGeometryChanges !== false
  ) {
    blockers.push("0.66H must record retained graph, bottom-sheet chrome, external widget assets, deferred Pixi, zero new tools, and no renderer geometry expansion.");
  }
  if (
    scope?.dbMigrationsAdded !== 0 ||
    scope?.authScopeAdded !== false ||
    scope?.stripeScopeAdded !== false ||
    scope?.publicPaidClaim !== false ||
    scope?.publicAnaheimPromotion !== false ||
    scope?.providerGeometry !== false
  ) {
    blockers.push("0.66H must record no DB/Auth/Stripe scope expansion, no public paid claim, no public Anaheim/Ontario, and no provider geometry.");
  }
  for (const path of [proof?.artifactPath, proof?.metricsPath, proof?.desktopScreenshot, proof?.mobileScreenshot]) {
    if (!path || !existsSync(resolve(path))) {
      blockers.push(`0.66H proof path is missing: ${path ?? "missing"}.`);
    }
  }
}

function checkProductFeelCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== PRODUCT_FEEL_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${PRODUCT_FEEL_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== PRODUCT_FEEL_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${PRODUCT_FEEL_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== PRODUCT_FEEL_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${PRODUCT_FEEL_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "GRAPHICS_CHROME_DEMOTED_OBJECTS_FIRST") {
    blockers.push(`artifacts/current-update.json decision must be GRAPHICS_CHROME_DEMOTED_OBJECTS_FIRST; got ${update.decision ?? "missing"}.`);
  }
  if (
    !update.verification?.graphicsCleanup ||
    !update.verification?.starterTypecheck ||
    !update.verification?.starterBuild ||
    !update.verification?.sourceOfTruthDrift ||
    !update.verification?.productFeelSplitGuard
  ) {
    blockers.push("artifacts/current-update.json must record the 0.67H graphics cleanup guard, starter typecheck/build, source drift guard, and product-feel split guard.");
  }

  const proof = update.metricResult?.cityWorldGraphicsCleanup;
  const scope = update.metricResult?.scope;
  if (
    proof?.desktopCanvasVisible !== true ||
    proof?.mobileCanvasVisible !== true ||
    proof?.desktopHorizontalOverflow !== false ||
    proof?.mobileHorizontalOverflow !== false ||
    proof?.consoleErrors !== 0 ||
    proof?.mobileAmbientLabels !== 0 ||
    proof?.desktopAmbientLabelCap !== 2 ||
    proof?.selectedRingBaseAlpha !== 0.32
  ) {
    blockers.push("0.67H must record visible desktop/mobile map proof, no overflow/errors, zero mobile ambient labels, two desktop ambient labels, and quiet selected ring alpha.");
  }
  if (
    proof?.fableRendererPass !== true ||
    proof?.offFacadePins !== true ||
    proof?.focalPropActorCalm !== true ||
    proof?.commerceGymDetailDemoted !== true
  ) {
    blockers.push("0.67H must record the Fable renderer pass: off-facade pins, focal prop/actor calm, and commerce/gym detail demotion.");
  }
  if (
    scope?.newMcpTools !== 0 ||
    scope?.rendererVisualChanges !== true ||
    scope?.rendererGeometryChanges !== false ||
    scope?.dbMigrationsAdded !== 0 ||
    scope?.authScopeAdded !== false ||
    scope?.stripeScopeAdded !== false ||
    scope?.publicPaidClaim !== false ||
    scope?.publicAnaheimPromotion !== false ||
    scope?.providerGeometry !== false
  ) {
    blockers.push("0.67H must record renderer visual cleanup only: zero new tools, no renderer geometry expansion, no DB/Auth/Stripe expansion, no public paid claim, no public Anaheim/Ontario, and no provider geometry.");
  }
  for (const path of [proof?.artifactPath, proof?.desktopScreenshot, proof?.mobileScreenshot]) {
    if (!path || !existsSync(resolve(path))) {
      blockers.push(`0.67H proof path is missing: ${path ?? "missing"}.`);
    }
  }
}

function checkNationalGenerationCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== NATIONAL_GENERATION_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${NATIONAL_GENERATION_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== NATIONAL_GENERATION_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${NATIONAL_GENERATION_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== NATIONAL_GENERATION_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${NATIONAL_GENERATION_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "DETERMINISTIC_DISTRICT_SPECS_BEFORE_LOCAL_PROMOTION") {
    blockers.push(`artifacts/current-update.json decision must be DETERMINISTIC_DISTRICT_SPECS_BEFORE_LOCAL_PROMOTION; got ${update.decision ?? "missing"}.`);
  }
  if (
    !update.verification?.generatedDistrictCoreTests ||
    !update.verification?.deterministicGeneratedDistricts ||
    !update.verification?.starterTypecheck ||
    !update.verification?.starterBuild ||
    !update.verification?.sourceOfTruthDrift ||
    !update.verification?.nationalGenerationSplitGuard
  ) {
    blockers.push("artifacts/current-update.json must record the 0.70H generated-district core tests, deterministic verifier, starter typecheck/build, source drift guard, and national split guard.");
  }

  const proof = update.metricResult?.generatedDistrictSpecs;
  const scope = update.metricResult?.scope;
  if (
    proof?.currentProductionReady !== false ||
    proof?.currentStage !== "P3_PROVIDER_NORMALIZED_LOCAL_ANCHORS" ||
    proof?.currentIndexedStateCount !== 52 ||
    proof?.currentIndexedCountyCount !== 3222 ||
    proof?.currentShellCountyCount !== 3221 ||
    proof?.currentPlayableCountyCount !== 1 ||
    proof?.onlyPublicPlayableCounty !== "riverside-ca" ||
    proof?.nextRequiredSlice !== NATIONAL_GENERATION_NEXT_QUEST
  ) {
    blockers.push("0.70H must record generated district truth and the next scene packet service boundary slice.");
  }
  if (
    proof?.sourceBasis !== "census_identity_only" ||
    proof?.deterministicGeneratorAvailable !== true ||
    proof?.providerGeometryBlocked !== true ||
    proof?.providerNormalizedLocalAnchors !== false ||
    proof?.generatedDistrictsPublicPlayable !== false ||
    proof?.railwayFrameLoopDependency !== false ||
    proof?.publicPlayableClaimForAllUs !== false ||
    !Array.isArray(proof?.sampleGeneratedDistricts) ||
    !proof.sampleGeneratedDistricts.includes("cook-il") ||
    !proof.sampleGeneratedDistricts.includes("miami-dade-fl") ||
    !proof.sampleGeneratedDistricts.includes("maricopa-az")
  ) {
    blockers.push("0.70H must record Census-identity generation, deterministic availability, provider boundary, no Railway frame-loop dependency, no all-US playable claim, and generated district samples.");
  }
  if (
    scope?.newMcpTools !== 0 ||
    scope?.rendererVisualChanges !== false ||
    scope?.publicRendererRouteChanges !== false ||
    scope?.dbMigrationsAdded !== 0 ||
    scope?.authScopeAdded !== false ||
    scope?.stripeScopeAdded !== false ||
    scope?.publicPaidClaim !== false ||
    scope?.publicAnaheimPromotion !== false ||
    scope?.providerGeometry !== false ||
    scope?.nationwidePlayableClaim !== false ||
    scope?.railwayRuntimeRequiredForPanZoom !== false
  ) {
    blockers.push("0.70H must be a generated-district contract slice: zero new tools, no public renderer route, no DB/Auth/Stripe expansion, no public paid claim, no public Anaheim/Ontario, no provider geometry, no nationwide playable claim, and no Railway pan/zoom dependency.");
  }
  for (const path of [proof?.artifactPath, "docs/VOXEL_ENGINE_DELIVERY_ARCHITECTURE_0.70H.md", "docs/NATIONAL_ENGINE_PRODUCTION_CONTRACT.md"]) {
    if (!path || !existsSync(resolve(path))) {
      blockers.push(`0.70H proof path is missing: ${path ?? "missing"}.`);
    }
  }
}

function checkScenePacketCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== SCENE_PACKET_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${SCENE_PACKET_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== SCENE_PACKET_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${SCENE_PACKET_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== SCENE_PACKET_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${SCENE_PACKET_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "GENERATED_DRAFT_PACKETS_META_ONLY_NO_FRAME_LOOP") {
    blockers.push(`artifacts/current-update.json decision must be GENERATED_DRAFT_PACKETS_META_ONLY_NO_FRAME_LOOP; got ${update.decision ?? "missing"}.`);
  }
  if (
    !update.verification?.generatedDraftScenePacket ||
    !update.verification?.generatedDraftCoreTests ||
    !update.verification?.starterTypecheck ||
    !update.verification?.starterBuild ||
    !update.verification?.sourceOfTruthDrift ||
    !update.verification?.nationalGenerationSplitGuard
  ) {
    blockers.push("artifacts/current-update.json must record the 0.71H generated draft verifier, core tests, starter typecheck/build, source drift guard, and national split guard.");
  }

  const proof = update.metricResult?.scenePacketService;
  const scope = update.metricResult?.scope;
  if (
    proof?.generatedDraftReadiness !== true ||
    proof?.generatedDraftPlayable !== false ||
    proof?.generatedDraftPublicRouteAllowed !== false ||
    proof?.generatedDraftContainsProviderGeometry !== false ||
    proof?.generatedDraftMetaOnlyScene !== true ||
    proof?.runtimeMemoryCacheOnly !== true ||
    proof?.mcpMetaDelivery !== true ||
    proof?.structuredContentCarriesGeneratedScene !== false ||
    proof?.statusRouteSafeSummariesOnly !== true ||
    proof?.railwayRuntimeRequiredForPanZoom !== false ||
    proof?.cacheMissCompilesOnce !== true ||
    proof?.cacheHitReturnsPayload !== true ||
    proof?.artifactPath !== "artifacts/national-generation/0.71h/generated-draft-scene-packet.json"
  ) {
    blockers.push("0.71H must record generated draft packet truth: meta-only, non-playable, non-public, provider-free, runtime cache only, status-safe, miss-then-hit, and no Railway pan/zoom dependency.");
  }
  if (
    scope?.newMcpTools !== 0 ||
    scope?.publicHttpRenderRoute !== false ||
    scope?.browserHttpRenderRouteAdded !== false ||
    scope?.rendererVisualChanges !== false ||
    scope?.dbMigrationsAdded !== 0 ||
    scope?.authScopeAdded !== false ||
    scope?.stripeScopeAdded !== false ||
    scope?.publicPaidClaim !== false ||
    scope?.publicAnaheimPromotion !== false ||
    scope?.providerGeometry !== false ||
    scope?.nationwidePlayableClaim !== false ||
    scope?.railwayRuntimeRequiredForPanZoom !== false
  ) {
    blockers.push("0.71H must be a service-boundary slice: zero new tools, no HTTP render route, no renderer visual change, no DB/Auth/Stripe expansion, no public claims, no provider geometry, no all-US playable claim, and no Railway pan/zoom dependency.");
  }
  for (const path of [
    proof?.artifactPath,
    "docs/SCENE_PACKET_SERVICE_BOUNDARY_0.71H.md",
    "scripts/verify-generated-draft-scene-packet.mjs",
  ]) {
    if (!path || !existsSync(resolve(path))) {
      blockers.push(`0.71H proof path is missing: ${path ?? "missing"}.`);
    }
  }
}

function checkBackendSpineCurrentUpdate(update) {
  if (update.status !== "local_green") {
    blockers.push(`artifacts/current-update.json status must be local_green; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== BACKEND_SPINE_SELECTED_AXIS) {
    blockers.push(`artifacts/current-update.json selectedAxis must be ${BACKEND_SPINE_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== BACKEND_SPINE_NEXT_QUEST) {
    blockers.push(`Current update recommendedNextQuest must be ${BACKEND_SPINE_NEXT_QUEST}; got ${update.recommendedNextQuest ?? "missing"}.`);
  }
  if (update.inputUpdate !== BACKEND_SPINE_INPUT_UPDATE) {
    blockers.push(`artifacts/current-update.json inputUpdate must be ${BACKEND_SPINE_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "REDIS_PACKET_SPINE_NOT_RENDER_LOOP") {
    blockers.push(`artifacts/current-update.json decision must be REDIS_PACKET_SPINE_NOT_RENDER_LOOP; got ${update.decision ?? "missing"}.`);
  }
  if (
    !update.verification?.serverBuild ||
    !update.verification?.productionBackendSpine ||
    !update.verification?.generatedDraftScenePacket ||
    !update.verification?.scenePacketMemoryAdapter
  ) {
    blockers.push("artifacts/current-update.json must record the 0.72B server build, backend spine verifier, generated draft verifier, and memory adapter verifier.");
  }

  const proof = update.metricResult?.scenePacketBackendSpine;
  const scope = update.metricResult?.scope;
  if (
    proof?.artifactPath !== "artifacts/national-generation/0.72b/production-backend-spine.json" ||
    proof?.devMemoryFallback !== true ||
    proof?.productionRedisRequired !== true ||
    proof?.redisCompileLock !== true ||
    proof?.queuedSafeGeneratedDraftPacket !== true ||
    proof?.workerEntrypoint !== "server/src/scenePacketWorker.ts" ||
    proof?.statusSafeSummariesOnly !== true ||
    proof?.readyEndpoint !== true ||
    proof?.requestIds !== true ||
    proof?.structuredBackendLogs !== true ||
    proof?.rateLimits !== true ||
    proof?.railwayRuntimeRequiredForPanZoom !== false
  ) {
    blockers.push("0.72B must record memory/Redis cache spine truth: dev fallback, production Redis requirement, compile lock, queued-safe metadata, worker, safe status/ready, logs, rate limits, and no Railway pan/zoom dependency.");
  }
  if (
    scope?.newMcpTools !== 0 ||
    scope?.publicHttpRenderRoute !== false ||
    scope?.browserHttpRenderRouteAdded !== false ||
    scope?.scenePacketDbPersistence !== false ||
    scope?.authScopeAdded !== false ||
    scope?.stripePublicLaunch !== false ||
    scope?.publicPaidClaim !== false ||
    scope?.publicAnaheimPromotion !== false ||
    scope?.providerGeometry !== false ||
    scope?.nationwidePlayableClaim !== false ||
    scope?.railwayRuntimeRequiredForPanZoom !== false
  ) {
    blockers.push("0.72B must be a backend spine slice: zero new tools, no HTTP render route, no scene packet DB persistence, no public paid launch, no public claims, no provider geometry, no all-US playable claim, and no Railway pan/zoom dependency.");
  }
  for (const path of [
    proof?.artifactPath,
    "docs/REDIS_SCENE_PACKET_BACKEND_0.72B.md",
    "server/src/scenePacketWorker.ts",
    "scripts/verify-production-backend-spine.mjs",
    "scripts/verify-generated-draft-scene-packet.mjs",
  ]) {
    if (!path || !existsSync(resolve(path))) {
      blockers.push(`0.72B proof path is missing: ${path ?? "missing"}.`);
    }
  }
}

function checkCensusBoardCurrentUpdate(update) {
  if (update.status !== "production_green_real_host_g8_pending") {
    blockers.push(`0.78-1V status must be production_green_real_host_g8_pending; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== CENSUS_BOARD_SELECTED_AXIS) {
    blockers.push(`0.78-1V selectedAxis must be ${CENSUS_BOARD_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== CENSUS_BOARD_NEXT_QUEST || update.nextCodeStep !== CENSUS_BOARD_NEXT_QUEST) {
    blockers.push(`0.78-1V must keep the owner-gated next code step at ${CENSUS_BOARD_NEXT_QUEST}.`);
  }
  if (update.inputUpdate !== CENSUS_BOARD_INPUT_UPDATE) {
    blockers.push(`0.78-1V inputUpdate must be ${CENSUS_BOARD_INPUT_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE") {
    blockers.push(`0.78-1V decision is invalid: ${update.decision ?? "missing"}.`);
  }

  const metric = update.metricResult;
  if (
    metric?.featureFlag !== "atlasGeoBoard=1" ||
    metric?.defaultEnabled !== false ||
    metric?.featureAudit?.cells !== 12 ||
    metric?.featureAudit?.fail !== 0 ||
    metric?.featureAudit?.framingChecks !== 12 ||
    metric?.desktopMobileProof !== true ||
    metric?.lightDarkProof !== true ||
    metric?.newMcpTools !== 0 ||
    metric?.providerGeometry !== false ||
    metric?.publicPlayablePromotion !== false
  ) {
    blockers.push("0.78-1V must record 12 green flag-on cells with full framing, desktop/mobile and light/dark proof, flag-dark default, zero new tools, no provider geometry, and no public playable promotion.");
  }
  for (const key of ["core", "typecheck", "toolResultShape", "providerBoundary", "splitGuard", "censusBrowser", "framing", "proof", "releaseToolContract", "releasePreflight", "productionRelease", "publicSanity", "liveQuestionRouting"]) {
    if (!update.verification?.[key]) blockers.push(`0.78-1V verification is missing ${key}.`);
  }
  if (
    metric?.publicToolTruth?.exactProductionToolSet !== true ||
    metric?.publicToolTruth?.widgetResourceUri !== "ui://widget/atlas-city-world-0781v.html" ||
    metric?.publicToolTruth?.ordinaryEastvaleSourceQuestionTopic !== "source_limits"
  ) {
    blockers.push("0.78-1V must record the exact seven-tool production contract and versioned widget resource URI.");
  }
  if (
    update.releaseCandidate?.baseSha !== "0e94a6ce9d4ed362c03d2286696919b9cd6836bf" ||
    update.releaseCandidate?.headSha !== CENSUS_BOARD_DEPLOYED_SHA ||
    update.releaseCandidate?.pathCount !== 46 ||
    update.releaseCandidate?.widgetResourceUri !== "ui://widget/atlas-city-world-0781v.html"
  ) {
    blockers.push("0.78-1V must record the immutable release base/head, 46-path envelope, and widget resource URI.");
  }
  if (!existsSync(resolve(update.verification?.proof ?? ""))) {
    blockers.push(`0.78-1V proof path is missing: ${update.verification?.proof ?? "missing"}.`);
  }
  const expectedGates = ["owner-screenshot-review", "production-deploy", "real-host-g8"];
  const gates = Array.isArray(update.gates) ? update.gates : [];
  for (const id of expectedGates) {
    const gate = gates.find((candidate) => candidate?.id === id);
    if (gate?.required !== true) {
      blockers.push(`0.78-1V gate ${id} must remain required.`);
    }
  }
  const ownerGate = gates.find((candidate) => candidate?.id === "owner-screenshot-review");
  const deployGate = gates.find((candidate) => candidate?.id === "production-deploy");
  const realHostGate = gates.find((candidate) => candidate?.id === "real-host-g8");
  if (ownerGate?.status !== "passed" || ownerGate?.evidence !== CENSUS_BOARD_APPROVAL_EVIDENCE) {
    blockers.push("0.78-1V owner screenshot gate must be passed with its approval artifact.");
  }
  if (!existsSync(resolve(CENSUS_BOARD_APPROVAL_EVIDENCE))) {
    blockers.push(`0.78-1V owner approval artifact is missing: ${CENSUS_BOARD_APPROVAL_EVIDENCE}.`);
  }
  if (
    deployGate?.status !== "passed" ||
    deployGate?.authorization !== "approved" ||
    !deployGate?.evidence?.includes(CENSUS_BOARD_RAILWAY_DEPLOYMENT)
  ) {
    blockers.push("0.78-1V production deploy must be passed with the owner authorization and Railway deployment evidence.");
  }
  if (
    update.deployment?.status !== "production_green" ||
    update.deployment?.sha !== CENSUS_BOARD_DEPLOYED_SHA ||
    update.deployment?.railwayDeploymentId !== CENSUS_BOARD_RAILWAY_DEPLOYMENT ||
    update.deployment?.releaseGatesPassed !== 14 ||
    update.deployment?.publicSanityChecksPassed !== 3 ||
    update.deployment?.workerDeployed !== false
  ) {
    blockers.push("0.78-1V must record the green backend deploy, exact SHA/deployment id, 14 release gates, 3 public sanity checks, and worker safety skip.");
  }
  if (realHostGate?.status !== "pending") {
    blockers.push("0.78-1V real-host G8 must remain pending until real ChatGPT proof exists.");
  }
  for (const phrase of ["default-enable", "production deploy", "roads or town-detail", "national 3,222-pack", "new public MCP tools", "provider-created geometry", "persistence or public paid claims", "public Anaheim/Ontario"]) {
    if (!update.forbiddenScope?.some((item) => item.includes(phrase))) {
      blockers.push(`0.78-1V forbiddenScope is missing the ${phrase} boundary.`);
    }
  }
}

function checkPluginSubmissionCurrentUpdate(update) {
  if (update.status !== "production_green_portal_and_real_host_pending") {
    blockers.push(`Plugin submission status must be production_green_portal_and_real_host_pending; got ${update.status ?? "missing"}.`);
  }
  if (update.selectedAxis !== PLUGIN_SUBMISSION_SELECTED_AXIS) {
    blockers.push(`Plugin submission selectedAxis must be ${PLUGIN_SUBMISSION_SELECTED_AXIS}; got ${update.selectedAxis ?? "missing"}.`);
  }
  if (update.recommendedNextQuest !== CENSUS_BOARD_NEXT_QUEST) {
    blockers.push(`Plugin submission must preserve the next product quest at ${CENSUS_BOARD_NEXT_QUEST}.`);
  }
  if (update.inputUpdate !== CENSUS_BOARD_UPDATE) {
    blockers.push(`Plugin submission inputUpdate must be ${CENSUS_BOARD_UPDATE}; got ${update.inputUpdate ?? "missing"}.`);
  }
  if (update.decision !== "PLUGIN_SUBMISSION_PACKET_CERTIFIED_DEPLOY_PENDING") {
    blockers.push(`Plugin submission decision is invalid: ${update.decision ?? "missing"}.`);
  }

  const release = update.releaseCandidate;
  if (
    release?.baseSha !== TOWN_ANCHOR_RELEASE_BASE_SHA ||
    release?.headSha !== TOWN_ANCHOR_RELEASE_HEAD_SHA ||
    release?.pathCount !== TOWN_ANCHOR_RELEASE_PATH_COUNT ||
    release?.widgetResourceUri !== "ui://widget/atlas-city-world-0781v.html"
  ) {
    blockers.push("Plugin submission must record the 0.78-2A town-anchor release base/head, 78-path envelope, and versioned widget resource URI.");
  }

  const plugin = update.metricResult?.pluginSubmission;
  if (
    plugin?.displayName !== "Atlas County Scout" ||
    plugin?.subtitle !== "Explore voxel county maps" ||
    plugin?.toolCount !== 7 ||
    plugin?.starterPromptCount !== 4 ||
    plugin?.positiveTestCount !== 5 ||
    plugin?.negativeTestCount !== 3 ||
    plugin?.implementationSha !== PLUGIN_SUBMISSION_IMPLEMENTATION_SHA ||
    plugin?.publicLookupDiagnosticsRemoved !== true ||
    JSON.stringify(plugin?.productionLookupPublicFields) !== JSON.stringify(["places", "radiusMeters", "resolvedLocation", "type"]) ||
    plugin?.productionChallengeStatus !== 404 ||
    plugin?.supportRoute !== "/support" ||
    plugin?.domainChallengeRoute !== "/.well-known/openai-apps-challenge" ||
    JSON.stringify(plugin?.publicLookupInputs) !== JSON.stringify(["countySlug", "placeId", "radiusMeters"])
  ) {
    blockers.push("Plugin submission metrics must preserve the exact listing, seven-tool packet, 5/3 tests, minimized lookup inputs, support route, and domain challenge route.");
  }

  for (const key of [
    "core",
    "typecheck",
    "toolResultShape",
    "providerBoundary",
    "splitGuard",
    "sourceOfTruth",
    "loopReadiness",
    "saveSurface",
    "releaseToolContract",
    "releasePreflight",
    "productionRelease",
    "publicSanity",
    "liveSubmission",
  ]) {
    if (!update.verification?.[key]) blockers.push(`Plugin submission verification is missing ${key}.`);
  }

  const gates = Array.isArray(update.gates) ? update.gates : [];
  const expectedGates = [
    "owner-screenshot-review",
    "census-board-production-deploy",
    "plugin-production-deploy",
    "plugin-domain-verification",
    "real-host-g8",
  ];
  for (const id of expectedGates) {
    if (gates.find((candidate) => candidate?.id === id)?.required !== true) {
      blockers.push(`Plugin submission gate ${id} must remain required.`);
    }
  }
  const pluginDeployGate = gates.find((candidate) => candidate?.id === "plugin-production-deploy");
  if (
    pluginDeployGate?.status !== "passed" ||
    pluginDeployGate?.authorization !== "approved" ||
    !pluginDeployGate?.evidence?.includes(PLUGIN_SUBMISSION_RAILWAY_DEPLOYMENT)
  ) {
    blockers.push("Plugin production deploy must be passed with owner authorization and exact Railway evidence.");
  }
  if (gates.find((candidate) => candidate?.id === "plugin-domain-verification")?.status !== "pending") {
    blockers.push("Plugin domain verification must remain pending until the portal-issued token is live.");
  }
  if (gates.find((candidate) => candidate?.id === "real-host-g8")?.status !== "pending") {
    blockers.push("Real-host G8 must remain pending until real ChatGPT proof exists.");
  }
  if (
    update.deployment?.status !== "production_green" ||
    update.deployment?.sha !== TOWN_ANCHOR_DEPLOYED_SHA ||
    update.deployment?.implementationSha !== TOWN_ANCHOR_IMPLEMENTATION_SHA ||
    update.deployment?.railwayDeploymentId !== TOWN_ANCHOR_RAILWAY_DEPLOYMENT ||
    update.deployment?.releaseGatesPassed !== 14 ||
    update.deployment?.publicSanityChecksPassed !== 3 ||
    update.deployment?.workerDeployed !== true
  ) {
    blockers.push("Plugin submission must record the exact green Railway release, implementation SHA, 14/14 release gates, 3/3 public sanity checks, and the deployed worker.");
  }
}

function checkPriorSelectorArtifact(artifact) {
  if (!artifact) return;
  if (artifact.update !== "postalpha-0.43e-engine-quality-axis-review-next-target-selection") {
    blockers.push(`Prior selector artifact update must be postalpha-0.43e-engine-quality-axis-review-next-target-selection; got ${artifact.update ?? "missing"}.`);
  }
  if (artifact.ok !== true) {
    blockers.push(`Selector artifact must have ok: true; got ${String(artifact.ok)}.`);
  }
  if (artifact.selectedAxis !== "hidden_second_district_readiness") {
    blockers.push(`0.43E selector artifact selectedAxis must be hidden_second_district_readiness; got ${artifact.selectedAxis ?? "missing"}.`);
  }
  if (artifact.recommendedNextQuest !== EXPECTED_SELECTOR_NEXT_QUEST) {
    blockers.push(`Selector artifact recommendedNextQuest must be ${EXPECTED_SELECTOR_NEXT_QUEST}; got ${artifact.recommendedNextQuest ?? "missing"}.`);
  }
}

function checkHiddenProofArtifacts(readiness, cutline, review) {
  if (!readiness || !cutline || !review) return;
  const trace = readiness.aggregate?.sourceToSceneTrace;
  if (readiness.readyForPlayablePromotion !== false) {
    blockers.push("0.44E readiness aggregate must keep readyForPlayablePromotion false.");
  }
  if (readiness.evidenceStates?.visualPacket !== "passed") {
    blockers.push(`0.44E readiness visualPacket state must be passed; got ${readiness.evidenceStates?.visualPacket ?? "missing"}.`);
  }
  if (readiness.evidenceStates?.productProof !== "passed") {
    blockers.push(`0.44E readiness productProof state must be passed; got ${readiness.evidenceStates?.productProof ?? "missing"}.`);
  }
  if (trace?.visualPacket?.packetPath && !String(trace.visualPacket.packetPath).includes("artifacts\\second-district-visual-packets\\postalpha-0.44e-anaheim-hidden-proof")) {
    blockers.push(`0.44E visual packet path must point at the repo-local artifact; got ${trace.visualPacket.packetPath}.`);
  }
  if (trace?.visualPacket?.publicPlayable !== false || trace?.productProof?.publicPlayable !== false) {
    blockers.push("0.44E visual/product proof must keep publicPlayable false.");
  }
  if (cutline.outcome !== "BLOCK_PROMOTION") {
    blockers.push(`0.44E owner cutline must remain BLOCK_PROMOTION; got ${cutline.outcome ?? "missing"}.`);
  }
  if (review.outcome !== "HIDDEN_DRAFT_ONLY" || review.publicPlayable !== false || review.promotionReady !== false) {
    blockers.push("0.44E visual review must remain HIDDEN_DRAFT_ONLY with promotionReady/publicPlayable false.");
  }
}

function checkOwnerGateSelector(selectorArtifact) {
  if (!selectorArtifact) return;
  if (selectorArtifact.update !== OWNER_GATE_UPDATE) {
    blockers.push(`0.45E selector artifact update must be ${OWNER_GATE_UPDATE}; got ${selectorArtifact.update ?? "missing"}.`);
  }
  if (selectorArtifact.ok !== true) {
    blockers.push(`0.45E selector artifact must have ok true; got ${String(selectorArtifact.ok)}.`);
  }
  if (selectorArtifact.selectedAxis !== OWNER_GATE_SELECTED_AXIS) {
    blockers.push(`0.45E selector selectedAxis must be ${OWNER_GATE_SELECTED_AXIS}; got ${selectorArtifact.selectedAxis ?? "missing"}.`);
  }
  if (selectorArtifact.decision !== "REQUEST_OWNER_REVIEW") {
    blockers.push(`0.45E selector decision must be REQUEST_OWNER_REVIEW; got ${selectorArtifact.decision ?? "missing"}.`);
  }
  if (selectorArtifact.recommendedNextQuest !== OWNER_GATE_NEXT_QUEST) {
    blockers.push(`0.45E selector recommendedNextQuest must be ${OWNER_GATE_NEXT_QUEST}; got ${selectorArtifact.recommendedNextQuest ?? "missing"}.`);
  }
  if (selectorArtifact.evidence?.readyForPlayablePromotion !== false || selectorArtifact.evidence?.ownerCutlineOutcome !== "BLOCK_PROMOTION") {
    blockers.push("0.45E selector must keep readyForPlayablePromotion false and ownerCutlineOutcome BLOCK_PROMOTION.");
  }
  const publicSpike = selectorArtifact.candidateScores?.controlled_public_second_district_spike?.score;
  if (publicSpike !== 0) {
    blockers.push(`0.45E selector must score controlled public second-district spike as 0; got ${publicSpike ?? "missing"}.`);
  }
}

function checkNextQuestAlignment(update, nextQuests, releaseLadder) {
  if (!update?.recommendedNextQuest) return;
  const expectedQuest =
    update.id === CENSUS_BOARD_UPDATE || update.id === PLUGIN_SUBMISSION_UPDATE
      ? CENSUS_BOARD_NEXT_QUEST_TITLE
      : update.recommendedNextQuest;
  if (!nextQuests.includes(expectedQuest)) {
    blockers.push(`docs/NEXT_QUESTS.md does not include current recommended next quest: ${update.recommendedNextQuest}.`);
  }
  const ladderNext = extractFirstNextUpdate(releaseLadder);
  const normalizedLadderNext = normalizeQuestTitle(ladderNext);
  if (normalizedLadderNext && normalizedLadderNext !== expectedQuest) {
    blockers.push(`Release ladder first next update does not match ${update.recommendedNextQuest}; got ${ladderNext}.`);
  }
}

function checkIntegrationReleaseDocs(update, docs) {
  let requiredSnippetsByFile = null;
  let label = "";

  if (update?.id === INTEGRATION_UPDATE) {
    label = "0.58I release-decision";
    requiredSnippetsByFile = {
      "STATE.md": [
        "codex/integrate-hosted-clawd-fable-058e",
        "0.58I Integration Canonicalization / Release Decision Packet",
        "HUMAN_VISUAL_GATE_FIRST",
        INTEGRATION_NEXT_QUEST,
        HOSTED_CLAWD_NEXT_QUEST,
        "hosted-clawd-fable-integration",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current local-green integration slice",
        "0.58I Integration Canonicalization / Release Decision Packet",
        "0.58J Human Visual Gate / Deploy Readiness Decision",
        "The active manifest is now the 0.58I integration packet",
        "No deploy, DB, auth, Stripe, persistence",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 195",
        "0.58I Integration Canonicalization / Release Decision Packet",
        "HUMAN_VISUAL_GATE_FIRST",
        "hosted-clawd-fable-integration",
        "No deploy, no push, no DB/auth/Stripe/persistence",
      ],
      "docs/DECISIONS.md": [
        "## Decision 080",
        "Integrated Hosted Clawd plus Fable branch needs a human visual gate before deploy",
        "codex/integrate-hosted-clawd-fable-058e",
        "0.58J Human Visual Gate / Deploy Readiness Decision",
        "0.59H Hosted Clawd Storage/Auth Decision Packet",
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current integration note (2026-07-05)",
        "codex/integrate-hosted-clawd-fable-058e",
        "The active manifest is now the 0.58I integration packet",
        "Hosted Clawd is reopened only as a gated scaffold",
        "0.59H storage/auth decision",
      ],
    };
  }

  if (update?.id === SETUP_UI_UPDATE) {
    label = "0.58J setup-ui";
    requiredSnippetsByFile = {
      "STATE.md": [
        "codex/integrate-hosted-clawd-fable-058e",
        "0.58J Hosted Clawd Setup UI Port",
        "SETUP_CONSOLE_PORTED_GATES_STAY_CLOSED",
        "Superior grey setup console",
        SETUP_UI_NEXT_QUEST,
        HOSTED_CLAWD_NEXT_QUEST,
        "hosted-clawd-fable-integration",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current local-green setup UI slice",
        "0.58J Hosted Clawd Setup UI Port",
        "Superior grey setup console",
        SETUP_UI_NEXT_QUEST,
        "No deploy, DB, auth, Stripe, persistence",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 196",
        "0.58J Hosted Clawd Setup UI Port",
        "SETUP_CONSOLE_PORTED_GATES_STAY_CLOSED",
        "Superior grey setup console",
        "No deploy, no DB/auth/Stripe/persistence",
      ],
      "docs/DECISIONS.md": [
        "## Decision 081",
        "Port Superior grey setup console into Hosted Clawd as UI-only setup",
        "SETUP_CONSOLE_PORTED_GATES_STAY_CLOSED",
        SETUP_UI_NEXT_QUEST,
        "0.59H Hosted Clawd Storage/Auth Decision Packet",
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current setup UI note (2026-07-05)",
        "0.58J Hosted Clawd Setup UI Port",
        "Superior grey setup console",
        "No persistence, money, auth, or public paid claims",
        SETUP_UI_NEXT_QUEST,
      ],
    };
  }

  if (update?.id === STORAGE_AUTH_UPDATE) {
    label = "0.59H storage-auth";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.59H Hosted Clawd Storage/Auth Decision Packet",
        "DB_AUTH_PREP_APPROVED_STRIPE_STAYS_CLOSED",
        STORAGE_AUTH_NEXT_QUEST,
        "Railway Postgres",
        "OAuth/OIDC account linking",
        "Stripe remains closed",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current DB/Auth prep slice",
        "0.59H Hosted Clawd Storage/Auth Decision Packet",
        "DB_AUTH_PREP_APPROVED_STRIPE_STAYS_CLOSED",
        STORAGE_AUTH_NEXT_QUEST,
        "Fable save-state UX",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 198",
        "0.59H Hosted Clawd Storage/Auth Decision Packet",
        "Railway Postgres",
        "OAuth/OIDC account linking",
        "Stripe remains downstream",
      ],
      "docs/DECISIONS.md": [
        "## Decision 083",
        "Open DB/Auth preparation, keep Stripe downstream",
        "Railway Postgres",
        "OAuth/OIDC account linking",
        STORAGE_AUTH_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current DB/Auth note (2026-07-05)",
        "0.59H Hosted Clawd Storage/Auth Decision Packet",
        "Railway Postgres",
        STORAGE_AUTH_NEXT_QUEST,
        "Stripe/money",
      ],
    };
  }

  if (update?.id === PERSISTENCE_FOUNDATION_UPDATE) {
    label = "0.60H persistence-foundation";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.60H Hosted Clawd persistence foundation",
        "PERSISTENCE_FOUNDATION_LOCAL_GREEN_STRIPE_CLOSED",
        PERSISTENCE_FOUNDATION_NEXT_QUEST,
        "Railway Postgres",
        "OAuth/OIDC account linking",
        "Stripe stays closed",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current persistence foundation slice",
        "0.60H Persistence Foundation",
        "PERSISTENCE_FOUNDATION_LOCAL_GREEN_STRIPE_CLOSED",
        PERSISTENCE_FOUNDATION_NEXT_QUEST,
        "paid neighborhood operator",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 199",
        "0.60H Persistence Foundation",
        "owner-protected Hosted Clawd persistence",
        "Stripe stays closed",
      ],
      "docs/DECISIONS.md": [
        "## Decision 084",
        "Persist Hosted Clawd ownership before billing",
        "Railway Postgres",
        "OAuth/OIDC account linking",
        PERSISTENCE_FOUNDATION_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current persistence note (2026-07-05)",
        "0.60H Persistence Foundation",
        "paid neighborhood operator",
        PERSISTENCE_FOUNDATION_NEXT_QUEST,
        "Stripe/money",
      ],
    };
  }

  if (update?.id === SAVE_UX_UPDATE) {
    label = "0.61H save-ux";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.61H Hosted Clawd invite beta save UX",
        "MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED",
        SAVE_UX_NEXT_QUEST,
        "Superior grey setup console plus claymation save slots",
        "Stripe stays closed",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current save UX slice",
        "0.61H Invite Beta Save UX",
        "MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED",
        SAVE_UX_NEXT_QUEST,
        "paid neighborhood operator",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 200",
        "0.61H Invite Beta Save UX",
        "claymation save slots",
        "Stripe stays closed",
      ],
      "docs/DECISIONS.md": [
        "## Decision 085",
        "Keep saved state in the map, not a dashboard",
        "Superior grey setup console plus claymation save slots",
        SAVE_UX_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current save UX note (2026-07-05)",
        "0.61H Invite Beta Save UX",
        "Clawdbot",
        SAVE_UX_NEXT_QUEST,
        "Stripe/money",
      ],
    };
  }

  if (update?.id === STRIPE_BILLING_UPDATE) {
    label = "0.62H stripe-test-billing";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.62H Hosted Clawd Stripe test billing",
        "STRIPE_TEST_BILLING_WEBHOOK_GATED",
        STRIPE_BILLING_NEXT_QUEST,
        "Stripe webhook",
        "dark maroon clay",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current Stripe test billing slice",
        "0.62H Stripe Test Billing",
        "STRIPE_TEST_BILLING_WEBHOOK_GATED",
        STRIPE_BILLING_NEXT_QUEST,
        "ChatGPT App",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 201",
        "0.62H Stripe Test Billing",
        "webhook replay guard",
        "dark maroon clay",
      ],
      "docs/DECISIONS.md": [
        "## Decision 086",
        "Stripe return is not access",
        "STRIPE_TEST_BILLING_WEBHOOK_GATED",
        STRIPE_BILLING_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current Stripe test billing note (2026-07-05)",
        "0.62H Stripe Test Billing",
        "Stripe webhook",
        "public paid claims remain closed",
      ],
    };
  }

  if (update?.id === PROTECTED_TOOL_GATE_UPDATE) {
    label = "0.63H protected-tool-gate";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.63H Hosted Clawd protected tool gate",
        "PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION",
        PROTECTED_TOOL_GATE_NEXT_QUEST,
        "Client-supplied `subscriptionStatus` is not trusted",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current protected tool gate slice",
        "0.63H Protected Hosted Clawd Tool Gate",
        "PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION",
        PROTECTED_TOOL_GATE_NEXT_QUEST,
        "Client-supplied `subscriptionStatus`",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 202",
        "0.63H Protected Hosted Clawd Tool Gate",
        "client-supplied subscriptionStatus is not trusted",
      ],
      "docs/DECISIONS.md": [
        "## Decision 087",
        "Protected paid writes require stored subscription state",
        "PROTECTED_PAID_WRITES_REQUIRE_WEBHOOK_CONFIRMED_SUBSCRIPTION",
        PROTECTED_TOOL_GATE_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current protected tool gate note (2026-07-05)",
        "0.63H Protected Hosted Clawd Tool Gate",
        "repository webhook state",
      ],
    };
  }

  if (update?.id === SAVED_READ_SURFACE_UPDATE) {
    label = "0.64H saved-read-surface";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.64H Hosted Clawd saved read surface",
        "SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS",
        SAVED_READ_SURFACE_NEXT_QUEST,
        "0.64H stub audit",
        "creates no rows",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current saved read surface slice",
        "0.64H Saved Hosted Clawd Read Surface",
        "SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS",
        SAVED_READ_SURFACE_NEXT_QUEST,
        "docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md",
        "Reads do not upsert users",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 203",
        "0.64H Saved Hosted Clawd Read Surface",
        "read-only saved shelf",
        "Rewired `refresh_status`",
      ],
      "docs/DECISIONS.md": [
        "## Decision 088",
        "Saved reads stay owner-scoped and HTTP-only",
        "SAVED_READS_OWNER_SCOPED_NO_NEW_TOOLS",
        "docs/HOSTED_CLAWD_STUB_AUDIT_0.64H.md",
        SAVED_READ_SURFACE_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current saved read surface note (2026-07-05)",
        "0.64H Saved Hosted Clawd Read Surface",
        "owner-scoped saved state",
      ],
    };
  }

  if (update?.id === BROWSER_PROOF_UPDATE) {
    label = "0.65H browser-proof";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.65H Hosted Clawd browser proof",
        "BROWSER_PROVES_ACCOUNT_LINK_REQUIRED_NO_WIDGET_TOKEN",
        BROWSER_PROOF_NEXT_QUEST,
        "401 OAuth resource challenge",
        "44px touch targets",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current browser proof slice",
        "0.65H Hosted Clawd Browser Proof",
        "BROWSER_PROVES_ACCOUNT_LINK_REQUIRED_NO_WIDGET_TOKEN",
        BROWSER_PROOF_NEXT_QUEST,
        "ChatGPT account linking",
        "44px touch targets",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 205",
        "0.65H Hosted Clawd Browser Proof",
        "BROWSER_PROVES_ACCOUNT_LINK_REQUIRED_NO_WIDGET_TOKEN",
        "44px touch targets",
        "dialog semantics",
      ],
      "docs/DECISIONS.md": [
        "## Decision 091",
        "Browser proof before saved memory claim",
        "BROWSER_PROVES_ACCOUNT_LINK_REQUIRED_NO_WIDGET_TOKEN",
        BROWSER_PROOF_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current browser proof note (2026-07-05)",
        "0.65H Hosted Clawd Browser Proof",
        "401 OAuth resource challenge",
        "44px touch targets",
      ],
    };
  }

  if (update?.id === MOBILE_HARDENING_UPDATE) {
    label = "0.66H mobile-interaction-hardening";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.66H Mobile Interaction Hardening",
        "RETAINED_GRAPH_BOTTOM_SHEET_SPLIT_PAYLOAD",
        MOBILE_HARDENING_NEXT_QUEST,
        "zero scene rebuilds",
        "bottom-sheet save chrome",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current mobile hardening slice",
        "0.66H Mobile Interaction Hardening",
        "RETAINED_GRAPH_BOTTOM_SHEET_SPLIT_PAYLOAD",
        MOBILE_HARDENING_NEXT_QUEST,
        "Retain Pixi scene graphs",
        "payload diet",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 206",
        "0.66H Mobile Interaction Hardening",
        "RETAINED_GRAPH_BOTTOM_SHEET_SPLIT_PAYLOAD",
        "Desktop scripted pan rebuild delta: 0",
        "Eager JS: 210,920 bytes",
      ],
      "docs/DECISIONS.md": [
        "## Decision 092",
        "Map interaction is retained graph, saved state is bottom chrome",
        "RETAINED_GRAPH_BOTTOM_SHEET_SPLIT_PAYLOAD",
        MOBILE_HARDENING_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current mobile hardening note (2026-07-05)",
        "0.66H Mobile Interaction Hardening",
        "bottom map chrome",
        "eager JS under 400KB",
      ],
    };
  }

  if (update?.id === PRODUCT_FEEL_UPDATE) {
    label = "0.67H product-feel-cleanup";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.67H Product Feel Cleanup",
        "GRAPHICS_CHROME_DEMOTED_OBJECTS_FIRST",
        PRODUCT_FEEL_NEXT_QUEST,
        "desktop ambient label cap",
        "off-facade pins",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current product feel cleanup slice",
        "0.67H Product Feel Cleanup",
        "GRAPHICS_CHROME_DEMOTED_OBJECTS_FIRST",
        PRODUCT_FEEL_NEXT_QUEST,
        "Mobile labels are selected/hovered only",
        "Fable edited the renderer",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 207",
        "0.67H Product Feel Cleanup",
        "GRAPHICS_CHROME_DEMOTED_OBJECTS_FIRST",
        "Fable renderer pass",
        "graphics-cleanup-desktop-1280x720.png",
      ],
      "docs/DECISIONS.md": [
        "## Decision 093",
        "Visual chrome yields to object identity",
        "GRAPHICS_CHROME_DEMOTED_OBJECTS_FIRST",
        PRODUCT_FEEL_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current product feel cleanup note (2026-07-05)",
        "0.67H Product Feel Cleanup",
        "labels, halos, pins, props, and actors are annotation layers",
        PRODUCT_FEEL_NEXT_QUEST,
      ],
    };
  }

  if (update?.id === NATIONAL_GENERATION_UPDATE) {
    label = "0.70H deterministic-generated-district-specs";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.70H Deterministic Generated District Specs",
        "DETERMINISTIC_DISTRICT_SPECS_BEFORE_LOCAL_PROMOTION",
        NATIONAL_GENERATION_NEXT_QUEST,
        "provider-normalized local anchors",
        "Railway should compile/cache scene packets",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current generated district slice",
        "0.70H Deterministic Generated District Specs",
        "DETERMINISTIC_DISTRICT_SPECS_BEFORE_LOCAL_PROMOTION",
        NATIONAL_GENERATION_NEXT_QUEST,
        "Cook IL, Miami-Dade FL, Maricopa AZ, and Riverside CA",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 210",
        "0.70H Deterministic Generated District Specs",
        "DETERMINISTIC_DISTRICT_SPECS_BEFORE_LOCAL_PROMOTION",
        "generated-district-specs.json",
        "Railway is not in the frame loop",
      ],
      "docs/DECISIONS.md": [
        "## Decision 096",
        "Deterministic specs are not local promotion",
        "DETERMINISTIC_DISTRICT_SPECS_BEFORE_LOCAL_PROMOTION",
        NATIONAL_GENERATION_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current generated district note (2026-07-06)",
        "0.70H Deterministic Generated District Specs",
        "Railway should compile/cache scene packets",
        NATIONAL_GENERATION_NEXT_QUEST,
      ],
    };
  }

  if (update?.id === SCENE_PACKET_UPDATE) {
    label = "0.71H scene-packet-service-boundary";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.71H Scene Packet Service Boundary / Railway Cache Plan",
        "GENERATED_DRAFT_PACKETS_META_ONLY_NO_FRAME_LOOP",
        SCENE_PACKET_NEXT_QUEST,
        "generatedDraftScene",
        "Railway is not in the frame loop",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current scene packet service-boundary slice",
        "0.71H Scene Packet Service Boundary / Railway Cache Plan",
        "GENERATED_DRAFT_PACKETS_META_ONLY_NO_FRAME_LOOP",
        SCENE_PACKET_NEXT_QUEST,
        "_meta.generatedDraftScene",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 211",
        "0.71H Scene Packet Service Boundary / Railway Cache Plan",
        "GENERATED_DRAFT_PACKETS_META_ONLY_NO_FRAME_LOOP",
        "generated-draft-scene-packet.json",
        "Railway is not in the frame loop",
      ],
      "docs/DECISIONS.md": [
        "## Decision 097",
        "Generated drafts travel through meta, not the frame loop",
        "GENERATED_DRAFT_PACKETS_META_ONLY_NO_FRAME_LOOP",
        SCENE_PACKET_NEXT_QUEST,
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current scene packet service note (2026-07-06)",
        "0.71H Scene Packet Service Boundary / Railway Cache Plan",
        "generated draft scene packets travel through `_meta`",
        SCENE_PACKET_NEXT_QUEST,
      ],
    };
  }

  if (update?.id === BACKEND_SPINE_UPDATE) {
    label = "0.72B redis-scene-packet-backend-spine";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.72B Redis Scene Packet Cache / Job Spine",
        "REDIS_PACKET_SPINE_NOT_RENDER_LOOP",
        BACKEND_SPINE_NEXT_QUEST,
        "Railway production requires Redis",
        "Railway is not in the frame loop",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current backend production slice",
        "0.72B Redis Scene Packet Cache / Job Spine",
        "REDIS_PACKET_SPINE_NOT_RENDER_LOOP",
        BACKEND_SPINE_NEXT_QUEST,
        "queued-safe",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 212",
        "0.72B Redis Scene Packet Cache / Job Spine",
        "REDIS_PACKET_SPINE_NOT_RENDER_LOOP",
        "production-backend-spine.json",
        "Railway dependency in browser pan/zoom",
      ],
      "docs/DECISIONS.md": [
        "## Decision 068",
        "Redis caches scene packets, not map interaction",
        "REDIS_PACKET_SPINE_NOT_RENDER_LOOP",
      ],
      "docs/PRODUCT_SPEC_AND_GATES.md": [
        "Current backend production note (2026-07-06)",
        "0.72B Redis Scene Packet Cache / Job Spine",
        "Railway production requires Redis",
        BACKEND_SPINE_NEXT_QUEST,
      ],
    };
  }

  if (update?.id === CENSUS_BOARD_UPDATE || update?.id === PLUGIN_SUBMISSION_UPDATE) {
    label = update.id === PLUGIN_SUBMISSION_UPDATE ? "0.78-1V plugin submission release candidate" : "0.78-1V Census county board certification";
    requiredSnippetsByFile = {
      "STATE.md": [
        "0.78-1V Census County Board Product + Certification Gate",
        "CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE",
        CENSUS_BOARD_NEXT_QUEST_TITLE,
        "owner-approved",
      ],
      "docs/NEXT_QUESTS.md": [
        "Current 0.78-1V Census county board gate",
        "CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE",
        CENSUS_BOARD_NEXT_QUEST_TITLE,
        "atlasGeoBoard=1",
      ],
      "docs/BUILD_LOG.md": [
        "## Entry 092",
        "0.78-1V Census county board product + certification gate",
        "CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE",
        "full projected terrain/water footprint framed in all 12 first frames",
      ],
      "docs/DECISIONS.md": [
        "## Decision 103",
        "Census county boards stay dark until product certification and owner review",
        "CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE",
        CENSUS_BOARD_NEXT_QUEST_TITLE,
      ],
    };
  }

  if (!requiredSnippetsByFile) return;

  for (const [path, snippets] of Object.entries(requiredSnippetsByFile)) {
    const text = docs[docKey(path)] ?? "";
    for (const snippet of snippets) {
      if (!includesSnippet(text, snippet)) {
        blockers.push(`${path} missing ${label} wording: ${snippet}`);
      }
    }
  }

  const staleManifestClaims = [
    ["docs/NEXT_QUESTS.md", docs.nextQuests],
    ["docs/PRODUCT_SPEC_AND_GATES.md", docs.productSpec],
  ];
  for (const [path, text] of staleManifestClaims) {
    if (/current-update\.json` (?:stays|remains)(?: at)? `0\.45E`/i.test(text)) {
      blockers.push(`${path} still claims the active current-update manifest stays at 0.45E.`);
    }
    if (/artifacts\/current-update\.json`\s*(?:stays|remains)(?: at)? `0\.45E`/i.test(text)) {
      blockers.push(`${path} still claims artifacts/current-update.json stays at 0.45E.`);
    }
  }
}

function docKey(path) {
  return {
    "STATE.md": "state",
    "docs/NEXT_QUESTS.md": "nextQuests",
    "docs/BUILD_LOG.md": "buildLog",
    "docs/DECISIONS.md": "decisions",
    "docs/PRODUCT_SPEC_AND_GATES.md": "productSpec",
  }[path];
}

function includesSnippet(text, snippet) {
  return normalizeWhitespace(text).includes(normalizeWhitespace(snippet));
}

function normalizeWhitespace(value) {
  return String(value).replace(/\s+/g, " ").trim();
}

function extractFirstNextUpdate(releaseLadder) {
  const nextSection = releaseLadder.split("## Next Updates")[1] ?? "";
  const match = nextSection.match(/^###\s+(.+)$/m);
  return match?.[1]?.trim() ?? "";
}

function normalizeQuestTitle(title) {
  return title.replace(/^Post-Alpha\s+/, "").replace(/^Pre-Alpha\s+/, "").replace(/\s+-\s+/, " ").trim();
}

function checkAgentsDoctrine(agents) {
  const requiredSnippets = [
    "Atlas is a ChatGPT App and voxel county-to-scene engine",
    "Current phase is Engine Beta, not Paid Beta",
    "Riverside/Eastvale is the only public playable district",
    "Anaheim/Ontario remain hidden and non-public until owner-gate approval",
    "Hosted Clawd DB/Auth persistence is now local-green only for owner-protected rows",
    "The human explicitly reopened DB/Auth preparation on 2026-07-05",
    "If the human says \"continue,\" continue only the named next quest",
    "Stripe/money is open only for test-mode billing behind webhook-confirmed state",
    "The owner-gate ladder is parked at `0.45E Owner Gate Cutline / Next Axis Selection`",
    "Default owner-gate slice after 0.45E remains `0.46E Owner Gate Review Packet`",
    "Do not start a public Anaheim spike unless the cutline changes to `APPROVE_CONTROLLED_PUBLIC_SPIKE`",
    "Keep MCP tool surface stable",
    "Keep `structuredContent` concise",
    "Put large widget-only or renderer-only scene data in `_meta`",
    "Widget renders from server/tool state; it should not require the transcript to carry giant voxel arrays",
    "Do not add new MCP tools casually",
  ];
  if (currentUpdate?.id === CENSUS_BOARD_UPDATE || currentUpdate?.id === PLUGIN_SUBMISSION_UPDATE) {
    requiredSnippets.push(
      "Current human-directed production-green slice is `0.78-1V Census County Board Product + Certification Gate`",
      "0.78-1V decision is `CENSUS_BOARD_CERTIFIED_FLAG_DARK_UNTIL_OWNER_GATE`",
      "The next code slice is `0.78-2 Real Town Anchors` only after real-host G8 is recorded",
      "Use `national-generation-contract` for strict split checks on the current real-geography branch",
    );
  } else if (currentUpdate?.id === BACKEND_SPINE_UPDATE) {
    requiredSnippets.push(
      "Current human-directed local-green slice is `0.72B Redis Scene Packet Cache / Job Spine`",
      "0.72B decision is `REDIS_PACKET_SPINE_NOT_RENDER_LOOP`",
      "Default next slice after 0.72B is `0.72H Fable Generated Draft Visual Quality Gate`",
      "Use `national-generation-contract` for strict split checks on the 0.72B Redis scene packet backend spine branch",
    );
  }
  for (const snippet of requiredSnippets) {
    if (!includesSnippet(agents, snippet)) {
      blockers.push(`AGENTS.md missing required doctrine: ${snippet}`);
    }
  }
}

function checkReadmeDrift(readme) {
  if (!readme.includes("docs/NEXT_QUESTS.md") || !readme.includes("artifacts/current-update.json")) {
    blockers.push("README.md must defer current implementation direction to docs/NEXT_QUESTS.md and artifacts/current-update.json.");
  }
  const staleQuestPatterns = [/Quest E6 is complete/i, /Quest E6\.6 shifts/i, /Current Quest[\s\S]{0,600}E6\.6/i];
  for (const pattern of staleQuestPatterns) {
    if (pattern.test(readme)) {
      blockers.push(`README.md still contains obsolete active quest wording matching ${pattern}.`);
    }
  }
}

function checkToolSurface(toolContracts, serverIndex) {
  const docTools = extractDocumentedAlphaTools(toolContracts);
  const serverTools = extractServerRegisteredTools(serverIndex);
  const missingFromDocs = EXPECTED_TOOLS.filter((tool) => !docTools.includes(tool));
  const missingFromServer = EXPECTED_TOOLS.filter((tool) => !serverTools.includes(tool));
  const extraDocs = docTools.filter((tool) => !EXPECTED_TOOLS.includes(tool));
  const extraServer = serverTools.filter((tool) => !EXPECTED_TOOLS.includes(tool));
  if (missingFromDocs.length) blockers.push(`docs/TOOL_CONTRACTS.md missing active tools: ${missingFromDocs.join(", ")}.`);
  if (missingFromServer.length) blockers.push(`server/src/index.ts missing active tools: ${missingFromServer.join(", ")}.`);
  if (extraDocs.length) blockers.push(`docs/TOOL_CONTRACTS.md exposes unexpected active tools: ${extraDocs.join(", ")}.`);
  if (extraServer.length) blockers.push(`server/src/index.ts registers unexpected public tools: ${extraServer.join(", ")}.`);
}

function extractDocumentedAlphaTools(toolContracts) {
  const exposed = toolContracts.split("## Future paid/hosted tools")[0] ?? toolContracts;
  return [...exposed.matchAll(/^###\s+([a-z_]+)\s*$/gm)].map((match) => match[1]);
}

function extractServerRegisteredTools(serverIndex) {
  return [...serverIndex.matchAll(/registerAppTool\(\s*server,\s*"([^"]+)"/g)].map((match) => match[1]);
}

function checkPublicCandidateClaims(files) {
  const candidatePattern = /\b(Anaheim|Ontario)\b/i;
  const publicClaimPattern = /\b(publicPlayable:\s*true|public playable approved|public switcher state|public route exposure|public state active|playable public surface)\b/i;
  const safeBoundaryPattern = /\b(no|not|non-public|blocked|blocks|false|until|unless|without|do not|hidden)\b/i;
  for (const [path, text] of Object.entries(files)) {
    const lines = text.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (candidatePattern.test(line) && publicClaimPattern.test(line) && !safeBoundaryPattern.test(line)) {
        blockers.push(`${path}:${index + 1} contains a public Anaheim/Ontario playable claim: ${line.trim()}`);
      }
    }
  }
}

function checkDbDrift(packageJson, serverIndex, envExample) {
  if (
    currentUpdate?.id === STRIPE_BILLING_UPDATE ||
    currentUpdate?.id === PROTECTED_TOOL_GATE_UPDATE ||
    currentUpdate?.id === SAVED_READ_SURFACE_UPDATE ||
    currentUpdate?.id === BROWSER_PROOF_UPDATE ||
    currentUpdate?.id === MOBILE_HARDENING_UPDATE ||
    currentUpdate?.id === PRODUCT_FEEL_UPDATE ||
    currentUpdate?.id === NATIONAL_GENERATION_UPDATE ||
    currentUpdate?.id === SCENE_PACKET_UPDATE ||
    currentUpdate?.id === BACKEND_SPINE_UPDATE ||
    currentUpdate?.id === CENSUS_BOARD_UPDATE ||
    currentUpdate?.id === PLUGIN_SUBMISSION_UPDATE
  ) {
    checkStripeBillingDbEnvelope(packageJson, serverIndex, envExample);
    return;
  }
  if (currentUpdate?.id === PERSISTENCE_FOUNDATION_UPDATE || currentUpdate?.id === SAVE_UX_UPDATE) {
    checkPersistenceFoundationDbEnvelope(packageJson, serverIndex, envExample);
    return;
  }
  const dependencies = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };
  const dbDeps = ["pg", "postgres", "prisma", "@prisma/client", "drizzle-orm", "mysql2", "better-sqlite3", "sqlite3"];
  const presentDbDeps = dbDeps.filter((dep) => Object.prototype.hasOwnProperty.call(dependencies, dep));
  if (presentDbDeps.length) {
    blockers.push(`DB client dependencies are present but DB implementation remains parked: ${presentDbDeps.join(", ")}.`);
  }
  if (/\bDATABASE_URL\b/.test(serverIndex) || /\bDATABASE_URL\b/.test(envExample)) {
    blockers.push("DATABASE_URL requirement appears in runtime server or env template while DB persistence is parked.");
  }
  if (existsSync(resolve("migrations")) && hasFiles(resolve("migrations"))) {
    blockers.push("migrations/ exists with files while DB scene persistence implementation is parked.");
  }
}

function checkPersistenceFoundationDbEnvelope(packageJson, serverIndex, envExample) {
  const dependencies = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };
  for (const dep of ["pg", "jose", "@types/pg"]) {
    if (!Object.prototype.hasOwnProperty.call(dependencies, dep)) {
      blockers.push(`0.60H persistence foundation requires dependency ${dep}.`);
    }
  }
  for (const dep of ["stripe", "@stripe/stripe-js", "@supabase/supabase-js", "prisma", "@prisma/client", "drizzle-orm", "auth0", "next-auth"]) {
    if (Object.prototype.hasOwnProperty.call(dependencies, dep)) {
      blockers.push(`0.60H persistence foundation must not add blocked dependency ${dep}.`);
    }
  }
  for (const token of ["DATABASE_URL", "ATLAS_OIDC_ISSUER", "ATLAS_OIDC_AUDIENCE", "ATLAS_OIDC_JWKS_URL"]) {
    if (!envExample.includes(token)) {
      blockers.push(`0.60H .env.example is missing ${token}.`);
    }
  }
  if (!/\bDATABASE_URL\b/.test(serverIndex)) {
    blockers.push("0.60H server runtime must wire DATABASE_URL behind the persistence flag.");
  }
  if (!existsSync(resolve("migrations/hosted-clawd/001_persistence_foundation.sql"))) {
    blockers.push("0.60H migration file is missing.");
  }
}

function checkStripeBillingDbEnvelope(packageJson, serverIndex, envExample) {
  const dependencies = {
    ...(packageJson?.dependencies ?? {}),
    ...(packageJson?.devDependencies ?? {}),
  };
  for (const dep of ["pg", "jose", "@types/pg", "stripe"]) {
    if (!Object.prototype.hasOwnProperty.call(dependencies, dep)) {
      blockers.push(`0.62H Stripe billing requires dependency ${dep}.`);
    }
  }
  for (const dep of ["@stripe/stripe-js", "@supabase/supabase-js", "prisma", "@prisma/client", "drizzle-orm", "auth0", "next-auth"]) {
    if (Object.prototype.hasOwnProperty.call(dependencies, dep)) {
      blockers.push(`0.62H Stripe billing must not add blocked dependency ${dep}.`);
    }
  }
  for (const token of [
    "DATABASE_URL",
    "ATLAS_OIDC_ISSUER",
    "ATLAS_OIDC_AUDIENCE",
    "ATLAS_OIDC_JWKS_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_HOSTED_CLAWD_PRICE_ID",
    "APP_BASE_URL",
  ]) {
    if (!envExample.includes(token)) {
      blockers.push(`0.62H .env.example is missing ${token}.`);
    }
  }
  for (const token of ["DATABASE_URL", "readHostedClawdBillingConfig", "/api/stripe/webhook", "readRawBody"]) {
    if (!serverIndex.includes(token)) {
      blockers.push(`0.62H server runtime must include ${token}.`);
    }
  }
  if (!existsSync(resolve("migrations/hosted-clawd/001_persistence_foundation.sql"))) {
    blockers.push("0.62H migration base file 001 is missing.");
  }
  if (!existsSync(resolve("migrations/hosted-clawd/002_stripe_test_billing.sql"))) {
    blockers.push("0.62H Stripe billing migration file 002 is missing.");
  }
}

function hasFiles(directory) {
  return readdirSync(directory).some((entry) => {
    const absolute = resolve(directory, entry);
    const stats = statSync(absolute);
    return stats.isFile() || (stats.isDirectory() && hasFiles(absolute));
  });
}

function checkRepairScope() {
  const packageLockFiles = ["pnpm-lock.yaml", "package-lock.json", "yarn.lock"];
  for (const file of packageLockFiles) {
    if (existsSync(resolve(file)) && file !== "pnpm-lock.yaml") {
      warnings.push(`Non-pnpm lockfile exists: ${file}.`);
    }
  }
}
