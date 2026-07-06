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
const OWNER_GATE_INPUT_UPDATE = "postalpha-0.44e-hidden-second-district-visual-product-proof-packet";
const HOSTED_CLAWD_INPUT_UPDATE = "human-reopened-hosted-clawd-2026-07-05";
const INTEGRATION_INPUT_UPDATE = "postalpha-0.58h-hosted-clawd-scaffold+postalpha-0.58e-fable-prop-cleanup";
const SETUP_UI_INPUT_UPDATE = "postalpha-0.58i-integration-canonicalization-release-decision";
const STORAGE_AUTH_INPUT_UPDATE = "postalpha-0.58j-hosted-clawd-setup-ui-port+human-reopened-db-auth-2026-07-05";
const PERSISTENCE_FOUNDATION_INPUT_UPDATE = "postalpha-0.59h-hosted-clawd-storage-auth-decision+claude-fable-5";
const SAVE_UX_INPUT_UPDATE = PERSISTENCE_FOUNDATION_UPDATE;
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
const serverIndex = readText("server/src/index.ts", "server entrypoint");
const packageJson = readJson("package.json", "package manifest");
const envExample = existsSync(resolve(".env.example")) ? readText(".env.example", "env example") : "";

checkCurrentUpdate(currentUpdate);
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
checkRepairScope();

const result = {
  ok: blockers.length === 0,
  update:
    currentUpdate?.id === SETUP_UI_UPDATE
      ? "postalpha-0.58j-setup-ui-source-of-truth-drift-check"
      : currentUpdate?.id === STORAGE_AUTH_UPDATE
      ? "postalpha-0.59h-storage-auth-source-of-truth-drift-check"
      : currentUpdate?.id === PERSISTENCE_FOUNDATION_UPDATE
      ? "postalpha-0.60h-persistence-foundation-source-of-truth-drift-check"
      : currentUpdate?.id === SAVE_UX_UPDATE
      ? "postalpha-0.61h-save-ux-source-of-truth-drift-check"
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
  blockers.push(`artifacts/current-update.json id must be ${OWNER_GATE_UPDATE}, ${HOSTED_CLAWD_UPDATE}, ${INTEGRATION_UPDATE}, ${SETUP_UI_UPDATE}, ${STORAGE_AUTH_UPDATE}, ${PERSISTENCE_FOUNDATION_UPDATE}, or ${SAVE_UX_UPDATE}; got ${update.id ?? "missing"}.`);
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
  if (!nextQuests.includes(update.recommendedNextQuest)) {
    blockers.push(`docs/NEXT_QUESTS.md does not include current recommended next quest: ${update.recommendedNextQuest}.`);
  }
  const ladderNext = extractFirstNextUpdate(releaseLadder);
  const normalizedLadderNext = normalizeQuestTitle(ladderNext);
  if (normalizedLadderNext && normalizedLadderNext !== update.recommendedNextQuest) {
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
    "Current human-directed local-green slice is `0.61H Invite Beta Save UX`",
    "0.61H decision is `MAP_FIRST_SAVE_UX_LOCAL_GREEN_STRIPE_CLOSED`",
    "Default next slice after 0.61H is `0.62H Stripe Test Billing`",
    "Stripe/money remains downstream of 0.60H and 0.61H",
    "The owner-gate ladder is parked at `0.45E Owner Gate Cutline / Next Axis Selection`",
    "Default owner-gate slice after 0.45E remains `0.46E Owner Gate Review Packet`",
    "Do not start a public Anaheim spike unless the cutline changes to `APPROVE_CONTROLLED_PUBLIC_SPIKE`",
    "Keep MCP tool surface stable",
    "Keep `structuredContent` concise",
    "Put large widget-only or renderer-only scene data in `_meta`",
    "Widget renders from server/tool state; it should not require the transcript to carry giant voxel arrays",
    "Do not add new MCP tools casually",
    "Use `hosted-clawd-save-ux` for strict split checks on the 0.61H save UX branch",
  ];
  for (const snippet of requiredSnippets) {
    if (!agents.includes(snippet)) {
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
