#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { analyzeCityWorldScene, compileCityWorldScene, riversideDemoVoxelScene } from "../packages/core/dist/index.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const rendererPath = join(root, "web/src/CityWorldRenderer.tsx");
const switcherPath = join(root, "web/src/CountySwitcher.tsx");
const coveragePath = join(root, "web/src/CountyCoverageView.tsx");

const rendererSource = readFileSync(rendererPath, "utf8");
const switcherSource = readFileSync(switcherPath, "utf8");
const coverageSource = readFileSync(coveragePath, "utf8");

const scene = compileCityWorldScene(riversideDemoVoxelScene);
const report = analyzeCityWorldScene(scene, "playable");
const civic = scene.buildings.find((building) => building.id === "building-civic");
const civicCell = report.metrics.civicVenueStressCells.find((cell) => cell.id === "eastvale-core-civic-landmark");
const blockers = [];

requireRendererHook("drawPublicCivicLandmarkObjectKit");
requireRendererHook("drawCivicLandmarkBaseHierarchy");
requireRendererHook("drawCivicLandmarkRoofHierarchy");
requireRendererHook("drawCivicLandmarkFacadeHierarchy");
requireRendererHook("drawEastvaleCorePublicCivicSignature");
requireRendererHook('family === "civic_landmark") drawPublicCivicLandmarkObjectKit');

if (!civic) {
  blockers.push("missing public Riverside building-civic stress cell.");
} else {
  requireEqual(civic.visualGrammar?.objectFamily, "civic_landmark", "building-civic objectFamily");
  requireEqual(civic.visualGrammar?.clusterRole, "anchor", "building-civic clusterRole");
  requireEqual(civic.visualGrammar?.contactProfile, "landmark_base_shadow", "building-civic contactProfile");
  requireEqual(civic.visualGrammar?.materialProfile, "civic_glass_stucco", "building-civic materialProfile");
  requireEqual(civic.visualGrammar?.roofProfile, "civic_glass_cap", "building-civic roofProfile");
}

if (!civicCell) {
  blockers.push("missing eastvale-core-civic-landmark diagnostic stress cell.");
} else {
  requireAtLeast(civicCell.objectKitScore, 0.95, "eastvale-core-civic-landmark objectKitScore");
  requireAtLeast(civicCell.silhouetteScore, 1, "eastvale-core-civic-landmark silhouetteScore");
  requireAtLeast(civicCell.mobileReadinessScore, 1, "eastvale-core-civic-landmark mobileReadinessScore");
  requireAtLeast(civicCell.noLabelReadinessScore, 1, "eastvale-core-civic-landmark noLabelReadinessScore");
}

requireAtLeast(report.metrics.terrainMassingCoverageRatio, 0.72, "terrainMassingCoverageRatio");
requireAtMost(report.metrics.emptyBoardRatio, 0.18, "emptyBoardRatio");
requireAtLeast(report.metrics.firstViewportCompositionScore, 0.75, "firstViewportCompositionScore");
requireAtLeast(report.metrics.civicVenueObjectKitScore, 0.95, "civicVenueObjectKitScore");

for (const [label, source] of [
  ["CountySwitcher", switcherSource],
  ["CountyCoverageView", coverageSource],
]) {
  if (/eastvale-core-civic-landmark|public_civic_landmark|civicVenueObjectKit|object-kit/i.test(source)) {
    blockers.push(`${label}: internal civic/object-kit metric language leaked into public UI source.`);
  }
  if (/anaheim-candidate|ontario-candidate|angel-stadium-venue-anchor/i.test(source)) {
    blockers.push(`${label}: hidden draft candidate language leaked into public UI source.`);
  }
}

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.16e-public-civic-landmark-authorship-pass",
  sceneId: scene.id,
  publicStressCell: summarizeCivicCell(civicCell),
  terrainFloors: {
    terrainMassingCoverageRatio: round(report.metrics.terrainMassingCoverageRatio),
    emptyBoardRatio: round(report.metrics.emptyBoardRatio),
    firstViewportCompositionScore: round(report.metrics.firstViewportCompositionScore),
  },
  rendererHooks: [
    "drawPublicCivicLandmarkObjectKit",
    "drawCivicLandmarkBaseHierarchy",
    "drawCivicLandmarkRoofHierarchy",
    "drawCivicLandmarkFacadeHierarchy",
    "drawEastvaleCorePublicCivicSignature",
  ],
  blockers,
};

if (process.argv.includes("--json-only")) {
  console.log(JSON.stringify(result));
} else {
  console.log(JSON.stringify(result, null, 2));
}

if (!result.ok) {
  process.exit(1);
}

function requireRendererHook(token) {
  if (!rendererSource.includes(token)) {
    blockers.push(`CityWorldRenderer missing required public civic hook: ${token}`);
  }
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) {
    blockers.push(`${label} expected ${expected}, got ${String(actual)}.`);
  }
}

function requireAtLeast(value, floor, label) {
  if (typeof value !== "number" || value < floor) {
    blockers.push(`${label} expected >= ${floor}, got ${String(value)}.`);
  }
}

function requireAtMost(value, ceiling, label) {
  if (typeof value !== "number" || value > ceiling) {
    blockers.push(`${label} expected <= ${ceiling}, got ${String(value)}.`);
  }
}

function summarizeCivicCell(cell) {
  if (!cell) return null;
  return {
    id: cell.id,
    kind: cell.kind,
    objectFamily: cell.objectFamily,
    buildingCount: cell.buildingCount,
    silhouetteScore: round(cell.silhouetteScore),
    hierarchyScore: round(cell.hierarchyScore),
    mobileReadinessScore: round(cell.mobileReadinessScore),
    noLabelReadinessScore: round(cell.noLabelReadinessScore),
    objectKitScore: round(cell.objectKitScore),
  };
}

function round(value) {
  return Number(value.toFixed(3));
}
