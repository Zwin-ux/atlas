#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";

const OWNER_GATE_UPDATE = "postalpha-0.45e-owner-gate-cutline-next-axis-selection";
const HOSTED_CLAWD_UPDATE = "postalpha-0.58h-hosted-clawd-scaffold";
const OWNER_GATE_INPUT_UPDATE = "postalpha-0.44e-hidden-second-district-visual-product-proof-packet";
const HOSTED_CLAWD_INPUT_UPDATE = "human-reopened-hosted-clawd-2026-07-05";
const EXPECTED_SELECTOR_NEXT_QUEST = "0.44E Hidden Second-District Visual/Product Proof Packet";
const OWNER_GATE_NEXT_QUEST = "0.46E Owner Gate Review Packet";
const OWNER_GATE_SELECTED_AXIS = "owner_gate_review";
const HOSTED_CLAWD_NEXT_QUEST = "0.59H Hosted Clawd Storage/Auth Decision Packet";
const HOSTED_CLAWD_SELECTED_AXIS = "hosted_clawd_scaffold";
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
const readme = readText("README.md", "README");
const nextQuests = readText("docs/NEXT_QUESTS.md", "next quests");
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
  update: "postalpha-0.45e-source-of-truth-drift-check",
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
  blockers.push(`artifacts/current-update.json id must be ${OWNER_GATE_UPDATE} or ${HOSTED_CLAWD_UPDATE}; got ${update.id ?? "missing"}.`);
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
    "Hosted Clawd, Stripe, paid, DB persistence implementation, OAuth, XP, evidence, automation, reports, exports remain parked until explicitly reopened",
    "If the human says \"continue,\" continue only the named next quest",
    "Current human-directed local-green slice is `0.58H Hosted Clawd Rental Scaffold`",
    "Default next Hosted Clawd slice after 0.58H is `0.59H Hosted Clawd Storage/Auth Decision Packet`",
    "The owner-gate ladder is parked at `0.45E Owner Gate Cutline / Next Axis Selection`",
    "Default owner-gate slice after 0.45E remains `0.46E Owner Gate Review Packet`",
    "Do not start a public Anaheim spike unless the cutline changes to `APPROVE_CONTROLLED_PUBLIC_SPIKE`",
    "Keep MCP tool surface stable",
    "Keep `structuredContent` concise",
    "Put large widget-only or renderer-only scene data in `_meta`",
    "Widget renders from server/tool state; it should not require the transcript to carry giant voxel arrays",
    "Do not add new MCP tools casually",
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
