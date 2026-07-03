#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import {
  analyzeCityWorldObjectKit,
  analyzeCityWorldScene,
  compileCityWorldScene,
  compileCountyShellCityWorldScene,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  deriveCityWorldMobileOcclusion,
  evaluateCityWorldMobileLodBudget,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

const UPDATE = "postalpha-0.38e-engine-quality-axis-review-next-target-selection";
const BASE_UPDATE = "postalpha-0.37e-plaza-row-focused-capture-commerce-read-proof";
const args = parseArgs(process.argv.slice(2));
const blockers = [];
const warnings = [];

const currentUpdate = readJson("artifacts/current-update.json", "current update manifest", blockers);
const anaheimReadiness = readJson("artifacts/second-district-readiness/latest/anaheim-candidate/readiness-aggregate.json", "Anaheim readiness aggregate", warnings);
const riversideScene = compileCityWorldScene(riversideDemoVoxelScene);
const orangeShellScene = compileCountyShellCityWorldScene({
  countySlug: "orange-ca",
  countyName: "Orange County",
  stateCode: "CA",
  coverage: {
    countySlug: "orange-ca",
    coverageTier: "L1_COUNTY_SHELL",
    coverageLabel: "County shell",
    coverageMessage: "Orange County is indexed, but not playable yet.",
    playable: false,
  },
});
const anaheimDraftScene = compileDistrictPlaceAnchorDraftCityWorldScene({
  anchorPack: parseDistrictPlaceAnchorPack(readJson("data/district_place_anchor_packs/anaheim-anchors.json", "Anaheim anchor pack", blockers), "data/district_place_anchor_packs/anaheim-anchors.json"),
});

const diagnostics = {
  riverside: analyzeCityWorldScene(riversideScene, "playable"),
  orangeShell: analyzeCityWorldScene(orangeShellScene, "shell"),
  anaheimHiddenDraft: analyzeCityWorldScene(anaheimDraftScene, "hidden_draft"),
};
const objectKit = analyzeCityWorldObjectKit(riversideScene);
const mobileOcclusion = deriveCityWorldMobileOcclusion(riversideScene, "mobile");
const mobileBudget = evaluateCityWorldMobileLodBudget(mobileOcclusion, "playable_mobile", riversideScene);
const commerceDetail = currentUpdate?.metricResult ?? {};
const screenshotEvidence = inspectScreenshotEvidence(currentUpdate);

validateHardEvidence({ currentUpdate, diagnostics, objectKit, mobileBudget, screenshotEvidence });

const candidateScores = scoreCandidates({
  currentUpdate,
  diagnostics,
  objectKit,
  mobileBudget,
  mobileOcclusion,
  anaheimReadiness,
  commerceDetail,
  screenshotEvidence,
});
const blockedAxes = buildBlockedAxes(candidateScores);
const selected = chooseCandidate(candidateScores, blockedAxes);

const result = {
  ok: blockers.length === 0,
  update: UPDATE,
  currentUpdate: {
    id: currentUpdate?.id ?? null,
    status: currentUpdate?.status ?? null,
  },
  recommendedNextQuest: selected.nextQuest,
  selectedAxis: selected.axis,
  selectedReason: selected.reason,
  candidateScores,
  blockedAxes,
  requiredEvidence: requiredEvidenceFor(selected.axis),
  antiScope: [
    "no renderer geometry in 0.38E",
    "no public UI change",
    "no MCP tool-list change",
    "no server route change",
    "no DB implementation",
    "no provider geometry",
    "no public Anaheim/Ontario promotion",
    "no Hosted Clawd, Stripe, XP, evidence, OAuth, automation, reports, or exports",
    "no cars, humans, props, panels, glows, or labels-as-crutches",
  ],
  evidence: {
    diagnostics: summarizeDiagnostics(diagnostics),
    objectKit: summarizeObjectKit(objectKit),
    mobile: summarizeMobile(mobileOcclusion, mobileBudget),
    commerceDetail: summarizeCommerce(commerceDetail),
    screenshotEvidence,
    anaheimReadiness: summarizeAnaheimReadiness(anaheimReadiness),
  },
  blockerCount: blockers.length,
  blockers,
  warnings,
};

if (args.outDir) {
  const outDir = resolve(args.outDir);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "postalpha-0.38e-next-target-selection.json"), `${JSON.stringify(result, null, 2)}\n`);
}

console.log(args.jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {
    jsonOnly: false,
    outDir: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--json-only") {
      parsed.jsonOnly = true;
    } else if (arg === "--out") {
      parsed.outDir = argv[++index] ?? "";
      if (!parsed.outDir) throw new Error("--out requires a directory.");
    } else if (arg === "--help" || arg === "-h") {
      console.log(`Usage: node scripts/select-engine-quality-axis.mjs [--json-only] [--out <dir>]

Scores Atlas engine quality axes after 0.37E and selects exactly one next target.`);
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function readJson(path, label, issueTarget) {
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

function validateHardEvidence({ currentUpdate, diagnostics, objectKit, mobileBudget, screenshotEvidence }) {
  const acceptsBaseUpdate = currentUpdate?.id === BASE_UPDATE;
  const acceptsFinalizedUpdate = currentUpdate?.id === UPDATE && currentUpdate?.verification?.currentUpdateInput === BASE_UPDATE;
  if (!acceptsBaseUpdate && !acceptsFinalizedUpdate) {
    blockers.push(`0.38E selector requires current-update id ${BASE_UPDATE} or finalized ${UPDATE} with currentUpdateInput ${BASE_UPDATE}; got ${currentUpdate?.id ?? "missing"}.`);
  }
  if (currentUpdate?.status !== "local_green") {
    blockers.push(`Current update must be local_green before selecting next axis; got ${currentUpdate?.status ?? "missing"}.`);
  }
  for (const report of Object.values(diagnostics)) {
    if (report?.hardBlockers?.length) {
      blockers.push(...report.hardBlockers.map((issue) => `${report.sceneId}: ${issue.code} - ${issue.message}`));
    }
  }
  if (objectKit.blockers.length > 0) blockers.push(...objectKit.blockers);
  if (!mobileBudget.passed) blockers.push(...mobileBudget.blockers.map((blocker) => `mobile budget: ${blocker}`));
  if (!screenshotEvidence.coverageRootExists) blockers.push(`Missing 0.37E coverage screenshot root: ${screenshotEvidence.coverageRoot ?? "missing"}.`);
  if (!screenshotEvidence.commerceDetailRootExists) blockers.push(`Missing 0.37E commerce-detail screenshot root: ${screenshotEvidence.commerceDetailRoot ?? "missing"}.`);
  if (diagnostics.orangeShell.coverageTier !== "L1_COUNTY_SHELL" || diagnostics.orangeShell.playable) {
    blockers.push("Orange shell must remain L1 and non-playable.");
  }
  if (diagnostics.anaheimHiddenDraft.playable) {
    blockers.push("Anaheim hidden draft must not be playable.");
  }
}

function inspectScreenshotEvidence(currentUpdate) {
  const coverageRoot = currentUpdate?.verification?.browserCoverageRoot ?? "";
  const commerceDetailRoot = currentUpdate?.verification?.commerceDetailScreenshotRoot ?? "";
  return {
    coverageRoot,
    commerceDetailRoot,
    coverageRootExists: Boolean(coverageRoot && existsSync(coverageRoot)),
    commerceDetailRootExists: Boolean(commerceDetailRoot && existsSync(commerceDetailRoot)),
    commerceDetailDesktopExists: Boolean(commerceDetailRoot && existsSync(join(commerceDetailRoot, "alpha-product-loop-desktop-1280x720.png"))),
    commerceDetailMobileExists: Boolean(commerceDetailRoot && existsSync(join(commerceDetailRoot, "alpha-product-loop-mobile-390x844.png"))),
  };
}

function scoreCandidates({ diagnostics, objectKit, mobileBudget, mobileOcclusion, anaheimReadiness, commerceDetail, screenshotEvidence }) {
  const publicMetrics = diagnostics.riverside.metrics;
  const anaheimMetrics = diagnostics.anaheimHiddenDraft.metrics;
  const readinessBlockerCount = countReadinessBlockers(anaheimReadiness);
  const publicObjectPressure = [
    publicMetrics.homeClonePressure >= 0.18 ? "home clone pressure remains at or above review floor" : "",
    publicMetrics.weakestObjectFamily && publicMetrics.weakestObjectFamily !== "none" ? `weakest public object family is ${publicMetrics.weakestObjectFamily}` : "",
    objectKit.metrics.weakestPrefabFamily ? `weakest prefab family is ${objectKit.metrics.weakestPrefabFamily}` : "",
  ].filter(Boolean);
  const terrainReasons = [
    publicMetrics.chunkEdgeReadabilityFloorScore < 0.75 ? "chunk-edge floor regressed below 0.75" : "",
    publicMetrics.emptyBoardRatio > 0.18 ? "empty-board ratio regressed above 0.18" : "",
    publicMetrics.terrainMassingCoverageRatio < 0.72 ? "terrain massing regressed below 0.72" : "",
  ].filter(Boolean);
  const mobileReasons = [
    !mobileBudget.passed ? "playable mobile LOD budget failed" : "",
    mobileOcclusion.metrics.mobileReadabilityScore < 0.72 ? "mobile readability dropped below 0.72" : "",
  ].filter(Boolean);
  const hiddenReasons = [
    readinessBlockerCount <= publicObjectPressure.length ? "hidden readiness blocker count is competitive with public object blockers" : "",
    readinessBlockerCount > publicObjectPressure.length ? `Anaheim still has ${readinessBlockerCount} promotion blockers` : "",
    anaheimMetrics.weakestHiddenAnchor && anaheimMetrics.weakestHiddenAnchor !== "none" ? `weakest hidden anchor is ${anaheimMetrics.weakestHiddenAnchor}` : "",
    anaheimMetrics.nextWeakestAxis ? `Anaheim next weakest axis is ${anaheimMetrics.nextWeakestAxis}` : "",
  ].filter(Boolean);
  const commerceReasons = [
    commerceDetail.plazaRowBayCount >= 7 ? "0.37E commerce bay floor is met" : "",
    screenshotEvidence.commerceDetailDesktopExists && screenshotEvidence.commerceDetailMobileExists ? "commerce-detail desktop/mobile screenshots exist" : "",
  ].filter(Boolean);

  return {
    public_object_identity: {
      score: publicObjectPressure.length >= 2 ? 87 : publicObjectPressure.length === 1 ? 72 : 45,
      blocked: false,
      reasons: publicObjectPressure,
      nextQuest: "0.39E Public Object Identity / Civic-Service Read Pass",
    },
    public_terrain_world_edge: {
      score: terrainReasons.length > 0 ? 74 : 31,
      blocked: terrainReasons.length === 0,
      reasons: terrainReasons.length > 0 ? terrainReasons : ["terrain, empty-board, and chunk-edge floors are currently green"],
      nextQuest: "0.39E Terrain / World-Edge Correction",
    },
    mobile_entry_density: {
      score: mobileReasons.length > 0 ? 78 : 28,
      blocked: mobileReasons.length === 0,
      reasons: mobileReasons.length > 0 ? mobileReasons : ["playable mobile budget and readability floors are currently green"],
      nextQuest: "0.39E Mobile Entry Density Correction",
    },
    hidden_second_district_readiness: {
      score: hiddenReasons.length > 0 && readinessBlockerCount <= publicObjectPressure.length ? 69 : 52,
      blocked: readinessBlockerCount > publicObjectPressure.length,
      reasons: hiddenReasons.length > 0 ? hiddenReasons : ["hidden district evidence exists, but public object identity has higher visible release value"],
      readinessBlockerCount,
      nextQuest: "0.39E Hidden Second-District Readiness Closure",
    },
    commerce_repeat: {
      score: 0,
      blocked: true,
      reasons: ["blocked unless a human names one exact Plaza Row blocker after 0.37E focused proof"],
      nextQuest: "0.39E Commerce Strip Follow-up",
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

function chooseCandidate(candidateScores, blockedAxes) {
  const candidates = Object.entries(candidateScores)
    .filter(([axis]) => !blockedAxes[axis])
    .sort((a, b) => b[1].score - a[1].score);
  const [axis, value] = candidates[0] ?? ["public_object_identity", candidateScores.public_object_identity];
  return {
    axis,
    nextQuest: value.nextQuest,
    reason: value.reasons.join("; "),
  };
}

function requiredEvidenceFor(axis) {
  const shared = [
    "core tests, typecheck, and starter build",
    "strict engine-beta-data split guard with 0 blockers and 0 unknowns",
    "provider and tool-shape guards",
  ];
  if (axis === "public_object_identity") {
    return [
      ...shared,
      "public Riverside desktop/mobile product-loop screenshots",
      "focused screenshot for the target object family",
      "object-authorship and public object-kit verifiers",
    ];
  }
  if (axis === "hidden_second_district_readiness") {
    return [
      ...shared,
      "hidden Anaheim draft screenshots and visual packet",
      "second-district readiness aggregate",
      "explicit public non-promotion proof",
    ];
  }
  return [...shared, "Engine Beta coverage screenshot packet"];
}

function summarizeDiagnostics(diagnostics) {
  const playable = diagnostics.riverside.metrics;
  return {
    terrainMassingCoverageRatio: round(playable.terrainMassingCoverageRatio),
    emptyBoardRatio: round(playable.emptyBoardRatio),
    firstViewportCompositionScore: round(playable.firstViewportCompositionScore),
    chunkEdgeReadabilityFloorScore: round(playable.chunkEdgeReadabilityFloorScore),
    homeClonePressure: round(playable.homeClonePressure),
    weakestObjectFamily: playable.weakestObjectFamily,
    weakestCivicVenueStressCell: playable.weakestCivicVenueStressCell,
    nextWeakestAxis: diagnostics.riverside.nextWeakestAxis,
  };
}

function summarizeObjectKit(objectKit) {
  return {
    prefabCoverageRatio: round(objectKit.metrics.prefabCoverageRatio),
    paletteCohesionRatio: round(objectKit.metrics.paletteCohesionRatio),
    clonePressureRatio: round(objectKit.metrics.clonePressureRatio),
    weakestPrefabFamily: objectKit.metrics.weakestPrefabFamily,
  };
}

function summarizeMobile(mobileOcclusion, mobileBudget) {
  return {
    budgetProfileId: mobileBudget.profileId,
    budgetPassed: mobileBudget.passed,
    mobileOcclusionRiskScore: round(mobileOcclusion.metrics.mobileOcclusionRiskScore),
    mobileReadabilityScore: round(mobileOcclusion.metrics.mobileReadabilityScore),
  };
}

function summarizeCommerce(commerceDetail) {
  return {
    cameraPresetId: commerceDetail.cameraPresetId ?? null,
    plazaRowBayCount: commerceDetail.plazaRowBayCount ?? null,
    plazaRowSignMountCount: commerceDetail.plazaRowSignMountCount ?? null,
    commerceWindowCommandVisibilityRatio: commerceDetail.commerceWindowCommandVisibilityRatio ?? null,
    commerceWindowPublicClutterCommandCount: commerceDetail.commerceWindowPublicClutterCommandCount ?? null,
  };
}

function summarizeAnaheimReadiness(anaheimReadiness) {
  return {
    readyForPlayablePromotion: anaheimReadiness?.readyForPlayablePromotion ?? false,
    blockerCount: countReadinessBlockers(anaheimReadiness),
  };
}

function countReadinessBlockers(aggregate) {
  if (!aggregate) return 99;
  const buckets = [
    aggregate.blockers,
    aggregate.dataBlockers,
    aggregate.visualBlockers,
    aggregate.productBlockers,
    aggregate.releaseBlockers,
    aggregate.blockerGroups?.data,
    aggregate.blockerGroups?.visual,
    aggregate.blockerGroups?.product,
    aggregate.blockerGroups?.release,
    aggregate.aggregate?.blockerGroups?.data,
    aggregate.aggregate?.blockerGroups?.visual,
    aggregate.aggregate?.blockerGroups?.product,
    aggregate.aggregate?.blockerGroups?.release,
  ].filter(Array.isArray);
  return buckets.reduce((sum, bucket) => sum + bucket.length, 0);
}

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}
