#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import {
  compileCityWorldScene,
  compileCountyShellCityWorldScene,
  compileDistrictPlaceAnchorDraftCityWorldScene,
  deriveCityWorldTerrainMap,
  parseDistrictPlaceAnchorPack,
  riversideDemoVoxelScene,
} from "../packages/core/dist/index.js";

const args = parseArgs(process.argv.slice(2));
const anaheimAnchorPackPath = resolve("data/district_place_anchor_packs/anaheim-anchors.json");
const ontarioAnchorPackPath = resolve("data/district_place_anchor_packs/ontario-anchors.json");
const scenes = [
  {
    scenario: "riverside-playable",
    scene: compileCityWorldScene(riversideDemoVoxelScene),
  },
  {
    scenario: "orange-shell",
    scene: compileCountyShellCityWorldScene({
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
    }),
  },
  {
    scenario: "anaheim-hidden-draft",
    scene: compileDistrictPlaceAnchorDraftCityWorldScene({
      anchorPack: parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(anaheimAnchorPackPath, "utf8")), anaheimAnchorPackPath),
    }),
  },
  {
    scenario: "ontario-hidden-draft",
    scene: compileDistrictPlaceAnchorDraftCityWorldScene({
      anchorPack: parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(ontarioAnchorPackPath, "utf8")), ontarioAnchorPackPath),
    }),
  },
];

const blockers = [];
const reports = scenes.map(({ scenario, scene }) => {
  const terrainMap = deriveCityWorldTerrainMap(scene);
  validateTerrainMap(scenario, scene, terrainMap, blockers);
  return {
    scenario,
    sceneId: scene.id,
    coverageTier: scene.coverage?.coverageTier ?? "NONE",
    playable: scene.coverage?.playable ?? false,
    dimensions: {
      width: terrainMap.width,
      depth: terrainMap.depth,
      cellCount: terrainMap.metrics.cellCount,
    },
    metrics: terrainMap.metrics,
    topColorKeys: Object.entries(terrainMap.distributions.colorKeys)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([key, count]) => ({ key, count })),
  };
});

const summary = {
  ok: blockers.length === 0,
  update: "prealpha-0.12e-derived-terrain-map-engine-proof",
  source: "CityWorldScene",
  dependencyPolicy: {
    noExternalVoxelRuntimeDependency: true,
    noProviderGeometry: true,
    noPublicPromotion: true,
  },
  reports,
  blockers,
};

console.log(args.jsonOnly ? JSON.stringify(summary) : JSON.stringify(summary, null, 2));

if (!summary.ok) {
  process.exitCode = 1;
}

function validateTerrainMap(scenario, scene, terrainMap, blockers) {
  const expectedCellCount = terrainMap.width * terrainMap.depth;
  if (terrainMap.type !== "cityWorldDerivedTerrainMap") {
    blockers.push(`${scenario}: derived map type mismatch.`);
  }
  if (terrainMap.source !== "CityWorldScene") {
    blockers.push(`${scenario}: derived map must be sourced from CityWorldScene.`);
  }
  if (terrainMap.metrics.cellCount !== expectedCellCount) {
    blockers.push(`${scenario}: cell count ${terrainMap.metrics.cellCount} does not match dimensions ${expectedCellCount}.`);
  }
  if (terrainMap.heightMap.length !== expectedCellCount || terrainMap.colorMap.length !== expectedCellCount || terrainMap.cells.length !== expectedCellCount) {
    blockers.push(`${scenario}: height/color/cell arrays must all match dimensions.`);
  }
  if (terrainMap.metrics.terrainCellCount !== scene.terrainTiles.length) {
    blockers.push(`${scenario}: terrain cell count ${terrainMap.metrics.terrainCellCount} does not match scene terrain tiles ${scene.terrainTiles.length}.`);
  }
  if (!Number.isFinite(terrainMap.metrics.heightRange) || terrainMap.metrics.heightRange < 0) {
    blockers.push(`${scenario}: height range must be finite and non-negative.`);
  }
  if (containsProviderToken(terrainMap)) {
    blockers.push(`${scenario}: derived terrain map leaks provider tokens.`);
  }

  if (scenario === "riverside-playable") {
    if (terrainMap.metrics.heightRange < 1.4) blockers.push(`${scenario}: expected real terrain height variation, got ${terrainMap.metrics.heightRange}.`);
    if (terrainMap.metrics.colorKeyCount < 12) blockers.push(`${scenario}: expected authored terrain color variety, got ${terrainMap.metrics.colorKeyCount}.`);
    if (terrainMap.metrics.nonFlatCellRatio < 0.55) blockers.push(`${scenario}: expected non-flat terrain ratio >= 0.55, got ${terrainMap.metrics.nonFlatCellRatio}.`);
    if (terrainMap.metrics.occupiedCellRatio < 0.15) blockers.push(`${scenario}: expected visible object occupancy, got ${terrainMap.metrics.occupiedCellRatio}.`);
    if (terrainMap.metrics.waterEdgeCutRatio < 0.6) blockers.push(`${scenario}: water terrain must expose edge cuts; got ${terrainMap.metrics.waterEdgeCutRatio}.`);
  }

  if (scenario.endsWith("-shell")) {
    if (scene.coverage?.playable) blockers.push(`${scenario}: shell scene cannot be playable.`);
    if (terrainMap.metrics.objectOccupiedCellCount !== 0) blockers.push(`${scenario}: shell map must not contain object-occupied cells.`);
    if (terrainMap.metrics.colorKeyCount < 2) blockers.push(`${scenario}: shell map should still expose boundary/open color keys.`);
  }

  if (scenario.endsWith("hidden-draft")) {
    if (scene.coverage?.playable) blockers.push(`${scenario}: hidden draft cannot be playable.`);
    if (scene.actors.length > 0 || scene.pins.length > 0) blockers.push(`${scenario}: hidden draft cannot expose actors or pins.`);
    if (terrainMap.metrics.heightRange < 0.7) blockers.push(`${scenario}: hidden draft should expose terrain/object prep height variation, got ${terrainMap.metrics.heightRange}.`);
    if (terrainMap.metrics.colorKeyCount < 8) blockers.push(`${scenario}: hidden draft should expose enough terrain/source color keys, got ${terrainMap.metrics.colorKeyCount}.`);
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
