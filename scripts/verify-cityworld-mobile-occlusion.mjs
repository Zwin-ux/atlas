#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import {
  compileCityWorldScene,
  compileCountyShellCityWorldScene,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  deriveCityWorldMobileOcclusion,
  evaluateCityWorldMobileLodBudget,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

const args = parseArgs(process.argv.slice(2));
const anaheimAnchorPackPath = resolve("data/district_place_anchor_packs/anaheim-anchors.json");
const ontarioAnchorPackPath = resolve("data/district_place_anchor_packs/ontario-anchors.json");
const riverside = compileCityWorldScene(riversideDemoVoxelScene);
const orangeShell = compileCountyShellCityWorldScene({
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
const anaheimDraft = compileDistrictPlaceAnchorDraftCityWorldScene({
  anchorPack: parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath),
});
const ontarioDraft = compileDistrictPlaceAnchorDraftCityWorldScene({
  anchorPack: parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(ontarioAnchorPackPath, "utf8")), ontarioAnchorPackPath),
});

const targets = [
  { scenario: "riverside-mobile", group: "productMobile", scene: riverside, cameraPresetId: "mobile", budgetProfileId: "playable_mobile" },
  {
    scenario: "riverside-residential-detail",
    group: "productMobile",
    scene: riverside,
    cameraPresetId: "residential_detail",
    budgetProfileId: "residential_detail_probe",
  },
  { scenario: "orange-shell-mobile", group: "shellEmptyState", scene: orangeShell, cameraPresetId: "mobile", budgetProfileId: "shell_mobile_empty_state" },
  {
    scenario: "anaheim-hidden-draft-mobile",
    group: "hiddenDraftSafety",
    scene: anaheimDraft,
    cameraPresetId: "mobile",
    budgetProfileId: "hidden_draft_mobile_probe",
  },
  {
    scenario: "ontario-hidden-draft-mobile",
    group: "hiddenDraftSafety",
    scene: ontarioDraft,
    cameraPresetId: "mobile",
    budgetProfileId: "hidden_draft_mobile_probe",
  },
];

const blockerGroups = {
  productMobile: [],
  shellEmptyState: [],
  hiddenDraftSafety: [],
  providerBoundary: [],
};
const reports = targets.map((target) => {
  const occlusion = deriveCityWorldMobileOcclusion(target.scene, target.cameraPresetId);
  const budgetResult = evaluateCityWorldMobileLodBudget(occlusion, target.budgetProfileId, target.scene);
  validateOcclusion(target, occlusion, budgetResult, blockerGroups);
  return {
    scenario: target.scenario,
    budgetProfileId: budgetResult.profileId,
    budgetPassed: budgetResult.passed,
    budgetBlockers: budgetResult.blockers,
    sceneId: target.scene.id,
    coverageTier: target.scene.coverage?.coverageTier ?? "NONE",
    playable: target.scene.coverage?.playable ?? false,
    counts: occlusion.counts,
    metrics: occlusion.metrics,
  };
});
const blockers = Object.entries(blockerGroups).flatMap(([group, groupBlockers]) => groupBlockers.map((message) => ({ group, message })));

const summary = {
  ok: blockers.length === 0,
  update: "prealpha-0.13e-mobile-lod-occlusion-budget-enforcement",
  source: "CityWorldScene",
  dependencyPolicy: {
    noExternalVoxelRuntimeDependency: true,
    noProviderGeometry: true,
    noPublicPromotion: true,
  },
  reports,
  blockerGroups,
  blockers,
};

console.log(args.jsonOnly ? JSON.stringify(summary) : JSON.stringify(summary, null, 2));

if (!summary.ok) {
  process.exitCode = 1;
}

function validateOcclusion(target, occlusion, budgetResult, blockerGroups) {
  if (occlusion.type !== "cityWorldMobileOcclusion") {
    blockerGroups[target.group].push(`${target.scenario}: occlusion report type mismatch.`);
  }
  if (containsProviderToken(occlusion) || containsProviderToken(budgetResult)) {
    blockerGroups.providerBoundary.push(`${target.scenario}: occlusion budget report leaks provider tokens.`);
  }
  if (!budgetResult.passed) {
    for (const blocker of budgetResult.blockers) {
      blockerGroups[target.group].push(`${target.scenario}: ${blocker}`);
    }
  }

  if (target.scenario === "riverside-mobile") {
    if (occlusion.counts.actors < 1) blockerGroups.productMobile.push(`${target.scenario}: expected Clawd actor to remain in mobile frame.`);
  }

  if (target.scenario.endsWith("shell-mobile")) {
    if (target.scene.coverage?.playable) blockerGroups.shellEmptyState.push(`${target.scenario}: shell scene cannot be playable.`);
    if (occlusion.counts.buildings > 0 || occlusion.counts.pins > 0 || occlusion.counts.actors > 0) {
      blockerGroups.shellEmptyState.push(`${target.scenario}: shell scene must not expose buildings, pins, or actors.`);
    }
  }

  if (target.scenario.includes("hidden-draft")) {
    if (target.scene.coverage?.playable) blockerGroups.hiddenDraftSafety.push(`${target.scenario}: hidden draft cannot be playable.`);
    if (occlusion.counts.pins > 0 || occlusion.counts.actors > 0) {
      blockerGroups.hiddenDraftSafety.push(`${target.scenario}: hidden draft cannot expose pins or actors.`);
    }
  }
}

function containsProviderToken(value) {
  const text = JSON.stringify(value).toLowerCase();
  return ["google.maps", "maps.googleapis.com", "places.googleapis.com", "geodataadapter", "googlemapsadapter"].some((token) => text.includes(token));
}

function parseArgs(argv) {
  const parsed = {
    jsonOnly: false,
  };
  for (const arg of argv) {
    if (arg === "--json-only") {
      parsed.jsonOnly = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}
