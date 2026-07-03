#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { join } from "node:path";
import process from "node:process";

const root = process.cwd();
const jsonOnly = process.argv.includes("--json-only");
const blockers = [];
const warnings = [];

const files = {
  renderer: "web/src/CityWorldRenderer.tsx",
  sceneWindow: "packages/core/src/voxel/cityWorldSceneWindow.ts",
  splitGuard: "scripts/verify-alpha-rc-split.mjs",
};

const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(join(root, path), "utf8")]));

requireText("renderer", "compileCityWorldSceneWindow", "CityWorldRenderer must consume compiled scene windows.");
requireText("renderer", "resolveCameraPresetId", "CityWorldRenderer must resolve desktop/mobile/detail camera windows.");
requireText("renderer", "sceneWindow.visibleCommands", "CityWorldRenderer must draw from sceneWindow.visibleCommands.");
requireText("renderer", "readonly CityWorldRenderCommand[]", "Renderer ordered item helper must accept command arrays, not full buffers only.");
rejectText("renderer", /buildCityWorldRenderCommandBuffer/, "CityWorldRenderer must not build full-scene render command buffers directly.");
requireText("sceneWindow", "compileCityWorldSceneWindow", "Core scene window compiler is missing.");
requireText("splitGuard", "scripts/verify-window-aware-renderer.mjs", "Strict split guard must allow the window-aware renderer verifier.");

for (const [key, text] of Object.entries(source)) {
  rejectText(key, /@atlas\/geo|GeoDataAdapter|GoogleMaps|google\.maps|maps\.googleapis|places\.googleapis/i, `${files[key]} must not import or reference provider internals.`);
  rejectText(key, /from ["'](?:three|@react-three|rapier|@dimforge|@googlemaps)/i, `${files[key]} must not add runtime engine dependencies.`);
}

let metricSummary = null;

try {
  const {
    compileCityWorldScene,
    compileCityWorldSceneWindow,
    compileCountyShellCityWorldScene,
    compileDistrictPlaceAnchorDraftCityWorldScene,
    evaluateCityWorldSceneWindowBudget,
    parseDistrictPlaceAnchorPack,
    riversideDemoVoxelScene,
  } = await import("../packages/core/dist/index.js");

  const riverside = compileCityWorldScene(riversideDemoVoxelScene);
  const playableWindows = ["desktop", "mobile", "residential_detail"].map((preset) => {
    const window = compileCityWorldSceneWindow(riverside, preset);
    const budget = evaluateCityWorldSceneWindowBudget(window, "public_playable_window", riverside);
    if (!budget.passed) blockers.push(`Riverside ${preset} window failed renderer budget: ${budget.blockers.join("; ")}`);
    if (window.metrics.visibleCommandCount >= window.metrics.totalSceneCommandCount) {
      blockers.push(`Riverside ${preset} renderer window still loads the full scene.`);
    }
    return summarizeWindow(preset, window, budget);
  });

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
  const shellWindow = compileCityWorldSceneWindow(orangeShell, "mobile", { includeLabels: false });
  const shellBudget = evaluateCityWorldSceneWindowBudget(shellWindow, "shell_empty_window", orangeShell);
  if (!shellBudget.passed) blockers.push(`Orange shell renderer window failed: ${shellBudget.blockers.join("; ")}`);
  if (shellWindow.metrics.buildingCommandCount !== 0 || shellWindow.metrics.markerCommandCount !== 0) {
    blockers.push("Shell renderer window must not draw fake buildings or markers.");
  }

  const anaheimPackPath = "data/district_place_anchor_packs/anaheim-anchors.json";
  const anaheimPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(join(root, anaheimPackPath), "utf8")), anaheimPackPath);
  const anaheim = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: anaheimPack });
  const hiddenWindow = compileCityWorldSceneWindow(anaheim, "mobile", { includeLabels: false });
  const hiddenBudget = evaluateCityWorldSceneWindowBudget(hiddenWindow, "hidden_draft_window", anaheim);
  if (!hiddenBudget.passed) blockers.push(`Anaheim hidden renderer window failed: ${hiddenBudget.blockers.join("; ")}`);
  if (anaheim.coverage?.playable !== false) blockers.push("Anaheim hidden renderer window must stay non-playable.");
  if (hiddenWindow.metrics.actorCommandCount !== 0 || hiddenWindow.metrics.publicClutterCommandCount !== 0) {
    blockers.push("Anaheim hidden renderer window must stay actor-free and clutter-free.");
  }

  metricSummary = {
    update: "prealpha-0.29e-window-aware-renderer-consumption",
    playableWindows,
    orangeShell: summarizeWindow("orange-shell", shellWindow, shellBudget),
    anaheimHidden: summarizeWindow("anaheim-hidden", hiddenWindow, hiddenBudget),
  };
} catch (error) {
  blockers.push(`Unable to evaluate window-aware renderer budgets: ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.29e-window-aware-renderer-consumption",
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

function rejectText(fileKey, pattern, message) {
  if (pattern.test(source[fileKey])) blockers.push(message);
}
