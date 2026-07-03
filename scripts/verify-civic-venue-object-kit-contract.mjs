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

for (const arg of process.argv.slice(2)) {
  if (arg !== "--json-only") {
    throw new Error(`Unknown argument: ${arg}`);
  }
}

const anaheimAnchorPackPath = resolve("data/district_place_anchor_packs/anaheim-anchors.json");
const ontarioAnchorPackPath = resolve("data/district_place_anchor_packs/ontario-anchors.json");

const reports = {
  riverside: analyzeCityWorldScene(compileCityWorldScene(riversideDemoVoxelScene), "playable"),
  anaheim: analyzeCityWorldScene(
    compileDistrictPlaceAnchorDraftCityWorldScene({
      anchorPack: parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath),
    }),
    "hidden_draft",
  ),
  ontario: analyzeCityWorldScene(
    compileDistrictPlaceAnchorDraftCityWorldScene({
      anchorPack: parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(ontarioAnchorPackPath, "utf8")), ontarioAnchorPackPath),
    }),
    "hidden_draft",
  ),
};

validatePublicCivicStressCell(reports.riverside, blockers);
validateHiddenVenueStressCell(reports.anaheim, blockers);
validateHiddenControl(reports.ontario, blockers);
validateStaticBoundaries(blockers);

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.15e-civic-venue-object-kit-contract",
  contract: {
    reusableObjectFamilies: ["civic_landmark", "venue_anchor", "transit_anchor"],
    stressCells: [
      "eastvale-core-civic-landmark",
      "anaheim-convention-center-venue-anchor",
      "artic-transit-anchor",
      "angel-stadium-venue-anchor",
    ],
    publicPlayableCounty: "riverside-ca",
    hiddenDraftCounty: "orange-ca",
  },
  reports: {
    riverside: summarizeContract(reports.riverside),
    anaheim: summarizeContract(reports.anaheim),
    ontario: summarizeContract(reports.ontario),
  },
  nextArtTarget: weakestStressCellTarget(reports),
  blockers,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

function validatePublicCivicStressCell(report, failures) {
  if (report.hardBlockers.length > 0) {
    failures.push(`riverside: hard blockers present: ${report.hardBlockers.map((item) => item.code).join(", ")}.`);
  }
  if (!report.playable) {
    failures.push("riverside: public stress cell must remain on the playable Riverside scene.");
  }
  requireAtLeast(failures, report.metrics.terrainMassingCoverageRatio, 0.72, "riverside terrainMassingCoverageRatio");
  requireAtMost(failures, report.metrics.emptyBoardRatio, 0.18, "riverside emptyBoardRatio");
  requireAtLeast(failures, report.metrics.firstViewportCompositionScore, 0.75, "riverside firstViewportCompositionScore");
  requireAtLeast(failures, report.metrics.civicVenueObjectKitScore, 0.9, "riverside civicVenueObjectKitScore");

  const cell = findStressCell(report, "eastvale-core-civic-landmark");
  if (!cell) {
    failures.push("riverside: missing eastvale-core-civic-landmark stress cell.");
    return;
  }
  requireStressCell(failures, cell, {
    kind: "public_civic_landmark",
    objectFamily: "civic_landmark",
    minObjectKitScore: 0.9,
    minSilhouetteScore: 0.9,
    minHierarchyScore: 0.8,
    minMobileReadinessScore: 0.95,
    minNoLabelReadinessScore: 0.9,
  });
}

function validateHiddenVenueStressCell(report, failures) {
  if (report.hardBlockers.length > 0) {
    failures.push(`anaheim: hard blockers present: ${report.hardBlockers.map((item) => item.code).join(", ")}.`);
  }
  if (report.playable) {
    failures.push("anaheim: hidden venue stress cell must not become playable.");
  }
  if (report.counts.actors !== 0 || report.counts.pins !== 0) {
    failures.push("anaheim: hidden draft cannot emit actors or pins.");
  }
  requireAtLeast(failures, report.metrics.hiddenAnchorContrastScore, 0.68, "anaheim hiddenAnchorContrastScore");
  requireAtLeast(failures, report.metrics.civicVenueObjectKitScore, 0.9, "anaheim civicVenueObjectKitScore");

  for (const expected of [
    { id: "anaheim-convention-center-venue-anchor", objectFamily: "venue_anchor", minHierarchyScore: 0.86 },
    { id: "artic-transit-anchor", objectFamily: "transit_anchor", minHierarchyScore: 0.84 },
    { id: "angel-stadium-venue-anchor", objectFamily: "venue_anchor", minHierarchyScore: 0.84 },
  ]) {
    const cell = findStressCell(report, expected.id);
    if (!cell) {
      failures.push(`anaheim: missing ${expected.id} stress cell.`);
      continue;
    }
    requireStressCell(failures, cell, {
      kind: "hidden_venue_anchor",
      objectFamily: expected.objectFamily,
      minObjectKitScore: 0.9,
      minSilhouetteScore: 0.9,
      minHierarchyScore: expected.minHierarchyScore,
      minMobileReadinessScore: 0.95,
      minNoLabelReadinessScore: 0.95,
    });
  }
}

function validateHiddenControl(report, failures) {
  if (report.hardBlockers.length > 0) {
    failures.push(`ontario: hard blockers present: ${report.hardBlockers.map((item) => item.code).join(", ")}.`);
  }
  if (report.playable) {
    failures.push("ontario: hidden control must not become playable.");
  }
  if (report.metrics.civicVenueStressCells.length !== 0) {
    failures.push("ontario: 0.15E must not accidentally classify Ontario as the Eastvale/Angel stress-cell target.");
  }
}

function requireStressCell(failures, cell, expected) {
  if (cell.kind !== expected.kind) {
    failures.push(`${cell.id}: expected kind ${expected.kind}; got ${cell.kind}.`);
  }
  if (cell.objectFamily !== expected.objectFamily) {
    failures.push(`${cell.id}: expected objectFamily ${expected.objectFamily}; got ${cell.objectFamily}.`);
  }
  requireAtLeast(failures, cell.objectKitScore, expected.minObjectKitScore, `${cell.id} objectKitScore`);
  requireAtLeast(failures, cell.silhouetteScore, expected.minSilhouetteScore, `${cell.id} silhouetteScore`);
  requireAtLeast(failures, cell.hierarchyScore, expected.minHierarchyScore, `${cell.id} hierarchyScore`);
  requireAtLeast(failures, cell.mobileReadinessScore, expected.minMobileReadinessScore, `${cell.id} mobileReadinessScore`);
  requireAtLeast(failures, cell.noLabelReadinessScore, expected.minNoLabelReadinessScore, `${cell.id} noLabelReadinessScore`);
}

function validateStaticBoundaries(failures) {
  const renderer = readFileSync(join(root, "web/src/CityWorldRenderer.tsx"), "utf8").toLowerCase();
  const switcher = readFileSync(join(root, "web/src/CountySwitcher.tsx"), "utf8");
  const coverageView = readFileSync(join(root, "web/src/CountyCoverageView.tsx"), "utf8");
  const serializedReports = JSON.stringify(reports).toLowerCase();

  for (const token of ["google.maps", "maps.googleapis.com", "places.googleapis.com", "geodataadapter", "googlemapsadapter"]) {
    if (renderer.includes(token) || serializedReports.includes(token)) {
      failures.push(`provider boundary: renderer/report must not contain provider token ${token}.`);
    }
  }

  for (const publicToken of ["Anaheim / Playable", "Ontario / Playable", "anaheim-candidate", "ontario-candidate"]) {
    if (switcher.includes(publicToken) || coverageView.includes(publicToken)) {
      failures.push(`public promotion boundary: ${publicToken} must not appear in public county UI.`);
    }
  }
}

function findStressCell(report, id) {
  return report.metrics.civicVenueStressCells.find((cell) => cell.id === id);
}

function summarizeContract(report) {
  return {
    sceneId: report.sceneId,
    scenario: report.scenario,
    playable: report.playable,
    civicVenueObjectKitScore: formatMetric(report.metrics.civicVenueObjectKitScore),
    weakestCivicVenueStressCell: report.metrics.weakestCivicVenueStressCell,
    stressCells: report.metrics.civicVenueStressCells.map((cell) => ({
      id: cell.id,
      kind: cell.kind,
      objectFamily: cell.objectFamily,
      buildingCount: cell.buildingCount,
      silhouetteScore: formatMetric(cell.silhouetteScore),
      hierarchyScore: formatMetric(cell.hierarchyScore),
      mobileReadinessScore: formatMetric(cell.mobileReadinessScore),
      noLabelReadinessScore: formatMetric(cell.noLabelReadinessScore),
      objectKitScore: formatMetric(cell.objectKitScore),
    })),
  };
}

function weakestStressCellTarget(allReports) {
  const cells = [
    ...allReports.riverside.metrics.civicVenueStressCells,
    ...allReports.anaheim.metrics.civicVenueStressCells,
  ];
  const weakest = cells.sort((a, b) => a.objectKitScore - b.objectKitScore)[0];
  return weakest
    ? {
        id: weakest.id,
        kind: weakest.kind,
        score: formatMetric(weakest.objectKitScore),
      }
    : null;
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
