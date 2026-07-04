#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";

const UPDATE = "postalpha-0.43e-engine-quality-axis-review-next-target-selection";
const EXPECTED_INPUT_UPDATE = "postalpha-0.42e-provider-lookup-runtime-boundary-proof";
const PRIOR_SELECTOR_ARTIFACT = "artifacts/engine-quality-axis/postalpha-0.40e-next-target-selection.json";
const RUNTIME_PROOF_ARTIFACT = "artifacts/provider-runtime-boundary/postalpha-0.42e-runtime-proof-plan.json";
const ARTIFACT_NAME = "postalpha-0.43e-next-target-selection.json";

const args = parseArgs(process.argv.slice(2));
const blockers = [];
const warnings = [];

const currentUpdate = readJsonFile("artifacts/current-update.json", "current update manifest", blockers);
const finalizedInputUpdate = currentUpdate?.verification?.inputUpdate ?? currentUpdate?.inputUpdate ?? null;
const isExpectedInputUpdate = currentUpdate?.id === EXPECTED_INPUT_UPDATE;
const isFinalizedCurrentUpdate = currentUpdate?.id === UPDATE && finalizedInputUpdate === EXPECTED_INPUT_UPDATE;
if (!isExpectedInputUpdate && !isFinalizedCurrentUpdate) {
  blockers.push(
    `0.43E selector requires current-update id ${EXPECTED_INPUT_UPDATE}, or finalized ${UPDATE} with inputUpdate ${EXPECTED_INPUT_UPDATE}; got ${currentUpdate?.id ?? "missing"}.`,
  );
}
if (currentUpdate?.status !== "local_green") {
  blockers.push(`0.43E selector requires current-update status local_green; got ${currentUpdate?.status ?? "missing"}.`);
}

const priorSelector = readJsonFile(PRIOR_SELECTOR_ARTIFACT, "0.40E selector artifact", warnings);
const runtimeProof = readJsonFile(RUNTIME_PROOF_ARTIFACT, "0.42E runtime proof artifact", blockers);
const evidence = collectEvidence();
const currentMetrics = summarizeCurrentMetrics({ currentUpdate, priorSelector, runtimeProof, evidence });
const candidateScores = scoreCandidateAxes({ evidence, currentMetrics });
const blockedAxes = buildBlockedAxes(candidateScores);
const selected = chooseCandidate(candidateScores);

const result = {
  ok: blockers.length === 0,
  update: UPDATE,
  inputUpdate: isFinalizedCurrentUpdate ? EXPECTED_INPUT_UPDATE : currentUpdate?.id ?? null,
  selectedAxis: selected.axis,
  recommendedNextQuest: selected.recommendedNextQuest,
  selectedReason: selected.reasons,
  candidateScores,
  blockedAxes,
  requiredEvidence: requiredEvidenceFor(selected.axis),
  antiScope: [
    "no implementation work in 0.43E",
    "no renderer geometry changes",
    "no public UI redesign",
    "no MCP tool-list change",
    "no server route change",
    "no DB implementation, migration, or persistence",
    "no provider-created geometry or live provider-to-scene normalization",
    "no public Anaheim/Ontario switcher, route, or playable claim",
    "no Hosted Clawd, Stripe, OAuth, XP, evidence, automation, reports, or exports",
    "no cars, humans, props, panels, glows, or label crutches",
  ],
  currentMetrics,
  evidence: summarizeEvidence(evidence, runtimeProof),
  warnings,
  blockerCount: blockers.length,
  blockers,
};

if (args.outDir) {
  const outDir = resolve(args.outDir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, ARTIFACT_NAME), `${JSON.stringify(result, null, 2)}\n`);
}

console.log(args.jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;

function parseArgs(argv) {
  const parsed = { jsonOnly: false, outDir: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json-only") {
      parsed.jsonOnly = true;
    } else if (arg === "--out") {
      parsed.outDir = argv[++index] ?? "";
      if (!parsed.outDir) throw new Error("--out requires a directory.");
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/select-engine-quality-axis.mjs [--json-only] [--out <dir>]

Runs the 0.43E Engine Quality Axis selector and optionally writes ${ARTIFACT_NAME}.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function collectEvidence() {
  return {
    diagnostics: runJsonScript("scripts/debug-city-world-engine.mjs", ["--json-only"], "engine diagnostics"),
    publicObjectIdentity: runJsonScript(
      "scripts/verify-public-object-identity-civic-service.mjs",
      ["--json-only"],
      "0.39E public object identity verifier",
    ),
    objectKit: runJsonScript("scripts/verify-public-object-kit-prefab-palette.mjs", ["--json-only"], "public object-kit verifier"),
    mobileOcclusion: runJsonScript("scripts/verify-cityworld-mobile-occlusion.mjs", ["--json-only"], "mobile occlusion verifier"),
    plazaRow: runJsonScript("scripts/verify-plaza-row-focused-capture.mjs", ["--json-only"], "Plaza Row focused capture verifier"),
    secondDistrictReadiness: runOptionalJsonScript(
      "scripts/verify-second-district-readiness.mjs",
      ["--district", "anaheim-candidate", "--json-only"],
      "Anaheim readiness verifier",
    ),
    providerBoundary: runJsonScript("scripts/verify-provider-boundaries.mjs", ["--json-only"], "provider boundary verifier"),
    toolResultShape: runJsonScript("scripts/verify-tool-result-shape.mjs", ["--json-only"], "tool result shape verifier"),
  };
}

function runJsonScript(script, scriptArgs, label) {
  const output = execFileSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: process.env,
    maxBuffer: 1024 * 1024 * 20,
  });
  return parseJsonOutput(output, label);
}

function runOptionalJsonScript(script, scriptArgs, label) {
  if (!existsSync(resolve(script))) {
    warnings.push(`Missing optional ${label}: ${script}.`);
    return { ok: false, missing: true };
  }
  try {
    return runJsonScript(script, scriptArgs, label);
  } catch (error) {
    warnings.push(`${label} failed and was treated as non-ready: ${error instanceof Error ? error.message : String(error)}`);
    return { ok: false, failed: true };
  }
}

function parseJsonOutput(output, label) {
  const firstJson = output.indexOf("{");
  if (firstJson === -1) throw new Error(`${label} did not print JSON.`);
  return JSON.parse(output.slice(firstJson));
}

function readJsonFile(path, label, issueTarget) {
  const absolute = resolve(path);
  if (!existsSync(absolute)) {
    issueTarget.push(`Missing ${label}: ${path}.`);
    return null;
  }
  try {
    return JSON.parse(readFileSync(absolute, "utf8"));
  } catch (error) {
    issueTarget.push(`Invalid ${label}: ${path}. ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function summarizeCurrentMetrics({ currentUpdate, priorSelector, runtimeProof, evidence }) {
  const riverside = evidence.diagnostics?.summary?.riverside ?? {};
  const publicObject = evidence.publicObjectIdentity?.runtimeSummary ?? {};
  const objectKit = evidence.objectKit?.metricSummary ?? {};
  const mobile = findReport(evidence.mobileOcclusion, "riverside-mobile");
  const residentialDetail = findReport(evidence.mobileOcclusion, "riverside-residential-detail");
  const plaza = evidence.plazaRow?.focusedCapture ?? {};
  const readiness = evidence.secondDistrictReadiness ?? {};
  const blockerGroups = readiness.aggregate?.blockerGroups ?? {};
  const runtime = runtimeProof?.runtimeEvidence ?? {};

  return {
    currentUpdateId: currentUpdate?.id ?? null,
    currentUpdateStatus: currentUpdate?.status ?? null,
    priorSelectorAxis: priorSelector?.selectedAxis ?? null,
    priorSelectorRecommendation: priorSelector?.recommendedNextQuest ?? null,
    providerRuntimeProof: {
      status: runtimeProof?.status ?? null,
      restCacheMissThenHit: Boolean(runtime.restLookup?.firstCacheHit === false && runtime.restLookup?.secondCacheHit === true),
      mcpLookupCacheHit: Boolean(runtime.mcpLookup?.secondLookupCacheHit ?? runtime.mcpLookup?.ok),
      orangeAfterLookup: runtime.mcpLookup?.shellCountyAfterLookup ?? runtimeProof?.runtimeEvidence?.restLookup?.orangeAfterLookup ?? null,
      playableCountyCount: numberOrNull(runtime.coverageAfterLookup?.playableCountyCount),
      providerNormalizedCountyCount: numberOrNull(runtime.coverageAfterLookup?.providerNormalizedCountyCount),
      publicQualityCountyCount: numberOrNull(runtime.coverageAfterLookup?.publicQualityCountyCount),
    },
    publicObjectIdentity: {
      civicObjectKitScore: numberOrNull(publicObject.civicStressCell?.objectKitScore),
      civicNoLabelReadinessScore: numberOrNull(publicObject.civicStressCell?.noLabelReadinessScore),
      civicMobileReadinessScore: numberOrNull(publicObject.civicStressCell?.mobileReadinessScore),
      clonePressureRatio: numberOrNull(publicObject.objectKitMetrics?.clonePressureRatio ?? objectKit.clonePressureRatio),
      weakestPrefabFamily: publicObject.objectKitMetrics?.weakestPrefabFamily ?? objectKit.weakestPrefabFamily ?? null,
      eastvaleCoreFocusTarget: publicObject.civic?.focusTarget ?? null,
      eastvaleGymFocusTarget: publicObject.serviceGym?.focusTarget ?? null,
    },
    terrain: {
      terrainMassingCoverageRatio: numberOrNull(riverside.terrainMassingCoverageRatio),
      emptyBoardRatio: numberOrNull(riverside.emptyBoardRatio),
      firstViewportCompositionScore: numberOrNull(riverside.firstViewportCompositionScore),
      chunkEdgeReadabilityFloorScore: numberOrNull(riverside.chunkEdgeReadabilityFloorScore),
      nextWeakestAxis: riverside.nextWeakestAxis ?? null,
    },
    mobile: {
      playableBudgetPassed: Boolean(mobile?.budgetPassed),
      playableReadabilityScore: numberOrNull(mobile?.metrics?.mobileReadabilityScore),
      playableOcclusionRiskScore: numberOrNull(mobile?.metrics?.mobileOcclusionRiskScore),
      residentialDetailBudgetPassed: Boolean(residentialDetail?.budgetPassed),
      residentialDetailReadabilityScore: numberOrNull(residentialDetail?.metrics?.mobileReadabilityScore),
    },
    commerce: {
      plazaRowBayCount: numberOrNull(plaza.bayCount),
      plazaRowSignMountCount: numberOrNull(plaza.signMountCount),
      commerceWindowCommandVisibilityRatio: numberOrNull(plaza.commerceWindow?.commandVisibilityRatio),
      publicClutterCommandCount: numberOrNull(plaza.commerceWindow?.publicClutterCommandCount),
    },
    hiddenSecondDistrict: {
      readyForPlayablePromotion: Boolean(readiness.readyForPlayablePromotion),
      evidenceStates: readiness.evidenceStates ?? null,
      nextRequiredGate: readiness.promotionPacket?.nextRequiredGate ?? null,
      blockerCount: countBlockers(blockerGroups),
      blockerGroups,
      sourceGateSatisfied: Boolean(readiness.aggregate?.sourceToSceneTrace?.candidatePack?.gateSatisfied),
      anchorGateSatisfied: Boolean(readiness.aggregate?.sourceToSceneTrace?.anchorPack?.gateSatisfied),
      curatedPackGateSatisfied: Boolean(readiness.aggregate?.sourceToSceneTrace?.curatedPack?.gateSatisfied),
      draftCompilerGateSatisfied: Boolean(readiness.aggregate?.sourceToSceneTrace?.draftCompilerProof?.gateSatisfied),
      visualPacketStatus: readiness.aggregate?.sourceToSceneTrace?.visualPacket?.status ?? null,
      productProofStatus: readiness.aggregate?.sourceToSceneTrace?.productProof?.status ?? null,
      noFakePlayability: readiness.aggregate?.noFakePlayability ?? null,
    },
    provider: {
      boundaryOk: Boolean(evidence.providerBoundary?.ok),
      toolShapeOk: Boolean(evidence.toolResultShape?.ok),
    },
  };
}

function scoreCandidateAxes({ evidence, currentMetrics }) {
  const publicObjectGreen =
    evidence.publicObjectIdentity?.ok === true &&
    currentMetrics.publicObjectIdentity.civicObjectKitScore >= 0.95 &&
    currentMetrics.publicObjectIdentity.clonePressureRatio <= 0.2 &&
    currentMetrics.publicObjectIdentity.eastvaleCoreFocusTarget === "eastvale_core" &&
    currentMetrics.publicObjectIdentity.eastvaleGymFocusTarget === "eastvale_gym";
  const terrainGreen =
    currentMetrics.terrain.terrainMassingCoverageRatio >= 0.72 &&
    currentMetrics.terrain.emptyBoardRatio <= 0.18 &&
    currentMetrics.terrain.firstViewportCompositionScore >= 0.75 &&
    currentMetrics.terrain.chunkEdgeReadabilityFloorScore >= 0.75;
  const mobileGreen =
    evidence.mobileOcclusion?.blockers?.length === 0 &&
    currentMetrics.mobile.playableBudgetPassed &&
    currentMetrics.mobile.playableReadabilityScore >= 0.72;
  const commerceGreen =
    evidence.plazaRow?.ok === true &&
    currentMetrics.commerce.plazaRowBayCount >= 7 &&
    currentMetrics.commerce.plazaRowSignMountCount >= 5 &&
    currentMetrics.commerce.publicClutterCommandCount === 0;
  const providerRuntimeGreen =
    currentMetrics.provider.boundaryOk &&
    currentMetrics.provider.toolShapeOk &&
    currentMetrics.providerRuntimeProof.status === "local_green" &&
    currentMetrics.providerRuntimeProof.restCacheMissThenHit &&
    currentMetrics.providerRuntimeProof.mcpLookupCacheHit &&
    currentMetrics.providerRuntimeProof.playableCountyCount === 1 &&
    currentMetrics.providerRuntimeProof.providerNormalizedCountyCount === 0 &&
    currentMetrics.providerRuntimeProof.publicQualityCountyCount === 0;
  const hiddenHasFoundation =
    currentMetrics.hiddenSecondDistrict.sourceGateSatisfied &&
    currentMetrics.hiddenSecondDistrict.anchorGateSatisfied &&
    currentMetrics.hiddenSecondDistrict.curatedPackGateSatisfied &&
    currentMetrics.hiddenSecondDistrict.draftCompilerGateSatisfied;
  const hiddenNeedsProof =
    hiddenHasFoundation &&
    !currentMetrics.hiddenSecondDistrict.readyForPlayablePromotion &&
    ["desktop_mobile_product_loop_screenshots", "visual_packet", "product_proof"].some((gate) =>
      String(currentMetrics.hiddenSecondDistrict.nextRequiredGate ?? "").includes(gate),
    );

  return {
    public_object_identity_continue: {
      score: publicObjectGreen ? 22 : 78,
      blocked: publicObjectGreen,
      reasons: publicObjectGreen
        ? ["0.39E public civic/service object identity verifier is green", "clone pressure and landmark floors pass", "no named post-0.39E civic/service blocker exists"]
        : ["public object identity verifier or clone/landmark floors are not green"],
      recommendedNextQuest: "0.44E Public Object Identity Follow-up",
    },
    public_terrain_world_edge: {
      score: terrainGreen ? 24 : 82,
      blocked: terrainGreen,
      reasons: terrainGreen
        ? ["terrain massing, empty-board, first-viewport, and chunk-edge floors are green"]
        : ["terrain/world-edge floors regressed and need correction"],
      recommendedNextQuest: "0.44E Terrain / World-Edge Correction",
    },
    mobile_entry_density: {
      score: mobileGreen ? 22 : 84,
      blocked: mobileGreen,
      reasons: mobileGreen
        ? ["playable mobile LOD budget and mobile readability floor are green"]
        : ["mobile LOD budget or readability failed"],
      recommendedNextQuest: "0.44E Mobile Entry Density Correction",
    },
    hidden_second_district_readiness: {
      score: hiddenNeedsProof && providerRuntimeGreen && publicObjectGreen && terrainGreen && mobileGreen ? 86 : 34,
      blocked: !(hiddenNeedsProof && providerRuntimeGreen && publicObjectGreen && terrainGreen && mobileGreen),
      reasons: hiddenNeedsProof
        ? [
          "public Riverside object, terrain, mobile, commerce, and provider runtime gates are green enough to stop local churn",
          "Anaheim has source, anchor, curated pack, and hidden draft compiler foundations",
          `promotion remains blocked with ${currentMetrics.hiddenSecondDistrict.blockerCount} blocker(s), so the next useful work is hidden visual/product proof, not public exposure`,
          `next required gate is ${currentMetrics.hiddenSecondDistrict.nextRequiredGate ?? "unknown"}`,
        ]
        : ["hidden district foundation or next required gate is not ready for a proof packet"],
      recommendedNextQuest: "0.44E Hidden Second-District Visual/Product Proof Packet",
    },
    provider_normalization_preflight: {
      score: providerRuntimeGreen ? 20 : 80,
      blocked: providerRuntimeGreen,
      reasons: providerRuntimeGreen
        ? ["0.41E provider preflight and 0.42E runtime boundary proof are green", "no named provider leak or runtime boundary blocker remains"]
        : ["provider runtime proof or provider boundary guards are not green"],
      recommendedNextQuest: "0.44E Provider Boundary Correction",
    },
    commerce_repeat: {
      score: 0,
      blocked: true,
      reasons: ["blocked unless a human names one exact Plaza Row blocker after 0.37E/0.39E", "Plaza Row focused verifier is green"],
      recommendedNextQuest: "0.44E Commerce Repeat",
    },
    public_product_entry_compression: {
      score: mobileGreen ? 24 : 68,
      blocked: mobileGreen,
      reasons: mobileGreen
        ? ["mobile/product budget is green and no named product-entry comprehension blocker exists"]
        : ["product entry evidence is missing or mobile/product proof regressed"],
      recommendedNextQuest: "0.44E Public Product Entry Compression",
    },
  };
}

function buildBlockedAxes(candidateScores) {
  return Object.fromEntries(
    Object.entries(candidateScores)
      .filter(([, value]) => value.blocked)
      .map(([axis, value]) => [axis, value.reasons]),
  );
}

function chooseCandidate(candidateScores) {
  const candidates = Object.entries(candidateScores)
    .filter(([, value]) => !value.blocked)
    .sort((a, b) => b[1].score - a[1].score);
  if (candidates.length === 0) {
    blockers.push("No unblocked engine quality axis was found.");
    return { axis: "blocked", recommendedNextQuest: "0.44E Blocker Triage", reasons: ["all candidate axes are blocked"] };
  }
  const [axis, value] = candidates[0];
  return { axis, recommendedNextQuest: value.recommendedNextQuest, reasons: value.reasons };
}

function requiredEvidenceFor(axis) {
  const shared = [
    "node --check scripts/select-engine-quality-axis.mjs",
    "node scripts/select-engine-quality-axis.mjs --json-only",
    "node scripts/select-engine-quality-axis.mjs --out artifacts/engine-quality-axis --json-only",
    "node scripts/verify-atlas-source-of-truth-drift.mjs --json-only",
    "node scripts/verify-alpha-rc-split.mjs --working-tree --strict-selected-rc --rc-mode engine-beta-data --json-only",
  ];
  if (axis === "hidden_second_district_readiness") {
    return [
      ...shared,
      "hidden Anaheim desktop/mobile/product-loop screenshots",
      "hidden visual packet with publicPlayable false and promotionReady false until gates pass",
      "Mira product proof that public Riverside, Orange shell, and Unknown L0 remain understandable",
      "Forge split/provider proof with no public Anaheim/Ontario exposure",
    ];
  }
  return [...shared, "axis-specific verifier and screenshot evidence before implementation"];
}

function summarizeEvidence(evidence, runtimeProof) {
  return {
    diagnosticsOk: (evidence.diagnostics?.hardBlockers ?? []).length === 0,
    publicObjectIdentityOk: Boolean(evidence.publicObjectIdentity?.ok),
    objectKitOk: Boolean(evidence.objectKit?.ok),
    mobileOcclusionOk: Boolean(evidence.mobileOcclusion?.ok),
    plazaRowOk: Boolean(evidence.plazaRow?.ok),
    secondDistrictReadinessOk: Boolean(evidence.secondDistrictReadiness?.ok),
    providerBoundaryOk: Boolean(evidence.providerBoundary?.ok),
    toolResultShapeOk: Boolean(evidence.toolResultShape?.ok),
    providerRuntimeProofLocalGreen: runtimeProof?.status === "local_green",
  };
}

function findReport(mobileOcclusion, scenario) {
  return mobileOcclusion?.reports?.find((report) => report.scenario === scenario) ?? null;
}

function countBlockers(blockerGroups) {
  return Object.values(blockerGroups ?? {}).reduce((sum, value) => sum + (Array.isArray(value) ? value.length : 0), 0);
}

function numberOrNull(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}
