#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import process from "node:process";
import {
  analyzeCityWorldScene,
  compileCityWorldScene,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const blockers = [];
const anaheimAnchorPackPath = resolve("data/district_place_anchor_packs/anaheim-anchors.json");
const ontarioAnchorPackPath = resolve("data/district_place_anchor_packs/ontario-anchors.json");

for (const arg of process.argv.slice(2)) {
  if (arg !== "--json-only") {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

const scenes = {
  riverside: compileCityWorldScene(riversideDemoVoxelScene),
  anaheim: compileDistrictPlaceAnchorDraftCityWorldScene({
    anchorPack: parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath),
  }),
  ontario: compileDistrictPlaceAnchorDraftCityWorldScene({
    anchorPack: parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(ontarioAnchorPackPath, "utf8")), ontarioAnchorPackPath),
  }),
};

const reports = {
  riverside: analyzeCityWorldScene(scenes.riverside, "playable"),
  anaheim: analyzeCityWorldScene(scenes.anaheim, "hidden_draft"),
  ontario: analyzeCityWorldScene(scenes.ontario, "hidden_draft"),
};

validateRiverside(reports.riverside, blockers);
validateHiddenDraft("anaheim", reports.anaheim, blockers, { enforceAnchorContrast: true });
validateHiddenDraft("ontario", reports.ontario, blockers, { enforceAnchorContrast: false });
validateStaticBoundaries(blockers);

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.14e-face-orientation-source-art-contrast-gate",
  reports: {
    riverside: summarizeReport(reports.riverside),
    anaheim: summarizeReport(reports.anaheim),
    ontario: summarizeReport(reports.ontario),
  },
  nextArtTarget: {
    publicObjectFamily: reports.riverside.metrics.weakestObjectFamily,
    hiddenAnaheimAnchor: reports.anaheim.metrics.weakestHiddenAnchor,
  },
  blockers,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

function validateRiverside(report, failures) {
  if (report.hardBlockers.length > 0) {
    failures.push(`riverside: expected zero hard blockers; got ${report.hardBlockers.map((item) => item.code).join(", ")}.`);
  }

  requireAtLeast(failures, report.metrics.terrainMassingCoverageRatio, 0.72, "riverside terrainMassingCoverageRatio");
  requireAtMost(failures, report.metrics.emptyBoardRatio, 0.18, "riverside emptyBoardRatio");
  requireAtLeast(failures, report.metrics.firstViewportCompositionScore, 0.75, "riverside firstViewportCompositionScore");
  requireAtLeast(failures, report.metrics.chunkEdgeReadabilityFloorScore, 0.56, "riverside chunkEdgeReadabilityFloorScore");
  requireAtLeast(failures, report.metrics.objectFamilyCoverageRatio, 1, "riverside objectFamilyCoverageRatio");
  requireAtMost(failures, report.metrics.homeClonePressure, 0.2, "riverside homeClonePressure");
  requireAtLeast(failures, report.metrics.faceOrientationCoverageRatio, 0.9, "riverside faceOrientationCoverageRatio");
  requireAtLeast(failures, report.metrics.roofSideSeparationRatio, 0.85, "riverside roofSideSeparationRatio");
  requireAtLeast(failures, report.metrics.facadeContrastCoverageRatio, 0.75, "riverside facadeContrastCoverageRatio");
  requireAtLeast(failures, report.metrics.objectSignatureCoverageRatio, 0.7, "riverside objectSignatureCoverageRatio");

  if (!report.metrics.weakestObjectFamily || report.metrics.weakestObjectFamily === "none") {
    failures.push("riverside: weakestObjectFamily must name the next object-art target.");
  }
  if (report.metrics.primitiveFallbackEligibleRatio < 1) {
    failures.push(`riverside: primitive fallback eligibility must remain 1; got ${formatMetric(report.metrics.primitiveFallbackEligibleRatio)}.`);
  }
}

function validateHiddenDraft(label, report, failures, options) {
  if (report.hardBlockers.length > 0) {
    failures.push(`${label}: expected zero hard blockers; got ${report.hardBlockers.map((item) => item.code).join(", ")}.`);
  }
  if (report.playable) {
    failures.push(`${label}: hidden draft must remain non-playable.`);
  }
  if (report.counts.actors !== 0 || report.counts.pins !== 0) {
    failures.push(`${label}: hidden draft must not emit actors or pins.`);
  }
  requireAtLeast(failures, report.metrics.noLabelPrimaryAnchorCount, 2, `${label} noLabelPrimaryAnchorCount`);
  requireAtLeast(failures, report.metrics.noLabelTargetFamilyCoverageRatio, 1, `${label} noLabelTargetFamilyCoverageRatio`);
  requireAtLeast(failures, report.metrics.noLabelAnchorSeparationScore, 0.82, `${label} noLabelAnchorSeparationScore`);
  if (options.enforceAnchorContrast) {
    requireAtLeast(failures, report.metrics.hiddenAnchorContrastScore, 0.68, `${label} hiddenAnchorContrastScore`);
    if (!report.metrics.weakestHiddenAnchor || report.metrics.weakestHiddenAnchor === "none") {
      failures.push(`${label}: weakestHiddenAnchor must name the next source-art target.`);
    }
  }
}

function validateStaticBoundaries(failures) {
  const renderer = readFileSync(join(root, "web/src/CityWorldRenderer.tsx"), "utf8");
  const switcher = readFileSync(join(root, "web/src/CountySwitcher.tsx"), "utf8");
  const coverageView = readFileSync(join(root, "web/src/CountyCoverageView.tsx"), "utf8");
  const serializedReports = JSON.stringify(reports).toLowerCase();

  for (const token of ["google.maps", "maps.googleapis.com", "places.googleapis.com", "geodataadapter", "googlemapsadapter"]) {
    if (renderer.toLowerCase().includes(token) || serializedReports.includes(token)) {
      failures.push(`provider boundary: renderer/report must not contain provider token ${token}.`);
    }
  }

  for (const publicToken of ["Anaheim / Playable", "Ontario / Playable", "anaheim-candidate", "ontario-candidate"]) {
    if (switcher.includes(publicToken) || coverageView.includes(publicToken)) {
      failures.push(`public promotion boundary: ${publicToken} must not appear in public county UI.`);
    }
  }
}

function summarizeReport(report) {
  return {
    sceneId: report.sceneId,
    scenario: report.scenario,
    playable: report.playable,
    hardBlockerCount: report.hardBlockers.length,
    metrics: {
      terrainMassingCoverageRatio: formatMetric(report.metrics.terrainMassingCoverageRatio),
      emptyBoardRatio: formatMetric(report.metrics.emptyBoardRatio),
      firstViewportCompositionScore: formatMetric(report.metrics.firstViewportCompositionScore),
      chunkEdgeReadabilityFloorScore: formatMetric(report.metrics.chunkEdgeReadabilityFloorScore),
      objectFamilyCoverageRatio: formatMetric(report.metrics.objectFamilyCoverageRatio),
      homeClonePressure: formatMetric(report.metrics.homeClonePressure),
      faceOrientationCoverageRatio: formatMetric(report.metrics.faceOrientationCoverageRatio),
      roofSideSeparationRatio: formatMetric(report.metrics.roofSideSeparationRatio),
      facadeContrastCoverageRatio: formatMetric(report.metrics.facadeContrastCoverageRatio),
      objectSignatureCoverageRatio: formatMetric(report.metrics.objectSignatureCoverageRatio),
      weakestObjectFamily: report.metrics.weakestObjectFamily,
      hiddenAnchorContrastScore: formatMetric(report.metrics.hiddenAnchorContrastScore),
      weakestHiddenAnchor: report.metrics.weakestHiddenAnchor,
      primitiveFallbackEligibleRatio: formatMetric(report.metrics.primitiveFallbackEligibleRatio),
    },
  };
}

function requireAtLeast(failures, value, floor, label) {
  if (!Number.isFinite(value) || value < floor) {
    failures.push(`${label} must be >= ${floor}; got ${formatMetric(value)}.`);
  }
}

function requireAtMost(failures, value, ceiling, label) {
  if (!Number.isFinite(value) || value > ceiling) {
    failures.push(`${label} must be <= ${ceiling}; got ${formatMetric(value)}.`);
  }
}

function formatMetric(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : null;
}
