#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  analyzeCityWorldObjectKit,
  analyzeCityWorldScene,
  compileCityWorldScene,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const paths = {
  types: "packages/core/src/voxel/cityWorldTypes.ts",
  objectKit: "packages/core/src/voxel/cityWorldObjectKit.ts",
  renderer: "web/src/CityWorldRenderer.tsx",
};

const source = Object.fromEntries(
  Object.entries(paths).map(([key, relativePath]) => [key, readFileSync(join(root, relativePath), "utf8")]),
);
const blockers = [];

requireText("types", "CityWorldCivicLandmarkPrefabGeometry", "Core types must define civic landmark prefab geometry.");
requireText("types", "CityWorldServiceGymPrefabGeometry", "Core types must define service/gym prefab geometry.");
requireText("objectKit", "function civicLandmarkPrefabGeometry", "Object-kit core must assign civic landmark prefab geometry.");
requireText("objectKit", "function serviceGymPrefabGeometry", "Object-kit core must assign service/gym prefab geometry.");
requireText("objectKit", "focusTarget: \"eastvale_core\"", "Eastvale Core must be the civic landmark stress cell.");
requireText("objectKit", "focusTarget: \"eastvale_gym\"", "Eastvale Gym must be the service/gym stress cell.");
requireText("renderer", "function drawObjectKitCivicLandmarkRead", "Renderer must expose an object-kit civic landmark helper.");
requireText("renderer", "function drawObjectKitServiceGymRead", "Renderer must expose an object-kit service/gym helper.");
requireText("renderer", "building.objectKit?.prefabFamily === \"civic_landmark\"", "Renderer must key civic read from objectKit prefab metadata.");
requireText("renderer", "building.objectKit?.prefabFamily === \"service_gym\"", "Renderer must key service/gym read from objectKit prefab metadata.");
requireText("renderer", "building.objectKit?.civicGeometry", "Renderer must consume objectKit civicGeometry.");
requireText("renderer", "building.objectKit?.serviceGeometry", "Renderer must consume objectKit serviceGeometry.");

const civicCallCount = countOccurrences(source.renderer, "drawObjectKitCivicLandmarkRead(layer, geometry, building)");
if (civicCallCount < 2) {
  blockers.push(`drawObjectKitCivicLandmarkRead must be used in sprite-backed and primitive paths; found ${civicCallCount} call(s).`);
}
const serviceCallCount = countOccurrences(source.renderer, "drawObjectKitServiceGymRead(layer, geometry, building)");
if (serviceCallCount < 2) {
  blockers.push(`drawObjectKitServiceGymRead must be used in sprite-backed and primitive paths; found ${serviceCallCount} call(s).`);
}

for (const [label, content] of Object.entries(source)) {
  for (const forbidden of ["DATABASE_URL", "HostedClawd", "hostedClawd", "STRIPE_", "@stripe", "Stripe(", "OAuth", "@atlas/geo", "GoogleMaps", "google.maps"]) {
    if (content.includes(forbidden)) blockers.push(`${paths[label]} must not introduce forbidden scope token ${forbidden}.`);
  }
}

let runtimeSummary = null;
try {
  const scene = compileCityWorldScene(riversideDemoVoxelScene);
  const diagnostics = analyzeCityWorldScene(scene, "playable");
  const objectKit = analyzeCityWorldObjectKit(scene);
  const civic = scene.buildings.find((building) => building.id === "building-civic");
  const serviceGym = scene.buildings.find((building) => building.id === "building-gym");
  const civicStressCell = diagnostics.metrics.civicVenueStressCells.find((cell) => cell.id === "eastvale-core-civic-landmark");

  if (!civic) blockers.push("Public Riverside must include building-civic.");
  if (!serviceGym) blockers.push("Public Riverside must include building-gym.");

  if (civic) {
    requireEqual(civic.objectKit?.prefabFamily, "civic_landmark", "building-civic prefabFamily");
    requireEqual(civic.objectKit?.civicGeometry?.focusTarget, "eastvale_core", "building-civic civicGeometry focusTarget");
    requireAtLeast(civic.objectKit?.civicGeometry?.plinthTierCount, 3, "building-civic plinthTierCount");
    requireAtLeast(civic.objectKit?.civicGeometry?.entryBayCount, 5, "building-civic entryBayCount");
    requireAtLeast(civic.objectKit?.civicGeometry?.facadePierCount, 6, "building-civic facadePierCount");
    requireAtLeast(civic.objectKit?.civicGeometry?.glassBandCount, 3, "building-civic glassBandCount");
    requireAtLeast(civic.objectKit?.civicGeometry?.roofCapWeight, 1.2, "building-civic roofCapWeight");
    requireAtLeast(civic.objectKit?.landmarkSignatureScore, 1, "building-civic landmarkSignatureScore");
  }

  if (serviceGym) {
    requireEqual(serviceGym.objectKit?.prefabFamily, "service_gym", "building-gym prefabFamily");
    requireEqual(serviceGym.objectKit?.serviceGeometry?.focusTarget, "eastvale_gym", "building-gym serviceGeometry focusTarget");
    requireAtLeast(serviceGym.objectKit?.serviceGeometry?.serviceBayCount, 4, "building-gym serviceBayCount");
    requireAtLeast(serviceGym.objectKit?.serviceGeometry?.sawtoothCount, 5, "building-gym sawtoothCount");
    requireAtLeast(serviceGym.objectKit?.serviceGeometry?.entryRecessDepth, 0.3, "building-gym entryRecessDepth");
    requireAtLeast(serviceGym.objectKit?.serviceGeometry?.utilityApronDepth, 0.4, "building-gym utilityApronDepth");
    requireAtLeast(serviceGym.objectKit?.serviceGeometry?.roofMonitorWeight, 1.1, "building-gym roofMonitorWeight");
  }

  if (scene.id.includes("anaheim") || scene.id.includes("ontario")) blockers.push("0.39E must inspect public Riverside, not hidden candidate scenes.");
  if (scene.buildings.some((building) => building.id.startsWith("draft-building-"))) blockers.push("Public Riverside scene must not contain hidden draft buildings.");
  requireAtLeast(objectKit.metrics.prefabCoverageRatio, 1, "prefabCoverageRatio");
  requireAtMost(objectKit.metrics.clonePressureRatio, 0.2, "clonePressureRatio");
  requireAtLeast(objectKit.metrics.landmarkSignatureScore, 1, "landmarkSignatureScore");
  requireAtLeast(diagnostics.metrics.terrainMassingCoverageRatio, 0.72, "terrainMassingCoverageRatio");
  requireAtMost(diagnostics.metrics.emptyBoardRatio, 0.18, "emptyBoardRatio");
  requireAtLeast(diagnostics.metrics.firstViewportCompositionScore, 0.75, "firstViewportCompositionScore");
  requireAtLeast(diagnostics.metrics.buildingLotContactRatio, 0.98, "buildingLotContactRatio");
  requireAtLeast(diagnostics.metrics.lotRoadContactRatio, 0.78, "lotRoadContactRatio");
  requireAtLeast(civicStressCell?.objectKitScore, 0.95, "eastvale-core-civic-landmark objectKitScore");

  runtimeSummary = {
    sceneId: scene.id,
    civic: summarizeCivic(civic),
    serviceGym: summarizeServiceGym(serviceGym),
    objectKitMetrics: {
      prefabCoverageRatio: round(objectKit.metrics.prefabCoverageRatio),
      clonePressureRatio: round(objectKit.metrics.clonePressureRatio),
      landmarkSignatureScore: round(objectKit.metrics.landmarkSignatureScore),
      weakestPrefabFamily: objectKit.weakestPrefabFamily,
    },
    terrainFloors: {
      terrainMassingCoverageRatio: round(diagnostics.metrics.terrainMassingCoverageRatio),
      emptyBoardRatio: round(diagnostics.metrics.emptyBoardRatio),
      firstViewportCompositionScore: round(diagnostics.metrics.firstViewportCompositionScore),
      buildingLotContactRatio: round(diagnostics.metrics.buildingLotContactRatio),
      lotRoadContactRatio: round(diagnostics.metrics.lotRoadContactRatio),
    },
    civicStressCell: civicStressCell
      ? {
        id: civicStressCell.id,
        objectKitScore: round(civicStressCell.objectKitScore),
        noLabelReadinessScore: round(civicStressCell.noLabelReadinessScore),
        mobileReadinessScore: round(civicStressCell.mobileReadinessScore),
      }
      : null,
  };
} catch (error) {
  blockers.push(`Runtime public object identity verification failed: ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: "postalpha-0.39e-public-object-identity-civic-service-read-pass",
  scope: {
    selectedAxis: "public_object_identity",
    publicStressCells: ["building-civic", "building-gym"],
    hiddenCandidateExposure: false,
  },
  rendererHooks: {
    civicCallCount,
    serviceCallCount,
  },
  runtimeSummary,
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

function requireText(label, token, message) {
  if (!source[label].includes(token)) blockers.push(message);
}

function requireEqual(actual, expected, label) {
  if (actual !== expected) blockers.push(`${label} expected ${expected}, got ${String(actual)}.`);
}

function requireAtLeast(value, floor, label) {
  if (typeof value !== "number" || value < floor) blockers.push(`${label} expected >= ${floor}, got ${String(value)}.`);
}

function requireAtMost(value, ceiling, label) {
  if (typeof value !== "number" || value > ceiling) blockers.push(`${label} expected <= ${ceiling}, got ${String(value)}.`);
}

function countOccurrences(content, token) {
  return (content.match(new RegExp(escapeRegExp(token), "g")) ?? []).length;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function summarizeCivic(building) {
  if (!building) return null;
  return {
    prefabFamily: building.objectKit?.prefabFamily ?? null,
    focusTarget: building.objectKit?.civicGeometry?.focusTarget ?? null,
    plinthTierCount: building.objectKit?.civicGeometry?.plinthTierCount ?? null,
    entryBayCount: building.objectKit?.civicGeometry?.entryBayCount ?? null,
    facadePierCount: building.objectKit?.civicGeometry?.facadePierCount ?? null,
    glassBandCount: building.objectKit?.civicGeometry?.glassBandCount ?? null,
    roofCapWeight: round(building.objectKit?.civicGeometry?.roofCapWeight ?? 0),
    signatureTags: building.objectKit?.signatureTags ?? [],
  };
}

function summarizeServiceGym(building) {
  if (!building) return null;
  return {
    prefabFamily: building.objectKit?.prefabFamily ?? null,
    focusTarget: building.objectKit?.serviceGeometry?.focusTarget ?? null,
    serviceBayCount: building.objectKit?.serviceGeometry?.serviceBayCount ?? null,
    sawtoothCount: building.objectKit?.serviceGeometry?.sawtoothCount ?? null,
    entryRecessDepth: round(building.objectKit?.serviceGeometry?.entryRecessDepth ?? 0),
    utilityApronDepth: round(building.objectKit?.serviceGeometry?.utilityApronDepth ?? 0),
    roofMonitorWeight: round(building.objectKit?.serviceGeometry?.roofMonitorWeight ?? 0),
    signatureTags: building.objectKit?.signatureTags ?? [],
  };
}

function round(value) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : 0;
}
