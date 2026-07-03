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
  basis: "packages/core/src/voxel/cityWorldBasis.ts",
  sceneWindow: "packages/core/src/voxel/cityWorldSceneWindow.ts",
  coreIndex: "packages/core/src/index.ts",
  tests: "packages/core/test/city-world-basis.test.ts",
  splitGuard: "scripts/verify-alpha-rc-split.mjs",
};

const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(join(root, path), "utf8")]));

requireText("basis", "cityWorldScreenCenterForCamera", "Core must expose screen-center to world-frame math.");
requireText("basis", "cityWorldExpandViewportFrame", "Core must expose bounded frame expansion.");
requireText("basis", "cityWorldFrameContainsFrame", "Core must expose frame containment checks.");
requireText("sceneWindow", "viewportFrame?: CityWorldViewportFrame", "Scene windows must accept explicit viewport frame overrides.");
requireText("coreIndex", "cityWorldScreenCenterForCamera", "Root core index must export screen-center frame helper.");
requireText("renderer", "STREAMING_WINDOW_MARGIN_TILES", "Renderer must define a bounded streaming window margin.");
requireText("renderer", "STREAMING_REFRESH_MARGIN_TILES", "Renderer must define a refresh threshold margin.");
requireText("renderer", "activeWindowFrameRef", "Renderer must track the active scene-window frame.");
requireText("renderer", "pendingWindowRefreshRef", "Renderer must debounce window refresh requests.");
requireText("renderer", "requestWindowRefreshIfNeeded", "Renderer must refresh when pan leaves the active window.");
requireText("renderer", "cityWorldFrameContainsFrame", "Renderer must use frame containment before refreshing.");
requireText("renderer", "cityWorldScreenCenterForCamera", "Renderer must derive window centers from current camera state.");
requireText("renderer", "cityWorldExpandViewportFrame", "Renderer must expand preset frames by tile margin.");
requireText("renderer", "viewportFrame", "Renderer must pass explicit viewport frames into scene windows.");
requireText("tests", "pan-safe windows", "Core tests must protect pan-safe viewport frame math.");
requireText("splitGuard", "scripts/verify-dynamic-window-refresh.mjs", "Strict split guard must allow this verifier.");

rejectText("renderer", /cityWorldViewportFrameForScreenCamera/, "Renderer must not use raw full-screen corner frames for normal streaming windows.");

for (const [key, text] of Object.entries(source)) {
  rejectText(key, /@atlas\/geo|GeoDataAdapter|GoogleMaps|google\.maps|maps\.googleapis|places\.googleapis/i, `${files[key]} must not import or reference provider internals.`);
  rejectText(key, /from ["'](?:three|@react-three|rapier|@dimforge|@googlemaps)/i, `${files[key]} must not add runtime engine dependencies.`);
}

let metricSummary = null;

try {
  const {
    cityWorldExpandViewportFrame,
    cityWorldFrameContainsFrame,
    cityWorldScreenCenterForCamera,
    cityWorldViewportFrameForPreset,
    compileCityWorldScene,
    compileCityWorldSceneWindow,
    compileCountyShellCityWorldScene,
    compileDistrictPlaceAnchorDraftCityWorldScene,
    evaluateCityWorldSceneWindowBudget,
    parseDistrictPlaceAnchorPack,
    projectCityWorldPoint,
    riversideDemoVoxelScene,
  } = await import("../packages/core/dist/index.js");

  const riverside = compileCityWorldScene(riversideDemoVoxelScene);
  const desktopPreset = riverside.cameraPresets.find((preset) => preset.id === "desktop");
  if (!desktopPreset) throw new Error("Riverside scene is missing desktop camera preset.");
  const desktopCamera = cameraStateForPreset(desktopPreset, 1280, 720, projectCityWorldPoint);
  const initialFrame = streamingFrameForCamera("desktop", desktopCamera, 3, {
    cityWorldScreenCenterForCamera,
    cityWorldViewportFrameForPreset,
    cityWorldExpandViewportFrame,
  });
  const refreshFrame = streamingFrameForCamera("desktop", desktopCamera, 0.75, {
    cityWorldScreenCenterForCamera,
    cityWorldViewportFrameForPreset,
    cityWorldExpandViewportFrame,
  });
  const smallPanFrame = streamingFrameForCamera("desktop", { ...desktopCamera, x: desktopCamera.x - 80 }, 0.75, {
    cityWorldScreenCenterForCamera,
    cityWorldViewportFrameForPreset,
    cityWorldExpandViewportFrame,
  });
  const largePanFrame = streamingFrameForCamera("desktop", { ...desktopCamera, x: desktopCamera.x - 260 }, 0.75, {
    cityWorldScreenCenterForCamera,
    cityWorldViewportFrameForPreset,
    cityWorldExpandViewportFrame,
  });

  const initialWindow = compileCityWorldSceneWindow(riverside, "desktop", { viewportFrame: initialFrame });
  const refreshedWindow = compileCityWorldSceneWindow(riverside, "desktop", {
    viewportFrame: streamingFrameForCamera("desktop", { ...desktopCamera, x: desktopCamera.x - 260 }, 3, {
      cityWorldScreenCenterForCamera,
      cityWorldViewportFrameForPreset,
      cityWorldExpandViewportFrame,
    }),
  });
  const initialBudget = evaluateCityWorldSceneWindowBudget(initialWindow, "public_playable_window", riverside);
  const refreshedBudget = evaluateCityWorldSceneWindowBudget(refreshedWindow, "public_playable_window", riverside);

  if (!initialBudget.passed) blockers.push(`Initial streaming window failed: ${initialBudget.blockers.join("; ")}`);
  if (!refreshedBudget.passed) blockers.push(`Refreshed streaming window failed: ${refreshedBudget.blockers.join("; ")}`);
  if (initialWindow.metrics.visibleCommandCount >= initialWindow.metrics.totalSceneCommandCount) {
    blockers.push("Initial streaming window must not load the full scene.");
  }
  if (refreshedWindow.metrics.visibleCommandCount >= refreshedWindow.metrics.totalSceneCommandCount) {
    blockers.push("Refreshed streaming window must not load the full scene.");
  }
  if (!cityWorldFrameContainsFrame(initialFrame, refreshFrame)) {
    blockers.push("Initial buffered frame must contain the immediate refresh frame.");
  }
  if (!cityWorldFrameContainsFrame(initialFrame, smallPanFrame)) {
    blockers.push("Small pan should remain inside the active streaming frame.");
  }
  if (cityWorldFrameContainsFrame(initialFrame, largePanFrame)) {
    blockers.push("Large pan should leave the active streaming frame and require refresh.");
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
  const shellWindow = compileCityWorldSceneWindow(orangeShell, "mobile", { includeLabels: false });
  const shellBudget = evaluateCityWorldSceneWindowBudget(shellWindow, "shell_empty_window", orangeShell);
  if (!shellBudget.passed) blockers.push(`Shell window failed after dynamic refresh changes: ${shellBudget.blockers.join("; ")}`);

  const anaheimPackPath = "data/district_place_anchor_packs/anaheim-anchors.json";
  const anaheimPack = parseDistrictPlaceAnchorPack(JSON.parse(readFileSync(join(root, anaheimPackPath), "utf8")), anaheimPackPath);
  const anaheim = compileDistrictPlaceAnchorDraftCityWorldScene({ anchorPack: anaheimPack });
  const hiddenWindow = compileCityWorldSceneWindow(anaheim, "mobile", { includeLabels: false });
  const hiddenBudget = evaluateCityWorldSceneWindowBudget(hiddenWindow, "hidden_draft_window", anaheim);
  if (!hiddenBudget.passed) blockers.push(`Anaheim hidden window failed after dynamic refresh changes: ${hiddenBudget.blockers.join("; ")}`);
  if (anaheim.coverage?.playable !== false) blockers.push("Anaheim must remain non-playable.");

  metricSummary = {
    update: "prealpha-0.30e-dynamic-window-refresh-pan-safe-scene-streaming",
    initialWindow: summarizeWindow("desktop-initial", initialWindow, initialBudget),
    refreshedWindow: summarizeWindow("desktop-panned", refreshedWindow, refreshedBudget),
    frameContainment: {
      immediateContained: cityWorldFrameContainsFrame(initialFrame, refreshFrame),
      smallPanContained: cityWorldFrameContainsFrame(initialFrame, smallPanFrame),
      largePanContained: cityWorldFrameContainsFrame(initialFrame, largePanFrame),
    },
    shellWindow: summarizeWindow("orange-shell", shellWindow, shellBudget),
    anaheimHidden: summarizeWindow("anaheim-hidden", hiddenWindow, hiddenBudget),
  };
} catch (error) {
  blockers.push(`Unable to evaluate dynamic window refresh: ${error instanceof Error ? error.message : String(error)}`);
}

const result = {
  ok: blockers.length === 0,
  update: "prealpha-0.30e-dynamic-window-refresh-pan-safe-scene-streaming",
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

function cameraStateForPreset(preset, viewportWidth, viewportHeight, projectCityWorldPoint) {
  const focus = projectCityWorldPoint(preset.center);
  return {
    x: viewportWidth / 2 - focus.x * preset.zoom,
    y: viewportHeight / 2 - focus.y * preset.zoom - 18,
    zoom: preset.zoom,
    viewportWidth,
    viewportHeight,
  };
}

function streamingFrameForCamera(cameraPresetId, camera, marginTiles, helpers) {
  const center = helpers.cityWorldScreenCenterForCamera(camera);
  return helpers.cityWorldExpandViewportFrame(helpers.cityWorldViewportFrameForPreset(cameraPresetId, center, camera.zoom), marginTiles);
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
