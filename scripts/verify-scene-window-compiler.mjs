#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const blockers = [];
const warnings = [];

const files = {
  sceneWindow: "packages/core/src/voxel/cityWorldSceneWindow.ts",
  renderCommands: "packages/core/src/voxel/cityWorldRenderCommands.ts",
  voxelIndex: "packages/core/src/voxel/index.ts",
  coreIndex: "packages/core/src/index.ts",
  tests: "packages/core/test/city-world-scene-window.test.ts",
  splitGuard: "scripts/verify-alpha-rc-split.mjs",
};

const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(join(root, path), "utf8")]));

requireText("sceneWindow", "compileCityWorldSceneChunkIndex", "Core scene chunk index compiler is missing.");
requireText("sceneWindow", "compileCityWorldSceneWindow", "Core scene window compiler is missing.");
requireText("sceneWindow", "evaluateCityWorldSceneWindowBudget", "Scene window budget evaluator is missing.");
requireText("sceneWindow", "CITY_WORLD_SCENE_WINDOW_BUDGETS", "Scene window budgets are missing.");
requireText("sceneWindow", "buildCityWorldRenderCommandBuffer", "Scene windows must be based on render commands.");
requireText("voxelIndex", "./cityWorldSceneWindow.js", "Voxel index must export scene window compiler.");
requireText("coreIndex", "compileCityWorldSceneWindow", "Core index must export scene window compiler.");
requireText("coreIndex", "evaluateCityWorldSceneWindowBudget", "Core index must export scene window budget evaluator.");
requireText("tests", "keeps shell windows terrain-only", "Core tests must protect shell empty windows.");
requireText("tests", "hidden Anaheim and Ontario windows", "Core tests must protect hidden draft windows.");
requireText("splitGuard", "scripts/verify-scene-window-compiler.mjs", "Strict split guard must allow this verifier.");

for (const [key, text] of Object.entries(source)) {
  rejectText(key, text, /@atlas\/geo|GeoDataAdapter|GoogleMaps|google\.maps|maps\.googleapis|places\.googleapis/i, `${files[key]} must not import or reference provider internals.`);
  rejectText(key, text, /from ["'](?:three|@react-three|rapier|@dimforge|@googlemaps)/i, `${files[key]} must not add runtime engine dependencies.`);
}

let metricSummary = null;

try {
  const {
    compileCityWorldScene,
    compileCityWorldSceneChunkIndex,
    compileCityWorldSceneWindow,
    compileCountyShellCityWorldScene,
    compileDistrictPlaceAnchorDraftCityWorldScene,
    evaluateCityWorldSceneWindowBudget,
    parseDistrictPlaceAnchorPack,
    riversideDemoVoxelScene,
  } = await import("../packages/core/dist/index.js");

  const riverside = compileCityWorldScene(riversideDemoVoxelScene);
  const riversideChunkIndex = compileCityWorldSceneChunkIndex(riverside);
  const riversideWindows = ["desktop", "mobile", "residential_detail"].map((preset) => {
    const window = compileCityWorldSceneWindow(riverside, preset);
    const budget = evaluateCityWorldSceneWindowBudget(window, "public_playable_window", riverside);
    if (!budget.passed) blockers.push(`Riverside ${preset} scene window failed: ${budget.blockers.join("; ")}`);
    return summarizeWindow(preset, window, budget);
  });

  if (riversideChunkIndex.chunkCount < 12) {
    blockers.push(`Riverside chunk index must contain at least 12 chunks; got ${riversideChunkIndex.chunkCount}.`);
  }
  for (const window of riversideWindows) {
    if (window.metrics.visibleCommandCount >= window.metrics.totalSceneCommandCount) {
      blockers.push(`Riverside ${window.cameraPresetId} window must not load the entire command buffer.`);
    }
    if (window.metrics.publicClutterCommandCount !== 0) {
      blockers.push(`Riverside ${window.cameraPresetId} window has public clutter commands: ${window.metrics.publicClutterCommandCount}.`);
    }
  }

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
  const orangeWindow = compileCityWorldSceneWindow(orangeShell, "mobile", { includeLabels: false });
  const orangeBudget = evaluateCityWorldSceneWindowBudget(orangeWindow, "shell_empty_window", orangeShell);
  if (!orangeBudget.passed) blockers.push(`Orange shell window failed: ${orangeBudget.blockers.join("; ")}`);

  const hiddenDrafts = [
    ["anaheim", "data/district_place_anchor_packs/anaheim-anchors.json"],
    ["ontario", "data/district_place_anchor_packs/ontario-anchors.json"],
  ].map(([id, path]) => {
    const pack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(join(root, path), "utf8")), path);
    const scene = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: pack });
    const window = compileCityWorldSceneWindow(scene, "mobile", { includeLabels: false });
    const budget = evaluateCityWorldSceneWindowBudget(window, "hidden_draft_window", scene);
    if (!budget.passed) blockers.push(`${id} hidden draft window failed: ${budget.blockers.join("; ")}`);
    if (scene.coverage?.playable !== false) blockers.push(`${id} hidden draft must remain non-playable.`);
    return summarizeWindow(id, window, budget);
  });

  metricSummary = {
    update: "prealpha-0.28e-tile-chunk-scene-window-compiler",
    riversideChunkCount: riversideChunkIndex.chunkCount,
    riversideTotalCommandCount: riversideChunkIndex.totalCommandCount,
    riversideWindows,
    orangeShell: summarizeWindow("orange-shell", orangeWindow, orangeBudget),
    hiddenDrafts,
  };
} catch (error) {
  blockers.push(`Unable to evaluate built scene windows: ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.28e-tile-chunk-scene-window-compiler",
  checkedFiles: files,
  blockerCount: blockers.length,
  blockers,
  warnings,
  metricSummary,
};

console.log(jsonOnly ? JSON.stringify(result) : JSON.stringify(result, null, 2));

if (!result.ok) {
  process.exitCode = 1;
}

function summarizeWindow(id, window, budget) {
  return {
    id,
    cameraPresetId: window.cameraPresetId,
    passed: budget.passed,
    blockers: budget.blockers,
    chunkCount: window.chunkIds.length,
    metrics: window.metrics,
  };
}

function requireText(fileKey, needle, message) {
  if (!source[fileKey].includes(needle)) blockers.push(message);
}

function rejectText(fileKey, text, pattern, message) {
  if (pattern.test(text)) blockers.push(message);
}
